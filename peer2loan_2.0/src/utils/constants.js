// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

// App Configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME;
export const APP_VERSION = import.meta.env.VITE_APP_VERSION;
export const APP_ENV = import.meta.env.VITE_ENV;

// Feature Flags
export const FEATURES = {
  GROUPS: import.meta.env.VITE_ENABLE_GROUPS === "true",
  PAYMENTS: import.meta.env.VITE_ENABLE_PAYMENTS === "true",
  REPORTS: import.meta.env.VITE_ENABLE_REPORTS === "true",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "peer2loan_token",
  USER: "peer2loan_user",
  THEME: "peer2loan_theme",
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: Number(import.meta.env.VITE_MAX_FILE_SIZE || 5242880),
  ALLOWED_TYPES: (import.meta.env.VITE_ALLOWED_FILE_TYPES || "image/jpeg,image/png,image/jpg,application/pdf").split(","),
};


// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE),
};

// --- Keeping your other constants exactly the same ---

export const ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
  AUDITOR: "auditor",
};

export const GROUP_ROLES = {
  ORGANIZER: "organizer",
  MEMBER: "member",
  AUDITOR: "auditor",
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  CONFIRMED: "confirmed",
  LATE: "late",
  DEFAULTED: "defaulted",
};

export const PAYMENT_STATUS_COLORS = {
  pending: "#FFA726",
  paid: "#66BB6A",
  confirmed: "#4CAF50",
  late: "#FF9800",
  defaulted: "#F44336",
};

export const PAYOUT_STATUS = {
  SCHEDULED: "scheduled",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
};

export const CYCLE_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const GROUP_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  SUSPENDED: "suspended",
};

export const MEMBER_STATUS = {
  INVITED: "invited",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  DEFAULTED: "defaulted",
  EXITED: "exited",
};

export const TURN_ORDER_TYPES = {
  FIXED: "fixed",
  RANDOM: "random",
  NEED_BASED: "need_based",
  LOTTERY: "lottery",
};

export const PAYMENT_MODES = {
  UPI: "upi",
  BANK_TRANSFER: "bank_transfer",
  CASH: "cash",
  CHEQUE: "cheque",
  OTHER: "other",
};

export const CURRENCIES = {
  INR: { symbol: "₹", code: "INR", name: "Indian Rupee" },
  USD: { symbol: "$", code: "USD", name: "US Dollar" },
  EUR: { symbol: "€", code: "EUR", name: "Euro" },
};

export const DATE_FORMATS = {
  DISPLAY: "DD MMM YYYY",
  INPUT: "YYYY-MM-DD",
  DATETIME: "DD MMM YYYY, hh:mm A",
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
  DASHBOARD: "/dashboard",
  GROUPS: "/groups",
  GROUP_DETAILS: "/groups/:groupId",
  CREATE_GROUP: "/groups/create",
  PAYMENTS: "/payments",
  PAYMENT_HISTORY: "/payments/history",
  PAYOUTS: "/payouts",
  REPORTS: "/reports",
  AUDIT_LOG: "/reports/audit-log",
};

export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{10}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  UPI: /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/,
  ACCOUNT_NUMBER: /^[0-9]{9,18}$/,
};
