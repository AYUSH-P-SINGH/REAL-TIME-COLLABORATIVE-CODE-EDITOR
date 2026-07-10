const { cacheClient } = require('../config/redis');
const logger = require('../utils/logger');

const rateLimiter = (limit = 100, windowSecs = 60) => {
  return async (req, res, next) => {
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const key = `ratelimit:${ip}`;

      const requests = await cacheClient.incr(key);
      if (requests === 1) {
        await cacheClient.expire(key, windowSecs);
      }

      if (requests > limit) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later.',
        });
      }

      next();
    } catch (err) {
      logger.error('Rate limiter error:', err);
      // Fail-safe open: continue processing request if rate limiter check errors out
      next();
    }
  };
};

module.exports = rateLimiter;
