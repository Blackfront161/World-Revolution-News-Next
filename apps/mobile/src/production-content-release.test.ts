import { afterEach, expect, it, vi } from 'vitest';
import {
  canonicalJson,
  createValidatedProductionContentReleaseV1,
  sha256Utf8,
} from '@wrn/content-contracts';
import { makeCapacityTestPacket } from './production-capacity-test-data';
import { makeProductionOfflinePacket } from '../../../tests/e2e/production-content-offline-harness';
import { createProductionContentSourceV1 } from './production-content-release';
import { fetchBoundedSameOriginJson } from '../../../packages/browser-content/src/content-release-transport-core';

afterEach(() => vi.unstubAllGlobals());

it.each([1, 2, 3] as const)(
  'loads valid V%s through the compatible source with exact version-specific bounds',
  async (version) => {
    const { input, ready, packet } = await makeCapacityTestPacket({
      version,
      ...(version === 3 ? { readerBytes: 600 * 1024 } : {}),
    });
    expect(ready.articleIds).toHaveLength(version === 3 ? 6 : 2);
    if (version === 3) expect(await createValidatedProductionContentReleaseV1(input)).toBeNull();
    const calls: { url: string; cap: number }[] = [];
    const transport = async (url: string, _signal: AbortSignal, cap: number) => {
      calls.push({ url, cap });
      if (!packet.has(url)) throw Error('Unexpected source request');
      return structuredClone(packet.get(url));
    };
    const source = createProductionContentSourceV1(transport, 'bundled-v1');
    const signal = new AbortController().signal;
    const safety = await source.verifySafety(signal, { revision: 0, revokedIds: [] });
    expect(safety.kind).toBe('verified');
    expect(calls).toHaveLength(4);
    if (safety.kind !== 'verified') throw Error('Missing safety');
    const completed = await source.completeRelease(safety.receipt, signal, safety.safety);
    expect(completed.kind).toBe('ready');
    expect(calls.map((call) => call.cap)).toEqual(
      version === 3
        ? [32, 128, 256, 128, 384, 384, 128, 2816].map((kib) => kib * 1024)
        : [32, 128, 256, 256, 512, 512, 512, 512].map((kib) => kib * 1024),
    );
    expect(calls.map((call) => call.url)).toEqual([...packet.keys()]);
  },
);

it('refuses unknown descriptors before manifest or any payload even with a matching pointer hash', async () => {
  const { packet } = await makeCapacityTestPacket();
  const [pointerUrl, descriptorUrl] = [...packet.keys()];
  const descriptor = {
    ...(packet.get(descriptorUrl!) as object),
    contractVersion: '4.0.0',
    schema: 'wrn.production-content-release-descriptor.v4',
  };
  packet.set(descriptorUrl!, descriptor);
  packet.set(pointerUrl!, {
    ...(packet.get(pointerUrl!) as object),
    descriptorSha256: await sha256Utf8(canonicalJson(descriptor)),
  });
  const transport = vi.fn(async (url: string) => structuredClone(packet.get(url)));
  const source = createProductionContentSourceV1(transport, 'bundled-v1');
  await expect(
    source.verifySafety(new AbortController().signal, { revision: 0, revokedIds: [] }),
  ).resolves.toEqual({ kind: 'failed', safety: null });
  expect(transport.mock.calls.map(([url]) => url)).toEqual([pointerUrl, descriptorUrl]);
});

it('bounds an actual V3 reader stream at the exact cap and refuses one extra byte before JSON parsing', async () => {
  const { packet } = await makeCapacityTestPacket({ readerBytes: 2816 * 1024 });
  let extra = false;
  const calls: string[] = [];
  const responseJson = vi.fn();
  vi.stubGlobal('fetch', async (url: string | URL | Request) => {
    const pathname =
      typeof url === 'string'
        ? new URL(url, 'http://localhost').pathname
        : new URL(url instanceof URL ? url.href : url.url).pathname;
    calls.push(pathname);
    const value = packet.get(pathname);
    if (!value) throw Error('Unexpected endpoint');
    const bytes =
      canonicalJson(value) + (extra && pathname.endsWith('/reader-details.json') ? ' ' : '');
    const response = new Response(bytes, { headers: { 'Content-Type': 'application/json' } });
    Object.defineProperty(response, 'json', { value: responseJson });
    return response;
  });
  const source = createProductionContentSourceV1(fetchBoundedSameOriginJson, 'bundled-v1');
  const signal = new AbortController().signal;
  const safety = await source.verifySafety(signal, { revision: 0, revokedIds: [] });
  expect(safety.kind).toBe('verified');
  if (safety.kind !== 'verified') throw Error('Missing safety');
  expect((await source.completeRelease(safety.receipt, signal, safety.safety)).kind).toBe('ready');
  extra = true;
  const parse = vi.spyOn(JSON, 'parse');
  expect((await source.completeRelease(safety.receipt, signal, safety.safety)).kind).toBe('failed');
  expect(
    parse.mock.calls.some(([text]) => typeof text === 'string' && text.length >= 2816 * 1024),
  ).toBe(false);
  parse.mockRestore();
  expect(responseJson).not.toHaveBeenCalled();
  expect(calls.every((url) => packet.has(url))).toBe(true);
});

it('keeps both phases on the captured source and immutable receipt when current advances', async () => {
  const first = await makeProductionOfflinePacket({ sequence: 1 });
  const second = await makeProductionOfflinePacket({ sequence: 2 });
  let current = first;
  const transport = vi.fn(async (path: string) => {
    const value = path.endsWith('/current.json') ? current.get(path) : first.get(path);
    if (value === undefined) throw new Error('unexpected resource');
    return structuredClone(value);
  });
  const otherTransport = vi.fn(async () => {
    throw new Error('other source must stay unused');
  });
  const firstSource = createProductionContentSourceV1(transport, 'bundled-v1');
  createProductionContentSourceV1(otherTransport, 'solinaridao-static-v1');
  const signal = new AbortController().signal;
  const safety = await firstSource.verifySafety(signal, { revision: 0, revokedIds: [] });
  expect(safety.kind).toBe('verified');
  expect(transport.mock.calls.map(([url]) => url)).toEqual([...first.keys()].slice(0, 4));
  if (safety.kind !== 'verified') throw new Error('missing safety');
  expect(Object.isFrozen(safety.receipt)).toBe(true);
  current = second;
  const ready = await firstSource.completeRelease(safety.receipt, signal, safety.safety);
  expect(ready.kind).toBe('ready');
  if (ready.kind !== 'ready') throw new Error('missing ready');
  expect(ready.runtime.descriptor.sequence).toBe(1);
  expect(transport.mock.calls.map(([url]) => url)).toEqual([...first.keys()]);
  expect(otherTransport).not.toHaveBeenCalled();
});
