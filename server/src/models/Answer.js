const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// docs/DATA-MODEL.md §12 conventions
answerSchema.index({ questionId: 1, createdAt: 1 });
answerSchema.index({ questionId: 1, isVerified: 1 });

const Answer = mongoose.model('Answer', answerSchema);
module.exports = Answer;
