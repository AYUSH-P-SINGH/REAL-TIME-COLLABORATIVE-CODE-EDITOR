const File = require('./file.model');

const getFilesByProject = async (projectId) => {
  return File.find({ project: projectId }).select('-content');
};

const getFileContent = async (fileId) => {
  return File.findById(fileId);
};

const createFile = async (projectId, name, path, type, content = '') => {
  return File.create({
    name,
    path,
    type,
    project: projectId,
    content: type === 'file' ? content : undefined,
    version: 0
  });
};

const updateFileContent = async (fileId, content, version) => {
  return File.findByIdAndUpdate(
    fileId,
    { content, version },
    { new: true }
  );
};

const deleteFile = async (fileId) => {
  const file = await File.findById(fileId);
  if (!file) {
    const err = new Error('File not found');
    err.statusCode = 404;
    throw err;
  }

  if (file.type === 'directory') {
    // Delete all child files/directories nested under this path prefix
    const prefixPattern = new RegExp(`^${file.path}/`);
    await File.deleteMany({ project: file.project, path: prefixPattern });
  }

  await File.findByIdAndDelete(fileId);
};

module.exports = {
  getFilesByProject,
  getFileContent,
  createFile,
  updateFileContent,
  deleteFile
};
