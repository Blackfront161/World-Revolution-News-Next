import {
  isWebsiteTuplePointer,
  validateWebsiteContentTuple,
  websiteTupleHash,
  websiteTupleMaxBytes,
  websiteTuplePointerMaxBytes,
  type WebsiteContentTupleV1,
  type WebsiteContentTuplePointerV1,
} from '../../content-contracts/src/directory/website-content-tuple-v1';
import {
  readWebsiteTupleStore,
  saveWebsiteTupleStore,
  saveWebsiteTupleRestrictions,
  rollbackWebsiteTupleStore,
  type StoredWebsiteTuple,
  type WebsiteTupleActivation,
} from './website-content-tuple-store';
export const websiteTupleEndpoint = '/wrn-website-content/current.json';
type Result = Readonly<{ tuple: WebsiteContentTupleV1; source: 'remote' | 'saved' }>;
const articleWithdrawals = new Set<string>(),
  endpointWithdrawals = new Set<string>();
function rememberSafety(tuple: WebsiteContentTupleV1) {
  for (const id of tuple.directory.withdrawals.articleIds) articleWithdrawals.add(id);
  for (const id of tuple.directory.withdrawals.endpointIds) endpointWithdrawals.add(id);
  for (const value of tuple.report.articles as Record<string, unknown>[]) {
    if (
      ['source-revoked', 'article-revoked', 'metadata-prohibited', 'directory-only'].includes(
        String(value.reason),
      ) &&
      typeof value.id === 'string' &&
      /^news-[a-f0-9]{64}$/.test(value.id)
    )
      articleWithdrawals.add(value.id);
  }
  for (const value of tuple.report.sources as Record<string, unknown>[]) {
    if (
      value.reason === 'source-revoked' &&
      typeof value.id === 'string' &&
      /^source-[a-f0-9]{64}$/.test(value.id)
    )
      endpointWithdrawals.add(value.id);
  }
}
// Restrictions survive an activation failure and can never admit new content.
export function observedWebsiteTupleWithdrawals() {
  return { articleIds: [...articleWithdrawals], endpointIds: [...endpointWithdrawals] };
}
async function bounded(response: Response, max: number, signal: AbortSignal) {
  if (
    !response.ok ||
    response.status !== 200 ||
    response.redirected ||
    response.type === 'opaque' ||
    !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '') ||
    !response.body
  )
    throw Error('wt:HTTP');
  // Fetch exposes decoded bytes; a compressed Content-Length describes wire
  // bytes. Decoded stream bounds plus the exact pointer length/hash remain authoritative.
  const encoding = response.headers.get('content-encoding'),
    declared = encoding && encoding !== 'identity' ? null : response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > max))
    throw Error('wt:size');
  const reader = response.body.getReader(),
    parts: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > max) throw Error('wt:size');
      parts.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  if (declared !== null && length !== Number(declared)) throw Error('wt:trunc');
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return bytes;
}
const parse = (bytes: Uint8Array) =>
  JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
