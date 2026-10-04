import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CoverageDetails, WebsiteCoverage } from './WebsiteCoverage';
import { getProjectionCopy } from './projection-copy';
import {
  loadWebsiteContentDirectory,
  resetWebsiteContentDirectoryCacheForTest,
} from '../directory/directory-loader';
import directory from './data/content-directory-v1.json';
import summary from './data/summary.json';
import pointer from './data/pointer.json';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import { projectMobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { UiLanguage } from '@wrn/ui-language';
const document = directory as MobileContentDirectory;
const data = { document, projection: projectMobileContentDirectory(document), coverage: summary };
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetWebsiteContentDirectoryCacheForTest();
  localStorage.clear();
});
const response = (value: unknown) =>
  new Response(JSON.stringify(value) + '\n', { headers: { 'content-type': 'application/json' } });
it('shows bound counts, exclusions, actual dates and stale saved state in all nine UI languages', () => {
  for (const language of ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as UiLanguage[]) {
    render(
      <CoverageDetails
        data={data}
        language={language}
        now={Date.parse(summary.feedTime) + 86400001}
      />,
    );
    expect(
      screen.getByRole('heading', { name: getProjectionCopy(language).title }),
    ).toBeInTheDocument();
    expect(screen.getByText(/475\/500/)).toHaveTextContent('25');
    expect(screen.getByText(getProjectionCopy(language).stale)).toBeInTheDocument();
    expect(screen.getByText('identity-conflict')).toBeInTheDocument();
    cleanup();
  }
  expect(getProjectionCopy('invalid')).toEqual(getProjectionCopy('en'));
});
it('never claims bound parity counts for a different accepted directory revision', () => {
  render(<CoverageDetails data={{ ...data, coverage: null }} language="de" />);
  expect(screen.getByText(getProjectionCopy('de').unknown)).toBeInTheDocument();
  expect(screen.queryByText(/475\/500/)).not.toBeInTheDocument();
});
it('uses the verified bundled projection after a network failure', async () => {
  vi.stubEnv(
    'VITE_WRN_DIRECTORY_MANIFEST_ENDPOINT',
    'https://solinaridao.com/wrn-content-directory/current.json',
  );
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    if (String(input).includes('/wrn-content-directory/')) throw new TypeError('network');
    return response(document);
  });
  const result = await loadWebsiteContentDirectory(new AbortController().signal);
  expect(result.source).toBe('bundled');
  expect(result.coverage?.counts.included).toBe(475);
  expect(result.projection.articles.filter((a) => !a.historical)).toHaveLength(475);
  vi.unstubAllEnvs();
});
it.each(['blocked', 'malformed'])(
  'blocks an older live pointer with %s persistent storage',
  async (storageState) => {
    vi.stubEnv(
      'VITE_WRN_DIRECTORY_MANIFEST_ENDPOINT',
      'https://solinaridao.com/wrn-content-directory/current.json',
    );
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      if (storageState === 'blocked') throw new Error('blocked');
      return JSON.stringify({
        sequence: pointer.sequence + 1,
        sha256: pointer.artifactSha256,
        extra: true,
      });
    });
    const artifactFetch = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const value = String(input);
      if (value.endsWith('/wrn-content-directory/current.json'))
        return response({
          ...pointer,
          sequence: pointer.sequence - 1,
          artifactPath: `snapshots/directory-${pointer.sequence - 1}-${pointer.artifactSha256}.json`,
        });
      if (value.includes('/snapshots/')) artifactFetch();
      return response(document);
    });
    const result = await loadWebsiteContentDirectory(new AbortController().signal);
    expect(result.source).toBe('bundled');
    expect(artifactFetch).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  },
);
it('renders six real current original links without importing any remote image or body', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(response(document));
  render(<WebsiteCoverage language="de" />);
  const links = await screen.findAllByRole('link');
  expect(links).toHaveLength(7);
  expect(links.slice(0, 6).every((link) => link.getAttribute('href')?.startsWith('https://'))).toBe(
    true,
  );
  expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
  expect(links[0]).toHaveAttribute('referrerpolicy', 'no-referrer');
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
