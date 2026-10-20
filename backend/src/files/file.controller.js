const fileService = require('./file.service');
const projectService = require('../projects/project.service');
const { generateETag, checkPreconditions, isNotModified } = require('../utils/concurrency');
const { paginateArray } = require('../utils/pagination');

const getFiles = async (req, res, next) => {
  try {
    // Support both query param (?projectId=...) and nested route param (/projects/:id/files)
    const projectId = req.params.projectId || req.params.id || req.query.projectId;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId parameter is required' });
    }

    const hasAccess = await projectService.hasPermission(projectId, req.user.id, 'viewer');
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
    }

    const files = await fileService.getFilesByProject(projectId);
    const pagination = paginateArray(files, {
      cursor: req.query.cursor,
      limit: req.query.limit || 50
    });

    res.status(200).json({
      success: true,
      data: pagination.items,
      pagination: {
        nextCursor: pagination.nextCursor,
        hasMore: pagination.hasMore,
        limit: pagination.limit,
        total: pagination.total
      }
    });
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

    const etag = generateETag(file);
    res.setHeader('ETag', etag);

    if (isNotModified(req, etag)) {
      return res.status(304).end();
    }

    res.status(200).json({ success: true, data: file, etag });
  } catch (error) {
    next(error);
  }
};

const createFile = async (req, res, next) => {
  try {
    const project = req.params.projectId || req.params.id || req.body.project;
    const { name, path, type, content } = req.body;

    if (!project || !name || !path || !type) {
      return res.status(400).json({ success: false, message: 'Missing required workspace fields' });
    }

    const isEditor = await projectService.hasPermission(project, req.user.id, 'editor');
    if (!isEditor) {
      return res.status(403).json({ success: false, message: 'Forbidden: Requires editor privileges' });
    }

    const newFile = await fileService.createFile(project, name, path, type, content);
    const etag = generateETag(newFile);
    res.setHeader('ETag', etag);

    res.status(201).json({ success: true, data: newFile, etag });
  } catch (error) {
    next(error);
  }
};

const updateFile = async (req, res, next) => {
  try {
    const file = await fileService.getFileContent(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isEditor = await projectService.hasPermission(file.project, req.user.id, 'editor');
    if (!isEditor) {
      return res.status(403).json({ success: false, message: 'Forbidden: Requires editor privileges' });
    }

    // Optimistic Concurrency Control (OCC) Check
    const currentETag = generateETag(file);
    checkPreconditions(req, currentETag);

    const { name, path } = req.body;
    const updated = await fileService.updateFileMetadata(req.params.id, { name, path });
    const newETag = generateETag(updated);
    res.setHeader('ETag', newETag);

    res.status(200).json({ success: true, data: updated, etag: newETag });
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
  updateFile,
  deleteFile
};
