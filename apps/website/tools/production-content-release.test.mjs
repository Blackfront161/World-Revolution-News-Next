import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import { canonicalJson, sha256Utf8 } from '../../../packages/content-contracts/src/index.ts';

import {
  buildWebsiteProductionContentRelease,
  loadWebsiteProductionContentReleaseFromDisk,
  productionWebsitePublisherVersion,
} from './production-content-release.mjs';
import { publishProductionArticleLandings } from './generate-production-article-landings.mjs';
import { buildProductionContentRelease } from '../../../tools/build-production-content-release.mjs';

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(toolsDirectory, '../../..');
const sourceRoot = path.join(
  workspaceRoot,
  'docs/evidence/WRN-PRODUCTION-ARTICLE-PILOT-2026-09-10/generated-core-e8506a4',
);
const timestamp = '2026-09-10T06:51:40.000Z';
const v3Candidate = path.join(
  workspaceRoot,
  'docs/evidence/WRN-NEWS-SIX-ARTICLE-INPUT-2026-09-11/candidate-1789065672080/production-build-input-v3.json',
);

test('unknown descriptors fail before any manifest or article payload is read', async () => {
  await withRoot(async (root) => {
    const source = JSON.parse(await readFile(v3Candidate, 'utf8'));
    const descriptor = {
      contractVersion: '4.0.0',
      schema: 'wrn.production-content-release-descriptor.v4',
      releaseRevision: source.releaseRevision,
      sequence: source.sequence,
    };
    const directory = path.join(root, source.releaseRevision);
    await mkdir(directory);
    const bytes = canonicalJson(descriptor);
    await writeFile(path.join(directory, 'release-descriptor.json'), bytes);
    await writeFile(
      path.join(root, 'current.json'),
      canonicalJson({
        schema: 'wrn.production-content-current.v1',
        releaseRevision: source.releaseRevision,
        sequence: source.sequence,
        descriptorPath: `${source.releaseRevision}/release-descriptor.json`,
        descriptorSha256: await sha256Utf8(bytes),
      }),
    );
    // No remaining file exists: a payload read would instead report a missing manifest.
    await assert.rejects(
      loadWebsiteProductionContentReleaseFromDisk({ root }),
      /Descriptor-Version wird nicht unterstuetzt/,
    );
  });
});

test('V3 loader admits the exact reader byte cap and rejects one more byte before parsing', async () => {
  await withRoot(async (root) => {
    const input = JSON.parse(await readFile(v3Candidate, 'utf8'));
    const detail = input.documents.readerDetails.entries[0];
    const cap = 2816 * 1024;
    const byteLength = () =>
      Buffer.byteLength(
        canonicalJson({
          ...input.documents.readerDetails,
          contractVersion: '2.0.0',
          schema: 'wrn.production-reader-details.v2',
          revision: input.releaseRevision,
        }),
      );
    while (cap - byteLength() > 65_600)
      detail.blocks.push({ kind: 'paragraph', text: 'x'.repeat(65_536) });
    detail.blocks.push({ kind: 'paragraph', text: 'x' });
    detail.blocks.at(-1).text += 'x'.repeat(cap - byteLength());
    assert.equal(byteLength(), cap);
    const article = input.documents.articles.articles.find(
      (entry) => entry.id === detail.articleId,
    );
    input.documents.admission.entries.find(
      (entry) => entry.articleId === detail.articleId,
    ).admittedContentSha256 = await sha256Utf8(canonicalJson({ article, detail }));
    const inputPath = path.join(root, 'authored-cap.json');
    await writeFile(inputPath, canonicalJson(input));
    const source = path.join(root, 'cap-source');
    await buildProductionContentRelease({ inputPath, outputPath: source });
    const outputDirectory = path.join(root, 'cap-publication');
    await buildWebsiteProductionContentRelease({
      sourceRoot: source,
      outputDirectory,
      trustedWorkspaceRoot: root,
      generatedAt: '2026-09-11T00:00:00.000Z',
    });
    const loaded = await loadWebsiteProductionContentReleaseFromDisk({ root: outputDirectory });
    assert.equal(loaded.ready.articleIds.length, 6);
    const readerPath = path.join(outputDirectory, input.releaseRevision, 'reader-details.json');
    const bytes = await readFile(readerPath);
    assert.equal(bytes.length, cap);
    await writeFile(readerPath, Buffer.concat([bytes, Buffer.from(' ')]));
    await assert.rejects(
      loadWebsiteProductionContentReleaseFromDisk({ root: outputDirectory }),
      /reader-details.json ueberschreitet das Ressourcenlimit/,
    );
  });
});

