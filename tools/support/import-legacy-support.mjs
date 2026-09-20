import { createHash } from 'node:crypto';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { validateMobileSupport } from '../../packages/content-contracts/src/support/mobile-support-v1.ts';

export const maxRawBytes = 1024 * 1024;
const sourceCommit = '2216ff3c1305f6d474712892a36dc9b0ea7cb0a0';
const observedAt = '2026-09-09T00:07:09.000Z';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
function parseSnapshot(bytes, label) {
  if (bytes.byteLength > maxRawBytes) throw new RangeError(`${label}-too-large`);
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new TypeError(`${label}-invalid-json`);
  }
}
function sourceUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('https://'))
    throw new TypeError('source-url-required');
  return value;
}
function accessNowOrganization() {
  const help = 'https://www.accessnow.org/help/';
  const faq = 'https://www.accessnow.org/help/helpline-faq/';
  return {
    id: 'access-now-digital-security-helpline',
    name: 'Access Now Digital Security Helpline',
    officialOperator: 'Access Now',
    regions: ['worldwide'],
    locations: [],
    confirmedCounsellingLanguages: ['en', 'es', 'fr', 'de', 'pt', 'ru', 'tl', 'ar', 'it', 'uk'],
    informationLanguages: ['en'],
    helpTopics: ['digital-security'],
    audiences: ['civil society', 'activists', 'media makers', 'human rights defenders'],
    canHelpWith: ['technical support for accounts, devices, attacks and digital prevention'],
    notResponsibleFor: [
      'direct legal representation',
      'medical or psychosocial treatment',
      'evacuation',
      'general internet funding',
    ],
    requirements: ['the service checks whether a request is within its remit before support'],
    officialWebsite: help,
    officialContact: help,
    verificationSources: [help, faq],
    lastChecked: '2026-09-09',
    nextCheck: '2026-10-09',
    reachabilityStatus: 'unknown',
    emergency: false,
    emergencyEvidence: [faq],
    officialDomains: ['accessnow.org'],
    fieldEvidence: {
      identity: [help],
      serviceScope: [help, faq],
      audiencesAndRequirements: [help, faq],
      limits: [faq],
      contact: [help],
      emergency: [faq],
    },
    directoryRights: 'public-directory-metadata',
    editorialRights: 'user-supplied-editorial-text',
  };
}
function organization(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new TypeError('organization-required');
  const rest = Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== 'politicalOrientation'),
  );
  if (!Array.isArray(rest.officialDomains) || !Array.isArray(rest.regions))
    throw new TypeError('organization-shape');
  return {
    ...rest,
    locations: Array.isArray(rest.locations) ? rest.locations : [],
    officialWebsite: sourceUrl(rest.officialWebsite),
    officialContact: typeof rest.officialContact === 'string' ? rest.officialContact : '',
    emergencyEvidence:
      rest.emergency === true &&
      Array.isArray(rest.emergencyEvidence) &&
      rest.emergencyEvidence.length === 0
        ? rest.fieldEvidence?.emergency
        : rest.emergencyEvidence,
    directoryRights: 'public-directory-metadata',
    editorialRights: 'user-supplied-editorial-text',
  };
}
function personSource(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new TypeError('person-source-required');
  return {
    id: value.id,
    name: value.name,
    url: sourceUrl(value.url),
    kind: value.kind,
    checkedAt: value.checkedAt,
    directoryRights: 'public-directory-metadata',
  };
}
function person(value) {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    typeof value.verification !== 'object' ||
    value.verification === null
  )
    throw new TypeError('person-required');
  return {
    id: value.id,
    publicName: value.publicName,
    country: value.country,
    region: value.region,
    contextDe: value.context?.de,
    sourceIds: value.verification.sourceIds,
    profileUrl: sourceUrl(value.verification.profileUrl),
    verifiedAt: value.verification.verifiedAt,
    nextReviewAt: value.verification.nextReviewAt,
    status: 'historical-directory-entry',
    directoryRights: 'public-directory-metadata',
    editorialRights: 'user-supplied-editorial-text',
  };
}
export function buildMobileSupport(networkBytes, prisonerBytes) {
  const network = parseSnapshot(networkBytes, 'solidarity-network');
  const prisoners = parseSnapshot(prisonerBytes, 'prisoner-solidarity');
  if (
    !Array.isArray(network.profiles) ||
    !Array.isArray(prisoners.sources) ||
    !Array.isArray(prisoners.profiles)
  )
    throw new TypeError('legacy-snapshot-shape');
  // Enforce the runtime contract before mapping legacy records, so a malformed
  // snapshot cannot create a large intermediate object.
  if (
    network.profiles.length > 99 ||
    prisoners.sources.length > 100 ||
    prisoners.profiles.length > 200
  )
    throw new RangeError('legacy-snapshot-count');
  const document = {
    schema: 'wrn.mobile-support.v1',
    contractVersion: '1.0.0',
    sourceCommit,
    observedAt,
    origin: 'legacy-app-snapshot',
    input: {
      solidarityNetworkSha256: sha256(networkBytes),
      solidarityNetworkBytes: networkBytes.byteLength,
      prisonerSolidaritySha256: sha256(prisonerBytes),
      prisonerSolidarityBytes: prisonerBytes.byteLength,
    },
    organizations: [...network.profiles.map(organization), accessNowOrganization()],
    personSources: prisoners.sources.map(personSource),
    persons: prisoners.profiles.map(person),
    withdrawnOrganizationIds: [],
    withdrawnPersonSourceIds: [],
    withdrawnPersonIds: [],
  };
  const bytes = new TextEncoder().encode(`${JSON.stringify(document, null, 2)}\n`);
  if (bytes.byteLength > maxRawBytes) throw new RangeError('generated-support-too-large');
  const validation = validateMobileSupport(document);
  if (!validation.ok) throw new TypeError(`invalid-support:${validation.errors.join(',')}`);
  return document;
}
export async function importLegacySupport({ networkPath, prisonerPath, outputPath }) {
  const sizes = await Promise.all(
    [networkPath, prisonerPath].map(async (path) => (await stat(path)).size),
  );
  if (sizes.some((size) => size > maxRawBytes)) throw new RangeError('input-too-large');
  const [networkBytes, prisonerBytes] = await Promise.all([
    readFile(networkPath),
    readFile(prisonerPath),
  ]);
  if (
    sha256(networkBytes) !== 'c4127417bd4078e86a4e0526542d7f9832b5f811d176f2ee4ff6f4c9641e96d2' ||
    sha256(prisonerBytes) !== 'c97fa20b4e78e1b2effab9974e2dd754b015ed44ea3c85b4b003f942e7da4273'
  )
    throw new TypeError('source-pin-mismatch');
  const document = buildMobileSupport(networkBytes, prisonerBytes);
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return document;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [networkPath, prisonerPath, outputPath] = process.argv.slice(2);
  if (!networkPath || !prisonerPath || !outputPath) {
    throw new TypeError(
      'usage: import-legacy-support <network.json> <prisoners.json> <output.json>',
    );
  }
  await importLegacySupport({ networkPath, prisonerPath, outputPath });
}
