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

// Get payouts
router.get('/group/:groupId', isGroupMember, payoutController.getGroupPayouts);
router.get('/:payoutId', isGroupMember, payoutController.getPayoutById);

// Execute payout (organizer only)
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