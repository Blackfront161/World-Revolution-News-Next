import { createMobileMediaPlayer, type MobileMediaAvailability } from './mobile-media-player';
import {
  openMobileMediaResumeStore,
  type MobileMediaResumeMutation,
  type MobileMediaResumeRecord,
  type MobileMediaResumeStore,
} from './mobile-media-resume-store';

type Json = Record<string, unknown>;
type CatalogSnapshot = Readonly<{
  control: Readonly<{ generation: number; active: 'active' | null }>;
  safety: Readonly<{ generation: number; revision: number; entries: readonly Json[] }>;
  bundles: Readonly<{
    active: Readonly<{
      revision: number;
      transportSha256: string;
      rawBundle: Readonly<{ releaseRaw: string; documentsRaw: Record<string, string> }>;
    }> | null;
  }>;
}>;
export type MobileMediaHubProjection = Readonly<{
  kind: 'ready' | 'empty' | 'stale' | 'blocked' | 'protected' | 'storage-failure';
  identity: string | null;
  episodeId: string | null;
  audioAssetId: string | null;
  audioAssetHash: string | null;
  releaseRevision: number | null;
  expiresAt: number | null;
  title: Record<string, string> | null;
  summary: Record<string, string> | null;
  source: Record<string, string> | null;
  durationMs: number | null;
  attribution: string | null;
  territory: string | null;
  delivery: 'local-no-third-party' | null;
}>;
export type MobileMediaHubDependencies = Readonly<{
  snapshot(): Promise<CatalogSnapshot>;
  clock?: () => number;
  resumeStore?: MobileMediaResumeStore | (() => Promise<MobileMediaResumeStore>);
  fetch?: typeof fetch;
  audio?: Parameters<typeof createMobileMediaPlayer>[0]['audio'];
  createObjectURL?: Parameters<typeof createMobileMediaPlayer>[0]['createObjectURL'];
  revokeObjectURL?: Parameters<typeof createMobileMediaPlayer>[0]['revokeObjectURL'];
}>;
const none = (kind: MobileMediaHubProjection['kind']): MobileMediaHubProjection =>
  Object.freeze({
    kind,
    identity: null,
    episodeId: null,
    audioAssetId: null,
    audioAssetHash: null,
    releaseRevision: null,
    expiresAt: null,
    title: null,
    summary: null,
    source: null,
    durationMs: null,
    attribution: null,
    territory: null,
    delivery: null,
  });
const record = (value: unknown): Json | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Json) : null;
const list = (value: unknown): Json[] | null =>
  Array.isArray(value) && value.every(record) ? (value as Json[]) : null;
const text = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const integer = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) ? value : null;
const translations = (value: unknown): Record<string, string> | null => {
  const item = record(value);
  return item !== null && Object.values(item).every((entry) => typeof entry === 'string')
    ? (item as Record<string, string>)
    : null;
};
const entry = (values: Json[], id: string) => values.find((value) => value.id === id) ?? null;
const date = (value: unknown) => Date.parse(text(value) ?? '');
const isBlocked = (
  entries: readonly Json[],
  kind: string,
  id: string,
  hash: string | null = null,
) =>
  entries.some(
    (item) => item.targetKind === kind && item.targetId === id && item.targetHash === hash,
  );

