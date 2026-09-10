/* Notification tests — community triggers, authorization, read state, IDOR. */
const {
  request, app, createUser, loginAs, createCourse, addLesson, enroll,
} = require('./helpers');
const Notification = require('../src/models/Notification');

const QUESTION = { title: 'Why does my function return undefined?', body: 'I return a value but the console shows undefined. What am I missing?' };

async function setupCourse() {
  const mentor = await createUser({ role: 'mentor', name: 'Mentor Own' });
  const course = await createCourse(mentor._id, { status: 'published' });
  await addLesson(course._id, 1);
  return { mentor, course };
}

const mentorAgentFor = (mentor) => {
  const agent = request.agent(app);
  return agent.post('/api/v1/auth/login').send({ email: mentor.email, password: 'password123' }).then(() => agent);
};

describe('notification creation on community events', () => {
  test('student creates question -> mentor receives notification', async () => {
    const { mentor, course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);

    await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);

    const notifs = await Notification.find({ recipientId: mentor._id, type: 'COMMUNITY_NEW_QUESTION' });
    expect(notifs).toHaveLength(1);
    expect(String(notifs[0].actorId)).toBe(String(user._id));
    expect(String(notifs[0].courseId)).toBe(String(course._id));
  });

  test('mentor creates question -> no self-notification', async () => {
    const { mentor, course } = await setupCourse();
    const agent = await mentorAgentFor(mentor);

    await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);

    const notifs = await Notification.find({ recipientId: mentor._id });
    expect(notifs).toHaveLength(0);
  });

  test('unrelated mentor does not receive notification', async () => {
    const { course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);
    const stranger = await createUser({ role: 'mentor', name: 'Other Mentor' });

    await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);

    const notifs = await Notification.find({ recipientId: stranger._id });
    expect(notifs).toHaveLength(0);
  });

  test('student answers question -> question author receives notification', async () => {
    const { mentor, course } = await setupCourse();
    const { agent: asker, user: askerUser } = await loginAs({ name: 'Asker' });
    await enroll(askerUser._id, course._id);
    const q = await asker.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const qid = q.body.data.question.id;

    const { agent: peer, user: peerUser } = await loginAs({ name: 'Peer' });
    await enroll(peerUser._id, course._id);
    await peer.post(`/api/v1/questions/${qid}/answers`).send({ body: 'Answer body here.' }).expect(201);

    const notifs = await Notification.find({ recipientId: askerUser._id, type: 'COMMUNITY_NEW_ANSWER' });
    expect(notifs).toHaveLength(1);
    expect(String(notifs[0].actorId)).toBe(String(peerUser._id));
  });

  test('answer author does not receive self-notification', async () => {
    const { mentor, course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Asker' });
    await enroll(user._id, course._id);
    const q = await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const qid = q.body.data.question.id;

    await agent.post(`/api/v1/questions/${qid}/answers`).send({ body: 'Self answer.' }).expect(201);

    const notifs = await Notification.find({ recipientId: user._id, type: 'COMMUNITY_NEW_ANSWER' });
    expect(notifs).toHaveLength(0);
  });

  test('mentor verifies answer -> question author receives verified notification', async () => {
    const { mentor, course } = await setupCourse();
    const { agent: asker, user: askerUser } = await loginAs({ name: 'Asker' });
    await enroll(askerUser._id, course._id);
    const q = await asker.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const qid = q.body.data.question.id;

    const { agent: peer, user: peerUser } = await loginAs({ name: 'Peer' });
    await enroll(peerUser._id, course._id);
    const a = await peer.post(`/api/v1/questions/${qid}/answers`).send({ body: 'Answer body.' }).expect(201);
    const aid = a.body.data.answer.id;

    const mentorAgent = await mentorAgentFor(mentor);
    await mentorAgent.post(`/api/v1/answers/${aid}/verify`).expect(200);

    const notifs = await Notification.find({ recipientId: askerUser._id, type: 'COMMUNITY_ANSWER_VERIFIED' });
    expect(notifs).toHaveLength(1);
    expect(String(notifs[0].actorId)).toBe(String(mentor._id));
  });

  test('student cannot trigger verify notification', async () => {
    const { course } = await setupCourse();
    const { agent: asker, user: askerUser } = await loginAs({ name: 'Asker' });
    await enroll(askerUser._id, course._id);
    const q = await asker.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const qid = q.body.data.question.id;

    const { agent: peer, user: peerUser } = await loginAs({ name: 'Peer' });
    await enroll(peerUser._id, course._id);
    const a = await peer.post(`/api/v1/questions/${qid}/answers`).send({ body: 'Answer.' }).expect(201);

    // Student tries to verify — gets 403
    await asker.post(`/api/v1/answers/${a.body.data.answer.id}/verify`).expect(403);

    const notifs = await Notification.find({ recipientId: askerUser._id, type: 'COMMUNITY_ANSWER_VERIFIED' });
    expect(notifs).toHaveLength(0);
  });
});

describe('notification API', () => {
  test('GET /notifications returns own notifications', async () => {
    const { mentor, course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);
    await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);

    const res = await request(app).get('/api/v1/notifications').expect(401);

    const agent2 = request.agent(app);
    await agent2.post('/api/v1/auth/login').send({ email: mentor.email, password: 'password123' });
    const res2 = await agent2.get('/api/v1/notifications').expect(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.data.length).toBeGreaterThan(0);
  });

  test('GET /notifications/unread-count returns count', async () => {
    const { mentor, course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);
    await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);

    const agent2 = request.agent(app);
    await agent2.post('/api/v1/auth/login').send({ email: mentor.email, password: 'password123' });
    const res = await agent2.get('/api/v1/notifications/unread-count').expect(200);
    expect(res.body.data.count).toBeGreaterThan(0);
  });

  test('PATCH /notifications/:id/read marks as read', async () => {
    const { mentor, course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);
    await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);

    const agent2 = request.agent(app);
    await agent2.post('/api/v1/auth/login').send({ email: mentor.email, password: 'password123' });
    const list = await agent2.get('/api/v1/notifications').expect(200);
    const notifId = list.body.data[0].id;

    await agent2.patch(`/api/v1/notifications/${notifId}/read`).expect(200);

    const count = await agent2.get('/api/v1/notifications/unread-count').expect(200);
    expect(count.body.data.count).toBe(0);
  });

  test('PATCH /notifications/read-all marks all as read', async () => {
    const { mentor, course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);
    await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);

    const agent2 = request.agent(app);
    await agent2.post('/api/v1/auth/login').send({ email: mentor.email, password: 'password123' });
    await agent2.patch('/api/v1/notifications/read-all').expect(200);

    const count = await agent2.get('/api/v1/notifications/unread-count').expect(200);
    expect(count.body.data.count).toBe(0);
  });

  test('user cannot mark another user notification as read (IDOR)', async () => {
    const { mentor, course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);
    await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);

    const mentorAgent = await mentorAgentFor(mentor);
    const list = await mentorAgent.get('/api/v1/notifications').expect(200);
    const notifId = list.body.data[0].id;

    // Student tries to mark mentor's notification
    await agent.patch(`/api/v1/notifications/${notifId}/read`).expect(404);
  });

  test('unauthenticated request is rejected', async () => {
    await request(app).get('/api/v1/notifications').expect(401);
    await request(app).get('/api/v1/notifications/unread-count').expect(401);
  });
});
