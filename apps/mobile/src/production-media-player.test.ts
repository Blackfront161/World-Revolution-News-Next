import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { canonicalJson, sha256Utf8 } from '@wrn/content-contracts';
import {
  productionMediaDocumentsV1,
  productionMediaLocalesV1,
  validateProductionMediaReleaseV1,
  type ProductionMediaDocumentsDataV1,
  type ProductionMediaDescriptorV1,
  type ProductionMediaPointerV1,
  type ProductionMediaInputV1,
  type ProductionMediaSafetyV1,
  type ProductionMediaReadyV1,
} from '@wrn/content-contracts/production-media-v1';
import {
  createProductionMediaPlayer,
  type ProductionMediaAudio,
  type ProductionMediaPlayerContext,
} from '../../../packages/browser-content/src/production-media-player';

// Locally rehashed reserved-origin metadata; never imports another package's private tests.
type Mutable<T> = { -readonly [K in keyof T]: T[K] extends object ? Mutable<T[K]> : T[K] };
type Docs = Mutable<ProductionMediaDocumentsDataV1>;
type Name = (typeof productionMediaDocumentsV1)[number];
const now = Date.parse('2026-09-11T12:00:00.000Z');
const generatedAt = '2026-09-11T11:00:00.000Z';
const validFrom = '2026-09-01T00:00:00.000Z',
  validUntil = '2026-10-01T00:00:00.000Z';
const evidence = 'a'.repeat(64);
const utf8ByteLength = (value: string) => new Blob([value]).size;
const emptySafety = (): ProductionMediaSafetyV1 => ({
  revision: 0,
  floor: 0,
  revocationSha256: null,
  entries: [],
});
const localeText = () =>
  Object.fromEntries(
    productionMediaLocalesV1.map((locale) => [
      locale,
      locale === 'en' ? 'Publisher episode' : null,
    ]),
  ) as Docs['manifest']['sources'][number]['title'];
