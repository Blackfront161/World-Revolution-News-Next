import { afterEach, describe, expect, it, vi } from 'vitest';

describe('bounded transport and cancellation', () => {
  it('the 5s request watchdog cancels a normal ReadableStream body', async () => {
    vi.useFakeTimers();
    let cancelled = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            new ReadableStream<Uint8Array>(
              {
                pull() {},
                cancel() {
                  cancelled++;
                },
              },
              { highWaterMark: 0 },
            ),
            { headers: { 'content-type': 'application/json' } },
          ),
      ),
    );
    const promise = loadLocalContentRelease(new AbortController().signal).catch(() => 'failed');
    await vi.advanceTimersByTimeAsync(5001);
    expect(await promise).toBe('failed');
    expect(cancelled).toBe(1);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  it.each(['-1', 'NaN', '1.5', '524289', '', '1e3', '0x20', '+2'])(
    'rejects nondecimal/invalid Content-Length %s before reading and cancels the body',
    async (length) => {
      let pulls = 0;
      let cancels = 0;
      const stream = new ReadableStream<Uint8Array>(
        {
          pull() {
            pulls++;
          },
          cancel() {
            cancels++;
          },
        },
        { highWaterMark: 0 },
      );
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(stream, {
              headers: { 'content-type': 'application/json', 'content-length': length },
            }),
        ),
      );
      await expect(loadLocalContentRelease(new AbortController().signal)).rejects.toThrow();
      expect(pulls).toBe(0);
      expect(cancels).toBe(1);
    },
  );
  it.each([-1, 1])('rejects actual length different from declared length by %s', async (delta) => {
    const body = JSON.stringify(descriptor);
    const declared = new TextEncoder().encode(body).length + delta;
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        calls.push(path);
        return new Response(body, {
          headers: { 'content-type': 'application/json', 'content-length': String(declared) },
        });
      }),
    );
    await expect(loadLocalContentRelease(new AbortController().signal)).rejects.toThrow();
    expect(calls).toEqual([descriptorPath]);
  });
  it.each([0, 1])('bounds a multichunk no-length descriptor at 512 KiB + %s', async (extra) => {
    const raw = JSON.stringify(descriptor);
    const bytes = new TextEncoder().encode(
      raw + ' '.repeat(524288 + extra - new TextEncoder().encode(raw).length),
    );
    let offset = 0;
    let pulls = 0;
    let cancels = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        if (path !== descriptorPath) return jsonResponse(releaseDocuments[path]);
        return new Response(
          new ReadableStream<Uint8Array>(
            {
              pull(controller) {
                pulls++;
                if (offset === bytes.length) {
                  controller.close();
                  return;
                }
                const next = Math.min(offset + 65536, bytes.length);
                controller.enqueue(bytes.slice(offset, next));
                offset = next;
              },
              cancel() {
                cancels++;
              },
            },
            { highWaterMark: 0 },
          ),
          { headers: { 'content-type': 'application/json' } },
        );
      }),
    );
    if (extra === 0) {
      await expect(loadLocalContentRelease(new AbortController().signal)).resolves.toHaveProperty(
        'ready',
      );
      expect(cancels).toBe(0);
      expect(pulls).toBe(9);
    } else {
      await expect(loadLocalContentRelease(new AbortController().signal)).rejects.toThrow();
      expect(cancels).toBe(1);
      expect(pulls).toBe(9);
    }
    expect(offset).toBe(524288 + extra);
  });
  it('accepts a decimal integer length with leading zeroes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        const value = JSON.stringify(releaseDocuments[path]);
        return new Response(value, {
          headers: {
            'content-type': 'application/json',
            'content-length': '00' + new TextEncoder().encode(value).length,
          },
        });
      }),
    );
    await expect(loadLocalContentRelease(new AbortController().signal)).resolves.toHaveProperty(
      'ready',
    );
  });
  it('hard-bounds a fetch ignoring the 5s signal and cancels a late response', async () => {
    vi.useFakeTimers();
    let resolve!: (response: Response) => void;
    let cancels = 0;
    const requestSignals: AbortSignal[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((_path: string, options: RequestInit) => {
        requestSignals.push(options.signal as AbortSignal);
        return new Promise<Response>((done) => {
          resolve = done;
        });
      }),
    );
    const promise = loadLocalContentRelease(new AbortController().signal).catch(() => 'failed');
    await vi.advanceTimersByTimeAsync(5001);
    expect(await promise).toBe('failed');
    expect(requestSignals[0]?.aborted).toBe(true);
    resolve(
      new Response(
        new ReadableStream({
          cancel() {
            cancels++;
          },
        }),
      ),
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(cancels).toBe(1);
    expect(requestSignals).toHaveLength(1);
  });
  it('hard-bounds a reader and cancel promise that both ignore abort', async () => {
    vi.useFakeTimers();
    let cancels = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            status: 200,
            redirected: false,
            headers: new Headers({ 'content-type': 'application/json' }),
            body: {
              getReader: () => ({
                read: () => new Promise(() => undefined),
                cancel: () => {
                  cancels++;
                  return new Promise(() => undefined);
                },
                releaseLock: () => undefined,
              }),
              cancel: () => Promise.resolve(),
            },
          }) as unknown as Response,
      ),
    );
    const promise = loadLocalContentRelease(new AbortController().signal).catch(() => 'failed');
    await vi.advanceTimersByTimeAsync(5001);
    expect(await promise).toBe('failed');
    expect(cancels).toBeGreaterThan(0);
  });
  it('caller abort cancels a normal body and settles before the request deadline', async () => {
    let cancel = 0;
    let started!: () => void;
    const seen = new Promise<void>((resolve) => {
      started = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            new ReadableStream<Uint8Array>(
              {
                pull() {
                  started();
                },
                cancel() {
                  cancel++;
                },
              },
              { highWaterMark: 0 },
            ),
            { headers: { 'content-type': 'application/json' } },
          ),
      ),
    );
    const abort = new AbortController();
    const promise = loadLocalContentRelease(abort.signal).catch(() => 'failed');
    await seen;
    abort.abort();
    expect(await promise).toBe('failed');
    expect(cancel).toBe(1);
  });
  it('pre-abort performs zero requests', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const abort = new AbortController();
    abort.abort();
    await expect(loadLocalContentRelease(abort.signal)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});

