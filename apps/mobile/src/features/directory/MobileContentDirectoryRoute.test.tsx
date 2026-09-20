import { matchesDirectorySource } from '../../../../../packages/browser-content/src/source-search';
import {
  validateMobileContentDirectory,
  projectMobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import snapshot from './data/content-directory-v1.json';

beforeEach(() =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(snapshot))),
);
afterEach(() => vi.restoreAllMocks());

describe('MobileContentDirectoryRoute', () => {
  it('finds the existing Direkte Aktion source by domain and by name without duplicates', async () => {
    const { MobileContentDirectoryRoute } = await import('./MobileContentDirectoryRoute');
    render(<MobileContentDirectoryRoute language="en" section="sources" />);
    await screen.findByText('Showing 30 of 532');
    for (const query of [' DIREKTEAKTION.ORG ', 'Direkte Aktion']) {
      fireEvent.change(screen.getByLabelText('Search'), { target: { value: query } });
      expect(screen.getByText('Showing 1 of 1')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Direkte Aktion (DE)' })).toHaveAttribute(
        'href',
        'https://direkteaktion.org/',
      );
    }
  });
  it('renders the three sections, local filters and safe external links', async () => {
    const { MobileContentDirectoryRoute } = await import('./MobileContentDirectoryRoute');
    render(<MobileContentDirectoryRoute language="en" headingRef={{ current: null }} />);
    expect(await screen.findByText('Showing 30 of 493')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'it' } });
    expect(screen.getByLabelText('Source')).toBeInTheDocument();
    const link = screen.getAllByRole('link').at(0)!;
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
  });
  it('keeps source HTTP endpoints nonclickable and exposes each selected section', async () => {
    const { MobileContentDirectoryRoute } = await import('./MobileContentDirectoryRoute');
    const { rerender } = render(<MobileContentDirectoryRoute language="en" section="sources" />);
    expect(await screen.findByRole('heading', { name: 'Sources' })).toBeInTheDocument();
    expect(
      screen.getAllByText('Historical HTTP endpoint; not opened here.').length,
    ).toBeGreaterThan(0);
    rerender(<MobileContentDirectoryRoute language="en" section="sport" />);
    expect(await screen.findByRole('heading', { name: 'Sport reading notes' })).toBeInTheDocument();
  });
});

it('finds every admitted source by recorded names, endpoint and homepage domains', () => {
  if (!validateMobileContentDirectory(snapshot)) throw new Error('Invalid source snapshot');
  const sources = projectMobileContentDirectory(snapshot).sources;
  expect(sources).toHaveLength(532);
  for (const source of sources) {
    const queries = new Set([
      source.name,
      source.url,
      new URL(source.url).hostname.toUpperCase(),
      ...source.observations.flatMap((entry) => [
        entry.name,
        ...(entry.homepage ? [entry.homepage, new URL(entry.homepage).hostname.toUpperCase()] : []),
      ]),
    ]);
    for (const query of queries) {
      expect(matchesDirectorySource(source, ` ${query} `), `${source.id}: ${query}`).toBe(true);
    }
    expect(matchesDirectorySource(source, 'no-such-source.invalid')).toBe(false);
  }
});
it('uses recorded aliases and homepage domains in the rendered source search', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(snapshot), {
      headers: { 'content-type': 'application/json' },
    }),
  );
  const { MobileContentDirectoryRoute } = await import('./MobileContentDirectoryRoute');
  render(<MobileContentDirectoryRoute language="en" section="sources" />);
  await screen.findByText('Showing 30 of 532');
  for (const [query, href] of [
    ['CrimethInc. (Global)', 'https://crimethinc.com/'],
    ['ZNet (Global)', 'https://znetwork.org/'],
    [' WWW.269LIBERATIONANIMALE.FR ', 'https://269liberationanimale.fr/'],
  ]) {
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: query } });
    expect(
      Array.from(document.querySelectorAll('a')).some((link) => link.getAttribute('href') === href),
      query,
    ).toBe(true);
  }
});
