// @ts-expect-error Node executes this production contract source directly.
import { sha256Utf8, utf8ByteLength } from './index.ts';

export const productionReaderMediaLimitsV2 = Object.freeze({
  maxBase64Characters: 349_528,
  maxBytes: 256 * 1024,
  maxDimension: 2048,
  maxPixels: 4_194_304,
  maxUrlBytes: 2048,
  maxTextBytes: 2048,
  maxLicenseIdBytes: 256,
});

export type ProductionReaderImageBlockV2 = Readonly<{
  kind: 'image';
  mediaId: string;
  sourceUrl: string;
  sourcePageUrl: string;
  sourceSnapshotSha256: string;
  mime: 'image/png' | 'image/jpeg';
  byteLength: number;
  width: number;
  height: number;
  sha256: string;
  base64: string;
  altText: string;
  altLanguage: string;
  altTextProvenance: 'original-source' | 'editorial';
  attribution: string;
  licenseId: string;
  licenseUrl: string;
  evidenceUrl: string;
  checkedAt: string;
  thirdPartyMaterialReviewed: true;
}>;

const exactKeys = [
  'kind',
  'mediaId',
  'sourceUrl',
  'sourcePageUrl',
  'sourceSnapshotSha256',
  'mime',
  'byteLength',
  'width',
  'height',
  'sha256',
  'base64',
  'altText',
  'altLanguage',
  'altTextProvenance',
  'attribution',
  'licenseId',
  'licenseUrl',
  'evidenceUrl',
  'checkedAt',
  'thirdPartyMaterialReviewed',
] as const;
const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
const hashPattern = /^[a-f0-9]{64}$/u;
const languagePattern = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

type ImageDimensions = Readonly<{ width: number; height: number }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === exactKeys.length &&
    exactKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
}

function safeText(
  value: unknown,
  maximum: number = productionReaderMediaLimitsV2.maxTextBytes,
): value is string {
  return (
    typeof value === 'string' &&
    value === value.normalize('NFC') &&
    value.trim() === value &&
    utf8ByteLength(value) > 0 &&
    utf8ByteLength(value) <= maximum &&
    ![...value].some((character) => {
      const code = character.charCodeAt(0);
      return (
        code <= 0x1f || (code >= 0x7f && code <= 0x9f) || character === '<' || character === '>'
      );
    })
  );
}

function safeHttpsUrl(value: unknown): value is string {
  if (!safeText(value, productionReaderMediaLimitsV2.maxUrlBytes)) return false;
  if (/\s/u.test(value) || /[\\]/u.test(value)) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== 'https:' ||
      url.username !== '' ||
      url.password !== '' ||
      url.port !== '' ||
      url.href !== value ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname === 'home.arpa' ||
      hostname.endsWith('.home.arpa') ||
      hostname.endsWith('.internal') ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/u.test(hostname) ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/u.test(hostname)
    )
      return false;
    return true;
  } catch {
    return false;
  }
}

function isUtcTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    timestampPattern.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function isDimension(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 1 &&
    value <= productionReaderMediaLimitsV2.maxDimension
  );
}

function isByteLength(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 1 &&
    value <= productionReaderMediaLimitsV2.maxBytes
  );
}

function bytesFromCanonicalBase64(value: unknown): Uint8Array | null {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > productionReaderMediaLimitsV2.maxBase64Characters ||
    !base64Pattern.test(value)
  )
    return null;
  const byteLength =
    (value.length / 4) * 3 - (value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0);
  if (byteLength > productionReaderMediaLimitsV2.maxBytes) return null;
  try {
    const binary = globalThis.atob(value);
    if (binary.length !== byteLength) return null;
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return globalThis.btoa(binary) === value ? bytes : null;
  } catch {
    return null;
  }
}

/** Decodes only bounded canonical base64; callers still need admission validation. */
export function decodeProductionReaderImageBytesV2(value: unknown): Uint8Array | null {
  return bytesFromCanonicalBase64(value);
}

