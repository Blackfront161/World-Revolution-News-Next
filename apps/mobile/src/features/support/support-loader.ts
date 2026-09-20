import {
  mobileSupportMaxDecodedJsonBytes,
  validateMobileSupport,
  type MobileSupportV1,
} from '@wrn/content-contracts/mobile-support-v1';

export type SupportLoadResult =
  | Readonly<{ kind: 'ready'; value: MobileSupportV1 }>
  | Readonly<{ kind: 'invalid' }>
  | Readonly<{ kind: 'aborted' }>
  | Readonly<{ kind: 'error' }>;
export type SupportLoader = (signal: AbortSignal) => Promise<unknown>;

let successfulSnapshot: MobileSupportV1 | null = null;

function abortError() {
  return new DOMException('aborted', 'AbortError');
}
async function boundedJson(response: Response, signal: AbortSignal): Promise<unknown> {
  const declared = response.headers.get('content-length');
  if (
    declared !== null &&
    (!/^\d+$/u.test(declared) || Number(declared) > mobileSupportMaxDecodedJsonBytes)
  ) {
    await response.body?.cancel();
    throw new RangeError('support-asset-too-large');
  }
  if (response.body === null) throw new TypeError('support-asset-no-body');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      if (signal.aborted) throw abortError();
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > mobileSupportMaxDecodedJsonBytes) throw new RangeError('support-asset-too-large');
      chunks.push(part.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new TypeError('support-asset-invalid-json');
  }
}
export async function defaultLoad(signal: AbortSignal): Promise<MobileSupportV1> {
  if (successfulSnapshot !== null) return successfulSnapshot;
  const response = await fetch(new URL('./data/legacy-support-v1.json', import.meta.url), {
    signal,
    credentials: 'omit',
    redirect: 'error',
  });
  if (!response.ok) throw new TypeError(`support-asset-http-${response.status}`);
  const candidate = await boundedJson(response, signal);
  if (signal.aborted) throw abortError();
  const checked = validateMobileSupport(candidate);
  if (!checked.ok || checked.value === null) throw new TypeError('support-asset-invalid-contract');
  successfulSnapshot = checked.value;
  return successfulSnapshot;
}
/** Test-only cache reset; runtime retries retain only a previously validated snapshot. */
export function resetMobileSupportLoadCacheForTest() {
  successfulSnapshot = null;
}
export async function loadMobileSupport(
  signal: AbortSignal,
  load: SupportLoader = defaultLoad,
): Promise<SupportLoadResult> {
  try {
    const candidate = await load(signal);
    if (signal.aborted) return { kind: 'aborted' };
    const checked = validateMobileSupport(candidate);
    return checked.ok && checked.value !== null
      ? { kind: 'ready', value: checked.value }
      : { kind: 'invalid' };
  } catch (error) {
    return signal.aborted || (error instanceof DOMException && error.name === 'AbortError')
      ? { kind: 'aborted' }
      : { kind: 'error' };
  }
}
