const mongoose = require('mongoose');
const { attachmentSchema } = require('./Assignment');

const STATUSES = ['submitted', 'reviewed', 'returned'];

const assessmentSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    criteria: [
      new mongoose.Schema(
        {
          name: { type: String, required: true, maxlength: 100 },
          grade: { type: String, required: true, maxlength: 5 },
          feedback: { type: String, default: '', maxlength: 2000 },
        },
        { _id: false }
      ),
    ],
    overallFeedback: { type: String, default: '', maxlength: 2000 },
    gradedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // denormalized for authz
    version: { type: Number, default: 1, min: 1 },
    attachments: { type: [attachmentSchema], default: [] },
    note: { type: String, default: '', maxlength: 2000 },
    status: { type: String, enum: STATUSES, default: 'submitted' },
    isLate: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
    // Previous versions (resubmits) — snapshot incl. the assessment that applied to them.
    history: {
      type: [
        new mongoose.Schema(
          {
            version: { type: Number, required: true },
            attachments: { type: [attachmentSchema], default: [] },
            note: { type: String, default: '', maxlength: 2000 },
            submittedAt: { type: Date, required: true },
            isLate: { type: Boolean, default: false },
            status: { type: String, default: 'submitted' },
            assessment: { type: assessmentSchema, default: null },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    assessment: { type: assessmentSchema, default: null },
  },
  { timestamps: true }
);

// One live submission per student per assignment; resubmits bump version.
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ assignmentId: 1, status: 1 });

const AssignmentSubmission = mongoose.model('AssignmentSubmission', submissionSchema);
AssignmentSubmission.STATUSES = STATUSES;
module.exports = AssignmentSubmission;
