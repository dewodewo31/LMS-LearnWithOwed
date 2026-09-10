const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const CommunityAttachment = require('../models/CommunityAttachment');
const ApiError = require('../utils/ApiError');
const respond = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');
const { buildMeta, parsePagination } = require('../utils/paginate');
const { assertCourseAccess, claimAttachments, listAttachments, serializeAttachment } = require('../services/communityService');
const { createNotification } = require('../services/notificationService');
const { getVideoDurationSeconds, MAX_VIDEO_SECONDS, VIDEO_MIME_TYPES } = require('../utils/videoDuration');
const { IMAGE_MIME, communityMedia, communityMediaTypes } = require('../middleware/upload');

const escapeRx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const AUTHOR_FIELDS = 'name photo role';

const serializeQuestion = (q, extras = {}) => ({
  id: q._id,
  courseId: q.courseId,
  title: q.title,
  body: q.body,
  status: q.status,
  author: q.authorId
    ? { id: q.authorId._id, name: q.authorId.name, photo: q.authorId.photo, role: q.authorId.role }
    : null,
  hasVerified: extras.hasVerified ?? Boolean(q.verifiedAnswerId),
  answerCount: extras.answerCount ?? 0,
  createdAt: q.createdAt,
  updatedAt: q.updatedAt,
});

const serializeAnswer = (a) => ({
  id: a._id,
  body: a.body,
  isVerified: a.isVerified,
  author: a.authorId
    ? { id: a.authorId._id, name: a.authorId.name, photo: a.authorId.photo, role: a.authorId.role }
    : null,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

// GET /courses/:courseId/questions — enrollment/ownership enforced server-side.
const listQuestions = asyncHandler(async (req, res) => {
  const course = await assertCourseAccess(req.user, req.params.courseId);
  const { page, limit, skip } = parsePagination(req.query, { defaults: { page: 1, limit: 10 } });

  const match = { courseId: course._id };
  if (req.query.keyword) match.title = new RegExp(escapeRx(req.query.keyword), 'i');

  const base = [
    { $match: match },
    { $lookup: { from: 'answers', localField: '_id', foreignField: 'questionId', as: 'answers' } },
    { $addFields: { answerCount: { $size: '$answers' }, hasVerified: { $gt: ['$verifiedAnswerId', null] } } },
    { $project: { answers: 0 } },
  ];

  const answerFilter = req.query.filter;
  if (answerFilter === 'unanswered') base.push({ $match: { answerCount: 0 } });
  if (answerFilter === 'answered') base.push({ $match: { answerCount: { $gt: 0 } } });
  if (answerFilter === 'verified') base.push({ $match: { hasVerified: true } });

  const [[{ total = 0 } = {}], questions] = await Promise.all([
    Question.aggregate([...base, { $count: 'total' }]),
    Question.aggregate([...base, { $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }]),
  ]);

  await Question.populate(questions, { path: 'authorId', select: AUTHOR_FIELDS });

  return respond(res, {
    data: { questions: questions.map((q) => serializeQuestion(q, { answerCount: q.answerCount, hasVerified: q.hasVerified })) },
    meta: buildMeta({ page, limit, total }),
  });
});

// POST /courses/:courseId/questions
const createQuestion = asyncHandler(async (req, res) => {
  const course = await assertCourseAccess(req.user, req.params.courseId);
  const question = await Question.create({
    courseId: course._id,
    authorId: req.user._id,
    title: req.body.title,
    body: req.body.body,
  });
  const attachments = await claimAttachments(req.body.attachmentIds, req.user._id, { questionId: question._id });

  // Notify course mentor (not self, not other students)
  if (String(course.mentorId) !== String(req.user._id)) {
    await createNotification({
      recipientId: course.mentorId,
      actorId: req.user._id,
      type: 'COMMUNITY_NEW_QUESTION',
      title: 'New question in your course',
      message: `${req.user.name} asked a new question in ${course.title}`,
      courseId: course._id,
      questionId: question._id,
    });
  }

  return respond(res, {
    status: 201,
    message: 'Question posted',
    data: { question: { ...serializeQuestion(question), attachments: attachments.map(serializeAttachment) } },
  });
});

// GET /questions/:id — access derived from question.courseId (IDOR-safe).
const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id).populate('authorId', AUTHOR_FIELDS);
  if (!question) throw new ApiError(404, 'Question not found');
  await assertCourseAccess(req.user, question.courseId);
  const attachments = await listAttachments({ questionId: question._id });
  return respond(res, {
    data: { question: { ...serializeQuestion(question), attachments: attachments.map(serializeAttachment) } },
  });
});

