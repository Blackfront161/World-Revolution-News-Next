import { describe, expect, it, vi } from 'vitest';
import supportData from './data/legacy-support-v1.json';
import { validateMobileSupport } from '@wrn/content-contracts/mobile-support-v1';
import {
  defaultLoad,
  loadMobileSupport,
  resetMobileSupportLoadCacheForTest,
} from './support-loader.js';

describe('support loader', () => {
  it('cancels an oversized response stream and leaves a retry possible', async () => {
    resetMobileSupportLoadCacheForTest();
    const cancel = vi.fn();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(1024 * 1024 + 1));
      },
      cancel,
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(stream))
      .mockResolvedValueOnce(new Response(JSON.stringify(supportData)));
    vi.stubGlobal('fetch', fetchMock);
    try {
      await expect(defaultLoad(new AbortController().signal)).rejects.toThrow(
        'support-asset-too-large',
      );
      expect(cancel).toHaveBeenCalledOnce();
      expect(stream.locked).toBe(false);
      await expect(defaultLoad(new AbortController().signal)).resolves.toMatchObject({
        schema: 'wrn.mobile-support.v1',
      });
    } finally {
      vi.unstubAllGlobals();
      resetMobileSupportLoadCacheForTest();
    }
  });
  it('accepts the checked-in support snapshot before any route displays it', () => {
    const invalid = supportData.organizations
      .filter(
        (organization) =>
          !validateMobileSupport({
            ...supportData,
            organizations: [organization],
            personSources: [],
            persons: [],
          }).ok,
      )
      .map((organization) => organization.id);
    expect(invalid).toEqual([]);
    expect(validateMobileSupport(supportData)).toMatchObject({ ok: true, errors: [] });
  });
  it('validates a loaded document before it becomes available', async () => {
    const loaded = await loadMobileSupport(
      new AbortController().signal,
      vi.fn(async () => ({ schema: 'bad' })),
    );
    expect(loaded).toEqual({ kind: 'invalid' });
  });
  it('does not turn an aborted request into an error', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      loadMobileSupport(
        controller.signal,
        vi.fn(async () => ({})),
      ),
    ).resolves.toEqual({ kind: 'aborted' });
  });
  it('uses a bounded same-origin asset fetch and caches only a validated success', async () => {
    resetMobileSupportLoadCacheForTest();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(supportData), {
        status: 200,
        headers: { 'content-length': String(JSON.stringify(supportData).length) },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(defaultLoad(new AbortController().signal)).resolves.toMatchObject({
      schema: 'wrn.mobile-support.v1',
    });
    await expect(defaultLoad(new AbortController().signal)).resolves.toMatchObject({
      sourceCommit: supportData.sourceCommit,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const requestUrl = fetchMock.mock.calls[0]?.[0];
    expect(requestUrl).toBeInstanceOf(URL);
    expect((requestUrl as URL).origin).toBe(location.origin);
    vi.unstubAllGlobals();
    resetMobileSupportLoadCacheForTest();
  });
  it('rejects a declared oversize asset before JSON parsing and permits a later retry', async () => {
    resetMobileSupportLoadCacheForTest();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('{}', {
          status: 200,
          headers: { 'content-length': String(1024 * 1024 + 1) },
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(supportData), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadMobileSupport(new AbortController().signal, defaultLoad)).resolves.toEqual({
      kind: 'error',
    });
    await expect(
      loadMobileSupport(new AbortController().signal, defaultLoad),
    ).resolves.toMatchObject({
      kind: 'ready',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
    resetMobileSupportLoadCacheForTest();
  });
});
