const Member = require('../models/Member.model');
const { TURN_ORDER_TYPES } = require('../config/constants');

/**
 * Generate turn order based on type
 */
const generateTurnOrder = async (groupId, memberIds, turnOrderType) => {
  const members = await Member.find({
    _id: { $in: memberIds },
    group: groupId,
  });

  let turnOrder = [];

  switch (turnOrderType) {
    case TURN_ORDER_TYPES.FIXED:
      // Members already have turn numbers assigned during invitation
      turnOrder = members
        .sort((a, b) => a.turnNumber - b.turnNumber)
        .map((member, index) => ({
          memberId: member._id,
          turnNumber: member.turnNumber,
          scheduledMonth: member.turnNumber,
        }));
      break;

    case TURN_ORDER_TYPES.RANDOM:
      // Shuffle members randomly
      const shuffled = [...members].sort(() => Math.random() - 0.5);
      turnOrder = shuffled.map((member, index) => ({
        memberId: member._id,
        turnNumber: index + 1,
        scheduledMonth: index + 1,
      }));

      // Update member turn numbers
      for (let i = 0; i < shuffled.length; i++) {
        shuffled[i].turnNumber = i + 1;
        shuffled[i].scheduledPayoutMonth = i + 1;
        await shuffled[i].save();
      }
      break;

    case TURN_ORDER_TYPES.LOTTERY:
      // Similar to random but can be executed at group start
      const lottery = [...members].sort(() => Math.random() - 0.5);
      turnOrder = lottery.map((member, index) => ({
        memberId: member._id,
        turnNumber: index + 1,
        scheduledMonth: index + 1,
      }));

      for (let i = 0; i < lottery.length; i++) {
        lottery[i].turnNumber = i + 1;
        lottery[i].scheduledPayoutMonth = i + 1;
        await lottery[i].save();
      }
      break;

    case TURN_ORDER_TYPES.NEED_BASED:
      // Requires manual approval by admin
      // Initial order based on member turn numbers (will be adjusted by admin)
      turnOrder = members
        .sort((a, b) => a.turnNumber - b.turnNumber)
        .map((member) => ({
          memberId: member._id,
          turnNumber: member.turnNumber,
          scheduledMonth: member.turnNumber,
          needBased: true,
        }));
      break;

    default:
      // Default to fixed order
      turnOrder = members
        .sort((a, b) => a.turnNumber - b.turnNumber)
        .map((member) => ({
          memberId: member._id,
          turnNumber: member.turnNumber,
          scheduledMonth: member.turnNumber,
        }));
  }

  return turnOrder;
};

/**
 * Reassign turn order (for need-based or after member exit)
 */
const reassignTurnOrder = async (groupId, newOrder) => {
  // newOrder is an array of { memberId, newTurnNumber }
  for (const assignment of newOrder) {
    const member = await Member.findOne({
      _id: assignment.memberId,
      group: groupId,
    });

    if (member) {
      member.turnNumber = assignment.newTurnNumber;
      member.scheduledPayoutMonth = assignment.newTurnNumber;
      await member.save();
    }
  }

  // Regenerate turn order array
  const members = await Member.find({ group: groupId, status: 'active' }).sort({
    turnNumber: 1,
  });

  return members.map((member) => ({
    memberId: member._id,
    turnNumber: member.turnNumber,
    scheduledMonth: member.turnNumber,
    isCompleted: member.hasReceivedPayout,
  }));
};

/**
 * Get next beneficiary
 */
const getNextBeneficiary = async (groupId, currentCycleNumber) => {
  const members = await Member.find({
    group: groupId,
    status: 'active',
    turnNumber: currentCycleNumber,
  });

  if (members.length === 0) {
    return null;
  }

  return members[0];
};

/**
 * Skip turn (in case of default)
 */
const skipTurn = async (groupId, memberId, reason) => {
  const member = await Member.findOne({
    _id: memberId,
    group: groupId,
  });

  if (!member) {
    throw new Error('Member not found');
  }

  // Mark the turn as skipped in group's turn order
  const Group = require('../models/Group.model');
  const group = await Group.findById(groupId);

  const turnIndex = group.turnOrder.findIndex(
    (t) => t.memberId.toString() === memberId.toString()
  );

  if (turnIndex !== -1) {
    group.turnOrder[turnIndex].isSkipped = true;
    group.turnOrder[turnIndex].skipReason = reason;
    await group.save();
  }

  return group.turnOrder;
};

/**
 * Validate turn order (ensure all members have unique turns)
 */
const validateTurnOrder = async (groupId) => {
  const members = await Member.find({ group: groupId, status: 'active' });

  const turnNumbers = members.map((m) => m.turnNumber);
  const uniqueTurns = new Set(turnNumbers);

  if (turnNumbers.length !== uniqueTurns.size) {
    return {
      valid: false,
      error: 'Duplicate turn numbers found',
    };
  }

  const Group = require('../models/Group.model');
  const group = await Group.findById(groupId);

  if (members.length !== group.memberCount) {
    return {
      valid: false,
      error: `Expected ${group.memberCount} members, found ${members.length}`,
    };
  }

  return {
    valid: true,
  };
};

module.exports = {
  generateTurnOrder,
  reassignTurnOrder,
  getNextBeneficiary,
  skipTurn,
  validateTurnOrder,
};