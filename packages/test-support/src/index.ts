import { foundationContractVersion, type ShellStateContract } from '@wrn/api-contracts';
import {
  createFeedStatusState,
  createReadyFeedState,
  type LocalLegacyReadingMigrationInput,
  type FeedState,
  type ShellState,
} from '@wrn/domain';
import {
  archiveLifecycleIntegrityPayload,
  canonicalJson,
  createValidatedLocalContentReleaseV1,
  isLocalManifestV1,
  isLocalArticleResourcePayload,
  isLocalArchiveLifecycleV1,
  isLocalDiscoverIndexV1,
  isLocalReaderDetailsV1,
  isLocalWebsitePublicationV1,
  localArchiveLifecycleContractVersion,
  localArchiveLifecycleSchema,
  localArticleResourceSchema,
  localContentReleaseDescriptorContractVersion,
  localContentReleaseDescriptorSchema,
  localEmptyResourceSchema,
  localManifestContractVersion,
  sha256Utf8,
  utf8ByteLength,
  validateLocalManifestIntegrity,
  validateLocalArchiveLifecycleV1,
  validateLocalDiscoverIndexV1,
  validateLocalReaderDetailsV1,
  validateLocalWebsitePublicationV1,
  type LocalContentReleaseDescriptorV1,
  type LocalContentReleaseDocumentsV1,
  type LocalContentReleaseReadyV1,
  type LocalDiscoverIndexV1,
  type ArchiveLifecycleValidationResult,
  type LocalArchiveLifecycleV1,
  type LocalReaderDetailsV1,
  type LocalWebsitePublicationV1,
  type LocalArticleResourcePayload,
  type LocalEmptyResourcePayload,
  type LocalManifestV1,
} from '@wrn/content-contracts';
import staticArticlesDocument from '../fixtures/wrn-g3-002/articles.json' with { type: 'json' };
import staticManifestDocument from '../fixtures/wrn-g3-002/manifest.json' with { type: 'json' };
import staticSupplementalItemsDocument from '../fixtures/wrn-g3-002/supplemental-items.json' with { type: 'json' };
import staticDiscoverIndexDocument from '../fixtures/wrn-g3-005/discover-index.json' with { type: 'json' };
import staticReaderDetailsDocument from '../fixtures/wrn-g3-006/reader-details.json' with { type: 'json' };
import staticG3007ContentManifestDocument from '../fixtures/wrn-g3-007/content-manifest.json' with { type: 'json' };
import staticG3007PublicationDocument from '../fixtures/wrn-g3-007/publication.json' with { type: 'json' };
import staticG3008ArticlesDocument from '../fixtures/wrn-g3-008/articles.json' with { type: 'json' };
import staticG3008ReaderDetailsDocument from '../fixtures/wrn-g3-008/reader-details.json' with { type: 'json' };
import staticG3008LifecycleDocument from '../fixtures/wrn-g3-008/lifecycle.json' with { type: 'json' };
import staticG3011LegacyMigrationDocument from '../fixtures/wrn-g3-011/legacy-migration.json' with { type: 'json' };

export {
  createG3014OfflineFixtures,
  type G3014OfflineFixtures,
  type G3014OfflineReleaseFixture,
} from './g3-014-offline-fixtures.js';

/**
 * Deterministische, rein lokale Foundation-Fixtures. Sie enthalten bewusst
 * keine News-, Account-, Provider- oder sonstige Produktdaten.
 */
export const shellStateFixtures: Readonly<Record<ShellState, ShellStateContract>> = Object.freeze({
  ready: Object.freeze({ contractVersion: foundationContractVersion, state: 'ready' }),
  loading: Object.freeze({ contractVersion: foundationContractVersion, state: 'loading' }),
  error: Object.freeze({ contractVersion: foundationContractVersion, state: 'error' }),
  offline: Object.freeze({ contractVersion: foundationContractVersion, state: 'offline' }),
});

/**
 * Liefert fuer Tests eine neue, veraenderbare Kopie einer bekannten Fixture.
 */
export function createShellStateFixture(state: ShellState): ShellStateContract {
  const fixture = shellStateFixtures[state];
  return {
    contractVersion: fixture.contractVersion,
    state: fixture.state,
  };
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }

  return value;
}

