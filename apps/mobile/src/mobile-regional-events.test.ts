import { describe, expect, it, vi } from 'vitest';
import fixture from '../public/wrn-mobile-regional-events/v1/mobile-regional-events.json';
import rawFixture from '../public/wrn-mobile-regional-events/v1/mobile-regional-events.json?raw';
import type { RegionalEventBundleV1 } from '@wrn/content-contracts/mobile-regional-events-v1';
import {
  loadMobileRegionalEvents,
  mobileRegionalEventsBuildPin,
  projectMobileRegionalEvents,
} from './mobile-regional-events';
import { mobileRegionalEventsMaxTransportBytes } from '@wrn/content-contracts/mobile-regional-events-v1';

describe('regional events loader and pure projection', () => {
  it('does not request with a malformed pin and admits the pinned local fixture', async () => {
    const noRequest = vi.fn();
    await expect(
      loadMobileRegionalEvents(
        new AbortController().signal,
        { ...mobileRegionalEventsBuildPin, path: '/wrong' as never },
        noRequest as never,
      ),
    ).resolves.toEqual({ kind: 'no-request' });
    const request = vi.fn(async () => new Response(rawFixture));
    await expect(
      loadMobileRegionalEvents(
        new AbortController().signal,
        mobileRegionalEventsBuildPin,
        request as never,
      ),
    ).resolves.toMatchObject({ kind: 'ready' });
    expect(request).toHaveBeenCalledOnce();
  });
  it('does not request for any non-identical runtime pin and rejects BOM or invalid UTF-8 bytes', async () => {
    const request = vi.fn();
    await expect(
      loadMobileRegionalEvents(
        new AbortController().signal,
        { ...mobileRegionalEventsBuildPin, extra: true },
        request as never,
      ),
    ).resolves.toEqual({ kind: 'no-request' });
    await expect(
      loadMobileRegionalEvents(
        new AbortController().signal,
        { ...mobileRegionalEventsBuildPin, transportSha256: '0'.repeat(64) },
        request as never,
      ),
    ).resolves.toEqual({ kind: 'no-request' });
    expect(request).not.toHaveBeenCalled();
    const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(rawFixture)]);
    await expect(
      loadMobileRegionalEvents(
        new AbortController().signal,
        mobileRegionalEventsBuildPin,
        vi.fn(async () => new Response(bom)) as never,
      ),
    ).resolves.toEqual({ kind: 'invalid' });
    await expect(
      loadMobileRegionalEvents(
        new AbortController().signal,
        mobileRegionalEventsBuildPin,
        vi.fn(async () => new Response(new Uint8Array([0xc3, 0x28]))) as never,
      ),
    ).resolves.toEqual({ kind: 'invalid' });
  });
  it('keeps the no-selection and stale precedence honest', () => {
    const bundle = fixture as unknown as RegionalEventBundleV1;
    expect(
      projectMobileRegionalEvents({
        bundle,
        regionId: null,
        safety: [],
        referenceInstant: '2026-09-01T00:00:00.000Z',
        online: true,
      }).contentStatus,
    ).toBe('empty');
    expect(
      projectMobileRegionalEvents({
        bundle,
        regionId: 'wrn-region-test',
        safety: [],
        referenceInstant: '2026-09-03T00:00:00.000Z',
        online: true,
      }).contentStatus,
    ).toBe('stale');
  });

  it('covers HTTP, abort, chunked-stream and transport-cap loader failures explicitly', async () => {
    const request = (response: Response) => vi.fn(async () => response);
    await expect(
      loadMobileRegionalEvents(
        new AbortController().signal,
        mobileRegionalEventsBuildPin,
        request(new Response('', { status: 503 })) as never,
      ),
    ).resolves.toEqual({ kind: 'invalid' });
    const controller = new AbortController();
    controller.abort();
    await expect(
      loadMobileRegionalEvents(
        controller.signal,
        mobileRegionalEventsBuildPin,
        request(new Response(rawFixture)) as never,
      ),
    ).resolves.toEqual({ kind: 'invalid' });
    const chunks = new ReadableStream<Uint8Array>({
      start(controller) {
        const bytes = new TextEncoder().encode(rawFixture);
        controller.enqueue(bytes.slice(0, 7));
        controller.enqueue(bytes.slice(7));
        controller.close();
      },
    });
    await expect(
      loadMobileRegionalEvents(
        new AbortController().signal,
        mobileRegionalEventsBuildPin,
        request(new Response(chunks)) as never,
      ),
    ).resolves.toMatchObject({ kind: 'ready' });
    const oversized = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(mobileRegionalEventsMaxTransportBytes + 1));
        controller.close();
      },
    });
    await expect(
      loadMobileRegionalEvents(
        new AbortController().signal,
        mobileRegionalEventsBuildPin,
        request(new Response(oversized)) as never,
      ),
    ).resolves.toEqual({ kind: 'invalid' });
  });

  it('keeps network errors and exact pin mismatch fail-closed without a request', async () => {
    const request = vi.fn(async () => {
      throw new TypeError('offline');
    });
    await expect(
      loadMobileRegionalEvents(
        new AbortController().signal,
        mobileRegionalEventsBuildPin,
        request as never,
      ),
    ).resolves.toEqual({ kind: 'network-error' });
    await expect(
      loadMobileRegionalEvents(
        new AbortController().signal,
        { ...mobileRegionalEventsBuildPin, taxonomyRevision: 2 },
        request as never,
      ),
    ).resolves.toEqual({ kind: 'no-request' });
    expect(request).toHaveBeenCalledOnce();
  });
});
