// File Size Limit Middleware
const logger = require('../utils/logger');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PROJECT_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB per project

const checkFileSize = (req, res, next) => {
  try {
    const contentLength = req.headers['content-length'];

    if (!contentLength) {
      return next();
    }

    const fileSizeInBytes = parseInt(contentLength, 10);

    if (fileSizeInBytes > MAX_FILE_SIZE) {
      logger.warn(
        `File size exceeds limit: ${fileSizeInBytes} bytes (max: ${MAX_FILE_SIZE})`
      );
      return res.status(413).json({
        success: false,
        message: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }

    // Attach size info to request
    req.fileSize = fileSizeInBytes;
    next();
  } catch (error) {
    logger.error(`File size check error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: 'Invalid content length',
    });
  }
};

const checkProjectSize = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const File = require('../files/file.model');

    // Calculate total project size
    const files = await File.find({ projectId });
    const totalSize = files.reduce((sum, file) => {
      return sum + (file.content ? Buffer.byteLength(file.content) : 0);
    }, 0);

    const newFileSize = req.fileSize || 0;

    if (totalSize + newFileSize > MAX_PROJECT_TOTAL_SIZE) {
      logger.warn(
        `Project size would exceed limit: ${totalSize + newFileSize} bytes`
      );
      return res.status(413).json({
        success: false,
        message: `Project size would exceed maximum limit of ${MAX_PROJECT_TOTAL_SIZE / 1024 / 1024}MB`,
      });
    }

    req.projectSize = totalSize;
    next();
  } catch (error) {
    logger.error(`Project size check error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Project size check failed',
    });
  }
};

module.exports = {
  checkFileSize,
  checkProjectSize,
  MAX_FILE_SIZE,
  MAX_PROJECT_TOTAL_SIZE,
};
