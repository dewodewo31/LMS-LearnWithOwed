const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const Lesson = require('../models/Lesson');
const respond = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');

/** GET /dashboard — role-appropriate overview (PRD §8–10). No payment metrics (admin-controlled model). */
const getDashboard = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role === 'admin') {
    const [users, students, mentors, courses, publishedCourses, enrollments, completedEnrollments, recentStudents, recentCourses, recentEnrollments] =
      await Promise.all([
        User.countDocuments({ isDeleted: false }),
        User.countDocuments({ role: 'student', isDeleted: false }),
        User.countDocuments({ role: 'mentor', isDeleted: false }),
        Course.countDocuments({ isDeleted: false }),
        Course.countDocuments({ isDeleted: false, status: 'published' }),
        Enrollment.countDocuments({}),
        Enrollment.countDocuments({ status: 'completed' }),
        User.find({ role: 'student', isDeleted: false }).sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
        Course.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).select('title status createdAt mentorId').populate('mentorId', 'name'),
        Enrollment.find({}).sort({ createdAt: -1 }).limit(5).populate('studentId', 'name').populate('courseId', 'title'),
      ]);

    const activeEnrollments = await Enrollment.countDocuments({ status: 'active' });

    return respond(res, {
      data: {
        role: 'admin',
        stats: {
          totalUsers: users,
          totalStudents: students,
          totalMentors: mentors,
          totalCourses: courses,
          publishedCourses,
          activeEnrollments,
          completedEnrollments,
        },
        recent: {
          students: recentStudents,
          courses: recentCourses,
          enrollments: recentEnrollments.map((e) => ({
            id: e._id,
            student: e.studentId?.name || null,
            course: e.courseId?.title || null,
            status: e.status,
            createdAt: e.createdAt,
          })),
        },
      },
    });
  }

  if (user.role === 'mentor') {
    const courseIds = (await Course.find({ mentorId: user._id, isDeleted: false }).select('_id')).map((c) => c._id);
    const [totalCourses, publishedCourses, totalEnrollments, completedEnrollments, activeEnrollments, recentEnrollments, recentCourses] =
      await Promise.all([
        Course.countDocuments({ mentorId: user._id, isDeleted: false }),
        Course.countDocuments({ mentorId: user._id, isDeleted: false, status: 'published' }),
        Enrollment.countDocuments({ courseId: { $in: courseIds } }),
        Enrollment.countDocuments({ courseId: { $in: courseIds }, status: 'completed' }),
        Enrollment.countDocuments({ courseId: { $in: courseIds }, status: 'active' }),
        Enrollment.find({ courseId: { $in: courseIds } }).sort({ createdAt: -1 }).limit(5).populate('studentId', 'name').populate('courseId', 'title'),
        Course.find({ mentorId: user._id, isDeleted: false }).sort({ createdAt: -1 }).limit(5).select('title status totalLessons'),
      ]);

    const avgProgress = totalEnrollments
      ? Math.round((await Enrollment.aggregate([{ $match: { courseId: { $in: courseIds } } }, { $group: { _id: null, avg: { $avg: '$progress' } } }]))[0]?.avg || 0)
      : 0;

    return respond(res, {
      data: {
        role: 'mentor',
        stats: { totalCourses, publishedCourses, totalEnrollments, activeEnrollments, completedEnrollments, avgProgress },
        recent: {
          enrollments: recentEnrollments.map((e) => ({
            id: e._id,
            student: e.studentId?.name || null,
            course: e.courseId?.title || null,
            status: e.status,
            createdAt: e.createdAt,
          })),
          courses: recentCourses,
        },
      },
    });
  }

  // student
  const enrollments = await Enrollment.find({ studentId: user._id, status: { $in: ['active', 'completed'] } })
    .sort({ updatedAt: -1 })
    .populate('courseId', 'title thumbnail totalLessons category level');

  const courseIds = enrollments.map((e) => e.courseId?._id).filter(Boolean);
  const progressDocs = await LessonProgress.find({ studentId: user._id, courseId: { $in: courseIds }, status: 'completed' })
    .sort({ completedAt: -1 })
    .populate('lessonId', 'title')
    .populate('courseId', 'title');

  const completedCourses = enrollments.filter((e) => e.status === 'completed').length;
  const avgProgress = enrollments.length ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length) : 0;

  // Continue learning: enrollment in progress with highest updatedAt (PRD §10)
  const inProgress = enrollments.filter((e) => e.status === 'active' && e.progress > 0);
  const continueLearningEnrollment = inProgress[0] || enrollments.find((e) => e.status === 'active') || null;
  let continueLearning = null;
  if (continueLearningEnrollment?.courseId) {
    const completed = await LessonProgress.countDocuments({ studentId: user._id, courseId: continueLearningEnrollment.courseId._id, status: 'completed' });
    continueLearning = {
      courseId: continueLearningEnrollment.courseId._id,
      title: continueLearningEnrollment.courseId.title,
      thumbnail: continueLearningEnrollment.courseId.thumbnail,
      progress: continueLearningEnrollment.progress,
      totalLessons: continueLearningEnrollment.courseId.totalLessons,
      completedLessons: completed,
      nextLessonIndex: completed + 1,
    };
  }

  return respond(res, {
    data: {
      role: 'student',
      stats: {
        myCourses: enrollments.length,
        completedCourses,
        avgProgress,
      },
      continueLearning,
      courses: enrollments
        .filter((e) => e.courseId)
        .map((e) => ({
          id: e.courseId._id,
          title: e.courseId.title,
          thumbnail: e.courseId.thumbnail,
          category: e.courseId.category,
          level: e.courseId.level,
          totalLessons: e.courseId.totalLessons,
          status: e.status,
          progress: e.progress,
        })),
      recentActivity: progressDocs.slice(0, 5).map((p) => ({
        lesson: p.lessonId?.title || null,
        course: p.courseId?.title || null,
        courseId: p.courseId?._id || null,
        completedAt: p.completedAt,
      })),
    },
  });
});

module.exports = { getDashboard };
