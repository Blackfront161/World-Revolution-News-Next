import type {
  PodcastPrivateDeletionPort,
  PodcastQuotaPort,
  PodcastQuotaReservation,
  PodcastStoragePort,
} from './contracts.js';

interface R2Bucket {
  put(
    key: string,
    value: Uint8Array,
    options: {
      httpMetadata: { contentType: string; cacheControl: string };
      customMetadata: Record<string, string>;
    },
  ): Promise<unknown>;
  head(
    key: string,
  ): Promise<{ readonly size: number; readonly customMetadata?: Record<string, string> } | null>;
  delete(key: string): Promise<void>;
}
interface PodcastQuotaStub {
  fetch(request: Request): Promise<Response>;
}
interface PodcastQuotaNamespace {
  getByName(name: string): PodcastQuotaStub;
}

export interface CloudflarePodcastBindings {
  readonly PODCAST_PRIVATE_BUCKET?: R2Bucket;
  readonly PODCAST_QUOTA?: PodcastQuotaNamespace;
}

const keyPattern = /^wrn:podcast:v1:[a-f0-9]{64}$/u;
const operationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const quotaObjectName = 'wrn-next-podcast-azure-f0-v1';

function recoveryReservation(value: unknown): value is PodcastQuotaReservation {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return (
    keys.join(',') === 'leaseKey,operationId,sharedResourceId,storageBytes,utf16CodeUnits' &&
    record.sharedResourceId === 'azure-speech-f0-shared-podcast-v1' &&
    typeof record.operationId === 'string' &&
    operationIdPattern.test(record.operationId) &&
    typeof record.leaseKey === 'string' &&
    keyPattern.test(record.leaseKey) &&
    typeof record.utf16CodeUnits === 'number' &&
    Number.isSafeInteger(record.utf16CodeUnits) &&
    record.utf16CodeUnits > 0 &&
    record.utf16CodeUnits <= 12_000 &&
    typeof record.storageBytes === 'number' &&
    Number.isSafeInteger(record.storageBytes) &&
    record.storageBytes > 0 &&
    record.storageBytes <= 25 * 1024 * 1024
  );
}

/** No audio is placed in KV: R2 receives only private, finite-lifetime objects. */
export function createPrivateR2Ports(bucket: R2Bucket): {
  readonly storage: PodcastStoragePort;
  readonly deletion: PodcastPrivateDeletionPort;
} {
  const ensure = (key: string) => {
    if (!keyPattern.test(key)) throw new Error('Podcast private storage unavailable');
  };
  return {
    storage: {
      async putPrivate(object, { signal, mayCommit }) {
        ensure(object.key);
        if (
          signal.aborted ||
          !mayCommit() ||
          object.bytes.byteLength === 0 ||
          object.bytes.byteLength > 25 * 1024 * 1024 ||
          !/^[a-f0-9]{64}$/u.test(object.sha256) ||
          !/^[0-9a-f-]{36}$/u.test(object.operationId) ||
          !Number.isSafeInteger(object.actualBytes) ||
          object.actualBytes !== object.bytes.byteLength ||
          !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/u.test(object.expiresAt)
        )
          throw new Error('Podcast private storage unavailable');
        await bucket.put(object.key, object.bytes, {
          httpMetadata: { contentType: 'audio/mpeg', cacheControl: 'private, no-store' },
          customMetadata: {
            sha256: object.sha256,
            articleId: object.articleId,
            articleRevision: object.articleRevision,
            mode: object.mode,
            voiceId: object.voiceId,
            operationId: object.operationId,
            actualBytes: String(object.actualBytes),
            expiresAt: object.expiresAt,
          },
        });
      },
    },
    deletion: {
      async deletePrivate(key, { signal }) {
        ensure(key);
        if (signal.aborted) throw new Error('Podcast private storage unavailable');
        await bucket.delete(key);
      },
    },
  };
}

