import {
  createEmptyLocalReadingState,
  isLocalReadingStateV1,
  type LocalReadingStateV1,
} from '@wrn/domain';

/** Dieser Key gehoert ausschliesslich zur Website-Vorschau. */
export const websiteReadingStateStorageKey = 'wrn.website-local-reading-state.v1';
const websiteReadingStateLockName = 'wrn.website-local-reading-state.v1.write';
const websiteReadingStateCoordinatorDatabase = 'wrn.website-local-reading-state-coordinator.v1';
const websiteReadingStateCoordinatorStore = 'locks';
const websiteReadingStateCoordinatorKey = 'write';

export type LocalReadingStateLoadResult =
  | { readonly kind: 'ready'; readonly state: LocalReadingStateV1 }
  | { readonly kind: 'read-only'; readonly state: LocalReadingStateV1 };

export type LocalReadingStateMutationResult =
  | { readonly kind: 'committed'; readonly state: LocalReadingStateV1 }
  | { readonly kind: 'unchanged'; readonly state: LocalReadingStateV1 }
  | { readonly kind: 'read-only'; readonly state: LocalReadingStateV1 }
  | { readonly kind: 'failed'; readonly state: LocalReadingStateV1 };

type WebsiteReadingStorage = Pick<Storage, 'getItem' | 'setItem'>;
type ReadingStateMutation = (current: LocalReadingStateV1) => LocalReadingStateV1;

function parseWebsiteReadingState(raw: string | null): LocalReadingStateLoadResult {
  if (raw === null) return { kind: 'ready', state: createEmptyLocalReadingState() };
  try {
    const parsed: unknown = JSON.parse(raw);
    return isLocalReadingStateV1(parsed)
      ? { kind: 'ready', state: parsed }
      : { kind: 'read-only', state: createEmptyLocalReadingState() };
  } catch {
    return { kind: 'read-only', state: createEmptyLocalReadingState() };
  }
}

export function loadWebsiteReadingState(
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): LocalReadingStateLoadResult {
  try {
    return parseWebsiteReadingState(storage.getItem(websiteReadingStateStorageKey));
  } catch {
    return { kind: 'read-only', state: createEmptyLocalReadingState() };
  }
}

function applyWebsiteReadingStateMutation(
  mutate: ReadingStateMutation,
  storage: WebsiteReadingStorage,
): LocalReadingStateMutationResult {
  let rawBefore: string | null;
  try {
    rawBefore = storage.getItem(websiteReadingStateStorageKey);
  } catch {
    return { kind: 'read-only', state: createEmptyLocalReadingState() };
  }
  const loaded = parseWebsiteReadingState(rawBefore);
  if (loaded.kind === 'read-only') return loaded;
  const nextState = mutate(loaded.state);
  if (!isLocalReadingStateV1(nextState)) return { kind: 'failed', state: loaded.state };
  if (JSON.stringify(nextState) === JSON.stringify(loaded.state)) {
    return { kind: 'unchanged', state: loaded.state };
  }
  try {
    if (storage.getItem(websiteReadingStateStorageKey) !== rawBefore) {
      const current = loadWebsiteReadingState(storage);
      return current.kind === 'read-only' ? current : { kind: 'failed', state: current.state };
    }
    storage.setItem(websiteReadingStateStorageKey, JSON.stringify(nextState));
    return { kind: 'committed', state: nextState };
  } catch {
    return { kind: 'failed', state: loaded.state };
  }
}

function withIndexedDbReadingStateLock<T>(operation: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('reading-state-coordinator-unavailable'));
      return;
    }
    const opening = indexedDB.open(websiteReadingStateCoordinatorDatabase, 1);
    let database: IDBDatabase | null = null;
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      database?.close();
      callback();
    };
    const fail = () => finish(() => reject(new Error('reading-state-coordinator-failed')));
    opening.onupgradeneeded = () => {
      if (!opening.result.objectStoreNames.contains(websiteReadingStateCoordinatorStore)) {
        opening.result.createObjectStore(websiteReadingStateCoordinatorStore);
      }
    };
    opening.onblocked = fail;
    opening.onerror = fail;
    opening.onsuccess = () => {
      if (settled) {
        opening.result.close();
        return;
      }
      database = opening.result;
      database.onversionchange = () => database?.close();
      let transaction: IDBTransaction;
      try {
        transaction = database.transaction(websiteReadingStateCoordinatorStore, 'readwrite');
      } catch {
        fail();
        return;
      }
      let result: T | undefined;
      let operationFinished = false;
      transaction.onabort = fail;
      transaction.onerror = fail;
      transaction.oncomplete = () => {
        if (!operationFinished) {
          fail();
          return;
        }
        finish(() => resolve(result as T));
      };
      const store = transaction.objectStore(websiteReadingStateCoordinatorStore);
      const turn = store.get(websiteReadingStateCoordinatorKey);
      turn.onerror = () => transaction.abort();
      turn.onsuccess = () => {
        try {
          result = operation();
          operationFinished = true;
          store.put(0, websiteReadingStateCoordinatorKey);
        } catch {
          transaction.abort();
        }
      };
    };
  });
}

function failedMutationResult(storage: WebsiteReadingStorage): LocalReadingStateMutationResult {
  const current = loadWebsiteReadingState(storage);
  return current.kind === 'read-only' ? current : { kind: 'failed', state: current.state };
}

/**
 * Jede Mutation liest innerhalb derselben exklusiven Operation den aktuellen
 * V1-Stand erneut. Web Locks serialisieren Tabs auf sicheren Origins; eine
 * getrennte IndexedDB-Transaktion uebernimmt dieselbe Aufgabe als Fallback.
 * Der zweite Rohwertvergleich stoppt nicht kooperierende Zwischenwrites.
 */
export async function mutateWebsiteReadingState(
  mutate: ReadingStateMutation,
  storage: WebsiteReadingStorage = window.localStorage,
): Promise<LocalReadingStateMutationResult> {
  const operation = () => applyWebsiteReadingStateMutation(mutate, storage);
  if (
    typeof navigator !== 'undefined' &&
    'locks' in navigator &&
    typeof navigator.locks?.request === 'function'
  ) {
    let callbackStarted = false;
    try {
      return await navigator.locks.request(
        websiteReadingStateLockName,
        { mode: 'exclusive' },
        () => {
          callbackStarted = true;
          return operation();
        },
      );
    } catch {
      if (callbackStarted) return failedMutationResult(storage);
    }
  }
  try {
    return await withIndexedDbReadingStateLock(operation);
  } catch {
    return failedMutationResult(storage);
  }
}