function pngDimensions(bytes: Uint8Array): ImageDimensions | null {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    bytes.length < 33 ||
    !signature.every((byte, index) => bytes[index] === byte) ||
    bytes[8] !== 0 ||
    bytes[9] !== 0 ||
    bytes[10] !== 0 ||
    bytes[11] !== 13 ||
    bytes[12] !== 73 ||
    bytes[13] !== 72 ||
    bytes[14] !== 68 ||
    bytes[15] !== 82
  )
    return null;
  const width = (bytes[16]! << 24) | (bytes[17]! << 16) | (bytes[18]! << 8) | bytes[19]!;
  const height = (bytes[20]! << 24) | (bytes[21]! << 16) | (bytes[22]! << 8) | bytes[23]!;
  return width > 0 && height > 0 ? { width, height } : null;
}

function isStartOfFrame(marker: number): boolean {
  return (
    (marker >= 0xc0 && marker <= 0xc3) ||
    (marker >= 0xc5 && marker <= 0xc7) ||
    (marker >= 0xc9 && marker <= 0xcb) ||
    (marker >= 0xcd && marker <= 0xcf)
  );
}

function jpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 10 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let index = 2;
  while (index < bytes.length) {
    if (bytes[index] !== 0xff) return null;
    while (bytes[index] === 0xff) index++;
    const marker = bytes[index++];
    if (marker === undefined || marker === 0 || marker === 0xd9 || marker === 0xda) return null;
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
    if (index + 1 >= bytes.length) return null;
    const length = (bytes[index]! << 8) | bytes[index + 1]!;
    const end = index + length;
    if (length < 2 || end > bytes.length) return null;
    if (isStartOfFrame(marker)) {
      if (length < 8) return null;
      const height = (bytes[index + 3]! << 8) | bytes[index + 4]!;
      const width = (bytes[index + 5]! << 8) | bytes[index + 6]!;
      return width > 0 && height > 0 ? { width, height } : null;
    }
    index = end;
  }
  return null;
}

function dimensionsForMime(bytes: Uint8Array, mime: unknown): ImageDimensions | null {
  return mime === 'image/png'
    ? pngDimensions(bytes)
    : mime === 'image/jpeg'
      ? jpegDimensions(bytes)
      : null;
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Validates one complete locally packaged image block. It does not admit a source or render media. */
export async function validateProductionReaderImageBlockV2(value: unknown): Promise<boolean> {
  if (!isRecord(value) || !hasExactKeys(value)) return false;
  if (
    value.kind !== 'image' ||
    !safeHttpsUrl(value.sourceUrl) ||
    !safeHttpsUrl(value.sourcePageUrl) ||
    !hashPattern.test(value.sourceSnapshotSha256 as string) ||
    (value.mime !== 'image/png' && value.mime !== 'image/jpeg') ||
    !isByteLength(value.byteLength) ||
    !isDimension(value.width) ||
    !isDimension(value.height) ||
    value.width * value.height > productionReaderMediaLimitsV2.maxPixels ||
    !hashPattern.test(value.sha256 as string) ||
    !safeText(value.altText) ||
    !(typeof value.altLanguage === 'string' && languagePattern.test(value.altLanguage)) ||
    (value.altTextProvenance !== 'original-source' && value.altTextProvenance !== 'editorial') ||
    !safeText(value.attribution) ||
    !safeText(value.licenseId, productionReaderMediaLimitsV2.maxLicenseIdBytes) ||
    !safeHttpsUrl(value.licenseUrl) ||
    !safeHttpsUrl(value.evidenceUrl) ||
    !isUtcTimestamp(value.checkedAt) ||
    value.thirdPartyMaterialReviewed !== true
  )
    return false;

  const sourceIdentity = `wrn-media-${(await sha256Utf8(value.sourceUrl)).slice(0, 32)}`;
  if (value.mediaId !== sourceIdentity) return false;
  const bytes = decodeProductionReaderImageBytesV2(value.base64);
  if (bytes === null || bytes.byteLength !== value.byteLength) return false;
  const dimensions = dimensionsForMime(bytes, value.mime);
  if (dimensions === null || dimensions.width !== value.width || dimensions.height !== value.height)
    return false;
  return (await sha256Bytes(bytes)) === value.sha256;
}
