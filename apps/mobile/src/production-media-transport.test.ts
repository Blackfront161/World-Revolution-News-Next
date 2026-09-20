import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createProductionMediaRawTransport,
  type ProductionMediaTransportSession,
} from '../../../packages/browser-content/src/production-media-transport';
const origin = 'https://metadata.invalid';
const pointer = '/content/media/v1/current.json';
const releasePath = (name: string, revision = 'release-1') =>
  `/content/media/v1/releases/${revision}/${name}.json`;
const sessions: ProductionMediaTransportSession[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});
afterEach(() => {
  sessions.splice(0).forEach((s) => s.close());
  vi.useRealTimers();
});
function response(body: string | Uint8Array = '{}', headers: Record<string, string> = {}) {
  return new Response(typeof body === 'string' ? body : new Uint8Array(body), {
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
function setup(request = vi.fn<typeof fetch>(async () => response())) {
  const caller = new AbortController();
  const transport = createProductionMediaRawTransport(origin, { fetch: request });
  const session = transport.begin(caller.signal);
  sessions.push(session);
  return { caller, transport, session, request };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const observed = <T>(promise: Promise<T>) =>
  promise.then(
    (value) => ({ value }),
    (error) => ({ error: error.code }),
  );

describe('raw production media metadata transport', () => {
  for (const failure of ['throw', 'nonfinite'] as const) {
    it.each([1, 2, 3, 6])(
      'normalizes ' + failure + ' at clock call%d and makes failure terminal',
      async (at) => {
        const privateError = new Error('private clock detail');
        let calls = 0;
        const clock = () => {
          if (++calls === at) {
            if (failure === 'throw') throw privateError;
            return NaN;
          }
          return 0;
        };
        const request = vi.fn(async () => response());
        const transport = createProductionMediaRawTransport(origin, { now: clock, fetch: request });
        let session: ProductionMediaTransportSession | undefined;
        let failureValue: unknown;
        try {
          session = transport.begin(new AbortController().signal);
          sessions.push(session);
          await session.read(pointer, 16384);
        } catch (error) {
          failureValue = error;
        }
        expect(failureValue).toMatchObject({
          code: 'timeout',
          message: 'Production media transport: timeout',
        });
        expect(failureValue).not.toBe(privateError);
        if (at === 1) expect(session).toBeUndefined();
        else {
          expect(session!.signal.aborted).toBe(true);
          await expect(session!.read(releasePath('manifest'), 131072)).rejects.toBe(failureValue);
          const work = vi.fn(async () => 'should not start');
          await expect(session!.wait(work)).rejects.toBe(failureValue);
          expect(work).not.toHaveBeenCalled();
        }
        expect(request).toHaveBeenCalledTimes(at < 6 ? 0 : 1);
      },
    );
  }
  it('honours a reentrant close from the clock before requesting a resource', async () => {
    let calls = 0;
    const request = vi.fn(async () => response());
    const transport = createProductionMediaRawTransport(origin, {
      fetch: request,
      now: () => {
        if (++calls === 2) session.close();
        return 0;
      },
    });
    const session = transport.begin(new AbortController().signal);
    sessions.push(session);
    await expect(session.read(pointer, 16384)).rejects.toMatchObject({ code: 'closed' });
    expect(request).not.toHaveBeenCalled();
  });
  it('preserves Unicode and raw whitespace, returns detached bytes and exact private fetch options', async () => {
    const raw = '{ "title": "🎙️例" }\n  ';
    const h = setup(vi.fn(async () => response(raw)));
    const result = await h.session.read(pointer, 16384);
    expect(result).toEqual({ rawText: raw, byteLength: new TextEncoder().encode(raw).length });
    expect(Object.isFrozen(result)).toBe(true);
    expect(h.request).toHaveBeenCalledExactlyOnceWith(origin + pointer, {
      signal: expect.any(AbortSignal),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      headers: { Accept: 'application/json' },
    });
  });
  it.each([
    'http://metadata.invalid',
    'https://metadata.invalid/',
    'https://METADATA.invalid',
    'https://user:pass@metadata.invalid',
    'https://metadata.invalid/path',
    'https://metadata.invalid?x=1',
  ])('rejects noncanonical compiled origin %s', (value) => {
    expect(() => createProductionMediaRawTransport(value)).toThrow('origin');
  });
  it.each([
    '/wrn-production-content/current.json',
    '//evil.invalid/content/media/v1/current.json',
    '/content/media/v1/current.json?x=1',
    '/content/media/v1/releases/../manifest.json',
    '/content/media/v1/releases/%2e/manifest.json',
    '/content/media/v1/releases/release-1/audio.mp3',
    '/content/media/v1/releases/release-1/other.json',
  ])('refuses non-media path %s without a request', async (path) => {
    const h = setup();
    await expect(h.session.read(path, 100)).rejects.toMatchObject({ code: 'origin' });
    expect(h.request).not.toHaveBeenCalled();
  });
  it.each([0, -1, NaN, Infinity, 16385])(
    'refuses invalid requested pointer cap %s',
    async (cap) => {
      const h = setup();
      await expect(h.session.read(pointer, cap)).rejects.toMatchObject({ code: 'bytes' });
      expect(h.request).not.toHaveBeenCalled();
    },
  );
  for (const [path, cap] of [
    [pointer, 16384],
    [releasePath('descriptor'), 32768],
    [releasePath('manifest'), 131072],
  ] as const) {
    it.each([-1, 0, 1])(`bounds ${path} actual bytes at cap%+d`, async (delta) => {
      const h = setup(vi.fn(async () => response(' '.repeat(cap + delta))));
      const result = await observed(h.session.read(path, cap));
      if (delta > 0) expect(result).toEqual({ error: 'bytes' });
      else expect(result).toMatchObject({ value: { byteLength: cap + delta } });
    });
  }
  it.each([2999, 3000, 3001])(
    'bounds headers at %dms including clock jump before queued timer',
    async (elapsed) => {
      const head = deferred<Response>(),
        h = setup(vi.fn(() => head.promise));
      const result = observed(h.session.read(pointer, 16384));
      vi.setSystemTime(elapsed);
      head.resolve(response());
      expect(await result).toEqual(
        elapsed < 3000 ? { value: { rawText: '{}', byteLength: 2 } } : { error: 'timeout' },
      );
    },
  );
  it('cancels a response arriving after an uncooperative header timeout', async () => {
    const head = deferred<Response>(),
      cancel = vi.fn();
    const h = setup(vi.fn(() => head.promise)),
      result = observed(h.session.read(pointer, 16384));
    await vi.advanceTimersByTimeAsync(3000);
    expect(await result).toEqual({ error: 'timeout' });
    head.resolve(
      new Response(new ReadableStream({ cancel }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(cancel).toHaveBeenCalledTimes(1);
  });
  it.each([11999, 12000, 12001])(
    'bounds sequential session work at %dms without resetting total deadline',
    async (elapsed) => {
      const h = setup();
      await h.session.read(pointer, 16384);
      vi.setSystemTime(elapsed);
      const work = vi.fn(async () => 'finished');
      const result = await observed(h.session.wait(work));
      expect(result).toEqual(elapsed < 12000 ? { value: 'finished' } : { error: 'timeout' });
      expect(work).toHaveBeenCalledTimes(elapsed < 12000 ? 1 : 0);
    },
  );
  it('does not give a late second request a fresh12seconds', async () => {
    const h = setup();
    await h.session.read(pointer, 16384);
    await vi.advanceTimersByTimeAsync(11000);
    h.request.mockImplementationOnce(
      async () =>
        new Response(new ReadableStream(), { headers: { 'Content-Type': 'application/json' } }),
    );
    const result = observed(h.session.read(releasePath('descriptor'), 32768));
    await vi.advanceTimersByTimeAsync(999);
    expect(h.session.signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toEqual({ error: 'timeout' });
  });
  it('settles a noncooperative caller wait on timeout and observes its late rejection', async () => {
    const h = setup(),
      task = deferred<string>();
    const result = observed(h.session.wait(() => task.promise));
    await vi.advanceTimersByTimeAsync(12000);
    expect(await result).toEqual({ error: 'timeout' });
    task.reject(Error('late'));
    await vi.advanceTimersByTimeAsync(0);
  });
  it.each(['headers', 'body', 'wait'] as const)(
    'propagates caller abort during %s',
    async (phase) => {
      const head = deferred<Response>(),
        cancel = vi.fn();
      const h = setup(
        vi.fn(
          phase === 'headers'
            ? () => head.promise
            : async () =>
                new Response(new ReadableStream({ cancel }), {
                  headers: { 'Content-Type': 'application/json' },
                }),
        ),
      );
      const result = observed(
        phase === 'wait'
          ? h.session.wait(() => new Promise(() => {}))
          : h.session.read(pointer, 16384),
      );
      await vi.advanceTimersByTimeAsync(0);
      h.caller.abort();
      expect(await result).toEqual({ error: 'aborted' });
      expect(h.session.signal.aborted).toBe(true);
      if (phase === 'body') expect(cancel).toHaveBeenCalledTimes(1);
      if (phase === 'headers') {
        head.resolve(response());
        await vi.advanceTimersByTimeAsync(0);
      }
    },
  );
  it('does not await a stalled cancellation promise', async () => {
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const h = setup(
      vi.fn(
        async () =>
          new Response(new ReadableStream({ cancel }), {
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );
    const result = observed(h.session.read(pointer, 16384));
    await vi.advanceTimersByTimeAsync(12000);
    expect(await result).toEqual({ error: 'timeout' });
    expect(cancel).toHaveBeenCalledTimes(1);
  });
  it.each([302, 500, 204])('rejects HTTP%d and cancels the whole session', async (status) => {
    const h = setup(
      vi.fn(
        async () =>
          new Response(status === 204 ? null : '{}', {
            status,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );
    await expect(h.session.read(pointer, 16384)).rejects.toMatchObject({ code: 'response' });
    expect(h.session.signal.aborted).toBe(true);
  });
  it('refuses a redirected response and aborts the request signal', async () => {
    const r = response();
    Object.defineProperty(r, 'redirected', { value: true });
    const h = setup(vi.fn(async () => r));
    await expect(h.session.read(pointer, 16384)).rejects.toMatchObject({ code: 'response' });
    expect(h.request.mock.calls[0]![1]!.signal!.aborted).toBe(true);
  });
  it.each(['text/html', 'text/plain', 'application/problem+json'])(
    'refuses MIME %s',
    async (mime) => {
      const h = setup(vi.fn(async () => response('{}', { 'Content-Type': mime })));
      await expect(h.session.read(pointer, 16384)).rejects.toMatchObject({ code: 'mime' });
    },
  );
  it.each(['1', '3', '-1', 'NaN', '16385'])(
    'rejects mismatched or invalid Content-Length %s',
    async (length) => {
      const h = setup(vi.fn(async () => response('{}', { 'Content-Length': length })));
      await expect(h.session.read(pointer, 16384)).rejects.toMatchObject({ code: 'bytes' });
    },
  );
  it('accepts exact length and treats encoded transfer length separately from decoded bytes', async () => {
    for (const headers of [
      { 'Content-Length': '2' },
      { 'Content-Length': '1', 'Content-Encoding': 'gzip' },
    ]) {
      const h = setup(vi.fn(async () => response('{}', headers)));
      await expect(h.session.read(pointer, 16384)).resolves.toEqual({
        rawText: '{}',
        byteLength: 2,
      });
    }
  });
  it.each([new Uint8Array([0xef, 0xbb, 0xbf, 123, 125]), new Uint8Array([0xc0, 0xaf])])(
    'rejects BOM or malformed UTF8',
    async (bytes) => {
      const h = setup(vi.fn(async () => response(bytes)));
      await expect(h.session.read(pointer, 16384)).rejects.toMatchObject({ code: 'utf8' });
    },
  );
  it('refuses empty bodies and body stream failures', async () => {
    const h = setup(vi.fn(async () => response('')));
    await expect(h.session.read(pointer, 16384)).rejects.toMatchObject({ code: 'bytes' });
    const bad = setup(
      vi.fn(
        async () =>
          new Response(
            new ReadableStream({
              start(c) {
                c.error(Error('private failure'));
              },
            }),
            { headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    );
    await expect(bad.session.read(pointer, 16384)).rejects.toMatchObject({ code: 'response' });
  });
  it('does not retry duplicate paths or permit an eighth request', async () => {
    const h = setup();
    await h.session.read(pointer, 16384);
    await expect(h.session.read(pointer, 16384)).rejects.toMatchObject({ code: 'bytes' });
    expect(h.request).toHaveBeenCalledTimes(1);
    const many = setup();
    for (let index = 0; index < 7; index++)
      await many.session.read(releasePath('manifest', 'release-' + index), 10);
    await expect(many.session.read(releasePath('manifest', 'release-8'), 10)).rejects.toMatchObject(
      { code: 'bytes' },
    );
    expect(many.request).toHaveBeenCalledTimes(7);
  });
  it.each([-1, 0, 1])(
    'bounds aggregate decoded bytes at311296%+d without hitting a per-file cap',
    async (delta) => {
      const sizes = [16384, 32768, 131072, 131070, 2 + delta];
      const h = setup(vi.fn(async () => response(' '.repeat(sizes.shift()!))));
      await h.session.read(pointer, 16384);
      await h.session.read(releasePath('descriptor'), 32768);
      await h.session.read(releasePath('revocation'), 131072);
      await h.session.read(releasePath('manifest'), 131072);
      const result = await observed(h.session.read(releasePath('admission'), 10));
      if (delta > 0) expect(result).toEqual({ error: 'bytes' });
      else expect(result).toMatchObject({ value: { byteLength: 2 + delta } });
    },
  );
  it('keeps independent sessions isolated and prevents work after explicit close/pre-abort', async () => {
    const first = setup(),
      second = setup();
    first.session.close();
    const work = vi.fn(async () => response());
    await expect(first.session.wait(work)).rejects.toMatchObject({ code: 'closed' });
    expect(work).not.toHaveBeenCalled();
    await expect(second.session.read(pointer, 10)).resolves.toMatchObject({ byteLength: 2 });
    const caller = new AbortController();
    caller.abort();
    const pre = second.transport.begin(caller.signal);
    sessions.push(pre);
    await expect(pre.read(pointer, 10)).rejects.toMatchObject({ code: 'aborted' });
  });
});
