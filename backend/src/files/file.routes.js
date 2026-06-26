const express = require('express');
const router = express.Router();
const fileController = require('./file.controller');
const { protect } = require('../auth/auth.middleware');

router.use(protect);

router.route('/')
  .get(fileController.getFiles)
  .post(fileController.createFile);

router.route('/:id')
  .get(fileController.getFileContent)
  .delete(fileController.deleteFile);

module.exports = router;
