import { describe, expect, it, vi } from 'vitest';

import {
  composeCloudflarePodcastPorts,
  createCloudflareQuotaPort,
  createPrivateExpiryRevocationPort,
  createPrivateLeaseRecoveryPort,
  createPrivateR2Ports,
} from '../src/cloudflare-runtime.js';
import { createPodcastHttpRuntime } from '../src/http-runtime.js';

describe('podcast Cloudflare composition', () => {
  it('keeps audio out of KV and writes only private finite R2 objects', async () => {
    const put = vi.fn(async () => undefined);
    const deletion = vi.fn(async () => undefined);
    const head = vi.fn(async () => ({
      size: 1,
      customMetadata: { operationId: '11111111-1111-4111-8111-111111111111', actualBytes: '1' },
    }));
    const ports = createPrivateR2Ports({ put, head, delete: deletion });
    await ports.storage.putPrivate(
      {
        key: `wrn:podcast:v1:${'a'.repeat(64)}`,
        bytes: new Uint8Array([1]),
        sha256: 'b'.repeat(64),
        contentType: 'audio/mpeg',
        articleId: 'article-1',
        articleRevision: 'r1',
        mode: 'short',
        voiceId: 'en-US-AriaNeural',
        operationId: '11111111-1111-4111-8111-111111111111',
        actualBytes: 1,
        expiresAt: '2026-10-01T00:00:00.000Z',
      },
      { signal: new AbortController().signal, mayCommit: () => true },
    );
    expect(put).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Uint8Array),
      expect.objectContaining({
        httpMetadata: { contentType: 'audio/mpeg', cacheControl: 'private, no-store' },
      }),
    );
    await ports.deletion.deletePrivate(`wrn:podcast:v1:${'a'.repeat(64)}`, {
      signal: new AbortController().signal,
    });
    expect(deletion).toHaveBeenCalledTimes(1);
    const beginStorageDelete = vi.fn(async () => 'proceed' as const);
    const completeStorageDelete = vi.fn(async () => 'released' as const);
    const expiry = createPrivateExpiryRevocationPort(
      { put, head, delete: deletion },
      {
        acquire: vi.fn(),
        beginDispatch: vi.fn(),
        beginStorageCommit: vi.fn(),
        releaseDefinitePreDispatch: vi.fn(),
        beginStorageDelete,
        completeStorageDelete,
      },
    );
    await expiry.deleteExpiredOrRevoked(
      {
        key: `wrn:podcast:v1:${'a'.repeat(64)}`,
        operationId: '11111111-1111-4111-8111-111111111111',
        actualBytes: 1,
      },
      { signal: new AbortController().signal },
    );
    expect(beginStorageDelete).toHaveBeenCalledWith({
      leaseKey: `wrn:podcast:v1:${'a'.repeat(64)}`,
      operationId: '11111111-1111-4111-8111-111111111111',
      actualBytes: 1,
    });
    expect(completeStorageDelete).toHaveBeenCalledTimes(1);
    const wrongBegin = vi.fn(async () => 'proceed' as const);
    const wrongComplete = vi.fn(async () => 'released' as const);
    const mismatched = createPrivateExpiryRevocationPort(
      {
        put,
        head: vi.fn(async () => ({
          size: 1,
          customMetadata: { operationId: 'other', actualBytes: '1' },
        })),
        delete: deletion,
      },
      {
        acquire: vi.fn(),
        beginDispatch: vi.fn(),
        beginStorageCommit: vi.fn(),
        releaseDefinitePreDispatch: vi.fn(),
        beginStorageDelete: wrongBegin,
        completeStorageDelete: wrongComplete,
      },
    );
    await expect(
      mismatched.deleteExpiredOrRevoked(
        {
          key: `wrn:podcast:v1:${'a'.repeat(64)}`,
          operationId: '11111111-1111-4111-8111-111111111111',
          actualBytes: 1,
        },
        { signal: new AbortController().signal },
      ),
    ).rejects.toThrow('unavailable');
    expect(wrongBegin).not.toHaveBeenCalled();
    expect(wrongComplete).not.toHaveBeenCalled();
    expect(composeCloudflarePodcastPorts({}).cache).toEqual({
      enabled: false,
      reason: 'audio-not-cached-in-kv',
    });
    expect(
      composeCloudflarePodcastPorts({
        PODCAST_PRIVATE_BUCKET: { put, head, delete: deletion },
        PODCAST_QUOTA: { getByName: vi.fn(() => ({ fetch: vi.fn() })) },
      }).recovery,
    ).toBeDefined();
  });

  it('uses the Durable Object fetch contract and resolves a lost committed acquire response', async () => {
    let committedOperation = '';
    const fetch = vi.fn(async (request: Request) => {
      const body = (await request.clone().json()) as { reservation: { operationId: string } };
      if (committedOperation === '') {
        committedOperation = body.reservation.operationId;
        throw new Error('response lost after commit');
      }
      return new Response(
        JSON.stringify({
          status: body.reservation.operationId === committedOperation ? 'leader' : 'ambiguous',
        }),
        { status: 200 },
      );
    });
    const quota = createCloudflareQuotaPort({ getByName: vi.fn(() => ({ fetch })) });
    await expect(
      quota.acquire(
        {
          sharedResourceId: 'azure-speech-f0-shared-podcast-v1',
          operationId: '11111111-1111-4111-8111-111111111111',
          leaseKey: `wrn:podcast:v1:${'a'.repeat(64)}`,
          utf16CodeUnits: 1,
          storageBytes: 1,
        },
        { signal: new AbortController().signal },
      ),
    ).resolves.toBe('leader');
    expect(fetch).toHaveBeenCalledTimes(2);
    const request = vi.mocked(fetch).mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect(new URL((request as Request).url).pathname).toBe('/acquire');
  });

  it('reconciles a lost storage-commit response before any R2 write', async () => {
    let committed = false;
    const fetch = vi.fn(async (request: Request) => {
      expect(new URL(request.url).pathname).toBe('/begin-storage-commit');
      if (!committed) {
        committed = true;
        throw new Error('response lost after storage barrier commit');
      }
      return new Response(JSON.stringify({ status: 'committed' }), { status: 200 });
    });
    const quota = createCloudflareQuotaPort({ getByName: vi.fn(() => ({ fetch })) });
    const reservation = {
      sharedResourceId: 'azure-speech-f0-shared-podcast-v1',
      operationId: '11111111-1111-4111-8111-111111111111',
      leaseKey: `wrn:podcast:v1:${'a'.repeat(64)}`,
      utf16CodeUnits: 1,
      storageBytes: 1,
    };
    await expect(
      quota.beginStorageCommit(reservation, { signal: new AbortController().signal }),
    ).resolves.toBe('proceed');
    expect(fetch).toHaveBeenCalledTimes(2);
    for (const [call] of vi.mocked(fetch).mock.calls)
      await expect(call.clone().json()).resolves.toEqual({ reservation });
  });

  it('retries an exact prepared deletion after R2 is gone and does not hide release failure', async () => {
    const key = `wrn:podcast:v1:${'a'.repeat(64)}`;
    const operationId = '11111111-1111-4111-8111-111111111111';
    let objectPresent = true;
    const bucket = {
      put: vi.fn(async () => undefined),
      head: vi.fn(async () =>
        objectPresent ? { size: 1, customMetadata: { operationId, actualBytes: '1' } } : null,
      ),
      delete: vi.fn(async () => {
        objectPresent = false;
      }),
    };
    let completeCalls = 0;
    const fetch = vi.fn(async (request: Request) => {
      const path = new URL(request.url).pathname;
      if (path === '/begin-storage-delete')
        return new Response(JSON.stringify({ status: 'proceed' }), { status: 200 });
      if (path === '/complete-storage-delete') {
        completeCalls += 1;
        if (completeCalls === 1) throw new Error('release response lost');
        return new Response(JSON.stringify({ status: 'released' }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    });
    const expiry = createPrivateExpiryRevocationPort(
      bucket,
      createCloudflareQuotaPort({ getByName: vi.fn(() => ({ fetch })) }),
    );
    const value = { key, operationId, actualBytes: 1 };
    await expect(
      expiry.deleteExpiredOrRevoked(value, { signal: new AbortController().signal }),
    ).rejects.toThrow('release response lost');
    expect(bucket.delete).toHaveBeenCalledTimes(1);

    await expect(
      expiry.deleteExpiredOrRevoked(value, { signal: new AbortController().signal }),
    ).resolves.toBeUndefined();
    expect(bucket.head).toHaveBeenCalledTimes(2);
    expect(bucket.delete).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls.map(([request]) => new URL(request.url).pathname)).toEqual([
      '/begin-storage-delete',
      '/complete-storage-delete',
      '/complete-storage-delete',
    ]);
  });

  it('exposes bounded exact expired-lease discovery through the internal quota port', async () => {
    const reservation = {
      sharedResourceId: 'azure-speech-f0-shared-podcast-v1',
      operationId: '11111111-1111-4111-8111-111111111111',
      leaseKey: `wrn:podcast:v1:${'a'.repeat(64)}`,
      utf16CodeUnits: 1,
      storageBytes: 1,
    };
    const fetch = vi.fn(async (request: Request) => {
      expect(new URL(request.url).pathname).toBe('/recover-expired-leases');
      return new Response(
        JSON.stringify({
          releasedPreDispatch: 1,
          releasedPostDispatchStorage: 0,
          reviewRequired: [reservation],
        }),
        { status: 200 },
      );
    });
    const quota = createCloudflareQuotaPort({ getByName: vi.fn(() => ({ fetch })) });
    await expect(quota.recoverExpiredLeases?.(10)).resolves.toEqual({
      releasedPreDispatch: 1,
      releasedPostDispatchStorage: 0,
      reviewRequired: [reservation],
    });
  });

  it('provides an R2-bound recovery operation for an exact ambiguous lease', async () => {
    const reservation = {
      sharedResourceId: 'azure-speech-f0-shared-podcast-v1',
      operationId: '11111111-1111-4111-8111-111111111111',
      leaseKey: `wrn:podcast:v1:${'a'.repeat(64)}`,
      utf16CodeUnits: 1,
      storageBytes: 25 * 1024 * 1024,
    };
    const releaseAmbiguousStorageAfterNoObject = vi.fn(
      async () => 'released-post-dispatch-storage' as const,
    );
    const recovery = createPrivateLeaseRecoveryPort(
      {
        put: vi.fn(),
        head: vi.fn(async () => null),
        delete: vi.fn(),
      },
      {
        acquire: vi.fn(),
        beginDispatch: vi.fn(),
        beginStorageCommit: vi.fn(),
        releaseDefinitePreDispatch: vi.fn(),
        recoverExpiredLeases: vi.fn(async () => ({
          releasedPreDispatch: 0,
          releasedPostDispatchStorage: 0,
          reviewRequired: [reservation],
        })),
        releaseAmbiguousStorageAfterNoObject,
      },
    );
    await expect(
      recovery.recoverExpired(10, { signal: new AbortController().signal }),
    ).resolves.toEqual({
      releasedPreDispatch: 0,
      releasedPostDispatchStorage: 0,
      reconciledAmbiguous: 1,
      reviewRequired: [],
    });
    expect(releaseAmbiguousStorageAfterNoObject).toHaveBeenCalledWith(reservation);
  });

  it('enforces origin, auth, media type, bounded JSON and never reflects an untrusted origin', async () => {
    const generate = vi.fn(async (value: unknown) =>
      typeof value === 'object' && value !== null && 'text' in value
        ? { status: 'failed' as const }
        : {
            status: 'generated' as const,
            cacheKey: `wrn:podcast:v1:${'a'.repeat(64)}`,
            audioSha256: 'a'.repeat(64),
            privateAudio: {
              key: `wrn:podcast:v1:${'a'.repeat(64)}`,
              articleId: 'article-1',
              articleRevision: 'r1',
              mode: 'short' as const,
              voiceId: 'en-US-AriaNeural',
            },
          },
    );
    const issue = vi.fn(async () => ({
      token: 'a'.repeat(24),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }));
    const read = vi.fn(async () => ({
      bytes: new Uint8Array([1, 2]),
      contentType: 'audio/mpeg' as const,
    }));
    const runtime = createPodcastHttpRuntime({
      allowedOrigins: new Set(['https://app.wrn.invalid']),
      authenticator: { authenticate: vi.fn(async () => true) },
      service: { generate },
      privateAudio: { issue, read },
    });
    await expect(
      runtime(
        new Request('https://worker.invalid/v1/podcasts', {
          method: 'POST',
          headers: { origin: 'https://bad.invalid', 'content-type': 'application/json' },
          body: '{}',
        }),
      ),
    ).resolves.toMatchObject({ status: 403 });
    const response = await runtime(
      new Request('https://worker.invalid/v1/podcasts', {
        method: 'POST',
        headers: { origin: 'https://app.wrn.invalid', 'content-type': 'application/json' },
        body: JSON.stringify({
          articleId: 'article-1',
          mode: 'short',
          language: 'en',
          voiceId: 'en-US-AriaNeural',
          text: 'rejected later by service',
        }),
      }),
    );
    expect(response.status).toBe(503);
    expect(response.headers.get('access-control-allow-origin')).toBe('https://app.wrn.invalid');
    expect(generate).toHaveBeenCalledTimes(1);

    const accepted = await runtime(
      new Request('https://worker.invalid/v1/podcasts', {
        method: 'POST',
        headers: { origin: 'https://app.wrn.invalid', 'content-type': 'application/json' },
        body: JSON.stringify({
          articleId: 'article-1',
          mode: 'short',
          language: 'en',
          voiceId: 'en-US-AriaNeural',
        }),
      }),
    );
    expect(accepted.status).toBe(202);
    await expect(accepted.json()).resolves.toMatchObject({
      audioPath: `/v1/podcasts/audio/${'a'.repeat(24)}`,
    });
    const audio = await runtime(
      new Request(`https://worker.invalid/v1/podcasts/audio/${'a'.repeat(24)}`, {
        headers: { origin: 'https://app.wrn.invalid' },
      }),
    );
    expect(audio.status).toBe(200);
    expect(audio.headers.get('cache-control')).toBe('private, no-store');
    expect(read).toHaveBeenCalledWith('a'.repeat(24), expect.anything());

    vi.mocked(issue).mockResolvedValueOnce({
      token: 'b'.repeat(24),
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    await expect(
      runtime(
        new Request('https://worker.invalid/v1/podcasts', {
          method: 'POST',
          headers: { origin: 'https://app.wrn.invalid', 'content-type': 'application/json' },
          body: JSON.stringify({
            articleId: 'article-1',
            mode: 'short',
            language: 'en',
            voiceId: 'en-US-AriaNeural',
          }),
        }),
      ),
    ).resolves.toMatchObject({ status: 503 });

    const preflight = await runtime(
      new Request('https://worker.invalid/v1/podcasts', {
        method: 'OPTIONS',
        headers: {
          origin: 'https://app.wrn.invalid',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type',
        },
      }),
    );
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-methods')).toBe('POST');
    expect(preflight.headers.get('access-control-allow-headers')).toBe('content-type');
    expect(preflight.headers.get('vary')).toBe('Origin');
    await expect(
      runtime(
        new Request('https://worker.invalid/v1/podcasts', {
          method: 'OPTIONS',
          headers: {
            origin: 'https://app.wrn.invalid',
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'content-type, authorization',
          },
        }),
      ),
    ).resolves.toMatchObject({ status: 405 });
  });
});