function documents(sourcesCount = 1, seriesCount = 1, episodesCount = 1): Docs {
  const base = { contractVersion: '1.0.0' as const, releaseRevision: 'release-1' };
  const sources: Docs['manifest']['sources'] = Array.from({ length: sourcesCount }, (_, i) => ({
    id: 'source-' + i,
    language: 'en',
    title: localeText(),
  }));
  const series: Docs['manifest']['series'] = Array.from({ length: seriesCount }, (_, i) => ({
    id: 'series-' + i,
    sourceId: 'source-' + (i % sourcesCount),
    title: localeText(),
  }));
  const episodes: Docs['manifest']['episodes'] = Array.from({ length: episodesCount }, (_, i) => ({
    id: 'episode-' + i,
    seriesId: 'series-' + (i % seriesCount),
    sourceId: series[i % seriesCount]!.sourceId,
    publisherEpisodeId: 'publisher-' + i,
    language: 'en',
    title: localeText(),
    summary: localeText(),
    canonicalPage: 'https://publisher.invalid/episode-' + i,
    publishedAt: '2026-09-10T10:00:00.000Z',
    durationMs: 1806000,
  }));
  const streams: Docs['manifest']['streams'] = episodes.map((episode, i) => ({
    id: 'stream-' + i,
    episodeId: episode.id,
    sourceId: episode.sourceId,
    publisherEpisodeId: episode.publisherEpisodeId,
    deliveryClass: 'publisher-stream',
    mime: 'audio/mpeg',
    url: 'https://publisher.invalid/audio-' + i + '.mp3',
    origin: 'https://publisher.invalid',
    declaredBytes: 29251585,
    durationMs: episode.durationMs,
    streamRevision: '0'.repeat(64),
    corsMode: 'anonymous',
    redirectPolicy: 'admitted-origin-only',
    rangeRequired: true,
    rightsEvidenceSha256: evidence,
  }));
  return {
    manifest: {
      ...base,
      schema: 'wrn.production-media-manifest.v1',
      sources,
      series,
      episodes,
      streams,
    },
    admission: {
      ...base,
      schema: 'wrn.production-media-admission.v1',
      entries: sources.map((source) => ({
        sourceId: source.id,
        selfDescription: localeText(),
        editorialDescription: localeText(),
        healthObservedAt: '2026-09-11T10:00:00.000Z',
        healthStatus: 'ok',
        validFrom,
        validUntil,
        owner: 'WRN editorial',
        correctionContact: 'contact-' + source.id,
      })),
    },
    rights: {
      ...base,
      schema: 'wrn.production-media-rights.v1',
      entries: streams.map((stream) => ({
        episodeId: stream.episodeId,
        streamId: stream.id,
        basis: 'published-license',
        evidenceId: 'proof-' + stream.id,
        evidenceSha256: evidence,
        reviewedAt: '2026-09-10T10:00:00.000Z',
        validFrom,
        validUntil,
        attribution: 'Publisher; music credits; CC BY 4.0',
        territory: 'worldwide',
        directStreamAllowed: true,
        redistributionAllowed: false,
        cacheAllowed: false,
        offlineAllowed: false,
      })),
    },
    consent: {
      ...base,
      schema: 'wrn.production-media-consent.v1',
      entries: episodes.map((episode) => ({
        episodeId: episode.id,
        recipientName: 'Publisher',
        recipientOrigin: 'https://publisher.invalid',
        dataCategories: ['ip-address', 'user-agent', 'request-timing', 'media-range'],
        privacyNoticeUrl: 'https://publisher.invalid/privacy',
        mode: 'per-episode-third-party-click',
        requiresPrompt: true,
        validFrom,
        validUntil,
      })),
    },
    revocation: {
      ...base,
      schema: 'wrn.production-media-revocation.v1',
      revision: 1,
      floor: 1,
      entries: [],
    },
  };
}
async function stamp(docs: Docs) {
  for (const stream of docs.manifest.streams)
    stream.streamRevision = await sha256Utf8(
      canonicalJson({
        sourceId: stream.sourceId,
        publisherEpisodeId: stream.publisherEpisodeId,
        url: stream.url,
        mime: stream.mime,
        declaredBytes: stream.declaredBytes,
        durationMs: stream.durationMs,
        rightsEvidenceSha256: stream.rightsEvidenceSha256,
      }),
    );
}
type Options = {
  pointerBytes?: number;
  descriptorBytes?: number;
  documentBytes?: Partial<Record<Name, number>>;
  descriptor?: (value: Mutable<ProductionMediaDescriptorV1>) => void;
  pointer?: (value: Mutable<ProductionMediaPointerV1>) => void;
};
function pad(raw: string, bytes?: number) {
  if (bytes === undefined) return raw;
  expect(bytes).toBeGreaterThanOrEqual(utf8ByteLength(raw));
  return raw + ' '.repeat(bytes - utf8ByteLength(raw));
}
async function wire(docs: Docs, options: Options = {}): Promise<ProductionMediaInputV1> {
  const documentsRaw = Object.fromEntries(
    productionMediaDocumentsV1.map((name) => [
      name,
      pad(canonicalJson(docs[name]), options.documentBytes?.[name]),
    ]),
  ) as Record<Name, string>;
  const descriptor: Mutable<ProductionMediaDescriptorV1> = {
    schema: 'wrn.production-media-descriptor.v1',
    contractVersion: '1.0.0',
    releaseRevision: 'release-1',
    sequence: 1,
    generatedAt,
    validUntil: '2026-09-12T12:00:00.000Z',
    revocationFloor: docs.revocation.floor,
    documents: await Promise.all(
      productionMediaDocumentsV1.map(async (name) => ({
        name,
        path: '/content/media/v1/releases/release-1/' + name + '.json',
        bytes: utf8ByteLength(documentsRaw[name]),
        sha256: await sha256Utf8(documentsRaw[name]),
      })),
    ),
  };
  options.descriptor?.(descriptor);
  const descriptorRaw = pad(canonicalJson(descriptor), options.descriptorBytes);
  const pointer: Mutable<ProductionMediaPointerV1> = {
    schema: 'wrn.production-media-current.v1',
    contractVersion: '1.0.0',
    releaseRevision: 'release-1',
    sequence: 1,
    descriptorPath: '/content/media/v1/releases/release-1/descriptor.json',
    descriptorBytes: utf8ByteLength(descriptorRaw),
    descriptorSha256: await sha256Utf8(descriptorRaw),
    revocationFloor: descriptor.revocationFloor,
  };
  options.pointer?.(pointer);
  return {
    pointerRaw: pad(canonicalJson(pointer), options.pointerBytes),
    descriptorRaw,
    documentsRaw,
    now,
    allowedOrigins: new Set(['https://publisher.invalid']),
    knownSafety: emptySafety(),
  };
}
async function release(edit?: (docs: Docs) => void, options?: Options) {
  const docs = documents();
  edit?.(docs);
  await stamp(docs);
  return wire(docs, options);
}

