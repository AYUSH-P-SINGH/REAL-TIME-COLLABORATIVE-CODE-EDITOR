const express = require('express');
const router = express.Router();
const projectController = require('./project.controller');
const { protect } = require('../auth/auth.middleware');

router.use(protect);

router.route('/')
  .post(projectController.createProject)
  .get(projectController.getProjects);

router.route('/:id')
  .get(projectController.getProject);

router.post('/:id/invite', projectController.inviteMember);
router.post('/:id/members', projectController.inviteMember);

module.exports = router;
