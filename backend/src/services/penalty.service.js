const Penalty = require('../models/Penalty.model');
const Member = require('../models/Member.model');
const Group = require('../models/Group.model');
const AuditLog = require('../models/AuditLog.model');
const { AUDIT_ACTIONS } = require('../config/constants');

/**
 * Apply late fee
 */
const applyLateFee = async (payment, userId) => {
  const group = await Group.findById(payment.group);
  
  if (!group) {
    return;
  }

  const lateFee = group.penaltyRules.lateFee;
  
  if (lateFee <= 0) {
    return;
  }

  // Create penalty
  const penalty = await Penalty.create({
    group: payment.group,
    member: payment.member,
    payment: payment._id,
    cycle: payment.cycle,
    type: 'late_fee',
    amount: lateFee,
    reason: `Late payment for cycle ${payment.cycleNumber}`,
    daysLate: payment.daysLate,
    appliedBy: userId,
  });

  // Update payment
  payment.lateFee = lateFee;
  await payment.save();

  // Update member
  await Member.findByIdAndUpdate(payment.member, {
    $inc: { totalPenalties: lateFee },
  });

  // Update group stats
  await Group.findByIdAndUpdate(payment.group, {
    $inc: { 'stats.totalPenalties': lateFee },
  });

  // Log action
  await AuditLog.logAction({
    groupId: payment.group,
    action: AUDIT_ACTIONS.PENALTY_APPLIED,
    description: `Late fee of ${lateFee} applied`,
    userId,
    memberId: payment.member,
    paymentId: payment._id,
  });

  return penalty;
};

/**
 * Apply default penalty
 */
const applyDefaultPenalty = async (memberId, groupId, cycleId, userId) => {
  const group = await Group.findById(groupId);
  
  if (!group) {
    return;
  }

  const penaltyAmount = group.penaltyRules.lateFee * 2; // Double the late fee

  const penalty = await Penalty.create({
    group: groupId,
    member: memberId,
    cycle: cycleId,
    type: 'default_penalty',
    amount: penaltyAmount,
    reason: 'Payment default',
    appliedBy: userId,
  });

  // Update member
  const member = await Member.findById(memberId);
  member.totalPenalties += penaltyAmount;
  member.missedPayments += 1;
  member.calculatePerformanceScore();
  await member.save();

  // Update group stats
  await Group.findByIdAndUpdate(groupId, {
    $inc: { 'stats.totalPenalties': penaltyAmount },
  });

  return penalty;
};

/**
 * Waive penalty
 */
const waivePenalty = async (penaltyId, userId, reason) => {
  const penalty = await Penalty.findById(penaltyId);

  if (!penalty) {
    throw new Error('Penalty not found');
  }

  if (penalty.isWaived) {
    throw new Error('Penalty is already waived');
  }

  await penalty.waive(userId, reason);

  // Update member
  await Member.findByIdAndUpdate(penalty.member, {
    $inc: { totalPenalties: -penalty.amount },
  });

  // Update group stats
  await Group.findByIdAndUpdate(penalty.group, {
    $inc: { 'stats.totalPenalties': -penalty.amount },
  });

  return penalty;
};

/**
 * Get member penalties
 */
const getMemberPenalties = async (memberId) => {
  return await Penalty.find({ member: memberId })
    .populate('cycle', 'cycleNumber')
    .sort({ createdAt: -1 });
};

module.exports = {
  applyLateFee,
  applyDefaultPenalty,
  waivePenalty,
  getMemberPenalties,
};