import {
  localContentReleaseBasePath,
  localContentReleaseResourcePaths,
} from '@wrn/content-contracts';
import descriptor from '../public/wrn-local-release/v1/release-descriptor.json';
import manifest from '../public/wrn-local-release/v1/manifest.json';
import articles from '../public/wrn-local-release/v1/articles.json';
import supplementalItems from '../public/wrn-local-release/v1/supplemental-items.json';
import discoverIndex from '../public/wrn-local-release/v1/discover-index.json';
import readerDetails from '../public/wrn-local-release/v1/reader-details.json';
import archiveLifecycle from '../public/wrn-local-release/v1/archive-lifecycle.json';
import websitePublication from '../public/wrn-local-release/v1/website-publication.json';
import {
  checkLocalContentReleaseForOffline,
  loadLocalContentRelease,
} from './local-content-release';

const descriptorPath = `${localContentReleaseBasePath}/release-descriptor.json`;
const manifestPath = localContentReleaseResourcePaths.manifest;
const payloadPaths = Object.entries(localContentReleaseResourcePaths)
  .filter(([id]) => id !== 'manifest')
  .map(([, path]) => path);

const releaseDocuments: Readonly<Record<string, unknown>> = Object.freeze({
  [descriptorPath]: descriptor,
  [manifestPath]: manifest,
  [localContentReleaseResourcePaths.articles]: articles,
  [localContentReleaseResourcePaths['supplemental-items']]: supplementalItems,
  [localContentReleaseResourcePaths['discover-index']]: discoverIndex,
  [localContentReleaseResourcePaths['reader-details']]: readerDetails,
  [localContentReleaseResourcePaths['archive-lifecycle']]: archiveLifecycle,
  [localContentReleaseResourcePaths['website-publication']]: websitePublication,
});

function jsonResponse(value: unknown, status = 200): Response {
  const body = JSON.stringify(value);
  return new Response(body, {
    status,
    headers: {
      'content-type': 'application/json',
      'content-length': String(new TextEncoder().encode(body).byteLength),
    },
  });
}

function installFetch(documents: Readonly<Record<string, unknown>>): string[] {
  const requestedPaths: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const path = new URL(
        typeof input === 'string' ? input : input.toString(),
        'https://wrn.local',
      ).pathname;
      requestedPaths.push(path);
      const document = documents[path];
      return document === undefined ? jsonResponse({}, 404) : jsonResponse(document);
    }),
  );
  return requestedPaths;
}

