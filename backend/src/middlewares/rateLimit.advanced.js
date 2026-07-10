// Rate Limiting Middleware
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { cacheClient } = require('../config/redis');
const logger = require('../utils/logger');

// General API limiter: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  store: process.env.NODE_ENV === 'test' ? undefined : new RedisStore({
    sendCommand: (...args) => cacheClient.sendCommand(args),
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// Auth limiter: 5 attempts per 15 minutes
const authLimiter = rateLimit({
  store: process.env.NODE_ENV === 'test' ? undefined : new RedisStore({
    sendCommand: (...args) => cacheClient.sendCommand(args),
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// File operations limiter: 50 requests per 15 minutes
const fileLimiter = rateLimit({
  store: process.env.NODE_ENV === 'test' ? undefined : new RedisStore({
    sendCommand: (...args) => cacheClient.sendCommand(args),
    prefix: 'rl:file:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  fileLimiter,
};
