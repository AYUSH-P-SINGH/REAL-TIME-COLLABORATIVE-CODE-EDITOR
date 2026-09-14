const User = require('./user.model');

const findByEmail = async (email) => {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();
  return User.findOne({ email: normalizedEmail });
};

const findById = async (id) => {
  return User.findById(id).select('-password');
};

const createUser = async (userData) => {
  if (userData.email) {
    userData.email = userData.email.toLowerCase().trim();
  }
  return User.create(userData);
};

module.exports = {
  findByEmail,
  findById,
  createUser,
};
