import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { uiLanguageIds } from '@wrn/ui-language';
import { LegacyUpgradeSaved } from './legacy-upgrade-saved';
import {
  parseLegacyBookmarks,
  parseLegacyOrphanReading,
  readLegacyOfflineArticles,
} from './legacy-upgrade-data';

afterEach(() => {
  localStorage.removeItem('wrn_bookmarks');
  localStorage.removeItem('wrn_read_list');
  localStorage.removeItem('wrn_read_positions');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('2.1.1 saved article bridge', () => {
  it('joins the old rich bookmark with its exact offline record without changing legacy bytes', async () => {
    const raw = JSON.stringify([
      { id: 'old-article', link: 'https://anfdeutsch.com/a', title: 'ANRed', content: 'excerpt' },
    ]);
    localStorage.setItem('wrn_bookmarks', raw);
    expect(
      parseLegacyBookmarks(raw, [
        { id: 'old-article', link: 'https://anfdeutsch.com/a', content: 'Full offline body' },
      ]),
    ).toEqual([
      {
        key: 'https://anfdeutsch.com/a',
        title: 'ANRed',
        source: '',
        content: 'Full offline body',
        read: false,
        progress: null,
      },
    ]);
    expect(localStorage.getItem('wrn_bookmarks')).toBe(raw);
  });

  it('projects the old read marker and finite position for the same saved key only', () => {
    const key = 'https://anfdeutsch.com/a';
    const raw = JSON.stringify([{ link: key, title: 'ANRed' }]);
    expect(
      parseLegacyBookmarks(
        raw,
        null,
        JSON.stringify([key]),
        JSON.stringify({ [key]: { ratio: 0.4 } }),
      )[0],
    ).toMatchObject({ read: true, progress: 0.4 });
    expect(
      parseLegacyBookmarks(raw, null, '{broken', JSON.stringify({ [key]: { ratio: 9 } }))[0],
    ).toMatchObject({ read: false, progress: null });
  });

  it('uses source/title/date reading identity for a linkless bookmark that has an offline ID', () => {
    const readingKey = 'ANRed::Heilige Bettlaken, Batman!::2026-09-20';
    const raw = JSON.stringify([
      {
        id: 'offline-id',
        quelleName: 'ANRed',
        title: 'Heilige Bettlaken, Batman!',
        pubDate: '2026-09-20',
      },
    ]);
    expect(
      parseLegacyBookmarks(
        raw,
        [{ id: 'offline-id', content: 'Offline body' }],
        JSON.stringify([readingKey]),
        JSON.stringify({ [readingKey]: { ratio: 0.6 } }),
      ),
    ).toEqual([
      {
        key: 'offline-id',
        title: 'Heilige Bettlaken, Batman!',
        source: 'ANRed',
        content: 'Offline body',
        read: true,
        progress: 0.6,
      },
    ]);
  });

  it('renders old content as text, never as HTML', () => {
    localStorage.setItem(
      'wrn_bookmarks',
      JSON.stringify([
        {
          link: 'https://example.org/a',
          title: '<img src=x onerror=alert(1)>',
          content: '<script>alert(1)</script>',
        },
      ]),
    );
    render(<LegacyUpgradeSaved language="de" />);
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
    expect(screen.getByText('<script>alert(1)</script>')).toBeTruthy();
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
  });

  it.each(uiLanguageIds)('labels the saved archive in registered language %s', (language) => {
    localStorage.setItem(
      'wrn_bookmarks',
      JSON.stringify([{ link: 'https://example.org/a', title: 'Original title' }]),
    );
    const { container, unmount } = render(<LegacyUpgradeSaved language={language} />);
    const heading = container.querySelector('h3')?.textContent;
    expect(heading).toBeTruthy();
    if (language !== 'en') expect(heading).not.toBe('Saved articles from version 2.1.1');
    expect(screen.getByText('Original title')).toBeTruthy();
    unmount();
  });

  it('fails closed for corrupt and oversized lists', () => {
    expect(parseLegacyBookmarks('{bad')).toEqual([]);
    expect(
      parseLegacyBookmarks(
        JSON.stringify(Array.from({ length: 201 }, () => ({ title: 'x', link: 'a' }))),
      ),
    ).toEqual([]);
  });

  it('does not create an IndexedDB database when the old database is absent', async () => {
    const open = vi.fn();
    const factory = { databases: async () => [], open } as unknown as IDBFactory;
    expect(await readLegacyOfflineArticles(factory)).toBeNull();
    expect(open).not.toHaveBeenCalled();
  });

  it('does not open a future IndexedDB schema', async () => {
    const open = vi.fn();
    const factory = {
      databases: async () => [{ name: 'world-revolution-news', version: 2 }],
      open,
    } as unknown as IDBFactory;
    expect(await readLegacyOfflineArticles(factory)).toBeNull();
    expect(open).not.toHaveBeenCalled();
  });

  it('reads and closes the exact version-1 dataset using a readonly transaction', async () => {
    const stored = [{ link: 'https://example.org/a', content: 'Preserved body' }];
    const getRequest = {
      result: { key: 'news-app-2-saved-articles', data: stored },
      onsuccess: null as null | (() => void),
      onerror: null as null | (() => void),
    };
    const get = vi.fn(() => {
      queueMicrotask(() => getRequest.onsuccess?.());
      return getRequest;
    });
    const objectStore = vi.fn(() => ({ get }));
    const transaction = vi.fn(() => ({ objectStore, onabort: null }));
    const close = vi.fn();
    const db = {
      version: 1,
      objectStoreNames: { contains: (name: string) => name === 'datasets' },
      transaction,
      close,
    };
    const request = {
      result: db,
      onsuccess: null as null | (() => void),
      onerror: null as null | (() => void),
      onblocked: null as null | (() => void),
      onupgradeneeded: null as null | (() => void),
      transaction: null,
    };
    const open = vi.fn(() => {
      queueMicrotask(() => request.onsuccess?.());
      return request;
    });
    const factory = {
      databases: async () => [{ name: 'world-revolution-news', version: 1 }],
      open,
    } as unknown as IDBFactory;
    expect(await readLegacyOfflineArticles(factory)).toBe(stored);
    expect(open).toHaveBeenCalledWith('world-revolution-news');
    expect(transaction).toHaveBeenCalledWith('datasets', 'readonly');
    expect(get).toHaveBeenCalledWith('news-app-2-saved-articles');
    expect(close).toHaveBeenCalledTimes(1);
    expect(stored).toEqual([{ link: 'https://example.org/a', content: 'Preserved body' }]);
  });

  it('fails closed when the old database open is blocked', async () => {
    const request = {
      onblocked: null as null | (() => void),
      onerror: null as null | (() => void),
      onsuccess: null as null | (() => void),
      onupgradeneeded: null as null | (() => void),
      transaction: null,
    };
    const open = vi.fn(() => {
      queueMicrotask(() => request.onblocked?.());
      return request;
    });
    const factory = {
      databases: async () => [{ name: 'world-revolution-news', version: 1 }],
      open,
    } as unknown as IDBFactory;
    expect(await readLegacyOfflineArticles(factory)).toBeNull();
  });

  it('shows orphaned read and progress records without fetching or changing V2 state', () => {
    const read = 'https://example.org/read';
    const position = 'https://example.org/position';
    localStorage.setItem('wrn_read_list', JSON.stringify([read]));
    localStorage.setItem(
      'wrn_read_positions',
      JSON.stringify({ [position]: { ratio: 0.35, title: 'Continue here' } }),
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    render(<LegacyUpgradeSaved language="en" />);
    expect(screen.getByText(read)).toBeTruthy();
    expect(screen.getByText(position)).toBeTruthy();
    expect(screen.getByText('Continue here')).toBeTruthy();
    expect(screen.getByText('Reading progress: 35%')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('wrn.mobile-production-reading-state.v2')).toBeNull();
  });

  it('keeps valid HTTP, HTTPS and old composite keys when a neighboring record is invalid', () => {
    const https = 'https://example.org/read';
    const http = 'http://example.org/older';
    const composite = 'ANRed::Old article::2026-09-20';
    const items = parseLegacyOrphanReading(
      null,
      JSON.stringify([https, 'javascript:alert(1)', http, composite]),
      JSON.stringify({ [composite]: { ratio: 0.25, title: 'Old article' } }),
    );
    expect(items).toEqual([
      { key: https, title: 'example.org', read: true, progress: null },
      { key: http, title: 'example.org', read: true, progress: null },
      { key: composite, title: 'Old article', read: true, progress: 0.25 },
    ]);
    const bookmarked = JSON.stringify([
      { id: 'offline-id', quelleName: 'ANRed', title: 'Old article', pubDate: '2026-09-20' },
    ]);
    expect(parseLegacyOrphanReading(bookmarked, JSON.stringify([composite]), null)).toEqual([]);
  });

  it('rejects malformed, future, oversized and unsafe orphan records', () => {
    expect(parseLegacyOrphanReading(null, '{bad', null)).toEqual([]);
    expect(parseLegacyOrphanReading(null, JSON.stringify({ schema: 'future' }), null)).toEqual([]);
    expect(
      parseLegacyOrphanReading(
        null,
        JSON.stringify(Array.from({ length: 201 }, () => 'https://example.org/a')),
        null,
      ),
    ).toEqual([]);
    expect(
      parseLegacyOrphanReading(
        null,
        JSON.stringify(['https://localhost/a', 'http://127.0.0.1/a']),
        null,
      ),
    ).toEqual([]);
    expect(
      parseLegacyOrphanReading(
        null,
        null,
        JSON.stringify({ 'https://example.org/a': { ratio: 2 } }),
      ),
    ).toEqual([]);
  });
});
