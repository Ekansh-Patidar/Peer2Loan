const payoutService = require('../services/payout.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Execute payout
 * @route   POST /api/v1/payouts
 * @access  Private (Organizer only)
 */
const executePayout = asyncHandler(async (req, res) => {
  const payoutData = {
    ...req.body,
    executedBy: req.user._id,
  };

  // Add proof document if uploaded
  if (req.file) {
    payoutData.proofDocument = {
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };
  }

  const payout = await payoutService.executePayout(payoutData);

  return ApiResponse.created(
    res,
    { payout },
    'Payout executed successfully'
  );
});

/**
 * @desc    Get payout by ID
 * @route   GET /api/v1/payouts/:payoutId
 * @access  Private
 */
const getPayoutById = asyncHandler(async (req, res) => {
  const payout = await payoutService.getPayoutById(req.params.payoutId);

  return ApiResponse.success(
    res,
    { payout },
    'Payout retrieved successfully'
  );
});

/**
 * @desc    Get group payouts
 * @route   GET /api/v1/payouts/group/:groupId
 * @access  Private
 */
const getGroupPayouts = asyncHandler(async (req, res) => {
  const payouts = await payoutService.getGroupPayouts(req.params.groupId);

  return ApiResponse.success(
    res,
    { payouts },
    'Payouts retrieved successfully'
  );
});

/**
 * @desc    Complete payout
 * @route   PUT /api/v1/payouts/:payoutId/complete
 * @access  Private (Organizer only)
 */
const completePayout = asyncHandler(async (req, res) => {
  const payout = await payoutService.completePayout(
    req.params.payoutId,
    req.body
  );

  return ApiResponse.success(
    res,
    { payout },
    'Payout marked as completed'
  );
});

/**
 * @desc    Mark payout as failed
 * @route   PUT /api/v1/payouts/:payoutId/fail
 * @access  Private (Organizer only)
 */
const markPayoutFailed = asyncHandler(async (req, res) => {
  const payout = await payoutService.markPayoutFailed(
    req.params.payoutId,
    req.body.reason
  );

  return ApiResponse.success(
    res,
    { payout },
    'Payout marked as failed'
  );
});

module.exports = {
  executePayout,
  getPayoutById,
  getGroupPayouts,
  completePayout,
  markPayoutFailed,
};