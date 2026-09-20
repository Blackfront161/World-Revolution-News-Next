import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uiLanguageIds } from '@wrn/ui-language';
import snapshot from './features/directory/data/content-directory-v1.json';
import { SportSources } from '../../../packages/browser-content/src/sport-sources';

const localDirectoryResponse = () =>
  new Response(JSON.stringify(snapshot), {
    headers: { 'content-type': 'application/json' },
  });

beforeEach(() =>
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => localDirectoryResponse()),
);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('sport source directory supplement', () => {
  it('exposes only observed feed links without calling providers on render', () => {
    render(<SportSources language="en" open />);
    expect(screen.getByRole('link', { name: 'RSS', hidden: true })).toHaveAttribute(
      'href',
      'https://www.fsgt.org/feed/',
    );
    expect(screen.getByRole('link', { name: 'Atom', hidden: true })).toHaveAttribute(
      'href',
      'https://africasacountry.com/feed/',
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('keeps nine localized directory-only source records and never fetches them', () => {
    for (const language of uiLanguageIds) {
      const rendered = render(<SportSources language={language} />);
      const section = screen.getByTestId('sport-sources');
      expect(within(section).getAllByTestId(/^sport-source-/u)).toHaveLength(9);
      const fanSection = screen.getByTestId('sport-fan-sources');
      expect(within(fanSection).getAllByTestId(/^sport-fan-source-/u)).toHaveLength(31);
      expect(within(fanSection).getByTestId('sport-fan-sources-summary')).not.toHaveTextContent(
        '{count}',
      );
      for (const link of within(section).getAllByRole('link')) {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
        expect(link.getAttribute('href')).toMatch(/^https:\/\//u);
      }
      rendered.unmount();
    }
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('filters sources across all six inhabited continents without network requests', () => {
    render(<SportSources language="de" open />);
    const filter = screen.getByRole('combobox', { name: 'Kontinent' });
    expect(within(filter).getByRole('option', { name: 'Afrika' })).toHaveValue('africa');
    expect(within(filter).getByRole('option', { name: 'Ozeanien' })).toHaveValue('oceania');
    const section = screen.getByTestId('sport-fan-sources');
    for (const [continent, count] of [
      ['africa', 2],
      ['asia', 2],
      ['europe', 14],
      ['north-america', 4],
      ['south-america', 5],
      ['oceania', 4],
    ] as const) {
      fireEvent.change(filter, { target: { value: continent } });
      expect(within(section).getAllByTestId(/^sport-fan-source-/u)).toHaveLength(count);
      expect(within(section).getByRole('status')).toHaveTextContent(`(${count})`);
    }
    fireEvent.change(filter, { target: { value: 'all' } });
    expect(within(section).getAllByTestId(/^sport-fan-source-/u)).toHaveLength(31);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('integrates a closed source section and an open sport section in Mobile', async () => {
    const { MobileContentDirectoryRoute } =
      await import('./features/directory/MobileContentDirectoryRoute');
    const { rerender } = render(
      <MobileContentDirectoryRoute
        language="en"
        section="sources"
        headingRef={{ current: null }}
      />,
    );
    const summary = await screen.findByTestId('sport-sources-summary');
    expect(summary.closest('details')).not.toHaveAttribute('open');
    expect(screen.getByRole('heading', { name: 'Sport sources', level: 3 })).toBeVisible();
    rerender(
      <MobileContentDirectoryRoute language="en" section="sport" headingRef={{ current: null }} />,
    );
    expect(await screen.findByTestId('sport-sources-summary')).toHaveTextContent(
      'Sport sources (9)',
    );
    expect(screen.getByTestId('sport-sources-summary').closest('details')).toHaveAttribute('open');
  });
});
