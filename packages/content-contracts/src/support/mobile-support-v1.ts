const utf8ByteLength = (value: string) => new TextEncoder().encode(value).byteLength;

export const mobileSupportSchema = 'wrn.mobile-support.v1' as const;
export const mobileSupportContractVersion = '1.0.0' as const;
export const mobileSupportMaxDecodedJsonBytes = 1024 * 1024;
export const mobileSupportLocales = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const;
export type MobileSupportLocale = (typeof mobileSupportLocales)[number];

export type SupportEvidenceGroup =
  'identity' | 'serviceScope' | 'audiencesAndRequirements' | 'limits' | 'contact' | 'emergency';
export type SupportOrganization = Readonly<{
  id: string;
  name: string;
  officialOperator: string;
  regions: readonly string[];
  locations: readonly string[];
  confirmedCounsellingLanguages: readonly string[];
  informationLanguages: readonly string[];
  helpTopics: readonly string[];
  audiences: readonly string[];
  canHelpWith: readonly string[];
  notResponsibleFor: readonly string[];
  requirements: readonly string[];
  officialWebsite: string;
  officialContact: string;
  verificationSources: readonly string[];
  lastChecked: string;
  nextCheck: string;
  reachabilityStatus: 'reachable' | 'limited' | 'unknown';
  emergency: boolean;
  emergencyEvidence: readonly string[];
  officialDomains: readonly string[];
  fieldEvidence: Readonly<Record<SupportEvidenceGroup, readonly string[]>>;
  directoryRights: 'public-directory-metadata';
  editorialRights: 'user-supplied-editorial-text';
}>;
export type SupportPersonSource = Readonly<{
  id: string;
  name: string;
  url: string;
  kind: string;
  checkedAt: string;
  directoryRights: 'public-directory-metadata';
}>;
export type SupportPerson = Readonly<{
  id: string;
  publicName: string;
  country: string;
  region: string;
  contextDe: string;
  sourceIds: readonly string[];
  profileUrl: string;
  verifiedAt: string;
  nextReviewAt: string;
  status: 'historical-directory-entry';
  directoryRights: 'public-directory-metadata';
  editorialRights: 'user-supplied-editorial-text';
}>;
export type MobileSupportV1 = Readonly<{
  schema: typeof mobileSupportSchema;
  contractVersion: typeof mobileSupportContractVersion;
  sourceCommit: string;
  observedAt: string;
  origin: 'legacy-app-snapshot';
  input: Readonly<{
    solidarityNetworkSha256: string;
    solidarityNetworkBytes: number;
    prisonerSolidaritySha256: string;
    prisonerSolidarityBytes: number;
  }>;
  organizations: readonly SupportOrganization[];
  personSources: readonly SupportPersonSource[];
  persons: readonly SupportPerson[];
  withdrawnOrganizationIds: readonly string[];
  withdrawnPersonSourceIds: readonly string[];
  withdrawnPersonIds: readonly string[];
}>;
export type SupportOrganizationProjection = Readonly<
  SupportOrganization & { directContactAllowed: boolean; reviewState: 'current' | 'overdue' }
>;
export type SupportPersonProjection = Readonly<
  Omit<SupportPerson, 'contextDe'> & {
    contextDe: string | null;
    reviewState: 'current' | 'overdue';
  }
>;
export type MobileSupportProjection = Readonly<{
  clockValid: boolean;
  organizations: readonly SupportOrganizationProjection[];
  personSources: readonly SupportPersonSource[];
  persons: readonly SupportPersonProjection[];
}>;
/** A per-mounted-route projector. Review locks are intentionally not reversible within a mount. */
export type MobileSupportReviewProjector = Readonly<{
  project: (value: MobileSupportV1, now?: Date) => MobileSupportProjection;
  reset: () => void;
}>;
export type SupportValidation = Readonly<{
  ok: boolean;
  errors: readonly string[];
  value: MobileSupportV1 | null;
}>;

