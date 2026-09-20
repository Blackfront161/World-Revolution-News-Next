import { createHash } from 'node:crypto';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import {
  validateMobileKnowledge,
  mobileKnowledgeRuntimeMaxBytes,
} from '../packages/content-contracts/src/mobile-knowledge-v1.ts';

const sourceCommit = '2216ff3c1305f6d474712892a36dc9b0ea7cb0a0';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const bytes = (value) => Buffer.byteLength(value, 'utf8');
const pinnedHashes = [
  '13f47c6b94bdfedc3bd31fa1d84ba52e540a8d12e36b76c7d62d2eed0186d696',
  '01de7d72725471e7144c9a9105d63dee1c0a54c6cfae01b049ced7c5885ec2cc',
  '89bfff5767220b9d77e3a208303afba3bcbdd1d20a09657319c0961f94d1c07c',
];
function literal(node, depth = 0) {
  if (depth > 32) throw new Error('literal nesting limit');
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node))
    return node.elements.map((element) => {
      if (ts.isSpreadElement(element)) throw new Error('spread literals are not admitted');
      return literal(element, depth + 1);
    });
  if (ts.isObjectLiteralExpression(node)) {
    const output = {};
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) || property.name === undefined)
        throw new Error('non-literal object property');
      const name =
        ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
          ? property.name.text
          : undefined;
      if (
        name === undefined ||
        ['__proto__', 'prototype', 'constructor'].includes(name) ||
        Object.hasOwn(output, name)
      )
        throw new Error('unsafe object key');
      output[name] = literal(property.initializer, depth + 1);
    }
    return output;
  }
  throw new Error(`non-literal AST node ${ts.SyntaxKind[node.kind]}`);
}
export function readLiteralDeclaration(source, declarationName) {
  if (typeof source !== 'string' || bytes(source) > mobileKnowledgeRuntimeMaxBytes)
    throw new Error('input size');
  const tree = ts.createSourceFile(
    'legacy.js',
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
  if (tree.parseDiagnostics.length) throw new Error('invalid source syntax');
  let found;
  const visit = (node) => {
    if (found !== undefined) return;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === declarationName &&
      node.initializer
    )
      found = literal(node.initializer);
    ts.forEachChild(node, visit);
  };
  visit(tree);
  if (found !== undefined) return found;
  throw new Error(`missing literal declaration ${declarationName}`);
}
function safeDownloads(downloads) {
  if (typeof downloads !== 'object' || downloads === null || Array.isArray(downloads))
    throw new Error('invalid downloads');
  if (
    Object.entries(downloads).some(
      ([key, value]) => !['html', 'pdf', 'epub'].includes(key) || typeof value !== 'string',
    )
  )
    throw new Error('invalid download format');
  return Object.fromEntries(
    Object.entries(downloads)
      .filter(
        ([key, value]) =>
          ['html', 'pdf', 'epub'].includes(key) && typeof value === 'string' && value.length > 0,
      )
      .map(([key, value]) => [key, canonicalUrl(value)]),
  );
}
function canonicalUrl(value) {
  return new URL(value).href;
}
export function createKnowledgeDocument({
  libraryFeed,
  librarySources,
  lexiconSource,
  observedAt = '2026-09-09T00:00:00.000Z',
}) {
  for (const input of [libraryFeed, librarySources, lexiconSource]) {
    if (typeof input !== 'string' || bytes(input) > mobileKnowledgeRuntimeMaxBytes)
      throw new Error('input size');
  }
  const books = JSON.parse(libraryFeed).map((item) => {
    const readUrl = item.readUrl ? canonicalUrl(item.readUrl) : '';
    const downloads = safeDownloads(item.downloads ?? {});
    return {
      id: item.id,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      title: item.title,
      authors: item.authors,
      languages: item.languages,
      topics: item.topics,
      formats: [...new Set([...Object.keys(downloads), ...(readUrl ? ['html'] : [])])].sort(),
      readUrl,
      downloads,
      updatedAt: item.updatedAt,
      rights: 'metadata-and-links',
    };
  });
  const sources = JSON.parse(librarySources).map((item) => ({
    id: item.id,
    name: item.name,
    languages: item.languages,
    formats: item.formats,
    description: item.description,
    politicalScope: item.politicalScope,
    status: item.status,
    verifiedAt: item.verifiedAt,
    homepage: canonicalUrl(item.homepage),
    catalogUrl: canonicalUrl(item.catalogUrl),
    rights: 'metadata-and-links',
    descriptionRights: 'user-supplied-editorial-text',
  }));
  const lexiconSources = readLiteralDeclaration(lexiconSource, 'SOURCES').map((item) => ({
    id: item.id,
    name: item.name,
    language: item.language,
    description: item.description,
    url: canonicalUrl(item.url),
    downloads: item.downloads.map((download) => ({
      label: download.label,
      url: canonicalUrl(download.url),
    })),
    rights: 'user-supplied-editorial-text',
    linkRights: 'metadata-and-links',
  }));
  const terms = readLiteralDeclaration(lexiconSource, 'TERMS').map((item) => ({
    id: item.id,
    category: item.category,
    sources: item.sources,
    title: item.title,
    aliases: item.aliases,
    summary: item.summary,
    practice: item.practice,
    debate: item.debate,
    related: item.related,
    rights: 'user-supplied-editorial-text',
  }));
  const document = {
    schema: 'wrn.mobile-knowledge.v1',
    contractVersion: '1.0.0',
    sourceCommit,
    observedAt,
    origin: 'legacy-app-snapshot',
    input: {
      libraryFeedSha256: sha256(libraryFeed),
      libraryFeedBytes: bytes(libraryFeed),
      librarySourcesSha256: sha256(librarySources),
      librarySourcesBytes: bytes(librarySources),
      lexiconSha256: sha256(lexiconSource),
      lexiconBytes: bytes(lexiconSource),
    },
    library: { books, sources },
    lexicon: { terms, sources: lexiconSources },
    withdrawnSourceIds: { library: [], lexicon: [] },
    withdrawnIds: { books: [], terms: [] },
  };
  const validation = validateMobileKnowledge(document);
  if (!validation.ok) throw new Error(`invalid knowledge: ${validation.errors.join(',')}`);
  if (bytes(`${JSON.stringify(document, null, 2)}\n`) > mobileKnowledgeRuntimeMaxBytes)
    throw new Error('output size');
  return document;
}
export async function importLegacyKnowledge({
  libraryFeedPath,
  librarySourcesPath,
  lexiconPath,
  outputPath,
}) {
  const paths = [libraryFeedPath, librarySourcesPath, lexiconPath];
  const sizes = await Promise.all(paths.map(async (path) => (await stat(path)).size));
  if (sizes.some((size) => size > mobileKnowledgeRuntimeMaxBytes)) throw new Error('input size');
  const [libraryFeed, librarySources, lexiconSource] = await Promise.all([
    readFile(libraryFeedPath, 'utf8'),
    readFile(librarySourcesPath, 'utf8'),
    readFile(lexiconPath, 'utf8'),
  ]);
  if (
    [libraryFeed, librarySources, lexiconSource].some(
      (input, index) => sha256(input) !== pinnedHashes[index],
    )
  )
    throw new Error('source pin mismatch');
  const document = createKnowledgeDocument({ libraryFeed, librarySources, lexiconSource });
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return document;
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [libraryFeedPath, librarySourcesPath, lexiconPath, outputPath] = process.argv.slice(2);
  if (![libraryFeedPath, librarySourcesPath, lexiconPath, outputPath].every(Boolean))
    throw new Error('usage: import-legacy-knowledge feed sources lexicon output');
  await importLegacyKnowledge({ libraryFeedPath, librarySourcesPath, lexiconPath, outputPath });
}
