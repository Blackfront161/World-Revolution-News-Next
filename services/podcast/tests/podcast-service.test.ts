import { describe, expect, it, vi } from 'vitest';

import {
  PodcastAzureAdapterError,
  PodcastDefinitePreDispatchFailure,
} from '../src/azure-speech-adapter.js';
import {
  disabledPodcastRuntimeConfiguration,
  type PodcastAuthorization,
  type PodcastCacheEntry,
  type PodcastServicePorts,
} from '../src/contracts.js';
import { createPodcastService } from '../src/service.js';

const request = {
  articleId: 'article-1',
  mode: 'short' as const,
  language: 'en' as const,
  voiceId: 'en-US-AriaNeural',
};
const allowed: PodcastAuthorization = {
  allowed: true,
  articleId: 'article-1',
  articleRevision: 'r1',
};

function portsFor(): PodcastServicePorts & {
  calls: string[];
  cacheEntries: Map<string, PodcastCacheEntry>;
} {
  const calls: string[] = [];
  const cacheEntries = new Map<string, PodcastCacheEntry>();
  const gate = () => ({ authorize: vi.fn(async () => allowed) });
  return {
    calls,
    cacheEntries,
    configuration: {
      ...disabledPodcastRuntimeConfiguration,
      enabled: true,
      resourceVerification: 'verified',
    },
    clock: { now: () => new Date('2026-09-20T00:00:00.000Z') },
    canonicalArticles: {
      resolve: vi.fn(async () => ({
        id: 'article-1',
        revision: 'r1',
        textLanguage: 'en' as const,
        title: 'Canonical title',
        approvedShortText: 'Approved short text.',
        approvedFullText: 'Approved full text.',
      })),
    },
    admission: gate(),
    consent: gate(),
    rights: gate(),
    moderation: gate(),
    cache: {
      get: vi.fn(async (key) => cacheEntries.get(key) ?? null),
      put: vi.fn(async (key, entry) => {
        cacheEntries.set(key, entry);
      }),
    },
    quota: {
      acquire: vi.fn(async (value) => {
        calls.push(`acquire:${value.sharedResourceId}`);
        return 'leader' as const;
      }),
      beginDispatch: vi.fn(async () => 'proceed' as const),
      beginStorageCommit: vi.fn(async () => 'proceed' as const),
      releaseDefinitePreDispatch: vi.fn(async () => {
        calls.push('release');
      }),
    },
    storage: {
      putPrivate: vi.fn(async () => {
        calls.push('store');
      }),
    },
    synthesis: {
      synthesize: vi.fn(async () => {
        calls.push('synthesize');
        return new Uint8Array([1, 2, 3]);
      }),
    },
  };
}

