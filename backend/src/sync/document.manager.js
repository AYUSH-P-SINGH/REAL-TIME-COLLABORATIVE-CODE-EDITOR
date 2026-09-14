const { cacheClient } = require('../config/redis');
const File = require('../files/file.model');

const inMemoryDocCache = new Map();
const inMemoryDirtyDocs = new Set();

const getOrCreateDocument = async (fileId) => {
  const redisKey = `doc:${fileId}`;

  if (cacheClient && cacheClient.isOpen) {
    try {
      const cached = await cacheClient.get(redisKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // Fallback
    }
  } else if (inMemoryDocCache.has(fileId)) {
    return inMemoryDocCache.get(fileId);
  }

  const file = await File.findById(fileId);
  if (!file) {
    throw new Error('File not found');
  }

  const document = {
    fileId,
    content: file.content || '',
    version: file.version || 0
  };

  if (cacheClient && cacheClient.isOpen) {
    try {
      await cacheClient.set(redisKey, JSON.stringify(document), { EX: 3600 * 24 });
    } catch (err) {
      // Fallback
    }
  }

  inMemoryDocCache.set(fileId, document);
  return document;
};

const updateDocumentState = async (fileId, newContent, newVersion) => {
  const redisKey = `doc:${fileId}`;
  const document = { fileId, content: newContent, version: newVersion };

  if (cacheClient && cacheClient.isOpen) {
    try {
      await cacheClient.set(redisKey, JSON.stringify(document), { EX: 3600 * 24 });
      await cacheClient.sAdd('dirty_docs', fileId);
    } catch (err) {
      // Fallback
    }
  }

  inMemoryDocCache.set(fileId, document);
  inMemoryDirtyDocs.add(fileId);

  return document;
};

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

const markCleanDoc = async (fileId) => {
  if (cacheClient && cacheClient.isOpen) {
    try {
      await cacheClient.sRem('dirty_docs', fileId);
    } catch (err) {
      // Fallback
    }
  }
  inMemoryDirtyDocs.delete(fileId);
};

module.exports = {
  getOrCreateDocument,
  updateDocumentState,
  getDirtyDocs,
  markCleanDoc,
  inMemoryDocCache
};
