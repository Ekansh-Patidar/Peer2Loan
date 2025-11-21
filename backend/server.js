const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const { startCronJobs } = require('./src/jobs/reminderCron');
const { startPenaltyCronJobs } = require('./src/jobs/penaltyCron');
const { startCycleManagerJobs } = require('./src/jobs/cycleManager');

// Load environment variables
require('dotenv').config();

const PORT = process.env.PORT || 5000;

let server;

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

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
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`📝 API Documentation: http://localhost:${PORT}/api/v1/health`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  if (server) {
    server.close(() => {
      logger.info('💥 Process terminated!');
    });
  }
});

module.exports = server;
