import { createHash } from 'node:crypto';

const hash = (text) => createHash('sha256').update(text).digest('hex');
export const podcastWebsiteId = (url) => 'app-' + hash('podcasts:' + new URL(url).href);
const safeUrl = (value) => {
  if (typeof value !== 'string' || value.length > 4096 || /[\s\u0000-\u001f\u007f]/u.test(value))
    throw Error('podcast-case-url');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw Error('podcast-case-url');
  return url.href;
};
const plain = (value, max) =>
  typeof value === 'string' && value.trim() && value.length <= max && !/[<>\u0000-\u001f\u007f]/u.test(value);

/** Preparation only: this candidate is deliberately not a runtime package schema. */
export function prepareWebsitePodcastCases({ websitePackage, podcasts, policy, resolutions, tombstoneIds = [] }) {
  if (websitePackage.schema !== 'wrn.website-events-media-package.v2' || policy.schemaVersion !== 1 ||
      resolutions.schema !== 'wrn.podcast-case-resolutions.v1' || resolutions.cases.length !== 47 ||
      resolutions.newOriginalLinkRecords !== 31 || resolutions.canonicalLinksCorrected !== 16)
    throw Error('podcast-case-binding');
  const old = [...websitePackage.current.collections.podcasts, ...websitePackage.supplement.collections.podcasts];
  const rows = new Map(podcasts.map((r) => [r.id, r]));
  if (rows.size !== podcasts.length || new Set(resolutions.cases.map((c) => c.caseId)).size !== 47)
    throw Error('podcast-case-identity');
  const projected = old.map((r) => ({ ...r })), mappings = [], groups = [], corrections = [], intake = [];
  const aliases = policy.episodeIdAliases ?? {};
  for (const c of resolutions.cases) {
    const row = rows.get(c.recordId), override = policy.reviewedEpisodeOverrides?.[c.recordId];
    const url = safeUrl(c.originalUrl);
    if (!row || row.episodeUrl !== url || row.sourceId !== c.sourceId || override?.episodeUrl !== url || c.audioFetched !== false)
      throw Error('podcast-case-source');
    const canonicalUrlId = podcastWebsiteId(url);
    const rawAliases = Object.entries(aliases).filter(([, target]) => target === row.id).map(([alias]) => alias);
    if (rawAliases.some((id) => Object.hasOwn(aliases, aliases[id]))) throw Error('podcast-case-alias-chain');
    let websiteId;
    if (c.disposition === 'canonical-link-corrected') {
      const original = old.filter((r) => r.url === safeUrl(c.oldUrl));
      if (original.length !== 1 || c.sourceId !== 'final-straw') throw Error('podcast-case-correction-target');
      websiteId = original[0].id;
      const next = { ...original[0], url };
      projected[projected.findIndex((r) => r.id === websiteId)] = next;
      corrections.push({ id: websiteId, previousUrl: c.oldUrl, canonicalUrlId, next });
    } else if (c.disposition === 'admitted-original-link-only') {
      if (row.language !== 'und' || row.languageVerified !== false || row.languageReviewRequired !== true ||
          override.language !== 'und' || override.languageVerified !== false ||
          row.contentPolicy !== 'metadata_and_links_only' ||
          !((policy.metadataOnlyEpisodeIds ?? []).includes(row.id) || (policy.restrictedEpisodeIds ?? []).includes(row.id) ||
            row.sourceId === policy.canonicalSourceId) ||
          ['audio', 'audioUrl', 'enclosure', 'image', 'imageUrl', 'artwork', 'description', 'body', 'fullText'].some((k) => row[k]) ||
          (row.downloads && Object.keys(row.downloads).length)) throw Error('podcast-case-restriction');
      if (!plain(row.title, 500) || !plain(row.sourceName, 300) ||
          !(row.country == null || plain(row.country, 100))) throw Error('podcast-case-metadata');
      websiteId = canonicalUrlId;
      if (old.some((r) => r.id === websiteId || r.url === url)) throw Error('podcast-case-collision');
      const next = { id: websiteId, title: row.title, source: row.sourceName, url, language: 'und',
        publishedAt: row.published && Number.isFinite(Date.parse(row.published)) ? new Date(row.published).toISOString() : null,
        country: row.country ?? null };
      projected.push(next); intake.push(next);
      if (c.previousRecordId) {
        const previous = old.filter((r) => r.url === safeUrl(c.previousOriginalUrl));
        if (previous.length !== 1 || c.sourceId !== 'lora-muenchen' || c.previousRecordId === row.id ||
            safeUrl(c.previousOriginalUrl) === url) throw Error('podcast-case-reused-guid');
      }
    } else throw Error('podcast-case-disposition');
    const identities = [...new Set([row.id, ...rawAliases, c.caseId, websiteId, canonicalUrlId])];
    groups.push(identities);
    mappings.push({ caseId: c.caseId, appRecordId: row.id, rawAliases, websiteId, canonicalUrlId,
      originalUrl: url, disposition: c.disposition, sourceId: c.sourceId,
      language: c.disposition === 'admitted-original-link-only' ? 'und' : 'existing metadata unchanged; no new verification',
      rights: 'metadata-original-link-only', previousRecordId: c.previousRecordId ?? null,
      previousOriginalUrl: c.previousOriginalUrl ?? null, withdrawalIdentities: identities });
  }
  if (intake.length !== 31 || corrections.length !== 16 || new Set(projected.map((r) => r.id)).size !== projected.length)
    throw Error('podcast-case-count');
  const denied = new Set(tombstoneIds);
  // A withdrawal of any raw, case, legacy website or canonical identity wins.
  let changed = true;
  while (changed) { changed = false; for (const group of groups) if (group.some((id) => denied.has(id)))
    for (const id of group) if (!denied.has(id)) { denied.add(id); changed = true; } }
  return { schema: 'wrn.website-podcast-case-preparation.v1', runtimeImported: false, publicationPerformed: false,
    records: projected.filter((r) => !denied.has(r.id)), intake: intake.filter((r) => !denied.has(r.id)),
    corrections: corrections.filter((r) => !denied.has(r.id)),
    mappings: mappings.map((m) => ({ ...m, withdrawn: denied.has(m.websiteId) })),
    deniedIdentities: [...denied].sort(), previousCount: old.length,
    candidateCount: projected.filter((r) => !denied.has(r.id)).length,
    historyAndOtherCollectionsChanged: false, mediaFetched: false };
}