/**
 * Selbst erstellte, neutrale Testinhalte aus dem echten Fixture-Seed. Sie
 * enthalten keine realen Personen, keine Drittmedien und keine aufgerufenen
 * URLs. Die Objekte werden nach Schema validiert, bevor sie als Ready-Feed
 * weitergegeben werden.
 */
export const localNewsArticlePayload = deepFreeze(
  staticArticlesDocument,
) as LocalArticleResourcePayload;
export const localEmptyResourcePayload = deepFreeze(
  staticSupplementalItemsDocument,
) as LocalEmptyResourcePayload;
const pinnedManifestDocument = deepFreeze(staticManifestDocument) as unknown;
const pinnedDiscoverIndexDocument = deepFreeze(staticDiscoverIndexDocument) as unknown;
const pinnedReaderDetailsDocument = deepFreeze(staticReaderDetailsDocument) as unknown;
const pinnedG3007ContentManifestDocument = deepFreeze(
  staticG3007ContentManifestDocument,
) as unknown;
const pinnedG3007PublicationDocument = deepFreeze(staticG3007PublicationDocument) as unknown;
const pinnedG3008ArticlesDocument = deepFreeze(staticG3008ArticlesDocument) as unknown;
const pinnedG3008ReaderDetailsDocument = deepFreeze(staticG3008ReaderDetailsDocument) as unknown;
const pinnedG3008LifecycleDocument = deepFreeze(staticG3008LifecycleDocument) as unknown;
const pinnedG3011LegacyMigrationDocument = deepFreeze(
  staticG3011LegacyMigrationDocument,
) as unknown;

export interface LocalDiscoverFixture {
  readonly index: LocalDiscoverIndexV1;
}

export interface LocalReaderDetailsFixture {
  readonly details: LocalReaderDetailsV1;
}

export interface LocalWebsitePublicationFixture {
  readonly manifest: LocalManifestV1;
  readonly publication: LocalWebsitePublicationV1;
}

export interface LocalArchiveLifecycleFixture {
  readonly articles: readonly import('@wrn/content-contracts').LocalArticle[];
  readonly details: LocalReaderDetailsV1;
  readonly lifecycle: LocalArchiveLifecycleV1;
  readonly validation: ArchiveLifecycleValidationResult;
}

/**
 * Ausschliesslich getrennte Fixture-/Releasevorbereitung fuer G3-012. Dieses
 * Objekt ist nie eine Runtimequelle: Der spaetere Frontendschritt materialisiert
 * daraus kontrollierte lokale Artefakte in den jeweiligen Clientprojekten.
 */
export interface LocalContentReleaseFixture {
  readonly descriptor: LocalContentReleaseDescriptorV1;
  readonly documents: LocalContentReleaseDocumentsV1;
  readonly ready: LocalContentReleaseReadyV1;
}

export interface LocalLegacyReadingMigrationFixture {
  readonly legacy: LocalLegacyReadingMigrationInput;
}

export interface LocalFixtureSeed {
  /**
   * Muss der 40- oder 64-stellige Hash eines bereits existierenden,
   * gesicherten Fixture-Seed-Commits sein. Branchlabels und Platzhalter werden
   * fail-closed abgewiesen.
   */
  readonly sourceCommit: string;
}

export interface LocalNewsfeedFixture {
  readonly manifest: LocalManifestV1;
  readonly payloads: Readonly<
    Record<string, LocalArticleResourcePayload | LocalEmptyResourcePayload>
  >;
  readonly states: Readonly<
    Record<'loading' | 'empty' | 'error' | 'offline' | 'optional-absent' | 'ready', FeedState>
  >;
}

const sourceCommitPattern = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;
const fixtureArticleIds = localNewsArticlePayload.articles.map((article) => article.id).sort();
const emptyIds: string[] = [];
export const localNewsfeedSeedCommit = '675cd13c0863ade6a72d631e27283a29810eef10' as const;

async function createSetHashes() {
  return {
    activeFeedIds: await sha256Utf8(canonicalJson(fixtureArticleIds)),
    archiveIds: await sha256Utf8(canonicalJson(fixtureArticleIds)),
    landingIds: await sha256Utf8(canonicalJson(emptyIds)),
    redirectSourceIds: await sha256Utf8(canonicalJson(emptyIds)),
    sitemapArticleIds: await sha256Utf8(canonicalJson(emptyIds)),
  };
}

