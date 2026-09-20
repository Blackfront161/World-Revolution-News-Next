import snapshot from './data/production-events-media-v1.json';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProductionEventsMediaLoader } from '../../../../../packages/browser-content/src/events-media-loader';
import { readLocalJsonAsset } from '../../../../../packages/browser-content/src/local-json-asset';

vi.mock('../../../../../packages/browser-content/src/local-json-asset', () => ({
  readLocalJsonAsset: vi.fn(),
}));
const realDocument: unknown = snapshot;
beforeEach(() => vi.mocked(readLocalJsonAsset).mockReset());
afterEach(() => vi.useRealTimers());

describe('production metadata load lifetime and isolation', () => {
  it('validates all real metadata, caches only a successful client load, and isolates factories', async () => {
    vi.mocked(readLocalJsonAsset).mockResolvedValue(realDocument);
    const mobile = createProductionEventsMediaLoader('/mobile.json');
    const website = createProductionEventsMediaLoader('/website.json');
    const signal = new AbortController().signal;
    const result = await mobile(signal);
    expect([
      result.events.length,
      result.videos.length,
      result.episodes.length,
      result.sources.length,
    ]).toEqual([5610, 13, 842, 51]);
    expect(await mobile(signal)).toBe(result);
    expect(readLocalJsonAsset).toHaveBeenCalledTimes(1);
    await website(signal);
    expect(readLocalJsonAsset).toHaveBeenCalledTimes(2);
    const cancelled = new AbortController();
    cancelled.abort();
    await expect(mobile(cancelled.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(readLocalJsonAsset).toHaveBeenCalledTimes(2);
  });
  it('invalid metadata never poisons the success cache and a later retry can succeed', async () => {
    vi.mocked(readLocalJsonAsset)
      .mockResolvedValueOnce({ events: [] })
      .mockResolvedValueOnce(realDocument);
    const load = createProductionEventsMediaLoader('/events.json');
    const signal = new AbortController().signal;
    await expect(load(signal)).rejects.toThrow('events-media-invalid');
    expect((await load(signal)).events).toHaveLength(5610);
    expect(readLocalJsonAsset).toHaveBeenCalledTimes(2);
  });
  it('a late response after caller abort cannot fill the client cache', async () => {
    let finish!: (value: unknown) => void;
    vi.mocked(readLocalJsonAsset)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce(realDocument);
    const load = createProductionEventsMediaLoader('/events.json');
    const controller = new AbortController();
    const pending = load(controller.signal);
    controller.abort();
    finish(realDocument);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await load(new AbortController().signal);
    expect(readLocalJsonAsset).toHaveBeenCalledTimes(2);
  });
  it('a stalled transport is aborted at ten seconds and remains retryable', async () => {
    vi.useFakeTimers();
    vi.mocked(readLocalJsonAsset)
      .mockImplementationOnce(
        (_url, signal) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
          }),
      )
      .mockResolvedValueOnce(realDocument);
    const load = createProductionEventsMediaLoader('/events.json');
    const pending = expect(load(new AbortController().signal)).rejects.toMatchObject({
      name: 'TimeoutError',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await pending;
    expect((await load(new AbortController().signal)).events).toHaveLength(5610);
    expect(vi.getTimerCount()).toBe(0);
  });
});
