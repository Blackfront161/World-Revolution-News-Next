import { afterEach, expect, it, vi } from 'vitest';
import { fetchBoundedSameOriginJson } from './content-release-transport-core';
import { createBoundedTrustedOriginJsonTransportV1 } from '../../../packages/browser-content/src/content-release-transport-core';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const load = (path = '/release/articles.json', signal = new AbortController().signal) =>
  fetchBoundedSameOriginJson(path, signal, 64);

it.each([
  'http://solinaridao.com',
  'https://solinaridao.com/',
  'https://user@solinaridao.com',
  'https://solinaridao.com/path',
  'https://solinaridao.com?x=1',
  'https://solinaridao.com#x',
  'nonsense',
  'https://SOLINARIDAO.com',
  'https://solinaridao.com:443',
])('rejects noncanonical trust origins: %s', (origin) => {
  expect(() => createBoundedTrustedOriginJsonTransportV1(origin)).toThrow();
});
it.each([
  '/other/current.json',
  '//foreign.test/x',
  '/wrn-production-content/../x',
  '/wrn-production-content/%2e%2e/x',
  '/wrn-production-content/x?token=secret',
  '/wrn-production-content/x#x',
  'https://foreign.test/wrn-production-content/current.json',
])('rejects a remote resource outside the fixed content subtree: %s', async (path) => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const loadRemote = createBoundedTrustedOriginJsonTransportV1('https://solinaridao.com');
  await expect(loadRemote(path, new AbortController().signal, 64)).rejects.toMatchObject({
    code: 'origin',
  });
  expect(fetch).not.toHaveBeenCalled();
});
it('remote transport shares limits and omits credentials, redirects, cache and referrer', async () => {
  const fetch = vi.fn<(url: RequestInfo | URL, options?: RequestInit) => Promise<Response>>(
    async () => new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } }),
  );
  vi.stubGlobal('fetch', fetch);
  const loadRemote = createBoundedTrustedOriginJsonTransportV1('https://solinaridao.com');
  await expect(
    loadRemote('/wrn-production-content/current.json', new AbortController().signal, 64),
  ).resolves.toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledWith(
    'https://solinaridao.com/wrn-production-content/current.json',
    expect.objectContaining({
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    }),
  );
  await expect(
    loadRemote('/wrn-production-content/current.json', new AbortController().signal, 2),
  ).rejects.toMatchObject({ code: 'bytes' });
});

it.each([
  '//foreign.test/a',
  '/release/../a',
  '/release/%2e%2e/a',
  '/release/a?token=x',
  '/release/a#x',
  '/release\\a',
])('rejects unsafe resource path before any fetch: %s', async (path) => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  await expect(load(path)).rejects.toMatchObject({ code: 'origin' });
  expect(fetch).not.toHaveBeenCalled();
});
it('rejects a JSON-like MIME and cancels its unread body', async () => {
  const cancel = vi.fn();
  const body = new ReadableStream({ pull() {}, cancel }, { highWaterMark: 0 });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(body, { headers: { 'content-type': 'application/jsonp' } })),
  );
  await expect(load()).rejects.toMatchObject({ code: 'mime' });
  expect(cancel).toHaveBeenCalledOnce();
});
it('rejects malformed UTF-8 instead of admitting replacement text', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(new Uint8Array([34, 0xff, 34]), {
          headers: { 'content-type': 'application/json' },
        }),
    ),
  );
  await expect(load()).rejects.toMatchObject({ code: 'json' });
});
it('bounds an uncooperative fetch and cancels its late response', async () => {
  vi.useFakeTimers();
  let resolve!: (response: Response) => void;
  let signal: AbortSignal | undefined;
  const cancel = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn((_path, options: RequestInit) => {
      signal = options.signal ?? undefined;
      return new Promise<Response>((done) => {
        resolve = done;
      });
    }),
  );
  const outcome = load().catch((error) => error.code);
  await vi.advanceTimersByTimeAsync(5000);
  expect(await outcome).toBe('timeout');
  expect(signal?.aborted).toBe(true);
  resolve(new Response(new ReadableStream({ pull() {}, cancel }, { highWaterMark: 0 })));
  await vi.advanceTimersByTimeAsync(0);
  expect(cancel).toHaveBeenCalledOnce();
});
it('retains request isolation and exact byte length on normal responses', async () => {
  const fetch = vi.fn(
    async () =>
      new Response('{"ok":true}', {
        headers: { 'content-type': 'Application/Json; charset=utf-8', 'content-length': '11' },
      }),
  );
  vi.stubGlobal('fetch', fetch);
  await expect(load()).resolves.toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledWith(
    '/release/articles.json',
    expect.objectContaining({
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
    }),
  );
});
it('accepts decoded compressed JSON while still enforcing the decoded byte cap', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response('{"ok":true}', {
          headers: {
            'content-type': 'application/json',
            'content-encoding': 'gzip',
            'content-length': '31',
          },
        }),
    ),
  );
  await expect(load()).resolves.toEqual({ ok: true });
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify('x'.repeat(65)), {
          headers: {
            'content-type': 'application/json',
            'content-encoding': 'br',
            'content-length': '12',
          },
        }),
    ),
  );
  await expect(load()).rejects.toMatchObject({ code: 'bytes' });
});
it('rejects a mismatched unencoded length instead of trusting a short header', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response('{"ok":true}', {
          headers: { 'content-type': 'application/json', 'content-length': '2' },
        }),
    ),
  );
  await expect(load()).rejects.toMatchObject({ code: 'bytes' });
});
