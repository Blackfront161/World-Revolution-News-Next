import { describe, expect, it } from 'vitest';

import {
  firstAdapterTextCodeUnitLimit,
  isTranslationErrorResponse,
  isTranslationSuccessResponse,
  parseTranslationRequest,
  translationContractVersion,
  translationMode,
  translationTargetLanguages,
  utf8ByteLength,
} from '../src/translation-v1.js';

const validRequest = {
  contractVersion: translationContractVersion,
  mode: translationMode,
  sourceLanguage: 'en',
  targetLanguage: 'de',
  text: 'Exact public paragraph.',
} as const;

describe('translation v1 HTTP contract', () => {
  it('accepts the exact request keys and every admitted target language', () => {
    for (const targetLanguage of translationTargetLanguages) {
      if (targetLanguage === 'en') continue;
      expect(parseTranslationRequest({ ...validRequest, targetLanguage }).ok).toBe(true);
    }
    expect(parseTranslationRequest({ ...validRequest, ignored: true })).toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(parseTranslationRequest({ ...validRequest, sourceLanguage: 'EN' })).toEqual({
      ok: false,
      reason: 'language',
    });
    expect(parseTranslationRequest({ ...validRequest, sourceLanguage: 'und' })).toEqual({
      ok: false,
      reason: 'language',
    });
    expect(parseTranslationRequest({ ...validRequest, targetLanguage: 'en' })).toEqual({
      ok: false,
      reason: 'same-language',
    });
  });

  it('preserves exact Unicode and enforces the first-adapter UTF-16 cap without truncation', () => {
    const exact = ' A\u030A 😀 ';
    const parsed = parseTranslationRequest({ ...validRequest, text: exact });
    expect(parsed).toEqual({ ok: true, value: { ...validRequest, text: exact } });
    expect(
      parseTranslationRequest({ ...validRequest, text: 'a'.repeat(firstAdapterTextCodeUnitLimit) })
        .ok,
    ).toBe(true);
    expect(
      parseTranslationRequest({
        ...validRequest,
        text: 'a'.repeat(firstAdapterTextCodeUnitLimit + 1),
      }),
    ).toEqual({ ok: false, reason: 'too-large' });
    expect(parseTranslationRequest({ ...validRequest, text: '\ud800' })).toEqual({
      ok: false,
      reason: 'invalid',
    });
    const byteOverflow = '😀'.repeat(8_193);
    expect(utf8ByteLength(byteOverflow)).toBeGreaterThan(32_768);
    expect(parseTranslationRequest({ ...validRequest, text: byteOverflow })).toEqual({
      ok: false,
      reason: 'too-large',
    });
  });

  it('requires exact success and ADR-style error envelopes', () => {
    const success = {
      contractVersion: translationContractVersion,
      mode: translationMode,
      sourceLanguage: 'en',
      targetLanguage: 'de',
      requestTextSha256: 'a'.repeat(64),
      translation: { text: 'Übersetzt.', textSha256: 'b'.repeat(64) },
      adapter: { id: 'target', version: 'v1', provider: 'provider' },
      cache: { namespace: 'translation:v2', status: 'hit', expiresAt: '2026-09-12T00:00:00.000Z' },
    };
    expect(isTranslationSuccessResponse(success)).toBe(true);
    expect(isTranslationSuccessResponse({ ...success, unexpected: true })).toBe(false);
    expect(
      isTranslationErrorResponse({
        contractVersion: translationContractVersion,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Unavailable.',
        correlationId: 'random-id',
        retryable: true,
      }),
    ).toBe(true);
  });

  it('separates canonical source tags from the nine fixed targets', () => {
    for (const sourceLanguage of ['ar', 'ja', 'pt-br', 'zh-hant'])
      expect(parseTranslationRequest({ ...validRequest, sourceLanguage }).ok).toBe(true);
    for (const sourceLanguage of [
      'und',
      'AR',
      'pt-BR',
      'iw',
      'x-private',
      'en-u-ca-gregory',
      'en_uk',
    ])
      expect(parseTranslationRequest({ ...validRequest, sourceLanguage })).toEqual({
        ok: false,
        reason: 'language',
      });
    expect(
      parseTranslationRequest({ ...validRequest, sourceLanguage: 'ar', targetLanguage: 'ar' }),
    ).toEqual({ ok: false, reason: 'language' });
  });
});
