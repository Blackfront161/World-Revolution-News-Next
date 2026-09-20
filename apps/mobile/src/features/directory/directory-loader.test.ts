import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import snapshot from './data/content-directory-v1.json';

const localFetch = vi.fn();
beforeEach(() => {
  vi.resetModules();
  localFetch.mockReset().mockResolvedValue(new Response(JSON.stringify(snapshot)));
  vi.stubGlobal('fetch', localFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('directory loader', () => {
  it('rejects a well-shaped but false URL identity before caching', async () => {
    const wrong = structuredClone(snapshot);
    const oldId = wrong.articles[0]!.id;
    wrong.articles[0]!.id = 'news-' + '0'.repeat(64);
    for (const note of wrong.sports)
      if (note.articleId === oldId) note.articleId = wrong.articles[0]!.id;
    localFetch.mockResolvedValueOnce(new Response(JSON.stringify(wrong)));
    const { loadMobileContentDirectory } = await import('./directory-loader');
    await expect(loadMobileContentDirectory()).rejects.toThrow('directory identity');
    await expect(loadMobileContentDirectory()).resolves.toMatchObject({
      projection: { sources: expect.any(Array) },
    });
  });
  it('cancels an oversized declared body before reading or decoding it', async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({ cancel });
    localFetch.mockResolvedValueOnce(
      new Response(stream, { headers: { 'content-length': String(3 * 1024 * 1024 + 1) } }),
    );
    const { loadMobileContentDirectory } = await import('./directory-loader');
    await expect(loadMobileContentDirectory()).rejects.toThrow('directory size');
    expect(cancel).toHaveBeenCalledOnce();
    expect(stream.locked).toBe(false);
    await expect(loadMobileContentDirectory()).resolves.toMatchObject({
      projection: { sources: expect.any(Array) },
    });
  });
  it('cancels a body that exceeds its streaming cap and releases its reader', async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(3 * 1024 * 1024 + 1));
      },
      cancel,
    });
    localFetch.mockResolvedValueOnce(new Response(stream));
    const { loadMobileContentDirectory } = await import('./directory-loader');
    await expect(loadMobileContentDirectory()).rejects.toThrow('directory size');
    expect(cancel).toHaveBeenCalledOnce();
    expect(stream.locked).toBe(false);
  });
  it('does not cache malformed encoding, JSON or schema', async () => {
    localFetch
      .mockResolvedValueOnce(new Response(new Uint8Array([255])))
      .mockResolvedValueOnce(new Response('{'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...snapshot, body: 'unexpected content' })),
      );
    const { loadMobileContentDirectory } = await import('./directory-loader');
    await expect(loadMobileContentDirectory()).rejects.toThrow();
    await expect(loadMobileContentDirectory()).rejects.toThrow();
    await expect(loadMobileContentDirectory()).rejects.toThrow('directory contract');
    await expect(loadMobileContentDirectory()).resolves.toMatchObject({
      projection: { articles: expect.any(Array) },
    });
    expect(localFetch).toHaveBeenCalledTimes(4);
  });
  it('loads the local snapshot once and projects its visible counts', async () => {
    const { loadMobileContentDirectory } = await import('./directory-loader');
    const [left, right] = await Promise.all([
      loadMobileContentDirectory(),
      loadMobileContentDirectory(),
    ]);
    expect(left).toBe(right);
    expect(left.projection.articles).toHaveLength(973);
    expect(left.projection.sources).toHaveLength(532);
    expect(left.projection.sports).toHaveLength(3);
    expect(localFetch).toHaveBeenCalledWith(expect.any(URL), {
      credentials: 'omit',
      redirect: 'error',
    });
  });
  it('does not cache a failed request', async () => {
    localFetch.mockRejectedValueOnce(new Error('offline'));
    const { loadMobileContentDirectory } = await import('./directory-loader');
    await expect(loadMobileContentDirectory()).rejects.toThrow('offline');
    await expect(loadMobileContentDirectory()).resolves.toMatchObject({
      projection: { sports: expect.any(Array) },
    });
  });
  it('rejects malformed and oversized local payloads before accepting a retry', async () => {
    localFetch
      .mockResolvedValueOnce(new Response('{}'))
      .mockResolvedValueOnce(new Response(' '.repeat(3 * 1024 * 1024 + 1)));
    const { loadMobileContentDirectory } = await import('./directory-loader');
    await expect(loadMobileContentDirectory()).rejects.toThrow('directory contract');
    await expect(loadMobileContentDirectory()).rejects.toThrow('directory size');
    await expect(loadMobileContentDirectory()).resolves.toMatchObject({
      projection: { articles: expect.any(Array) },
    });
  });
});
