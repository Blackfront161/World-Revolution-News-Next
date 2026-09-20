import {
  hasHtmlLikeMarkup,
  isTranslationSuccessResponse,
  parseTranslationRequest,
  translationCacheTtlSeconds,
  translationRequestByteLimit,
  type TranslationAdapterIdentity,
  type TranslationLanguage,
  type TranslationSuccessResponse,
} from '@wrn/api-contracts/translation-v1';
import { canonicalJson, sha256Utf8 } from '@wrn/content-contracts';

export type ProductionTranslationAuthority = Readonly<{
  releaseRevision: string;
  manifestSha256: string;
  articleId: string;
  articleRevision: string;
  activeKey: string;
  safetyRevision: number;
  expiresAt: number;
}>;
export type ProductionTranslationParagraph = ProductionTranslationAuthority &
  Readonly<{
    route: string;
    blockIndex: number;
    text: string;
    sourceLanguage: string;
    targetLanguage: TranslationLanguage;
  }>;
export type ProductionTranslationOutcome =
  | Readonly<{ kind: 'translated'; response: TranslationSuccessResponse; identity: string }>
  | Readonly<{
      kind: 'unavailable' | 'sameLanguage' | 'offline' | 'timeout' | 'discarded' | 'error';
    }>;
export type ProductionTranslationAdapter = Readonly<{
  identity: TranslationAdapterIdentity;
  translate(
    paragraph: ProductionTranslationParagraph,
    signal: AbortSignal,
    isCurrent: () => boolean,
  ): Promise<ProductionTranslationOutcome>;
}>;

/** Exact render identity stays local; no article or release fields cross HTTP. */
export function productionTranslationRenderKey(paragraph: ProductionTranslationParagraph) {
  return canonicalJson(paragraph);
}

function configuration(
  value: unknown,
): { endpoint: string; adapter: TranslationAdapterIdentity } | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).sort().join(',') !== 'adapter,endpoint' ||
    typeof input.endpoint !== 'string'
  )
    return null;
  try {
    const endpoint = new URL(input.endpoint);
    if (
      endpoint.protocol !== 'https:' ||
      endpoint.pathname !== '/v1/translations' ||
      endpoint.search ||
      endpoint.hash ||
      endpoint.username ||
      endpoint.password
    )
      return null;
    const adapter = input.adapter as Record<string, unknown> | null;
    if (
      !adapter ||
      typeof adapter !== 'object' ||
      Object.keys(adapter).sort().join(',') !== 'id,provider,version' ||
      !['id', 'version', 'provider'].every(
        (key) => typeof adapter[key] === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(adapter[key]),
      )
    )
      return null;
    return {
      endpoint: endpoint.href,
      adapter: Object.freeze({
        id: adapter.id as string,
        version: adapter.version as string,
        provider: adapter.provider as string,
      }),
    };
  } catch {
    return null;
  }
}

