const Project = require('./project.model');
const userService = require('../users/user.service');

const createProject = async (name, description, ownerId) => {
  return Project.create({
    name,
    description,
    owner: ownerId,
    members: [{ user: ownerId, role: 'editor' }]
  });
};

const getUserProjects = async (userId) => {
  return Project.find({
    $or: [
      { owner: userId },
      { 'members.user': userId }
    ]
  }).populate('owner', 'name email avatarUrl');
};

const getProjectById = async (projectId) => {
  return Project.findById(projectId)
    .populate('owner', 'name email avatarUrl')
    .populate('members.user', 'name email avatarUrl');
};

const addMember = async (projectId, email, role = 'editor') => {
  const user = await userService.findByEmail(email);
  if (!user) {
    const err = new Error('User with this email not found');
    err.statusCode = 404;
    throw err;
  }

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
};

const hasPermission = async (projectId, userId, requiredRole = 'viewer') => {
  const project = await Project.findById(projectId);
  if (!project) return false;

  if (project.owner.toString() === userId) return true;

  const member = project.members.find(m => m.user.toString() === userId);
  if (!member) return false;

  if (requiredRole === 'editor' && member.role !== 'editor') {
    return false;
  }

  return true;
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  addMember,
  hasPermission
};
