const logger = require('../utils/logger');

const HTTP_TITLES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Resource Not Found',
  409: 'Conflict',
  412: 'Precondition Failed',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable'
};

/**
 * RFC 7807 Problem Details for HTTP APIs (application/problem+json)
 * Formats all application errors into a standardized machine-readable structure
 * with request correlation IDs and validation breakdowns.
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || (err.name === 'ZodError' ? 422 : 500);
  const title = HTTP_TITLES[statusCode] || 'Error';
  const detail = err.message || 'An unexpected error occurred processing your request.';
  const requestId = req.id || req.headers['x-request-id'] || 'unknown';

  logger.error(`[${requestId}] ${statusCode} ${req.method} ${req.originalUrl} - ${detail}`, {
    stack: err.stack,
    requestId
  });

  // Determine standard error code
  const code = err.code || (
    statusCode === 404 ? 'NOT_FOUND' :
      statusCode === 403 ? 'FORBIDDEN' :
        statusCode === 401 ? 'UNAUTHORIZED' :
          statusCode === 400 ? 'BAD_REQUEST' :
            statusCode === 409 ? 'CONFLICT' :
              statusCode === 412 ? 'PRECONDITION_FAILED' :
                statusCode === 422 ? 'UNPROCESSABLE_ENTITY' :
                  statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' :
                    'INTERNAL_SERVER_ERROR'
  );

  // Parse validation errors if Zod or custom details present
  let invalidParams;
  if (err.errors && Array.isArray(err.errors)) {
    invalidParams = err.errors.map(e => ({
      name: Array.isArray(e.path) ? e.path.join('.') : e.path,
      reason: e.message
    }));
  } else if (err.details) {
    invalidParams = err.details;
  }

  // RFC 7807 response payload with backward-compatible aliases
  const problemDetails = {
    // Standard RFC 7807 properties
    type: `https://api.codesync.dev/errors/${code.toLowerCase().replace(/_/g, '-')}`,
    title,
    status: statusCode,
    detail,
    instance: req.originalUrl || req.path,
    requestId,
    code,
    invalidParams: invalidParams || undefined,

    // Backward-compatible compatibility fields for legacy clients
    success: false,
    message: detail,
    error: {
      code,
      message: detail,
      details: invalidParams || undefined
    },
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  res.status(statusCode)
    .contentType('application/problem+json')
    .json(problemDetails);
};

module.exports = errorHandler;
