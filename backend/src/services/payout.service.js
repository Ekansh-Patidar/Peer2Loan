const Payout = require('../models/Payout.model');
const Cycle = require('../models/Cycle.model');
const Member = require('../models/Member.model');
const Group = require('../models/Group.model');
const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const Notification = require('../models/Notification.model');
const { NOTIFICATION_TYPES } = require('../models/Notification.model');
const ApiError = require('../utils/apiError');
const { PAYOUT_STATUS, CYCLE_STATUS, AUDIT_ACTIONS } = require('../config/constants');
const notificationService = require('./notification.service');

/**
 * Initiate payout (Admin starts the process - sends to pending_approval)
 */
const initiatePayout = async (payoutData) => {
  const { cycleId, amount, executedBy } = payoutData;

  // Get cycle with beneficiary and group details
  const cycle = await Cycle.findById(cycleId)
    .populate({
      path: 'beneficiary',
      populate: { path: 'user', select: 'name email phone' }
    })
    .populate('group');

  if (!cycle) {
    throw ApiError.notFound('Cycle not found');
  }

  // Admin can process payout regardless of payment status
  // Members who haven't paid will get late fees applied
  // No validation for isReadyForPayout - admin has full control

  // Check if payout already exists
  let payout = await Payout.findOne({ cycle: cycleId });

  if (payout && payout.status !== PAYOUT_STATUS.SCHEDULED) {
    throw ApiError.conflict('Payout has already been initiated for this cycle');
  }

  // Use provided amount or collected amount from cycle
  const cleanAmount = amount ? String(amount).replace(/[^0-9]/g, '') : null;
  const payoutAmount = cleanAmount ? parseInt(cleanAmount, 10) : Math.round(cycle.collectedAmount);
  console.log('Payout Service - received:', amount, 'parsed:', payoutAmount);

  if (!payout) {
    // Create new payout in pending_approval status
    payout = await Payout.create({
      group: cycle.group._id,
      cycle: cycleId,
      beneficiary: cycle.beneficiary._id,
      amount: payoutAmount,
      scheduledDate: new Date(),
      status: PAYOUT_STATUS.PENDING_APPROVAL,
      initiatedBy: executedBy,
      initiatedAt: new Date(),
    });
  } else {
    // Update existing scheduled payout
    payout.status = PAYOUT_STATUS.PENDING_APPROVAL;
    payout.amount = payoutAmount;
    payout.initiatedBy = executedBy;
    payout.initiatedAt = new Date();
    await payout.save();
  }

  // Log action
  await AuditLog.logAction({
    groupId: cycle.group._id,
    action: AUDIT_ACTIONS.PAYOUT_INITIATED,
    description: `Payout of ₹${payout.amount} initiated for cycle ${cycle.cycleNumber}`,
    userId: executedBy,
    memberId: cycle.beneficiary._id,
    cycleId,
  });

  // Send notification to beneficiary (email + in-app)
  try {
    const beneficiaryUser = cycle.beneficiary.user;
    if (beneficiaryUser) {
      // Create in-app notification
      await Notification.createNotification({
        user: beneficiaryUser._id,
        type: NOTIFICATION_TYPES.PAYOUT_PENDING_APPROVAL,
        title: 'Payout Ready for Approval',
        message: `Your payout of ₹${payout.amount.toLocaleString()} from ${cycle.group.name} is ready. Please review and approve.`,
        group: cycle.group._id,
        payout: payout._id,
        actionUrl: '/payouts',
        metadata: {
          cycleNumber: cycle.cycleNumber,
          amount: payout.amount
        }
      });

      // Send email notification
      if (beneficiaryUser.email) {
        await notificationService.sendPayoutPendingApproval(
          beneficiaryUser,
          cycle.group,
          payout,
          cycle
        );
      }
    }
  } catch (err) {
    console.error('Failed to send payout pending approval notification:', err);
  }

  return payout.populate([
    { path: 'beneficiary', populate: { path: 'user', select: 'name email phone' } },
    { path: 'group', select: 'name' },
    { path: 'cycle', select: 'cycleNumber' }
  ]);
};

/**
 * Approve payout (Beneficiary approves)
 */
