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
    min: [0, 'Amount cannot be negative'],
    set: function(val) {
      // Round to 2 decimal places to avoid floating point issues
      return Math.round(val * 100) / 100;
    },
    get: function(val) {
      // Ensure we always return properly rounded value
      return Math.round(val * 100) / 100;
    }
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
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
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

// Round amount before saving to avoid floating point issues
paymentSchema.pre('save', function(next) {
  if (this.amount) {
    this.amount = Math.round(this.amount * 100) / 100;
  }
  next();
});

// Calculate days late before saving
// Note: isLate should be set by the service layer which has access to group data
// This hook only calculates daysLate if isLate is already set
paymentSchema.pre('save', function(next) {
  if (this.paidAt && this.dueDate && this.isLate) {
    // Calculate days late from due date (grace period already considered by service)
    const daysDiff = Math.ceil((this.paidAt - this.dueDate) / (1000 * 60 * 60 * 24));
    this.daysLate = daysDiff > 0 ? daysDiff : 0;
  } else if (!this.isLate) {
    // If not late, ensure daysLate is 0
    this.daysLate = 0;
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