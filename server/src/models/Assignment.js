const mongoose = require('mongoose');

const STATUSES = ['draft', 'published'];
const GRADES = ['A+', 'A', 'B+', 'B'];

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, maxlength: 255 },
    storedName: { type: String, required: true }, // uuid + allowlisted ext — path-traversal safe
    mimeType: { type: String, required: true, maxlength: 100 },
    size: { type: Number, required: true, min: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const criterionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // denormalized for authz
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    instructions: { type: String, default: '', maxlength: 100000 }, // sanitized HTML
    deadline: { type: Date, default: null },
    attachments: { type: [attachmentSchema], default: [] },
    assessmentCriteria: { type: [criterionSchema], default: [] },
    status: { type: String, enum: STATUSES, default: 'draft' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

assignmentSchema.index({ lessonId: 1 }, { unique: true });
assignmentSchema.index({ courseId: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
Assignment.STATUSES = STATUSES;
Assignment.GRADES = GRADES;
module.exports = Assignment;
