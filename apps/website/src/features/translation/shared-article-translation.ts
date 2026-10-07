import { isUiLanguage, type UiLanguage } from '@wrn/ui-language';

// The installed App uses this legacy shared-cache protocol. It is deliberately
// separate from translation-v1: this service supplies no signed hashes or TTL.
export const sharedTranslationEndpoint = 'https://wrn-translation-cache.paghklo.workers.dev/';
export type SharedArticleInput = Readonly<{
  title: string;
  text: string;
  sourceLanguage: string;
  targetLanguage: UiLanguage;
}>;
export type SharedArticleOutcome =
  | Readonly<{ kind: 'translated'; title: string; text: string; cache: 'hit' | 'miss' | 'unknown' }>
  | Readonly<{ kind: 'offline' | 'unavailable' | 'timeout' | 'discarded' | 'same-language' }>
  | Readonly<{ kind: 'error'; retryAt?: number; status?: number }>;
type Environment = Readonly<{
  fetch: typeof fetch;
  online(): boolean;
  origin(): string;
  now(): number;
}>;
const plain = (value: unknown, max: number): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.length <= max &&
  !/[<>]/u.test(value) &&
  ![...value].some((character) => {
    const code = character.codePointAt(0)!;
    return code === 127 || (code < 32 && ![9, 10, 13].includes(code));
  }) &&
  !/\p{Surrogate}/u.test(value);