let ready: ProductionMediaReadyV1;
const disposers: Array<() => void> = [];
beforeAll(async () => {
  const value = await validateProductionMediaReleaseV1(await release());
  expect(value).not.toBeNull();
  ready = value!;
});
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  vi.useRealTimers();
});
function harness() {
  let context: ProductionMediaPlayerContext | null = { ready, generation: 'generation-1' };
  let connected = true;
  const calls: string[] = [];
  const work: Array<{ resolve(): void; reject(error: Error): void }> = [];
  let storedSrc = '',
    cors: string | null = null,
    preload: ProductionMediaAudio['preload'] = '';
  const audio = {
    get src() {
      return storedSrc;
    },
    set src(value: string) {
      storedSrc = value;
      calls.push('src:' + value);
    },
    get crossOrigin() {
      return cors;
    },
    set crossOrigin(value: string | null) {
      cors = value;
      calls.push('cors:' + value);
    },
    get preload() {
      return preload;
    },
    set preload(value: ProductionMediaAudio['preload']) {
      preload = value;
      calls.push('preload:' + value);
    },
    duration: 1806,
    currentTime: 0,
    onloadedmetadata: null as ProductionMediaAudio['onloadedmetadata'],
    ondurationchange: null as ((event: Event) => void) | null,
    onerror: null as ProductionMediaAudio['onerror'],
    onpause: null as ProductionMediaAudio['onpause'],
    onended: null as ProductionMediaAudio['onended'],
    ontimeupdate: null as ProductionMediaAudio['ontimeupdate'],
    load: vi.fn(() => {
      calls.push('load');
    }),
    pause: vi.fn(() => {
      calls.push('pause');
      audio.onpause?.call(audio as unknown as HTMLAudioElement, new Event('pause'));
    }),
    removeAttribute: vi.fn((name: string) => {
      calls.push('remove:' + name);
      if (name === 'src') storedSrc = '';
    }),
    play: vi.fn(() => {
      calls.push('play');
      return new Promise<void>((resolve, reject) => work.push({ resolve, reject }));
    }),
  };
  const factory = vi.fn(() => audio);
  const pause = vi.fn(),
    terminated = vi.fn(),
    onState = vi.fn();
  const contextPort = vi.fn(() => context);
  const onlinePort = vi.fn(() => connected);
  const clockPort = vi.fn(() => Date.now());
  const player = createProductionMediaPlayer({
    context: contextPort,
    allowedOrigins: new Set(['https://publisher.invalid']),
    audio: factory,
    online: onlinePort,
    now: clockPort,
    onExplicitPause: pause,
    onTerminated: terminated,
    onState,
  });
  disposers.push(player.dispose);
  const metadata = (durationMs = 1806000) => {
    audio.duration = durationMs / 1000;
    audio.onloadedmetadata?.call(audio as unknown as HTMLAudioElement, new Event('loadedmetadata'));
  };
  const resolve = async (index = work.length - 1) => {
    work[index]!.resolve();
    await vi.advanceTimersByTimeAsync(0);
  };
  const begin = (position = 0) => {
    const prompt = player.prepareConsent('episode-0', position);
    expect(prompt).not.toBeNull();
    expect(player.confirmPlay(prompt!)).toBe(true);
  };
  const playing = async () => {
    begin();
    metadata();
    await resolve();
    expect(player.getState().phase).toBe('playing');
  };
  return {
    player,
    audio,
    calls,
    work,
    factory,
    pause,
    terminated,
    onState,
    contextPort,
    onlinePort,
    clockPort,
    metadata,
    resolve,
    begin,
    playing,
    setContext: (value: ProductionMediaPlayerContext | null) => {
      context = value;
    },
    offline: () => {
      connected = false;
    },
  };
}

