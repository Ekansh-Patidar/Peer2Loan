const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const { startCronJobs } = require('./src/jobs/reminderCron');
const { startPenaltyCronJobs } = require('./src/jobs/penaltyCron');
const { startCycleManagerJobs } = require('./src/jobs/cycleManager');

// Load environment variables
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start cron jobs
if (process.env.ENABLE_REMINDERS === 'true') {
  startCronJobs();
  logger.info('Reminder cron jobs started successfully');
}

if (process.env.ENABLE_PENALTY_CHECKS === 'true') {
  startPenaltyCronJobs();
  logger.info('Penalty cron jobs started successfully');
}

// Always start cycle manager jobs
startCycleManagerJobs();
logger.info('Cycle manager jobs started successfully');

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`📝 API Documentation: http://localhost:${PORT}/api/v1/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

module.exports = server;