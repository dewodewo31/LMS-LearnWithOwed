/**
 * HTML sanitization for CKEditor content (PRD §43, SECURITY.md §5).
 * Input is untrusted: strip script/iframe/object/embed + event handlers + javascript: URLs.
 * YouTube iframes are NOT allowed here — video lessons use the dedicated YouTube embed player.
 */
const sanitizeHtml = require('sanitize-html');

const options = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'blockquote',
    'pre', 'code', 'strong', 'em', 'u', 's', 'br', 'hr', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
    span: ['class'],
    div: ['class'],
    p: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName: 'a',
      attribs: { ...attribs, rel: 'noopener noreferrer', target: '_blank' },
    }),
  },
};

module.exports = (dirty = '') => sanitizeHtml(String(dirty), options);
