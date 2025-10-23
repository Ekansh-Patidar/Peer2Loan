const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  isGroupMember,
  isGroupOrganizer,
} = require('../middleware/roleCheck.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');
const validate = require('../middleware/validation.middleware');
const {
  recordPaymentValidator,
  confirmPaymentValidator,
  paymentIdValidator,
} = require('../validators/payment.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Record payment (with optional proof upload)
router.post(
  '/',
  isGroupMember,
  uploadSingle('paymentProof'),
  recordPaymentValidator,
  validate,
  paymentController.recordPayment
);

// Get payments
router.get('/cycle/:cycleId', isGroupMember, paymentController.getCyclePayments);
router.get('/member/:memberId', isGroupMember, paymentController.getMemberPayments);
router.get('/:paymentId', paymentIdValidator, validate, isGroupMember, paymentController.getPaymentById);

// Admin actions
router.put('/:paymentId/confirm', confirmPaymentValidator, validate, isGroupOrganizer, paymentController.confirmPayment);
router.put('/:paymentId/mark-late', paymentIdValidator, validate, isGroupOrganizer, paymentController.markPaymentLate);

module.exports = router;