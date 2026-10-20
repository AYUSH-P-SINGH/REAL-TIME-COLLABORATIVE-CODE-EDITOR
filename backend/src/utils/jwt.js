const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Access tokens are short-lived (15 minutes default for high security)
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
// Refresh tokens are long-lived (7 days) and rotated upon each exchange
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || ACCESS_TOKEN_EXPIRY,
  });
};

const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign({ ...payload, tokenType: 'refresh' }, env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (decoded.tokenType !== 'refresh') {
    throw new Error('Invalid token type: Expected refresh token');
  }
  return decoded;
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken
};
