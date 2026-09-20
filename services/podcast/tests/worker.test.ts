import { describe, expect, it } from 'vitest';

import worker from '../src/index.js';

describe('disabled podcast worker', () => {
  it('has a deploy-valid fail-closed handler and never consumes a generation body', async () => {
    const response = worker.fetch(
      new Request('https://podcast.invalid/v1/podcasts', {
        method: 'POST',
        body: 'untrusted article text',
      }),
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      code: 'PODCAST_GENERATION_DISABLED',
      message: 'Podcast generation is not configured.',
    });
  });
});
