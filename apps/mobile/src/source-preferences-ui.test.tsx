import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canonicalJson } from '@wrn/content-contracts';
import { emptySourcePreferences, setSourcePreference } from '@wrn/domain';
import { getUiCopy } from '@wrn/ui-language';
import { getSourcePreferencesCopy } from '@wrn/ui-language/source-preferences';
import { createSourcePreferencesStore } from '../../../packages/browser-content/src/source-preferences-state';
import {
  SourcePreferencesProvider,
  SourcePreferencesPanel,
  SourceChoiceControls,
  SourceOnlyResults,
  useSourcePreferences,
} from '../../../packages/browser-content/src/source-preferences-ui';

const key = 'wrn.mobile.source-preferences.v1';
const copy = getSourcePreferencesCopy('en');
const ui = getUiCopy('en');
const followed = setSourcePreference(emptySourcePreferences(), 'production', 'eff', 'follow')!;
const hidden = setSourcePreference(emptySourcePreferences(), 'production', 'eff', 'hide')!;
const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false;
    },
  });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  for (const [name, descriptor] of [
    ['showModal', showModal],
    ['close', close],
  ] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});

function Probe() {
  const source = useSourcePreferences();
  return (
    <output data-testid="source-state">
      {JSON.stringify({ kind: source.loaded?.kind, choices: source.state.choices })}
    </output>
  );
}
function Contents() {
  return (
    <main tabIndex={-1}>
      <Probe />
      <SourcePreferencesPanel />
      <SourceChoiceControls catalog="production" sourceId="eff" name="EFF" />
      <SourceOnlyResults render={() => <p>Real result seam</p>} />
    </main>
  );
}
function mount(createStore = createSourcePreferencesStore) {
  const view = render(
    <StrictMode>
      <SourcePreferencesProvider storageKey={key} language="en" createStore={createStore}>
        <Contents />
      </SourcePreferencesProvider>
    </StrictMode>,
  );
  fireEvent.click(screen.getByText(copy.title, { selector: 'summary' }));
  return view;
}

