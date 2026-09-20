import { describe, expect, it } from 'vitest';
import {
  isSafeSupportContact,
  isSafeSupportUrl,
  createMobileSupportReviewProjector,
  mobileSupportSchema,
  projectMobileSupport,
  validateMobileSupport,
  type MobileSupportV1,
} from './mobile-support-v1.js';

const organization = {
  id: 'help-one',
  name: 'Help one',
  officialOperator: 'Help one',
  regions: ['CH'],
  locations: ['Bern'],
  confirmedCounsellingLanguages: ['de'],
  informationLanguages: ['de'],
  helpTopics: ['support'],
  audiences: ['people'],
  canHelpWith: ['advice'],
  notResponsibleFor: ['emergency response'],
  requirements: ['contact first'],
  officialWebsite: 'https://support.example.org/',
  officialContact: 'mailto:help@support.example.org',
  verificationSources: ['https://support.example.org/'],
  lastChecked: '2026-09-01',
  nextCheck: '2026-10-01',
  reachabilityStatus: 'reachable' as const,
  emergency: false,
  emergencyEvidence: ['https://support.example.org/'],
  officialDomains: ['example.org'],
  fieldEvidence: {
    identity: ['https://support.example.org/'],
    serviceScope: ['https://support.example.org/'],
    audiencesAndRequirements: ['https://support.example.org/'],
    limits: ['https://support.example.org/'],
    contact: ['https://support.example.org/'],
    emergency: ['https://support.example.org/'],
  },
  directoryRights: 'public-directory-metadata' as const,
  editorialRights: 'user-supplied-editorial-text' as const,
};
const document = (): MobileSupportV1 => ({
  schema: mobileSupportSchema,
  contractVersion: '1.0.0',
  sourceCommit: 'a'.repeat(40),
  observedAt: '2026-09-09T00:07:09.000Z',
  origin: 'legacy-app-snapshot',
  input: {
    solidarityNetworkSha256: 'b'.repeat(64),
    solidarityNetworkBytes: 1,
    prisonerSolidaritySha256: 'c'.repeat(64),
    prisonerSolidarityBytes: 1,
  },
  organizations: [organization],
  personSources: [
    {
      id: 'source-one',
      name: 'Source one',
      url: 'https://example.org/source',
      kind: 'directory',
      checkedAt: '2026-09-01',
      directoryRights: 'public-directory-metadata',
    },
  ],
  persons: [
    {
      id: 'person-one',
      publicName: 'Person one',
      country: 'CH',
      region: 'Europe',
      contextDe: 'Historischer Verzeichniseintrag.',
      sourceIds: ['source-one'],
      profileUrl: 'https://example.org/profile',
      verifiedAt: '2026-09-01',
      nextReviewAt: '2026-10-01',
      status: 'historical-directory-entry',
      directoryRights: 'public-directory-metadata',
      editorialRights: 'user-supplied-editorial-text',
    },
  ],
  withdrawnOrganizationIds: [],
  withdrawnPersonSourceIds: [],
  withdrawnPersonIds: [],
});

