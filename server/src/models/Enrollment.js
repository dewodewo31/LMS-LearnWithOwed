const mongoose = require('mongoose');

const SOURCES = ['purchase', 'admin', 'mentor', 'manual', 'promotion'];
const STATUSES = ['pending', 'active', 'completed', 'revoked', 'expired'];

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    source: { type: String, enum: SOURCES, default: 'admin' },
    status: { type: String, enum: STATUSES, default: 'active' },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

// docs/DATA-MODEL.md §12 — uniqueness prevents duplicate enrollment (PRD §40)
enrollmentSchema.index({ studentId: 1 });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
Enrollment.SOURCES = SOURCES;
Enrollment.STATUSES = STATUSES;
module.exports = Enrollment;
