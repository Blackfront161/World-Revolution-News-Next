import { canonicalJson, utf8ByteLength } from '@wrn/content-contracts';
import {
  mobileReaderV2MaxLedgerBytes,
  mobileReaderV2MaxLedgerEntries,
  type MobileReaderV2MediaRevocation,
} from '@wrn/content-contracts/mobile-reader-v2';

export const mobileReaderV2MediaSafetyStorageKey = 'wrn.mobile-reader-v2-media-safety.v1' as const;
export const mobileReaderV2MediaSafetySchema = 'wrn.mobile-reader-v2-media-safety.v1' as const;

export interface MobileReaderV2MediaSafetyLedger {
  readonly schema: typeof mobileReaderV2MediaSafetySchema;
  readonly revision: number;
  readonly entries: readonly MobileReaderV2MediaRevocation[];
}

type SafetyStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type MobileReaderV2MediaSafetyLoad =
  | Readonly<{ readonly kind: 'ready'; readonly ledger: MobileReaderV2MediaSafetyLedger }>
  | Readonly<{ readonly kind: 'protected' | 'unavailable' }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isEntry(value: unknown): value is MobileReaderV2MediaRevocation {
  return (
    isRecord(value) &&
    Object.keys(value).length === 2 &&
    typeof value.mediaId === 'string' &&
    /^[A-Za-z0-9._:-]{1,128}$/.test(value.mediaId) &&
    typeof value.sha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(value.sha256)
  );
}
function isLedger(value: unknown): value is MobileReaderV2MediaSafetyLedger {
  return (
    isRecord(value) &&
    Object.keys(value).length === 3 &&
    value.schema === mobileReaderV2MediaSafetySchema &&
    Number.isSafeInteger(value.revision) &&
    (value.revision as number) >= 0 &&
    Array.isArray(value.entries) &&
    value.entries.length <= mobileReaderV2MaxLedgerEntries &&
    value.entries.every(isEntry)
  );
}
function frozenLedger(
  revision: number,
  entries: readonly MobileReaderV2MediaRevocation[],
): MobileReaderV2MediaSafetyLedger {
  return Object.freeze({
    schema: mobileReaderV2MediaSafetySchema,
    revision,
    entries: Object.freeze(
      [...entries].sort((a, b) =>
        `${a.mediaId}:${a.sha256}`.localeCompare(`${b.mediaId}:${b.sha256}`),
      ),
    ),
  });
}
export function emptyMobileReaderV2MediaSafetyLedger(): MobileReaderV2MediaSafetyLedger {
  return frozenLedger(0, []);
}
export function loadMobileReaderV2MediaSafety(
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): MobileReaderV2MediaSafetyLoad {
  let raw: string | null;
  try {
    raw = storage.getItem(mobileReaderV2MediaSafetyStorageKey);
  } catch {
    return Object.freeze({ kind: 'unavailable' });
  }
  if (raw === null)
    return Object.freeze({ kind: 'ready', ledger: emptyMobileReaderV2MediaSafetyLedger() });
  if (utf8ByteLength(raw) > mobileReaderV2MaxLedgerBytes)
    return Object.freeze({ kind: 'protected' });
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isLedger(parsed)) return Object.freeze({ kind: 'protected' });
    const entries = parsed.entries;
    if (new Set(entries.map((entry) => `${entry.mediaId}:${entry.sha256}`)).size !== entries.length)
      return Object.freeze({ kind: 'protected' });
    return Object.freeze({ kind: 'ready', ledger: frozenLedger(parsed.revision, entries) });
  } catch {
    return Object.freeze({ kind: 'protected' });
  }
}
export function mergeMobileReaderV2MediaSafety(
  known: MobileReaderV2MediaSafetyLedger,
  candidateRevision: number,
  entries: readonly MobileReaderV2MediaRevocation[],
): MobileReaderV2MediaSafetyLedger | null {
  if (
    !isLedger(known) ||
    !Number.isSafeInteger(candidateRevision) ||
    candidateRevision < known.revision ||
    candidateRevision < 0 ||
    !entries.every(isEntry)
  )
    return null;
  const merged = new Map(known.entries.map((entry) => [`${entry.mediaId}:${entry.sha256}`, entry]));
  for (const entry of entries) merged.set(`${entry.mediaId}:${entry.sha256}`, entry);
  if (merged.size > mobileReaderV2MaxLedgerEntries) return null;
  const next = frozenLedger(candidateRevision, [...merged.values()]);
  return utf8ByteLength(canonicalJson(next)) <= mobileReaderV2MaxLedgerBytes ? next : null;
}
export function persistMobileReaderV2MediaSafety(
  storage: SafetyStorage,
  next: MobileReaderV2MediaSafetyLedger,
): boolean {
  if (!isLedger(next)) return false;
  const raw = canonicalJson(next);
  if (utf8ByteLength(raw) > mobileReaderV2MaxLedgerBytes) return false;
  try {
    storage.setItem(mobileReaderV2MediaSafetyStorageKey, raw);
    return storage.getItem(mobileReaderV2MediaSafetyStorageKey) === raw;
  } catch {
    return false;
  }
}
export function isMobileReaderV2MediaAllowed(
  safety: MobileReaderV2MediaSafetyLoad,
  mediaId: string,
  sha256: string,
): boolean {
  return (
    safety.kind === 'ready' &&
    !safety.ledger.entries.some((entry) => entry.mediaId === mediaId || entry.sha256 === sha256)
  );
}
