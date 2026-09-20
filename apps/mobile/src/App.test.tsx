import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatUiCopy, getUiCopy, uiLanguageIds, uiLanguageNativeNames } from '@wrn/ui-language';
import { App } from './App';
import { createNativePlatformSession, type WRNPlatformPlugin } from './native-platform';
import { loadLocalContentRelease } from './local-content-release';
import { mobileReadingStateStorageKey } from './local-reading-state';
import { mobileUiLanguageStorageKey } from './ui-language-preference';
import { mobilePersonalizationStorageKey } from './local-personalization-state';
import {
  localPersonalizationContentLanguageIds,
  localPersonalizationInterestIds,
  localPersonalizationRegionIds,
} from '@wrn/content-contracts';

const dialogDescriptors = ['showModal', 'close'].map(
  (key) => [key, Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, key)] as const,
);
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
});
afterEach(() => {
  for (const [key, value] of dialogDescriptors) {
    if (value) Object.defineProperty(HTMLDialogElement.prototype, key, value);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, key);
  }
  window.history.replaceState({}, '', '/');
  window.localStorage.removeItem('wrn.theme-preference.v1');
  window.localStorage.removeItem(mobileReadingStateStorageKey);
  window.localStorage.removeItem(mobileUiLanguageStorageKey);
  window.localStorage.removeItem(mobilePersonalizationStorageKey);
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themePreference;
  vi.restoreAllMocks();
});

