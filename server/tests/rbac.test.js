const { app, loginAs, createCourse, addLesson, enroll } = require('./helpers');

describe('RBAC & course access', () => {
  test('student cannot create course → 403', async () => {
    const { agent } = await loginAs({ role: 'student', email: 's1@test.dev' });
    const res = await agent.post('/api/v1/courses').send({ title: 'Nope', level: 'beginner' });
    expect(res.status).toBe(403);
  });

  test('student cannot POST enrollment (no self-enroll) → 403', async () => {
    const { agent } = await loginAs({ role: 'student', email: 'selfenroll@test.dev' });
    const res = await agent.post('/api/v1/enrollments').send({ studentId: 'x', courseId: 'y' });
    expect(res.status).toBe(403);
  });

  test('student cannot POST student management → 403', async () => {
    const { agent } = await loginAs({ role: 'student', email: 'screate@test.dev' });
    const res = await agent.post('/api/v1/students').send({ name: 'X', email: 'x@test.dev', password: 'password123' });
    expect(res.status).toBe(403);
  });

  test('student cannot list all courses → 403 (must use /courses/mine)', async () => {
    const { agent } = await loginAs({ role: 'student', email: 'browse@test.dev' });
    const res = await agent.get('/api/v1/courses');
    expect(res.status).toBe(403);
  });

  test('mentor cannot modify another mentor course → 403 (IDOR/ownership PRD §103)', async () => {
    const owner = await loginAs({ role: 'mentor', email: 'owner@test.dev' });
    const course = await createCourse(owner.user._id);

    const attacker = await loginAs({ role: 'mentor', email: 'attacker@test.dev' });
    const res = await attacker.agent.patch(`/api/v1/courses/${course._id}`).send({ title: 'Hacked Course' });
    expect(res.status).toBe(403);

    const del = await attacker.agent.delete(`/api/v1/courses/${course._id}`);
    expect(del.status).toBe(403);
  });

  test('mentor cannot read another mentor course detail → 403', async () => {
    const owner = await loginAs({ role: 'mentor', email: 'owner2@test.dev' });
    const course = await createCourse(owner.user._id);
    const other = await loginAs({ role: 'mentor', email: 'other2@test.dev' });
    const res = await other.agent.get(`/api/v1/courses/${course._id}`);
    expect(res.status).toBe(403);
  });
});

describe('Course access (PRD §67, docs TESTING.md)', () => {
  test('unassigned student → denied', async () => {
    const mentor = await loginAs({ role: 'mentor', email: 'm1@test.dev' });
    const course = await createCourse(mentor.user._id, { status: 'published' });
    const { agent } = await loginAs({ role: 'student', email: 'outsider@test.dev' });
    const res = await agent.get(`/api/v1/courses/${course._id}`);
    expect(res.status).toBe(403);
  });

  test('assigned student → allowed, sees published lessons only', async () => {
    const mentor = await loginAs({ role: 'mentor', email: 'm2@test.dev' });
    const course = await createCourse(mentor.user._id, { status: 'published' });
    await addLesson(course._id, 1);
    await addLesson(course._id, 2, { title: 'Hidden lesson' });
    await Lesson_updateOne(course._id, 2, { isPublished: false });

    const student = await loginAs({ role: 'student', email: 'inside@test.dev' });
    await enroll(student.user._id, course._id);

    const res = await student.agent.get(`/api/v1/courses/${course._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.lessons).toHaveLength(1);
    expect(res.body.data.course.id).toBe(String(course._id));
  });

  test('revoked enrollment → access denied', async () => {
    const mentor = await loginAs({ role: 'mentor', email: 'm3@test.dev' });
    const course = await createCourse(mentor.user._id, { status: 'published' });
    await addLesson(course._id, 1);
    const student = await loginAs({ role: 'student', email: 'revoked@test.dev' });
    const e = await enroll(student.user._id, course._id);
    e.status = 'revoked';
    await e.save();
    const res = await student.agent.get(`/api/v1/courses/${course._id}`);
    expect(res.status).toBe(403);
  });

  test('student /courses/mine only returns assigned courses', async () => {
    const mentor = await loginAs({ role: 'mentor', email: 'm4@test.dev' });
    const assigned = await createCourse(mentor.user._id, { status: 'published', title: 'Assigned Course' });
    await createCourse(mentor.user._id, { status: 'published', title: 'Not Assigned Course' });
    const student = await loginAs({ role: 'student', email: 'mine@test.dev' });
    await enroll(student.user._id, assigned._id);

    const res = await student.agent.get('/api/v1/courses/mine');
    expect(res.status).toBe(200);
    expect(res.body.data.courses).toHaveLength(1);
    expect(res.body.data.courses[0].title).toBe('Assigned Course');
    // No commerce fields in student payloads (UI-UX.md §3)
    expect(JSON.stringify(res.body.data.courses)).not.toMatch(/"price"/);
  });
});

// helper: update lesson publish flag directly
async function Lesson_updateOne(courseId, order, update) {
  const LessonModel = require('../src/models/Lesson');
  return LessonModel.updateOne({ courseId, order }, update);
}
