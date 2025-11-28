const Group = require('../models/Group.model');
const Member = require('../models/Member.model');
const User = require('../models/User.model');
const Cycle = require('../models/Cycle.model');
const AuditLog = require('../models/AuditLog.model');
const ApiError = require('../utils/apiError');
const { generateCycleDates } = require('../utils/dateHelper');
const { GROUP_STATUS, MEMBER_STATUS, CYCLE_STATUS, AUDIT_ACTIONS } = require('../config/constants');

/**
 * Create new group
 */
const createGroup = async (organizerId, groupData) => {
  const {
    name,
    description,
    monthlyContribution,
    currency,
    memberCount,
    startDate,
    paymentWindow,
    turnOrderType,
    penaltyRules,
    settings,
  } = groupData;

  // Create group
  const group = await Group.create({
    name,
    description,
    organizer: organizerId,
    monthlyContribution,
    currency,
    memberCount,
    duration: memberCount, // Duration equals member count
    startDate: new Date(startDate),
    paymentWindow,
    turnOrderType,
    penaltyRules,
    settings,
  });

  // Create organizer as first member
  await Member.create({
    user: organizerId,
    group: group._id,
    role: 'organizer',
    status: MEMBER_STATUS.ACTIVE,
    turnNumber: 1, // Organizer gets turn 1 by default
    acceptedAt: new Date(),
  });

  // Log action
  await AuditLog.logAction({
    groupId: group._id,
    action: AUDIT_ACTIONS.GROUP_CREATED,
    description: `Group "${name}" created`,
    userId: organizerId,
  });

  return group;
};

/**
 * Get user's groups
 */
const getUserGroups = async (userId, options = {}) => {
  const { page = 1, limit = 20, status } = options;
  const skip = (page - 1) * limit;

  // Find groups where user is organizer or active member (not invited)
  const memberGroups = await Member.find({
    user: userId,
    status: MEMBER_STATUS.ACTIVE,
  }).select('group');

  const groupIds = memberGroups.map((m) => m.group);

  const query = { _id: { $in: groupIds } };
  if (status) {
    query.status = status;
  }

  const [groups, total] = await Promise.all([
    Group.find(query)
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Group.countDocuments(query),
  ]);

  return {
    groups,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get group by ID
 */
const getGroupById = async (groupId, userId) => {
  const group = await Group.findById(groupId)
    .populate('organizer', 'name email phone');

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  // Check if user is member or organizer
  const isMember = await Member.findOne({
    user: userId,
    group: groupId,
  });

  if (!isMember && group.organizer._id.toString() !== userId.toString()) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  return group;
};

/**
 * Update group
 */
const updateGroup = async (groupId, updateData) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  // Can't update if group is active or completed
  if (group.status !== GROUP_STATUS.DRAFT) {
    throw ApiError.badRequest('Cannot update active or completed group');
  }

  // Allowed updates for draft groups
  const allowedUpdates = [
    'name',
    'description',
    'paymentWindow',
    'penaltyRules',
    'settings',
  ];

  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      group[field] = updateData[field];
    }
  });

  await group.save();

  return group;
};

/**
 * Activate group (start first cycle)
 */
