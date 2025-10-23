const Member = require('../models/Member.model');
const penaltyService = require('../services/penalty.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get member by ID
 * @route   GET /api/v1/members/:memberId
 * @access  Private
 */
const getMemberById = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.memberId)
    .populate('user', 'name email phone avatar')
    .populate('group', 'name monthlyContribution duration');

  if (!member) {
    throw ApiError.notFound('Member not found');
  }

  return ApiResponse.success(
    res,
    { member },
    'Member retrieved successfully'
  );
});

/**
 * @desc    Update member details
 * @route   PUT /api/v1/members/:memberId
 * @access  Private
 */
const updateMember = asyncHandler(async (req, res) => {
  const { preferredPayoutAccount, notifications } = req.body;

  const member = await Member.findById(req.params.memberId);

  if (!member) {
    throw ApiError.notFound('Member not found');
  }

  // Check if user owns this member record
  if (member.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only update your own member profile');
  }

  if (preferredPayoutAccount) {
    member.preferredPayoutAccount = preferredPayoutAccount;
  }

  if (notifications) {
    member.notifications = notifications;
  }

  await member.save();

  return ApiResponse.success(
    res,
    { member },
    'Member updated successfully'
  );
});

/**
 * @desc    Get member penalties
 * @route   GET /api/v1/members/:memberId/penalties
 * @access  Private
 */
const getMemberPenalties = asyncHandler(async (req, res) => {
  const penalties = await penaltyService.getMemberPenalties(req.params.memberId);

  return ApiResponse.success(
    res,
    { penalties },
    'Penalties retrieved successfully'
  );
});

/**
 * @desc    Update member status (Admin only)
 * @route   PUT /api/v1/members/:memberId/status
 * @access  Private (Organizer only)
 */
const updateMemberStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const member = await Member.findById(req.params.memberId);

  if (!member) {
    throw ApiError.notFound('Member not found');
  }

  member.status = status;
  if (reason) {
    member.notes = reason;
  }

  if (status === 'exited') {
    member.exitedAt = new Date();
  }

  await member.save();

  return ApiResponse.success(
    res,
    { member },
    'Member status updated successfully'
  );
});

/**
 * @desc    Get member statistics
 * @route   GET /api/v1/members/:memberId/stats
 * @access  Private
 */
const getMemberStats = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.memberId)
    .populate('group');

  if (!member) {
    throw ApiError.notFound('Member not found');
  }

  const Payment = require('../models/Payment.model');
  
  const paymentStats = await Payment.aggregate([
    { $match: { member: member._id } },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: '$amount' },
        totalLateFees: { $sum: '$lateFee' },
        onTimePayments: {
          $sum: { $cond: [{ $eq: ['$isLate', false] }, 1, 0] }
        },
        latePayments: {
          $sum: { $cond: ['$isLate', 1, 0] }
        }
      }
    }
  ]);

  const stats = paymentStats[0] || {
    totalPaid: 0,
    totalLateFees: 0,
    onTimePayments: 0,
    latePayments: 0
  };

  return ApiResponse.success(
    res,
    {
      stats: {
        ...stats,
        totalContributed: member.totalContributed,
        totalPenalties: member.totalPenalties,
        payoutReceived: member.payoutAmount,
        netPosition: member.payoutAmount - member.totalContributed,
        performanceScore: member.performanceScore,
        paymentStreak: member.paymentStreak,
        missedPayments: member.missedPayments,
      }
    },
    'Member statistics retrieved successfully'
  );
});

module.exports = {
  getMemberById,
  updateMember,
  getMemberPenalties,
  updateMemberStatus,
  getMemberStats,
};