const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('./redis');
const logger = require('../utils/logger');

let io;

/**
 * Initializes production-grade Socket.IO server with WebSocket-only transport,
 * tuned compression, Redis adapter clustering, and DDoS protection.
 *
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Enforce WebSocket-only transport to eliminate polling handshake latency
    transports: ['websocket'],
    // Cap maximum payload size to 64KB to prevent memory exhaustion attacks
    maxHttpBufferSize: 64 * 1024,
    // Selective perMessageDeflate: only compress packets > 2KB to save CPU on small keystroke updates
    perMessageDeflate: {
      threshold: 2048
    },
    pingInterval: 10000,
    pingTimeout: 20000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true
    }
  });

  if (pubClient && pubClient.isOpen && subClient && subClient.isOpen) {
    try {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('🔌 Socket.io Redis adapter mounted successfully for multi-node distribution.');
    } catch (err) {
      logger.error('Failed to mount Socket.io Redis adapter:', err);
    }
  } else {
    logger.info('ℹ️ Redis cluster not connected; operating with high-speed in-memory Socket.io adapter.');
  }

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

module.exports = { initSocket, getIO };
