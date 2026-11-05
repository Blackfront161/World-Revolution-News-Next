import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import {
  projectSourcePassOverlayV1,
  sourcePassOverlayMaxBytes,
  validateSourcePassOverlayV1,
  validateSourcePassOverlayEndpointIdsV1,
  type SourcePassOverlayV1,
  type SourcePassRecord,
} from '@wrn/content-contracts/source-pass-overlay-v1';
import {
  isSourcePassRevocationsV1,
  mergeSourcePassRevocationsV1,
  sourcePassRevocationsMaxBytes,
  type SourcePassRevocationsV1,
} from '@wrn/content-contracts/source-pass-revocations-v1';
import bundledOverlay from './data/source-pass-overlay-fallback-v1.json';
import bundledRevocations from './data/source-pass-revocations-v1.json';

export const sourcePassOverlayUrl = '/wrn-source-passes/current.json';
export const sourcePassOverlaySha256 =
  'bcef5d2fa88ae4acfb0dce294d3d8245598308c99e992de735babcc8717556aa';
export const sourcePassOverlayStorageKey = 'wrn.source-pass-overlay.v1';
export const sourcePassRevocationsUrl =
  'https://solinaridao.com/wrn-source-pass-revocations/current.json';
export const sourcePassRevocationsStorageKey = 'wrn.source-pass-revocations.v1';
const refreshDeadlineMs = 5_000;

export type SourcePassFilters = Readonly<{
  query: string;
  language: string;
  region: string;
  country: string;
  topic: string;
  medium: string;
}>;

export type SourcePassLoadResult = Readonly<{
  overlay: SourcePassOverlayV1;
  revocations: SourcePassRevocationsV1;
  source: 'remote' | 'bundled';
  overlaySource: 'current' | 'stored' | 'bundled';
  directAvailable: boolean;
}>;

type SafetyStore = Pick<Storage, 'getItem' | 'setItem'>;
const safetyLockName = 'wrn.source-pass-revocations.v1.write';
const localSafetyLocks = new WeakMap<SafetyStore, Promise<void>>();

function freezeSafety(value: SourcePassRevocationsV1): SourcePassRevocationsV1 {
  return Object.freeze({ ...value, endpointIds: Object.freeze([...value.endpointIds]) });
}

function readSafety(
  storage: SafetyStore,
):
  | Readonly<{ kind: 'empty' }>
  | Readonly<{ kind: 'ready'; value: SourcePassRevocationsV1 }>
  | Readonly<{ kind: 'protected' }> {
  try {
    const raw = storage.getItem(sourcePassRevocationsStorageKey);
    if (raw === null) return Object.freeze({ kind: 'empty' });
    if (new TextEncoder().encode(raw).byteLength > sourcePassRevocationsMaxBytes)
      return Object.freeze({ kind: 'protected' });
    const parsed: unknown = JSON.parse(raw);
    return isSourcePassRevocationsV1(parsed)
      ? Object.freeze({ kind: 'ready', value: freezeSafety(parsed) })
      : Object.freeze({ kind: 'protected' });
  } catch {
    return Object.freeze({ kind: 'protected' });
  }
}

function persistSafety(storage: SafetyStore, value: SourcePassRevocationsV1): boolean {
  const raw = JSON.stringify(value);
  try {
    storage.setItem(sourcePassRevocationsStorageKey, raw);
    const readback = storage.getItem(sourcePassRevocationsStorageKey);
    return readback === raw && isSourcePassRevocationsV1(JSON.parse(readback));
  } catch {
    return false;
  }
}

async function withSafetyLock<T>(storage: SafetyStore, action: () => T): Promise<T | null> {
  try {
    if (typeof window !== 'undefined' && storage === window.localStorage) {
      if (typeof navigator.locks?.request !== 'function') return null;
      return await navigator.locks.request(safetyLockName, { mode: 'exclusive' }, action);
    }
    const previous = localSafetyLocks.get(storage) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    localSafetyLocks.set(
      storage,
      previous.then(() => current),
    );
    await previous;
    try {
      return action();
    } finally {
      release();
    }
  } catch {
    return null;
  }
}

