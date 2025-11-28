const mongoose = require('mongoose');
const { GROUP_STATUS, TURN_ORDER_TYPES, DEFAULTS } = require('../config/constants');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    minlength: [3, 'Group name must be at least 3 characters'],
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(GROUP_STATUS),
    default: GROUP_STATUS.DRAFT
  },
  
  // Financial configuration
  monthlyContribution: {
    type: Number,
    required: [true, 'Monthly contribution amount is required'],
    min: [100, 'Monthly contribution must be at least ₹100']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  memberCount: {
    type: Number,
    required: [true, 'Member count is required'],
    min: [3, 'Minimum 3 members required'],
    max: [50, 'Maximum 50 members allowed']
  },
  duration: {
    type: Number,
    required: true,
    // Duration equals member count (each member gets one turn)
  },
  
  // Schedule configuration
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date
  },
  paymentWindow: {
    startDay: {
      type: Number,
      default: DEFAULTS.PAYMENT_WINDOW_START,
      min: 1,
      max: 28
    },
    endDay: {
      type: Number,
      default: DEFAULTS.PAYMENT_WINDOW_END,
      min: 1,
      max: 28
    }
  },
  
  // Turn order configuration
  turnOrderType: {
    type: String,
    enum: Object.values(TURN_ORDER_TYPES),
    default: TURN_ORDER_TYPES.FIXED,
    required: true
  },
  turnOrder: [{
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    turnNumber: Number,
    scheduledMonth: Number, // 1-based month number
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  
  // Penalty rules
  penaltyRules: {
    lateFee: {
      type: Number,
      default: DEFAULTS.LATE_FEE
    },
    gracePeriodDays: {
      type: Number,
      default: DEFAULTS.GRACE_PERIOD_DAYS,
      min: 0,
      max: 10
    },
    defaultThreshold: {
      type: Number,
      default: DEFAULTS.DEFAULT_THRESHOLD,
      min: 1,
      max: 5
    },
    compoundPenalty: {
      type: Boolean,
      default: false
    }
  },
  
  // Group statistics
  stats: {
    totalCollected: {
      type: Number,
      default: 0,
      set: function(val) {
        return Math.round(val * 100) / 100;
      },
      get: function(val) {
        return Math.round(val * 100) / 100;
      }
    },
    totalDisbursed: {
      type: Number,
      default: 0,
      set: function(val) {
        return Math.round(val * 100) / 100;
      },
      get: function(val) {
        return Math.round(val * 100) / 100;
      }
    },
    totalPenalties: {
      type: Number,
      default: 0,
      set: function(val) {
        return Math.round(val * 100) / 100;
      },
      get: function(val) {
        return Math.round(val * 100) / 100;
      }
    },
    completedCycles: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    }
  },
  
  // Current cycle info
  currentCycle: {
    type: Number,
    default: 0 // 0 means not started, 1-N for active cycles
  },
  
  // Settings
  settings: {
    allowMidCycleExit: {
      type: Boolean,
      default: false
    },
    requirePaymentProof: {
      type: Boolean,
      default: true
    },
    autoConfirmPayments: {
      type: Boolean,
      default: false
    },
    enableReminders: {
      type: Boolean,
      default: true
    },
    reminderDaysBefore: {
      type: Number,
      default: DEFAULTS.REMINDER_DAYS_BEFORE
    }
  },
  
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Virtual for pot amount
groupSchema.virtual('potAmount').get(function() {
  return this.monthlyContribution * this.memberCount;
});

// Calculate end date based on start date and duration
groupSchema.pre('save', function(next) {
  if (this.startDate && this.duration && !this.endDate) {
    const endDate = new Date(this.startDate);
    endDate.setMonth(endDate.getMonth() + this.duration);
    this.endDate = endDate;
  }
  next();
});

// Indexes
groupSchema.index({ organizer: 1 });
groupSchema.index({ status: 1 });
groupSchema.index({ startDate: 1 });
groupSchema.index({ 'turnOrder.memberId': 1 });

// Virtuals
groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;