require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
require('dotenv').config(); // fallback to plain .env

const required = (name, fallback) => {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
};

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  env: process.env.NODE_ENV || 'development',
  isProd,
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT || 5000),
  mongoUri: required('MONGODB_URI', isTest ? 'mongodb://localhost:27017/kn-lms-test' : 'mongodb://localhost:27017/kn-lms'),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', isTest ? 'test-access-secret' : undefined),
    refreshSecret: required('JWT_REFRESH_SECRET', isTest ? 'test-refresh-secret' : undefined),
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  // Assignment files live OUTSIDE the static /uploads root — only authorized
  // download endpoints serve them (student submissions are private).
  assignmentUploadPath: process.env.ASSIGNMENT_UPLOAD_PATH || './uploads-private/assignments',
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  },
  refreshCookiePath: '/api/v1/auth', // refresh token scoped to auth routes only
};
