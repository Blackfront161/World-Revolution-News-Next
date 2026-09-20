import {
  hasMobileMediaJsonByteCap,
  mediaDocumentClassForPath,
  mobileMediaCaps,
  mobileMediaContractVersion,
  mobileMediaReleaseSchema,
  mobileMediaRuntimePaths,
  isMobileMediaJsonContentType,
  validateMobileMediaCandidate,
  validateMobileMediaRelease,
  type MediaDocumentClass,
  type MobileMediaCandidate,
  type MobileMediaClock,
} from '@wrn/content-contracts/mobile-media-v1';

export const mobileMediaBuildPin = Object.freeze({
  schema: mobileMediaReleaseSchema,
  contractVersion: mobileMediaContractVersion,
  path: mobileMediaRuntimePaths.release,
  revision: 1,
  transportSha256: '311c9d4ec2c3614f20e8b66735e09fc9c85bcdf667781c738f5120aeae9f9994',
});
export type MobileMediaRootPin = Readonly<typeof mobileMediaBuildPin>;
export type MobileMediaRawBundle = Readonly<{
  releaseRaw: string;
  documentsRaw: Readonly<Record<MediaDocumentClass, string>>;
}>;
export type MobileMediaLoadResult =
  | Readonly<{
      kind: 'ready';
      candidate: MobileMediaCandidate;
      releaseRaw: string;
      rawBundle: MobileMediaRawBundle;
    }>
  | Readonly<{ kind: 'invalid' | 'future' | 'no-request' | 'network-error' }>;
export type MobileMediaLoadOptions = Readonly<{
  clock?: MobileMediaClock;
  timeoutMs?: number;
}>;

const sha = async (bytes: Uint8Array) => {
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join(
    '',
  );
};
const exactPin = (value: unknown) =>
  typeof value === 'object' &&
  value !== null &&
  Object.keys(value).length === 5 &&
  Object.keys(value).every((key, index) => key === Object.keys(mobileMediaBuildPin)[index]) &&
  JSON.stringify(value) === JSON.stringify(mobileMediaBuildPin);
const recordField = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)[key]
    : undefined;

type BodyReadResult =
  Readonly<{ kind: 'ready'; bytes: Uint8Array }> | Readonly<{ kind: 'invalid' | 'network-error' }>;

async function read(response: Response, signal: AbortSignal): Promise<BodyReadResult> {
  if (!response.ok || response.status === 206 || !response.body) return { kind: 'invalid' };
  const length = response.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > mobileMediaCaps.json))
    return { kind: 'invalid' };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let lengthRead = 0;
  try {
    for (;;) {
      if (signal.aborted) return { kind: 'network-error' };
      const part = await reader.read();
      if (part.done) break;
      lengthRead += part.value.byteLength;
      if (lengthRead > mobileMediaCaps.json) return { kind: 'invalid' };
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(lengthRead);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { kind: 'ready', bytes };
  } catch {
    return { kind: 'network-error' };
  } finally {
    reader.releaseLock();
  }
}
function decode(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) return null;
  try {
    const raw = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    return hasMobileMediaJsonByteCap(raw) ? raw : null;
  } catch {
    return null;
  }
}
async function requestJson(
  path: string,
  outerSignal: AbortSignal,
  request: typeof fetch,
  timeoutMs: number,
): Promise<
  { kind: 'ready'; bytes: Uint8Array; raw: string } | { kind: 'invalid' | 'network-error' }
