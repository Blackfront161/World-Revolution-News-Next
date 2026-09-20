import {
  mobileRegionalEventsContractVersion,
  mobileRegionalEventsMaxDecodedJsonBytes,
  mobileRegionalEventsMaxTransportBytes,
  mobileRegionalEventsPath,
  mobileRegionalEventsSchema,
  validateRegionalEventBundle,
  validateRegionalEventsPin,
  type RegionalEventBundleV1,
  type RegionalEventsBuildPin,
  type Revocation,
} from '@wrn/content-contracts/mobile-regional-events-v1';
import { utf8ByteLength } from '@wrn/content-contracts';

export const mobileRegionalEventsBuildPin: RegionalEventsBuildPin = Object.freeze({
  schema: mobileRegionalEventsSchema,
  contractVersion: mobileRegionalEventsContractVersion,
  path: mobileRegionalEventsPath,
  bundleRevision: 1,
  taxonomyRevision: 1,
  transportSha256: 'f39fb174a5bdb5a958713a9801178e404fb476662b52afd5e5d9c5f68c08f907',
});

export type RegionalEventsLoadResult =
  | Readonly<{
      kind: 'ready';
      rawJson: string;
      transportSha256: string;
      bundle: RegionalEventBundleV1;
    }>
  | Readonly<{ kind: 'invalid' | 'future-bundle' | 'no-request' | 'network-error' }>;

export async function readCappedResponse(
  response: Response,
  signal?: AbortSignal,
): Promise<Uint8Array | null> {
  if (!response.ok || !response.body) return null;
  const length = response.headers.get('content-length');
  if (
    length !== null &&
    (!/^\d+$/.test(length) || Number(length) > mobileRegionalEventsMaxTransportBytes)
  )
    return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      if (signal?.aborted) return null;
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > mobileRegionalEventsMaxTransportBytes) return null;
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

/** Loads only the pinned same-origin local fixture; malformed/future input is never persisted here. */
async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join(
    '',
  );
}
function isExactBuildPin(value: unknown): value is RegionalEventsBuildPin {
  return (
    validateRegionalEventsPin(value) &&
    Object.keys(value).every(
      (key, index) => key === Object.keys(mobileRegionalEventsBuildPin)[index],
    ) &&
    Object.keys(value).length === Object.keys(mobileRegionalEventsBuildPin).length &&
    value.schema === mobileRegionalEventsBuildPin.schema &&
    value.contractVersion === mobileRegionalEventsBuildPin.contractVersion &&
    value.path === mobileRegionalEventsBuildPin.path &&
    value.bundleRevision === mobileRegionalEventsBuildPin.bundleRevision &&
    value.taxonomyRevision === mobileRegionalEventsBuildPin.taxonomyRevision &&
    value.transportSha256 === mobileRegionalEventsBuildPin.transportSha256
  );
}
export async function decodePinnedMobileRegionalEventsTransport(
  bytes: Uint8Array,
): Promise<RegionalEventsLoadResult> {
  const transportSha256 = await sha256Bytes(bytes);
  if (transportSha256 !== mobileRegionalEventsBuildPin.transportSha256)
    return Object.freeze({ kind: 'invalid' });
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf)
    return Object.freeze({ kind: 'invalid' });
  let rawJson: string;
  try {
    rawJson = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return Object.freeze({ kind: 'invalid' });
  }
  if (utf8ByteLength(rawJson) > mobileRegionalEventsMaxDecodedJsonBytes)
    return Object.freeze({ kind: 'invalid' });
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return Object.freeze({ kind: 'invalid' });
  }
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'contractVersion' in parsed &&
    (parsed as { contractVersion?: unknown }).contractVersion !==
      mobileRegionalEventsContractVersion
  )
    return Object.freeze({ kind: 'future-bundle' });
  const bundle = await validateRegionalEventBundle(parsed);
  if (
    bundle === null ||
    bundle.bundleRevision !== mobileRegionalEventsBuildPin.bundleRevision ||
    bundle.taxonomyRevision !== mobileRegionalEventsBuildPin.taxonomyRevision
  )
    return Object.freeze({ kind: 'invalid' });
  return Object.freeze({ kind: 'ready', rawJson, transportSha256, bundle });
}

