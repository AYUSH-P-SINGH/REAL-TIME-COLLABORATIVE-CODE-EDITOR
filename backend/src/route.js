const express = require('express');
const router = express.Router();

const authRoutes = require('./auth/auth.routes');
const projectRoutes = require('./projects/project.routes');
const fileRoutes = require('./files/file.routes');

// System Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'UP', timestamp: new Date() });
});

// API Routes Mounting
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/files', fileRoutes);

module.exports = router;