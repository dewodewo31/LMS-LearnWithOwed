const LessonProgress = require('../models/LessonProgress');
const Enrollment = require('../models/Enrollment');

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

const userLookup = {
  $lookup: {
    from: 'users',
    localField: '_id',
    foreignField: '_id',
    as: 'user',
    pipeline: [
      { $match: { isDeleted: false } },
      { $project: { name: 1, photo: 1 } },
    ],
  },
};

const unwindUser = { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } };

const projectFields = {
  $project: {
    _id: 0,
    studentId: '$_id',
    displayName: '$user.name',
    avatar: '$user.photo',
    value: 1,
  },
};

/**
 * GET /api/v1/public/leaderboard/lessons
 * Most Lessons Learned — students ranked by total completed lessons.
 */
const getLessonsLeaderboard = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);

    const results = await LessonProgress.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$studentId', value: { $sum: 1 } } },
      userLookup,
      unwindUser,
      projectFields,
      { $sort: { value: -1, displayName: 1 } },
      { $limit: limit },
    ]);

    const data = results.map((r, i) => ({
      rank: i + 1,
      student: {
        id: r.studentId,
        displayName: r.displayName,
        avatar: r.avatar,
      },
      value: r.value,
    }));

    res.json({ success: true, message: 'Leaderboard retrieved.', data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/public/leaderboard/modules
 * Most Modules Enrolled — students ranked by unique active/completed enrollments.
 */
const getModulesLeaderboard = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);

    const results = await Enrollment.aggregate([
      { $match: { status: { $in: ['active', 'completed'] } } },
      { $group: { _id: '$studentId', value: { $addToSet: '$courseId' } } },
      { $project: { _id: 1, value: { $size: '$value' } } },
      userLookup,
      unwindUser,
      projectFields,
      { $sort: { value: -1, displayName: 1 } },
      { $limit: limit },
    ]);

    const data = results.map((r, i) => ({
      rank: i + 1,
      student: {
        id: r.studentId,
        displayName: r.displayName,
        avatar: r.avatar,
      },
      value: r.value,
    }));

    res.json({ success: true, message: 'Leaderboard retrieved.', data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLessonsLeaderboard, getModulesLeaderboard };
