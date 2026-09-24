import {
  isContentDirectoryRefreshBoundToDocument,
  isContentDirectoryRefreshManifestV1,
  type ContentDirectoryRefreshManifestV1,
} from '@wrn/content-contracts/content-directory-refresh-v1';
import {
  mobileContentDirectoryMaxBytes,
  projectMobileContentDirectory,
  validateMobileContentDirectory,
  validateMobileContentDirectoryIds,
  type MobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';

export const contentDirectoryManifestUrl =
  'https://solinaridao.com/wrn-content-directory/current.json';
export const contentDirectorySequenceStorageKey = 'wrn.content-directory.sequence.v1';
const manifestMaxBytes = 4_096;
const maximumFutureSkewMs = 5 * 60 * 1000;
const maximumAgeMs = 14 * 24 * 60 * 60 * 1000;
const refreshDeadlineMs = 8_000;

export type ContentDirectoryRefreshResult = Readonly<{
  document: MobileContentDirectory;
  projection: MobileContentDirectory;
  source: 'remote' | 'bundled';
  sequence: number | null;
}>;

async function boundedJsonBytes(
  response: Response,
  maximum: number,
  signal: AbortSignal,
): Promise<Uint8Array> {
  const reject = async (error: Error): Promise<never> => {
    await response.body?.cancel().catch(() => undefined);
    throw error;
  };
  if (
    signal.aborted ||
    !response.ok ||
    response.redirected ||
    response.body === null ||
    !/^application\/json(?:\s*;|$)/iu.test(response.headers.get('content-type') ?? '')
  )
    return reject(new TypeError('directory-refresh-response'));
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/u.test(declared) || Number(declared) > maximum))
    return reject(new RangeError('directory-refresh-size'));
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (signal.aborted) throw new DOMException('aborted', 'AbortError');
      if (part.done) break;
      length += part.value.byteLength;
      if (length > maximum) throw new RangeError('directory-refresh-size');
      chunks.push(part.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function validateDocument(value: unknown): Promise<MobileContentDirectory | null> {
  return validateMobileContentDirectory(value) && (await validateMobileContentDirectoryIds(value))
    ? value
    : null;
}

function readFloor(storage: Pick<Storage, 'getItem'> | undefined) {
  if (!storage) return null;
  try {
    const parsed: unknown = JSON.parse(
      storage.getItem(contentDirectorySequenceStorageKey) ?? 'null',
    );
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      Object.keys(parsed).sort().join(',') === 'sequence,sha256' &&
      Number.isSafeInteger((parsed as { sequence?: unknown }).sequence) &&
      ((parsed as { sequence: number }).sequence as number) >= 1 &&
      typeof (parsed as { sha256?: unknown }).sha256 === 'string' &&
      /^[a-f0-9]{64}$/u.test((parsed as { sha256: string }).sha256)
    )
      return parsed as { sequence: number; sha256: string };
  } catch {
    // A blocked or corrupt store cannot make untrusted remote data authoritative.
  }
  return null;
}

function currentManifest(
  value: unknown,
  floor: { sequence: number; sha256: string } | null,
  now: number,
): value is ContentDirectoryRefreshManifestV1 {
  if (!isContentDirectoryRefreshManifestV1(value)) return false;
  const observed = Date.parse(value.observedAt);
  if (observed > now + maximumFutureSkewMs || observed < now - maximumAgeMs) return false;
  return (
    floor === null ||
    value.sequence > floor.sequence ||
    (value.sequence === floor.sequence && value.artifactSha256 === floor.sha256)
  );
}

export async function loadContentDirectoryWithRefresh({
  bundled,
  endpoint,
  signal,
  fetchImpl = fetch,
  storage,
  online = typeof navigator === 'undefined' || navigator.onLine,
  now = Date.now(),
}: Readonly<{
  bundled: unknown;
  endpoint: unknown;
  signal: AbortSignal;
  fetchImpl?: typeof fetch;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  online?: boolean;
  now?: number;
}>): Promise<ContentDirectoryRefreshResult> {
  const local = await validateDocument(bundled);
  if (local === null) throw new TypeError('directory-invalid');
  const fallback = (): ContentDirectoryRefreshResult =>
    Object.freeze({
      document: local,
      projection: projectMobileContentDirectory(local),
      source: 'bundled',
      sequence: null,
    });
  if (!online || signal.aborted || endpoint !== contentDirectoryManifestUrl) return fallback();
  const floor = readFloor(storage);
  const requestController = new AbortController();
  const abortRequest = () => requestController.abort();
  signal.addEventListener('abort', abortRequest, { once: true });
  const deadline = setTimeout(abortRequest, refreshDeadlineMs);
  try {
    const manifestResponse = await fetchImpl(contentDirectoryManifestUrl, {
      signal: requestController.signal,
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
      headers: { accept: 'application/json' },
      referrerPolicy: 'no-referrer',
    });
    const manifestBytes = await boundedJsonBytes(
      manifestResponse,
      manifestMaxBytes,
      requestController.signal,
    );
    const manifest: unknown = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes),
    );
    if (!currentManifest(manifest, floor, now)) return fallback();
    const artifactUrl = new URL(
      `/wrn-content-directory/${manifest.artifactPath}`,
      contentDirectoryManifestUrl,
    );
    if (artifactUrl.origin !== new URL(contentDirectoryManifestUrl).origin) return fallback();
    const artifactResponse = await fetchImpl(artifactUrl, {
      signal: requestController.signal,
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
      headers: { accept: 'application/json' },
      referrerPolicy: 'no-referrer',
    });
    const artifactBytes = await boundedJsonBytes(
      artifactResponse,
      mobileContentDirectoryMaxBytes,
      requestController.signal,
    );
    if ((await sha256(artifactBytes)) !== manifest.artifactSha256) return fallback();
    const document = await validateDocument(
      JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(artifactBytes)),
    );
    if (document === null || !isContentDirectoryRefreshBoundToDocument(manifest, document))
      return fallback();
    try {
      storage?.setItem(
        contentDirectorySequenceStorageKey,
        JSON.stringify({ sequence: manifest.sequence, sha256: manifest.artifactSha256 }),
      );
    } catch {
      // The validated document remains usable for this session without claiming rollback memory.
    }
    return Object.freeze({
      document,
      projection: projectMobileContentDirectory(document),
      source: 'remote',
      sequence: manifest.sequence,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    return fallback();
  } finally {
    clearTimeout(deadline);
    signal.removeEventListener('abort', abortRequest);
    requestController.abort();
  }
}
