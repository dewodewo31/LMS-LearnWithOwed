const AuditLog = require('../models/AuditLog');

/**
 * Fire-and-forget audit write (docs/SECURITY.md §11). Never throws, never blocks
 * the request path, never stores content bodies — metadata only.
 */
const audit = ({ userId, action, entity, entityId, metadata, ip, userAgent }) => {
  AuditLog.create({ userId, action, entity, entityId, metadata, ip, userAgent }).catch(() => {});
};

module.exports = audit;
