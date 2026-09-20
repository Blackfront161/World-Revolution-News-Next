/** The immutable HTTP vocabulary for the target-owned paragraph translation boundary. */
export const translationContractVersion = '1.0.0' as const;
export const translationMode = 'paragraph' as const;
export const translationCacheNamespace = 'translation:v2' as const;
export const translationRequestByteLimit = 36_864;
export const translationTextByteLimit = 32_768;
export const firstAdapterTextCodeUnitLimit = 6_000;
export const translationCacheTtlSeconds = 604_800;

export const translationTargetLanguages = [
  'en',
  'de',
  'es',
  'fr',
  'it',
  'pt',
  'ru',
  'el',
  'tr',
] as const;
export type TranslationLanguage = (typeof translationTargetLanguages)[number];
/** Validated canonical lower-case BCP-47 source; support is bound by the adapter. */
export type TranslationSourceLanguage = string;

export interface TranslationRequest {
  readonly contractVersion: typeof translationContractVersion;
  readonly mode: typeof translationMode;
  readonly sourceLanguage: TranslationSourceLanguage;
  readonly targetLanguage: TranslationLanguage;
  /** Exact, unnormalised public paragraph. Length accounting is UTF-16 code units and UTF-8 bytes. */
  readonly text: string;
}

export interface TranslationAdapterIdentity {
  readonly id: string;
  readonly version: string;
  readonly provider: string;
}

export interface TranslationSuccessResponse {
  readonly contractVersion: typeof translationContractVersion;
  readonly mode: typeof translationMode;
  readonly sourceLanguage: TranslationSourceLanguage;
  readonly targetLanguage: TranslationLanguage;
  readonly requestTextSha256: string;
  readonly translation: { readonly text: string; readonly textSha256: string };
  readonly adapter: TranslationAdapterIdentity;
  readonly cache: {
    readonly namespace: typeof translationCacheNamespace;
    readonly status: 'hit' | 'miss';
    readonly expiresAt: string;
  };
}

export interface TranslationErrorResponse {
  readonly contractVersion: typeof translationContractVersion;
  readonly code:
    | 'INVALID_REQUEST'
    | 'REQUEST_TOO_LARGE'
    | 'UNSUPPORTED_MEDIA_TYPE'
    | 'UNPROCESSABLE_LANGUAGE'
    | 'QUOTA_EXCEEDED'
    | 'SERVICE_UNAVAILABLE'
    | 'UPSTREAM_TIMEOUT';
  readonly message: string;
  readonly correlationId: string;
  readonly retryable: boolean;
}

export type TranslationParseFailure = 'invalid' | 'too-large' | 'language' | 'same-language';

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const expected = [...keys].sort();
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export function isTranslationLanguage(value: unknown): value is TranslationLanguage {
  return (
    typeof value === 'string' && (translationTargetLanguages as readonly string[]).includes(value)
  );
}

export function isTranslationSourceLanguage(value: unknown): value is TranslationSourceLanguage {
  if (
    typeof value !== 'string' ||
    value.length > 63 ||
    value === 'und' ||
    !/^[a-z]{2,3}(?:-[a-z]{4})?(?:-(?:[a-z]{2}|[0-9]{3}))?(?:-(?:[a-z0-9]{5,8}|[0-9][a-z0-9]{3}))*$/.test(
      value,
    )
  )
    return false;
  try {
    return Intl.getCanonicalLocales(value)[0]?.toLowerCase() === value;
  } catch {
    return false;
  }
}

