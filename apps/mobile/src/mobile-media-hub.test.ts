import { describe, expect, it, vi } from 'vitest';
import { createMobileMediaHub } from './mobile-media-hub';
import type {
  MobileMediaResumeMutation,
  MobileMediaResumeRecord,
  MobileMediaResumeState,
  MobileMediaResumeStore,
} from './mobile-media-resume-store';

const hash = 'a'.repeat(64);
const at = Date.parse('2030-01-01T00:00:00.000Z');
const snapshot = (overrides: Record<string, unknown> = {}) => ({
  control: { generation: 2, active: 'active' as const },
  safety: { generation: 1, revision: 1, entries: [] },
  bundles: {
    active: {
      revision: 1,
      transportSha256: 'b'.repeat(64),
      rawBundle: {
        releaseRaw: JSON.stringify({ validUntil: '2030-01-02T00:00:00.000Z' }),
        documentsRaw: {
          manifest: JSON.stringify({
            episodes: [
              {
                id: 'episode',
                sourceId: 'source',
                seriesId: 'series',
                audioAssetId: 'asset',
                durationMs: 100,
                title: { en: 'Title' },
                summary: { en: 'Summary' },
              },
            ],
            assets: [
              {
                id: 'asset',
                kind: 'audio',
                mime: 'audio/wav',
                path: '/local.wav',
                bytes: 4,
                sha256: hash,
              },
            ],
            series: [{ id: 'series' }],
          }),
          admission: JSON.stringify({
            sources: [
              {
                id: 'source',
                displayName: { en: 'Source' },
                validUntil: '2030-01-02T00:00:00.000Z',
              },
            ],
          }),
          rights: JSON.stringify({
            rights: [
              {
                assetId: 'asset',
                status: 'allowed',
                expiresAt: '2030-01-02T00:00:00.000Z',
                attribution: 'Attribution',
                territory: 'global',
              },
            ],
          }),
          consent: JSON.stringify({
            consents: [
              { episodeId: 'episode', mode: 'local-no-third-party', requiresPrompt: false },
            ],
          }),
        },
      },
    },
  },
  ...overrides,
});

describe('active-only media hub boundary', () => {
  it('does not project when no active bundle exists', async () => {
    const hub = createMobileMediaHub({
      snapshot: async () => ({
        control: { generation: 0, active: null },
        safety: { generation: 0, revision: 0, entries: [] },
        bundles: { active: null },
      }),
    });
    await expect(hub.projection()).resolves.toMatchObject({ kind: 'empty', identity: null });
  });

  it('projects only a fresh active local-audio viewmodel without UI ownership', async () => {
    const hub = createMobileMediaHub({ snapshot: async () => snapshot(), clock: () => at });
    await expect(hub.projection()).resolves.toEqual(
      expect.objectContaining({
        kind: 'ready',
        episodeId: 'episode',
        audioAssetId: 'asset',
        audioAssetHash: hash,
        releaseRevision: 1,
        durationMs: 100,
        delivery: 'local-no-third-party',
        attribution: 'Attribution',
      }),
    );
  });

  it.each([
    ['release expiry', {}],
    [
      'safety block',
      {
        safety: {
          generation: 2,
          revision: 2,
          entries: [{ targetKind: 'episode', targetId: 'episode', targetHash: null }],
        },
      },
    ],
  ])('fails closed for %s', async (_name, override) => {
    const clock =
      _name === 'release expiry' ? () => Date.parse('2030-01-02T00:00:00.000Z') : () => at;
    const hub = createMobileMediaHub({ snapshot: async () => snapshot(override), clock });
    await expect(hub.projection()).resolves.toMatchObject({
      kind: _name === 'safety block' ? 'blocked' : 'stale',
    });
  });

  it('rejects a malformed rights relationship before it can become a player context', async () => {
    const value = snapshot();
    value.bundles.active!.rawBundle.documentsRaw.rights = JSON.stringify({ rights: [] });
    const request = async () =>
      new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'audio/wav' } });
    const hub = createMobileMediaHub({
      snapshot: async () => value,
      clock: () => at,
      fetch: request,
    });
    await hub.player.start();
    expect(hub.player.state()).toMatchObject({ playback: 'idle', availability: 'stale' });
  });

  it.each([
    ['source', 'source', null],
    ['series', 'series', null],
    ['episode', 'episode', null],
    ['audio asset', 'asset', hash],
  ])(
    'projects a %s safety block before a player can be created',
    async (_name, targetKind, targetHash) => {
      const value = snapshot();
      value.safety = {
        generation: 2,
        revision: 2,
        entries: [
          { targetKind, targetId: targetKind === 'asset' ? 'asset' : targetKind, targetHash },
        ],
      } as unknown as typeof value.safety;
      const hub = createMobileMediaHub({ snapshot: async () => value, clock: () => at });
      await expect(hub.projection()).resolves.toMatchObject({ kind: 'blocked' });
    },
  );

  it('keeps blocked dominant over an equal release expiry', async () => {
    const value = snapshot();
    value.safety = {
      generation: 2,
      revision: 2,
      entries: [{ targetKind: 'episode', targetId: 'episode', targetHash: null }],
    } as unknown as typeof value.safety;
    const hub = createMobileMediaHub({
      snapshot: async () => value,
      clock: () => Date.parse('2030-01-02T00:00:00.000Z'),
    });
    await expect(hub.projection()).resolves.toMatchObject({ kind: 'blocked' });
  });

  it.each([
    ['release', 'releaseRaw'],
    ['rights', 'rights'],
    ['source', 'admission'],
  ] as const)('treats %s expiry equality and plus one as stale', async (_name, field) => {
    const expiry = '2030-01-02T00:00:00.000Z';
    const value = snapshot();
    if (field === 'releaseRaw')
      value.bundles.active!.rawBundle.releaseRaw = JSON.stringify({ validUntil: expiry });
    if (field === 'rights')
      value.bundles.active!.rawBundle.documentsRaw.rights = JSON.stringify({
        rights: [
          {
            assetId: 'asset',
            status: 'allowed',
            expiresAt: expiry,
            attribution: 'A',
            territory: 'global',
          },
        ],
      });
    if (field === 'admission')
      value.bundles.active!.rawBundle.documentsRaw.admission = JSON.stringify({
        sources: [{ id: 'source', displayName: { en: 'Source' }, validUntil: expiry }],
      });
    const equal = Date.parse(expiry);
    for (const now of [equal, equal + 1]) {
      const hub = createMobileMediaHub({ snapshot: async () => value, clock: () => now });
      await expect(hub.projection()).resolves.toMatchObject({ kind: 'stale' });
    }
  });
});

