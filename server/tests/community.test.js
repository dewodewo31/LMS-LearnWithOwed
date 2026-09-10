/* Community / Q&A tests — enrollment access, questions, answers, verification, media (30s), IDOR. */
const {
  request, app, createUser, loginAs, createCourse, addLesson, enroll,
} = require('./helpers');
const { getVideoDurationSeconds } = require('../src/utils/videoDuration');

const QUESTION = { title: 'Why does my function return undefined?', body: 'I return a value but the console shows undefined. What am I missing?' };

const ebml = (hexId, payload) => {
  const id = Buffer.from(hexId, 'hex');
  const size = payload.length < 127 ? Buffer.from([0x80 | payload.length]) : Buffer.from([0x40 | (payload.length >> 8), payload.length & 0xff]);
  return Buffer.concat([id, size, payload]);
};

const mp4Buffer = (seconds, timescale = 1000) => {
  const ts = Buffer.alloc(4);
  ts.writeUInt32BE(timescale);
  const dur = Buffer.alloc(4);
  dur.writeUInt32BE(seconds * timescale);
  return Buffer.concat([Buffer.from('0000ftypisom0000'), Buffer.from('mvhd'), Buffer.from([0, 0, 0, 0]), Buffer.alloc(8), ts, dur]);
};

const webmBuffer = (seconds) => {
  const scale = Buffer.from([0x0f, 0x42, 0x40]); // 1000000 ns (1 ms) per EBML default
  const dur = Buffer.alloc(4);
  dur.writeFloatBE(seconds * 1000, 0); // Duration value in TimecodeScale (1 ms) units
  const info = ebml('1549A966', Buffer.concat([ebml('2AD7B1', scale), ebml('4489', dur)]));
  return Buffer.concat([ebml('1A45DFA3', Buffer.alloc(0)), ebml('18538067', info)]);
};

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const loginAsExisting = async (email, password = 'password123') => {
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  return agent;
};

async function setupCourse() {
  const mentor = await createUser({ role: 'mentor', name: 'Mentor Own' });
  const course = await createCourse(mentor._id, { status: 'published' });
  await addLesson(course._id, 1);
  return { mentor, course };
}

const mentorAgentFor = (mentor) => loginAsExisting(mentor.email);

describe('video duration parser', () => {
  test('parses MP4 mvhd duration', () => {
    expect(getVideoDurationSeconds(mp4Buffer(30), 'video/mp4')).toBeCloseTo(30, 5);
    expect(getVideoDurationSeconds(mp4Buffer(45.5), 'video/mp4')).toBeCloseTo(45.5, 5);
  });
  test('parses WebM duration with timecode scale', () => {
    expect(getVideoDurationSeconds(webmBuffer(28), 'video/webm')).toBeCloseTo(28, 2);
  });
  test('returns null for garbage or unsupported containers', () => {
    expect(getVideoDurationSeconds(Buffer.alloc(512, 7), 'video/mp4')).toBeNull();
    expect(getVideoDurationSeconds(mp4Buffer(30), 'video/quicktime')).toBeNull();
    expect(getVideoDurationSeconds(null, 'video/mp4')).toBeNull();
  });
});

describe('community access control', () => {
  test('enrolled student lists questions with pagination meta', async () => {
    const { course } = await setupCourse();
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);
    const res = await agent.get(`/api/v1/courses/${course._id}/questions`).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta).toMatchObject({ page: 1, total: 0 });
  });

  test('unenrolled student receives 403', async () => {
    const { course } = await setupCourse();
    const { agent } = await loginAs({});
    const res = await agent.get(`/api/v1/courses/${course._id}/questions`).expect(403);
    expect(res.body.success).toBe(false);
  });

  test('mentor owner sees community; mentor of another course does not', async () => {
    const { mentor, course } = await setupCourse();
    const owner = await mentorAgentFor(mentor);
    await owner.get(`/api/v1/courses/${course._id}/questions`).expect(200);

    const { agent: stranger } = await loginAs({ role: 'mentor' });
    await stranger.get(`/api/v1/courses/${course._id}/questions`).expect(403);
  });

  test('unauthenticated request is rejected', async () => {
    const { course } = await setupCourse();
    await request(app).get(`/api/v1/courses/${course._id}/questions`).expect(401);
  });
});

