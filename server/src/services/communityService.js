const Course = require('../models/Course');
const CommunityAttachment = require('../models/CommunityAttachment');
const ApiError = require('../utils/ApiError');
const { activeEnrollmentOr403 } = require('./progressService');

/**
 * Community access rule (spec §28): admin all, mentor = course owner,
 * student = active/completed enrollment (docs/BUSINESS-RULES.md §4.3).
 * Reuses the same access primitive as the course player — no second concept.
 */
const assertCourseAccess = async (user, courseId) => {
  const course = await Course.findOne({ _id: courseId, isDeleted: false });
  if (!course) throw new ApiError(404, 'Course not found');
  if (user.role === 'admin') return course;
  if (user.role === 'mentor') {
    if (String(course.mentorId) !== String(user._id)) {
      throw new ApiError(403, 'You do not have permission to access this course community');
    }
    return course;
  }
  await activeEnrollmentOr403(user._id, course._id);
  return course;
};

/** Claim unclaimed uploads owned by the user into a question or answer (IDOR-safe). */
const claimAttachments = async (attachmentIds, ownerId, target = {}) => {
  if (!attachmentIds?.length) return [];
  const unique = [...new Set(attachmentIds.map(String))];
  const docs = await CommunityAttachment.find({
    _id: { $in: unique },
    ownerId,
    questionId: null,
    answerId: null,
  });
  if (docs.length !== unique.length) {
    throw new ApiError(403, 'One or more attachments are not available');
  }
  await CommunityAttachment.updateMany({ _id: { $in: unique } }, { $set: target });
  return CommunityAttachment.find({ _id: { $in: unique } }).lean();
};

const listAttachments = async (filter) => CommunityAttachment.find(filter).sort({ createdAt: 1 }).lean();

const serializeAttachment = (a) => ({
  id: a._id,
  kind: a.kind,
  url: a.url,
  mimeType: a.mimeType,
  size: a.size,
  durationSec: a.durationSec,
});

module.exports = { assertCourseAccess, claimAttachments, listAttachments, serializeAttachment };
