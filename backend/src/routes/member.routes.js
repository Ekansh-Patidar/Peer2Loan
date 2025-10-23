const express = require('express');
const memberController = require('../controllers/member.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isGroupOrganizer, isGroupMember } = require('../middleware/roleCheck.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get member details
router.get('/:memberId', isGroupMember, memberController.getMemberById);

// Update member (self)
router.put('/:memberId', memberController.updateMember);

// Get member penalties
router.get('/:memberId/penalties', isGroupMember, memberController.getMemberPenalties);

// Get member statistics
router.get('/:memberId/stats', isGroupMember, memberController.getMemberStats);

// Update member status (organizer only)
router.put('/:memberId/status', isGroupOrganizer, memberController.updateMemberStatus);

module.exports = router;