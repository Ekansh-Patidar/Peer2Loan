const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  cycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cycle',
    required: true
  },
  
  // Penalty details
  type: {
    type: String,
    enum: ['late_fee', 'default_penalty', 'custom'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Penalty amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Reason and calculation
  reason: {
    type: String,
    required: [true, 'Penalty reason is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  daysLate: {
    type: Number,
    default: 0
  },
  
  // Status
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date,
    default: null
  },
  isWaived: {
    type: Boolean,
    default: false
  },
  waivedAt: {
    type: Date,
    default: null
  },
  waivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  waiverReason: {
    type: String,
    maxlength: [500, 'Waiver reason cannot exceed 500 characters']
  },
  
  // Applied by
  appliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  
  // Metadata
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes
penaltySchema.index({ group: 1 });
penaltySchema.index({ member: 1 });
penaltySchema.index({ payment: 1 });
penaltySchema.index({ cycle: 1 });
penaltySchema.index({ isPaid: 1 });
penaltySchema.index({ isWaived: 1 });

// Method to mark as paid
penaltySchema.methods.markAsPaid = function() {
  this.isPaid = true;
  this.paidAt = new Date();
  return this.save();
};

// Method to waive penalty
penaltySchema.methods.waive = function(userId, reason) {
  this.isWaived = true;
  this.waivedAt = new Date();
  this.waivedBy = userId;
  this.waiverReason = reason;
  return this.save();
};

const Penalty = mongoose.model('Penalty', penaltySchema);

module.exports = Penalty;