describe('mobile local newsfeed', () => {
  it.each(['article/wrn-test-art-cedar', 'discover/news'])(
    'installs navigation before immediate retained native route %s under StrictMode',
    async (route) => {
      const snapshot = (await import('./features/directory/data/content-directory-v1.json'))
        .default;
      const originalFetch = vi.mocked(globalThis.fetch).getMockImplementation()!;
      vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) =>
        String(input).includes('content-directory-v1.json')
          ? Promise.resolve(new Response(JSON.stringify(snapshot)))
          : originalFetch(input, init),
      );
      const plugin: WRNPlatformPlugin = {
        share: vi.fn(async () => undefined),
        setWebReady: vi.fn(async () => undefined),
        acknowledgeBack: vi.fn(async () => undefined),
        addListener: vi.fn(
          async (
            name: 'route' | 'back',
            listener: Parameters<WRNPlatformPlugin['addListener']>[1],
          ) => {
            if (name === 'route') listener({ deliveryId: '1', route });
            return { remove: async () => undefined };
          },
        ),
      };
      const native = createNativePlatformSession({ isAvailable: () => true, plugin });
      const onNavigationReady = vi.fn(() => {
        void native.start();
      });
      const view = render(
        <StrictMode>
          <App
            initialState="ready"
            onHistorySessionChange={native.setHistorySession}
            onNavigationReady={onNavigationReady}
          />
        </StrictMode>,
      );
      try {
        await waitFor(() => expect(onNavigationReady).toHaveBeenCalled());
        await waitFor(() => expect(window.location.hash).toBe(`#${route}`));
        if (route.startsWith('article/')) {
          await screen.findByRole('button', { name: 'Open original source' });
          expect(
            screen.getByRole('heading', {
              name: 'Lokale Testmeldung zur gemeinsamen Leseliste',
            }),
          ).toBeVisible();
        } else await screen.findByRole('heading', { name: 'News directory' });
        expect(
          vi.mocked(plugin.addListener).mock.calls.filter(([name]) => name === 'route'),
        ).toHaveLength(1);
      } finally {
        view.unmount();
        native.dispose();
      }
    },
  );
  it('reports its own history session, rotates on unmarked navigation and clears on unmount', async () => {
    const onHistorySessionChange = vi.fn();
    const view = render(
      <App initialState="ready" onHistorySessionChange={onHistorySessionChange} />,
    );
    await screen.findByTestId('manifest-revision');
    const initialSession = window.history.state.wrnHistorySession as string;
    expect(initialSession).toMatch(/^[0-9a-f-]{36}$/u);
    expect(onHistorySessionChange).toHaveBeenLastCalledWith(initialSession);
    window.history.pushState({}, '', '/#more');
    fireEvent(window, new PopStateEvent('popstate', { state: {} }));
    await screen.findByRole('heading', { name: 'More' });
    const rotatedSession = window.history.state.wrnHistorySession as string;
    expect(rotatedSession).not.toBe(initialSession);
    expect(onHistorySessionChange).toHaveBeenLastCalledWith(rotatedSession);
    view.unmount();
    expect(onHistorySessionChange).toHaveBeenLastCalledWith(null);
  });
  it('protects the integrated solidarity draft across global navigation and explicit discard', async () => {
    const data = (await import('./features/support/data/legacy-support-v1.json')).default;
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(JSON.stringify(data)),
    );
    window.history.replaceState({}, '', '/#solidarity');
    render(
      <App
        initialState="ready"
        initialUiLanguage="en"
        now={() => Date.parse('2026-09-09T00:00:00.000Z')}
      />,
    );
    const body = await screen.findByRole('textbox', { name: 'Letter text' });
    fireEvent.change(body, { target: { value: 'Keep this draft' } });
    fireEvent.click(screen.getByRole('link', { name: 'More' }));
    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(window.location.hash).toBe('#solidarity');
    fireEvent.click(screen.getByRole('button', { name: 'Continue editing' }));
    expect(body).toHaveValue('Keep this draft');
    fireEvent.click(screen.getByRole('link', { name: 'More' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard and continue' }));
    expect(await screen.findByRole('heading', { name: 'More' })).toBeVisible();
    expect(window.location.hash).toBe('#more');
  });
  it('loads the knowledge route lazily, focuses its replacement heading and keeps the German copy', async () => {
    const snapshot = (await import('./features/knowledge/data/legacy-knowledge-v1.json')).default;
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(JSON.stringify(snapshot)),
    );
    window.history.replaceState({}, '', '/#knowledge');
    render(<App initialState="ready" initialUiLanguage="de" />);
    const heading = await screen.findByRole('heading', { name: 'Wissen' });
    expect(heading).toHaveFocus();
    expect(await screen.findByText('30 von 609')).toBeVisible();
  });

  it('replaces the Media placeholder with the dedicated fail-closed local media route', async () => {
    window.history.replaceState({}, '', '/#media');
    render(<App initialState="ready" now={() => Date.parse('2026-09-01T12:00:00.000Z')} />);
    expect(await screen.findByRole('heading', { name: 'Media' })).toBeVisible();
    expect(
      screen.getByText('This audio is available only from the validated local release.'),
    ).toBeVisible();
    expect(screen.queryByText('This area is currently being migrated.')).toBeNull();
    expect(screen.queryByText('No external source was requested.')).toBeNull();
  });

  it('derives the five-field Reader-v2 snapshot only from validated ready data and preserves v1 while it falls back', async () => {
    const user = userEvent.setup();
    const readerV2Loader = vi.fn(async (...input: [unknown]) => {
      if (input.length !== 1) throw new Error('Reader-v2 loader input missing');
      return { kind: 'fallback' as const, reason: 'missing-pin' as const };
    });
    render(<App initialState="ready" mobileReaderV2Loader={readerV2Loader} />);
    await screen.findByTestId('manifest-revision');
    await waitFor(() => expect(readerV2Loader).toHaveBeenCalledTimes(1));
    expect(readerV2Loader.mock.calls[0]![0]).toMatchObject({
      snapshot: {
        releaseRevision: 'wrn-g3-016-mobile-home-release-v1',
        readerDetailsRevision: 'wrn-g3-016-local-home-reader-v1',
      },
    });
    await user.click(screen.getAllByRole('button', { name: 'Read article' })[0]!);
    expect(await screen.findByText(/Diese vollstaendige lokale Testnotiz/u)).toBeVisible();
    expect(readerV2Loader).toHaveBeenCalledTimes(1);
  });

  it('keeps For me inactive without a write, then saves only after confirmation and restores it on reload', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('link', { name: 'For me' }));

    expect(screen.getByRole('heading', { name: 'For me' })).toHaveFocus();
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBeNull();
    expect(screen.getByRole('button', { name: 'Save selection' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'Movement news' }));
    const save = screen.getByRole('button', { name: 'Save selection' });
    await user.click(save);
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(save).toHaveFocus();
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBeNull();

    await user.click(save);
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Save selection' }),
    );
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toContain('movement-news');
    expect(screen.getByText('Your local selection was saved.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Matching local articles' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Reload selection' }));
    expect(screen.getByRole('checkbox', { name: 'Movement news' })).toBeChecked();
  });

  it('keeps protected personalization opaque and permits only confirmed deletion', async () => {
    const user = userEvent.setup();
    const raw = '{not valid personalization json';
    window.localStorage.setItem(mobilePersonalizationStorageKey, raw);
    render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('link', { name: 'For me' }));

    expect(screen.getByRole('alert')).toHaveTextContent('cannot be read safely');
    expect(screen.queryByText(raw)).not.toBeInTheDocument();
    const clear = screen.getByRole('button', { name: 'Delete local selection' });
    await user.click(clear);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBe(raw);
    await user.click(clear);
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete local selection' }),
    );
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBeNull();
    expect(screen.getByText('Your local selection was deleted.')).toBeVisible();
  });

  it('returns from a locally matched reader to For me and restores the triggering control', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      mobilePersonalizationStorageKey,
      JSON.stringify({
        contractVersion: 1,
        schema: 'wrn.local-personalization',
        revision: 'wrn-local-personalization-v1',
        interestIds: ['movement-news'],
        regionIds: [],
        contentLanguageIds: [],
      }),
    );
    render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('link', { name: 'For me' }));
    const trigger = within(screen.getByRole('article')).getByRole('button', {
      name: 'Read article',
    });
    await user.click(trigger);
    expect(window.location.hash).toMatch(/^#article\//u);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('heading', { name: 'For me' })).toBeVisible();
    expect(document.querySelector('[data-reader-trigger]')).toHaveFocus();
  });

  it('renders an offline matching For me selection from local projection and keeps reader focus return behavior', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/?state=ready');
    window.localStorage.setItem(
      mobilePersonalizationStorageKey,
      JSON.stringify({
        contractVersion: 1,
        schema: 'wrn.local-personalization',
        revision: 'wrn-local-personalization-v1',
        interestIds: ['movement-news'],
        regionIds: [],
        contentLanguageIds: [],
      }),
    );

    render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('button', { name: 'Offline' }));
    await user.click(screen.getByRole('link', { name: 'For me' }));
    expect(await screen.findByRole('heading', { name: 'For me' })).toBeVisible();
    await waitFor(() => {
      expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
    });
    const firstArticle = screen.getAllByRole('article')[0];
    expect(firstArticle).not.toBeNull();
    await user.click(within(firstArticle!).getByRole('button', { name: 'Read article' }));
    expect(window.location.hash).toMatch(/^#article\//u);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('heading', { name: 'For me' })).toBeVisible();
    expect(document.querySelector('[data-reader-trigger]')).toHaveFocus();
  });

  it('shows an honest no-match state for offline when the local selection has no matching snapshot content', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/?state=ready');
    window.localStorage.setItem(
      mobilePersonalizationStorageKey,
      JSON.stringify({
        contractVersion: 1,
        schema: 'wrn.local-personalization',
        revision: 'wrn-local-personalization-v1',
        interestIds: [],
        regionIds: ['oceania'],
        contentLanguageIds: [],
      }),
    );

    render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('button', { name: 'Offline' }));
    await user.click(screen.getByRole('link', { name: 'For me' }));
    expect(await screen.findByRole('heading', { name: 'For me' })).toBeVisible();
    await waitFor(() => {
      const message = screen.queryByText('No validated local articles match this selection.');
      expect(message).not.toBeNull();
      expect(message).toBeVisible();
    });
    expect(
      await screen.findByText('No validated local articles match this selection.'),
    ).toBeVisible();
  });

  it('keeps one personalization store across route changes and restores the current selection', async () => {
    const user = userEvent.setup();
    const addEventListener = vi.spyOn(window, 'addEventListener');
    window.localStorage.setItem(
      mobilePersonalizationStorageKey,
      JSON.stringify({
        contractVersion: 1,
        schema: 'wrn.local-personalization',
        revision: 'wrn-local-personalization-v1',
        interestIds: ['fan-culture'],
        regionIds: [],
        contentLanguageIds: [],
      }),
    );
    render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('link', { name: 'For me' }));
    expect(screen.getByRole('checkbox', { name: 'Fan culture' })).toBeChecked();
    expect(addEventListener.mock.calls.filter(([event]) => event === 'storage')).toHaveLength(1);
    await user.click(screen.getByRole('link', { name: 'Home' }));
    await user.click(screen.getByRole('link', { name: 'For me' }));
    expect(screen.getByRole('checkbox', { name: 'Fan culture' })).toBeChecked();
    expect(addEventListener.mock.calls.filter(([event]) => event === 'storage')).toHaveLength(1);
  });

  it('keeps one active personalization conflict listener through StrictMode lifecycle and routes', async () => {
    const user = userEvent.setup();
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const removeEventListener = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <StrictMode>
        <App initialState="ready" />
      </StrictMode>,
    );
    await screen.findByTestId('manifest-revision');
    expect(addEventListener.mock.calls.filter(([event]) => event === 'storage')).toHaveLength(2);
    expect(removeEventListener.mock.calls.filter(([event]) => event === 'storage')).toHaveLength(1);

    await user.click(screen.getByRole('link', { name: 'For me' }));
    await user.click(screen.getByRole('checkbox', { name: 'Movement news' }));
    await user.click(screen.getByRole('link', { name: 'Home' }));
    await user.click(screen.getByRole('link', { name: 'For me' }));
    expect(addEventListener.mock.calls.filter(([event]) => event === 'storage')).toHaveLength(2);

    await user.click(screen.getByRole('checkbox', { name: 'Movement news' }));
    await user.click(screen.getByRole('button', { name: 'Save selection' }));
    window.dispatchEvent(
      new StorageEvent('storage', { key: mobilePersonalizationStorageKey, newValue: '{}' }),
    );
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Save selection' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('changed elsewhere');

    unmount();
    expect(removeEventListener.mock.calls.filter(([event]) => event === 'storage')).toHaveLength(2);
  });

  it('returns focus to the final For me heading for direct following navigation in StrictMode', async () => {
    window.history.replaceState({}, '', '#following');
    render(
      <StrictMode>
        <App initialState="ready" />
      </StrictMode>,
    );
    await screen.findByRole('checkbox', { name: 'Movement news' });
    expect(await screen.findByRole('heading', { name: 'For me' })).toHaveFocus();
  });

  it('uses the exact P2 catalog order and never preselects content language from UI language', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" initialUiLanguage="de" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('link', { name: 'Für mich' }));
    const checkboxIds = screen
      .getAllByRole('checkbox')
      .map((checkbox) =>
        checkbox
          .getAttribute('id')!
          .replace(/^personalization-(?:interestIds|regionIds|contentLanguageIds)-/u, ''),
      );
    expect(checkboxIds).toEqual([
      ...localPersonalizationInterestIds,
      ...localPersonalizationRegionIds,
      ...localPersonalizationContentLanguageIds,
    ]);
    expect(
      screen.getAllByRole('checkbox').every((checkbox) => !(checkbox as HTMLInputElement).checked),
    ).toBe(true);
  });

  it('requires Reload after a conflict and localizes the stored error category after a UI language change', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('link', { name: 'For me' }));
    await user.click(screen.getByRole('checkbox', { name: 'Movement news' }));
    await user.click(screen.getByRole('button', { name: 'Save selection' }));
    window.localStorage.setItem(mobilePersonalizationStorageKey, JSON.stringify({ future: true }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Save selection' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('changed elsewhere');
    expect(screen.getByText('Reload the local selection before another change.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save selection' })).toBeDisabled();
    await user.selectOptions(screen.getByTestId('ui-language-selector'), 'de');
    expect(screen.getByRole('alert')).toHaveTextContent('anderswo geändert');
    await user.click(screen.getByRole('button', { name: 'Auswahl neu laden' }));
    expect(
      screen.queryByText('Lade die lokale Auswahl neu, bevor du sie erneut änderst.'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('kann nicht sicher gelesen werden');
  });

  it.each(['write-failed', 'verification-failed'] as const)(
    'requires Reload after a %s save failure',
    async (failure) => {
      const user = userEvent.setup();
      render(<App initialState="ready" />);
      await screen.findByTestId('manifest-revision');
      await user.click(screen.getByRole('link', { name: 'For me' }));
      await user.click(screen.getByRole('checkbox', { name: 'Movement news' }));
      const nativeSetItem = Storage.prototype.setItem;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
        this: Storage,
        key,
        value,
      ) {
        if (key !== mobilePersonalizationStorageKey) return nativeSetItem.call(this, key, value);
        if (failure === 'write-failed') throw new Error('test write failure');
      });
      await user.click(screen.getByRole('button', { name: 'Save selection' }));
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Save selection' }),
      );
      expect(screen.getByRole('alert')).toHaveTextContent(
        failure === 'write-failed' ? 'could not be saved' : 'could not be verified',
      );
      expect(screen.getByText('Reload the local selection before another change.')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Save selection' })).toBeDisabled();
    },
  );

  it('requires Reload after a clear failure and returns focus to main after successful clear', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      mobilePersonalizationStorageKey,
      JSON.stringify({
        contractVersion: 1,
        schema: 'wrn.local-personalization',
        revision: 'wrn-local-personalization-v1',
        interestIds: ['movement-news'],
        regionIds: [],
        contentLanguageIds: [],
      }),
    );
    render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('link', { name: 'For me' }));
    const nativeRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key) {
      if (key === mobilePersonalizationStorageKey) throw new Error('test clear failure');
      return nativeRemoveItem.call(this, key);
    });
    await user.click(screen.getByRole('button', { name: 'Delete local selection' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete local selection' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('could not be deleted');
    expect(screen.getByRole('button', { name: 'Delete local selection' })).toBeDisabled();
    vi.restoreAllMocks();
    await user.click(screen.getByRole('button', { name: 'Reload selection' }));
    await user.click(screen.getByRole('button', { name: 'Delete local selection' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete local selection' }),
    );
    await waitFor(() => expect(document.activeElement).toBe(document.querySelector('main')));
  });

  it('offers every catalog, localizes the shell, and restores only the mobile selection', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('wrn.website-ui-language.v1', 'de');
    const first = render(<App initialState="loading" />);

    const selector = screen.getByTestId('ui-language-selector');
    expect(selector).toHaveValue('en');
    expect(selector).toHaveAccessibleName('Interface language: English');
    expect(
      within(selector)
        .getAllByRole('option')
        .map((option) => option.getAttribute('value')),
    ).toEqual(uiLanguageIds);
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(window.localStorage.getItem(mobileUiLanguageStorageKey)).toBeNull();
    expect(window.localStorage.getItem('wrn.website-ui-language.v1')).toBe('de');

    for (const language of uiLanguageIds) {
      await user.selectOptions(selector, language);
      const copy = getUiCopy(language);
      expect(selector).toHaveValue(language);
      expect(selector).toHaveAccessibleName(
        formatUiCopy(copy.languageSelectionName, { language: uiLanguageNativeNames[language] }),
      );
      expect(document.documentElement.lang).toBe(language);
      expect(document.documentElement.dir).toBe('ltr');
      expect(
        screen.getByRole('link', {
          name: formatUiCopy(copy.brandHomeName, {
            brand: 'Solinaridao',
            product: 'World Revolution News',
          }),
        }),
      ).toBeVisible();
    }
    expect(window.localStorage.getItem(mobileUiLanguageStorageKey)).toBe('tr');
    first.unmount();
    render(<App initialState="loading" />);
    expect(screen.getByTestId('ui-language-selector')).toHaveValue('tr');
    window.localStorage.removeItem('wrn.website-ui-language.v1');
  });

  it('hands only the validated selected UI-language ID to the website header link', async () => {
    const user = userEvent.setup();
    const { container } = render(<App initialState="loading" initialUiLanguage="de" />);
    const link = container.querySelector<HTMLAnchorElement>('a.header-website-link');
    expect(link).not.toBeNull();
    expect([...new URL(link!.href).searchParams]).toEqual([['lang', 'de']]);
    await user.selectOptions(screen.getByTestId('ui-language-selector'), 'tr');
    expect([...new URL(link!.href).searchParams]).toEqual([['lang', 'tr']]);
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
    expect(menu).toHaveAttribute('href', '#more');
    await user.click(menu);
    expect(window.location.hash).toBe('#more');
    expect(screen.getByLabelText('Color theme')).toBeVisible();

    const search = screen.getByTestId('header-search-trigger');
    expect(search).toHaveAccessibleName('Search news');
    await user.click(search);
    expect(window.location.hash).toBe('#discover');
    const searchBox = await screen.findByRole('searchbox', { name: 'Search news' });
    await waitFor(() => expect(document.activeElement).toBe(searchBox));

    expect(
      within(screen.getByTestId('ui-language-selector'))
        .getAllByRole('option')
        .map((option) => option.textContent?.trim()),
    ).toEqual(['EN', 'DE', 'ES', 'FR', 'IT', 'PT', 'RU', 'EL', 'TR']);
  });
  it('persists only the mobile ID-only reading state and exposes the saved view', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getAllByRole('button', { name: 'Save for later' })[0]!);
    expect(window.localStorage.getItem(mobileReadingStateStorageKey)).toContain(
      'wrn-test-art-cedar',
    );
    expect(window.localStorage.getItem(mobileReadingStateStorageKey)).not.toContain(
      'Lokale Testmeldung',
    );
    await user.click(screen.getByRole('link', { name: 'Saved' }));
    expect(screen.getByRole('heading', { name: 'Saved' })).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Read later' }).parentElement).toHaveTextContent(
      '1',
    );
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
      window.localStorage.setItem(mobileReadingStateStorageKey, raw);
      const first = render(<App initialState="ready" />);
      await screen.findByTestId('manifest-revision');

      const feedSave = screen.getAllByRole('button', { name: 'Save for later' })[0]!;
      expect(feedSave).toBeDisabled();
      await user.click(feedSave);
      await user.click(screen.getAllByRole('button', { name: 'Read article' })[0]!);
      expect(screen.getByRole('button', { name: 'Save for later' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Mark as read' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Save 50% reading progress' })).toBeDisabled();
      expect(window.localStorage.getItem(mobileReadingStateStorageKey)).toBe(raw);

      await user.click(screen.getByRole('button', { name: 'Back' }));
      await user.click(screen.getByRole('link', { name: 'Saved' }));
      expect(
        screen.getByText(/Local reading data remains unchanged.*Editing is disabled/i),
      ).toBeVisible();
      const clear = screen.getByRole('button', { name: 'Delete all reading data' });
      expect(clear).toBeDisabled();
      await user.click(clear);
      expect(window.localStorage.getItem(mobileReadingStateStorageKey)).toBe(raw);

      first.unmount();
      window.history.replaceState({}, '', '/#home');
      render(<App initialState="ready" />);
      await screen.findByTestId('manifest-revision');
      expect(window.localStorage.getItem(mobileReadingStateStorageKey)).toBe(raw);
    },
  );

  it('closes the reading-data confirmation with Escape or Cancel and restores its trigger focus', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" initialTheme="pink" />);
    await screen.findByTestId('manifest-revision');
    await user.click(screen.getAllByRole('button', { name: 'Save for later' })[0]!);
    await user.click(screen.getByRole('link', { name: 'Saved' }));

    const trigger = screen.getByRole('button', { name: 'Delete all reading data' });
    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(window.localStorage.getItem(mobileReadingStateStorageKey)).toContain(
      'wrn-test-art-cedar',
    );

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(window.localStorage.getItem(mobileReadingStateStorageKey)).toContain(
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
    await user.click(screen.getByRole('link', { name: 'Saved' }));

    expect(
      screen.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Read article' }));
    expect(
      screen.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
    ).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Save 50% reading progress' }));
    expect(screen.getByRole('button', { name: 'Reset progress (50%)' })).toBeVisible();
    expect(window.localStorage.getItem(mobileReadingStateStorageKey)).toContain('"fraction":0.5');

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
      mobileReadingStateStorageKey,
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
    expect(window.localStorage.getItem(mobileReadingStateStorageKey)).not.toContain(
      'wrn-test-art-g3-008-gone',
    );
  });

  it('projects the bound home roles without a duplicate or a generic feed fallback', async () => {
    render(<App initialState="ready" now={() => Date.parse('2026-08-30T10:00:00.000Z')} />);

    expect(await screen.findByTestId('manifest-revision')).toHaveTextContent(
      'wrn-g3-016-mobile-home-manifest-v1',
    );
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(9);
    expect(cards[0]).toHaveAttribute('data-article-id', 'wrn-test-art-cedar');
    expect(cards[0]).toHaveTextContent('Lokale Testquelle');
    expect(cards[0]).toHaveTextContent('23.08.2026, 10:00 UTC');
    expect(cards[0]).toHaveTextContent('de');
    expect(cards[0]).toHaveTextContent('Diese selbst erstellte Meldung prueft');
    expect(cards.map((card) => card.dataset.articleId)).toEqual([
      'wrn-test-art-cedar',
      'wrn-test-art-ember',
      'wrn-test-art-fern',
      'wrn-test-art-g3-016-a',
      'wrn-test-art-g3-016-b',
      'wrn-test-art-g3-016-c',
      'wrn-test-art-g3-016-d',
      'wrn-test-art-g3-016-e',
      'wrn-test-art-g3-016-f',
    ]);
    expect(cards.map((card) => card.dataset.homeRole)).toEqual([
      'lead',
      'main',
      'main',
      'main',
      'main',
      'main',
      'sport-feature',
      'sport-secondary',
      'sport-secondary',
    ]);
    expect(screen.getByRole('heading', { name: 'Current' })).toBeVisible();
    expect(screen.queryByText('Current test edition')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sport & fan culture' })).toBeVisible();
    expect(screen.getAllByRole('img', { name: /Local image placeholder for/ })).toHaveLength(9);
  });

  it('shows a separate ordered legacy list when a valid ready manifest predates home roles', async () => {
    const user = userEvent.setup();
    render(
      <App
        initialState="ready"
        loader={async (signal) => {
          const runtime = await loadLocalContentRelease(signal);
          const { homePresentation: _homePresentation, ...legacyManifest } = runtime.ready.manifest;
          void _homePresentation;
          return {
            ...runtime,
            ready: {
              ...runtime.ready,
              manifest: legacyManifest,
            },
          };
        }}
      />,
    );

    expect(await screen.findByTestId('manifest-revision')).toHaveTextContent(
      'wrn-g3-016-mobile-home-manifest-v1',
    );
    expect(document.querySelector('[data-home-mode="legacy"]')).toBeInTheDocument();
    expect(screen.getAllByRole('article').map((card) => card.dataset.articleId)).toEqual([
      'wrn-test-art-cedar',
      'wrn-test-art-ember',
      'wrn-test-art-fern',
      'wrn-test-art-g3-016-a',
      'wrn-test-art-g3-016-b',
      'wrn-test-art-g3-016-c',
      'wrn-test-art-g3-016-d',
      'wrn-test-art-g3-016-e',
      'wrn-test-art-g3-016-f',
    ]);
    expect(
      screen.getAllByRole('article').every((card) => card.dataset.homeRole === undefined),
    ).toBe(true);
    expect(screen.queryByRole('heading', { name: 'Lead' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Main stories' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sport & fan culture' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'All sport news' })).not.toBeInTheDocument();

    const firstCard = screen.getAllByRole('article')[0]!;
    await user.click(within(firstCard).getByRole('button', { name: 'Save for later' }));
    expect(within(firstCard).getByRole('button', { name: 'Remove from saved' })).toBeVisible();
    await user.click(within(firstCard).getByRole('button', { name: 'Read article' }));
    expect(window.location.hash).toBe('#article/wrn-test-art-cedar');
  });

  it('keeps saved state and reader actions on every home role', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" now={() => Date.parse('2026-08-30T10:00:00.000Z')} />);

    await screen.findByTestId('manifest-revision');
    const sportCard = screen.getByText('Lokaler Layoutplatzhalter 5').closest('article');
    expect(sportCard).not.toBeNull();
    const save = within(sportCard!).getByRole('button', { name: 'Save for later' });
    await user.click(save);
    expect(within(sportCard!).getByRole('button', { name: 'Remove from saved' })).toBeVisible();
    await user.click(within(sportCard!).getByRole('button', { name: 'Read article' }));
    expect(window.location.hash).toBe('#article/wrn-test-art-g3-016-e');
  });

  it('opens the real attributed sport selection from Start without presenting fixture reader actions', async () => {
    const user = userEvent.setup();
    const snapshot = (await import('./features/directory/data/content-directory-v1.json')).default;
    const originalFetch = vi.mocked(globalThis.fetch).getMockImplementation()!;
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) =>
      String(input).includes('content-directory-v1.json')
        ? Promise.resolve(new Response(JSON.stringify(snapshot)))
        : originalFetch(input, init),
    );
    render(<App initialState="ready" now={() => Date.parse('2026-08-30T10:00:00.000Z')} />);

    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('link', { name: 'All sport news' }));
    expect(window.location.hash).toBe('#discover/sport');
    expect(await screen.findByRole('heading', { name: 'Sport reading notes' })).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'The politics of the football terrace' }),
    ).toHaveAttribute(
      'href',
      'https://africasacountry.com/2026/06/the-politics-of-the-football-terrace',
    );
    expect(
      within(screen.getByRole('region', { name: 'Sport reading notes' }))
        .getAllByRole('link')
        .filter((link) => link.getAttribute('target') === '_blank'),
    ).toHaveLength(45);
    expect(screen.getByRole('link', { name: 'RSS' })).toHaveAttribute(
      'href',
      'https://www.fsgt.org/feed/',
    );
    expect(screen.getByRole('link', { name: 'Atom' })).toHaveAttribute(
      'href',
      'https://africasacountry.com/feed/',
    );
    expect(screen.queryByRole('button', { name: 'Read article' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save article' })).not.toBeInTheDocument();
  });

  it('keeps primary roles but hides all sport cards when the bound sport check is stale', async () => {
    render(<App initialState="ready" now={() => Date.parse('2026-09-07T10:00:01.000Z')} />);

    await screen.findByTestId('manifest-revision');
    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(screen.getByText('Sport updates are not current')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'All sport news' })).not.toBeInTheDocument();
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

  it('fails closed to error for an invalid state query', async () => {
    window.history.replaceState({}, '', '/?state=not-a-state');
    render(<App loader={loadLocalContentRelease} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be displayed safely');
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

  it('fails closed without legacy fallback when the controlled loader admits an invalid current home projection', async () => {
    render(
      <App
        initialState="ready"
        loader={async (signal) => {
          const runtime = await loadLocalContentRelease(signal);
          return {
            ...runtime,
            ready: {
              ...runtime.ready,
              manifest: {
                ...runtime.ready.manifest,
                homePresentation: {
                  ...runtime.ready.manifest.homePresentation!,
                  leadId: 'wrn-test-art-unadmitted-primary',
                },
              },
            },
          };
        }}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Error' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('could not be displayed safely');
    expect(screen.queryByTestId('manifest-revision')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('uses the theme query and persists the named theme selection locally', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/?theme=dark&state=offline');
    const { unmount } = render(<App loader={loadLocalContentRelease} />);

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    const readyButton = screen.getByRole('button', { name: 'Ready' });
    readyButton.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByTestId('manifest-revision')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'More' }));
    const selector = screen.getByLabelText('Color theme');
    expect(selector).toHaveValue('dark');
    expect(within(selector).getAllByRole('option')).toHaveLength(9);
    expect(within(selector).getByRole('option', { name: 'Violet/Red' })).toHaveValue('violet');
    expect(within(selector).getByRole('option', { name: 'Red/Cyan' })).toHaveValue('dark');
    expect(within(selector).getByRole('option', { name: 'Editorial black/red' })).toHaveValue(
      'editorial',
    );
    await user.selectOptions(selector, 'editorial');
    expect(document.documentElement.dataset.theme).toBe('editorial');
    expect(document.documentElement.dataset.themePreference).toBe('editorial');
    expect(window.localStorage.getItem('wrn.theme-preference.v1')).toBe('editorial');

    unmount();
    window.history.replaceState({}, '', '/?state=loading');
    render(<App loader={loadLocalContentRelease} />);
    fireEvent.click(screen.getByRole('link', { name: 'More' }));
    expect(screen.getByLabelText('Color theme')).toHaveValue('editorial');
  });

  it('fails closed for an invalid theme value without writing it to local storage', async () => {
    window.history.replaceState({}, '', '/?theme=unknown-theme&state=loading');
    render(<App />);

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('violet'));
    fireEvent.click(screen.getByRole('link', { name: 'More' }));
    expect(screen.getByLabelText('Color theme')).toHaveValue('violet');
    expect(window.localStorage.getItem('wrn.theme-preference.v1')).toBeNull();
  });

  it('removes an invalid stored theme before falling back to violet', async () => {
    window.localStorage.setItem('wrn.theme-preference.v1', 'unknown-theme');
    render(<App initialState="loading" />);

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('violet'));
    expect(window.localStorage.getItem('wrn.theme-preference.v1')).toBeNull();
  });

  it('resolves system live and removes its media listener after unmount', async () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mediaQuery = {
      matches: false,
      addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.add(listener),
      ),
      removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.delete(listener),
      ),
    } as unknown as MediaQueryList;
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mediaQuery),
    );

    const { unmount } = render(<App initialState="loading" initialTheme="system" />);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
    expect(document.documentElement.dataset.themePreference).toBe('system');

    (mediaQuery as { matches: boolean }).matches = true;
    for (const listener of listeners) listener({ matches: true } as MediaQueryListEvent);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));

    unmount();
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('keeps a compact accessible text brand name without a large asset masthead', () => {
    render(<App initialState="loading" />);

    const brand = screen.getByRole('link', { name: /Solinaridao.*World Revolution News/i });
    expect(brand).toHaveTextContent('World Revolution News');
    expect(brand.querySelector('img')).toBeNull();
  });

  it('offers the approved project and voluntary donation links with privacy-preserving attributes', () => {
    render(<App initialState="loading" />);

    const projectLinks = screen.getAllByRole('link', { name: 'More about the project' });
    expect(projectLinks).toHaveLength(2);
    const headerProjectLink = within(screen.getByRole('banner')).getByRole('link', {
      name: 'More about the project',
    });
    expect(headerProjectLink).toBeVisible();
    expect(headerProjectLink).toHaveAttribute('href', 'https://solinaridao.com/?lang=en');
    const donationLink = screen.getByRole('link', { name: 'Support' });
    expect(projectLinks.find((projectLink) => projectLink !== headerProjectLink)).toHaveAttribute(
      'href',
      'https://solinaridao.com/',
    );
    expect(donationLink).toHaveAttribute(
      'href',
      'https://www.paypal.com/ncp/payment/6FSV9FEN4X7VS',
    );

    for (const link of [...projectLinks, donationLink]) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
    }
    expect(screen.getByText(/Voluntary support/i)).toBeVisible();
    expect(
      screen.getByText(/Activating this leaves the app and opens an external payment page/i),
    ).toBeVisible();
    expect(screen.queryByText(/PayPal/i)).not.toBeInTheDocument();
  });

  it('keeps the five familiar primary targets ordered and marks the active local target', () => {
    render(<App initialState="loading" />);

    const navigation = screen.getByRole('navigation', { name: 'Mobile main navigation' });
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Home', 'For me', 'Discover', 'Media', 'Saved']);
    expect(within(navigation).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows a named Discover loading state instead of the old migration placeholder', async () => {
    const user = userEvent.setup();
    render(<App initialState="loading" />);

    await user.click(screen.getByRole('link', { name: 'Discover' }));
    expect(screen.getByRole('heading', { name: 'Discover' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('being prepared');
    expect(screen.queryByText('Not migrated yet')).not.toBeInTheDocument();
    expect(window.location.hash).toBe('#discover');
  });

  it('keeps compact native filters, active criteria and reset focus deterministic', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" />);

    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('link', { name: 'Discover' }));
    expect(screen.getByRole('heading', { name: 'Discover' })).toHaveFocus();
    const disclosure = document.querySelector<HTMLDetailsElement>('.discover-facets');
    expect(disclosure).not.toBeNull();
    expect(disclosure).not.toHaveAttribute('open');
    expect(screen.getByText('Filters (0)')).toBeVisible();
    const search = screen.getByRole('searchbox', { name: 'Search news' });
    await user.type(search, 'responsive');
    expect(screen.getByText('Filters (1)')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove Search news: responsive' })).toBeVisible();
    await user.click(screen.getByText('Filters (1)'));
    expect(disclosure).toHaveAttribute('open');
    await user.selectOptions(screen.getByLabelText('Format'), 'analysis');
    expect(screen.getByText('Filters (2)')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('1 results');
    expect(screen.getByRole('article')).toHaveAttribute('data-article-id', 'wrn-test-art-ember');
    await user.click(screen.getByRole('button', { name: 'Remove Format: analysis' }));
    expect(screen.getByLabelText('Format')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Remove Search news: responsive' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Reset all filters' }));
    expect(search).toHaveValue('');
    expect(screen.getByText('Filters (0)')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('9 results');
    expect(search).toHaveFocus();
  });

  it('keeps a filter no-result distinct and offers an outside-disclosure reset', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" />);

    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('link', { name: 'Discover' }));
    const search = screen.getByRole('searchbox', { name: 'Search news' });
    await user.type(search, 'no local match');
    expect(screen.getByRole('heading', { name: 'No results' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reset all filters' })).toBeVisible();
    expect(document.querySelector<HTMLDetailsElement>('.discover-facets')).not.toHaveAttribute(
      'open',
    );
    await user.click(screen.getByRole('button', { name: 'Reset all filters' }));
    expect(search).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('9 results');
    expect(search).toHaveFocus();
  });

  it('restores a local navigation target from history and fails closed for unknown targets', () => {
    window.history.replaceState({}, '', '/#media');
    const { unmount } = render(<App initialState="loading" />);
    expect(screen.getByRole('heading', { name: 'Media' })).toBeVisible();
    unmount();

    window.history.replaceState({}, '', '/#not-a-navigation-target');
    render(<App initialState="loading" />);
    expect(screen.getByRole('heading', { name: 'Current' })).toBeVisible();
  });

  it('opens the local events route with an honest loading shell and focused heading', () => {
    window.history.replaceState({}, '', '/#events');
    render(<App initialState="loading" />);
    expect(screen.getByRole('heading', { name: 'Events' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Local events are being checked.');
    expect(screen.getByText(/Location services are not used/u)).toBeVisible();
  });

  it('opens a validated local reader from Start, keeps the source behind confirmation and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" />);

    await screen.findByTestId('manifest-revision');
    const cedar = screen
      .getByText('Lokale Testmeldung zur gemeinsamen Leseliste')
      .closest('article');
    expect(cedar).not.toBeNull();
    await user.click(within(cedar!).getByRole('button', { name: 'Read article' }));
    expect(window.location.hash).toBe('#article/wrn-test-art-cedar');
    expect(
      screen.getByRole('heading', { name: /Lokale Testmeldung zur gemeinsamen Leseliste/ }),
    ).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Open original source' })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Open external source now' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open original source' }));
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const external = screen.getByRole('link', { name: 'Open external source now' });
    expect(cancel).toHaveFocus();
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
    await user.keyboard('{Escape}');
    await waitFor(() => expect(window.location.hash).toBe(''));
  });

  it('renders an honest not-found reader for a direct local route', async () => {
    window.history.replaceState({}, '', '/#article/unknown-local-id');
    render(<App initialState="ready" />);
    expect(await screen.findByRole('heading', { name: 'Article not found' })).toBeVisible();
    expect(screen.queryByText('Diese selbst erstellte Meldung prueft')).not.toBeInTheDocument();
  });

  it('opens the release-bound local archive under Mehr and shares only a canonical target', async () => {
    const user = userEvent.setup();
    const shared: string[] = [];
    render(
      <App
        initialState="ready"
        shareAdapter={{
          share: async (url) => {
            shared.push(url);
          },
        }}
      />,
    );

    await screen.findByTestId('manifest-revision');
    await user.click(screen.getByRole('link', { name: 'More' }));
    await user.click(screen.getByRole('button', { name: 'News archive' }));
    expect(await screen.findByRole('heading', { name: 'News archive' })).toBeVisible();
    expect(screen.getByText('Lokale Testmeldung zur gemeinsamen Leseliste')).toBeVisible();
    const cedar = screen
      .getByText('Lokale Testmeldung zur gemeinsamen Leseliste')
      .closest('article');
    expect(cedar).not.toBeNull();
    await user.click(within(cedar!).getByRole('button', { name: 'Read article' }));
    expect(
      await screen.findByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() =>
      expect(shared).toEqual(['https://solinaridao.com/articles/wrn-test-art-cedar/']),
    );
    expect(window.location.hash).toBe('#archive/wrn-test-art-cedar');
  });

  it('keeps a release-bound gone archive state payload-free', async () => {
    window.history.replaceState({}, '', '#archive/wrn-test-art-g3-012-gone');
    render(<App initialState="ready" />);
    expect(
      await screen.findByRole('heading', { name: 'Message no longer available' }),
    ).toBeVisible();
    expect(
      screen.queryByText('Lokale Testmeldung zur gemeinsamen Leseliste'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
  });
});
