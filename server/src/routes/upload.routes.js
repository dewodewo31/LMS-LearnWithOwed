const router = require('express').Router();
const { uploadImage } = require('../controllers/upload.controller');
const { uploadCommunityMedia, deleteUnclaimedAttachment } = require('../controllers/community.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { communityMediaLimiter } = require('../middleware/rateLimit');
const { objectId } = require('../schemas/enrollment.schemas');
const validate = require('../middleware/validate');
const { z } = require('zod');

router.post('/image', authenticate, authorize('admin', 'mentor'), uploadImage);

// Community media (questions/answers attachments): any authenticated user —
// claim-time ownership + enrollment checks are the real boundary.
router.post('/community', authenticate, communityMediaLimiter, uploadCommunityMedia);
router.delete('/community/:id', authenticate, validate(z.object({ id: objectId }), 'params'), deleteUnclaimedAttachment);

module.exports = router;
