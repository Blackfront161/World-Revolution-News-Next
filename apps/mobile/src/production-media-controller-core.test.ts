import { describe, expect, it, vi } from 'vitest';
import {
  createEmptyProductionMediaOfflineControlV1,
  productionMediaOfflineBundleKeyV1,
  type ProductionMediaOfflineControlV1,
} from '@wrn/content-contracts/production-media-offline-v1';
import {
  validateProductionMediaReleaseV1,
  type ProductionMediaSafetyV1,
} from '@wrn/content-contracts/production-media-v1';
import { createProductionMediaController } from '../../../packages/browser-content/src/production-media-controller';
import { createProductionMediaSource } from '../../../packages/browser-content/src/production-media-release';
import { createProductionMediaInitialSource } from '../../../packages/browser-content/src/production-media-initial-source';
import type { ProductionMediaOfflineStore } from '../../../packages/browser-content/src/production-media-offline-store';
import type {
  ProductionMediaResumeRecord,
  ProductionMediaResumeStore,
} from '../../../packages/browser-content/src/production-media-resume-store';
import type { ProductionMediaAudio } from '../../../packages/browser-content/src/production-media-player';
import { makeProductionMediaTestInput } from './production-media-test-fixture';

type Deferred<T> = {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: unknown): void;
};
const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};
async function localReady() {
  const input = await makeProductionMediaTestInput();
  const ready = await validateProductionMediaReleaseV1(input);
  expect(ready).not.toBeNull();
  const key = await productionMediaOfflineBundleKeyV1({
    releaseRevision: ready!.pointer.releaseRevision,
    sequence: ready!.pointer.sequence,
    descriptorSha256: ready!.pointer.descriptorSha256,
  });
  expect(key).not.toBeNull();
  return { input, ready: ready!, key: key! };
}
function audioHarness(duration = 1806) {
  let source = '';
  const calls: string[] = [];
  const audio = {
    crossOrigin: null,
    preload: '' as ProductionMediaAudio['preload'],
    duration,
    currentTime: 0,
    onloadedmetadata: null as ProductionMediaAudio['onloadedmetadata'],
    ondurationchange: null as ProductionMediaAudio['ondurationchange'],
    onerror: null as ProductionMediaAudio['onerror'],
    onpause: null as ProductionMediaAudio['onpause'],
    onended: null as ProductionMediaAudio['onended'],
    ontimeupdate: null as ProductionMediaAudio['ontimeupdate'],
    get src() {
      return source;
    },
    set src(value: string) {
      source = value;
      calls.push('src');
    },
    play: vi.fn(async () => {
      calls.push('play');
    }),
    pause: vi.fn(() => {
      calls.push('pause');
      audio.onpause?.call(audio as unknown as HTMLAudioElement, new Event('pause'));
    }),
    load: vi.fn(() => calls.push('load')),
    removeAttribute: vi.fn((name: string) => {
      if (name === 'src') source = '';
    }),
  } satisfies ProductionMediaAudio;
  return { audio, calls };
}
async function mountedHarness(
  options: {
    records?: readonly ProductionMediaResumeRecord[];
    save?: ProductionMediaResumeStore['save'];
    deleteIfExact?: ProductionMediaResumeStore['deleteIfExact'];
    clearExact?: ProductionMediaResumeStore['clearExact'];
    clearA6?: ProductionMediaOfflineStore['clear'];
    onState?: (
      state: ReturnType<ReturnType<typeof createProductionMediaController>['getState']>,
    ) => void;
  } = {},
) {
  const { input, ready, key } = await localReady();
  let resume = {
    generation: 0,
    records: [...(options.records ?? [])] as readonly ProductionMediaResumeRecord[],
  };
  const offline = {
    readActive: vi.fn(async () => ({
      ready,
      generation: 4,
      clearEpoch: 2,
      checkedAt: input.now,
    })),
    snapshot: vi.fn(async () => ({
      control: { generation: 4, clearEpoch: 2, activeKey: key },
      bundles: [],
    })),
    clear:
      options.clearA6 ?? vi.fn(async () => ({ generation: 5, clearEpoch: 3, activeKey: null })),
    close: vi.fn(),
  } as unknown as ProductionMediaOfflineStore;
  const resumeStore = {
    snapshot: vi.fn(async () => resume),
    save:
      options.save ??
      vi.fn(async (record: ProductionMediaResumeRecord, generation: number) => {
        resume = { generation: generation + 1, records: [record] };
        return { kind: 'saved' as const, state: resume };
      }),
    deleteIfExact:
      options.deleteIfExact ??
      vi.fn(async (_key: string, record: ProductionMediaResumeRecord, generation: number) => {
        const current = resume.records.find((item) => item.key === record.key);
        if (!current || JSON.stringify(current) !== JSON.stringify(record))
          return { kind: 'no-op' as const, state: resume };
        resume = {
          generation: generation + 1,
          records: resume.records.filter((item) => item.key !== record.key),
        };
        return { kind: 'deleted' as const, state: resume };
      }),
    clearExact:
      options.clearExact ??
      vi.fn(async (records: readonly ProductionMediaResumeRecord[], generation: number) => {
        const keys = new Set(records.map((item) => item.key));
        resume = {
          generation: generation + 1,
          records: resume.records.filter((item) => !keys.has(item.key)),
        };
        return { kind: 'deleted' as const, state: resume };
      }),
    close: vi.fn(),
  } as unknown as ProductionMediaResumeStore;
  const media = audioHarness();
  const controller = createProductionMediaController({
    source: null,
    allowedOrigins: new Set(['https://publisher.invalid']),
    openOffline: async () => offline,
    openResume: async () => resumeStore,
    now: () => input.now,
    audio: () => media.audio,
    online: () => true,
    ...(options.onState ? { onState: options.onState } : {}),
  });
  await controller.mount();
  return { controller, offline, resumeStore, media, ready, input, key, getResume: () => resume };
}
async function startPlaying(harness: Awaited<ReturnType<typeof mountedHarness>>, position = 0) {
  const prompt = harness.controller.preparePlay('episode-0');
  expect(prompt).not.toBeNull();
  expect(harness.controller.confirmPlay(prompt!)).toBe(true);
  harness.media.audio.onloadedmetadata?.call(
    harness.media.audio as unknown as HTMLAudioElement,
    new Event('loadedmetadata'),
  );
  await flush();
  harness.media.audio.currentTime = position / 1000;
  expect(harness.controller.getState().player.phase).toBe('playing');
}

