import { readFile } from 'node:fs/promises';
import baseline from '../../apps/website/src/features/directory/data/content-directory-v1.json' with { type: 'json' };
import { projectionBytes, projectionHash } from './website-content-projection.mjs';
const sourcePassBytes = await readFile(
  new URL('../../apps/website/public/wrn-source-passes/current.json', import.meta.url),
);
const revocations = JSON.parse(
  await readFile(
    new URL('../../apps/website/public/wrn-source-pass-revocations/current.json', import.meta.url),
  ),
);
export function websiteTupleFixture({ revision = 1, mutate = () => {} } = {}) {
  const rows = Array.from({ length: 30 }, (_, i) => ({
    link: `https://source${i % 6}.example/revision-${revision}/article-${i}`,
    title: `Recorded ${i % 7 === 0 ? 'football' : 'community'} article ${i}`,
    quelleName: `Recorded Source ${i % 6}`,
    sourceHomepage: `https://source${i % 6}.example/`,
    language: 'en',
    pubDate: '2026-09-30T14:00:00Z',
    categories: [i % 7 === 0 ? 'Sport' : 'News'],
    content:
      `UNLICENSED BODY ${i}. This complete test sentence supports the frozen App selection only and must never be imported as publisher text. `.repeat(
        3,
      ),
    image: `https://images.example/revision-${revision}/image-${i}.png`,
  }));
  const registry = {
    generatedAt: '2026-09-30T15:00:00.000Z',
    sources: Array.from({ length: 6 }, (_, i) => ({
      canonicalUrl: `https://source${i}.example/`,
      homepage: `https://source${i}.example/`,
      name: `Recorded Source ${i}`,
      languages: ['en'],
      categories: ['News'],
      status: 'active',
    })),
  };
  const revoke = structuredClone(revocations);
  mutate(rows, registry, revoke);
  const feedBytes = projectionBytes(rows),
    sourceBytes = projectionBytes(registry),
    revocationBytes = projectionBytes(revoke);
  const statusBytes = projectionBytes({
    ok: true,
    lastSuccessfulFetchAt: '2026-09-30T15:00:00.000Z',
    lastPublishedAt: '2026-09-30T15:01:00.000Z',
    publication: { pending: false },
    news: { feedCount: rows.length, bytes: feedBytes.length },
  });
  const binding = {
    admissionPolicy: 'website-restricted-link-only-v1',
    importMode: 'metadata-only',
    commit: String(revision).repeat(40),
    observedAt: '2026-09-30T16:00:00.000Z',
    feedCount: rows.length,
    registerCount: registry.sources.length,
    hashes: {
      baseline: projectionHash(projectionBytes(baseline)),
      feed: projectionHash(feedBytes),
      status: projectionHash(statusBytes),
      registry: projectionHash(sourceBytes),
      sourcePass: projectionHash(sourcePassBytes),
      revocations: projectionHash(revocationBytes),
    },
  };
  return {
    baseline,
    feedBytes,
    sourceBytes,
    statusBytes,
    sourcePassBytes,
    revocationBytes,
    binding,
    sequence: 100 + revision,
    allowedImageOrigins: ['https://images.example'],
  };
}
