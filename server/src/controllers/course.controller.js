const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const respond = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');
const { buildMeta, parsePagination } = require('../utils/paginate');
const { canManageCourse } = require('../middleware/auth');
const { assertPublishable, sanitizeCourseContent, sanitizeLessonContent, reorderLessons, syncTotalLessons } = require('../services/courseService');
const { activeEnrollmentOr403 } = require('../services/progressService');

const escapeRx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /courses — admin: all, mentor: own. Students must use /courses/mine (UI-UX.md §3).
const listCourses = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') throw new ApiError(403, 'Students access their assigned courses via my-courses');

  const { page, limit, skip } = parsePagination(req.query);
  const filter = { isDeleted: false };
  if (req.user.role === 'mentor') filter.mentorId = req.user._id;
  const { keyword, category, level, status, mentorId } = req.query;
  if (keyword) filter.title = new RegExp(escapeRx(keyword), 'i');
  if (category) filter.category = category;
  if (level) filter.level = level;
  if (status) filter.status = status;
  if (mentorId && req.user.role === 'admin') filter.mentorId = mentorId;

  const [total, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('mentorId', 'name'),
  ]);

  return respond(res, {
    data: { courses: courses.map(toCourseSummary) },
    meta: buildMeta({ page, limit, total }),
  });
});

const toCourseSummary = (c) => ({
  id: c._id,
  title: c.title,
  slug: c.slug,
  shortDescription: c.shortDescription,
  thumbnail: c.thumbnail,
  category: c.category,
  level: c.level,
  language: c.language,
  status: c.status,
  totalLessons: c.totalLessons,
  mentor: c.mentorId ? { id: c.mentorId._id, name: c.mentorId.name } : null,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

// GET /courses/:id — access per PRD §67: admin, mentor owner, or enrolled student (active/completed).
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, isDeleted: false }).populate('mentorId', 'name photo bio');
  if (!course) throw new ApiError(404, 'Course not found');

  const user = req.user;
  if (user.role === 'student') {
    await activeEnrollmentOr403(user._id, course._id);
  } else if (!canManageCourse(user, course)) {
    throw new ApiError(403, 'You do not have permission to access this course');
  }

  const lessonFilter = user.role === 'student' ? { isPublished: true } : {};
  // Students get lesson metadata only — protected content is served per-lesson via
  // GET /lessons/:lessonId/content after authorization (docs/SECURITY.md §5).
  const lessonSelection = user.role === 'student'
    ? 'title order contentType duration isPublished'
    : undefined;
  const lessons = await Lesson.find({ courseId: course._id, ...lessonFilter })
    .sort({ order: 1 })
    .select(lessonSelection)
    .lean();

  return respond(res, {
    data: {
      course: {
        ...toCourseSummary(course),
        description: course.description,
        requirements: course.requirements,
        learningObjectives: course.learningObjectives,
        publishedAt: course.publishedAt,
        mentor: course.mentorId ? { id: course.mentorId._id, name: course.mentorId.name, photo: course.mentorId.photo, bio: course.mentorId.bio } : null,
      },
      lessons,
    },
  });
});

// POST /courses — admin/mentor (PRD §29)
const createCourse = asyncHandler(async (req, res) => {
  const payload = sanitizeCourseContent(req.body);
  const mentorId = req.user.role === 'admin' ? (payload.mentorId || req.user._id) : req.user._id;
  if (req.user.role === 'admin' && payload.mentorId) {
    const mentor = await User.findOne({ _id: payload.mentorId, role: 'mentor', isDeleted: false });
    if (!mentor) throw new ApiError(404, 'Mentor not found');
  }
  const slug = await Course.buildSlug(payload.title);
  const course = await Course.create({ ...payload, slug, mentorId });
  return respond(res, { status: 201, message: 'Course created successfully', data: { course: toCourseSummary(course) } });
});

// PATCH /courses/:id — mentor owner / admin. Slug never auto-changes (docs D-13, PRD §91).
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, isDeleted: false });
  if (!course) throw new ApiError(404, 'Course not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this course');

  const payload = sanitizeCourseContent(req.body);
  if (req.user.role === 'admin' && payload.mentorId) {
    const mentor = await User.findOne({ _id: payload.mentorId, role: 'mentor', isDeleted: false });
    if (!mentor) throw new ApiError(404, 'Mentor not found');
    course.mentorId = mentor._id;
  }
  ['title', 'shortDescription', 'description', 'thumbnail', 'category', 'level', 'language', 'requirements', 'learningObjectives'].forEach((k) => {
    if (payload[k] !== undefined) course[k] = payload[k];
  });
  await course.save();
  return respond(res, { message: 'Course updated', data: { course: toCourseSummary(course) } });
});

