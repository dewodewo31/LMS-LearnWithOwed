const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const respond = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');
const { canManageCourse } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');
const sanitize = require('../utils/sanitizeHtml');
const config = require('../config/env');

const STORED_NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/;

const storageDir = () => path.resolve(config.assignmentUploadPath);

const loadAssignment = async (id) => {
  const assignment = await Assignment.findOne({ _id: id, isDeleted: false });
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  return assignment;
};

const activeEnrollmentOr403 = async (studentId, courseId) => {
  const enrollment = await Enrollment.findOne({ studentId, courseId, status: { $in: ['active', 'completed'] } });
  if (!enrollment) throw new ApiError(403, 'You are not enrolled in this course');
  return enrollment;
};

const serializeAttachment = (a, fileUrl) => ({
  id: a.storedName,
  originalName: a.originalName,
  mimeType: a.mimeType,
  size: a.size,
  uploadedAt: a.uploadedAt,
  url: fileUrl,
});

const assignmentFileUrl = (assignmentId, storedName) => `/api/v1/assignments/${assignmentId}/files/${storedName}`;
const submissionFileUrl = (assignmentId, submissionId, storedName) =>
  `/api/v1/assignments/${assignmentId}/submissions/${submissionId}/files/${storedName}`;

const serializeSubmission = (sub) => ({
  id: sub._id,
  assignmentId: sub.assignmentId,
  version: sub.version,
  status: sub.status,
  isLate: sub.isLate,
  submittedAt: sub.submittedAt,
  note: sub.note,
  attachments: sub.attachments.map((a) => serializeAttachment(a, submissionFileUrl(sub.assignmentId, sub._id, a.storedName))),
  assessment: sub.assessment
    ? {
        criteria: sub.assessment.criteria,
        overallFeedback: sub.assessment.overallFeedback,
        gradedAt: sub.assessment.gradedAt,
        teacherId: sub.assessment.teacherId,
      }
    : null,
  history: (sub.history || []).map((h) => ({
    version: h.version,
    status: h.status,
    isLate: h.isLate,
    submittedAt: h.submittedAt,
    note: h.note,
    attachments: h.attachments.map((a) => serializeAttachment(a, submissionFileUrl(sub.assignmentId, sub._id, a.storedName))),
    assessment: h.assessment || null,
  })),
});

const serializeAssignment = (a, { includeStaffFields = false } = {}) => {
  const base = {
    id: a._id,
    lessonId: a.lessonId,
    courseId: a.courseId,
    title: a.title,
    instructions: a.instructions,
    deadline: a.deadline,
    status: a.status,
    assessmentCriteria: a.assessmentCriteria,
    attachments: a.attachments.map((at) => serializeAttachment(at, assignmentFileUrl(a._id, at.storedName))),
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
  return includeStaffFields ? { ...base, createdBy: a.createdBy } : base;
};

const downloadFile = async (res, storedName, originalName) => {
  if (!STORED_NAME_RE.test(storedName)) throw new ApiError(404, 'File not found');
  const filePath = path.join(storageDir(), storedName);
  try {
    await fs.access(filePath);
  } catch {
    throw new ApiError(404, 'File not found');
  }
  return res.download(filePath, originalName);
};

async function saveUploads(files) {
  const dir = storageDir();
  await fs.mkdir(dir, { recursive: true });
  return Promise.all(
    files.map(async (file) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const storedName = `${crypto.randomUUID()}${ext}`;
      await fs.writeFile(path.join(dir, storedName), file.buffer);
      return {
        originalName: file.originalname.slice(0, 255),
        storedName,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      };
    })
  );
}

async function removeStoredFile(storedName) {
  if (!STORED_NAME_RE.test(storedName)) return;
  await fs.rm(path.join(storageDir(), storedName), { force: true });
}

// ---------------- Teacher: assignment CRUD ----------------

// POST /assignments/lessons/:lessonId/assignment
const createAssignment = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  if (lesson.contentType !== 'assignment') {
    throw new ApiError(422, 'Validation failed', { lessonId: 'Assignment can only be created for assignment-type lessons' });
  }
  const course = await Course.findOne({ _id: lesson.courseId, isDeleted: false });
  if (!course) throw new ApiError(404, 'Course not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this course');

  const existing = await Assignment.findOne({ lessonId: lesson._id, isDeleted: false });
  if (existing) throw new ApiError(409, 'This lesson already has an assignment');

  const { title, instructions, deadline, assessmentCriteria } = req.body;
  const assignment = await Assignment.create({
    lessonId: lesson._id,
    courseId: course._id,
    title,
    instructions: sanitize(instructions || ''),
    deadline: deadline ? new Date(deadline) : null,
    assessmentCriteria,
    createdBy: req.user._id,
  });
  return respond(res, { status: 201, message: 'Assignment created', data: { assignment: serializeAssignment(assignment, { includeStaffFields: true }) } });
});

