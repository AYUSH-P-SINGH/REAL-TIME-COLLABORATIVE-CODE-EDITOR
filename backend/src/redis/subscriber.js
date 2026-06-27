const { subClient } = require('../config/redis');
const logger = require('../utils/logger');

const subscribe = async (channel, callback) => {
  try {
    await subClient.subscribe(channel, (message) => {
      try {
        const parsed = JSON.parse(message);
        callback(null, parsed);
      } catch (err) {
        callback(null, message);
      }
    });
    logger.info(`📡 Subscribed to Redis channel: ${channel}`);
  } catch (err) {
    logger.error(`❌ Redis Subscribe Error on channel ${channel}:`, err);
    callback(err);
  }
};

module.exports = { subscribe };
