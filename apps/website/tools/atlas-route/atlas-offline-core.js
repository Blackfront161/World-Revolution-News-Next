export const OWN_PREFIX = 'wrn.website-atlas.r77.v1.';
export function ownsCache(name) { return name === OWN_PREFIX + 'control' || new RegExp('^' + OWN_PREFIX.replaceAll('.', '\\.') + 'payload\\.[a-f0-9-]{36}$').test(name); }
export function byteRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return false;
  let start, end;
  if (!match[1]) { const suffix = Number(match[2]); if (!Number.isSafeInteger(suffix) || suffix <= 0) return false; start = Math.max(0, size - suffix); end = size - 1; }
  else { start = Number(match[1]); end = match[2] ? Number(match[2]) : size - 1; }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start < 0 || end < start) return false;
  return {start, end: Math.min(end, size - 1)};
}
export async function verifiedBytes(response, entry) {
  if (response.status !== 200 || response.type === 'opaque' || response.redirected) throw Error('HTTP');
  const bytes = await response.arrayBuffer();
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
  if (bytes.byteLength !== entry.bytes || digest !== entry.sha256) throw Error('INTEGRITY');
  return bytes;
}
