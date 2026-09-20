import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { canonicalJson, sha256Utf8 } from '../packages/content-contracts/src/index.ts';
import { buildProductionContentRelease } from './build-production-content-release.mjs';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidate = path.join(
  workspace,
  'docs',
  'evidence',
  'WRN-NEWS-SIX-ARTICLE-INPUT-2026-09-11',
  'candidate-1789065672080',
  'production-build-input-v3.json',
);

async function files(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(target, `${prefix}${entry.name}/`)));
    else result.push([`${prefix}${entry.name}`, await readFile(target)]);
  }
  return result.sort(([a], [b]) => a.localeCompare(b));
}

async function inputWithCount(count) {
  const value = JSON.parse(await readFile(candidate, 'utf8'));
  const { documents } = value;
  const article = documents.articles.articles[0];
  const detail = documents.readerDetails.entries.find((entry) => entry.articleId === article.id);
  const admission = documents.admission.entries.find((entry) => entry.articleId === article.id);
  const discover = documents.discoverIndex.entries.find((entry) => entry.articleId === article.id);
  while (documents.articles.articles.length < count) {
    const number = documents.articles.articles.length;
    const id = `wrn-art-${number.toString(16).padStart(32, '0')}`;
    const copyArticle = { ...structuredClone(article), id, title: `${article.title} (${number})` };
    const copyDetail = {
      ...structuredClone(detail),
      articleId: id,
      blocks: detail.blocks.filter((block) => block.kind !== 'image'),
    };
    const copyAdmission = { ...structuredClone(admission), articleId: id };
    copyAdmission.admittedContentSha256 = await sha256Utf8(
      canonicalJson({ article: copyArticle, detail: copyDetail }),
    );
    documents.articles.articles.push(copyArticle);
    documents.readerDetails.entries.push(copyDetail);
    documents.admission.entries.push(copyAdmission);
    documents.discoverIndex.entries.push({ ...structuredClone(discover), articleId: id });
    for (const name of ['activeArticleIds', 'archiveArticleIds', 'shareableArticleIds'])
      documents.archiveLifecycle[name].push(id);
  }
  value.releaseRevision = `publisher-v3-${count}`;
  return value;
}

test('V3 publisher rejects changed text and forged admission receipts without silently re-signing', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wrn-production-v3-receipts-'));
  for (const mode of ['paragraph', 'receipt']) {
    const input = JSON.parse(await readFile(candidate, 'utf8'));
    if (mode === 'paragraph')
      input.documents.readerDetails.entries[0].blocks[0].text += ' Unapproved replacement.';
    else input.documents.admission.entries[0].admittedContentSha256 = 'a'.repeat(64);
    const file = path.join(root, `${mode}.json`);
    await writeFile(file, JSON.stringify(input));
    await assert.rejects(
      buildProductionContentRelease({ inputPath: file, outputPath: path.join(root, mode) }),
      /invalid admission package/,
    );
  }
});

test('V3 publisher is deterministic for the admitted six-article input and rejects 65 articles', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wrn-production-v3-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const six = path.join(root, 'six.json');
  await cp(candidate, six);
  await buildProductionContentRelease({ inputPath: six, outputPath: path.join(root, 'one') });
  await buildProductionContentRelease({ inputPath: six, outputPath: path.join(root, 'two') });
  assert.deepEqual(await files(path.join(root, 'one')), await files(path.join(root, 'two')));
  const over = path.join(root, 'sixty-five.json');
  await writeFile(over, JSON.stringify(await inputWithCount(65)));
  await assert.rejects(
    buildProductionContentRelease({ inputPath: over, outputPath: path.join(root, 'sixty-five') }),
    /invalid admission package/,
  );
});

test('V3 publisher exercises the authored 8 and 64 article acceptance boundaries', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wrn-production-v3-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const count of [8, 64]) {
    const input = path.join(root, `${count}.json`);
    await writeFile(input, JSON.stringify(await inputWithCount(count)));
    await buildProductionContentRelease({
      inputPath: input,
      outputPath: path.join(root, String(count)),
    });
    await buildProductionContentRelease({
      inputPath: input,
      outputPath: path.join(root, `${count}-again`),
    });
    assert.deepEqual(
      await files(path.join(root, String(count))),
      await files(path.join(root, `${count}-again`)),
    );
    const release = path.join(root, String(count), `publisher-v3-${count}`);
    const descriptor = JSON.parse(
      await readFile(path.join(release, 'release-descriptor.json'), 'utf8'),
    );
    const manifest = JSON.parse(await readFile(path.join(release, 'manifest.json'), 'utf8'));
    assert.equal(descriptor.contractVersion, '3.0.0');
    assert.equal(manifest.schema, 'wrn.production-content-release.v3');
  }
});
