const path = require('path');
const { request, app, createUser, createCourse, addLesson, enroll, loginAs } = require('./helpers');
const Assignment = require('../src/models/Assignment');
const AssignmentSubmission = require('../src/models/AssignmentSubmission');
const Notification = require('../src/models/Notification');
const config = require('../src/config/env');

const CRITERIA = [
  { name: 'Creativity', description: 'Creative approach' },
  { name: 'Problem Solving' },
  { name: 'Coding Skills Development' },
];

/** Agent logged in as an EXISTING user (loginAs always creates a new user). */
const agentFor = async (user) => {
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login').send({ email: user.email, password: 'password123' });
  if (res.status !== 200) throw new Error(`agentFor login failed: ${res.status}`);
  return agent;
};

const createAssignmentLesson = async (mentorId, courseOverrides = {}) => {
  const course = await createCourse(mentorId, { status: 'published', ...courseOverrides });
  const lesson = await addLesson(course._id, 1, { title: 'Assignment Lesson', contentType: 'assignment', textContent: null });
  return { course, lesson };
};

const createAssignmentViaApi = async (agent, lessonId, overrides = {}) => {
  const res = await agent.post(`/api/v1/assignments/lessons/${lessonId}/assignment`).send({
    title: 'Fix the Roblox Drop Game',
    instructions: '<p>Perbaiki kode yang diberikan.</p>',
    assessmentCriteria: CRITERIA,
    ...overrides,
  });
  expect(res.status).toBe(201);
  return res.body.data.assignment;
};

const publishAssignment = async (agent, assignmentId) => {
  const res = await agent.patch(`/api/v1/assignments/${assignmentId}`).send({ status: 'published' });
  expect(res.status).toBe(200);
  return res.body.data.assignment;
};

const submitFiles = async (agent, assignmentId, files = [{ name: 'solution.lua', content: 'print("hi")' }], note = '') => {
  let req = agent.post(`/api/v1/assignments/${assignmentId}/submissions`);
  for (const f of files) req = req.attach('files', Buffer.from(f.content), f.name);
  if (note) req = req.field('note', note);
  return req;
};

