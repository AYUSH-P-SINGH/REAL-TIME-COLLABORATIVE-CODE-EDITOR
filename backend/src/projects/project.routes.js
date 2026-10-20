const express = require('express');
const router = express.Router();
const projectController = require('./project.controller');
const fileRoutes = require('../files/file.routes');
const { protect } = require('../auth/auth.middleware');
const idempotencyMiddleware = require('../middlewares/idempotency.middleware');

router.use(protect);

// Nested sub-resource route: /api/projects/:projectId/files
router.use('/:projectId/files', fileRoutes);

router.route('/')
  .post(idempotencyMiddleware, projectController.createProject)
  .get(projectController.getProjects);

router.route('/:id')
  .get(projectController.getProject)
  .put(projectController.updateProject)
  .patch(projectController.updateProject);

router.post('/:id/invite', projectController.inviteMember);
router.post('/:id/members', projectController.inviteMember);

module.exports = router;
