const mongoose = require('mongoose');

const STATUSES = ['in_progress', 'completed'];

const lessonProgressSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    status: { type: String, enum: STATUSES, default: 'in_progress' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// docs/DATA-MODEL.md §12 — uniqueness prevents duplicate lesson progress (PRD §40)
lessonProgressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.index({ studentId: 1, courseId: 1 });

const LessonProgress = mongoose.model('LessonProgress', lessonProgressSchema);
module.exports = LessonProgress;
