const express = require('express');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const { setupSecurityMiddleware } = require('./config/security');
const { apiLimiter, authLimiter, fileLimiter } = require('./middlewares/rateLimit.advanced');
const { checkFileSize } = require('./middlewares/fileSize.middleware');
const { initSentry, captureException } = require('./utils/sentry.config');

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Master Routing Gateway
app.use('/api', routes);

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