describe('pristine-only local media bootstrap', () => {
  it('commits safety and activates only a fresh A6 Ready, once; clear and remount stay cleared', async () => {
    const { input, ready, key } = await localReady();
    let control = createEmptyProductionMediaOfflineControlV1();
    const steps: string[] = [];
    const advance = (patch: Partial<ProductionMediaOfflineControlV1>) => {
      control = { ...control, ...patch, generation: control.generation + 1 };
      return control;
    };
    const db = {
      snapshot: vi.fn(async () => ({ control, bundles: [] })),
      prepareRecheck: vi.fn(async (operationId: string) => {
        steps.push('prepare');
        return advance({ pendingRecheck: { operationId, generation: 1, clearEpoch: 0 } });
      }),
      commitSafety: vi.fn(async (_id: string, safety: ProductionMediaSafetyV1) => {
        steps.push('safety');
        return advance({ safety });
      }),
      saveCandidate: vi.fn(async (value: { pointerRaw: string }) => {
        steps.push('candidate');
        expect(value.pointerRaw).toBe(input.pointerRaw);
        return advance({ candidateKey: key });
      }),
      activateCandidate: vi.fn(async () => {
        steps.push('activate');
        return advance({ activeKey: key, candidateKey: null, highestAcceptedSequence: 1 });
      }),
      finishRecheck: vi.fn(async () => {
        steps.push('finish');
        return advance({ pendingRecheck: null });
      }),
      readActive: vi.fn(async () =>
        control.activeKey
          ? {
              ready,
              generation: control.generation,
              clearEpoch: control.clearEpoch,
              checkedAt: input.now,
            }
          : null,
      ),
      clear: vi.fn(async () => advance({ activeKey: null, clearEpoch: control.clearEpoch + 1 })),
      close: vi.fn(),
    } as unknown as ProductionMediaOfflineStore;
    const local = createProductionMediaInitialSource({
      raw: {
        pointerRaw: input.pointerRaw,
        descriptorRaw: input.descriptorRaw,
        documentsRaw: input.documentsRaw,
      },
      allowedOrigins: input.allowedOrigins,
      now: () => input.now,
    });
    const initialSource = { load: vi.fn(local.load) };
    const resumeState = { generation: 0, records: [] };
    const controller = createProductionMediaController({
      source: null,
      initialSource,
      allowedOrigins: input.allowedOrigins,
      now: () => input.now,
      openOffline: async () => db,
      openResume: async () =>
        ({
          snapshot: async () => resumeState,
          clearExact: async () => ({ kind: 'no-op', state: resumeState }),
          close: () => {},
        }) as unknown as ProductionMediaResumeStore,
    });
    await controller.mount();
    expect(initialSource.load).not.toHaveBeenCalled();
    await controller.bootstrapInitial();
    expect(steps).toEqual(['prepare', 'safety', 'candidate', 'activate', 'finish']);
    expect(controller.getState().active?.ready).toBe(ready);
    const provisional = await initialSource.load.mock.results[0]!.value;
    expect(provisional.kind).toBe('ready');
    expect(provisional.ready).not.toBe(ready);
    await controller.bootstrapInitial();
    expect(initialSource.load).toHaveBeenCalledTimes(1);
    await controller.clearLocal();
    await controller.mount();
    const cleared = JSON.stringify(control);
    expect((await controller.bootstrapInitial()).reason).toBe('cleared');
    expect(initialSource.load).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(control)).toBe(cleared);
    expect(controller.getState().active).toBeNull();
    controller.dispose();
    const final = controller.getState();
    expect(await controller.bootstrapInitial()).toBe(final);
    expect(initialSource.load).toHaveBeenCalledTimes(1);
  });

  it.each([
    'generation',
    'clear',
    'safety',
    'identity',
    'sequence',
    'pending',
    'bundle',
    'active',
    'previous',
    'candidate',
  ] as const)('never invokes initial source or writes for non-pristine %s', async (kind) => {
    const { input } = await localReady();
    const initial = createEmptyProductionMediaOfflineControlV1();
    const control = {
      ...initial,
      ...(kind === 'generation' ? { generation: 1 } : {}),
      ...(kind === 'clear' ? { clearEpoch: 1 } : {}),
      ...(kind === 'safety' ? { safety: { ...initial.safety, floor: 1 } } : {}),
      ...(kind === 'identity' ? { acceptedIdentities: [{ key: 'historical' }] } : {}),
      ...(kind === 'sequence' ? { highestAcceptedSequence: 1 } : {}),
      ...(kind === 'pending'
        ? { pendingRecheck: { operationId: 'another', generation: 0, clearEpoch: 0 } }
        : {}),
      ...(kind === 'active' ? { activeKey: 'old' } : {}),
      ...(kind === 'previous' ? { previousKey: 'old' } : {}),
      ...(kind === 'candidate' ? { candidateKey: 'old' } : {}),
    };
    const base = { control, bundles: kind === 'bundle' ? [{ key: 'retained' }] : [] };
    const before = JSON.stringify(base);
    const initialSource = { load: vi.fn(async () => ({ kind: 'failed' as const })) };
    const prepare = vi.fn();
    const controller = createProductionMediaController({
      source: null,
      initialSource,
      allowedOrigins: input.allowedOrigins,
      now: () => input.now,
      openOffline: async () =>
        ({
          snapshot: async () => base,
          readActive: async () => null,
          prepareRecheck: prepare,
          close: () => {},
        }) as unknown as ProductionMediaOfflineStore,
      openResume: vi.fn(),
    });
    const result = await controller.bootstrapInitial();
    expect(result.phase).toBe(kind === 'clear' ? 'local' : 'unavailable');
    expect(initialSource.load).not.toHaveBeenCalled();
    expect(prepare).not.toHaveBeenCalled();
    expect(JSON.stringify(base)).toBe(before);
    controller.dispose();
  });
});

