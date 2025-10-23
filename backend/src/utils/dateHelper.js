/**
 * Date helper utilities for cycle and payment calculations
 */

// Get the first day of a month
const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month - 1, 1);
};

// Get the last day of a month
const getLastDayOfMonth = (year, month) => {
  return new Date(year, month, 0);
};

// Calculate due date based on payment window
const calculateDueDate = (cycleStartDate, paymentWindowEnd) => {
  const dueDate = new Date(cycleStartDate);
  dueDate.setDate(paymentWindowEnd);
  return dueDate;
};

// Calculate grace period end date
const calculateGracePeriodEnd = (dueDate, gracePeriodDays) => {
  const graceEnd = new Date(dueDate);
  graceEnd.setDate(graceEnd.getDate() + gracePeriodDays);
  return graceEnd;
};

// Calculate days between two dates
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
};

// Check if date is within payment window
const isWithinPaymentWindow = (date, startDay, endDay) => {
  const day = date.getDate();
  return day >= startDay && day <= endDay;
};

// Get cycle dates for all cycles in a group
const generateCycleDates = (startDate, duration) => {
  const cycles = [];
  for (let i = 0; i < duration; i++) {
    const cycleStart = new Date(startDate);
    cycleStart.setMonth(cycleStart.getMonth() + i);
    
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    cycleEnd.setDate(cycleEnd.getDate() - 1);
    
    cycles.push({
      cycleNumber: i + 1,
      startDate: cycleStart,
      endDate: cycleEnd,
    });
  }
  return cycles;
};

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Check if payment is late
const isPaymentLate = (paidDate, dueDate, gracePeriodDays = 0) => {
  const graceEnd = calculateGracePeriodEnd(dueDate, gracePeriodDays);
  return paidDate > graceEnd;
};

// Get current cycle number based on date
const getCurrentCycleNumber = (groupStartDate, currentDate = new Date()) => {
  const monthsDiff = (currentDate.getFullYear() - groupStartDate.getFullYear()) * 12 +
                     (currentDate.getMonth() - groupStartDate.getMonth());
  return monthsDiff + 1;
};

// Add months to a date
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// Check if date is in the past
const isPast = (date) => {
  return date < new Date();
};

// Check if date is today
const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

module.exports = {
  getFirstDayOfMonth,
  getLastDayOfMonth,
  calculateDueDate,
  calculateGracePeriodEnd,
  daysBetween,
  isWithinPaymentWindow,
  generateCycleDates,
  formatDate,
  isPaymentLate,
  getCurrentCycleNumber,
  addMonths,
  isPast,
  isToday,
};