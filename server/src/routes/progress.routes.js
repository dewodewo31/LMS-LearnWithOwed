const router = require('express').Router();
const { getCourseProgress, start, complete, getLessonContent } = require('../controllers/progress.controller');
const { authenticate } = require('../middleware/auth');
const { lessonContentLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const { objectId } = require('../schemas/enrollment.schemas');
const { z } = require('zod');

const courseParam = z.object({ courseId: objectId });
const lessonParam = z.object({ lessonId: objectId });

router.use(authenticate);
router.get('/courses/:courseId/progress', validate(courseParam, 'params'), getCourseProgress);
router.post('/lessons/:lessonId/start', validate(lessonParam, 'params'), start);
router.post('/lessons/:lessonId/complete', validate(lessonParam, 'params'), complete);
router.get('/lessons/:lessonId/content', lessonContentLimiter, validate(lessonParam, 'params'), getLessonContent);

module.exports = router;