// GET /assignments/lessons/:lessonId/assignment — teacher editor lookup
const getAssignmentByLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  const course = await Course.findOne({ _id: lesson.courseId, isDeleted: false });
  if (!course) throw new ApiError(404, 'Lesson not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to access this course');

  const assignment = await Assignment.findOne({ lessonId: lesson._id, isDeleted: false });
  return respond(res, { data: { assignment: assignment ? serializeAssignment(assignment, { includeStaffFields: true }) : null } });
});

// GET /assignments/:id — student (enrolled) or staff (manage rights)
const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.courseId).populate('mentorId', 'name photo');
  if (!course) throw new ApiError(404, 'Assignment not found');

  const lesson = await Lesson.findById(assignment.lessonId).select('title isPublished order');
  const isStaff = canManageCourse(req.user, course);

  if (!isStaff) {
    if (req.user.role !== 'student') throw new ApiError(403, 'You do not have permission to access this assignment');
    if (assignment.status !== 'published' || !lesson?.isPublished) throw new ApiError(404, 'Assignment not found');
    await activeEnrollmentOr403(req.user._id, assignment.courseId);
  }

  let mySubmission = null;
  if (!isStaff) {
    const sub = await AssignmentSubmission.findOne({ assignmentId: assignment._id, studentId: req.user._id });
    mySubmission = sub ? serializeSubmission(sub) : null;
  }

  return respond(res, {
    data: {
      assignment: {
        ...serializeAssignment(assignment, { includeStaffFields: isStaff }),
        courseTitle: course.title,
        lessonTitle: lesson?.title || null,
        lessonOrder: lesson?.order || null,
        mentor: course.mentorId ? { id: course.mentorId._id, name: course.mentorId.name } : null,
      },
      mySubmission,
    },
  });
});

// PATCH /assignments/:id
const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.courseId);
  if (!course) throw new ApiError(404, 'Assignment not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this assignment');

  const { title, instructions, deadline, assessmentCriteria, status } = req.body;
  const wasDraft = assignment.status === 'draft';

  if (title !== undefined) assignment.title = title;
  if (instructions !== undefined) assignment.instructions = sanitize(instructions);
  if (deadline !== undefined) assignment.deadline = deadline === null || deadline === '' ? null : new Date(deadline);
  if (assessmentCriteria !== undefined) assignment.assessmentCriteria = assessmentCriteria;
  if (status !== undefined) assignment.status = status;
  await assignment.save();

  if (wasDraft && assignment.status === 'published') {
    const enrollments = await Enrollment.find({ courseId: course._id, status: { $in: ['active', 'completed'] } }).select('studentId');
    await Promise.allSettled(
      enrollments.map((e) =>
        createNotification({
          recipientId: e.studentId,
          actorId: req.user._id,
          type: 'ASSIGNMENT_PUBLISHED',
          title: 'Tugas baru tersedia',
          message: `Tugas baru: ${assignment.title}`,
          courseId: course._id,
          assignmentId: assignment._id,
        })
      )
    );
  }

  return respond(res, { message: 'Assignment updated', data: { assignment: serializeAssignment(assignment, { includeStaffFields: true }) } });
});

// DELETE /assignments/:id — soft delete (keeps submissions for audit)
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.courseId);
  if (!course) throw new ApiError(404, 'Assignment not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this assignment');
  assignment.isDeleted = true;
  await assignment.save({ validateBeforeSave: false });
  return respond(res, { message: 'Assignment deleted' });
});

// POST /assignments/:id/attachments (multipart: files[])
const uploadAttachments = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.courseId);
  if (!course) throw new ApiError(404, 'Assignment not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this assignment');
  if (!req.files?.length) throw new ApiError(400, 'No file uploaded');
  if (assignment.attachments.length + req.files.length > 10) {
    throw new ApiError(422, 'Validation failed', { attachments: 'Maximum 10 attachments per assignment' });
  }

  const saved = await saveUploads(req.files);
  assignment.attachments.push(...saved);
  await assignment.save();
  return respond(res, {
    status: 201,
    message: 'Files uploaded',
    data: { attachments: saved.map((a) => serializeAttachment(a, assignmentFileUrl(assignment._id, a.storedName))) },
  });
});

