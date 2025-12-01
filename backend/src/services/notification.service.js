const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send email
 */
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send payment reminder
 */
const sendPaymentReminder = async (user, group, cycle, dueDate) => {
  const subject = `Payment Reminder - ${group.name}`;
  const html = `
    <h2>Payment Reminder</h2>
    <p>Dear ${user.name},</p>
    <p>This is a reminder that your payment for <strong>${group.name}</strong> is due.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Group: ${group.name}</li>
      <li>Cycle: ${cycle.cycleNumber}</li>
      <li>Amount: ₹${group.monthlyContribution}</li>
      <li>Due Date: ${dueDate.toLocaleDateString()}</li>
    </ul>
    <p>Please make your payment before the due date to avoid late fees.</p>
    <p>Best regards,<br>Peer2Loan Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send payment confirmation
 */
const sendPaymentConfirmation = async (user, group, payment) => {
  const subject = `Payment Confirmed - ${group.name}`;
  const html = `
    <h2>Payment Confirmed</h2>
    <p>Dear ${user.name},</p>
    <p>Your payment for <strong>${group.name}</strong> has been confirmed.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Amount: ₹${payment.amount}</li>
      <li>Payment Date: ${payment.paidAt.toLocaleDateString()}</li>
      <li>Status: ${payment.status}</li>
    </ul>
    <p>Thank you for your timely payment!</p>
    <p>Best regards,<br>Peer2Loan Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send payout notification
 */
const sendPayoutNotification = async (user, group, payout) => {
  const subject = `Payout Completed - ${group.name}`;
  const html = `
    <h2>Payout Completed</h2>
    <p>Dear ${user.name},</p>
    <p>Your payout from <strong>${group.name}</strong> has been processed.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Amount: ₹${payout.amount}</li>
      <li>Transfer Reference: ${payout.transferReference}</li>
      <li>Date: ${payout.completedAt.toLocaleDateString()}</li>
    </ul>
    <p>Please verify the funds in your account.</p>
    <p>Best regards,<br>Peer2Loan Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send payout pending approval notification to beneficiary
 */
const sendPayoutPendingApproval = async (user, group, payout, cycle) => {
  const subject = `Action Required: Approve Your Payout - ${group.name}`;
  const html = `
    <h2>Payout Ready for Your Approval</h2>
    <p>Dear ${user.name},</p>
    <p>Great news! Your payout from <strong>${group.name}</strong> is ready and waiting for your approval.</p>
    <p><strong>Payout Details:</strong></p>
    <ul>
      <li>Group: ${group.name}</li>
      <li>Cycle: ${cycle.cycleNumber}</li>
      <li>Amount: ₹${payout.amount?.toLocaleString()}</li>
    </ul>
    <p>Please log in to your account to review and approve this payout. Once approved, the admin will process the transfer.</p>
    <p>Best regards,<br>Peer2Loan Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send notification to admin when beneficiary approves payout
 */
const sendPayoutApprovedNotification = async (admin, beneficiary, group, payout) => {
  const subject = `Payout Approved by Beneficiary - ${group.name}`;
  const html = `
    <h2>Payout Approved</h2>
    <p>Dear ${admin.name},</p>
    <p><strong>${beneficiary.name}</strong> has approved their payout from <strong>${group.name}</strong>.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Beneficiary: ${beneficiary.name}</li>
      <li>Amount: ₹${payout.amount?.toLocaleString()}</li>
      <li>Approved At: ${new Date().toLocaleDateString()}</li>
    </ul>
    <p>Please proceed to complete the payout transfer and upload the transaction proof.</p>
    <p>Best regards,<br>Peer2Loan Team</p>
  `;

  await sendEmail(admin.email, subject, html);
};

/**
 * Send payout completed notification to beneficiary with transaction details
 */
const sendPayoutCompletedNotification = async (user, group, payout) => {
  const subject = `Payout Completed - ${group.name}`;
  const html = `
    <h2>Your Payout Has Been Completed!</h2>
    <p>Dear ${user.name},</p>
    <p>Your payout from <strong>${group.name}</strong> has been successfully processed.</p>
    <p><strong>Transaction Details:</strong></p>
    <ul>
      <li>Amount: ₹${payout.amount?.toLocaleString()}</li>
      <li>Transfer Mode: ${payout.transferMode?.replace('_', ' ')?.toUpperCase()}</li>
      ${payout.transactionId ? `<li>Transaction ID: ${payout.transactionId}</li>` : ''}
      ${payout.transferReference ? `<li>Reference: ${payout.transferReference}</li>` : ''}
      <li>Completed At: ${payout.completedAt?.toLocaleDateString()}</li>
    </ul>
    ${payout.processorRemarks ? `<p><strong>Remarks:</strong> ${payout.processorRemarks}</p>` : ''}
    <p>Please log in to your account to view the complete transaction details and proof document.</p>
    <p>If you have any questions, please contact your group admin.</p>
    <p>Best regards,<br>Peer2Loan Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send late fee notification
 */
const sendLateFeeNotification = async (user, group, payment, penalty) => {
  const subject = `Late Fee Applied - ${group.name}`;
  const html = `
    <h2>Late Fee Applied</h2>
    <p>Dear ${user.name},</p>
    <p>A late fee has been applied to your payment for <strong>${group.name}</strong>.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Original Amount: ₹${payment.amount}</li>
      <li>Late Fee: ₹${penalty.amount}</li>
      <li>Total Due: ₹${payment.amount + penalty.amount}</li>
      <li>Days Late: ${penalty.daysLate}</li>
    </ul>
    <p>Please ensure timely payments in the future to avoid additional fees.</p>
    <p>Best regards,<br>Peer2Loan Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send group invitation
 */
const sendGroupInvitation = async (user, group, invitedBy) => {
  const subject = `Group Invitation - ${group.name}`;
  const html = `
    <h2>You've Been Invited to Join a Lending Group</h2>
    <p>Dear ${user.name},</p>
    <p>${invitedBy.name} has invited you to join <strong>${group.name}</strong>.</p>
    <p><strong>Group Details:</strong></p>
    <ul>
      <li>Group Name: ${group.name}</li>
      <li>Monthly Contribution: ₹${group.monthlyContribution}</li>
      <li>Duration: ${group.duration} months</li>
      <li>Start Date: ${group.startDate.toLocaleDateString()}</li>
    </ul>
    <p>Please log in to your account to accept or decline this invitation.</p>
    <p>Best regards,<br>Peer2Loan Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

/**
 * Send default notification to organizer
 */
const sendDefaultNotification = async (organizer, member, group, missedPayments) => {
  const memberUser = await require('../models/User.model').findById(member.user);
  
  const subject = `Member Default Alert - ${group.name}`;
  const html = `
    <h2>Member Default Alert</h2>
    <p>Dear ${organizer.name},</p>
    <p>A member in your group <strong>${group.name}</strong> has defaulted on payments.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Member: ${memberUser.name}</li>
      <li>Missed Payments: ${missedPayments}</li>
      <li>Turn Number: ${member.turnNumber}</li>
    </ul>
    <p>Please take appropriate action to resolve this situation.</p>
    <p>Best regards,<br>Peer2Loan Team</p>
  `;

  await sendEmail(organizer.email, subject, html);
};

/**
 * Send upcoming turn notification
 */
const sendUpcomingTurnNotification = async (user, group, cycle) => {
  const subject = `Your Turn is Coming Up - ${group.name}`;
  const html = `
    <h2>Your Turn is Coming Up</h2>
    <p>Dear ${user.name},</p>
    <p>Your turn to receive the payout from <strong>${group.name}</strong> is coming up soon!</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Cycle: ${cycle.cycleNumber}</li>
      <li>Expected Payout: ₹${cycle.expectedAmount}</li>
      <li>Date: ${cycle.startDate.toLocaleDateString()}</li>
    </ul>
    <p>Make sure all your previous contributions are up to date.</p>
    <p>Best regards,<br>Peer2Loan Team</p>
  `;

  await sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendPaymentReminder,
  sendPaymentConfirmation,
  sendPayoutNotification,
  sendPayoutPendingApproval,
  sendPayoutApprovedNotification,
  sendPayoutCompletedNotification,
  sendLateFeeNotification,
  sendGroupInvitation,
  sendDefaultNotification,
  sendUpcomingTurnNotification,
};