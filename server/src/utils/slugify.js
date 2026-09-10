/** URL slug: "JavaScript Fundamentals!" -> "javascript-fundamentals" */
module.exports = (str = '') =>
  str
    .toString()
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
