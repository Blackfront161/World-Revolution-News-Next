import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { createKnowledgeDocument } from '../import-legacy-knowledge.mjs';
import { prepareWebsiteGlossary } from './prepare-website-glossary.mjs';
import {
  mobileKnowledgeRuntimeMaxBytes,
  validateMobileKnowledge,
} from '../../packages/content-contracts/src/mobile-knowledge-v1.ts';

/** Read committed app bytes only. Keep the website's historical contract untouched. */
export async function prepareWebsiteKnowledge({
  appDirectory,
  commit,
  historyFile,
  outputFile,
  learningPathsFile,
  lexiconLocalesFile,
  observedAt,
}) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw Error('knowledge-commit');
  const read = (name) =>
    execFileSync('git', ['-c', `safe.directory=${appDirectory}`, '-C', appDirectory, 'show', `${commit}:${name}`], {
      maxBuffer: mobileKnowledgeRuntimeMaxBytes,
    }).toString('utf8');
  const source = read('lexicon-tab.js');
  const glossary = prepareWebsiteGlossary(source, commit, observedAt);
  const currentKnowledge = createKnowledgeDocument({
    libraryFeed: read('library-feed.json'),
    librarySources: read('library-sources.json'),
    lexiconSource: `const TERMS = ${JSON.stringify(glossary.lexicon.terms)}; const SOURCES = ${JSON.stringify(glossary.lexicon.sources)};`,
    observedAt,
  });
  currentKnowledge.sourceCommit = commit;
  currentKnowledge.input.lexiconSha256 = glossary.input.lexiconSha256;
  currentKnowledge.input.lexiconBytes = glossary.input.lexiconBytes;
  const historyBytes = await readFile(historyFile);
  const history = JSON.parse(historyBytes);
  if (!validateMobileKnowledge(history).ok) throw Error('knowledge-history-contract');
  const previous = JSON.parse(await readFile(outputFile));
  if (JSON.stringify(previous.history) !== JSON.stringify(history))
    throw Error('knowledge-history-drift');
  // Carry historical and previous-current withdrawals into the new snapshot.
  const previousCurrent = previous.currentKnowledge ?? previous.currentGlossary;
  if (previousCurrent?.library?.books) {
    const byId = new Map(currentKnowledge.library.books.map((book) => [book.id, book]));
    if (
      byId.size !== currentKnowledge.library.books.length ||
      previousCurrent.library.books.some((book) => !isDeepStrictEqual(book, byId.get(book.id)))
    )
      throw Error('knowledge-existing-book-change');
    const previousIds = new Set(previousCurrent.library.books.map((book) => book.id));
    const rawBooks = JSON.parse(read('library-feed.json'));
    for (const book of rawBooks.filter((book) => !previousIds.has(book.id))) {
      if (
        book.contentPolicy !== 'metadata_and_links_only' ||
        Object.keys(book.downloads ?? {}).length ||
        ['body', 'fullText', 'image', 'imageUrl'].some((key) => book[key])
      )
        throw Error('knowledge-new-book-policy');
    }
  }
  for (const [field, kinds] of Object.entries({
    withdrawnIds: ['books', 'terms'],
    withdrawnSourceIds: ['library', 'lexicon'],
  })) {
    for (const kind of kinds)
      currentKnowledge[field][kind] = [
        ...new Set([...history[field][kind], ...(previousCurrent?.[field]?.[kind] ?? [])]),
      ];
  }
  if (!validateMobileKnowledge(currentKnowledge).ok) throw Error('knowledge-current-contract');
  const pathsBytes = read('learning-paths.json');
  const paths = JSON.parse(pathsBytes);
  if (
    paths.schema !== 'wrn.learning-paths.v1' ||
    paths.rights !== 'metadata-and-original-links-only'
  )
    throw Error('learning-paths-contract');
  const packed =
    JSON.stringify({ schema: 'wrn.website-knowledge-package.v2', history, currentKnowledge }) +
    '\n';
  if (Buffer.byteLength(packed) > mobileKnowledgeRuntimeMaxBytes)
    throw Error('knowledge-package-cap');
  await writeFile(outputFile, packed);
  await writeFile(learningPathsFile, pathsBytes);
  const localeBytes = lexiconLocalesFile ? read('lexicon-locales.json') : null;
  if (localeBytes) {
    const locales = JSON.parse(localeBytes);
    if (
      locales.schema !== 'wrn.lexicon-locales.v1' ||
      locales.rights !== 'WRN-original-editorial-text'
    )
      throw Error('lexicon-locales-contract');
    await writeFile(lexiconLocalesFile, localeBytes);
  }
  const hash = (value) => createHash('sha256').update(value).digest('hex');
  return {
    commit,
    observedAt,
    books: currentKnowledge.library.books.length,
    terms: currentKnowledge.lexicon.terms.length,
    references: currentKnowledge.lexicon.sources.length,
    historySha256: hash(historyBytes),
    packedSha256: hash(packed),
    learningPathsSha256: hash(pathsBytes),
    lexiconLocalesSha256: localeBytes ? hash(localeBytes) : null,
    inputs: currentKnowledge.input,
  };
}
