/** Editorial directory only. Admission never implies approval of every upload.
 * The original eleven entries follow docs/evidence/WRN-YOUTUBE-SHORTS-RECOMMENDATION-2026-09-09.md;
 * later link-only additions are publisher pages, not admitted videos.
 * No provider API data, player contract or offline media capability is declared.
 */
export const videoSourceLanguagesV1 = [
  'de',
  'en',
  'es',
  'fr',
  'it',
  'pt',
  'ru',
  'el',
  'tr',
] as const;
export type VideoSourceLanguageV1 = (typeof videoSourceLanguagesV1)[number];
export type VideoSourceV1 = Readonly<{
  id: string;
  name: string;
  language: VideoSourceLanguageV1;
  originalUrl: string;
  kind: 'channel' | 'collection' | 'creator';
}>;

const sources: readonly VideoSourceV1[] = [
  {
    id: 'video-source:derdarauncut',
    name: 'DerDaraUncut',
    language: 'de',
    originalUrl: 'https://www.youtube.com/@DerDaraUncut',
    kind: 'channel',
  },
  {
    id: 'video-source:die-plattform',
    name: 'die plattform',
    language: 'de',
    originalUrl: 'https://www.dieplattform.org/type/video/',
    kind: 'collection',
  },
  {
    id: 'video-source:andrewism',
    name: 'Andrewism / Andrew Sage',
    language: 'en',
    originalUrl: 'https://www.andrewsage.org/',
    kind: 'creator',
  },
  {
    id: 'video-source:zoe-baker',
    name: 'Zoe Baker',
    language: 'en',
    originalUrl: 'https://www.patreon.com/anarchozoe/about',
    kind: 'creator',
  },
  {
    id: 'video-source:fundacion-anselmo-lorenzo',
    name: 'Fundación Anselmo Lorenzo',
    language: 'es',
    originalUrl: 'https://fal.cnt.es/videos-de-la-fal/',
    kind: 'collection',
  },
  {
    id: 'video-source:tzitzimitl',
    name: 'Tzitzimitl / Esprit Critique',
    language: 'fr',
    originalUrl: 'https://www.tzitzimitl.org/',
    kind: 'creator',
  },
  {
    id: 'video-source:eleuthera',
    name: 'elèuthera',
    language: 'it',
    originalUrl: 'https://www.eleuthera.it/',
    kind: 'collection',
  },
  {
    id: 'video-source:antimidia',
    name: 'Antimídia',
    language: 'pt',
    originalUrl: 'https://antimidia.org/',
    kind: 'collection',
  },
  {
    id: 'video-source:avtonom',
    name: 'Автономное Действие / Avtonom',
    language: 'ru',
    originalUrl: 'https://www.avtonom.org/',
    kind: 'collection',
  },
  {
    id: 'video-source:aftoleksi',
    name: 'Αυτολεξεί / Aftoleksi',
    language: 'el',
    originalUrl: 'https://www.aftoleksi.gr/',
    kind: 'collection',
  },
  {
    id: 'video-source:yeryuzu-postasi',
    name: 'Yeryüzü Postası',
    language: 'tr',
    originalUrl: 'https://www.yeryuzupostasi.org/category/video/',
    kind: 'collection',
  },
  // Publisher-link additions checked on 2026-09-28; not part of the 2026-09-09 PO selection.
  {
    id: 'video-source:labournet-tv',
    name: 'Labournet TV',
    language: 'de',
    originalUrl: 'https://www.labournet.tv/de/videos',
    kind: 'collection',
  },
  {
    id: 'video-source:actvism-munich',
    name: 'acTVism Munich',
    language: 'de',
    originalUrl: 'https://www.actvism.org/archive/',
    kind: 'collection',
  },
];

export const videoSourceCatalogV1 = Object.freeze({
  schemaVersion: 'video-source-directory-v1' as const,
  revision: '2026-09-29.1',
  selectedOn: '2026-09-09',
  disposition: 'directory-only' as const,
  sources: Object.freeze(sources.map((source) => Object.freeze(source))),
});

/** Unknown filters yield an empty selection; they never silently broaden it. */
export function filterVideoSourcesV1(language: string): readonly VideoSourceV1[] {
  return language === 'all'
    ? videoSourceCatalogV1.sources
    : videoSourceCatalogV1.sources.filter((source) => source.language === language);
}

/** Metadata-checked original links; individual content admission is still pending. */
export type SelectedVideoV1 = Readonly<{
  id: string;
  sourceId: VideoSourceV1['id'];
  title: string;
  language: VideoSourceLanguageV1;
  originalUrl: string;
  format: 'short' | 'video';
  metadataCheckedOn: string;
}>;

const selectedVideos: readonly SelectedVideoV1[] = [
  {
    id: 'selected-video:derdara-klopp-afd',
    sourceId: 'video-source:derdarauncut',
    title: 'Klopp ANSAGE An AfD!',
    language: 'de',
    originalUrl: 'https://www.youtube.com/shorts/3SUzjmdDORU',
    format: 'short',
    metadataCheckedOn: '2026-09-25',
  },
  {
    id: 'selected-video:andrewism-how-anarchy-works',
    sourceId: 'video-source:andrewism',
    title: 'How Anarchy Works',
    language: 'en',
    originalUrl: 'https://www.youtube.com/watch?v=lrTzjaXskUU',
    format: 'video',
    metadataCheckedOn: '2026-09-25',
  },
];

export const selectedVideosV1: readonly SelectedVideoV1[] = Object.freeze(
  selectedVideos.map((video) => Object.freeze(video)),
);

export function filterSelectedVideosV1(language: string): readonly SelectedVideoV1[] {
  return language === 'all'
    ? selectedVideosV1
    : selectedVideosV1.filter((video) => video.language === language);
}
