const Group = require('../models/Group.model');
const Member = require('../models/Member.model');
const Cycle = require('../models/Cycle.model');
const Payment = require('../models/Payment.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { CYCLE_STATUS, PAYMENT_STATUS } = require('../config/constants');

/**
 * @desc    Get group dashboard
 * @route   GET /api/v1/dashboard/group/:groupId
 * @access  Private
 */
const getGroupDashboard = asyncHandler(async (req, res) => {
  const groupId = req.params.groupId;

  // Get group details
  const group = await Group.findById(groupId).populate('organizer', 'name email');

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  // Get current active cycle
  const activeCycle = await Cycle.findOne({
    group: groupId,
    status: CYCLE_STATUS.ACTIVE,
  }).populate('beneficiary').populate({
    path: 'beneficiary',
    populate: { path: 'user', select: 'name email' },
  });

  // Get all members
  const members = await Member.find({ group: groupId }).populate('user', 'name email');

  // Get payments for active cycle
  let cyclePayments = [];
  let contributionHeatmap = [];
  
  if (activeCycle) {
    cyclePayments = await Payment.find({ cycle: activeCycle._id })
      .populate('member')
      .populate({ path: 'member', populate: { path: 'user', select: 'name' } });

    // Create contribution heatmap
    contributionHeatmap = members.map((member) => {
      const payment = cyclePayments.find(
        (p) => p.member._id.toString() === member._id.toString()
      );
      return {
        memberId: member._id,
        memberName: member.user.name,
        turnNumber: member.turnNumber,
        status: payment ? payment.status : PAYMENT_STATUS.PENDING,
        paidAt: payment ? payment.paidAt : null,
        amount: payment ? payment.amount : 0,
      };
    });
  }

  // Get upcoming cycles
  const upcomingCycles = await Cycle.find({
    group: groupId,
    status: CYCLE_STATUS.PENDING,
  })
    .populate('beneficiary')
    .populate({ path: 'beneficiary', populate: { path: 'user', select: 'name' } })
    .sort({ cycleNumber: 1 })
    .limit(3);

  // Calculate alerts
  const alerts = [];
  
  if (activeCycle) {
    const pendingCount = activeCycle.pendingCount;
    const lateCount = activeCycle.lateCount;
    
    if (pendingCount > 0) {
      alerts.push({
        type: 'warning',
        message: `${pendingCount} member(s) have pending payments`,
      });
    }
    
    if (lateCount > 0) {
      alerts.push({
        type: 'error',
        message: `${lateCount} member(s) have late payments`,
      });
    }
    
    if (activeCycle.isReadyForPayout && !activeCycle.isPayoutCompleted) {
      alerts.push({
        type: 'success',
        message: `Cycle ${activeCycle.cycleNumber} is ready for payout`,
      });
    }
  }

  const dashboard = {
    group: {
      id: group._id,
      name: group.name,
      status: group.status,
      monthlyContribution: group.monthlyContribution,
      potAmount: group.potAmount,
      currentCycle: group.currentCycle,
      totalCycles: group.duration,
    },
    activeCycle: activeCycle ? {
      cycleNumber: activeCycle.cycleNumber,
      startDate: activeCycle.startDate,
      endDate: activeCycle.endDate,
      beneficiary: activeCycle.beneficiary.user.name,
      beneficiaryTurn: activeCycle.beneficiary.turnNumber,
      collectedAmount: activeCycle.collectedAmount,
      expectedAmount: activeCycle.expectedAmount,
      collectionPercentage: activeCycle.collectionPercentage,
      paidCount: activeCycle.paidCount,
      pendingCount: activeCycle.pendingCount,
      lateCount: activeCycle.lateCount,
      isReadyForPayout: activeCycle.isReadyForPayout,
      isPayoutCompleted: activeCycle.isPayoutCompleted,
    } : null,
    contributionHeatmap,
    stats: {
      totalMembers: group.memberCount,
      activeMembers: group.stats.activeMembers,
      totalCollected: group.stats.totalCollected,
      totalDisbursed: group.stats.totalDisbursed,
      totalPenalties: group.stats.totalPenalties,
      completedCycles: group.stats.completedCycles,
    },
    upcomingCycles: upcomingCycles.map((c) => ({
      cycleNumber: c.cycleNumber,
      startDate: c.startDate,
      beneficiary: c.beneficiary.user.name,
      turnNumber: c.beneficiary.turnNumber,
    })),
    alerts,
  };

  return ApiResponse.success(res, dashboard, 'Dashboard retrieved successfully');
});

/**
 * @desc    Get member dashboard
 * @route   GET /api/v1/dashboard/member/:groupId
 * @access  Private
 */
const getMemberDashboard = asyncHandler(async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user._id;

  // Get member details
  const member = await Member.findOne({
    user: userId,
    group: groupId,
  }).populate('group');

  if (!member) {
    throw ApiError.notFound('Member not found');
  }

  // Get payment history
  const payments = await Payment.find({ member: member._id })
    .populate('cycle', 'cycleNumber startDate endDate')
    .sort({ createdAt: -1 })
    .limit(10);

  // Get upcoming turn
  const upcomingTurn = await Cycle.findOne({
    group: groupId,
    beneficiary: member._id,
    status: { $in: [CYCLE_STATUS.PENDING, CYCLE_STATUS.ACTIVE] },
  });

  // Calculate net position
  const netPosition = member.payoutAmount - member.totalContributed;

  // Get current cycle payment status
  const activeCycle = await Cycle.findOne({
    group: groupId,
    status: CYCLE_STATUS.ACTIVE,
  });

  let currentCyclePayment = null;
  if (activeCycle) {
    currentCyclePayment = await Payment.findOne({
      member: member._id,
      cycle: activeCycle._id,
    });
  }

  const dashboard = {
    member: {
      id: member._id,
      name: req.user.name,
      turnNumber: member.turnNumber,
      status: member.status,
      paymentStreak: member.paymentStreak,
      performanceScore: member.performanceScore,
    },
    group: {
      name: member.group.name,
      monthlyContribution: member.group.monthlyContribution,
      currentCycle: member.group.currentCycle,
      totalCycles: member.group.duration,
    },
    financials: {
      totalContributed: member.totalContributed,
      payoutReceived: member.payoutAmount,
      netPosition,
      totalPenalties: member.totalPenalties,
      missedPayments: member.missedPayments,
      latePayments: member.latePayments,
    },
    upcomingTurn: upcomingTurn ? {
      cycleNumber: upcomingTurn.cycleNumber,
      scheduledDate: upcomingTurn.startDate,
      amount: member.group.potAmount,
    } : null,
    currentCyclePayment: currentCyclePayment ? {
      status: currentCyclePayment.status,
      amount: currentCyclePayment.amount,
      paidAt: currentCyclePayment.paidAt,
      dueDate: currentCyclePayment.dueDate,
    } : activeCycle ? {
      status: PAYMENT_STATUS.PENDING,
      dueDate: new Date(activeCycle.startDate).setDate(member.group.paymentWindow.endDay),
    } : null,
    recentPayments: payments.map((p) => ({
      cycleNumber: p.cycle.cycleNumber,
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt,
      isLate: p.isLate,
      lateFee: p.lateFee,
    })),
  };

  return ApiResponse.success(res, dashboard, 'Member dashboard retrieved successfully');
});

