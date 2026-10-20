const crypto = require('crypto');

/**
 * Middleware that assigns or propagates a unique Request ID (Correlation ID)
 * for every incoming HTTP request. Ensures full traceability across microservices,
 * logs, and RFC 7807 problem details.
 */
const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = incomingId && typeof incomingId === 'string' && incomingId.trim().length > 0
    ? incomingId.trim()
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

module.exports = requestIdMiddleware;
