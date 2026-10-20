const jwt = require('../utils/jwt');
const authService = require('../auth/auth.service');
const events = require('./events');
const roomManager = require('./room.manager');
const presence = require('./presence');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

/**
 * WebSocket Authentication Middleware
 * Supports:
 * 1. Single-use 30s connection tickets (POST /ws-ticket) - Recommended production pattern.
 *    Eliminates token leaks into access logs and query strings. Consumed immediately.
 * 2. Bearer JWT tokens via handshake auth or authorization headers (backward compatible).
 */
const authenticateSocket = async (socket, next) => {
  try {
    const ticket = socket.handshake.auth?.ticket || socket.handshake.query?.ticket;

    if (ticket) {
      const user = await authService.consumeWsTicket(ticket);
      if (!user) {
        return next(new Error('Authentication failed: Invalid or expired ticket'));
      }
      socket.user = user;
      return next();
    }

    // Fallback: Direct JWT token
    const rawToken = socket.handshake.auth?.token ||
                     socket.handshake.headers?.authorization ||
                     socket.handshake.query?.token;

    if (!rawToken) {
      return next(new Error('Authentication failed: Ticket or Token missing'));
    }

    const token = rawToken.replace('Bearer ', '').trim();
    const decoded = jwt.verifyToken(token);
    socket.user = decoded;
    return next();
  } catch (error) {
    return next(new Error('Authentication failed: Invalid token'));
  }
};

const registerSocketHandlers = (io) => {
  io.use(authenticateSocket);

  io.on(events.CONNECTION, (socket) => {
    metrics.activeConnections.inc();
    logger.info(`🔌 Socket connected: ${socket.id} (User: ${socket.user.name || socket.user.id})`);

    // Register event sub-modules
    roomManager.handleRoomEvents(socket);
    presence.handlePresenceEvents(socket);

    socket.on(events.DISCONNECT, async (reason) => {
      metrics.activeConnections.dec();
      logger.info(`🔌 Socket disconnected: ${socket.id} (Reason: ${reason})`);
      await presence.cleanupUser(socket);
    });
  });
};

module.exports = { registerSocketHandlers, authenticateSocket };