describe('questions', () => {
  test('enrolled student creates and reads a question', async () => {
    const { course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);

    const created = await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const qid = created.body.data.question.id;
    expect(created.body.data.question.status).toBe('active');

    const detail = await agent.get(`/api/v1/questions/${qid}`).expect(200);
    expect(detail.body.data.question.title).toBe(QUESTION.title);
    expect(detail.body.data.question.author.id).toBe(String(user._id));
    expect(detail.body.data.question.courseId).toBe(String(course._id));
  });

  test('unenrolled student cannot create a question', async () => {
    const { course } = await setupCourse();
    const { agent } = await loginAs({});
    await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(403);
  });

  test('validation rejects short title and body', async () => {
    const { course } = await setupCourse();
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);
    const res = await agent.post(`/api/v1/courses/${course._id}/questions`).send({ title: 'hi', body: 'short' }).expect(422);
    expect(res.body.errors).toBeTruthy();
  });

  test('list filters: keyword, unanswered, answered, verified', async () => {
    const { mentor, course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);
    const q1 = await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    await agent.post(`/api/v1/courses/${course._id}/questions`).send({ ...QUESTION, title: 'How does map() actually work?' }).expect(201);

    const mentorAgent = await mentorAgentFor(mentor);
    await mentorAgent.post(`/api/v1/questions/${q1.body.data.question.id}/answers`).send({ body: 'Return the value from the function.' }).expect(201);

    const keyword = await agent.get(`/api/v1/courses/${course._id}/questions?keyword=map()`).expect(200);
    expect(keyword.body.data.questions).toHaveLength(1);
    expect(keyword.body.data.questions[0].answerCount).toBe(0);

    const unanswered = await agent.get(`/api/v1/courses/${course._id}/questions?filter=unanswered`).expect(200);
    expect(unanswered.body.data.questions).toHaveLength(1);
    const answered = await agent.get(`/api/v1/courses/${course._id}/questions?filter=answered`).expect(200);
    expect(answered.body.data.questions).toHaveLength(1);
    expect(answered.body.data.questions[0].answerCount).toBe(1);

    const answer = await mentorAgent.get(`/api/v1/questions/${q1.body.data.question.id}/answers`).expect(200);
    await mentorAgent.post(`/api/v1/answers/${answer.body.data.answers[0].id}/verify`).expect(200);
    const verified = await agent.get(`/api/v1/courses/${course._id}/questions?filter=verified`).expect(200);
    expect(verified.body.data.questions).toHaveLength(1);
    expect(verified.body.data.questions[0].hasVerified).toBe(true);
    const resolved = await agent.get(`/api/v1/questions/${q1.body.data.question.id}`).expect(200);
    expect(resolved.body.data.question.status).toBe('resolved');
  });

  test('author edits own question; other student gets 403 (IDOR)', async () => {
    const { course } = await setupCourse();
    const { agent: author, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);
    const q = await author.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const qid = q.body.data.question.id;

    await author.patch(`/api/v1/questions/${qid}`).send({ title: 'Why does my reduce() return undefined?' }).expect(200);

    const { agent: strangerAgent } = await loginAs({ name: 'Student B' });
    await strangerAgent.patch(`/api/v1/questions/${qid}`).send({ title: 'Hijacked title here' }).expect(403);
  });

  test('author deletes own question; answers and attachments are cleaned up', async () => {
    const { mentor, course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Student A' });
    await enroll(user._id, course._id);
    const q = await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const qid = q.body.data.question.id;

    const mentorAgent = await mentorAgentFor(mentor);
    await mentorAgent.post(`/api/v1/questions/${qid}/answers`).send({ body: 'Answer body here.' }).expect(201);

    await agent.delete(`/api/v1/questions/${qid}`).expect(200);
    await agent.get(`/api/v1/questions/${qid}`).expect(404);
    const Answer = require('../src/models/Answer');
    expect(await Answer.countDocuments({ questionId: qid })).toBe(0);
  });
});

