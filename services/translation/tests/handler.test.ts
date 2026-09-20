import { describe, expect, it, vi } from 'vitest';
import type { TranslationAdapterIdentity } from '@wrn/api-contracts/translation-v1';

import {
  DefinitePreDispatchFailure,
  deriveTranslationCacheKey,
  handleTranslation,
  systemTranslationClock,
  type TranslationCacheEntry,
  type TranslationServicePorts,
  type TranslationUpstreamResult,
} from '../src/handler.js';
import worker, { createTranslationWorkerFetch } from '../src/index.js';

const request = {
  contractVersion: '1.0.0',
  mode: 'paragraph',
  sourceLanguage: 'en',
  targetLanguage: 'de',
  text: 'Exact public paragraph.',
} as const;
const adapter = { id: 'legacy-compat', version: 'v1', provider: 'verified-provider' } as const;

function upstreamResult(
  text: string,
  resultAdapter: TranslationAdapterIdentity = adapter,
): TranslationUpstreamResult {
  return {
    contractVersion: '1.0.0',
    mode: 'paragraph',
    sourceLanguage: 'en',
    targetLanguage: 'de',
    translation: { text },
    adapter: resultAdapter,
    attempts: 1,
  };
}

function portsFor(overrides: Partial<TranslationServicePorts> = {}): TranslationServicePorts & {
  readonly cacheEntries: Map<string, unknown>;
  readonly calls: {
    readonly read: number[];
    readonly provider: number[];
    readonly write: number[];
    readonly releases: number[];
  };
} {
  const cacheEntries = new Map<string, unknown>();
  const calls = {
    read: [] as number[],
    provider: [] as number[],
    write: [] as number[],
    releases: [] as number[],
  };
  const cache = {
    get: vi.fn(async (key: string) => cacheEntries.get(key)),
    put: vi.fn(async (key: string, value: TranslationCacheEntry) => {
      cacheEntries.set(key, value);
    }),
  };
  const quota = (callsFor: number[]) => ({
    reserve: vi.fn(async ({ utf16CodeUnits }: { readonly utf16CodeUnits: number }) => {
      callsFor.push(utf16CodeUnits);
      return true;
    }),
    release: vi.fn(async ({ utf16CodeUnits }: { readonly utf16CodeUnits: number }) => {
      calls.releases.push(utf16CodeUnits);
    }),
  });
  return {
    configuration: {
      enabled: true,
      adapter,
      cacheTtlSeconds: 60,
      supportedSourceLanguages: ['en', 'ar'],
    },
    clock: systemTranslationClock,
    cache,
    readQuota: quota(calls.read),
    providerQuota: quota(calls.provider),
    writeQuota: quota(calls.write),
    upstream: {
      translate: vi.fn(async () => ({
        ...upstreamResult('Exakter übersetzter Absatz.'),
      })),
    },
    cacheEntries,
    calls,
    ...overrides,
  };
}

