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
    options: { readonly signal: AbortSignal },
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
  readonly utf16CodeUnits: number;
  readonly storageBytes: number;
}

/** Reservation must be atomic across character and storage counters. */
export interface PodcastQuotaPort {
  readonly reserve: (
    reservation: PodcastQuotaReservation,
    options: { readonly signal: AbortSignal },
  ) => Promise<boolean>;
  /** This may be called only after a proved no-dispatch adapter failure. */
  readonly releaseDefinitePreDispatch: (reservation: PodcastQuotaReservation) => Promise<void>;
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
    },
    options: { readonly signal: AbortSignal; readonly mayCommit: () => boolean },
  ) => Promise<void>;
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
}

export const disabledPodcastRuntimeConfiguration: PodcastRuntimeConfiguration = Object.freeze({
  enabled: false,
  resourceVerification: 'unverified',
  sharedResourceId: 'azure-speech-f0-shared-podcast-v1',
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
    };
