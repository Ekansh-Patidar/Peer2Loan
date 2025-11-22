const Payment = require('../models/Payment.model');
const Cycle = require('../models/Cycle.model');
const Member = require('../models/Member.model');
const Group = require('../models/Group.model');
const AuditLog = require('../models/AuditLog.model');
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
  const existingPayment = await Payment.findOne({
    member: memberId,
    cycle: cycleId,
  });

  if (existingPayment) {
    throw ApiError.conflict('Payment already recorded for this cycle');
  }

  // Calculate due date
  const dueDate = new Date(cycle.startDate);
  dueDate.setDate(cycle.group.paymentWindow.endDay);

  // Determine payment date
  const paymentDate = paidAt ? new Date(paidAt) : new Date();

  // Check if late
  const gracePeriodEnd = calculateGracePeriodEnd(
    dueDate,
    cycle.group.penaltyRules.gracePeriodDays
  );
  const isLate = isPaymentLate(
    paymentDate,
    dueDate,
    cycle.group.penaltyRules.gracePeriodDays
  );

  // Create payment
  const payment = await Payment.create({
    group: groupId,
    member: memberId,
    cycle: cycleId,
    cycleNumber: cycle.cycleNumber,
    amount,
    paymentMode,
    transactionId,
    referenceNumber,
    dueDate,
    paidAt: paymentDate,
    status: PAYMENT_STATUS.PAID,
    isLate,
    memberRemarks,
    proofDocument,
  });

  // Apply late fee if payment is late
  if (isLate) {
    await penaltyService.applyLateFee(payment, userId);
  }

  // Update member statistics
  const member = await Member.findById(memberId);
  member.totalContributed += amount;
  
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

  // Update group statistics
  await Group.findByIdAndUpdate(groupId, {
    $inc: { 'stats.totalCollected': amount },
  });

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
      .populate('member', 'turnNumber')
      .populate({
        path: 'member',
        populate: { path: 'group', select: 'name' }
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

  // Log action
  await AuditLog.logAction({
    groupId: payment.group,
    action: AUDIT_ACTIONS.PAYMENT_CONFIRMED,
    description: `Payment confirmed for cycle ${payment.cycleNumber}`,
    userId: adminId,
    memberId: payment.member,
    paymentId: payment._id,
  });

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
  markPaymentLate,
};