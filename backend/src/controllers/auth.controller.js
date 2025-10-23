const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  
  return ApiResponse.created(
    res,
    result,
    'User registered successfully'
  );
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  
  return ApiResponse.success(
    res,
    result,
    'Login successful'
  );
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user._id);
  
  return ApiResponse.success(
    res,
    { user },
    'User profile retrieved successfully'
  );
});

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  
  return ApiResponse.success(
    res,
    { user },
    'Profile updated successfully'
  );
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, currentPassword, newPassword);
  
  return ApiResponse.success(
    res,
    null,
    'Password changed successfully'
  );
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // In a JWT system, logout is typically handled client-side
  // But we can log the action here
  
  return ApiResponse.success(
    res,
    null,
    'Logged out successfully'
  );
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
};