test('loader accepts the validated V3 reader above the V1 512KiB cap', async () => {
  await withRoot(async (root) => {
    const source = path.join(root, 'v3-source');
    await buildProductionContentRelease({ inputPath: v3Candidate, outputPath: source });
    const outputDirectory = path.join(root, 'v3-publication');
    await buildWebsiteProductionContentRelease({
      sourceRoot: source,
      outputDirectory,
      trustedWorkspaceRoot: root,
      generatedAt: '2026-09-11T00:00:00.000Z',
    });
    const reader = await readFile(
      path.join(source, 'wrn-production-news-2026-09-11-v3', 'reader-details.json'),
    );
    assert.ok(reader.length > 512 * 1024);
  });
});

test('Stage C refuses an independently changed publication revision before emitting a landing', async () => {
  await withRoot(async (root) => {
    const release = await buildRelease(root, 'wrong-publication-revision');
    const original = await loadWebsiteProductionContentReleaseFromDisk({ root: release });
    const projectionPath = path.join(
      release,
      original.ready.descriptor.releaseRevision,
      'website-publication.json',
    );
    const projection = JSON.parse(await readFile(projectionPath, 'utf8'));
    await writeFile(
      projectionPath,
      JSON.stringify({ ...projection, revision: 'wrn-production-other-v1' }),
    );
    await assert.rejects(
      loadWebsiteProductionContentReleaseFromDisk({ root: release }),
      /Publikationsrevision/,
    );
    const outputDirectory = path.join(root, 'must-remain-absent');
    await assert.rejects(
      publishProductionArticleLandings({ outputDirectory, releaseRoot: release }),
      /Publikationsrevision/,
    );
    await assert.rejects(stat(outputDirectory), { code: 'ENOENT' });
  });
});

async function withRoot(callback) {
  const testResults = path.join(workspaceRoot, 'test-results');
  await mkdir(testResults, { recursive: true });
  return callback(await mkdtemp(path.join(testResults, 'wrn-stage-c-release-')));
}

async function buildRelease(root, name) {
  const outputDirectory = path.join(root, name);
  await buildWebsiteProductionContentRelease({
    outputDirectory,
    sourceRoot,
    trustedWorkspaceRoot: root,
    generatedAt: timestamp,
  });
  return outputDirectory;
}

test('copies the eight admitted bytes verbatim and creates a deterministic independent binding', async () => {
  await withRoot(async (root) => {
    const first = path.join(root, 'first');
    const second = path.join(root, 'second');
    const one = await buildWebsiteProductionContentRelease({
      outputDirectory: first,
      sourceRoot,
      trustedWorkspaceRoot: root,
      generatedAt: timestamp,
    });
    const two = await buildWebsiteProductionContentRelease({
      outputDirectory: second,
      sourceRoot,
      trustedWorkspaceRoot: root,
      generatedAt: timestamp,
    });
    assert.deepEqual(one.publication, two.publication);
    assert.equal(one.publication.generatedAt, timestamp);
    assert.equal(one.publication.generatorVersion, productionWebsitePublisherVersion);
    for (const relative of [
      'current.json',
      ...[
        'admission.json',
        'archive-lifecycle.json',
        'articles.json',
        'discover-index.json',
        'manifest.json',
        'reader-details.json',
        'release-descriptor.json',
      ].map((name) => `wrn-production-eff-2026-09-10-v1/${name}`),
    ]) {
      assert.deepEqual(
        await readFile(path.join(first, relative)),
        await readFile(path.join(sourceRoot, relative)),
      );
    }
    const release = await loadWebsiteProductionContentReleaseFromDisk({ root: first });
    assert.deepEqual(release.ready.articleIds, one.publication.landingIds);
  });
});

