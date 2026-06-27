const { pubClient } = require('../config/redis');
const logger = require('../utils/logger');

const publish = async (channel, message) => {
  try {
    const payload = typeof message === 'object' ? JSON.stringify(message) : message;
    await pubClient.publish(channel, payload);
  } catch (err) {
    logger.error(`❌ Redis Publish Error on channel ${channel}:`, err);
  }
};

module.exports = { publish };
