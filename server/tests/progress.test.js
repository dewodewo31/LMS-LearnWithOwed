const LessonProgress = require('../src/models/LessonProgress');
const { app, loginAs, createCourse, addLesson, enroll } = require('./helpers');

describe('Learning progress (PRD §18–20)', () => {
  const setup = async () => {
    const mentor = await loginAs({ role: 'mentor', email: `pm-${Date.now()}@test.dev` });
    const course = await createCourse(mentor.user._id, { status: 'published' });
    const lessons = [await addLesson(course._id, 1), await addLesson(course._id, 2), await addLesson(course._id, 3), await addLesson(course._id, 4)];
    const student = await loginAs({ role: 'student', email: `ps-${Date.now()}@test.dev` });
    await enroll(student.user._id, course._id);
    return { mentor, student, course, lessons };
  };

  test('complete lessons → progress %, 100% → enrollment completed + completedAt (PRD §20)', async () => {
    const { student, course, lessons } = await setup();

    const p1 = await student.agent.post(`/api/v1/lessons/${lessons[0]._id}/complete`);
    expect(p1.status).toBe(200);
    expect(p1.body.data.progress).toBe(25);

    await student.agent.post(`/api/v1/lessons/${lessons[1]._id}/complete`);
    expect((await student.agent.get(`/api/v1/courses/${course._id}/progress`)).body.data.percent).toBe(50);

    await student.agent.post(`/api/v1/lessons/${lessons[2]._id}/complete`);
    const p4 = await student.agent.post(`/api/v1/lessons/${lessons[3]._id}/complete`);
    expect(p4.body.data.progress).toBe(100);
    expect(p4.body.data.enrollmentStatus).toBe('completed');
    expect(p4.body.message).toMatch(/Course completed/i);

    const mine = await student.agent.get('/api/v1/courses/mine');
    const row = mine.body.data.courses.find((c) => c.id === String(course._id));
    expect(row.status).toBe('completed');
    expect(row.enrollment.completedAt).toBeTruthy();
  });

  test('duplicate completion is idempotent — still 1 progress record (docs §24 spirit)', async () => {
    const { student, lessons } = await setup();
    await student.agent.post(`/api/v1/lessons/${lessons[0]._id}/complete`);
    await student.agent.post(`/api/v1/lessons/${lessons[0]._id}/complete`);
    const count = await LessonProgress.countDocuments({ lessonId: lessons[0]._id });
    expect(count).toBe(1);
  });

  test('progress endpoint: completed lesson ids returned', async () => {
    const { student, course, lessons } = await setup();
    await student.agent.post(`/api/v1/lessons/${lessons[0]._id}/complete`);
    const res = await student.agent.get(`/api/v1/courses/${course._id}/progress`);
    expect(res.body.data.completedLessonIds).toEqual([String(lessons[0]._id)]);
    expect(res.body.data.lessons).toHaveLength(4);
  });

  test('unassigned student cannot start/complete lessons → 403', async () => {
    const { lessons } = await setup();
    const outsider = await loginAs({ role: 'student', email: `po-${Date.now()}@test.dev` });
    expect((await outsider.agent.post(`/api/v1/lessons/${lessons[0]._id}/complete`)).status).toBe(403);
    expect((await outsider.agent.post(`/api/v1/lessons/${lessons[0]._id}/start`)).status).toBe(403);
  });

  test('mentor cannot complete lessons on behalf of student → 403 (role gate: students only)', async () => {
    const { mentor, lessons } = await setup();
    const res = await mentor.agent.post(`/api/v1/lessons/${lessons[0]._id}/complete`);
    // mentor has no enrollment -> 403 access rule
    expect(res.status).toBe(403);
  });
});
