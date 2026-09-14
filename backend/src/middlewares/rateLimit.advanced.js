// Rate Limiting Middleware
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { cacheClient, isRedisConnected } = require('../config/redis');
const logger = require('../utils/logger');

const getStore = (prefix) => {
  if (isRedisConnected && isRedisConnected() && cacheClient && cacheClient.isOpen && process.env.NODE_ENV !== 'test') {
    try {
      return new RedisStore({
        sendCommand: (...args) => cacheClient.sendCommand(args),
        prefix,
      });
    } catch (err) {
      return undefined;
    }
  }
  return undefined; // Built-in high-performance MemoryStore
};

// General API limiter: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  store: getStore('rl:api:'),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    });
  },
});

// Auth limiter: 15 attempts per 15 minutes
const authLimiter = rateLimit({
  store: getStore('rl:auth:'),
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later',
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again later'
      }
    });
  },
});

// File operations limiter: 100 requests per 15 minutes
const fileLimiter = rateLimit({
  store: getStore('rl:file:'),
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    logger.warn(`File operation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many file operations, please try again later',
      error: {
        code: 'FILE_RATE_LIMIT_EXCEEDED',
        message: 'Too many file operations, please try again later'
      }
    });
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  fileLimiter,
};
