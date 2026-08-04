const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    const data = await authService.register(name, email, password);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const data = await authService.login(email, password);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const data = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const demoLogin = async (req, res, next) => {
  try {
    const data = await authService.loginDemo();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, demoLogin };
