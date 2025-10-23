const mongoose = require('mongoose');
const { CYCLE_STATUS } = require('../config/constants');

const cycleSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  cycleNumber: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: Object.values(CYCLE_STATUS),
    default: CYCLE_STATUS.PENDING
  },
  
  // Cycle period
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Beneficiary information
  beneficiary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  turnNumber: {
    type: Number,
    required: true
  },
  
  // Financial summary
  expectedAmount: {
    type: Number,
    required: true
  },
  collectedAmount: {
    type: Number,
    default: 0
  },
  payoutAmount: {
    type: Number,
    default: 0
  },
  totalPenalties: {
    type: Number,
    default: 0
  },
  
  // Payment tracking
  totalMembers: {
    type: Number,
    required: true
  },
  paidCount: {
    type: Number,
    default: 0
  },
  pendingCount: {
    type: Number,
    default: 0
  },
  lateCount: {
    type: Number,
    default: 0
  },
  defaultedCount: {
    type: Number,
    default: 0
  },
  
  // Payout information
  isPayoutCompleted: {
    type: Boolean,
    default: false
  },
  payoutDate: {
    type: Date,
    default: null
  },
  payoutProof: {
    filename: String,
    path: String,
    uploadedAt: Date
  },
  payoutReference: {
    type: String
  },
  
  // Exception handling
  isSkipped: {
    type: Boolean,
    default: false
  },
  skipReason: {
    type: String,
    maxlength: [500, 'Skip reason cannot exceed 500 characters']
  },
  
  // Readiness check
  isReadyForPayout: {
    type: Boolean,
    default: false
  },
  readinessCheckedAt: {
    type: Date,
    default: null
  },
  
  // Completion
  completedAt: {
    type: Date,
    default: null
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Notes
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes
cycleSchema.index({ group: 1, cycleNumber: 1 }, { unique: true });
cycleSchema.index({ group: 1, status: 1 });
cycleSchema.index({ beneficiary: 1 });
cycleSchema.index({ startDate: 1, endDate: 1 });

// Virtual for collection percentage
cycleSchema.virtual('collectionPercentage').get(function() {
  if (this.expectedAmount === 0) return 0;
  return Math.round((this.collectedAmount / this.expectedAmount) * 100);
});

// Virtual for payment status summary
cycleSchema.virtual('paymentStatusSummary').get(function() {
  return {
    total: this.totalMembers,
    paid: this.paidCount,
    pending: this.pendingCount,
    late: this.lateCount,
    defaulted: this.defaultedCount
  };
});

// Method to check readiness for payout
cycleSchema.methods.checkPayoutReadiness = async function(quorumPercentage = 100) {
  const requiredPayments = Math.ceil((this.totalMembers * quorumPercentage) / 100);
  this.isReadyForPayout = this.paidCount >= requiredPayments;
  this.readinessCheckedAt = new Date();
  return await this.save();
};

// Method to update payment counts
cycleSchema.methods.updatePaymentCounts = async function() {
  const Payment = mongoose.model('Payment');
  
  const counts = await Payment.aggregate([
    { $match: { cycle: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }
    }
  ]);
  
  this.paidCount = 0;
  this.pendingCount = 0;
  this.lateCount = 0;
  this.defaultedCount = 0;
  this.collectedAmount = 0;
  
  counts.forEach(item => {
    switch (item._id) {
      case 'paid':
      case 'confirmed':
        this.paidCount += item.count;
        this.collectedAmount += item.amount;
        break;
      case 'pending':
        this.pendingCount += item.count;
        break;
      case 'late':
        this.lateCount += item.count;
        this.collectedAmount += item.amount;
        break;
      case 'defaulted':
        this.defaultedCount += item.count;
        break;
    }
  });
  
  return await this.save();
};

// Method to complete payout
cycleSchema.methods.completePayout = async function(payoutDetails, userId) {
  this.isPayoutCompleted = true;
  this.payoutDate = new Date();
  this.payoutAmount = payoutDetails.amount;
  this.payoutReference = payoutDetails.reference;
  
  if (payoutDetails.proof) {
    this.payoutProof = payoutDetails.proof;
  }
  
  this.status = CYCLE_STATUS.COMPLETED;
  this.completedAt = new Date();
  this.completedBy = userId;
  
  return await this.save();
};

// Virtuals
cycleSchema.set('toJSON', { virtuals: true });
cycleSchema.set('toObject', { virtuals: true });

const Cycle = mongoose.model('Cycle', cycleSchema);

module.exports = Cycle;