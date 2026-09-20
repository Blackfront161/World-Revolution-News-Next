import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProductionContentRelease } from './build-production-content-release.mjs';
import { buildWebsiteProductionContentRelease } from '../apps/website/tools/production-content-release.mjs';
import { publishProductionArticleLandings } from '../apps/website/tools/generate-production-article-landings.mjs';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidate = path.join(
  workspace,
  'docs/evidence/WRN-PRODUCTION-IMAGES-ADMISSION-2026-09-10/production-build-input-v2.json',
);
async function scratch() {
  await mkdir(path.join(workspace, 'test-results'), { recursive: true });
  return mkdtemp(path.join(workspace, 'test-results/wrn-production-images-v2-'));
}
async function hashes(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await hashes(target, `${prefix}${entry.name}/`)));
    else
      result.push([
        `${prefix}${entry.name}`,
        createHash('sha256')
          .update(await readFile(target))
          .digest('hex'),
      ]);
  }
  return result.sort(([a], [b]) => a.localeCompare(b));
}
test('V2 producer is deterministic and static article keeps the original image before prose without hotlinks', async () => {
  const root = await scratch();
  for (const name of ['one', 'two'])
    await buildProductionContentRelease({
      inputPath: candidate,
      outputPath: path.join(root, name),
    });
  assert.deepEqual(await hashes(path.join(root, 'one')), await hashes(path.join(root, 'two')));
  const releaseRoot = path.join(root, 'website');
  await buildWebsiteProductionContentRelease({
    sourceRoot: path.join(root, 'one'),
    outputDirectory: releaseRoot,
    trustedWorkspaceRoot: root,
    generatedAt: '2026-09-10T13:39:00.000Z',
  });
  const outputDirectory = path.join(root, 'landings');
  const publication = await publishProductionArticleLandings({ releaseRoot, outputDirectory });
  const imageArticle = publication.landingPages.find((entry) =>
    entry.path.includes('wrn-art-a772ab86c915a036c6177f1bfe958d4d'),
  );
  const page = await readFile(path.join(outputDirectory, imageArticle.path), 'utf8');
  assert.match(page, /<img src="data:image\/png;base64,/);
  assert.match(page, /width="1200" height="600"/);
  assert.match(page, /Flock cameras and surveillance cameras among barbed wire/);
  assert.ok(
    page.indexOf('<figure class="article-image">') <
      page.indexOf('Law enforcement agencies across'),
  );
  assert.doesNotMatch(page, /<img[^>]+src="https?:/);
  assert.equal((page.match(/<img /g) ?? []).length, 1);
});
test('producer rejects re-labelled V1 image payloads and corrupt image admission before output', async () => {
  const root = await scratch();
  const original = JSON.parse(await readFile(candidate, 'utf8'));
  for (const corruption of ['old-schema', 'bad-image']) {
    const input = structuredClone(original);
    if (corruption === 'old-schema') input.schema = 'wrn.production-content-build-input.v1';
    else
      input.documents.readerDetails.entries.find(
        (entry) => entry.blocks[0].kind === 'image',
      ).blocks[0].sha256 = 'f'.repeat(64);
    const inputPath = path.join(root, `${corruption}.json`);
    await writeFile(inputPath, JSON.stringify(input), { flag: 'wx' });
    await assert.rejects(
      buildProductionContentRelease({ inputPath, outputPath: path.join(root, corruption) }),
      /invalid admission package/,
    );
    assert.ok(!(await readdir(root)).includes(corruption));
  }
});