const activateGroup = async (groupId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  if (group.status !== GROUP_STATUS.DRAFT) {
    throw ApiError.badRequest('Group is already active or completed');
  }

  // Check if all members are confirmed
  const members = await Member.find({
    group: groupId,
    status: MEMBER_STATUS.ACTIVE,
  }).sort({ turnNumber: 1 });

  const requiredMemberCount = group.memberCount || members.length;
  
  if (members.length < 2) {
    throw ApiError.badRequest(
      `Cannot activate group. At least 2 active members required. Currently ${members.length} member(s).`
    );
  }

  // Update group member count and duration to match actual active members
  if (members.length !== group.memberCount) {
    group.memberCount = members.length;
    group.duration = members.length;
    await group.save();
  }

  // Ensure turnOrder is populated
  if (!group.turnOrder || group.turnOrder.length === 0) {
    // Generate turn order from members
    group.turnOrder = members.map(member => ({
      memberId: member._id,
      turnNumber: member.turnNumber,
      scheduledMonth: member.turnNumber,
    }));
    await group.save();
  }

  // Delete any existing cycles (in case of previous failed activation)
  await Cycle.deleteMany({ group: groupId });

  // Generate cycles
  const cycleDates = generateCycleDates(group.startDate, group.duration);

  for (const cycleData of cycleDates) {
    // Get beneficiary for this cycle
    let turnAssignment = group.turnOrder.find(
      (t) => t.turnNumber === cycleData.cycleNumber
    );

    // If no turn assignment found, create one from members
    if (!turnAssignment) {
      const member = members.find(m => m.turnNumber === cycleData.cycleNumber);
      if (!member) {
        throw ApiError.badRequest(`No member assigned for turn ${cycleData.cycleNumber}`);
      }
      turnAssignment = {
        memberId: member._id,
        turnNumber: cycleData.cycleNumber,
        scheduledMonth: cycleData.cycleNumber,
      };
      group.turnOrder.push(turnAssignment);
    }

    const cycle = await Cycle.create({
      group: groupId,
      cycleNumber: cycleData.cycleNumber,
      startDate: cycleData.startDate,
      endDate: cycleData.endDate,
      beneficiary: turnAssignment.memberId,
      turnNumber: cycleData.cycleNumber,
      expectedAmount: group.monthlyContribution * group.memberCount,
      totalMembers: group.memberCount,
      status: cycleData.cycleNumber === 1 ? CYCLE_STATUS.ACTIVE : CYCLE_STATUS.PENDING,
    });

    // Create pending payment records for all members for this cycle
    const Payment = require('../models/Payment.model');
    const paymentDueDate = new Date(cycleData.endDate);
    
    for (const member of members) {
      await Payment.create({
        group: groupId,
        member: member._id,
        cycle: cycle._id,
        cycleNumber: cycleData.cycleNumber,
        amount: group.monthlyContribution,
        currency: group.currency,
        paymentMode: 'upi', // Default, can be changed when recording
        status: PAYMENT_STATUS.PENDING,
        dueDate: paymentDueDate,
      });
    }
  }

  // Update group status
  group.status = GROUP_STATUS.ACTIVE;
  group.currentCycle = 1;
  group.stats.activeMembers = members.length;
  await group.save();

  return group;
};

/**
 * Invite member to group
 */
const inviteMember = async (groupId, email, turnNumber) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  // Can only invite in draft status
  if (group.status !== GROUP_STATUS.DRAFT) {
    throw ApiError.badRequest('Cannot invite members to active or completed group');
  }

  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw ApiError.notFound('User not found with this email');
  }

  // Check if user is already a member
  const existingMember = await Member.findOne({
    user: user._id,
    group: groupId,
  });

  if (existingMember) {
    throw ApiError.conflict('User is already a member of this group');
  }

  // Check member count
  const currentMemberCount = await Member.countDocuments({ group: groupId });

  if (currentMemberCount >= group.memberCount) {
    throw ApiError.badRequest('Group is full');
  }

  // Auto-assign turn number if not provided
  let assignedTurnNumber = turnNumber;
  if (!assignedTurnNumber) {
    // Find the next available turn number
    const existingMembers = await Member.find({ group: groupId }).sort({ turnNumber: 1 });
    const usedTurnNumbers = existingMembers.map(m => m.turnNumber);
    
    // Find the first available turn number from 1 to memberCount
    for (let i = 1; i <= group.memberCount; i++) {
      if (!usedTurnNumbers.includes(i)) {
        assignedTurnNumber = i;
        break;
      }
    }
    
    if (!assignedTurnNumber) {
      throw ApiError.badRequest('No available turn numbers');
    }
  }

  // Check if turn number is already taken
  const turnTaken = await Member.findOne({
    group: groupId,
    turnNumber: assignedTurnNumber,
  });

  if (turnTaken) {
    throw ApiError.conflict(`Turn number ${assignedTurnNumber} is already taken`);
  }

  // Create member
  const member = await Member.create({
    user: user._id,
    group: groupId,
    turnNumber: assignedTurnNumber,
    status: MEMBER_STATUS.INVITED,
  });

  // Add to turn order
  group.turnOrder.push({
    memberId: member._id,
    turnNumber: assignedTurnNumber,
    scheduledMonth: assignedTurnNumber,
  });
  await group.save();

  // Log action
  await AuditLog.logAction({
    groupId,
    action: AUDIT_ACTIONS.MEMBER_ADDED,
    description: `${user.name} invited to group`,
    userId: group.organizer,
    memberId: member._id,
  });

  return member.populate('user', 'name email phone');
};

