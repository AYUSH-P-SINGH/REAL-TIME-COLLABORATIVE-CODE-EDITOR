const cron = require('node-cron');
const File = require('../files/file.model');
const docManager = require('./document.manager');
const crdt = require('./crdt');
const walService = require('./wal.service');
const versionService = require('../versions/version.service');
const logger = require('../utils/logger');

let cronJob = null;

/**
 * Persists a snapshot of the document to MongoDB and compacts the Write-Ahead Log.
 *
 * @param {string} fileId
 */
const persistDocument = async (fileId) => {
  try {
    const docRecord = await docManager.getOrCreateDocument(fileId);
    if (!docRecord) return;

    const content = crdt.getText(docRecord.doc);
    const snapshotBuffer = Buffer.from(crdt.encodeState(docRecord.doc));
    const snapshotSeq = docRecord.lastSeq || 0;

    // 1. Update File document in MongoDB with snapshot and plain text
    try {
      await File.findByIdAndUpdate(fileId, {
        content,
        version: docRecord.version,
        yjsSnapshot: snapshotBuffer,
        lastSnapshotSeq: snapshotSeq
      });
    } catch (err) {
      logger.debug(`File snapshot update notice for ${fileId}: ${err.message}`);
    }

    docManager.saveSnapshot(fileId, snapshotBuffer, content, docRecord.version, snapshotSeq);

    // 2. Compact Write-Ahead Log (delete all entries prior to or equal to this snapshot seq)
    await walService.compactLog(fileId, snapshotSeq);

    // 3. Mark document as clean in cache
    await docManager.markCleanDoc(fileId);

    // 4. Optionally register version history entry
    try {
      if (docRecord.version > 0 && docRecord.version % 10 === 0) {
        await versionService.createVersion(fileId, docRecord.version, content, null);
      }
    } catch (err) {
      // Ignore version creation errors
    }

    logger.debug(`💾 Document snapshot persisted & compacted: ${fileId} (v${docRecord.version}, seq=${snapshotSeq})`);
  } catch (err) {
    logger.error(`Snapshot persist failed for ${fileId}:`, err);
  }
};

/**
 * Flushes all pending dirty documents to database storage.
 */
const flushAllDirtyDocuments = async () => {
  try {
    const dirtyFiles = await docManager.getDirtyDocs();
    if (!dirtyFiles || dirtyFiles.length === 0) {
      return 0;
    }

    logger.info(`💾 Flushing ${dirtyFiles.length} dirty documents with WAL compaction...`);
    for (const fileId of dirtyFiles) {
      await persistDocument(fileId);
    }
    logger.info(`✅ Successfully flushed and compacted ${dirtyFiles.length} documents.`);
    return dirtyFiles.length;
  } catch (err) {
    logger.error('Error during flushAllDirtyDocuments:', err);
    return 0;
  }
};

/**
 * Starts the periodic snapshot worker.
 */
const startSnapshotWorker = () => {
  // Sweep dirty documents every 1 minute
  cronJob = cron.schedule('*/1 * * * *', async () => {
    try {
      await flushAllDirtyDocuments();
    } catch (err) {
      logger.error('Snapshot Worker periodic sweep error:', err);
    }
  });

  logger.info('🕒 Snapshot worker scheduled (1-min interval with WAL compaction).');
};

/**
 * Stops the periodic snapshot worker.
 */
const stopSnapshotWorker = () => {
  if (cronJob) {
    cronJob.stop();
  }
};

module.exports = {
  persistDocument,
  flushAllDirtyDocuments,
  startSnapshotWorker,
  stopSnapshotWorker
};