async function expectRejectedBeforePayloads(
  documents: Readonly<Record<string, unknown>>,
  expectedRequests: readonly string[],
): Promise<void> {
  const requestedPaths = installFetch(documents);
  await expect(loadLocalContentRelease(new AbortController().signal)).rejects.toThrow(
    'Lokale Inhaltsrevision konnte nicht sicher geladen werden.',
  );
  expect(requestedPaths).toEqual(expectedRequests);
  expect(requestedPaths.filter((path) => payloadPaths.includes(path))).toEqual([]);
}

it('fails closed when a response has no readable stream', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        ({
          status: 200,
          redirected: false,
          headers: new Headers({ 'content-type': 'application/json', 'content-length': '2' }),
          body: null,
          arrayBuffer: async () => {
            throw new Error('arrayBuffer must not be used');
          },
        }) as unknown as Response,
    ),
  );
  await expect(loadLocalContentRelease(new AbortController().signal)).rejects.toThrow(
    'Lokale Inhaltsrevision konnte nicht sicher geladen werden.',
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mobile local content release preflight', () => {
  it('does not request manifest or payloads for an invalid descriptor', async () => {
    await expectRejectedBeforePayloads({ ...releaseDocuments, [descriptorPath]: {} }, [
      descriptorPath,
    ]);
  });

  it('does not request manifest or payloads for unsupported descriptor compatibility', async () => {
    await expectRejectedBeforePayloads(
      {
        ...releaseDocuments,
        [descriptorPath]: {
          ...descriptor,
          compatibility: {
            minManifestContractVersion: '2.0.0',
            maxManifestContractVersion: '2.0.0',
          },
        },
      },
      [descriptorPath],
    );
  });

  it('does not request payloads after a manifest revision mismatch', async () => {
    await expectRejectedBeforePayloads(
      {
        ...releaseDocuments,
        [manifestPath]: { ...manifest, revision: 'unexpected-manifest-revision' },
      },
      [descriptorPath, manifestPath],
    );
  });

  it('does not request payloads after a manifest hash mismatch', async () => {
    const changedSourceCommit = '1111111111111111111111111111111111111111';
    await expectRejectedBeforePayloads(
      {
        ...releaseDocuments,
        [manifestPath]: {
          ...manifest,
          sourceCommit: changedSourceCommit,
          provenance: { ...manifest.provenance, fixtureSeedCommit: changedSourceCommit },
        },
      },
      [descriptorPath, manifestPath],
    );
  });

  it('requests the fixed payload allowlist only after the descriptor and manifest preflight passes', async () => {
    const requestedPaths = installFetch(releaseDocuments);

    await expect(loadLocalContentRelease(new AbortController().signal)).resolves.toMatchObject({
      ready: { manifest: { revision: manifest.revision } },
    });

    expect(requestedPaths.slice(0, 2)).toEqual([descriptorPath, manifestPath]);
    expect(requestedPaths).toHaveLength(2 + payloadPaths.length);
    expect(new Set(requestedPaths.slice(2))).toEqual(new Set(payloadPaths));
  });

  it('retains verified safety when a transport-valid supplemental body has the wrong hash', async () => {
    installFetch({
      ...releaseDocuments,
      [localContentReleaseResourcePaths['supplemental-items']]: {
        ...supplementalItems,
        revision: 'wrn-test-supplemental-hash-mismatch',
      },
    });
    await expect(
      checkLocalContentReleaseForOffline(new AbortController().signal, { floor: 0, entries: [] }),
    ).resolves.toMatchObject({
      kind: 'failed',
      safety: { floor: 1, entries: [{ id: 'wrn-test-art-g3-012-revoked', status: 'blocked' }] },
    });
  });

  it('returns independently verified safety evidence when supplemental content fails first', async () => {
    installFetch({
      ...releaseDocuments,
      [localContentReleaseResourcePaths['supplemental-items']]: undefined,
    });

    await expect(
      checkLocalContentReleaseForOffline(new AbortController().signal, {
        floor: 0,
        entries: [],
      }),
    ).resolves.toMatchObject({
      kind: 'failed',
      safety: { floor: 1, entries: [{ id: 'wrn-test-art-g3-012-revoked', status: 'blocked' }] },
    });
  });
});
