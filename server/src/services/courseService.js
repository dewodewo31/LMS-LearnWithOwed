const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const ApiError = require('../utils/ApiError');
const sanitize = require('../utils/sanitizeHtml');
const { extractYouTubeId, isValidYouTubeUrl } = require('../utils/youtube');

/** Course publish validation (PRD §12). */
const assertPublishable = async (course) => {
  const lessonCount = await Lesson.countDocuments({ courseId: course._id });
  const problems = [];
  if (!course.title?.trim()) problems.push('Title is required');
  if (!course.description?.trim()) problems.push('Description is required');
  if (!course.thumbnail) problems.push('Thumbnail is required');
  if (lessonCount === 0) problems.push('Course must have at least one lesson');
  if (problems.length) {
    throw new ApiError(422, 'Course cannot be published yet', Object.fromEntries(problems.map((p, i) => [`problem${i}`, p])));
  }
};

const sanitizeCourseContent = (payload = {}) => {
  const next = { ...payload };
  if (next.description !== undefined && next.description !== null) {
    next.description = sanitize(next.description);
  }
  return next;
};

const sanitizeLessonContent = (payload = {}) => {
  const next = { ...payload };
  if (next.textContent !== undefined && next.textContent !== null) {
    next.textContent = sanitize(next.textContent);
  }
  if (next.youtubeUrl !== undefined && next.youtubeUrl !== null) {
    if (next.youtubeUrl === '') {
      next.youtubeUrl = null;
      next.youtubeVideoId = null;
    } else {
      if (!isValidYouTubeUrl(next.youtubeUrl)) {
        throw new ApiError(422, 'Validation failed', { youtubeUrl: 'Must be a valid YouTube URL (watch, youtu.be, embed, shorts)' });
      }
      next.youtubeVideoId = extractYouTubeId(next.youtubeUrl);
    }
  }
  return next;
};

/** Reorder lessons (PRD §16): no duplicate/unintended ordering; validate all belong to the course. */
const reorderLessons = async (courseId, orders) => {
  const lessons = await Lesson.find({ courseId }).select('_id');
  const ownedIds = new Set(lessons.map((l) => String(l._id)));
  const seen = new Set();
  for (const { id, order } of orders) {
    if (!ownedIds.has(id)) throw new ApiError(404, 'Lesson not found in this course');
    if (seen.has(order)) throw new ApiError(422, 'Validation failed', { orders: 'Duplicate order values are not allowed' });
    seen.add(order);
  }
  await Promise.all(orders.map(({ id, order }) => Lesson.updateOne({ _id: id, courseId }, { order })));
  const updated = await Lesson.find({ courseId }).sort({ order: 1 }).lean();
  return updated;
};

const syncTotalLessons = async (courseId) => {
  const totalLessons = await Lesson.countDocuments({ courseId });
  await Course.updateOne({ _id: courseId }, { totalLessons });
  return totalLessons;
};

module.exports = { assertPublishable, sanitizeCourseContent, sanitizeLessonContent, reorderLessons, syncTotalLessons };
