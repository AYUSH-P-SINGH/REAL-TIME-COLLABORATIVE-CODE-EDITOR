const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userService = require('../user/user.service');
const jwtHelper = require('../utils/jwt');
const { registerSchema, loginSchema } = require('../utils/validation.schemas');
const { cacheClient } = require('../config/redis');

// In-memory fallback for local development and test runs
const inMemoryTicketStore = new Map();

const register = async (name, email, password) => {
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const trimmedName = name ? name.trim() : '';

  registerSchema.parse({ name: trimmedName, email: normalizedEmail, password });

  const existingUser = await userService.findByEmail(normalizedEmail);
  if (existingUser) {
    const err = new Error('An account with this email already exists. Please sign in instead.');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmedName)}`;

  const user = await userService.createUser({
    name: trimmedName,
    email: normalizedEmail,
    password: hashedPassword,
    avatarUrl,
  });

  const payload = { id: user._id, email: user.email, name: user.name };
  const token = jwtHelper.generateAccessToken(payload);
  const refreshToken = jwtHelper.generateRefreshToken(payload);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    token,
    accessToken: token,
    refreshToken,
  };
};

const login = async (email, password) => {
  const normalizedEmail = email ? email.toLowerCase().trim() : '';

  loginSchema.parse({ email: normalizedEmail, password });

  const user = await userService.findByEmail(normalizedEmail);
  if (!user) {
    const err = new Error('No account found with this email. Please click "Register" to create your account.');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Incorrect password. Please verify and try again.');
    err.statusCode = 401;
    throw err;
  }

  const payload = { id: user._id, email: user.email, name: user.name };
  const token = jwtHelper.generateAccessToken(payload);
  const refreshToken = jwtHelper.generateRefreshToken(payload);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    token,
    accessToken: token,
    refreshToken,
  };
};

const refreshToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    const err = new Error('Refresh token is required');
    err.statusCode = 401;
    throw err;
  }

  let decoded;
  try {
    decoded = jwtHelper.verifyRefreshToken(incomingRefreshToken);
  } catch (e) {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  const user = await userService.findById(decoded.id);
  if (!user) {
    const err = new Error('User no longer exists');
    err.statusCode = 401;
    throw err;
  }

  const payload = { id: user._id, email: user.email, name: user.name };
  const newAccessToken = jwtHelper.generateAccessToken(payload);
  const newRefreshToken = jwtHelper.generateRefreshToken(payload);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    token: newAccessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    }
  };
};

const getMe = async (userId) => {
  const user = await userService.findById(userId);
  if (!user) {
    const err = new Error('User profile not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
};

const loginDemo = async () => {
  const demoEmail = 'demo@codesync.io';
  let user = await userService.findByEmail(demoEmail);

  if (!user) {
    const hashedPassword = await bcrypt.hash('demopass123', 12);
    user = await userService.createUser({
      name: 'Demo Developer',
      email: demoEmail,
      password: hashedPassword,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=DemoDeveloper',
    });
  }

  const payload = { id: user._id, email: user.email, name: user.name };
  const token = jwtHelper.generateAccessToken(payload);
  const refreshToken = jwtHelper.generateRefreshToken(payload);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    token,
    accessToken: token,
    refreshToken,
  };
};

/**
 * Creates a single-use, 30-second cryptographic WebSocket connection ticket.
 * Prevents JWT tokens from leaking into browser URLs, HTTP proxies, or server logs.
 */
const createWsTicket = async (user) => {
  const ticket = crypto.randomBytes(32).toString('hex');
  const ticketData = {
    id: user.id || user._id,
    email: user.email,
    name: user.name,
    createdAt: Date.now()
  };

  const redisKey = `ws:ticket:${ticket}`;
  if (cacheClient && cacheClient.isOpen) {
    await cacheClient.set(redisKey, JSON.stringify(ticketData), { EX: 30 });
  } else {
    inMemoryTicketStore.set(ticket, ticketData);
    setTimeout(() => {
      inMemoryTicketStore.delete(ticket);
    }, 30000).unref();
  }

  return {
    ticket,
    expiresIn: 30,
    ticketType: 'single-use'
  };
};

/**
 * Atomically validates and consumes a single-use WebSocket ticket.
 * Once consumed, the ticket is immediately deleted, preventing replay attacks.
 */
const consumeWsTicket = async (ticket) => {
  if (!ticket || typeof ticket !== 'string') return null;

  const redisKey = `ws:ticket:${ticket}`;
  if (cacheClient && cacheClient.isOpen) {
    const raw = await cacheClient.get(redisKey);
    if (!raw) return null;
    await cacheClient.del(redisKey); // Immediate single-use consumption
    return JSON.parse(raw);
  }

  const memoryData = inMemoryTicketStore.get(ticket);
  if (!memoryData) return null;
  inMemoryTicketStore.delete(ticket); // Immediate single-use consumption
  if (Date.now() - memoryData.createdAt > 30000) {
    return null; // Expired
  }
  return memoryData;
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  loginDemo,
  createWsTicket,
  consumeWsTicket,
  inMemoryTicketStore
};
