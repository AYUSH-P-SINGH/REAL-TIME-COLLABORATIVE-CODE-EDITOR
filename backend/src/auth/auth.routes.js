const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const rateLimiter = require('../middlewares/rateLimit');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { registerSchema, loginSchema } = require('../utils/validation.schemas');

// Rate limited public auth routes
router.post('/register', rateLimiter(10, 60), validate(registerSchema), authController.register);
router.post('/login', rateLimiter(15, 60), validate(loginSchema), authController.login);
router.post('/demo', rateLimiter(20, 60), authController.demoLogin);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', protect, authController.getMe);
router.post('/ws-ticket', protect, authController.createWsTicket);

module.exports = router;
