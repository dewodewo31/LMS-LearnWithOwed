const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const respond = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');
const { upload: multerUpload, ALLOWED } = require('../middleware/upload');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

const handler = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const ext = ALLOWED.get(req.file.mimetype);
  // Server-side filename (PRD §34): never trust original name
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.resolve(config.uploadPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), req.file.buffer);
  return respond(res, { status: 201, message: 'File uploaded', data: { url: `/uploads/${filename}` } });
});

module.exports = { uploadImage: [multerUpload.single('file'), handler] };
