import { describe, expect, it, vi } from 'vitest';

import { createGeminiTranslationAdapter, GeminiAdapterError } from '../src/gemini-adapter.js';

const request = {
  contractVersion: '1.0.0',
  mode: 'paragraph',
  sourceLanguage: 'en',
  targetLanguage: 'de',
  text: 'Exact public paragraph.',
} as const;
const identity = { id: 'gemini-rest', version: 'v1', provider: 'google' } as const;

function response(value: unknown, options: ResponseInit = {}): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json', ...options.headers },
    ...options,
  });
}

function adapter(fetch = vi.fn()): ReturnType<typeof createGeminiTranslationAdapter> {
  return createGeminiTranslationAdapter({
    model: 'gemini-3.1-flash-lite-preview',
    apiKey: 'test-key-not-a-secret',
    fetch,
    adapter: identity,
  });
}

describe('Gemini REST translation adapter', () => {
  it('maps one explicit STOP response into the handler envelope without logging or fallback', async () => {
    const fetch = vi.fn(async () =>
      response({
        candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Genauer Absatz.' }] } }],
      }),
    );
    const upstream = adapter(fetch);
    const controller = new AbortController();
    await expect(
      upstream.translate(request, { signal: controller.signal, noFallback: true }),
    ).resolves.toEqual({
      contractVersion: '1.0.0',
      mode: 'paragraph',
      sourceLanguage: 'en',
      targetLanguage: 'de',
      translation: { text: 'Genauer Absatz.' },
      adapter: identity,
      attempts: 1,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent',
    );
    expect(url).not.toContain('test-key-not-a-secret');
    expect(init).toMatchObject({
      method: 'POST',
      signal: controller.signal,
      headers: expect.objectContaining({
        accept: 'application/json',
        'content-type': 'application/json',
        'x-goog-api-key': 'test-key-not-a-secret',
      }),
    });
    expect(JSON.parse(String(init.body))).toEqual({
      systemInstruction: { parts: [{ text: expect.stringContaining('en paragraph into de') }] },
      contents: [{ role: 'user', parts: [{ text: request.text }] }],
      generationConfig: { maxOutputTokens: 4096, responseMimeType: 'text/plain' },
    });
  });

  it.each([
    [
      {
        candidates: [
          { finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'Unvollständig' }] } },
        ],
      },
    ],
    [{ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '<p>Markup</p>' }] } }] }],
    [
      {
        candidates: [
          { finishReason: 'STOP', content: { parts: [{ functionCall: { name: 'tool' } }] } },
        ],
      },
    ],
  ])('rejects incomplete or non-text provider data', async (body) => {
    const upstream = adapter(vi.fn(async () => response(body)));
    await expect(
      upstream.translate(request, { signal: new AbortController().signal, noFallback: true }),
    ).rejects.toBeInstanceOf(GeminiAdapterError);
  });

  it('bounds a declared oversized response without a second request', async () => {
    let cancelled = false;
    const fetch = vi.fn(
      async () =>
        new Response(
          new ReadableStream({
            cancel: () => {
              cancelled = true;
              return Promise.reject(new Error('cancel rejected'));
            },
          }),
          { headers: { 'content-length': String(64 * 1024 + 1) } },
        ),
    );
    const upstream = adapter(fetch);
    await expect(
      upstream.translate(request, { signal: new AbortController().signal, noFallback: true }),
    ).rejects.toBeInstanceOf(GeminiAdapterError);
    expect(fetch).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(cancelled).toBe(true);
  });

  it('cancels a streamed oversized response and absorbs a rejected cancel operation', async () => {
    let cancelled = false;
    const fetch = vi.fn(
      async () =>
        new Response(
          new ReadableStream({
            start: (controller) => controller.enqueue(new Uint8Array(64 * 1024 + 1)),
            cancel: () => {
              cancelled = true;
              return Promise.reject(new Error('cancel rejected'));
            },
          }),
        ),
    );
    await expect(
      adapter(fetch).translate(request, { signal: new AbortController().signal, noFallback: true }),
    ).rejects.toBeInstanceOf(GeminiAdapterError);
    await Promise.resolve();
    expect(cancelled).toBe(true);
  });

  it('rejects an invalid adapter identity before dispatch', () => {
    const fetch = vi.fn();
    expect(() =>
      createGeminiTranslationAdapter({
        model: 'gemini-3.1-flash-lite-preview',
        apiKey: 'test-key-not-a-secret',
        fetch,
        adapter: {
          ...identity,
          unexpected: 'field',
        } as unknown as typeof identity,
      }),
    ).toThrow(GeminiAdapterError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not dispatch an already-aborted request', async () => {
    const fetch = vi.fn();
    const upstream = adapter(fetch);
    const controller = new AbortController();
    controller.abort(new Error('caller cancelled'));
    await expect(
      upstream.translate(request, { signal: controller.signal, noFallback: true }),
    ).rejects.toThrow('caller cancelled');
    expect(fetch).not.toHaveBeenCalled();
  });
});
