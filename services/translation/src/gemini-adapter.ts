import {
  hasHtmlLikeMarkup,
  isWellFormedUnicode,
  translationContractVersion,
  translationMode,
  translationTextByteLimit,
  utf8ByteLength,
  type TranslationAdapterIdentity,
  type TranslationRequest,
} from '@wrn/api-contracts/translation-v1';

import type { TranslationUpstreamPort, TranslationUpstreamResult } from './handler.js';

const responseByteLimit = 64 * 1024;
const maxOutputTokens = 4096;

export interface GeminiAdapterConfiguration {
  readonly model: string;
  readonly apiKey: string;
  readonly fetch: typeof globalThis.fetch;
  readonly adapter: TranslationAdapterIdentity;
}

export class GeminiAdapterError extends Error {
  public constructor() {
    super('Gemini translation adapter rejected the upstream response.');
    this.name = 'GeminiAdapterError';
  }
}

function fail(): never {
  throw new GeminiAdapterError();
}

function validConfiguration(value: GeminiAdapterConfiguration): boolean {
  const validIdentity = validAdapterIdentity(value.adapter);
  return (
    typeof value.model === 'string' &&
    /^[a-zA-Z0-9._-]{1,128}$/.test(value.model) &&
    typeof value.apiKey === 'string' &&
    value.apiKey.length > 0 &&
    value.apiKey.length <= 512 &&
    typeof value.fetch === 'function' &&
    validIdentity
  );
}

function validAdapterIdentity(value: unknown): value is TranslationAdapterIdentity {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const identity = value as Record<string, unknown>;
  if (Object.keys(identity).sort().join(',') !== 'id,provider,version') return false;
  return [identity.id, identity.version, identity.provider].every(
    (part) =>
      typeof part === 'string' &&
      part.length > 0 &&
      part.length <= 128 &&
      /^[a-zA-Z0-9._:-]+$/u.test(part),
  );
}

function prompt(request: TranslationRequest): string {
  return [
    `Translate the supplied ${request.sourceLanguage} paragraph into ${request.targetLanguage}.`,
    'Preserve the meaning and paragraph boundaries.',
    'Return only the complete translated text without HTML, Markdown, labels, or commentary.',
  ].join(' ');
}

async function boundedJson(response: Response, signal: AbortSignal): Promise<unknown> {
  const cancel = (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    void reader.cancel().catch(() => {});
  };
  if (response.body === null) fail();
  const reader = response.body.getReader();
  if (!response.ok) {
    cancel(reader);
    reader.releaseLock();
    fail();
  }
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/u.test(declared) || Number(declared) > responseByteLimit)) {
    cancel(reader);
    reader.releaseLock();
    fail();
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  const abortReader = () => cancel(reader);
  signal.addEventListener('abort', abortReader, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const next = await reader.read();
      signal.throwIfAborted();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > responseByteLimit) {
        cancel(reader);
        fail();
      }
      chunks.push(next.value);
    }
  } catch (error) {
    cancel(reader);
    throw error;
  } finally {
    signal.removeEventListener('abort', abortReader);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail();
  }
}

function translatedText(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
  const candidates = (value as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length !== 1) fail();
  const candidate = candidates[0];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) fail();
  const content = (candidate as { content?: unknown }).content;
  if ((candidate as { finishReason?: unknown }).finishReason !== 'STOP') fail();
  if (!content || typeof content !== 'object' || Array.isArray(content)) fail();
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts) || parts.length === 0) fail();
  const text = parts
    .map((part) => {
      if (
        !part ||
        typeof part !== 'object' ||
        Array.isArray(part) ||
        Object.keys(part).length !== 1 ||
        typeof (part as { text?: unknown }).text !== 'string'
      )
        fail();
      return (part as { text: string }).text;
    })
    .join('');
  if (
    !isWellFormedUnicode(text) ||
    text.trim().length === 0 ||
    utf8ByteLength(text) > translationTextByteLimit ||
    hasHtmlLikeMarkup(text)
  )
    fail();
  return text;
}

/** A single explicit Gemini REST attempt. Activation and provider approval remain external. */
export function createGeminiTranslationAdapter(
  configuration: GeminiAdapterConfiguration,
): TranslationUpstreamPort {
  if (!validConfiguration(configuration)) fail();
  const adapter = Object.freeze({
    id: configuration.adapter.id,
    version: configuration.adapter.version,
    provider: configuration.adapter.provider,
  });
  return Object.freeze({
    async translate(
      request: TranslationRequest,
      options: { readonly signal: AbortSignal; readonly noFallback: true },
    ) {
      if (options.noFallback !== true) fail();
      options.signal.throwIfAborted();
      const response = await configuration.fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(configuration.model)}:generateContent`,
        {
          method: 'POST',
          signal: options.signal,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-goog-api-key': configuration.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: prompt(request) }] },
            contents: [{ role: 'user', parts: [{ text: request.text }] }],
            generationConfig: { maxOutputTokens, responseMimeType: 'text/plain' },
          }),
        },
      );
      const text = translatedText(await boundedJson(response, options.signal));
      const result: TranslationUpstreamResult = {
        contractVersion: translationContractVersion,
        mode: translationMode,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        translation: { text },
        adapter,
        attempts: 1,
      };
      return result;
    },
  });
}
