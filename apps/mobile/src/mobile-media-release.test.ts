import { describe, expect, it, vi } from 'vitest';
import raw from '../public/wrn-mobile-media/v1/mobile-media-release.json?raw';
import manifest from '../public/wrn-mobile-media/v1/media-manifest.json?raw';
import admission from '../public/wrn-mobile-media/v1/media-admission.json?raw';
import rights from '../public/wrn-mobile-media/v1/media-rights.json?raw';
import consent from '../public/wrn-mobile-media/v1/media-consent.json?raw';
import lifecycle from '../public/wrn-mobile-media/v1/media-lifecycle.json?raw';
import revocation from '../public/wrn-mobile-media/v1/media-revocation.json?raw';
import {
  mobileMediaDocumentClasses,
  mobileMediaRuntimePaths,
} from '@wrn/content-contracts/mobile-media-v1';
import { loadMobileMediaRelease, mobileMediaBuildPin } from './mobile-media-release';

const clock = () => Date.parse('2026-09-01T12:00:00.000Z');
const fixtures: Record<string, string> = {
  '/wrn-mobile-media/v1/mobile-media-release.json': raw,
  '/wrn-mobile-media/v1/media-manifest.json': manifest,
  '/wrn-mobile-media/v1/media-admission.json': admission,
  '/wrn-mobile-media/v1/media-rights.json': rights,
  '/wrn-mobile-media/v1/media-consent.json': consent,
  '/wrn-mobile-media/v1/media-lifecycle.json': lifecycle,
  '/wrn-mobile-media/v1/media-revocation.json': revocation,
};
const localRequest = vi.fn(
  async (path: string) =>
    new Response(fixtures[path], {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    }),
);

