const projectService = require('./project.service');
const { generateETag, checkPreconditions, isNotModified } = require('../utils/concurrency');
const { paginateArray } = require('../utils/pagination');

const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }
    const project = await projectService.createProject(name, description, req.user.id);
    const etag = generateETag(project);
    res.setHeader('ETag', etag);

    res.status(201).json({ success: true, data: project, etag });
  } catch (error) {
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getUserProjects(req.user.id);
    const pagination = paginateArray(projects, {
      cursor: req.query.cursor,
      limit: req.query.limit || 20
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

const getProject = async (req, res, next) => {
  try {
    const isAllowed = await projectService.hasPermission(req.params.id, req.user.id, 'viewer');
    if (!isAllowed) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
    }

    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const etag = generateETag(project);
    res.setHeader('ETag', etag);

    if (isNotModified(req, etag)) {
      return res.status(304).end();
    }

    res.status(200).json({ success: true, data: project, etag });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const isOwnerOrEditor = await projectService.hasPermission(req.params.id, req.user.id, 'editor');
    if (!isOwnerOrEditor) {
      return res.status(403).json({ success: false, message: 'Forbidden: Requires editor/owner privileges' });
    }

    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Optimistic Concurrency Control Check
    const currentETag = generateETag(project);
    checkPreconditions(req, currentETag);

    const { name, description } = req.body;
    const updated = await projectService.updateProject(req.params.id, { name, description });
    const newETag = generateETag(updated);
    res.setHeader('ETag', newETag);

    res.status(200).json({ success: true, data: updated, etag: newETag });
  } catch (error) {
    next(error);
  }
};

const inviteMember = async (req, res, next) => {
  try {
    const isOwnerOrEditor = await projectService.hasPermission(req.params.id, req.user.id, 'editor');
    if (!isOwnerOrEditor) {
      return res.status(403).json({ success: false, message: 'Forbidden: Requires editor/owner privileges' });
    }
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    const project = await projectService.addMember(req.params.id, email, role);
    const etag = generateETag(project);
    res.setHeader('ETag', etag);

    res.status(200).json({ success: true, data: project, etag });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  inviteMember
};
