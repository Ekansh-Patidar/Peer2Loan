const express = require('express');
const authRoutes = require('./auth.routes');
const groupRoutes = require('./group.routes');
const memberRoutes = require('./member.routes');
const paymentRoutes = require('./payment.routes');
const payoutRoutes = require('./payout.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes = require('./report.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);
router.use('/members', memberRoutes);
router.use('/payments', paymentRoutes);
router.use('/payouts', payoutRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;