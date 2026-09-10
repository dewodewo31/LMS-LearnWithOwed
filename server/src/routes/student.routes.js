const router = require('express').Router();
const { listStudents, getStudent, createStudent, updateStudent, deleteStudent } = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createStudentSchema, updateStudentSchema } = require('../schemas/auth.schemas');
const { objectId } = require('../schemas/enrollment.schemas');
const { z } = require('zod');

const idParam = z.object({ id: objectId });

router.use(authenticate);
router.get('/', authorize('admin', 'mentor'), listStudents);
router.post('/', authorize('admin'), validate(createStudentSchema), createStudent);
router.get('/:id', authorize('admin', 'mentor'), validate(idParam, 'params'), getStudent);
router.patch('/:id', authorize('admin'), validate(idParam, 'params'), validate(updateStudentSchema), updateStudent);
router.delete('/:id', authorize('admin'), validate(idParam, 'params'), deleteStudent);

module.exports = router;
