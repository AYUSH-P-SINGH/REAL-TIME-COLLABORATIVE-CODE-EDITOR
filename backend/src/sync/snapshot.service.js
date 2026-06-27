const cron = require('node-cron');
const { cacheClient } = require('../config/redis');
const File = require('../files/file.model');
const logger = require('../utils/logger');

const startSnapshotWorker = () => {
  // Run every 5 minutes to sweep/dump active memory contents to MongoDB database
  cron.schedule('*/5 * * * *', async () => {
    logger.info('⏰ Snapshot Worker: Initiating database sweep...');
    try {
      const keys = await cacheClient.keys('doc:*');
      if (keys.length === 0) {
        logger.info('⏰ Snapshot Worker: No dirty files to persist.');
        return;
      }

      for (const key of keys) {
        try {
          const fileId = key.split(':')[1];
          const data = await cacheClient.get(key);
          if (!data) continue;

          const { content, version } = JSON.parse(data);

          // Update MongoDB file payload
          await File.findByIdAndUpdate(fileId, {
            content,
            version
          });

          logger.debug(`💾 Snapshot saved: ${fileId} (Version: ${version})`);
        } catch (fileErr) {
          logger.error(`❌ Snapshot sweep failed for key ${key}:`, fileErr);
        }
      }
    } catch (err) {
      logger.error('❌ Snapshot Worker experienced database connectivity error:', err);
    }
  });
};

module.exports = { startSnapshotWorker };
