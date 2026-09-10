const router = require('express').Router();
const {
  listQuestions, createQuestion, getQuestion, updateQuestion, deleteQuestion,
  listAnswers, createAnswer, updateAnswer, deleteAnswer, verifyAnswer, unverifyAnswer,
} = require('../controllers/community.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { communityPostLimiter } = require('../middleware/rateLimit');
const { createQuestionSchema, updateQuestionSchema, createAnswerSchema, updateAnswerSchema } = require('../schemas/community.schemas');
const { objectId } = require('../schemas/enrollment.schemas');
const { z } = require('zod');

const courseParam = z.object({ courseId: objectId });
const idParam = z.object({ id: objectId });

router.use(authenticate);

// Enrollment/ownership enforced inside the controller for every route below.
router.get('/courses/:courseId/questions', validate(courseParam, 'params'), listQuestions);
router.post('/courses/:courseId/questions', communityPostLimiter, validate(courseParam, 'params'), validate(createQuestionSchema), createQuestion);

router.get('/questions/:id', validate(idParam, 'params'), getQuestion);
router.patch('/questions/:id', validate(idParam, 'params'), validate(updateQuestionSchema), updateQuestion);
router.delete('/questions/:id', validate(idParam, 'params'), deleteQuestion);

router.get('/questions/:id/answers', validate(idParam, 'params'), listAnswers);
router.post('/questions/:id/answers', communityPostLimiter, validate(idParam, 'params'), validate(createAnswerSchema), createAnswer);

router.patch('/answers/:id', validate(idParam, 'params'), validate(updateAnswerSchema), updateAnswer);
router.delete('/answers/:id', validate(idParam, 'params'), deleteAnswer);

// Verification is staff-only (mentor owner / admin) — role gate + ownership check in controller.
router.post('/answers/:id/verify', authorize('admin', 'mentor'), validate(idParam, 'params'), verifyAnswer);
router.post('/answers/:id/unverify', authorize('admin', 'mentor'), validate(idParam, 'params'), unverifyAnswer);

module.exports = router;
