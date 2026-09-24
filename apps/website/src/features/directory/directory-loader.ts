import { type MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import assetUrl from './data/content-directory-v1.json?url';
import { readLocalJsonAsset } from '../../local-json-asset';
import {
  contentDirectoryManifestUrl,
  loadContentDirectoryWithRefresh,
} from '../../../../../packages/browser-content/src/content-directory-refresh';

export type WebsiteContentDirectory = Readonly<{
  document: MobileContentDirectory;
  projection: MobileContentDirectory;
}>;
const maxBytes = 3 * 1024 * 1024;
let verified: WebsiteContentDirectory | null = null;
export async function loadWebsiteContentDirectory(
  signal: AbortSignal,
): Promise<WebsiteContentDirectory> {
  if (verified) return verified;
  const candidate = await readLocalJsonAsset(assetUrl, signal, maxBytes);
  let storage: Storage | undefined;
  try {
    storage = window.localStorage;
  } catch {
    storage = undefined;
  }
  verified = await loadContentDirectoryWithRefresh({
    bundled: candidate,
    endpoint: import.meta.env.PROD
      ? contentDirectoryManifestUrl
      : import.meta.env.VITE_WRN_DIRECTORY_MANIFEST_ENDPOINT,
    signal,
    ...(storage ? { storage } : {}),
  });
  return verified;
}
export function resetWebsiteContentDirectoryCacheForTest() {
  verified = null;
}
