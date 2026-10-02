// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { unpackWebsiteCatalog, validateAppCatalog } from './app-catalog';
const packed = JSON.parse(
  readFileSync(new URL('./packed/production-events-media-v1.json', import.meta.url), 'utf8'),
);
const historical = readFileSync(new URL('./data/production-events-media-v1.json', import.meta.url));
const signal = () => new AbortController().signal;
describe('current app catalogue and preserved historical bytes', () => {
  it('retains all five current collections including EPUB-only library records', async () => {
    const result = await unpackWebsiteCatalog(packed, signal());
    expect(
      Object.fromEntries(Object.entries(result.current.collections).map(([k, v]) => [k, v.length])),
    ).toEqual({ radio: 27, podcasts: 1722, videos: 16, library: 728, events: 6 });
    expect(result.current.collections.library.filter((r) => r.url.endsWith('.epub'))).toHaveLength(
      715,
    );
    expect(
      result.current.collections.library.filter((r) =>
        r.url.startsWith('https://anarchist-archive.org/library/de/'),
      ),
    ).toHaveLength(13);
    expect(result.current.collections.library.every((r) => r.publishedAt === null)).toBe(true);
    expect(result.current.commit).toBe('2342289bb126c6356f20088d5a97fe20a08980e1');
    expect(packed.history.sha256).toBe(createHash('sha256').update(historical).digest('hex'));
    expect(result.history).toEqual(JSON.parse(historical.toString('utf8')));
  });
  it.each([
    'javascript:alert(1)',
    'http://example.com',
    'https://user:pass@example.com',
    'https://example.com/\nfoo',
  ])('rejects unsafe original %s', (url) => {
    const c = structuredClone(packed.current);
    c.collections.radio[0].url = url;
    expect(validateAppCatalog(c)).toBe(false);
  });
  it.each([
    'unknownField',
    'duplicateId',
    'markupTitle',
    'missingSource',
    'badInputHash',
    'invalidDate',
    'badLanguage',
  ])('rejects %s', (variant) => {
    const c = structuredClone(packed.current);
    const row = c.collections.radio[0];
    if (variant === 'unknownField') row.body = 'Unexpected full text';
    if (variant === 'duplicateId') c.collections.radio[1].id = row.id;
    if (variant === 'markupTitle') row.title = '<script>bad</script>';
    if (variant === 'missingSource') row.source = '';
    if (variant === 'badInputHash') c.inputs[0].sha256 = 'bad';
    if (variant === 'invalidDate') row.publishedAt = 'yesterday';
    if (variant === 'badLanguage') row.language = '<en>';
    expect(validateAppCatalog(c)).toBe(false);
  });
  it('rejects excess historical declared size before decoding', async () => {
    const c = structuredClone(packed);
    c.history.bytes = 4194305;
    await expect(unpackWebsiteCatalog(c, signal())).rejects.toThrow('website-history-invalid');
  });
  it('enforces the decoded bound rather than trusting the compressed size', async () => {
    const c = structuredClone(packed);
    c.history.bytes = 10;
    c.history.payload = gzipSync(Buffer.alloc(1024, 'a')).toString('base64');
    await expect(unpackWebsiteCatalog(c, signal())).rejects.toThrow('website-history-cap');
  });
  it('rejects a wrong digest, truncated gzip and decoded invalid contract', async () => {
    const hash = structuredClone(packed);
    hash.history.sha256 = '0'.repeat(64);
    await expect(unpackWebsiteCatalog(hash, signal())).rejects.toThrow('website-history-hash');
    const truncated = structuredClone(packed);
    truncated.history.payload = Buffer.from(packed.history.payload, 'base64')
      .subarray(0, 20)
      .toString('base64');
    await expect(unpackWebsiteCatalog(truncated, signal())).rejects.toThrow();
    const invalid = structuredClone(packed);
    const bytes = Buffer.from('{}');
    invalid.history.payload = gzipSync(bytes).toString('base64');
    invalid.history.bytes = bytes.length;
    invalid.history.sha256 = createHash('sha256').update(bytes).digest('hex');
    await expect(unpackWebsiteCatalog(invalid, signal())).rejects.toThrow('events-media-invalid');
  });
  it('honours cancellation before and during decoding', async () => {
    const pre = new AbortController();
    pre.abort();
    await expect(unpackWebsiteCatalog(packed, pre.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    const during = new AbortController();
    const decoding = unpackWebsiteCatalog(packed, during.signal);
    during.abort();
    await expect(decoding).rejects.toMatchObject({ name: 'AbortError' });
  });
});
