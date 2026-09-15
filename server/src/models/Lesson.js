const mongoose = require('mongoose');

const CONTENT_TYPES = ['text', 'video', 'assignment'];

const lessonSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    contentType: { type: String, enum: CONTENT_TYPES, required: true },
    textContent: { type: String, default: null, maxlength: 200000 }, // sanitized HTML
    youtubeUrl: { type: String, default: null },
    youtubeVideoId: { type: String, default: null },
    duration: { type: Number, default: null, min: 0 }, // minutes, optional
    order: { type: Number, required: true, min: 1 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// docs/DATA-MODEL.md §12
lessonSchema.index({ courseId: 1 });
lessonSchema.index({ courseId: 1, order: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);
Lesson.CONTENT_TYPES = CONTENT_TYPES;
module.exports = Lesson;