describe('shared source provider and controls', () => {
  it('does not write on StrictMode mount, disposes each store, applies only explicit choices and preserves other keys', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const disposals: ReturnType<typeof vi.fn>[] = [];
    const factory = (storageKey: string) => {
      const store = createSourcePreferencesStore(storageKey);
      const dispose = vi.fn(() => store.dispose());
      disposals.push(dispose);
      return { ...store, dispose };
    };
    const view = mount(factory);
    expect(setItem).not.toHaveBeenCalled();
    expect(disposals).toHaveLength(2);
    expect(disposals[0]).toHaveBeenCalledOnce();
    expect(screen.queryByText('Real result seam')).toBeNull();
    localStorage.setItem('wrn.website.source-preferences.v1', 'website sentinel');
    localStorage.setItem('reading', 'bookmarks sentinel');
    fireEvent.click(screen.getByRole('button', { name: 'Follow: EFF' }));
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(followed);
    expect(screen.getByRole('button', { name: 'Unfollow: EFF' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Real result seam')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Hide: EFF' }));
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(hidden);
    fireEvent.click(screen.getByRole('button', { name: 'Show again: EFF' }));
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(emptySourcePreferences());
    expect(localStorage.getItem('reading')).toBe('bookmarks sentinel');
    expect(localStorage.getItem('wrn.website.source-preferences.v1')).toBe('website sentinel');
    view.unmount();
    expect(disposals[1]).toHaveBeenCalledOnce();
  });

  it('refreshes relevant storage, focus and visibility changes without deriving choices from unrelated data', () => {
    mount();
    localStorage.setItem(key, canonicalJson(hidden));
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' })));
    expect(screen.getByRole('button', { name: 'Hide: EFF' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    act(() => window.dispatchEvent(new StorageEvent('storage', { key })));
    expect(screen.getByRole('button', { name: 'Show again: EFF' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    localStorage.setItem(key, canonicalJson(followed));
    act(() => window.dispatchEvent(new Event('focus')));
    expect(screen.getByRole('button', { name: 'Unfollow: EFF' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    localStorage.removeItem(key);
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: null })));
    expect(screen.getByTestId('source-state')).toHaveTextContent('inactive');
    localStorage.setItem(key, canonicalJson(hidden));
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(screen.getByRole('button', { name: 'Show again: EFF' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('does not replace an unseen concurrent choice and reports the conflict', () => {
    mount();
    localStorage.setItem(key, canonicalJson(hidden));
    fireEvent.click(screen.getByRole('button', { name: 'Follow: EFF' }));
    expect(localStorage.getItem(key)).toBe(canonicalJson(hidden));
    expect(screen.getAllByRole('alert').some((el) => el.textContent === copy.failed)).toBe(true);
    expect(screen.getByRole('button', { name: 'Show again: EFF' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('preserves future data, disables edits, and clears only after explicit confirmation', () => {
    const raw = '{"contractVersion":"9.0.0","private":"do not render"}';
    localStorage.setItem(key, raw);
    localStorage.setItem('interests', 'interest sentinel');
    mount();
    expect(screen.getByRole('alert')).toHaveTextContent(copy.protected);
    expect(screen.queryByText(/do not render/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Follow: EFF' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: copy.clear }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: ui.cancel }));
    expect(localStorage.getItem(key)).toBe(raw);
    fireEvent.click(screen.getByRole('button', { name: copy.clear }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: ui.deleteNow }));
    expect(localStorage.getItem(key)).toBeNull();
    expect(localStorage.getItem('interests')).toBe('interest sentinel');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('never clears a refreshed document that was not shown when confirmation opened', () => {
    localStorage.setItem(key, canonicalJson(followed));
    mount();
    fireEvent.click(screen.getByRole('button', { name: copy.clear }));
    localStorage.setItem(key, canonicalJson(hidden));
    act(() => window.dispatchEvent(new StorageEvent('storage', { key })));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: ui.deleteNow }));
    expect(localStorage.getItem(key)).toBe(canonicalJson(hidden));
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(copy.failed);
  });

  it('allows a temporarily absent source to be unhidden using its exact scoped ID', () => {
    localStorage.setItem(
      key,
      canonicalJson(
        setSourcePreference(emptySourcePreferences(), 'production', 'absent-source', 'hide'),
      ),
    );
    mount();
    fireEvent.click(
      screen.getByRole('button', {
        name: `Show again: ${copy.missing}: absent-source`,
      }),
    );
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(emptySourcePreferences());
  });

  it('reports storage denial without showing an empty-success message or source results', () => {
    mount(() => {
      throw new Error('storage denied');
    });
    expect(screen.getByRole('alert')).toHaveTextContent(copy.unavailable);
    expect(screen.queryByText(copy.empty)).toBeNull();
    expect(screen.queryByText('Real result seam')).toBeNull();
    expect(screen.getByRole('button', { name: 'Follow: EFF' })).toBeDisabled();
  });

  it('reports quota failure without claiming saved state', () => {
    mount((storageKey) =>
      createSourcePreferencesStore(storageKey, {
        getItem: () => null,
        setItem: () => {
          throw new Error('quota');
        },
        removeItem: () => undefined,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Follow: EFF' }));
    expect(screen.getAllByRole('alert').some((el) => el.textContent === copy.failed)).toBe(true);
    expect(screen.queryByText(copy.saved)).toBeNull();
    expect(screen.queryByText('Real result seam')).toBeNull();
  });

  it('replaces stale provider state with unavailable when a replacement store cannot open', () => {
    localStorage.setItem(key, canonicalJson(followed));
    const view = mount();
    view.rerender(
      <StrictMode>
        <SourcePreferencesProvider
          storageKey={key}
          language="en"
          createStore={() => {
            throw new Error('denied');
          }}
        >
          <Contents />
        </SourcePreferencesProvider>
      </StrictMode>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(copy.unavailable);
    expect(screen.queryByText('Real result seam')).toBeNull();
    expect(localStorage.getItem(key)).toBe(canonicalJson(followed));
  });
});
