import {
  translationRequestByteLimit,
  translationContractVersion,
} from '@wrn/api-contracts/translation-v1';
import {
  handleTranslation,
  systemTranslationClock,
  type TranslationServicePorts,
  type TranslationServiceResult,
} from './handler.js';

const translationRoute = '/v1/translations';

export interface TranslationWorkerConfiguration {
  readonly allowedOrigins: readonly string[];
  readonly service: TranslationServicePorts;
}

function disabledError(): TranslationServiceResult {
  return {
    status: 503,
    body: {
      contractVersion: translationContractVersion,
      code: 'SERVICE_UNAVAILABLE',
      message: 'The translation service is unavailable.',
      correlationId: crypto.randomUUID(),
      retryable: true,
    },
  };
}

function responseHeaders(origin?: string): Headers {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  if (origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
  }
  return headers;
}

function jsonResponse(result: TranslationServiceResult, origin?: string): Response {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: responseHeaders(origin),
  });
}

function isAllowedOrigin(
  origin: string | null,
  allowedOrigins: readonly string[],
): origin is string {
  return origin !== null && allowedOrigins.includes(origin);
}

async function readBoundedBody(
  request: Request,
): Promise<
  | { readonly text: string }
  | { readonly tooLarge: true }
  | { readonly ended: 'abort' | 'timeout' }
  | undefined
> {
  if (request.signal.aborted) return { ended: 'abort' };
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let ended: 'abort' | 'timeout' | undefined;
  let rejectStop!: (reason: Error) => void;
  const stopped = new Promise<never>((_resolve, reject) => {
    rejectStop = reject;
  });
  void stopped.catch(() => {});
  const cancel = () => {
    try {
      void reader.cancel().catch(() => {});
    } catch {
      /* Cleanup must never block the safe response. */
    }
  };
  const stop = (reason: 'abort' | 'timeout') => {
    if (ended) return;
    ended = reason;
    rejectStop(new Error('Body read ended.'));
    cancel();
  };
  const onAbort = () => stop('abort');
  request.signal.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => stop('timeout'), 12_000);
  try {
    if (request.signal.aborted) stop('abort');
    for (;;) {
      const next = await Promise.race([reader.read(), stopped]);
      if (ended) return { ended };
      if (next.done) break;
      total += next.value.byteLength;
      if (total > translationRequestByteLimit) {
        cancel();
        return { tooLarge: true };
      }
      chunks.push(next.value);
    }
  } catch {
    cancel();
    return ended ? { ended } : undefined;
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', onAbort);
    try {
      reader.releaseLock();
    } catch {
      /* An ignored pending read is already cancelled. */
    }
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(body) };
  } catch {
    return undefined;
  }
}

function invalidRequest(origin?: string): Response {
  return jsonResponse(
    {
      status: 400,
      body: {
        contractVersion: translationContractVersion,
        code: 'INVALID_REQUEST',
        message: 'The translation request is invalid.',
        correlationId: crypto.randomUUID(),
        retryable: false,
      },
    },
    origin,
  );
}

function unsupportedMediaType(origin?: string): Response {
  return jsonResponse(
    {
      status: 415,
      body: {
        contractVersion: translationContractVersion,
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'The request content type is unsupported.',
        correlationId: crypto.randomUUID(),
        retryable: false,
      },
    },
    origin,
  );
}

function tooLarge(origin?: string): Response {
  return jsonResponse(
    {
      status: 413,
      body: {
        contractVersion: translationContractVersion,
        code: 'REQUEST_TOO_LARGE',
        message: 'The request exceeds the permitted size.',
        correlationId: crypto.randomUUID(),
        retryable: false,
      },
    },
    origin,
  );
}

/**
 * Binds the pure service only after the deployment has supplied reviewed origins, quota ports,
 * cache and a versioned upstream mapping. This function has no default provider or public fallback.
 */
export function createTranslationWorkerFetch(
  configuration: TranslationWorkerConfiguration,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (!configuration || !validOrigins(configuration.allowedOrigins))
      return jsonResponse(disabledError());
    const origin = request.headers.get('origin');
    if (!isAllowedOrigin(origin, configuration.allowedOrigins))
      return jsonResponse(disabledError());

    if (request.method === 'OPTIONS') {
      if (request.headers.get('access-control-request-method') !== 'POST')
        return invalidRequest(origin);
      const headers = responseHeaders(origin);
      headers.set('access-control-allow-methods', 'POST, OPTIONS');
      headers.set('access-control-allow-headers', 'content-type');
      headers.set('access-control-max-age', '600');
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'POST' || new URL(request.url).pathname !== translationRoute) {
      return invalidRequest(origin);
    }
    if (
      request.headers.has('x-wrn-cache-key') ||
      request.headers.has('x-client-id') ||
      request.headers.has('cookie')
    ) {
      return invalidRequest(origin);
    }
    const contentType = request.headers.get('content-type');
    if (!contentType || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(contentType)) {
      return unsupportedMediaType(origin);
    }
    const body = await readBoundedBody(request);
    if (body && 'tooLarge' in body) return tooLarge(origin);
    if (body && 'ended' in body)
      return jsonResponse(
        {
          status: body.ended === 'timeout' ? 504 : 503,
          body: {
            contractVersion: translationContractVersion,
            code: body.ended === 'timeout' ? 'UPSTREAM_TIMEOUT' : 'SERVICE_UNAVAILABLE',
            message: 'The translation request ended.',
            correlationId: crypto.randomUUID(),
            retryable: body.ended === 'timeout',
          },
        },
        origin,
      );
    if (!body) return invalidRequest(origin);

    let payload: unknown;
    try {
      payload = JSON.parse(body.text) as unknown;
    } catch {
      return invalidRequest(origin);
    }
    return jsonResponse(
      await handleTranslation(payload, configuration.service, request.signal),
      origin,
    );
  };
}

function validOrigins(value: unknown): value is readonly string[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > 32 ||
    new Set(value).size !== value.length
  )
    return false;
  return value.every((origin) => {
    if (origin === 'capacitor://localhost') return true;
    if (typeof origin !== 'string' || origin.length > 2048) return false;
    try {
      const parsed = new URL(origin);
      return ['https:', 'http:'].includes(parsed.protocol) && parsed.origin === origin;
    } catch {
      return false;
    }
  });
}

/**
 * The committed Worker remains deliberately disabled. It never discovers bindings, targets, IDs,
 * routes, origins or a provider from ambient configuration; activation must supply the factory inputs.
 */
const worker = {
  fetch: async (request: Request): Promise<Response> => {
    void request;
    return jsonResponse(disabledError());
  },
};

export { systemTranslationClock };
export default worker;
