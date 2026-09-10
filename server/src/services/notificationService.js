const Notification = require('../models/Notification');
const Course = require('../models/Course');
const User = require('../models/User');

/**
 * Create a notification with deduplication.
 * Dedup key: recipientId + type + questionId + actorId (same actor, same question, same type).
 * Skips self-notifications (actor === recipient).
 */
const createNotification = async ({ recipientId, actorId, type, title, message, courseId, questionId, answerId }) => {
  // Never notify yourself
  if (String(recipientId) === String(actorId)) return null;

  // Validate recipient exists
  const recipient = await User.findOne({ _id: recipientId, isDeleted: false });
  if (!recipient) return null;

  // Validate course exists
  const course = await Course.findOne({ _id: courseId, isDeleted: false });
  if (!course) return null;

  // Dedup: same recipient + type + questionId + actorId within same question context
  const filter = { recipientId, type, actorId };
  if (questionId) filter.questionId = questionId;

  const existing = await Notification.findOne(filter);
  if (existing) return existing;

  return Notification.create({
    recipientId,
    actorId,
    type,
    title,
    message,
    courseId,
    questionId: questionId || null,
    answerId: answerId || null,
  });
};

/** List notifications for a user with pagination. */
const listNotifications = async (recipientId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const filter = { recipientId };
  if (unreadOnly) filter.isRead = false;

  const skip = (page - 1) * limit;
  const [total, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name photo role')
      .populate('courseId', 'title')
      .lean(),
  ]);

  return {
    notifications: notifications.map(serialize),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

/** Get unread count for a user. */
const getUnreadCount = async (recipientId) => {
  const count = await Notification.countDocuments({ recipientId, isRead: false });
  return count;
};

/** Mark a single notification as read. Validates ownership. */
const markAsRead = async (notificationId, recipientId) => {
  const notification = await Notification.findOne({ _id: notificationId, recipientId });
  if (!notification) return null;
  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }
  return serialize(notification);
};

/** Mark all notifications as read for a user. */
const markAllAsRead = async (recipientId) => {
  const result = await Notification.updateMany(
    { recipientId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return result.modifiedCount;
};

/** Serialize notification for API response. */
const serialize = (n) => ({
  id: n._id,
  type: n.type,
  title: n.title,
  message: n.message,
  courseId: n.courseId?._id || n.courseId,
  courseName: n.courseId?.title || null,
  questionId: n.questionId,
  answerId: n.answerId,
  actor: n.actorId
    ? { id: n.actorId._id, name: n.actorId.name, photo: n.actorId.photo, role: n.actorId.role }
    : null,
  isRead: n.isRead,
  readAt: n.readAt,
  createdAt: n.createdAt,
});

module.exports = { createNotification, listNotifications, getUnreadCount, markAsRead, markAllAsRead, serialize };
