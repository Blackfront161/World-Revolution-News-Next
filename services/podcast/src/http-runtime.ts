import type { PodcastGenerationResult } from './contracts.js';
import type { PodcastService } from './service.js';

export interface PodcastRequestAuthenticator {
  readonly authenticate: (request: Request) => Promise<boolean>;
}

export interface PodcastPrivateAudioAccessPort {
  /** Issues an opaque, short-lived locator bound to the exact canonical audio identity. */
  readonly issue: (
    audio: Extract<
      PodcastGenerationResult,
      { readonly status: 'cached' | 'generated' }
    >['privateAudio'],
    options: { readonly signal: AbortSignal },
  ) => Promise<{ readonly token: string; readonly expiresAt: string }>;
  /** Resolves and reads only a still-valid opaque locator after this runtime authenticates the caller. */
  readonly read: (
    token: string,
    options: { readonly signal: AbortSignal },
  ) => Promise<{ readonly bytes: Uint8Array; readonly contentType: 'audio/mpeg' } | null>;
}

export interface PodcastHttpRuntime {
  readonly allowedOrigins: ReadonlySet<string>;
  readonly authenticator: PodcastRequestAuthenticator;
  readonly service: PodcastService;
  /** A private binding (not an R2 public URL) is required for successful delivery. */
  readonly privateAudio: PodcastPrivateAudioAccessPort;
}

const maxRequestBytes = 2_048;
const maxGrantLifetimeMilliseconds = 5 * 60 * 1_000;

function json(status: number, body: Record<string, string>, origin?: string): Response {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  if (origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function validGrantExpiry(value: string): boolean {
  const parsed = Date.parse(value);
  return (
    !Number.isNaN(parsed) &&
    new Date(parsed).toISOString() === value &&
    parsed > Date.now() &&
    parsed <= Date.now() + maxGrantLifetimeMilliseconds
  );
}

async function boundedJson(request: Request): Promise<unknown> {
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/u.test(length) || Number(length) > maxRequestBytes))
    throw new Error('invalid');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const step = await reader.read();
      if (step.done) break;
      size += step.value.byteLength;
      if (size > maxRequestBytes) throw new Error('invalid');
      chunks.push(step.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

const tokenPattern = /^[A-Za-z0-9_-]{24,512}$/u;

async function responseFor(
  result: PodcastGenerationResult,
  origin: string,
  privateAudio: PodcastPrivateAudioAccessPort,
  signal: AbortSignal,
): Promise<Response> {
  if (result.status === 'cached' || result.status === 'generated') {
    const grant = await privateAudio.issue(result.privateAudio, { signal });
    if (!tokenPattern.test(grant.token) || !validGrantExpiry(grant.expiresAt))
      return json(503, { code: 'PRIVATE_AUDIO_UNAVAILABLE' }, origin);
    return json(
      202,
      {
        status: result.status,
        audioSha256: result.audioSha256,
        audioPath: `/v1/podcasts/audio/${grant.token}`,
        expiresAt: grant.expiresAt,
      },
      origin,
    );
  }
  if (result.status === 'not-admitted') return json(403, { code: 'NOT_ADMITTED' }, origin);
  if (result.status === 'quota-denied') return json(429, { code: 'QUOTA_UNAVAILABLE' }, origin);
  return json(503, { code: 'PODCAST_UNAVAILABLE' }, origin);
}

/** Strictly injected request boundary. The default Worker never instantiates it. */
export function createPodcastHttpRuntime(
  runtime: PodcastHttpRuntime,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const origin = request.headers.get('origin');
    if (!origin || !runtime.allowedOrigins.has(origin))
      return json(403, { code: 'ORIGIN_FORBIDDEN' });
    const path = new URL(request.url).pathname;
    if (request.method === 'OPTIONS' && path === '/v1/podcasts') {
      if (
        request.headers.get('access-control-request-method') !== 'POST' ||
        request.headers.get('access-control-request-headers')?.toLowerCase() !== 'content-type'
      )
        return json(405, { code: 'PREFLIGHT_REJECTED' }, origin);
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'POST',
          'access-control-allow-headers': 'content-type',
          'access-control-max-age': '600',
          vary: 'Origin',
        },
      });
    }
    const audioToken = path.match(/^\/v1\/podcasts\/audio\/([A-Za-z0-9_-]{24,512})$/u)?.[1];
    if (request.method !== 'POST' && !(request.method === 'GET' && audioToken))
      return json(404, { code: 'NOT_FOUND' }, origin);
    if (!(await runtime.authenticator.authenticate(request)))
      return json(401, { code: 'AUTH_REQUIRED' }, origin);
    try {
      if (audioToken) {
        const audio = await runtime.privateAudio.read(audioToken, { signal: request.signal });
        if (!audio || audio.bytes.byteLength === 0 || audio.contentType !== 'audio/mpeg')
          return json(404, { code: 'AUDIO_NOT_FOUND' }, origin);
        const body = new Uint8Array(audio.bytes.byteLength);
        body.set(audio.bytes);
        return new Response(body.buffer, {
          status: 200,
          headers: {
            'content-type': 'audio/mpeg',
            'cache-control': 'private, no-store',
            'access-control-allow-origin': origin,
            vary: 'Origin',
          },
        });
      }
      if (
        request.headers.get('content-type')?.split(';', 1)[0]?.toLowerCase() !== 'application/json'
      )
        return json(415, { code: 'UNSUPPORTED_MEDIA_TYPE' }, origin);
      return await responseFor(
        await runtime.service.generate(await boundedJson(request), request.signal),
        origin,
        runtime.privateAudio,
        request.signal,
      );
    } catch {
      return json(400, { code: 'INVALID_REQUEST' }, origin);
    }
  };
}
