import { afterEach, describe, expect, it, vi } from 'vitest';
import { sha256Utf8 } from '@wrn/content-contracts';
import {
  createWebsiteProductionTranslationAdapter,
  productionTranslationAdapter,
} from './production-translation-adapter';
import type { ProductionTranslationParagraph } from '../../../packages/browser-content/src/production-translation';

const now = Date.parse('2026-09-11T00:00:00.000Z');
const config = {
  endpoint: 'https://translation.example/v1/translations',
  adapter: { id: 'test', version: '1', provider: 'test-provider' },
};
const paragraph: ProductionTranslationParagraph = {
  releaseRevision: 'local-release',
  manifestSha256: 'a'.repeat(64),
  articleId: 'local-article',
  articleRevision: 'b'.repeat(64),
  activeKey: 'local-key',
  safetyRevision: 1,
  expiresAt: now + 86_400_000,
  route: 'local-route',
  blockIndex: 0,
  sourceLanguage: 'en',
  targetLanguage: 'de',
  text: 'Exact public paragraph.',
};
async function reply(text = 'Geprüfte Übersetzung.') {
  return {
    contractVersion: '1.0.0',
    mode: 'paragraph',
    sourceLanguage: 'en',
    targetLanguage: 'de',
    requestTextSha256: await sha256Utf8(paragraph.text),
    translation: { text, textSha256: await sha256Utf8(text) },
    adapter: config.adapter,
    cache: {
      namespace: 'translation:v2',
      status: 'hit',
      expiresAt: new Date(now + 60_000).toISOString(),
    },
  };
}
afterEach(() => vi.useRealTimers());

