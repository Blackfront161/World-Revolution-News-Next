import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadWebsiteKnowledge, resetWebsiteKnowledgeCacheForTest } from './knowledge-loader';
import packed from './packed/legacy-knowledge-v1.json';

afterEach(resetWebsiteKnowledgeCacheForTest);

describe('website knowledge loader', () => {
  it('loads all 167 current terms while preserving the historical library', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(packed), { headers: { 'content-type': 'application/json' } }),
        ),
    );
    const result = await loadWebsiteKnowledge(new AbortController().signal);
    expect(result.projection.terms).toHaveLength(167);
    expect(result.projection.lexiconSources).toHaveLength(44);
    expect(result.projection.books).toHaveLength(728);
    const aborted = new AbortController();
    aborted.abort();
    await expect(loadWebsiteKnowledge(aborted.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
  it.each(['unknown-key', 'broken-related', 'unsafe-reference'])(
    'rejects %s without caching it',
    async (variant) => {
      const candidate = structuredClone(packed);
      if (variant === 'unknown-key') Object.assign(candidate, { extra: true });
      if (variant === 'broken-related')
        candidate.currentKnowledge.lexicon.terms[0]!.related.push('missing-term');
      if (variant === 'unsafe-reference')
        candidate.currentKnowledge.lexicon.sources[0]!.url = 'javascript:alert(1)';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify(candidate), {
            headers: { 'content-type': 'application/json' },
          }),
        ),
      );
      await expect(loadWebsiteKnowledge(new AbortController().signal)).rejects.toThrow();
    },
  );
  it('honours an aborted route before validating or caching the local snapshot', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(loadWebsiteKnowledge(controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
