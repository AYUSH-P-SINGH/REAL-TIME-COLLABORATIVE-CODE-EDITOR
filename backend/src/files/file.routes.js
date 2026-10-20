const express = require('express');
const router = express.Router({ mergeParams: true });
const fileController = require('./file.controller');
const { protect } = require('../auth/auth.middleware');
const idempotencyMiddleware = require('../middlewares/idempotency.middleware');

router.use(protect);

router.route('/')
  .get(fileController.getFiles)
  .post(idempotencyMiddleware, fileController.createFile);

router.route('/:id')
  .get(fileController.getFileContent)
  .put(fileController.updateFile)
  .patch(fileController.updateFile)
  .delete(fileController.deleteFile);

module.exports = router;
