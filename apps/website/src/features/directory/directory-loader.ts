import {
  projectMobileContentDirectory,
  validateMobileContentDirectory,
  validateMobileContentDirectoryIds,
  type MobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import assetUrl from './data/content-directory-v1.json?url';
import { readLocalJsonAsset } from '../../local-json-asset';

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
  if (
    !validateMobileContentDirectory(candidate) ||
    !(await validateMobileContentDirectoryIds(candidate))
  )
    throw new TypeError('directory-invalid');
  verified = Object.freeze({
    document: candidate,
    projection: projectMobileContentDirectory(candidate),
  });
  return verified;
}
export function resetWebsiteContentDirectoryCacheForTest() {
  verified = null;
}