export interface LocalNewsfeedFixtureCandidate {
  readonly manifest: unknown;
  readonly payloads: Readonly<Record<string, unknown>>;
}

function createFixtureStates(
  manifest: LocalManifestV1,
  articles: LocalArticleResourcePayload,
): LocalNewsfeedFixture['states'] {
  const ready = createReadyFeedState(manifest, articles.articles);
  return Object.freeze({
    loading: createFeedStatusState('loading', 'Lokale Nachrichtenfixture wird vorbereitet.'),
    empty: createFeedStatusState(
      'empty',
      'Die lokale Fixture enthaelt in diesem Testzustand keine Artikel.',
    ),
    error: createFeedStatusState('error', 'Die lokale Fixture konnte nicht validiert werden.'),
    offline: createFeedStatusState(
      'offline',
      'Offline-Testzustand: Es wird keine externe Quelle angefragt.',
    ),
    'optional-absent': createFeedStatusState(
      'optional-absent',
      'Medien sind fuer diese lokale Fixture bewusst nicht vorhanden.',
    ),
    ready,
  });
}

/**
 * Zentraler, rein lokaler Validierungspfad. Er prueft Struktur und alle
 * persistierten Integritaetswerte, bevor irgendein Ready-Feed entstehen kann.
 */
export async function createValidatedLocalNewsfeedFixture(
  candidate: LocalNewsfeedFixtureCandidate,
): Promise<LocalNewsfeedFixture> {
  if (!isLocalManifestV1(candidate.manifest)) {
    throw new Error('Gepinnte lokale Fixture verletzt die Manifest-v1-Struktur.');
  }

  const integrity = await validateLocalManifestIntegrity({
    manifest: candidate.manifest,
    payloads: candidate.payloads,
  });
  if (!integrity.ok) {
    throw new Error(
      `Gepinnte lokale Fixture verletzt die Integritaet: ${integrity.errors.join(' | ')}`,
    );
  }

  const payloads = candidate.payloads as Readonly<
    Record<string, LocalArticleResourcePayload | LocalEmptyResourcePayload>
  >;
  return Object.freeze({
    manifest: candidate.manifest,
    payloads: Object.freeze({
      articles: payloads.articles!,
      'supplemental-items': payloads['supplemental-items']!,
    }),
    states: createFixtureStates(
      candidate.manifest,
      payloads.articles! as LocalArticleResourcePayload,
    ),
  });
}

/**
 * Einziger Clientpfad: persistiertes Manifest plus statische Seed-Payloads.
 * Keine Hash-, Byte- oder Mengenwerte werden hier neu berechnet.
 */
export async function createPinnedLocalNewsfeedFixture(): Promise<LocalNewsfeedFixture> {
  if (!isLocalManifestV1(pinnedManifestDocument)) {
    throw new Error('Persistiertes WRN-G3-002-Manifest ist strukturell ungueltig.');
  }
  if (
    pinnedManifestDocument.sourceCommit !== localNewsfeedSeedCommit ||
    pinnedManifestDocument.provenance.fixtureSeedCommit !== localNewsfeedSeedCommit
  ) {
    throw new Error(
      'Persistiertes WRN-G3-002-Manifest ist nicht an den echten Fixture-Seed gebunden.',
    );
  }

  return createValidatedLocalNewsfeedFixture({
    manifest: pinnedManifestDocument,
    payloads: {
      articles: localNewsArticlePayload,
      'supplemental-items': localEmptyResourcePayload,
    },
  });
}

/**
 * Der Discover-Index ist absichtlich eine zweite, additive Fixture. Er wird
 * gegen die bereits manifestgeprueften Artikel gebunden und darf bei jeder
 * strukturellen, Hash- oder ID-Abweichung keinen Ready-Zustand liefern.
 */