describe('podcast service', () => {
  it('is disabled by default without resolving any article or provider', async () => {
    const ports = portsFor();
    (ports as { configuration: typeof disabledPodcastRuntimeConfiguration }).configuration =
      disabledPodcastRuntimeConfiguration;
    await expect(createPodcastService(ports).generate(request)).resolves.toEqual({
      status: 'disabled',
    });
    expect(ports.canonicalArticles.resolve).not.toHaveBeenCalled();
    expect(ports.synthesis.synthesize).not.toHaveBeenCalled();
  });

  it('rejects non-admission before cache, quota, provider and storage', async () => {
    const ports = portsFor();
    vi.mocked(ports.rights.authorize).mockResolvedValueOnce({ allowed: false, reason: 'missing' });
    await expect(createPodcastService(ports).generate(request)).resolves.toEqual({
      status: 'not-admitted',
    });
    expect(ports.cache.get).not.toHaveBeenCalled();
    expect(ports.quota.acquire).not.toHaveBeenCalled();
    expect(ports.synthesis.synthesize).not.toHaveBeenCalled();
    expect(ports.storage.putPrivate).not.toHaveBeenCalled();
  });

  it.each([
    { ...request, text: 'browser supplied text' },
    { ...request, url: 'https://invalid.example/article' },
  ])(
    'rejects an extra browser-controlled field before resolving or dispatching',
    async (untrusted) => {
      const ports = portsFor();
      await expect(createPodcastService(ports).generate(untrusted)).resolves.toEqual({
        status: 'failed',
      });
      expect(ports.canonicalArticles.resolve).not.toHaveBeenCalled();
      expect(ports.quota.acquire).not.toHaveBeenCalled();
      expect(ports.synthesis.synthesize).not.toHaveBeenCalled();
    },
  );

  it('uses only canonical approved text and binds the generated key to revision, text, mode and voice', async () => {
    const ports = portsFor();
    const service = createPodcastService(ports);
    const first = await service.generate(request);
    const second = await service.generate(request);
    const changed = await service.generate({ ...request, voiceId: 'en-US-GuyNeural' });
    expect(first).toMatchObject({ status: 'generated' });
    expect(second).toMatchObject({
      status: 'cached',
      cacheKey: first.status === 'generated' ? first.cacheKey : '',
    });
    expect(changed).toMatchObject({ status: 'generated' });
    expect(ports.synthesis.synthesize).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Approved short text.', title: 'Canonical title' }),
      expect.anything(),
    );
    expect(ports.calls.filter((value) => value === 'synthesize')).toHaveLength(2);
  });

  it('requires admitted full text and never creates a summary fallback', async () => {
    const ports = portsFor();
    vi.mocked(ports.canonicalArticles.resolve).mockResolvedValueOnce({
      id: 'article-1',
      revision: 'r1',
      textLanguage: 'en',
      title: 'Canonical title',
      approvedShortText: 'Approved short text.',
      approvedFullText: null,
    });
    await expect(
      createPodcastService(ports).generate({ ...request, mode: 'full' }),
    ).resolves.toEqual({ status: 'not-admitted' });
    expect(ports.synthesis.synthesize).not.toHaveBeenCalled();
  });

  it('never releases characters after the dispatch fence has committed', async () => {
    const ports = portsFor();
    vi.mocked(ports.synthesis.synthesize).mockRejectedValueOnce(
      new PodcastDefinitePreDispatchFailure(),
    );
    await expect(createPodcastService(ports).generate(request)).resolves.toEqual({
      status: 'failed',
    });
    expect(ports.quota.releaseDefinitePreDispatch).not.toHaveBeenCalled();
    vi.mocked(ports.synthesis.synthesize).mockRejectedValueOnce(new PodcastAzureAdapterError());
    await expect(createPodcastService(ports).generate(request)).resolves.toEqual({
      status: 'failed',
    });
    expect(ports.quota.releaseDefinitePreDispatch).not.toHaveBeenCalled();
  });

  it('rechecks all gates after synthesis and does not store revoked output', async () => {
    const ports = portsFor();
    vi.mocked(ports.moderation.authorize)
      .mockResolvedValueOnce(allowed)
      .mockResolvedValueOnce(allowed)
      .mockResolvedValueOnce({ allowed: false, reason: 'revoked' });
    await expect(createPodcastService(ports).generate(request)).resolves.toEqual({
      status: 'not-admitted',
    });
    expect(ports.synthesis.synthesize).toHaveBeenCalledTimes(1);
    expect(ports.storage.putPrivate).not.toHaveBeenCalled();
    expect(ports.cache.put).not.toHaveBeenCalled();
  });

  it('does not turn a newly denied cache hit into quota or provider work', async () => {
    const ports = portsFor();
    const service = createPodcastService(ports);
    await expect(service.generate(request)).resolves.toMatchObject({ status: 'generated' });
    vi.mocked(ports.consent.authorize)
      .mockResolvedValueOnce(allowed)
      .mockResolvedValueOnce({ allowed: false, reason: 'revoked' });
    const quotaCalls = vi.mocked(ports.quota.acquire).mock.calls.length;
    const synthesisCalls = vi.mocked(ports.synthesis.synthesize).mock.calls.length;
    await expect(service.generate(request)).resolves.toEqual({ status: 'not-admitted' });
    expect(ports.quota.acquire).toHaveBeenCalledTimes(quotaCalls);
    expect(ports.synthesis.synthesize).toHaveBeenCalledTimes(synthesisCalls);
    expect(ports.storage.putPrivate).toHaveBeenCalledTimes(1);
  });

  it('fails closed before synthesis when resource verification is absent', async () => {
    const ports = portsFor();
    (ports as { configuration: typeof ports.configuration }).configuration = {
      ...ports.configuration,
      resourceVerification: 'unverified',
    };
    await expect(createPodcastService(ports).generate(request)).resolves.toEqual({
      status: 'unavailable',
    });
    expect(ports.canonicalArticles.resolve).not.toHaveBeenCalled();
  });

  it('rejects already-aborted, malformed, and language-mismatched inputs before synthesis', async () => {
    const ports = portsFor();
    const caller = new AbortController();
    caller.abort();
    await expect(createPodcastService(ports).generate(request, caller.signal)).resolves.toEqual({
      status: 'failed',
    });
    await expect(
      createPodcastService(ports).generate({ ...request, mode: 'unknown' as 'short' }),
    ).resolves.toEqual({ status: 'failed' });
    vi.mocked(ports.canonicalArticles.resolve).mockResolvedValueOnce({
      id: 'article-1',
      revision: 'r1',
      textLanguage: 'de',
      title: 'Kanonisch',
      approvedShortText: 'Freigegebener Text.',
      approvedFullText: null,
    });
    await expect(createPodcastService(ports).generate(request)).resolves.toEqual({
      status: 'not-admitted',
    });
    expect(ports.synthesis.synthesize).not.toHaveBeenCalled();
  });

  it('asks the canonical resolver for the requested approved language and mode', async () => {
    const ports = portsFor();
    await expect(
      createPodcastService(ports).generate({
        ...request,
        language: 'de',
        voiceId: 'de-DE-KatjaNeural',
      }),
    ).resolves.toEqual({ status: 'not-admitted' });
    expect(ports.canonicalArticles.resolve).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ language: 'de', mode: 'short' }),
    );
  });

  it('coalesces identical concurrent cache misses into one reservation and synthesis attempt', async () => {
    const ports = portsFor();
    let complete: ((audio: Uint8Array) => void) | undefined;
    vi.mocked(ports.synthesis.synthesize).mockImplementationOnce(
      async () =>
        new Promise<Uint8Array>((resolve) => {
          complete = resolve;
        }),
    );
    const service = createPodcastService(ports);
    const first = service.generate(request);
    await vi.waitFor(() => expect(ports.synthesis.synthesize).toHaveBeenCalledTimes(1));
    const second = service.generate(request);
    await vi.waitFor(() => expect(ports.cache.get).toHaveBeenCalledTimes(2));
    complete?.(new Uint8Array([1, 2, 3]));
    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ status: 'generated' }),
      expect.objectContaining({ status: 'generated' }),
    ]);
    expect(ports.quota.acquire).toHaveBeenCalledTimes(1);
    expect(ports.synthesis.synthesize).toHaveBeenCalledTimes(1);
  });

  it('uses the shared lease to prevent provider dispatch across two service instances', async () => {
    const firstPorts = portsFor();
    const secondPorts = portsFor();
    let heldLease = '';
    const sharedQuota: PodcastServicePorts['quota'] = {
      acquire: vi.fn(async (value) => {
        if (heldLease === '') {
          heldLease = value.leaseKey;
          return 'leader';
        }
        return heldLease === value.leaseKey ? 'busy' : 'denied';
      }),
      beginDispatch: vi.fn(async () => 'proceed' as const),
      beginStorageCommit: vi.fn(async () => 'proceed' as const),
      releaseDefinitePreDispatch: vi.fn(async () => undefined),
    };
    let complete: ((audio: Uint8Array) => void) | undefined;
    const sharedSynthesis: PodcastServicePorts['synthesis'] = {
      synthesize: vi.fn(
        async () =>
          new Promise<Uint8Array>((resolve) => {
            complete = resolve;
          }),
      ),
    };
    (firstPorts as { quota: PodcastServicePorts['quota'] }).quota = sharedQuota;
    (secondPorts as { quota: PodcastServicePorts['quota'] }).quota = sharedQuota;
    (firstPorts as { synthesis: PodcastServicePorts['synthesis'] }).synthesis = sharedSynthesis;
    (secondPorts as { synthesis: PodcastServicePorts['synthesis'] }).synthesis = sharedSynthesis;

    const first = createPodcastService(firstPorts).generate(request);
    await vi.waitFor(() => expect(sharedSynthesis.synthesize).toHaveBeenCalledTimes(1));
    await expect(createPodcastService(secondPorts).generate(request)).resolves.toEqual({
      status: 'unavailable',
    });
    complete?.(new Uint8Array([1, 2, 3]));
    await expect(first).resolves.toMatchObject({ status: 'generated' });
    expect(sharedQuota.acquire).toHaveBeenCalledTimes(2);
    expect(sharedSynthesis.synthesize).toHaveBeenCalledTimes(1);
  });

  it('releases an acquired lease when the caller aborts after the commit response', async () => {
    const ports = portsFor();
    const caller = new AbortController();
    vi.mocked(ports.quota.acquire).mockImplementationOnce(async () => {
      caller.abort();
      return 'leader';
    });
    await expect(createPodcastService(ports).generate(request, caller.signal)).resolves.toEqual({
      status: 'failed',
    });
    expect(ports.quota.releaseDefinitePreDispatch).toHaveBeenCalledTimes(1);
    expect(ports.quota.beginDispatch).not.toHaveBeenCalled();
    expect(ports.synthesis.synthesize).not.toHaveBeenCalled();
  });
});
