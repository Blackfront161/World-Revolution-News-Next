import { type MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import { isSourcePassRevocationsV1 } from '@wrn/content-contracts/source-pass-revocations-v1';
import assetUrl from '../projection/data/content-directory-v1.json?url';
import { readLocalJsonAsset } from '../../local-json-asset';
import {
  contentDirectoryManifestUrl,
  contentDirectorySequenceStorageKey,
  loadContentDirectoryWithRefresh,
} from '../../../../../packages/browser-content/src/content-directory-refresh';
import {
  loadBundledSourcePassOverlay,
  sourcePassRevocationsStorageKey,
} from '../../../../../packages/browser-content/src/source-pass-overlay';
import { applyWebsiteLinkPolicy } from '../projection/projection-policy';
import summary from '../projection/data/summary.json';
import imageRegister from '../home/app-article-images-v1.json';
import {
  loadWebsiteContentTuple,
  observedWebsiteTupleWithdrawals,
} from '../../../../../packages/browser-content/src/website-content-tuple-refresh';
import type {
  WebsiteHomeLayout,
  WebsiteImageRegister,
  WebsiteTupleSummary,
} from '../../../../../packages/content-contracts/src/directory/website-content-tuple-v1';

export type WebsiteContentDirectory = Readonly<{
  document: MobileContentDirectory;
  projection: MobileContentDirectory;
  coverage?: WebsiteTupleSummary | null;
  home?: WebsiteHomeLayout;
  images?: WebsiteImageRegister;
  source?: 'remote' | 'bundled' | 'saved';
  transferState?: 'offline' | 'saved' | 'refresh-unconfirmed' | 'bound-live' | 'safety-unavailable';
  checkedAt?: string;
  reviewedEndpointIds?: readonly string[];
}>;
const maxBytes = 3 * 1024 * 1024;
export const websiteWithdrawalsStorageKey = 'wrn.website-link-withdrawals.v1';
let verified: WebsiteContentDirectory | null = null;
let expires = 0;
let inFlight: Promise<WebsiteContentDirectory> | null = null;
const listeners = new Set<(data: WebsiteContentDirectory) => void>();
let stopWatching: (() => void) | null = null;

function safetySnapshot(storage: Storage | undefined) {
  try {
    if (!storage) return null;
    const raw = storage.getItem(websiteWithdrawalsStorageKey);
    if (raw === null) return { articleIds: [] as string[], endpointIds: [] as string[] };
    if (raw.length > 65536) return null;
    const value = JSON.parse(raw);
    if (
      !value ||
      Object.keys(value).sort().join(',') !== 'articleIds,endpointIds' ||
      !Array.isArray(value.articleIds) ||
      !Array.isArray(value.endpointIds) ||
      !value.articleIds.every(
        (id: unknown) => typeof id === 'string' && /^news-[a-f0-9]{64}$/.test(id),
      ) ||
      !value.endpointIds.every(
        (id: unknown) => typeof id === 'string' && /^source-[a-f0-9]{64}$/.test(id),
      )
    )
      return null;
    return value as { articleIds: string[]; endpointIds: string[] };
  } catch {
    return null;
  }
}
async function loadNow(): Promise<WebsiteContentDirectory> {
  const signal = new AbortController().signal;
  const candidate = verified?.document ?? (await readLocalJsonAsset(assetUrl, signal, maxBytes));
  let storage: Storage | undefined;
  try {
    storage = window.localStorage;
  } catch {
    storage = undefined;
  }
  const guardedStorage = {
    getItem(key: string) {
      let raw: string | null = null;
      try {
        raw = storage?.getItem(key) ?? null;
      } catch {
        /* Reviewed session floor applies. */
      }
      if (key !== contentDirectorySequenceStorageKey) return raw;
      try {
        const floor = JSON.parse(raw ?? 'null');
        if (
          floor &&
          Object.keys(floor).sort().join(',') === 'sequence,sha256' &&
          Number.isSafeInteger(floor.sequence) &&
          floor.sequence >= summary.sequence &&
          /^[a-f0-9]{64}$/.test(floor.sha256 ?? '')
        )
          return raw;
      } catch {
        /* Corrupt floors cannot disable the shell minimum. */
      }
      return JSON.stringify({ sequence: summary.sequence, sha256: summary.directorySha256 });
    },
    setItem(key: string, value: string) {
      storage?.setItem(key, value);
    },
  };
  const [loaded, release] = await Promise.all([
    loadContentDirectoryWithRefresh({
      bundled: candidate,
      endpoint: import.meta.env.PROD
        ? contentDirectoryManifestUrl
        : import.meta.env.VITE_WRN_DIRECTORY_MANIFEST_ENDPOINT,
      signal,
      storage: guardedStorage,
    }),
    loadWebsiteContentTuple({
      minimumSequence: summary.sequence,
      allowedImageOrigins: imageRegister.origins,
    }),
  ]);
  const bytes = new TextEncoder().encode(JSON.stringify(loaded.document) + '\n');
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
  const bound = hash === summary.directorySha256;
  // A new directory hash cannot admit content without the matching reviewed shell/report.
  // Validated withdrawals from that revision are still restrictive safety evidence.
  const document =
    release?.tuple.directory ??
    verified?.document ??
    (bound ? loaded.document : (candidate as MobileContentDirectory));
  const coverage = release?.tuple.summary ?? verified?.coverage ?? summary;
  const home = release?.tuple.home ?? verified?.home;
  const images = release?.tuple.images ?? verified?.images;
  let pass: Awaited<ReturnType<typeof loadBundledSourcePassOverlay>> = null;
  try {
    pass = await loadBundledSourcePassOverlay(document, {
      signal,
      ...(storage ? { storage } : {}),
    });
  } catch {
    /* Fail closed below. */
  }
  const mergeSafety = () => {
    const saved = safetySnapshot(storage);
    if (saved === null) return null;
    const rawSourceSafety = storage?.getItem(sourcePassRevocationsStorageKey);
    const sourceSafety = rawSourceSafety ? JSON.parse(rawSourceSafety) : null;
    if (!isSourcePassRevocationsV1(sourceSafety)) return null;
    const merged = {
      articleIds: [
        ...new Set([
          ...saved.articleIds,
          ...document.withdrawals.articleIds,
          ...loaded.document.withdrawals.articleIds,
          ...observedWebsiteTupleWithdrawals().articleIds,
        ]),
      ].sort(),
      endpointIds: [
        ...new Set([
          ...saved.endpointIds,
          ...document.withdrawals.endpointIds,
          ...loaded.document.withdrawals.endpointIds,
          ...observedWebsiteTupleWithdrawals().endpointIds,
          ...sourceSafety.endpointIds,
          ...(pass?.revocations.endpointIds ?? []),
        ]),
      ].sort(),
    };
    const raw = JSON.stringify(merged);
    if (raw.length > 65536) return null;
    storage?.setItem(websiteWithdrawalsStorageKey, raw);
    return storage?.getItem(websiteWithdrawalsStorageKey) === raw ? merged : null;
  };
  let safety: ReturnType<typeof mergeSafety> = null;
  try {
    safety =
      typeof navigator.locks?.request === 'function'
        ? await navigator.locks.request(
            websiteWithdrawalsStorageKey + '.write',
            { mode: 'exclusive' },
            mergeSafety,
          )
        : null;
  } catch {
    /* Unknown/corrupt revocation memory suppresses all directory links. */
  }
  const prohibitedMetadataEndpointIds =
    pass?.overlay.records
      .filter((p) => p.rights.some((r) => r.medium === 'metadata' && r.status === 'prohibited'))
      .flatMap((p) => p.endpoints.map((e) => e.endpointId)) ?? [];
  const projection = safety
    ? applyWebsiteLinkPolicy(document, {
        revokedEndpointIds: safety.endpointIds,
        revokedArticleIds: safety.articleIds,
        directoryOnlyEndpointIds: coverage.directoryOnlyEndpointIds,
        prohibitedMetadataEndpointIds,
      })
    : { ...document, articles: [], sources: [], sports: [] };
  const transferState = !safety
    ? 'safety-unavailable'
    : !navigator.onLine
      ? 'offline'
      : (release?.source === 'remote' || (loaded.source === 'remote' && bound)) &&
          pass?.source === 'remote' &&
          Date.now() - Date.parse(document.observedAt) <= 86400000
        ? 'bound-live'
        : 'refresh-unconfirmed';
  verified = {
    document,
    projection,
    coverage: coverage.commit === document.sourceCommit ? coverage : null,
    ...(home?.directoryCommit === document.sourceCommit ? { home } : {}),
    ...(images?.dataCommit === document.sourceCommit ? { images } : {}),
    source: release?.source ?? (bound ? loaded.source : 'bundled'),
    transferState,
    checkedAt: new Date().toISOString(),
    reviewedEndpointIds:
      pass?.overlay.records.flatMap((p) => p.endpoints.map((e) => e.endpointId)) ?? [],
  };
  expires = Date.now() + 60000;
  for (const listener of listeners) listener(verified);
  return verified;
}
export async function loadWebsiteContentDirectory(
  signal: AbortSignal,
): Promise<WebsiteContentDirectory> {
  if (signal.aborted) throw new DOMException('aborted', 'AbortError');
  if (verified && Date.now() < expires) return verified;
  if (!inFlight)
    inFlight = loadNow().finally(() => {
      inFlight = null;
    });
  const result = await inFlight;
  if (signal.aborted) throw new DOMException('aborted', 'AbortError');
  return result;
}
export async function refreshWebsiteContentDirectory() {
  expires = 0;
  return loadWebsiteContentDirectory(new AbortController().signal);
}
export function subscribeWebsiteContentDirectory(
  listener: (data: WebsiteContentDirectory) => void,
) {
  listeners.add(listener);
  if (!stopWatching) {
    const knownSafety = () => {
      if (!verified) return;
      try {
        const saved = safetySnapshot(window.localStorage);
        const source = JSON.parse(
          window.localStorage.getItem(sourcePassRevocationsStorageKey) ?? 'null',
        );
        const safe = saved !== null && isSourcePassRevocationsV1(source);
        const projection = safe
          ? applyWebsiteLinkPolicy(verified.projection, {
              revokedEndpointIds: [...saved.endpointIds, ...source.endpointIds],
              revokedArticleIds: saved.articleIds,
            })
          : { ...verified.projection, articles: [], sources: [], sports: [] };
        if (
          projection.articles.length !== verified.projection.articles.length ||
          projection.sources.length !== verified.projection.sources.length ||
          projection.sports.length !== verified.projection.sports.length
        ) {
          verified = {
            ...verified,
            projection,
            ...(!safe ? { transferState: 'safety-unavailable' as const } : {}),
          };
          for (const listener of listeners) listener(verified);
        }
      } catch {
        if (!verified) return;
        if (
          verified.projection.articles.length ||
          verified.projection.sources.length ||
          verified.projection.sports.length
        ) {
          verified = {
            ...verified,
            projection: { ...verified.projection, articles: [], sources: [], sports: [] },
            transferState: 'safety-unavailable',
          };
          for (const listener of listeners) listener(verified);
        }
      }
    };
    const safetyTimer = window.setInterval(knownSafety, 1000);
    const refresh = () => {
      if (verified) void refreshWebsiteContentDirectory().catch(() => undefined);
    };
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === websiteWithdrawalsStorageKey ||
        event.key === sourcePassRevocationsStorageKey
      )
        refresh();
    };
    window.addEventListener('storage', onStorage);
    stopWatching = () => {
      window.clearInterval(timer);
      window.clearInterval(safetyTimer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      window.removeEventListener('storage', onStorage);
      stopWatching = null;
    };
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) stopWatching?.();
  };
}
export function resetWebsiteContentDirectoryCacheForTest() {
  verified = null;
  expires = 0;
  inFlight = null;
}
