import { afterEach, describe, expect, it } from 'vitest';
import { loadWebsiteKnowledge, resetWebsiteKnowledgeCacheForTest } from './knowledge-loader';

afterEach(resetWebsiteKnowledgeCacheForTest);

describe('website knowledge loader', () => {
  it('honours an aborted route before validating or caching the local snapshot', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(loadWebsiteKnowledge(controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
