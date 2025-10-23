const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/apiError');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register new user
 */
const register = async (userData) => {
  const { name, email, phone, password } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw ApiError.conflict('Email already registered');
    }
    if (existingUser.phone === phone) {
      throw ApiError.conflict('Phone number already registered');
    }
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
  });

  // Generate token
  const token = generateToken(user._id);

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Login user
 */
const login = async (email, password) => {
  // Find user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Get user profile
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
};

/**
 * Update user profile
 */
const updateProfile = async (userId, updateData) => {
  // Fields that can be updated
  const allowedUpdates = [
    'name',
    'phone',
    'avatar',
    'bankDetails',
    'emergencyContact',
  ];

  const updates = {};
  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  // Check if phone number is being changed and already exists
  if (updates.phone) {
    const existingUser = await User.findOne({
      phone: updates.phone,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw ApiError.conflict('Phone number already in use');
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
};

/**
 * Change password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();
};

module.exports = {
  register,
  login,
  getUserProfile,
  updateProfile,
  changePassword,
  generateToken,
};