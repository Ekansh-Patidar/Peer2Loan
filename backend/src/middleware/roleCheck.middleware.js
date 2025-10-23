const Member = require('../models/Member.model');
const Group = require('../models/Group.model');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { GROUP_ROLES } = require('../config/constants');

/**
 * Check if user is group organizer
 */
const isGroupOrganizer = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId || req.body.groupId;

  if (!groupId) {
    throw ApiError.badRequest('Group ID is required');
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  if (group.organizer.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only group organizer can perform this action');
  }

  req.group = group;
  next();
});

/**
 * Check if user is group member
 */
const isGroupMember = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId || req.body.groupId;

  if (!groupId) {
    throw ApiError.badRequest('Group ID is required');
  }

  const member = await Member.findOne({
    user: req.user._id,
    group: groupId,
    status: { $in: ['active', 'invited'] },
  }).populate('group');

  if (!member) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  req.member = member;
  req.group = member.group;
  next();
});

/**
 * Check if user is organizer or auditor
 */
const isOrganizerOrAuditor = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId || req.body.groupId;

  if (!groupId) {
    throw ApiError.badRequest('Group ID is required');
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  // Check if organizer
  if (group.organizer.toString() === req.user._id.toString()) {
    req.group = group;
    req.role = GROUP_ROLES.ORGANIZER;
    return next();
  }

  // Check if auditor
  const member = await Member.findOne({
    user: req.user._id,
    group: groupId,
    role: GROUP_ROLES.AUDITOR,
    status: 'active',
  });

  if (!member) {
    throw ApiError.forbidden('Access denied. Organizer or auditor role required');
  }

  req.group = group;
  req.member = member;
  req.role = GROUP_ROLES.AUDITOR;
  next();
});

/**
 * Check if user has specific role in group
 */
const hasGroupRole = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    const groupId = req.params.groupId || req.body.groupId;

    if (!groupId) {
      throw ApiError.badRequest('Group ID is required');
    }

    const group = await Group.findById(groupId);

    if (!group) {
      throw ApiError.notFound('Group not found');
    }

    // Check if organizer
    if (
      allowedRoles.includes(GROUP_ROLES.ORGANIZER) &&
      group.organizer.toString() === req.user._id.toString()
    ) {
      req.group = group;
      req.role = GROUP_ROLES.ORGANIZER;
      return next();
    }

    // Check member role
    const member = await Member.findOne({
      user: req.user._id,
      group: groupId,
      status: 'active',
    });

    if (!member || !allowedRoles.includes(member.role)) {
      throw ApiError.forbidden(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }

    req.group = group;
    req.member = member;
    req.role = member.role;
    next();
  });
};

module.exports = {
  isGroupOrganizer,
  isGroupMember,
  isOrganizerOrAuditor,
  hasGroupRole,
};