/**
 * Get group members
 */
const getGroupMembers = async (groupId) => {
  const members = await Member.find({ group: groupId })
    .populate('user', 'name email phone avatar')
    .sort({ turnNumber: 1 });

  return members;
};

/**
 * Remove member from group
 */
const removeMember = async (groupId, memberId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  // Can only remove in draft status
  if (group.status !== GROUP_STATUS.DRAFT) {
    throw ApiError.badRequest('Cannot remove members from active or completed group');
  }

  const member = await Member.findOne({
    _id: memberId,
    group: groupId,
  });

  if (!member) {
    throw ApiError.notFound('Member not found');
  }

  // Cannot remove organizer
  if (member.role === 'organizer') {
    throw ApiError.badRequest('Cannot remove group organizer');
  }

  // Remove from turn order
  group.turnOrder = group.turnOrder.filter(
    (t) => t.memberId.toString() !== memberId
  );
  await group.save();

  // Delete member
  await member.deleteOne();

  // Log action
  await AuditLog.logAction({
    groupId,
    action: AUDIT_ACTIONS.MEMBER_REMOVED,
    description: `Member removed from group`,
    userId: group.organizer,
    memberId,
  });
};

/**
 * Accept group invitation
 */
const acceptInvitation = async (groupId, userId) => {
  const member = await Member.findOne({
    user: userId,
    group: groupId,
    status: MEMBER_STATUS.INVITED,
  });

  if (!member) {
    throw ApiError.notFound('Invitation not found');
  }

  await member.acceptInvitation();

  return member.populate('group');
};

/**
 * Get group statistics
 */
const getGroupStatistics = async (groupId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  const [members, cycles] = await Promise.all([
    Member.find({ group: groupId, status: MEMBER_STATUS.ACTIVE }),
    Cycle.find({ group: groupId }),
  ]);

  const completedCycles = cycles.filter((c) => c.status === CYCLE_STATUS.COMPLETED).length;
  const activeCycle = cycles.find((c) => c.status === CYCLE_STATUS.ACTIVE);

  return {
    totalMembers: group.memberCount,
    activeMembers: members.length,
    totalCycles: group.duration,
    completedCycles,
    currentCycle: group.currentCycle,
    totalCollected: group.stats.totalCollected,
    totalDisbursed: group.stats.totalDisbursed,
    totalPenalties: group.stats.totalPenalties,
    activeCycleInfo: activeCycle ? {
      cycleNumber: activeCycle.cycleNumber,
      collectedAmount: activeCycle.collectedAmount,
      expectedAmount: activeCycle.expectedAmount,
      paidCount: activeCycle.paidCount,
      pendingCount: activeCycle.pendingCount,
    } : null,
  };
};

/**
 * Delete group
 */
const deleteGroup = async (groupId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  // Only allow deletion of draft groups or completed groups
  if (group.status === GROUP_STATUS.ACTIVE) {
    throw ApiError.badRequest('Cannot delete an active group. Please complete or cancel the group first.');
  }

  // Delete all related data
  await Promise.all([
    Member.deleteMany({ group: groupId }),
    Cycle.deleteMany({ group: groupId }),
    require('../models/Payment.model').deleteMany({ group: groupId }),
    require('../models/Payout.model').deleteMany({ group: groupId }),
    require('../models/Penalty.model').deleteMany({ group: groupId }),
    AuditLog.deleteMany({ group: groupId }),
  ]);

  // Delete the group
  await Group.findByIdAndDelete(groupId);

  return { success: true };
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  activateGroup,
  inviteMember,
  getGroupMembers,
  removeMember,
  acceptInvitation,
  getGroupStatistics,
};