export async function createValidatedLocalDiscoverFixture(
  articles: readonly import('@wrn/content-contracts').LocalArticle[],
  candidate: unknown = pinnedDiscoverIndexDocument,
): Promise<LocalDiscoverFixture> {
  if (!isLocalDiscoverIndexV1(candidate)) {
    throw new Error('Persistierter WRN-G3-005-Discover-Index ist strukturell ungueltig.');
  }
  const validation = await validateLocalDiscoverIndexV1(candidate, articles);
  if (!validation.ok) {
    throw new Error(
      `Persistierter WRN-G3-005-Discover-Index verletzt die Integritaet: ${validation.errors.join(' | ')}`,
    );
  }
  return Object.freeze({ index: candidate });
}

/**
 * Komfortpfad ausschliesslich fuer Tests ohne injizierten Loader. Clients mit
 * einem Loader muessen `createValidatedLocalDiscoverFixture` mit genau dessen
 * Artikelrecords verwenden.
 */
export async function createPinnedLocalDiscoverFixture(): Promise<LocalDiscoverFixture> {
  return createValidatedLocalDiscoverFixture(localNewsArticlePayload.articles);
}

/**
 * Readerdetails sind eine dritte additive, hashgebundene Fixture. Sie koennen
 * nur verwendet werden, wenn ihre IDs exakt den bereits validierten
 * Artikelrecords entsprechen. Der Reader erhaelt keinen Teaserfallback.
 */
export async function createValidatedLocalReaderDetailsFixture(
  articles: readonly import('@wrn/content-contracts').LocalArticle[],
  candidate: unknown = pinnedReaderDetailsDocument,
): Promise<LocalReaderDetailsFixture> {
  if (!isLocalReaderDetailsV1(candidate)) {
    throw new Error('Persistierte WRN-G3-006-Readerdetails sind strukturell ungueltig.');
  }
  const validation = await validateLocalReaderDetailsV1(candidate, articles);
  if (!validation.ok) {
    throw new Error(
      `Persistierte WRN-G3-006-Readerdetails verletzen die Integritaet: ${validation.errors.join(' | ')}`,
    );
  }
  return Object.freeze({ details: candidate });
}

/** Der gepinnte Komfortpfad bindet Readerdetails an dieselben drei Feed-IDs. */
export async function createPinnedLocalReaderDetailsFixture(): Promise<LocalReaderDetailsFixture> {
  return createValidatedLocalReaderDetailsFixture(localNewsArticlePayload.articles);
}

/**
 * WRN-G3-007 bindet die vorhandenen lokalen Artikel- und Readerinhalte an
 * eine separate SEO-Projektion. Es gibt keine zweite Artikelpayload.
 */
export async function createPinnedLocalWebsitePublicationFixture(): Promise<LocalWebsitePublicationFixture> {
  if (!isLocalManifestV1(pinnedG3007ContentManifestDocument)) {
    throw new Error('Persistiertes WRN-G3-007-Quellmanifest ist strukturell ungueltig.');
  }
  const integrity = await validateLocalManifestIntegrity({
    manifest: pinnedG3007ContentManifestDocument,
    payloads: {
      articles: localNewsArticlePayload,
      'supplemental-items': localEmptyResourcePayload,
    },
  });
  if (!integrity.ok) {
    throw new Error(
      `Persistiertes WRN-G3-007-Quellmanifest verletzt die Integritaet: ${integrity.errors.join(' | ')}`,
    );
  }
  if (!isLocalReaderDetailsV1(pinnedReaderDetailsDocument)) {
    throw new Error('Persistierte WRN-G3-006-Readerdetails sind strukturell ungueltig.');
  }
  if (!isLocalWebsitePublicationV1(pinnedG3007PublicationDocument)) {
    throw new Error('Persistierter WRN-G3-007-Publikationsvertrag ist strukturell ungueltig.');
  }
  const validation = await validateLocalWebsitePublicationV1(
    pinnedG3007PublicationDocument,
    pinnedG3007ContentManifestDocument,
    localNewsArticlePayload.articles,
    pinnedReaderDetailsDocument,
  );
  if (!validation.ok) {
    throw new Error(
      `Persistierter WRN-G3-007-Publikationsvertrag verletzt die Integritaet: ${validation.errors.join(' | ')}`,
    );
  }
  return Object.freeze({
    manifest: pinnedG3007ContentManifestDocument,
    publication: pinnedG3007PublicationDocument,
  });
}

