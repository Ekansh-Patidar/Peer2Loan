const cron = require('node-cron');
const Payment = require('../models/Payment.model');
const Cycle = require('../models/Cycle.model');
const Group = require('../models/Group.model');
const penaltyService = require('../services/penalty.service');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');
const { PAYMENT_STATUS } = require('../config/constants');

/**
 * Auto-apply late fees after grace period
 * Runs every day at 10:30 AM
 */
const applyLateFees = cron.schedule('30 10 * * *', async () => {
  try {
    logger.info('Running auto late fee application job...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all pending payments past grace period
    const pendingPayments = await Payment.find({
      status: PAYMENT_STATUS.PENDING,
      dueDate: { $lt: today },
    })
      .populate('member')
      .populate({ path: 'member', populate: { path: 'user' } })
      .populate('group')
      .populate('cycle');

    let appliedCount = 0;

    for (const payment of pendingPayments) {
      const group = payment.group;
      
      // Calculate if grace period has ended
      const gracePeriodEnd = new Date(payment.dueDate);
      gracePeriodEnd.setDate(
        gracePeriodEnd.getDate() + group.penaltyRules.gracePeriodDays
      );

      if (today > gracePeriodEnd) {
        // Mark payment as late
        payment.status = PAYMENT_STATUS.LATE;
        payment.isLate = true;
        
        const daysDiff = Math.floor((today - payment.dueDate) / (1000 * 60 * 60 * 24));
        payment.daysLate = daysDiff;
        
        await payment.save();

        // Apply late fee
        const penalty = await penaltyService.applyLateFee(
          payment,
          group.organizer
        );

        // Send notification
        if (payment.member.user) {
          await notificationService.sendLateFeeNotification(
            payment.member.user,
            group,
            payment,
            penalty
          );
        }

        appliedCount++;
        logger.info(
          `Late fee applied to payment ${payment._id} for member ${payment.member._id}`
        );
      }
    }

    logger.info(`Applied late fees to ${appliedCount} payments`);
  } catch (error) {
    logger.error('Error in auto late fee application job:', error);
  }
});

/**
 * Escalate repeated late payments
 * Runs every day at 11:30 AM
 */
const escalateRepeatedLatePayments = cron.schedule('30 11 * * *', async () => {
  try {
    logger.info('Running repeated late payment escalation job...');

    const Member = require('../models/Member.model');
    const User = require('../models/User.model');

    // Find members with multiple late payments
    const members = await Member.find({ status: 'active' }).populate('group');

    for (const member of members) {
      const latePaymentCount = await Payment.countDocuments({
        member: member._id,
        isLate: true,
      });

      // If member has 3+ late payments, notify organizer
      if (latePaymentCount >= 3 && member.latePayments !== latePaymentCount) {
        member.latePayments = latePaymentCount;
        member.calculatePerformanceScore();
        await member.save();

        // Notify organizer
        const organizer = await User.findById(member.group.organizer);
        const memberUser = await User.findById(member.user);

        if (organizer && memberUser) {
          const subject = `Repeated Late Payments Alert - ${member.group.name}`;
          const html = `
            <h2>Repeated Late Payments Alert</h2>
            <p>Dear ${organizer.name},</p>
            <p><strong>${memberUser.name}</strong> has <strong>${latePaymentCount}</strong> late payments in <strong>${member.group.name}</strong>.</p>
            <p>Performance Score: ${member.performanceScore}/100</p>
            <p>Please review and take appropriate action.</p>
            <p>Best regards,<br>Peer2Loan Team</p>
          `;

          await notificationService.sendEmail(organizer.email, subject, html);
        }

        logger.info(
          `Escalated repeated late payments for member ${member._id}`
        );
      }
    }
  } catch (error) {
    logger.error('Error in repeated late payment escalation job:', error);
  }
});

/**
 * Auto-mark defaulted payments
 * Runs every day at 12:00 PM
 */
const markDefaultedPayments = cron.schedule('0 12 * * *', async () => {
  try {
    logger.info('Running auto defaulted payment marking job...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find late payments that exceed default threshold
    const latePayments = await Payment.find({
      status: PAYMENT_STATUS.LATE,
    })
      .populate('member')
      .populate('group')
      .populate('cycle');

    let markedCount = 0;

    for (const payment of latePayments) {
      const group = payment.group;
      
      // Calculate days since due date
      const daysSinceDue = Math.floor(
        (today - payment.dueDate) / (1000 * 60 * 60 * 24)
      );

      // If exceeded default threshold (e.g., 30 days or based on group settings)
      const defaultThresholdDays = group.penaltyRules.defaultThreshold * 10; // 10 days per missed payment

      if (daysSinceDue > defaultThresholdDays) {
        payment.status = PAYMENT_STATUS.DEFAULTED;
        await payment.save();

        // Update member missed payments
        const member = payment.member;
        member.missedPayments += 1;
        member.calculatePerformanceScore();
        await member.save();

        // Apply default penalty
        await penaltyService.applyDefaultPenalty(
          member._id,
          group._id,
          payment.cycle,
          group.organizer
        );

        markedCount++;
        logger.info(
          `Payment ${payment._id} marked as defaulted for member ${member._id}`
        );
      }
    }

    logger.info(`Marked ${markedCount} payments as defaulted`);
  } catch (error) {
    logger.error('Error in auto defaulted payment marking job:', error);
  }
});

/**
 * Send penalty payment reminders
 * Runs every Monday at 9:00 AM
 */
const sendPenaltyReminders = cron.schedule('0 9 * * 1', async () => {
  try {
    logger.info('Running penalty payment reminder job...');

    const Penalty = require('../models/Penalty.model');
    const Member = require('../models/Member.model');
    const User = require('../models/User.model');

    // Find unpaid penalties
    const unpaidPenalties = await Penalty.find({
      isPaid: false,
      isWaived: false,
    })
      .populate('member')
      .populate('group');

    const memberPenalties = {};

    // Group penalties by member
    for (const penalty of unpaidPenalties) {
      const memberId = penalty.member._id.toString();
      if (!memberPenalties[memberId]) {
        memberPenalties[memberId] = {
          member: penalty.member,
          group: penalty.group,
          penalties: [],
          totalAmount: 0,
        };
      }
      memberPenalties[memberId].penalties.push(penalty);
      memberPenalties[memberId].totalAmount += penalty.amount;
    }

    // Send reminders
    for (const data of Object.values(memberPenalties)) {
      const user = await User.findById(data.member.user);
      
      if (user) {
        const subject = `Penalty Payment Reminder - ${data.group.name}`;
        const html = `
          <h2>Penalty Payment Reminder</h2>
          <p>Dear ${user.name},</p>
          <p>You have <strong>${data.penalties.length}</strong> unpaid penalties in <strong>${data.group.name}</strong>.</p>
          <p><strong>Total Amount Due: ₹${data.totalAmount}</strong></p>
          <p><strong>Penalty Details:</strong></p>
          <ul>
            ${data.penalties.map(p => `<li>${p.type}: ₹${p.amount} - ${p.reason}</li>`).join('')}
          </ul>
          <p>Please clear your penalties to maintain good standing in the group.</p>
          <p>Best regards,<br>Peer2Loan Team</p>
        `;

        await notificationService.sendEmail(user.email, subject, html);
      }
    }

    logger.info(
      `Sent penalty reminders to ${Object.keys(memberPenalties).length} members`
    );
  } catch (error) {
    logger.error('Error in penalty reminder job:', error);
  }
});

/**
 * Start penalty-related cron jobs
 */
const startPenaltyCronJobs = () => {
  applyLateFees.start();
  escalateRepeatedLatePayments.start();
  markDefaultedPayments.start();
  sendPenaltyReminders.start();
  logger.info('Penalty cron jobs started');
};

/**
 * Stop penalty-related cron jobs
 */
const stopPenaltyCronJobs = () => {
  applyLateFees.stop();
  escalateRepeatedLatePayments.stop();
  markDefaultedPayments.stop();
  sendPenaltyReminders.stop();
  logger.info('Penalty cron jobs stopped');
};

module.exports = {
  startPenaltyCronJobs,
  stopPenaltyCronJobs,
};