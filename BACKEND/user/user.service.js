const User = require('./user.model');

const findByEmail = async (email) => {
  return User.findOne({ email });
};

const findById = async (id) => {
  return User.findById(id).select('-password');
};

const createUser = async (userData) => {
  return User.create(userData);
};

module.exports = {
  findByEmail,
  findById,
  createUser,
};