/**
 * WRN-G3-008 besitzt bewusst eine neue, separat gepinnte Fixture. Sie wird
 * nicht mit dem G3-002 Feed vermischt und ruft weder Storage noch Netzwerk auf.
 */
export async function createPinnedLocalArchiveLifecycleFixture(
  knownRevocationRevision = 0,
): Promise<LocalArchiveLifecycleFixture> {
  if (!isLocalArticleResourcePayload(pinnedG3008ArticlesDocument)) {
    throw new Error('Persistierter WRN-G3-008-Artikelpayload ist strukturell ungueltig.');
  }
  if (!isLocalReaderDetailsV1(pinnedG3008ReaderDetailsDocument)) {
    throw new Error('Persistierte WRN-G3-008-Readerdetails sind strukturell ungueltig.');
  }
  if (!isLocalArchiveLifecycleV1(pinnedG3008LifecycleDocument)) {
    throw new Error('Persistierter WRN-G3-008-Archiv-Lifecycle ist strukturell ungueltig.');
  }

  const validation = await validateLocalArchiveLifecycleV1(
    pinnedG3008LifecycleDocument,
    pinnedG3008ArticlesDocument.articles,
    pinnedG3008ReaderDetailsDocument,
    knownRevocationRevision,
  );
  if (!validation.ok) {
    throw new Error(
      `Persistierter WRN-G3-008-Archiv-Lifecycle verletzt die Integritaet: ${validation.errors.join(' | ')}`,
    );
  }

  return Object.freeze({
    articles: pinnedG3008ArticlesDocument.articles,
    details: pinnedG3008ReaderDetailsDocument,
    lifecycle: pinnedG3008LifecycleDocument,
    validation,
  });
}

/**
 * Baut die erste vollstaendige, rein lokale Releasekandidatenrevision. Sie
 * kombiniert keine alten G3-008-Testartikel mit dem Feed, sondern erzeugt
 * einen neuen, hashgebundenen Lifecycle fuer exakt dieselbe validierte
 * Artikelmenge wie Feed, Discover, Reader und Websitepublikation.
 */
export async function createPinnedLocalContentReleaseFixture(): Promise<LocalContentReleaseFixture> {
  if (!isLocalManifestV1(pinnedG3007ContentManifestDocument)) {
    throw new Error('Persistiertes G3-012-Quellmanifest ist strukturell ungueltig.');
  }
  if (!isLocalDiscoverIndexV1(pinnedDiscoverIndexDocument)) {
    throw new Error('Persistierter G3-012-Discover-Index ist strukturell ungueltig.');
  }
  if (!isLocalReaderDetailsV1(pinnedReaderDetailsDocument)) {
    throw new Error('Persistierte G3-012-Readerdetails sind strukturell ungueltig.');
  }
  if (!isLocalWebsitePublicationV1(pinnedG3007PublicationDocument)) {
    throw new Error('Persistierter G3-012-Publikationsvertrag ist strukturell ungueltig.');
  }

  const manifest = pinnedG3007ContentManifestDocument;
  const articleIds = manifest.articleSets.archiveIds;
  const lifecycleBase = {
    contractVersion: localArchiveLifecycleContractVersion,
    schema: localArchiveLifecycleSchema,
    revision: 'wrn-g3-012-local-release-lifecycle-v1-d8ff4f1',
    sourceContent: {
      articlePayloadSha256: await sha256Utf8(
        canonicalJson({ articles: localNewsArticlePayload.articles }),
      ),
      readerDetailsRevision: pinnedReaderDetailsDocument.revision,
      readerDetailsIntegritySha256: pinnedReaderDetailsDocument.integritySha256,
    },
    activeArticleIds: articleIds,
    archiveArticleIds: articleIds,
    shareableArticleIds: articleIds,
    aliases: [],
    gone: [{ id: 'wrn-test-art-g3-012-gone', category: 'removed' as const }],
    revocations: {
      revision: 1,
      previousRevision: 0,
      entries: [
        {
          id: 'wrn-test-art-g3-012-revoked',
          status: 'blocked' as const,
          category: 'rights-or-safety' as const,
        },
      ],
    },
  } as const;
  const lifecycle: LocalArchiveLifecycleV1 = Object.freeze({
    ...lifecycleBase,
    integritySha256: await sha256Utf8(
      canonicalJson(archiveLifecycleIntegrityPayload(lifecycleBase)),
    ),
  });
  const descriptor: LocalContentReleaseDescriptorV1 = Object.freeze({
    contractVersion: localContentReleaseDescriptorContractVersion,
    schema: localContentReleaseDescriptorSchema,
    releaseRevision: 'wrn-g3-012-local-content-release-v1-d8ff4f1',
    expectedManifest: {
      revision: manifest.revision,
      sha256: await sha256Utf8(canonicalJson(manifest)),
    },
    expectedComponents: {
      discoverIndex: {
        revision: pinnedDiscoverIndexDocument.revision,
        sha256: await sha256Utf8(canonicalJson(pinnedDiscoverIndexDocument)),
      },
      readerDetails: {
        revision: pinnedReaderDetailsDocument.revision,
        sha256: await sha256Utf8(canonicalJson(pinnedReaderDetailsDocument)),
      },
      archiveLifecycle: {
        revision: lifecycle.revision,
        sha256: await sha256Utf8(canonicalJson(lifecycle)),
      },
      websitePublication: {
        revision: pinnedG3007PublicationDocument.revision,
        sha256: await sha256Utf8(canonicalJson(pinnedG3007PublicationDocument)),
      },
    },
    compatibility: {
      minManifestContractVersion: localManifestContractVersion,
      maxManifestContractVersion: localManifestContractVersion,
    },
  });
  const documents: LocalContentReleaseDocumentsV1 = Object.freeze({
    manifest,
    payloads: Object.freeze({
      articles: localNewsArticlePayload,
      'supplemental-items': localEmptyResourcePayload,
    }),
    discoverIndex: pinnedDiscoverIndexDocument,
    readerDetails: pinnedReaderDetailsDocument,
    archiveLifecycle: lifecycle,
    websitePublication: pinnedG3007PublicationDocument,
  });
  const ready = await createValidatedLocalContentReleaseV1(descriptor, documents);
  return Object.freeze({ descriptor, documents, ready });
}