const audioHash = '9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a';
const resumeRecord = (patch: Partial<MobileMediaResumeRecord> = {}): MobileMediaResumeRecord => ({
  recordVersion: 1,
  key: 'resume:episode:asset',
  episodeId: 'episode',
  audioAssetId: 'asset',
  releaseRevision: 1,
  audioAssetHash: audioHash,
  positionMs: 10,
  durationMs: 100,
  ...patch,
});
const memoryResumeStore = (
  initial: readonly MobileMediaResumeRecord[] = [],
): MobileMediaResumeStore => {
  let generation = 0;
  let records = [...initial];
  const state = (): MobileMediaResumeState => ({ generation, records: [...records] });
  const result = (kind: MobileMediaResumeMutation['kind']): MobileMediaResumeMutation => ({
    kind,
    state: state(),
  });
  return {
    snapshot: vi.fn(async () => state()),
    save: vi.fn(async (value, expected) => {
      if (expected !== generation) return result('no-op');
      const index = records.findIndex((item) => item.key === value.key);
      if (index >= 0) records[index] = value;
      else records.push(value);
      generation += 1;
      return result('saved');
    }),
    deleteIfExact: vi.fn(async (key, expected, expectedGeneration) => {
      const current = records.find((item) => item.key === key);
      if (expectedGeneration !== generation || JSON.stringify(current) !== JSON.stringify(expected))
        return result('no-op');
      records = records.filter((item) => item.key !== key);
      generation += 1;
      return result('deleted');
    }),
    clearExact: vi.fn(async () => result('no-op')),
    close: vi.fn(),
  };
};

const audioReadySnapshot = () => {
  const value = snapshot();
  value.bundles.active!.rawBundle.documentsRaw.manifest = JSON.stringify({
    episodes: [
      {
        id: 'episode',
        sourceId: 'source',
        seriesId: 'series',
        audioAssetId: 'asset',
        durationMs: 100,
        title: { en: 'Title' },
        summary: { en: 'Summary' },
      },
    ],
    assets: [
      {
        id: 'asset',
        kind: 'audio',
        mime: 'audio/wav',
        path: '/local.wav',
        bytes: 4,
        sha256: audioHash,
      },
    ],
    series: [{ id: 'series' }],
  });
  return value;
};

const resumeAudio = () => ({
  src: '',
  currentTime: 0.01,
  load: vi.fn(),
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  onpause: null as ((event: Event) => void) | null,
  onended: null as ((event: Event) => void) | null,
  onerror: null as ((event: Event) => void) | null,
});