describe('target-owned translation handler', () => {
  it('rejects caller cache keys before any port I/O and derives different server keys', async () => {
    const ports = portsFor();
    const poisoned = await handleTranslation({ ...request, sharedCacheKey: 'a'.repeat(64) }, ports);
    expect(poisoned.status).toBe(400);
    expect(ports.calls.read).toEqual([]);
    expect(ports.calls.provider).toEqual([]);
    expect(await deriveTranslationCacheKey(request, adapter)).not.toBe(
      await deriveTranslationCacheKey({ ...request, text: 'Different public paragraph.' }, adapter),
    );
    expect(await deriveTranslationCacheKey(request, adapter)).not.toBe(
      await deriveTranslationCacheKey(request, { ...adapter, version: 'v2' }),
    );
  });

  it('uses translation:v2 only, accounts for a cache hit, and never dispatches upstream', async () => {
    const ports = portsFor();
    const first = await handleTranslation(request, ports);
    expect(first.status).toBe(200);
    if (first.status !== 200 || !('cache' in first.body))
      throw new Error('Expected a translation success.');
    expect(first.body.cache.status).toBe('miss');
    expect(ports.calls).toEqual({
      read: [0],
      provider: [request.text.length],
      write: [0],
      releases: [],
    });
    const second = await handleTranslation(request, ports);
    expect(second.status).toBe(200);
    if (second.status !== 200 || !('cache' in second.body))
      throw new Error('Expected a translation success.');
    expect(second.body.cache.status).toBe('hit');
    expect(ports.calls).toEqual({
      read: [0, 0],
      provider: [request.text.length],
      write: [0],
      releases: [],
    });
    expect(ports.cache.get).toHaveBeenCalledWith(
      expect.stringMatching(/^translation:v2:[a-f0-9]{64}$/),
      { signal: expect.any(AbortSignal) },
    );
    expect(ports.upstream.translate).toHaveBeenCalledTimes(1);
  });

  it('coalesces identical concurrent misses to one provider reservation and write', async () => {
    const ports = portsFor();
    let release!: () => void;
    let started!: () => void;
    let secondRead!: () => void;
    const upstreamStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const secondCacheRead = new Promise<void>((resolve) => {
      secondRead = resolve;
    });
    const upstreamReleased = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.spyOn(ports.upstream, 'translate').mockImplementation(async () => {
      started();
      await upstreamReleased;
      return upstreamResult('Exakter übersetzter Absatz.');
    });
    let cacheReads = 0;
    vi.spyOn(ports.cache, 'get').mockImplementation(async (key: string) => {
      cacheReads += 1;
      if (cacheReads === 2) secondRead();
      return ports.cacheEntries.get(key);
    });

    const first = handleTranslation(request, ports);
    const second = handleTranslation(request, ports);
    await Promise.all([upstreamStarted, secondCacheRead]);
    release();
    const results = await Promise.all([first, second]);

    expect(results.map((result) => result.status)).toEqual([200, 200]);
    expect(ports.upstream.translate).toHaveBeenCalledTimes(1);
    expect(ports.calls.provider).toEqual([request.text.length]);
    expect(ports.calls.write).toEqual([0]);
  });

  it('does not cancel the shared miss when one waiter aborts', async () => {
    const ports = portsFor();
    const caller = new AbortController();
    let release!: () => void;
    let secondRead!: () => void;
    const upstreamReleased = new Promise<void>((resolve) => {
      release = resolve;
    });
    const secondCacheRead = new Promise<void>((resolve) => {
      secondRead = resolve;
    });
    let cacheReads = 0;
    vi.spyOn(ports.cache, 'get').mockImplementation(async (key: string) => {
      cacheReads += 1;
      if (cacheReads === 2) secondRead();
      return ports.cacheEntries.get(key);
    });
    vi.spyOn(ports.upstream, 'translate').mockImplementation(async () => {
      await upstreamReleased;
      return upstreamResult('Exakter übersetzter Absatz.');
    });

    const first = handleTranslation(request, ports);
    const second = handleTranslation(request, ports, caller.signal);
    await secondCacheRead;
    caller.abort();
    await expect(second).resolves.toMatchObject({ status: 503 });
    release();

    await expect(first).resolves.toMatchObject({ status: 200 });
    expect(ports.upstream.translate).toHaveBeenCalledTimes(1);
    expect(ports.calls.provider).toEqual([request.text.length]);
    expect(ports.calls.write).toEqual([0]);
  });

  it('aborts the shared miss only after all waiters leave and allows a later retry', async () => {
    const ports = portsFor();
    const firstCaller = new AbortController();
    const secondCaller = new AbortController();
    let secondRead!: () => void;
    const secondCacheRead = new Promise<void>((resolve) => {
      secondRead = resolve;
    });
    let cacheReads = 0;
    vi.spyOn(ports.cache, 'get').mockImplementation(async (key: string) => {
      cacheReads += 1;
      if (cacheReads === 2) secondRead();
      return ports.cacheEntries.get(key);
    });
    let firstSignal: AbortSignal | undefined;
    let allowRetry = false;
    vi.spyOn(ports.upstream, 'translate').mockImplementation(async (_request, options) => {
      if (allowRetry) return upstreamResult('Retry succeeded.');
      firstSignal = options.signal;
      await new Promise<void>(() => {});
      return upstreamResult('Unreachable.');
    });

    const first = handleTranslation(request, ports, firstCaller.signal);
    const second = handleTranslation(request, ports, secondCaller.signal);
    await secondCacheRead;
    firstCaller.abort();
    secondCaller.abort();
    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ status: 503 }),
      expect.objectContaining({ status: 503 }),
    ]);
    expect(firstSignal?.aborted).toBe(true);
    expect(ports.cache.put).not.toHaveBeenCalled();

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    allowRetry = true;
    await expect(handleTranslation(request, ports)).resolves.toMatchObject({ status: 200 });
    expect(ports.upstream.translate).toHaveBeenCalledTimes(2);
    expect(ports.calls.write).toEqual([0]);
  });

  it('bounds 32 hanging misses, rejects the 33rd, then cleans up for a new miss', async () => {
    const ports = portsFor();
    const controllers = Array.from({ length: 33 }, () => new AbortController());
    let allowRetry = false;
    const signals: AbortSignal[] = [];
    vi.spyOn(ports.upstream, 'translate').mockImplementation(async (value, options) => {
      if (allowRetry) return upstreamResult(`Retry for ${value.text}.`);
      signals.push(options.signal);
      await new Promise<void>(() => {});
      return upstreamResult('Unreachable.');
    });
    const requests = controllers.map((_, index) => ({
      ...request,
      text: `Bounded miss ${index}.`,
    }));
    const pending = requests
      .slice(0, 32)
      .map((value, index) => handleTranslation(value, ports, controllers[index]!.signal));
    await vi.waitFor(() => expect(signals).toHaveLength(32));

    const thirtyThird = await handleTranslation(requests[32]!, ports, controllers[32]!.signal);
    expect(thirtyThird.status).toBe(503);
    expect(ports.calls.provider).toHaveLength(32);
    expect(ports.upstream.translate).toHaveBeenCalledTimes(32);

    controllers.slice(0, 32).forEach((controller) => controller.abort());
    await Promise.all(pending.slice(0, 32));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    allowRetry = true;
    await expect(
      handleTranslation({ ...request, text: 'After bounded cleanup.' }, ports),
    ).resolves.toMatchObject({ status: 200 });
    expect(ports.upstream.translate).toHaveBeenCalledTimes(33);
    expect(ports.calls.write).toEqual([0]);
  });

  it('keeps in-flight miss state isolated between distinct port objects', async () => {
    const firstPorts = portsFor();
    const secondPorts = portsFor();
    const results = await Promise.all([
      handleTranslation(request, firstPorts),
      handleTranslation(request, secondPorts),
    ]);
    expect(results.map((result) => result.status)).toEqual([200, 200]);
    expect(firstPorts.upstream.translate).toHaveBeenCalledTimes(1);
    expect(secondPorts.upstream.translate).toHaveBeenCalledTimes(1);
  });

  it('fails closed for corrupt or mismatched same-key cache records without repair', async () => {
    const ports = portsFor();
    const key = await deriveTranslationCacheKey(request, adapter);
    ports.cacheEntries.set(key, { schema: 'wrn.translation-cache-entry.v2' });
    const result = await handleTranslation(request, ports);
    expect(result.status).toBe(503);
    expect(ports.calls).toEqual({ read: [0], provider: [], write: [], releases: [] });
    expect(ports.cache.put).not.toHaveBeenCalled();
    expect(ports.upstream.translate).not.toHaveBeenCalled();
  });

  it('fails closed for expired, future, and digest-mismatched records under the derived key', async () => {
    const seed = portsFor();
    await handleTranslation(request, seed);
    const key = await deriveTranslationCacheKey(request, adapter);
    const stored = seed.cacheEntries.get(key) as TranslationCacheEntry;
    const cases: TranslationCacheEntry[] = [
      { ...stored, expiresAt: '1970-01-01T00:00:00.000Z' },
      { ...stored, createdAt: '2999-01-01T00:00:00.000Z' },
      { ...stored, translation: { ...stored.translation, textSha256: '0'.repeat(64) } },
    ];
    for (const entry of cases) {
      const ports = portsFor();
      ports.cacheEntries.set(key, entry);
      expect((await handleTranslation(request, ports)).status).toBe(503);
      expect(ports.upstream.translate).not.toHaveBeenCalled();
      expect(ports.cache.put).not.toHaveBeenCalled();
    }
  });

  it('keeps read, provider, and write quotas distinct', async () => {
    const readDenied = portsFor({ readQuota: { reserve: vi.fn(async () => false) } });
    expect((await handleTranslation(request, readDenied)).status).toBe(429);
    expect(readDenied.upstream.translate).not.toHaveBeenCalled();

    const providerDenied = portsFor({ providerQuota: { reserve: vi.fn(async () => false) } });
    expect((await handleTranslation(request, providerDenied)).status).toBe(429);
    expect(providerDenied.upstream.translate).not.toHaveBeenCalled();

    const writeDenied = portsFor({ writeQuota: { reserve: vi.fn(async () => false) } });
    expect((await handleTranslation(request, writeDenied)).status).toBe(429);
    expect(writeDenied.upstream.translate).toHaveBeenCalledTimes(1);
    expect(writeDenied.cache.put).not.toHaveBeenCalled();
  });

  it('permits a refund only for the explicit definite pre-dispatch failure', async () => {
    const ports = portsFor({
      upstream: { translate: vi.fn(async () => Promise.reject(new DefinitePreDispatchFailure())) },
    });
    const result = await handleTranslation(request, ports);
    expect(result.status).toBe(503);
    expect(ports.calls.releases).toEqual([request.text.length]);
    expect(ports.cache.put).not.toHaveBeenCalled();
  });

  it('rejects wrong provenance and HTML-like provider output without a write', async () => {
    const wrongProvider = portsFor({
      upstream: {
        translate: vi.fn(async () =>
          upstreamResult('Translated.', { ...adapter, provider: 'other' }),
        ),
      },
    });
    expect((await handleTranslation(request, wrongProvider)).status).toBe(503);
    expect(wrongProvider.cache.put).not.toHaveBeenCalled();

    const markup = portsFor({
      upstream: {
        translate: vi.fn(async () => upstreamResult('<p>Translated.</p>')),
      },
    });
    expect((await handleTranslation(request, markup)).status).toBe(503);
    expect(markup.cache.put).not.toHaveBeenCalled();

    const missingProvenance = portsFor({
      upstream: {
        translate: vi.fn(async () => upstreamResult('Translated.', { ...adapter, provider: '' })),
      },
    });
    expect((await handleTranslation(request, missingProvenance)).status).toBe(503);
    expect(missingProvenance.cache.put).not.toHaveBeenCalled();
  });

  it('aborts at the one 12-second deadline and performs no late write or retry', async () => {
    let deadline: (() => void) | undefined;
    let resolveLate: ((value: TranslationUpstreamResult) => void) | undefined;
    const ports = portsFor({
      clock: {
        now: () => new Date('2026-09-11T00:00:00.000Z'),
        setTimeout: (callback) => {
          deadline = callback;
          return 1;
        },
        clearTimeout: () => undefined,
      },
      upstream: {
        translate: vi.fn(
          () =>
            new Promise<TranslationUpstreamResult>((resolve) => {
              resolveLate = resolve;
            }),
        ),
      },
    });
    const pending = handleTranslation(request, ports);
    await vi.waitFor(() => expect(resolveLate).toBeTypeOf('function'));
    deadline?.();
    expect((await pending).status).toBe(504);
    resolveLate?.(upstreamResult('Late text.'));
    await Promise.resolve();
    expect(ports.cache.put).not.toHaveBeenCalled();
    expect(ports.upstream.translate).toHaveBeenCalledTimes(1);
  });

  it('rejects same-language input with zero quota, cache, or provider I/O', async () => {
    const ports = portsFor();
    expect((await handleTranslation({ ...request, targetLanguage: 'en' }, ports)).status).toBe(422);
    expect(ports.calls).toEqual({ read: [], provider: [], write: [], releases: [] });
  });

  it('fails closed while disabled before cache, quota, or provider work', async () => {
    const ports = portsFor({
      configuration: {
        enabled: false,
        adapter,
        cacheTtlSeconds: 60,
        supportedSourceLanguages: ['en'],
      },
    });
    expect((await handleTranslation(request, ports)).status).toBe(503);
    expect(ports.calls).toEqual({ read: [], provider: [], write: [], releases: [] });
    expect(ports.upstream.translate).not.toHaveBeenCalled();
  });
});

