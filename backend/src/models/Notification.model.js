const mongoose = require('mongoose');

const NOTIFICATION_TYPES = {
  GROUP_INVITATION: 'group_invitation',
  PAYOUT_PENDING_APPROVAL: 'payout_pending_approval',
  PAYOUT_APPROVED: 'payout_approved',
  PAYOUT_COMPLETED: 'payout_completed',
  PAYMENT_PENDING_APPROVAL: 'payment_pending_approval',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_REMINDER: 'payment_reminder',
  CYCLE_STARTED: 'cycle_started',
};

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPES),
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Related entities
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  payout: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payout'
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  // Action link
  actionUrl: {
    type: String
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  return await this.create(data);
};

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
