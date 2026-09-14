const { cacheClient } = require('../config/redis');

const rateLimiter = (limit = 100, windowSecs = 60) => {
  return async (req, res, next) => {
    try {
      if (!cacheClient || !cacheClient.isOpen || process.env.NODE_ENV === 'test') {
        return next();
      }

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
      next();
    }
  };
};

module.exports = rateLimiter;
