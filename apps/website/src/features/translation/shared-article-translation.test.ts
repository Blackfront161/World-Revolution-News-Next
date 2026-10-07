import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSharedArticleTranslator,
  sharedTranslationEndpoint,
  type SharedArticleInput,
} from './shared-article-translation';
const input: SharedArticleInput = {
  title: 'Original public headline',
  text: '',
  sourceLanguage: 'en',
  targetLanguage: 'de',
};
const response = (text: string, headers = {}) =>
  new Response(JSON.stringify({ error: false, text }), {
    headers: { 'content-type': 'application/json', ...headers },
  });
const fixture = (fetch = vi.fn(async () => response('Überschrift'))) => ({
  fetch,
  translate: createSharedArticleTranslator({
    fetch,
    origin: () => 'https://solinaridao.com',
    online: () => true,
  }),
});
afterEach(() => vi.useRealTimers());
describe('App-compatible Website shared translation client', () => {
  it('sends only public text and target through the shared endpoint, never local identity or credentials', async () => {
    const { fetch, translate } = fixture();
    expect(await translate(input, new AbortController().signal)).toMatchObject({
      kind: 'translated',
      title: 'Überschrift',
      text: '',
      cache: 'unknown',
    });
    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = fetch.mock.calls[0]! as unknown as [string, RequestInit];
    expect(url).toBe(sharedTranslationEndpoint);
    expect(options).toMatchObject({
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      cache: 'no-store',
    });
    expect(JSON.parse(options.body as string)).toEqual({
      action: 'translate',
      targetLanguage: 'de',
      mode: 'continuation',
      title: '',
      text: input.title,
      cacheVersion: 1,
    });
  });
  it('translates all admitted chunks serially without truncation and rejects partial results', async () => {
    const fetch = vi.fn(async () =>
      response('Titel\n---\nErster Text', { 'x-wrn-shared-cache': 'HIT' }),
    );
    fetch
      .mockImplementationOnce(async () =>
        response('Titel\n---\nErster Text', { 'x-wrn-shared-cache': 'HIT' }),
      )
      .mockImplementationOnce(async () =>
        response('Zweiter Text', { 'x-wrn-shared-cache': 'MISS' }),
      );
    const { translate } = fixture(fetch);
    const text = `${'public '.repeat(1000)}last paragraph`;
    expect(await translate({ ...input, text }, new AbortController().signal)).toEqual({
      kind: 'translated',
      title: 'Titel',
      text: 'Erster Text\n\nZweiter Text',
      cache: 'miss',
    });
    const sent = fetch.mock.calls.map((call) =>
      JSON.parse((call as unknown as [string, RequestInit])[1].body as string),
    );
    expect(sent.map((request) => request.text).join('')).toBe(text);
    expect(sent.map((request) => request.mode)).toEqual(['title_and_text', 'continuation']);
    const failed = fixture(vi.fn(async () => response('Missing required title separator')));
    expect(
      await failed.translate({ ...input, text: 'Admitted body' }, new AbortController().signal),
    ).toEqual({ kind: 'error' });
  });
  it.each(['und', 'und-Latn', 'mul', 'zxx', 'xx', 'qaa', '', 'invalid?', 'en_private'])(
    'never infers a source language from %s',
    async (sourceLanguage) => {
      const { fetch, translate } = fixture();
      expect(await translate({ ...input, sourceLanguage }, new AbortController().signal)).toEqual({
        kind: 'unavailable',
      });
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it('blocks same-language, offline, nonproduction origins and overlong/untrusted input without requests', async () => {
    const { fetch, translate } = fixture();
    expect(
      await translate({ ...input, sourceLanguage: 'de-DE' }, new AbortController().signal),
    ).toEqual({ kind: 'same-language' });
    for (const invalid of [
      { ...input, title: '<script>' },
      { ...input, title: 'a'.repeat(501) },
      { ...input, text: 'x'.repeat(48001) },
    ])
      expect(await translate(invalid, new AbortController().signal)).toEqual({
        kind: 'unavailable',
      });
    expect(
      await createSharedArticleTranslator({ fetch, online: () => false })(
        input,
        new AbortController().signal,
      ),
    ).toEqual({ kind: 'offline' });
    expect(
      await createSharedArticleTranslator({
        fetch,
        online: () => true,
        origin: () => 'http://127.0.0.1:43240',
      })(input, new AbortController().signal),
    ).toEqual({ kind: 'unavailable' });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['<img src=x onerror=alert(1)>', '\u0000bad', 'x'.repeat(24001), 'line1\nline2'])(
    'rejects unsafe or invalid translated headlines',
    async (output) => {
      expect(
        await fixture(vi.fn(async () => response(output))).translate(
          input,
          new AbortController().signal,
        ),
      ).toEqual({ kind: 'error' });
    },
  );
  it('rejects oversized streamed and invalid UTF-8/HTML responses', async () => {
    for (const value of [
      new Response('x'.repeat(131073), { headers: { 'content-type': 'application/json' } }),
      new Response(new Uint8Array([0xff]), { headers: { 'content-type': 'application/json' } }),
      new Response('<html>Service error</html>', { headers: { 'content-type': 'text/html' } }),
    ]) {
      const { translate } = fixture(vi.fn(async () => value));
      expect(await translate(input, new AbortController().signal)).toEqual({ kind: 'error' });
    }
  });
  it('requires explicit success from the actual App wire contract', async () => {
    for (const data of [
      { text: 'No success flag' },
      { ok: false, text: 'Failed result' },
      { ok: true, error: true, text: 'Contradictory result' },
    ]) {
      const fetch = vi.fn(
        async () =>
          new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } }),
      );
      expect(await fixture(fetch).translate(input, new AbortController().signal)).toEqual(
        expect.objectContaining({ kind: 'error' }),
      );
    }
    const fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true, text: 'Aktueller Dienst' }), {
          headers: { 'content-type': 'application/json' },
        }),
    );
    expect(await fixture(fetch).translate(input, new AbortController().signal)).toMatchObject({
      kind: 'translated',
      title: 'Aktueller Dienst',
    });
  });
  it('honors quota retry times across articles without direct-proxy fallback or automatic retries', async () => {
    const now = Date.now();
    const fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: true, resetAt: new Date(now + 3600000).toISOString() }),
          {
            status: 429,
            headers: { 'content-type': 'application/json' },
          },
        ),
    );
    const translate = createSharedArticleTranslator({
      fetch,
      now: () => now,
      origin: () => 'https://solinaridao.com',
      online: () => true,
    });
    expect(await translate(input, new AbortController().signal)).toEqual({
      kind: 'error',
      status: 429,
      retryAt: now + 3600000,
    });
    expect(
      await translate({ ...input, title: 'Different article' }, new AbortController().signal),
    ).toEqual({ kind: 'error', status: 429, retryAt: now + 3600000 });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('discards canceled responses even if transport ignores AbortSignal, and reuses only complete session results', async () => {
    const controller = new AbortController();
    const fetch = vi.fn(async () => {
      controller.abort();
      return response('Late title');
    });
    expect(await fixture(fetch).translate(input, controller.signal)).toEqual({ kind: 'discarded' });
    const cached = fixture();
    await cached.translate(input, new AbortController().signal);
    await cached.translate(input, new AbortController().signal);
    expect(cached.fetch).toHaveBeenCalledOnce();
    await cached.translate({ ...input, targetLanguage: 'fr' }, new AbortController().signal);
    expect(cached.fetch).toHaveBeenCalledTimes(2);
  });
  it('limits provider waiting to 65 seconds and keeps timeout distinct from failure', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(
      (_url: string | URL | Request, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );
    const translate = createSharedArticleTranslator({
      fetch,
      online: () => true,
      origin: () => 'https://solinaridao.com',
    });
    const pending = translate(input, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(65000);
    expect(await pending).toEqual({ kind: 'timeout' });
    expect(fetch).toHaveBeenCalledOnce();
  });
});