describe('Assignment creation (teacher)', () => {
  test('mentor creates assignment on own assignment-type lesson; defaults to draft', async () => {
    const { agent, user: mentor } = await loginAs({ role: 'mentor' });
    const { lesson: ownLesson } = await createAssignmentLesson(mentor._id);

    const assignment = await createAssignmentViaApi(agent, ownLesson._id);
    expect(assignment.status).toBe('draft');
    expect(assignment.title).toBe('Fix the Roblox Drop Game');
    expect(assignment.assessmentCriteria).toHaveLength(3);
    expect(assignment.lessonId).toBe(String(ownLesson._id));
    expect(assignment.createdBy).toBe(String(mentor._id));
  });

  test('rejects assignment creation on non-assignment lessons', async () => {
    const { agent, user: mentor } = await loginAs({ role: 'mentor' });
    const course = await createCourse(mentor._id, { status: 'published' });
    const textLesson = await addLesson(course._id, 1);

    const res = await agent.post(`/api/v1/assignments/lessons/${textLesson._id}/assignment`).send({
      title: 'Wrong lesson type',
      assessmentCriteria: CRITERIA,
    });
    expect(res.status).toBe(422);
  });

  test('other mentor cannot create assignment on someone else\u2019s course', async () => {
    const owner = await createUser({ role: 'mentor' });
    const { lesson } = await createAssignmentLesson(owner._id);
    const { agent } = await loginAs({ role: 'mentor' });

    const res = await agent.post(`/api/v1/assignments/lessons/${lesson._id}/assignment`).send({
      title: 'Hijacked Assignment',
      assessmentCriteria: CRITERIA,
    });
    expect(res.status).toBe(403);
  });

  test('duplicate assignment for same lesson -> 409', async () => {
    const { agent, user: mentor } = await loginAs({ role: 'mentor' });
    const { lesson } = await createAssignmentLesson(mentor._id);
    await createAssignmentViaApi(agent, lesson._id);

    const res = await agent.post(`/api/v1/assignments/lessons/${lesson._id}/assignment`).send({
      title: 'Second assignment',
      assessmentCriteria: CRITERIA,
    });
    expect(res.status).toBe(409);
  });

  test('instructions are sanitized', async () => {
    const { agent, user: mentor } = await loginAs({ role: 'mentor' });
    const { lesson } = await createAssignmentLesson(mentor._id);
    const assignment = await createAssignmentViaApi(agent, lesson._id, {
      instructions: '<p>Aman</p><script>alert(1)</script>',
    });
    expect(assignment.instructions).toContain('<p>Aman</p>');
    expect(assignment.instructions).not.toContain('<script>');
  });

  test('teacher can update assignment and publish it', async () => {
    const { agent, user: mentor } = await loginAs({ role: 'mentor' });
    const { course, lesson } = await createAssignmentLesson(mentor._id);
    const assignment = await createAssignmentViaApi(agent, lesson._id);

    const updated = await agent.patch(`/api/v1/assignments/${assignment.id}`).send({
      title: 'Fix the Roblox Drop Game v2',
      deadline: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.assignment.title).toBe('Fix the Roblox Drop Game v2');
    expect(updated.body.data.assignment.deadline).toBeTruthy();

    const student = await createUser({ role: 'student' });
    await enroll(student._id, course._id);
    const published = await publishAssignment(agent, assignment.id);

    const notif = await Notification.findOne({ recipientId: student._id, type: 'ASSIGNMENT_PUBLISHED' });
    expect(notif).toBeTruthy();
    expect(String(notif.assignmentId)).toBe(assignment.id);
  });

  test('invalid grade scale in criteria is validated on grading, deadline update accepts null', async () => {
    const { agent, user: mentor } = await loginAs({ role: 'mentor' });
    const { lesson } = await createAssignmentLesson(mentor._id);
    const assignment = await createAssignmentViaApi(agent, lesson._id);

    const res = await agent.patch(`/api/v1/assignments/${assignment.id}`).send({ deadline: null });
    expect(res.status).toBe(200);
    expect(res.body.data.assignment.deadline).toBeNull();
  });
});

describe('Assignment files (teacher attachments)', () => {
  let mentorAgent, assignment;

  beforeEach(async () => {
    const { agent, user: mentor } = await loginAs({ role: 'mentor' });
    mentorAgent = agent;
    const { lesson } = await createAssignmentLesson(mentor._id);
    assignment = await createAssignmentViaApi(agent, lesson._id);
  });

  test('mentor uploads starter code; original name preserved, stored name is uuid', async () => {
    const res = await mentorAgent
      .post(`/api/v1/assignments/${assignment.id}/attachments`)
      .attach('files', Buffer.from('-- lua code'), 'starter-code.lua');
    expect(res.status).toBe(201);
    const [file] = res.body.data.attachments;
    expect(file.originalName).toBe('starter-code.lua');
    expect(file.id).toMatch(/^[0-9a-f-]{36}\.lua$/);
    expect(file.url).toContain(`/assignments/${assignment.id}/files/`);
  });

  test('rejects non-allowlisted extensions (.exe)', async () => {
    const res = await mentorAgent
      .post(`/api/v1/assignments/${assignment.id}/attachments`)
      .attach('files', Buffer.from('MZ...'), 'malware.exe');
    expect(res.status).toBe(400);
  });

  test('authorized download serves file; 404 for unknown fileId; traversal rejected', async () => {
    const up = await mentorAgent
      .post(`/api/v1/assignments/${assignment.id}/attachments`)
      .attach('files', Buffer.from('-- lua code'), 'starter-code.lua');
    const fileId = up.body.data.attachments[0].id;

    const dl = await mentorAgent.get(`/api/v1/assignments/${assignment.id}/files/${fileId}`);
    expect(dl.status).toBe(200);
    expect(dl.text).toBe('-- lua code');

    expect((await mentorAgent.get(`/api/v1/assignments/${assignment.id}/files/${'a'.repeat(36)}.lua`)).status).toBe(404);
    expect((await mentorAgent.get(`/api/v1/assignments/${assignment.id}/files/..%2F..%2Fsecret.lua`)).status).toBe(404);
  });

  test('mentor can remove an attachment', async () => {
    const up = await mentorAgent
      .post(`/api/v1/assignments/${assignment.id}/attachments`)
      .attach('files', Buffer.from('-- lua'), 'starter.lua');
    const fileId = up.body.data.attachments[0].id;

    const del = await mentorAgent.delete(`/api/v1/assignments/${assignment.id}/attachments/${fileId}`);
    expect(del.status).toBe(200);

    const after = await Assignment.findById(assignment.id);
    expect(after.attachments).toHaveLength(0);
  });
});

describe('Student assignment access + submission', () => {
  let mentorAgent, mentor, course, lesson, assignment, student, studentAgent;

  beforeEach(async () => {
    const login = await loginAs({ role: 'mentor' });
    mentorAgent = login.agent;
    mentor = login.user;
    ({ course, lesson } = await createAssignmentLesson(mentor._id));
    assignment = await createAssignmentViaApi(mentorAgent, lesson._id);
    await mentorAgent
      .post(`/api/v1/assignments/${assignment.id}/attachments`)
      .attach('files', Buffer.from('-- starter'), 'starter-code.lua');
    await publishAssignment(mentorAgent, assignment.id);

    student = await createUser({ role: 'student', name: 'Rio' });
    await enroll(student._id, course._id);
    studentAgent = await agentFor(student);
  });

  test('enrolled student views published assignment with files, criteria, and empty submission', async () => {
    const res = await studentAgent.get(`/api/v1/assignments/${assignment.id}`);
    expect(res.status).toBe(200);
    const a = res.body.data.assignment;
    expect(a.attachments).toHaveLength(1);
    expect(a.attachments[0].originalName).toBe('starter-code.lua');
    expect(a.assessmentCriteria).toHaveLength(3);
    expect(res.body.data.mySubmission).toBeNull();
    // no private fields leaked
    expect(a.createdBy).toBeUndefined();
  });

  test('unenrolled student cannot view assignment', async () => {
    const outsider = await createUser({ role: 'student' });
    const agent = await agentFor(outsider);
    const res = await agent.get(`/api/v1/assignments/${assignment.id}`);
    expect(res.status).toBe(403);
  });

  test('student cannot view draft assignment', async () => {
    const { agent: m2, user: m2u } = await loginAs({ role: 'mentor' });
    const { course: c2, lesson: l2 } = await createAssignmentLesson(m2u._id);
    const draft = await createAssignmentViaApi(m2, l2._id);
    const s2 = await createUser({ role: 'student' });
    await enroll(s2._id, c2._id);
    const s2agent = await agentFor(s2);

    expect((await s2agent.get(`/api/v1/assignments/${draft.id}`)).status).toBe(404);
  });

  test('student submits files with note; mentor notified', async () => {
    const res = await submitFiles(studentAgent, assignment.id, [{ name: 'solution.lua', content: 'print("fixed")' }], 'Sudah saya perbaiki');
    expect(res.status).toBe(201);
    const sub = res.body.data.submission;
    expect(sub.status).toBe('submitted');
    expect(sub.isLate).toBe(false);
    expect(sub.version).toBe(1);
    expect(sub.attachments[0].originalName).toBe('solution.lua');
    expect(sub.note).toBe('Sudah saya perbaiki');

    const notif = await Notification.findOne({ recipientId: mentor._id, type: 'ASSIGNMENT_SUBMITTED' });
    expect(notif).toBeTruthy();
  });

  test('submission requires at least one file', async () => {
    const res = await studentAgent.post(`/api/v1/assignments/${assignment.id}/submissions`).field('note', 'no file');
    expect(res.status).toBe(422);
  });

  test('rejects non-allowlisted submission extensions', async () => {
    const res = await submitFiles(studentAgent, assignment.id, [{ name: 'virus.exe', content: 'bad' }]);
    expect(res.status).toBe(400);
  });

  test('late submission is flagged when after deadline', async () => {
    await mentorAgent.patch(`/api/v1/assignments/${assignment.id}`).send({ deadline: new Date(Date.now() - 60000).toISOString() });
    const res = await submitFiles(studentAgent, assignment.id);
    expect(res.status).toBe(201);
    expect(res.body.data.submission.isLate).toBe(true);
  });

  test('resubmit bumps version and preserves history', async () => {
    await submitFiles(studentAgent, assignment.id, [{ name: 'v1.lua', content: 'v1' }]);
    const res = await submitFiles(studentAgent, assignment.id, [{ name: 'v2.lua', content: 'v2' }], 'revisi');
    expect(res.status).toBe(201);
    const sub = res.body.data.submission;
    expect(sub.version).toBe(2);
    expect(sub.attachments[0].originalName).toBe('v2.lua');
    expect(sub.history).toHaveLength(1);
    expect(sub.history[0].version).toBe(1);
    expect(sub.history[0].attachments[0].originalName).toBe('v1.lua');

    const stored = await AssignmentSubmission.findOne({ assignmentId: assignment.id, studentId: student._id });
    expect(stored.history[0].attachments[0].storedName).not.toBe(sub.attachments[0].id);
  });

  test('student cannot download another student\u2019s submission file', async () => {
    await submitFiles(studentAgent, assignment.id, [{ name: 'rio.lua', content: 'rio work' }]);
    const sub = await AssignmentSubmission.findOne({ assignmentId: assignment.id, studentId: student._id });

    const other = await createUser({ role: 'student' });
    await enroll(other._id, course._id);
    const otherAgent = await agentFor(other);

    const detail = await otherAgent.get(`/api/v1/assignments/submissions/${sub._id}`);
    expect(detail.status).toBe(403);

    const fileId = sub.attachments[0].storedName;
    const dl = await otherAgent.get(`/api/v1/assignments/submissions/${sub._id}/files/${fileId}`);
    expect(dl.status).toBe(403);
  });

  test('owner can download own submission file; unauthenticated cannot', async () => {
    await submitFiles(studentAgent, assignment.id, [{ name: 'rio.lua', content: 'rio work' }]);
    const sub = await AssignmentSubmission.findOne({ assignmentId: assignment.id, studentId: student._id });
    const fileId = sub.attachments[0].storedName;

    const dl = await studentAgent.get(`/api/v1/assignments/submissions/${sub._id}/files/${fileId}`);
    expect(dl.status).toBe(200);
    expect(dl.text).toBe('rio work');

    const anon = await request(app).get(`/api/v1/assignments/submissions/${sub._id}/files/${fileId}`);
    expect(anon.status).toBe(401);
  });
});

describe('Teacher review + grading', () => {
  let mentorAgent, mentor, course, assignment, student, studentAgent, submissionId;

  beforeEach(async () => {
    const login = await loginAs({ role: 'mentor' });
    mentorAgent = login.agent;
    mentor = login.user;
    ({ course, lesson } = await createAssignmentLesson(mentor._id));
    assignment = await createAssignmentViaApi(mentorAgent, lesson._id);
    await mentorAgent
      .post(`/api/v1/assignments/${assignment.id}/attachments`)
      .attach('files', Buffer.from('-- starter'), 'starter-code.lua');
    await publishAssignment(mentorAgent, assignment.id);

    student = await createUser({ role: 'student', name: 'Rio' });
    await enroll(student._id, course._id);
    studentAgent = await agentFor(student);
    const res = await submitFiles(studentAgent, assignment.id, [{ name: 'solution.lua', content: 'done' }]);
    submissionId = res.body.data.submission.id;
  });

  test('submissions list includes enrolled students without submissions', async () => {
    const other = await createUser({ role: 'student', name: 'Abidzar' });
    await enroll(other._id, course._id);

    const res = await mentorAgent.get(`/api/v1/assignments/${assignment.id}/submissions`);
    expect(res.status).toBe(200);
    const rows = res.body.data.submissions;
    expect(rows).toHaveLength(2);
    const rio = rows.find((r) => r.student.name === 'Rio');
    const abidzar = rows.find((r) => r.student.name === 'Abidzar');
    expect(rio.submission).toBeTruthy();
    expect(rio.submission.attachments[0].originalName).toBe('solution.lua');
    expect(abidzar.submission).toBeNull();
  });

  test('mentor grades all criteria with feedback; student sees result; notified', async () => {
    const res = await mentorAgent.patch(`/api/v1/assignments/submissions/${submissionId}/assessment`).send({
      criteria: [
        { name: 'Creativity', grade: 'A', feedback: 'Sangat kreatif' },
        { name: 'Problem Solving', grade: 'B+', feedback: 'Cukup baik' },
        { name: 'Coding Skills Development', grade: 'A+', feedback: '' },
      ],
      overallFeedback: 'Kerja bagus, lanjutkan!',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.submission.status).toBe('reviewed');
    expect(res.body.data.submission.assessment.overallFeedback).toBe('Kerja bagus, lanjutkan!');

    const view = await studentAgent.get(`/api/v1/assignments/${assignment.id}`);
    const sub = view.body.data.mySubmission;
    expect(sub.status).toBe('reviewed');
    expect(sub.assessment.criteria.find((c) => c.name === 'Creativity')).toMatchObject({ grade: 'A', feedback: 'Sangat kreatif' });

    const notif = await Notification.findOne({ recipientId: student._id, type: 'ASSIGNMENT_GRADED' });
    expect(notif).toBeTruthy();
  });

  test('grading must cover exactly the assignment criteria', async () => {
    const res = await mentorAgent.patch(`/api/v1/assignments/submissions/${submissionId}/assessment`).send({
      criteria: [{ name: 'Creativity', grade: 'A' }],
    });
    expect(res.status).toBe(422);
    expect(res.body.errors.criteria).toContain('Missing: Problem Solving');
  });

  test('invalid grade value rejected', async () => {
    const res = await mentorAgent.patch(`/api/v1/assignments/submissions/${submissionId}/assessment`).send({
      criteria: [
        { name: 'Creativity', grade: 'Z' },
        { name: 'Problem Solving', grade: 'B' },
        { name: 'Coding Skills Development', grade: 'B' },
      ],
    });
    expect(res.status).toBe(422);
  });

  test('another mentor cannot view or grade the submission', async () => {
    const { agent: stranger } = await loginAs({ role: 'mentor' });
    expect((await stranger.get(`/api/v1/assignments/submissions/${submissionId}`)).status).toBe(403);
    const grade = await stranger.patch(`/api/v1/assignments/submissions/${submissionId}/assessment`).send({
      criteria: CRITERIA.map((c) => ({ name: c.name, grade: 'A' })),
    });
    expect(grade.status).toBe(403);
  });

  test('student cannot grade', async () => {
    const res = await studentAgent.patch(`/api/v1/assignments/submissions/${submissionId}/assessment`).send({
      criteria: CRITERIA.map((c) => ({ name: c.name, grade: 'A' })),
    });
    expect(res.status).toBe(403);
  });

  test('submission detail exposes minimal student info (no email/phone/password)', async () => {
    const res = await mentorAgent.get(`/api/v1/assignments/submissions/${submissionId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.student.name).toBe('Rio');
    expect(res.body.data.student.email).toBeUndefined();
    expect(res.body.data.student.phone).toBeUndefined();
    expect(res.body.data.student.password).toBeUndefined();
  });
});

describe('Assignment lesson content integration', () => {
  test('lesson content returns assignmentId for assignment lessons, omitted otherwise', async () => {
    const { agent, user: mentor } = await loginAs({ role: 'mentor' });
    const { course, lesson } = await createAssignmentLesson(mentor._id);
    const assignment = await createAssignmentViaApi(agent, lesson._id);
    await publishAssignment(agent, assignment.id);

    const student = await createUser({ role: 'student' });
    await enroll(student._id, course._id);
    const studentAgent = await agentFor(student);

    const res = await studentAgent.get(`/api/v1/lessons/${lesson._id}/content`);
    expect(res.status).toBe(200);
    expect(res.body.data.lesson.contentType).toBe('assignment');
    expect(String(res.body.data.lesson.assignmentId)).toBe(assignment.id);

    const textLesson = await addLesson(course._id, 2);
    const res2 = await studentAgent.get(`/api/v1/lessons/${textLesson._id}/content`);
    expect(res.body.data.lesson.assignmentId).toBeDefined();
    expect(res2.body.data.lesson.assignmentId).toBeUndefined();
  });
});