const supportGroups = [
  'identity',
  'serviceScope',
  'audiencesAndRequirements',
  'limits',
  'contact',
  'emergency',
] as const satisfies readonly SupportEvidenceGroup[];
const idPattern = /^[a-z0-9][a-z0-9-]{0,159}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const commitPattern = /^[a-f0-9]{40}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const emailPattern =
  /^[^\s@:/?#]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/iu;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function exact(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => key in value)
  );
}
function plain(value: unknown, max = 10_000): value is string {
  return (
    typeof value === 'string' &&
    value === value.normalize('NFC') &&
    value.trim() === value &&
    utf8ByteLength(value) > 0 &&
    utf8ByteLength(value) <= max &&
    !hasForbiddenControl(value)
  );
}
function hasForbiddenControl(value: string) {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || (code >= 0x7f && code <= 0x9f) || character === '<' || character === '>';
  });
}
function stringArray(value: unknown, max = 100, maxItem = 10_000): value is readonly string[] {
  return Array.isArray(value) && value.length <= max && value.every((item) => plain(item, maxItem));
}
function unique(values: readonly string[]) {
  return new Set(values).size === values.length;
}
function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !datePattern.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const roundTrip = new Date(Date.UTC(year!, month! - 1, day!)).toISOString().slice(0, 10);
  return roundTrip === value;
}
function validTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' && timestampPattern.test(value) && Number.isFinite(Date.parse(value))
  );
}
function dateMs(value: string) {
  return Date.parse(`${value}T00:00:00.000Z`);
}
function validDomain(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/iu.test(
      value,
    )
  );
}
function hostMatches(host: string, domains: readonly string[]) {
  const candidate = host.toLowerCase();
  return domains.some((domain) => candidate === domain || candidate.endsWith(`.${domain}`));
}
function safeHttpsUrl(value: unknown, domains: readonly string[] | null = null): value is string {
  if (
    typeof value !== 'string' ||
    value !== value.trim() ||
    hasForbiddenControl(value) ||
    /\s/u.test(value)
  )
    return false;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username !== '' ||
      url.password !== '' ||
      url.hostname === 'localhost' ||
      url.hostname.endsWith('.localhost') ||
      url.hostname.endsWith('.local') ||
      url.hostname === 'home.arpa' ||
      url.hostname.endsWith('.home.arpa') ||
      url.hostname.endsWith('.internal') ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(url.hostname) ||
      url.hostname.includes(':') ||
      url.href !== value
    )
      return false;
    return domains === null || hostMatches(url.hostname, domains);
  } catch {
    return false;
  }
}
export function isSafeSupportUrl(value: unknown): value is string {
  return safeHttpsUrl(value);
}
export function isSafeSupportContact(
  value: unknown,
  domains: readonly string[],
  regions: readonly string[],
) {
  if (
    typeof value !== 'string' ||
    value !== value.trim() ||
    hasForbiddenControl(value) ||
    /\s/u.test(value)
  )
    return false;
  if (value.startsWith('https:')) return safeHttpsUrl(value, domains);
  if (value.startsWith('mailto:')) {
    const address = value.slice('mailto:'.length);
    if (!emailPattern.test(address) || /[?#]/u.test(address)) return false;
    return hostMatches(address.slice(address.lastIndexOf('@') + 1), domains);
  }
  if (value.startsWith('tel:')) {
    const number = value.slice('tel:'.length);
    return (
      /^\+[1-9]\d{1,14}$/.test(number) ||
      (regions.includes('CH') && ['142', '143', '147'].includes(number))
    );
  }
  return false;
}
function evidence(
  value: unknown,
  domains: readonly string[],
): value is Readonly<Record<SupportEvidenceGroup, readonly string[]>> {
  return (
    exact(value, supportGroups) &&
    supportGroups.every(
      (group) =>
        Array.isArray(value[group]) &&
        value[group].length > 0 &&
        value[group].length <= 100 &&
        value[group].every((link) => safeHttpsUrl(link, domains)),
    )
  );
}
function organization(value: unknown): value is SupportOrganization {
  if (
    !isRecord(value) ||
    !stringArray(value.officialDomains, 100, 253) ||
    !value.officialDomains.every(validDomain)
  )
    return false;
  const domains = value.officialDomains.map((domain) => domain.toLowerCase());
  return (
    exact(value, [
      'id',
      'name',
      'officialOperator',
      'regions',
      'locations',
      'confirmedCounsellingLanguages',
      'informationLanguages',
      'helpTopics',
      'audiences',
      'canHelpWith',
      'notResponsibleFor',
      'requirements',
      'officialWebsite',
      'officialContact',
      'verificationSources',
      'lastChecked',
      'nextCheck',
      'reachabilityStatus',
      'emergency',
      'emergencyEvidence',
      'officialDomains',
      'fieldEvidence',
      'directoryRights',
      'editorialRights',
    ]) &&
    typeof value.id === 'string' &&
    idPattern.test(value.id) &&
    plain(value.name, 500) &&
    plain(value.officialOperator, 500) &&
    [
      'regions',
      'locations',
      'confirmedCounsellingLanguages',
      'informationLanguages',
      'helpTopics',
      'audiences',
      'canHelpWith',
      'notResponsibleFor',
      'requirements',
    ].every((key) => stringArray(value[key])) &&
    safeHttpsUrl(value.officialWebsite, domains) &&
    isSafeSupportContact(value.officialContact, domains, value.regions as readonly string[]) &&
    stringArray(value.verificationSources) &&
    value.verificationSources.every((link) => safeHttpsUrl(link, domains)) &&
    validDate(value.lastChecked) &&
    validDate(value.nextCheck) &&
    dateMs(value.lastChecked) <= dateMs(value.nextCheck) &&
    ['reachable', 'limited', 'unknown'].includes(value.reachabilityStatus as string) &&
    typeof value.emergency === 'boolean' &&
    stringArray(value.emergencyEvidence) &&
    value.emergencyEvidence.every((link) => safeHttpsUrl(link, domains)) &&
    (!value.emergency || value.emergencyEvidence.length > 0) &&
    evidence(value.fieldEvidence, domains) &&
    value.directoryRights === 'public-directory-metadata' &&
    value.editorialRights === 'user-supplied-editorial-text'
  );
}
function personSource(value: unknown): value is SupportPersonSource {
  return (
    exact(value, ['id', 'name', 'url', 'kind', 'checkedAt', 'directoryRights']) &&
    typeof value?.id === 'string' &&
    idPattern.test(value.id) &&
    plain(value?.name, 500) &&
    safeHttpsUrl(value?.url) &&
    plain(value?.kind, 100) &&
    validDate(value?.checkedAt) &&
    value?.directoryRights === 'public-directory-metadata'
  );
}
function person(value: unknown): value is SupportPerson {
  return (
    exact(value, [
      'id',
      'publicName',
      'country',
      'region',
      'contextDe',
      'sourceIds',
      'profileUrl',
      'verifiedAt',
      'nextReviewAt',
      'status',
      'directoryRights',
      'editorialRights',
    ]) &&
    typeof value?.id === 'string' &&
    idPattern.test(value.id) &&
    plain(value?.publicName, 500) &&
    plain(value?.country, 500) &&
    plain(value?.region, 500) &&
    plain(value?.contextDe) &&
    stringArray(value?.sourceIds) &&
    value.sourceIds.length > 0 &&
    unique(value.sourceIds as readonly string[]) &&
    safeHttpsUrl(value?.profileUrl) &&
    validDate(value?.verifiedAt) &&
    validDate(value?.nextReviewAt) &&
    dateMs(value.verifiedAt as string) <= dateMs(value.nextReviewAt as string) &&
    value?.status === 'historical-directory-entry' &&
    value?.directoryRights === 'public-directory-metadata' &&
    value?.editorialRights === 'user-supplied-editorial-text'
  );
}
export function validateMobileSupport(value: unknown): SupportValidation {
  const errors: string[] = [];
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined || utf8ByteLength(serialized) > mobileSupportMaxDecodedJsonBytes)
      return { ok: false, errors: ['runtime-size'], value: null };
  } catch {
    return { ok: false, errors: ['serialization'], value: null };
  }
  const candidate: Record<string, unknown> = isRecord(value) ? value : {};
  const input: Record<string, unknown> | null = isRecord(candidate.input) ? candidate.input : null;
  if (
    !exact(candidate, [
      'schema',
      'contractVersion',
      'sourceCommit',
      'observedAt',
      'origin',
      'input',
      'organizations',
      'personSources',
      'persons',
      'withdrawnOrganizationIds',
      'withdrawnPersonSourceIds',
      'withdrawnPersonIds',
    ]) ||
    candidate.schema !== mobileSupportSchema ||
    candidate.contractVersion !== mobileSupportContractVersion ||
    typeof candidate.sourceCommit !== 'string' ||
    !commitPattern.test(candidate.sourceCommit) ||
    !validTimestamp(candidate.observedAt) ||
    candidate.origin !== 'legacy-app-snapshot'
  )
    errors.push('header');
  if (
    input === null ||
    !exact(input, [
      'solidarityNetworkSha256',
      'solidarityNetworkBytes',
      'prisonerSolidaritySha256',
      'prisonerSolidarityBytes',
    ]) ||
    typeof input.solidarityNetworkSha256 !== 'string' ||
    !hashPattern.test(input.solidarityNetworkSha256) ||
    typeof input.prisonerSolidaritySha256 !== 'string' ||
    !hashPattern.test(input.prisonerSolidaritySha256) ||
    !['solidarityNetworkBytes', 'prisonerSolidarityBytes'].every(
      (key) => Number.isSafeInteger(input[key]) && (input[key] as number) > 0,
    )
  )
    errors.push('input');
  if (
    !Array.isArray(candidate.organizations) ||
    candidate.organizations.length > 100 ||
    !candidate.organizations.every(organization)
  )
    errors.push('organizations');
  if (
    !Array.isArray(candidate.personSources) ||
    candidate.personSources.length > 100 ||
    !candidate.personSources.every(personSource)
  )
    errors.push('person-sources');
  if (
    !Array.isArray(candidate.persons) ||
    candidate.persons.length > 200 ||
    !candidate.persons.every(person)
  )
    errors.push('persons');
  if (
    !['withdrawnOrganizationIds', 'withdrawnPersonSourceIds', 'withdrawnPersonIds'].every((key) =>
      stringArray(candidate[key]),
    )
  )
    errors.push('withdrawals');
  if (errors.length) return { ok: false, errors, value: null };
  const document = candidate as unknown as MobileSupportV1;
  const organizationIds = document.organizations.map((item) => item.id);
  const sourceIds = document.personSources.map((item) => item.id);
  const personIds = document.persons.map((item) => item.id);
  if (
    !unique([...organizationIds, ...sourceIds, ...personIds]) ||
    ![
      document.withdrawnOrganizationIds,
      document.withdrawnPersonSourceIds,
      document.withdrawnPersonIds,
    ].every(unique)
  )
    errors.push('duplicate-ids');
  if (
    !document.persons.every((item) =>
      item.sourceIds.every((sourceId) => sourceIds.includes(sourceId)),
    ) ||
    document.withdrawnOrganizationIds.some((id) => !organizationIds.includes(id)) ||
    document.withdrawnPersonSourceIds.some((id) => !sourceIds.includes(id)) ||
    document.withdrawnPersonIds.some((id) => !personIds.includes(id))
  )
    errors.push('references');
  const observedDate = document.observedAt.slice(0, 10);
  if (
    document.organizations.some((item) => item.lastChecked > observedDate) ||
    document.personSources.some((item) => item.checkedAt > observedDate) ||
    document.persons.some((item) => item.verifiedAt > observedDate)
  )
    errors.push('historical-dates');
  if (document.persons.some((item) => item.sourceIds.includes(item.id)))
    errors.push('cyclic-references');
  if (utf8ByteLength(JSON.stringify(document)) > mobileSupportMaxDecodedJsonBytes)
    errors.push('runtime-size');
  return errors.length
    ? { ok: false, errors, value: null }
    : { ok: true, errors: [], value: document };
}
function validClock(now: Date) {
  return Number.isFinite(now.getTime());
}
function overdue(date: string, now: Date) {
  return now.getTime() >= dateMs(date);
}
export function projectMobileSupport(
  value: MobileSupportV1,
  now = new Date(),
): MobileSupportProjection {
  const clockValid = validClock(now);
  const withdrawnOrganizations = new Set(value.withdrawnOrganizationIds);
  const withdrawnSources = new Set(value.withdrawnPersonSourceIds);
  const withdrawnPersons = new Set(value.withdrawnPersonIds);
  const organizations = value.organizations
    .filter((item) => !withdrawnOrganizations.has(item.id))
    .map((item) => {
      const reviewState = !clockValid || overdue(item.nextCheck, now) ? 'overdue' : 'current';
      return Object.freeze({
        ...item,
        reviewState,
        directContactAllowed: reviewState === 'current',
      });
    });
  const personSources = value.personSources.filter((item) => !withdrawnSources.has(item.id));
  const availableSources = new Set(personSources.map((item) => item.id));
  const persons = value.persons
    .filter(
      (item) =>
        !withdrawnPersons.has(item.id) && item.sourceIds.every((id) => availableSources.has(id)),
    )
    .map((item) => {
      const reviewState = !clockValid || overdue(item.nextReviewAt, now) ? 'overdue' : 'current';
      return Object.freeze({
        ...item,
        reviewState,
        contextDe: reviewState === 'current' ? item.contextDe : null,
      });
    });
  return Object.freeze({
    clockValid,
    organizations: Object.freeze(organizations),
    personSources: Object.freeze(personSources),
    persons: Object.freeze(persons),
  });
}

