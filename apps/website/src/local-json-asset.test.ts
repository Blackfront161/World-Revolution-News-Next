import { afterEach, expect, it, vi } from 'vitest';
import { readLocalJsonAsset } from './local-json-asset';
afterEach(() => vi.unstubAllGlobals());
it('rejects remote, non-JSON, and bounded local responses before parsing', async () => {
  const signal = new AbortController().signal;
  await expect(readLocalJsonAsset('https://example.invalid/a.json', signal, 64)).rejects.toThrow(
    'local-json-url',
  );
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('{}', { headers: { 'content-type': 'text/plain' } })),
  );
  await expect(readLocalJsonAsset('/assets/a.json', signal, 64)).rejects.toThrow('local-json-mime');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response('{"value":"too-long"}', {
        headers: { 'content-type': 'application/json', 'content-length': '65' },
      }),
    ),
  );
  await expect(readLocalJsonAsset('/assets/a.json', signal, 64)).rejects.toThrow('local-json-size');
});

it('reads bounded UTF-8 chunks and omits credentials with redirects forbidden', async () => {
  const bytes = new TextEncoder().encode('{"text":"Grüße"}');
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(bytes.slice(0, 12));
          controller.enqueue(bytes.slice(12));
          controller.close();
        },
      }),
      { headers: { 'content-type': 'application/json; charset=utf-8' } },
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  const signal = new AbortController().signal;
  await expect(readLocalJsonAsset('/assets/a.json', signal, bytes.length)).resolves.toEqual({
    text: 'Grüße',
  });
  expect(fetchMock).toHaveBeenCalledWith(new URL('/assets/a.json', window.location.href), {
    credentials: 'omit',
    redirect: 'error',
    signal,
  });
});

it('cancels bad MIME, declared and actual oversized bodies even without Content-Length', async () => {
  for (const kind of ['mime', 'declared', 'stream']) {
    const cancel = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(65));
            },
            cancel,
          }),
          {
            headers: {
              'content-type': kind === 'mime' ? 'text/plain' : 'application/json',
              ...(kind === 'declared' ? { 'content-length': '65' } : {}),
            },
          },
        ),
      ),
    );
    await expect(
      readLocalJsonAsset('/assets/a.json', new AbortController().signal, 64),
    ).rejects.toThrow(kind === 'mime' ? 'local-json-mime' : 'local-json-size');
    expect(cancel).toHaveBeenCalledOnce();
  }
});

it('rejects malformed UTF-8 and completion after cancellation without returning data', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(new Uint8Array([0xff]), { headers: { 'content-type': 'application/json' } }),
      ),
  );
  await expect(
    readLocalJsonAsset('/assets/a.json', new AbortController().signal, 64),
  ).rejects.toThrow();
  const controller = new AbortController();
  const cancel = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          pull(stream) {
            controller.abort();
            stream.enqueue(new TextEncoder().encode('{}'));
          },
          cancel,
        }),
        { headers: { 'content-type': 'application/json' } },
      ),
    ),
  );
  await expect(readLocalJsonAsset('/assets/a.json', controller.signal, 64)).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(cancel).toHaveBeenCalledOnce();
});

it('rejects URL credentials, queries, fragments and invalid limits before any fetch', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  const origin = new URL(window.location.origin);
  origin.username = 'name';
  for (const url of [origin.href, '/assets/a.json?query=1', '/assets/a.json#hash'])
    await expect(readLocalJsonAsset(url, new AbortController().signal, 64)).rejects.toThrow(
      'local-json-url',
    );
  for (const limit of [0, -1, 1.5, Infinity])
    await expect(
      readLocalJsonAsset('/assets/a.json', new AbortController().signal, limit),
    ).rejects.toThrow('local-json-size');
  expect(fetchMock).not.toHaveBeenCalled();
});