// DELETE /assignments/:id/attachments/:fileId
const deleteAttachment = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.courseId);
  if (!course) throw new ApiError(404, 'Assignment not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to modify this assignment');

  const idx = assignment.attachments.findIndex((a) => a.storedName === req.params.fileId);
  if (idx === -1) throw new ApiError(404, 'Attachment not found');
  const [removed] = assignment.attachments.splice(idx, 1);
  await assignment.save();
  await removeStoredFile(removed.storedName);
  return respond(res, { message: 'Attachment removed' });
});

// GET /assignments/:id/files/:fileId — teacher files: enrolled student or staff
const downloadAssignmentFile = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.courseId);
  if (!course) throw new ApiError(404, 'Assignment not found');

  const isStaff = canManageCourse(req.user, course);
  if (!isStaff) {
    if (assignment.status !== 'published') throw new ApiError(404, 'File not found');
    await activeEnrollmentOr403(req.user._id, assignment.courseId);
  }

  const attachment = assignment.attachments.find((a) => a.storedName === req.params.fileId);
  if (!attachment) throw new ApiError(404, 'File not found');
  return downloadFile(res, attachment.storedName, attachment.originalName);
});

// ---------------- Teacher: submissions ----------------

// GET /assignments/:id/submissions — roster (enrolled students) + latest submission each
const listSubmissions = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.courseId);
  if (!course) throw new ApiError(404, 'Assignment not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to view these submissions');

  const [enrollments, submissions] = await Promise.all([
    Enrollment.find({ courseId: course._id, status: { $in: ['active', 'completed'] } })
      .populate('studentId', 'name photo')
      .select('studentId'),
    AssignmentSubmission.find({ assignmentId: assignment._id }).lean(),
  ]);

  const byStudent = new Map(submissions.map((s) => [String(s.studentId), s]));
  const rows = enrollments
    .filter((e) => e.studentId)
    .map((e) => {
      const s = byStudent.get(String(e.studentId._id));
      return {
        student: { id: e.studentId._id, name: e.studentId.name, photo: e.studentId.photo },
        submission: s
          ? {
              id: s._id,
              version: s.version,
              status: s.status,
              isLate: s.isLate,
              submittedAt: s.submittedAt,
              attachments: s.attachments.map((a) => serializeAttachment(a, submissionFileUrl(assignment._id, s._id, a.storedName))),
              assessment: s.assessment
                ? { criteria: s.assessment.criteria, overallFeedback: s.assessment.overallFeedback, gradedAt: s.assessment.gradedAt }
                : null,
            }
          : null,
      };
    });

  return respond(res, { data: { submissions: rows } });
});

