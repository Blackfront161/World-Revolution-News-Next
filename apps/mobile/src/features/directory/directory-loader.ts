import {
  projectMobileContentDirectory,
  validateMobileContentDirectory,
  validateMobileContentDirectoryIds,
  type MobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';

export type LoadedMobileContentDirectory = Readonly<{
  document: MobileContentDirectory;
  projection: MobileContentDirectory;
}>;

export const mobileContentDirectoryRuntimeMaxBytes = 3 * 1024 * 1024;
let successful: LoadedMobileContentDirectory | null = null;
let pending: Promise<LoadedMobileContentDirectory> | null = null;

async function readLocalDocument(): Promise<unknown> {
  const response = await fetch(new URL('./data/content-directory-v1.json', import.meta.url), {
    credentials: 'omit',
    redirect: 'error',
  });
  if (!response.ok || response.body === null) throw new Error('directory request failed');
  if (Number(response.headers.get('content-length')) > mobileContentDirectoryRuntimeMaxBytes) {
    await response.body.cancel();
    throw new Error('directory size');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > mobileContentDirectoryRuntimeMaxBytes) {
        await reader.cancel();
        throw new Error('directory size');
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
}

export async function loadMobileContentDirectory(): Promise<LoadedMobileContentDirectory> {
  if (successful !== null) return successful;
  if (pending !== null) return pending;
  pending = readLocalDocument()
    .then(async (document) => {
      if (!validateMobileContentDirectory(document)) throw new Error('directory contract');
      if (!(await validateMobileContentDirectoryIds(document)))
        throw new Error('directory identity');
      successful = Object.freeze({ document, projection: projectMobileContentDirectory(document) });
      return successful;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}
