const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('./redis');
const logger = require('../utils/logger');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Adjust to your actual frontend url in production
      methods: ['GET', 'POST'],
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // Recover states if down for < 2 min
      skipMiddlewares: true,
    }
  });

  try {
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('🔌 Socket.io Redis adapter mounted successfully.');
  } catch (err) {
    logger.error('❌ Failed to mount Socket.io Redis adapter:', err);
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
