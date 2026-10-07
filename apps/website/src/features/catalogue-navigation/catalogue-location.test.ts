import { describe, expect, it } from 'vitest';
import { uiLanguageIds } from '@wrn/ui-language';
import {
  catalogueHref,
  emptyCatalogueView,
  readCatalogueLocation,
  readCatalogueReturn,
} from './catalogue-location';
import knowledge from '../knowledge/packed/legacy-knowledge-v1.json';
import catalog from '../events-media/packed/production-events-media-v1.json';
describe('bounded website item links and private return context', () => {
  it('supports every existing book, term and metadata record without changing their IDs', () => {
    for (const b of knowledge.currentKnowledge.library.books)
      expect(readCatalogueLocation(catalogueHref('library', 'de', b.id).split('#')[1]!)?.item).toBe(
        b.id,
      );
    for (const t of knowledge.currentKnowledge.lexicon.terms)
      expect(readCatalogueLocation(catalogueHref('lexicon', 'en', t.id).split('#')[1]!)?.item).toBe(
        t.id,
      );
    for (const kind of ['radio', 'podcasts', 'videos', 'events'] as const)
      for (const r of catalog.current.collections[kind])
        expect(readCatalogueLocation(catalogueHref(kind, 'de', r.id).split('#')[1]!)?.item).toBe(
          r.id,
        );
  });
  it.each(uiLanguageIds)('canonical links contain only public ID and language %s', (language) => {
    const value = catalogueHref('lexicon', language, 'mutual-aid');
    expect(value).toBe(`/?lang=${language}#knowledge/lexicon?item=mutual-aid`);
    expect(readCatalogueLocation(value.split('#')[1]!)).toEqual({
      kind: 'lexicon',
      item: 'mutual-aid',
      invalidItem: false,
    });
  });
  it.each([
    '',
    'news-abc',
    'app-' + 'a'.repeat(64) + '\n',
    'https://example.org',
    '../private',
    'one&item=two',
  ])('rejects unsafe or wrong-kind podcast identity %s', (value) => {
    expect(() => catalogueHref('podcasts', 'de', value)).toThrow('catalogue-link-invalid');
  });
  it('never changes duplicate or malformed requested items to another live item', () => {
    expect(readCatalogueLocation('#lexicon?item=a&item=b')).toEqual({
      kind: 'lexicon',
      item: null,
      invalidItem: true,
    });
    expect(readCatalogueLocation('#library?item=%0Asecret')?.invalidItem).toBe(true);
    expect(readCatalogueLocation('#help?item=mutual-aid')).toBeNull();
    expect(readCatalogueLocation('#knowledge/library?item=one?item=two')).toBeNull();
  });
  it('restores bounded catalogue context and rejects future fields, overflow and unsafe selectors', () => {
    const good = {
      wrnCatalogueReturn: {
        kind: 'library',
        view: { ...emptyCatalogueView, query: 'Rocker', shown: 60 },
        scrollY: 1234,
        focusItem: 'anarchism',
        focusControl: null,
      },
    };
    expect(readCatalogueReturn(good, 'library')).toEqual(good.wrnCatalogueReturn);
    expect(readCatalogueReturn(good, 'lexicon')).toBeNull();
    for (const variant of [
      { ...good.wrnCatalogueReturn, view: { ...emptyCatalogueView, privateDraft: 'secret' } },
      { ...good.wrnCatalogueReturn, scrollY: NaN },
      { ...good.wrnCatalogueReturn, focusItem: '"]button' },
      { ...good.wrnCatalogueReturn, view: { ...emptyCatalogueView, shown: 3001 } },
      { ...good.wrnCatalogueReturn, view: { ...emptyCatalogueView, query: 'x'.repeat(501) } },
      { ...good.wrnCatalogueReturn, kind: 'help' },
    ])
      expect(readCatalogueReturn({ wrnCatalogueReturn: variant }, 'library')).toBeNull();
  });
});
