import { expect, it, vi } from 'vitest';
import {
  approvedCloudflareM2mModel,
  createCloudflareM2mAdapter,
} from '../src/cloudflare-m2m-adapter.js';

const paragraph = {
  contractVersion: '1.0.0',
  mode: 'paragraph',
  sourceLanguage: 'en',
  targetLanguage: 'de',
  text: 'Exact public paragraph.',
} as const;

it('maps one Workers AI response to the existing paragraph contract without a token', async () => {
  const run = vi.fn(async () => ({ translated_text: 'Exakter öffentlicher Absatz.' }));
  const result = await createCloudflareM2mAdapter({ run }).translate(paragraph, {
    signal: new AbortController().signal,
    noFallback: true,
  });
  expect(run).toHaveBeenCalledExactlyOnceWith(approvedCloudflareM2mModel, {
    text: paragraph.text,
    source_lang: 'en',
    target_lang: 'de',
  });
  expect(result).toMatchObject({
    translation: { text: 'Exakter öffentlicher Absatz.' },
    adapter: { id: 'workers-ai-m2m100', version: 'v1', provider: 'cloudflare' },
    attempts: 1,
  });
});

it('rejects malformed or late Workers AI output without a usable translation', async () => {
  for (const output of [{ translated_text: '<p>Bad</p>' }, { text: 'wrong shape' }, null]) {
    const adapter = createCloudflareM2mAdapter({ run: vi.fn(async () => output) });
    await expect(
      adapter.translate(paragraph, { signal: new AbortController().signal, noFallback: true }),
    ).rejects.toThrow();
  }
  let finish!: (value: unknown) => void;
  const run = vi.fn(() => new Promise<unknown>((resolve) => (finish = resolve)));
  const controller = new AbortController();
  const pending = createCloudflareM2mAdapter({ run }).translate(paragraph, {
    signal: controller.signal,
    noFallback: true,
  });
  controller.abort();
  finish({ translated_text: 'Late output.' });
  await expect(pending).rejects.toThrow();
});
