import { describe, expect, it, vi } from 'vitest';
import { createProductionOnlinePodcastAdapter } from '../../../packages/browser-content/src/production-podcast-online';

async function sha256(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

const authority = {
  articleId: 'wrn-art-0123456789abcdef0123456789abcdef',
  articleRevision: 'a'.repeat(64),
  expiresAt: Date.parse('2026-09-21T12:00:00.000Z'),
};

describe('production online podcast adapter', () => {
  it('requires an exact HTTPS endpoint and sends only canonical identity and choices', async () => {
    expect(createProductionOnlinePodcastAdapter(undefined)).toBeNull();
    expect(createProductionOnlinePodcastAdapter('http://example.test/v1/podcasts')).toBeNull();
    const audio = new Uint8Array([1, 2, 3]);
    const digest = await sha256(audio);
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 'generated',
            audioSha256: digest,
            audioPath: `/v1/podcasts/audio/${'a'.repeat(24)}`,
            expiresAt: '2026-09-21T11:05:00.000Z',
          }),
          { status: 202, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(audio, { status: 200, headers: { 'content-type': 'audio/mpeg' } }),
      );
    const adapter = createProductionOnlinePodcastAdapter(
      'https://podcast.example.test/v1/podcasts',
      { fetch, now: () => Date.parse('2026-09-21T11:00:00.000Z'), online: () => true },
    )!;
    const result = await adapter.generate(
      authority,
      { mode: 'short', language: 'de', voiceId: 'de-DE-KatjaNeural' },
      new AbortController().signal,
      () => true,
    );
    expect(result).toMatchObject({ kind: 'ready', audioSha256: digest });
    const posted = fetch.mock.calls[0]!;
    expect(posted[0]).toBe('https://podcast.example.test/v1/podcasts');
    expect(JSON.parse(String((posted[1] as RequestInit).body))).toEqual({
      articleId: authority.articleId,
      mode: 'short',
      language: 'de',
      voiceId: 'de-DE-KatjaNeural',
    });
    expect(String((posted[1] as RequestInit).body)).not.toContain('text');
    expect(fetch.mock.calls[1]?.[0]).toBe(
      `https://podcast.example.test/v1/podcasts/audio/${'a'.repeat(24)}`,
    );
  });

  it('fails closed for exhausted quota, an invalid voice, stale authority and changed identity', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('{}', { status: 429 }));
    const adapter = createProductionOnlinePodcastAdapter(
      'https://podcast.example.test/v1/podcasts',
      { fetch, now: () => Date.parse('2026-09-21T11:00:00.000Z'), online: () => true },
    )!;
    await expect(
      adapter.generate(
        authority,
        { mode: 'full', language: 'en', voiceId: 'en-US-AriaNeural' },
        new AbortController().signal,
        () => true,
      ),
    ).resolves.toEqual({ kind: 'quota' });
    await expect(
      adapter.generate(
        authority,
        { mode: 'full', language: 'en', voiceId: 'unknown' },
        new AbortController().signal,
        () => true,
      ),
    ).resolves.toEqual({ kind: 'error' });
    await expect(
      adapter.generate(
        { ...authority, expiresAt: Date.parse('2026-09-21T10:59:59.000Z') },
        { mode: 'full', language: 'en', voiceId: 'en-US-AriaNeural' },
        new AbortController().signal,
        () => true,
      ),
    ).resolves.toEqual({ kind: 'discarded' });
    await expect(
      adapter.generate(
        authority,
        { mode: 'full', language: 'en', voiceId: 'en-US-AriaNeural' },
        new AbortController().signal,
        () => false,
      ),
    ).resolves.toEqual({ kind: 'discarded' });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('rejects an audio grant that exceeds the backend five-minute limit', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 'generated',
          audioSha256: 'a'.repeat(64),
          audioPath: `/v1/podcasts/audio/${'b'.repeat(24)}`,
          expiresAt: '2026-09-21T11:05:00.001Z',
        }),
        { status: 202, headers: { 'content-type': 'application/json' } },
      ),
    );
    const adapter = createProductionOnlinePodcastAdapter(
      'https://podcast.example.test/v1/podcasts',
      { fetch, now: () => Date.parse('2026-09-21T11:00:00.000Z'), online: () => true },
    )!;

    await expect(
      adapter.generate(
        authority,
        { mode: 'short', language: 'de', voiceId: 'de-DE-KatjaNeural' },
        new AbortController().signal,
        () => true,
      ),
    ).resolves.toEqual({ kind: 'error' });
    expect(fetch).toHaveBeenCalledOnce();
  });
});
