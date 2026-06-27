const projectService = require('./project.service');

const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }
    const project = await projectService.createProject(name, description, req.user.id);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getUserProjects(req.user.id);
    res.status(200).json({ success: true, data: projects });
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
    res.status(200).json({ success: true, data: project });
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
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  inviteMember
};
