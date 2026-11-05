import { describe, expect, it } from 'vitest';
import {
  projectSourcePassOverlayV1,
  validateSourcePassOverlayV1,
  validateSourcePassOverlayEndpointIdsV1,
  type SourcePassOverlayV1,
} from './source-pass-overlay-v1.js';
import type { MobileContentDirectory } from './mobile-content-directory-v1.js';

const endpoint = `source-${'a'.repeat(64)}`;
const passId = `wrn-source-pass-${'b'.repeat(32)}`;
const evidenceId = 'evidence-one';
const fixture: SourcePassOverlayV1 = {
  schema: 'wrn.source-pass-overlay.v1',
  contractVersion: '1.1.0',
  revision: 'test-v1',
  sequence: 1,
  reviewedAt: '2026-09-25T00:00:00Z',
  records: [
    {
      id: passId,
      canonicalName: 'Example Source',
      aliasNames: ['Example'],
      curationStatus: 'active',
      selfDescription: { text: 'Self description.', language: 'en', evidenceIds: [evidenceId] },
      editorialDescription: {
        text: 'Editorial description.',
        language: 'en',
        evidenceIds: [evidenceId],
      },
      endpoints: [
        {
          kind: 'directory',
          endpointId: endpoint,
          url: null,
          role: 'homepage',
          health: 'healthy',
          checkedAt: '2026-09-25T00:00:00Z',
          lastSuccessfulAt: '2026-09-25T00:00:00Z',
          evidenceIds: [evidenceId],
        },
      ],
      preferenceAnchorEndpointId: endpoint,
      originalEndpointId: endpoint,
      regions: ['Global'],
      countries: [],
      languages: ['en'],
      topics: ['rights'],
      tendencies: [],
      mediaTypes: ['news'],
      rights: [
        { medium: 'metadata', status: 'allowed', evidenceIds: [evidenceId] },
        { medium: 'text', status: 'link-only', evidenceIds: [evidenceId] },
        { medium: 'image', status: 'unknown', evidenceIds: [evidenceId] },
        { medium: 'audio', status: 'unknown', evidenceIds: [evidenceId] },
        { medium: 'logo', status: 'unknown', evidenceIds: [evidenceId] },
      ],
      logo: null,
      correctionContact: {
        status: 'checked-not-found',
        url: null,
        checkedAt: '2026-09-25T00:00:00Z',
        evidenceIds: [evidenceId],
      },
      evidenceIds: [evidenceId],
    },
  ],
  relations: [],
  evidence: [
    {
      id: evidenceId,
      kind: 'direct-observation',
      url: 'https://example.org/',
      observedAt: '2026-09-25T00:00:00Z',
      note: 'Observed for test.',
    },
  ],
};

const directory = (withdrawn = false): MobileContentDirectory => ({
  schema: 'wrn.mobile-content-directory.v1',
  version: 1,
  sourceCommit: 'a'.repeat(40),
  observedAt: '2026-09-25T00:00:00Z',
  rights: 'metadata-and-links',
  articles: [],
  sports: [],
  sources: [
    {
      id: endpoint,
      url: 'https://example.org/',
      name: 'Example Source',
      languages: ['en'],
      mediaType: 'news',
      historicalHttp: false,
      accessNote: null,
      observations: [],
    },
  ],
  withdrawals: { articleIds: [], endpointIds: withdrawn ? [endpoint] : [] },
  reconciliation: {
    news: {
      app: { input: 0, accepted: 0, rejected: { url: 0, http: 0, metadata: 0 } },
      github: { input: 0, accepted: 0, rejected: { url: 0, http: 0, metadata: 0 } },
      rawLinkUnion: 0,
      normalizedUrlUnionBeforeHttps: 0,
      collisions: 0,
    },
    sources: {
      app: { input: 1, accepted: 1, rejected: { url: 0, http: 0, metadata: 0 } },
      github: { input: 0, accepted: 0, rejected: { url: 0, http: 0, metadata: 0 } },
      collisions: 0,
    },
  },
});