describe('answers', () => {
  test('enrolled student answers; unenrolled cannot', async () => {
    const { course } = await setupCourse();
    const { agent, user } = await loginAs({ name: 'Asker' });
    await enroll(user._id, course._id);
    const q = await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const qid = q.body.data.question.id;

    const { agent: peer, user: peerUser } = await loginAs({ name: 'Peer' });
    await enroll(peerUser._id, course._id);
    const a = await peer.post(`/api/v1/questions/${qid}/answers`).send({ body: 'You forgot to return the value.' }).expect(201);
    expect(a.body.data.answer.author.id).toBe(String(peerUser._id));

    const { agent: outsider } = await loginAs({ name: 'Outsider' });
    await outsider.post(`/api/v1/questions/${qid}/answers`).send({ body: 'Trying to answer anyway.' }).expect(403);
  });

  test('closed question rejects new answers', async () => {
    const { course } = await setupCourse();
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);
    const q = await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const qid = q.body.data.question.id;
    await agent.patch(`/api/v1/questions/${qid}`).send({ status: 'closed' }).expect(200);
    await agent.post(`/api/v1/questions/${qid}/answers`).send({ body: 'Too late.' }).expect(409);
  });

  test('answers are paginated and verified answer sorts first', async () => {
    const { mentor, course } = await setupCourse();
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);
    const q = await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const qid = q.body.data.question.id;

    const mentorAgent = await mentorAgentFor(mentor);
    const a1 = await mentorAgent.post(`/api/v1/questions/${qid}/answers`).send({ body: 'First answer.' }).expect(201);
    await mentorAgent.post(`/api/v1/questions/${qid}/answers`).send({ body: 'Second answer.' }).expect(201);
    await mentorAgent.post(`/api/v1/answers/${a1.body.data.answer.id}/verify`).expect(200);

    const list = await agent.get(`/api/v1/questions/${qid}/answers`).expect(200);
    expect(list.body.data.answers[0].isVerified).toBe(true);
    expect(list.body.meta).toMatchObject({ page: 1, total: 2 });
  });

  test('only the author can edit an answer (IDOR)', async () => {
    const { course } = await setupCourse();
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);
    const q = await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const a = await agent.post(`/api/v1/questions/${q.body.data.question.id}/answers`).send({ body: 'Original answer.' }).expect(201);
    const aid = a.body.data.answer.id;

    await agent.patch(`/api/v1/answers/${aid}`).send({ body: 'Edited answer.' }).expect(200);

    const { agent: other, user: otherUser } = await loginAs({ name: 'Peer' });
    await enroll(otherUser._id, course._id);
    await other.patch(`/api/v1/answers/${aid}`).send({ body: 'Hijack.' }).expect(403);
  });
});

