const events = require('./events');
const docManager = require('../sync/document.manager');
const crdt = require('../sync/crdt');
const logger = require('../utils/logger');

const handleRoomEvents = (socket) => {
  socket.on(events.ROOM_JOIN, async ({ fileId }) => {
    try {
      socket.join(fileId);
      logger.info(`👥 User ${socket.user.id} joined room (fileId): ${fileId}`);

      const document = await docManager.getOrCreateDocument(fileId);

      socket.emit(events.CODE_SYNC, {
        fileId,
        content: document.content,
        version: document.version
      });

      socket.to(fileId).emit(events.PRESENCE_UPDATE, {
        userId: socket.user.id,
        action: 'join',
        userName: socket.user.name
      });
    } catch (err) {
      logger.error('Error joining room:', err);
      socket.emit(events.ERROR, { message: 'Failed to join document workspace.' });
    }
  });

  socket.on(events.ROOM_LEAVE, ({ fileId }) => {
    socket.leave(fileId);
    logger.info(`👥 User ${socket.user.id} left room: ${fileId}`);
    socket.to(fileId).emit(events.PRESENCE_UPDATE, {
      userId: socket.user.id,
      action: 'leave',
      userName: socket.user.name
    });
  });

  socket.on(events.CODE_EDIT, async ({ fileId, change, version }) => {
    try {
      const doc = await docManager.getOrCreateDocument(fileId);
      let updatedContent = doc.content;

      if (change) {
        if (change.patch) {
          const { newText, success } = crdt.applyPatch(doc.content, change.patch);
          if (success) {
            updatedContent = newText;
          }
        } else if (change.fullContent !== undefined) {
          updatedContent = change.fullContent;
        }
      }

      const nextVersion = version || (doc.version + 1);
      await docManager.updateDocumentState(fileId, updatedContent, nextVersion);

      // Broadcast changes to all other sockets in the room
      socket.to(fileId).emit(events.CODE_EDIT, {
        fileId,
        change,
        version: nextVersion,
        senderId: socket.user.id
      });
    } catch (err) {
      logger.error('Error handling code edit:', err);
    }
  });

  socket.on('workspace:theme', ({ fileId, theme }) => {
    socket.to(fileId).emit('workspace:theme', { theme });
  });
};

module.exports = { handleRoomEvents };