/** No instance exists without complete, separately supplied client build configuration. */
export function createProductionTranslationAdapter(
  value: unknown,
  ports: { fetch?: typeof fetch; now?: () => number; online?: () => boolean } = {},
): ProductionTranslationAdapter | null {
  const config = configuration(value);
  if (config === null) return null;
  const now = ports.now ?? Date.now;
  const online = ports.online ?? (() => typeof navigator === 'undefined' || navigator.onLine);
  const request = ports.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  return Object.freeze({
    identity: config.adapter,
    async translate(paragraph, callerSignal, isCurrent) {
      if (paragraph.sourceLanguage === paragraph.targetLanguage) return { kind: 'sameLanguage' };
      if (!online()) return { kind: 'offline' };
      if (callerSignal.aborted || !isCurrent() || now() > paragraph.expiresAt)
        return { kind: 'discarded' };
      const parsed = parseTranslationRequest({
        contractVersion: '1.0.0',
        mode: 'paragraph',
        sourceLanguage: paragraph.sourceLanguage,
        targetLanguage: paragraph.targetLanguage,
        text: paragraph.text,
      });
      if (!parsed.ok) return { kind: 'unavailable' };
      const body = JSON.stringify(parsed.value);
      if (new TextEncoder().encode(body).byteLength > translationRequestByteLimit)
        return { kind: 'unavailable' };
      const controller = new AbortController();
      const deadline = now() + 15_000;
      let ended: 'timeout' | 'discarded' | null = null;
      let rejectStop!: (reason: unknown) => void;
      const stopped = new Promise<never>((_, reject) => {
        rejectStop = reject;
      });
      // The race owns rejection even if abort happens between synchronous phases.
      void stopped.catch(() => undefined);
      const stop = (reason: 'timeout' | 'discarded') => {
        if (ended !== null) return;
        ended = reason;
        controller.abort();
        rejectStop(new Error(reason));
      };
      const abort = () => stop('discarded');
      callerSignal.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => stop('timeout'), 15_000);
      const check = () => {
        if (now() >= deadline) stop('timeout');
        else if (callerSignal.aborted || !online() || !isCurrent() || now() > paragraph.expiresAt)
          stop('discarded');
        if (ended !== null) throw new Error(ended);
      };
      const wait = async <T>(work: () => Promise<T>): Promise<T> => {
        check();
        const result = await Promise.race([
          Promise.resolve().then(() => {
            check();
            return work();
          }),
          stopped,
        ]);
        check();
        return result;
      };
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      try {
        const { text, ...local } = paragraph;
        const textHash = await wait(() => sha256Utf8(text));
        const identity = await wait(() =>
          sha256Utf8(
            canonicalJson({ ...local, paragraphSha256: textHash, adapter: config.adapter }),
          ),
        );
        const response = await wait(() =>
          request(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body,
            signal: controller.signal,
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            cache: 'no-store',
            redirect: 'error',
          }),
        );
        if (
          response.redirected ||
          !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')
        )
          return { kind: 'error' };
        const declared = response.headers.get('content-length');
        if (
          declared !== null &&
          (!/^\d+$/.test(declared) || Number(declared) > translationRequestByteLimit)
        )
          return { kind: 'error' };
        if (!response.body) return { kind: 'error' };
        reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        for (;;) {
          const chunk = await wait(() => reader!.read());
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > translationRequestByteLimit) return { kind: 'error' };
          chunks.push(chunk.value);
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
        if (!response.ok) return { kind: response.status === 504 ? 'timeout' : 'error' };
        if (
          !isTranslationSuccessResponse(value) ||
          hasHtmlLikeMarkup(value.translation.text) ||
          value.sourceLanguage !== paragraph.sourceLanguage ||
          value.targetLanguage !== paragraph.targetLanguage ||
          value.requestTextSha256 !== textHash ||
          canonicalJson(value.adapter) !== canonicalJson(config.adapter)
        )
          return { kind: 'error' };
        const expiry = Date.parse(value.cache.expiresAt);
        if (expiry <= now() || expiry > now() + translationCacheTtlSeconds * 1000)
          return { kind: 'error' };
        if ((await wait(() => sha256Utf8(value.translation.text))) !== value.translation.textSha256)
          return { kind: 'error' };
        // Recompute original and full local identity after all untrusted work.
        const currentHash = await wait(() => sha256Utf8(paragraph.text));
        const currentIdentity = await wait(() =>
          sha256Utf8(
            canonicalJson({ ...local, paragraphSha256: currentHash, adapter: config.adapter }),
          ),
        );
        if (currentIdentity !== identity) return { kind: 'discarded' };
        check();
        return { kind: 'translated', response: value, identity };
      } catch {
        return { kind: ended ?? 'error' };
      } finally {
        clearTimeout(timer);
        callerSignal.removeEventListener('abort', abort);
        controller.abort();
        if (reader) {
          void reader.cancel().catch(() => undefined);
          try {
            reader.releaseLock();
          } catch {
            /* A pending read is being cancelled. */
          }
        }
      }
    },
  });
}
