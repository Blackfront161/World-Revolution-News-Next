import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { formatUiCopy, getUiCopy, uiLanguageIds, uiLanguageNativeNames } from '@wrn/ui-language';
import { getWebsiteSupportCopy } from '../../../packages/ui-language/src/website-support';
import { App } from './App';
import { websiteReadingStateStorageKey } from './local-reading-state';
import { websiteUiLanguageStorageKey } from './ui-language-preference';

afterEach(() => {
  window.history.replaceState({}, '', '/');
  window.localStorage.removeItem('wrn.theme-preference.v1');
  window.localStorage.removeItem(websiteReadingStateStorageKey);
  window.localStorage.removeItem(websiteUiLanguageStorageKey);
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themePreference;
});

describe('website local newsfeed', () => {
  it('applies the handoff language before the production welcome dialog renders', () => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/?lang=de');
    render(<App contentMode="production" />);
    expect(screen.getByTestId('ui-language-selector')).toHaveValue('de');
    expect(screen.getByRole('dialog')).toHaveTextContent(getWebsiteSupportCopy('de').title);
    window.sessionStorage.clear();
  });

  it('uses one mobile language handoff before rendering, cleans its URL, and preserves explicit later choices', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(websiteUiLanguageStorageKey, 'future-v2');
    window.history.replaceState({}, '', '/?lang=de&article=wrn-test-art-cedar#reader');
    const first = render(<App initialState="loading" />);
    expect(screen.getByTestId('ui-language-selector')).toHaveValue('de');
    await waitFor(() => expect(new URL(window.location.href).searchParams.has('lang')).toBe(false));
    expect(new URL(window.location.href).searchParams.get('article')).toBe('wrn-test-art-cedar');
    expect(new URL(window.location.href).hash).toBe('#reader');
    expect(window.localStorage.getItem(websiteUiLanguageStorageKey)).toBe('future-v2');
    await user.selectOptions(screen.getByTestId('ui-language-selector'), 'tr');
    expect(window.localStorage.getItem(websiteUiLanguageStorageKey)).toBe('tr');
    first.unmount();
    render(<App initialState="loading" />);
    expect(screen.getByTestId('ui-language-selector')).toHaveValue('tr');
  });

  it('rejects duplicate handoff values without overwriting an existing preference', async () => {
    window.localStorage.setItem(websiteUiLanguageStorageKey, 'es');
    window.history.replaceState({}, '', '/?lang=de&lang=tr&article=wrn-test-art-cedar#reader');
    render(<App initialState="loading" />);
    expect(screen.getByTestId('ui-language-selector')).toHaveValue('es');
    await waitFor(() => expect(new URL(window.location.href).searchParams.has('lang')).toBe(false));
    expect(new URL(window.location.href).searchParams.get('article')).toBe('wrn-test-art-cedar');
    expect(new URL(window.location.href).hash).toBe('#reader');
    expect(window.localStorage.getItem(websiteUiLanguageStorageKey)).toBe('es');
  });

  it('offers every catalog, localizes the shell, and restores only the website selection', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('wrn.mobile-ui-language.v1', 'de');
    const first = render(<App initialState="loading" />);

    const selector = screen.getByTestId('ui-language-selector');
    expect(selector).toHaveValue('en');
    expect(selector).toHaveAccessibleName('Interface language: English');
    expect(
      within(selector)
        .getAllByRole('option')
        .map((option) => option.getAttribute('value')),
    ).toEqual(uiLanguageIds);
    expect(
      within(selector)
        .getAllByRole('option')
        .map((option) => option.textContent?.trim()),
    ).toEqual(['EN', 'DE', 'ES', 'FR', 'IT', 'PT', 'RU', 'EL', 'TR']);
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(window.localStorage.getItem(websiteUiLanguageStorageKey)).toBeNull();
    expect(window.localStorage.getItem('wrn.mobile-ui-language.v1')).toBe('de');

    for (const language of uiLanguageIds) {
      await user.selectOptions(selector, language);
      const copy = getUiCopy(language);
      expect(selector).toHaveValue(language);
      expect(selector).toHaveAccessibleName(
        formatUiCopy(copy.languageSelectionName, { language: uiLanguageNativeNames[language] }),
      );
      expect(document.documentElement.lang).toBe(language);
      expect(document.documentElement.dir).toBe('ltr');
      expect(screen.getByRole('heading', { name: copy.localPreviewHeadline })).toBeVisible();
    }
    expect(window.localStorage.getItem(websiteUiLanguageStorageKey)).toBe('tr');
    first.unmount();
    render(<App initialState="loading" />);
    expect(screen.getByTestId('ui-language-selector')).toHaveValue('tr');
    window.localStorage.removeItem('wrn.mobile-ui-language.v1');
  });
  it('keeps a separate ID-only local saved state through reload and offers deletion confirmation', async () => {
    const user = userEvent.setup();
    const first = render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getAllByRole('button', { name: 'Save for later' })[0]!);
    expect(window.localStorage.getItem(websiteReadingStateStorageKey)).toContain(
      'wrn-test-art-cedar',
    );
    expect(window.localStorage.getItem(websiteReadingStateStorageKey)).not.toContain(
      'Lokale Testmeldung',
    );
    first.unmount();
    render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getAllByRole('link', { name: 'Saved' })[0]!);
    expect(screen.getByRole('heading', { name: 'Saved' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Remove all saved articles' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Delete all saved articles');
    await user.click(screen.getByRole('button', { name: 'Delete now' }));
    expect(screen.getByText('No articles saved for later yet.')).toBeVisible();
  });

  it.each([
    [
      'an unknown future V2 document',
      '{\n  "contractVersion": "2.0.0",\n  "v2OnlyId": "future-cedar"\n}',
    ],
    ['malformed JSON', '{this is not valid JSON'],
  ])(
    'keeps %s byte-identical and blocks saved, read, progress and clear actions',
    async (_label, raw) => {
      const user = userEvent.setup();
      window.localStorage.setItem(websiteReadingStateStorageKey, raw);
      const first = render(<App initialState="ready" />);
      await screen.findByTestId('manifest-revision');

      const feedSave = screen.getAllByRole('button', { name: 'Save for later' })[0]!;
      expect(feedSave).toBeDisabled();
      await user.click(feedSave);
      await user.click(screen.getAllByRole('button', { name: 'Read article' })[0]!);
      expect(screen.getByRole('button', { name: 'Save for later' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Mark as read' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Save 50% reading progress' })).toBeDisabled();
      expect(window.localStorage.getItem(websiteReadingStateStorageKey)).toBe(raw);

      await user.click(screen.getByRole('button', { name: 'Back' }));
      await user.click(screen.getAllByRole('link', { name: 'Saved' })[0]!);
      expect(
        screen.getByText(/Local reading data remains unchanged.*Editing is disabled/i),
      ).toBeVisible();
      const clear = screen.getByRole('button', { name: 'Delete all reading data' });
      expect(clear).toBeDisabled();
      await user.click(clear);
      expect(window.localStorage.getItem(websiteReadingStateStorageKey)).toBe(raw);

      first.unmount();
      window.history.replaceState({}, '', '/#home');
      render(<App initialState="ready" />);
      await screen.findByTestId('manifest-revision');
      expect(window.localStorage.getItem(websiteReadingStateStorageKey)).toBe(raw);
    },
  );

  it('closes the reading-data confirmation with Escape or Cancel and restores its trigger focus', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" initialTheme="pink" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getAllByRole('button', { name: 'Save for later' })[0]!);
    await user.click(screen.getAllByRole('link', { name: 'Saved' })[0]!);

    const trigger = screen.getByRole('button', { name: 'Delete all reading data' });
    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(window.localStorage.getItem(websiteReadingStateStorageKey)).toContain(
      'wrn-test-art-cedar',
    );

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(window.localStorage.getItem(websiteReadingStateStorageKey)).toContain(
      'wrn-test-art-cedar',
    );

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Delete now' }));
    expect(screen.getByText('No articles saved for later yet.')).toBeVisible();
    expect(document.documentElement.dataset.theme).toBe('pink');
  });

  it('binds a saved active feed article to its reader and keeps its progress after reload', async () => {
    const user = userEvent.setup();
    const first = render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getAllByRole('button', { name: 'Save for later' })[0]!);
    await user.click(screen.getAllByRole('link', { name: 'Saved' })[0]!);

    expect(
      screen.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Read article' }));
    expect(
      screen.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
    ).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Save 50% reading progress' }));
    expect(screen.getByRole('button', { name: 'Reset progress (50%)' })).toBeVisible();
    expect(window.localStorage.getItem(websiteReadingStateStorageKey)).toContain('"fraction":0.5');

    first.unmount();
    window.history.replaceState({}, '', '/#saved');
    render(<App initialState="ready" />);
    expect(
      await screen.findByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reset progress (50%)' })).toBeVisible();
  });

  it('keeps gone, revoked and unknown saved IDs payload-free but removable', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      websiteReadingStateStorageKey,
      JSON.stringify({
        contractVersion: '1.0.0',
        schema: 'wrn.local-reading-state.v1',
        revision: 'wrn-g3-011-local-reading-state-v1',
        entries: [
          { articleId: 'wrn-test-art-g3-008-gone', savedAt: '2026-08-26T08:00:00.000Z' },
          { articleId: 'wrn-test-art-g3-008-revoked', savedAt: '2026-08-26T08:01:00.000Z' },
          { articleId: 'wrn-test-art-g3-008-unknown', savedAt: '2026-08-26T08:02:00.000Z' },
        ],
      }),
    );
    window.history.replaceState({}, '', '/#saved');
    render(<App initialState="ready" />);

    expect(await screen.findAllByText('Currently unavailable')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Read article' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Remove from saved' })[0]!);
    expect(window.localStorage.getItem(websiteReadingStateStorageKey)).not.toContain(
      'wrn-test-art-g3-008-gone',
    );
  });

  it('renders the same pinned revision, IDs, and complete card metadata', async () => {
    render(<App initialState="ready" />);

    expect(await screen.findByTestId('manifest-revision')).toHaveTextContent(
      'wrn-g3-007-local-publication-source-v1-d8ff4f1',
    );
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.dataset.articleId)).toEqual([
      'wrn-test-art-cedar',
      'wrn-test-art-ember',
      'wrn-test-art-fern',
    ]);
    expect(cards[0]).toHaveTextContent('Lokale Testquelle');
    expect(cards[0]).toHaveTextContent('23.08.2026, 10:00 UTC');
    expect(cards[0]).toHaveTextContent('de');
    expect(cards[0]).toHaveTextContent('Diese selbst erstellte Meldung prueft');
  });

  it.each([
    ['loading', 'The local news fixture is being prepared.'],
    ['empty', 'contains no articles'],
    ['error', 'could not be displayed safely'],
    ['offline', 'no external source is requested'],
    ['optional-absent', 'intentionally unavailable'],
  ] as const)('renders the deterministic %s state', async (state, expectedMessage) => {
    render(<App initialState={state} />);
    expect(await screen.findByText(new RegExp(expectedMessage, 'i'))).toBeInTheDocument();
  });

  it('fails closed for invalid state and theme queries', async () => {
    window.history.replaceState({}, '', '/?state=unknown&theme=unknown-theme');
    render(<App contentMode="fixture-offline" />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('violet'));
    fireEvent.click(screen.getAllByRole('button', { name: 'More' })[0]!);
    expect(screen.getByLabelText('Color theme')).toHaveValue('violet');
  });

  it('shows no ready content when the local integrity loader rejects', async () => {
    render(
      <App
        initialState="ready"
        loader={() => Promise.reject(new Error('Manipulierte lokale Integritaet'))}
      />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('could not be displayed safely');
    expect(screen.queryByTestId('manifest-revision')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('supports keyboard switching to ready and the named local theme selection', async () => {
    const user = userEvent.setup();
    render(<App initialState="offline" initialTheme="dark" />);

    const readyButton = screen.getByRole('button', { name: 'Ready' });
    readyButton.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByTestId('manifest-revision')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'More' })[0]!);
    const selector = screen.getByLabelText('Color theme');
    expect(within(selector).getByRole('option', { name: 'Editorial black/red' })).toHaveValue(
      'editorial',
    );
    await user.selectOptions(selector, 'editorial');
    expect(document.documentElement.dataset.theme).toBe('editorial');
    expect(document.documentElement.dataset.themePreference).toBe('editorial');
    expect(window.localStorage.getItem('wrn.theme-preference.v1')).toBe('editorial');
  });

  it('keeps an accessible compact text brand name without a large asset masthead', () => {
    render(<App initialState="loading" />);

    const brand = screen.getByRole('link', { name: /Solinaridao.*World Revolution News/i });
    expect(brand).toBeVisible();
    expect(brand).toHaveTextContent('World Revolution News');
    expect(brand.querySelector('img')).toBeNull();
  });

  it('closes the header menu back to the exact previous route', async () => {
    window.history.replaceState({}, '', '/?theme=violet#discover/sport');
    const user = userEvent.setup();
    render(<App initialState="loading" />);
    const menu = screen.getByTestId('header-more-trigger');
    await user.click(menu);
    expect(window.location.hash).toBe('#more');
    expect(menu).toHaveAccessibleName('Back');
    await user.click(menu);
    await waitFor(() => expect(window.location.hash).toBe('#discover/sport'));
    expect(window.location.search).toBe('?theme=violet');
    expect(menu).toHaveAccessibleName('More');
    await user.click(menu);
    await user.click(menu);
    await waitFor(() => expect(window.location.hash).toBe('#discover/sport'));
  });

  it('leaves a directly opened More page for Home without leaving the app', async () => {
    window.history.replaceState({}, '', '/#more');
    const user = userEvent.setup();
    render(<App initialState="loading" />);
    await user.click(screen.getByTestId('header-more-trigger'));
    await waitFor(() => expect(window.location.hash).toBe('#home'));
  });

  it('uses compact header controls to open Mehr and focus the local search', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');

    const menu = screen.getByTestId('header-more-trigger');
    expect(menu).toHaveAccessibleName('More');
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('More areas')).toBeVisible();

    const search = screen.getByTestId('header-search-trigger');
    expect(search).toHaveAccessibleName('Search news');
    await user.click(search);
    expect(window.location.hash).toBe('#discover');
    const searchBox = await screen.findByRole('searchbox', { name: 'Search news' });
    await waitFor(() => expect(document.activeElement).toBe(searchBox));
  });

  it('uses the compact website groups and exposes the expanded local more menu', async () => {
    const user = userEvent.setup();
    render(<App initialState="loading" />);

    const compactNavigation = screen.getAllByRole('navigation', {
      name: 'Website main navigation',
    })[0]!;
    expect(
      within(compactNavigation)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Home', 'Discover', 'Media', 'Saved']);
    const moreButton = within(compactNavigation).getByRole('button', { name: 'More' });
    await user.click(moreButton);
    expect(moreButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: 'More' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Help' })).toBeVisible();
  });

  it('synchronizes the more menu with browser back and forward navigation', async () => {
    const user = userEvent.setup();
    render(<App initialState="loading" />);

    const compactNavigation = screen.getAllByRole('navigation', {
      name: 'Website main navigation',
    })[0]!;
    const moreButton = within(compactNavigation).getByRole('button', { name: 'More' });
    await user.click(moreButton);
    expect(moreButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('More areas')).toBeVisible();

    window.history.back();
    await waitFor(() => expect(moreButton).toHaveAttribute('aria-expanded', 'false'));
    expect(screen.getByText('More areas')).not.toBeVisible();

    window.history.forward();
    await waitFor(() => expect(moreButton).toHaveAttribute('aria-expanded', 'true'));
    expect(screen.getByText('More areas')).toBeVisible();
  });

  it('restores the solidarity route and rejects unknown navigation IDs without loading content', () => {
    window.history.replaceState({}, '', '/#solidarity');
    const { unmount } = render(<App initialState="loading" />);
    expect(screen.getByRole('heading', { name: 'Solidarity directory' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    unmount();

    window.history.replaceState({}, '', '/#reader');
    render(<App initialState="loading" />);
    expect(
      screen.getByRole('heading', { name: 'News, clearly readable and traceable.' }),
    ).toBeVisible();
  });

  it.each(['__proto__', 'constructor', 'toString', 'ordinary-unknown'])(
    'fails closed for the inherited or unknown direct hash %s',
    (unsafeHash) => {
      window.history.replaceState({}, '', `/#${unsafeHash}`);
      render(<App initialState="loading" />);
      expect(
        screen.getByRole('heading', { name: 'News, clearly readable and traceable.' }),
      ).toBeVisible();
    },
  );

  it.each(['__proto__', 'constructor', 'toString'])(
    'keeps the mounted website usable after the inherited hash %s',
    async (unsafeHash) => {
      render(<App initialState="loading" />);
      window.history.pushState({}, '', `/#${unsafeHash}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      expect(
        await screen.findByRole('heading', { name: 'News, clearly readable and traceable.' }),
      ).toBeVisible();
    },
  );

  it('renders local search, facets and the no-result reset without persistence', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" />);

    await screen.findByTestId('manifest-revision');
    await user.click(screen.getAllByRole('link', { name: 'Discover' })[0]!);
    const search = screen.getByRole('searchbox', { name: 'Search news' });
    await user.type(search, 'kein-lokaler-treffer');
    expect(screen.getByRole('heading', { name: 'No results' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Reset all filters' }));
    expect(search).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('3 results');
    expect(window.location.search).toBe('');
    expect(window.localStorage.length).toBe(0);
  });

  it('uses an honest named Discover error state rather than the legacy placeholder', async () => {
    window.history.replaceState({}, '', '/#discover');
    render(<App initialState="error" />);

    expect(screen.getByRole('heading', { name: 'Discover' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('could not be displayed safely');
    expect(screen.queryByText('Not migrated yet')).not.toBeInTheDocument();
  });

  it('opens a validated reader from Discover with a query route and keeps the external source confirmed', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" />);

    await screen.findByTestId('manifest-revision');
    await user.click(screen.getAllByRole('link', { name: 'Discover' })[0]!);
    await user.click(screen.getAllByRole('button', { name: 'Read article' })[0]!);
    expect(new URL(window.location.href).searchParams.get('article')).toBe('wrn-test-art-cedar');
    expect(
      screen.getByRole('heading', { name: /Lokale Testmeldung zur gemeinsamen Leseliste/ }),
    ).toHaveFocus();
    expect(
      screen.queryByRole('link', { name: 'Open external source now' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open original source' }));
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const external = screen.getByRole('link', { name: 'Open external source now' });
    expect(cancel).toHaveFocus();
    expect(external).toHaveAttribute('href', 'https://fixture.invalid/articles/cedar');
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    expect(external).toHaveAttribute('referrerpolicy', 'no-referrer');
    await user.tab();
    expect(external).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(external).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open original source' })).toHaveFocus();
  });

  it('renders a direct unknown query route as not found without a reader body', async () => {
    window.history.replaceState({}, '', '/?article=unknown-local-id');
    render(<App initialState="ready" />);
    expect(await screen.findByRole('heading', { name: 'Article not found' })).toBeVisible();
    expect(screen.queryByText('Diese vollstaendige lokale Testnotiz')).not.toBeInTheDocument();
  });

  it('opens the release-bound local archive from Mehr and shares a canonical URL', async () => {
    const user = userEvent.setup();
    const shared: string[] = [];
    render(
      <App
        contentMode="fixture-offline"
        shareAdapter={{
          share: async (url) => {
            shared.push(url);
          },
        }}
      />,
    );

    await screen.findByTestId('manifest-revision');
    await user.click(screen.getAllByRole('button', { name: 'More' })[0]!);
    await user.click(screen.getByRole('button', { name: 'News archive' }));
    expect(await screen.findByRole('heading', { name: 'News archive' })).toBeVisible();
    await user.click(screen.getAllByRole('button', { name: 'Read article' })[0]!);
    expect(
      await screen.findByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() =>
      expect(shared).toEqual(['https://solinaridao.com/articles/wrn-test-art-cedar/']),
    );
    expect(new URL(window.location.href).searchParams.get('archive')).toBe('wrn-test-art-cedar');
  });

  it('keeps a release-bound revoked archive state and sharing hidden', async () => {
    window.history.replaceState({}, '', '/?archive=wrn-test-art-g3-012-revoked#more');
    render(<App contentMode="fixture-offline" />);
    expect(await screen.findByRole('heading', { name: 'Message unavailable' })).toBeVisible();
    expect(
      screen.queryByText('Lokale Testmeldung zur gemeinsamen Leseliste'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
  });
});
