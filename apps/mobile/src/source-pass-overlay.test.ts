import { describe, expect, it } from 'vitest';
import snapshot from './features/directory/data/content-directory-v1.json';
import fullOverlayRaw from '../../../packages/browser-content/src/data/source-pass-overlay-v1.json?raw';
import {
  loadBundledSourcePassOverlay,
  matchesSourcePass,
  sourcePassKnownSources,
  sourcePassOverlayUrl,
  sourcePassRevocationsStorageKey,
  sourceInitials,
} from '../../../packages/browser-content/src/source-pass-overlay';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';

describe('bundled source pass overlay', () => {
  const createStorage = () => {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
  };

  const overlayResponse = () =>
    new Response(fullOverlayRaw, {
      headers: {
        'content-type': 'application/json',
        'content-length': String(new TextEncoder().encode(fullOverlayRaw).byteLength),
      },
    });
  const loadFull = (options: Parameters<typeof loadBundledSourcePassOverlay>[1] = {}) =>
    loadBundledSourcePassOverlay(snapshot as MobileContentDirectory, {
      ...options,
      fetchImpl: async (input) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        if (url === sourcePassOverlayUrl) return overlayResponse();
        throw new Error(`Unexpected request: ${url}`);
      },
    });

  it('projects 19 canonical profiles from the hash-bound local release asset', async () => {
    const loaded = await loadFull({
      storage: createStorage(),
      online: false,
    });
    expect(loaded?.overlay.records).toHaveLength(19);
    expect(
      new Set(
        loaded?.overlay.records.flatMap((entry) => entry.endpoints.map((item) => item.endpointId)),
      ).size,
    ).toBe(22);
    expect(loaded?.directAvailable).toBe(true);
  });

  it('supports combined source facets and alias search', async () => {
    const loaded = await loadFull({
      storage: createStorage(),
      online: false,
    });
    const eff = loaded!.overlay.records.find((entry) => entry.aliasNames.includes('EFF'))!;
    expect(
      matchesSourcePass(eff, {
        query: 'eff',
        language: 'en',
        region: 'Global',
        country: 'United States',
        topic: 'privacy',
        medium: 'analysis',
      }),
    ).toBe(true);
    expect(
      matchesSourcePass(eff, {
        query: 'eff',
        language: 'en',
        region: 'Africa',
        country: '',
        topic: '',
        medium: '',
      }),
    ).toBe(false);
  });

  it('uses neutral initials without a logo request', async () => {
    const loaded = await loadFull({
      storage: createStorage(),
      online: false,
    });
    expect(sourceInitials('Electronic Frontier Foundation')).toBe('EF');
    expect(loaded?.overlay.records.every((entry) => entry.logo === null)).toBe(true);
  });

  it('suppresses every direct card when durable rollback memory is unavailable', async () => {
    const loaded = await loadFull({
      storage: {
        getItem: () => '{broken',
        setItem: () => {
          throw new Error('blocked');
        },
      },
      online: false,
    });
    expect(loaded?.directAvailable).toBe(false);
    expect(loaded?.overlay.records).toHaveLength(3);
  });

  it('keeps direct cards hidden during an online first render before the revocation check', async () => {
    const loaded = await loadFull({
      storage: createStorage(),
      online: false,
      allowDirect: false,
    });
    expect(loaded?.overlay.records).toHaveLength(3);
    expect(loaded?.directAvailable).toBe(false);
  });

  it('keeps a higher cumulative revocation floor across a bundled rollback', async () => {
    const storage = createStorage();
    const first = await loadFull({
      storage,
      online: false,
    });
    const blackLiberation = first!.overlay.records.find(
      (record) => record.canonicalName === 'Black Liberation Media',
    )!;
    storage.setItem(
      sourcePassRevocationsStorageKey,
      JSON.stringify({
        schema: 'wrn.source-pass-revocations.v1',
        contractVersion: '1.0.0',
        revision: 2,
        observedAt: '2026-09-26T00:00:00.000Z',
        endpointIds: [blackLiberation.preferenceAnchorEndpointId],
      }),
    );
    const afterRollback = await loadFull({
      storage,
      online: false,
      refreshOverlay: false,
    });
    expect(
      afterRollback?.overlay.records.some(
        (record) => record.canonicalName === 'Black Liberation Media',
      ),
    ).toBe(false);
    expect(afterRollback?.revocations.revision).toBe(2);
  });

  it('uses curated canonical names for stable direct preference anchors', async () => {
    const loaded = await loadFull({
      storage: createStorage(),
      online: false,
    });
    const blackLiberation = loaded!.overlay.records.find(
      (record) => record.canonicalName === 'Black Liberation Media',
    )!;
    const migrated = {
      ...(snapshot as MobileContentDirectory),
      sources: [
        ...(snapshot as MobileContentDirectory).sources,
        {
          ...(snapshot as MobileContentDirectory).sources[0]!,
          id: blackLiberation.preferenceAnchorEndpointId,
          url: 'https://blkliberationmedia.org/',
          name: 'Old imported label',
        },
      ],
    };
    expect(
      sourcePassKnownSources(migrated, loaded!.overlay).find(
        (entry) => entry.sourceId === blackLiberation.preferenceAnchorEndpointId,
      )?.name,
    ).toBe('Black Liberation Media');
  });

  it('accepts and persists a higher cumulative remote revocation snapshot', async () => {
    const storage = createStorage();
    const first = await loadFull({
      storage,
      online: false,
    });
    const endpointId = first!.overlay.records.find(
      (record) => record.canonicalName === 'Black Liberation Media',
    )!.preferenceAnchorEndpointId;
    const remote = {
      schema: 'wrn.source-pass-revocations.v1',
      contractVersion: '1.0.0',
      revision: 2,
      observedAt: '2026-09-26T00:00:00.000Z',
      endpointIds: [endpointId],
    };
    const body = JSON.stringify(remote);
    const loaded = await loadBundledSourcePassOverlay(snapshot as MobileContentDirectory, {
      storage,
      online: true,
      fetchImpl: async (input) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        return url === sourcePassOverlayUrl
          ? overlayResponse()
          : new Response(body, {
              headers: {
                'content-type': 'application/json',
                'content-length': String(new TextEncoder().encode(body).byteLength),
              },
            });
      },
    });
    expect(loaded?.source).toBe('remote');
    expect(
      loaded?.overlay.records.some((record) => record.canonicalName === 'Black Liberation Media'),
    ).toBe(false);
    expect(JSON.parse(storage.getItem(sourcePassRevocationsStorageKey)!).revision).toBe(2);
  });

  it('serializes concurrent writes and never replaces a later revocation with an older one', async () => {
    const storage = createStorage();
    const baseline = await loadFull({ storage, online: false });
    const ids = baseline!.overlay.records
      .filter((record) =>
        ['Black Liberation Media', 'Cooperation Jackson'].includes(record.canonicalName),
      )
      .map((record) => record.preferenceAnchorEndpointId)
      .sort();
    const response = (revision: number, endpointIds: string[]) => {
      const body = JSON.stringify({
        schema: 'wrn.source-pass-revocations.v1',
        contractVersion: '1.0.0',
        revision,
        observedAt: `2026-09-${revision + 24}T00:00:00.000Z`,
        endpointIds,
      });
      return new Response(body, { headers: { 'content-type': 'application/json' } });
    };
    let releaseOlder!: () => void;
    const olderReady = new Promise<void>((resolve) => {
      releaseOlder = resolve;
    });
    const load = (revision: number, endpointIds: string[]) =>
      loadBundledSourcePassOverlay(snapshot as MobileContentDirectory, {
        storage,
        online: true,
        refreshOverlay: false,
        fetchImpl: async () => {
          if (revision === 2) await olderReady;
          return response(revision, endpointIds);
        },
      });
    const older = load(2, ids.slice(0, 1));
    const newer = await load(3, ids);
    releaseOlder();
    const delayed = await older;
    expect(newer?.revocations.revision).toBe(3);
    expect(delayed?.revocations.revision).toBe(3);
    expect(JSON.parse(storage.getItem(sourcePassRevocationsStorageKey)!).endpointIds).toEqual(ids);
  });
});
