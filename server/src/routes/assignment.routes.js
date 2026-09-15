const router = require('express').Router();
const {
  createAssignment,
  getAssignmentByLesson,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  uploadAttachments,
  deleteAttachment,
  downloadAssignmentFile,
  listSubmissions,
  getSubmission,
  downloadSubmissionFile,
  gradeSubmission,
  submitAssignment,
} = require('../controllers/assignment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { assignmentFiles } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { z } = require('zod');
const { objectId, createAssignmentSchema, updateAssignmentSchema, assessmentSchema, submitSchema } = require('../schemas/assignment.schemas');

const idParam = z.object({ id: objectId });
const lessonParam = z.object({ lessonId: objectId });
const submissionParam = z.object({ submissionId: objectId });
const fileParam = z.object({ id: objectId, fileId: z.string().max(80) });
const submissionFileParam = z.object({ submissionId: objectId, fileId: z.string().max(80) });

router.use(authenticate);

// Specific paths first (before /:id), params validated as ObjectIds so they never collide.
router.post(
  '/lessons/:lessonId/assignment',
  authorize('admin', 'mentor'),
  validate(lessonParam, 'params'),
  validate(createAssignmentSchema),
  createAssignment
);
router.get('/lessons/:lessonId/assignment', authorize('admin', 'mentor'), validate(lessonParam, 'params'), getAssignmentByLesson);

router.get(
  '/submissions/:submissionId',
  authorize('admin', 'mentor', 'student'),
  validate(submissionParam, 'params'),
  getSubmission
);
router.get(
  '/submissions/:submissionId/files/:fileId',
  authorize('admin', 'mentor', 'student'),
  validate(submissionFileParam, 'params'),
  downloadSubmissionFile
);
router.patch(
  '/submissions/:submissionId/assessment',
  authorize('admin', 'mentor'),
  validate(submissionParam, 'params'),
  validate(assessmentSchema),
  gradeSubmission
);

router.post(
  '/:id/submissions',
  authorize('student'),
  validate(idParam, 'params'),
  assignmentFiles.array('files', 5),
  validate(submitSchema),
  submitAssignment
);
router.get('/:id/submissions', authorize('admin', 'mentor'), validate(idParam, 'params'), listSubmissions);
router.post('/:id/attachments', authorize('admin', 'mentor'), validate(idParam, 'params'), assignmentFiles.array('files', 5), uploadAttachments);
router.delete('/:id/attachments/:fileId', authorize('admin', 'mentor'), validate(fileParam, 'params'), deleteAttachment);
router.get('/:id/files/:fileId', authorize('admin', 'mentor', 'student'), validate(fileParam, 'params'), downloadAssignmentFile);
router.get('/:id', authorize('admin', 'mentor', 'student'), validate(idParam, 'params'), getAssignment);
router.patch('/:id', authorize('admin', 'mentor'), validate(idParam, 'params'), validate(updateAssignmentSchema), updateAssignment);
router.delete('/:id', authorize('admin', 'mentor'), validate(idParam, 'params'), deleteAssignment);

module.exports = router;
