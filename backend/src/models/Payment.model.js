const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_MODES } = require('../config/constants');

const paymentSchema = new mongoose.Schema({
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
  cycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cycle',
    required: true
  },
  cycleNumber: {
    type: Number,
    required: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentMode: {
    type: String,
    enum: Object.values(PAYMENT_MODES),
    default: PAYMENT_MODES.UPI
  },
  
  // Status tracking
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  
  // Transaction details
  transactionId: {
    type: String,
    trim: true
  },
  referenceNumber: {
    type: String,
    trim: true
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
  dueDate: {
    type: Date,
    required: true
  },
  paidAt: {
    type: Date,
    default: null
  },
  confirmedAt: {
    type: Date,
    default: null
  },
  
  // Late payment tracking
  isLate: {
    type: Boolean,
    default: false
  },
  daysLate: {
    type: Number,
    default: 0
  },
  lateFee: {
    type: Number,
    default: 0
  },
  
  // Confirmation
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Remarks
  memberRemarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  adminRemarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: String
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ group: 1, cycleNumber: 1 });
paymentSchema.index({ member: 1, cycleNumber: 1 });
paymentSchema.index({ cycle: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ paidAt: 1 });

// Compound unique index to prevent duplicate payments for same cycle
paymentSchema.index({ member: 1, cycle: 1 }, { unique: true });

// Calculate days late before saving
paymentSchema.pre('save', function(next) {
  if (this.paidAt && this.dueDate) {
    const daysDiff = Math.floor((this.paidAt - this.dueDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 0) {
      this.daysLate = daysDiff;
      this.isLate = true;
    }
  }
  next();
});

// Method to mark as paid
paymentSchema.methods.markAsPaid = function(transactionDetails) {
  this.status = PAYMENT_STATUS.PAID;
  this.paidAt = new Date();
  if (transactionDetails) {
    this.transactionId = transactionDetails.transactionId;
    this.referenceNumber = transactionDetails.referenceNumber;
    this.paymentMode = transactionDetails.paymentMode;
  }
  return this.save();
};

// Method to confirm payment
paymentSchema.methods.confirmPayment = function(userId) {
  this.status = PAYMENT_STATUS.CONFIRMED;
  this.confirmedAt = new Date();
  this.confirmedBy = userId;
  return this.save();
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;