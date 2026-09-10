const Enrollment = require('../src/models/Enrollment');
const LessonProgress = require('../src/models/LessonProgress');
const { app, loginAs, createCourse, addLesson, enroll } = require('./helpers');

describe('Admin-controlled enrollment (Critical product rule)', () => {
  test('admin can enroll student → 201, source=admin', async () => {
    const admin = await loginAs({ role: 'admin', email: 'admin-enr@test.dev' });
    const student = await loginAs({ role: 'student', email: 'stud-enr@test.dev' });
    const mentor = await loginAs({ role: 'mentor', email: 'mentor-enr@test.dev' });
    const course = await createCourse(mentor.user._id);

    const res = await admin.agent.post('/api/v1/enrollments').send({ studentId: student.user._id, courseId: course._id });
    expect(res.status).toBe(201);
    expect(res.body.data.enrollment.source).toBe('admin');
    expect(res.body.data.enrollment.status).toBe('active');
  });

  test('duplicate enrollment → 409 (PRD §40)', async () => {
    const admin = await loginAs({ role: 'admin', email: 'admin-dup@test.dev' });
    const student = await loginAs({ role: 'student', email: 'stud-dup@test.dev' });
    const mentor = await loginAs({ role: 'mentor', email: 'mentor-dup@test.dev' });
    const course = await createCourse(mentor.user._id);

    await admin.agent.post('/api/v1/enrollments').send({ studentId: student.user._id, courseId: course._id });
    const res = await admin.agent.post('/api/v1/enrollments').send({ studentId: student.user._id, courseId: course._id });
    expect(res.status).toBe(409);
  });

  test('enroll with unknown student → 404', async () => {
    const admin = await loginAs({ role: 'admin', email: 'admin-404@test.dev' });
    const mentor = await loginAs({ role: 'mentor', email: 'mentor-404@test.dev' });
    const course = await createCourse(mentor.user._id);
    const res = await admin.agent.post('/api/v1/enrollments').send({ studentId: '5f8d0d55b54764421b7156c9', courseId: course._id });
    expect(res.status).toBe(404);
  });

  test('revoked enrollment → access denied on course + progress', async () => {
    const admin = await loginAs({ role: 'admin', email: 'admin-rev@test.dev' });
    const student = await loginAs({ role: 'student', email: 'stud-rev@test.dev' });
    const mentor = await loginAs({ role: 'mentor', email: 'mentor-rev@test.dev' });
    const course = await createCourse(mentor.user._id, { status: 'published' });
    const lesson = await addLesson(course._id, 1);

    await admin.agent.post('/api/v1/enrollments').send({ studentId: student.user._id, courseId: course._id });
    const list = await admin.agent.get('/api/v1/enrollments');
    const enrollmentId = list.body.data.enrollments.find((e) => e.course.id === String(course._id)).id;

    await admin.agent.patch(`/api/v1/enrollments/${enrollmentId}`).send({ status: 'revoked' });
    expect((await student.agent.get(`/api/v1/courses/${course._id}`)).status).toBe(403);
    expect((await student.agent.post(`/api/v1/lessons/${lesson._id}/complete`)).status).toBe(403);
  });

  test('delete enrollment with progress → 409; without progress → ok', async () => {
    const admin = await loginAs({ role: 'admin', email: 'admin-del@test.dev' });
    const student = await loginAs({ role: 'student', email: 'stud-del@test.dev' });
    const mentor = await loginAs({ role: 'mentor', email: 'mentor-del@test.dev' });
    const course = await createCourse(mentor.user._id, { status: 'published' });
    const lesson = await addLesson(course._id, 1);
    await admin.agent.post('/api/v1/enrollments').send({ studentId: student.user._id, courseId: course._id });
    await student.agent.post(`/api/v1/lessons/${lesson._id}/complete`);

    const list = await admin.agent.get('/api/v1/enrollments?courseId=' + course._id);
    const id = list.body.data.enrollments[0].id;

    expect((await admin.agent.delete(`/api/v1/enrollments/${id}`)).status).toBe(409);

    const fresh = await loginAs({ role: 'student', email: 'stud-del2@test.dev' });
    await admin.agent.post('/api/v1/enrollments').send({ studentId: fresh.user._id, courseId: course._id });
    const list2 = await admin.agent.get('/api/v1/enrollments?courseId=' + course._id + '&status=active');
    const id2 = list2.body.data.enrollments.find((e) => e.student.id === String(fresh.user._id)).id;
    expect((await admin.agent.delete(`/api/v1/enrollments/${id2}`)).status).toBe(200);
  });

  test('mentor can view enrollments of own courses; cannot enroll', async () => {
    const mentor = await loginAs({ role: 'mentor', email: 'mentor-view@test.dev' });
    const course = await createCourse(mentor.user._id);
    const student = await loginAs({ role: 'student', email: 'stud-view@test.dev' });
    await enroll(student.user._id, course._id);

    const list = await mentor.agent.get('/api/v1/enrollments');
    expect(list.status).toBe(200);
    expect(list.body.data.enrollments).toHaveLength(1);

    const create = await mentor.agent.post('/api/v1/enrollments').send({ studentId: student.user._id, courseId: course._id });
    expect(create.status).toBe(403);
  });

  test('enrollment list has no commerce fields', async () => {
    const admin = await loginAs({ role: 'admin', email: 'admin-noFee@test.dev' });
    const student = await loginAs({ role: 'student', email: 'stud-noFee@test.dev' });
    const mentor = await loginAs({ role: 'mentor', email: 'mentor-noFee@test.dev' });
    const course = await createCourse(mentor.user._id);
    await admin.agent.post('/api/v1/enrollments').send({ studentId: student.user._id, courseId: course._id });

    const list = await admin.agent.get('/api/v1/enrollments');
    const json = JSON.stringify(list.body);
    expect(json).not.toMatch(/amount|orderId|midtrans/i);
  });
});
