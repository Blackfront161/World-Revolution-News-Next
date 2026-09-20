export const contentReleaseRequestTimeoutMs = 5_000;

export class ContentReleaseTransportError extends Error {
  constructor(
    readonly code: 'aborted' | 'timeout' | 'response' | 'mime' | 'bytes' | 'json' | 'origin',
  ) {
    super(`Content release transport: ${code}`);
  }
}

/** Always observes the original promise, even when it ignores cancellation. */
export async function waitForAbortable<T>(
  promise: Promise<T>,
  signal: AbortSignal,
  error: () => Error = () => new ContentReleaseTransportError('aborted'),
): Promise<T> {
  let abort!: () => void;
  const cancelled = new Promise<never>((_, reject) => {
    abort = () => reject(error());
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
  try {
    const value = await Promise.race([promise, cancelled]);
    if (signal.aborted) throw error();
    return value;
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

function cancelBody(response: Response): void {
  try {
    void response.body?.cancel().catch(() => undefined);
  } catch {
    /* locked/closed */
  }
}

/** Shared bounded bytes only. Concrete contracts own document identity and trust. */
function assertRelativeResourcePath(path: string): void {
  if (
    !/^\/(?!\/)[a-zA-Z0-9._/-]+$/.test(path) ||
    path.split('/').some((segment) => segment === '.' || segment === '..')
  )
    throw new ContentReleaseTransportError('origin');
}

export async function fetchBoundedSameOriginJson(
  path: string,
  signal: AbortSignal,
  maximumBytes: number,
): Promise<unknown> {
  assertRelativeResourcePath(path);
  return fetchBoundedJsonResource(path, signal, maximumBytes);
}

/** The caller supplies a compiled trust origin, never a content/configuration URL. */
export function createBoundedTrustedOriginJsonTransportV1(trustedOrigin: string) {
  let origin: URL;
  try {
    origin = new URL(trustedOrigin);
  } catch {
    throw new ContentReleaseTransportError('origin');
  }
  if (
    origin.protocol !== 'https:' ||
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    trustedOrigin !== origin.origin
  )
    throw new ContentReleaseTransportError('origin');
  const fixedOrigin = origin.origin;
  return async (path: string, signal: AbortSignal, maximumBytes: number): Promise<unknown> => {
    assertRelativeResourcePath(path);
    if (!path.startsWith('/wrn-production-content/'))
      throw new ContentReleaseTransportError('origin');
    const url = new URL(path, fixedOrigin);
    if (url.origin !== fixedOrigin || url.pathname !== path)
      throw new ContentReleaseTransportError('origin');
    return fetchBoundedJsonResource(url.href, signal, maximumBytes);
  };
}

async function fetchBoundedJsonResource(
  resource: string,
  signal: AbortSignal,
  maximumBytes: number,
): Promise<unknown> {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1)
    throw new ContentReleaseTransportError('bytes');
  if (signal.aborted) throw new ContentReleaseTransportError('aborted');
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  const timeoutError = () =>
    new ContentReleaseTransportError(signal.aborted ? 'aborted' : 'timeout');
  const timer = globalThis.setTimeout(onAbort, contentReleaseRequestTimeoutMs);
  signal.addEventListener('abort', onAbort, { once: true });
  let response: Response | null = null;
  try {
    response = await waitForAbortable<Response>(
      fetch(resource, {
        signal: controller.signal,
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        credentials: 'omit',
        redirect: 'error',
      }).then((value) => {
        if (controller.signal.aborted) {
          cancelBody(value);
          throw timeoutError();
        }
        return value;
      }),
      controller.signal,
      timeoutError,
    );
    if (response.status !== 200 || response.redirected)
      throw new ContentReleaseTransportError('response');
    if (
      response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !==
      'application/json'
    )
      throw new ContentReleaseTransportError('mime');
    const rawLength = response.headers.get('content-length');
    const declaredLength = rawLength === null ? null : Number(rawLength);
    if (
      rawLength !== null &&
      (!/^\d+$/.test(rawLength) ||
        !Number.isSafeInteger(declaredLength) ||
        declaredLength! > maximumBytes)
    )
      throw new ContentReleaseTransportError('bytes');
    if (response.body == null) throw new ContentReleaseTransportError('response');
    const reader = response.body.getReader();
    let cancelled = false;
    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      try {
        void reader.cancel().catch(() => undefined);
      } catch {
        /* best effort */
      }
    };
    controller.signal.addEventListener('abort', cancel, { once: true });
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const next = await waitForAbortable(reader.read(), controller.signal, timeoutError);
        if (next.done) break;
        length += next.value.byteLength;
        if (length > maximumBytes) throw new ContentReleaseTransportError('bytes');
        chunks.push(next.value);
      }
    } catch (error) {
      cancel();
      throw error;
    } finally {
      controller.signal.removeEventListener('abort', cancel);
      try {
        reader.releaseLock();
      } catch {
        /* Noncooperative reader may still own a read. */
      }
    }
    // Fetch exposes decoded bytes, while Content-Length describes encoded transfer bytes.
    const encoding = response.headers.get('content-encoding')?.trim().toLowerCase();
    if (
      (!encoding || encoding === 'identity') &&
      declaredLength !== null &&
      length !== declaredLength
    )
      throw new ContentReleaseTransportError('bytes');
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    if (controller.signal.aborted) throw timeoutError();
    try {
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
    } catch {
      throw new ContentReleaseTransportError('json');
    }
  } catch (error) {
    if (response !== null) cancelBody(response);
    if (error instanceof ContentReleaseTransportError) throw error;
    if (controller.signal.aborted) throw timeoutError();
    throw new ContentReleaseTransportError('response');
  } finally {
    globalThis.clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
}
