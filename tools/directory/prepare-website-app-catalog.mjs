import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { resolve } from 'node:path';

/** Website-local metadata projection. No network requests or full-text/media admission. */
export async function prepareWebsiteAppCatalog({
  inputDirectory,
  historyFile,
  outputFile,
  commit,
  observedAt,
  podcastPolicy = null,
  libraryAllowedIds = null,
}) {
  if (
    !/^[a-f0-9]{40}$/.test(commit) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(observedAt) ||
    !Number.isFinite(Date.parse(observedAt))
  )
    throw Error('invalid-binding');
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
  const files = [
    'radio-stations.json',
    'podcasts.json',
    'video-feed.json',
    'library-feed.json',
    'events-feed.json',
  ];
  const kinds = ['radio', 'podcasts', 'videos', 'library', 'events'];
  const inputs = [],
    collections = {},
    reconciliation = {};
  const controls = (v, includeSpace = false) =>
    [...v].some((c) => c.charCodeAt(0) <= (includeSpace ? 32 : 31) || c.charCodeAt(0) === 127);
  const plain = (v, max) =>
    typeof v === 'string' && v.trim() && v.length <= max && !/[<>]/u.test(v) && !controls(v);
  for (const [index, name] of files.entries()) {
    const bytes = await readFile(resolve(inputDirectory, name));
    if (bytes.length > 4194304) throw Error('input-cap');
    inputs.push({ path: name, sha256: hash(bytes), bytes: bytes.length });
    const document = JSON.parse(bytes);
    const rows = document.items ?? document;
    if (!Array.isArray(rows) || rows.length > (kinds[index] === 'podcasts' ? 3000 : 1000))
      throw Error('input-count');
    const records = new Map();
    const kind = kinds[index];
    for (const rawItem of rows) {
      if(kind==='library'&&libraryAllowedIds&&!libraryAllowedIds.has(rawItem.id))continue;
      if(kind==='podcasts'&&podcastPolicy?.episodeIdAliases?.[rawItem.id]&&rows.some(r=>r.id===podcastPolicy.episodeIdAliases[rawItem.id]))continue;
      const item=kind==='podcasts'&&podcastPolicy?{...rawItem,...podcastPolicy.reviewedEpisodeOverrides?.[rawItem.id]}:rawItem;
      const link = [
        item.website,
        item.episodeUrl,
        item.originalUrl,
        item.readUrl,
        item.link,
        item.downloads?.html,
        item.downloads?.pdf,
        item.downloads?.epub,
      ].find((v) => typeof v === 'string' && v.trim());
      const url = new URL(link);
      if (url.protocol !== 'https:' || url.username || url.password || controls(link, true))
        throw Error('unsafe-original');
      const title = item.title ?? item.name;
      const source = item.sourceName ?? item.source ?? item.quelleName ?? item.name ?? '—';
      const unverified=kind==='podcasts'&&podcastPolicy&&(
        podcastPolicy.unverifiedLanguageSourceIds?.includes(item.sourceId)||
        podcastPolicy.unverifiedLanguageEpisodeIds?.includes(item.id)||
        podcastPolicy.languageConflictEpisodeIds?.includes(item.id)||item.languageVerified===false);
      const language = unverified?'und':(item.language ?? item.languages?.[0] ?? 'und');
      const rawCountry = item.country ?? item.eventCountry;
      const country = typeof rawCountry === 'string' && rawCountry.trim() ? rawCountry : null;
      if (
        !plain(title, 500) ||
        !plain(source, 300) ||
        typeof language !== 'string' ||
        !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(language) ||
        (country !== null && !plain(country, 100))
      )
        throw Error('invalid-metadata');
      const date =
        kind === 'library'
          ? (item.published ?? item.publishedAt)
          : (item.published ?? item.publishedAt ?? item.updatedAt ?? item.eventStart);
      const publishedAt =
        typeof date === 'string' && Number.isFinite(Date.parse(date))
          ? new Date(date).toISOString()
          : null;
      // LORA's reviewed intake entries remain distinct from its provider GUIDs.
      const separateLora=kind==='podcasts'&&podcastPolicy&&item.sourceId==='lora-muenchen';
      const id = 'app-' + hash(kind + ':' + url.href+(separateLora?':'+item.id:''));
      const previous = records.get(id);
      // Multiple GUIDs for one original page cannot prove its audio language.
      const safeLanguage = previous && previous.language !== language ? 'und' : language;
      records.set(id, {
        id,
        title,
        source,
        url: url.href,
        language: safeLanguage,
        publishedAt,
        country,
      });
    }
    collections[kind] = [...records.values()];
    reconciliation[kind] = {
      input: rows.length,
      unique: records.size,
      duplicateOriginalLinks: rows.length - records.size,
    };
  }
  const original = await readFile(historyFile);
  if (original.length > 4194304) throw Error('history-cap');
  const compressed = gzipSync(original, { level: 9 });
  if (!gunzipSync(compressed).equals(original)) throw Error('history-identity');
  const history = {
    encoding: 'gzip-base64',
    bytes: original.length,
    sha256: hash(original),
    payload: compressed.toString('base64'),
  };
  const current = {
    schema: 'wrn.website-current-app-catalog.v1',
    rights: 'metadata-original-link-only',
    repository: 'https://github.com/Blackfront161/Revolution-News-Data',
    commit,
    observedAt,
    inputs,
    collections,
    rejected: [],
  };
  const bytes = Buffer.from(
    JSON.stringify({ schema: 'wrn.website-events-media-package.v1', history, current }) + '\n',
  );
  await writeFile(outputFile, bytes);
  return {
    commit,
    observedAt,
    inputs,
    reconciliation,
    history: { bytes: original.length, sha256: history.sha256 },
    packed: { bytes: bytes.length, sha256: hash(bytes) },
  };
}
