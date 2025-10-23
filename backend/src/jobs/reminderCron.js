const cron = require('node-cron');
const Cycle = require('../models/Cycle.model');
const Payment = require('../models/Payment.model');
const Member = require('../models/Member.model');
const Group = require('../models/Group.model');
const notificationService = require('../services/notification.service');
const penaltyService = require('../services/penalty.service');
const logger = require('../utils/logger');
const { CYCLE_STATUS, PAYMENT_STATUS } = require('../config/constants');

/**
 * Send payment reminders
 * Runs daily at 9:00 AM
 */
const sendPaymentReminders = cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('Running payment reminder job...');

    // Get all active cycles
    const activeCycles = await Cycle.find({ status: CYCLE_STATUS.ACTIVE })
      .populate('group')
      .populate('beneficiary');

    for (const cycle of activeCycles) {
      const group = cycle.group;
      
      if (!group.settings.enableReminders) {
        continue;
      }

      // Calculate reminder dates
      const dueDate = new Date(cycle.startDate);
      dueDate.setDate(group.paymentWindow.endDay);

      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - group.settings.reminderDaysBefore);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Send reminders if today is reminder date or due date
      if (
        today.getTime() === reminderDate.getTime() ||
        today.getTime() === dueDate.getTime()
      ) {
        // Get members who haven't paid
        const paidPayments = await Payment.find({
          cycle: cycle._id,
          status: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.CONFIRMED] },
        });

        const paidMemberIds = paidPayments.map((p) => p.member.toString());

        const unpaidMembers = await Member.find({
          group: group._id,
          status: 'active',
          _id: { $nin: paidMemberIds },
        }).populate('user');

        // Send reminders
        for (const member of unpaidMembers) {
          await notificationService.sendPaymentReminder(
            member.user,
            group,
            cycle,
            dueDate
          );
        }

        logger.info(`Sent ${unpaidMembers.length} payment reminders for cycle ${cycle.cycleNumber}`);
      }
    }
  } catch (error) {
    logger.error('Error in payment reminder job:', error);
  }
});

/**
 * Check for late payments and apply penalties
 * Runs daily at 10:00 AM
 */
const checkLatePayments = cron.schedule('0 10 * * *', async () => {
  try {
    logger.info('Running late payment check job...');

    const activeCycles = await Cycle.find({ status: CYCLE_STATUS.ACTIVE })
      .populate('group');

    for (const cycle of activeCycles) {
      const group = cycle.group;

      // Calculate grace period end
      const dueDate = new Date(cycle.startDate);
      dueDate.setDate(group.paymentWindow.endDay);

      const gracePeriodEnd = new Date(dueDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + group.penaltyRules.gracePeriodDays);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if grace period has ended
      if (today > gracePeriodEnd) {
        // Get pending payments
        const pendingPayments = await Payment.find({
          cycle: cycle._id,
          status: PAYMENT_STATUS.PENDING,
        });

        // Mark as late and apply penalties
        for (const payment of pendingPayments) {
          payment.status = PAYMENT_STATUS.LATE;
          payment.isLate = true;
          await payment.save();

          // Apply late fee
          await penaltyService.applyLateFee(payment, group.organizer);

          logger.info(`Marked payment ${payment._id} as late and applied penalty`);
        }
      }
    }
  } catch (error) {
    logger.error('Error in late payment check job:', error);
  }
});

/**
 * Check for defaulted members
 * Runs daily at 11:00 AM
 */
const checkDefaultedMembers = cron.schedule('0 11 * * *', async () => {
  try {
    logger.info('Running defaulted member check job...');

    const activeGroups = await Group.find({ status: 'active' });

    for (const group of activeGroups) {
      const members = await Member.find({
        group: group._id,
        status: 'active',
      });

      for (const member of members) {
        // Count missed payments
        const missedPayments = await Payment.countDocuments({
          member: member._id,
          status: PAYMENT_STATUS.DEFAULTED,
        });

        // Check against threshold
        if (missedPayments >= group.penaltyRules.defaultThreshold) {
          // Mark member as defaulted
          if (member.status !== 'defaulted') {
            member.status = 'defaulted';
            await member.save();

            // Notify organizer
            const organizer = await require('../models/User.model').findById(group.organizer);
            await notificationService.sendDefaultNotification(
              organizer,
              member,
              group,
              missedPayments
            );

            logger.info(`Member ${member._id} marked as defaulted`);
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error in defaulted member check job:', error);
  }
});

/**
 * Start all cron jobs
 */
const startCronJobs = () => {
  sendPaymentReminders.start();
  checkLatePayments.start();
  checkDefaultedMembers.start();
  logger.info('All cron jobs started');
};

/**
 * Stop all cron jobs
 */
const stopCronJobs = () => {
  sendPaymentReminders.stop();
  checkLatePayments.stop();
  checkDefaultedMembers.stop();
  logger.info('All cron jobs stopped');
};

module.exports = {
  startCronJobs,
  stopCronJobs,
};