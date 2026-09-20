import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectSportFeed } from './check-sport-feeds.mjs';
const source = { id: 'fsgt', feedUrl: 'https://www.fsgt.org/feed/' };

test('checks RSS and Atom without returning bodies or admitting content', async () => {
  for (const [xml, format] of [
    ['<rss version="2.0"><channel><item><title>Example</title></item></channel></rss>', 'RSS'],
    [
      '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Example</title></entry></feed>',
      'Atom',
    ],
  ]) {
    const result = await inspectSportFeed(source, async (_url, options) => {
      assert.equal(options.credentials, 'omit');
      assert.equal(options.redirect, 'error');
      return new Response(xml);
    });
    assert.equal(result.status, 'available');
    assert.equal(result.format, format);
    assert.equal(result.entries, 1);
    assert.equal(result.publicationPerformed, false);
    assert.ok(!JSON.stringify(result).includes('Example'));
  }
});

test('rejects arbitrary URLs before network access', async () => {
  await assert.rejects(
    inspectSportFeed({ id: 'fsgt', feedUrl: 'https://example.com/' }, async () => {
      assert.fail('must not fetch');
    }),
    /Unreviewed feed/,
  );
});

test('rejects malformed, empty, DTD and oversized responses', async () => {
  for (const xml of [
    '<rss>',
    '<rss version="2.0"><channel/></rss>',
    '<!DOCTYPE rss><rss version="2.0"><channel><item/></channel></rss>',
    'x'.repeat(2 * 1024 * 1024 + 1),
  ]) {
    assert.equal(
      (await inspectSportFeed(source, async () => new Response(xml))).status,
      'unavailable',
    );
  }
});

test('cancels a rejected response stream', async () => {
  let cancelled = false;
  const result = await inspectSportFeed(
    source,
    async () =>
      new Response(
        new ReadableStream({
          cancel() {
            cancelled = true;
          },
        }),
        { status: 503 },
      ),
  );
  assert.equal(result.status, 'unavailable');
  assert.equal(cancelled, true);
});

test('does not wait for a stalled cancellation', { timeout: 1000 }, async () => {
  const result = await inspectSportFeed(
    source,
    async () =>
      new Response(
        new ReadableStream({
          cancel() {
            return new Promise(() => {});
          },
        }),
        { status: 503 },
      ),
  );
  assert.equal(result.status, 'unavailable');
});
