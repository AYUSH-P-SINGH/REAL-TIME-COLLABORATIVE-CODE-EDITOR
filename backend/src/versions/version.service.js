const Version = require('./version.model');

const createVersion = async (fileId, versionNumber, content, userId = null) => {
  return Version.create({
    file: fileId,
    versionNumber,
    content,
    modifiedBy: userId
  });
};

const getVersionHistory = async (fileId) => {
  return Version.find({ file: fileId })
    .sort({ versionNumber: -1 })
    .populate('modifiedBy', 'name email avatarUrl');
};

module.exports = {
  createVersion,
  getVersionHistory
};
