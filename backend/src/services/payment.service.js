const Payment = require('../models/Payment.model');
const Cycle = require('../models/Cycle.model');
const Member = require('../models/Member.model');
const Group = require('../models/Group.model');
const AuditLog = require('../models/AuditLog.model');
const Notification = require('../models/Notification.model');
const { NOTIFICATION_TYPES } = require('../models/Notification.model');
const ApiError = require('../utils/apiError');
const { calculateGracePeriodEnd, isPaymentLate } = require('../utils/dateHelper');
const { PAYMENT_STATUS, AUDIT_ACTIONS } = require('../config/constants');
const penaltyService = require('./penalty.service');

/**
 * Record payment
 */
const recordPayment = async (paymentData) => {
  const {
    groupId,
    cycleId,
    memberId,
    userId,
    amount,
    paymentMode,
    transactionId,
    referenceNumber,
    paidAt,
    memberRemarks,
    proofDocument,
  } = paymentData;

  // Verify cycle exists and is active
  const cycle = await Cycle.findById(cycleId).populate('group');

  if (!cycle) {
    throw ApiError.notFound('Cycle not found');
  }

  if (cycle.group._id.toString() !== groupId) {
    throw ApiError.badRequest('Cycle does not belong to this group');
  }

  // Check if payment already exists
  let existingPayment = await Payment.findOne({
    member: memberId,
    cycle: cycleId,
  });

  // Allow re-recording if status is pending or rejected
  // Block if already under_review, confirmed, or paid
  const allowedStatuses = [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.REJECTED];
  if (existingPayment && !allowedStatuses.includes(existingPayment.status)) {
    throw ApiError.conflict('Payment already recorded for this cycle');
  }

  // Calculate due date - should be the end of the cycle
  const dueDate = new Date(cycle.endDate);

  // Determine payment date
  const paymentDate = paidAt ? new Date(paidAt) : new Date();

  // Check if late - payment is late only if made after grace period ends
  const gracePeriodEnd = calculateGracePeriodEnd(
    dueDate,
    cycle.group.penaltyRules.gracePeriodDays
  );
  const isLate = paymentDate > gracePeriodEnd;

  // Use the amount directly - extract only digits and parse as integer
  const cleanAmount = String(amount).replace(/[^0-9]/g, '');
  const parsedAmount = parseInt(cleanAmount, 10) || 0;
  console.log('Payment Service - received:', amount, 'clean:', cleanAmount, 'parsed:', parsedAmount);

  // Update existing pending payment or create new one
  let payment;
  if (existingPayment) {
    // Update the existing pending payment
    existingPayment.amount = parsedAmount;
    existingPayment.paymentMode = paymentMode;
    existingPayment.transactionId = transactionId;
    existingPayment.referenceNumber = referenceNumber;
    existingPayment.paidAt = paymentDate;
    existingPayment.status = PAYMENT_STATUS.UNDER_REVIEW; // Always require admin approval
    existingPayment.isLate = isLate;
    existingPayment.memberRemarks = memberRemarks;
    existingPayment.proofDocument = proofDocument;
    payment = await existingPayment.save();
  } else {
    // Create new payment record
    payment = await Payment.create({
      group: groupId,
      member: memberId,
      cycle: cycleId,
      cycleNumber: cycle.cycleNumber,
      amount: parsedAmount,
      paymentMode,
      transactionId,
      referenceNumber,
      dueDate,
      paidAt: paymentDate,
      status: PAYMENT_STATUS.UNDER_REVIEW, // Always require admin approval
      isLate,
      memberRemarks,
      proofDocument,
    });
  }

  // Apply late fee if payment is late
  if (isLate) {
    await penaltyService.applyLateFee(payment, userId);
  }

  // Update member statistics - use parsedAmount (integer) not raw amount
  const member = await Member.findById(memberId);
  member.totalContributed = Math.round(member.totalContributed) + parsedAmount;

  if (isLate) {
    member.latePayments += 1;
    member.paymentStreak = 0;
  } else {
    member.paymentStreak += 1;
  }

  member.calculatePerformanceScore();
  await member.save();

  // Update cycle statistics
  await cycle.updatePaymentCounts();

  // Check if cycle is ready for payout (100% quorum by default)
  await cycle.checkPayoutReadiness(100);

  // Update group statistics - use parsedAmount (integer)
  const group = await Group.findById(groupId);
  group.stats.totalCollected = Math.round(group.stats.totalCollected) + parsedAmount;
  await group.save();

  // Log action
  await AuditLog.logAction({
    groupId,
    action: AUDIT_ACTIONS.PAYMENT_RECORDED,
    description: `Payment of ${amount} recorded for cycle ${cycle.cycleNumber}`,
    userId,
    memberId,
    paymentId: payment._id,
    cycleId,
  });

  // Send notification to admin/organizer for approval
  try {
    const group = await Group.findById(groupId).populate('organizer', 'name email');
    const member = await Member.findById(memberId).populate('user', 'name');

    if (group && group.organizer) {
      await Notification.createNotification({
        user: group.organizer._id,
        type: NOTIFICATION_TYPES.PAYMENT_PENDING_APPROVAL,
        title: 'Payment Pending Approval',
        message: `${member.user.name} has submitted a payment of ₹${amount.toLocaleString()} for ${group.name} - Cycle ${cycle.cycleNumber}. Please review and approve.`,
        group: groupId,
        payment: payment._id,
        actionUrl: '/payments',
        metadata: {
          cycleNumber: cycle.cycleNumber,
          amount,
          memberName: member.user.name
        }
      });
    }
  } catch (err) {
    console.error('Failed to send payment approval notification:', err);
  }

  return payment.populate('member', 'user turnNumber');
};

