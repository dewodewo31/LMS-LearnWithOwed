/* Test harness: app + db helpers + factories. Uses the local mongod with a dedicated test database. */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const Enrollment = require('../src/models/Enrollment');
const LessonProgress = require('../src/models/LessonProgress');

beforeAll(async () => {
  await connectDB(process.env.MONGODB_URI);
});

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

const createUser = async (overrides = {}) =>
  User.create({
    name: overrides.name || 'Test User',
    email: overrides.email || `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.dev`,
    password: overrides.password || 'password123',
    role: overrides.role || 'student',
  });

/** Register + login through the API so cookies are set realistically. Returns { agent, user }. */
const loginAs = async (userData = {}) => {
  const user = await createUser(userData);
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login').send({ email: user.email, password: userData.password || 'password123' });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user };
};

const createCourse = async (mentorId, overrides = {}) =>
  Course.create({
    title: overrides.title || 'JavaScript Fundamentals',
    slug: overrides.slug || `js-fundamentals-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    shortDescription: overrides.shortDescription || 'Learn JavaScript from zero',
    description: overrides.description || '<p>Course description</p>',
    thumbnail: overrides.thumbnail ?? '/uploads/course.webp',
    mentorId,
    level: overrides.level || 'beginner',
    status: overrides.status || 'draft',
    category: overrides.category || 'Programming',
  });

const addLesson = async (courseId, order, overrides = {}) =>
  Lesson.create({
    courseId,
    title: overrides.title || `Lesson ${order}`,
    contentType: overrides.contentType || 'text',
    textContent: overrides.contentType === 'video' ? null : '<p>Lesson content</p>',
    youtubeUrl: overrides.contentType === 'video' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
    youtubeVideoId: overrides.contentType === 'video' ? 'dQw4w9WgXcQ' : null,
    order,
  });

const enroll = async (studentId, courseId, overrides = {}) =>
  Enrollment.create({ studentId, courseId, status: overrides.status || 'active', source: overrides.source || 'admin' });

module.exports = { request, app, createUser, loginAs, createCourse, addLesson, enroll };
