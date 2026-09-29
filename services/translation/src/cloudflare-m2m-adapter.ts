import {
  hasHtmlLikeMarkup,
  isWellFormedUnicode,
  translationContractVersion,
  translationMode,
  translationTextByteLimit,
  utf8ByteLength,
  type TranslationRequest,
} from '@wrn/api-contracts/translation-v1';
import type { TranslationUpstreamPort, TranslationUpstreamResult } from './handler.js';

/** Exact model and provenance; a change requires a reviewed release. */
export const approvedCloudflareM2mModel = '@cf/meta/m2m100-1.2b' as const;
export const cloudflareM2mIdentity = Object.freeze({
  id: 'workers-ai-m2m100',
  version: 'v1',
  provider: 'cloudflare',
});

export interface CloudflareAiBinding {
  run(
    model: typeof approvedCloudflareM2mModel,
    input: { readonly text: string; readonly source_lang: string; readonly target_lang: string },
  ): Promise<unknown>;
}

function validTranslation(value: unknown): value is { readonly translated_text: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).sort().join(',') !== 'translated_text') return false;
  const text = record.translated_text;
  return (
    typeof text === 'string' &&
    isWellFormedUnicode(text) &&
    text.trim().length > 0 &&
    utf8ByteLength(text) <= translationTextByteLimit &&
    !hasHtmlLikeMarkup(text)
  );
}

/** One native Workers AI attempt, with no fallback, logging of text, or ambient API token. */
export function createCloudflareM2mAdapter(binding: CloudflareAiBinding): TranslationUpstreamPort {
  if (!binding || typeof binding.run !== 'function') throw new Error('AI binding unavailable');
  return Object.freeze({
    async translate(
      request: TranslationRequest,
      options: { readonly signal: AbortSignal; readonly noFallback: true },
    ): Promise<TranslationUpstreamResult> {
      if (options.noFallback !== true) throw new Error('Fallback forbidden');
      options.signal.throwIfAborted();
      const output = await binding.run(approvedCloudflareM2mModel, {
        text: request.text,
        source_lang: request.sourceLanguage,
        target_lang: request.targetLanguage,
      });
      options.signal.throwIfAborted();
      if (!validTranslation(output)) throw new Error('AI output invalid');
      return {
        contractVersion: translationContractVersion,
        mode: translationMode,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        translation: { text: output.translated_text },
        adapter: cloudflareM2mIdentity,
        attempts: 1,
      };
    },
  });
}
