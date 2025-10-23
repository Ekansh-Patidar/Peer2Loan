const cron = require('node-cron');
const Cycle = require('../models/Cycle.model');
const Group = require('../models/Group.model');
const Member = require('../models/Member.model');
const Payment = require('../models/Payment.model');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');
const { CYCLE_STATUS, PAYMENT_STATUS } = require('../config/constants');

/**
 * Check and activate pending cycles
 * Runs every day at 00:01 AM
 */
const activatePendingCycles = cron.schedule('1 0 * * *', async () => {
  try {
    logger.info('Running cycle activation check job...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find cycles that should start today
    const pendingCycles = await Cycle.find({
      status: CYCLE_STATUS.PENDING,
      startDate: { $lte: today },
    }).populate('group');

    for (const cycle of pendingCycles) {
      // Activate the cycle
      cycle.status = CYCLE_STATUS.ACTIVE;
      await cycle.save();

      // Update group current cycle
      const group = await Group.findById(cycle.group._id);
      group.currentCycle = cycle.cycleNumber;
      await group.save();

      // Create payment records for all active members
      const members = await Member.find({
        group: group._id,
        status: 'active',
      });

      const dueDate = new Date(cycle.startDate);
      dueDate.setDate(group.paymentWindow.endDay);

      for (const member of members) {
        await Payment.create({
          group: group._id,
          member: member._id,
          cycle: cycle._id,
          cycleNumber: cycle.cycleNumber,
          amount: group.monthlyContribution,
          status: PAYMENT_STATUS.PENDING,
          dueDate: dueDate,
        });
      }

      // Update cycle payment counts
      await cycle.updatePaymentCounts();

      logger.info(`Activated cycle ${cycle.cycleNumber} for group ${group.name}`);

      // Send notifications to all members
      for (const member of members) {
        const User = require('../models/User.model');
        const user = await User.findById(member.user);
        
        if (user) {
          const subject = `New Cycle Started - ${group.name}`;
          const html = `
            <h2>New Cycle Started</h2>
            <p>Dear ${user.name},</p>
            <p>Cycle ${cycle.cycleNumber} has started for <strong>${group.name}</strong>.</p>
            <p><strong>Details:</strong></p>
            <ul>
              <li>Cycle: ${cycle.cycleNumber} of ${group.duration}</li>
              <li>Monthly Contribution: ₹${group.monthlyContribution}</li>
              <li>Due Date: ${dueDate.toLocaleDateString()}</li>
              <li>This month's beneficiary: Turn #${cycle.turnNumber}</li>
            </ul>
            <p>Please make your payment before the due date.</p>
            <p>Best regards,<br>Peer2Loan Team</p>
          `;

          await notificationService.sendEmail(user.email, subject, html);
        }
      }
    }

    logger.info(`Activated ${pendingCycles.length} cycles`);
  } catch (error) {
    logger.error('Error in cycle activation job:', error);
  }
});

/**
 * Check cycle readiness for payout
 * Runs every day at 2:00 PM
 */
const checkCycleReadiness = cron.schedule('0 14 * * *', async () => {
  try {
    logger.info('Running cycle readiness check job...');

    const activeCycles = await Cycle.find({
      status: CYCLE_STATUS.ACTIVE,
      isPayoutCompleted: false,
    })
      .populate('group')
      .populate('beneficiary')
      .populate({ path: 'beneficiary', populate: { path: 'user' } });

    for (const cycle of activeCycles) {
      // Update payment counts
      await cycle.updatePaymentCounts();

      // Check if ready for payout (100% or configurable quorum)
      const quorumPercentage = cycle.group.settings?.payoutQuorum || 100;
      await cycle.checkPayoutReadiness(quorumPercentage);

      // If ready and not notified yet, notify organizer
      if (cycle.isReadyForPayout && !cycle.readinessNotified) {
        const User = require('../models/User.model');
        const organizer = await User.findById(cycle.group.organizer);

        if (organizer) {
          const subject = `Cycle Ready for Payout - ${cycle.group.name}`;
          const html = `
            <h2>Cycle Ready for Payout</h2>
            <p>Dear ${organizer.name},</p>
            <p>Cycle ${cycle.cycleNumber} of <strong>${cycle.group.name}</strong> is ready for payout.</p>
            <p><strong>Details:</strong></p>
            <ul>
              <li>Collected Amount: ₹${cycle.collectedAmount}</li>
              <li>Expected Amount: ₹${cycle.expectedAmount}</li>
              <li>Payments Received: ${cycle.paidCount}/${cycle.totalMembers}</li>
              <li>Beneficiary: ${cycle.beneficiary.user.name} (Turn #${cycle.beneficiary.turnNumber})</li>
            </ul>
            <p>Please log in to execute the payout.</p>
            <p>Best regards,<br>Peer2Loan Team</p>
          `;

          await notificationService.sendEmail(organizer.email, subject, html);
          
          // Mark as notified (add field to schema if needed)
          cycle.readinessNotified = true;
          await cycle.save();
        }

        logger.info(`Notified organizer about cycle ${cycle.cycleNumber} readiness`);
      }
    }
  } catch (error) {
    logger.error('Error in cycle readiness check job:', error);
  }
});

/**
 * Auto-complete overdue cycles
 * Runs every day at 3:00 AM
 */
const autoCompleteOverdueCycles = cron.schedule('0 3 * * *', async () => {
  try {
    logger.info('Running overdue cycle completion job...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find cycles that have ended but not completed
    const overdueCycles = await Cycle.find({
      status: CYCLE_STATUS.ACTIVE,
      endDate: { $lt: today },
      isPayoutCompleted: false,
    }).populate('group');

    for (const cycle of overdueCycles) {
      const daysPastEnd = Math.floor(
        (today - cycle.endDate) / (1000 * 60 * 60 * 24)
      );

      // If cycle is 7+ days overdue, auto-close it
      if (daysPastEnd >= 7) {
        cycle.status = CYCLE_STATUS.COMPLETED;
        cycle.completedAt = new Date();
        cycle.notes = `Auto-completed after ${daysPastEnd} days overdue`;
        await cycle.save();

        logger.info(
          `Auto-completed overdue cycle ${cycle.cycleNumber} for group ${cycle.group.name}`
        );

        // Notify organizer
        const User = require('../models/User.model');
        const organizer = await User.findById(cycle.group.organizer);

        if (organizer) {
          const subject = `Cycle Auto-Completed - ${cycle.group.name}`;
          const html = `
            <h2>Cycle Auto-Completed</h2>
            <p>Dear ${organizer.name},</p>
            <p>Cycle ${cycle.cycleNumber} of <strong>${cycle.group.name}</strong> has been automatically completed after being ${daysPastEnd} days overdue.</p>
            <p><strong>Final Status:</strong></p>
            <ul>
              <li>Collected Amount: ₹${cycle.collectedAmount}</li>
              <li>Expected Amount: ₹${cycle.expectedAmount}</li>
              <li>Payments Received: ${cycle.paidCount}/${cycle.totalMembers}</li>
              <li>Payout Completed: ${cycle.isPayoutCompleted ? 'Yes' : 'No'}</li>
            </ul>
            <p>Please review and take necessary action.</p>
            <p>Best regards,<br>Peer2Loan Team</p>
          `;

          await notificationService.sendEmail(organizer.email, subject, html);
        }
      }
    }
  } catch (error) {
    logger.error('Error in overdue cycle completion job:', error);
  }
});

/**
 * Send upcoming turn notifications
 * Runs every day at 9:00 AM
 */
const sendUpcomingTurnNotifications = cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('Running upcoming turn notification job...');

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Find cycles starting in the next 7 days
    const upcomingCycles = await Cycle.find({
      status: CYCLE_STATUS.PENDING,
      startDate: { $gte: today, $lte: nextWeek },
    })
      .populate('group')
      .populate('beneficiary')
      .populate({ path: 'beneficiary', populate: { path: 'user' } });

    for (const cycle of upcomingCycles) {
      const beneficiary = cycle.beneficiary;
      
      if (beneficiary && beneficiary.user) {
        await notificationService.sendUpcomingTurnNotification(
          beneficiary.user,
          cycle.group,
          cycle
        );

        logger.info(
          `Sent upcoming turn notification to member ${beneficiary.user.name} for cycle ${cycle.cycleNumber}`
        );
      }
    }
  } catch (error) {
    logger.error('Error in upcoming turn notification job:', error);
  }
});

