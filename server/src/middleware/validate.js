const ApiError = require('../utils/ApiError');

/** Zod request-boundary validation (PRD §41). Default 422 per docs/API.md §1. */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const fieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return next(new ApiError(422, 'Validation failed', fieldErrors));
  }
  req[source] = result.data;
  return next();
};

module.exports = validate;
