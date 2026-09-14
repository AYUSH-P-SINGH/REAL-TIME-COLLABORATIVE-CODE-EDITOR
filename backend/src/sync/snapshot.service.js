const cron = require('node-cron');
const File = require('../files/file.model');
const docManager = require('./document.manager');
const logger = require('../utils/logger');

let cronJob = null;

const persistDocument = async (fileId) => {
  try {
    const doc = await docManager.getOrCreateDocument(fileId);
    if (!doc) return;

    await File.findByIdAndUpdate(fileId, {
      content: doc.content,
      version: doc.version
    });

    await docManager.markCleanDoc(fileId);
    logger.debug(`💾 Document persisted: ${fileId} (v${doc.version})`);
  } catch (err) {
    logger.error(`Snapshot persist failed for ${fileId}:`, err);
  }
};

const flushAllDirtyDocuments = async () => {
  try {
    const dirtyFiles = await docManager.getDirtyDocs();
    if (!dirtyFiles || dirtyFiles.length === 0) {
      return 0;
    }

    logger.info(`💾 Flushing ${dirtyFiles.length} dirty documents to MongoDB...`);
    for (const fileId of dirtyFiles) {
      await persistDocument(fileId);
    }
    logger.info(`✅ Successfully flushed ${dirtyFiles.length} documents.`);
    return dirtyFiles.length;
  } catch (err) {
    logger.error('Error during flushAllDirtyDocuments:', err);
    return 0;
  }
};

const startSnapshotWorker = () => {
  // Sweep dirty documents every 1 minute
  cronJob = cron.schedule('*/1 * * * *', async () => {
    try {
      await flushAllDirtyDocuments();
    } catch (err) {
      logger.error('Snapshot Worker periodic sweep error:', err);
    }
  });

  logger.info('🕒 Snapshot worker scheduled (1-min interval).');
};

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