async function commitSafety(
  storage: SafetyStore,
  incoming: SourcePassRevocationsV1,
): Promise<SourcePassRevocationsV1 | null> {
  return withSafetyLock(storage, () => {
    const stored = readSafety(storage);
    if (stored.kind === 'protected') return null;
    const merged =
      stored.kind === 'empty'
        ? incoming
        : stored.value.revision > incoming.revision
          ? mergeSourcePassRevocationsV1(incoming, stored.value)
          : mergeSourcePassRevocationsV1(stored.value, incoming);
    return merged !== null && persistSafety(storage, merged) ? merged : null;
  });
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes).buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function boundedJsonBytes(
  response: Response,
  signal: AbortSignal,
  maximumBytes: number,
): Promise<Uint8Array | null> {
  if (
    signal.aborted ||
    !response.ok ||
    response.redirected ||
    response.body === null ||
    !/^application\/json(?:\s*;|$)/iu.test(response.headers.get('content-type') ?? '')
  )
    return null;
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/u.test(declared) || Number(declared) > maximumBytes))
    return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (signal.aborted) throw new DOMException('aborted', 'AbortError');
      if (part.done) break;
      length += part.value.byteLength;
      if (length > maximumBytes) return null;
      chunks.push(part.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function boundedSnapshot(
  response: Response,
  signal: AbortSignal,
): Promise<SourcePassRevocationsV1 | null> {
  const bytes = await boundedJsonBytes(response, signal, sourcePassRevocationsMaxBytes);
  if (bytes === null) return null;
  try {
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    return isSourcePassRevocationsV1(value) ? freezeSafety(value) : null;
  } catch {
    return null;
  }
}

async function parseBoundOverlay(raw: string): Promise<SourcePassOverlayV1 | null> {
  const bytes = new TextEncoder().encode(raw);
  if (
    bytes.byteLength > sourcePassOverlayMaxBytes ||
    (await sha256(bytes)) !== sourcePassOverlaySha256
  )
    return null;
  try {
    const value: unknown = JSON.parse(raw);
    return validateSourcePassOverlayV1(value) &&
      (await validateSourcePassOverlayEndpointIdsV1(value))
      ? value
      : null;
  } catch {
    return null;
  }
}

async function readStoredOverlay(storage: SafetyStore): Promise<SourcePassOverlayV1 | null> {
  try {
    const raw = storage.getItem(sourcePassOverlayStorageKey);
    return raw === null ? null : await parseBoundOverlay(raw);
  } catch {
    return null;
  }
}

function persistOverlay(storage: SafetyStore, raw: string): boolean {
  try {
    storage.setItem(sourcePassOverlayStorageKey, raw);
    return storage.getItem(sourcePassOverlayStorageKey) === raw;
  } catch {
    return false;
  }
}

async function boundedOverlay(
  response: Response,
  signal: AbortSignal,
): Promise<Readonly<{ value: SourcePassOverlayV1; raw: string }> | null> {
  const bytes = await boundedJsonBytes(response, signal, sourcePassOverlayMaxBytes);
  if (bytes === null || (await sha256(bytes)) !== sourcePassOverlaySha256) return null;
  try {
    const raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const value: unknown = JSON.parse(raw);
    return validateSourcePassOverlayV1(value) &&
      (await validateSourcePassOverlayEndpointIdsV1(value))
      ? Object.freeze({ value, raw })
      : null;
  } catch {
    return null;
  }
}

export async function loadBundledSourcePassOverlay(
  directory: MobileContentDirectory,
  {
    signal = new AbortController().signal,
    storage = typeof window === 'undefined' ? undefined : window.localStorage,
    fetchImpl = fetch,
    online = typeof navigator === 'undefined' || navigator.onLine,
    refreshOverlay = true,
    allowDirect = true,
    overlayEndpoint = sourcePassOverlayUrl,
    revocationEndpoint = sourcePassRevocationsUrl,
  }: Readonly<{
    signal?: AbortSignal;
    storage?: SafetyStore;
    fetchImpl?: typeof fetch;
    online?: boolean;
    refreshOverlay?: boolean;
    allowDirect?: boolean;
    overlayEndpoint?: unknown;
    revocationEndpoint?: unknown;
  }> = {},
): Promise<SourcePassLoadResult | null> {
  if (
    !validateSourcePassOverlayV1(bundledOverlay) ||
    !isSourcePassRevocationsV1(bundledRevocations)
  )
    return null;
  let overlay = bundledOverlay as SourcePassOverlayV1;
  let overlaySource: SourcePassLoadResult['overlaySource'] = 'bundled';
  if (storage !== undefined) {
    const storedOverlay = await readStoredOverlay(storage);
    if (storedOverlay !== null && storedOverlay.sequence >= overlay.sequence) {
      overlay = storedOverlay;
      overlaySource = 'stored';
    }
  }
  if (refreshOverlay && !signal.aborted && overlayEndpoint === sourcePassOverlayUrl) {
    const request = new AbortController();
    const abort = () => request.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, refreshDeadlineMs);
    try {
      const response = await fetchImpl(sourcePassOverlayUrl, {
        signal: request.signal,
        credentials: 'same-origin',
        redirect: 'error',
        cache: 'no-cache',
        headers: { accept: 'application/json' },
        referrerPolicy: 'no-referrer',
      });
      const candidate = await boundedOverlay(response, request.signal);
      if (candidate !== null && candidate.value.sequence >= overlay.sequence) {
        overlay = candidate.value;
        overlaySource = 'current';
        if (storage !== undefined) persistOverlay(storage, candidate.raw);
      }
    } catch (error) {
      if (signal.aborted) throw error;
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      request.abort();
    }
  }
  let current = freezeSafety(bundledRevocations);
  let durable = false;
  if (storage !== undefined) {
    const committed = await commitSafety(storage, current);
    if (committed !== null) {
      current = committed;
      durable = true;
    }
  }
  let source: SourcePassLoadResult['source'] = 'bundled';
  if (durable && online && !signal.aborted && revocationEndpoint === sourcePassRevocationsUrl) {
    const request = new AbortController();
    const abort = () => request.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, refreshDeadlineMs);
    try {
      const response = await fetchImpl(sourcePassRevocationsUrl, {
        signal: request.signal,
        credentials: 'omit',
        redirect: 'error',
        cache: 'no-store',
        headers: { accept: 'application/json' },
        referrerPolicy: 'no-referrer',
      });
      const candidate = await boundedSnapshot(response, request.signal);
      if (candidate !== null) {
        const merged = mergeSourcePassRevocationsV1(current, candidate);
        if (merged !== null) {
          const committed = await commitSafety(storage!, merged);
          if (committed !== null) {
            current = committed;
            source = 'remote';
          } else {
            durable = false;
          }
        }
      }
    } catch (error) {
      if (signal.aborted) throw error;
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      request.abort();
    }
  }
  const projected = await projectSourcePassOverlayV1(overlay, directory, {
    revokedEndpointIds: current.endpointIds,
    allowDirect: durable && allowDirect,
  });
  return projected === null
    ? null
    : Object.freeze({
        overlay: projected,
        revocations: current,
        source,
        overlaySource,
        directAvailable: durable && allowDirect,
      });
}

