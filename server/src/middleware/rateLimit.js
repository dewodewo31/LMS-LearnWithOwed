const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const skipInTest = () => config.isTest;

// docs/SECURITY.md §8
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  skip: skipInTest,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a minute.' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  skip: (req) => req.method === 'OPTIONS' || config.isTest,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

// Community UGC (spec §30): conservative per-user limits on posts and media uploads.
const keyByUser = (req) => req.user?._id?.toString() || req.ip;
const communityPostLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  skip: skipInTest,
  keyGenerator: keyByUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many posts. Please wait a moment before posting again.' },
});

const communityMediaLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  skip: skipInTest,
  keyGenerator: keyByUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many uploads. Please wait a moment and try again.' },
});

// Lesson content anti-scraping (docs/SECURITY.md §8): far above normal sequential
// learning pace, low enough to make bulk scraping impractical. Per-user.
const lessonContentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  skip: skipInTest,
  keyGenerator: keyByUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many lesson requests. Please slow down.' },
});

module.exports = { authLimiter, generalLimiter, communityPostLimiter, communityMediaLimiter, lessonContentLimiter };