describe('independently reported translation corrections', () => {
  it('settles a stalled pre-provider port at the service deadline without starting later work', async () => {
    let deadline!: () => void;
    let enter!: () => void;
    const entered = new Promise<void>((resolve) => {
      enter = resolve;
    });
    let resume!: () => void;
    const blocked = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const ports = portsFor({
      clock: {
        now: () => new Date('2026-09-11T00:00:00.000Z'),
        setTimeout: (callback) => {
          deadline = callback;
          return 1;
        },
        clearTimeout: () => undefined,
      },
    });
    vi.spyOn(ports.readQuota, 'reserve').mockImplementation(async () => {
      enter();
      await blocked;
      return true;
    });
    const pending = handleTranslation(request, ports);
    await entered;
    deadline();
    expect((await pending).status).toBe(504);
    resume();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(ports.cache.get).not.toHaveBeenCalled();
    expect(ports.upstream.translate).not.toHaveBeenCalled();
    expect(ports.cache.put).not.toHaveBeenCalled();
  });

  it('fails closed for malformed switches, missing configuration and required ports', async () => {
    for (const enabled of ['false', 1, null, undefined]) {
      const ports = portsFor();
      const malformed = {
        ...ports,
        configuration: { ...ports.configuration, enabled },
      } as unknown as TranslationServicePorts;
      expect((await handleTranslation(request, malformed)).status).toBe(503);
      expect(ports.cache.get).not.toHaveBeenCalled();
      expect(ports.upstream.translate).not.toHaveBeenCalled();
    }
    for (const key of [
      'configuration',
      'clock',
      'cache',
      'readQuota',
      'providerQuota',
      'writeQuota',
      'upstream',
    ]) {
      const ports = portsFor();
      expect(
        (
          await handleTranslation(request, {
            ...ports,
            [key]: undefined,
          } as unknown as TranslationServicePorts)
        ).status,
      ).toBe(503);
      expect(ports.upstream.translate).not.toHaveBeenCalled();
    }
  });

  it('requires exactly true at all three quota boundaries', async () => {
    for (const name of ['readQuota', 'providerQuota', 'writeQuota'] as const) {
      for (const granted of ['granted', 1, {}]) {
        const ports = portsFor();
        const malformed = {
          ...ports,
          [name]: { reserve: vi.fn(async () => granted) },
        } as unknown as TranslationServicePorts;
        expect((await handleTranslation(request, malformed)).status).toBe(429);
        expect(ports.cache.put).not.toHaveBeenCalled();
        if (name !== 'writeQuota') expect(ports.upstream.translate).not.toHaveBeenCalled();
        if (name === 'readQuota') expect(ports.cache.get).not.toHaveBeenCalled();
      }
    }
  });

  it('accepts supported non-target source tags and rejects unsupported source tags before I/O', async () => {
    const ports = portsFor({
      upstream: {
        translate: vi.fn(async () => ({ ...upstreamResult('Übersetzt.'), sourceLanguage: 'ar' })),
      },
    });
    expect((await handleTranslation({ ...request, sourceLanguage: 'ar' }, ports)).status).toBe(200);
    expect((await handleTranslation({ ...request, sourceLanguage: 'ar' }, ports)).status).toBe(200);
    expect(ports.upstream.translate).toHaveBeenCalledTimes(1);
    for (const sourceLanguage of ['ja', 'und', 'AR', 'ar-u-ca-gregory', 'x-private', 'iw']) {
      const denied = portsFor();
      expect((await handleTranslation({ ...request, sourceLanguage }, denied)).status).toBe(422);
      expect(denied.cache.get).not.toHaveBeenCalled();
      expect(denied.upstream.translate).not.toHaveBeenCalled();
    }
  });

  it('allows output expansion through the UTF8 bound while bounding text and complete JSON independently', async () => {
    for (const text of ['a'.repeat(6000), 'a'.repeat(6001), 'a'.repeat(32768), '😀'.repeat(8192)]) {
      const ports = portsFor({ upstream: { translate: vi.fn(async () => upstreamResult(text)) } });
      expect((await handleTranslation(request, ports)).status).toBe(200);
      expect((await handleTranslation(request, ports)).status).toBe(200);
      expect(ports.upstream.translate).toHaveBeenCalledTimes(1);
    }
    for (const text of ['a'.repeat(32769), '😀'.repeat(8192) + 'a', '\\'.repeat(20000)]) {
      const ports = portsFor({ upstream: { translate: vi.fn(async () => upstreamResult(text)) } });
      expect((await handleTranslation(request, ports)).status).toBe(503);
      expect(ports.cache.put).not.toHaveBeenCalled();
    }
  });

  it('settles caller abort at every pending port and prevents subsequent or deferred cache commits', async () => {
    for (const phase of ['read', 'get', 'provider', 'upstream', 'write', 'put']) {
      const ports = portsFor();
      const controller = new AbortController();
      let entered!: () => void;
      let resume!: () => void;
      let receivedSignal: AbortSignal | undefined;
      const started = new Promise<void>((resolve) => {
        entered = resolve;
      });
      const paused = new Promise<void>((resolve) => {
        resume = resolve;
      });
      const pause = async (signal: AbortSignal) => {
        receivedSignal = signal;
        entered();
        await paused;
      };
      if (phase === 'read' || phase === 'provider' || phase === 'write') {
        const key =
          phase === 'read' ? 'readQuota' : phase === 'provider' ? 'providerQuota' : 'writeQuota';
        vi.spyOn(ports[key], 'reserve').mockImplementation(async (_reservation, options) => {
          await pause(options.signal);
          return true;
        });
      } else if (phase === 'get') {
        vi.spyOn(ports.cache, 'get').mockImplementation(async (_key, options) => {
          await pause(options.signal);
          return undefined;
        });
      } else if (phase === 'upstream') {
        vi.spyOn(ports.upstream, 'translate').mockImplementation(async (_request, options) => {
          await pause(options.signal);
          return upstreamResult('Late result.');
        });
      } else {
        vi.spyOn(ports.cache, 'put').mockImplementation(async (key, entry, _ttl, options) => {
          await pause(options.signal);
          if (options.mayCommit()) ports.cacheEntries.set(key, entry);
        });
      }
      const pending = handleTranslation(request, ports, controller.signal);
      await started;
      controller.abort();
      expect((await pending).status, phase).toBe(503);
      expect(receivedSignal?.aborted, phase).toBe(true);
      resume();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      expect(ports.cacheEntries.size, phase).toBe(0);
      expect(ports.calls.releases, phase).toEqual([]);
      if (phase !== 'put') expect(ports.cache.put).not.toHaveBeenCalled();
      if (['read', 'get', 'provider'].includes(phase))
        expect(ports.upstream.translate).not.toHaveBeenCalled();
    }
  });
});