describe('verified answer permissions', () => {
  async function questionWithAnswer() {
    const { mentor, course } = await setupCourse();
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);
    const q = await agent.post(`/api/v1/courses/${course._id}/questions`).send(QUESTION).expect(201);
    const { agent: peer, user: peerUser } = await loginAs({ name: 'Peer' });
    await enroll(peerUser._id, course._id);
    const a = await peer.post(`/api/v1/questions/${q.body.data.question.id}/answers`).send({ body: 'Peer answer.' }).expect(201);
    const mentorAgent = await mentorAgentFor(mentor);
    return { course, qid: q.body.data.question.id, aid: a.body.data.answer.id, mentorAgent, agent, peerAgent: peer };
  }

  test('student cannot verify (role gate)', async () => {
    const { qid, aid, agent } = await questionWithAnswer();
    const res = await agent.post(`/api/v1/answers/${aid}/verify`).expect(403);
    expect(res.body.success).toBe(false);
  });

  test('mentor of another course cannot verify (ownership)', async () => {
    const { aid } = await questionWithAnswer();
    const { agent: stranger } = await loginAs({ role: 'mentor' });
    await stranger.post(`/api/v1/answers/${aid}/verify`).expect(403);
  });

  test('mentor owner verifies; second verification keeps exactly one verified answer', async () => {
    const { course, qid, mentorAgent, agent } = await questionWithAnswer();
    await mentorAgent.post(`/api/v1/questions/${qid}/answers`).send({ body: 'Second answer.' }).expect(201);
    const answers = await mentorAgent.get(`/api/v1/questions/${qid}/answers`).expect(200);
    const [first, second] = answers.body.data.answers;

    await mentorAgent.post(`/api/v1/answers/${first.id}/verify`).expect(200);
    await mentorAgent.post(`/api/v1/answers/${second.id}/verify`).expect(200);

    const list = await agent.get(`/api/v1/questions/${qid}/answers`).expect(200);
    const verified = list.body.data.answers.filter((a) => a.isVerified);
    expect(verified).toHaveLength(1);
    expect(verified[0].id).toBe(second.id);

    const detail = await agent.get(`/api/v1/questions/${qid}`).expect(200);
    expect(detail.body.data.question.status).toBe('resolved');
    expect(detail.body.data.question.hasVerified).toBe(true);

    const { agent: admin } = await loginAs({ role: 'admin' });
    await admin.post(`/api/v1/answers/${first.id}/verify`).expect(200);
  });

  test('unverify clears verification and reopens the question', async () => {
    const { qid, aid, mentorAgent, agent } = await questionWithAnswer();
    await mentorAgent.post(`/api/v1/answers/${aid}/verify`).expect(200);
    await mentorAgent.post(`/api/v1/answers/${aid}/unverify`).expect(200);

    const detail = await agent.get(`/api/v1/questions/${qid}`).expect(200);
    expect(detail.body.data.question.status).toBe('active');
    expect(detail.body.data.question.hasVerified).toBe(false);
  });

  test('deleting the verified answer clears verification', async () => {
    const { qid, aid, peerAgent, agent } = await questionWithAnswer();
    const { agent: admin } = await loginAs({ role: 'admin' });
    await admin.post(`/api/v1/answers/${aid}/verify`).expect(200);
    await peerAgent.delete(`/api/v1/answers/${aid}`).expect(200);

    const detail = await agent.get(`/api/v1/questions/${qid}`).expect(200);
    expect(detail.body.data.question.hasVerified).toBe(false);
  });
});