/**
 * Get payment by ID
 */
const getPaymentById = async (paymentId) => {
  const payment = await Payment.findById(paymentId)
    .populate('member', 'user turnNumber')
    .populate('group', 'name monthlyContribution')
    .populate('cycle', 'cycleNumber startDate endDate');

  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  return payment;
};

/**
 * Get payments for a cycle
 */
const getCyclePayments = async (cycleId) => {
  const payments = await Payment.find({ cycle: cycleId })
    .populate('member', 'user turnNumber')
    .populate({
      path: 'member',
      populate: {
        path: 'user',
        select: 'name email phone',
      },
    })
    .sort({ paidAt: -1 });

  return payments;
};

/**
 * Get user's payment history (across all groups)
 */
const getUserPayments = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Find all member records for this user
  const Member = require('../models/Member.model');
  const members = await Member.find({ user: userId }).select('_id');
  const memberIds = members.map(m => m._id);

  const [payments, total] = await Promise.all([
    Payment.find({ member: { $in: memberIds } })
      .populate('group', 'name')
      .populate({
        path: 'member',
        select: 'turnNumber user',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('cycle', 'cycleNumber startDate endDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments({ member: { $in: memberIds } }),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get member's payment history
 */
const getMemberPayments = async (memberId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find({ member: memberId })
      .populate('cycle', 'cycleNumber startDate endDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments({ member: memberId }),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get group's payment history
 */
const getGroupPayments = async (groupId, options = {}) => {
  const { page = 1, limit = 50, status } = options;
  const skip = (page - 1) * limit;

  const query = { group: groupId };
  if (status) {
    query.status = status;
  }

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('member', 'user turnNumber')
      .populate({
        path: 'member',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('cycle', 'cycleNumber startDate endDate')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Confirm payment (admin action)
 */
const confirmPayment = async (paymentId, adminId, adminRemarks) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  if (payment.status === PAYMENT_STATUS.CONFIRMED) {
    throw ApiError.badRequest('Payment is already confirmed');
  }

  payment.status = PAYMENT_STATUS.CONFIRMED;
  payment.confirmedAt = new Date();
  payment.confirmedBy = adminId;
  payment.adminRemarks = adminRemarks;
  await payment.save();

  // Mark all penalties associated with this payment as paid
  const Penalty = require('../models/Penalty.model');

  // First, mark penalties directly linked to this payment
  const directPenalties = await Penalty.find({
    payment: paymentId,
    isPaid: false,
    isWaived: false
  });

  for (const penalty of directPenalties) {
    await penalty.markAsPaid();
  }

  // For confirmed payments, also mark ALL unpaid penalties for this member as paid
  // This handles penalties from previous cycles that were included in the payment amount
  // Get the payment to access member ID
  const paymentForMember = await Payment.findById(paymentId);
  if (paymentForMember) {
    const allMemberPenalties = await Penalty.find({
      member: paymentForMember.member,
      group: paymentForMember.group,
      isPaid: false,
      isWaived: false
    });

    for (const penalty of allMemberPenalties) {
      await penalty.markAsPaid();
    }

    console.log(`Marked ${allMemberPenalties.length} penalties as paid for member ${paymentForMember.member}`);
  }

  // Update cycle statistics after confirming payment
  const cycle = await Cycle.findById(payment.cycle);
  if (cycle) {
    await cycle.updatePaymentCounts();
  }

  // Log action
  await AuditLog.logAction({
    groupId: payment.group,
    action: AUDIT_ACTIONS.PAYMENT_CONFIRMED,
    description: `Payment confirmed for cycle ${payment.cycleNumber}`,
    userId: adminId,
    memberId: payment.member,
    paymentId: payment._id,
  });

  // Send notification to member that payment was confirmed
  try {
    const member = await Member.findById(payment.member).populate('user', 'name email');
    const group = await Group.findById(payment.group).select('name');

    if (member && member.user) {
      await Notification.createNotification({
        user: member.user._id,
        type: NOTIFICATION_TYPES.PAYMENT_CONFIRMED,
        title: 'Payment Confirmed',
        message: `Your payment of ₹${payment.amount.toLocaleString()} for ${group.name} - Cycle ${payment.cycleNumber} has been confirmed by the admin.`,
        group: payment.group,
        payment: payment._id,
        actionUrl: '/payments',
        metadata: {
          cycleNumber: payment.cycleNumber,
          amount: payment.amount
        }
      });
    }
  } catch (err) {
    console.error('Failed to send payment confirmed notification:', err);
  }

  return payment;
};

/**
 * Reject payment (admin action)
 */
const rejectPayment = async (paymentId, adminId, adminRemarks) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  if (payment.status === PAYMENT_STATUS.REJECTED) {
    throw ApiError.badRequest('Payment is already rejected');
  }

  payment.status = PAYMENT_STATUS.REJECTED;
  payment.adminRemarks = adminRemarks;
  await payment.save();

  // Update cycle statistics after rejecting payment
  const cycle = await Cycle.findById(payment.cycle);
  if (cycle) {
    await cycle.updatePaymentCounts();
  }

  // Log action
  await AuditLog.logAction({
    groupId: payment.group,
    action: AUDIT_ACTIONS.PAYMENT_CONFIRMED, // Using same action for now
    description: `Payment rejected for cycle ${payment.cycleNumber}`,
    userId: adminId,
    memberId: payment.member,
    paymentId: payment._id,
  });

  // Send notification to member that payment was rejected
  try {
    const member = await Member.findById(payment.member).populate('user', 'name email');
    const group = await Group.findById(payment.group).select('name');

    if (member && member.user) {
      await Notification.createNotification({
        user: member.user._id,
        type: NOTIFICATION_TYPES.PAYMENT_CONFIRMED, // Using same type for now
        title: 'Payment Rejected',
        message: `Your payment of ₹${payment.amount.toLocaleString()} for ${group.name} - Cycle ${payment.cycleNumber} has been rejected. Reason: ${adminRemarks || 'No reason provided'}`,
        group: payment.group,
        payment: payment._id,
        actionUrl: '/payments',
        metadata: {
          cycleNumber: payment.cycleNumber,
          amount: payment.amount
        }
      });
    }
  } catch (err) {
    console.error('Failed to send payment rejected notification:', err);
  }

  return payment;
};

/**
 * Mark payment as late
 */
const markPaymentLate = async (paymentId, adminId) => {
  const payment = await Payment.findById(paymentId).populate('group');

  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  payment.status = PAYMENT_STATUS.LATE;
  payment.isLate = true;
  await payment.save();

  // Apply late fee if not already applied
  const existingPenalty = await require('../models/Penalty.model').findOne({
    payment: paymentId,
    type: 'late_fee',
  });

  if (!existingPenalty) {
    await penaltyService.applyLateFee(payment, adminId);
  }

  return payment;
};

module.exports = {
  recordPayment,
  getPaymentById,
  getCyclePayments,
  getUserPayments,
  getMemberPayments,
  getGroupPayments,
  confirmPayment,
  rejectPayment,
  markPaymentLate,
};