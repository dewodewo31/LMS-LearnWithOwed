const router = require('express').Router();
const {
  listCourses, getCourse, createCourse, updateCourse, deleteCourse,
  publishCourse, archiveCourse, myCourses, addLesson, updateLesson, deleteLesson, reorder,
} = require('../controllers/course.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createCourseSchema, updateCourseSchema, createLessonSchema, updateLessonSchema, reorderSchema } = require('../schemas/course.schemas');
const { objectId } = require('../schemas/enrollment.schemas');
const { z } = require('zod');

const courseParam = z.object({ courseId: objectId });
const idParam = z.object({ id: objectId });

router.use(authenticate);

// Student: only assigned courses (UI-UX.md §3)
router.get('/mine', authorize('student'), myCourses);

router.get('/', authorize('admin', 'mentor'), listCourses);
router.post('/', authorize('admin', 'mentor'), validate(createCourseSchema), createCourse);

router.get('/:id', validate(idParam, 'params'), getCourse);
router.patch('/:id', validate(idParam, 'params'), validate(updateCourseSchema), updateCourse);
router.delete('/:id', validate(idParam, 'params'), deleteCourse);
router.post('/:id/publish', validate(idParam, 'params'), publishCourse);
router.post('/:id/archive', validate(idParam, 'params'), archiveCourse);

// Lessons
router.post('/:courseId/lessons', validate(courseParam, 'params'), authorize('admin', 'mentor'), validate(createLessonSchema), addLesson);
router.patch('/:courseId/lessons/reorder', validate(courseParam, 'params'), authorize('admin', 'mentor'), validate(reorderSchema), reorder);

module.exports = router;
module.exports.lessonRoutes = [
  validate(idParam, 'params'),
  authorize('admin', 'mentor'),
  validate(updateLessonSchema),
  updateLesson,
  deleteLesson,
];
