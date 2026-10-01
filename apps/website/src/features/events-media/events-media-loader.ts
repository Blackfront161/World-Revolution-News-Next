import { readLocalJsonAsset } from '../../../../../packages/browser-content/src/local-json-asset';
import { unpackWebsiteCatalog } from './app-catalog';
import assetUrl from './packed/production-events-media-v1.json?url';

let verified: Awaited<ReturnType<typeof unpackWebsiteCatalog>> | null = null;
export async function loadWebsiteAppCatalog(signal: AbortSignal) {
  signal.throwIfAborted();
  if (verified) return verified;
  const request = new AbortController();
  const abort = () => request.abort(signal.reason);
  signal.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(
    () => request.abort(new DOMException('metadata timeout', 'TimeoutError')),
    10000,
  );
  try {
    const result = await unpackWebsiteCatalog(
      await readLocalJsonAsset(assetUrl, request.signal, 4194304),
      request.signal,
    );
    request.signal.throwIfAborted();
    verified = result;
    return result;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}
export async function loadWebsiteProductionEventsMedia(signal: AbortSignal) {
  return (await loadWebsiteAppCatalog(signal)).history;
}
