const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const ApiError = require('../utils/ApiError');
const respond = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');
const { buildMeta, parsePagination } = require('../utils/paginate');
const { createEnrollment } = require('../services/progressService');

// GET /enrollments — admin: all; mentor: own courses (PRD matrix). Access management, not commerce.
const listEnrollments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  const { status, courseId, studentId, keyword } = req.query;

  if (req.user.role === 'mentor') {
    const Course = require('../models/Course');
    filter.courseId = { $in: (await Course.find({ mentorId: req.user._id }).select('_id')).map((c) => c._id) };
  } else {
    if (courseId) filter.courseId = courseId;
    if (studentId) filter.studentId = studentId;
  }
  if (status) filter.status = status;

  const [total, enrollments] = await Promise.all([
    Enrollment.countDocuments(filter),
    Enrollment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'name email photo')
      .populate('courseId', 'title category level'),
  ]);

  let rows = enrollments.filter((e) => e.studentId && e.courseId);
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    rows = rows.filter((e) => e.studentId.name?.toLowerCase().includes(kw) || e.courseId.title?.toLowerCase().includes(kw));
  }

  return respond(res, {
    data: {
      enrollments: rows.map((e) => ({
        id: e._id,
        student: { id: e.studentId._id, name: e.studentId.name, email: e.studentId.email, photo: e.studentId.photo },
        course: { id: e.courseId._id, title: e.courseId.title, category: e.courseId.category, level: e.courseId.level },
        source: e.source,
        status: e.status,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
      })),
    },
    meta: buildMeta({ page, limit, total }),
  });
});

// POST /enrollments — ADMIN ONLY (Critical product rule: enrollment is 100% admin-controlled).
const create = asyncHandler(async (req, res) => {
  const enrollment = await createEnrollment(req.body);
  return respond(res, { status: 201, message: 'Student enrolled successfully', data: { enrollment } });
});

// PATCH /enrollments/:id — admin: grant/revoke access.
const update = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) throw new ApiError(404, 'Enrollment not found');
  if (req.body.status === 'completed') {
    throw new ApiError(422, 'Validation failed', { status: 'Completion is managed automatically via lesson progress' });
  }
  enrollment.status = req.body.status;
  if (req.body.status !== 'completed') enrollment.completedAt = enrollment.status === 'active' ? null : enrollment.completedAt;
  await enrollment.save();
  return respond(res, { message: 'Enrollment updated', data: { enrollment } });
});

// DELETE /enrollments/:id — admin; blocked when progress exists (data integrity, PRD §68 spirit).
const remove = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) throw new ApiError(404, 'Enrollment not found');
  const hasProgress = await LessonProgress.exists({ studentId: enrollment.studentId, courseId: enrollment.courseId });
  if (hasProgress) {
    throw new ApiError(409, 'Enrollment has learning progress. Revoke access instead of deleting.');
  }
  await enrollment.deleteOne();
  return respond(res, { message: 'Enrollment removed' });
});

module.exports = { listEnrollments, create, update, remove };