describe('production publisher stream lifecycle', () => {
  it.each(['context', 'clock', 'online'] as const)(
    'does not mint consent after preparation %s stops the invocation',
    (port) => {
      const h = harness();
      if (port === 'context')
        h.contextPort.mockImplementationOnce(() => {
          h.player.stop();
          return { ready, generation: 'generation-1' };
        });
      if (port === 'clock')
        h.clockPort.mockImplementationOnce(() => {
          h.player.stop();
          return Date.now();
        });
      if (port === 'online')
        h.onlinePort.mockImplementationOnce(() => {
          h.player.stop();
          return true;
        });
      expect(h.player.prepareConsent('episode-0')).toBeNull();
      expect(h.player.getState().phase).toBe('idle');
      expect(h.factory).not.toHaveBeenCalled();
      expect(h.audio.play).not.toHaveBeenCalled();
      expect(h.calls.some((call) => call.startsWith('src:'))).toBe(false);
    },
  );
  it('honours connectivity lost by the loading observer before source assignment', () => {
    const h = harness();
    h.onState.mockImplementation((state) => {
      if (state.phase === 'loading') h.offline();
    });
    const prompt = h.player.prepareConsent('episode-0')!;
    expect(h.player.confirmPlay(prompt)).toBe(false);
    expect(h.player.getState().phase).toBe('idle');
    expect(h.calls.some((call) => call.startsWith('src:'))).toBe(false);
    expect(h.audio.play).not.toHaveBeenCalled();
  });
  it.each([2, 3])(
    'honours stop from online call%d at confirmation or final pre-source check',
    (call) => {
      const h = harness();
      h.onlinePort.mockImplementation(() => {
        if (h.onlinePort.mock.calls.length === call) h.player.stop();
        return true;
      });
      const prompt = h.player.prepareConsent('episode-0')!;
      expect(h.player.confirmPlay(prompt)).toBe(false);
      expect(h.onlinePort).toHaveBeenCalledTimes(call);
      expect(h.player.getState().phase).toBe('idle');
      expect(h.calls.some((entry) => entry.startsWith('src:'))).toBe(false);
      expect(h.audio.play).not.toHaveBeenCalled();
    },
  );
  it('preserves stop invoked by ownership context during an old native error', () => {
    const h = harness();
    h.begin();
    const oldError = h.audio.onerror!;
    h.contextPort.mockImplementationOnce(() => {
      h.player.stop();
      return { ready, generation: 'generation-1' };
    });
    oldError.call(h.audio as unknown as HTMLAudioElement, new Event('error'));
    expect(h.player.getState().phase).toBe('idle');
    expect(h.audio.src).toBe('');
    expect(h.terminated).toHaveBeenCalledExactlyOnceWith(expect.anything(), 'stopped');
  });
  it.each(['clock-stop', 'online-stop', 'online-offline'] as const)(
    'does not call initial play after the post-source %s boundary invalidates start',
    (cause) => {
      const h = harness();
      if (cause === 'clock-stop')
        h.clockPort.mockImplementation(() => {
          if (h.audio.src) h.player.stop();
          return Date.now();
        });
      else
        h.onlinePort.mockImplementation(() => {
          if (!h.audio.src) return true;
          if (cause === 'online-stop') h.player.stop();
          return cause !== 'online-offline';
        });
      const prompt = h.player.prepareConsent('episode-0')!;
      expect(h.player.confirmPlay(prompt)).toBe(false);
      expect(h.audio.play).not.toHaveBeenCalled();
      expect(h.player.getState().phase).toBe('idle');
      expect(h.audio.src).toBe('');
    },
  );
  it('does not let an old error overwrite a replacement started by the ownership callback', async () => {
    const h = harness();
    h.begin();
    const oldError = h.audio.onerror!;
    h.contextPort.mockImplementationOnce(() => {
      h.begin();
      return { ready, generation: 'generation-1' };
    });
    oldError.call(h.audio as unknown as HTMLAudioElement, new Event('error'));
    expect(h.player.getState().phase).toBe('loading');
    expect(h.audio.play).toHaveBeenCalledTimes(2);
    expect(h.terminated).toHaveBeenCalledExactlyOnceWith(expect.anything(), 'stopped');
    h.metadata();
    await h.resolve(1);
    expect(h.player.getState().phase).toBe('playing');
  });
  it.each(['observer', 'factory'] as const)(
    'honours reentrant stop in %s before a new source assignment',
    (stage) => {
      const h = harness();
      if (stage === 'observer')
        h.onState.mockImplementationOnce(() => {
          h.player.stop();
        });
      else
        h.factory.mockImplementationOnce(() => {
          h.player.stop();
          return h.audio;
        });
      const prompt = h.player.prepareConsent('episode-0')!;
      expect(h.player.confirmPlay(prompt)).toBe(false);
      expect(h.calls.some((call) => call.startsWith('src:'))).toBe(false);
      expect(h.player.getState().phase).toBe('idle');
    },
  );
  it.each([1801000, 1811001, NaN])(
    'revalidates changed native duration %s during the run',
    async (duration) => {
      const h = harness();
      await h.playing();
      h.player.seek(1805500);
      h.audio.duration = duration / 1000;
      h.audio.ondurationchange?.(new Event('durationchange'));
      expect(h.player.getState().phase).toBe(duration === 1801000 ? 'playing' : 'error');
      if (duration === 1801000) expect(h.audio.currentTime).toBe(1800.999);
    },
  );
  it('is inert through prepare/cancel/unknown/forged/reused consent, then sets policy before URL/play synchronously', () => {
    const h = harness();
    expect(h.player.prepareConsent('missing')).toBeNull();
    const cancelled = h.player.prepareConsent('episode-0')!;
    h.player.cancelConsent();
    expect(h.player.confirmPlay(cancelled)).toBe(false);
    const valid = h.player.prepareConsent('episode-0')!;
    expect(h.player.confirmPlay({ ...valid })).toBe(false);
    expect(h.factory).not.toHaveBeenCalled();
    expect(h.calls).toEqual([]);
    const current = h.player.prepareConsent('episode-0')!;
    expect(Object.isFrozen(current)).toBe(true);
    expect(current.consent.recipientOrigin).toBe('https://publisher.invalid');
    expect(h.player.confirmPlay(current)).toBe(true);
    expect(h.calls).toEqual([
      'cors:anonymous',
      'preload:none',
      'src:https://publisher.invalid/audio-0.mp3',
      'play',
    ]);
    expect(h.player.confirmPlay(current)).toBe(false);
    expect(h.factory).toHaveBeenCalledTimes(1);
  });
  it.each(['generation', 'release', 'missing', 'expired', 'offline'] as const)(
    'rejects stale consent after %s change',
    (reason) => {
      const h = harness(),
        prompt = h.player.prepareConsent('episode-0')!;
      if (reason === 'generation') h.setContext({ ready, generation: 'generation-2' });
      if (reason === 'release')
        h.setContext({ ready: JSON.parse(JSON.stringify(ready)), generation: 'generation-1' });
      if (reason === 'missing') h.setContext(null);
      if (reason === 'expired') vi.setSystemTime(Date.parse(ready.descriptor.validUntil));
      if (reason === 'offline') h.offline();
      expect(h.player.confirmPlay(prompt)).toBe(false);
      expect(h.factory).not.toHaveBeenCalled();
    },
  );
  it('requires provenance, a compiled origin and a positive fresh clock; never touches native audio', () => {
    const factory = vi.fn();
    const player = createProductionMediaPlayer({
      context: () => ({ ready, generation: '1' }),
      allowedOrigins: new Set(),
      audio: factory,
      online: () => true,
    });
    disposers.push(player.dispose);
    expect(player.prepareConsent('episode-0')).toBeNull();
    const h = harness();
    vi.setSystemTime(Date.parse(ready.descriptor.generatedAt) - 1);
    expect(h.player.prepareConsent('episode-0')).toBeNull();
    vi.setSystemTime(now);
    expect(h.player.prepareConsent('episode-0', NaN)).toBeNull();
    expect(h.player.prepareConsent('episode-0', -1)).toBeNull();
    expect(h.factory).not.toHaveBeenCalled();
    expect(factory).not.toHaveBeenCalled();
  });
  it.each(['metadata-first', 'play-first'] as const)(
    'waits for both successful phases: %s',
    async (order) => {
      const h = harness();
      h.begin();
      if (order === 'metadata-first') h.metadata();
      else await h.resolve();
      expect(h.player.getState().phase).toBe('loading');
      if (order === 'metadata-first') await h.resolve();
      else h.metadata();
      expect(h.player.getState()).toMatchObject({
        phase: 'playing',
        durationMs: 1806000,
        positionMs: 0,
        error: null,
      });
    },
  );
  it.each([14999, 15000, 15001])('bounds start completion at %d milliseconds', async (elapsed) => {
    const h = harness();
    h.begin();
    await h.resolve();
    vi.setSystemTime(now + elapsed); // Deadline guard also works before the queued timer runs.
    h.metadata();
    expect(h.player.getState().phase).toBe(elapsed < 15000 ? 'playing' : 'error');
  });
  it.each(['metadata', 'play'] as const)(
    'settles a hung %s phase at15000ms and ignores its late result',
    async (phase) => {
      const h = harness();
      h.begin();
      const late = h.audio.onloadedmetadata;
      if (phase === 'metadata') await h.resolve();
      else h.metadata();
      await vi.advanceTimersByTimeAsync(14999);
      expect(h.player.getState().phase).toBe('loading');
      await vi.advanceTimersByTimeAsync(1);
      expect(h.player.getState()).toMatchObject({ phase: 'error', error: 'stream-unavailable' });
      late?.call(h.audio as unknown as HTMLAudioElement, new Event('loadedmetadata'));
      if (phase === 'play') await h.resolve();
      expect(h.player.getState().phase).toBe('error');
      expect(h.audio.src).toBe('');
    },
  );
  it.each([4999, 5000, 5001, -4999, -5000, -5001])(
    'checks admitted duration delta %dms',
    async (delta) => {
      const h = harness();
      h.begin();
      h.metadata(1806000 + delta);
      await h.resolve();
      expect(h.player.getState().phase).toBe(Math.abs(delta) <= 5000 ? 'playing' : 'error');
    },
  );
  it.each([NaN, Infinity, 0, -1])('rejects invalid native duration %s', async (duration) => {
    const h = harness();
    h.begin();
    h.metadata(duration);
    await h.resolve();
    expect(h.player.getState().phase).toBe('error');
  });
  it('continues the same paused run at its current position even when buffered offline', async () => {
    const h = harness();
    await h.playing();
    h.audio.currentTime = 123.456;
    expect(h.player.pause()).toBe(true);
    expect(h.pause).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        episodeId: 'episode-0',
        generation: 'generation-1',
        streamRevision: ready.documents.manifest.streams[0]!.streamRevision,
      }),
      123456,
    );
    h.offline();
    expect(h.player.prepareConsent('episode-0')).toBeNull();
    expect(h.player.continue()).toBe(true);
    await h.resolve();
    expect(h.factory).toHaveBeenCalledTimes(1);
    expect(h.audio.currentTime).toBe(123.456);
    expect(h.audio.load).not.toHaveBeenCalled();
    expect(h.player.getState().phase).toBe('playing');
    expect(h.pause).toHaveBeenCalledTimes(1);
  });
  it('saves only explicit playing-pause, never native pause/timeupdate/seek/reload/dispose', async () => {
    const h = harness();
    await h.playing();
    h.audio.currentTime = 20;
    h.audio.ontimeupdate?.call(h.audio as unknown as HTMLAudioElement, new Event('timeupdate'));
    h.audio.onpause?.call(h.audio as unknown as HTMLAudioElement, new Event('pause'));
    expect(h.player.getState().phase).toBe('paused');
    expect(h.player.pause()).toBe(false);
    expect(h.player.seek(35000)).toBe(true);
    h.player.refresh();
    h.player.dispose();
    expect(h.pause).not.toHaveBeenCalled();
  });
  it('clamps seeks and explicit resumed position below both durations', async () => {
    const h = harness();
    h.begin(999999999);
    h.metadata(1801000);
    await h.resolve();
    expect(h.audio.currentTime).toBe(1800.999);
    expect(h.player.seek(-1)).toBe(true);
    expect(h.audio.currentTime).toBe(0);
    expect(h.player.seek(Infinity)).toBe(false);
    expect(h.player.seek(999999999)).toBe(true);
    expect(h.audio.currentTime).toBe(1800.999);
    expect(h.pause).not.toHaveBeenCalled();
  });
  it('pause during loading cancels without saving; stale old events cannot mutate a newer run', async () => {
    const h = harness();
    h.begin();
    const oldMetadata = h.audio.onloadedmetadata,
      oldError = h.audio.onerror;
    expect(h.player.pause()).toBe(true);
    expect(h.player.getState().phase).toBe('idle');
    h.begin();
    h.metadata();
    await h.resolve(1);
    oldMetadata?.call(h.audio as unknown as HTMLAudioElement, new Event('loadedmetadata'));
    oldError?.call(h.audio as unknown as HTMLAudioElement, new Event('error'));
    await h.resolve(0);
    expect(h.player.getState().phase).toBe('playing');
    expect(h.pause).not.toHaveBeenCalled();
  });
  it('bounds hung continue and ignores late rejection after dispose', async () => {
    const h = harness();
    await h.playing();
    h.player.pause();
    h.player.continue();
    await vi.advanceTimersByTimeAsync(15000);
    expect(h.player.getState().phase).toBe('error');
    h.player.dispose();
    h.work[1]!.reject(new Error('late'));
    await vi.advanceTimersByTimeAsync(0);
    expect(h.player.getState().phase).toBe('idle');
    expect(h.player.prepareConsent('episode-0')).toBeNull();
  });
  it.each(['stop', 'dispose', 'change', 'expiry', 'ended', 'error'] as const)(
    'detaches an owned run on %s before old callbacks can revive it',
    async (cause) => {
      const h = harness();
      h.begin();
      const old = h.audio.onloadedmetadata;
      if (cause === 'stop') h.player.stop();
      if (cause === 'dispose') h.player.dispose();
      if (cause === 'change') {
        h.setContext(null);
        h.player.refresh();
      }
      if (cause === 'expiry')
        await vi.advanceTimersByTimeAsync(Date.parse(ready.descriptor.validUntil) - now);
      if (cause === 'ended')
        h.audio.onended?.call(h.audio as unknown as HTMLAudioElement, new Event('ended'));
      if (cause === 'error')
        h.audio.onerror?.call(h.audio as unknown as HTMLAudioElement, new Event('error'));
      const after = h.player.getState();
      expect(h.calls.slice(-3)).toEqual(['pause', 'remove:src', 'load']);
      expect(h.audio.onloadedmetadata).toBeNull();
      expect(h.audio.onerror).toBeNull();
      old?.call(h.audio as unknown as HTMLAudioElement, new Event('loadedmetadata'));
      await h.resolve();
      expect(h.player.getState()).toBe(after);
      expect(h.terminated).toHaveBeenCalledTimes(1);
      expect(h.pause).not.toHaveBeenCalled();
    },
  );
  it('collapses native play rejection and sync exception to one finite error', async () => {
    const h = harness();
    h.begin();
    h.work[0]!.reject(new Error('private provider cause'));
    await vi.advanceTimersByTimeAsync(0);
    expect(h.player.getState()).toMatchObject({ phase: 'error', error: 'stream-unavailable' });
    expect(JSON.stringify(h.player.getState())).not.toContain('private');
    const other = harness();
    other.audio.play.mockImplementation(() => {
      throw Error('native');
    });
    const prompt = other.player.prepareConsent('episode-0')!;
    expect(other.player.confirmPlay(prompt)).toBe(false);
    expect(other.player.getState().phase).toBe('error');
  });
  it('continues cleanup after native pause/load failure and protects reentrant observer disposal', async () => {
    const h = harness();
    await h.playing();
    h.audio.pause.mockImplementation(() => {
      throw Error('native pause');
    });
    h.audio.load.mockImplementation(() => {
      throw Error('native load');
    });
    expect(() => h.player.stop()).not.toThrow();
    expect(h.audio.src).toBe('');
    const other = harness();
    other.onState.mockImplementation((state) => {
      if (state.phase === 'loading') other.player.dispose();
    });
    const prompt = other.player.prepareConsent('episode-0')!;
    expect(other.player.confirmPlay(prompt)).toBe(false);
    expect(other.calls.some((call) => call.startsWith('src:'))).toBe(false);
    expect(other.audio.play).not.toHaveBeenCalled();
  });
});
