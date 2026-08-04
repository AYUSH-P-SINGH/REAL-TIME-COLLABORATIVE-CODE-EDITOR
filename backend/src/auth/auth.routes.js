const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const rateLimiter = require('../middlewares/rateLimit');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { registerSchema, loginSchema } = require('../utils/validation.schemas');

// Apply rate limiting to sensitive auth endpoints
router.post('/register', rateLimiter(10, 60), validate(registerSchema), authController.register);
router.post('/login', rateLimiter(15, 60), validate(loginSchema), authController.login);
router.post('/demo', rateLimiter(20, 60), authController.demoLogin);
router.get('/me', protect, authController.getMe);

module.exports = router;
