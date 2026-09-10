/**
 * Server-side video duration inspection (community requirement: max 30 seconds,
 * enforced at the API layer — never trust client-side validation).
 *
 * Dependency-free container parsing for the two accepted formats:
 * - MP4: reads the `mvhd` header (timescale + duration).
 * - WebM/MKV: walks EBML top-level → Segment → Info → TimecodeScale + Duration.
 *
 * Returns whole seconds, or null when the duration cannot be determined —
 * callers must reject unverifiable videos rather than guess (strict rule).
 */

const MAX_VIDEO_SECONDS = 30;
const VIDEO_MIME_TYPES = new Map([
  ['video/mp4', '.mp4'],
  ['video/webm', '.webm'],
]);

const mp4DurationSeconds = (buf) => {
  let idx = buf.indexOf('mvhd');
  while (idx !== -1) {
    if (idx + 8 > buf.length) return null;
    const version = buf.readUInt8(idx + 4);
    let timescale;
    let duration;
    if (version === 1) {
      if (idx + 32 > buf.length) return null;
      timescale = buf.readUInt32BE(idx + 20);
      duration = Number(buf.readBigUInt64BE(idx + 24));
    } else if (version === 0) {
      if (idx + 24 > buf.length) return null;
      timescale = buf.readUInt32BE(idx + 16);
      duration = buf.readUInt32BE(idx + 20);
    } else {
      return null;
    }
    if (timescale > 0 && duration > 0) return duration / timescale;
    idx = buf.indexOf('mvhd', idx + 1);
  }
  return null;
};

// EBML variable-length integer. `keepMarker` for element IDs (marker bits are part of the ID).
const readVint = (buf, pos, keepMarker = false) => {
  if (pos >= buf.length) return null;
  const first = buf.readUInt8(pos);
  if (first === 0) return null;
  let mask = 0x80;
  let length = 1;
  while (length <= 8 && !(first & mask)) {
    mask >>= 1;
    length += 1;
  }
  if (length > 8 || pos + length > buf.length) return null;
  let value = keepMarker ? first : first & (mask - 1);
  for (let i = 1; i < length; i += 1) value = value * 256 + buf.readUInt8(pos + i);
  return { value, length };
};

// Iterate EBML children within [start, end).
function* ebmlChildren(buf, start, end) {
  let pos = start;
  while (pos + 2 <= end) {
    const id = readVint(buf, pos, true);
    if (!id) return;
    const size = readVint(buf, pos + id.length);
    if (!size) return;
    const dataStart = pos + id.length + size.length;
    const dataEnd = Math.min(dataStart + size.value, end); // clamp unknown/oversized sizes
    yield { id: id.value, dataStart, dataEnd };
    pos = dataEnd;
  }
}

const webmDurationSeconds = (buf) => {
  // Top level: EBML header, then Segment.
  for (const top of ebmlChildren(buf, 0, buf.length)) {
    if (top.id !== 0x18538067) continue; // Segment
    for (const segChild of ebmlChildren(buf, top.dataStart, top.dataEnd)) {
      if (segChild.id !== 0x1549a966) continue; // Info
      let durationNs = null;
      let timecodeScale = 1000000; // EBML default
      for (const infoChild of ebmlChildren(buf, segChild.dataStart, segChild.dataEnd)) {
        if (infoChild.id === 0x4489 && infoChild.dataEnd - infoChild.dataStart === 4) {
          durationNs = buf.readFloatBE(infoChild.dataStart);
        } else if (infoChild.id === 0x4489 && infoChild.dataEnd - infoChild.dataStart === 8) {
          durationNs = buf.readDoubleBE(infoChild.dataStart);
        } else if (infoChild.id === 0x2ad7b1 && infoChild.dataEnd > infoChild.dataStart && infoChild.dataEnd - infoChild.dataStart <= 8) {
          let scaleValue = 0;
          for (let i = infoChild.dataStart; i < infoChild.dataEnd; i += 1) scaleValue = scaleValue * 256 + buf.readUInt8(i);
          timecodeScale = scaleValue;
        }
      }
      if (durationNs > 0 && timecodeScale > 0) {
        // EBML Duration is expressed in TimecodeScale units (default 1e6 ns = 1 ms).
        return (durationNs * timecodeScale) / 1e9;
      }
      return null;
    }
    return null; // Segment without Info
  }
  return null;
};

/** Duration in seconds for a video buffer, or null when unverifiable. */
const getVideoDurationSeconds = (buf, mimeType) => {
  if (!buf || buf.length === 0) return null;
  if (mimeType === 'video/mp4') return mp4DurationSeconds(buf);
  if (mimeType === 'video/webm') return webmDurationSeconds(buf);
  return null;
};

module.exports = { getVideoDurationSeconds, MAX_VIDEO_SECONDS, VIDEO_MIME_TYPES };
