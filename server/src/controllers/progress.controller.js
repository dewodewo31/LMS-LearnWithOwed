const LessonProgress = require('../models/LessonProgress');
const Lesson = require('../models/Lesson');
const ApiError = require('../utils/ApiError');
const respond = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');
const { canManageCourse } = require('../middleware/auth');
const { completeLesson, startLesson, activeEnrollmentOr403 } = require('../services/progressService');

// GET /courses/:courseId/progress — student: own; mentor: own course; admin: any.
const getCourseProgress = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  const user = req.user;

  if (user.role === 'student') {
    await activeEnrollmentOr403(user._id, courseId);
  } else {
    const Course = require('../models/Course');
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (!canManageCourse(user, course)) return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const [lessons, progressDocs] = await Promise.all([
    Lesson.find({ courseId }).sort({ order: 1 }).select('_id title order contentType duration').lean(),
    LessonProgress.find({ studentId: user._id, courseId }).lean(),
  ]);

  const completedLessonIds = progressDocs.filter((p) => p.status === 'completed').map((p) => String(p.lessonId));
  const percent = lessons.length === 0 ? 0 : Math.floor((completedLessonIds.length / lessons.length) * 100);

  return respond(res, {
    data: {
      courseId,
      lessons,
      completedLessonIds,
      completedCount: completedLessonIds.length,
      totalCount: lessons.length,
      percent,
      progressByLesson: Object.fromEntries(progressDocs.map((p) => [String(p.lessonId), p])),
    },
  });
});

// POST /lessons/:lessonId/start
const start = asyncHandler(async (req, res) => {
  const progress = await startLesson(req.user._id, req.params.lessonId);
  return respond(res, { message: 'Lesson started', data: { progress } });
});

// POST /lessons/:lessonId/complete
const complete = asyncHandler(async (req, res) => {
  const { enrollment, stats } = await completeLesson(req.user._id, req.params.lessonId);
  return respond(res, {
    message: stats?.status === 'completed' ? 'Course completed!' : 'Lesson completed',
    data: { progress: enrollment.progress, enrollmentStatus: enrollment.status, ...stats },
  });
});

const LESSON_CONTENT_FIELDS = 'title contentType textContent youtubeVideoId duration order courseId isPublished';

const serializeLessonContent = (lesson, assignmentId = null) => ({
  id: lesson._id,
  courseId: lesson.courseId,
  title: lesson.title,
  contentType: lesson.contentType,
  textContent: lesson.contentType === 'text' ? lesson.textContent : null,
  youtubeVideoId: lesson.contentType === 'video' ? lesson.youtubeVideoId : null,
  ...(assignmentId ? { assignmentId } : {}),
  duration: lesson.duration,
  order: lesson.order,
});

// GET /lessons/:lessonId/content — single-lesson protected content (docs/SECURITY.md §5).
// Student: active/completed enrollment + published lesson. Staff: course manage rights.
const getLessonContent = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId).select(LESSON_CONTENT_FIELDS);
  if (!lesson) throw new ApiError(404, 'Lesson not found');

  const user = req.user;
  const auditBase = { userId: user._id, entity: 'Lesson', entityId: lesson._id, ip: req.ip, userAgent: req.get('user-agent') };

  if (user.role === 'student') {
    if (!lesson.isPublished) {
      audit({ ...auditBase, action: 'UNAUTHORIZED_LESSON_ACCESS', metadata: { reason: 'unpublished' } });
      throw new ApiError(404, 'Lesson not found');
    }
    try {
      await activeEnrollmentOr403(user._id, lesson.courseId);
    } catch (err) {
      audit({ ...auditBase, action: 'UNAUTHORIZED_LESSON_ACCESS', metadata: { reason: 'no_enrollment' } });
      throw err;
    }
  } else {
    const Course = require('../models/Course');
    const course = await Course.findById(lesson.courseId);
    if (!course) throw new ApiError(404, 'Lesson not found');
    if (!canManageCourse(user, course)) throw new ApiError(403, 'Forbidden');
  }

  audit({ ...auditBase, action: 'LESSON_VIEW', metadata: { courseId: lesson.courseId } });

  let assignmentId = null;
  if (lesson.contentType === 'assignment') {
    const Assignment = require('../models/Assignment');
    const filter = { lessonId: lesson._id, isDeleted: false };
    if (user.role === 'student') filter.status = 'published';
    assignmentId = (await Assignment.findOne(filter).select('_id'))?._id || null;
  }

  return respond(res, { data: { lesson: serializeLessonContent(lesson, assignmentId) } });
});

module.exports = { getCourseProgress, start, complete, getLessonContent };