export function createCloudflareQuotaPort(namespace: PodcastQuotaNamespace): PodcastQuotaPort {
  const stub = namespace.getByName(quotaObjectName);
  const invoke = async (
    path: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> => {
    const response = await stub.fetch(
      new Request(`https://podcast-quota.internal/${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
    if (!response.ok) return null;
    const value: unknown = await response.json();
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  };
  return {
    async acquire(reservation, { signal }) {
      if (signal.aborted) return 'ambiguous';
      // The same operation ID is retried once: the DO returns the committed leader decision
      // idempotently if the first response was lost after its SQLite transaction committed.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const status = (await invoke('acquire', { reservation }))?.status;
          if (
            status === 'leader' ||
            status === 'busy' ||
            status === 'denied' ||
            status === 'ambiguous'
          )
            return status;
        } catch {
          // Retry only acquisition; dispatch/storage barriers are deliberately one-shot.
        }
      }
      return 'ambiguous';
    },
    async beginDispatch(reservation, { signal }) {
      if (signal.aborted) return 'ambiguous';
      try {
        return (await invoke('begin-dispatch', { reservation }))?.status === 'proceed'
          ? 'proceed'
          : 'ambiguous';
      } catch {
        return 'ambiguous';
      }
    },
    async beginStorageCommit(reservation, { signal }) {
      if (signal.aborted) return 'ambiguous';
      let uncertain = false;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const status = (await invoke('begin-storage-commit', { reservation }))?.status;
          if (status === 'proceed') return 'proceed';
          if (status === 'committed') return uncertain ? 'proceed' : 'ambiguous';
          if (status === 'ambiguous') return 'ambiguous';
          uncertain = true;
        } catch {
          uncertain = true;
        }
      }
      return 'ambiguous';
    },
    async releaseDefinitePreDispatch(reservation) {
      try {
        await invoke('release-definite-pre-dispatch', { reservation });
      } catch {
        // The caller must fail closed; a release failure never authorizes a retry.
      }
    },
    async settleStorage(reservation, actualBytes) {
      try {
        await invoke('settle-storage', { reservation, actualBytes });
      } catch {
        /* retain conservative reservation */
      }
    },
    async beginStorageDelete(deletion) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const status = (await invoke('begin-storage-delete', { deletion }))?.status;
          if (status === 'proceed' || status === 'released') return status;
          if (status === 'ambiguous') throw new Error('Podcast private storage unavailable');
        } catch (error) {
          if (attempt === 1) throw error;
        }
      }
      throw new Error('Podcast private storage unavailable');
    },
    async completeStorageDelete(deletion) {
      const status = (await invoke('complete-storage-delete', { deletion }))?.status;
      if (status === 'released') return 'released';
      throw new Error('Podcast private storage unavailable');
    },
    async recoverExpiredLease(reservation) {
      try {
        const status = (await invoke('recover-expired-lease', { reservation }))?.status;
        if (
          status === 'released-pre-dispatch' ||
          status === 'released-post-dispatch-storage' ||
          status === 'busy' ||
          status === 'ambiguous'
        )
          return status;
      } catch {
        // Retain all reservations on uncertain recovery.
      }
      return 'ambiguous';
    },
    async recoverExpiredLeases(limit = 50) {
      const value = await invoke('recover-expired-leases', { limit });
      if (
        !value ||
        typeof value.releasedPreDispatch !== 'number' ||
        !Number.isSafeInteger(value.releasedPreDispatch) ||
        typeof value.releasedPostDispatchStorage !== 'number' ||
        !Number.isSafeInteger(value.releasedPostDispatchStorage) ||
        !Array.isArray(value.reviewRequired)
      )
        throw new Error('Podcast quota recovery unavailable');
      const reviewRequired = value.reviewRequired.filter(recoveryReservation);
      if (reviewRequired.length !== value.reviewRequired.length)
        throw new Error('Podcast quota recovery unavailable');
      return {
        releasedPreDispatch: value.releasedPreDispatch as number,
        releasedPostDispatchStorage: value.releasedPostDispatchStorage as number,
        reviewRequired,
      };
    },
    async releaseAmbiguousStorageAfterNoObject(reservation) {
      const status = (await invoke('release-ambiguous-storage-after-no-object', { reservation }))
        ?.status;
      if (
        status === 'released-post-dispatch-storage' ||
        status === 'busy' ||
        status === 'ambiguous'
      )
        return status;
      throw new Error('Podcast quota recovery unavailable');
    },
  };
}

/** Internal scheduler seam. It never refunds characters and requires R2 evidence for ambiguity. */
export function createPrivateLeaseRecoveryPort(
  bucket: R2Bucket,
  quota: PodcastQuotaPort,
): {
  readonly recoverExpired: (
    limit: number,
    options: { readonly signal: AbortSignal },
  ) => Promise<{
    readonly releasedPreDispatch: number;
    readonly releasedPostDispatchStorage: number;
    readonly reconciledAmbiguous: number;
    readonly reviewRequired: readonly PodcastQuotaReservation[];
  }>;
} {
  return {
    recoverExpired: async (limit, { signal }) => {
      if (signal.aborted) throw new Error('Podcast quota recovery unavailable');
      const summary = await quota.recoverExpiredLeases?.(limit);
      if (!summary) throw new Error('Podcast quota recovery unavailable');
      const expiry = createPrivateExpiryRevocationPort(bucket, quota);
      let reconciledAmbiguous = 0;
      const reviewRequired: PodcastQuotaReservation[] = [];
      for (const reservation of summary.reviewRequired) {
        if (signal.aborted) throw new Error('Podcast quota recovery unavailable');
        const object = await bucket.head(reservation.leaseKey);
        if (!object) {
          const status = await quota.releaseAmbiguousStorageAfterNoObject?.(reservation);
          if (status === 'released-post-dispatch-storage') reconciledAmbiguous += 1;
          else reviewRequired.push(reservation);
          continue;
        }
        const actualBytes = Number(object.customMetadata?.actualBytes);
        if (
          !Number.isSafeInteger(actualBytes) ||
          actualBytes < 1 ||
          actualBytes > 25 * 1024 * 1024 ||
          object.size !== actualBytes ||
          object.customMetadata?.operationId !== reservation.operationId
        ) {
          reviewRequired.push(reservation);
          continue;
        }
        await expiry.deleteExpiredOrRevoked(
          { key: reservation.leaseKey, operationId: reservation.operationId, actualBytes },
          { signal },
        );
        reconciledAmbiguous += 1;
      }
      return {
        releasedPreDispatch: summary.releasedPreDispatch,
        releasedPostDispatchStorage: summary.releasedPostDispatchStorage,
        reconciledAmbiguous,
        reviewRequired,
      };
    },
  };
}

/** Call only after an authenticated revocation or expiry decision; R2 delete happens before freeing active quota. */
export function createPrivateExpiryRevocationPort(
  bucket: R2Bucket,
  quota: PodcastQuotaPort,
): {
  readonly deleteExpiredOrRevoked: (
    value: { readonly key: string; readonly operationId: string; readonly actualBytes: number },
    options: { readonly signal: AbortSignal },
  ) => Promise<void>;
} {
  return {
    deleteExpiredOrRevoked: async (value, { signal }) => {
      if (
        !keyPattern.test(value.key) ||
        signal.aborted ||
        !/^[0-9a-f-]{36}$/u.test(value.operationId) ||
        !Number.isSafeInteger(value.actualBytes) ||
        value.actualBytes < 1 ||
        value.actualBytes > 25 * 1024 * 1024
      )
        throw new Error('Podcast private storage unavailable');
      const deletion = {
        leaseKey: value.key,
        operationId: value.operationId,
        actualBytes: value.actualBytes,
      };
      const object = await bucket.head(value.key);
      if (object) {
        if (
          object.size !== value.actualBytes ||
          object.customMetadata?.operationId !== value.operationId ||
          object.customMetadata.actualBytes !== String(value.actualBytes)
        )
          throw new Error('Podcast private storage unavailable');
        const prepared = await quota.beginStorageDelete?.(deletion);
        if (prepared !== 'proceed') throw new Error('Podcast private storage unavailable');
        if (signal.aborted) throw new Error('Podcast private storage unavailable');
        await bucket.delete(value.key);
      }
      const completed = await quota.completeStorageDelete?.(deletion);
      if (completed !== 'released') throw new Error('Podcast private storage unavailable');
    },
  };
}

export function composeCloudflarePodcastPorts(bindings: CloudflarePodcastBindings): {
  readonly cache: { readonly enabled: false; readonly reason: 'audio-not-cached-in-kv' };
  readonly quota?: PodcastQuotaPort;
  readonly storage?: PodcastStoragePort;
  readonly deletion?: PodcastPrivateDeletionPort;
  readonly recovery?: ReturnType<typeof createPrivateLeaseRecoveryPort>;
} {
  const bucket = bindings.PODCAST_PRIVATE_BUCKET;
  const quota = bindings.PODCAST_QUOTA;
  if (
    !bucket ||
    !quota ||
    typeof bucket.put !== 'function' ||
    typeof bucket.head !== 'function' ||
    typeof bucket.delete !== 'function' ||
    typeof quota.getByName !== 'function'
  )
    return { cache: { enabled: false, reason: 'audio-not-cached-in-kv' } };
  const privatePorts = createPrivateR2Ports(bucket);
  const quotaPort = createCloudflareQuotaPort(quota);
  return {
    cache: { enabled: false, reason: 'audio-not-cached-in-kv' },
    quota: quotaPort,
    storage: privatePorts.storage,
    deletion: privatePorts.deletion,
    recovery: createPrivateLeaseRecoveryPort(bucket, quotaPort),
  };
}
