import { describe, expect, it } from 'vitest';
import {
  filterVideoSourcesV1,
  videoSourceCatalogV1,
  videoSourceLanguagesV1,
} from '../src/video-sources-v1';

describe('approved video source directory v1', () => {
  it('binds exactly the accepted eleven sources without promoting research candidates', () => {
    expect(videoSourceCatalogV1.disposition).toBe('directory-only');
    expect(videoSourceCatalogV1.sources.map((source) => source.id)).toEqual([
      'video-source:derdarauncut',
      'video-source:die-plattform',
      'video-source:andrewism',
      'video-source:zoe-baker',
      'video-source:fundacion-anselmo-lorenzo',
      'video-source:tzitzimitl',
      'video-source:eleuthera',
      'video-source:antimidia',
      'video-source:avtonom',
      'video-source:aftoleksi',
      'video-source:yeryuzu-postasi',
    ]);
    for (const source of videoSourceCatalogV1.sources) {
      const url = new URL(source.originalUrl);
      expect(url.protocol).toBe('https:');
      expect(url.username + url.password + url.port).toBe('');
      expect(Object.isFrozen(source)).toBe(true);
      expect(source).not.toHaveProperty('videoId');
    }
    expect(videoSourceCatalogV1.sources[0]?.originalUrl).toBe(
      'https://www.youtube.com/@DerDaraUncut',
    );
  });

  it('covers nine languages and filters without changing the accepted catalog', () => {
    expect(filterVideoSourcesV1('all')).toHaveLength(11);
    expect(filterVideoSourcesV1('de').map((source) => source.name)).toEqual([
      'DerDaraUncut',
      'die plattform',
    ]);
    expect(filterVideoSourcesV1('en')).toHaveLength(2);
    for (const language of videoSourceLanguagesV1) {
      const selected = filterVideoSourcesV1(language);
      expect(selected.length).toBeGreaterThan(0);
      expect(selected.every((source) => source.language === language)).toBe(true);
    }
    expect(filterVideoSourcesV1('unknown')).toEqual([]);
    expect(filterVideoSourcesV1('DE')).toEqual([]);
    expect(filterVideoSourcesV1('all')).toHaveLength(11);
  });
});
