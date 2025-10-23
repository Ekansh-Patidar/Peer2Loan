const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isGroupMember } = require('../middleware/roleCheck.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Reports
router.get('/group/:groupId/ledger', isGroupMember, reportController.getGroupLedger);
router.get('/group/:groupId/monthly/:cycleNumber', isGroupMember, reportController.getMonthlySummary);
router.get('/member/:memberId/ledger', isGroupMember, reportController.getMemberLedger);
router.get('/group/:groupId/audit-log', isGroupMember, reportController.getAuditLog);

// Export reports
router.get('/group/:groupId/export/csv', isGroupMember, reportController.exportGroupCSV);
router.get('/group/:groupId/export/pdf', isGroupMember, reportController.exportGroupPDF);

module.exports = router;