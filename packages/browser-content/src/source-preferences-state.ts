import { canonicalJson, utf8ByteLength } from '@wrn/content-contracts';
import {
  isLocalSourcePreferencesV1,
  sourcePreferencesMaxBytes,
  type LocalSourcePreferencesV1,
} from '@wrn/content-contracts';

export type SourcePreferencesStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type SourcePreferencesEventSource = Pick<
  EventTarget,
  'addEventListener' | 'removeEventListener'
>;

export type SourcePreferencesLoadResult =
  | Readonly<{ readonly kind: 'inactive'; readonly expectedRaw: null }>
  | Readonly<{
      readonly kind: 'ready';
      readonly state: LocalSourcePreferencesV1;
      readonly expectedRaw: string;
    }>
  | Readonly<{ readonly kind: 'protected'; readonly raw: string }>
  | Readonly<{ readonly kind: 'unavailable' }>;

export type SourcePreferencesSaveResult =
  | Readonly<{ readonly kind: 'saved'; readonly state: LocalSourcePreferencesV1 }>
  | Readonly<{
      readonly kind:
        'blocked' | 'invalid' | 'conflict' | 'unavailable' | 'write-failed' | 'verification-failed';
    }>;

export type SourcePreferencesClearResult =
  | Readonly<{ readonly kind: 'cleared' }>
  | Readonly<{
      readonly kind:
        'blocked' | 'conflict' | 'unavailable' | 'remove-failed' | 'verification-failed';
    }>;

export interface SourcePreferencesStore {
  readonly load: () => SourcePreferencesLoadResult;
  readonly save: (
    loaded: SourcePreferencesLoadResult,
    next: LocalSourcePreferencesV1,
  ) => SourcePreferencesSaveResult;
  readonly clear: (loaded: SourcePreferencesLoadResult) => SourcePreferencesClearResult;
  readonly dispose: () => void;
}

interface LoadAuthorization {
  readonly kind: 'inactive' | 'ready' | 'protected';
  readonly expectedRaw: string | null;
  readonly conflictEpoch: number;
  consumed: boolean;
}

function freezeState(value: LocalSourcePreferencesV1): LocalSourcePreferencesV1 {
  return Object.freeze({
    contractVersion: value.contractVersion,
    schema: value.schema,
    choices: Object.freeze(value.choices.map((choice) => Object.freeze({ ...choice }))),
  });
}

/** One opaque local key with compare-before-write and one-use load authorization. */
export function createSourcePreferencesStore(
  storageKey: string,
  storage: SourcePreferencesStorage = window.localStorage,
  eventSource: SourcePreferencesEventSource = window,
): SourcePreferencesStore {
  let conflictEpoch = 0;
  const authorizations = new WeakMap<object, LoadAuthorization>();
  const invalidate = (event: Event): void => {
    const candidate = event as StorageEvent;
    if (candidate.key === storageKey || candidate.key === null) conflictEpoch++;
  };
  eventSource.addEventListener('storage', invalidate);

  const authorize = (
    result: SourcePreferencesLoadResult,
    kind: LoadAuthorization['kind'],
    expectedRaw: string | null,
  ): SourcePreferencesLoadResult => {
    authorizations.set(result, { kind, expectedRaw, conflictEpoch, consumed: false });
    return result;
  };

  const load = (): SourcePreferencesLoadResult => {
    let raw: string | null;
    try {
      raw = storage.getItem(storageKey);
    } catch {
      return Object.freeze({ kind: 'unavailable' });
    }
    if (raw === null)
      return authorize(Object.freeze({ kind: 'inactive', expectedRaw: null }), 'inactive', null);
    if (typeof raw !== 'string') return Object.freeze({ kind: 'unavailable' });
    if (utf8ByteLength(raw) > sourcePreferencesMaxBytes) {
      return authorize(Object.freeze({ kind: 'protected', raw }), 'protected', raw);
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isLocalSourcePreferencesV1(parsed)) {
        return authorize(
          Object.freeze({ kind: 'ready', state: freezeState(parsed), expectedRaw: raw }),
          'ready',
          raw,
        );
      }
    } catch {
      // Invalid and newer documents remain byte-identical until an explicit clear.
    }
    return authorize(Object.freeze({ kind: 'protected', raw }), 'protected', raw);
  };

  const save = (
    loaded: SourcePreferencesLoadResult,
    next: LocalSourcePreferencesV1,
  ): SourcePreferencesSaveResult => {
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
    if (!isLocalSourcePreferencesV1(next)) return Object.freeze({ kind: 'invalid' });
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
      if (readback !== raw || !isLocalSourcePreferencesV1(JSON.parse(readback))) {
        return Object.freeze({ kind: 'verification-failed' });
      }
    } catch {
      return Object.freeze({ kind: 'verification-failed' });
    }
    return Object.freeze({ kind: 'saved', state: freezeState(next) });
  };

  const clear = (loaded: SourcePreferencesLoadResult): SourcePreferencesClearResult => {
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