describe('mobile media release loader', () => {
  it('does not request without the exact build pin', async () => {
    const request = vi.fn();
    await expect(
      loadMobileMediaRelease(
        new AbortController().signal,
        { ...mobileMediaBuildPin, path: '/bad' } as never,
        request as never,
        { clock },
      ),
    ).resolves.toEqual({ kind: 'no-request' });
    expect(request).not.toHaveBeenCalled();
  });

  it('rejects a mismatched root transport before document persistence', async () => {
    await expect(
      loadMobileMediaRelease(
        new AbortController().signal,
        mobileMediaBuildPin,
        vi.fn(
          async () => new Response(raw, { headers: { 'content-type': 'application/json' } }),
        ) as never,
        { clock },
      ),
    ).resolves.toEqual({ kind: 'invalid' });
  });

  it('loads only the complete pinned local contract set with the fixed clock', async () => {
    const request = vi.fn(localRequest);
    await expect(
      loadMobileMediaRelease(new AbortController().signal, mobileMediaBuildPin, request as never, {
        clock,
      }),
    ).resolves.toMatchObject({ kind: 'ready' });
    expect(request).toHaveBeenCalledTimes(7);
  });

  it('R4-R1-06 accepts the bound case-insensitive JSON MIME OWS forms', async () => {
    const request = vi.fn(
      async (path: string) =>
        new Response(fixtures[path], {
          headers: { 'content-type': 'APPLICATION/JSON\t;\tCHARSET\t=\tUTF-8' },
        }),
    );
    await expect(
      loadMobileMediaRelease(new AbortController().signal, mobileMediaBuildPin, request as never, {
        clock,
      }),
    ).resolves.toMatchObject({ kind: 'ready' });
    expect(request).toHaveBeenCalledTimes(7);
  });

  it('fails closed when the current-time probe reaches validUntil', async () => {
    await expect(
      loadMobileMediaRelease(
        new AbortController().signal,
        mobileMediaBuildPin,
        localRequest as never,
        {
          clock: () => Date.parse('2026-09-02T00:00:00.000Z'),
        },
      ),
    ).resolves.toEqual({ kind: 'invalid' });
  });

  it('owns a timeout even when a request ignores AbortSignal', async () => {
    const request = vi.fn(() => new Promise<Response>(() => undefined));
    await expect(
      loadMobileMediaRelease(new AbortController().signal, mobileMediaBuildPin, request as never, {
        clock,
        timeoutMs: 5,
      }),
    ).resolves.toEqual({ kind: 'network-error' });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['missing MIME', null],
    ['wrong MIME', 'text/json'],
    ['non-UTF8 JSON MIME', 'application/json; charset=iso-8859-1'],
    ['quoted charset', 'application/json; charset="utf-8"'],
    ['duplicate parameter', 'application/json; charset=utf-8; charset=utf-8'],
  ])('rejects %s before any unpinned document request', async (_name, contentType) => {
    const request = vi.fn(
      async () =>
        new Response(raw, {
          headers: contentType === null ? {} : { 'content-type': contentType },
        }),
    );
    await expect(
      loadMobileMediaRelease(new AbortController().signal, mobileMediaBuildPin, request as never, {
        clock,
      }),
    ).resolves.toEqual({ kind: 'invalid' });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['HTTP 206', 206, {}],
    ['HTTP 200 Content-Range', 200, { 'content-range': 'bytes 0-1/2' }],
  ])('R4-R2-06 rejects %s as invalid before document requests', async (_name, status, extra) => {
    const request = vi.fn(
      async () =>
        new Response(raw, {
          status,
          headers: { 'content-type': 'application/json', ...extra },
        }),
    );
    await expect(
      loadMobileMediaRelease(new AbortController().signal, mobileMediaBuildPin, request as never, {
        clock,
      }),
    ).resolves.toEqual({ kind: 'invalid' });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('caps a streamed root body before hashing or document requests', async () => {
    const request = vi.fn(
      async () =>
        new Response('x'.repeat(524289), {
          headers: { 'content-type': 'application/json; charset=utf-8' },
        }),
    );
    await expect(
      loadMobileMediaRelease(new AbortController().signal, mobileMediaBuildPin, request as never, {
        clock,
      }),
    ).resolves.toEqual({ kind: 'invalid' });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('R6 binds both valid release body-cap sides to the real digest order without a new pin', async () => {
    const equal = `${raw}${' '.repeat(524288 - new TextEncoder().encode(raw).byteLength)}`;
    const plus = `${equal} `;
    const equalRequest = vi.fn(
      async () =>
        new Response(equal, { headers: { 'content-type': 'application/json; charset=utf-8' } }),
    );
    const digest = vi.spyOn(crypto.subtle, 'digest');
    try {
      await expect(
        loadMobileMediaRelease(
          new AbortController().signal,
          mobileMediaBuildPin,
          equalRequest as never,
          { clock },
        ),
      ).resolves.toEqual({ kind: 'invalid' });
      expect(new TextEncoder().encode(equal)).toHaveLength(524288);
      expect(digest).toHaveBeenCalledTimes(1);
      expect(equalRequest).toHaveBeenCalledTimes(1);

      digest.mockClear();
      const plusRequest = vi.fn(
        async () =>
          new Response(plus, { headers: { 'content-type': 'application/json; charset=utf-8' } }),
      );
      await expect(
        loadMobileMediaRelease(
          new AbortController().signal,
          mobileMediaBuildPin,
          plusRequest as never,
          { clock },
        ),
      ).resolves.toEqual({ kind: 'invalid' });
      expect(new TextEncoder().encode(plus)).toHaveLength(524289);
      expect(digest).toHaveBeenCalledTimes(0);
      expect(plusRequest).toHaveBeenCalledTimes(1);
    } finally {
      digest.mockRestore();
    }
  });

  it('R5 maps both a fetch rejection and a body reader rejection to network-error', async () => {
    const fetchReject = vi.fn(async () => Promise.reject(new Error('fetch')));
    await expect(
      loadMobileMediaRelease(
        new AbortController().signal,
        mobileMediaBuildPin,
        fetchReject as never,
        {
          clock,
        },
      ),
    ).resolves.toEqual({ kind: 'network-error' });
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('reader'));
      },
    });
    const streamReject = vi.fn(
      async () =>
        new Response(stream, { headers: { 'content-type': 'application/json; charset=utf-8' } }),
    );
    await expect(
      loadMobileMediaRelease(
        new AbortController().signal,
        mobileMediaBuildPin,
        streamReject as never,
        {
          clock,
        },
      ),
    ).resolves.toEqual({ kind: 'network-error' });
    expect(fetchReject).toHaveBeenCalledTimes(1);
    expect(streamReject).toHaveBeenCalledTimes(1);
  });

  it.each(mobileMediaDocumentClasses)(
    'R4-R2-03 rejects an over-cap %s document through the loader product path',
    async (kind) => {
      const request = vi.fn(
        async (path: string) =>
          new Response(
            path === mobileMediaRuntimePaths[kind] ? 'x'.repeat(524289) : fixtures[path],
            {
              headers: { 'content-type': 'application/json' },
            },
          ),
      );
      await expect(
        loadMobileMediaRelease(
          new AbortController().signal,
          mobileMediaBuildPin,
          request as never,
          {
            clock,
          },
        ),
      ).resolves.toEqual({ kind: 'invalid' });
      expect(request).toHaveBeenCalledTimes(mobileMediaDocumentClasses.indexOf(kind) + 2);
    },
  );

  it('fails closed for an external abort before transport completion', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      loadMobileMediaRelease(controller.signal, mobileMediaBuildPin, localRequest as never, {
        clock,
      }),
    ).resolves.toEqual({ kind: 'network-error' });
  });

  it('settles immediately when an ignoring transport is externally aborted', async () => {
    const controller = new AbortController();
    const request = vi.fn(() => new Promise<Response>(() => undefined));
    const result = loadMobileMediaRelease(
      controller.signal,
      mobileMediaBuildPin,
      request as never,
      {
        clock,
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();
    await expect(result).resolves.toEqual({ kind: 'network-error' });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('R3 matrix 7 uses the product default 5000ms timeout boundary', async () => {
    vi.useFakeTimers();
    try {
      const request = vi.fn(() => new Promise<Response>(() => undefined));
      const result = loadMobileMediaRelease(
        new AbortController().signal,
        mobileMediaBuildPin,
        request as never,
        {
          clock,
        },
      );
      await vi.advanceTimersByTimeAsync(4999);
      expect(request).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      await expect(result).resolves.toEqual({ kind: 'network-error' });
    } finally {
      vi.useRealTimers();
    }
  });

  it.each(['resolve', 'reject'] as const)(
    'R3 matrix 7 ignores late transport %s after abort and removes both listeners once',
    async (settlement) => {
      const controller = new AbortController();
      const add = vi.spyOn(controller.signal, 'addEventListener');
      const remove = vi.spyOn(controller.signal, 'removeEventListener');
      let resolveTransport: (response: Response) => void = () => undefined;
      let rejectTransport: (reason: Error) => void = () => undefined;
      const request = vi.fn(
        () =>
          new Promise<Response>((resolve, reject) => {
            resolveTransport = resolve;
            rejectTransport = reject;
          }),
      );
      const result = loadMobileMediaRelease(
        controller.signal,
        mobileMediaBuildPin,
        request as never,
        {
          clock,
        },
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      controller.abort();
      await expect(result).resolves.toEqual({ kind: 'network-error' });
      if (settlement === 'resolve') resolveTransport(new Response('{}'));
      else rejectTransport(new Error('late'));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(add).toHaveBeenCalledTimes(2);
      expect(remove).toHaveBeenCalledTimes(2);
    },
  );
});