function project(snapshot: CatalogSnapshot, now: number): MobileMediaHubProjection {
  const active = snapshot.bundles.active;
  if (active === null || snapshot.control.active !== 'active') return none('empty');
  try {
    const release = record(JSON.parse(active.rawBundle.releaseRaw));
    const manifest = record(JSON.parse(active.rawBundle.documentsRaw.manifest ?? ''));
    const admission = record(JSON.parse(active.rawBundle.documentsRaw.admission ?? ''));
    const rights = record(JSON.parse(active.rawBundle.documentsRaw.rights ?? ''));
    const consent = record(JSON.parse(active.rawBundle.documentsRaw.consent ?? ''));
    if (!release || !manifest || !admission || !rights || !consent) return none('protected');
    const releaseExpiry = date(release.validUntil);
    if (!Number.isFinite(releaseExpiry)) return none('protected');
    const episodes = list(manifest.episodes),
      assets = list(manifest.assets),
      series = list(manifest.series),
      sources = list(admission.sources),
      allRights = list(rights.rights),
      consents = list(consent.consents);
    if (
      !episodes ||
      !assets ||
      !series ||
      !sources ||
      !allRights ||
      !consents ||
      episodes.length === 0
    )
      return none('protected');
    const episode = episodes[0]!;
    const episodeId = text(episode.id),
      sourceId = text(episode.sourceId),
      seriesId = text(episode.seriesId),
      assetId = text(episode.audioAssetId);
    if (!episodeId || !sourceId || !seriesId || !assetId) return none('protected');
    const asset = entry(assets, assetId),
      source = entry(sources, sourceId),
      seriesItem = entry(series, seriesId),
      right = allRights.find((item) => item.assetId === assetId) ?? null,
      consentItem = consents.find((item) => item.episodeId === episodeId) ?? null;
    const hash = asset && text(asset.sha256);
    const durationMs = integer(episode.durationMs);
    const title = translations(episode.title),
      summary = translations(episode.summary),
      sourceName = source && translations(source.displayName);
    if (
      !asset ||
      !source ||
      !seriesItem ||
      !right ||
      !consentItem ||
      !hash ||
      !title ||
      !summary ||
      !sourceName ||
      durationMs === null ||
      durationMs <= 0 ||
      text(asset.kind) !== 'audio' ||
      text(asset.mime) !== 'audio/wav' ||
      !text(asset.path) ||
      integer(asset.bytes) === null ||
      integer(asset.bytes)! < 0 ||
      right.status !== 'allowed' ||
      consentItem.mode !== 'local-no-third-party' ||
      consentItem.requiresPrompt !== false
    )
      return none('protected');
    const rightsExpiry = date(right.expiresAt),
      sourceExpiry = date(source.validUntil);
    if (!Number.isFinite(rightsExpiry) || !Number.isFinite(sourceExpiry)) return none('protected');
    if (
      isBlocked(snapshot.safety.entries, 'source', sourceId) ||
      isBlocked(snapshot.safety.entries, 'series', seriesId) ||
      isBlocked(snapshot.safety.entries, 'episode', episodeId) ||
      isBlocked(snapshot.safety.entries, 'asset', assetId, hash)
    )
      return none('blocked');
    if (now >= releaseExpiry || now >= rightsExpiry || now >= sourceExpiry) return none('stale');
    return Object.freeze({
      kind: 'ready',
      identity: [
        snapshot.control.generation,
        active.revision,
        active.transportSha256,
        snapshot.safety.generation,
        snapshot.safety.revision,
        episodeId,
        assetId,
        hash,
      ].join('|'),
      episodeId,
      audioAssetId: assetId,
      audioAssetHash: hash,
      releaseRevision: active.revision,
      expiresAt: Math.min(releaseExpiry, rightsExpiry, sourceExpiry),
      title,
      summary,
      source: sourceName,
      durationMs,
      attribution: text(right.attribution),
      territory: text(right.territory),
      delivery: 'local-no-third-party',
    });
  } catch {
    return none('protected');
  }
}

