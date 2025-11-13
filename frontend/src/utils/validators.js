import { VALIDATION_PATTERNS } from './constants';

/**
 * Validate email
 */
export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!VALIDATION_PATTERNS.EMAIL.test(email)) return 'Invalid email format';
  return null;
};

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  if (!VALIDATION_PATTERNS.PHONE.test(phone)) return 'Phone number must be 10 digits';
  return null;
};

/**
 * Validate password
 */
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!VALIDATION_PATTERNS.PASSWORD.test(password)) {
    return 'Password must contain uppercase, lowercase, and number';
  }
  return null;
};

/**
 * Validate confirm password
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate number
 */
export const validateNumber = (value, min, max, fieldName = 'Value') => {
  if (value === '' || value === null || value === undefined) {
    return `${fieldName} is required`;
  }
  
  const num = Number(value);
  
  if (isNaN(num)) return `${fieldName} must be a number`;
  if (min !== undefined && num < min) return `${fieldName} must be at least ${min}`;
  if (max !== undefined && num > max) return `${fieldName} must be at most ${max}`;
  
  return null;
};

/**
 * Validate IFSC code
 */
export const validateIFSC = (ifsc) => {
  if (!ifsc) return 'IFSC code is required';
  if (!VALIDATION_PATTERNS.IFSC.test(ifsc)) return 'Invalid IFSC code format';
  return null;
};

/**
 * Validate UPI ID
 */
export const validateUPI = (upi) => {
  if (!upi) return 'UPI ID is required';
  if (!VALIDATION_PATTERNS.UPI.test(upi)) return 'Invalid UPI ID format';
  return null;
};

/**
 * Validate account number
 */
export const validateAccountNumber = (accountNumber) => {
  if (!accountNumber) return 'Account number is required';
  if (!VALIDATION_PATTERNS.ACCOUNT_NUMBER.test(accountNumber)) {
    return 'Account number must be 9-18 digits';
  }
  return null;
};

/**
 * Validate date
 */
export const validateDate = (date, fieldName = 'Date') => {
  if (!date) return `${fieldName} is required`;
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return `Invalid ${fieldName.toLowerCase()}`;
  
  return null;
};

/**
 * Validate future date
 */
export const validateFutureDate = (date, fieldName = 'Date') => {
  const error = validateDate(date, fieldName);
  if (error) return error;
  
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dateObj < today) return `${fieldName} cannot be in the past`;
  
  return null;
};

/**
 * Validate file
 */
export const validateFile = (file, maxSize, allowedTypes) => {
  if (!file) return 'File is required';
  
  if (maxSize && file.size > maxSize) {
    return `File size must be less than ${(maxSize / (1024 * 1024)).toFixed(2)}MB`;
  }
  
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`;
  }
  
  return null;
};

/**
 * Validate form (multiple fields)
 */
export const validateForm = (fields) => {
  const errors = {};
  
  Object.keys(fields).forEach((fieldName) => {
    const field = fields[fieldName];
    const { value, validator, label } = field;
    
    if (validator) {
      const error = validator(value, label || fieldName);
      if (error) errors[fieldName] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};