> {
  if (outerSignal.aborted) return { kind: 'network-error' };
  const controller = new AbortController();
  const abort = () => controller.abort();
  outerSignal.addEventListener('abort', abort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let externalAbort: (() => void) | undefined;
  try {
    const aborted = new Promise<{ kind: 'network-error' }>((resolve) => {
      externalAbort = () => resolve({ kind: 'network-error' });
      outerSignal.addEventListener('abort', externalAbort, { once: true });
    });
    const timeout = new Promise<{ kind: 'network-error' }>((resolve) => {
      timer = setTimeout(() => {
        controller.abort();
        resolve({ kind: 'network-error' });
      }, timeoutMs);
    });
    const transport = (async () => {
      try {
        const response = await request(path, {
          signal: controller.signal,
          credentials: 'omit',
          redirect: 'error',
          referrerPolicy: 'no-referrer',
          cache: 'no-store',
        });
        if (
          response.status !== 200 ||
          response.headers.has('content-range') ||
          !isMobileMediaJsonContentType(response.headers.get('content-type'))
        )
          return { kind: 'invalid' } as const;
        const body = await read(response, controller.signal);
        if (body.kind !== 'ready') return { kind: body.kind } as const;
        if (controller.signal.aborted) return { kind: 'network-error' } as const;
        const raw = decode(body.bytes);
        return raw === null
          ? ({ kind: 'invalid' } as const)
          : { kind: 'ready' as const, bytes: body.bytes, raw };
      } catch {
        return { kind: 'network-error' } as const;
      }
    })();
    return await Promise.race([transport, timeout, aborted]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    outerSignal.removeEventListener('abort', abort);
    if (externalAbort !== undefined) outerSignal.removeEventListener('abort', externalAbort);
  }
}

export async function loadMobileMediaRelease(
  signal: AbortSignal,
  pin: unknown = mobileMediaBuildPin,
  request: typeof fetch = fetch,
  options: MobileMediaLoadOptions = {},
): Promise<MobileMediaLoadResult> {
  const clock = options.clock ?? Date.now;
  const timeoutMs = options.timeoutMs ?? 5000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 0)
    return Object.freeze({ kind: 'network-error' });
  if (!exactPin(pin)) return Object.freeze({ kind: 'no-request' });
  const releaseTransport = await requestJson(mobileMediaBuildPin.path, signal, request, timeoutMs);
  if (releaseTransport.kind !== 'ready') return Object.freeze({ kind: releaseTransport.kind });
  if ((await sha(releaseTransport.bytes)) !== mobileMediaBuildPin.transportSha256)
    return Object.freeze({ kind: 'invalid' });
  let release: unknown;
  try {
    release = JSON.parse(releaseTransport.raw);
  } catch {
    return Object.freeze({ kind: 'invalid' });
  }
  if (
    typeof release === 'object' &&
    release !== null &&
    'contractVersion' in release &&
    recordField(release, 'contractVersion') !== mobileMediaContractVersion
  )
    return Object.freeze({ kind: 'future' });
  if (!validateMobileMediaRelease(release) || release.revision !== mobileMediaBuildPin.revision)
    return Object.freeze({ kind: 'invalid' });
  const documents = {} as Record<MediaDocumentClass, unknown>;
  const documentsRaw = {} as Record<MediaDocumentClass, string>;
  let total = 0;
  for (const descriptor of release.documents) {
    const kind = mediaDocumentClassForPath(descriptor.path);
    if (kind === null) return Object.freeze({ kind: 'invalid' });
    const fetched = await requestJson(descriptor.path, signal, request, timeoutMs);
    if (
      fetched.kind !== 'ready' ||
      fetched.bytes.length !== descriptor.bytes ||
      (await sha(fetched.bytes)) !== descriptor.sha256
    )
      return Object.freeze({
        kind: fetched.kind === 'network-error' ? 'network-error' : 'invalid',
      });
    total += fetched.bytes.length;
    if (total > mobileMediaCaps.totalJson) return Object.freeze({ kind: 'invalid' });
    try {
      documents[kind] = JSON.parse(fetched.raw);
      documentsRaw[kind] = fetched.raw;
    } catch {
      return Object.freeze({ kind: 'invalid' });
    }
  }
  const candidate = validateMobileMediaCandidate(release, documents, documentsRaw, clock);
  if (candidate === null) return Object.freeze({ kind: 'invalid' });
  const rawBundle = Object.freeze({
    releaseRaw: releaseTransport.raw,
    documentsRaw: Object.freeze({ ...documentsRaw }),
  });
  return Object.freeze({ kind: 'ready', candidate, releaseRaw: releaseTransport.raw, rawBundle });
}
