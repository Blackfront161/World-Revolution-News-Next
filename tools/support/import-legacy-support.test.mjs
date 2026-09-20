import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildMobileSupport, maxRawBytes } from './import-legacy-support.mjs';

const network = {
  profiles: [
    {
      id: 'test-help',
      name: 'Test help',
      officialOperator: 'Test',
      regions: ['CH'],
      confirmedCounsellingLanguages: [],
      informationLanguages: ['de'],
      helpTopics: ['test'],
      audiences: ['people'],
      canHelpWith: ['help'],
      notResponsibleFor: ['nothing'],
      requirements: ['contact'],
      officialWebsite: 'https://example.org/',
      officialContact: 'https://example.org/contact',
      verificationSources: ['https://example.org/'],
      lastChecked: '2026-09-01',
      nextCheck: '2026-10-01',
      reachabilityStatus: 'reachable',
      emergency: false,
      emergencyEvidence: [],
      officialDomains: ['example.org'],
      fieldEvidence: {
        identity: ['https://example.org/'],
        serviceScope: ['https://example.org/'],
        audiencesAndRequirements: ['https://example.org/'],
        limits: ['https://example.org/'],
        contact: ['https://example.org/'],
        emergency: ['https://example.org/'],
      },
      politicalOrientation: ['must never enter output'],
    },
  ],
};
const prisoners = {
  sources: [
    {
      id: 'test-source',
      name: 'Test source',
      url: 'https://example.org/source',
      kind: 'list',
      checkedAt: '2026-09-01',
    },
  ],
  profiles: [
    {
      id: 'test-person',
      publicName: 'Test person',
      country: 'CH',
      region: 'Europe',
      context: { de: 'Historical context', en: 'Historical context' },
      verification: {
        sourceIds: ['test-source'],
        profileUrl: 'https://example.org/person',
        verifiedAt: '2026-09-01',
        nextReviewAt: '2026-10-01',
      },
      mailingAddress: 'must never enter output',
      prisonerId: 'must never enter output',
      birthday: 'must never enter output',
      pronouns: ['must never enter output'],
      movementTags: ['must never enter output'],
    },
  ],
};
test('creates the minimum data projection without excluded legacy fields', () => {
  const result = buildMobileSupport(
    new TextEncoder().encode(JSON.stringify(network)),
    new TextEncoder().encode(JSON.stringify(prisoners)),
  );
  assert.equal(result.organizations.length, 2);
  assert.equal(result.persons.length, 1);
  assert.equal(result.personSources.length, 1);
  const serialized = JSON.stringify(result);
  for (const prohibited of [
    'politicalOrientation',
    'mailingAddress',
    'prisonerId',
    'birthday',
    'pronouns',
    'movementTags',
  ])
    assert.equal(serialized.includes(prohibited), false);
  assert.equal(result.organizations.at(-1)?.id, 'access-now-digital-security-helpline');
});
test('rejects non-JSON and oversized raw sources before transformation', () => {
  assert.throws(
    () =>
      buildMobileSupport(
        new TextEncoder().encode('export default {}'),
        new TextEncoder().encode('{}'),
      ),
    /invalid-json/u,
  );
  assert.throws(
    () => buildMobileSupport(new Uint8Array(maxRawBytes + 1), new TextEncoder().encode('{}')),
    /too-large/u,
  );
});
test('rejects over-limit legacy collections before it maps their entries', () => {
  const oversizedNetwork = { profiles: Array.from({ length: 100 }, () => network.profiles[0]) };
  assert.throws(
    () =>
      buildMobileSupport(
        new TextEncoder().encode(JSON.stringify(oversizedNetwork)),
        new TextEncoder().encode(JSON.stringify(prisoners)),
      ),
    /legacy-snapshot-count/u,
  );
  const oversizedPersons = {
    ...prisoners,
    profiles: Array.from({ length: 201 }, () => prisoners.profiles[0]),
  };
  assert.throws(
    () =>
      buildMobileSupport(
        new TextEncoder().encode(JSON.stringify(network)),
        new TextEncoder().encode(JSON.stringify(oversizedPersons)),
      ),
    /legacy-snapshot-count/u,
  );
});

test('rejects invalid transformed contacts and future review claims before output', () => {
  for (const edit of [
    (item) => {
      item.officialContact = 'mailto:help@example.org?bcc=third@example.org';
    },
    (item) => {
      item.lastChecked = '2026-10-01';
    },
    (item) => {
      item.id = 123;
    },
  ]) {
    const invalid = structuredClone(network);
    edit(invalid.profiles[0]);
    assert.throws(
      () =>
        buildMobileSupport(
          new TextEncoder().encode(JSON.stringify(invalid)),
          new TextEncoder().encode(JSON.stringify(prisoners)),
        ),
      /invalid-support/,
    );
  }
});
