import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import snapshot from './data/legacy-knowledge-v1.json';

const localFetch = vi.fn();
beforeEach(() => {
  vi.resetModules();
  localFetch.mockReset().mockImplementation(async () => new Response(JSON.stringify(snapshot)));
  vi.stubGlobal('fetch', localFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('knowledge loader', () => {
  it('loads and validates the real legacy snapshot once', async () => {
    vi.resetModules();
    const { loadMobileKnowledge } = await import('./knowledge-loader');
    const [left, right] = await Promise.all([loadMobileKnowledge(), loadMobileKnowledge()]);
    expect(left).toBe(right);
    expect(left.projection.books).toHaveLength(609);
    expect(left.projection.librarySources).toHaveLength(9);
    expect(left.projection.terms).toHaveLength(22);
    expect(left.projection.lexiconSources).toHaveLength(12);
    expect(await loadMobileKnowledge()).toBe(left);
    expect(localFetch).toHaveBeenCalledTimes(1);
    expect(localFetch.mock.calls[0]?.[1]).toEqual({ credentials: 'omit', redirect: 'error' });
  });
  it('rejects an invalid snapshot and leaves the loader retryable', async () => {
    vi.resetModules();
    localFetch.mockResolvedValueOnce(new Response(JSON.stringify({ schema: 'invalid' })));
    const { loadMobileKnowledge } = await import('./knowledge-loader');
    await expect(loadMobileKnowledge()).rejects.toThrow('knowledge validation');
    expect((await loadMobileKnowledge()).projection.books).toHaveLength(609);
  });
  it('rejects request failures, invalid JSON and oversized streams without caching failures', async () => {
    localFetch
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(new Response('invalid json'))
      .mockResolvedValueOnce(new Response(' '.repeat(3 * 1024 * 1024 + 1)));
    const { loadMobileKnowledge } = await import('./knowledge-loader');
    for (let index = 0; index < 4; index++) await expect(loadMobileKnowledge()).rejects.toThrow();
    expect((await loadMobileKnowledge()).projection.books).toHaveLength(609);
  });
});
