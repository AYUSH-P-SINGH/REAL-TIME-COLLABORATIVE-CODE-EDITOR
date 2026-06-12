const http = require('http');
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { setupSockets } = require('./socket');
const { startSnapshotWorker } = require('./sync/snapshot.service');
const logger = require('./utils/logger');

const server = http.createServer(app);

const startServer = async () => {
  // 1. Establish database connection
  await connectDB();
  
  // 2. Connect to Redis Clients
  await connectRedis();
  
  // 3. Initialize WebSocket coordination
  setupSockets(server);
  
  // 4. Start background Snapshot Worker
  startSnapshotWorker();

  // 5. Start listening
  server.listen(env.PORT, () => {
    logger.info(`✨ Service operating in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

// Process-level event overrides to prevent abrupt server deaths
process.on('unhandledRejection', (err) => {
  logger.error('❌ Unhandled Promise rejection detected:', err);
});

process.on('uncaughtException', (err) => {
  logger.error('❌ Uncaught Application exception detected:', err);
  process.exit(1);
});

startServer();
