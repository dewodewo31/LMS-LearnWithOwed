// Must mirror server/src/models/Assignment.js GRADES (server validates; this only renders options).
export const GRADES = ['A+', 'A', 'B+', 'B'];

export const SUBMISSION_STATUS_LABELS = {
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  returned: 'Returned',
};

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