describe('production media controller core', () => {
  it('fails closed with the shipped null source and empty origins', async () => {
    const controller = createProductionMediaController({
      source: null,
      allowedOrigins: new Set(),
      openOffline: async () => {
        throw new Error('must not open for disabled source');
      },
      openResume: async () => {
        throw new Error('must not open for disabled source');
      },
    });
    expect(controller.getState()).toMatchObject({
      phase: 'local',
      reason: 'no-active-release',
      active: null,
    });
    await controller.recheck();
    expect(controller.getState()).toMatchObject({
      phase: 'unavailable',
      reason: 'source-disabled',
      active: null,
    });
    controller.cancelConsent();
    controller.dispose();
    expect(controller.getState()).toMatchObject({
      phase: 'disposed',
      reason: 'disposed',
      active: null,
    });
  });

  it('treats an unavailable local store as a bounded storage failure', async () => {
    const controller = createProductionMediaController({
      source: null,
      allowedOrigins: new Set(),
      openOffline: async () => {
        throw new Error('closed');
      },
      openResume: async () => {
        throw new Error('closed');
      },
    });
    await controller.mount();
    expect(controller.getState()).toMatchObject({ phase: 'storage-error', active: null });
  });

  it('composes the real A4 source with an exact A6 lease and A2 context', async () => {
    const input = await makeProductionMediaTestInput();
    const origins = new Set(['https://publisher.invalid']);
    let generation = 0,
      activeKey: string | null = null,
      ready: Awaited<ReturnType<typeof validateProductionMediaReleaseV1>> = null;
    let safety: ProductionMediaSafetyV1 = {
      revision: 0,
      floor: 0,
      revocationSha256: null,
      entries: [],
    };
    const control = () => ({ generation, clearEpoch: 0, activeKey, safety });
    const store = {
      snapshot: async () => ({ control: control() }),
      prepareRecheck: async () => ({ ...control(), generation: ++generation }),
      commitSafety: async (_id: string, incoming: ProductionMediaSafetyV1) => ({
        ...control(),
        generation: ++generation,
        safety: (safety = incoming),
      }),
      saveCandidate: async (candidate: {
        pointerRaw: string;
        descriptorRaw: string;
        documentsRaw: typeof input.documentsRaw;
      }) => {
        ready = await validateProductionMediaReleaseV1({
          ...candidate,
          now: input.now,
          allowedOrigins: origins,
          knownSafety: safety,
        });
        return { ...control(), generation: ++generation };
      },
      activateCandidate: async (key: string) => ({
        ...control(),
        generation: ++generation,
        activeKey: (activeKey = key),
      }),
      finishRecheck: async () => ({ ...control(), generation: ++generation }),
      readActive: async () =>
        ready ? { ready, generation, clearEpoch: 0, checkedAt: input.now } : null,
      close: () => {},
    } as unknown as ProductionMediaOfflineStore;
    const source = createProductionMediaSource({
      metadataOrigin: 'https://metadata.invalid',
      allowedOrigins: origins,
      fetch: async (url) => {
        const path = new URL(url.toString()).pathname;
        const raw =
          path === '/content/media/v1/current.json'
            ? input.pointerRaw
            : path.endsWith('/descriptor.json')
              ? input.descriptorRaw
              : input.documentsRaw[
                  path.split('/').at(-1)!.replace('.json', '') as keyof typeof input.documentsRaw
                ];
        return new Response(raw ?? '', {
          status: raw ? 200 : 404,
          headers: raw
            ? {
                'content-type': 'application/json',
                'content-length': String(new TextEncoder().encode(raw).byteLength),
              }
            : {},
        });
      },
      now: () => input.now,
    });
    const controller = createProductionMediaController({
      source,
      allowedOrigins: origins,
      openOffline: async () => store,
      openResume: async () =>
        ({ snapshot: async () => ({ generation: 0, records: [] }), close: () => {} }) as never,
      now: () => input.now,
      operationId: () => 'a7-real-a4-seam',
    });
    await controller.recheck();
    expect(controller.getState()).toMatchObject({
      phase: 'local',
      reason: 'ready',
      active: { generation: expect.stringMatching(/^media:5:0:/) },
    });
    controller.dispose();
  });

  it('installs only an exact A6 key/generation/clearEpoch fence and preserves Ready identity', async () => {
    const h = await mountedHarness();
    expect(h.controller.getState().active?.ready).toBe(h.ready);
    expect(h.controller.getState().active?.generation).toBe(`media:4:2:${h.key}`);
    h.controller.dispose();

    const mismatch = await localReady();
    const controller = createProductionMediaController({
      source: null,
      allowedOrigins: mismatch.input.allowedOrigins,
      openOffline: async () =>
        ({
          readActive: async () => ({
            ready: mismatch.ready,
            generation: 4,
            clearEpoch: 2,
            checkedAt: mismatch.input.now,
          }),
          snapshot: async () => ({
            control: { generation: 5, clearEpoch: 2, activeKey: mismatch.key },
          }),
          close: () => {},
        }) as never,
      openResume: async () =>
        ({ snapshot: async () => ({ generation: 0, records: [] }), close: () => {} }) as never,
      now: () => mismatch.input.now,
    });
    await controller.mount();
    expect(controller.getState().active).toBeNull();
    controller.dispose();
  });

  it('uses the requested exact episode record and rejects a stale sibling despite another match', async () => {
    const { ready } = await localReady();
    const stream = ready.documents.manifest.streams[0]!;
    const valid: ProductionMediaResumeRecord = {
      recordVersion: 1,
      key: 'episode:' + stream.episodeId,
      episodeId: stream.episodeId,
      streamId: stream.id,
      releaseRevision: ready.pointer.releaseRevision,
      streamRevision: stream.streamRevision,
      positionMs: 12_000,
      durationMs: stream.durationMs,
    };
    const stale = {
      ...valid,
      key: 'episode:missing-episode',
      episodeId: 'missing-episode',
      positionMs: 5_000,
    };
    const h = await mountedHarness({ records: [stale, valid] });
    expect(h.controller.prepareResume('missing-episode')).toBeNull();
    expect(h.controller.prepareResume(stream.episodeId)).not.toBeNull();
    expect(h.media.calls).toEqual([]);
    await vi.waitFor(() =>
      expect(h.resumeStore.deleteIfExact).toHaveBeenCalledWith(
        stale.key,
        stale,
        0,
        expect.any(AbortSignal),
      ),
    );
    h.controller.dispose();
  });

  it('saves declared A1 duration on explicit pause when observed audio is shorter within tolerance', async () => {
    const saved: ProductionMediaResumeRecord[] = [];
    const h = await mountedHarness({
      save: vi.fn(async (record, generation) => {
        saved.push(record);
        return { kind: 'saved' as const, state: { generation: generation + 1, records: [record] } };
      }),
    });
    h.media.audio.duration = h.ready.documents.manifest.streams[0]!.durationMs / 1000 - 4;
    await startPlaying(h, 34_567);
    expect(h.controller.pause()).toBe(true);
    await flush();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      positionMs: 34_567,
      durationMs: h.ready.documents.manifest.streams[0]!.durationMs,
    });
    await vi.waitFor(() => expect(h.controller.prepareResume('episode-0')).not.toBeNull());
    h.controller.dispose();
  });

  it('gives no cleanup ownership to an A5 save no-op', async () => {
    const remove = vi.fn(async () => ({
      kind: 'no-op' as const,
      state: { generation: 0, records: [] },
    }));
    const h = await mountedHarness({
      save: vi.fn(async () => ({
        kind: 'no-op' as const,
        state: { generation: 0, records: [] },
      })),
      deleteIfExact: remove,
    });
    await startPlaying(h, 10_000);
    h.controller.pause();
    await flush();
    h.controller.continue();
    await flush();
    expect(remove).not.toHaveBeenCalled();
    h.controller.dispose();
  });

  it('continues the same buffer and compensates an exact completed pause save', async () => {
    const h = await mountedHarness();
    await startPlaying(h, 22_222);
    const audio = h.media.audio;
    h.controller.pause();
    await flush();
    expect(h.getResume().records).toHaveLength(1);
    h.controller.continue();
    await flush();
    expect(h.getResume().records).toHaveLength(0);
    expect(h.media.audio).toBe(audio);
    expect(h.media.audio.currentTime).toBeCloseTo(22.222);
    expect(h.media.calls.filter((call) => call === 'src')).toHaveLength(1);
    h.controller.dispose();
  });

  it('invalidates a pending pause before continue and deletes only its eventual exact save', async () => {
    const pending = deferred<{
      kind: 'saved';
      state: { generation: number; records: readonly ProductionMediaResumeRecord[] };
    }>();
    let pendingRecord: ProductionMediaResumeRecord | null = null;
    const removed: ProductionMediaResumeRecord[] = [];
    const h = await mountedHarness({
      save: vi.fn(async (record) => {
        pendingRecord = record;
        return pending.promise;
      }),
      deleteIfExact: vi.fn(async (_key, record, generation) => {
        removed.push(record);
        return { kind: 'deleted' as const, state: { generation: generation + 1, records: [] } };
      }),
    });
    await startPlaying(h, 7_000);
    h.controller.pause();
    h.controller.continue();
    await flush();
    expect(pendingRecord).not.toBeNull();
    pending.resolve({
      kind: 'saved',
      state: { generation: 1, records: [pendingRecord!] },
    });
    await vi.waitFor(() => expect(removed).toEqual([pendingRecord]));
    h.controller.dispose();
  });

  it('never deletes a concurrently changed resume row during compensation', async () => {
    let original: ProductionMediaResumeRecord | null = null;
    let concurrent: ProductionMediaResumeRecord | null = null;
    const remove = vi.fn(async (key: string, expected: ProductionMediaResumeRecord) => {
      expect(key).toBe(expected.key);
      return {
        kind: 'no-op' as const,
        state: { generation: 2, records: [concurrent!] },
      };
    });
    const h = await mountedHarness({
      save: vi.fn(async (record) => {
        original = record;
        concurrent = { ...record, positionMs: record.positionMs + 1 };
        return { kind: 'saved' as const, state: { generation: 1, records: [record] } };
      }),
      deleteIfExact: remove,
    });
    await startPlaying(h, 8_000);
    h.controller.pause();
    await flush();
    h.controller.continue();
    await flush();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0]![1]).toBe(original);
    expect(remove.mock.calls[0]![1]).not.toBe(concurrent);
    h.controller.dispose();
  });

  it('clears A6 first and leaves A5 untouched when A6 clear fails', async () => {
    const clearResume = vi.fn();
    const h = await mountedHarness({
      clearA6: vi.fn(async () => {
        throw new Error('blocked');
      }),
      clearExact: clearResume,
    });
    await h.controller.clearLocal();
    expect(clearResume).not.toHaveBeenCalled();
    expect(h.controller.getState()).toMatchObject({
      phase: 'storage-error',
      active: null,
    });
    h.controller.dispose();
  });

  it('reports a successful A6 clear with residual concurrent A5 data as partial storage failure', async () => {
    const { ready } = await localReady();
    const stream = ready.documents.manifest.streams[0]!;
    const record: ProductionMediaResumeRecord = {
      recordVersion: 1,
      key: 'episode:' + stream.episodeId,
      episodeId: stream.episodeId,
      streamId: stream.id,
      releaseRevision: ready.pointer.releaseRevision,
      streamRevision: stream.streamRevision,
      positionMs: 1000,
      durationMs: stream.durationMs,
    };
    const concurrent = { ...record, positionMs: 2000 };
    const h = await mountedHarness({
      records: [record],
      clearExact: vi.fn(async () => ({
        kind: 'no-op' as const,
        state: { generation: 1, records: [concurrent] },
      })),
    });
    await h.controller.clearLocal();
    expect(h.controller.getState()).toMatchObject({
      phase: 'storage-error',
      reason: 'storage-error',
      active: null,
      resume: { kind: 'unavailable' },
    });
    h.controller.dispose();
  });

  it('retries a clear no-op once with only the original exact rows and observed generation', async () => {
    const { ready } = await localReady();
    const stream = ready.documents.manifest.streams[0]!;
    const record: ProductionMediaResumeRecord = {
      recordVersion: 1,
      key: 'episode:' + stream.episodeId,
      episodeId: stream.episodeId,
      streamId: stream.id,
      releaseRevision: ready.pointer.releaseRevision,
      streamRevision: stream.streamRevision,
      positionMs: 1000,
      durationMs: stream.durationMs,
    };
    const clear = vi
      .fn()
      .mockResolvedValueOnce({
        kind: 'no-op',
        state: { generation: 7, records: [record] },
      })
      .mockResolvedValueOnce({
        kind: 'deleted',
        state: { generation: 8, records: [] },
      });
    const h = await mountedHarness({ records: [record], clearExact: clear });
    (h.resumeStore.snapshot as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ generation: 0, records: [record] })
      .mockResolvedValueOnce({ generation: 8, records: [] });
    await h.controller.clearLocal();
    expect(clear).toHaveBeenCalledTimes(2);
    expect(clear.mock.calls[1]).toEqual([[record], 7, expect.any(AbortSignal)]);
    expect(h.controller.getState()).toMatchObject({
      phase: 'local',
      reason: 'cleared',
      resume: { kind: 'none' },
    });
    h.controller.dispose();
  });

  it('times out the whole mount at 30000ms and closes both late-opened handles', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const left = deferred<ProductionMediaOfflineStore>();
    const right = deferred<ProductionMediaResumeStore>();
    const closeOffline = vi.fn();
    const closeResume = vi.fn();
    const controller = createProductionMediaController({
      source: null,
      allowedOrigins: new Set(),
      openOffline: () => left.promise,
      openResume: () => right.promise,
    });
    const mounting = controller.mount();
    await vi.advanceTimersByTimeAsync(29_999);
    expect(controller.getState().reason).toBe('no-active-release');
    await vi.advanceTimersByTimeAsync(1);
    await mounting;
    expect(controller.getState().reason).toBe('timeout');
    left.resolve({ close: closeOffline } as never);
    right.resolve({ close: closeResume } as never);
    await vi.advanceTimersByTimeAsync(1);
    expect(closeOffline).toHaveBeenCalledOnce();
    expect(closeResume).toHaveBeenCalledOnce();
    controller.dispose();
    vi.useRealTimers();
  });

  it('settles a stalled active-key hash by 30001ms without installing authority', async () => {
    const local = await localReady();
    const stalled = deferred<ArrayBuffer>();
    const digest = vi
      .spyOn(globalThis.crypto.subtle, 'digest')
      .mockImplementation(() => stalled.promise);
    const closeOffline = vi.fn();
    const closeResume = vi.fn();
    const controller = createProductionMediaController({
      source: null,
      allowedOrigins: local.input.allowedOrigins,
      openOffline: async () =>
        ({
          readActive: async () => ({
            ready: local.ready,
            generation: 1,
            clearEpoch: 0,
            checkedAt: local.input.now,
          }),
          snapshot: async () => ({
            control: { generation: 1, clearEpoch: 0, activeKey: local.key },
          }),
          close: closeOffline,
        }) as never,
      openResume: async () =>
        ({
          snapshot: async () => ({ generation: 0, records: [] }),
          close: closeResume,
        }) as never,
      now: () => local.input.now,
    });
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const mounting = controller.mount();
    for (let turn = 0; turn < 12 && digest.mock.calls.length === 0; turn += 1)
      await vi.advanceTimersByTimeAsync(0);
    expect(digest).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(29_999);
    expect(controller.getState()).toMatchObject({ active: null, reason: 'no-active-release' });
    await vi.advanceTimersByTimeAsync(2);
    await mounting;
    expect(controller.getState()).toMatchObject({
      phase: 'storage-error',
      reason: 'timeout',
      active: null,
    });
    controller.dispose();
    expect(closeOffline).toHaveBeenCalledOnce();
    await flush();
    expect(closeResume).toHaveBeenCalledOnce();
    digest.mockRestore();
    vi.useRealTimers();
  });

  it('treats an attempted safety commit without exact readback as uncertain and never finishes', async () => {
    const h = await mountedHarness();
    const finish = vi.fn();
    const commit = vi.fn(async () => {
      throw new Error('readback lost');
    });
    const controller = createProductionMediaController({
      source: {
        load: async ({ commitSafety }) => {
          try {
            await commitSafety(
              { revision: 1, floor: 1, revocationSha256: null, entries: [] },
              new AbortController().signal,
            );
          } catch {
            return { kind: 'failed', failure: 'safety-commit-failed' } as never;
          }
          throw new Error('ordinary payload must not run');
        },
      },
      allowedOrigins: new Set(['https://publisher.invalid']),
      openOffline: async () =>
        ({
          snapshot: async () => ({
            control: {
              generation: 0,
              clearEpoch: 0,
              activeKey: null,
              safety: { revision: 0, floor: 0, revocationSha256: null, entries: [] },
            },
          }),
          prepareRecheck: async () => ({
            generation: 1,
            clearEpoch: 0,
            activeKey: null,
            safety: { revision: 0, floor: 0, revocationSha256: null, entries: [] },
          }),
          commitSafety: commit,
          finishRecheck: finish,
          close: () => {},
        }) as never,
      openResume: async () => h.resumeStore,
      now: () => h.input.now,
      operationId: () => 'uncertain-safety',
    });
    await controller.recheck();
    expect(commit).toHaveBeenCalledOnce();
    expect(finish).not.toHaveBeenCalled();
    expect(controller.getState()).toMatchObject({ active: null, reason: 'conflict' });
    controller.dispose();
    h.controller.dispose();
  });

  it.each([
    [
      'throwing',
      () => {
        throw new Error('clock');
      },
    ],
    ['nonfinite', () => Number.NaN],
  ])('settles a %s domain clock failure without installing context', async (_label, now) => {
    const local = await localReady();
    const controller = createProductionMediaController({
      source: null,
      allowedOrigins: local.input.allowedOrigins,
      openOffline: async () =>
        ({
          readActive: async () => ({
            ready: local.ready,
            generation: 1,
            clearEpoch: 0,
            checkedAt: local.input.now,
          }),
          snapshot: async () => ({
            control: { generation: 1, clearEpoch: 0, activeKey: local.key },
          }),
          close: () => {},
        }) as never,
      openResume: async () =>
        ({ snapshot: async () => ({ generation: 0, records: [] }), close: () => {} }) as never,
      now,
    });
    await controller.mount();
    expect(controller.getState()).toMatchObject({ active: null, phase: 'storage-error' });
    controller.dispose();
  });

  it('keeps dispose synchronous and final when a mounted read settles late', async () => {
    const local = await localReady();
    const reading =
      deferred<
        ReturnType<ProductionMediaResumeStore['snapshot']> extends Promise<infer T> ? T : never
      >();
    const snapshotStarted = deferred<void>();
    const closeOffline = vi.fn();
    const closeResume = vi.fn();
    const controller = createProductionMediaController({
      source: null,
      allowedOrigins: local.input.allowedOrigins,
      openOffline: async () =>
        ({
          readActive: async () => ({
            ready: local.ready,
            generation: 1,
            clearEpoch: 0,
            checkedAt: local.input.now,
          }),
          snapshot: async () => ({
            control: { generation: 1, clearEpoch: 0, activeKey: local.key },
          }),
          close: closeOffline,
        }) as never,
      openResume: async () =>
        ({
          snapshot: () => {
            snapshotStarted.resolve();
            return reading.promise;
          },
          close: closeResume,
        }) as never,
      now: () => local.input.now,
    });
    const mounting = controller.mount();
    await snapshotStarted.promise;
    controller.dispose();
    expect(controller.getState().phase).toBe('disposed');
    reading.resolve({ generation: 0, records: [] });
    await mounting;
    expect(controller.getState().phase).toBe('disposed');
    expect(closeOffline).toHaveBeenCalledOnce();
    expect(closeResume).toHaveBeenCalledOnce();
  });

  it('keeps every async public command inert after final dispose', async () => {
    const openOffline = vi.fn(async () => {
      throw new Error('post-dispose A6 open');
    });
    const openResume = vi.fn(async () => {
      throw new Error('post-dispose A5 open');
    });
    const load = vi.fn(async () => {
      throw new Error('post-dispose source load');
    });
    const controller = createProductionMediaController({
      source: { load },
      allowedOrigins: new Set(['https://publisher.invalid']),
      openOffline,
      openResume,
      now: vi.fn(() => Date.parse('2026-09-11T12:00:00.000Z')),
      operationId: vi.fn(() => 'post-dispose-operation'),
    });
    controller.dispose();
    const disposed = controller.getState();
    const setTimer = vi.spyOn(globalThis, 'setTimeout');

    const results = await Promise.all([
      controller.mount(),
      controller.recheck(),
      controller.rollback(),
      controller.clearLocal(),
    ]);

    expect(results).toEqual([disposed, disposed, disposed, disposed]);
    expect(controller.getState()).toBe(disposed);
    expect(openOffline).not.toHaveBeenCalled();
    expect(openResume).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
    expect(setTimer).not.toHaveBeenCalled();
    setTimer.mockRestore();
  });

  it('forwards cancelConsent so a dismissed prompt cannot touch audio', async () => {
    const h = await mountedHarness();
    const prompt = h.controller.preparePlay('episode-0');
    expect(prompt).not.toBeNull();
    h.controller.cancelConsent();
    expect(h.controller.confirmPlay(prompt!)).toBe(false);
    expect(h.media.calls).toEqual([]);
    h.controller.dispose();
  });

  it('does not save browser pause and saves only the explicit pause command', async () => {
    const save = vi.fn(async (record: ProductionMediaResumeRecord, generation: number) => ({
      kind: 'saved' as const,
      state: { generation: generation + 1, records: [record] },
    }));
    const h = await mountedHarness({ save });
    await startPlaying(h, 4_000);
    h.media.audio.onpause?.call(h.media.audio as unknown as HTMLAudioElement, new Event('pause'));
    await flush();
    expect(save).not.toHaveBeenCalled();
    await startPlaying(h, 5_000);
    h.controller.pause();
    await vi.waitFor(() => expect(save).toHaveBeenCalledOnce());
    h.controller.dispose();
  });

  it('rejects invalid operation ids before acquiring an A6 lease or calling the source', async () => {
    const prepare = vi.fn();
    const load = vi.fn();
    const controller = createProductionMediaController({
      source: { load },
      allowedOrigins: new Set(),
      openOffline: async () =>
        ({
          snapshot: async () => ({
            control: {
              generation: 0,
              clearEpoch: 0,
              activeKey: null,
              safety: { revision: 0, floor: 0, revocationSha256: null, entries: [] },
            },
          }),
          prepareRecheck: prepare,
          close: () => {},
        }) as never,
      openResume: async () =>
        ({ snapshot: async () => ({ generation: 0, records: [] }), close: () => {} }) as never,
      operationId: () => 'INVALID!',
    });
    await controller.recheck();
    expect(prepare).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
    expect(controller.getState().reason).toBe('conflict');
    controller.dispose();
  });

  it('retains an existing active release after failed rollback only through a fresh A6 fence', async () => {
    const h = await mountedHarness();
    (h.offline.snapshot as ReturnType<typeof vi.fn>).mockResolvedValue({
      control: { generation: 4, clearEpoch: 2, activeKey: h.key },
      bundles: [],
    });
    (h.offline as unknown as { rollback: ReturnType<typeof vi.fn> }).rollback = vi.fn(async () => {
      throw new Error('no historical release');
    });
    await h.controller.rollback();
    expect(h.controller.getState()).toMatchObject({
      phase: 'unavailable',
      reason: 'rollback-unavailable',
      active: { generation: `media:4:2:${h.key}` },
    });
    expect(h.offline.readActive).toHaveBeenCalledTimes(2);
    h.controller.dispose();
  });

  it('installs a successful rollback only from the post-rollback A6 readActive fence', async () => {
    const h = await mountedHarness();
    const rollback = vi.fn(async () => ({
      generation: 5,
      clearEpoch: 2,
      activeKey: h.key,
    }));
    (h.offline as unknown as { rollback: typeof rollback }).rollback = rollback;
    (h.offline.readActive as ReturnType<typeof vi.fn>).mockResolvedValue({
      ready: h.ready,
      generation: 5,
      clearEpoch: 2,
      checkedAt: h.input.now,
    });
    (h.offline.snapshot as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        control: { generation: 4, clearEpoch: 2, activeKey: h.key },
        bundles: [],
      })
      .mockResolvedValueOnce({
        control: { generation: 5, clearEpoch: 2, activeKey: h.key },
        bundles: [],
      });
    await h.controller.rollback();
    expect(rollback).toHaveBeenCalledWith(
      h.input.now,
      expect.any(Set),
      { generation: 4, clearEpoch: 2 },
      { kind: 'production-media-provider-policy-v1', relationships: [] },
      expect.any(AbortSignal),
    );
    expect(h.controller.getState()).toMatchObject({
      phase: 'local',
      reason: 'ready',
      active: { generation: `media:5:2:${h.key}` },
    });
    h.controller.dispose();
  });

  it('lets an observer-triggered dispose win over a ready mount publication', async () => {
    const local = await localReady();
    const closeOffline = vi.fn();
    const closeResume = vi.fn();
    const holder: { controller: ReturnType<typeof createProductionMediaController> | null } = {
      controller: null,
    };
    const controller = createProductionMediaController({
      source: null,
      allowedOrigins: local.input.allowedOrigins,
      openOffline: async () =>
        ({
          readActive: async () => ({
            ready: local.ready,
            generation: 1,
            clearEpoch: 0,
            checkedAt: local.input.now,
          }),
          snapshot: async () => ({
            control: { generation: 1, clearEpoch: 0, activeKey: local.key },
          }),
          close: closeOffline,
        }) as never,
      openResume: async () =>
        ({
          snapshot: async () => ({ generation: 0, records: [] }),
          close: closeResume,
        }) as never,
      now: () => local.input.now,
      onState: (next) => {
        if (next.reason === 'ready') holder.controller?.dispose();
      },
    });
    holder.controller = controller;
    await controller.mount();
    expect(controller.getState()).toMatchObject({ phase: 'disposed', active: null });
    expect(closeOffline).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(closeResume).toHaveBeenCalledOnce());
  });

  it('bounds pause save and dependent pending-continue cleanup to one 30000ms budget', async () => {
    const pending = deferred<{
      kind: 'saved';
      state: { generation: number; records: readonly ProductionMediaResumeRecord[] };
    }>();
    const pendingDelete = deferred<{
      kind: 'deleted';
      state: { generation: number; records: readonly ProductionMediaResumeRecord[] };
    }>();
    let record: ProductionMediaResumeRecord | null = null;
    let saveSignal: AbortSignal | undefined;
    let deleteSignal: AbortSignal | undefined;
    const h = await mountedHarness({
      save: vi.fn(async (value, _generation, signal) => {
        record = value;
        saveSignal = signal;
        return pending.promise;
      }),
      deleteIfExact: vi.fn(async (_key, _value, generation, signal) => {
        deleteSignal = signal;
        void generation;
        return pendingDelete.promise;
      }),
    });
    await startPlaying(h, 9_000);
    vi.useFakeTimers();
    vi.setSystemTime(0);
    h.controller.pause();
    h.controller.continue();
    await flush();
    expect(saveSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(29_999);
    expect(saveSignal?.aborted).toBe(false);
    pending.resolve({
      kind: 'saved',
      state: { generation: 1, records: [record!] },
    });
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(deleteSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await flush();
    expect(saveSignal?.aborted).toBe(true);
    expect(deleteSignal?.aborted).toBe(true);
    pendingDelete.resolve({ kind: 'deleted', state: { generation: 2, records: [] } });
    h.controller.dispose();
    vi.useRealTimers();
  });

  it('gives cleanup requested after a completed save its own 30000ms bound', async () => {
    const deleting = deferred<{
      kind: 'deleted';
      state: { generation: number; records: readonly ProductionMediaResumeRecord[] };
    }>();
    let deleteSignal: AbortSignal | undefined;
    const h = await mountedHarness({
      deleteIfExact: vi.fn(async (_key, _record, _generation, signal) => {
        deleteSignal = signal;
        return deleting.promise;
      }),
    });
    await startPlaying(h, 11_000);
    h.controller.pause();
    await vi.waitFor(() => expect(h.controller.getState().resume.kind).toBe('available'));
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
    h.controller.continue();
    await flush();
    expect(deleteSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(29_999);
    expect(deleteSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await flush();
    expect(deleteSignal?.aborted).toBe(true);
    deleting.resolve({ kind: 'deleted', state: { generation: 2, records: [] } });
    h.controller.dispose();
    vi.useRealTimers();
  });

  it('rejects a regressive domain clock on rollback and cannot revive stale authority', async () => {
    const local = await localReady();
    let first = true;
    const store = {
      readActive: async () => ({
        ready: local.ready,
        generation: 1,
        clearEpoch: 0,
        checkedAt: local.input.now,
      }),
      snapshot: async () => ({
        control: { generation: 1, clearEpoch: 0, activeKey: local.key },
      }),
      rollback: vi.fn(),
      close: () => {},
    } as unknown as ProductionMediaOfflineStore;
    const controller = createProductionMediaController({
      source: null,
      allowedOrigins: local.input.allowedOrigins,
      openOffline: async () => store,
      openResume: async () =>
        ({ snapshot: async () => ({ generation: 0, records: [] }), close: () => {} }) as never,
      now: () => {
        if (first) {
          first = false;
          return local.input.now;
        }
        return local.input.now - 1;
      },
    });
    await controller.mount();
    await controller.rollback();
    expect(store.rollback).not.toHaveBeenCalled();
    expect(controller.getState()).toMatchObject({
      phase: 'unavailable',
      reason: 'rollback-unavailable',
      active: null,
    });
    controller.dispose();
  });

  it('drops installed playback authority inside a successful safety callback before observers continue', async () => {
    const local = await localReady();
    let generation = 1;
    let activeKey: string | null = local.key;
    const seenAfterSafety: Array<boolean> = [];
    const holder: { controller: ReturnType<typeof createProductionMediaController> | null } = {
      controller: null,
    };
    const store = {
      snapshot: async () => ({
        control: {
          generation,
          clearEpoch: 0,
          activeKey,
          safety: { revision: 0, floor: 0, revocationSha256: null, entries: [] },
        },
      }),
      readActive: async () =>
        activeKey
          ? {
              ready: local.ready,
              generation,
              clearEpoch: 0,
              checkedAt: local.input.now,
            }
          : null,
      prepareRecheck: async () => ({
        generation: ++generation,
        clearEpoch: 0,
        activeKey,
        safety: { revision: 0, floor: 0, revocationSha256: null, entries: [] },
      }),
      commitSafety: async () => ({
        generation: ++generation,
        clearEpoch: 0,
        activeKey: (activeKey = null),
        safety: { revision: 1, floor: 1, revocationSha256: null, entries: [] },
      }),
      finishRecheck: async () => ({
        generation: ++generation,
        clearEpoch: 0,
        activeKey,
        safety: { revision: 1, floor: 1, revocationSha256: null, entries: [] },
      }),
      close: () => {},
    } as unknown as ProductionMediaOfflineStore;
    const controller = createProductionMediaController({
      source: {
        load: async ({ commitSafety }) => {
          await commitSafety(
            { revision: 1, floor: 1, revocationSha256: null, entries: [] },
            new AbortController().signal,
          );
          seenAfterSafety.push(holder.controller?.getState().active === null);
          return { kind: 'failed', failure: 'missing-document' } as never;
        },
      },
      allowedOrigins: local.input.allowedOrigins,
      openOffline: async () => store,
      openResume: async () =>
        ({ snapshot: async () => ({ generation: 0, records: [] }), close: () => {} }) as never,
      now: () => local.input.now,
      operationId: () => 'revoke-active',
    });
    holder.controller = controller;
    await controller.mount();
    expect(controller.getState().active).not.toBeNull();
    await controller.recheck();
    expect(seenAfterSafety).toEqual([true]);
    expect(controller.getState()).toMatchObject({
      reason: 'safety-persisted-payload-failed',
      active: null,
    });
    controller.dispose();
  });

  it('lets a newer mount epoch win and closes both handles returned late to the loser', async () => {
    const firstOffline = deferred<ProductionMediaOfflineStore>();
    const firstResume = deferred<ProductionMediaResumeStore>();
    const lateOfflineClose = vi.fn();
    const lateResumeClose = vi.fn();
    let offlineCalls = 0;
    let resumeCalls = 0;
    const controller = createProductionMediaController({
      source: null,
      allowedOrigins: new Set(),
      openOffline: async () => {
        offlineCalls++;
        if (offlineCalls === 1) return firstOffline.promise;
        return {
          readActive: async () => null,
          close: vi.fn(),
        } as never;
      },
      openResume: async () => {
        resumeCalls++;
        if (resumeCalls === 1) return firstResume.promise;
        return {
          snapshot: async () => ({ generation: 0, records: [] }),
          close: vi.fn(),
        } as never;
      },
    });
    const loser = controller.mount();
    await flush();
    await controller.mount();
    firstOffline.resolve({ close: lateOfflineClose } as never);
    firstResume.resolve({ close: lateResumeClose } as never);
    await loser;
    await flush();
    expect(controller.getState()).toMatchObject({
      phase: 'local',
      reason: 'no-active-release',
      active: null,
    });
    expect(lateOfflineClose).toHaveBeenCalledOnce();
    expect(lateResumeClose).toHaveBeenCalledOnce();
    controller.dispose();
  });
});
