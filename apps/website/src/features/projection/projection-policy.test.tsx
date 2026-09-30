import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import directory from './data/content-directory-v1.json';
import pointer from './data/pointer.json';
import sourcePassRaw from '../../../../../packages/browser-content/src/data/source-pass-overlay-v1.json?raw';
import initialRevocations from '../../../../../packages/browser-content/src/data/source-pass-revocations-v1.json';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import { applyWebsiteLinkPolicy, websiteArticleSourceIds } from './projection-policy';
import { WebsiteCoverage } from './WebsiteCoverage';
import {
  loadWebsiteContentDirectory,
  refreshWebsiteContentDirectory,
  resetWebsiteContentDirectoryCacheForTest,
  websiteWithdrawalsStorageKey,
} from '../directory/directory-loader';
const document = directory as MobileContentDirectory;
const latest = [...document.articles]
  .filter((a) => !a.historical)
  .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))[0]!;
const endpoint = websiteArticleSourceIds(latest, document)[0]!;
const json = (value: unknown) =>
  new Response(JSON.stringify(value) + '\n', { headers: { 'content-type': 'application/json' } });
async function transport(remote = document) {
  const bytes = new TextEncoder().encode(JSON.stringify(remote) + '\n');
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
  const manifest = {
    ...pointer,
    sequence: pointer.sequence + 1,
    artifactSha256: digest,
    artifactPath: `snapshots/directory-${pointer.sequence + 1}-${digest}.json`,
  };
  let revocations = {
    ...structuredClone(initialRevocations),
    endpointIds: [...initialRevocations.endpointIds] as string[],
  };
  vi.stubEnv(
    'VITE_WRN_DIRECTORY_MANIFEST_ENDPOINT',
    'https://solinaridao.com/wrn-content-directory/current.json',
  );
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes('wrn-source-pass-revocations')) return json(revocations);
    if (url === '/wrn-source-passes/current.json')
      return new Response(sourcePassRaw, { headers: { 'content-type': 'application/json' } });
    if (url.endsWith('/wrn-content-directory/current.json')) return json(manifest);
    if (url.includes('/snapshots/')) return json(remote);
    return json(document);
  });
  return {
    fetch,
    revoke: () => {
      revocations = {
        ...initialRevocations,
        revision: initialRevocations.revision + 1,
        endpointIds: [endpoint],
      };
    },
  };
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  resetWebsiteContentDirectoryCacheForTest();
  localStorage.clear();
});
it('directory-only and prohibited metadata suppress inferred article links without removing the source directory', () => {
  const inferred = document.articles.find(
    (a) =>
      !a.historical && a.endpointIds.length === 0 && websiteArticleSourceIds(a, document).length,
  )!;
  const id = websiteArticleSourceIds(inferred, document)[0]!;
  for (const policy of [
    { directoryOnlyEndpointIds: [id] },
    { prohibitedMetadataEndpointIds: [id] },
  ]) {
    const view = applyWebsiteLinkPolicy(document, policy);
    expect(view.articles.some((a) => a.id === inferred.id)).toBe(false);
    expect(view.sources.some((s) => s.id === id)).toBe(true);
  }
});
it('a newer hashed live document cannot bypass the reviewed snapshot admission', async () => {
  const remote = structuredClone(document);
  const article = remote.articles.find((a) => a.id === latest.id)!;
  article.title = 'Unreviewed live title';
  article.observations.at(-1)!.title = article.title;
  await transport(remote);
  const result = await loadWebsiteContentDirectory(new AbortController().signal);
  expect(result.document.articles.find((a) => a.id === latest.id)?.title).toBe(latest.title);
  expect(result.source).toBe('bundled');
  expect(result.transferState).toBe('refresh-unconfirmed');
  expect(result.coverage?.counts.metadataLinkOnly).toBe(480);
});
it('live source withdrawal removes rendered homepage links and remains blocked after an offline restart', async () => {
  const server = await transport();
  render(<WebsiteCoverage language="de" />);
  await screen.findByRole('link', { name: latest.title });
  server.revoke();
  await act(async () => {
    await refreshWebsiteContentDirectory();
  });
  expect(screen.queryByRole('link', { name: latest.title })).not.toBeInTheDocument();
  cleanup();
  resetWebsiteContentDirectoryCacheForTest();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const reopened = await loadWebsiteContentDirectory(new AbortController().signal);
  expect(reopened.projection.articles.some((a) => a.id === latest.id)).toBe(false);
  expect(reopened.transferState).toBe('offline');
});
it('withdrawals from an unbound live directory restrict the pinned snapshot and persist', async () => {
  const remote = structuredClone(document);
  remote.withdrawals.articleIds = [latest.id];
  await transport(remote);
  const result = await loadWebsiteContentDirectory(new AbortController().signal);
  expect(result.projection.articles.some((a) => a.id === latest.id)).toBe(false);
  expect(JSON.parse(localStorage.getItem(websiteWithdrawalsStorageKey)!).articleIds).toContain(
    latest.id,
  );
  resetWebsiteContentDirectoryCacheForTest();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  expect(
    (await loadWebsiteContentDirectory(new AbortController().signal)).projection.articles.some(
      (a) => a.id === latest.id,
    ),
  ).toBe(false);
});
it('corrupt withdrawal memory blocks every directory link instead of reintroducing unknown safety', async () => {
  await transport();
  localStorage.setItem(websiteWithdrawalsStorageKey, '{broken');
  const result = await loadWebsiteContentDirectory(new AbortController().signal);
  expect(result.projection.articles).toHaveLength(0);
  expect(result.projection.sources).toHaveLength(0);
  expect(result.transferState).toBe('safety-unavailable');
});
it('the cache expires and a failed refresh is labelled even while the snapshot is under 24 hours old', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const server = await transport();
  await loadWebsiteContentDirectory(new AbortController().signal);
  const before = server.fetch.mock.calls.length;
  vi.setSystemTime(Date.now() + 60001);
  server.fetch.mockImplementation(async (input) => {
    if (String(input).includes('https://')) throw new TypeError('network');
    return json(document);
  });
  const result = await loadWebsiteContentDirectory(new AbortController().signal);
  expect(server.fetch.mock.calls.length).toBeGreaterThan(before);
  expect(result.transferState).toBe('refresh-unconfirmed');
  expect(result.projection.articles.filter((a) => !a.historical)).toHaveLength(480);
});
