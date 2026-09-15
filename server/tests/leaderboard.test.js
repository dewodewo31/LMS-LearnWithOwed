const { request, app, createUser, createCourse, addLesson, enroll } = require('./helpers');
const LessonProgress = require('../src/models/LessonProgress');

const completeLesson = async (studentId, lessonId, courseId) =>
  LessonProgress.create({ studentId, lessonId, courseId, status: 'completed', completedAt: new Date() });

describe('Public leaderboard — lessons (GET /api/v1/public/leaderboard/lessons)', () => {
  test('no auth required; returns students ranked by completed lessons', async () => {
    const s1 = await createUser({ name: 'Andi' });
    const s2 = await createUser({ name: 'Budi' });
    const mentor = await createUser({ role: 'mentor' });
    const c1 = await createCourse(mentor._id, { status: 'published' });
    const l1 = await addLesson(c1._id, 1);
    const l2 = await addLesson(c1._id, 2);

    await completeLesson(s1._id, l1._id, c1._id);
    await completeLesson(s1._id, l2._id, c1._id);
    await completeLesson(s2._id, l1._id, c1._id);

    const res = await request(app).get('/api/v1/public/leaderboard/lessons');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].student.displayName).toBe('Andi');
    expect(res.body.data[0].value).toBe(2);
    expect(res.body.data[0].rank).toBe(1);
    expect(res.body.data[1].student.displayName).toBe('Budi');
    expect(res.body.data[1].value).toBe(1);
  });

  test('only exposes public fields (no email, phone, password)', async () => {
    const s1 = await createUser({ name: 'Citra' });
    const mentor = await createUser({ role: 'mentor' });
    const c1 = await createCourse(mentor._id, { status: 'published' });
    const l1 = await addLesson(c1._id, 1);
    await completeLesson(s1._id, l1._id, c1._id);

    const res = await request(app).get('/api/v1/public/leaderboard/lessons');
    const entry = res.body.data[0];
    expect(entry.student.id).toBeDefined();
    expect(entry.student.displayName).toBe('Citra');
    expect(entry.student.email).toBeUndefined();
    expect(entry.student.phone).toBeUndefined();
    expect(entry.student.password).toBeUndefined();
    expect(entry.student.role).toBeUndefined();
  });

  test('excludes deleted students', async () => {
    const s1 = await createUser({ name: 'Deleted' });
    const mentor = await createUser({ role: 'mentor' });
    const c1 = await createCourse(mentor._id, { status: 'published' });
    const l1 = await addLesson(c1._id, 1);
    await completeLesson(s1._id, l1._id, c1._id);
    const User = require('../src/models/User');
    await User.updateOne({ _id: s1._id }, { isDeleted: true });

    const res = await request(app).get('/api/v1/public/leaderboard/lessons');
    expect(res.body.data).toHaveLength(0);
  });

  test('deterministic tie handling: same score sorted by name ASC', async () => {
    const s1 = await createUser({ name: 'Zeta' });
    const s2 = await createUser({ name: 'Alpha' });
    const mentor = await createUser({ role: 'mentor' });
    const c1 = await createCourse(mentor._id, { status: 'published' });
    const l1 = await addLesson(c1._id, 1);
    await completeLesson(s1._id, l1._id, c1._id);
    await completeLesson(s2._id, l1._id, c1._id);

    const res = await request(app).get('/api/v1/public/leaderboard/lessons');
    expect(res.body.data[0].student.displayName).toBe('Alpha');
    expect(res.body.data[1].student.displayName).toBe('Zeta');
  });

  test('returns empty array when no completions exist', async () => {
    const res = await request(app).get('/api/v1/public/leaderboard/lessons');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('respects limit parameter', async () => {
    const mentor = await createUser({ role: 'mentor' });
    const c1 = await createCourse(mentor._id, { status: 'published' });
    const l1 = await addLesson(c1._id, 1);
    for (let i = 0; i < 5; i++) {
      const s = await createUser({ name: `Student ${i}` });
      await completeLesson(s._id, l1._id, c1._id);
    }

    const res = await request(app).get('/api/v1/public/leaderboard/lessons?limit=3');
    expect(res.body.data).toHaveLength(3);
  });

  test('caps limit at 50', async () => {
    const res = await request(app).get('/api/v1/public/leaderboard/lessons?limit=999');
    expect(res.status).toBe(200);
  });

  test('only counts completed lessons, not in_progress', async () => {
    const s1 = await createUser({ name: 'Partial' });
    const mentor = await createUser({ role: 'mentor' });
    const c1 = await createCourse(mentor._id, { status: 'published' });
    const l1 = await addLesson(c1._id, 1);
    const l2 = await addLesson(c1._id, 2);
    await completeLesson(s1._id, l1._id, c1._id);
    await LessonProgress.create({ studentId: s1._id, lessonId: l2._id, courseId: c1._id, status: 'in_progress' });

    const res = await request(app).get('/api/v1/public/leaderboard/lessons');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].value).toBe(1);
  });
});

