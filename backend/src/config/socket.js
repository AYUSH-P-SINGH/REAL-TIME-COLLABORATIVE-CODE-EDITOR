const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('./redis');
const logger = require('../utils/logger');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    }
  });

  if (pubClient && pubClient.isOpen && subClient && subClient.isOpen) {
    try {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('🔌 Socket.io Redis adapter mounted successfully.');
    } catch (err) {
      logger.error('Failed to mount Socket.io Redis adapter:', err);
    }
  } else {
    logger.info('ℹ️ Redis not connected; using standard in-memory Socket.io adapter.');
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