// PATCH /questions/:id — author edits content; author or staff close. 'resolved' only via verification.
const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new ApiError(404, 'Question not found');
  const course = await assertCourseAccess(req.user, question.courseId);

  const isAuthor = String(question.authorId) === String(req.user._id);
  const isStaff = req.user.role === 'admin' || req.user.role === 'mentor';
  if (!isAuthor && !isStaff) throw new ApiError(403, 'You do not have permission to modify this question');
  if (!isAuthor && (req.body.title !== undefined || req.body.body !== undefined)) {
    throw new ApiError(403, 'Staff can moderate status but not edit question content');
  }

  if (req.body.title !== undefined) question.title = req.body.title;
  if (req.body.body !== undefined) question.body = req.body.body;
  if (req.body.status !== undefined) question.status = req.body.status;
  await question.save();
  await question.populate('authorId', AUTHOR_FIELDS);
  return respond(res, { message: 'Question updated', data: { question: serializeQuestion(question) } });
});

const removeAttachments = async (filter) => {
  const docs = await CommunityAttachment.find(filter);
  await Promise.all(
    docs.map(async (doc) => {
      await CommunityAttachment.deleteOne({ _id: doc._id });
      try {
        await fs.unlink(path.join(path.resolve(config.uploadPath), path.basename(doc.url)));
      } catch {
        /* file already gone — metadata cleanup is the integrity requirement */
      }
    })
  );
};

// DELETE /questions/:id — author or course staff. Cascades answers + attachments (data integrity, spec §33).
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new ApiError(404, 'Question not found');
  const isAuthor = String(question.authorId) === String(req.user._id);
  if (!isAuthor) {
    const course = await assertCourseAccess(req.user, question.courseId);
    if (!(req.user.role === 'admin' || String(course.mentorId) === String(req.user._id))) {
      throw new ApiError(403, 'You do not have permission to delete this question');
    }
  }
  await Answer.deleteMany({ questionId: question._id });
  await removeAttachments({ questionId: question._id });
  await question.deleteOne();
  return respond(res, { message: 'Question deleted' });
});

// GET /questions/:id/answers — verified first, then oldest. Paginated (spec §26).
const listAnswers = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new ApiError(404, 'Question not found');
  await assertCourseAccess(req.user, question.courseId);

  const { page, limit, skip } = parsePagination(req.query, { defaults: { page: 1, limit: 20 } });
  const filter = { questionId: question._id };
  const [total, answers] = await Promise.all([
    Answer.countDocuments(filter),
    Answer.find(filter).sort({ isVerified: -1, createdAt: 1 }).skip(skip).limit(limit).populate('authorId', AUTHOR_FIELDS),
  ]);

  const attachments = await listAttachments({ answerId: { $in: answers.map((a) => a._id) } });
  const byAnswer = new Map();
  for (const a of attachments) {
    const key = String(a.answerId);
    if (!byAnswer.has(key)) byAnswer.set(key, []);
    byAnswer.get(key).push(serializeAttachment(a));
  }

  return respond(res, {
    data: { answers: answers.map((a) => ({ ...serializeAnswer(a), attachments: byAnswer.get(String(a._id)) || [] })) },
    meta: buildMeta({ page, limit, total }),
  });
});

