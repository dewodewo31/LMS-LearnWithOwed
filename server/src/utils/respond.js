/** Success response per docs/API.md §1. */
module.exports = (res, { status = 200, message = 'OK', data = null, meta } = {}) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};
