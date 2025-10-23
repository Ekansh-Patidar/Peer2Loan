const mongoose = require('mongoose');
const { PAYOUT_STATUS, PAYMENT_MODES } = require('../config/constants');

const payoutSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  cycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cycle',
    required: true
  },
  beneficiary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  
  // Payout details
  amount: {
    type: Number,
    required: [true, 'Payout amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Status
  status: {
    type: String,
    enum: Object.values(PAYOUT_STATUS),
    default: PAYOUT_STATUS.SCHEDULED
  },
  
  // Transfer details
  transferMode: {
    type: String,
    enum: Object.values(PAYMENT_MODES),
    default: PAYMENT_MODES.BANK_TRANSFER
  },
  transferReference: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  
  // Account details (snapshot at time of payout)
  recipientAccount: {
    accountType: String,
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    accountHolderName: String
  },
  
  // Proof documents
  proofDocument: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: Date
  },
  
  // Dates
  scheduledDate: {
    type: Date,
    required: true
  },
  processedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  
  // Processing
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Failed payout tracking
  failureReason: {
    type: String,
    maxlength: [500, 'Failure reason cannot exceed 500 characters']
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: {
    type: Date,
    default: null
  },
  
  // Notes
  processorRemarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  beneficiaryRemarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes
payoutSchema.index({ group: 1 });
payoutSchema.index({ cycle: 1 }, { unique: true });
payoutSchema.index({ beneficiary: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ scheduledDate: 1 });

// Method to mark as processing
payoutSchema.methods.startProcessing = function(userId) {
  this.status = PAYOUT_STATUS.PROCESSING;
  this.processedAt = new Date();
  this.processedBy = userId;
  return this.save();
};

// Method to mark as completed
payoutSchema.methods.markAsCompleted = function(transferDetails) {
  this.status = PAYOUT_STATUS.COMPLETED;
  this.completedAt = new Date();
  if (transferDetails) {
    this.transferReference = transferDetails.reference;
    this.transactionId = transferDetails.transactionId;
  }
  return this.save();
};

// Method to mark as failed
payoutSchema.methods.markAsFailed = function(reason) {
  this.status = PAYOUT_STATUS.FAILED;
  this.failureReason = reason;
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  return this.save();
};

const Payout = mongoose.model('Payout', payoutSchema);

module.exports = Payout;