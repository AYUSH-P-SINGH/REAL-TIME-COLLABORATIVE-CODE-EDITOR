
const logger = require('../utils/logger');
const Project = require('../projects/project.model');
const File = require('../files/file.model');
const checkProjectOwnership = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    const isOwner = project.owner.toString() === userId;
    const isCollaborator = project.collaborators.some(
      (collab) => collab.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      logger.warn(`Unauthorized access attempt by user ${userId} to project ${projectId}`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }
    req.project = project;
    req.isOwner = isOwner;
    next();
  } catch (error) {
    logger.error(`Authorization check failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};
const checkFileAccess = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const file = await File.findById(fileId).populate('projectId');
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const project = file.projectId;
    const isOwner = project.owner.toString() === userId;
    const isCollaborator = project.collaborators.some(
      (collab) => collab.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      logger.warn(`Unauthorized file access by user ${userId} to file ${fileId}`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this file',
      });
    }

    req.file = file;
    req.isProjectOwner = isOwner;
    next();
  } catch (error) {
    logger.error(`File access check failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'File access check failed',
    });
  }
};
const checkProjectOwnerOnly = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (project.owner.toString() !== userId) {
      logger.warn(`Owner-only access denied for user ${userId} to project ${projectId}`);
      return res.status(403).json({
        success: false,
        message: 'Only project owner can perform this action',
      });
    }

    req.project = project;
    next();
  } catch (error) {
    logger.error(`Owner check failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};

module.exports = {
  checkProjectOwnership,
  checkFileAccess,
  checkProjectOwnerOnly,
};
