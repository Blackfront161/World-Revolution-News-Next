import {
  hasHtmlLikeMarkup,
  isSha256,
  isTranslationLanguage,
  isTranslationSourceLanguage,
  isWellFormedUnicode,
  parseTranslationRequest,
  translationCacheNamespace,
  translationCacheTtlSeconds,
  translationContractVersion,
  translationMode,
  translationTextByteLimit,
  utf8ByteLength,
  type TranslationAdapterIdentity,
  type TranslationErrorResponse,
  type TranslationLanguage,
  type TranslationSourceLanguage,
  type TranslationRequest,
  type TranslationSuccessResponse,
} from '@wrn/api-contracts/translation-v1';

const serverDeadlineMilliseconds = 12_000;

export interface TranslationClock {
  readonly now: () => Date;
  readonly setTimeout: (callback: () => void, milliseconds: number) => unknown;
  readonly clearTimeout: (handle: unknown) => void;
}

export interface TranslationCachePort {
  readonly get: (key: string, options: { readonly signal: AbortSignal }) => Promise<unknown>;
  /** The adapter must check mayCommit immediately before committing a deferred write. */
  readonly put: (
    key: string,
    entry: TranslationCacheEntry,
    ttlSeconds: number,
    options: { readonly signal: AbortSignal; readonly mayCommit: () => boolean },
  ) => Promise<void>;
}

export interface TranslationQuotaPort {
  readonly reserve: (
    reservation: {
      readonly requests: 1;
      readonly utf16CodeUnits: number;
    },
    options: { readonly signal: AbortSignal },
  ) => Promise<boolean>;
  readonly release?: (reservation: {
    readonly requests: 1;
    readonly utf16CodeUnits: number;
  }) => Promise<void>;
}

export interface TranslationUpstreamResult {
  readonly contractVersion: typeof translationContractVersion;
  readonly mode: typeof translationMode;
  readonly sourceLanguage: TranslationSourceLanguage;
  readonly targetLanguage: TranslationLanguage;
  readonly translation: { readonly text: string };
  readonly adapter: TranslationAdapterIdentity;
  /** A target mapping must prove one provider attempt; any other value fails closed. */
  readonly attempts: 1;
}

export interface TranslationUpstreamPort {
  readonly translate: (
    request: TranslationRequest,
    options: { readonly signal: AbortSignal; readonly noFallback: true },
  ) => Promise<unknown>;
}

export interface TranslationServiceConfiguration {
  readonly enabled: boolean;
  readonly adapter: TranslationAdapterIdentity;
  readonly cacheTtlSeconds: number;
  readonly supportedSourceLanguages: readonly TranslationSourceLanguage[];
}

export interface TranslationServicePorts {
  readonly configuration: TranslationServiceConfiguration;
  readonly clock: TranslationClock;
  readonly cache: TranslationCachePort;
  /** A read/abuse reservation is made before every cache lookup, including hits. */
  readonly readQuota: TranslationQuotaPort;
  /** A miss reserves one request and the exact JavaScript UTF-16 code-unit count. */
  readonly providerQuota: TranslationQuotaPort;
  /** A completed miss separately reserves one storage write. */
  readonly writeQuota: TranslationQuotaPort;
  readonly upstream: TranslationUpstreamPort;
  readonly safeLog?: (event: TranslationSafeLogEvent) => void;
}

export interface TranslationSafeLogEvent {
  readonly code:
    | 'cache-hit'
    | 'cache-miss'
    | 'quota-denied'
    | 'integrity-failed'
    | 'upstream-failed'
    | 'upstream-timeout';
  readonly statusClass: 4 | 5 | 2;
}

export interface TranslationCacheEntry {
  readonly schema: 'wrn.translation-cache-entry.v2';
  readonly request: {
    readonly mode: typeof translationMode;
    readonly sourceLanguage: TranslationSourceLanguage;
    readonly targetLanguage: TranslationLanguage;
    readonly textSha256: string;
  };
  readonly adapter: TranslationAdapterIdentity;
  readonly translation: { readonly text: string; readonly textSha256: string };
  readonly createdAt: string;
  readonly expiresAt: string;
}

