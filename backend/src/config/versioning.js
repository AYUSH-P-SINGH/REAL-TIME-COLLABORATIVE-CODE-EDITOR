// API Versioning Middleware
const apiVersion = (version) => {
  return (req, res, next) => {
    req.apiVersion = version;
    res.setHeader('API-Version', version);
    next();
  };
};

const routerV1 = require('express').Router();
const routerV2 = require('express').Router();

// V1 routes (legacy support)
routerV1.get('/status', (req, res) => {
  res.json({
    version: 'v1',
    message: 'API v1 is running (legacy)',
  });
});

// V2 routes (current)
routerV2.get('/status', (req, res) => {
  res.json({
    version: 'v2',
    message: 'API v2 is running',
    features: ['enhanced-validation', 'better-errors', 'audit-logs'],
  });
});

// Support both /api/v1 and /api/v2 prefixes
const setupVersioning = (app) => {
  app.use('/api/v1', apiVersion('1.0'), routerV1);
  app.use('/api/v2', apiVersion('2.0'), routerV2);

  // Default to v2
  app.use('/api', apiVersion('2.0'), routerV2);
};

module.exports = {
  apiVersion,
  setupVersioning,
  routerV1,
  routerV2,
};
