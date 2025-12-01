const mongoose = require('mongoose');
const { MEMBER_STATUS, GROUP_ROLES } = require('../config/constants');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  role: {
    type: String,
    enum: Object.values(GROUP_ROLES),
    default: GROUP_ROLES.MEMBER
  },
  status: {
    type: String,
    enum: Object.values(MEMBER_STATUS),
    default: MEMBER_STATUS.INVITED
  },
  
  // Member preferences
  preferredPayoutAccount: {
    accountType: {
      type: String,
      enum: ['bank', 'upi'],
      default: 'upi'
    },
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    accountHolderName: String
  },
  
  // Turn information
  turnNumber: {
    type: Number,
    required: true // Assigned when member joins
  },
  scheduledPayoutMonth: {
    type: Number // Month number (1-based) when member receives payout
  },
  hasReceivedPayout: {
    type: Boolean,
    default: false
  },
  payoutReceivedAt: {
    type: Date,
    default: null
  },
  payoutAmount: {
    type: Number,
    default: 0,
    set: function(val) {
      return Math.round(Number(val));
    },
    get: function(val) {
      return Math.round(Number(val));
    }
  },
  
  // Payment tracking
  totalContributed: {
    type: Number,
    default: 0,
    set: function(val) {
      return Math.round(Number(val));
    },
    get: function(val) {
      return Math.round(Number(val));
    }
  },
  totalPenalties: {
    type: Number,
    default: 0,
    set: function(val) {
      return Math.round(Number(val));
    },
    get: function(val) {
      return Math.round(Number(val));
    }
  },
  missedPayments: {
    type: Number,
    default: 0
  },
  latePayments: {
    type: Number,
    default: 0
  },
  paymentStreak: {
    type: Number,
    default: 0 // Consecutive on-time payments
  },
  
  // Performance score
  performanceScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  
  // Dates
  joinedAt: {
    type: Date,
    default: Date.now
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  exitedAt: {
    type: Date,
    default: null
  },
  
  // Notifications preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  
  // Notes and tags
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Compound index to ensure unique user-group combination
memberSchema.index({ user: 1, group: 1 }, { unique: true });
memberSchema.index({ group: 1, status: 1 });
memberSchema.index({ group: 1, turnNumber: 1 });

// Virtual for net position
memberSchema.virtual('netPosition').get(function() {
  return this.payoutAmount - this.totalContributed;
});

// Method to accept invitation
memberSchema.methods.acceptInvitation = function() {
  this.status = MEMBER_STATUS.ACTIVE;
  this.acceptedAt = new Date();
  return this.save();
};

// Method to calculate performance score
memberSchema.methods.calculatePerformanceScore = function() {
  const baseScore = 100;
  const missedPaymentPenalty = this.missedPayments * 10;
  const latePaymentPenalty = this.latePayments * 5;
  const streakBonus = Math.min(this.paymentStreak * 2, 20);
  
  this.performanceScore = Math.max(
    0,
    Math.min(100, baseScore - missedPaymentPenalty - latePaymentPenalty + streakBonus)
  );
  
  return this.performanceScore;
};

// Virtuals
memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;