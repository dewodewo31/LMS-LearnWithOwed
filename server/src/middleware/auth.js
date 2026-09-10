const jwt = require('jsonwebtoken');
const { jwt: jwtCfg } = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const signAccessToken = (user) =>
  jwt.sign({ sub: user._id, role: user.role, name: user.name }, jwtCfg.accessSecret, {
    expiresIn: jwtCfg.accessExpires,
  });

const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id, role: user.role }, jwtCfg.refreshSecret, {
    expiresIn: jwtCfg.refreshExpires,
  });

/** Resolve user from JWT (HTTP-only cookie first, Bearer header as fallback for tests/tools). */
const getUserFromToken = async (req) => {
  const token = req.cookies?.access_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, jwtCfg.accessSecret);
  } catch {
    return null;
  }
  const user = await User.findOne({ _id: payload.sub, isDeleted: false });
  return user || null;
};

const authenticate = asyncHandler(async (req, _res, next) => {
  const user = await getUserFromToken(req);
  if (!user) throw new ApiError(401, 'Authentication required');
  req.user = user;
  next();
});

/** Role gate: authorize('admin'), authorize('admin', 'mentor'). */
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission to perform this action'));
  return next();
};

/** Resource ownership: mentor may only touch their own course (PRD §103). Admin bypasses.
 * mentorId may be a raw ObjectId or a populated user doc — compare the underlying id. */
const canManageCourse = (user, course) => {
  if (user.role === 'admin') return true;
  const mentorId = course?.mentorId?._id ?? course?.mentorId;
  return String(mentorId) === String(user._id);
};

module.exports = { authenticate, authorize, canManageCourse, signAccessToken, signRefreshToken };
