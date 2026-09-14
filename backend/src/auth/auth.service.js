const bcrypt = require('bcryptjs');
const userService = require('../user/user.service');
const jwtHelper = require('../utils/jwt');
const { registerSchema, loginSchema } = require('../utils/validation.schemas');

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

  const token = jwtHelper.generateToken({ id: user._id, email: user.email, name: user.name });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    token,
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

  const token = jwtHelper.generateToken({ id: user._id, email: user.email, name: user.name });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    token,
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

  const token = jwtHelper.generateToken({ id: user._id, email: user.email, name: user.name });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    token,
  };
};

module.exports = { register, login, getMe, loginDemo };
