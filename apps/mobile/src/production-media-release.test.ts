import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canonicalJson } from '@wrn/content-contracts';
import {
  isValidatedProductionMediaReadyV1,
  type ProductionMediaProviderPolicyV1,
  type ProductionMediaSafetyV1,
} from '@wrn/content-contracts/production-media-v1';
import {
  createProductionMediaSource,
  type ProductionMediaSafetyCommit,
} from '../../../packages/browser-content/src/production-media-release';
import { makeProductionMediaTestInput } from './production-media-test-fixture';

const origin = 'https://metadata.invalid';
const pointerPath = '/content/media/v1/current.json';
const path = (name: string) => `/content/media/v1/releases/release-1/${name}.json`;
const now = Date.parse('2026-09-11T12:00:00.000Z');
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
async function harness(
  input = makeProductionMediaTestInput(),
  options: {
    allowedOrigins?: ReadonlySet<string>;
    providerPolicy?: ProductionMediaProviderPolicyV1;
  } = {},
) {
  const packet = await input;
  const wire = new Map([
    [pointerPath, packet.pointerRaw],
    [path('descriptor'), packet.descriptorRaw],
    ...Object.entries(packet.documentsRaw).map(
      ([name, raw]) => [path(name), raw] as [string, string],
    ),
  ]);
  const order: string[] = [];
  const request = vi.fn<typeof fetch>(async (url) => {
    const route = String(url).slice(origin.length);
    order.push(route);
    return new Response(wire.get(route), {
      status: wire.has(route) ? 200 : 404,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  let stored: ProductionMediaSafetyV1 | null = null;
  const commit = vi.fn<ProductionMediaSafetyCommit>(async (safety) => {
    order.push('commit');
    stored = safety;
    return safety;
  });
  const origins = new Set(options.allowedOrigins ?? ['https://publisher.invalid']);
  const source = createProductionMediaSource({
    metadataOrigin: origin,
    allowedOrigins: origins,
    ...(options.providerPolicy ? { providerPolicy: options.providerPolicy } : {}),
    fetch: request,
  });
  const caller = new AbortController();
  const load = () =>
    source.load({ signal: caller.signal, knownSafety: packet.knownSafety, commitSafety: commit });
  return {
    packet,
    wire,
    order,
    request,
    commit,
    source,
    caller,
    load,
    origins,
    stored: () => stored,
  };
}
const safetyRequests = [pointerPath, path('descriptor'), path('revocation')];

describe('production media two-phase raw source', () => {
  it('snapshots an exact provider pair before transport and rejects malformed policy at construction', async () => {
    const input = makeProductionMediaTestInput((docs) => {
      docs.consent.entries[0]!.privacyNoticeUrl = 'https://archive.org/about/terms';
    });
    const mutable = {
      kind: 'production-media-provider-policy-v1' as const,
      relationships: [
        {
          recipientOrigin: 'https://publisher.invalid',
          privacyNoticeUrl: 'https://archive.org/about/terms',
        },
      ],
    };
    const h = await harness(input, { providerPolicy: mutable });
    mutable.relationships[0]!.privacyNoticeUrl = 'https://mutated.invalid/';
    const result = await h.load();
    expect(result.kind).toBe('ready');
    expect(h.request.mock.calls.every(([url]) => new URL(String(url)).origin === origin)).toBe(
      true,
    );

    const request = vi.fn<typeof fetch>();
    expect(() =>
      createProductionMediaSource({
        metadataOrigin: origin,
        allowedOrigins: new Set(['https://publisher.invalid']),
        providerPolicy: {
          ...mutable,
          relationships: [
            {
              recipientOrigin: 'https://publisher.invalid',
              privacyNoticeUrl: 'https://archive.org/about/terms?redirect=1',
            },
          ],
        },
        fetch: request,
      }),
    ).toThrow('provider-policy');
    expect(request).not.toHaveBeenCalled();
  });

  it('returns genuine A1 ready and exact raw wire text only after safety commit', async () => {
    const h = await harness(
      makeProductionMediaTestInput(
        (docs) => {
          docs.manifest.sources[0]!.title.en = '🎙️ Διεθνές ραδιόφωνο';
        },
        {
          pointerBytes: 1024,
          descriptorBytes: 4096,
          documentBytes: {
            manifest: 4096,
            admission: 4096,
            rights: 4096,
            consent: 4096,
            revocation: 4096,
          },
        },
      ),
    );
    const result = await h.load();
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') throw Error('missing ready');
    expect(isValidatedProductionMediaReadyV1(result.ready)).toBe(true);
    expect(result.raw).toEqual({
      pointerRaw: h.packet.pointerRaw,
      descriptorRaw: h.packet.descriptorRaw,
      documentsRaw: h.packet.documentsRaw,
    });
    expect(Object.isFrozen(result.raw.documentsRaw)).toBe(true);
    expect(h.order).toEqual([
      ...safetyRequests,
      'commit',
      ...['manifest', 'admission', 'rights', 'consent'].map(path),
    ]);
    expect(h.commit.mock.calls[0]![1].aborted).toBe(true); // Closed session cannot be reused.
  });
  it('does not read ordinary payload while the safety transaction is pending', async () => {
    const h = await harness();
    const barrier = deferred<ProductionMediaSafetyV1>();
    const entered = deferred<void>();
    h.commit.mockImplementation(() => {
      entered.resolve();
      return barrier.promise;
    });
    const work = h.load();
    await entered.promise;
    expect(h.order).toEqual(safetyRequests);
    expect(h.commit).toHaveBeenCalledTimes(1);
    barrier.resolve(h.commit.mock.calls[0]![0]);
    expect((await work).kind).toBe('ready');
  });
  it.each(['reject', 'throw', 'mismatch', 'missing-entries'] as const)(
    'does not request payload after commit %s',
    async (failure) => {
      const h = await harness();
      if (failure === 'reject') h.commit.mockRejectedValue(Error('private disk error'));
      if (failure === 'throw')
        h.commit.mockImplementation(() => {
          throw Error('private disk error');
        });
      if (failure === 'mismatch')
        h.commit.mockImplementation(async (safety) => ({
          ...safety,
          revision: safety.revision + 1,
        }));
      if (failure === 'missing-entries')
        h.commit.mockImplementation(async (safety) => ({
          ...safety,
          entries: [{ targetType: 'episode', targetId: 'other', status: 'gone' }],
        }));
      expect(await h.load()).toEqual({ kind: 'failed' });
      expect(h.order).toEqual(safetyRequests);
    },
  );
  it.each(['manifest', 'admission', 'rights', 'consent'] as const)(
    'retains committed safety after %s payload failure',
    async (name) => {
      const h = await harness();
      h.wire.delete(path(name));
      expect(await h.load()).toEqual({ kind: 'failed' });
      expect(h.commit).toHaveBeenCalledTimes(1);
      expect(h.stored()?.revision).toBe(1);
      expect(h.order.indexOf('commit')).toBe(3);
    },
  );
  it.each([
    'pointer-json',
    'pointer-schema',
    'descriptor-json',
    'descriptor-hash',
    'revocation-hash',
  ] as const)('stops tampered %s before commit or ordinary payload', async (cause) => {
    const h = await harness();
    if (cause === 'pointer-json') h.wire.set(pointerPath, '{');
    if (cause === 'pointer-schema')
      h.wire.set(
        pointerPath,
        canonicalJson({ ...JSON.parse(h.packet.pointerRaw), contractVersion: '2.0.0' }),
      );
    if (cause === 'descriptor-json') h.wire.set(path('descriptor'), '{');
    if (cause === 'descriptor-hash')
      h.wire.set(path('descriptor'), h.packet.descriptorRaw.replace('2026-09-11', '2026-09-10'));
    if (cause === 'revocation-hash')
      h.wire.set(
        path('revocation'),
        h.packet.documentsRaw.revocation.replace('"revision":1', '"revision":2'),
      );
    expect(await h.load()).toEqual({ kind: 'failed' });
    expect(h.commit).not.toHaveBeenCalled();
    expect(h.order.every((route) => safetyRequests.includes(route))).toBe(true);
  });
  it('rejects genuine but forbidden whole-episode rights during full validation', async () => {
    const h = await harness(
      makeProductionMediaTestInput((docs) => {
        docs.rights.entries[0]!.directStreamAllowed = false as true;
      }),
    );
    expect(await h.load()).toEqual({ kind: 'failed' });
    expect(h.stored()?.revision).toBe(1);
  });
  it('rejects blocked episode after safety is durably recorded', async () => {
    const h = await harness(
      makeProductionMediaTestInput((docs) => {
        docs.revocation.entries.push({
          targetType: 'episode',
          targetId: 'episode-0',
          status: 'blocked',
        });
      }),
    );
    expect(await h.load()).toEqual({ kind: 'failed' });
    expect(h.stored()?.entries).toEqual([
      { targetType: 'episode', targetId: 'episode-0', status: 'blocked' },
    ]);
  });
  it('refuses a commit that loses previously accumulated safety entries', async () => {
    const h = await harness();
    const first = await h.load();
    if (first.kind !== 'ready') throw Error('missing base safety');
    h.order.length = 0;
    h.commit.mockImplementation(async (safety) => ({ ...safety, entries: [] }));
    const known = {
      ...first.ready.safety,
      entries: [
        {
          targetType: 'episode' as const,
          targetId: 'historical-episode',
          status: 'blocked' as const,
        },
      ],
    };
    expect(
      await h.source.load({ signal: h.caller.signal, knownSafety: known, commitSafety: h.commit }),
    ).toEqual({ kind: 'failed' });
    expect(h.order).toEqual(safetyRequests);
    expect(h.commit.mock.lastCall![0].entries).toEqual(known.entries);
  });
  it('rechecks release expiry after commit before ordinary payload', async () => {
    const h = await harness();
    const expiry = Date.parse(JSON.parse(h.packet.descriptorRaw).validUntil);
    vi.setSystemTime(expiry - 1);
    h.commit.mockImplementation(async (safety) => {
      vi.setSystemTime(expiry);
      return safety;
    });
    expect(await h.load()).toEqual({ kind: 'failed' });
    expect(h.order).toEqual(safetyRequests);
  });
  it('snapshots caller safety and compiled origins before asynchronous work', async () => {
    const h = await harness();
    const work = h.load();
    h.origins.clear();
    (h.packet.knownSafety as { revision: number }).revision = 99;
    expect((await work).kind).toBe('ready');
  });
  it.each([11999, 12000, 12001])(
    'keeps the single deadline through durable commit at%dms',
    async (elapsed) => {
      const h = await harness();
      h.commit.mockImplementation(async (safety) => {
        vi.setSystemTime(now + elapsed);
        return safety;
      });
      expect((await h.load()).kind).toBe(elapsed < 12000 ? 'ready' : 'failed');
      expect(h.request).toHaveBeenCalledTimes(elapsed < 12000 ? 7 : 3);
    },
  );
  it.each(['timeout-resolve', 'timeout-reject', 'abort-resolve'] as const)(
    'settles pending commit and ignores late %s',
    async (cause) => {
      const h = await harness();
      const barrier = deferred<ProductionMediaSafetyV1>();
      const entered = deferred<void>();
      h.commit.mockImplementation(() => {
        entered.resolve();
        return barrier.promise;
      });
      const work = h.load();
      await entered.promise;
      if (cause === 'abort-resolve') h.caller.abort();
      else await vi.advanceTimersByTimeAsync(12000);
      expect(await work).toEqual({ kind: 'failed' });
      if (cause === 'timeout-reject') barrier.reject(Error('private late commit'));
      else barrier.resolve(h.commit.mock.calls[0]![0]);
      await vi.advanceTimersByTimeAsync(0);
      expect(h.order).toEqual(safetyRequests);
    },
  );
  it('makes no request on caller pre-abort and no commit after header abort', async () => {
    const h = await harness();
    h.caller.abort();
    expect(await h.load()).toEqual({ kind: 'failed' });
    expect(h.request).not.toHaveBeenCalled();
    const other = await harness();
    other.request.mockImplementation(async () => {
      other.caller.abort();
      return new Response('{}');
    });
    expect(await other.load()).toEqual({ kind: 'failed' });
    expect(other.commit).not.toHaveBeenCalled();
  });
  it('keeps separate calls isolated after one abort', async () => {
    const h = await harness();
    const aborted = new AbortController();
    aborted.abort();
    const rejected = h.source.load({
      signal: aborted.signal,
      knownSafety: h.packet.knownSafety,
      commitSafety: h.commit,
    });
    const accepted = h.load();
    expect(await rejected).toEqual({ kind: 'failed' });
    expect((await accepted).kind).toBe('ready');
    expect(h.commit).toHaveBeenCalledTimes(1);
  });
});