/**
 * Selbst erstellte, payloadfreie Testmigration fuer WRN-G3-011. Die drei
 * Namen verweisen nur auf die historischen Keybereiche; die Fixture wird nie
 * gegen echte Nutzer- oder Legacydateien ausgefuehrt.
 */
export function createPinnedLocalLegacyReadingMigrationFixture(): LocalLegacyReadingMigrationFixture {
  if (!isLocalLegacyReadingMigrationInput(pinnedG3011LegacyMigrationDocument)) {
    throw new Error('Persistierte WRN-G3-011-Legacy-Migrationsfixture ist strukturell ungueltig.');
  }
  return Object.freeze({ legacy: pinnedG3011LegacyMigrationDocument });
}

function isLocalLegacyReadingMigrationInput(
  value: unknown,
): value is LocalLegacyReadingMigrationInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).sort().join(',') !== 'bookmarks,identityMap,positions,readList')
    return false;
  if (
    !Array.isArray(record.identityMap) ||
    !Array.isArray(record.bookmarks) ||
    !Array.isArray(record.readList) ||
    !Array.isArray(record.positions)
  ) {
    return false;
  }
  const timestamp = (candidate: unknown): candidate is string =>
    typeof candidate === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(candidate) &&
    Number.isFinite(Date.parse(candidate)) &&
    new Date(candidate).toISOString() === candidate;
  const articleId = (candidate: unknown): candidate is string =>
    typeof candidate === 'string' && /^wrn-test-art-[a-z0-9-]+$/.test(candidate);
  const key = (candidate: unknown): candidate is string =>
    typeof candidate === 'string' && candidate.length > 0 && candidate.length <= 512;
  const exact = (
    candidate: unknown,
    keys: readonly string[],
  ): candidate is Record<string, unknown> =>
    typeof candidate === 'object' &&
    candidate !== null &&
    !Array.isArray(candidate) &&
    Object.keys(candidate).sort().join(',') === [...keys].sort().join(',');
  return (
    record.identityMap.every(
      (entry) =>
        exact(entry, ['legacyKey', 'articleId']) &&
        key(entry.legacyKey) &&
        articleId(entry.articleId),
    ) &&
    record.bookmarks.every(
      (entry) => exact(entry, ['key', 'savedAt']) && key(entry.key) && timestamp(entry.savedAt),
    ) &&
    record.readList.every(
      (entry) => exact(entry, ['key', 'readAt']) && key(entry.key) && timestamp(entry.readAt),
    ) &&
    record.positions.every(
      (entry) =>
        exact(entry, ['key', 'fraction', 'updatedAt']) &&
        key(entry.key) &&
        typeof entry.fraction === 'number' &&
        Number.isFinite(entry.fraction) &&
        timestamp(entry.updatedAt),
    ) &&
    new Set(record.identityMap.map((entry) => (entry as { legacyKey: string }).legacyKey)).size ===
      record.identityMap.length
  );
}