export function createMobileMediaHub(dependencies: MobileMediaHubDependencies) {
  const clock = dependencies.clock ?? Date.now;
  const read = async () => {
    try {
      const snapshot = await dependencies.snapshot();
      const now = clock();
      if (!Number.isSafeInteger(now)) return none('protected');
      return project(snapshot, now);
    } catch {
      return none('storage-failure');
    }
  };
  let resumeStore: MobileMediaResumeStore | null = null;
  let resumeStatus:
    | 'idle'
    | 'saved'
    | 'deleted'
    | 'no-op'
    | 'resume-clear-failed'
    | 'resume-cleanup-failed'
    | 'resume-discarded'
    | 'storage-failure'
    | 'resumed' = 'idle';
  let knownRecord: MobileMediaResumeRecord | null = null;
  let mounted = true;
  // A pause event is synchronous, but its storage work is not.  Keep a
  // separate epoch so that an old pause cannot write after lifecycle
  // invalidation, navigation, expiry, or unmount.
  let lifecycleEpoch = 0;
  const current = (epoch: number) => mounted && epoch === lifecycleEpoch;
  const store = async (epoch: number) => {
    if (resumeStore !== null) return resumeStore;
    const opened =
      typeof dependencies.resumeStore === 'function'
        ? await dependencies.resumeStore()
        : (dependencies.resumeStore ?? (await openMobileMediaResumeStore()));
    if (!current(epoch)) return null;
    resumeStore = opened;
    return resumeStore;
  };
  const sameContext = (left: MobileMediaHubProjection, right: MobileMediaHubProjection) =>
    left.kind === 'ready' && right.kind === 'ready' && left.identity === right.identity;
  const keyFor = (value: MobileMediaHubProjection) =>
    `resume:${value.episodeId ?? ''}:${value.audioAssetId ?? ''}`;
  const sameRecord = (left: unknown, right: MobileMediaResumeRecord) =>
    typeof left === 'object' &&
    left !== null &&
    [
      'recordVersion',
      'key',
      'episodeId',
      'audioAssetId',
      'releaseRevision',
      'audioAssetHash',
      'positionMs',
      'durationMs',
    ].every(
      (key) => (left as Record<string, unknown>)[key] === (right as Record<string, unknown>)[key],
    );
  const publishResume = (
    value: typeof resumeStatus,
    epoch: number,
    cleanupEpoch: number = epoch,
  ) => {
    if (current(epoch) && cleanupEpoch === lifecycleEpoch) resumeStatus = value;
  };
  const compensateLateSave = async (
    target: MobileMediaResumeStore,
    next: MobileMediaResumeRecord,
    result: MobileMediaResumeMutation,
  ) => {
    if (
      !sameRecord(
        result.state.records.find((item) => item.key === next.key),
        next,
      )
    )
      return;
    try {
      // This is deliberately the sole post-epoch mutation: a fulfilled old
      // save may have persisted the exact private record after revocation or
      // unmount.  Its outcome must not reach any public lifecycle sink.
      await target.deleteIfExact(next.key, next, result.state.generation);
    } catch {
      // Privacy compensation is always sinkless, including rejection.
    }
  };
  const invalidateFor = (value: MobileMediaHubProjection) => {
    if (value.kind === 'blocked') media.stop('blocked');
    else if (value.kind === 'stale') media.stop('stale');
  };
  const storageFailure = (epoch: number) => {
    if (!current(epoch)) return;
    resumeStatus = 'storage-failure';
    media.stop('storage-failure');
  };
  const media = createMobileMediaPlayer({
    clock,
    context: async () => {
      const value = await read();
      if (
        value.kind !== 'ready' ||
        !value.identity ||
        !value.audioAssetId ||
        !value.audioAssetHash ||
        !value.expiresAt
      )
        return Object.freeze({
          availability:
            value.kind === 'storage-failure'
              ? ('storage-failure' as const)
              : value.kind === 'blocked'
                ? ('blocked' as const)
                : ('stale' as const),
        });
      let fresh: CatalogSnapshot;
      try {
        fresh = await dependencies.snapshot();
      } catch {
        return Object.freeze({ availability: 'storage-failure' as const });
      }
      const verified = project(fresh, clock());
      if (verified.kind !== 'ready' || verified.identity !== value.identity)
        return Object.freeze({
          availability: verified.kind === 'blocked' ? ('blocked' as const) : ('stale' as const),
        });
      const manifest = record(
        JSON.parse(fresh.bundles.active?.rawBundle.documentsRaw.manifest ?? ''),
      );
      const assets = manifest && list(manifest.assets);
      const asset = assets && entry(assets, value.audioAssetId);
      const path = asset && text(asset.path),
        bytes = asset && integer(asset.bytes);
      if (!path || bytes === null || bytes < 0)
        return Object.freeze({ availability: 'stale' as const });
      return Object.freeze({
        availability: 'local' as MobileMediaAvailability,
        asset: Object.freeze({
          path,
          bytes,
          sha256: value.audioAssetHash,
          expiresAt: value.expiresAt,
          identity: value.identity,
        }),
      });
    },
    ...(dependencies.fetch ? { fetch: dependencies.fetch } : {}),
    ...(dependencies.audio ? { audio: dependencies.audio } : {}),
    ...(dependencies.createObjectURL ? { createObjectURL: dependencies.createObjectURL } : {}),
    ...(dependencies.revokeObjectURL ? { revokeObjectURL: dependencies.revokeObjectURL } : {}),
    onPause: (positionMs) => {
      const epoch = lifecycleEpoch;
      void (async () => {
        try {
          const before = await read();
          if (!current(epoch)) return;
          if (before.kind === 'storage-failure') {
            storageFailure(epoch);
            return;
          }
          if (before.kind !== 'ready' || !before.durationMs || positionMs >= before.durationMs) {
            invalidateFor(before);
            publishResume('no-op', epoch);
            return;
          }
          const target = await store(epoch);
          if (!current(epoch) || target === null) return;
          const state = await target.snapshot();
          if (!current(epoch)) return;
          const after = await read();
          if (!current(epoch)) return;
          if (after.kind === 'storage-failure') {
            storageFailure(epoch);
            return;
          }
          if (!sameContext(before, after)) {
            invalidateFor(after);
            publishResume('no-op', epoch);
            return;
          }
          const durationMs = after.durationMs;
          if (durationMs === null) {
            publishResume('no-op', epoch);
            return;
          }
          const next: MobileMediaResumeRecord = Object.freeze({
            recordVersion: 1,
            key: keyFor(after),
            episodeId: after.episodeId!,
            audioAssetId: after.audioAssetId!,
            releaseRevision: after.releaseRevision!,
            audioAssetHash: after.audioAssetHash!,
            positionMs,
            durationMs,
          });
          if (!current(epoch)) return;
          const result = await target.save(next, state.generation);
          const confirmed = sameRecord(
            result.state.records.find((item) => item.key === next.key),
            next,
          );
          if (!current(epoch)) {
            if (result.kind === 'saved' && confirmed) void compensateLateSave(target, next, result);
            return;
          }
          if (confirmed) knownRecord = next;
          publishResume(confirmed ? result.kind : 'no-op', epoch);
        } catch {
          storageFailure(epoch);
        }
      })();
    },
    onEnded: () => {
      lifecycleEpoch += 1;
      void cleanupKnown('deleted', lifecycleEpoch);
    },
    onInvalidated: (availability) => {
      lifecycleEpoch += 1;
      if (availability === 'stale' || availability === 'blocked')
        void cleanupKnown('deleted', lifecycleEpoch);
    },
  });
  // Consumers receive this intentionally seek-less façade.  Resume seeks are
  // revalidated below and call the private player capability only after the
  // complete fresh context check.
  const player = Object.freeze({
    start: media.start,
    pause: media.pause,
    stop: media.stop,
    invalidate: media.invalidate,
    state: media.state,
  });
  const resumeMatches = (
    value: unknown,
    projection: MobileMediaHubProjection,
  ): value is MobileMediaResumeRecord =>
    typeof value === 'object' &&
    value !== null &&
    projection.kind === 'ready' &&
    (value as MobileMediaResumeRecord).episodeId === projection.episodeId &&
    (value as MobileMediaResumeRecord).audioAssetId === projection.audioAssetId &&
    (value as MobileMediaResumeRecord).audioAssetHash === projection.audioAssetHash &&
    (value as MobileMediaResumeRecord).releaseRevision === projection.releaseRevision &&
    (value as MobileMediaResumeRecord).durationMs === projection.durationMs;
  const cleanupKnown = async (success: 'deleted' | 'resume-discarded', cleanupEpoch: number) => {
    const candidate = knownRecord;
    if (candidate === null || !current(cleanupEpoch)) return;
    try {
      const before = await read();
      if (!current(cleanupEpoch)) return;
      if (before.kind === 'storage-failure') {
        publishResume('resume-clear-failed', cleanupEpoch);
        return;
      }
      const target = await store(cleanupEpoch);
      if (!current(cleanupEpoch) || target === null) return;
      const state = await target.snapshot();
      if (!current(cleanupEpoch)) return;
      const stored = state.records.find((item) => item.key === candidate.key);
      if (stored === undefined || JSON.stringify(stored) !== JSON.stringify(candidate)) {
        publishResume('no-op', cleanupEpoch);
        return;
      }
      const after = await read();
      if (!current(cleanupEpoch)) return;
      if (after.kind === 'storage-failure') {
        publishResume('resume-clear-failed', cleanupEpoch);
        return;
      }
      if (!current(cleanupEpoch)) return;
      const result = await target.deleteIfExact(candidate.key, candidate, state.generation);
      if (!current(cleanupEpoch)) return;
      if (result.kind === 'deleted') knownRecord = null;
      publishResume(result.kind === 'deleted' ? success : result.kind, cleanupEpoch);
    } catch {
      if (!current(cleanupEpoch)) return;
      publishResume(
        success === 'deleted' ? 'resume-clear-failed' : 'resume-cleanup-failed',
        cleanupEpoch,
      );
    }
  };
  const resumeOnUserAction = async () => {
    const epoch = lifecycleEpoch;
    try {
      const before = await read();
      if (!current(epoch)) return false;
      if (before.kind === 'storage-failure') {
        storageFailure(epoch);
        return false;
      }
      if (before.kind !== 'ready') {
        invalidateFor(before);
        publishResume('no-op', epoch);
        return false;
      }
      const target = await store(epoch);
      if (!current(epoch) || target === null) return false;
      const state = await target.snapshot();
      if (!current(epoch)) return false;
      const key = keyFor(before);
      const stored = state.records.find((item) => item.key === key);
      if (stored === undefined) {
        publishResume('no-op', epoch);
        return false;
      }
      if (!current(epoch)) return false;
      knownRecord = stored;
      if (!resumeMatches(stored, before)) {
        if (!current(epoch)) return false;
        player.stop();
        await cleanupKnown('resume-discarded', lifecycleEpoch);
        return false;
      }
      const after = await read();
      if (!current(epoch)) return false;
      if (after.kind === 'storage-failure') {
        storageFailure(epoch);
        return false;
      }
      if (!sameContext(before, after) || !resumeMatches(stored, after)) {
        invalidateFor(after);
        publishResume('no-op', epoch);
        return false;
      }
      if (!current(epoch) || !media.seek(stored.positionMs)) return false;
      publishResume('resumed', epoch);
      return true;
    } catch {
      storageFailure(epoch);
      return false;
    }
  };
  return Object.freeze({
    projection: read,
    player,
    resumeMatches,
    resumeOnUserAction,
    resumeStatus: () => resumeStatus,
    unmount: () => {
      if (!mounted) return;
      mounted = false;
      lifecycleEpoch += 1;
      media.unmount();
    },
  });
}
