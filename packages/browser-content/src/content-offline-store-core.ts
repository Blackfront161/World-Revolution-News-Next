/**
 * Generic persistence seams intentionally carry one concrete profile per store.
 * They never accept a fixture/production Ready union or manufacture controls.
 */
export type OfflineIdentity = Readonly<{ key: string; revision: string; sequence: number | null }>;
export type OfflineCandidateDisposition =
  'candidate-staged' | 'candidate-refreshed' | 'active-refreshed' | 'previous-refreshed';

export type OfflineCandidateSave<Control> = Readonly<{
  control: Control;
  bundleKey: string;
  disposition: OfflineCandidateDisposition;
}>;

export type OfflineControlPatch<Safety> = Readonly<{
  activeKey?: string | null;
  previousKey?: string | null;
  candidateKey?: string | null;
  pendingRecheck?: Readonly<{ operationId: string; generation: number; clearEpoch: number }> | null;
  lastSuccessfulSourceCheckAt?: number | null;
  lastObservedAt?: number | null;
  safety?: Safety;
}>;

export interface OfflinePersistenceProfile<Control, Bundle, Safety, Ready, Input> {
  readonly databaseName: string;
  readonly bounds: Readonly<{
    controlBytes: number;
    bundleBytes: number;
    totalBytes: number;
    slots: 3;
  }>;
  createEmptyControl(): Control;
  isControl(value: unknown): value is Control;
  createBundle(input: Input, safety: Safety): Promise<Bundle>;
  validateBundle(value: unknown, safety: Safety): Promise<Ready | null>;
  mergeSafety(current: Safety, incoming: Safety): Safety | null;
  sameSafety(left: Safety, right: Safety): boolean;
  identity(bundle: Bundle, ready: Ready): OfflineIdentity;
  patchControl(control: Control, patch: OfflineControlPatch<Safety>): Control;
}

export interface OfflineSourceProfile<Safety, Receipt, Runtime> {
  verifySafety(
    signal: AbortSignal,
    known: Safety,
  ): Promise<
    | Readonly<{ kind: 'failed'; safety: null }>
    | Readonly<{ kind: 'verified'; safety: Safety; receipt: Receipt }>
  >;
  completeRelease(
    receipt: Receipt,
    signal: AbortSignal,
    known: Safety,
  ): Promise<Readonly<{ kind: 'failed' }> | Readonly<{ kind: 'ready'; runtime: Runtime }>>;
}

export function requireCurrentGeneration(
  control: Readonly<{ generation: number; clearEpoch: number }>,
  expected: Readonly<{ generation: number; clearEpoch: number }>,
): boolean {
  return control.generation === expected.generation && control.clearEpoch === expected.clearEpoch;
}

/** Shared browser-IDB mechanics. Profiles own schemas, control semantics and bundles. */
export function createOfflineIdbCore<Failure extends Error>(
  input: Readonly<{
    readonly databaseName: string;
    readonly databaseVersion: number;
    readonly error: (
      code:
        'unavailable' | 'incompatible-storage' | 'timeout' | 'aborted' | 'quota-or-write-failure',
    ) => Failure;
    readonly upgrade: (database: IDBDatabase, oldVersion: number) => void;
    readonly expectedSchema: (database: IDBDatabase) => boolean;
  }>,
) {
  const translate = (error: unknown): Failure => {
    if (error instanceof DOMException && error.name === 'AbortError') return input.error('aborted');
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'UnknownError')
    )
      return input.error('quota-or-write-failure');
    if (
      error instanceof DOMException &&
      (error.name === 'VersionError' || error.name === 'InvalidStateError')
    )
      return input.error('incompatible-storage');
    return input.error('unavailable');
  };
  const request = <T>(value: IDBRequest<T>): Promise<T> =>
    new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        callback();
      };
      const timer = globalThis.setTimeout(
        () => finish(() => reject(input.error('timeout'))),
        5_000,
      );
      value.onsuccess = () => finish(() => resolve(value.result));
      value.onerror = () => finish(() => reject(translate(value.error)));
    });
  const transaction = (value: IDBTransaction, signal?: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        callback();
      };
      const abort = () => {
        try {
          value.abort();
        } catch {
          /* settled transaction */
        }
        finish(() => reject(input.error('aborted')));
      };
      const timer = globalThis.setTimeout(() => {
        try {
          value.abort();
        } catch {
          /* settled transaction */
        }
        finish(() => reject(input.error('timeout')));
      }, 5_000);
      if (signal?.aborted) return abort();
      signal?.addEventListener('abort', abort, { once: true });
      value.oncomplete = () => finish(resolve);
      value.onerror = () => finish(() => reject(translate(value.error)));
      value.onabort = () => finish(() => reject(translate(value.error)));
    });
  const open = async (signal?: AbortSignal): Promise<IDBDatabase> => {
    if (typeof indexedDB === 'undefined') throw input.error('unavailable');
    if (signal?.aborted) throw input.error('aborted');
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(input.databaseName, input.databaseVersion);
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        callback();
      };
      const abort = () => {
        try {
          request.transaction?.abort();
        } catch {
          /* no transaction */
        }
        finish(() => reject(input.error('aborted')));
      };
      const timer = globalThis.setTimeout(() => {
        try {
          request.transaction?.abort();
        } catch {
          /* no transaction */
        }
        finish(() => reject(input.error('timeout')));
      }, 5_000);
      if (signal?.aborted) return abort();
      signal?.addEventListener('abort', abort, { once: true });
      request.onupgradeneeded = (event) => {
        if (settled || signal?.aborted) {
          request.transaction?.abort();
          return;
        }
        try {
          input.upgrade(request.result, event.oldVersion);
        } catch {
          request.transaction?.abort();
        }
      };
      request.onerror = () => finish(() => reject(translate(request.error)));
      request.onblocked = () => finish(() => reject(input.error('incompatible-storage')));
      request.onsuccess = () => {
        const database = request.result;
        if (settled || signal?.aborted || !input.expectedSchema(database)) {
          database.close();
          finish(() => reject(input.error(signal?.aborted ? 'aborted' : 'incompatible-storage')));
          return;
        }
        finish(() => resolve(database));
      };
    });
  };
  return Object.freeze({ open, request, transaction });
}