// POST /questions/:id/answers
const createAnswer = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new ApiError(404, 'Question not found');
  const course = await assertCourseAccess(req.user, question.courseId);
  if (question.status === 'closed') throw new ApiError(409, 'This question is closed for new answers');

  const answer = await Answer.create({ questionId: question._id, authorId: req.user._id, body: req.body.body });
  await claimAttachments(req.body.attachmentIds, req.user._id, { answerId: answer._id });
  await answer.populate('authorId', AUTHOR_FIELDS);
  const attachments = await listAttachments({ answerId: answer._id });

  // Notify question author (not self)
  if (String(question.authorId) !== String(req.user._id)) {
    await createNotification({
      recipientId: question.authorId,
      actorId: req.user._id,
      type: 'COMMUNITY_NEW_ANSWER',
      title: 'New answer to your question',
      message: `${req.user.name} answered your question in ${course.title}`,
      courseId: course._id,
      questionId: question._id,
      answerId: answer._id,
    });
  }

  return respond(res, {
    status: 201,
    message: 'Answer posted',
    data: { answer: { ...serializeAnswer(answer), attachments: attachments.map(serializeAttachment) } },
  });
});

// PATCH /answers/:id — author only (spec §33: no edits by others).
const updateAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new ApiError(404, 'Answer not found');
  if (String(answer.authorId) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have permission to modify this answer');
  }
  answer.body = req.body.body;
  await answer.save();
  await answer.populate('authorId', AUTHOR_FIELDS);
  return respond(res, { message: 'Answer updated', data: { answer: serializeAnswer(answer) } });
});

// DELETE /answers/:id — author or course staff. Clears verification if it was the verified one.
const deleteAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new ApiError(404, 'Answer not found');
  const question = await Question.findById(answer.questionId);
  const isAuthor = String(answer.authorId) === String(req.user._id);
  let isStaff = false;
  if (!isAuthor) {
    const course = await assertCourseAccess(req.user, question.courseId);
    isStaff = req.user.role === 'admin' || String(course.mentorId) === String(req.user._id);
    if (!isStaff) throw new ApiError(403, 'You do not have permission to delete this answer');
  }
  if (question && String(question.verifiedAnswerId) === String(answer._id)) {
    question.verifiedAnswerId = null;
    if (question.status === 'resolved') question.status = 'active';
    await question.save();
  }
  await removeAttachments({ answerId: answer._id });
  await answer.deleteOne();
  return respond(res, { message: 'Answer deleted' });
});

// POST /answers/:id/verify — mentor (course owner) or admin only. One verified answer per question.
const verifyAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new ApiError(404, 'Answer not found');
  const question = await Question.findById(answer.questionId);
  if (!question) throw new ApiError(404, 'Question not found');
  const course = await assertCourseAccess(req.user, question.courseId);
  if (!(req.user.role === 'admin' || String(course.mentorId) === String(req.user._id))) {
    throw new ApiError(403, 'Only the course mentor or an admin can verify answers');
  }

  await Answer.updateMany({ questionId: question._id, _id: { $ne: answer._id } }, { $set: { isVerified: false } });
  answer.isVerified = true;
  await answer.save();
  question.verifiedAnswerId = answer._id;
  question.status = 'resolved';
  await question.save();

  // Notify question author (not self)
  if (String(question.authorId) !== String(req.user._id)) {
    await createNotification({
      recipientId: question.authorId,
      actorId: req.user._id,
      type: 'COMMUNITY_ANSWER_VERIFIED',
      title: 'Answer verified',
      message: `Your question in ${course.title} now has a verified answer`,
      courseId: course._id,
      questionId: question._id,
      answerId: answer._id,
    });
  }

  return respond(res, {
    message: 'Answer verified',
    data: { answer: serializeAnswer(await answer.populate('authorId', AUTHOR_FIELDS)), questionStatus: question.status },
  });
});

