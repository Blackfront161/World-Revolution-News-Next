import { foundationContractVersion, type ShellStateContract } from '@wrn/api-contracts';
import {
  createFeedStatusState,
  createReadyFeedState,
  type FeedState,
  type ShellState,
} from '@wrn/domain';
import {
  canonicalJson,
  localArticleResourceSchema,
  localEmptyResourceSchema,
  localManifestContractVersion,
  sha256Utf8,
  utf8ByteLength,
  type LocalArticleResourcePayload,
  type LocalEmptyResourcePayload,
  type LocalManifestV1,
} from '@wrn/content-contracts';

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

/**
 * Selbst erstellte, neutrale Testinhalte. Sie enthalten keine realen Personen,
 * keine Drittmedien und keine aufgerufenen URLs.
 */
export const localNewsArticlePayload: LocalArticleResourcePayload = Object.freeze({
  articles: Object.freeze([
    Object.freeze({
      id: 'wrn-test-art-cedar',
      title: 'Lokale Testmeldung zur gemeinsamen Leseliste',
      teaser:
        'Diese selbst erstellte Meldung prueft ausschliesslich die lokale Darstellung eines vollstaendigen ersten Satzes.',
      publishedAt: '2026-08-23T10:00:00.000Z',
      originalUrl: 'https://fixture.invalid/articles/cedar',
      source: Object.freeze({ id: 'wrn-test-source-local', name: 'Lokale Testquelle' }),
      originalLanguage: 'de',
      tags: Object.freeze(['lokal', 'fixture']),
      rights: Object.freeze({
        status: 'fixture-authored-no-third-party-media',
        reference: 'wrn-g3-002-local-fixture',
      }),
      transformation: Object.freeze({
        status: 'original' as const,
        reference: 'self-authored-fixture',
      }),
      translation: Object.freeze({ status: 'not-requested' as const, reference: 'not-applicable' }),
    }),
    Object.freeze({
      id: 'wrn-test-art-ember',
      title: 'Local fixture note for responsive reading',
      teaser:
        'This self-authored fixture checks that the same neutral metadata remains readable in a second language.',
      publishedAt: '2026-08-22T14:30:00.000Z',
      originalUrl: 'https://fixture.invalid/articles/ember',
      source: Object.freeze({ id: 'wrn-test-source-local', name: 'Lokale Testquelle' }),
      originalLanguage: 'en',
      tags: Object.freeze(['local', 'fixture']),
      rights: Object.freeze({
        status: 'fixture-authored-no-third-party-media',
        reference: 'wrn-g3-002-local-fixture',
      }),
      transformation: Object.freeze({
        status: 'original' as const,
        reference: 'self-authored-fixture',
      }),
      translation: Object.freeze({ status: 'not-requested' as const, reference: 'not-applicable' }),
    }),
    Object.freeze({
      id: 'wrn-test-art-fern',
      title: 'Nota local de prueba para la vista de noticias',
      teaser:
        'Esta nota creada para pruebas comprueba una tercera tarjeta sin afirmar hechos sobre personas reales.',
      publishedAt: '2026-08-21T08:15:00.000Z',
      originalUrl: 'https://fixture.invalid/articles/fern',
      source: Object.freeze({ id: 'wrn-test-source-local', name: 'Lokale Testquelle' }),
      originalLanguage: 'es',
      tags: Object.freeze(['local', 'fixture']),
      rights: Object.freeze({
        status: 'fixture-authored-no-third-party-media',
        reference: 'wrn-g3-002-local-fixture',
      }),
      transformation: Object.freeze({
        status: 'original' as const,
        reference: 'self-authored-fixture',
      }),
      translation: Object.freeze({ status: 'not-requested' as const, reference: 'not-applicable' }),
    }),
  ]),
});

export const localEmptyResourcePayload: LocalEmptyResourcePayload = Object.freeze({
  items: Object.freeze([]),
});

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
export const localNewsfeedSeedCommit = '6c9ca5521f7338334d2e443155f0a5f2bf5392a6' as const;

async function createSetHashes() {
  return {
    activeFeedIds: await sha256Utf8(canonicalJson(fixtureArticleIds)),
    archiveIds: await sha256Utf8(canonicalJson(fixtureArticleIds)),
    landingIds: await sha256Utf8(canonicalJson(emptyIds)),
    redirectSourceIds: await sha256Utf8(canonicalJson(emptyIds)),
    sitemapArticleIds: await sha256Utf8(canonicalJson(emptyIds)),
  };
}

/**
 * Liefert die lokal verankerte, reale Seed-Fixierung als unveraenderliche
 * Quelle fuer WRN-G3-002.
 */
export function createPinnedLocalNewsfeedFixture(): Promise<LocalNewsfeedFixture> {
  return createLocalNewsfeedFixture({ sourceCommit: localNewsfeedSeedCommit });
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

  const ready = createReadyFeedState(manifest, localNewsArticlePayload.articles);
  return Object.freeze({
    manifest,
    payloads: Object.freeze({
      articles: localNewsArticlePayload,
      'supplemental-items': localEmptyResourcePayload,
    }),
    states: Object.freeze({
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
    }),
  });
}