describe('mobile support v1 contract', () => {
  it('validates its versioned data and expires at the UTC start of nextCheck', () => {
    const value = document();
    expect(validateMobileSupport(value)).toMatchObject({ ok: true, errors: [] });
    expect(
      projectMobileSupport(value, new Date('2026-09-30T23:59:59.999Z')).organizations[0]
        ?.directContactAllowed,
    ).toBe(true);
    const expired = projectMobileSupport(value, new Date('2026-10-01T00:00:00.000Z'));
    expect(expired.organizations[0]).toMatchObject({
      directContactAllowed: false,
      reviewState: 'overdue',
    });
    expect(expired.persons[0]?.contextDe).toBeNull();
  });
  it('fails closed with an invalid clock and removes withdrawn values', () => {
    const value = {
      ...document(),
      withdrawnOrganizationIds: ['help-one'],
      withdrawnPersonIds: ['person-one'],
    };
    const projection = projectMobileSupport(value, new Date(Number.NaN));
    expect(projection).toMatchObject({ clockValid: false, organizations: [], persons: [] });
  });
  it('latches overdue and invalid-clock contact locks for the lifetime of a route mount', () => {
    const projector = createMobileSupportReviewProjector();
    const value = document();
    expect(
      projector.project(value, new Date('2026-10-01T00:00:00.000Z')).organizations[0]
        ?.directContactAllowed,
    ).toBe(false);
    expect(
      projector.project(value, new Date('2026-09-01T00:00:00.000Z')).organizations[0]
        ?.directContactAllowed,
    ).toBe(false);

    projector.reset();
    expect(
      projector.project(value, new Date(Number.NaN)).organizations[0]?.directContactAllowed,
    ).toBe(false);
    expect(
      projector.project(value, new Date('2026-09-01T00:00:00.000Z')).organizations[0]
        ?.directContactAllowed,
    ).toBe(false);
  });
  it('rejects unsafe URLs, non-bound contact data, malformed dates, and unknown references', () => {
    const unsafe = {
      ...document(),
      organizations: [{ ...organization, officialContact: 'mailto:help@evil-example.org' }],
    };
    expect(validateMobileSupport(unsafe)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining(['organizations']),
    });
    const invalidDate = {
      ...document(),
      organizations: [{ ...organization, nextCheck: '2026-02-30' }],
    };
    expect(validateMobileSupport(invalidDate)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining(['organizations']),
    });
    const initial = document();
    const invalidReference = {
      ...initial,
      persons: [{ ...initial.persons[0]!, sourceIds: ['missing'] }],
    };
    expect(validateMobileSupport(invalidReference)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining(['references']),
    });
  });
  it('requires a dot-bounded official host and only permits documented telephone forms', () => {
    expect(isSafeSupportUrl('https://127.0.0.1/')).toBe(false);
    expect(isSafeSupportUrl('https://support.localhost/')).toBe(false);
    expect(isSafeSupportUrl('https://support.internal/')).toBe(false);
    expect(isSafeSupportContact('https://notexample.org/', ['example.org'], ['CH'])).toBe(false);
    expect(isSafeSupportContact('https://child.example.org/', ['example.org'], ['CH'])).toBe(true);
    expect(isSafeSupportContact('tel:142', ['example.org'], ['CH'])).toBe(true);
    expect(isSafeSupportContact('tel:142', ['example.org'], ['DE'])).toBe(false);
    expect(isSafeSupportContact('mailto:help@example.org?subject=x', ['example.org'], ['CH'])).toBe(
      false,
    );
  });
  it('requires actual calendar dates, string IDs, historical check dates, and non-cyclic references', () => {
    const invalidDate = {
      ...document(),
      organizations: [{ ...organization, nextCheck: '2026-02-30' }],
    };
    expect(validateMobileSupport(invalidDate).errors).toContain('organizations');

    const numericId = { ...document(), organizations: [{ ...organization, id: 1 }] };
    expect(validateMobileSupport(numericId).errors).toContain('organizations');

    const tooNew = {
      ...document(),
      persons: [{ ...document().persons[0]!, verifiedAt: '2026-09-10' }],
    };
    expect(validateMobileSupport(tooNew).errors).toContain('historical-dates');

    const cyclic = {
      ...document(),
      personSources: [
        {
          ...document().personSources[0]!,
          id: 'person-one',
        },
      ],
      persons: [{ ...document().persons[0]!, sourceIds: ['person-one'] }],
    };
    expect(validateMobileSupport(cyclic).errors).toEqual(
      expect.arrayContaining(['duplicate-ids', 'cyclic-references']),
    );
  });
  it('permits a documented Swiss short number only while its entry remains current', () => {
    const value = {
      ...document(),
      organizations: [{ ...organization, officialContact: 'tel:142' }],
    };
    expect(
      projectMobileSupport(value, new Date('2026-09-02T00:00:00.000Z')).organizations[0]
        ?.directContactAllowed,
    ).toBe(true);
    expect(
      projectMobileSupport(value, new Date('2026-10-01T00:00:00.000Z')).organizations[0]
        ?.directContactAllowed,
    ).toBe(false);
  });
});