// DELETE /courses/:id — soft delete (PRD §68–69: never destructive once it has relations).
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, isDeleted: false });
  if (!course) throw new ApiError(404, 'Course not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this course');
  course.isDeleted = true;
  await course.save({ validateBeforeSave: false });
  return respond(res, { message: 'Course deleted' });
});

// POST /courses/:id/publish
const publishCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, isDeleted: false });
  if (!course) throw new ApiError(404, 'Course not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this course');
  await assertPublishable(course);
  course.status = 'published';
  course.publishedAt = course.publishedAt || new Date();
  await course.save();
  return respond(res, { message: 'Course published successfully', data: { course: toCourseSummary(course) } });
});

// POST /courses/:id/archive — enrollment lama tetap akses (PRD §11.2)
const archiveCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, isDeleted: false });
  if (!course) throw new ApiError(404, 'Course not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this course');
  course.status = 'archived';
  await course.save();
  return respond(res, { message: 'Course archived', data: { course: toCourseSummary(course) } });
});

// GET /courses/mine — student: only assigned courses (UI-UX.md §3) with progress (PRD §10).
const myCourses = asyncHandler(async (req, res) => {
  const Enrollment = require('../models/Enrollment');
  const LessonProgress = require('../models/LessonProgress');
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { studentId: req.user._id, status: { $in: ['active', 'completed'] } };
  const [total, enrollments] = await Promise.all([
    Enrollment.countDocuments(filter),
    Enrollment.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('courseId'),
  ]);

  const progressDocs = await LessonProgress.find({ studentId: req.user._id }).select('lessonId status completedAt startedAt').lean();
  const progressByLesson = new Map(progressDocs.map((p) => [String(p.lessonId), p]));

  const courses = enrollments
    .filter((e) => e.courseId && !e.courseId.isDeleted)
    .map((e) => {
      const c = e.courseId;
      return {
        id: c._id,
        title: c.title,
        slug: c.slug,
        shortDescription: c.shortDescription,
        thumbnail: c.thumbnail,
        category: c.category,
        level: c.level,
        mentorId: c.mentorId,
        totalLessons: c.totalLessons,
        status: e.status,
        progress: e.progress,
        enrollment: { id: e._id, status: e.status, progress: e.progress, completedAt: e.completedAt },
      };
    });

  return respond(res, {
    data: {
      courses,
      lastActivity: progressDocs
        .filter((p) => p.status === 'completed')
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0] || null,
      progressByLesson: Object.fromEntries(progressByLesson),
    },
    meta: buildMeta({ page, limit, total }),
  });
});

// ---------------- Lessons ----------------

// POST /courses/:courseId/lessons
const addLesson = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, isDeleted: false });
  if (!course) throw new ApiError(404, 'Course not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this course');

  const payload = sanitizeLessonContent(req.body);
  const maxOrder = (await Lesson.findOne({ courseId: course._id }).sort({ order: -1 }))?.order || 0;
  const lesson = await Lesson.create({ ...payload, courseId: course._id, order: maxOrder + 1 });
  await syncTotalLessons(course._id);
  return respond(res, { status: 201, message: 'Lesson created', data: { lesson } });
});

const lessonOfCourse = async (lessonId, courseId) => {
  const lesson = await Lesson.findOne({ _id: lessonId, courseId });
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  return lesson;
};

// PATCH /lessons/:id
const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  const course = await Course.findOne({ _id: lesson.courseId, isDeleted: false });
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this course');

  const payload = sanitizeLessonContent(req.body);
  if (payload.textContent !== undefined && lesson.contentType === 'text') lesson.textContent = payload.textContent;
  if (payload.title !== undefined) lesson.title = payload.title;
  if (payload.duration !== undefined) lesson.duration = payload.duration;
  if (payload.isPublished !== undefined) lesson.isPublished = payload.isPublished;
  if (payload.youtubeUrl !== undefined && lesson.contentType === 'video') {
    lesson.youtubeUrl = payload.youtubeUrl;
    lesson.youtubeVideoId = payload.youtubeVideoId;
  }
  await lesson.save();
  return respond(res, { message: 'Lesson updated', data: { lesson } });
});

// DELETE /lessons/:id
const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  const course = await Course.findOne({ _id: lesson.courseId, isDeleted: false });
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this course');
  await lesson.deleteOne();
  await syncTotalLessons(course._id);
  return respond(res, { message: 'Lesson deleted' });
});

// PATCH /courses/:courseId/lessons/reorder
const reorder = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, isDeleted: false });
  if (!course) throw new ApiError(404, 'Course not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this course');
  const lessons = await reorderLessons(course._id, req.body.orders);
  return respond(res, { message: 'Lessons reordered', data: { lessons } });
});

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse, publishCourse, archiveCourse, myCourses, addLesson, updateLesson, deleteLesson, reorder };
