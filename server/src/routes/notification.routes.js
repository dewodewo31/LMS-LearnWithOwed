const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { list, unreadCount, markRead, markAllRead } = require('../controllers/notification.controller');

router.use(authenticate);

router.get('/notifications', list);
router.get('/notifications/unread-count', unreadCount);
router.patch('/notifications/read-all', markAllRead);
router.patch('/notifications/:id/read', markRead);

module.exports = router;
