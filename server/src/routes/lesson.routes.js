const router = require('express').Router();
const { updateLesson, deleteLesson } = require('../controllers/course.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateLessonSchema } = require('../schemas/course.schemas');
const { objectId } = require('../schemas/enrollment.schemas');
const { z } = require('zod');

const idParam = z.object({ id: objectId });

// PATCH /lessons/:id, DELETE /lessons/:id (docs/API.md §5.3)
router.patch('/:id', authenticate, authorize('admin', 'mentor'), validate(idParam, 'params'), validate(updateLessonSchema), updateLesson);
router.delete('/:id', authenticate, authorize('admin', 'mentor'), validate(idParam, 'params'), deleteLesson);

module.exports = router;
