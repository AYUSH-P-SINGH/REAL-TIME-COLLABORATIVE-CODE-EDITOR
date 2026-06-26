const fileService = require('./file.service');
const projectService = require('../projects/project.service');

const getFiles = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId query parameter is required' });
    }
    const hasAccess = await projectService.hasPermission(projectId, req.user.id, 'viewer');
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
    }
    const files = await fileService.getFilesByProject(projectId);
    res.status(200).json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
};

const getFileContent = async (req, res, next) => {
  try {
    const file = await fileService.getFileContent(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    const hasAccess = await projectService.hasPermission(file.project, req.user.id, 'viewer');
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
    }
    res.status(200).json({ success: true, data: file });
  } catch (error) {
    next(error);
  }
};

const createFile = async (req, res, next) => {
  try {
    const { project, name, path, type, content } = req.body;
    if (!project || !name || !path || !type) {
      return res.status(400).json({ success: false, message: 'Missing required workspace fields' });
    }
    const isEditor = await projectService.hasPermission(project, req.user.id, 'editor');
    if (!isEditor) {
      return res.status(403).json({ success: false, message: 'Forbidden: Requires editor privileges' });
    }
    const newFile = await fileService.createFile(project, name, path, type, content);
    res.status(201).json({ success: true, data: newFile });
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const file = await fileService.getFileContent(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    const isEditor = await projectService.hasPermission(file.project, req.user.id, 'editor');
    if (!isEditor) {
      return res.status(403).json({ success: false, message: 'Forbidden: Requires editor privileges' });
    }
    await fileService.deleteFile(req.params.id);
    res.status(200).json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFiles,
  getFileContent,
  createFile,
  deleteFile
};