export async function verifyStoredWebsiteTuple(
  entry: StoredWebsiteTuple,
  allowedImageOrigins: readonly string[],
) {
  if (
    !isWebsiteTuplePointer(entry.pointer) ||
    entry.bytes.byteLength !== entry.pointer.artifactBytes ||
    (await websiteTupleHash(entry.bytes)) !== entry.pointer.artifactSha256
  )
    return null;
  const tuple = parse(entry.bytes);
  if (!(await validateWebsiteContentTuple(tuple, { allowedImageOrigins }))) return null;
  const value = tuple as WebsiteContentTupleV1;
  return value.sequence === entry.pointer.sequence &&
    value.observedAt === entry.pointer.observedAt &&
    JSON.stringify(value.source) === JSON.stringify(entry.pointer.source)
    ? value
    : null;
}
/** A failed update leaves the last complete, independently revalidated tuple. */
export async function loadWebsiteContentTuple({
  minimumSequence,
  allowedImageOrigins,
  endpoint = websiteTupleEndpoint,
  fetchImpl = fetch,
  online = navigator.onLine,
  now = Date.now(),
}: Readonly<{
  minimumSequence: number;
  allowedImageOrigins: readonly string[];
  endpoint?: string;
  fetchImpl?: typeof fetch;
  online?: boolean;
  now?: number;
}>): Promise<Result | null> {
  let saved: Result | null = null,
    floor = minimumSequence,
    knownHash: string | null = null;
  try {
    const state = await readWebsiteTupleStore();
    for (const id of state?.restrictions.articleIds ?? []) articleWithdrawals.add(id);
    for (const id of state?.restrictions.endpointIds ?? []) endpointWithdrawals.add(id);
    for (const entry of [state?.active, state?.previous]) {
      if (!entry) continue;
      const tuple = await verifyStoredWebsiteTuple(entry, allowedImageOrigins);
      if (tuple) {
        rememberSafety(tuple);
        if (!saved && tuple.sequence >= floor) {
          saved = { tuple, source: 'saved' };
          floor = tuple.sequence;
          knownHash = entry.pointer.artifactSha256;
        }
      }
    }
  } catch {
    /* Unknown storage never creates a verified candidate. */
  }
  if (!online) return saved;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const origin = location.origin,
      url = new URL(endpoint, origin);
    if (url.origin !== origin || url.pathname !== websiteTupleEndpoint || url.search || url.hash)
      throw Error('wt:url');
    const work = async () => {
      const init = {
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        redirect: 'error',
        signal: controller.signal,
        headers: { accept: 'application/json' },
      } as const;
      const pointer = parse(
        await bounded(await fetchImpl(url, init), websiteTuplePointerMaxBytes, controller.signal),
      );
      if (
        !isWebsiteTuplePointer(pointer) ||
        pointer.sequence < floor ||
        (pointer.sequence === floor &&
          knownHash !== null &&
          pointer.artifactSha256 !== knownHash) ||
        Date.parse(pointer.observedAt) > now + 300000 ||
        now - Date.parse(pointer.observedAt) > 86400000
      )
        throw Error('wt:ptr');
      const artifact = new URL(pointer.artifactPath, url);
      if (
        artifact.origin !== origin ||
        !artifact.pathname.startsWith('/wrn-website-content/snapshots/')
      )
        throw Error('wt:path');
      const bytes = await bounded(
          await fetchImpl(artifact, init),
          Math.min(websiteTupleMaxBytes, pointer.artifactBytes),
          controller.signal,
        ),
        entry = { pointer, bytes };
      const tuple = await verifyStoredWebsiteTuple(entry, allowedImageOrigins);
      controller.signal.throwIfAborted();
      if (!tuple) throw Error('wt:hash');
      rememberSafety(tuple);
      await saveWebsiteTupleRestrictions(observedWebsiteTupleWithdrawals(), controller.signal);
      controller.signal.throwIfAborted();
      // Any exception after activation, including deadline/readback errors, restores
      // only this exact activation. A concurrent newer release is never overwritten.
      let activation: WebsiteTupleActivation | null = null;
      try {
        activation = await saveWebsiteTupleStore(entry, controller.signal);
        controller.signal.throwIfAborted();
        const stored = await readWebsiteTupleStore(controller.signal),
          readback =
            stored?.active && (await verifyStoredWebsiteTuple(stored.active, allowedImageOrigins));
        controller.signal.throwIfAborted();
        if (!readback || stored?.active?.pointer.artifactSha256 !== pointer.artifactSha256)
          throw Error('wt:read');
        return { tuple: readback, source: 'remote' } as const;
      } catch (error) {
        if (activation) await rollbackWebsiteTupleStore(activation).catch(() => undefined);
        throw error;
      }
    };
    return await Promise.race([
      work(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(Error('wt:time'));
        }, 10000);
      }),
    ]);
  } catch {
    return saved;
  } finally {
    if (timer) clearTimeout(timer);
    controller.abort();
  }
}
