import { describe, expect, it, vi } from 'vitest';

import {
  createTranslationRuntimeFetch,
  createTranslationRuntimeFetchFromEnvironment,
} from '../src/runtime.js';

const origin = 'https://app.example';
const request = () =>
  new Request('https://worker.example/v1/translations', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({
      contractVersion: '1.0.0',
      mode: 'paragraph',
      sourceLanguage: 'en',
      targetLanguage: 'de',
      text: 'Exact public paragraph.',
    }),
  });
const quota = { reserve: vi.fn(async () => true) };
const cache = { get: vi.fn(async () => undefined), put: vi.fn(async () => {}) };

function bindings(overrides = {}) {
  return {
    enabled: true,
    allowedOrigins: [origin],
    adapter: { id: 'gemini-rest', version: 'v1', provider: 'google' },
    model: 'gemini-3.1-flash-lite-preview',
    apiKey: 'test-key-not-a-secret',
    fetch: vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Übersetzt.' }] } }],
          }),
        ),
    ),
    cache,
    readQuota: quota,
    providerQuota: quota,
    writeQuota: quota,
    cacheTtlSeconds: 60,
    supportedSourceLanguages: ['en'],
    ...overrides,
  };
}

function environment(overrides = {}) {
  return {
    TRANSLATION_V2_ENABLED: 'true',
    TRANSLATION_ALLOWED_ORIGINS: JSON.stringify([origin]),
    TRANSLATION_MODEL: 'gemini-3.1-flash-lite-preview',
    GEMINI_API_KEY: 'test-key-not-a-secret',
    TRANSLATION_CACHE_TTL_SECONDS: '60',
    TRANSLATION_SUPPORTED_SOURCE_LANGUAGES: JSON.stringify(['en']),
    TRANSLATION_CACHE: cache,
    TRANSLATION_READ_QUOTA: quota,
    TRANSLATION_PROVIDER_QUOTA: quota,
    TRANSLATION_WRITE_QUOTA: quota,
    ...overrides,
  };
}

describe('explicit translation runtime bindings', () => {
  it('defaults to the existing disabled worker without provider dispatch', async () => {
    const fetch = vi.fn();
    const response = await createTranslationRuntimeFetch(bindings({ enabled: false, fetch }))(
      request(),
    );
    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses reviewed injected ports and one adapter request when enabled', async () => {
    const value = bindings();
    const response = await createTranslationRuntimeFetch(value)(request());
    expect(response.status).toBe(200);
    expect(value.fetch).toHaveBeenCalledTimes(1);
  });

  it('fails closed for malformed adapter bindings without provider dispatch', async () => {
    const fetch = vi.fn();
    const response = await createTranslationRuntimeFetch(
      bindings({ adapter: { id: 'bad space', version: 'v1', provider: 'google' }, fetch }),
    )(request());
    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps the Worker environment disabled unless the explicit flag is true', async () => {
    const fetch = vi.fn();
    const response = await createTranslationRuntimeFetchFromEnvironment(
      environment({ TRANSLATION_V2_ENABLED: 'false' }),
      fetch,
    )(request());
    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails closed for incomplete or malformed Worker bindings without provider dispatch', async () => {
    const fetch = vi.fn();
    const response = await createTranslationRuntimeFetchFromEnvironment(
      environment({ TRANSLATION_ALLOWED_ORIGINS: '["https://app.example/path"]' }),
      fetch,
    )(request());
    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('composes explicit Worker bindings into the reviewed runtime ports', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Übersetzt.' }] } }],
          }),
        ),
    );
    const response = await createTranslationRuntimeFetchFromEnvironment(
      environment(),
      fetch,
    )(request());
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
