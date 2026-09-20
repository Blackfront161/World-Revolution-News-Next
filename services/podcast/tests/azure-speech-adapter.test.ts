import { describe, expect, it, vi } from 'vitest';

import {
  createAzureSpeechAdapter,
  PodcastAzureAdapterError,
  azureSpeechSsml,
} from '../src/azure-speech-adapter.js';

const input = {
  language: 'en' as const,
  voiceId: 'en-US-AriaNeural',
  title: 'A < title',
  text: 'One & two\n\nThree',
};

describe('Azure Speech adapter', () => {
  it('uses a fixed regional endpoint, escaped SSML, one POST, and audio/mpeg only', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2]), { headers: { 'content-type': 'audio/mpeg' } }),
    );
    const adapter = createAzureSpeechAdapter({
      region: 'westeurope',
      subscriptionKey: 'key',
      fetch,
    });
    await expect(
      adapter.synthesize(input, { signal: new AbortController().signal }),
    ).resolves.toEqual(new Uint8Array([1, 2]));
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1');
    expect(init).toMatchObject({
      method: 'POST',
      redirect: 'manual',
      headers: expect.objectContaining({ 'ocp-apim-subscription-key': 'key' }),
    });
    expect(String(init.body)).toContain('A &lt; title');
    expect(String(init.body)).toContain('One &amp; two<break time="650ms"/>Three');
    expect(azureSpeechSsml({ id: 'en-US-AriaNeural', locale: 'en-US' }, '<', '&')).toContain(
      '&lt;',
    );
  });

  it.each([
    new Response('not mp3', { headers: { 'content-type': 'text/plain' } }),
    new Response(new Uint8Array([1]), {
      headers: { 'content-type': 'audio/mpeg', 'content-length': String(25 * 1024 * 1024 + 1) },
    }),
    new Response('upstream', { status: 503, headers: { 'content-type': 'text/plain' } }),
    new Response(null, {
      status: 302,
      headers: { location: 'https://unexpected.invalid/audio.mp3' },
    }),
  ])('rejects a nonconforming or failed dispatched response', async (response) => {
    const adapter = createAzureSpeechAdapter({
      region: 'westeurope',
      subscriptionKey: 'key',
      fetch: vi.fn(async () => response),
    });
    await expect(
      adapter.synthesize(input, { signal: new AbortController().signal }),
    ).rejects.toBeInstanceOf(PodcastAzureAdapterError);
  });

  it('rejects unknown voice before dispatch', async () => {
    const fetch = vi.fn();
    const adapter = createAzureSpeechAdapter({
      region: 'westeurope',
      subscriptionKey: 'key',
      fetch,
    });
    await expect(
      adapter.synthesize(
        { ...input, voiceId: 'unknown' },
        { signal: new AbortController().signal },
      ),
    ).rejects.toThrow('not dispatched');
    expect(fetch).not.toHaveBeenCalled();
  });
});
