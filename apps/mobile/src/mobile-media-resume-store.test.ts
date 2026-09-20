import { describe, expect, it } from 'vitest';
import {
  isMobileMediaResumeRecord,
  mobileMediaResumeDatabaseName,
} from './mobile-media-resume-store';

const record = {
  recordVersion: 1,
  key: 'resume-1',
  episodeId: 'wrn-media-episode-local',
  audioAssetId: 'wrn-media-asset-audio-local',
  releaseRevision: 1,
  audioAssetHash: 'a'.repeat(64),
  positionMs: 1,
  durationMs: 2,
} as const;
describe('media resume privacy boundary', () => {
  it('uses the isolated v1 database and exact timestamp-free record shape', () => {
    expect(mobileMediaResumeDatabaseName).toBe('wrn-mobile-media-resume-v1');
    expect(isMobileMediaResumeRecord(record)).toBe(true);
    expect(isMobileMediaResumeRecord({ ...record, updatedAt: 1 })).toBe(false);
    expect(isMobileMediaResumeRecord({ ...record, positionMs: 2 })).toBe(false);
  });
});
