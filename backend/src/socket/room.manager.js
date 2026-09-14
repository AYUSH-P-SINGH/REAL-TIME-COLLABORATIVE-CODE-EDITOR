const events = require('./events');
const docManager = require('../sync/document.manager');
const crdt = require('../sync/crdt');
const snapshotService = require('../sync/snapshot.service');
const File = require('../files/file.model');
const projectService = require('../projects/project.service');
const logger = require('../utils/logger');

const handleRoomEvents = (socket) => {
  socket.on(events.ROOM_JOIN, async ({ fileId }) => {
    try {
      if (!fileId) {
        return socket.emit(events.ERROR, { message: 'fileId is required to join document room.' });
      }

      const file = await File.findById(fileId);
      if (!file) {
        return socket.emit(events.ERROR, { message: 'Document not found.' });
      }

      const hasAccess = await projectService.hasPermission(file.project, socket.user.id, 'viewer');
      if (!hasAccess) {
        return socket.emit(events.ERROR, {
          code: 'FORBIDDEN',
          message: 'Access denied: You are not authorized to view this document.'
        });
      }

      socket.join(fileId);
      logger.info(`👤 User ${socket.user.id} (${socket.user.name}) joined room: ${fileId}`);

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

  socket.on(events.ROOM_LEAVE, async ({ fileId }) => {
    if (!fileId) return;
    socket.leave(fileId);
    logger.info(`👤 User ${socket.user.id} left room: ${fileId}`);
    socket.to(fileId).emit(events.PRESENCE_UPDATE, {
      userId: socket.user.id,
      action: 'leave',
      userName: socket.user.name
    });

    // Check if room is now empty and persist state immediately
    try {
      await snapshotService.persistDocument(fileId);
    } catch (e) {
      // ignore
    }
  });

  socket.on(events.CODE_EDIT, async ({ fileId, change, version }) => {
    try {
      if (!fileId) return;

      const file = await File.findById(fileId);
      if (!file) {
        return socket.emit(events.ERROR, { message: 'Document not found.' });
      }

      const isEditor = await projectService.hasPermission(file.project, socket.user.id, 'editor');
      if (!isEditor) {
        return socket.emit(events.ERROR, {
          code: 'FORBIDDEN',
          message: 'Access denied: You need editor privileges to modify this document.'
        });
      }

      const doc = await docManager.getOrCreateDocument(fileId);
      let updatedContent = doc.content;

      if (change) {
        if (change.patch) {
          const { newText, success } = crdt.applyPatch(doc.content, change.patch);
          if (success) {
            updatedContent = newText;
          } else {
            // Desync detected: send authoritative full content sync back to socket
            socket.emit(events.CODE_SYNC, {
              fileId,
              content: doc.content,
              version: doc.version
            });
            return;
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
    if (fileId) {
      socket.to(fileId).emit('workspace:theme', { theme });
    }
  });
};

module.exports = { handleRoomEvents };