describe('website production translation adapter', () => {
  it('defaults unavailable and rejects incomplete or unsafe configuration', () => {
    expect(productionTranslationAdapter).toBeNull();
    for (const candidate of [
      null,
      {},
      { ...config, endpoint: 'http://translation.example/v1/translations' },
      { ...config, endpoint: config.endpoint + '?article=1' },
      { ...config, adapter: { ...config.adapter, provider: '' } },
    ])
      expect(createWebsiteProductionTranslationAdapter(candidate)).toBeNull();
  });
  it('sends only exact public paragraph fields and checks the cache-labelled response', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json(await reply()));
    const adapter = createWebsiteProductionTranslationAdapter(config, {
      fetch,
      now: () => now,
      online: () => true,
    })!;
    const outcome = await adapter.translate(paragraph, new AbortController().signal, () => true);
    expect(outcome.kind).toBe('translated');
    if (outcome.kind !== 'translated') throw new Error('expected translation');
    expect(outcome.response.cache.status).toBe('hit');
    expect(outcome.identity).toMatch(/^[a-f0-9]{64}$/);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(config.endpoint);
    expect(JSON.parse(init!.body as string)).toEqual({
      contractVersion: '1.0.0',
      mode: 'paragraph',
      sourceLanguage: 'en',
      targetLanguage: 'de',
      text: paragraph.text,
    });
    expect(init).toMatchObject({
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      redirect: 'error',
      method: 'POST',
    });
    expect(init!.headers).toEqual({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('performs no request for same language, offline, cancelled or oversize input', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const adapter = createWebsiteProductionTranslationAdapter(config, {
      fetch,
      now: () => now,
      online: () => true,
    })!;
    expect(
      (
        await adapter.translate(
          { ...paragraph, targetLanguage: 'en' },
          new AbortController().signal,
          () => true,
        )
      ).kind,
    ).toBe('sameLanguage');
    expect(
      (
        await adapter.translate(
          { ...paragraph, text: 'x'.repeat(6001) },
          new AbortController().signal,
          () => true,
        )
      ).kind,
    ).toBe('unavailable');
    expect((await adapter.translate(paragraph, AbortSignal.abort(), () => true)).kind).toBe(
      'discarded',
    );
    const offline = createWebsiteProductionTranslationAdapter(config, {
      fetch,
      now: () => now,
      online: () => false,
    })!;
    expect(
      (await offline.translate(paragraph, new AbortController().signal, () => true)).kind,
    ).toBe('offline');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects forged identity, provider, hashes, expiry, HTML and non-JSON or excessive responses', async () => {
    const valid = await reply();
    const cases = [
      { ...valid, sourceLanguage: 'fr' },
      { ...valid, targetLanguage: 'es' },
      { ...valid, requestTextSha256: 'c'.repeat(64) },
      { ...valid, adapter: { ...config.adapter, version: '2' } },
      { ...valid, adapter: { ...config.adapter, provider: 'other' } },
      { ...valid, translation: { text: 'forged', textSha256: valid.translation.textSha256 } },
      { ...valid, cache: { ...valid.cache, namespace: 'translation:v1' } },
      { ...valid, cache: { ...valid.cache, expiresAt: new Date(now).toISOString() } },
      { ...valid, cache: { ...valid.cache, expiresAt: new Date(now + 604_801_000).toISOString() } },
      await reply('<strong>Unsafe</strong>'),
      { ...valid, extra: 'untrusted' },
    ];
    for (const value of cases) {
      const adapter = createWebsiteProductionTranslationAdapter(config, {
        fetch: vi.fn().mockResolvedValue(Response.json(value)),
        now: () => now,
      })!;
      expect(
        (await adapter.translate(paragraph, new AbortController().signal, () => true)).kind,
      ).toBe('error');
    }
    for (const response of [
      new Response('{}'),
      new Response('x'.repeat(36_865), { headers: { 'content-type': 'application/json' } }),
      Response.json(valid, { headers: { 'content-length': '36865' } }),
    ]) {
      const adapter = createWebsiteProductionTranslationAdapter(config, {
        fetch: vi.fn().mockResolvedValue(response),
        now: () => now,
      })!;
      expect(
        (await adapter.translate(paragraph, new AbortController().signal, () => true)).kind,
      ).toBe('error');
    }
  });
  it('settles on caller abort and discards a late uncooperative fetch without another request', async () => {
    let finish!: (value: Response) => void;
    const fetch = vi.fn<typeof globalThis.fetch>(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const adapter = createWebsiteProductionTranslationAdapter(config, { fetch, now: () => now })!;
    const controller = new AbortController();
    const pending = adapter.translate(paragraph, controller.signal, () => true);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    controller.abort();
    expect((await pending).kind).toBe('discarded');
    finish(Response.json(await reply()));
    expect((fetch.mock.calls[0]![1]!.signal as AbortSignal).aborted).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('enforces a 15-second total deadline including an uncooperative response body', async () => {
    for (const bodyPhase of [false, true]) {
      vi.useFakeTimers();
      let read = false;
      const response = new Response(
        new ReadableStream({
          pull() {
            read = true;
            return new Promise(() => undefined);
          },
        }),
        { headers: { 'content-type': 'application/json' } },
      );
      const fetch = vi.fn<typeof globalThis.fetch>(() =>
        bodyPhase ? Promise.resolve(response) : new Promise(() => undefined),
      );
      const adapter = createWebsiteProductionTranslationAdapter(config, { fetch, now: () => now })!;
      const pending = adapter.translate(paragraph, new AbortController().signal, () => true);
      await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
      if (bodyPhase) await vi.waitFor(() => expect(read).toBe(true));
      await vi.advanceTimersByTimeAsync(15_000);
      expect((await pending).kind).toBe('timeout');
      expect(fetch).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    }
  });
  it('rejects authority changes even when the transport ignores cancellation', async () => {
    let current = true;
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      current = false;
      return Response.json(await reply());
    });
    const adapter = createWebsiteProductionTranslationAdapter(config, { fetch, now: () => now })!;
    expect(
      (await adapter.translate(paragraph, new AbortController().signal, () => current)).kind,
    ).toBe('discarded');
  });
});
