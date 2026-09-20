import {
  clearAllLocalReadingData,
  createEmptyLocalReadingState,
  saveLocalReadingArticle,
} from '@wrn/domain';
import { describe, expect, it } from 'vitest';
import {
  loadWebsiteReadingState,
  mutateWebsiteReadingState,
  websiteReadingStateStorageKey,
} from './local-reading-state';

function createMemoryStorage(initial?: string) {
  let raw = initial ?? null;
  return {
    getItem: (key: string) => (key === websiteReadingStateStorageKey ? raw : null),
    setItem: (key: string, value: string) => {
      if (key === websiteReadingStateStorageKey) raw = value;
    },
    readRaw: () => raw,
  };
}

describe('website local reading-state mutations', () => {
  it('rebases every mutation on the latest valid document instead of a stale tab snapshot', async () => {
    const x = saveLocalReadingArticle(
      createEmptyLocalReadingState(),
      'wrn-test-art-x',
      '2026-08-29T06:00:00.000Z',
    );
    const storage = createMemoryStorage(JSON.stringify(x));
    const staleTabSnapshot = loadWebsiteReadingState(storage).state;

    await mutateWebsiteReadingState((current) => clearAllLocalReadingData(current), storage);
    await mutateWebsiteReadingState(
      (current) => saveLocalReadingArticle(current, 'wrn-test-art-y', '2026-08-29T06:01:00.000Z'),
      storage,
    );

    expect(staleTabSnapshot.entries.map((entry) => entry.articleId)).toEqual(['wrn-test-art-x']);
    expect(loadWebsiteReadingState(storage).state.entries.map((entry) => entry.articleId)).toEqual([
      'wrn-test-art-y',
    ]);
  });

  it.each(['{\n  "contractVersion": "2.0.0",\n  "v2OnlyId": "future"\n}', '{not-json'])(
    'keeps a later unknown document byte-identical',
    async (raw) => {
      const storage = createMemoryStorage(raw);
      const result = await mutateWebsiteReadingState(
        (current) => saveLocalReadingArticle(current, 'wrn-test-art-y', '2026-08-29T06:01:00.000Z'),
        storage,
      );

      expect(result.kind).toBe('read-only');
      expect(storage.readRaw()).toBe(raw);
    },
  );

  it('reports a storage write failure without claiming a committed state', async () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const result = await mutateWebsiteReadingState(
      (current) => saveLocalReadingArticle(current, 'wrn-test-art-y', '2026-08-29T06:01:00.000Z'),
      storage,
    );
    expect(result.kind).toBe('failed');
    expect(result.state.entries).toEqual([]);
  });

  it('detects a document changed by another writer between read and write', async () => {
    const initial = saveLocalReadingArticle(
      createEmptyLocalReadingState(),
      'wrn-test-art-x',
      '2026-08-29T06:00:00.000Z',
    );
    const futureRaw = '{"contractVersion":"2.0.0","v2OnlyId":"future"}';
    let reads = 0;
    let raw = JSON.stringify(initial);
    const storage = {
      getItem: () => {
        reads += 1;
        if (reads === 2) raw = futureRaw;
        return raw;
      },
      setItem: (_key: string, value: string) => {
        raw = value;
      },
    };
    const result = await mutateWebsiteReadingState(
      (current) => saveLocalReadingArticle(current, 'wrn-test-art-y', '2026-08-29T06:01:00.000Z'),
      storage,
    );
    expect(result.kind).toBe('read-only');
    expect(raw).toBe(futureRaw);
  });
});