export function knownSourceLanguage(value: string): string | null {
  if (value === 'und' || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(value)) return null;
  try {
    const base = Intl.getCanonicalLocales(value)[0]?.split('-')[0];
    if (!base || ['und', 'mul', 'zxx'].includes(base)) return null;
    return new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' }).of(base)
      ? base
      : null;
  } catch {
    return null;
  }
}
function chunks(text: string): string[] {
  const result: string[] = [];
  let rest = text;
  while (rest.length > 6000) {
    let end = rest.lastIndexOf('\n\n', 6000);
    if (end < 3000) end = rest.lastIndexOf(' ', 6000);
    if (end < 3000) end = 6000;
    // Never split a surrogate pair or silently drop characters.
    if (/[\uD800-\uDBFF]/u.test(rest[end - 1] ?? '')) end--;
    result.push(rest.slice(0, end));
    rest = rest.slice(end);
  }
  if (rest.trim()) result.push(rest);
  return result;
}
async function boundedJson(response: Response): Promise<Record<string, unknown>> {
  if (!/^application\/json\b/iu.test(response.headers.get('content-type') ?? '')) throw Error();
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/u.test(declared) || Number(declared) > 131072)) throw Error();
  if (!response.body) throw Error();
  const reader = response.body.getReader(),
    parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > 131072) throw Error();
      parts.push(next.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error();
  return parsed as Record<string, unknown>;
}
function retryTime(response: Response, data: Record<string, unknown>, now: number) {
  const header = response.headers.get('retry-after');
  const seconds = header !== null && /^\d+$/u.test(header) ? Number(header) : NaN;
  const value = Number.isFinite(seconds)
    ? now + seconds * 1000
    : typeof data.resetAt === 'string'
      ? Date.parse(data.resetAt)
      : NaN;
  return Number.isFinite(value) && value > now && value <= now + 31 * 86400000 ? value : undefined;
}
export function createSharedArticleTranslator(environment?: Partial<Environment>) {
  const env: Environment = {
    fetch: (...args) => fetch(...args),
    online: () => navigator.onLine,
    origin: () => window.location.origin,
    now: Date.now,
    ...environment,
  };
  // Public translations only, bounded session memory. No reading state or IDs
  // are sent or persisted. Server cache selection remains server-owned.
  const memory = new Map<string, { until: number; outcome: SharedArticleOutcome }>();
  let cooldown = 0;
  return async function translate(
    input: SharedArticleInput,
    signal: AbortSignal,
  ): Promise<SharedArticleOutcome> {
    if (signal.aborted) return { kind: 'discarded' };
    if (!env.online()) return { kind: 'offline' };
    if (!['https://solinaridao.com', 'https://www.solinaridao.com'].includes(env.origin()))
      return { kind: 'unavailable' };
    const source = knownSourceLanguage(input.sourceLanguage);
    if (
      !source ||
      !isUiLanguage(input.targetLanguage) ||
      !plain(input.title, 500) ||
      (input.text !== '' && !plain(input.text, 48000))
    )
      return { kind: 'unavailable' };
    if (source === input.targetLanguage) return { kind: 'same-language' };
    if (cooldown > env.now()) return { kind: 'error', retryAt: cooldown, status: 429 };
    const key = JSON.stringify([input.title, input.text, source, input.targetLanguage]);
    const cached = memory.get(key);
    if (cached && cached.until > env.now()) return cached.outcome;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    let timedOut = false;
    const deadline = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 90000);
    try {
      const pieces = input.text ? chunks(input.text) : [input.title];
      let title = '',
        text = '';
      const cacheStates: string[] = [];
      for (const [index, piece] of pieces.entries()) {
        if (controller.signal.aborted || !env.online())
          return { kind: signal.aborted ? 'discarded' : !env.online() ? 'offline' : 'timeout' };
        const mode = input.text && index === 0 ? 'title_and_text' : 'continuation';
        const phase = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, 65000);
        let response: Response;
        let data: Record<string, unknown>;
        try {
          response = await env.fetch(sharedTranslationEndpoint, {
            method: 'POST',
            credentials: 'omit',
            cache: 'no-store',
            redirect: 'error',
            referrerPolicy: 'no-referrer',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'wrn-web' },
            body: JSON.stringify({
              action: 'translate',
              targetLanguage: input.targetLanguage,
              mode,
              title: mode === 'title_and_text' ? input.title : '',
              text: piece,
              cacheVersion: 1,
            }),
          });
          data = await boundedJson(response);
        } finally {
          clearTimeout(phase);
        }
        if (!response.ok || data.error === true || data.ok === false) {
          const retryAt = retryTime(response, data, env.now());
          if (retryAt !== undefined) cooldown = Math.max(cooldown, retryAt);
          return {
            kind: 'error',
            status: response.status,
            ...(retryAt === undefined ? {} : { retryAt }),
          };
        }
        if (data.ok !== true && data.error !== false) return { kind: 'error' };
        const output = data.text ?? data.translation ?? data.translatedText;
        if (!plain(output, 24000)) return { kind: 'error' };
        const trimmed = output.trim();
        if (mode === 'title_and_text') {
          const sections = trimmed.split(/\r?\n\s*---\s*\r?\n/u);
          if (
            sections.length !== 2 ||
            !plain(sections[0]?.trim(), 2000) ||
            /[\r\n]/u.test(sections[0] ?? '') ||
            !plain(sections[1]?.trim(), 24000)
          )
            return { kind: 'error' };
          title = sections[0]!.trim();
          text = sections[1]!.trim();
        } else if (!input.text) {
          if (!plain(trimmed, 2000) || /\r?\n/u.test(trimmed)) return { kind: 'error' };
          title = trimmed;
        } else text += `\n\n${trimmed}`;
        if (text.length > 192000) return { kind: 'error' };
        cacheStates.push(response.headers.get('x-wrn-shared-cache')?.toLowerCase() ?? 'unknown');
      }
      if (signal.aborted || controller.signal.aborted)
        return { kind: signal.aborted ? 'discarded' : 'timeout' };
      if (!env.online()) return { kind: 'offline' };
      const outcome: SharedArticleOutcome = {
        kind: 'translated',
        title,
        text,
        cache: cacheStates.every((value) => value === 'hit')
          ? 'hit'
          : cacheStates.some((value) => value === 'miss')
            ? 'miss'
            : 'unknown',
      };
      if (memory.size >= 24) memory.delete(memory.keys().next().value!);
      memory.set(key, { until: env.now() + 10 * 60000, outcome });
      return outcome;
    } catch {
      return {
        kind: signal.aborted
          ? 'discarded'
          : !env.online()
            ? 'offline'
            : timedOut
              ? 'timeout'
              : 'error',
      };
    } finally {
      clearTimeout(deadline);
      signal.removeEventListener('abort', abort);
    }
  };
}
export const translateSharedArticle = createSharedArticleTranslator();
