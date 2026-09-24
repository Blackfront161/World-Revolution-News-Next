export const podcastModes = ['short', 'full'] as const;
export type PodcastMode = (typeof podcastModes)[number];
export const podcastLanguages = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const;
export type PodcastLanguage = (typeof podcastLanguages)[number];

export interface CanonicalPodcastArticle {
  readonly id: string;
  readonly revision: string;
  /** Language of both approved text fields; a voice never relabels source text. */
  readonly textLanguage: PodcastLanguage;
  readonly title: string;
  /** Editorially approved short spoken text; never a model-generated fallback. */
  readonly approvedShortText: string | null;
  /** Complete server-side article text where the source/right allows it. */
  readonly approvedFullText: string | null;
}

export interface PodcastGenerationRequest {
  readonly articleId: string;
  readonly mode: PodcastMode;
  readonly language: PodcastLanguage;
  readonly voiceId: string;
}

export interface PodcastAuthorizationContext {
  readonly articleId: string;
  readonly articleRevision: string;
  readonly mode: PodcastMode;
  readonly language: PodcastLanguage;
  readonly voiceId: string;
}

export type PodcastAuthorization =
  | { readonly allowed: true; readonly articleId: string; readonly articleRevision: string }
  | { readonly allowed: false; readonly reason: 'missing' | 'blocked' | 'stale' | 'revoked' };

export interface CanonicalArticleResolverPort {
  readonly resolve: (
    articleId: string,
    options: {
      readonly signal: AbortSignal;
      /** Selects one server-approved language edition; it never translates browser text. */
      readonly language: PodcastLanguage;
      readonly mode: PodcastMode;
    },
  ) => Promise<CanonicalPodcastArticle | null>;
}

/** Each gate must evaluate a canonical article/revision, never browser-provided text. */
export interface PodcastAuthorizationPort {
  readonly authorize: (
    context: PodcastAuthorizationContext,
    options: { readonly signal: AbortSignal },
  ) => Promise<PodcastAuthorization>;
}

export interface PodcastCacheEntry {
  readonly schema: 'wrn.podcast-cache-entry.v1';
  readonly articleId: string;
  readonly articleRevision: string;
  readonly mode: PodcastMode;
  readonly language: PodcastLanguage;
  readonly voiceId: string;
  readonly textSha256: string;
  readonly audio: Uint8Array;
  readonly audioSha256: string;
  readonly createdAt: string;
}

/** The cache is private runtime storage; it has no catalogue/publication operation. */
export interface PodcastCachePort {
  readonly get: (
    key: string,
    options: { readonly signal: AbortSignal },
  ) => Promise<PodcastCacheEntry | null>;
  readonly put: (
    key: string,
    entry: PodcastCacheEntry,
    options: { readonly signal: AbortSignal; readonly mayCommit: () => boolean },
  ) => Promise<void>;
}

export interface PodcastQuotaReservation {
  /** Identifies the one cross-deployment Azure F0 budget; it must be resource-bound globally. */
  readonly sharedResourceId: string;
  readonly operationId: string;
  /** Deterministic private cache identity. The coordinator enforces one live attempt per key. */
  readonly leaseKey: string;
  readonly utf16CodeUnits: number;
  readonly storageBytes: number;
}

export type PodcastLeaseAcquireStatus = 'leader' | 'busy' | 'denied' | 'ambiguous';
export type PodcastLeaseBarrierStatus = 'proceed' | 'ambiguous';
/** Internal DO status; only a caller reconciling its own lost response may accept `committed`. */
export type PodcastStorageCommitStatus = PodcastLeaseBarrierStatus | 'committed';
export type PodcastStorageDeleteStatus = 'proceed' | 'released' | 'ambiguous';
export type PodcastLeaseRecoveryStatus =
  'released-pre-dispatch' | 'released-post-dispatch-storage' | 'busy' | 'ambiguous';
export interface PodcastStorageDeletion {
  readonly leaseKey: string;
  readonly operationId: string;
  readonly actualBytes: number;
}
export interface PodcastLeaseRecoverySummary {
  readonly releasedPreDispatch: number;
  readonly releasedPostDispatchStorage: number;
  /** Exact persisted attempts needing an R2-bound reconciliation; characters remain charged. */
  readonly reviewRequired: readonly PodcastQuotaReservation[];
}

