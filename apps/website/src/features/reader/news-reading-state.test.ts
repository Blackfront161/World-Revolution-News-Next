import { beforeEach, describe, expect, it } from 'vitest';
import {
  changeNewsReadingState,
  loadNewsReadingState,
  newsReadingStorageKey,
} from './news-reading-state';
import { directoryArticlePath } from './directory-article-url';
const id = `news-${'a'.repeat(64)}`,
  other = `news-${'b'.repeat(64)}`;
const coordinate = async <T>(operation: () => T) => operation();
beforeEach(() => localStorage.clear());
describe('Website news reading storage and canonical links', () => {
  it('keeps save/read flags across separate operations without copying any article content or touching other stores', async () => {
    localStorage.setItem(
      'wrn.website-production-reading-state.v2',
      'existing opaque production state',
    );
    await changeNewsReadingState(
      { kind: 'saved', articleId: id, value: true },
      localStorage,
      coordinate,
    );
    await changeNewsReadingState(
      { kind: 'read', articleId: id, value: true },
      localStorage,
      coordinate,
    );
    await changeNewsReadingState(
      { kind: 'saved', articleId: other, value: true },
      localStorage,
      coordinate,
    );
    await changeNewsReadingState(
      { kind: 'saved', articleId: id, value: false },
      localStorage,
      coordinate,
    );
    expect(loadNewsReadingState().state.entries).toEqual([
      { articleId: id, saved: false, read: true },
      { articleId: other, saved: true, read: false },
    ]);
    expect(localStorage.getItem('wrn.website-production-reading-state.v2')).toBe(
      'existing opaque production state',
    );
    await changeNewsReadingState({ kind: 'clear' }, localStorage, coordinate);
    expect(loadNewsReadingState().state.entries).toEqual([]);
  });
  it.each([
    '{',
    '{}',
    JSON.stringify({ schema: 'future', entries: [] }),
    JSON.stringify({
      schema: newsReadingStorageKey,
      entries: [{ articleId: id, saved: true, read: false, body: 'unexpected' }],
    }),
    ' '.repeat(128 * 1024 + 1),
  ])('protects malformed, future or oversized state instead of overwriting it', async (raw) => {
    localStorage.setItem(newsReadingStorageKey, raw);
    expect(loadNewsReadingState().kind).toBe('read-only');
    expect((await changeNewsReadingState({ kind: 'clear' }, localStorage, coordinate)).kind).toBe(
      'read-only',
    );
    expect(localStorage.getItem(newsReadingStorageKey)).toBe(raw);
  });
  it('refuses capacity overflow and keeps all 500 existing entries', async () => {
    const entries = Array.from({ length: 500 }, (_, i) => ({
      articleId: `news-${i.toString(16).padStart(64, '0')}`,
      saved: true,
      read: false,
    }));
    const raw = JSON.stringify({ schema: newsReadingStorageKey, entries });
    localStorage.setItem(newsReadingStorageKey, raw);
    expect(
      (
        await changeNewsReadingState(
          { kind: 'saved', articleId: id, value: true },
          localStorage,
          coordinate,
        )
      ).kind,
    ).toBe('capacity-conflict');
    expect(localStorage.getItem(newsReadingStorageKey)).toBe(raw);
  });
  it('detects an intervening non-cooperating write and a failing storage port', async () => {
    const changed = JSON.stringify({
      schema: newsReadingStorageKey,
      entries: [{ articleId: other, saved: true, read: false }],
    });
    let reads = 0,
      written = false;
    const port = {
      getItem: () => (++reads === 1 ? null : changed),
      setItem: () => {
        written = true;
      },
    };
    expect(
      (
        await changeNewsReadingState(
          { kind: 'saved', articleId: id, value: true },
          port,
          coordinate,
        )
      ).kind,
    ).toBe('write-failed');
    expect(written).toBe(false);
    const failed = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(
      (
        await changeNewsReadingState(
          { kind: 'saved', articleId: id, value: true },
          failed,
          coordinate,
        )
      ).kind,
    ).toBe('write-failed');
  });
  it('rejects duplicate identities, invalid IDs and extra share parameters', async () => {
    for (const invalid of [
      'wrn-art-0000',
      id + '\n',
      id + '?token=secret',
      'https://other.invalid/',
    ]) {
      expect(() => directoryArticlePath(invalid, 'de')).toThrow();
      expect(
        (
          await changeNewsReadingState(
            { kind: 'saved', articleId: invalid, value: true },
            localStorage,
            coordinate,
          )
        ).kind,
      ).toBe('write-failed');
    }
    expect(directoryArticlePath(id, 'tr')).toBe(`/?article=${id}&lang=tr#home`);
    expect(() => directoryArticlePath(id, 'de&private=true' as 'de')).toThrow();
    localStorage.setItem(
      newsReadingStorageKey,
      JSON.stringify({
        schema: newsReadingStorageKey,
        entries: [
          { articleId: id, saved: true, read: false },
          { articleId: id, saved: true, read: false },
        ],
      }),
    );
    expect(loadNewsReadingState().kind).toBe('read-only');
  });
});
