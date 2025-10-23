const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

/**
 * Middleware to handle validation errors from express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));
    
    throw ApiError.unprocessableEntity('Validation failed', formattedErrors);
  }
  
  next();
};

module.exports = validate;