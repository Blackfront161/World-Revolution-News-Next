import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareWebsiteContentTuple } from './prepare-website-content-tuple.mjs';
import { websiteTupleFixture } from './website-tuple-test-fixture.mjs';
import { validateWebsiteContentTuple } from '../../packages/content-contracts/src/directory/website-content-tuple-v1.ts';
const validate = (tuple) =>
  validateWebsiteContentTuple(tuple, { allowedImageOrigins: ['https://images.example'] });
test('new Data identities update Home, topics, sources and images together, without publisher bodies', async () => {
  const a = await prepareWebsiteContentTuple(websiteTupleFixture()),
    b = await prepareWebsiteContentTuple(websiteTupleFixture({ revision: 2 }));
  assert.equal(await validate(a.tuple), true);
  assert.equal(await validate(b.tuple), true);
  assert.ok(a.tuple.home.lead);
  assert.ok(b.tuple.home.lead);
  assert.notEqual(a.tuple.home.lead, b.tuple.home.lead);
  for (const role of ['top', 'sport', 'more', 'briefing'])
    assert.ok(b.tuple.home[role].length, role);
  assert.equal(b.tuple.home.visibleIds.length, 30);
  assert.equal(b.tuple.images.entries.length, 30);
  assert.ok(b.tuple.images.entries.every((e) => e.imageUrl.includes('revision-2')));
  assert.ok(!b.bytes.includes('UNLICENSED BODY'));
  assert.equal(b.tuple.images.imageBytesHosted, false);
  assert.equal(b.tuple.images.imageBytesOffline, false);
});
test('missing or altered part, mismatched binding, image identity and source-only policy cannot pass', async () => {
  const { tuple } = await prepareWebsiteContentTuple(websiteTupleFixture());
  for (const mutate of [
    (t) => delete t.home,
    (t) => (t.home.directoryCommit = 'f'.repeat(40)),
    (t) => (t.source.selectorSha256 = 'f'.repeat(64)),
    (t) => (t.images.entries[0].originalTitle = 'Other'),
    (t) => (t.images.entries[0].sourceRow = 99),
    (t) => t.summary.directoryOnlyEndpointIds.push(t.directory.sources[0].id),
    (t) => t.summary.counts.included++,
    (t) => (t.report.articles[0].status = 'excluded'),
    (t) => (t.report.articles[0].mediaExclusions.text = 'approved'),
    (t) => (t.report.publisherFullText = 'UNLICENSED BODY'),
    (t) => (t.images.entries[0].rightsMetadata.publisherFullText = 'UNLICENSED BODY'),
  ]) {
    const changed = structuredClone(tuple);
    mutate(changed);
    assert.equal(await validate(changed), false);
  }
});
test('holds restrict App selection and images and an unadmitted image origin is excluded', async () => {
  const first = await prepareWebsiteContentTuple(websiteTupleFixture());
  const held = websiteTupleFixture({
    mutate: (_rows, _registry, revoke) =>
      revoke.endpointIds.push(
        first.tuple.directory.articles.find((a) => a.id === first.tuple.home.lead).endpointIds[0],
      ),
  });
  const next = await prepareWebsiteContentTuple(held);
  assert.ok(!next.tuple.home.visibleIds.includes(first.tuple.home.lead));
  assert.ok(!next.tuple.images.entries.some((e) => e.articleId === first.tuple.home.lead));
  const input = websiteTupleFixture();
  input.allowedImageOrigins = [];
  const excluded = await prepareWebsiteContentTuple(input);
  assert.equal(excluded.tuple.images.entries.length, 0);
  assert.equal(excluded.tuple.images.excluded.length, 30);
});
