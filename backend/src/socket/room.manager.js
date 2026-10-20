const mongoose = require('mongoose');
const events = require('./events');
const docManager = require('../sync/document.manager');
const crdt = require('../sync/crdt');
const snapshotService = require('../sync/snapshot.service');
const File = require('../files/file.model');
const projectService = require('../projects/project.service');
const metrics = require('../utils/metrics');
const logger = require('../utils/logger');

// Per-socket rate limiter token bucket to prevent event flooding (max 120 ops/sec)
const socketRateLimits = new Map(); // socketId -> { count, lastReset }

const isRateLimited = (socketId, limit = 120) => {
  const now = Date.now();
  let bucket = socketRateLimits.get(socketId);
  if (!bucket || now - bucket.lastReset > 1000) {
    bucket = { count: 1, lastReset: now };
    socketRateLimits.set(socketId, bucket);
    return false;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    metrics.rateLimitHits.inc();
    return true;
  }
  return false;
};

/**
 * Socket Backpressure Guard
 * Inspects send buffer size. If buffer exceeds limits, drops ephemeral
 * awareness messages, or disconnects runaway consumers before server memory leaks.
 */
const checkBackpressure = (targetSocket, isEphemeral = false) => {
  const writeBufferLen = targetSocket.conn?.writeBuffer?.length || 0;
  if (writeBufferLen > 150) {
    logger.warn(`⚠️ Critical backpressure on socket ${targetSocket.id} (${writeBufferLen} queued packets). Disconnecting slow consumer.`);
    targetSocket.disconnect(true);
    return false;
  }
  if (isEphemeral && writeBufferLen > 25) {
    // Drop ephemeral awareness frame under network congestion
    return false;
  }
  return true;
};