describe('source pass overlay v1', () => {
  it('accepts a complete pass and keeps it when both anchor and original endpoint exist', async () => {
    expect(validateSourcePassOverlayV1(fixture)).toBe(true);
    expect((await projectSourcePassOverlayV1(fixture, directory()))?.records).toHaveLength(1);
  });

  it('drops a pass fail closed when its endpoint is withdrawn', async () => {
    expect((await projectSourcePassOverlayV1(fixture, directory(true)))?.records).toEqual([]);
  });

  it('rejects unknown evidence references and healthy endpoints without a success time', () => {
    const base = fixture.records[0]!;
    const missingEvidence = {
      ...fixture,
      records: [
        {
          ...base,
          selfDescription: { ...base.selfDescription, evidenceIds: ['evidence-missing'] },
        },
      ],
    };
    expect(validateSourcePassOverlayV1(missingEvidence)).toBe(false);
    const noSuccess = {
      ...fixture,
      records: [
        {
          ...base,
          endpoints: [{ ...base.endpoints[0]!, lastSuccessfulAt: null }],
        },
      ],
    };
    expect(validateSourcePassOverlayV1(noSuccess)).toBe(false);
  });

  it('rejects impossible dates and endpoint checks without evidence from the same observation', () => {
    expect(validateSourcePassOverlayV1({ ...fixture, reviewedAt: '2026-99-99T99:99:99Z' })).toBe(
      false,
    );
    const base = fixture.records[0]!;
    const mismatchedCheck = {
      ...fixture,
      records: [
        {
          ...base,
          endpoints: [{ ...base.endpoints[0]!, checkedAt: '2026-09-24T00:00:00Z' }],
        },
      ],
    };
    expect(validateSourcePassOverlayV1(mismatchedCheck)).toBe(false);
  });

  it('rejects a local logo unless logo rights are explicitly allowed', () => {
    const base = fixture.records[0]!;
    const logo = {
      ...fixture,
      records: [
        {
          ...base,
          logo: {
            path: 'assets/source-logos/example.png',
            mimeType: 'image/png',
            byteLength: 12,
            sha256: 'c'.repeat(64),
            alt: 'Example',
          },
        },
      ],
    };
    expect(validateSourcePassOverlayV1(logo)).toBe(false);
  });

  it('binds direct endpoint ids to the exact canonical URL bytes', async () => {
    const canonical = 'https://example.org/path?b=2#section';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
    const directId =
      'source-' +
      [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const base = fixture.records[0]!;
    const direct = {
      ...fixture,
      records: [
        {
          ...base,
          endpoints: [
            {
              ...base.endpoints[0]!,
              kind: 'direct' as const,
              endpointId: directId,
              url: canonical,
            },
          ],
          preferenceAnchorEndpointId: directId,
          originalEndpointId: directId,
        },
      ],
    };
    expect(validateSourcePassOverlayV1(direct)).toBe(true);
    await expect(validateSourcePassOverlayEndpointIdsV1(direct)).resolves.toBe(true);
    await expect(
      validateSourcePassOverlayEndpointIdsV1({
        ...direct,
        records: [
          {
            ...direct.records[0]!,
            endpoints: [{ ...direct.records[0]!.endpoints[0]!, endpointId: endpoint }],
            preferenceAnchorEndpointId: endpoint,
            originalEndpointId: endpoint,
          },
        ],
      }),
    ).resolves.toBe(false);
    for (const url of [
      'https://EXAMPLE.org/path?b=2#section',
      'https://example.org:443/path?b=2#section',
      'https://example.org',
      'https://user:secret@example.org/path',
    ])
      expect(
        validateSourcePassOverlayV1({
          ...direct,
          records: [
            {
              ...direct.records[0]!,
              endpoints: [{ ...direct.records[0]!.endpoints[0]!, url }],
            },
          ],
        }),
      ).toBe(false);
  });

  it('keeps the stable direct id through directory migration and lets a directory withdrawal win', async () => {
    const url = 'https://example.net/';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(url));
    const id =
      'source-' +
      [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const base = fixture.records[0]!;
    const overlay = {
      ...fixture,
      records: [
        {
          ...base,
          endpoints: [{ ...base.endpoints[0]!, kind: 'direct' as const, endpointId: id, url }],
          preferenceAnchorEndpointId: id,
          originalEndpointId: id,
        },
      ],
    };
    const migrated = directory() as MobileContentDirectory;
    const next = {
      ...migrated,
      sources: [{ ...migrated.sources[0]!, id, url }],
    };
    expect((await projectSourcePassOverlayV1(overlay, next))?.records).toHaveLength(1);
    expect(
      (
        await projectSourcePassOverlayV1(overlay, {
          ...next,
          withdrawals: { articleIds: [], endpointIds: [id] },
        })
      )?.records,
    ).toEqual([]);
  });
});