// GET /assignments/submissions/:submissionId — owner student or staff
const getSubmission = asyncHandler(async (req, res) => {
  const submission = await AssignmentSubmission.findById(req.params.submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found');
  const assignment = await loadAssignment(submission.assignmentId);
  const course = await Course.findById(assignment.courseId);
  if (!course) throw new ApiError(404, 'Submission not found');

  const isStaff = canManageCourse(req.user, course);
  const isOwner = String(submission.studentId) === String(req.user._id);
  if (!isStaff && !isOwner) throw new ApiError(403, 'You do not have permission to view this submission');

  const student = isStaff
    ? (await User.findById(submission.studentId).select('name photo')) ?? null
    : null;

  return respond(res, {
    data: {
      submission: serializeSubmission(submission),
      student: student ? { id: student._id, name: student.name, photo: student.photo } : null,
      assignment: serializeAssignment(assignment, { includeStaffFields: isStaff }),
    },
  });
});

// GET /assignments/submissions/:submissionId/files/:fileId — owner student or staff
const downloadSubmissionFile = asyncHandler(async (req, res) => {
  const submission = await AssignmentSubmission.findById(req.params.submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found');
  const assignment = await loadAssignment(submission.assignmentId);
  const course = await Course.findById(assignment.courseId);
  if (!course) throw new ApiError(404, 'Submission not found');

  const isStaff = canManageCourse(req.user, course);
  const isOwner = String(submission.studentId) === String(req.user._id);
  if (!isStaff && !isOwner) throw new ApiError(403, 'You do not have permission to download this file');

  const allAttachments = [...submission.attachments, ...(submission.history || []).flatMap((h) => h.attachments)];
  const attachment = allAttachments.find((a) => a.storedName === req.params.fileId);
  if (!attachment) throw new ApiError(404, 'File not found');
  return downloadFile(res, attachment.storedName, attachment.originalName);
});

// PATCH /assignments/submissions/:submissionId/assessment — grade + feedback
const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await AssignmentSubmission.findById(req.params.submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found');
  const assignment = await loadAssignment(submission.assignmentId);
  const course = await Course.findById(assignment.courseId);
  if (!course) throw new ApiError(404, 'Submission not found');
  if (!canManageCourse(req.user, course)) throw new ApiError(403, 'You do not have permission to grade this submission');

  const requiredNames = assignment.assessmentCriteria.map((c) => c.name);
  const providedNames = req.body.criteria.map((c) => c.name);
  const missing = requiredNames.filter((n) => !providedNames.includes(n));
  const extra = providedNames.filter((n) => !requiredNames.includes(n));
  if (missing.length || extra.length) {
    throw new ApiError(422, 'Validation failed', {
      criteria: `Grades must cover exactly the assignment criteria.${missing.length ? ` Missing: ${missing.join(', ')}.` : ''}${extra.length ? ` Unknown: ${extra.join(', ')}.` : ''}`,
    });
  }

  submission.assessment = {
    teacherId: req.user._id,
    criteria: req.body.criteria,
    overallFeedback: req.body.overallFeedback || '',
    gradedAt: new Date(),
  };
  submission.status = 'reviewed';
  await submission.save();

  await createNotification({
    recipientId: submission.studentId,
    actorId: req.user._id,
    type: 'ASSIGNMENT_GRADED',
    title: 'Tugas kamu telah dinilai',
    message: `Tugas "${assignment.title}" telah direview`,
    courseId: course._id,
    assignmentId: assignment._id,
  });

  return respond(res, { message: 'Assessment saved', data: { submission: serializeSubmission(submission) } });
});

// ---------------- Student: submit ----------------

// POST /assignments/:id/submissions (multipart: files[] + note) — creates or bumps version
const submitAssignment = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') throw new ApiError(403, 'Only students can submit assignments');

  const assignment = await loadAssignment(req.params.id);
  const course = await Course.findById(assignment.courseId);
  if (!course) throw new ApiError(404, 'Assignment not found');
  if (assignment.status !== 'published') throw new ApiError(404, 'Assignment not found');
  await activeEnrollmentOr403(req.user._id, assignment.courseId);

  if (!req.files?.length) throw new ApiError(422, 'Validation failed', { files: 'At least one file is required' });

  const existing = await AssignmentSubmission.findOne({ assignmentId: assignment._id, studentId: req.user._id });
  const isLate = Boolean(assignment.deadline && new Date() > assignment.deadline);

  let submission;
  if (existing) {
    // Resubmit: snapshot current version (incl. its assessment) into history, then bump.
    existing.history.push({
      version: existing.version,
      attachments: existing.attachments,
      note: existing.note,
      submittedAt: existing.submittedAt,
      isLate: existing.isLate,
      status: existing.status,
      assessment: existing.assessment,
    });
    existing.version += 1;
    existing.attachments = await saveUploads(req.files);
    existing.note = req.body.note || '';
    existing.status = 'submitted';
    existing.isLate = isLate;
    existing.submittedAt = new Date();
    existing.assessment = null;
    submission = existing;
  } else {
    submission = await AssignmentSubmission.create({
      assignmentId: assignment._id,
      studentId: req.user._id,
      courseId: course._id,
      attachments: await saveUploads(req.files),
      note: req.body.note || '',
      isLate,
      submittedAt: new Date(),
    });
  }
  await submission.save();

  await createNotification({
    recipientId: course.mentorId,
    actorId: req.user._id,
    type: 'ASSIGNMENT_SUBMITTED',
    title: 'Submission baru',
    message: `${req.user.name} mengumpulkan: ${assignment.title}`,
    courseId: course._id,
    assignmentId: assignment._id,
  });

  return respond(res, { status: 201, message: 'Assignment submitted', data: { submission: serializeSubmission(submission) } });
});

module.exports = {
  createAssignment,
  getAssignmentByLesson,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  uploadAttachments,
  deleteAttachment,
  downloadAssignmentFile,
  listSubmissions,
  getSubmission,
  downloadSubmissionFile,
  gradeSubmission,
  submitAssignment,
};
