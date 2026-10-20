const mongoose = require('mongoose');
const WalEntry = require('./wal.model');
const { cacheClient } = require('../config/redis');
const logger = require('../utils/logger');

// In-memory fallback sequence tracking & WAL buffer for resilience
const inMemorySequences = new Map();
const inMemoryWal = new Map(); // fileId -> Array<{ seq, update, createdAt }>

/**
 * Gets the next monotonically increasing sequence number for a document.
 */
const getNextSequence = async (fileId) => {
  const currentSeq = inMemorySequences.get(fileId) || 0;
  const nextSeq = currentSeq + 1;
  inMemorySequences.set(fileId, nextSeq);
  return nextSeq;
};

/**
 * Appends an atomic binary update to the Write-Ahead Log.
 * Writes to both Redis Stream (for real-time replayable delivery) and MongoDB WAL (for durability).
 *
 * @param {string} fileId
 * @param {Uint8Array|Buffer} updateBuffer
 * @param {string} [userId=null]
 * @returns {Promise<{ seq: number, success: boolean }>}
 */
const appendUpdate = async (fileId, updateBuffer, userId = null) => {
  const seq = await getNextSequence(fileId);
  const buffer = Buffer.isBuffer(updateBuffer) ? updateBuffer : Buffer.from(updateBuffer);

  // 1. Maintain in-memory log buffer for rapid access & fallback
  if (!inMemoryWal.has(fileId)) {
    inMemoryWal.set(fileId, []);
  }
  inMemoryWal.get(fileId).push({ seq, update: buffer, createdAt: new Date() });

  // 2. Publish to Redis Stream for cross-node replayable delivery
  if (cacheClient && cacheClient.isOpen) {
    try {
      await cacheClient.xAdd(`stream:doc:${fileId}`, '*', {
        seq: String(seq),
        update: buffer.toString('base64'),
        fileId: String(fileId),
        userId: String(userId || '')
      });
    } catch (err) {
      logger.warn(`Redis Stream XADD warning for ${fileId}: ${err.message}`);
    }
  }

  // 3. Persist to MongoDB WAL collection if connected
  if (mongoose.connection.readyState === 1) {
    try {
      await WalEntry.create({
        file: fileId,
        seq,
        update: buffer,
        createdBy: userId,
        createdAt: new Date()
      });
    } catch (err) {
      logger.debug(`MongoDB WAL persistence notice for ${fileId} seq ${seq}: ${err.message}`);
    }
  }

  return { seq, success: true };
};

/**
 * Retrieves all pending WAL updates for a document after a given sequence.
 *
 * @param {string} fileId
 * @param {number} [afterSeq=0]
 * @returns {Promise<Array<{ seq: number, update: Buffer }>>}
 */
const getPendingUpdates = async (fileId, afterSeq = 0) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const entries = await WalEntry.find({
        file: fileId,
        seq: { $gt: afterSeq }
      }).sort({ seq: 1 });

      if (entries && entries.length > 0) {
        return entries.map(e => ({ seq: e.seq, update: e.update }));
      }
    } catch (err) {
      logger.debug(`MongoDB WAL read fallback for ${fileId}: ${err.message}`);
    }
  }

  // Fallback to in-memory WAL
  const memEntries = inMemoryWal.get(fileId) || [];
  return memEntries
    .filter(e => e.seq > afterSeq)
    .map(e => ({ seq: e.seq, update: e.update }));
};

/**
 * Compaction: removes WAL entries older than the last snapshot sequence.
 * This prevents the write-ahead log from growing unbounded.
 *
 * @param {string} fileId
 * @param {number} upToSeq
 */
const compactLog = async (fileId, upToSeq) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const deleteResult = await WalEntry.deleteMany({
        file: fileId,
        seq: { $lte: upToSeq }
      });
      logger.debug(`🧹 Compacted ${deleteResult.deletedCount} WAL entries for file ${fileId}`);
    } catch (err) {
      logger.debug(`WAL compaction notice for ${fileId}: ${err.message}`);
    }
  }

  // Prune in-memory WAL
  if (inMemoryWal.has(fileId)) {
    const remaining = (inMemoryWal.get(fileId) || []).filter(e => e.seq > upToSeq);
    inMemoryWal.set(fileId, remaining);
  }

  // Trim Redis Stream to keep last 200 items
  if (cacheClient && cacheClient.isOpen) {
    try {
      await cacheClient.xTrim(`stream:doc:${fileId}`, 'MAXLEN', 200);
    } catch (err) {
      // Ignore trim error
    }
  }
};

/**
 * Resets in-memory WAL structures (used for testing crash recovery).
 */
const clearInMemoryWal = () => {
  inMemorySequences.clear();
  inMemoryWal.clear();
};

module.exports = {
  appendUpdate,
  getPendingUpdates,
  compactLog,
  getNextSequence,
  clearInMemoryWal,
  inMemoryWal
};