export function createMobileSupportReviewProjector(): MobileSupportReviewProjector {
  const lockedOrganizationIds = new Set<string>();
  const lockedPersonIds = new Set<string>();
  return Object.freeze({
    project(value, now = new Date()) {
      const clockValid = validClock(now);
      const withdrawnOrganizations = new Set(value.withdrawnOrganizationIds);
      const withdrawnSources = new Set(value.withdrawnPersonSourceIds);
      const withdrawnPersons = new Set(value.withdrawnPersonIds);
      const organizations = value.organizations
        .filter((item) => !withdrawnOrganizations.has(item.id))
        .map((item) => {
          const currentlyOverdue = !clockValid || overdue(item.nextCheck, now);
          if (currentlyOverdue) lockedOrganizationIds.add(item.id);
          const reviewState =
            currentlyOverdue || lockedOrganizationIds.has(item.id) ? 'overdue' : 'current';
          return Object.freeze({
            ...item,
            reviewState,
            directContactAllowed: reviewState === 'current',
          });
        });
      const personSources = value.personSources.filter((item) => !withdrawnSources.has(item.id));
      const availableSources = new Set(personSources.map((item) => item.id));
      const persons = value.persons
        .filter(
          (item) =>
            !withdrawnPersons.has(item.id) &&
            item.sourceIds.every((id) => availableSources.has(id)),
        )
        .map((item) => {
          const currentlyOverdue = !clockValid || overdue(item.nextReviewAt, now);
          if (currentlyOverdue) lockedPersonIds.add(item.id);
          const reviewState =
            currentlyOverdue || lockedPersonIds.has(item.id) ? 'overdue' : 'current';
          return Object.freeze({
            ...item,
            reviewState,
            contextDe: reviewState === 'current' ? item.contextDe : null,
          });
        });
      return Object.freeze({
        clockValid,
        organizations: Object.freeze(organizations),
        personSources: Object.freeze(personSources),
        persons: Object.freeze(persons),
      });
    },
    reset() {
      lockedOrganizationIds.clear();
      lockedPersonIds.clear();
    },
  });
}
