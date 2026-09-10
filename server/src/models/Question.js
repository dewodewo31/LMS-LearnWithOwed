const mongoose = require('mongoose');

const STATUSES = ['active', 'resolved', 'closed'];

// Course-scoped Q&A (community). Body is plain text — rendered escaped by the
// client (React), so no HTML ever enters the pipeline (docs/SECURITY.md §5).
const questionSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 150 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: STATUSES, default: 'active' },
    verifiedAnswerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer', default: null },
  },
  { timestamps: true }
);

// docs/DATA-MODEL.md §12 conventions
questionSchema.index({ courseId: 1, createdAt: -1 });
questionSchema.index({ authorId: 1 });

const Question = mongoose.model('Question', questionSchema);
Question.STATUSES = STATUSES;
module.exports = Question;
