const config = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors;

  // Mongoose duplicate key -> 409 (docs §40 data integrity)
  if (err.name === 'MongoServerError' && err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {}).join(', ');
    message = field ? `Duplicate value for: ${field}` : 'Duplicate value';
    errors = err.keyValue;
  }
  // Mongoose validation
  if (err.name === 'ValidationError') {
    status = 422;
    message = 'Validation failed';
    errors = Object.fromEntries(Object.entries(err.errors || {}).map(([k, v]) => [k, v.message]));
  }
  // Cast to ObjectId failed
  if (err.name === 'CastError') {
    status = 404;
    message = 'Resource not found';
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
  }
  // Multer
  if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 2 MB)' : err.message;
  }
  // Body parser
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    status = 400;
    message = err.type === 'entity.too.large' ? 'Request body too large' : 'Malformed JSON body';
  }

  if (!config.isProd && status >= 400) {
    console.error('[error]', status, err.stack || err);
  }

  // Never leak internals (docs ERROR-HANDLING.md §4)
  if (status >= 500) {
    message = 'Internal Server Error';
    errors = undefined;
  }

  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
};

module.exports = { notFound, errorHandler };
