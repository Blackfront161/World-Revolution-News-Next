import { describe, expect, it } from 'vitest';
import {
  createProductionMediaResumeStoreFactory,
  isProductionMediaResumeRecord,
  productionMediaResumeDatabaseNames,
  productionMediaResumeStoreName,
} from '../../../packages/browser-content/src/production-media-resume-store';

const record = Object.freeze({
  recordVersion: 1 as const,
  key: 'episode:episode-1',
  episodeId: 'episode-1',
  streamId: 'stream-1',
  releaseRevision: 'release-1',
  streamRevision: 'a'.repeat(64),
  positionMs: 0,
  durationMs: 1000,
});
describe('production-media resume storage contract', () => {
  it('pins isolated databases and minimal exact records', () => {
    expect(productionMediaResumeDatabaseNames).toEqual([
      'wrn.mobile-production-media-resume.v1',
      'wrn.website-production-media-resume.v1',
    ]);
    expect(productionMediaResumeStoreName).toBe('mediaResume');
    expect(isProductionMediaResumeRecord(record)).toBe(true);
    expect(
      isProductionMediaResumeRecord({ ...record, url: 'https://publisher.invalid/a.mp3' }),
    ).toBe(false);
    expect(isProductionMediaResumeRecord({ ...record, key: 'episode:other' })).toBe(false);
    expect(isProductionMediaResumeRecord({ ...record, durationMs: 999 })).toBe(false);
    expect(
      isProductionMediaResumeRecord({
        durationMs: 1000,
        positionMs: 0,
        streamRevision: 'a'.repeat(64),
        releaseRevision: 'release-1',
        streamId: 'stream-1',
        episodeId: 'episode-1',
        key: 'episode:episode-1',
        recordVersion: 1,
      }),
    ).toBe(true);
  });
  it('accepts only the two client-owned databases before opening IDB', () => {
    expect(() => createProductionMediaResumeStoreFactory('wrong' as never)).toThrow('protected');
  });
});
