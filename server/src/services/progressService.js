const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');

/** Create admin-controlled enrollment. Duplicate student+course -> 409 (PRD §40, §65). */
const createEnrollment = async ({ studentId, courseId, status = 'active', source = 'admin' }) => {
  const student = await User_findStudent(studentId);
  const course = await Course.findOne({ _id: courseId, isDeleted: false });
  if (!course) throw new ApiError(404, 'Course not found');

  const duplicate = await Enrollment.findOne({ studentId, courseId });
  if (duplicate) throw new ApiError(409, 'Student is already enrolled in this course', { studentId, courseId });

  return Enrollment.create({ studentId, courseId, status, source });
};

// small indirection to avoid circular import at module load
const User_findStudent = async (id) => {
  const User = require('../models/User');
  const student = await User.findOne({ _id: id, role: 'student', isDeleted: false });
  if (!student) throw new ApiError(404, 'Student not found');
  return student;
};

/**
 * Recalculate course progress for a student (PRD §18):
 * completed lessons / total lessons × 100. At 100% -> enrollment completed (PRD §20).
 */
const recalcCourseProgress = async (studentId, courseId) => {
  const [totalLessons, completedLessons, enrollment] = await Promise.all([
    Lesson.countDocuments({ courseId }),
    LessonProgress.countDocuments({ studentId, courseId, status: 'completed' }),
    Enrollment.findOne({ studentId, courseId }),
  ]);
  if (!enrollment) return null;

  const percent = totalLessons === 0 ? 0 : Math.floor((completedLessons / totalLessons) * 100);
  enrollment.progress = percent;
  if (percent >= 100 && totalLessons > 0) {
    if (enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }
  } else if (enrollment.status === 'completed') {
    // lessons added after completion -> back to active, keep original completedAt history cleared
    enrollment.status = 'active';
    enrollment.completedAt = null;
  }
  await enrollment.save();
  return { enrollment, totalLessons, completedLessons, progress: enrollment.progress, status: enrollment.status };
};

/** Mark lesson complete (idempotent per docs §24-style uniqueness on student+lesson). */
const completeLesson = async (studentId, lessonId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, 'Lesson not found');

  await activeEnrollmentOr403(studentId, lesson.courseId);

  await LessonProgress.findOneAndUpdate(
    { studentId, lessonId },
    {
      $setOnInsert: { studentId, courseId: lesson.courseId, startedAt: new Date() },
      $set: { status: 'completed', completedAt: new Date() },
    },
    { upsert: true, new: true }
  );

  const stats = await recalcCourseProgress(studentId, lesson.courseId);
  return { enrollment: stats.enrollment, stats };
};

/** Record lesson start (PRD §18 startedAt). No-op if already completed. */
const startLesson = async (studentId, lessonId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  await activeEnrollmentOr403(studentId, lesson.courseId);
  await LessonProgress.updateOne(
    { studentId, lessonId },
    { $setOnInsert: { studentId, courseId: lesson.courseId, status: 'in_progress', startedAt: new Date() } },
    { upsert: true }
  );
  return LessonProgress.findOne({ studentId, lessonId }).lean();
};

/** Access rule (PRD §67): enrollment.status active/completed. */
const activeEnrollmentOr403 = async (studentId, courseId) => {
  const enrollment = await Enrollment.findOne({ studentId, courseId });
  if (!enrollment || !['active', 'completed'].includes(enrollment.status)) {
    throw new ApiError(403, 'You do not have access to this course');
  }
  return enrollment;
};

module.exports = { createEnrollment, recalcCourseProgress, completeLesson, startLesson, activeEnrollmentOr403 };
