import { waitForAbortable } from './content-release-transport-core';

type Code = 'aborted' | 'timeout' | 'origin' | 'response' | 'mime' | 'bytes' | 'utf8' | 'closed';
export class ProductionMediaTransportError extends Error {
  constructor(readonly code: Code) {
    super(`Production media transport: ${code}`);
  }
}
export type ProductionMediaRawJson = Readonly<{ rawText: string; byteLength: number }>;
export type ProductionMediaTransportSession = Readonly<{
  signal: AbortSignal;
  read(path: string, maximumBytes: number): Promise<ProductionMediaRawJson>;
  wait<T>(work: () => Promise<T>): Promise<T>;
  check(): void;
  close(): void;
}>;
const totalMs = 12_000,
  headerMs = 3_000,
  totalBytes = 311_296;
const cancelBody = (response: Response) => {
  try {
    void response.body?.cancel().catch(() => undefined);
  } catch {
    /* May already be locked/closed. */
  }
};
function routeCap(path: string) {
  if (path === '/content/media/v1/current.json') return 16_384;
  const match =
    /^\/content\/media\/v1\/releases\/[a-z0-9][a-z0-9-]{0,127}\/(descriptor|manifest|admission|rights|consent|revocation)\.json$/.exec(
      path,
    );
  return match ? (match[1] === 'descriptor' ? 32_768 : 131_072) : null;
}

/** Caller supplies a compiled metadata origin; content never chooses the host. */
export function createProductionMediaRawTransport(
  trustedOrigin: string,
  ports: Readonly<{ fetch?: typeof fetch; now?: () => number }> = {},
) {
  let origin: URL;
  try {
    origin = new URL(trustedOrigin);
  } catch {
    throw new ProductionMediaTransportError('origin');
  }
  if (origin.protocol !== 'https:' || trustedOrigin !== origin.origin)
    throw new ProductionMediaTransportError('origin');
  const fixedOrigin = origin.origin;
  const request = ports.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const clock = ports.now ?? Date.now;
  const readTime = (failure: () => ProductionMediaTransportError): number => {
    let value: number;
    try {
      value = clock();
    } catch {
      throw failure();
    }
    if (!Number.isFinite(value)) throw failure();
    return value;
  };
  return Object.freeze({
    begin(caller: AbortSignal): ProductionMediaTransportSession {
      const controller = new AbortController();
      const startedAt = readTime(() => new ProductionMediaTransportError('timeout')),
        deadline = startedAt + totalMs;
      const paths = new Set<string>();
      let received = 0;
      let terminal: ProductionMediaTransportError | null = null;
      const timer = setTimeout(() => fail('timeout'), totalMs);
      const onAbort = () => fail('aborted');
      function fail(code: Code) {
        if (terminal === null) {
          terminal = new ProductionMediaTransportError(code);
          clearTimeout(timer);
          caller.removeEventListener('abort', onAbort);
          controller.abort();
        }
        return terminal;
      }
      function check() {
        if (terminal) throw terminal;
        if (caller.aborted) throw fail('aborted');
        const current = time();
        if (terminal) throw terminal;
        if (caller.aborted) throw fail('aborted');
        if (current >= deadline) throw fail('timeout');
      }
      const time = () => readTime(() => fail('timeout'));
      caller.addEventListener('abort', onAbort, { once: true });
      if (caller.aborted) fail('aborted');
      const abortError = () => terminal ?? fail('aborted');
      return Object.freeze({
        signal: controller.signal,
        check,
        close() {
          fail('closed');
        },
        async wait<T>(work: () => Promise<T>): Promise<T> {
          check();
          try {
            const result = await waitForAbortable(
              Promise.resolve().then(() => {
                check();
                return work();
              }),
              controller.signal,
              abortError,
            );
            check();
            return result;
          } catch (error) {
            throw (
              terminal ??
              fail(error instanceof ProductionMediaTransportError ? error.code : 'response')
            );
          }
        },
        async read(path, maximumBytes) {
          check();
          const cap = routeCap(path);
          if (cap === null) throw fail('origin');
          if (
            !Number.isSafeInteger(maximumBytes) ||
            maximumBytes < 1 ||
            maximumBytes > cap ||
            paths.size >= 7 ||
            paths.has(path)
          )
            throw fail('bytes');
          paths.add(path);
          const resource = fixedOrigin + path;
          const headersDeadline = time() + headerMs;
          const requestController = new AbortController();
          const abort = () => requestController.abort();
          controller.signal.addEventListener('abort', abort, { once: true });
          if (controller.signal.aborted) abort();
          const headerTimer = setTimeout(() => fail('timeout'), headerMs);
          let response: Response | null = null;
          let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
          let readerCancelled = false;
          const cancelReader = () => {
            if (!reader || readerCancelled) return;
            readerCancelled = true;
            try {
              void reader.cancel().catch(() => undefined);
            } catch {
              /* Noncooperative cancellation cannot delay failure. */
            }
          };
          try {
            check();
            response = await waitForAbortable<Response>(
              request(resource, {
                signal: requestController.signal,
                cache: 'no-store',
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
                redirect: 'error',
                headers: { Accept: 'application/json' },
              }).then((value) => {
                if (requestController.signal.aborted) {
                  cancelBody(value);
                  throw abortError();
                }
                return value;
              }),
              requestController.signal,
              abortError,
            );
            check();
            if (time() >= headersDeadline) throw fail('timeout');
            clearTimeout(headerTimer);
            if (response.status !== 200 || response.redirected) throw fail('response');
            if (
              response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !==
              'application/json'
            )
              throw fail('mime');
            const rawLength = response.headers.get('content-length');
            const declared = rawLength === null ? null : Number(rawLength);
            if (
              rawLength !== null &&
              (!/^\d+$/.test(rawLength) ||
                !Number.isSafeInteger(declared) ||
                declared! > maximumBytes ||
                declared! > totalBytes - received)
            )
              throw fail('bytes');
            if (!response.body) throw fail('response');
            reader = response.body.getReader();
            requestController.signal.addEventListener('abort', cancelReader, { once: true });
            const chunks: Uint8Array[] = [];
            let size = 0;
            for (;;) {
              check();
              const next = await waitForAbortable(
                reader.read(),
                requestController.signal,
                abortError,
              );
              check();
              if (next.done) break;
              size += next.value.byteLength;
              received += next.value.byteLength;
              if (size > maximumBytes || received > totalBytes) throw fail('bytes');
              chunks.push(new Uint8Array(next.value));
            }
            const encoding = response.headers.get('content-encoding')?.trim().toLowerCase();
            if (
              size === 0 ||
              ((!encoding || encoding === 'identity') && declared !== null && size !== declared)
            )
              throw fail('bytes');
            const bytes = new Uint8Array(size);
            let offset = 0;
            for (const chunk of chunks) {
              bytes.set(chunk, offset);
              offset += chunk.byteLength;
            }
            if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) throw fail('utf8');
            let rawText: string;
            try {
              rawText = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            } catch {
              throw fail('utf8');
            }
            check();
            return Object.freeze({ rawText, byteLength: size });
          } catch (error) {
            const reason =
              terminal ??
              fail(error instanceof ProductionMediaTransportError ? error.code : 'response');
            cancelReader();
            if (response) cancelBody(response);
            throw reason;
          } finally {
            clearTimeout(headerTimer);
            controller.signal.removeEventListener('abort', abort);
            requestController.signal.removeEventListener('abort', cancelReader);
            try {
              reader?.releaseLock();
            } catch {
              /* A late noncooperative read can still own the lock. */
            }
          }
        },
      });
    },
  });
}
