const express = require('express');
const mongoose = require('mongoose');
const { pubClient, cacheClient } = require('./config/redis');
const { setupVersioning } = require('./config/versioning');
const errorHandler = require('./middlewares/error.middleware');
const { setupSecurityMiddleware } = require('./config/security');
const { apiLimiter, authLimiter, fileLimiter } = require('./middlewares/rateLimit.advanced');
const { checkFileSize } = require('./middlewares/fileSize.middleware');
const { initSentry } = require('./utils/sentry.config');

const app = express();

// Initialize Sentry for error monitoring
initSentry(app);

// Security middleware (CORS, Helmet, etc)
setupSecurityMiddleware(app);

// Parse payload sizes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/', apiLimiter);
app.use('/api/files/upload', fileLimiter);
app.use('/api/files/upload', checkFileSize);

// Liveness health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness health check (validates MongoDB and Redis connections)
app.get('/health/ready', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisPubStatus = pubClient && pubClient.isOpen ? 'connected' : 'disconnected';
  const redisCacheStatus = cacheClient && cacheClient.isOpen ? 'connected' : 'disconnected';

  const isReady = mongoStatus === 'connected' && redisPubStatus === 'connected' && redisCacheStatus === 'connected';

  const statusCode = isReady ? 200 : 503;
  return res.status(statusCode).json({
    status: isReady ? 'ready' : 'degraded',
    services: {
      mongodb: mongoStatus,
      redisPub: redisPubStatus,
      redisCache: redisCacheStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

// Master Routing Gateway
setupVersioning(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Custom Global Error Middleware (must be last)
app.use(errorHandler);

module.exports = app;
