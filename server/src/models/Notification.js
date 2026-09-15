const mongoose = require('mongoose');

const TYPES = [
  'COMMUNITY_NEW_QUESTION',
  'COMMUNITY_NEW_ANSWER',
  'COMMUNITY_ANSWER_VERIFIED',
  'ASSIGNMENT_PUBLISHED',
  'ASSIGNMENT_SUBMITTED',
  'ASSIGNMENT_GRADED',
];

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', default: null },
    answerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer', default: null },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Query patterns: list by recipient, unread count, mark-read
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, type: 1, questionId: 1, assignmentId: 1, actorId: 1 }, { unique: true });

const Notification = mongoose.model('Notification', notificationSchema);
Notification.TYPES = TYPES;
module.exports = Notification;
