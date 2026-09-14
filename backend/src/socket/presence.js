const { cacheClient } = require('../config/redis');
const events = require('./events');
const logger = require('../utils/logger');

const handlePresenceEvents = (socket) => {
  socket.on(events.CURSOR_MOVE, async ({ fileId, cursor }) => {
    try {
      const payload = {
        userId: socket.user.id,
        userName: socket.user.name || 'Anonymous',
        cursor
      };

      if (cacheClient && cacheClient.isOpen) {
        const redisKey = `room:${fileId}:cursor:${socket.user.id}`;
        await cacheClient.set(redisKey, JSON.stringify(payload), { EX: 300 });
      }

      // Broadcast cursor changes to everyone else in this room
      socket.to(fileId).emit(events.CURSOR_MOVE, payload);
    } catch (err) {
      logger.error('Failed to handle cursor movement event:', err);
    }
  });
};

const cleanupUser = async (socket) => {
  try {
    const userId = socket.user?.id;
    if (!userId) return;

    if (cacheClient && cacheClient.isOpen) {
      const pattern = `room:*:cursor:${userId}`;
      const keys = await cacheClient.keys(pattern);

      for (const key of keys) {
        const parts = key.split(':');
        const fileId = parts[1];

        socket.to(fileId).emit(events.PRESENCE_UPDATE, {
          userId,
          action: 'leave',
          userName: socket.user?.name || 'Anonymous'
        });

        await cacheClient.del(key);
      }
    }
  } catch (err) {
    logger.error('Error cleaning up presence status for user:', err);
  }
};

module.exports = { handlePresenceEvents, cleanupUser };
