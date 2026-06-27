const { cacheClient } = require('../config/redis');
const File = require('../files/file.model');

const getOrCreateDocument = async (fileId) => {
  const redisKey = `doc:${fileId}`;
  
  const cached = await cacheClient.get(redisKey);
  if (cached) {
    return JSON.parse(cached);
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
  
  await cacheClient.set(redisKey, JSON.stringify(document), { EX: 3600 * 24 }); // Cache for 24 hours
  return document;
};

const updateDocumentState = async (fileId, newContent, newVersion) => {
  const redisKey = `doc:${fileId}`;
  const document = { fileId, content: newContent, version: newVersion };
  await cacheClient.set(redisKey, JSON.stringify(document), { EX: 3600 * 24 });
  return document;
};

module.exports = { getOrCreateDocument, updateDocumentState };
