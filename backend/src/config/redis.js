const { createClient } = require('redis');
const env = require('./env');
const logger = require('../utils/logger');

const pubClient = createClient({ url: env.REDIS_URL });
const subClient = pubClient.duplicate();
const cacheClient = pubClient.duplicate();

pubClient.on('error', (err) => logger.error('❌ Redis Pub Client Error:', err));
subClient.on('error', (err) => logger.error('❌ Redis Sub Client Error:', err));
cacheClient.on('error', (err) => logger.error('❌ Redis Cache Client Error:', err));

const connectRedis = async () => {
  try {
    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
      cacheClient.connect()
    ]);
    logger.info('🚀 Redis client cluster initialized successfully.');
  } catch (error) {
    logger.error('❌ Redis Initialization Failed:', error);
    process.exit(1);
  }
};

module.exports = {
  pubClient,
  subClient,
  cacheClient,
  connectRedis
};
