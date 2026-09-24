import { describe, expect, it, vi } from 'vitest';
import worker from '../src/worker.js';

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
    model: 'gemini-3.1-flash-lite',
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
    TRANSLATION_MODEL: 'gemini-3.1-flash-lite',
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
  it('coalesces equivalent environments, binds native fetch and rejects a retired model', async () => {
    const keys: string[] = [];
    const shared = environment({
      TRANSLATION_CACHE: {
        get: async (key: string) => {
          keys.push(key);
          return undefined;
        },
        put: async () => {},
      },
    });
    const nativeFetch = vi.fn(async function (this: unknown) {
      expect(this).toBe(globalThis);
      await new Promise((resolve) => setTimeout(resolve, 10));
      return new Response(
        JSON.stringify({
          candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Übersetzt.' }] } }],
        }),
      );
    });
    vi.stubGlobal('fetch', nativeFetch);
    try {
      const responses = await Promise.all([
        worker.fetch(request(), { ...shared }),
        worker.fetch(request(), { ...shared }),
      ]);
      expect(responses.map((response) => response.status)).toEqual([200, 200]);
      expect(nativeFetch).toHaveBeenCalledTimes(1);
      expect(new Set(keys).size).toBe(1);
      expect(
        (
          await worker.fetch(request(), {
            ...shared,
            TRANSLATION_MODEL: 'gemini-3.1-flash-lite-preview',
          })
        ).status,
      ).toBe(503);
      expect(nativeFetch).toHaveBeenCalledTimes(1);
      expect(
        (await worker.fetch(request(), { ...shared, TRANSLATION_V2_ENABLED: 'false' })).status,
      ).toBe(503);
      expect(nativeFetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
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

  it('rejects a retired directly injected model without provider dispatch', async () => {
    const fetch = vi.fn();
    const response = await createTranslationRuntimeFetch(
      bindings({ model: 'gemini-3.1-flash-lite-preview', fetch }),
    )(request());
    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
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