export async function loadMobileRegionalEvents(
  signal: AbortSignal,
  pin: unknown = mobileRegionalEventsBuildPin,
  request: typeof fetch = fetch,
): Promise<RegionalEventsLoadResult> {
  if (!isExactBuildPin(pin)) return Object.freeze({ kind: 'no-request' });
  let response: Response;
  try {
    response = await request(pin.path, { signal, credentials: 'same-origin', cache: 'no-store' });
  } catch {
    return Object.freeze({ kind: 'network-error' });
  }
  const bytes = await readCappedResponse(response, signal);
  if (bytes === null) return Object.freeze({ kind: 'invalid' });
  return decodePinnedMobileRegionalEventsTransport(bytes);
}

export interface RegionalEventsProjection {
  readonly contentStatus:
    | 'ready-1'
    | 'ready-2'
    | 'ready-3'
    | 'ready-4'
    | 'ready-5'
    | 'empty'
    | 'stale'
    | 'protected'
    | 'error'
    | 'offline-none';
  readonly deliveryStatus: 'online' | 'offline-lkg' | 'invalid-update-lkg';
  readonly events: readonly RegionalEventBundleV1['events'][number][];
  readonly lifecycle: readonly Readonly<{
    eventId: string;
    status: 'changed' | 'cancelled' | 'blocked';
  }>[];
}
export function projectMobileRegionalEvents(
  input: Readonly<{
    bundle: RegionalEventBundleV1 | null;
    regionId: string | null;
    safety: readonly Revocation[];
    referenceInstant: string;
    online: boolean;
    invalidUpdate?: boolean;
    protectedStore?: boolean;
  }>,
): RegionalEventsProjection {
  const deliveryStatus = input.online
    ? input.invalidUpdate
      ? 'invalid-update-lkg'
      : 'online'
    : 'offline-lkg';
  if (input.protectedStore)
    return Object.freeze({ contentStatus: 'protected', deliveryStatus, events: [], lifecycle: [] });
  if (input.bundle === null)
    return Object.freeze({
      contentStatus: input.online ? 'error' : 'offline-none',
      deliveryStatus: input.online ? 'online' : 'offline-lkg',
      events: [],
      lifecycle: [],
    });
  const now = Date.parse(input.referenceInstant);
  if (!Number.isFinite(now) || now > Date.parse(input.bundle.validUntil))
    return Object.freeze({ contentStatus: 'stale', deliveryStatus, events: [], lifecycle: [] });
  if (input.regionId === null)
    return Object.freeze({ contentStatus: 'empty', deliveryStatus, events: [], lifecycle: [] });
  const blocked = (event: RegionalEventBundleV1['events'][number]) =>
    input.safety.some(
      (entry) =>
        entry.namespace === 'event' &&
        entry.id === event.eventId &&
        (!entry.objectSha256 || entry.objectSha256 === event.contentSha256),
    );
  const region = input.bundle.events.filter((event) => event.regionId === input.regionId);
  const lifecycle = region
    .filter((event) => blocked(event) || event.status === 'changed' || event.status === 'cancelled')
    .sort((a, b) => (a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0))
    .slice(0, 5)
    .map((event) =>
      Object.freeze({
        eventId: event.eventId,
        status: blocked(event) ? ('blocked' as const) : (event.status as 'changed' | 'cancelled'),
      }),
    );
  const candidate = region.filter(
    (event) => !blocked(event) && (event.status === 'scheduled' || event.status === 'changed'),
  );
  const fresh = candidate
    .filter((event) => now <= Date.parse(event.validUntil) && Date.parse(event.startInstant) >= now)
    .sort(
      (a, b) =>
        Date.parse(a.startInstant) - Date.parse(b.startInstant) ||
        (a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0),
    )
    .slice(0, 5);
  const expired = candidate.some((event) => now > Date.parse(event.validUntil));
  const contentStatus = fresh.length
    ? (`ready-${fresh.length}` as RegionalEventsProjection['contentStatus'])
    : expired
      ? 'stale'
      : 'empty';
  return Object.freeze({
    contentStatus,
    deliveryStatus,
    events: Object.freeze(fresh),
    lifecycle: Object.freeze(lifecycle),
  });
}
