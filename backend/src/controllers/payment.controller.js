const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Record payment
 * @route   POST /api/v1/payments
 * @access  Private
 */
const recordPayment = asyncHandler(async (req, res) => {
  const paymentData = {
    ...req.body,
    memberId: req.member._id,
    userId: req.user._id,
  };

  // Add file info if uploaded
  if (req.file) {
    paymentData.proofDocument = {
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };
  }

  const payment = await paymentService.recordPayment(paymentData);

  return ApiResponse.created(
    res,
    { payment },
    'Payment recorded successfully'
  );
});

/**
 * @desc    Get payment by ID
 * @route   GET /api/v1/payments/:paymentId
 * @access  Private
 */
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.paymentId);

  return ApiResponse.success(
    res,
    { payment },
    'Payment retrieved successfully'
  );
});

/**
 * @desc    Get payments for a cycle
 * @route   GET /api/v1/payments/cycle/:cycleId
 * @access  Private
 */
const getCyclePayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getCyclePayments(req.params.cycleId);

  return ApiResponse.success(
    res,
    { payments },
    'Cycle payments retrieved successfully'
  );
});

/**
 * @desc    Get member's payment history
 * @route   GET /api/v1/payments/member/:memberId
 * @access  Private
 */
const getMemberPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await paymentService.getMemberPayments(
    req.params.memberId,
    { page: parseInt(page), limit: parseInt(limit) }
  );

  return ApiResponse.success(
    res,
    result,
    'Payment history retrieved successfully'
  );
});

/**
 * @desc    Confirm payment
 * @route   PUT /api/v1/payments/:paymentId/confirm
 * @access  Private (Organizer only)
 */
const confirmPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.confirmPayment(
    req.params.paymentId,
    req.user._id,
    req.body.adminRemarks
  );

  return ApiResponse.success(
    res,
    { payment },
    'Payment confirmed successfully'
  );
});

/**
 * @desc    Mark payment as late
 * @route   PUT /api/v1/payments/:paymentId/mark-late
 * @access  Private (Organizer only)
 */
const markPaymentLate = asyncHandler(async (req, res) => {
  const payment = await paymentService.markPaymentLate(
    req.params.paymentId,
    req.user._id
  );

  return ApiResponse.success(
    res,
    { payment },
    'Payment marked as late'
  );
});

module.exports = {
  recordPayment,
  getPaymentById,
  getCyclePayments,
  getMemberPayments,
  confirmPayment,
  markPaymentLate,
};