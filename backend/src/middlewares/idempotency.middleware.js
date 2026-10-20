const { cacheClient } = require('../config/redis');
const logger = require('../utils/logger');

// In-memory fallback for local testing & standalone mode
const inMemoryIdempotencyStore = new Map();

/**
 * Idempotency Key Middleware (Idempotency-Key header)
 * Ensures that POST/PUT/PATCH mutations can be safely retried over the network
 * without executing duplicates or causing data corruption.
 *
 * Header:
 *   Idempotency-Key: <UUID / unique string>
 *
 * Behavior:
 * - If key is processed: returns cached response with 'Idempotent-Replay: true'
 * - If key is in-progress: returns 409 Conflict
 * - If key is new: captures response and caches for 24 hours
 */
const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey || typeof idempotencyKey !== 'string' || req.method === 'GET' || req.method === 'HEAD') {
    return next();
  }

  const userId = req.user ? req.user.id : 'anon';
  const redisKey = `idempotency:${userId}:${idempotencyKey.trim()}`;

  try {
    // 1. Check existing record
    let cached = null;
    if (cacheClient && cacheClient.isOpen) {
      const raw = await cacheClient.get(redisKey);
      if (raw) cached = JSON.parse(raw);
    } else if (inMemoryIdempotencyStore.has(redisKey)) {
      cached = inMemoryIdempotencyStore.get(redisKey);
    }

    if (cached) {
      if (cached.status === 'IN_PROGRESS') {
        return res.status(409).json({
          type: 'https://api.codesync.dev/errors/conflict',
          title: 'Request In Progress',
          status: 409,
          detail: 'A request with this Idempotency-Key is currently being processed.',
          requestId: req.id
        });
      }

      // Replay identical response
      res.setHeader('Idempotent-Replay', 'true');
      res.setHeader('X-Request-Id', req.id || cached.requestId);
      return res.status(cached.statusCode).json(cached.body);
    }

    // 2. Mark as IN_PROGRESS with short 30-second lock
    const inProgressPayload = { status: 'IN_PROGRESS', requestId: req.id, timestamp: Date.now() };
    if (cacheClient && cacheClient.isOpen) {
      await cacheClient.set(redisKey, JSON.stringify(inProgressPayload), { EX: 30 });
    } else {
      inMemoryIdempotencyStore.set(redisKey, inProgressPayload);
    }

    // 3. Intercept res.json to capture response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const statusCode = res.statusCode || 200;

      // Only cache successful or client error mutations (not transient 500s)
      if (statusCode < 500) {
        const cachePayload = {
          status: 'COMPLETED',
          statusCode,
          body,
          requestId: req.id,
          completedAt: new Date().toISOString()
        };

        if (cacheClient && cacheClient.isOpen) {
          cacheClient.set(redisKey, JSON.stringify(cachePayload), { EX: 86400 }).catch(() => {});
        } else {
          inMemoryIdempotencyStore.set(redisKey, cachePayload);
        }
      }

      return originalJson(body);
    };

    next();
  } catch (err) {
    logger.warn(`Idempotency middleware error: ${err.message}`);
    next();
  }
};

module.exports = idempotencyMiddleware;