export function isWellFormedUnicode(value: string): boolean {
  return value.isWellFormed();
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

/**
 * Validates the exact wire request without trimming or normalising text.
 * First-adapter character accounting deliberately uses JavaScript UTF-16 code units (`text.length`).
 */
export function parseTranslationRequest(
  value: unknown,
):
  | { readonly ok: true; readonly value: TranslationRequest }
  | { readonly ok: false; readonly reason: TranslationParseFailure } {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, ['contractVersion', 'mode', 'sourceLanguage', 'targetLanguage', 'text'])
  ) {
    return { ok: false, reason: 'invalid' };
  }
  if (
    value.contractVersion !== translationContractVersion ||
    value.mode !== translationMode ||
    typeof value.text !== 'string'
  ) {
    return { ok: false, reason: 'invalid' };
  }
  if (
    !isTranslationSourceLanguage(value.sourceLanguage) ||
    !isTranslationLanguage(value.targetLanguage)
  ) {
    return { ok: false, reason: 'language' };
  }
  if (value.sourceLanguage === value.targetLanguage) return { ok: false, reason: 'same-language' };
  if (!isWellFormedUnicode(value.text) || value.text.trim().length === 0) {
    return { ok: false, reason: 'invalid' };
  }
  if (
    value.text.length > firstAdapterTextCodeUnitLimit ||
    utf8ByteLength(value.text) > translationTextByteLimit
  ) {
    return { ok: false, reason: 'too-large' };
  }
  return {
    ok: true,
    value: {
      contractVersion: translationContractVersion,
      mode: translationMode,
      sourceLanguage: value.sourceLanguage,
      targetLanguage: value.targetLanguage,
      text: value.text,
    },
  };
}

export function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

export function hasHtmlLikeMarkup(value: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(value);
}

export function isTranslationSuccessResponse(value: unknown): value is TranslationSuccessResponse {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, [
      'contractVersion',
      'mode',
      'sourceLanguage',
      'targetLanguage',
      'requestTextSha256',
      'translation',
      'adapter',
      'cache',
    ])
  ) {
    return false;
  }
  if (
    value.contractVersion !== translationContractVersion ||
    value.mode !== translationMode ||
    !isTranslationSourceLanguage(value.sourceLanguage) ||
    !isTranslationLanguage(value.targetLanguage) ||
    !isSha256(value.requestTextSha256) ||
    !isPlainRecord(value.translation) ||
    !isPlainRecord(value.adapter) ||
    !isPlainRecord(value.cache)
  ) {
    return false;
  }
  const translation = value.translation;
  const adapter = value.adapter;
  const cache = value.cache;
  return (
    hasExactKeys(translation, ['text', 'textSha256']) &&
    typeof translation.text === 'string' &&
    isWellFormedUnicode(translation.text) &&
    translation.text.trim().length > 0 &&
    utf8ByteLength(translation.text) <= translationTextByteLimit &&
    isSha256(translation.textSha256) &&
    hasExactKeys(adapter, ['id', 'version', 'provider']) &&
    ['id', 'version', 'provider'].every(
      (key) => typeof adapter[key] === 'string' && adapter[key].length > 0,
    ) &&
    hasExactKeys(cache, ['namespace', 'status', 'expiresAt']) &&
    cache.namespace === translationCacheNamespace &&
    (cache.status === 'hit' || cache.status === 'miss') &&
    typeof cache.expiresAt === 'string' &&
    !Number.isNaN(new Date(cache.expiresAt).valueOf()) &&
    new Date(cache.expiresAt).toISOString() === cache.expiresAt
  );
}

export function isTranslationErrorResponse(value: unknown): value is TranslationErrorResponse {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, ['contractVersion', 'code', 'message', 'correlationId', 'retryable'])
  )
    return false;
  return (
    value.contractVersion === translationContractVersion &&
    [
      'INVALID_REQUEST',
      'REQUEST_TOO_LARGE',
      'UNSUPPORTED_MEDIA_TYPE',
      'UNPROCESSABLE_LANGUAGE',
      'QUOTA_EXCEEDED',
      'SERVICE_UNAVAILABLE',
      'UPSTREAM_TIMEOUT',
    ].includes(String(value.code)) &&
    typeof value.message === 'string' &&
    value.message.length > 0 &&
    typeof value.correlationId === 'string' &&
    value.correlationId.length > 0 &&
    typeof value.retryable === 'boolean'
  );
}
