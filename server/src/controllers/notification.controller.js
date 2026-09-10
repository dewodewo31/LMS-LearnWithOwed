const ApiError = require('../utils/ApiError');
const respond = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination } = require('../utils/paginate');
const { listNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../services/notificationService');
const { objectId } = require('../schemas/enrollment.schemas');

// GET /notifications — list own notifications with pagination
const list = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query, { defaults: { page: 1, limit: 20 } });
  const unreadOnly = req.query.unreadOnly === 'true';
  const result = await listNotifications(req.user._id, { page, limit, unreadOnly });
  return respond(res, { data: result.notifications, meta: result.meta });
});

// GET /notifications/unread-count
const unreadCount = asyncHandler(async (req, res) => {
  const count = await getUnreadCount(req.user._id);
  return respond(res, { data: { count } });
});

// PATCH /notifications/:id/read — mark single notification as read (own only)
const markRead = asyncHandler(async (req, res) => {
  const result = await objectId.safeParse(req.params.id);
  if (!result.success) throw new ApiError(404, 'Notification not found');

  const notification = await markAsRead(result.data, req.user._id);
  if (!notification) throw new ApiError(404, 'Notification not found');
  return respond(res, { message: 'Notification marked as read', data: { notification } });
});

// PATCH /notifications/read-all — mark all own notifications as read
const markAllRead = asyncHandler(async (req, res) => {
  const count = await markAllAsRead(req.user._id);
  return respond(res, { message: 'All notifications marked as read', data: { markedCount: count } });
});

module.exports = { list, unreadCount, markRead, markAllRead };