/** Reservation must be atomic across character and storage counters. */
export interface PodcastQuotaPort {
  readonly acquire: (
    reservation: PodcastQuotaReservation,
    options: { readonly signal: AbortSignal },
  ) => Promise<PodcastLeaseAcquireStatus>;
  /** One-shot fence immediately before provider dispatch. A repeated/uncertain call is ambiguous. */
  readonly beginDispatch: (
    reservation: PodcastQuotaReservation,
    options: { readonly signal: AbortSignal },
  ) => Promise<PodcastLeaseBarrierStatus>;
  /** One-shot fence before private storage. Recovery can reject a stale provider result here. */
  readonly beginStorageCommit: (
    reservation: PodcastQuotaReservation,
    options: { readonly signal: AbortSignal },
  ) => Promise<PodcastLeaseBarrierStatus>;
  /** This may be called only before the dispatch fence committed. */
  readonly releaseDefinitePreDispatch: (reservation: PodcastQuotaReservation) => Promise<void>;
  /** Frees only unused private-storage reservation after a successful provider attempt/storage write. */
  readonly settleStorage?: (
    reservation: PodcastQuotaReservation,
    actualBytes: number,
  ) => Promise<void>;
  /** Persists a deletion intent only after exact R2 metadata has been observed. */
  readonly beginStorageDelete?: (
    deletion: PodcastStorageDeletion,
  ) => Promise<PodcastStorageDeleteStatus>;
  /** Completes or idempotently resolves a previously persisted deletion intent. */
  readonly completeStorageDelete?: (
    deletion: PodcastStorageDeletion,
  ) => Promise<Exclude<PodcastStorageDeleteStatus, 'proceed'>>;
  /** Operator/scheduler recovery; never refunds characters once dispatch may have happened. */
  readonly recoverExpiredLease?: (
    reservation: PodcastQuotaReservation,
  ) => Promise<PodcastLeaseRecoveryStatus>;
  /** Bounded internal scheduler operation over exact persisted expired leases. */
  readonly recoverExpiredLeases?: (limit?: number) => Promise<PodcastLeaseRecoverySummary>;
  /** Called only after an R2-bound recovery observes no object beyond the second lease window. */
  readonly releaseAmbiguousStorageAfterNoObject?: (
    reservation: PodcastQuotaReservation,
  ) => Promise<PodcastLeaseRecoveryStatus>;
}

export interface PodcastStoragePort {
  /** Private object storage only. Publication/catalogue creation is deliberately absent. */
  readonly putPrivate: (
    object: {
      readonly key: string;
      readonly bytes: Uint8Array;
      readonly sha256: string;
      readonly contentType: 'audio/mpeg';
      readonly articleId: string;
      readonly articleRevision: string;
      readonly mode: PodcastMode;
      readonly voiceId: string;
      /** Binds R2 expiry/revocation deletion to the exact, reserved synthesis attempt. */
      readonly operationId: string;
      readonly actualBytes: number;
      readonly expiresAt: string;
    },
    options: { readonly signal: AbortSignal; readonly mayCommit: () => boolean },
  ) => Promise<void>;
}

/** Only a reviewed, authenticated revocation/expiry worker may obtain this port. */
export interface PodcastPrivateDeletionPort {
  readonly deletePrivate: (key: string, options: { readonly signal: AbortSignal }) => Promise<void>;
}

export interface PodcastSynthesisPort {
  readonly synthesize: (
    input: {
      readonly language: PodcastLanguage;
      readonly voiceId: string;
      readonly title: string;
      readonly text: string;
    },
    options: { readonly signal: AbortSignal },
  ) => Promise<Uint8Array>;
}

export interface PodcastClock {
  readonly now: () => Date;
}

export interface PodcastRuntimeConfiguration {
  readonly enabled: boolean;
  /** F0 is intentionally not usable until a bound resource/quota has been verified. */
  readonly resourceVerification: 'unverified' | 'verified';
  readonly sharedResourceId: string;
  readonly privateRetentionSeconds: number;
}

export const disabledPodcastRuntimeConfiguration: PodcastRuntimeConfiguration = Object.freeze({
  enabled: false,
  resourceVerification: 'unverified',
  sharedResourceId: 'azure-speech-f0-shared-podcast-v1',
  privateRetentionSeconds: 2_592_000,
});

export interface PodcastServicePorts {
  readonly configuration: PodcastRuntimeConfiguration;
  readonly clock: PodcastClock;
  readonly canonicalArticles: CanonicalArticleResolverPort;
  readonly admission: PodcastAuthorizationPort;
  readonly consent: PodcastAuthorizationPort;
  readonly rights: PodcastAuthorizationPort;
  readonly moderation: PodcastAuthorizationPort;
  readonly cache: PodcastCachePort;
  readonly quota: PodcastQuotaPort;
  readonly storage: PodcastStoragePort;
  readonly synthesis: PodcastSynthesisPort;
}

export type PodcastGenerationResult =
  | { readonly status: 'disabled' | 'unavailable' | 'not-admitted' | 'quota-denied' | 'failed' }
  | {
      readonly status: 'cached' | 'generated';
      readonly cacheKey: string;
      readonly audioSha256: string;
      /** Private object identity only. It is never an R2 URL or a public catalogue key. */
      readonly privateAudio: {
        readonly key: string;
        readonly articleId: string;
        readonly articleRevision: string;
        readonly mode: PodcastMode;
        readonly voiceId: string;
      };
    };
