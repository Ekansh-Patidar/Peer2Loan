const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isGroupMember } = require('../middleware/roleCheck.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Group dashboard
router.get('/group/:groupId', isGroupMember, dashboardController.getGroupDashboard);

// Member dashboard
router.get('/member/:groupId', isGroupMember, dashboardController.getMemberDashboard);

// Overview dashboard (all groups)
router.get('/overview', dashboardController.getOverviewDashboard);

module.exports = router;