test('fails closed for missing or invalid explicit publication timestamps and leaves an existing target intact', async () => {
  await withRoot(async (root) => {
    await assert.rejects(
      buildWebsiteProductionContentRelease({
        outputDirectory: path.join(root, 'missing'),
        sourceRoot,
        trustedWorkspaceRoot: root,
      }),
      /Publikationsvertrag ungueltig/,
    );
    await assert.rejects(
      buildWebsiteProductionContentRelease({
        outputDirectory: path.join(root, 'invalid'),
        sourceRoot,
        trustedWorkspaceRoot: root,
        generatedAt: 'not-a-date',
      }),
      /Publikationsvertrag ungueltig/,
    );
    const existing = path.join(root, 'existing');
    await writeFile(existing, 'caller bytes');
    await assert.rejects(
      buildWebsiteProductionContentRelease({
        outputDirectory: existing,
        sourceRoot,
        trustedWorkspaceRoot: root,
        generatedAt: timestamp,
      }),
      /existiert bereits/,
    );
    assert.equal(await readFile(existing, 'utf8'), 'caller bytes');
  });
});

test('loader rejects a wrong pointer path, descriptor hash, publication ID set, and byte cap', async () => {
  await withRoot(async (root) => {
    const release = path.join(root, 'release');
    await buildWebsiteProductionContentRelease({
      outputDirectory: release,
      sourceRoot,
      trustedWorkspaceRoot: root,
      generatedAt: timestamp,
    });
    const currentPath = path.join(release, 'current.json');
    const current = JSON.parse(await readFile(currentPath, 'utf8'));
    await writeFile(
      currentPath,
      JSON.stringify({ ...current, descriptorPath: '../release-descriptor.json' }),
    );
    await assert.rejects(
      loadWebsiteProductionContentReleaseFromDisk({ root: release }),
      /sicheren Descriptor/,
    );
    const sequenceRelease = await buildRelease(root, 'sequence-release');
    const sequenceCurrentPath = path.join(sequenceRelease, 'current.json');
    const sequenceCurrent = JSON.parse(await readFile(sequenceCurrentPath, 'utf8'));
    await writeFile(sequenceCurrentPath, JSON.stringify({ ...sequenceCurrent, sequence: 2 }));
    await assert.rejects(
      loadWebsiteProductionContentReleaseFromDisk({ root: sequenceRelease }),
      /Descriptor-Revision/,
    );
    const descriptorRelease = await buildRelease(root, 'descriptor-release');
    const descriptor = path.join(
      descriptorRelease,
      'wrn-production-eff-2026-09-10-v1/release-descriptor.json',
    );
    await writeFile(descriptor, '{"bad":true}');
    await assert.rejects(
      loadWebsiteProductionContentReleaseFromDisk({ root: descriptorRelease }),
      /Descriptor-Hash/,
    );
    const publicationRelease = await buildRelease(root, 'publication-release');
    const publicationPath = path.join(
      publicationRelease,
      'wrn-production-eff-2026-09-10-v1/website-publication.json',
    );
    const publication = JSON.parse(await readFile(publicationPath, 'utf8'));
    await writeFile(publicationPath, JSON.stringify({ ...publication, landingIds: [] }));
    await assert.rejects(
      loadWebsiteProductionContentReleaseFromDisk({ root: publicationRelease }),
      /Publikationsbindung/,
    );
    const articlesLimitRelease = await buildRelease(root, 'articles-limit-release');
    await writeFile(
      path.join(articlesLimitRelease, 'wrn-production-eff-2026-09-10-v1/articles.json'),
      Buffer.alloc(513 * 1024, 0x61),
    );
    await assert.rejects(
      loadWebsiteProductionContentReleaseFromDisk({ root: articlesLimitRelease }),
      /Ressourcenlimit/,
    );
    const missingTimestampRelease = await buildRelease(root, 'missing-timestamp-release');
    const missingTimestampPath = path.join(
      missingTimestampRelease,
      'wrn-production-eff-2026-09-10-v1/website-publication.json',
    );
    const missingTimestampPublication = JSON.parse(await readFile(missingTimestampPath, 'utf8'));
    delete missingTimestampPublication.generatedAt;
    await writeFile(missingTimestampPath, JSON.stringify(missingTimestampPublication));
    await assert.rejects(
      loadWebsiteProductionContentReleaseFromDisk({ root: missingTimestampRelease }),
      /Publikationsbindung/,
    );
    const publicationLimitRelease = await buildRelease(root, 'publication-limit-release');
    const publicationLimitPath = path.join(
      publicationLimitRelease,
      'wrn-production-eff-2026-09-10-v1/website-publication.json',
    );
    await writeFile(publicationLimitPath, Buffer.alloc(513 * 1024, 0x61));
    await assert.rejects(
      loadWebsiteProductionContentReleaseFromDisk({ root: publicationLimitRelease }),
      /Ressourcenlimit/,
    );
  });
});
