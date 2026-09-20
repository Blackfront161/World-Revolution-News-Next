import {
  productionEventsMediaMaxBytesV1,
  validateProductionEventsMediaV1,
  type ProductionEventsMediaDocumentV1,
} from '@wrn/content-contracts/production-events-media-v1';
import { readLocalJsonAsset } from './local-json-asset';

// A factory scopes the successful cache to one explicitly supplied client asset.
// Failed and aborted requests never become a successful cache entry.
export function createProductionEventsMediaLoader(assetUrl: string) {
  let verified: ProductionEventsMediaDocumentV1 | null = null;
  return async (signal: AbortSignal): Promise<ProductionEventsMediaDocumentV1> => {
    signal.throwIfAborted();
    if (verified !== null) return verified;
    const request = new AbortController();
    const abort = () => request.abort(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(
      () => request.abort(new DOMException('metadata timeout', 'TimeoutError')),
      10_000,
    );
    try {
      const candidate = await readLocalJsonAsset(
        assetUrl,
        request.signal,
        productionEventsMediaMaxBytesV1,
      );
      request.signal.throwIfAborted();
      if (!validateProductionEventsMediaV1(candidate)) throw new TypeError('events-media-invalid');
      verified = candidate;
      return candidate;
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
    }
  };
}
