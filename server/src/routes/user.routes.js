const router = require('express').Router();
const { getMe, updateMe } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateMeSchema } = require('../schemas/auth.schemas');

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate(updateMeSchema), updateMe);

module.exports = router;
