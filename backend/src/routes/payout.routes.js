const express = require('express');
const payoutController = require('../controllers/payout.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  isGroupOrganizer,
  isGroupMember,
} = require('../middleware/roleCheck.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get pending payouts for current user (beneficiary)
router.get('/pending', payoutController.getPendingPayouts);

// Get payouts
router.get('/group/:groupId', isGroupMember, payoutController.getGroupPayouts);
router.get('/:payoutId', payoutController.getPayoutById);

// Initiate payout (organizer starts the process)
router.post(
  '/initiate',
  isGroupOrganizer,
  payoutController.initiatePayout
);

// Approve payout (beneficiary approves)
router.put('/:payoutId/approve', payoutController.approvePayout);

// Execute/Complete payout (organizer completes with transaction details)
router.post(
  '/',
  uploadSingle('payoutProof'),
  isGroupOrganizer,
  payoutController.executePayout
);

// Update payout status
router.put('/:payoutId/complete', isGroupOrganizer, payoutController.completePayout);
router.put('/:payoutId/fail', isGroupOrganizer, payoutController.markPayoutFailed);

module.exports = router;