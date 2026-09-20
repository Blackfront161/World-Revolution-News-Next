import {
  createMobileSupportReviewProjector,
  mobileSupportMaxDecodedJsonBytes,
  validateMobileSupport,
  type MobileSupportV1,
} from '@wrn/content-contracts/mobile-support-v1';
import assetUrl from './data/legacy-support-v1.json?url';
import { readLocalJsonAsset } from '../../local-json-asset';

let verified: MobileSupportV1 | null = null;

async function readJson(signal: AbortSignal): Promise<unknown> {
  return readLocalJsonAsset(assetUrl, signal, mobileSupportMaxDecodedJsonBytes);
}

export async function loadWebsiteSupport(signal: AbortSignal): Promise<MobileSupportV1> {
  if (verified !== null) return verified;
  const candidate = await readJson(signal);
  if (signal.aborted) throw new DOMException('aborted', 'AbortError');
  const result = validateMobileSupport(candidate);
  if (!result.ok || result.value === null) throw new TypeError('support-asset-invalid');
  verified = result.value;
  return verified;
}

export const createWebsiteSupportProjector = createMobileSupportReviewProjector;
export function resetWebsiteSupportCacheForTest() {
  verified = null;
}
