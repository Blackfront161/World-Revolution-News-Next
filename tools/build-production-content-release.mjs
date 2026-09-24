import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { atomicRename } from './atomic-rename.mjs';

import {
  productionContractVersionV1,
  productionContentDescriptorSchemaV1,
  productionContentReleaseSchemaV1,
  validateProductionContentReleaseV1,
} from '../packages/content-contracts/src/production-content-release-v1.ts';
import {
  createValidatedProductionContentReleaseV2,
  productionContentDescriptorSchemaV2,
  productionContentReleaseSchemaV2,
} from '../packages/content-contracts/src/production-content-release-v2.ts';
import {
  createValidatedProductionContentReleaseV3,
  productionContentContractVersionV3,
  productionContentDescriptorSchemaV3,
  productionContentReleaseSchemaV3,
} from '../packages/content-contracts/src/production-content-release-v3.ts';
import {
  canonicalJson,
  sha256Utf8,
  utf8ByteLength,
} from '../packages/content-contracts/src/index.ts';

const maxInputBytes = 4 * 1024 * 1024;
const componentNames = Object.freeze([
  'admission',
  'discoverIndex',
  'readerDetails',
  'archiveLifecycle',
]);

function fail(message) {
  throw new Error(`Production content build failed: ${message}`);
}
async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}
async function writeCanonical(directory, filename, value) {
  const text = canonicalJson(value);
  await writeFile(path.join(directory, filename), text, { encoding: 'utf8', flag: 'wx' });
  return { sha256: await sha256Utf8(text), bytes: utf8ByteLength(text) };
}
function isBuildInput(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === 'documents,releaseRevision,schema,sequence' &&
    [
      'wrn.production-content-build-input.v1',
      'wrn.production-content-build-input.v2',
      'wrn.production-content-build-input.v3',
    ].includes(value.schema) &&
    typeof value.releaseRevision === 'string' &&
    /^[a-z0-9][a-z0-9._-]{0,127}$/.test(value.releaseRevision) &&
    Number.isSafeInteger(value.sequence) &&
    value.sequence > 0 &&
    value.documents &&
    typeof value.documents === 'object' &&
    !Array.isArray(value.documents) &&
    Object.keys(value.documents).sort().join(',') ===
      'admission,archiveLifecycle,articles,discoverIndex,readerDetails' &&
    value.documents.articles &&
    typeof value.documents.articles === 'object' &&
    !Array.isArray(value.documents.articles) &&
    Object.keys(value.documents.articles).join(',') === 'articles' &&
    ['admission', 'discoverIndex', 'readerDetails'].every(
      (name) =>
        value.documents[name] &&
        typeof value.documents[name] === 'object' &&
        !Array.isArray(value.documents[name]) &&
        Object.keys(value.documents[name]).join(',') === 'entries',
    ) &&
    value.documents.archiveLifecycle &&
    typeof value.documents.archiveLifecycle === 'object' &&
    !Array.isArray(value.documents.archiveLifecycle) &&
    Object.keys(value.documents.archiveLifecycle).sort().join(',') ===
      'activeArticleIds,aliases,archiveArticleIds,gone,revocations,shareableArticleIds'
  );
}
function withRevision(releaseRevision, documents, mediaV2 = false) {
  const requireComponent = (name) => {
    const source = documents[name];
    if (!source || typeof source !== 'object' || Array.isArray(source)) fail(`missing ${name}`);
    return { ...source, contractVersion: productionContractVersionV1, revision: releaseRevision };
  };
  const articles = documents.articles;
  if (
    !articles ||
    typeof articles !== 'object' ||
    Array.isArray(articles) ||
    !Array.isArray(articles.articles)
  )
    fail('missing articles');
  const sortByArticleId = (entries) =>
    Array.isArray(entries)
      ? [...entries].sort((left, right) =>
          String(left?.articleId).localeCompare(String(right?.articleId)),
        )
      : entries;
  const sortIds = (ids) => (Array.isArray(ids) ? [...ids].sort() : ids);
  const lifecycleSource = requireComponent('archiveLifecycle');
  return {
    articles: {
      revision: releaseRevision,
      articles: [...articles.articles].sort((left, right) =>
        String(left?.id).localeCompare(String(right?.id)),
      ),
    },
    admission: {
      ...requireComponent('admission'),
      schema: 'wrn.production-article-admission.v1',
      entries: sortByArticleId(requireComponent('admission').entries),
    },
    discoverIndex: {
      ...requireComponent('discoverIndex'),
      schema: 'wrn.production-discover-index.v1',
      entries: sortByArticleId(requireComponent('discoverIndex').entries),
    },
    readerDetails: {
      ...requireComponent('readerDetails'),
      schema: mediaV2 ? 'wrn.production-reader-details.v2' : 'wrn.production-reader-details.v1',
      contractVersion: mediaV2 ? '2.0.0' : productionContractVersionV1,
      entries: sortByArticleId(requireComponent('readerDetails').entries),
    },
    archiveLifecycle: {
      ...lifecycleSource,
      schema: 'wrn.production-archive-lifecycle.v1',
      activeArticleIds: sortIds(lifecycleSource.activeArticleIds),
      archiveArticleIds: sortIds(lifecycleSource.archiveArticleIds),
      shareableArticleIds: sortIds(lifecycleSource.shareableArticleIds),
      aliases: Array.isArray(lifecycleSource.aliases)
        ? [...lifecycleSource.aliases].sort((left, right) =>
            String(left?.sourceId).localeCompare(String(right?.sourceId)),
          )
        : lifecycleSource.aliases,
      gone: Array.isArray(lifecycleSource.gone)
        ? [...lifecycleSource.gone].sort((left, right) =>
            String(left?.id).localeCompare(String(right?.id)),
          )
        : lifecycleSource.gone,
      revocations:
        lifecycleSource.revocations && typeof lifecycleSource.revocations === 'object'
          ? {
              ...lifecycleSource.revocations,
              entries: Array.isArray(lifecycleSource.revocations.entries)
                ? [...lifecycleSource.revocations.entries].sort((left, right) =>
                    String(left?.id).localeCompare(String(right?.id)),
                  )
                : lifecycleSource.revocations.entries,
            }
          : lifecycleSource.revocations,
    },
  };
}
function resourceCount(name, documents) {
  if (name === 'articles') return documents.articles.articles.length;
  if (name === 'archiveLifecycle')
    return documents.archiveLifecycle.archiveArticleIds?.length ?? -1;
  return documents[name].entries?.length ?? -1;
}