const handleRoomEvents = (socket) => {
  // 1. Join Document Room
  socket.on(events.ROOM_JOIN, async ({ fileId }) => {
    try {
      if (!fileId) {
        return socket.emit(events.ERROR, { message: 'fileId is required to join document room.' });
      }

      let file = null;
      if (mongoose.connection.readyState === 1) {
        try {
          file = await File.findById(fileId);
        } catch (e) {
          // Ephemeral or test fileId
        }
      }

      if (file) {
        const hasAccess = await projectService.hasPermission(file.project, socket.user.id, 'viewer');
        if (!hasAccess) {
          return socket.emit(events.ERROR, {
            code: 'FORBIDDEN',
            message: 'Access denied: You are not authorized to view this document.'
          });
        }
      }

      socket.join(fileId);
      logger.info(`👤 User ${socket.user.id} (${socket.user.name || 'Anonymous'}) joined room: ${fileId}`);

      // Retrieve authoritative document state and plain text
      const docRecord = await docManager.getOrCreateDocument(fileId);
      const stateBuffer = Buffer.from(crdt.encodeState(docRecord.doc));
      const content = crdt.getText(docRecord.doc);

      // Emit binary Yjs state vector / snapshot
      socket.emit(events.DOC_SYNC, {
        fileId,
        state: stateBuffer,
        version: docRecord.version,
        lastSeq: docRecord.lastSeq,
        content
      });

      // Also send V1 standard envelope
      socket.emit(events.V1_ENVELOPE, {
        v: 1,
        type: 'sync-step2',
        docId: fileId,
        payload: {
          update: stateBuffer,
          version: docRecord.version,
          seq: docRecord.lastSeq,
          content
        }
      });

      // Legacy fallback sync
      socket.emit(events.CODE_SYNC, {
        fileId,
        content,
        version: docRecord.version
      });

      // Broadcast presence join
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

  // 2. Standardized V1 Protocol Envelope Handler (Resumable Sync, Updates, Awareness)
  socket.on(events.V1_ENVELOPE, async (envelope) => {
    try {
      if (!envelope || envelope.v !== 1 || !envelope.type || !envelope.docId) {
        return;
      }

      const { type, docId, payload } = envelope;

      switch (type) {
      case 'sync-step1': {
        // Resumable reconnect: client sends state vector, server computes and replies with diff
        const docRecord = await docManager.getOrCreateDocument(docId);
        const clientVector = payload?.stateVector;
        let diffBuffer;
        if (clientVector) {
          const uint8Vector = Buffer.isBuffer(clientVector) ? clientVector : Buffer.from(clientVector);
          diffBuffer = Buffer.from(crdt.diffState(docRecord.doc, uint8Vector));
        } else {
          diffBuffer = Buffer.from(crdt.encodeState(docRecord.doc));
        }

        socket.emit(events.V1_ENVELOPE, {
          v: 1,
          type: 'sync-step2',
          docId,
          payload: {
            update: diffBuffer,
            version: docRecord.version,
            seq: docRecord.lastSeq
          }
        });
        break;
      }

      case 'update': {
        if (!payload?.update) return;

        // Rate limit check
        if (isRateLimited(socket.id, 120)) {
          return socket.emit(events.V1_ENVELOPE, {
            v: 1,
            type: 'error',
            docId,
            payload: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded: Please slow down edits.' }
          });
        }

        // RBAC enforcement: verify editor permissions
        let file = null;
        if (mongoose.connection.readyState === 1) {
          try {
            file = await File.findById(docId);
          } catch (e) {
            logger.debug(`File lookup notice: ${e.message}`);
          }
        }
        if (file) {
          const isEditor = await projectService.hasPermission(file.project, socket.user.id, 'editor');
          if (!isEditor) {
            return socket.emit(events.V1_ENVELOPE, {
              v: 1,
              type: 'error',
              docId,
              payload: { code: 'FORBIDDEN', message: 'Viewer cannot modify document.' }
            });
          }
        }

        const updateBuffer = Buffer.isBuffer(payload.update) ? payload.update : Buffer.from(payload.update);
        const { docRecord, seq } = await docManager.applyClientUpdate(docId, updateBuffer, socket.user.id);

        metrics.updatesTotal.inc({ status: 'success' });
        metrics.walWritesTotal.inc();

        // Acknowledge update to sender
        socket.emit(events.V1_ENVELOPE, {
          v: 1,
          type: 'ack',
          docId,
          payload: { seq, version: docRecord.version }
        });

        // Broadcast to peers
        socket.to(docId).emit(events.V1_ENVELOPE, {
          v: 1,
          type: 'update',
          docId,
          payload: {
            update: updateBuffer,
            seq,
            version: docRecord.version,
            senderId: socket.user.id
          }
        });
        break;
      }

      case 'awareness': {
        // Ephemeral awareness message: check backpressure before fanning out
        if (checkBackpressure(socket, true)) {
          socket.to(docId).emit(events.V1_ENVELOPE, {
            v: 1,
            type: 'awareness',
            docId,
            payload: {
              ...payload,
              senderId: socket.user.id,
              userName: socket.user.name
            }
          });
        }
        break;
      }
      }
    } catch (err) {
      logger.error('Error in v1:msg handler:', err);
    }
  });

  // 3. Yjs CRDT Binary Update Handler
  socket.on(events.DOC_UPDATE, async ({ fileId, update, clientTimestamp }) => {
    try {
      if (!fileId || !update) return;

      // Rate limit check (max 120 updates/second)
      if (isRateLimited(socket.id, 120)) {
        return socket.emit(events.ERROR, { message: 'Rate limit exceeded: Please slow down edits.' });
      }

      // Check max message size (64KB)
      const updateBuffer = Buffer.isBuffer(update) ? update : Buffer.from(update);
      if (updateBuffer.length > 64 * 1024) {
        return socket.emit(events.ERROR, { message: 'Payload size exceeds 64KB threshold.' });
      }

      // Verify editor permissions
      let file = null;
      if (mongoose.connection.readyState === 1) {
        try {
          file = await File.findById(fileId);
        } catch (e) {
          // Ignore lookup error
        }
      }

      if (file) {
        const isEditor = await projectService.hasPermission(file.project, socket.user.id, 'editor');
        if (!isEditor) {
          return socket.emit(events.ERROR, {
            code: 'FORBIDDEN',
            message: 'Access denied: You need editor privileges to modify this document.'
          });
        }
      }

      // Apply update atomically to in-memory Yjs doc & append to WAL
      const { docRecord, seq } = await docManager.applyClientUpdate(fileId, updateBuffer, socket.user.id);

      // Record metrics
      metrics.updatesTotal.inc({ status: 'success' });
      metrics.walWritesTotal.inc();

      if (clientTimestamp && typeof clientTimestamp === 'number') {
        const propagationMs = Math.max(0, Date.now() - clientTimestamp);
        metrics.propagationLatency.observe(propagationMs);
      }

      // Broadcast binary update to all peers in the room
      socket.to(fileId).emit(events.DOC_UPDATE, {
        fileId,
        update: updateBuffer,
        seq,
        version: docRecord.version,
        senderId: socket.user.id
      });
    } catch (err) {
      metrics.updatesTotal.inc({ status: 'error' });
      logger.error('Error handling binary doc update:', err);
      socket.emit(events.ERROR, { message: 'Failed to process document edit.' });
    }
  });

  // 4. Legacy Text Edit Fallback Handler
  socket.on(events.CODE_EDIT, async ({ fileId, change, version }) => {
    try {
      if (!fileId) return;

      const docRecord = await docManager.getOrCreateDocument(fileId);

      let updatedText = null;
      if (change) {
        if (change.fullContent !== undefined) {
          updatedText = change.fullContent;
          crdt.setText(docRecord.doc, updatedText);
        } else if (change.text !== undefined) {
          crdt.setText(docRecord.doc, (crdt.getText(docRecord.doc) || '') + change.text);
          updatedText = crdt.getText(docRecord.doc);
        }
      }

      const nextVersion = version || (docRecord.version + 1);
      docRecord.version = nextVersion;

      // Broadcast to other peers
      socket.to(fileId).emit(events.CODE_EDIT, {
        fileId,
        change,
        version: nextVersion,
        senderId: socket.user.id
      });
    } catch (err) {
      logger.error('Error handling legacy code edit:', err);
    }
  });

  // 5. Leave Document Room
  socket.on(events.ROOM_LEAVE, async ({ fileId }) => {
    if (!fileId) return;
    socket.leave(fileId);
    logger.info(`👤 User ${socket.user.id} left room: ${fileId}`);

    socket.to(fileId).emit(events.PRESENCE_UPDATE, {
      userId: socket.user.id,
      action: 'leave',
      userName: socket.user.name
    });

    // Persist snapshot & compact WAL on room leave
    try {
      await snapshotService.persistDocument(fileId);
    } catch (e) {
      // Ignore
    }
  });

  // 6. Workspace Theme Event
  socket.on(events.WORKSPACE_THEME, ({ fileId, theme }) => {
    if (fileId) {
      socket.to(fileId).emit(events.WORKSPACE_THEME, { theme });
    }
  });
};

module.exports = { handleRoomEvents, socketRateLimits, checkBackpressure };
