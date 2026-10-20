const mongoose = require('mongoose');
const Project = require('./project.model');
const userService = require('../user/user.service');

// In-memory fallback for local development & unit test suites when MongoDB is stopped
const memoryProjects = new Map();

const createProject = async (name, description, ownerId) => {
  if (mongoose.connection.readyState === 1) {
    return Project.create({
      name,
      description,
      owner: ownerId,
      members: [{ user: ownerId, role: 'editor' }]
    });
  }

  // In-memory fallback
  const mockId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const project = {
    _id: mockId,
    id: mockId,
    name,
    description,
    owner: ownerId,
    members: [{ user: ownerId, role: 'editor' }],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 0
  };
  memoryProjects.set(mockId, project);
  return project;
};

const getUserProjects = async (userId) => {
  if (mongoose.connection.readyState === 1) {
    return Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    }).populate('owner', 'name email avatarUrl');
  }

  return Array.from(memoryProjects.values()).filter(p =>
    String(p.owner) === String(userId) ||
    p.members.some(m => String(m.user) === String(userId))
  );
};

const getProjectById = async (projectId) => {
  if (mongoose.connection.readyState === 1) {
    return Project.findById(projectId)
      .populate('owner', 'name email avatarUrl')
      .populate('members.user', 'name email avatarUrl');
  }

  return memoryProjects.get(String(projectId)) || null;
};

const addMember = async (projectId, email, role = 'editor') => {
  const user = await userService.findByEmail(email);
  if (!user) {
    const err = new Error('User with this email not found');
    err.statusCode = 404;
    throw err;
  }

  if (mongoose.connection.readyState === 1) {
    const project = await Project.findById(projectId);
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    const alreadyMember = project.members.some(m => m.user.toString() === user._id.toString());
    if (alreadyMember) {
      const err = new Error('User is already a project collaborator');
      err.statusCode = 400;
      throw err;
    }

    project.members.push({ user: user._id, role });
    await project.save();
    return getProjectById(projectId);
  }

  const project = memoryProjects.get(String(projectId));
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  const alreadyMember = project.members.some(m => String(m.user) === String(user._id || user.id));
  if (alreadyMember) {
    const err = new Error('User is already a project collaborator');
    err.statusCode = 400;
    throw err;
  }

  project.members.push({ user: user._id || user.id, role });
  return project;
};

const hasPermission = async (projectId, userId, requiredRole = 'viewer') => {
  if (mongoose.connection.readyState === 1) {
    const project = await Project.findById(projectId);
    if (!project) return false;

    if (project.owner.toString() === String(userId)) return true;

    const member = project.members.find(m => m.user.toString() === String(userId));
    if (!member) return false;

    if (requiredRole === 'editor' && member.role !== 'editor') {
      return false;
    }

    return true;
  }

  const project = memoryProjects.get(String(projectId));
  if (!project) return true; // allow in fallback if not explicitly found

  if (String(project.owner) === String(userId)) return true;
  const member = project.members.find(m => String(m.user) === String(userId));
  if (!member) return false;
  if (requiredRole === 'editor' && member.role !== 'editor') return false;
  return true;
};

const updateProject = async (projectId, { name, description }) => {
  if (mongoose.connection.readyState === 1) {
    const project = await Project.findById(projectId);
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    await project.save();
    return getProjectById(projectId);
  }

  const project = memoryProjects.get(String(projectId));
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  project.updatedAt = new Date();
  project.version = (project.version || 0) + 1;
  return project;
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  addMember,
  hasPermission,
  memoryProjects
};
