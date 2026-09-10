const { jwt: jwtCfg, cookie: cookieCfg, env } = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const respond = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');
const { signAccessToken, signRefreshToken } = require('../middleware/auth');

const REFRESH_COOKIE = 'refresh_token';
const ACCESS_COOKIE = 'access_token';

const cookieOptions = { ...cookieCfg };
const refreshCookieOptions = { ...cookieCfg, path: '/api/v1/auth' };

const issueTokens = (user, res) => {
  res.cookie(ACCESS_COOKIE, signAccessToken(user), { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, signRefreshToken(user), { ...refreshCookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const clearTokens = (res) => {
  res.clearCookie(ACCESS_COOKIE, cookieOptions);
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
};

// POST /auth/register — students only (PRD §5.1). Role is forced; admins/mentors are created by seed/admin.
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email is already registered', { email: 'Email is already registered' });

  const user = await User.create({ name, email, password, role: 'student' });
  issueTokens(user, res);
  return respond(res, { status: 201, message: 'Registration successful', data: { user: user.toPublic() } });
});

// POST /auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, isDeleted: false }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  issueTokens(user, res);
  return respond(res, { message: 'Login successful', data: { user: user.toPublic() } });
});

// POST /auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new ApiError(401, 'Refresh token missing');
  let payload;
  try {
    payload = require('jsonwebtoken').verify(token, jwtCfg.refreshSecret);
  } catch {
    clearTokens(res);
    throw new ApiError(401, 'Refresh token invalid or expired');
  }
  const user = await User.findOne({ _id: payload.sub, isDeleted: false });
  if (!user) {
    clearTokens(res);
    throw new ApiError(401, 'Account not found');
  }
  issueTokens(user, res);
  return respond(res, { message: 'Token refreshed', data: { user: user.toPublic() } });
});

// POST /auth/logout
const logout = asyncHandler(async (req, res) => {
  clearTokens(res);
  return respond(res, { message: 'Logged out' });
});

// GET /auth/me
const me = asyncHandler(async (req, res) => {
  return respond(res, { data: { user: req.user.toPublic() } });
});

module.exports = { register, login, refresh, logout, me, REFRESH_COOKIE, ACCESS_COOKIE, clearTokens, env };
