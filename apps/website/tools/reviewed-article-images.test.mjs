import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateReviewedArticleImages } from './reviewed-article-images.mjs';
const load = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const [r, d, i] = await Promise.all([
  load('../src/features/home/reviewed-article-images-v1.json'),
  load('../src/features/projection/data/content-directory-v1.json'),
  load('../src/features/home/app-article-images-v1.json'),
]);
test('only exact article and immutable-feed references determine production image origins', () => {
  assert.deepEqual(validateReviewedArticleImages(r, d, i), r.origins);
  for (const mutate of [
    (v) => {
      v.dataCommit = '0'.repeat(40);
    },
    (v) => {
      v.feedSha256 = '0'.repeat(64);
    },
    (v) => {
      v.entries[0].originalUrl = 'https://other.example/';
    },
    (v) => {
      v.entries[0].originalTitle = 'Other story';
    },
    (v) => {
      v.entries[0].sourceName = 'Other source';
    },
    (v) => {
      v.entries[0].imageUrl = 'http://unsafe.example/image.jpg';
    },
    (v) => {
      v.entries[0].imageUrl = 'https://user:password@example.com/image.jpg';
    },
    (v) => {
      v.origins.push('https://unbound.example');
    },
    (v) => {
      v.entries.push(v.entries[0]);
    },
    (v) => {
      v.entries[1].sourcePageSha256 = null;
    },
    (v) => {
      v.imageBytesHosted = true;
    },
    (v) => {
      v.imageBytesOffline = true;
    },
  ]) {
    const changed = structuredClone(r);
    mutate(changed);
    assert.throws(() => validateReviewedArticleImages(changed, d, i));
  }
});
