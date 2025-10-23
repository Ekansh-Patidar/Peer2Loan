const express = require('express');
const groupController = require('../controllers/group.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  isGroupOrganizer,
  isGroupMember,
} = require('../middleware/roleCheck.middleware');
const validate = require('../middleware/validation.middleware');
const {
  createGroupValidator,
  updateGroupValidator,
  groupIdValidator,
} = require('../validators/group.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Group CRUD
router.post('/', createGroupValidator, validate, groupController.createGroup);
router.get('/', groupController.getMyGroups);
router.get('/:groupId', groupIdValidator, validate, isGroupMember, groupController.getGroupById);
router.put('/:groupId', updateGroupValidator, validate, isGroupOrganizer, groupController.updateGroup);

// Group actions
router.post('/:groupId/activate', groupIdValidator, validate, isGroupOrganizer, groupController.activateGroup);
router.post('/:groupId/accept', groupIdValidator, validate, groupController.acceptInvitation);

// Member management
router.get('/:groupId/members', groupIdValidator, validate, isGroupMember, groupController.getGroupMembers);
router.post('/:groupId/invite', groupIdValidator, validate, isGroupOrganizer, groupController.inviteMember);
router.delete('/:groupId/members/:memberId', isGroupOrganizer, groupController.removeMember);

// Statistics
router.get('/:groupId/stats', groupIdValidator, validate, isGroupMember, groupController.getGroupStats);

module.exports = router;