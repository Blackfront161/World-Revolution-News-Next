import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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
  observedAt,
}) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw Error('knowledge-commit');
  const read = (name) =>
    execFileSync('git', ['-C', appDirectory, 'show', `${commit}:${name}`], {
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
    inputs: currentKnowledge.input,
  };
}
