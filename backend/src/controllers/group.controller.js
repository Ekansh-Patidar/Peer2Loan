const groupService = require('../services/group.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Create new group
 * @route   POST /api/v1/groups
 * @access  Private
 */
const createGroup = asyncHandler(async (req, res) => {
  const group = await groupService.createGroup(req.user._id, req.body);
  
  return ApiResponse.created(
    res,
    { group },
    'Group created successfully'
  );
});

/**
 * @desc    Get all groups for user
 * @route   GET /api/v1/groups
 * @access  Private
 */
const getMyGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const result = await groupService.getUserGroups(req.user._id, {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
  });
  
  return ApiResponse.success(
    res,
    result,
    'Groups retrieved successfully'
  );
});

/**
 * @desc    Get group by ID
 * @route   GET /api/v1/groups/:groupId
 * @access  Private
 */
const getGroupById = asyncHandler(async (req, res) => {
  const group = await groupService.getGroupById(
    req.params.groupId,
    req.user._id
  );
  
  return ApiResponse.success(
    res,
    { group },
    'Group retrieved successfully'
  );
});

/**
 * @desc    Update group
 * @route   PUT /api/v1/groups/:groupId
 * @access  Private (Organizer only)
 */
const updateGroup = asyncHandler(async (req, res) => {
  const group = await groupService.updateGroup(
    req.params.groupId,
    req.body
  );
  
  return ApiResponse.success(
    res,
    { group },
    'Group updated successfully'
  );
});

/**
 * @desc    Activate group (start first cycle)
 * @route   POST /api/v1/groups/:groupId/activate
 * @access  Private (Organizer only)
 */
const activateGroup = asyncHandler(async (req, res) => {
  const group = await groupService.activateGroup(req.params.groupId);
  
  return ApiResponse.success(
    res,
    { group },
    'Group activated successfully'
  );
});

/**
 * @desc    Invite member to group
 * @route   POST /api/v1/groups/:groupId/invite
 * @access  Private (Organizer only)
 */
const inviteMember = asyncHandler(async (req, res) => {
  const { email, turnNumber } = req.body;
  const member = await groupService.inviteMember(
    req.params.groupId,
    email,
    turnNumber
  );
  
  return ApiResponse.created(
    res,
    { member },
    'Member invited successfully'
  );
});

/**
 * @desc    Get group members
 * @route   GET /api/v1/groups/:groupId/members
 * @access  Private
 */
const getGroupMembers = asyncHandler(async (req, res) => {
  const members = await groupService.getGroupMembers(req.params.groupId);
  
  return ApiResponse.success(
    res,
    { members },
    'Members retrieved successfully'
  );
});

/**
 * @desc    Remove member from group
 * @route   DELETE /api/v1/groups/:groupId/members/:memberId
 * @access  Private (Organizer only)
 */
const removeMember = asyncHandler(async (req, res) => {
  await groupService.removeMember(
    req.params.groupId,
    req.params.memberId
  );
  
  return ApiResponse.success(
    res,
    null,
    'Member removed successfully'
  );
});

/**
 * @desc    Accept group invitation
 * @route   POST /api/v1/groups/:groupId/accept
 * @access  Private
 */
const acceptInvitation = asyncHandler(async (req, res) => {
  const member = await groupService.acceptInvitation(
    req.params.groupId,
    req.user._id
  );
  
  return ApiResponse.success(
    res,
    { member },
    'Invitation accepted successfully'
  );
});

/**
 * @desc    Get group statistics
 * @route   GET /api/v1/groups/:groupId/stats
 * @access  Private
 */
const getGroupStats = asyncHandler(async (req, res) => {
  const stats = await groupService.getGroupStatistics(req.params.groupId);
  
  return ApiResponse.success(
    res,
    { stats },
    'Statistics retrieved successfully'
  );
});

module.exports = {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  activateGroup,
  inviteMember,
  getGroupMembers,
  removeMember,
  acceptInvitation,
  getGroupStats,
};