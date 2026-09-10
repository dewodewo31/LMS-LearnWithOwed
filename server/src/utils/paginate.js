/** Pagination per docs/API.md §2. Defaults: page=1, limit=20 (max 100). */
const parsePagination = (query, { maxLimit = 100, defaults = { page: 1, limit: 20 } } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaults.limit));
  return { page, limit, skip: (page - 1) * limit };
};

const buildMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

module.exports = { parsePagination, buildMeta };