describe('community media upload', () => {
  test('valid image is accepted and claimed into a question', async () => {
    const { course } = await setupCourse();
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);
    const up = await agent.post('/api/v1/uploads/community').attach('file', PNG_1PX, { filename: 'error.png', contentType: 'image/png' }).expect(201);
    const attachmentId = up.body.data.attachment.id;
    expect(up.body.data.attachment.kind).toBe('image');

    const q = await agent
      .post(`/api/v1/courses/${course._id}/questions`)
      .send({ ...QUESTION, attachmentIds: [attachmentId] })
      .expect(201);
    const detail = await agent.get(`/api/v1/questions/${q.body.data.question.id}`).expect(200);
    expect(detail.body.data.question.attachments).toHaveLength(1);
    expect(detail.body.data.question.attachments[0].url).toMatch(/^\/uploads\//);
  });

  test('invalid image type is rejected', async () => {
    const { agent } = await loginAs({});
    await agent.post('/api/v1/uploads/community').attach('file', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' }).expect(400);
  });

  test('oversized image is rejected (2 MB limit)', async () => {
    const { agent } = await loginAs({});
    await agent
      .post('/api/v1/uploads/community')
      .attach('file', Buffer.alloc(3 * 1024 * 1024, 1), { filename: 'big.png', contentType: 'image/png' })
      .expect(400);
  });

  test('video at or under 30 seconds is accepted; over 30 seconds is rejected', async () => {
    const { agent } = await loginAs({});
    await agent
      .post('/api/v1/uploads/community')
      .attach('file', mp4Buffer(30), { filename: 'ok.mp4', contentType: 'video/mp4' })
      .expect(201);
    await agent
      .post('/api/v1/uploads/community')
      .attach('file', mp4Buffer(31), { filename: 'toolong.mp4', contentType: 'video/mp4' })
      .expect(400)
      .expect((res) => expect(res.body.message).toBe('Video must be 30 seconds or shorter.'));
  });

  test('WebM video is accepted and duration metadata is stored', async () => {
    const { agent } = await loginAs({});
    const up = await agent
      .post('/api/v1/uploads/community')
      .attach('file', webmBuffer(28), { filename: 'clip.webm', contentType: 'video/webm' })
      .expect(201);
    expect(up.body.data.attachment.durationSec).toBeGreaterThan(27);
    expect(up.body.data.attachment.durationSec).toBeLessThan(29);
  });

  test('unsupported video container and unverifiable video are rejected', async () => {
    const { agent } = await loginAs({});
    await agent
      .post('/api/v1/uploads/community')
      .attach('file', Buffer.from('....moov....'), { filename: 'clip.mov', contentType: 'video/quicktime' })
      .expect(400);
    await agent
      .post('/api/v1/uploads/community')
      .attach('file', Buffer.alloc(2048, 3), { filename: 'fake.mp4', contentType: 'video/mp4' })
      .expect(400)
      .expect((res) => expect(res.body.message).toMatch(/Unable to verify video duration/i));
  });
});

describe('attachment ownership (IDOR)', () => {
  test("another user's attachment cannot be claimed", async () => {
    const { course } = await setupCourse();
    const { agent: uploader } = await loginAs({ name: 'Uploader' });
    const up = await uploader.post('/api/v1/uploads/community').attach('file', PNG_1PX, { filename: 'mine.png', contentType: 'image/png' }).expect(201);

    const { agent, user } = await loginAs({ name: 'Claimer' });
    await enroll(user._id, course._id);
    await agent
      .post(`/api/v1/courses/${course._id}/questions`)
      .send({ ...QUESTION, attachmentIds: [up.body.data.attachment.id] })
      .expect(403);
  });

  test('a claimed attachment cannot be reused', async () => {
    const { course } = await setupCourse();
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);
    const up = await agent.post('/api/v1/uploads/community').attach('file', PNG_1PX, { filename: 'once.png', contentType: 'image/png' }).expect(201);
    const id = up.body.data.attachment.id;
    await agent.post(`/api/v1/courses/${course._id}/questions`).send({ ...QUESTION, attachmentIds: [id] }).expect(201);
    const dup = await agent
      .post(`/api/v1/courses/${course._id}/questions`)
      .send({ ...QUESTION, title: 'Second question about reduce()', attachmentIds: [id] });
    expect([403, 409]).toContain(dup.status);
  });

  test('owner can remove an unclaimed attachment; others cannot', async () => {
    const { agent } = await loginAs({});
    const up = await agent.post('/api/v1/uploads/community').attach('file', PNG_1PX, { filename: 'tmp.png', contentType: 'image/png' }).expect(201);
    const id = up.body.data.attachment.id;

    const { agent: other } = await loginAs({});
    await other.delete(`/api/v1/uploads/community/${id}`).expect(403);
    await agent.delete(`/api/v1/uploads/community/${id}`).expect(200);
  });
});

describe('content security', () => {
  test('user-generated text is stored verbatim as inert text (client escapes on render)', async () => {
    const { course } = await setupCourse();
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);
    const payload = {
      title: 'Script tag question test',
      body: 'My code: <script>alert(1)</script> and <img src=x onerror=alert(2)> — expected output?',
    };
    const created = await agent.post(`/api/v1/courses/${course._id}/questions`).send(payload).expect(201);
    const detail = await agent.get(`/api/v1/questions/${created.body.data.question.id}`).expect(200);
    expect(detail.body.data.question.body).toBe(payload.body);
  });

  test('pagination limits are respected', async () => {
    const { course } = await setupCourse();
    const { agent, user } = await loginAs({});
    await enroll(user._id, course._id);
    for (let i = 1; i <= 3; i += 1) {
      await agent.post(`/api/v1/courses/${course._id}/questions`).send({ ...QUESTION, title: `Question number ${i} here` }).expect(201);
    }
    const page1 = await agent.get(`/api/v1/courses/${course._id}/questions?limit=2`).expect(200);
    expect(page1.body.data.questions).toHaveLength(2);
    expect(page1.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
    const page2 = await agent.get(`/api/v1/courses/${course._id}/questions?limit=2&page=2`).expect(200);
    expect(page2.body.data.questions).toHaveLength(1);
  });
});
