// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { readLocalJsonAsset } from '../../../../../packages/browser-content/src/local-json-asset';
import { unpackWebsiteCatalog } from './app-catalog';

vi.mock('../../../../../packages/browser-content/src/local-json-asset', () => ({
  readLocalJsonAsset: vi.fn(),
}));
vi.mock('./app-catalog', () => ({ unpackWebsiteCatalog: vi.fn() }));

const verifiedFixture: Awaited<ReturnType<typeof unpackWebsiteCatalog>> = {
  history: JSON.parse(
    readFileSync(new URL('./data/production-events-media-v1.json', import.meta.url), 'utf8'),
  ),
  current: JSON.parse(
    readFileSync(new URL('./packed/production-events-media-v1.json', import.meta.url), 'utf8'),
  ).current,
};

function delayedRead(milliseconds: number) {
  vi.mocked(readLocalJsonAsset).mockImplementation(
    (_url, signal) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve({ bound: true }), milliseconds);
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(signal.reason);
          },
          { once: true },
        );
      }),
  );
}

describe('bounded catalogue delivery on a slow connection', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.mocked(unpackWebsiteCatalog).mockResolvedValue(verifiedFixture);
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('finishes a cold 19-second transfer with the unchanged size and validation boundary', async () => {
    delayedRead(19000);
    const { loadWebsiteAppCatalog } = await import('./events-media-loader');
    const result = loadWebsiteAppCatalog(new AbortController().signal);
    await vi.advanceTimersByTimeAsync(19000);
    expect(await result).toBe(verifiedFixture);
    expect(readLocalJsonAsset).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(AbortSignal),
      4194304,
    );
    expect(unpackWebsiteCatalog).toHaveBeenCalledWith({ bound: true }, expect.any(AbortSignal));
    expect(vi.getTimerCount()).toBe(0);
    await loadWebsiteAppCatalog(new AbortController().signal);
    expect(readLocalJsonAsset).toHaveBeenCalledTimes(1);
  });

  it('cancels a stalled transfer and leaves a subsequent retry available', async () => {
    delayedRead(60000);
    const { loadWebsiteAppCatalog } = await import('./events-media-loader');
    const first = loadWebsiteAppCatalog(new AbortController().signal);
    const rejected = expect(first).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(30000);
    await rejected;
    expect(unpackWebsiteCatalog).not.toHaveBeenCalled();
    vi.mocked(readLocalJsonAsset).mockResolvedValueOnce({ bound: true });
    expect(await loadWebsiteAppCatalog(new AbortController().signal)).toBe(verifiedFixture);
    expect(readLocalJsonAsset).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('aborts promptly when the caller leaves instead of waiting for the longer deadline', async () => {
    delayedRead(19000);
    const { loadWebsiteAppCatalog } = await import('./events-media-loader');
    const caller = new AbortController();
    const result = loadWebsiteAppCatalog(caller.signal);
    const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(50);
    caller.abort(new DOMException('route left', 'AbortError'));
    await rejected;
    expect(unpackWebsiteCatalog).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never caches metadata rejected by the existing contract validator', async () => {
    vi.mocked(readLocalJsonAsset).mockResolvedValue({ invalid: true });
    vi.mocked(unpackWebsiteCatalog).mockRejectedValueOnce(new TypeError('website-catalog-invalid'));
    const { loadWebsiteAppCatalog } = await import('./events-media-loader');
    await expect(loadWebsiteAppCatalog(new AbortController().signal)).rejects.toThrow(
      'website-catalog-invalid',
    );
    vi.mocked(readLocalJsonAsset).mockResolvedValueOnce({ bound: true });
    expect(await loadWebsiteAppCatalog(new AbortController().signal)).toBe(verifiedFixture);
    expect(readLocalJsonAsset).toHaveBeenCalledTimes(2);
  });
});
