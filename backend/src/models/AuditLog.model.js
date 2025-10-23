const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../config/constants');

const auditLogSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  
  // Action details
  action: {
    type: String,
    enum: Object.values(AUDIT_ACTIONS),
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Actor (who performed the action)
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Affected entities
  affectedMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null
  },
  affectedCycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cycle',
    default: null
  },
  affectedPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  
  // Old and new values (for update actions)
  oldValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Metadata
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  
  // Timestamp (already handled by timestamps: true, but kept for clarity)
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ group: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ affectedMember: 1 });

// Static method to log an action
auditLogSchema.statics.logAction = async function(logData) {
  return await this.create({
    group: logData.groupId,
    action: logData.action,
    description: logData.description,
    performedBy: logData.userId,
    affectedMember: logData.memberId || null,
    affectedCycle: logData.cycleId || null,
    affectedPayment: logData.paymentId || null,
    oldValues: logData.oldValues || null,
    newValues: logData.newValues || null,
    ipAddress: logData.ipAddress || null,
    userAgent: logData.userAgent || null
  });
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;