const approvePayout = async (payoutId, userId, remarks) => {
  const payout = await Payout.findById(payoutId)
    .populate({
      path: 'beneficiary',
      populate: { path: 'user', select: 'name email phone' }
    })
    .populate('group')
    .populate('cycle');

  if (!payout) {
    throw ApiError.notFound('Payout not found');
  }

  if (payout.status !== PAYOUT_STATUS.PENDING_APPROVAL) {
    throw ApiError.badRequest('Payout is not in pending approval status');
  }

  // Verify the user is the beneficiary
  const member = await Member.findOne({ user: userId, group: payout.group._id });
  if (!member || member._id.toString() !== payout.beneficiary._id.toString()) {
    throw ApiError.forbidden('Only the beneficiary can approve this payout');
  }

  // Approve the payout
  payout.status = PAYOUT_STATUS.APPROVED;
  payout.approvedBy = userId;
  payout.approvedAt = new Date();
  if (remarks) {
    payout.approvalRemarks = remarks;
  }
  await payout.save();

  // Log action
  await AuditLog.logAction({
    groupId: payout.group._id,
    action: AUDIT_ACTIONS.PAYOUT_APPROVED,
    description: `Payout of ₹${payout.amount} approved by beneficiary for cycle ${payout.cycle.cycleNumber}`,
    userId,
    memberId: payout.beneficiary._id,
    cycleId: payout.cycle._id,
  });

  // Notify admin that beneficiary has approved (email + in-app)
  try {
    const group = await Group.findById(payout.group._id).populate('organizer');
    if (group && group.organizer) {
      // Create in-app notification for admin
      await Notification.createNotification({
        user: group.organizer._id,
        type: NOTIFICATION_TYPES.PAYOUT_APPROVED,
        title: 'Payout Approved',
        message: `${payout.beneficiary.user.name} has approved their payout of ₹${payout.amount.toLocaleString()} from ${group.name}. Please complete the transfer.`,
        group: group._id,
        payout: payout._id,
        actionUrl: '/payouts',
        metadata: {
          cycleNumber: payout.cycle.cycleNumber,
          amount: payout.amount,
          beneficiaryName: payout.beneficiary.user.name
        }
      });

      // Send email notification
      if (group.organizer.email) {
        await notificationService.sendPayoutApprovedNotification(
          group.organizer,
          payout.beneficiary.user,
          group,
          payout
        );
      }
    }
  } catch (err) {
    console.error('Failed to send payout approved notification to admin:', err);
  }

  return payout;
};

/**
 * Complete payout (Admin completes with transaction details)
 */
