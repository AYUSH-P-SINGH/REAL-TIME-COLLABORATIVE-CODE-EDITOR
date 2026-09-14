const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  logger.error(`Error details: ${err.message}`, { stack: err.stack });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || (
    statusCode === 404 ? 'NOT_FOUND' :
      statusCode === 403 ? 'FORBIDDEN' :
        statusCode === 401 ? 'UNAUTHORIZED' :
          statusCode === 400 ? 'BAD_REQUEST' :
            statusCode === 409 ? 'CONFLICT' :
              'INTERNAL_SERVER_ERROR'
  );

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      message,
      details: err.details || undefined,
    },
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
