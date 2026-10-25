import type { Request } from '@playwright/test';

export const directoryPointer = 'https://solinaridao.com/wrn-content-directory/current.json';
export const revocationPointer = 'https://solinaridao.com/wrn-source-pass-revocations/current.json';

export function recordRemotePointer(
  request: Request,
  localOrigin: string,
  unexpected: string[],
  approved: Request[],
  allowed: readonly string[],
): void {
  if (new URL(request.url()).origin === localOrigin) return;
  if (allowed.includes(request.url())) approved.push(request);
  else unexpected.push(request.url());
}

export async function auditRemotePointers(
  requests: readonly Request[],
  allowed: readonly string[],
  maximum: number,
): Promise<void> {
  if (requests.length > maximum)
    throw new Error('Approved remote pointer request count exceeded the scenario bound');
  for (const request of requests) {
    if (!allowed.includes(request.url())) throw new Error('Unexpected remote pointer URL');
    if (request.method() !== 'GET' || request.postData() !== null)
      throw new Error('Remote pointer request was not a bodyless GET');
    const headers = await request.allHeaders();
    const sensitive = [
      'authorization',
      'proxy-authorization',
      'cookie',
      'referer',
      'x-api-key',
    ].find((name) =>
      name === 'referer' ? Boolean(headers[name]?.trim()) : headers[name] !== undefined,
    );
    if (sensitive)
      throw new Error(
        `Remote ${request.url() === directoryPointer ? 'directory' : 'revocation'} pointer carried ${sensitive} header`,
      );
  }
}
