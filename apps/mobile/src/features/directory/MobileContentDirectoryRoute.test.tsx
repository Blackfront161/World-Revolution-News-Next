import { matchesDirectorySource } from '../../../../../packages/browser-content/src/source-search';
import {
  validateMobileContentDirectory,
  projectMobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import snapshot from './data/content-directory-v1.json';
import fullOverlayRaw from '../../../../../packages/browser-content/src/data/source-pass-overlay-v1.json?raw';

beforeEach(() => {
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: { request: async (_name: string, _options: unknown, action: () => unknown) => action() },
  });
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : ((input as Request | undefined)?.url ?? '');
    const body =
      url === '/wrn-source-passes/current.json' ? fullOverlayRaw : JSON.stringify(snapshot);
    return new Response(body, { headers: { 'content-type': 'application/json' } });
  });
});
afterEach(() => {
  Reflect.deleteProperty(navigator, 'locks');
  vi.restoreAllMocks();
});

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
  it('shows canonical active sources first and applies the same region facet to both lists', async () => {
    const { MobileContentDirectoryRoute } = await import('./MobileContentDirectoryRoute');
    render(<MobileContentDirectoryRoute language="en" section="sources" />);
    expect(
      await screen.findByRole('heading', { name: 'Curated active sources' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Historical and current directory endpoints' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Electronic Frontier Foundation', level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Center for a Stateless Society', level: 3 }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('World region'), { target: { value: 'Africa' } });
    expect(
      screen.getByRole('heading', { name: 'Africa Is a Country', level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Electronic Frontier Foundation', level: 3 }),
    ).not.toBeInTheDocument();
    const contact = screen.getByRole('link', { name: 'Official public contact' });
    expect(contact).toHaveAttribute('rel', 'noopener noreferrer');
    expect(contact).toHaveAttribute('referrerpolicy', 'no-referrer');
  });
  it('localizes source-pass values and exposes stable ids, aliases and rights limits in German', async () => {
    const { MobileContentDirectoryRoute } = await import('./MobileContentDirectoryRoute');
    render(<MobileContentDirectoryRoute language="de" section="sources" />);
    expect(
      await screen.findByRole('heading', { name: 'Kuratierte aktive Quellen' }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText(/Website: Erreichbar · Feed: Nicht geprüft/u)).toHaveLength(
      3,
    );
    expect(
      screen.getByText(/wrn-source-pass-4f938bf89f0b4fa3a7472161d8b92dc4/u),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Aliasse:/u).length).toBeGreaterThanOrEqual(3);
    await waitFor(() => expect(screen.getAllByText(/Jeder einzelne Text/u)).toHaveLength(19));
    expect(screen.queryByText(/homepage: healthy/u)).not.toBeInTheDocument();
    expect(screen.queryByText(/metadata: allowed/u)).not.toBeInTheDocument();
  });
  it('loads the full packaged source pass on an offline cold route', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { MobileContentDirectoryRoute } = await import('./MobileContentDirectoryRoute');
    render(<MobileContentDirectoryRoute language="en" section="sources" />);
    await waitFor(() => expect(screen.getAllByText(/Every individual text/u)).toHaveLength(19), {
      timeout: 5000,
    });
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
