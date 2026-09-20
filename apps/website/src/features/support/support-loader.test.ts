import { afterEach, describe, expect, it } from 'vitest';
import { loadWebsiteSupport, resetWebsiteSupportCacheForTest } from './support-loader';

afterEach(resetWebsiteSupportCacheForTest);

describe('website support loader', () => {
  it('honours an aborted route before validating or caching the local snapshot', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(loadWebsiteSupport(controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
