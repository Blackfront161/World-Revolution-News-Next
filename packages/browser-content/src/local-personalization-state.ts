import {
  canonicalJson,
  isLocalPersonalizationStateV1,
  localPersonalizationMaxBytes,
  utf8ByteLength,
} from '@wrn/content-contracts';
import type { LocalPersonalizationStateV1 } from '@wrn/domain';

export type PersonalizationStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type StorageEventSource = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

export type LocalPersonalizationLoadResult =
  | Readonly<{ readonly kind: 'inactive'; readonly expectedRaw: null }>
  | Readonly<{
      readonly kind: 'ready';
      readonly state: LocalPersonalizationStateV1;
      readonly expectedRaw: string;
    }>
  | Readonly<{ readonly kind: 'protected'; readonly raw: string }>
  | Readonly<{ readonly kind: 'unavailable' }>;

export type LocalPersonalizationSaveResult =
  | Readonly<{ readonly kind: 'saved'; readonly state: LocalPersonalizationStateV1 }>
  | Readonly<{
      readonly kind:
        'blocked' | 'invalid' | 'conflict' | 'unavailable' | 'write-failed' | 'verification-failed';
    }>;

export type LocalPersonalizationClearResult =
  | Readonly<{ readonly kind: 'cleared' }>
  | Readonly<{
      readonly kind:
        'blocked' | 'conflict' | 'unavailable' | 'remove-failed' | 'verification-failed';
    }>;

export interface LocalPersonalizationStore {
  readonly load: () => LocalPersonalizationLoadResult;
  readonly save: (
    loaded: LocalPersonalizationLoadResult,
    next: LocalPersonalizationStateV1,
  ) => LocalPersonalizationSaveResult;
  /** UI confirmation is deliberately P3 responsibility; this operation is opaque. */
  readonly clear: (loaded: LocalPersonalizationLoadResult) => LocalPersonalizationClearResult;
  readonly dispose: () => void;
}

interface LoadAuthorization {
  readonly kind: 'inactive' | 'ready' | 'protected';
  readonly expectedRaw: string | null;
  readonly conflictEpoch: number;
  consumed: boolean;
}

function freezeState(value: LocalPersonalizationStateV1): LocalPersonalizationStateV1 {
  return Object.freeze({
    contractVersion: value.contractVersion,
    schema: value.schema,
    revision: value.revision,
    interestIds: Object.freeze([...value.interestIds]),
    regionIds: Object.freeze([...value.regionIds]),
    contentLanguageIds: Object.freeze([...value.contentLanguageIds]),
  });
}

/**
 * Creates a one-key localStorage adapter. It neither sends nor logs selected
 * values. The `storage` event is only a conservative conflict invalidation;
 * localStorage cannot make the unavoidable race after pre-read transactional.
 */
export function createLocalPersonalizationStore(
  storageKey: string,
  storage: PersonalizationStorage = window.localStorage,
  eventSource: StorageEventSource = window,
): LocalPersonalizationStore {
  let conflictEpoch = 0;
  const authorizations = new WeakMap<object, LoadAuthorization>();
  const invalidate = (event: Event): void => {
    const candidate = event as StorageEvent;
    if (candidate.key === storageKey) conflictEpoch++;
  };
  eventSource.addEventListener('storage', invalidate);

  const authorize = (
    result: LocalPersonalizationLoadResult,
    kind: LoadAuthorization['kind'],
    expectedRaw: string | null,
  ): LocalPersonalizationLoadResult => {
    authorizations.set(result, { kind, expectedRaw, conflictEpoch, consumed: false });
    return result;
  };

  const load = (): LocalPersonalizationLoadResult => {
    let raw: string | null;
    try {
      raw = storage.getItem(storageKey);
    } catch {
      return Object.freeze({ kind: 'unavailable' });
    }
    if (raw === null) {
      return authorize(Object.freeze({ kind: 'inactive', expectedRaw: null }), 'inactive', null);
    }
    if (typeof raw !== 'string') return Object.freeze({ kind: 'unavailable' });
    if (utf8ByteLength(raw) > localPersonalizationMaxBytes) {
      return authorize(Object.freeze({ kind: 'protected', raw }), 'protected', raw);
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isLocalPersonalizationStateV1(parsed)) {
        const state = freezeState(parsed);
        return authorize(Object.freeze({ kind: 'ready', state, expectedRaw: raw }), 'ready', raw);
      }
    } catch {
      // A raw invalid document remains byte-identical and available only to clear.
    }
    return authorize(Object.freeze({ kind: 'protected', raw }), 'protected', raw);
  };

  const save = (
    loaded: LocalPersonalizationLoadResult,
    next: LocalPersonalizationStateV1,
  ): LocalPersonalizationSaveResult => {
    const authorization = authorizations.get(loaded);
    if (
      authorization === undefined ||
      authorization.consumed ||
      (authorization.kind !== 'inactive' && authorization.kind !== 'ready') ||
      loaded.kind === 'protected' ||
      loaded.kind === 'unavailable'
    ) {
      return Object.freeze({ kind: 'blocked' });
    }
    authorization.consumed = true;
    if (
      !isLocalPersonalizationStateV1(next) ||
      next.interestIds.length + next.regionIds.length + next.contentLanguageIds.length === 0
    ) {
      return Object.freeze({ kind: 'invalid' });
    }
    if (authorization.conflictEpoch !== conflictEpoch) return Object.freeze({ kind: 'conflict' });

    let before: string | null;
    try {
      before = storage.getItem(storageKey);
    } catch {
      return Object.freeze({ kind: 'unavailable' });
    }
    if (before !== authorization.expectedRaw) return Object.freeze({ kind: 'conflict' });

    const raw = canonicalJson(next);
    try {
      storage.setItem(storageKey, raw);
    } catch {
      return Object.freeze({ kind: 'write-failed' });
    }
    try {
      const readback = storage.getItem(storageKey);
      if (readback !== raw) return Object.freeze({ kind: 'verification-failed' });
      const parsed: unknown = JSON.parse(readback);
      if (!isLocalPersonalizationStateV1(parsed)) {
        return Object.freeze({ kind: 'verification-failed' });
      }
    } catch {
      return Object.freeze({ kind: 'verification-failed' });
    }
    return Object.freeze({ kind: 'saved', state: freezeState(next) });
  };

  const clear = (loaded: LocalPersonalizationLoadResult): LocalPersonalizationClearResult => {
    const authorization = authorizations.get(loaded);
    if (
      authorization === undefined ||
      authorization.consumed ||
      (authorization.kind !== 'ready' && authorization.kind !== 'protected')
    ) {
      return Object.freeze({ kind: 'blocked' });
    }
    authorization.consumed = true;
    if (authorization.conflictEpoch !== conflictEpoch) return Object.freeze({ kind: 'conflict' });
    let before: string | null;
    try {
      before = storage.getItem(storageKey);
    } catch {
      return Object.freeze({ kind: 'unavailable' });
    }
    if (before !== authorization.expectedRaw) return Object.freeze({ kind: 'conflict' });

    try {
      storage.removeItem(storageKey);
    } catch {
      return Object.freeze({ kind: 'remove-failed' });
    }
    try {
      return storage.getItem(storageKey) === null
        ? Object.freeze({ kind: 'cleared' })
        : Object.freeze({ kind: 'verification-failed' });
    } catch {
      return Object.freeze({ kind: 'unavailable' });
    }
  };

  return Object.freeze({
    load,
    save,
    clear,
    dispose: () => eventSource.removeEventListener('storage', invalidate),
  });
}
