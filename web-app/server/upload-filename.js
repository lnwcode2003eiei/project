// Repair lossless UTF-8 bytes mistakenly decoded as Latin-1 by multipart parsing.
export function normalizeUploadFilename(name) {
  if (typeof name !== 'string') return '';
  if (!/[^\x00-\x7f]/.test(name) || [...name].some(c => c.codePointAt(0) > 255)) return name;
  const bytes = Buffer.from(name, 'latin1');
  const decoded = bytes.toString('utf8');
  return !decoded.includes('\ufffd') && Buffer.from(decoded, 'utf8').equals(bytes) ? decoded : name;
}
