import { describe, expect, it } from 'vitest';
import {
  filterSelectedVideosV1,
  filterVideoSourcesV1,
  selectedVideosV1,
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

  it('keeps individually checked videos linked to accepted sources and original HTTPS pages', () => {
    expect(selectedVideosV1).toHaveLength(2);
    expect(selectedVideosV1.map((video) => video.originalUrl)).toEqual([
      'https://www.youtube.com/shorts/3SUzjmdDORU',
      'https://www.youtube.com/watch?v=lrTzjaXskUU',
    ]);
    for (const video of selectedVideosV1) {
      expect(videoSourceCatalogV1.sources.some((source) => source.id === video.sourceId)).toBe(
        true,
      );
      const url = new URL(video.originalUrl);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('www.youtube.com');
      expect(Object.isFrozen(video)).toBe(true);
    }
    expect(filterSelectedVideosV1('de').map((video) => video.format)).toEqual(['short']);
    expect(filterSelectedVideosV1('en').map((video) => video.format)).toEqual(['video']);
    expect(filterSelectedVideosV1('fr')).toEqual([]);
    expect(filterSelectedVideosV1('unknown')).toEqual([]);
  });
});
