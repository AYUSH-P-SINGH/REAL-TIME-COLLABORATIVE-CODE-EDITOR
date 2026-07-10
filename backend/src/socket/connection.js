const jwt = require('../utils/jwt');
const events = require('./events');
const roomManager = require('./room.manager');
const presence = require('./presence');
const logger = require('../utils/logger');

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
  if (!token) {
    return next(new Error('Authentication failed: Token missing'));
  }

  try {
    const decoded = jwt.verifyToken(token.replace('Bearer ', ''));
    socket.user = decoded; // Attach user payload to socket
    next();
  } catch (error) {
    next(new Error('Authentication failed: Invalid token'));
  }
};

const registerSocketHandlers = (io) => {
  io.use(authenticateSocket);

  io.on(events.CONNECTION, (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id} (User: ${socket.user.name})`);

    // Register event sub-modules
    roomManager.handleRoomEvents(socket);
    presence.handlePresenceEvents(socket);

    socket.on(events.DISCONNECT, async (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} (Reason: ${reason})`);
      await presence.cleanupUser(socket);
    });
  });
};

module.exports = { registerSocketHandlers };
