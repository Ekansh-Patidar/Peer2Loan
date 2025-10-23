const { param, query } = require('express-validator');

/**
 * Validate MongoDB ObjectId
 */
const objectIdValidator = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
];

/**
 * Validate pagination parameters
 */
const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];

/**
 * Validate date range
 */
const dateRangeValidator = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const start = new Date(req.query.startDate);
        const end = new Date(value);
        if (end < start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
];

/**
 * Validate search query
 */
const searchValidator = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
];

/**
 * Validate status filter
 */
const statusValidator = (allowedStatuses) => [
  query('status')
    .optional()
    .isIn(allowedStatuses)
    .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),
];

/**
 * Validate sort parameters
 */
const sortValidator = (allowedFields) => [
  query('sortBy')
    .optional()
    .isIn(allowedFields)
    .withMessage(`Sort field must be one of: ${allowedFields.join(', ')}`),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
];

/**
 * Validate amount
 */
const amountValidator = (fieldName = 'amount') => [
  query(fieldName)
    .optional()
    .isFloat({ min: 0 })
    .withMessage(`${fieldName} must be a positive number`)
    .toFloat(),
];

module.exports = {
  objectIdValidator,
  paginationValidator,
  dateRangeValidator,
  searchValidator,
  statusValidator,
  sortValidator,
  amountValidator,
};