const mongoose = require('mongoose');
const { cacheClient } = require('../config/redis');
const File = require('../files/file.model');
const crdt = require('./crdt');
const walService = require('./wal.service');
const logger = require('../utils/logger');

// In-memory document cache: Map<fileId, { fileId, doc: Y.Doc, version: number, lastSeq: number, dirty: boolean }>
const inMemoryDocCache = new Map();
const inMemoryDirtyDocs = new Set();
const inMemorySnapshots = new Map(); // fileId -> { snapshot: Buffer, content: string, version: number, lastSnapshotSeq: number }

/**
 * Loads or initializes an authoritative Yjs document in memory.
 * Replays any pending WAL entries on top of the latest snapshot to ensure zero data loss.
 *
 * @param {string} fileId
 * @returns {Promise<{ fileId: string, doc: Y.Doc, version: number, lastSeq: number }>}
 */
const getOrCreateDocument = async (fileId) => {
  if (inMemoryDocCache.has(fileId)) {
    return inMemoryDocCache.get(fileId);
  }

  let doc;
  let version = 0;
  let lastSnapshotSeq = 0;

  // 1. Try loading from MongoDB if connected
  let file = null;
  if (mongoose.connection.readyState === 1) {
    try {
      file = await File.findById(fileId);
    } catch (err) {
      logger.debug(`File lookup error for ${fileId}: ${err.message}`);
    }
  }

  if (file) {
    version = file.version || 0;
    lastSnapshotSeq = file.lastSnapshotSeq || 0;

    if (file.yjsSnapshot && file.yjsSnapshot.length > 0) {
      doc = crdt.initDocFromState(file.yjsSnapshot);
    } else {
      doc = crdt.createDoc(file.content || '');
    }
  } else if (inMemorySnapshots.has(fileId)) {
    const memSnap = inMemorySnapshots.get(fileId);
    version = memSnap.version || 0;
    lastSnapshotSeq = memSnap.lastSnapshotSeq || 0;
    doc = crdt.initDocFromState(memSnap.snapshot);
  } else {
    doc = crdt.createDoc('');
  }

  // 2. Replay Write-Ahead Log (WAL) tail to recover any un-snapshotted updates
  const pendingUpdates = await walService.getPendingUpdates(fileId, lastSnapshotSeq);
  if (pendingUpdates && pendingUpdates.length > 0) {
    logger.info(`🔄 Replaying ${pendingUpdates.length} WAL updates for document ${fileId}`);
    for (const entry of pendingUpdates) {
      crdt.applyUpdate(doc, entry.update);
      if (entry.seq > lastSnapshotSeq) {
        lastSnapshotSeq = entry.seq;
      }
    }
  }

  const docRecord = {
    fileId,
    doc,
    version,
    lastSeq: lastSnapshotSeq,
    dirty: false
  };

  inMemoryDocCache.set(fileId, docRecord);
  return docRecord;
};

/**
 * Applies a binary Yjs update from a client, logs it to WAL, and tracks dirty state.
 *
 * @param {string} fileId
 * @param {Uint8Array|Buffer} update
 * @param {string} [userId=null]
 * @returns {Promise<{ docRecord: object, seq: number, success: boolean }>}
 */
const applyClientUpdate = async (fileId, update, userId = null) => {
  const docRecord = await getOrCreateDocument(fileId);

  // 1. Apply to Yjs CRDT model
  const applied = crdt.applyUpdate(docRecord.doc, update);
  if (!applied) {
    throw new Error('Failed to apply Yjs binary update');
  }

  // 2. Append to Write-Ahead Log (WAL)
  const { seq } = await walService.appendUpdate(fileId, update, userId);
  docRecord.lastSeq = seq;
  docRecord.version += 1;
  docRecord.dirty = true;

  // 3. Mark as dirty in Redis & memory
  inMemoryDirtyDocs.add(fileId);
  if (cacheClient && cacheClient.isOpen) {
    try {
      await cacheClient.sAdd('dirty_docs', String(fileId));
    } catch (err) {
      // Fallback
    }
  }

  return { docRecord, seq, success: true };
};

/**
 * Returns plain-text content of the document.
 */
const getDocumentText = async (fileId) => {
  const docRecord = await getOrCreateDocument(fileId);
  return crdt.getText(docRecord.doc);
};

/**
 * Returns full binary state of the document for new clients joining the room.
 */
const getDocumentState = async (fileId) => {
  const docRecord = await getOrCreateDocument(fileId);
  return crdt.encodeState(docRecord.doc);
};

/**
 * Returns list of documents that have pending edits needing snapshot compaction.
 */
const getDirtyDocs = async () => {
  if (cacheClient && cacheClient.isOpen) {
    try {
      const members = await cacheClient.sMembers('dirty_docs');
      return Array.from(new Set([...members, ...inMemoryDirtyDocs]));
    } catch (err) {
      return Array.from(inMemoryDirtyDocs);
    }
  }
  return Array.from(inMemoryDirtyDocs);
};

/**
 * Marks a document as clean after successful snapshot compaction to MongoDB.
 */
const markCleanDoc = async (fileId) => {
  if (cacheClient && cacheClient.isOpen) {
    try {
      await cacheClient.sRem('dirty_docs', String(fileId));
    } catch (err) {
      // Fallback
    }
  }
  inMemoryDirtyDocs.delete(fileId);
  const docRecord = inMemoryDocCache.get(fileId);
  if (docRecord) {
    docRecord.dirty = false;
  }
};

/**
 * Evicts document from memory (used during testing or cleanup).
 */
const evictDocFromMemory = (fileId) => {
  inMemoryDocCache.delete(fileId);
};

const saveSnapshot = (fileId, snapshot, content, version = 0, lastSnapshotSeq = 0) => {
  inMemorySnapshots.set(fileId, {
    snapshot: Buffer.isBuffer(snapshot) ? snapshot : Buffer.from(snapshot),
    content,
    version,
    lastSnapshotSeq
  });
};

module.exports = {
  getOrCreateDocument,
  applyClientUpdate,
  getDocumentText,
  getDocumentState,
  getDirtyDocs,
  markCleanDoc,
  evictDocFromMemory,
  saveSnapshot,
  inMemoryDocCache,
  inMemoryDirtyDocs,
  inMemorySnapshots
};
