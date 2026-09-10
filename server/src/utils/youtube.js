/** Extract YouTube video id from supported URL shapes (PRD §42). Returns null when invalid. */
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

const PATTERNS = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/i,
  /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/i,
  /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/i,
  /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/i,
];

const extractYouTubeId = (rawUrl = '') => {
  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (!['youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com'].includes(host)) return null;
  for (const re of PATTERNS) {
    const m = rawUrl.match(re);
    if (m) return m[1];
  }
  return null;
};

const isValidYouTubeUrl = (url) => extractYouTubeId(url) !== null;

module.exports = { extractYouTubeId, isValidYouTubeUrl, ID_RE };