describe('bounded disabled Worker adapter', () => {
  const originalRequest = (body: BodyInit, signal?: AbortSignal) =>
    new Request('https://translation.example/v1/translations', {
      method: 'POST',
      headers: { origin: 'https://app.example', 'content-type': 'application/json' },
      body,
      ...(signal ? { signal } : {}),
      ...(typeof body === 'string' ? {} : { duplex: 'half' }),
    });

  it('rejects malformed origin configuration before request work', async () => {
    for (const allowedOrigins of [
      undefined,
      null,
      '*',
      ['*'],
      ['null'],
      ['https://app.example/path'],
      [1],
      [],
    ]) {
      const ports = portsFor();
      const fetch = createTranslationWorkerFetch({
        allowedOrigins,
        service: ports,
      } as unknown as Parameters<typeof createTranslationWorkerFetch>[0]);
      expect((await fetch(originalRequest(JSON.stringify(request)))).status).toBe(503);
      expect(ports.cache.get).not.toHaveBeenCalled();
    }
  });

  it('maps throwing reads and throwing cancellation to safe errors without leaking text', async () => {
    const ports = portsFor();
    const fetch = createTranslationWorkerFetch({
      allowedOrigins: ['https://app.example'],
      service: ports,
    });
    const errored = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('PRIVATE BODY TEXT'));
      },
    });
    const failed = await fetch(originalRequest(errored));
    expect(failed.status).toBe(400);
    expect(await failed.text()).not.toContain('PRIVATE BODY TEXT');
    let cancelled = 0;
    const oversized = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(36865));
      },
      cancel() {
        cancelled++;
        throw new Error('PRIVATE CANCEL TEXT');
      },
    });
    const rejected = await fetch(originalRequest(oversized));
    expect(rejected.status).toBe(413);
    expect(await rejected.text()).not.toContain('PRIVATE CANCEL TEXT');
    expect(cancelled).toBe(1);
    expect(ports.cache.get).not.toHaveBeenCalled();
  });

  it('settles an aborted stalled body even when stream cancellation rejects', async () => {
    const ports = portsFor();
    const fetch = createTranslationWorkerFetch({
      allowedOrigins: ['https://app.example'],
      service: ports,
    });
    const controller = new AbortController();
    let cancelled = 0;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled++;
        throw new Error('Cancel failed');
      },
    });
    const pending = fetch(originalRequest(body, controller.signal));
    controller.abort();
    expect((await pending).status).toBe(503);
    expect(cancelled).toBe(1);
    expect(ports.cache.get).not.toHaveBeenCalled();
  });

  it('bounds a stalled body without caller cancellation', async () => {
    vi.useFakeTimers();
    try {
      const ports = portsFor();
      const fetch = createTranslationWorkerFetch({
        allowedOrigins: ['https://app.example'],
        service: ports,
      });
      const pending = fetch(originalRequest(new ReadableStream<Uint8Array>()));
      await vi.advanceTimersByTimeAsync(12000);
      expect((await pending).status).toBe(504);
      expect(ports.cache.get).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('propagates Worker caller cancellation after dispatch through to the provider and persistence fence', async () => {
    const ports = portsFor();
    const fetch = createTranslationWorkerFetch({
      allowedOrigins: ['https://app.example'],
      service: ports,
    });
    const caller = new AbortController();
    let started!: () => void;
    const dispatched = new Promise<void>((resolve) => {
      started = resolve;
    });
    let resume!: (value: TranslationUpstreamResult) => void;
    let providerSignal: AbortSignal | undefined;
    vi.spyOn(ports.upstream, 'translate').mockImplementation(
      (_request, options) =>
        new Promise((resolve) => {
          providerSignal = options.signal;
          resume = resolve;
          started();
        }),
    );
    const pending = fetch(originalRequest(JSON.stringify(request), caller.signal));
    await dispatched;
    caller.abort();
    expect((await pending).status).toBe(503);
    expect(providerSignal?.aborted).toBe(true);
    resume(upstreamResult('Late text.'));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(ports.cache.put).not.toHaveBeenCalled();
    expect(ports.calls.releases).toEqual([]);
  });

  it('stays disabled by default', async () => {
    const response = await worker.fetch(new Request('https://translation.example/v1/translations'));
    expect(response.status).toBe(503);
  });

  it('enforces CORS, method, headers, streaming bytes, and delegates only validated JSON', async () => {
    const ports = portsFor();
    const fetch = createTranslationWorkerFetch({
      allowedOrigins: ['https://app.example'],
      service: ports,
    });
    const denied = await fetch(
      new Request('https://translation.example/v1/translations', { method: 'POST' }),
    );
    expect(denied.status).toBe(503);
    const options = await fetch(
      new Request('https://translation.example/v1/translations', {
        method: 'OPTIONS',
        headers: { origin: 'https://app.example', 'access-control-request-method': 'POST' },
      }),
    );
    expect(options.status).toBe(204);
    const oldHeader = await fetch(
      new Request('https://translation.example/v1/translations', {
        method: 'POST',
        headers: {
          origin: 'https://app.example',
          'content-type': 'application/json',
          'x-wrn-cache-key': 'poison',
        },
        body: JSON.stringify(request),
      }),
    );
    expect(oldHeader.status).toBe(400);
    const bodyTooLarge = await fetch(
      new Request('https://translation.example/v1/translations', {
        method: 'POST',
        headers: { origin: 'https://app.example', 'content-type': 'application/json' },
        body: 'x'.repeat(36_865),
      }),
    );
    expect(bodyTooLarge.status).toBe(413);
    const accepted = await fetch(
      new Request('https://translation.example/v1/translations', {
        method: 'POST',
        headers: {
          origin: 'https://app.example',
          'content-type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(request),
      }),
    );
    expect(accepted.status).toBe(200);
    expect(accepted.headers.get('access-control-allow-origin')).toBe('https://app.example');
  });
});
