const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');
const { VIDEO_MIME_TYPES } = require('../utils/videoDuration');

// docs/SECURITY.md §6: image/jpeg|png|webp, max 2MB, MIME + extension validated.
const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

const fileFilterFor = (types, label) => (_req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!types.has(file.mimetype)) return cb(new ApiError(400, `Invalid file type. Allowed: ${label}`));
  if (![...types.values()].includes(ext)) return cb(new ApiError(400, 'Invalid file extension'));
  return cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: fileFilterFor(ALLOWED, 'JPEG, PNG, WebP'),
});

// Community media: images (2 MB) or short videos (25 MB, duration checked in controller).
// ponytail: 25 MB covers 30s of typical screen-recording bitrates; tighten per traffic data.
const IMAGE_MIME = new Map([...ALLOWED]);
const communityMediaTypes = new Map([...ALLOWED, ...VIDEO_MIME_TYPES]);
const communityMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: fileFilterFor(communityMediaTypes, 'JPEG, PNG, WebP, MP4, WebM'),
});

module.exports = { upload, ALLOWED, communityMedia, IMAGE_MIME, communityMediaTypes };