/**
 * Pure-local producer. `inputPath` holds canonical, versioned admission data;
 * `outputPath` must not exist. It never contacts a source and never overwrites.
 */
export async function buildProductionContentRelease({ inputPath, outputPath }) {
  const resolvedInput = path.resolve(inputPath);
  const resolvedOutput = path.resolve(outputPath);
  if (resolvedInput === resolvedOutput || (await exists(resolvedOutput)))
    fail('output target already exists');
  const inputStat = await stat(resolvedInput);
  if (!inputStat.isFile() || inputStat.size > maxInputBytes)
    fail('input is missing or exceeds the local size limit');
  let input;
  try {
    input = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(await readFile(resolvedInput)),
    );
  } catch {
    fail('input is not strict UTF-8 JSON');
  }
  if (!isBuildInput(input))
    fail('input does not match a supported production content build schema');
  const mediaV2 = input.schema !== 'wrn.production-content-build-input.v1';
  const v3 = input.schema === 'wrn.production-content-build-input.v3';
  const documents = withRevision(input.releaseRevision, input.documents, mediaV2);
  const source = {
    articles: documents.articles,
    admission: documents.admission,
    discoverIndex: documents.discoverIndex,
    readerDetails: documents.readerDetails,
    archiveLifecycle: documents.archiveLifecycle,
  };
  const resourceNames = [
    'admission',
    'archiveLifecycle',
    'articles',
    'discoverIndex',
    'readerDetails',
  ];
  const resources = [];
  for (const name of resourceNames) {
    const serialized = canonicalJson(source[name]);
    resources.push({
      id: name,
      path: `${name === 'archiveLifecycle' ? 'archive-lifecycle' : name === 'discoverIndex' ? 'discover-index' : name === 'readerDetails' ? 'reader-details' : name}.json`,
      sha256: await sha256Utf8(serialized),
      bytes: utf8ByteLength(serialized),
      recordCount: resourceCount(name, documents),
    });
  }
  const manifest = {
    contractVersion: v3
      ? productionContentContractVersionV3
      : mediaV2
        ? '2.0.0'
        : productionContractVersionV1,
    schema: v3
      ? productionContentReleaseSchemaV3
      : mediaV2
        ? productionContentReleaseSchemaV2
        : productionContentReleaseSchemaV1,
    revision: input.releaseRevision,
    resources,
    articleIds: [...documents.articles.articles.map((article) => article.id)].sort(),
  };
  const expectedComponents = {};
  for (const name of componentNames)
    expectedComponents[name] = {
      revision: input.releaseRevision,
      sha256: await sha256Utf8(canonicalJson(documents[name])),
    };
  const descriptor = {
    contractVersion: v3
      ? productionContentContractVersionV3
      : mediaV2
        ? '2.0.0'
        : productionContractVersionV1,
    schema: v3
      ? productionContentDescriptorSchemaV3
      : mediaV2
        ? productionContentDescriptorSchemaV2
        : productionContentDescriptorSchemaV1,
    releaseRevision: input.releaseRevision,
    sequence: input.sequence,
    expectedManifest: {
      revision: input.releaseRevision,
      sha256: await sha256Utf8(canonicalJson(manifest)),
    },
    expectedComponents,
  };
  const validation = v3
    ? {
        ok:
          (await createValidatedProductionContentReleaseV3({ descriptor, manifest, documents })) !==
          null,
        errors: ['v3-admission'],
      }
    : mediaV2
      ? {
          ok:
            (await createValidatedProductionContentReleaseV2({
              descriptor,
              manifest,
              documents,
            })) !== null,
          errors: ['v2-admission'],
        }
      : await validateProductionContentReleaseV1({ descriptor, manifest, documents });
  if (!validation.ok) fail(`invalid admission package (${validation.errors.join(', ')})`);
  const parent = path.dirname(resolvedOutput);
  await mkdir(parent, { recursive: true });
  const staging = path.join(parent, `.wrn-b-${randomBytes(4).toString('hex')}`);
  await mkdir(staging, { recursive: false });
  const revisionDirectory = path.join(staging, input.releaseRevision);
  await mkdir(revisionDirectory, { recursive: false });
  const filenames = {
    admission: 'admission.json',
    archiveLifecycle: 'archive-lifecycle.json',
    articles: 'articles.json',
    discoverIndex: 'discover-index.json',
    readerDetails: 'reader-details.json',
  };
  for (const name of resourceNames)
    await writeCanonical(revisionDirectory, filenames[name], source[name]);
  await writeCanonical(revisionDirectory, 'manifest.json', manifest);
  const descriptorFile = await writeCanonical(
    revisionDirectory,
    'release-descriptor.json',
    descriptor,
  );
  await writeCanonical(staging, 'current.json', {
    schema: 'wrn.production-content-current.v1',
    releaseRevision: input.releaseRevision,
    sequence: input.sequence,
    descriptorPath: `${input.releaseRevision}/release-descriptor.json`,
    descriptorSha256: descriptorFile.sha256,
  });
  await atomicRename(staging, resolvedOutput);
  return Object.freeze({
    outputPath: resolvedOutput,
    releaseRevision: input.releaseRevision,
    sequence: input.sequence,
    descriptorSha256: descriptorFile.sha256,
  });
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  if (process.argv.length !== 4)
    fail('usage: build-production-content-release.mjs <input.json> <new-output-directory>');
  const result = await buildProductionContentRelease({
    inputPath: process.argv[2],
    outputPath: process.argv[3],
  });
  process.stdout.write(
    `Production content release built: ${result.releaseRevision} (${result.descriptorSha256})\n`,
  );
}
