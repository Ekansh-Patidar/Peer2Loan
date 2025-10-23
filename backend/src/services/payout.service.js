const Payout = require('../models/Payout.model');
const Cycle = require('../models/Cycle.model');
const Member = require('../models/Member.model');
const Group = require('../models/Group.model');
const AuditLog = require('../models/AuditLog.model');
const ApiError = require('../utils/apiError');
const { PAYOUT_STATUS, CYCLE_STATUS, AUDIT_ACTIONS } = require('../config/constants');

/**
 * Execute payout
 */
const executePayout = async (payoutData) => {
  const {
    cycleId,
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

  // Get cycle with beneficiary and group details
  const cycle = await Cycle.findById(cycleId)
    .populate('beneficiary')
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
  const existingPayout = await Payout.findOne({ cycle: cycleId });
  if (existingPayout) {
    throw ApiError.conflict('Payout already exists for this cycle');
  }

  // Create payout
  const payout = await Payout.create({
    group: cycle.group._id,
    cycle: cycleId,
    beneficiary: cycle.beneficiary._id,
    amount,
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

  // Update cycle
  await cycle.completePayout(
    {
      amount,
      reference: transferReference,
      proof: proofDocument,
    },
    executedBy
  );

  // Update member
  const member = await Member.findById(cycle.beneficiary._id);
  member.hasReceivedPayout = true;
  member.payoutReceivedAt = new Date();
  member.payoutAmount = amount;
  await member.save();

  // Update group stats and move to next cycle
  const group = await Group.findById(cycle.group._id);
  group.stats.totalDisbursed += amount;
  group.stats.completedCycles += 1;
  
  if (group.currentCycle < group.duration) {
    group.currentCycle += 1;
    
    // Activate next cycle
    const nextCycle = await Cycle.findOne({
      group: group._id,
      cycleNumber: group.currentCycle,
    });
    
    if (nextCycle) {
      nextCycle.status = CYCLE_STATUS.ACTIVE;
      await nextCycle.save();
    }
  } else {
    // Group completed
    group.status = 'completed';
    group.completedAt = new Date();
  }
  
  await group.save();

  // Log action
  await AuditLog.logAction({
    groupId: cycle.group._id,
    action: AUDIT_ACTIONS.PAYOUT_EXECUTED,
    description: `Payout of ${amount} executed for cycle ${cycle.cycleNumber}`,
    userId: executedBy,
    memberId: cycle.beneficiary._id,
    cycleId,
  });

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
    .sort({ scheduledDate: -1 });

  return payouts;
};

/**
 * Complete payout
 */
const completePayout = async (payoutId, completionData) => {
  const payout = await Payout.findById(payoutId);

  if (!payout) {
    throw ApiError.notFound('Payout not found');
  }

  if (payout.status === PAYOUT_STATUS.COMPLETED) {
    throw ApiError.badRequest('Payout is already completed');
  }

  await payout.markAsCompleted(completionData);

  return payout;
};

/**
 * Mark payout as failed
 */
const markPayoutFailed = async (payoutId, reason) => {
  const payout = await Payout.findById(payoutId);

  if (!payout) {
    throw ApiError.notFound('Payout not found');
  }

  await payout.markAsFailed(reason);

  return payout;
};

module.exports = {
  executePayout,
  getPayoutById,
  getGroupPayouts,
  completePayout,
  markPayoutFailed,
};