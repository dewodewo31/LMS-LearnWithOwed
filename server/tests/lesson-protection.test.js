/* Lesson content protection — authorization, draft gating, response minimization, audit. */
const {
  request, app, loginAs, createCourse, addLesson, enroll, createUser,
} = require('./helpers');
const mongoose = require('mongoose');
const AuditLog = require('../src/models/AuditLog');

const mentorAgentFor = async (mentor) => {
  const agent = request.agent(app);
  await agent.post('/api/v1/auth/login').send({ email: mentor.email, password: 'password123' });
  return agent;
};

/** Fire-and-forget audit writes need a bounded poll. */
const waitForAudit = async (filter, attempts = 20) => {
  for (let i = 0; i < attempts; i += 1) {
    const doc = await AuditLog.findOne(filter).lean();
    if (doc) return doc;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
};

async function setupPublishedCourse() {
  const mentor = await createUser({ role: 'mentor', name: 'Mentor Own' });
  const course = await createCourse(mentor._id, { status: 'published' });
  return { mentor, course };
}

describe('GET /lessons/:lessonId/content — authorization', () => {
  test('unauthenticated request is rejected', async () => {
    const { course } = await setupPublishedCourse();
    const lesson = await addLesson(course._id, 1);
    await request(app).get(`/api/v1/lessons/${lesson._id}/content`).expect(401);
  });

  test('enrolled student receives lesson content', async () => {
    const { course } = await setupPublishedCourse();
    const lesson = await addLesson(course._id, 1, { title: 'Variables deep dive' });
    const { agent, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);

    const res = await agent.get(`/api/v1/lessons/${lesson._id}/content`).expect(200);
    expect(res.body.data.lesson.title).toBe('Variables deep dive');
    expect(res.body.data.lesson.textContent).toBe('<p>Lesson content</p>');
  });

  test('unenrolled student is rejected', async () => {
    const { course } = await setupPublishedCourse();
    const lesson = await addLesson(course._id, 1);
    const { agent } = await loginAs({});

    const res = await agent.get(`/api/v1/lessons/${lesson._id}/content`).expect(403);
    expect(res.body.success).toBe(false);
  });

  test('student cannot access another course lesson with own valid enrollment (IDOR)', async () => {
    const { course: mine } = await setupPublishedCourse();
    const { course: other } = await setupPublishedCourse();
    const otherLesson = await addLesson(other._id, 1);

    const { agent, user } = await loginAs({});
    await enroll(user._id, mine._id);

    await agent.get(`/api/v1/lessons/${otherLesson._id}/content`).expect(403);
  });

  test('student cannot access draft lesson (404, not content leak)', async () => {
    const { course } = await setupPublishedCourse();
    const draft = await addLesson(course._id, 1);
    draft.isPublished = false;
    await draft.save();

    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);

    await agent.get(`/api/v1/lessons/${draft._id}/content`).expect(404);
  });

  test('modified/nonexistent lesson id returns 404', async () => {
    const { course } = await setupPublishedCourse();
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);

    await agent.get(`/api/v1/lessons/${new mongoose.Types.ObjectId()}/content`).expect(404);
  });

  test('mentor owner can read own lesson content (including draft)', async () => {
    const { mentor, course } = await setupPublishedCourse();
    const draft = await addLesson(course._id, 1);
    draft.isPublished = false;
    await draft.save();

    const agent = await mentorAgentFor(mentor);
    const res = await agent.get(`/api/v1/lessons/${draft._id}/content`).expect(200);
    expect(res.body.data.lesson.textContent).toBe('<p>Lesson content</p>');
  });

  test('mentor of another course is rejected', async () => {
    const { course } = await setupPublishedCourse();
    const lesson = await addLesson(course._id, 1);

    const { agent: stranger } = await loginAs({ role: 'mentor' });
    await stranger.get(`/api/v1/lessons/${lesson._id}/content`).expect(403);
  });

  test('admin can read any lesson content', async () => {
    const { course } = await setupPublishedCourse();
    const lesson = await addLesson(course._id, 1);

    const { agent: admin } = await loginAs({ role: 'admin' });
    await admin.get(`/api/v1/lessons/${lesson._id}/content`).expect(200);
  });
});

describe('lesson response minimization', () => {
  test('student course detail returns lesson metadata without protected content', async () => {
    const { course } = await setupPublishedCourse();
    await addLesson(course._id, 1, { contentType: 'text' });
    await addLesson(course._id, 2, { contentType: 'video' });

    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);

    const res = await agent.get(`/api/v1/courses/${course._id}`).expect(200);
    for (const lesson of res.body.data.lessons) {
      expect(lesson.textContent).toBeUndefined();
      expect(lesson.youtubeUrl).toBeUndefined();
      expect(lesson.youtubeVideoId).toBeUndefined();
      expect(lesson.title).toBeTruthy();
    }
  });

  test('content endpoint returns whitelisted fields only', async () => {
    const { course } = await setupPublishedCourse();
    const lesson = await addLesson(course._id, 1, { contentType: 'video' });

    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);

    const res = await agent.get(`/api/v1/lessons/${lesson._id}/content`).expect(200);
    const body = res.body.data.lesson;
    expect(Object.keys(body).sort()).toEqual(
      ['courseId', 'contentType', 'duration', 'id', 'order', 'textContent', 'title', 'youtubeVideoId'].sort()
    );
    expect(body.textContent).toBeNull();
    expect(body.youtubeVideoId).toBe('dQw4w9WgXcQ');
  });
});

describe('lesson audit logging', () => {
  test('successful view logs LESSON_VIEW without content body', async () => {
    const { course } = await setupPublishedCourse();
    const lesson = await addLesson(course._id, 1);
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);

    await agent.get(`/api/v1/lessons/${lesson._id}/content`).expect(200);

    const doc = await waitForAudit({ action: 'LESSON_VIEW', userId: user._id, entityId: lesson._id });
    expect(doc).toBeTruthy();
    expect(JSON.stringify(doc.metadata)).not.toContain('Lesson content');
  });

  test('unauthorized access logs UNAUTHORIZED_LESSON_ACCESS', async () => {
    const { course } = await setupPublishedCourse();
    const lesson = await addLesson(course._id, 1);
    const { agent, user } = await loginAs({ name: 'Snooper' });

    await agent.get(`/api/v1/lessons/${lesson._id}/content`).expect(403);

    const doc = await waitForAudit({ action: 'UNAUTHORIZED_LESSON_ACCESS', userId: user._id });
    expect(doc).toBeTruthy();
    expect(doc.entityId?.toString?.() || String(doc.entityId)).toBe(String(lesson._id));
  });
});
