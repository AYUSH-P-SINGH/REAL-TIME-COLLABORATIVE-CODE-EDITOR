const bcrypt = require('bcryptjs');
const userService = require('../user/user.service');
const jwtHelper = require('../utils/jwt');
const { registerSchema, loginSchema } = require('../utils/validation.schemas');

const register = async (name, email, password) => {
  // Validate schemas at service level to protect against internal programmatic creation issues
  registerSchema.parse({ name, email, password });

  const existingUser = await userService.findByEmail(email);
  if (existingUser) {
    const err = new Error('User already exists');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

  const user = await userService.createUser({
    name,
    email,
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
  // Validate schemas at service level
  loginSchema.parse({ email, password });

  const user = await userService.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid credentials');
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

module.exports = { register, login };