// POST /answers/:id/unverify — same roles as verify.
const unverifyAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new ApiError(404, 'Answer not found');
  const question = await Question.findById(answer.questionId);
  if (!question) throw new ApiError(404, 'Question not found');
  const course = await assertCourseAccess(req.user, question.courseId);
  if (!(req.user.role === 'admin' || String(course.mentorId) === String(req.user._id))) {
    throw new ApiError(403, 'Only the course mentor or an admin can unverify answers');
  }

  answer.isVerified = false;
  await answer.save();
  if (String(question.verifiedAnswerId) === String(answer._id)) {
    question.verifiedAnswerId = null;
    if (question.status === 'resolved') question.status = 'active';
    await question.save();
  }
  return respond(res, {
    message: 'Verification removed',
    data: { answer: serializeAnswer(await answer.populate('authorId', AUTHOR_FIELDS)) },
  });
});

// POST /uploads/community — image or short video upload, returns an unclaimed attachment.
const uploadCommunityMediaHandler = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const { mimetype } = req.file;

  if (communityMediaTypes.has(mimetype) && !IMAGE_MIME.has(mimetype)) {
    // Video: server-side duration inspection — strict 30s limit (spec §12–13).
    if (!VIDEO_MIME_TYPES.has(mimetype)) throw new ApiError(400, 'Invalid video type. Allowed: MP4, WebM');
    const duration = getVideoDurationSeconds(req.file.buffer, mimetype);
    if (duration === null) throw new ApiError(400, 'Unable to verify video duration. Please upload a valid MP4 or WebM video.');
    if (duration > MAX_VIDEO_SECONDS) throw new ApiError(400, 'Video must be 30 seconds or shorter.');

    const filename = `${crypto.randomUUID()}${VIDEO_MIME_TYPES.get(mimetype)}`;
    const dir = path.resolve(config.uploadPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), req.file.buffer);
    const attachment = await CommunityAttachment.create({
      ownerId: req.user._id,
      kind: 'video',
      url: `/uploads/${filename}`,
      mimeType: mimetype,
      size: req.file.size,
      durationSec: Math.round(duration * 100) / 100,
    });
    return respond(res, { status: 201, message: 'Video uploaded', data: { attachment: serializeAttachment(attachment) } });
  }

  const ext = IMAGE_MIME.get(mimetype);
  if (req.file.size > 2 * 1024 * 1024) throw new ApiError(400, 'Image too large (max 2 MB)');
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.resolve(config.uploadPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), req.file.buffer);
  const attachment = await CommunityAttachment.create({
    ownerId: req.user._id,
    kind: 'image',
    url: `/uploads/${filename}`,
    mimeType: mimetype,
    size: req.file.size,
  });
  return respond(res, { status: 201, message: 'Image uploaded', data: { attachment: serializeAttachment(attachment) } });
});

// DELETE /uploads/community/:id — owner may remove an unclaimed upload (cancel/undo in the form).
const deleteUnclaimedAttachment = asyncHandler(async (req, res) => {
  const attachment = await CommunityAttachment.findById(req.params.id);
  if (!attachment) throw new ApiError(404, 'Attachment not found');
  if (String(attachment.ownerId) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have permission to remove this attachment');
  }
  if (attachment.questionId || attachment.answerId) {
    throw new ApiError(409, 'Attachment already belongs to a question or answer');
  }
  await CommunityAttachment.deleteOne({ _id: attachment._id });
  try {
    await fs.unlink(path.join(path.resolve(config.uploadPath), path.basename(attachment.url)));
  } catch {
    /* already gone */
  }
  return respond(res, { message: 'Attachment removed' });
});

module.exports = {
  listQuestions,
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  listAnswers,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  verifyAnswer,
  unverifyAnswer,
  uploadCommunityMedia: [communityMedia.single('file'), uploadCommunityMediaHandler],
  deleteUnclaimedAttachment,
};
