/** Operational error with HTTP status + optional field errors (format: docs/API.md §1). */
class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

module.exports = ApiError;