const executePayout = async (payoutData) => {
  const {
    cycleId,
    payoutId,
    amount,
    transferMode,
    transferReference,
    transactionId,
    scheduledDate,
    recipientAccount,
    processorRemarks,
    proofDocument,
    executedBy,
  } = payoutData;

  let payout;
  let cycle;

  if (payoutId) {
    // Complete existing payout
    payout = await Payout.findById(payoutId)
      .populate({
        path: 'beneficiary',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('group')
      .populate('cycle');

    if (!payout) {
      throw ApiError.notFound('Payout not found');
    }

    if (payout.status !== PAYOUT_STATUS.APPROVED && payout.status !== PAYOUT_STATUS.SCHEDULED) {
      throw ApiError.badRequest('Payout must be approved before completion');
    }

    cycle = payout.cycle;
  } else {
    // Legacy flow - direct execution
    cycle = await Cycle.findById(cycleId)
      .populate({
        path: 'beneficiary',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('group');

    if (!cycle) {
      throw ApiError.notFound('Cycle not found');
    }

    // Check if cycle is ready for payout
    if (!cycle.isReadyForPayout) {
      await cycle.checkPayoutReadiness();
      if (!cycle.isReadyForPayout) {
        throw ApiError.badRequest('Cycle is not ready for payout. Not all payments received.');
      }
    }

    // Check if payout already exists
    payout = await Payout.findOne({ cycle: cycleId });
    if (payout && payout.status === PAYOUT_STATUS.COMPLETED) {
      throw ApiError.conflict('Payout already completed for this cycle');
    }
  }

  // Use provided amount or existing payout amount
  const cleanExecAmount = amount ? String(amount).replace(/[^0-9]/g, '') : null;
  const finalAmount = cleanExecAmount ? parseInt(cleanExecAmount, 10) : (payout?.amount || 0);
  console.log('Execute Payout - received:', amount, 'parsed:', finalAmount);

  if (!payout) {
    // Create new payout directly as completed (legacy flow)
    payout = await Payout.create({
      group: cycle.group._id,
      cycle: cycle._id,
      beneficiary: cycle.beneficiary._id,
      amount: finalAmount,
      transferMode,
      transferReference,
      transactionId,
      scheduledDate: scheduledDate || new Date(),
      recipientAccount,
      processorRemarks,
      proofDocument,
      status: PAYOUT_STATUS.COMPLETED,
      processedBy: executedBy,
      processedAt: new Date(),
      completedAt: new Date(),
    });
  } else {
    // Update existing payout
    payout.amount = finalAmount || payout.amount;
    payout.transferMode = transferMode;
    payout.transferReference = transferReference;
    payout.transactionId = transactionId;
    payout.recipientAccount = recipientAccount;
    payout.processorRemarks = processorRemarks;
    if (proofDocument) {
      payout.proofDocument = proofDocument;
    }
    payout.status = PAYOUT_STATUS.COMPLETED;
    payout.processedBy = executedBy;
    payout.processedAt = new Date();
    payout.completedAt = new Date();
    await payout.save();
  }

  // Update cycle
  const cycleToUpdate = await Cycle.findById(payout.cycle._id || payout.cycle);
  await cycleToUpdate.completePayout(
    {
      amount: payout.amount,
      reference: transferReference,
      proof: proofDocument,
    },
    executedBy
  );

  // Update member - ensure payoutAmount is integer
  const member = await Member.findById(payout.beneficiary._id || payout.beneficiary);
  member.hasReceivedPayout = true;
  member.payoutReceivedAt = new Date();
  member.payoutAmount = Math.round(payout.amount);
  await member.save();

  // Update group stats and move to next cycle - use integer math
  const group = await Group.findById(payout.group._id || payout.group);
  group.stats.totalDisbursed = Math.round(group.stats.totalDisbursed) + Math.round(payout.amount);
  group.stats.completedCycles += 1;

  // Get the completed cycle to apply late fees
  const completedCycle = await Cycle.findById(payout.cycle._id || payout.cycle);

  if (group.currentCycle < group.duration) {
    group.currentCycle += 1;

    // Apply late fees to unpaid payments from the cycle that just ended
    const Payment = require('../models/Payment.model');
    const penaltyService = require('./penalty.service');
    const { PAYMENT_STATUS } = require('../config/constants');

    // Find all pending payments from the completed cycle
    const unpaidPayments = await Payment.find({
      cycle: completedCycle._id,
      status: { $in: [PAYMENT_STATUS.PENDING, 'under_review'] },
    }).populate('member').populate('group');

    // Apply late fees immediately
    for (const payment of unpaidPayments) {
      // Mark payment as late
      payment.status = PAYMENT_STATUS.LATE;
      payment.isLate = true;

      // Calculate days late from due date
      const today = new Date();
      const daysDiff = Math.floor((today - payment.dueDate) / (1000 * 60 * 60 * 24));
      payment.daysLate = daysDiff > 0 ? daysDiff : 1; // At least 1 day late

      await payment.save();

      // Apply late fee
      await penaltyService.applyLateFee(payment, executedBy);

      console.log(`Applied late fee to payment ${payment._id} for member ${payment.member._id}`);
    }

    if (unpaidPayments.length > 0) {
      console.log(`Applied late fees to ${unpaidPayments.length} unpaid payments from cycle ${completedCycle.cycleNumber}`);
    }

    // Activate next cycle
    const nextCycle = await Cycle.findOne({
      group: group._id,
      cycleNumber: group.currentCycle,
    });

    if (nextCycle) {
      nextCycle.status = CYCLE_STATUS.ACTIVE;
      await nextCycle.save();

      // Create pending payment records for all members for the next cycle
      const members = await Member.find({ group: group._id, status: 'active' });
      const paymentDueDate = new Date(nextCycle.endDate);
      const Penalty = require('../models/Penalty.model');

      for (const member of members) {
        // Check if payment already exists for this member and cycle
        const existingPayment = await Payment.findOne({
          member: member._id,
          cycle: nextCycle._id,
        });

        if (!existingPayment) {
          // Get unpaid penalties for this member
          const unpaidPenalties = await Penalty.find({
            member: member._id,
            isPaid: false,
            isWaived: false,
          });

          // Calculate total unpaid penalty amount
          const totalUnpaidPenalties = unpaidPenalties.reduce((sum, penalty) => sum + penalty.amount, 0);

          // Payment amount = monthly contribution + unpaid penalties
          const paymentAmount = Math.round(group.monthlyContribution + totalUnpaidPenalties);

          await Payment.create({
            group: group._id,
            member: member._id,
            cycle: nextCycle._id,
            cycleNumber: nextCycle.cycleNumber,
            amount: paymentAmount,
            currency: group.currency,
            paymentMode: 'upi',
            status: 'pending',
            dueDate: paymentDueDate,
          });

          // Log if penalties were added
          if (totalUnpaidPenalties > 0) {
            console.log(`Member ${member._id}: Payment amount ₹${paymentAmount} (₹${group.monthlyContribution} + ₹${totalUnpaidPenalties} penalties)`);
          }
        }
      }

      // Update the next cycle's payment counts after creating payments
      await nextCycle.updatePaymentCounts();
    }
  } else {
    // Group completed
    group.status = 'completed';
    group.completedAt = new Date();
  }

  await group.save();

  // Log action
  await AuditLog.logAction({
    groupId: group._id,
    action: AUDIT_ACTIONS.PAYOUT_EXECUTED,
    description: `Payout of ₹${payout.amount} completed for cycle ${cycleToUpdate.cycleNumber}`,
    userId: executedBy,
    memberId: payout.beneficiary._id || payout.beneficiary,
    cycleId: payout.cycle._id || payout.cycle,
  });

  // Send notification to beneficiary about completed payout (email + in-app)
  try {
    const beneficiaryMember = await Member.findById(payout.beneficiary._id || payout.beneficiary)
      .populate('user', 'name email phone');
    if (beneficiaryMember && beneficiaryMember.user) {
      // Create in-app notification
      await Notification.createNotification({
        user: beneficiaryMember.user._id,
        type: NOTIFICATION_TYPES.PAYOUT_COMPLETED,
        title: 'Payout Completed! 🎉',
        message: `Your payout of ₹${payout.amount.toLocaleString()} from ${group.name} has been completed. Check the transaction details.`,
        group: group._id,
        payout: payout._id,
        actionUrl: '/payouts',
        metadata: {
          cycleNumber: cycleToUpdate.cycleNumber,
          amount: payout.amount,
          transactionId: payout.transactionId,
          transferMode: payout.transferMode
        }
      });

      // Send email notification
      if (beneficiaryMember.user.email) {
        await notificationService.sendPayoutCompletedNotification(
          beneficiaryMember.user,
          group,
          payout
        );
      }
    }
  } catch (err) {
    console.error('Failed to send payout completed notification:', err);
  }

  return payout.populate('beneficiary', 'user turnNumber');
};

/**
 * Get payout by ID
 */
const getPayoutById = async (payoutId) => {
  const payout = await Payout.findById(payoutId)
    .populate('beneficiary')
    .populate({
      path: 'beneficiary',
      populate: {
        path: 'user',
        select: 'name email phone',
      },
    })
    .populate('cycle', 'cycleNumber startDate endDate')
    .populate('group', 'name monthlyContribution');

  if (!payout) {
    throw ApiError.notFound('Payout not found');
  }

  return payout;
};

/**
 * Get group payouts
 */
const getGroupPayouts = async (groupId) => {
  const payouts = await Payout.find({ group: groupId })
    .populate('beneficiary')
    .populate({
      path: 'beneficiary',
      populate: {
        path: 'user',
        select: 'name email phone',
      },
    })
    .populate('cycle', 'cycleNumber startDate endDate')
    .populate('group', 'name monthlyContribution')
    .sort({ scheduledDate: -1 });

  return payouts;
};

/**
 * Complete payout (called after Razorpay payment success)
 */
const completePayout = async (payoutId, completionData) => {
  const payout = await Payout.findById(payoutId)
    .populate({
      path: 'beneficiary',
      populate: { path: 'user', select: 'name email phone' }
    })
    .populate('group')
    .populate('cycle');

  if (!payout) {
    throw ApiError.notFound('Payout not found');
  }

  if (payout.status === PAYOUT_STATUS.COMPLETED) {
    throw ApiError.badRequest('Payout is already completed');
  }

  // Update payout with transaction details
  payout.status = PAYOUT_STATUS.COMPLETED;
  payout.completedAt = new Date();
  payout.processedAt = new Date();
  if (completionData) {
    payout.transferReference = completionData.reference || completionData.transactionId;
    payout.transactionId = completionData.transactionId;
  }
  await payout.save();

  // Update cycle
  const cycleToUpdate = await Cycle.findById(payout.cycle._id || payout.cycle);
  await cycleToUpdate.completePayout(
    {
      amount: payout.amount,
      reference: payout.transferReference,
    },
    payout.processedBy || payout.initiatedBy
  );

  // Update member
  const member = await Member.findById(payout.beneficiary._id || payout.beneficiary);
  member.hasReceivedPayout = true;
  member.payoutReceivedAt = new Date();
  member.payoutAmount = Math.round(payout.amount);
  await member.save();

  // Update group stats and move to next cycle
  const group = await Group.findById(payout.group._id || payout.group);
  group.stats.totalDisbursed = Math.round(group.stats.totalDisbursed) + Math.round(payout.amount);
  group.stats.completedCycles += 1;

  // Get the completed cycle to apply late fees
  const completedCycle = await Cycle.findById(payout.cycle._id || payout.cycle);

  if (group.currentCycle < group.duration) {
    group.currentCycle += 1;

    // Apply late fees to unpaid payments from the cycle that just ended
    const Payment = require('../models/Payment.model');
    const penaltyService = require('./penalty.service');
    const { PAYMENT_STATUS } = require('../config/constants');

    // Find all pending payments from the completed cycle
    const unpaidPayments = await Payment.find({
      cycle: completedCycle._id,
      status: { $in: [PAYMENT_STATUS.PENDING, 'under_review'] },
    }).populate('member').populate('group');

    // Apply late fees immediately
    for (const payment of unpaidPayments) {
      payment.status = PAYMENT_STATUS.LATE;
      payment.isLate = true;
      const today = new Date();
      const daysDiff = Math.floor((today - payment.dueDate) / (1000 * 60 * 60 * 24));
      payment.daysLate = daysDiff > 0 ? daysDiff : 1;
      await payment.save();
      await penaltyService.applyLateFee(payment, payout.processedBy || payout.initiatedBy);
    }

    // Activate next cycle
    const nextCycle = await Cycle.findOne({
      group: group._id,
      cycleNumber: group.currentCycle,
    });

    if (nextCycle) {
      nextCycle.status = CYCLE_STATUS.ACTIVE;
      await nextCycle.save();

      // Create pending payment records for all members for the next cycle
      const members = await Member.find({ group: group._id, status: 'active' });
      const paymentDueDate = new Date(nextCycle.endDate);
      const Penalty = require('../models/Penalty.model');
      const Payment = require('../models/Payment.model');

      for (const memberItem of members) {
        const existingPayment = await Payment.findOne({
          member: memberItem._id,
          cycle: nextCycle._id,
        });

        if (!existingPayment) {
          const unpaidPenalties = await Penalty.find({
            member: memberItem._id,
            isPaid: false,
            isWaived: false,
          });
          const totalUnpaidPenalties = unpaidPenalties.reduce((sum, penalty) => sum + penalty.amount, 0);
          const paymentAmount = Math.round(group.monthlyContribution + totalUnpaidPenalties);

          await Payment.create({
            group: group._id,
            member: memberItem._id,
            cycle: nextCycle._id,
            cycleNumber: nextCycle.cycleNumber,
            amount: paymentAmount,
            currency: group.currency,
            paymentMode: 'upi',
            status: 'pending',
            dueDate: paymentDueDate,
          });
        }
      }

      await nextCycle.updatePaymentCounts();
    }
  } else {
    group.status = 'completed';
    group.completedAt = new Date();
  }

  await group.save();

  // Log action
  await AuditLog.logAction({
    groupId: group._id,
    action: AUDIT_ACTIONS.PAYOUT_EXECUTED,
    description: `Payout of ₹${payout.amount} completed for cycle ${cycleToUpdate.cycleNumber}`,
    userId: payout.processedBy || payout.initiatedBy,
    memberId: payout.beneficiary._id || payout.beneficiary,
    cycleId: payout.cycle._id || payout.cycle,
  });

  // Send notification to beneficiary
  try {
    const beneficiaryMember = await Member.findById(payout.beneficiary._id || payout.beneficiary)
      .populate('user', 'name email phone');
    if (beneficiaryMember && beneficiaryMember.user) {
      await Notification.createNotification({
        user: beneficiaryMember.user._id,
        type: NOTIFICATION_TYPES.PAYOUT_COMPLETED,
        title: 'Payout Completed! 🎉',
        message: `Your payout of ₹${payout.amount.toLocaleString()} from ${group.name} has been completed.`,
        group: group._id,
        payout: payout._id,
        actionUrl: '/payouts',
        metadata: {
          cycleNumber: cycleToUpdate.cycleNumber,
          amount: payout.amount,
          transactionId: payout.transactionId
        }
      });

      if (beneficiaryMember.user.email) {
        await notificationService.sendPayoutCompletedNotification(
          beneficiaryMember.user,
          group,
          payout
        );
      }
    }
  } catch (err) {
    console.error('Failed to send payout completed notification:', err);
  }

  return payout;
};

/**
 * Mark payout as failed
 */
const markPayoutFailed = async (payoutId, reason) => {
  const payout = await Payout.findById(payoutId)
    .populate({
      path: 'beneficiary',
      populate: { path: 'user', select: 'name email phone' }
    })
    .populate('group')
    .populate('cycle');

  if (!payout) {
    throw ApiError.notFound('Payout not found');
  }

  await payout.markAsFailed(reason);

  // Log action
  await AuditLog.logAction({
    groupId: payout.group._id,
    action: 'PAYOUT_FAILED',
    description: `Payout of ₹${payout.amount} failed for cycle ${payout.cycle?.cycleNumber}. Reason: ${reason}`,
    memberId: payout.beneficiary._id,
    cycleId: payout.cycle?._id,
  });

  // Notify admin about the failure
  try {
    const group = await Group.findById(payout.group._id).populate('organizer');
    if (group && group.organizer) {
      await Notification.createNotification({
        user: group.organizer._id,
        type: 'PAYOUT_FAILED',
        title: 'Payout Failed',
        message: `Payout of ₹${payout.amount.toLocaleString()} to ${payout.beneficiary?.user?.name} failed. Please retry.`,
        group: group._id,
        payout: payout._id,
        actionUrl: '/payouts',
        metadata: {
          cycleNumber: payout.cycle?.cycleNumber,
          amount: payout.amount,
          reason: reason
        }
      });
    }
  } catch (err) {
    console.error('Failed to send payout failed notification:', err);
  }

  return payout;
};

/**
 * Get pending payouts for a user (beneficiary)
 */
const getPendingPayoutsForUser = async (userId) => {
  const members = await Member.find({ user: userId });
  const memberIds = members.map(m => m._id);

  const payouts = await Payout.find({
    beneficiary: { $in: memberIds },
    status: PAYOUT_STATUS.PENDING_APPROVAL
  })
    .populate('group', 'name')
    .populate('cycle', 'cycleNumber')
    .populate({
      path: 'beneficiary',
      populate: { path: 'user', select: 'name email' }
    })
    .sort({ initiatedAt: -1 });

  return payouts;
};

module.exports = {
  initiatePayout,
  approvePayout,
  executePayout,
  getPayoutById,
  getGroupPayouts,
  completePayout,
  markPayoutFailed,
  getPendingPayoutsForUser,
};