describe('Public leaderboard — modules (GET /api/v1/public/leaderboard/modules)', () => {
  test('no auth required; returns students ranked by enrolled modules', async () => {
    const s1 = await createUser({ name: 'Andi' });
    const s2 = await createUser({ name: 'Budi' });
    const mentor = await createUser({ role: 'mentor' });
    const c1 = await createCourse(mentor._id, { status: 'published' });
    const c2 = await createCourse(mentor._id, { status: 'published' });
    const c3 = await createCourse(mentor._id, { status: 'published' });

    await enroll(s1._id, c1._id);
    await enroll(s1._id, c2._id);
    await enroll(s1._id, c3._id);
    await enroll(s2._id, c1._id);

    const res = await request(app).get('/api/v1/public/leaderboard/modules');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].student.displayName).toBe('Andi');
    expect(res.body.data[0].value).toBe(3);
    expect(res.body.data[1].student.displayName).toBe('Budi');
    expect(res.body.data[1].value).toBe(1);
  });

  test('counts active and completed enrollments, not revoked or expired', async () => {
    const s1 = await createUser({ name: 'Mixed' });
    const mentor = await createUser({ role: 'mentor' });
    const c1 = await createCourse(mentor._id, { status: 'published' });
    const c2 = await createCourse(mentor._id, { status: 'published' });
    const c3 = await createCourse(mentor._id, { status: 'published' });
    await enroll(s1._id, c1._id, { status: 'active' });
    await enroll(s1._id, c2._id, { status: 'completed' });
    await enroll(s1._id, c3._id, { status: 'revoked' });

    const res = await request(app).get('/api/v1/public/leaderboard/modules');
    expect(res.body.data[0].value).toBe(2);
  });

  test('excludes deleted students', async () => {
    const s1 = await createUser({ name: 'Ghost' });
    const mentor = await createUser({ role: 'mentor' });
    const c1 = await createCourse(mentor._id, { status: 'published' });
    await enroll(s1._id, c1._id);
    const User = require('../src/models/User');
    await User.updateOne({ _id: s1._id }, { isDeleted: true });

    const res = await request(app).get('/api/v1/public/leaderboard/modules');
    expect(res.body.data).toHaveLength(0);
  });

  test('returns empty array when no enrollments exist', async () => {
    const res = await request(app).get('/api/v1/public/leaderboard/modules');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('respects limit parameter', async () => {
    const mentor = await createUser({ role: 'mentor' });
    const c1 = await createCourse(mentor._id, { status: 'published' });
    for (let i = 0; i < 5; i++) {
      const s = await createUser({ name: `Student ${i}` });
      await enroll(s._id, c1._id);
    }

    const res = await request(app).get('/api/v1/public/leaderboard/modules?limit=2');
    expect(res.body.data).toHaveLength(2);
  });

  test('only exposes public student fields', async () => {
    const s1 = await createUser({ name: 'Public' });
    const mentor = await createUser({ role: 'mentor' });
    const c1 = await createCourse(mentor._id, { status: 'published' });
    await enroll(s1._id, c1._id);

    const res = await request(app).get('/api/v1/public/leaderboard/modules');
    const entry = res.body.data[0];
    expect(entry.student.id).toBeDefined();
    expect(entry.student.displayName).toBe('Public');
    expect(entry.student.email).toBeUndefined();
    expect(entry.student.phone).toBeUndefined();
  });
});
