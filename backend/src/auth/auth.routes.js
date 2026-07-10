const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const rateLimiter = require('../middlewares/rateLimit');
const { validate } = require('../middlewares/validation.middleware');
const { registerSchema, loginSchema } = require('../utils/validation.schemas');

// Apply strict rate limiting to sensitive registration and login requests
router.post('/register', rateLimiter(5, 60), validate(registerSchema), authController.register);
router.post('/login', rateLimiter(10, 60), validate(loginSchema), authController.login);

module.exports = router;