describe('media hub resume orchestration', () => {
  it('saves only a confirmed pause and seeks only after bytes and an explicit second action', async () => {
    const saved = memoryResumeStore();
    const audio = {
      src: '',
      currentTime: 0.01,
      load: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      onpause: null as ((event: Event) => void) | null,
      onended: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    const ready = snapshot();
    ready.bundles.active!.rawBundle.documentsRaw.manifest = JSON.stringify({
      episodes: [
        {
          id: 'episode',
          sourceId: 'source',
          seriesId: 'series',
          audioAssetId: 'asset',
          durationMs: 100,
          title: { en: 'Title' },
          summary: { en: 'Summary' },
        },
      ],
      assets: [
        {
          id: 'asset',
          kind: 'audio',
          mime: 'audio/wav',
          path: '/local.wav',
          bytes: 4,
          sha256: audioHash,
        },
      ],
      series: [{ id: 'series' }],
    });
    const hub = createMobileMediaHub({
      snapshot: async () => ready,
      clock: () => at,
      resumeStore: saved,
      fetch: async () =>
        new Response(new Uint8Array([1, 2, 3, 4]), {
          status: 200,
          headers: { 'content-type': 'audio/wav' },
        }),
      audio: () => audio,
      createObjectURL: () => 'blob:resume',
      revokeObjectURL: vi.fn(),
    });
    expect(await hub.resumeOnUserAction()).toBe(false);
    await hub.player.start();
    audio.onpause?.(new Event('pause'));
    await vi.waitFor(() => expect(hub.resumeStatus()).toBe('saved'));
    expect(saved.save).toHaveBeenCalledOnce();
    expect(await hub.resumeOnUserAction()).toBe(true);
    expect(audio.currentTime).toBeCloseTo(0.01);
    expect(hub.resumeStatus()).toBe('resumed');
  });

  it('never seeks a mismatched record and removes only that exact known record', async () => {
    const saved = memoryResumeStore([resumeRecord({ audioAssetHash: 'b'.repeat(64) })]);
    const hub = createMobileMediaHub({
      snapshot: async () => snapshot(),
      clock: () => at,
      resumeStore: saved,
    });
    expect(await hub.resumeOnUserAction()).toBe(false);
    expect(saved.deleteIfExact).toHaveBeenCalledOnce();
    expect(hub.resumeStatus()).toBe('resume-discarded');
  });

  it('does not let a paused run publish or save after unmount invalidates its lifecycle', async () => {
    let releaseSnapshot: (() => void) | undefined;
    const delayedStore: MobileMediaResumeStore = {
      ...memoryResumeStore(),
      snapshot: vi.fn(
        () =>
          new Promise<MobileMediaResumeState>((resolve) => {
            releaseSnapshot = () => resolve({ generation: 0, records: [] });
          }),
      ),
    };
    const audio = {
      src: '',
      currentTime: 0.01,
      load: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      onpause: null as ((event: Event) => void) | null,
      onended: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    const ready = snapshot();
    ready.bundles.active!.rawBundle.documentsRaw.manifest = JSON.stringify({
      episodes: [
        {
          id: 'episode',
          sourceId: 'source',
          seriesId: 'series',
          audioAssetId: 'asset',
          durationMs: 100,
          title: { en: 'Title' },
          summary: { en: 'Summary' },
        },
      ],
      assets: [
        {
          id: 'asset',
          kind: 'audio',
          mime: 'audio/wav',
          path: '/local.wav',
          bytes: 4,
          sha256: audioHash,
        },
      ],
      series: [{ id: 'series' }],
    });
    const hub = createMobileMediaHub({
      snapshot: async () => ready,
      clock: () => at,
      resumeStore: delayedStore,
      fetch: async () =>
        new Response(new Uint8Array([1, 2, 3, 4]), {
          status: 200,
          headers: { 'content-type': 'audio/wav' },
        }),
      audio: () => audio,
      createObjectURL: () => 'blob:late-pause',
      revokeObjectURL: vi.fn(),
    });
    await hub.player.start();
    audio.onpause?.(new Event('pause'));
    await vi.waitFor(() => expect(delayedStore.snapshot).toHaveBeenCalledOnce());
    hub.unmount();
    releaseSnapshot?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(delayedStore.save).not.toHaveBeenCalled();
    expect(hub.resumeStatus()).toBe('idle');
  });

  it('keeps raw seek private and refuses an otherwise matching wrong duration', async () => {
    const saved = memoryResumeStore([resumeRecord({ durationMs: 99 })]);
    const hub = createMobileMediaHub({
      snapshot: async () => snapshot(),
      clock: () => at,
      resumeStore: saved,
    });
    expect('seek' in hub.player).toBe(false);
    expect(await hub.resumeOnUserAction()).toBe(false);
    expect(saved.deleteIfExact).toHaveBeenCalledOnce();
  });

  it('fails closed as storage-failure when a projection snapshot rejects', async () => {
    const hub = createMobileMediaHub({
      snapshot: async () => Promise.reject(new Error('storage')),
      clock: () => at,
    });
    await expect(hub.projection()).resolves.toMatchObject({ kind: 'storage-failure' });
    await hub.player.start();
    expect(hub.player.state()).toEqual({
      playback: 'idle',
      availability: 'storage-failure',
      error: 'storage-failure',
    });
  });

  it('keeps player-only unmount unavailable at runtime and through the public type surface', () => {
    const hub = createMobileMediaHub({ snapshot: async () => snapshot(), clock: () => at });
    expect('unmount' in hub.player).toBe(false);
  });

  it.each(['open', 'snapshot', 'save'] as const)(
    'maps a current pause-%s storage fault to the literal player and resume sinks',
    async (fault) => {
      const audio = {
        src: '',
        currentTime: 0.01,
        load: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        onpause: null as ((event: Event) => void) | null,
        onended: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };
      const base = memoryResumeStore();
      const store: MobileMediaResumeStore = {
        ...base,
        snapshot:
          fault === 'snapshot'
            ? vi.fn(async () => Promise.reject(new Error('idb')))
            : base.snapshot,
        save: fault === 'save' ? vi.fn(async () => Promise.reject(new Error('idb'))) : base.save,
      };
      const ready = snapshot();
      ready.bundles.active!.rawBundle.documentsRaw.manifest = JSON.stringify({
        episodes: [
          {
            id: 'episode',
            sourceId: 'source',
            seriesId: 'series',
            audioAssetId: 'asset',
            durationMs: 100,
            title: { en: 'Title' },
            summary: { en: 'Summary' },
          },
        ],
        assets: [
          {
            id: 'asset',
            kind: 'audio',
            mime: 'audio/wav',
            path: '/local.wav',
            bytes: 4,
            sha256: audioHash,
          },
        ],
        series: [{ id: 'series' }],
      });
      const hub = createMobileMediaHub({
        snapshot: async () => ready,
        clock: () => at,
        resumeStore: fault === 'open' ? async () => Promise.reject(new Error('open')) : store,
        fetch: async () =>
          new Response(new Uint8Array([1, 2, 3, 4]), {
            status: 200,
            headers: { 'content-type': 'audio/wav' },
          }),
        audio: () => audio,
        createObjectURL: () => 'blob:storage-pause',
        revokeObjectURL: vi.fn(),
      });
      await hub.player.start();
      audio.onpause?.(new Event('pause'));
      await vi.waitFor(() => expect(hub.resumeStatus()).toBe('storage-failure'));
      expect(hub.player.state()).toEqual({
        playback: 'idle',
        availability: 'storage-failure',
        error: 'storage-failure',
      });
    },
  );

  it.each(['open', 'snapshot'] as const)(
    'maps a current resume-%s storage fault without seeking',
    async (fault) => {
      const audio = {
        src: '',
        currentTime: 0.01,
        load: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        onpause: null as ((event: Event) => void) | null,
        onended: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };
      const base = memoryResumeStore([resumeRecord()]);
      const store: MobileMediaResumeStore = {
        ...base,
        snapshot: vi.fn(async () => Promise.reject(new Error('idb'))),
      };
      const ready = snapshot();
      ready.bundles.active!.rawBundle.documentsRaw.manifest = JSON.stringify({
        episodes: [
          {
            id: 'episode',
            sourceId: 'source',
            seriesId: 'series',
            audioAssetId: 'asset',
            durationMs: 100,
            title: { en: 'Title' },
            summary: { en: 'Summary' },
          },
        ],
        assets: [
          {
            id: 'asset',
            kind: 'audio',
            mime: 'audio/wav',
            path: '/local.wav',
            bytes: 4,
            sha256: audioHash,
          },
        ],
        series: [{ id: 'series' }],
      });
      const hub = createMobileMediaHub({
        snapshot: async () => ready,
        clock: () => at,
        resumeStore: fault === 'open' ? async () => Promise.reject(new Error('open')) : store,
        fetch: async () =>
          new Response(new Uint8Array([1, 2, 3, 4]), {
            status: 200,
            headers: { 'content-type': 'audio/wav' },
          }),
        audio: () => audio,
        createObjectURL: () => 'blob:storage-resume',
        revokeObjectURL: vi.fn(),
      });
      await hub.player.start();
      expect(await hub.resumeOnUserAction()).toBe(false);
      expect(audio.currentTime).toBe(0.01);
      expect(hub.resumeStatus()).toBe('storage-failure');
      expect(hub.player.state()).toEqual({
        playback: 'idle',
        availability: 'storage-failure',
        error: 'storage-failure',
      });
    },
  );

  it.each(['saved', 'no-op'] as const)(
    'uses provenance before handling a late exact %s save after unmount',
    async (kind) => {
      let resolveSave: ((value: MobileMediaResumeMutation) => void) | undefined;
      const next = resumeRecord({ positionMs: 10 });
      const deferred: MobileMediaResumeStore = {
        ...memoryResumeStore(),
        save: vi.fn(
          () =>
            new Promise<MobileMediaResumeMutation>((resolve) => {
              resolveSave = resolve;
            }),
        ),
        deleteIfExact: vi.fn(async () => ({
          kind: 'deleted' as const,
          state: { generation: 2, records: [] },
        })),
      };
      const audio = {
        src: '',
        currentTime: 0.01,
        load: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        onpause: null as ((event: Event) => void) | null,
        onended: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };
      const ready = snapshot();
      ready.bundles.active!.rawBundle.documentsRaw.manifest = JSON.stringify({
        episodes: [
          {
            id: 'episode',
            sourceId: 'source',
            seriesId: 'series',
            audioAssetId: 'asset',
            durationMs: 100,
            title: { en: 'Title' },
            summary: { en: 'Summary' },
          },
        ],
        assets: [
          {
            id: 'asset',
            kind: 'audio',
            mime: 'audio/wav',
            path: '/local.wav',
            bytes: 4,
            sha256: audioHash,
          },
        ],
        series: [{ id: 'series' }],
      });
      const hub = createMobileMediaHub({
        snapshot: async () => ready,
        clock: () => at,
        resumeStore: deferred,
        fetch: async () =>
          new Response(new Uint8Array([1, 2, 3, 4]), {
            status: 200,
            headers: { 'content-type': 'audio/wav' },
          }),
        audio: () => audio,
        createObjectURL: () => 'blob:late-save',
        revokeObjectURL: vi.fn(),
      });
      await hub.player.start();
      audio.onpause?.(new Event('pause'));
      await vi.waitFor(() => expect(deferred.save).toHaveBeenCalledOnce());
      hub.unmount();
      resolveSave?.({ kind, state: { generation: 1, records: [next] } });
      if (kind === 'saved') {
        await vi.waitFor(() => expect(deferred.deleteIfExact).toHaveBeenCalledOnce());
        expect(deferred.deleteIfExact).toHaveBeenCalledWith(next.key, next, 1);
      } else {
        await vi.waitFor(() => expect(deferred.deleteIfExact).not.toHaveBeenCalled());
      }
      expect(hub.resumeStatus()).toBe('idle');
    },
  );

  it.each([
    ['pre-existing exact no-op after run B', 'run-b', 'no-op', true, 0],
    ['pre-existing exact no-op after unmount', 'unmount', 'no-op', true, 0],
    ['generation-mismatch no-op with exact result record', 'unmount', 'no-op-generation', true, 0],
    ['confirmed saved after run B', 'run-b', 'saved', false, 1],
    ['confirmed saved after unmount', 'unmount', 'saved', false, 1],
    ['saved result without its exact record', 'unmount', 'saved-without-record', false, 0],
    ['saved compensation no-op remains sinkless', 'unmount', 'saved-delete-no-op', false, 1],
    ['saved compensation rejection remains sinkless', 'unmount', 'saved-delete-reject', false, 1],
    ['saved compensation throw remains sinkless', 'unmount', 'saved-delete-throw', false, 1],
  ] as const)(
    'preserves R9-R1 late-save provenance for %s',
    async (_name, lifecycle, resultKind, preexisting, expectedDeletes) => {
      const next = resumeRecord();
      const base = memoryResumeStore(preexisting ? [next] : []);
      let resolveSave: ((value: MobileMediaResumeMutation) => void) | undefined;
      const deleteIfExact = vi.fn(
        async (...args: Parameters<MobileMediaResumeStore['deleteIfExact']>) => {
          if (resultKind === 'saved-delete-reject')
            return Promise.reject(new Error('late exact delete'));
          if (resultKind === 'saved-delete-throw') throw new Error('late exact delete');
          if (resultKind === 'saved-delete-no-op')
            return { kind: 'no-op' as const, state: await base.snapshot() };
          return base.deleteIfExact(...args);
        },
      );
      const deferred: MobileMediaResumeStore = {
        ...base,
        save: vi.fn(
          () =>
            new Promise<MobileMediaResumeMutation>((resolve) => {
              resolveSave = resolve;
            }),
        ),
        deleteIfExact,
      };
      const audio = resumeAudio();
      const hub = createMobileMediaHub({
        snapshot: async () => audioReadySnapshot(),
        clock: () => at,
        resumeStore: deferred,
        fetch: async () =>
          new Response(new Uint8Array([1, 2, 3, 4]), {
            status: 200,
            headers: { 'content-type': 'audio/wav' },
          }),
        audio: () => audio,
        createObjectURL: () => 'blob:provenance',
        revokeObjectURL: vi.fn(),
      });
      await hub.player.start();
      audio.onpause?.(new Event('pause'));
      await vi.waitFor(() => expect(deferred.save).toHaveBeenCalledOnce());
      const before = await base.snapshot();
      if (lifecycle === 'run-b') {
        hub.player.stop('blocked');
        await hub.player.start();
      } else hub.unmount();

      if (resultKind === 'no-op')
        resolveSave?.({ kind: 'no-op', state: { generation: before.generation, records: [next] } });
      else if (resultKind === 'no-op-generation')
        resolveSave?.({
          kind: 'no-op',
          state: { generation: before.generation + 1, records: [next] },
        });
      else if (resultKind === 'saved-without-record')
        resolveSave?.({ kind: 'saved', state: { generation: before.generation + 1, records: [] } });
      else {
        const saved = await base.save(next, before.generation);
        resolveSave?.(saved);
      }

      await vi.waitFor(() => expect(deleteIfExact).toHaveBeenCalledTimes(expectedDeletes));
      const after = await base.snapshot();
      if (preexisting) {
        expect(after).toEqual(before);
        expect(after.records).toEqual([next]);
      }
      expect(hub.resumeStatus()).toBe(lifecycle === 'unmount' ? 'idle' : hub.resumeStatus());
      expect(deleteIfExact).toHaveBeenCalledTimes(expectedDeletes);
    },
  );

  it.each(
    (['release', 'rights', 'source', 'series', 'episode', 'asset'] as const).flatMap((cause) =>
      ['pause', 'save', 'seek', 'deleteIfExact', 'success', 'no-op', 'late-result'].map(
        (sink) => [cause, sink] as const,
      ),
    ),
  )(
    'runs the R9/R1 %s / %s boundary with a real pending or competing store result',
    async (cause, sink) => {
      let generation = 0;
      let records: MobileMediaResumeRecord[] = [];
      const state = (): MobileMediaResumeState => ({ generation, records: [...records] });
      type LateBarrier = 'A' | 'B0' | 'B1';
      const equal = (left: unknown, right: unknown) =>
        JSON.stringify(left) === JSON.stringify(right);
      const directSave = async (record: MobileMediaResumeRecord, expected: number) => {
        if (expected !== generation) return { kind: 'no-op' as const, state: state() };
        const current = records.find((item) => item.key === record.key);
        if (equal(current, record)) return { kind: 'no-op' as const, state: state() };
        records = [...records.filter((item) => item.key !== record.key), record];
        generation += 1;
        return { kind: 'saved' as const, state: state() };
      };
      const directDelete = async (
        key: string,
        record: MobileMediaResumeRecord,
        expected: number,
      ) => {
        const current = records.find((item) => item.key === key);
        if (expected !== generation || !equal(current, record))
          return { kind: 'no-op' as const, state: state() };
        records = records.filter((item) => item.key !== key);
        generation += 1;
        return { kind: 'deleted' as const, state: state() };
      };
      const next = resumeRecord();
      const foreign = resumeRecord({ key: `foreign:${cause}:${sink}`, positionMs: 11 });
      const expected = cause === 'release' || cause === 'rights' ? 'stale' : 'blocked';
      const lateAvailability =
        cause === 'release' || cause === 'rights' || cause === 'episode' || cause === 'asset'
          ? expected
          : 'local';
      const lateExpectationByCause = {
        release: {
          saves: 1,
          deletes: 1,
          physicalDeletes: 1,
          generation: 2,
          records: [] as MobileMediaResumeRecord[],
          availability: 'stale' as const,
          resume: 'idle' as const,
        },
        rights: {
          saves: 1,
          deletes: 0,
          physicalDeletes: 0,
          generation: 0,
          records: [] as MobileMediaResumeRecord[],
          availability: 'stale' as const,
          resume: 'idle' as const,
        },
        source: {
          saves: 1,
          deletes: 1,
          physicalDeletes: 1,
          generation: 2,
          records: [] as MobileMediaResumeRecord[],
          availability: 'local' as const,
          resume: 'idle' as const,
        },
        series: {
          saves: 1,
          deletes: 0,
          physicalDeletes: 0,
          generation: 0,
          records: [] as MobileMediaResumeRecord[],
          availability: 'local' as const,
          resume: 'idle' as const,
        },
        episode: {
          saves: 1,
          deletes: 3,
          physicalDeletes: 1,
          generation: 2,
          records: [] as MobileMediaResumeRecord[],
          availability: 'blocked' as const,
          resume: 'saved' as const,
        },
        asset: {
          saves: 1,
          deletes: 1,
          physicalDeletes: 0,
          generation: 1,
          records: [next],
          availability: 'blocked' as const,
          resume: 'saved' as const,
        },
      };
      const seeded =
        sink === 'seek' ||
        (sink === 'save' && (cause === 'rights' || cause === 'series' || cause === 'asset'));
      if (seeded) await directSave(next, 0);
      if (sink === 'success') await directSave(foreign, 0);
      let invalid = false;
      let requests = 0;
      let saves = 0;
      let deletes = 0;
      let physicalDeletes = 0;
      let factories = 0;
      let made = 0;
      let revoked = 0;
      let seekWrites = 0;
      let pendingSave: ((value: MobileMediaResumeMutation) => void) | null = null;
      let rejectSave: ((reason: Error) => void) | null = null;
      const pendingDeletes: Array<
        Readonly<{
          phase: LateBarrier;
          release: () => Promise<MobileMediaResumeMutation>;
          reject: (reason: Error) => void;
        }>
      > = [];
      let deletePhase: LateBarrier = 'A';
      let releaseFinalRead: (() => void) | null = null;
      let finalReadReached = false;
      let invalidReads = 0;
      let holdRunBContext = false;
      let runBReadPasses = 0;
      let runBContextReached = false;
      let releaseRunBContext: (() => void) | null = null;
      const ready = () => audioReadySnapshot();
      const current = () => {
        const value = ready();
        if (!invalid) return value;
        if (cause === 'release')
          value.bundles.active!.rawBundle.releaseRaw = JSON.stringify({
            validUntil: '2030-01-01T00:00:00.000Z',
          });
        if (cause === 'rights')
          value.bundles.active!.rawBundle.documentsRaw.rights = JSON.stringify({
            rights: [
              { assetId: 'asset', status: 'allowed', expiresAt: '2030-01-01T00:00:00.000Z' },
            ],
          });
        if (cause !== 'release' && cause !== 'rights')
          value.safety = {
            generation: 2,
            revision: 2,
            entries: [
              {
                targetKind: cause,
                targetId: cause === 'asset' ? 'asset' : cause,
                targetHash: cause === 'asset' ? audioHash : null,
              },
            ],
          } as unknown as typeof value.safety;
        return value;
      };
      const read = async () => {
        if (holdRunBContext) {
          runBReadPasses += 1;
          if (runBReadPasses === 2) {
            runBContextReached = true;
            await new Promise<void>((resolve) => {
              releaseRunBContext = resolve;
            });
          }
        }
        if (
          invalid &&
          (sink === 'deleteIfExact' ||
            (sink === 'no-op' && (cause === 'release' || cause === 'series')))
        ) {
          invalidReads += 1;
          if (invalidReads === 2) {
            finalReadReached = true;
            await new Promise<void>((resolve) => {
              releaseFinalRead = resolve;
            });
          }
        }
        return current();
      };
      let hubUnmount: (() => void) | null = null;
      const store: MobileMediaResumeStore = {
        snapshot: vi.fn(async () => state()),
        save: vi.fn(async (record, expectedGeneration) => {
          saves += 1;
          if (
            sink === 'save' ||
            (sink === 'late-result' && cause !== 'episode' && cause !== 'asset')
          )
            return await new Promise<MobileMediaResumeMutation>((resolve, reject) => {
              pendingSave = resolve;
              rejectSave = reject;
            });
          return directSave(record, expectedGeneration);
        }),
        deleteIfExact: vi.fn(async (key, record, expectedGeneration) => {
          deletes += 1;
          if (sink === 'deleteIfExact') {
            hubUnmount?.();
            return { kind: 'no-op' as const, state: state() };
          }
          if (sink === 'no-op' && (cause === 'rights' || cause === 'episode')) {
            await directSave(foreign, generation);
            return directDelete(key, record, expectedGeneration);
          }
          if (sink === 'no-op' && (cause === 'source' || cause === 'asset')) {
            await directSave({ ...record, positionMs: 12 }, generation);
            return directDelete(key, record, expectedGeneration);
          }
          if (sink === 'late-result' && (cause === 'episode' || cause === 'asset'))
            return await new Promise<MobileMediaResumeMutation>((resolve, reject) => {
              pendingDeletes.push(
                Object.freeze({
                  phase: deletePhase,
                  release: async () => {
                    const result = await directDelete(key, record, expectedGeneration);
                    if (result.kind === 'deleted') physicalDeletes += 1;
                    resolve(result);
                    return result;
                  },
                  reject,
                }),
              );
            });
          const result = await directDelete(key, record, expectedGeneration);
          if (result.kind === 'deleted') physicalDeletes += 1;
          return result;
        }),
        clearExact: vi.fn(async () => ({ kind: 'no-op' as const, state: state() })),
        close: vi.fn(),
      };
      let position = 0.01;
      const audio = {
        src: '',
        get currentTime() {
          return position;
        },
        set currentTime(value: number) {
          seekWrites += 1;
          position = value;
        },
        load: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        onpause: null as ((event: Event) => void) | null,
        onended: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };
      const hub = createMobileMediaHub({
        snapshot: read,
        clock: () => at,
        resumeStore: store,
        fetch: vi.fn(async () => {
          requests += 1;
          return new Response(new Uint8Array([1, 2, 3, 4]), {
            status: 200,
            headers: { 'content-type': 'audio/wav' },
          });
        }),
        audio: () => {
          factories += 1;
          return audio;
        },
        createObjectURL: () => {
          made += 1;
          return 'blob:matrix';
        },
        revokeObjectURL: () => {
          revoked += 1;
        },
      });
      hubUnmount = hub.unmount;
      const publicSnapshot = () => ({
        state: hub.player.state(),
        resume: hub.resumeStatus(),
        src: audio.src,
        requests,
        saves,
        factories,
        loads: audio.load.mock.calls.length,
        seekWrites,
        position,
        made,
        revoked,
      });
      const completeSnapshot = () => ({
        public: publicSnapshot(),
        store: state(),
        deletes,
        physicalDeletes,
        phases: pendingDeletes.map((pending) => pending.phase),
      });
      const drainMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
      let beforeLate: ReturnType<typeof publicSnapshot> | null = null;
      await hub.player.start();
      if (sink === 'pause') {
        invalid = true;
        audio.onpause?.(new Event('pause'));
        await vi.waitFor(() =>
          expect(hub.player.state()).toEqual({
            playback: 'idle',
            availability: expected,
            error: null,
          }),
        );
      }
      if (sink === 'save') {
        audio.onpause?.(new Event('pause'));
        await vi.waitFor(() => expect(pendingSave).not.toBeNull());
        invalid = true;
        hub.player.stop(expected);
        const result = await directSave(next, seeded ? 1 : 0);
        (pendingSave as unknown as (value: MobileMediaResumeMutation) => void)(result);
        await vi.waitFor(() =>
          expect(
            cause === 'release' || cause === 'source' || cause === 'episode' ? physicalDeletes : 0,
          ).toBe(cause === 'release' || cause === 'source' || cause === 'episode' ? 1 : 0),
        );
      }
      if (sink === 'seek') {
        invalid = true;
        expect(await hub.resumeOnUserAction()).toBe(false);
      }
      if (sink === 'deleteIfExact') {
        audio.onpause?.(new Event('pause'));
        await vi.waitFor(() => expect(hub.resumeStatus()).toBe('saved'));
        invalid = true;
        hub.player.stop(expected);
        await vi.waitFor(() => expect(finalReadReached).toBe(true));
        hub.unmount();
        (releaseFinalRead as unknown as () => void)();
        await vi.waitFor(() =>
          expect(hub.player.state()).toEqual({
            playback: 'idle',
            availability: expected,
            error: null,
          }),
        );
      }
      if (sink === 'success') {
        audio.onpause?.(new Event('pause'));
        await vi.waitFor(() => expect(hub.resumeStatus()).toBe('saved'));
        invalid = true;
        await hub.player.start();
        await vi.waitFor(() => expect(hub.resumeStatus()).toBe('deleted'));
      }
      if (sink === 'no-op') {
        audio.onpause?.(new Event('pause'));
        await vi.waitFor(() => expect(hub.resumeStatus()).toBe('saved'));
        invalid = true;
        hub.player.stop(expected);
        if (cause === 'release' || cause === 'series') {
          await vi.waitFor(() => expect(finalReadReached).toBe(true));
          await directDelete(next.key, next, generation);
          (releaseFinalRead as unknown as () => void)();
        }
        await vi.waitFor(() => expect(hub.resumeStatus()).toBe('no-op'));
      }
      if (
        sink === 'late-result' &&
        (cause === 'release' || cause === 'rights' || cause === 'source' || cause === 'series')
      ) {
        audio.onpause?.(new Event('pause'));
        await vi.waitFor(() => expect(pendingSave).not.toBeNull());
        invalid = true;
        if (cause === 'release' || cause === 'rights') await hub.player.start();
        else hub.unmount();
        beforeLate = publicSnapshot();
        if (cause === 'release' || cause === 'source')
          (pendingSave as unknown as (value: MobileMediaResumeMutation) => void)(
            await directSave(next, generation),
          );
        else (rejectSave as unknown as (reason: Error) => void)(new Error('late save'));
      }
      if (sink === 'late-result' && (cause === 'episode' || cause === 'asset')) {
        audio.onpause?.(new Event('pause'));
        await vi.waitFor(() => expect(hub.resumeStatus()).toBe('saved'));
        invalid = true;
        hub.player.stop(expected);
        await vi.waitFor(() => expect(pendingDeletes.map((entry) => entry.phase)).toEqual(['A']));
        if (cause === 'episode') {
          deletePhase = 'B0';
          holdRunBContext = true;
          const runB = hub.player.start();
          await vi.waitFor(() =>
            expect(runBContextReached && releaseRunBContext !== null).toBe(true),
          );
          await vi.waitFor(() =>
            expect(pendingDeletes.map((entry) => entry.phase)).toEqual(['A', 'B0']),
          );
          holdRunBContext = false;
          deletePhase = 'B1';
          (releaseRunBContext as unknown as () => void)();
          await runB;
          await vi.waitFor(() =>
            expect(pendingDeletes.map((entry) => entry.phase)).toEqual(['A', 'B0', 'B1']),
          );
        } else hub.unmount();
        beforeLate = publicSnapshot();
        if (cause === 'episode') await pendingDeletes[0]?.release();
        else pendingDeletes[0]?.reject(new Error('late delete'));
      }
      if (sink === 'late-result') {
        // A new event-loop task runs only after the released store promise and
        // the hub's awaiting continuation (including rejection) have settled.
        await drainMicrotasks();
        await vi.waitFor(() =>
          expect(hub.player.state()).toEqual({
            playback: 'idle',
            availability: lateAvailability,
            error: null,
          }),
        );
      } else {
        await vi.waitFor(() => expect(hub.player.state().availability).toBe(expected));
      }
      const final = state();
      const publicAfterLate = publicSnapshot();
      if (sink === 'late-result' && cause === 'episode') {
        hub.unmount();
        const beforeDrain = completeSnapshot();
        expect(beforeDrain).toEqual({
          public: publicAfterLate,
          store: { generation: 2, records: [] },
          deletes: 3,
          physicalDeletes: 1,
          phases: ['A', 'B0', 'B1'],
        });
        const drained = await Promise.all(
          pendingDeletes.slice(1).map((pending) => pending.release()),
        );
        await drainMicrotasks();
        expect(drained).toEqual([
          { kind: 'no-op', state: { generation: 2, records: [] } },
          { kind: 'no-op', state: { generation: 2, records: [] } },
        ]);
        expect(completeSnapshot()).toEqual(beforeDrain);
      }
      expect(requests).toBe(1);
      expect(factories).toBe(1);
      expect(audio.load).toHaveBeenCalledTimes(2);
      expect(made).toBe(1);
      expect(revoked).toBe(1);
      expect(audio.src).toBe('');
      expect(seekWrites).toBe(0);
      expect(position).toBe(0.01);
      if (sink === 'pause') {
        expect({
          state: hub.player.state(),
          saves,
          deletes,
          physicalDeletes,
          final,
          resume: hub.resumeStatus(),
        }).toEqual({
          state: { playback: 'idle', availability: expected, error: null },
          saves: 0,
          deletes: 0,
          physicalDeletes: 0,
          final: { generation: 0, records: [] },
          resume: 'idle',
        });
      }
      if (sink === 'save') {
        const deletesExpected =
          cause === 'release' || cause === 'source' || cause === 'episode' ? 1 : 0;
        expect({
          saves,
          deletes,
          physicalDeletes,
          final,
          resume: hub.resumeStatus(),
          state: hub.player.state(),
        }).toEqual({
          state: { playback: 'idle', availability: expected, error: null },
          saves: 1,
          deletes: deletesExpected,
          physicalDeletes: deletesExpected,
          final: deletesExpected
            ? { generation: 2, records: [] }
            : { generation: 1, records: [next] },
          resume: 'idle',
        });
      }
      if (sink === 'seek' || sink === 'deleteIfExact') {
        expect({
          saves,
          deletes,
          physicalDeletes,
          final,
          resume: hub.resumeStatus(),
          state: hub.player.state(),
        }).toEqual({
          saves: sink === 'seek' ? 0 : 1,
          deletes: 0,
          physicalDeletes: 0,
          final: { generation: 1, records: [next] },
          resume: sink === 'seek' ? 'idle' : 'saved',
          state: { playback: 'idle', availability: expected, error: null },
        });
      }
      if (sink === 'success') {
        expect({
          saves,
          deletes,
          physicalDeletes,
          final,
          resume: hub.resumeStatus(),
          state: hub.player.state(),
        }).toEqual({
          saves: 1,
          deletes: 1,
          physicalDeletes: 1,
          final: { generation: 3, records: [foreign] },
          resume: 'deleted',
          state: { playback: 'idle', availability: expected, error: null },
        });
      }
      if (sink === 'no-op') {
        const raced =
          cause === 'rights' || cause === 'episode'
            ? [next, foreign]
            : cause === 'source' || cause === 'asset'
              ? [resumeRecord({ positionMs: 12 })]
              : [];
        expect({
          state: hub.player.state(),
          saves,
          deletes,
          physicalDeletes,
          final,
          resume: hub.resumeStatus(),
        }).toEqual({
          state: { playback: 'idle', availability: expected, error: null },
          saves: 1,
          deletes: 1,
          physicalDeletes: 0,
          final: { generation: 2, records: raced },
          resume: 'no-op',
        });
      }
      if (sink === 'late-result') {
        expect(beforeLate).not.toBeNull();
        expect(publicAfterLate).toEqual(beforeLate);
        const { availability, ...storeAndResume } = lateExpectationByCause[cause];
        expect({
          saves: saves,
          deletes: deletes,
          physicalDeletes: physicalDeletes,
          generation: final.generation,
          records: final.records,
          state: hub.player.state(),
          resume: hub.resumeStatus(),
        }).toEqual({
          ...storeAndResume,
          state: {
            playback: 'idle',
            availability,
            error: null,
          },
          resume: lateExpectationByCause[cause].resume,
        });
      }
    },
  );
});
