const authService = require('./auth.service');

const setRefreshCookie = (res, refreshToken) => {
  if (!refreshToken) return;
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    const data = await authService.register(name, email, password);
    setRefreshCookie(res, data.refreshToken);
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
    setRefreshCookie(res, data.refreshToken);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const data = await authService.refreshToken(incomingToken);
    setRefreshCookie(res, data.refreshToken);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

const createWsTicket = async (req, res, next) => {
  try {
    const ticketInfo = await authService.createWsTicket(req.user);
    res.status(200).json({ success: true, data: ticketInfo });
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
    setRefreshCookie(res, data.refreshToken);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  createWsTicket,
  getMe,
  demoLogin
};
