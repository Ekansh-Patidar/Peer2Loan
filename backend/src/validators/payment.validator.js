const { body, param } = require('express-validator');
const { PAYMENT_MODES } = require('../config/constants');

const recordPaymentValidator = [
  body('groupId')
    .notEmpty().withMessage('Group ID is required')
    .isMongoId().withMessage('Invalid group ID'),
  
  body('cycleId')
    .notEmpty().withMessage('Cycle ID is required')
    .isMongoId().withMessage('Invalid cycle ID'),
  
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  
  body('paymentMode')
    .notEmpty().withMessage('Payment mode is required')
    .isIn(Object.values(PAYMENT_MODES)).withMessage('Invalid payment mode'),
  
  body('transactionId')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Transaction ID must be between 3 and 100 characters'),
  
  body('referenceNumber')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Reference number must be between 3 and 100 characters'),
  
  body('paidAt')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('memberRemarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters'),
];

const confirmPaymentValidator = [
  param('paymentId')
    .isMongoId().withMessage('Invalid payment ID'),
  
  body('adminRemarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters'),
];

const paymentIdValidator = [
  param('paymentId')
    .isMongoId().withMessage('Invalid payment ID'),
];

module.exports = {
  recordPaymentValidator,
  confirmPaymentValidator,
  paymentIdValidator,
};