export type TranslationServiceResult =
  | { readonly status: number; readonly body: TranslationSuccessResponse }
  | { readonly status: number; readonly body: TranslationErrorResponse };

/** Only a trusted injected adapter may use this error after proving no dispatch occurred. */
export class DefinitePreDispatchFailure extends Error {
  public constructor() {
    super('The trusted upstream adapter failed before dispatch.');
    this.name = 'DefinitePreDispatchFailure';
  }
}

function randomCorrelationId(): string {
  return crypto.randomUUID();
}

function error(
  status: number,
  code: TranslationErrorResponse['code'],
  retryable: boolean,
): TranslationServiceResult {
  const message =
    code === 'REQUEST_TOO_LARGE'
      ? 'The request exceeds the permitted size.'
      : code === 'UNSUPPORTED_MEDIA_TYPE'
        ? 'The request content type is unsupported.'
        : code === 'UNPROCESSABLE_LANGUAGE'
          ? 'The requested language pair is unsupported.'
          : code === 'QUOTA_EXCEEDED'
            ? 'The translation service quota is unavailable.'
            : code === 'UPSTREAM_TIMEOUT'
              ? 'The translation service timed out.'
              : code === 'INVALID_REQUEST'
                ? 'The translation request is invalid.'
                : 'The translation service is unavailable.';
  return {
    status,
    body: {
      contractVersion: translationContractVersion,
      code,
      message,
      correlationId: randomCorrelationId(),
      retryable,
    },
  };
}

function sameIdentity(
  left: TranslationAdapterIdentity,
  right: TranslationAdapterIdentity,
): boolean {
  return left.id === right.id && left.version === right.version && left.provider === right.provider;
}

function validAdapterIdentity(value: unknown): value is TranslationAdapterIdentity {
  return (
    isPlainRecord(value) &&
    exactKeys(value, ['id', 'version', 'provider']) &&
    [value.id, value.version, value.provider].every(
      (part) =>
        typeof part === 'string' &&
        part.length > 0 &&
        part.length <= 128 &&
        /^[a-zA-Z0-9._:-]+$/.test(part),
    )
  );
}

function validConfiguration(value: unknown): value is TranslationServiceConfiguration {
  return (
    isPlainRecord(value) &&
    exactKeys(value, ['enabled', 'adapter', 'cacheTtlSeconds', 'supportedSourceLanguages']) &&
    value.enabled === true &&
    validAdapterIdentity(value.adapter) &&
    typeof value.cacheTtlSeconds === 'number' &&
    Number.isInteger(value.cacheTtlSeconds) &&
    value.cacheTtlSeconds > 0 &&
    value.cacheTtlSeconds <= translationCacheTtlSeconds &&
    Array.isArray(value.supportedSourceLanguages) &&
    value.supportedSourceLanguages.length > 0 &&
    value.supportedSourceLanguages.length <= 256 &&
    value.supportedSourceLanguages.every(isTranslationSourceLanguage) &&
    new Set(value.supportedSourceLanguages).size === value.supportedSourceLanguages.length
  );
}

