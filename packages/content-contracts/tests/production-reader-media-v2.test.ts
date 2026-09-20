import { describe, expect, it } from 'vitest';
import {
  decodeProductionReaderImageBytesV2,
  productionReaderMediaLimitsV2,
  validateProductionReaderImageBlockV2,
  type ProductionReaderImageBlockV2,
} from '../src/production-reader-media-v2.js';

const tinyPng =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+5LQP4QAAAABJRU5ErkJggg==';
const tinyJpeg =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/Aaf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/Aaf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z';

async function sha256Utf8(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Bytes(base64: string): Promise<string> {
  const bytes = decodeProductionReaderImageBytesV2(base64)!;
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function image(
  base64 = tinyPng,
  mime: 'image/png' | 'image/jpeg' = 'image/png',
): Promise<ProductionReaderImageBlockV2> {
  const sourceUrl = 'https://www.eff.org/deeplinks/example-original.png';
  const bytes = decodeProductionReaderImageBytesV2(base64)!;
  return {
    kind: 'image',
    mediaId: `wrn-media-${(await sha256Utf8(sourceUrl)).slice(0, 32)}`,
    sourceUrl,
    sourcePageUrl: 'https://www.eff.org/deeplinks/example-page/',
    sourceSnapshotSha256: 'a'.repeat(64),
    mime,
    byteLength: bytes.byteLength,
    width: 1,
    height: 1,
    sha256: await sha256Bytes(base64),
    base64,
    altText: 'A tiny original-source example image.',
    altLanguage: 'en',
    altTextProvenance: 'original-source',
    attribution: 'Electronic Frontier Foundation',
    licenseId: 'CC-BY-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    evidenceUrl: 'https://www.eff.org/deeplinks/image-evidence/',
    checkedAt: '2026-09-10T00:00:00.000Z',
    thirdPartyMaterialReviewed: true,
  };
}

describe('production reader media V2 image block', () => {
  it('accepts complete canonical tiny PNG and JPEG blocks', async () => {
    await expect(validateProductionReaderImageBlockV2(await image())).resolves.toBe(true);
    await expect(
      validateProductionReaderImageBlockV2(await image(tinyJpeg, 'image/jpeg')),
    ).resolves.toBe(true);
  });

  it('decodes only bounded canonical base64 without implying image admission', () => {
    expect(decodeProductionReaderImageBytesV2(tinyPng)).toBeInstanceOf(Uint8Array);
    expect(decodeProductionReaderImageBytesV2(`${tinyPng}\n`)).toBeNull();
    expect(decodeProductionReaderImageBytesV2('a')).toBeNull();
    expect(
      decodeProductionReaderImageBytesV2(
        'A'.repeat(productionReaderMediaLimitsV2.maxBase64Characters + 1),
      ),
    ).toBeNull();
    expect(
      decodeProductionReaderImageBytesV2(
        'AAAA'.repeat(productionReaderMediaLimitsV2.maxBase64Characters / 4),
      ),
    ).toBeNull();
  });

  it('rejects corrupt bytes, integrity drift, malformed headers, and MIME dimension mismatches', async () => {
    const valid = await image();
    const corrupt = `${valid.base64.slice(0, -4)}AAAA`;
    await expect(validateProductionReaderImageBlockV2({ ...valid, base64: corrupt })).resolves.toBe(
      false,
    );
    await expect(
      validateProductionReaderImageBlockV2({ ...valid, sha256: 'b'.repeat(64) }),
    ).resolves.toBe(false);
    await expect(
      validateProductionReaderImageBlockV2({ ...valid, byteLength: valid.byteLength - 1 }),
    ).resolves.toBe(false);
    await expect(
      validateProductionReaderImageBlockV2({ ...valid, base64: valid.base64.slice(0, 28) }),
    ).resolves.toBe(false);
    await expect(
      validateProductionReaderImageBlockV2({ ...valid, mime: 'image/jpeg' }),
    ).resolves.toBe(false);
    await expect(validateProductionReaderImageBlockV2({ ...valid, width: 2 })).resolves.toBe(false);
  });

  it('rejects over-limit claims and unsafe, noncanonical, or unreviewed provenance', async () => {
    const valid = await image();
    await expect(
      validateProductionReaderImageBlockV2({
        ...valid,
        byteLength: productionReaderMediaLimitsV2.maxBytes + 1,
      }),
    ).resolves.toBe(false);
    await expect(
      validateProductionReaderImageBlockV2({ ...valid, sourceUrl: 'http://www.eff.org/image.png' }),
    ).resolves.toBe(false);
    await expect(
      validateProductionReaderImageBlockV2({
        ...valid,
        sourcePageUrl: 'https://localhost/provenance/',
      }),
    ).resolves.toBe(false);
    await expect(
      validateProductionReaderImageBlockV2({
        ...valid,
        licenseUrl: 'https://WWW.eff.org/license/',
      }),
    ).resolves.toBe(false);
    await expect(
      validateProductionReaderImageBlockV2({ ...valid, attribution: '<script>unsafe</script>' }),
    ).resolves.toBe(false);
    await expect(
      validateProductionReaderImageBlockV2({ ...valid, thirdPartyMaterialReviewed: false }),
    ).resolves.toBe(false);
  });

  it('requires exact keys, meaningful alt text, and a source-URL derived stable media ID', async () => {
    const valid = await image();
    const missingAlt = { ...valid } as Record<string, unknown>;
    delete missingAlt.altText;
    await expect(validateProductionReaderImageBlockV2(missingAlt)).resolves.toBe(false);
    await expect(
      validateProductionReaderImageBlockV2({ ...valid, unexpected: true }),
    ).resolves.toBe(false);
    await expect(validateProductionReaderImageBlockV2({ ...valid, altText: '' })).resolves.toBe(
      false,
    );
    await expect(
      validateProductionReaderImageBlockV2({ ...valid, mediaId: `wrn-media-${valid.sha256}` }),
    ).resolves.toBe(false);
    await expect(
      validateProductionReaderImageBlockV2({
        ...valid,
        mediaId: `wrn-media-${await sha256Utf8(valid.sourceUrl)}`,
      }),
    ).resolves.toBe(false);
    await expect(
      validateProductionReaderImageBlockV2({
        ...valid,
        sourceUrl: 'https://www.eff.org/deeplinks/a-different-original.png',
      }),
    ).resolves.toBe(false);
  });
});