export function sourcePassEndpointUrl(
  record: SourcePassRecord,
  endpointId: string,
  directory: MobileContentDirectory,
): string | null {
  const endpoint = record.endpoints.find((entry) => entry.endpointId === endpointId);
  if (endpoint?.kind === 'direct') return endpoint.url;
  return directory.sources.find((entry) => entry.id === endpointId)?.url ?? null;
}

export function sourcePassKnownSources(
  directory: MobileContentDirectory,
  overlay: SourcePassOverlayV1 | null,
) {
  const known = new Map(
    directory.sources.map((entry) => [
      entry.id,
      { catalog: 'directory' as const, sourceId: entry.id, name: entry.name },
    ]),
  );
  for (const record of overlay?.records ?? [])
    known.set(record.preferenceAnchorEndpointId, {
      catalog: 'directory',
      sourceId: record.preferenceAnchorEndpointId,
      name: record.canonicalName,
    });
  return [...known.values()];
}

const normalized = (value: string) => value.trim().toLocaleLowerCase();
const includes = (values: readonly string[], wanted: string) =>
  !wanted || values.some((value) => normalized(value) === normalized(wanted));

export function matchesSourcePass(record: SourcePassRecord, filters: SourcePassFilters): boolean {
  const needle = normalized(filters.query);
  const searchable = [
    record.canonicalName,
    ...record.aliasNames,
    ...record.regions,
    ...record.countries,
    ...record.languages,
    ...record.topics,
    ...record.tendencies,
    ...record.mediaTypes,
  ];
  return (
    (!needle || normalized(searchable.join(' ')).includes(needle)) &&
    includes(record.languages, filters.language) &&
    includes(record.regions, filters.region) &&
    includes(record.countries, filters.country) &&
    includes([...record.topics, ...record.tendencies], filters.topic) &&
    includes(record.mediaTypes, filters.medium)
  );
}

export function sourceInitials(name: string): string {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((word) => [...word][0]?.toLocaleUpperCase() ?? '')
      .join('') || '?'
  );
}

export function sourcePassFacets(records: readonly SourcePassRecord[]) {
  const values = (select: (record: SourcePassRecord) => readonly string[]) =>
    [...new Set(records.flatMap(select))].sort((left, right) => left.localeCompare(right));
  return {
    languages: values((entry) => entry.languages),
    regions: values((entry) => entry.regions),
    countries: values((entry) => entry.countries),
    topics: values((entry) => [...entry.topics, ...entry.tendencies]),
    media: values((entry) => entry.mediaTypes),
  };
}
