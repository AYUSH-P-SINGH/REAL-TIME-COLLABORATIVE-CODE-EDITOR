const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const rateLimiter = require('../middlewares/rateLimit');

// Apply strict rate limiting to sensitive registration and login requests
router.post('/register', rateLimiter(5, 60), authController.register);
router.post('/login', rateLimiter(10, 60), authController.login);

module.exports = router;
