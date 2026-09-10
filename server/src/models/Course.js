const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const STATUSES = ['draft', 'published', 'archived'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    shortDescription: { type: String, default: '', maxlength: 300 },
    description: { type: String, default: '', maxlength: 100000 }, // sanitized HTML
    thumbnail: { type: String, default: null },
    category: { type: String, default: null, trim: true, maxlength: 60 },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Legacy schema parity only — enrollment is admin-controlled, price is never used in UI/UX.
    price: { type: Number, default: 0, min: 0 },
    level: { type: String, enum: LEVELS, required: true },
    language: { type: String, default: 'id', maxlength: 10 },
    status: { type: String, enum: STATUSES, default: 'draft' },
    requirements: { type: [String], default: [] },
    learningObjectives: { type: [String], default: [] },
    totalLessons: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// docs/DATA-MODEL.md §12 (unique: true on slug field)
courseSchema.index({ mentorId: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ category: 1 });

courseSchema.statics.buildSlug = async function buildSlug(title, excludeId) {
  const base = slugify(title) || 'course';
  let slug = base;
  let i = 1;
  // Loop until free (duplicate slug -> 409 by docs §40).
  // eslint-disable-next-line no-await-in-loop
  while (await this.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
};

const Course = mongoose.model('Course', courseSchema);
Course.STATUSES = STATUSES;
Course.LEVELS = LEVELS;
module.exports = Course;
