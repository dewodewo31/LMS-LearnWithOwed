const router = require('express').Router();
const { listEnrollments, create, update, remove } = require('../controllers/enrollment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createEnrollmentSchema, updateEnrollmentSchema, objectId } = require('../schemas/enrollment.schemas');
const { z } = require('zod');

const idParam = z.object({ id: objectId });

router.use(authenticate);
router.get('/', authorize('admin', 'mentor'), listEnrollments);
// Critical rule: enrollment is admin-controlled. Students never self-enroll.
router.post('/', authorize('admin'), validate(createEnrollmentSchema), create);
router.patch('/:id', authorize('admin'), validate(idParam, 'params'), validate(updateEnrollmentSchema), update);
router.delete('/:id', authorize('admin'), validate(idParam, 'params'), remove);

module.exports = router;