/**
 * @desc    Get overview dashboard
 * @route   GET /api/v1/dashboard/overview
 * @access  Private
 */
const getOverviewDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get all member records for user
  const memberRecords = await Member.find({ user: userId })
    .populate('group', 'name status currentCycle duration monthlyContribution');

  const groupSummaries = memberRecords.map((member) => ({
    groupId: member.group._id,
    groupName: member.group.name,
    groupStatus: member.group.status,
    role: member.role,
    turnNumber: member.turnNumber,
    currentCycle: member.group.currentCycle,
    totalCycles: member.group.duration,
    hasReceivedPayout: member.hasReceivedPayout,
    totalContributed: member.totalContributed,
    payoutAmount: member.payoutAmount,
  }));

  // Calculate totals
  const totals = memberRecords.reduce(
    (acc, member) => ({
      totalContributed: acc.totalContributed + member.totalContributed,
      totalReceived: acc.totalReceived + member.payoutAmount,
      totalPenalties: acc.totalPenalties + member.totalPenalties,
    }),
    { totalContributed: 0, totalReceived: 0, totalPenalties: 0 }
  );

  const dashboard = {
    summary: {
      totalGroups: groupSummaries.length,
      activeGroups: groupSummaries.filter((g) => g.groupStatus === 'active').length,
      completedGroups: groupSummaries.filter((g) => g.groupStatus === 'completed').length,
      ...totals,
      netPosition: totals.totalReceived - totals.totalContributed,
    },
    groups: groupSummaries,
  };

  return ApiResponse.success(res, dashboard, 'Overview dashboard retrieved successfully');
});

module.exports = {
  getGroupDashboard,
  getMemberDashboard,
  getOverviewDashboard,
};