/**
 * Baut eine deterministische Fixture erst nach expliziter Bindung an einen
 * echten Seed-Checkpoint. Es existiert absichtlich kein erfundener
 * Default-Commit und kein beweglicher Branchalias.
 */
export async function createLocalNewsfeedFixture(
  seed: LocalFixtureSeed,
): Promise<LocalNewsfeedFixture> {
  if (!sourceCommitPattern.test(seed.sourceCommit)) {
    throw new Error('Fixture-Seed muss ein echter 40- oder 64-stelliger Commit-Hash sein.');
  }

  const articleJson = canonicalJson(localNewsArticlePayload);
  const emptyJson = canonicalJson(localEmptyResourcePayload);
  const revision = `wrn-g3-002-local-fixture-v1-${seed.sourceCommit.slice(0, 12)}`;
  const manifest: LocalManifestV1 = Object.freeze({
    contractVersion: localManifestContractVersion,
    revision,
    generatedAt: '2026-08-23T10:00:00.000Z',
    sourceCommit: seed.sourceCommit,
    resources: Object.freeze([
      Object.freeze({
        id: 'articles',
        path: 'local-fixture://wrn-g3-002/articles.json',
        schema: localArticleResourceSchema,
        owner: 'wrn-g3-002-local-fixture',
        fallbackClass: 'fail-closed',
        availability: 'required',
        sha256: await sha256Utf8(articleJson),
        bytes: utf8ByteLength(articleJson),
        recordCount: localNewsArticlePayload.articles.length,
      }),
      Object.freeze({
        id: 'supplemental-items',
        path: 'local-fixture://wrn-g3-002/supplemental-items.json',
        schema: localEmptyResourceSchema,
        owner: 'wrn-g3-002-local-fixture',
        fallbackClass: 'render-empty',
        availability: 'optional-empty',
        sha256: await sha256Utf8(emptyJson),
        bytes: utf8ByteLength(emptyJson),
        recordCount: 0,
      }),
      Object.freeze({
        id: 'media-placeholder',
        path: 'local-fixture://wrn-g3-002/media-placeholder.json',
        schema: localEmptyResourceSchema,
        owner: 'wrn-g3-002-local-fixture',
        fallbackClass: 'render-optional-absent',
        availability: 'optional-absent',
        absence: Object.freeze({
          reason: 'Keine Medien sind Teil dieser lokalen Fixture.',
          uiState: 'optional-absent',
          nextReviewAt: '2026-09-23T10:00:00.000Z',
        }),
      }),
    ]),
    articleSets: Object.freeze({
      activeFeedIds: Object.freeze([...fixtureArticleIds]),
      archiveIds: Object.freeze([...fixtureArticleIds]),
      landingIds: Object.freeze([]),
      redirectSourceIds: Object.freeze([]),
      sitemapArticleIds: Object.freeze([]),
    }),
    articleSetHashes: Object.freeze(await createSetHashes()),
    compatibility: Object.freeze({
      minContractVersion: localManifestContractVersion,
      maxContractVersion: localManifestContractVersion,
    }),
    provenance: Object.freeze({
      generatorVersion: 'wrn-local-fixture-generator/1',
      fixtureSeedCommit: seed.sourceCommit,
      sourceKind: 'self-authored-local-fixture',
    }),
    revocationRevision: 'wrn-local-revocations-v1',
  });

  return createValidatedLocalNewsfeedFixture({
    manifest,
    payloads: {
      articles: localNewsArticlePayload,
      'supplemental-items': localEmptyResourcePayload,
    },
  });
}
