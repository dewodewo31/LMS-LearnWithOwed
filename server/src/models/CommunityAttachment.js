const mongoose = require('mongoose');

const KINDS = ['image', 'video'];

/**
 * Media uploaded for community questions/answers. Files live in the upload
 * directory (same storage as thumbnails); the database stores metadata only
 * (docs/DATA-MODEL.md §3, ARCHITECTURE.md §7).
 * Uploads start unclaimed (questionId/answerId null) and are claimed by their
 * owner into exactly one question or answer — attachment ownership is validated
 * at claim time (IDOR protection, docs/SECURITY.md §4).
 */
const communityAttachmentSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: KINDS, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
    durationSec: { type: Number, default: null, min: 0 }, // video only
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', default: null },
    answerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer', default: null },
  },
  { timestamps: true }
);

communityAttachmentSchema.index({ ownerId: 1 });
communityAttachmentSchema.index({ questionId: 1 });
communityAttachmentSchema.index({ answerId: 1 });

const CommunityAttachment = mongoose.model('CommunityAttachment', communityAttachmentSchema);
CommunityAttachment.KINDS = KINDS;
module.exports = CommunityAttachment;
