import {
  isTranslationSourceLanguage,
  translationCacheTtlSeconds,
  type TranslationAdapterIdentity,
  type TranslationSourceLanguage,
} from '@wrn/api-contracts/translation-v1';

import { createGeminiTranslationAdapter } from './gemini-adapter.js';
import type { TranslationCachePort, TranslationClock, TranslationQuotaPort } from './handler.js';
import { createTranslationWorkerFetch, systemTranslationClock } from './index.js';

export interface TranslationRuntimeBindings {
  readonly enabled: boolean;
  readonly allowedOrigins: readonly string[];
  readonly adapter: TranslationAdapterIdentity;
  readonly model: string;
  readonly apiKey: string;
  readonly fetch: typeof globalThis.fetch;
  readonly cache: TranslationCachePort;
  readonly readQuota: TranslationQuotaPort;
  readonly providerQuota: TranslationQuotaPort;
  readonly writeQuota: TranslationQuotaPort;
  readonly cacheTtlSeconds: number;
  readonly supportedSourceLanguages: readonly TranslationSourceLanguage[];
  readonly clock?: TranslationClock;
}

/**
 * The Worker entry point receives only these named bindings. Resource creation,
 * binding IDs, routes and secrets remain a separately approved platform step.
 */
export interface TranslationRuntimeEnvironment {
  readonly TRANSLATION_V2_ENABLED?: unknown;
  readonly TRANSLATION_ALLOWED_ORIGINS?: unknown;
  readonly TRANSLATION_MODEL?: unknown;
  readonly GEMINI_API_KEY?: unknown;
  readonly TRANSLATION_CACHE_TTL_SECONDS?: unknown;
  readonly TRANSLATION_SUPPORTED_SOURCE_LANGUAGES?: unknown;
  readonly TRANSLATION_CACHE?: unknown;
  readonly TRANSLATION_READ_QUOTA?: unknown;
  readonly TRANSLATION_PROVIDER_QUOTA?: unknown;
  readonly TRANSLATION_WRITE_QUOTA?: unknown;
}

const geminiAdapterIdentity = Object.freeze({
  id: 'gemini-rest',
  version: 'v1',
  provider: 'google',
});

function disabledFetch(): (request: Request) => Promise<Response> {
  return createTranslationWorkerFetch({ allowedOrigins: [], service: undefined as never });
}

function isAllowedOrigin(value: unknown): value is string {
  if (value === 'capacitor://localhost') return true;
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.origin === value;
  } catch {
    return false;
  }
}

function parseJson(value: unknown): unknown | undefined {
  if (typeof value !== 'string' || value.length === 0 || value.length > 8192) return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function parseOrigins(value: unknown): readonly string[] | undefined {
  const parsed = parseJson(value);
  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    parsed.length > 32 ||
    !parsed.every(isAllowedOrigin) ||
    new Set(parsed).size !== parsed.length
  )
    return undefined;
  return Object.freeze([...parsed]);
}

function parseSourceLanguages(value: unknown): readonly TranslationSourceLanguage[] | undefined {
  const parsed = parseJson(value);
  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    parsed.length > 256 ||
    !parsed.every(isTranslationSourceLanguage) ||
    new Set(parsed).size !== parsed.length
  )
    return undefined;
  return Object.freeze([...parsed]);
}

function parseTtl(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^\d+$/u.test(value)) return undefined;
  const ttl = Number(value);
  return Number.isSafeInteger(ttl) && ttl > 0 && ttl <= translationCacheTtlSeconds
    ? ttl
    : undefined;
}

function isCachePort(value: unknown): value is TranslationCachePort {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TranslationCachePort).get === 'function' &&
    typeof (value as TranslationCachePort).put === 'function'
  );
}

function isQuotaPort(value: unknown): value is TranslationQuotaPort {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TranslationQuotaPort).reserve === 'function'
  );
}

/**
 * Strictly composes a reviewed platform environment into the existing runtime
 * ports. It cannot select a provider, recover missing bindings, or activate a
 * route by itself: every malformed or incomplete value remains disabled.
 */
export function createTranslationRuntimeFetchFromEnvironment(
  environment: TranslationRuntimeEnvironment | undefined,
  fetchImplementation: typeof globalThis.fetch = globalThis.fetch,
): (request: Request) => Promise<Response> {
  if (!environment || environment.TRANSLATION_V2_ENABLED !== 'true') return disabledFetch();
  const allowedOrigins = parseOrigins(environment.TRANSLATION_ALLOWED_ORIGINS);
  const supportedSourceLanguages = parseSourceLanguages(
    environment.TRANSLATION_SUPPORTED_SOURCE_LANGUAGES,
  );
  const cacheTtlSeconds = parseTtl(environment.TRANSLATION_CACHE_TTL_SECONDS);
  if (
    !allowedOrigins ||
    !supportedSourceLanguages ||
    cacheTtlSeconds === undefined ||
    typeof environment.TRANSLATION_MODEL !== 'string' ||
    !/^[a-zA-Z0-9._-]{1,120}$/u.test(environment.TRANSLATION_MODEL) ||
    typeof environment.GEMINI_API_KEY !== 'string' ||
    !isCachePort(environment.TRANSLATION_CACHE) ||
    !isQuotaPort(environment.TRANSLATION_READ_QUOTA) ||
    !isQuotaPort(environment.TRANSLATION_PROVIDER_QUOTA) ||
    !isQuotaPort(environment.TRANSLATION_WRITE_QUOTA)
  )
    return disabledFetch();
  return createTranslationRuntimeFetch({
    enabled: true,
    allowedOrigins,
    adapter: { ...geminiAdapterIdentity, version: `v1:${environment.TRANSLATION_MODEL}` },
    model: environment.TRANSLATION_MODEL,
    apiKey: environment.GEMINI_API_KEY,
    fetch: fetchImplementation,
    cache: environment.TRANSLATION_CACHE,
    readQuota: environment.TRANSLATION_READ_QUOTA,
    providerQuota: environment.TRANSLATION_PROVIDER_QUOTA,
    writeQuota: environment.TRANSLATION_WRITE_QUOTA,
    cacheTtlSeconds,
    supportedSourceLanguages,
  });
}

/**
 * Creates a Worker request handler only from reviewed, explicitly injected bindings.
 * It discovers neither environment values nor a provider and remains disabled by default.
 */
export function createTranslationRuntimeFetch(
  bindings: TranslationRuntimeBindings | undefined,
): (request: Request) => Promise<Response> {
  if (!bindings || bindings.enabled !== true) return disabledFetch();
  try {
    const upstream = createGeminiTranslationAdapter({
      model: bindings.model,
      apiKey: bindings.apiKey,
      fetch: bindings.fetch,
      adapter: bindings.adapter,
    });
    return createTranslationWorkerFetch({
      allowedOrigins: bindings.allowedOrigins,
      service: {
        configuration: {
          enabled: true,
          adapter: bindings.adapter,
          cacheTtlSeconds: bindings.cacheTtlSeconds,
          supportedSourceLanguages: bindings.supportedSourceLanguages,
        },
        clock: bindings.clock ?? systemTranslationClock,
        cache: bindings.cache,
        readQuota: bindings.readQuota,
        providerQuota: bindings.providerQuota,
        writeQuota: bindings.writeQuota,
        upstream,
      },
    });
  } catch {
    return disabledFetch();
  }
}