/**
 * Update cycle statistics
 * Runs every 6 hours
 */
const updateCycleStatistics = cron.schedule('0 */6 * * *', async () => {
  try {
    logger.info('Running cycle statistics update job...');

    const activeCycles = await Cycle.find({
      status: CYCLE_STATUS.ACTIVE,
    });

    for (const cycle of activeCycles) {
      await cycle.updatePaymentCounts();
      await cycle.checkPayoutReadiness();
    }

    logger.info(`Updated statistics for ${activeCycles.length} active cycles`);
  } catch (error) {
    logger.error('Error in cycle statistics update job:', error);
  }
});

/**
 * Check and close completed groups
 * Runs every day at 1:00 AM
 */
const closeCompletedGroups = cron.schedule('0 1 * * *', async () => {
  try {
    logger.info('Running completed group closure job...');

    const activeGroups = await Group.find({ status: 'active' });

    for (const group of activeGroups) {
      // Check if all cycles are completed
      const totalCycles = await Cycle.countDocuments({ group: group._id });
      const completedCycles = await Cycle.countDocuments({
        group: group._id,
        status: CYCLE_STATUS.COMPLETED,
      });

      if (totalCycles === completedCycles && totalCycles === group.duration) {
        // All cycles completed, close the group
        group.status = 'completed';
        group.completedAt = new Date();
        await group.save();

        logger.info(`Closed completed group: ${group.name}`);

        // Notify all members
        const members = await Member.find({ group: group._id }).populate('user');
        const User = require('../models/User.model');
        const organizer = await User.findById(group.organizer);

        for (const member of members) {
          if (member.user) {
            const subject = `Group Completed - ${group.name}`;
            const html = `
              <h2>Group Completed Successfully</h2>
              <p>Dear ${member.user.name},</p>
              <p>The lending group <strong>${group.name}</strong> has successfully completed all ${group.duration} cycles!</p>
              <p><strong>Your Summary:</strong></p>
              <ul>
                <li>Total Contributed: ₹${member.totalContributed}</li>
                <li>Payout Received: ₹${member.payoutAmount}</li>
                <li>Net Position: ₹${member.payoutAmount - member.totalContributed}</li>
                <li>Performance Score: ${member.performanceScore}/100</li>
              </ul>
              <p>Thank you for being part of this group!</p>
              <p>Best regards,<br>Peer2Loan Team</p>
            `;

            await notificationService.sendEmail(member.user.email, subject, html);
          }
        }

        // Send summary to organizer
        if (organizer) {
          const subject = `Group Completed - ${group.name}`;
          const html = `
            <h2>Group Completed Successfully</h2>
            <p>Dear ${organizer.name},</p>
            <p>Your lending group <strong>${group.name}</strong> has successfully completed all cycles!</p>
            <p><strong>Final Statistics:</strong></p>
            <ul>
              <li>Total Collected: ₹${group.stats.totalCollected}</li>
              <li>Total Disbursed: ₹${group.stats.totalDisbursed}</li>
              <li>Total Penalties: ₹${group.stats.totalPenalties}</li>
              <li>Active Members: ${group.stats.activeMembers}</li>
            </ul>
            <p>You can view detailed reports in your dashboard.</p>
            <p>Best regards,<br>Peer2Loan Team</p>
          `;

          await notificationService.sendEmail(organizer.email, subject, html);
        }
      }
    }
  } catch (error) {
    logger.error('Error in completed group closure job:', error);
  }
});

/**
 * Start all cycle management cron jobs
 */
const startCycleManagerJobs = () => {
  activatePendingCycles.start();
  checkCycleReadiness.start();
  autoCompleteOverdueCycles.start();
  sendUpcomingTurnNotifications.start();
  updateCycleStatistics.start();
  closeCompletedGroups.start();
  logger.info('Cycle manager jobs started');
};

/**
 * Stop all cycle management cron jobs
 */
const stopCycleManagerJobs = () => {
  activatePendingCycles.stop();
  checkCycleReadiness.stop();
  autoCompleteOverdueCycles.stop();
  sendUpcomingTurnNotifications.stop();
  updateCycleStatistics.stop();
  closeCompletedGroups.stop();
  logger.info('Cycle manager jobs stopped');
};

module.exports = {
  startCycleManagerJobs,
  stopCycleManagerJobs,
};