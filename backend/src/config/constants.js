module.exports = {
  // User roles
  ROLES: {
    ADMIN: 'admin',
    MEMBER: 'member',
    AUDITOR: 'auditor'
  },

  // Group member roles
  GROUP_ROLES: {
    ORGANIZER: 'organizer',
    MEMBER: 'member',
    AUDITOR: 'auditor'
  },

  // Payment status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    CONFIRMED: 'confirmed',
    LATE: 'late',
    DEFAULTED: 'defaulted'
  },

  // Payout status
  PAYOUT_STATUS: {
    SCHEDULED: 'scheduled',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped'
  },

  // Cycle status
  CYCLE_STATUS: {
    PENDING: 'pending',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Group status
  GROUP_STATUS: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    SUSPENDED: 'suspended'
  },

  // Member status
  MEMBER_STATUS: {
    INVITED: 'invited',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    DEFAULTED: 'defaulted',
    EXITED: 'exited'
  },

  // Turn order types
  TURN_ORDER_TYPES: {
    FIXED: 'fixed',
    RANDOM: 'random',
    NEED_BASED: 'need_based',
    LOTTERY: 'lottery'
  },

  // Payment modes
  PAYMENT_MODES: {
    UPI: 'upi',
    BANK_TRANSFER: 'bank_transfer',
    CASH: 'cash',
    CHEQUE: 'cheque',
    OTHER: 'other'
  },

  // Dispute status
  DISPUTE_STATUS: {
    OPEN: 'open',
    UNDER_REVIEW: 'under_review',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
  },

  // Notification types
  NOTIFICATION_TYPES: {
    PAYMENT_REMINDER: 'payment_reminder',
    PAYMENT_CONFIRMED: 'payment_confirmed',
    LATE_FEE_APPLIED: 'late_fee_applied',
    PAYOUT_SCHEDULED: 'payout_scheduled',
    PAYOUT_COMPLETED: 'payout_completed',
    TURN_UPCOMING: 'turn_upcoming',
    GROUP_INVITATION: 'group_invitation',
    MEMBER_DEFAULTED: 'member_defaulted',
    DISPUTE_RAISED: 'dispute_raised'
  },

  // Audit log actions
  AUDIT_ACTIONS: {
    GROUP_CREATED: 'group_created',
    GROUP_UPDATED: 'group_updated',
    MEMBER_ADDED: 'member_added',
    MEMBER_REMOVED: 'member_removed',
    PAYMENT_RECORDED: 'payment_recorded',
    PAYMENT_CONFIRMED: 'payment_confirmed',
    PAYOUT_EXECUTED: 'payout_executed',
    PENALTY_APPLIED: 'penalty_applied',
    TURN_REASSIGNED: 'turn_reassigned',
    DISPUTE_CREATED: 'dispute_created',
    DISPUTE_RESOLVED: 'dispute_resolved'
  },

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
  },

  // File upload limits
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    PAYMENT_PROOF_PATH: 'uploads/payment-proofs',
    PAYOUT_PROOF_PATH: 'uploads/payout-proofs'
  },

  // Default values
  DEFAULTS: {
    GRACE_PERIOD_DAYS: 2,
    LATE_FEE: 200,
    DEFAULT_THRESHOLD: 2, // Number of missed payments
    PAYMENT_WINDOW_START: 1, // Day of month
    PAYMENT_WINDOW_END: 7, // Day of month
    REMINDER_DAYS_BEFORE: 3,
    PAGE_SIZE: 20
  }
};