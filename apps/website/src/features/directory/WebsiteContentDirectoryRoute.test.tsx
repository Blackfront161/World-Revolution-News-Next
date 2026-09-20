import { matchesDirectorySource } from '../../../../../packages/browser-content/src/source-search';
import {
  validateMobileContentDirectory,
  projectMobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import snapshot from './data/content-directory-v1.json';
import { WebsiteContentDirectoryRoute } from './WebsiteContentDirectoryRoute';

afterEach(() => vi.restoreAllMocks());

it('finds the existing Direkte Aktion source by domain and name', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(snapshot), {
      headers: { 'content-type': 'application/json' },
    }),
  );
  render(
    <WebsiteContentDirectoryRoute
      language="en"
      section="sources"
      headingRef={{ current: null }}
      onSectionChange={() => {}}
    />,
  );
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
  render(
    <WebsiteContentDirectoryRoute
      language="en"
      section="sources"
      headingRef={{ current: null }}
      onSectionChange={() => {}}
    />,
  );
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
