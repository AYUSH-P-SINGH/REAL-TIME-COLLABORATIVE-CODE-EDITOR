const { createClient } = require('redis');
const env = require('./env');
const logger = require('../utils/logger');

let isRedisConnected = false;

const clientOptions = {
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: false
  }
};

const pubClient = createClient(clientOptions);
const subClient = pubClient.duplicate();
const cacheClient = pubClient.duplicate();

pubClient.on('error', () => {});
subClient.on('error', () => {});
cacheClient.on('error', () => {});

const connectRedis = async () => {
  try {
    const connectWithTimeout = (client) => Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 1000))
    ]);

    await Promise.all([
      connectWithTimeout(pubClient),
      connectWithTimeout(subClient),
      connectWithTimeout(cacheClient)
    ]);
    isRedisConnected = true;
    logger.info('🚀 Redis client cluster initialized successfully.');
    return true;
  } catch (error) {
    isRedisConnected = false;
    try {
      if (pubClient.isOpen) await pubClient.disconnect();
      if (subClient.isOpen) await subClient.disconnect();
      if (cacheClient.isOpen) await cacheClient.disconnect();
    } catch (_) {
      // Ignore disconnect errors during fallback
    }
    logger.warn(`⚠️ Redis not available (${env.REDIS_URL}); operating in standalone in-memory fallback mode.`);
    return false;
  }
};

module.exports = {
  pubClient,
  subClient,
  cacheClient,
  connectRedis,
  isRedisConnected: () => isRedisConnected
};