function hasRequiredPorts(value: unknown): value is TranslationServicePorts {
  if (!isPlainRecord(value)) return false;
  const candidate = value as Partial<TranslationServicePorts>;
  const quotaPortIsUsable = (port: TranslationQuotaPort | undefined): boolean =>
    typeof port?.reserve === 'function';
  return (
    typeof candidate.clock?.now === 'function' &&
    typeof candidate.clock.setTimeout === 'function' &&
    typeof candidate.clock.clearTimeout === 'function' &&
    typeof candidate.cache?.get === 'function' &&
    typeof candidate.cache.put === 'function' &&
    (candidate.safeLog === undefined || typeof candidate.safeLog === 'function') &&
    quotaPortIsUsable(candidate.readQuota) &&
    quotaPortIsUsable(candidate.providerQuota) &&
    quotaPortIsUsable(candidate.writeQuota) &&
    typeof candidate.upstream?.translate === 'function'
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

function isCacheEntry(value: unknown): value is TranslationCacheEntry {
  if (
    !isPlainRecord(value) ||
    !exactKeys(value, ['schema', 'request', 'adapter', 'translation', 'createdAt', 'expiresAt'])
  ) {
    return false;
  }
  if (
    value.schema !== 'wrn.translation-cache-entry.v2' ||
    !isPlainRecord(value.request) ||
    !isPlainRecord(value.adapter) ||
    !isPlainRecord(value.translation)
  ) {
    return false;
  }
  return (
    exactKeys(value.request, ['mode', 'sourceLanguage', 'targetLanguage', 'textSha256']) &&
    value.request.mode === translationMode &&
    isTranslationSourceLanguage(value.request.sourceLanguage) &&
    isTranslationLanguage(value.request.targetLanguage) &&
    isSha256(value.request.textSha256) &&
    exactKeys(value.adapter, ['id', 'version', 'provider']) &&
    typeof value.adapter.id === 'string' &&
    typeof value.adapter.version === 'string' &&
    typeof value.adapter.provider === 'string' &&
    exactKeys(value.translation, ['text', 'textSha256']) &&
    typeof value.translation.text === 'string' &&
    isSha256(value.translation.textSha256) &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.expiresAt)
  );
}

function validOutputText(text: string): boolean {
  return (
    isWellFormedUnicode(text) &&
    text.trim().length > 0 &&
    utf8ByteLength(text) <= translationTextByteLimit &&
    !hasHtmlLikeMarkup(text)
  );
}

/**
 * Exact response envelope required from a reviewed service-binding adapter. The Worker has no
 * default mapping because the existing live seam has not proved this envelope or its provenance.
 */
export function parseVersionedUpstreamResult(
  value: unknown,
  request: TranslationRequest,
  expectedAdapter: TranslationAdapterIdentity,
): TranslationUpstreamResult | undefined {
  if (
    !isPlainRecord(value) ||
    !exactKeys(value, [
      'contractVersion',
      'mode',
      'sourceLanguage',
      'targetLanguage',
      'translation',
      'adapter',
      'attempts',
    ]) ||
    value.contractVersion !== translationContractVersion ||
    value.mode !== translationMode ||
    value.sourceLanguage !== request.sourceLanguage ||
    value.targetLanguage !== request.targetLanguage ||
    value.attempts !== 1 ||
    !isPlainRecord(value.translation) ||
    !exactKeys(value.translation, ['text']) ||
    typeof value.translation.text !== 'string' ||
    !isPlainRecord(value.adapter) ||
    !exactKeys(value.adapter, ['id', 'version', 'provider']) ||
    typeof value.adapter.id !== 'string' ||
    typeof value.adapter.version !== 'string' ||
    typeof value.adapter.provider !== 'string'
  ) {
    return undefined;
  }
  const adapter = {
    id: value.adapter.id,
    version: value.adapter.version,
    provider: value.adapter.provider,
  };
  if (!validAdapterIdentity(adapter) || !sameIdentity(adapter, expectedAdapter)) return undefined;
  return {
    contractVersion: translationContractVersion,
    mode: translationMode,
    sourceLanguage: request.sourceLanguage,
    targetLanguage: request.targetLanguage,
    translation: { text: value.translation.text },
    adapter,
    attempts: 1,
  };
}

function defaultClock(): TranslationClock {
  return {
    now: () => new Date(),
    setTimeout: (callback, milliseconds) => setTimeout(callback, milliseconds),
    clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
}

export const systemTranslationClock = defaultClock();

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function canonicalCacheIdentity(
  request: TranslationRequest,
  adapter: TranslationAdapterIdentity,
): string {
  return JSON.stringify({
    schema: 'wrn.translation-cache-key.v2',
    contractVersion: translationContractVersion,
    mode: translationMode,
    sourceLanguage: request.sourceLanguage,
    targetLanguage: request.targetLanguage,
    text: request.text,
    adapter: { id: adapter.id, version: adapter.version },
  });
}

export async function deriveTranslationCacheKey(
  request: TranslationRequest,
  adapter: TranslationAdapterIdentity,
): Promise<string> {
  return `${translationCacheNamespace}:${await sha256Hex(canonicalCacheIdentity(request, adapter))}`;
}

async function validCachedEntry(
  entry: TranslationCacheEntry,
  request: TranslationRequest,
  adapter: TranslationAdapterIdentity,
  requestTextSha256: string,
  now: Date,
): Promise<boolean> {
  const created = new Date(entry.createdAt);
  const expires = new Date(entry.expiresAt);
  return (
    entry.request.mode === translationMode &&
    entry.request.sourceLanguage === request.sourceLanguage &&
    entry.request.targetLanguage === request.targetLanguage &&
    entry.request.textSha256 === requestTextSha256 &&
    sameIdentity(entry.adapter, adapter) &&
    validOutputText(entry.translation.text) &&
    entry.translation.textSha256 === (await sha256Hex(entry.translation.text)) &&
    created.valueOf() <= now.valueOf() &&
    expires.valueOf() > now.valueOf() &&
    expires.valueOf() - created.valueOf() <= translationCacheTtlSeconds * 1000
  );
}

function successFitsResponseLimit(response: TranslationSuccessResponse): boolean {
  return utf8ByteLength(JSON.stringify(response)) <= 36_864;
}

async function makeSuccess(
  request: TranslationRequest,
  adapter: TranslationAdapterIdentity,
  requestTextSha256: string,
  text: string,
  status: 'hit' | 'miss',
  expiresAt: string,
): Promise<TranslationSuccessResponse | undefined> {
  const response: TranslationSuccessResponse = {
    contractVersion: translationContractVersion,
    mode: translationMode,
    sourceLanguage: request.sourceLanguage,
    targetLanguage: request.targetLanguage,
    requestTextSha256,
    translation: { text, textSha256: await sha256Hex(text) },
    adapter,
    cache: { namespace: translationCacheNamespace, status, expiresAt },
  };
  return successFitsResponseLimit(response) ? response : undefined;
}

class TranslationRunEnded extends Error {}
interface TranslationRun {
  readonly signal: AbortSignal;
  readonly mayCommit: () => boolean;
  readonly wait: <T>(work: () => T | Promise<T>) => Promise<T>;
}

const maxInFlightMisses = 32;
type InFlightMiss = {
  readonly promise: Promise<TranslationServiceResult>;
  waiters: number;
  readonly stop: () => void;
};
const inFlightMisses = new WeakMap<object, Map<string, InFlightMiss>>();
const serviceIdentities = new WeakMap<object, object>();

function serviceIdentityFor(ports: TranslationServicePorts): object {
  const existing = serviceIdentities.get(ports);
  if (existing) return existing;
  const identity = {};
  serviceIdentities.set(ports, identity);
  return identity;
}

function createDetachedRun(ports: TranslationServicePorts): {
  readonly run: TranslationRun;
  readonly stop: () => void;
  readonly finish: () => void;
  readonly timedOut: () => boolean;
} {
  const controller = new AbortController();
  const start = ports.clock.now().valueOf();
  let ended: 'abort' | 'timeout' | undefined;
  let finished = false;
  let rejectStop!: (reason: Error) => void;
  const stopped = new Promise<never>((_resolve, reject) => {
    rejectStop = reject;
  });
  void stopped.catch(() => {});
  const stop = (reason: 'abort' | 'timeout') => {
    if (ended || finished) return;
    ended = reason;
    controller.abort();
    rejectStop(new TranslationRunEnded());
  };
  const mayCommit = () => {
    if (!ended && ports.clock.now().valueOf() >= start + serverDeadlineMilliseconds)
      stop('timeout');
    return !ended && !finished;
  };
  const run: TranslationRun = {
    signal: controller.signal,
    mayCommit,
    async wait<T>(work: () => T | Promise<T>): Promise<T> {
      if (!mayCommit()) throw new TranslationRunEnded();
      const pending = Promise.resolve().then(() => {
        if (!mayCommit()) throw new TranslationRunEnded();
        return work();
      });
      const result = await Promise.race([pending, stopped]);
      if (!mayCommit()) throw new TranslationRunEnded();
      return result;
    },
  };
  const timer = ports.clock.setTimeout(() => stop('timeout'), serverDeadlineMilliseconds);
  return {
    run,
    stop: () => stop('abort'),
    finish: () => {
      finished = true;
      controller.abort();
      ports.clock.clearTimeout(timer);
    },
    timedOut: () => ended === 'timeout',
  };
}

/** Caller cancellation and the service deadline fence every asynchronous port boundary. */
export async function handleTranslation(
  value: unknown,
  ports: TranslationServicePorts,
  callerSignal?: AbortSignal,
): Promise<TranslationServiceResult> {
  const parsed = parseTranslationRequest(value);
  if (!parsed.ok) {
    if (parsed.reason === 'too-large') return error(413, 'REQUEST_TOO_LARGE', false);
    if (parsed.reason === 'language' || parsed.reason === 'same-language') {
      return error(422, 'UNPROCESSABLE_LANGUAGE', false);
    }
    return error(400, 'INVALID_REQUEST', false);
  }
  const request = parsed.value;
  try {
    if (!hasRequiredPorts(ports) || !validConfiguration(ports.configuration))
      return error(503, 'SERVICE_UNAVAILABLE', true);
    if (!ports.configuration.supportedSourceLanguages.includes(request.sourceLanguage))
      return error(422, 'UNPROCESSABLE_LANGUAGE', false);
    if (callerSignal?.aborted) return error(503, 'SERVICE_UNAVAILABLE', false);
    const configuration = {
      ...ports.configuration,
      adapter: { ...ports.configuration.adapter },
      supportedSourceLanguages: [...ports.configuration.supportedSourceLanguages],
    };
    const controller = new AbortController();
    const start = ports.clock.now().valueOf();
    if (!Number.isFinite(start)) return error(503, 'SERVICE_UNAVAILABLE', true);
    let ended: 'abort' | 'timeout' | undefined;
    let finished = false;
    let rejectStop!: (reason: Error) => void;
    const stopped = new Promise<never>((_resolve, reject) => {
      rejectStop = reject;
    });
    // Attach rejection handling before a caller can abort between listener registration and work.
    void stopped.catch(() => {});
    const stop = (reason: 'abort' | 'timeout') => {
      if (ended) return;
      ended = reason;
      controller.abort();
      rejectStop(new TranslationRunEnded());
    };
    const onAbort = () => stop('abort');
    const mayCommit = () => {
      if (callerSignal?.aborted) stop('abort');
      if (!ended && ports.clock.now().valueOf() >= start + serverDeadlineMilliseconds)
        stop('timeout');
      return !ended && !finished;
    };
    const run: TranslationRun = {
      signal: controller.signal,
      mayCommit,
      async wait<T>(work: () => T | Promise<T>): Promise<T> {
        if (!mayCommit()) throw new TranslationRunEnded();
        const pending = Promise.resolve().then(() => {
          if (!mayCommit()) throw new TranslationRunEnded();
          return work();
        });
        const result = await Promise.race([pending, stopped]);
        if (!mayCommit()) throw new TranslationRunEnded();
        return result;
      },
    };
    callerSignal?.addEventListener('abort', onAbort, { once: true });
    const timer = ports.clock.setTimeout(() => stop('timeout'), serverDeadlineMilliseconds);
    try {
      const configuredPorts = { ...ports, configuration };
      serviceIdentities.set(configuredPorts, serviceIdentityFor(ports));
      const result = await run.wait(() => runTranslation(request, configuredPorts, run));
      return result;
    } catch {
      return ended === 'timeout'
        ? error(504, 'UPSTREAM_TIMEOUT', true)
        : error(503, 'SERVICE_UNAVAILABLE', !ended);
    } finally {
      finished = true;
      controller.abort();
      ports.clock.clearTimeout(timer);
      callerSignal?.removeEventListener('abort', onAbort);
    }
  } catch {
    return error(503, 'SERVICE_UNAVAILABLE', true);
  }
}

async function runTranslation(
  request: TranslationRequest,
  ports: TranslationServicePorts,
  run: TranslationRun,
): Promise<TranslationServiceResult> {
  const requestTextSha256 = await run.wait(() => sha256Hex(request.text));
  const key = await run.wait(() => deriveTranslationCacheKey(request, ports.configuration.adapter));
  const readReservation = { requests: 1 as const, utf16CodeUnits: 0 };
  try {
    if (
      (await run.wait(() => ports.readQuota.reserve(readReservation, { signal: run.signal }))) !==
      true
    ) {
      ports.safeLog?.({ code: 'quota-denied', statusClass: 4 });
      return error(429, 'QUOTA_EXCEEDED', true);
    }
  } catch {
    return error(503, 'SERVICE_UNAVAILABLE', true);
  }

  let cached: unknown;
  try {
    cached = await run.wait(() => ports.cache.get(key, { signal: run.signal }));
  } catch {
    return error(503, 'SERVICE_UNAVAILABLE', true);
  }
  if (cached !== undefined) {
    if (
      !isCacheEntry(cached) ||
      !(await run.wait(() =>
        validCachedEntry(
          cached,
          request,
          ports.configuration.adapter,
          requestTextSha256,
          ports.clock.now(),
        ),
      ))
    ) {
      ports.safeLog?.({ code: 'integrity-failed', statusClass: 5 });
      return error(503, 'SERVICE_UNAVAILABLE', false);
    }
    const response = await run.wait(() =>
      makeSuccess(
        request,
        ports.configuration.adapter,
        requestTextSha256,
        cached.translation.text,
        'hit',
        cached.expiresAt,
      ),
    );
    if (!response) return error(503, 'SERVICE_UNAVAILABLE', false);
    ports.safeLog?.({ code: 'cache-hit', statusClass: 2 });
    return { status: 200, body: response };
  }

  return joinOrCreateMiss(request, ports, requestTextSha256, key, run);
}

async function joinOrCreateMiss(
  request: TranslationRequest,
  ports: TranslationServicePorts,
  requestTextSha256: string,
  key: string,
  callerRun: TranslationRun,
): Promise<TranslationServiceResult> {
  const instance = serviceIdentityFor(ports);
  let misses = inFlightMisses.get(instance);
  if (!misses) {
    misses = new Map();
    inFlightMisses.set(instance, misses);
  }
  const missKey = `${key}:${ports.configuration.adapter.provider}`;
  let miss = misses.get(missKey);
  if (!miss) {
    if (misses.size >= maxInFlightMisses) return error(503, 'SERVICE_UNAVAILABLE', true);
    const detached = createDetachedRun(ports);
    const created: { current?: InFlightMiss } = {};
    const promise = (async () => {
      try {
        return await detached.run.wait(() =>
          runTranslationMiss(request, ports, requestTextSha256, key, detached.run),
        );
      } catch {
        return detached.timedOut()
          ? error(504, 'UPSTREAM_TIMEOUT', true)
          : error(503, 'SERVICE_UNAVAILABLE', true);
      } finally {
        detached.finish();
        if (created.current && misses?.get(missKey) === created.current) misses.delete(missKey);
      }
    })();
    miss = { promise, waiters: 0, stop: detached.stop };
    created.current = miss;
    misses.set(missKey, miss);
  }
  miss.waiters += 1;
  try {
    return await callerRun.wait(() => miss!.promise);
  } finally {
    miss.waiters -= 1;
    if (miss.waiters === 0 && misses.get(missKey) === miss) miss.stop();
  }
}

async function runTranslationMiss(
  request: TranslationRequest,
  ports: TranslationServicePorts,
  requestTextSha256: string,
  key: string,
  run: TranslationRun,
): Promise<TranslationServiceResult> {
  const providerReservation = { requests: 1 as const, utf16CodeUnits: request.text.length };
  try {
    if (
      (await run.wait(() =>
        ports.providerQuota.reserve(providerReservation, { signal: run.signal }),
      )) !== true
    ) {
      ports.safeLog?.({ code: 'quota-denied', statusClass: 4 });
      return error(429, 'QUOTA_EXCEEDED', true);
    }
  } catch {
    return error(503, 'SERVICE_UNAVAILABLE', true);
  }

  const outcome = await run.wait(() =>
    Promise.resolve()
      .then(() => {
        if (!run.mayCommit()) throw new TranslationRunEnded();
        return ports.upstream.translate(request, { signal: run.signal, noFallback: true });
      })
      .then(
        (result) => ({ kind: 'result' as const, result }),
        (reason: unknown) => ({ kind: 'failure' as const, reason }),
      ),
  );
  if (outcome.kind === 'failure') {
    if (outcome.reason instanceof DefinitePreDispatchFailure) {
      try {
        await run.wait(() => ports.providerQuota.release?.(providerReservation));
      } catch {
        return error(503, 'SERVICE_UNAVAILABLE', true);
      }
    }
    ports.safeLog?.({ code: 'upstream-failed', statusClass: 5 });
    return error(503, 'SERVICE_UNAVAILABLE', true);
  }
  const upstreamResult = parseVersionedUpstreamResult(
    outcome.result,
    request,
    ports.configuration.adapter,
  );
  if (!run.mayCommit() || !upstreamResult) {
    ports.safeLog?.({ code: 'upstream-failed', statusClass: 5 });
    return error(503, 'SERVICE_UNAVAILABLE', false);
  }
  if (!validOutputText(upstreamResult.translation.text)) {
    ports.safeLog?.({ code: 'upstream-failed', statusClass: 5 });
    return error(503, 'SERVICE_UNAVAILABLE', false);
  }

  const now = ports.clock.now();
  const expiresAt = new Date(
    now.valueOf() + ports.configuration.cacheTtlSeconds * 1000,
  ).toISOString();
  const entry: TranslationCacheEntry = {
    schema: 'wrn.translation-cache-entry.v2',
    request: {
      mode: translationMode,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      textSha256: requestTextSha256,
    },
    adapter: ports.configuration.adapter,
    translation: {
      text: upstreamResult.translation.text,
      textSha256: await run.wait(() => sha256Hex(upstreamResult.translation.text)),
    },
    createdAt: now.toISOString(),
    expiresAt,
  };
  const response = await run.wait(() =>
    makeSuccess(
      request,
      ports.configuration.adapter,
      requestTextSha256,
      entry.translation.text,
      'miss',
      entry.expiresAt,
    ),
  );
  if (!response) return error(503, 'SERVICE_UNAVAILABLE', false);

  try {
    if (
      (await run.wait(() =>
        ports.writeQuota.reserve({ requests: 1, utf16CodeUnits: 0 }, { signal: run.signal }),
      )) !== true
    ) {
      ports.safeLog?.({ code: 'quota-denied', statusClass: 4 });
      return error(429, 'QUOTA_EXCEEDED', true);
    }
    await run.wait(() =>
      ports.cache.put(key, entry, ports.configuration.cacheTtlSeconds, {
        signal: run.signal,
        mayCommit: run.mayCommit,
      }),
    );
  } catch {
    return error(503, 'SERVICE_UNAVAILABLE', true);
  }
  ports.safeLog?.({ code: 'cache-miss', statusClass: 2 });
  return { status: 200, body: response };
}
