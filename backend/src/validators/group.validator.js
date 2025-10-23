const { body, param } = require('express-validator');
const { TURN_ORDER_TYPES } = require('../config/constants');

const createGroupValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Group name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Group name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('monthlyContribution')
    .notEmpty().withMessage('Monthly contribution is required')
    .isFloat({ min: 100 }).withMessage('Monthly contribution must be at least ₹100'),
  
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR']).withMessage('Invalid currency'),
  
  body('memberCount')
    .notEmpty().withMessage('Member count is required')
    .isInt({ min: 3, max: 50 }).withMessage('Member count must be between 3 and 50'),
  
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  
  body('paymentWindow.startDay')
    .optional()
    .isInt({ min: 1, max: 28 }).withMessage('Payment window start day must be between 1 and 28'),
  
  body('paymentWindow.endDay')
    .optional()
    .isInt({ min: 1, max: 28 }).withMessage('Payment window end day must be between 1 and 28')
    .custom((value, { req }) => {
      const startDay = req.body.paymentWindow?.startDay || 1;
      if (value <= startDay) {
        throw new Error('Payment window end day must be after start day');
      }
      return true;
    }),
  
  body('turnOrderType')
    .notEmpty().withMessage('Turn order type is required')
    .isIn(Object.values(TURN_ORDER_TYPES)).withMessage('Invalid turn order type'),
  
  body('penaltyRules.lateFee')
    .optional()
    .isFloat({ min: 0 }).withMessage('Late fee must be a positive number'),
  
  body('penaltyRules.gracePeriodDays')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('Grace period must be between 0 and 10 days'),
  
  body('penaltyRules.defaultThreshold')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Default threshold must be between 1 and 5'),
];

const updateGroupValidator = [
  param('groupId')
    .isMongoId().withMessage('Invalid group ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Group name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('paymentWindow.startDay')
    .optional()
    .isInt({ min: 1, max: 28 }).withMessage('Payment window start day must be between 1 and 28'),
  
  body('paymentWindow.endDay')
    .optional()
    .isInt({ min: 1, max: 28 }).withMessage('Payment window end day must be between 1 and 28'),
  
  body('penaltyRules.lateFee')
    .optional()
    .isFloat({ min: 0 }).withMessage('Late fee must be a positive number'),
  
  body('penaltyRules.gracePeriodDays')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('Grace period must be between 0 and 10 days'),
];

const groupIdValidator = [
  param('groupId')
    .isMongoId().withMessage('Invalid group ID'),
];

module.exports = {
  createGroupValidator,
  updateGroupValidator,
  groupIdValidator,
};