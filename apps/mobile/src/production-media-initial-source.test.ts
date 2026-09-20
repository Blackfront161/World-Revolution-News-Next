import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isValidatedProductionMediaReadyV1,
  type ProductionMediaSafetyV1,
} from '@wrn/content-contracts/production-media-v1';
import { createProductionMediaInitialSource } from '../../../packages/browser-content/src/production-media-initial-source';
import { productionMediaInitialReleaseV1 } from '../../../packages/browser-content/src/data/production-media-initial-release-v1';
import type { ProductionMediaRawRelease } from '../../../packages/browser-content/src/production-media-release';
import { makeProductionMediaTestInput } from './production-media-test-fixture';

afterEach(() => vi.restoreAllMocks());
const rawFrom = (
  input: Awaited<ReturnType<typeof makeProductionMediaTestInput>>,
): ProductionMediaRawRelease => ({
  pointerRaw: input.pointerRaw,
  descriptorRaw: input.descriptorRaw,
  documentsRaw: { ...input.documentsRaw },
});
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('local build-bundled media source', () => {
  it('admits only the exact compiled privacy pair and detaches later caller mutation', async () => {
    const input = await makeProductionMediaTestInput((docs) => {
      docs.consent.entries[0]!.privacyNoticeUrl = 'https://privacy.invalid/notice';
    });
    const providerPolicy = {
      kind: 'production-media-provider-policy-v1' as const,
      relationships: [
        {
          recipientOrigin: 'https://publisher.invalid',
          privacyNoticeUrl: 'https://privacy.invalid/notice',
        },
      ],
    };
    const options = {
      raw: rawFrom(input),
      allowedOrigins: input.allowedOrigins,
      now: () => input.now,
    };
    const source = createProductionMediaInitialSource({ ...options, providerPolicy });
    providerPolicy.relationships[0]!.privacyNoticeUrl = 'https://privacy.invalid/replaced';
    const load = {
      signal: new AbortController().signal,
      knownSafety: input.knownSafety,
      commitSafety: async (safety: ProductionMediaSafetyV1) => safety,
    };
    expect((await source.load(load)).kind).toBe('ready');
    expect(await createProductionMediaInitialSource(options).load(load)).toEqual({
      kind: 'failed',
    });
    expect(
      await createProductionMediaInitialSource({ ...options, providerPolicy }).load(load),
    ).toEqual({ kind: 'failed' });
  });
  it('validates the evidence-bound bundled packet at its declared start and refuses it at expiry', async () => {
    const descriptor = JSON.parse(productionMediaInitialReleaseV1.descriptorRaw) as {
      generatedAt: string;
      validUntil: string;
    };
    const providerPolicy = {
      kind: 'production-media-provider-policy-v1' as const,
      relationships: [
        {
          recipientOrigin: 'https://dn721204.ca.archive.org',
          privacyNoticeUrl: 'https://archive.org/about/terms',
        },
      ],
    };
    for (const [now, kind] of [
      [Date.parse(descriptor.generatedAt), 'ready'],
      [Date.parse(descriptor.validUntil), 'failed'],
    ] as const) {
      const source = createProductionMediaInitialSource({
        raw: productionMediaInitialReleaseV1,
        allowedOrigins: new Set(['https://dn721204.ca.archive.org']),
        providerPolicy,
        now: () => now,
      });
      const result = await source.load({
        signal: new AbortController().signal,
        knownSafety: { revision: 0, floor: 0, revocationSha256: null, entries: [] },
        commitSafety: async (safety) => safety,
      });
      expect(result.kind).toBe(kind);
      if (result.kind === 'ready') {
        expect(isValidatedProductionMediaReadyV1(result.ready)).toBe(true);
        expect(result.ready.documents.rights.entries[0]!.attribution).toContain('Reed Mathis');
        expect(result.ready.documents.manifest.episodes[0]!.title.de).toBeNull();
      }
    }
  });
  it('waits for durable safety and snapshots known safety before callers can mutate it', async () => {
    const input = await makeProductionMediaTestInput();
    const knownSafety = { ...input.knownSafety };
    const durable = deferred<ProductionMediaSafetyV1>();
    const entered = deferred<ProductionMediaSafetyV1>();
    const source = createProductionMediaInitialSource({
      raw: rawFrom(input),
      allowedOrigins: input.allowedOrigins,
      now: () => input.now,
    });
    let completed = false;
    const loading = source
      .load({
        signal: new AbortController().signal,
        knownSafety,
        commitSafety: (safety) => {
          entered.resolve(safety);
          return durable.promise;
        },
      })
      .then((result) => {
        completed = true;
        return result;
      });
    Object.assign(knownSafety, { floor: Number.MAX_SAFE_INTEGER });
    const committed = await entered.promise;
    expect(completed).toBe(false);
    durable.resolve(committed);
    expect((await loading).kind).toBe('ready');
  });
  it('cannot mint Ready with removed or unlisted delivery origins', async () => {
    const input = await makeProductionMediaTestInput();
    for (const allowedOrigins of [new Set<string>(), new Set(['https://different.example'])]) {
      const source = createProductionMediaInitialSource({
        raw: rawFrom(input),
        allowedOrigins,
        now: () => input.now,
      });
      expect(
        await source.load({
          signal: new AbortController().signal,
          knownSafety: input.knownSafety,
          commitSafety: async (safety) => safety,
        }),
      ).toEqual({ kind: 'failed' });
    }
  });
  it('returns genuine A1 Ready only after exact durable safety without a network request', async () => {
    const input = await makeProductionMediaTestInput();
    const raw = rawFrom(input);
    const fetch = vi.spyOn(globalThis, 'fetch');
    const source = createProductionMediaInitialSource({
      raw,
      allowedOrigins: input.allowedOrigins,
      now: () => input.now,
    });
    const commitSafety = vi.fn(async (safety: ProductionMediaSafetyV1) => safety);
    const result = await source.load({
      signal: new AbortController().signal,
      knownSafety: input.knownSafety,
      commitSafety,
    });
    expect(result.kind).toBe('ready');
    expect(commitSafety).toHaveBeenCalledTimes(1);
    if (result.kind !== 'ready') throw Error('Expected Ready');
    expect(isValidatedProductionMediaReadyV1(result.ready)).toBe(true);
    expect(result.raw).toEqual(raw);
    expect(Object.isFrozen(result.raw.documentsRaw)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('retains raw bytes and origins detached from caller changes after factory creation', async () => {
    const input = await makeProductionMediaTestInput();
    const raw = rawFrom(input);
    const origins = new Set(input.allowedOrigins);
    const source = createProductionMediaInitialSource({
      raw,
      allowedOrigins: origins,
      now: () => input.now,
    });
    Object.assign(raw.documentsRaw, { manifest: '{}' });
    origins.clear();
    const result = await source.load({
      signal: new AbortController().signal,
      knownSafety: input.knownSafety,
      commitSafety: async (safety) => safety,
    });
    expect(result.kind).toBe('ready');
  });
  it('binds the trusted safety callback before the first asynchronous validation', async () => {
    const input = await makeProductionMediaTestInput();
    const source = createProductionMediaInitialSource({
      raw: rawFrom(input),
      allowedOrigins: input.allowedOrigins,
      now: () => input.now,
    });
    const commitSafety = vi.fn(async (safety: ProductionMediaSafetyV1) => safety),
      replacement = vi.fn(async (safety: ProductionMediaSafetyV1) => safety);
    const ports = {
      signal: new AbortController().signal,
      knownSafety: input.knownSafety,
      commitSafety,
    };
    const loading = source.load(ports);
    ports.commitSafety = replacement;
    expect((await loading).kind).toBe('ready');
    expect(commitSafety).toHaveBeenCalledTimes(1);
    expect(replacement).not.toHaveBeenCalled();
  });
  it('does not validate an invalid ordinary payload until safety has been committed', async () => {
    const input = await makeProductionMediaTestInput();
    const raw = { ...rawFrom(input), documentsRaw: { ...input.documentsRaw, manifest: '{}' } };
    const source = createProductionMediaInitialSource({
      raw,
      allowedOrigins: input.allowedOrigins,
      now: () => input.now,
    });
    const commitSafety = vi.fn(async (safety: ProductionMediaSafetyV1) => safety);
    expect(
      await source.load({
        signal: new AbortController().signal,
        knownSafety: input.knownSafety,
        commitSafety,
      }),
    ).toEqual({ kind: 'failed' });
    expect(commitSafety).toHaveBeenCalledTimes(1);
  });
  it.each(['reject', 'mismatch', 'abort', 'expiry', 'regression'] as const)(
    'rejects %s during durable safety without returning Ready',
    async (kind) => {
      const input = await makeProductionMediaTestInput();
      let now = input.now;
      const abort = new AbortController();
      const pending = deferred<ProductionMediaSafetyV1>();
      const source = createProductionMediaInitialSource({
        raw: rawFrom(input),
        allowedOrigins: input.allowedOrigins,
        now: () => now,
      });
      const commitSafety = vi.fn(async (safety: ProductionMediaSafetyV1) => {
        if (kind === 'reject') throw Error('No durable commit');
        if (kind === 'mismatch') return { ...safety, floor: safety.floor + 1 };
        if (kind === 'expiry') now += 8 * 86400000;
        if (kind === 'regression') now--;
        if (kind === 'abort') {
          abort.abort();
          return pending.promise;
        }
        return safety;
      });
      const result = await source.load({
        signal: abort.signal,
        knownSafety: input.knownSafety,
        commitSafety,
      });
      expect(result).toEqual({ kind: 'failed' });
      expect(commitSafety).toHaveBeenCalledTimes(1);
      pending.resolve(input.knownSafety);
    },
  );
  it('rejects malformed and oversized bundled configuration before any safety callback', async () => {
    const input = await makeProductionMediaTestInput();
    for (const raw of [
      { ...rawFrom(input), pointerRaw: 'x'.repeat(16385) },
      { ...rawFrom(input), unexpected: true },
    ]) {
      const source = createProductionMediaInitialSource({
        raw,
        allowedOrigins: input.allowedOrigins,
        now: () => input.now,
      });
      const commitSafety = vi.fn(async (safety: ProductionMediaSafetyV1) => safety);
      expect(
        await source.load({
          signal: new AbortController().signal,
          knownSafety: input.knownSafety,
          commitSafety,
        }),
      ).toEqual({ kind: 'failed' });
      expect(commitSafety).not.toHaveBeenCalled();
    }
  });
  it('rejects an already aborted load and invalid clocks without a commit', async () => {
    const input = await makeProductionMediaTestInput();
    const abort = new AbortController();
    abort.abort();
    const commitSafety = vi.fn(async (safety: ProductionMediaSafetyV1) => safety);
    for (const [now, signal] of [
      [() => input.now, abort.signal],
      [() => NaN, new AbortController().signal],
      [
        () => {
          throw Error('clock');
        },
        new AbortController().signal,
      ],
    ] as const) {
      const source = createProductionMediaInitialSource({
        raw: rawFrom(input),
        allowedOrigins: input.allowedOrigins,
        now,
      });
      expect(await source.load({ signal, knownSafety: input.knownSafety, commitSafety })).toEqual({
        kind: 'failed',
      });
    }
    expect(commitSafety).not.toHaveBeenCalled();
  });
});
