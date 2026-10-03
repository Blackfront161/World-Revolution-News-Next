import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import {
  validateMobileKnowledge,
  mobileKnowledgeRuntimeMaxBytes,
} from '../../packages/content-contracts/src/mobile-knowledge-v1.ts';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

/** Additive metadata refresh; the App glossary, history and withdrawal records remain intact. */
export async function prepareWebsiteLibraryRefresh({
  packageFile,
  libraryFeedFile,
  outputFile,
  dataCommit,
  observedAt,
}) {
  if (
    !/^[a-f0-9]{40}$/.test(dataCommit) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(observedAt) ||
    !Number.isFinite(Date.parse(observedAt))
  )
    throw Error('library-refresh-binding');
  const [packageBytes, feedBytes] = await Promise.all([
    readFile(packageFile),
    readFile(libraryFeedFile),
  ]);
  if (
    packageBytes.length > mobileKnowledgeRuntimeMaxBytes ||
    feedBytes.length > mobileKnowledgeRuntimeMaxBytes
  )
    throw Error('library-refresh-cap');
  const previous = JSON.parse(packageBytes),
    feed = JSON.parse(feedBytes);
  if (
    Object.keys(previous).length !== 3 ||
    previous.schema !== 'wrn.website-knowledge-package.v2' ||
    !validateMobileKnowledge(previous.currentKnowledge).ok ||
    !validateMobileKnowledge(previous.history).ok ||
    !Array.isArray(feed)
  )
    throw Error('library-refresh-input');
  const next = structuredClone(previous);
  const knownSources = new Set(next.currentKnowledge.library.sources.map((source) => source.id));
  const books = feed.map((item) => {
    if (!knownSources.has(item.sourceId)) throw Error('library-refresh-unknown-source');
    const downloads = item.downloads ?? {};
    if (Object.keys(downloads).some((format) => !['html', 'pdf', 'epub'].includes(format)))
      throw Error('library-refresh-format');
    return {
      id: item.id,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      title: item.title,
      authors: item.authors,
      languages: item.languages,
      topics: item.topics,
      formats: [...new Set([...Object.keys(downloads), ...(item.readUrl ? ['html'] : [])])].sort(),
      readUrl: item.readUrl ? new URL(item.readUrl).href : '',
      downloads: Object.fromEntries(
        Object.entries(downloads).map(([format, url]) => [format, new URL(url).href]),
      ),
      updatedAt: item.updatedAt,
      rights: 'metadata-and-links',
    };
  });
  const byId = new Map(books.map((book) => [book.id, book]));
  if (
    byId.size !== books.length ||
    previous.currentKnowledge.library.books.some(
      (book) => !isDeepStrictEqual(book, byId.get(book.id)),
    )
  )
    throw Error('library-refresh-existing-record-change');
  next.currentKnowledge.library.books = books;
  next.currentKnowledge.observedAt = observedAt;
  next.currentKnowledge.input.libraryFeedSha256 = sha256(feedBytes);
  next.currentKnowledge.input.libraryFeedBytes = feedBytes.length;
  if (!validateMobileKnowledge(next.currentKnowledge).ok) throw Error('library-refresh-contract');
  const packed = Buffer.from(JSON.stringify(next) + '\n');
  if (packed.length > mobileKnowledgeRuntimeMaxBytes) throw Error('library-refresh-cap');
  const oldIds = new Set(previous.currentKnowledge.library.books.map((book) => book.id));
  for (const book of books.filter((entry) => !oldIds.has(entry.id))) {
    const source = previous.currentKnowledge.library.sources.find(
      (entry) => entry.id === book.sourceId,
    );
    if (
      [book.readUrl, ...Object.values(book.downloads)]
        .filter(Boolean)
        .some((url) => new URL(url).hostname !== new URL(source.homepage).hostname)
    )
      throw Error('library-refresh-original-host');
  }
  const receipt = {
    schema: 'wrn.website-library-refresh.v1',
    dataCommit,
    observedAt,
    glossaryAppCommit: previous.currentKnowledge.sourceCommit,
    glossaryObservedAt: previous.currentKnowledge.observedAt,
    libraryFeedSha256: sha256(feedBytes),
    libraryFeedBytes: feedBytes.length,
    previousPackageSha256: sha256(packageBytes),
    packedSha256: sha256(packed),
    preservedBooks: oldIds.size,
    books: books.length,
    added: books
      .filter((book) => !oldIds.has(book.id))
      .map(({ id, sourceId, title, readUrl, downloads }) => ({
        id,
        sourceId,
        title,
        readUrl,
        downloads,
      })),
    historyPreserved: true,
    glossaryPreserved: true,
    withdrawalsPreserved: true,
    rights: 'metadata-and-original-links-only',
    mediaFetched: false,
  };
  await writeFile(outputFile, packed);
  return receipt;
}
