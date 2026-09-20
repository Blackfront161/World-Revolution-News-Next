export async function readLocalJsonAsset(
  assetUrl: string,
  signal: AbortSignal,
  maxBytes: number,
): Promise<unknown> {
  if (signal.aborted) throw new DOMException('aborted', 'AbortError');
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new RangeError('local-json-size');
  const url = new URL(assetUrl, window.location.href);
  if (
    url.origin !== window.location.origin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new TypeError('local-json-url');
  const response = await fetch(url, { credentials: 'omit', redirect: 'error', signal });
  const rejectResponse = async (error: Error): Promise<never> => {
    await response.body?.cancel().catch(() => undefined);
    throw error;
  };
  if (signal.aborted) return rejectResponse(new DOMException('aborted', 'AbortError'));
  if (!response.ok || response.body === null)
    return rejectResponse(new TypeError('local-json-response'));
  if (
    !/^application\/json(?:;\s*charset=utf-8)?$/iu.test(response.headers.get('content-type') ?? '')
  )
    return rejectResponse(new TypeError('local-json-mime'));
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes)
    return rejectResponse(new RangeError('local-json-size'));
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (signal.aborted) throw new DOMException('aborted', 'AbortError');
      if (part.done) break;
      length += part.value.byteLength;
      if (length > maxBytes) {
        throw new RangeError('local-json-size');
      }
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
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
