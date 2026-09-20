import { createHash } from 'node:crypto';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import {
  directoryPlainText,
  directoryEndpointIds,
  normaliseDirectoryUrl,
  mobileContentDirectoryMaxBytes,
  validateMobileContentDirectory,
} from '../../packages/content-contracts/src/directory/mobile-content-directory-v1.ts';
export { normaliseDirectoryUrl };
export const MAX_INPUT_BYTES = 4 * 1024 * 1024;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const observedAt = '2026-09-09T04:37:14.725Z';
export const inputPins = Object.freeze({
  currentNews: '5b2eeba4541406e019b3b7fd4094f732da45af35d16bc784431f7ccb57dfb345',
  historicalNews: 'af31c2f94302d9fc04c446288f7801943f7101182597ab206ec5b528d6b25efd',
  currentSources: '9114d8135f770761d61d61c320b3abf585b591f1a11d70c7c844cf81538b5a16',
  historicalSources: 'ef30779accb430f1d781e2a5f4917b14e07e19ab1809503dd0c44ffe74c8aa34',
});
const commits = {
  app: '2216ff3c1305f6d474712892a36dc9b0ea7cb0a0',
  github: '48c394798184721cace3448983f87c71baa681da',
};
const repos = {
  app: 'https://github.com/Blackfront161/World-Revolution-News-App',
  github: 'https://github.com/Blackfront161/Revolution-News-Data',
};
const nullable = (v, max = 500) =>
  v === undefined || v === null || v === '' ? null : directoryPlainText(v, max) ? v : undefined;
const lang = (v) =>
  typeof v === 'string' && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(v) && v.length <= 35;
const strings = (v, check) =>
  v === undefined ? [] : Array.isArray(v) && v.length <= 100 && v.every(check) ? v : null;
const canonicalDate = (v) => {
  if (typeof v !== 'string' || !Number.isFinite(Date.parse(v))) return null;
  const parsed = new Date(v).toISOString();
  const calendar = /^\d{4}-\d{2}-\d{2}/u.exec(v)?.[0];
  return calendar && new Date(calendar + 'T00:00:00.000Z').toISOString().slice(0, 10) !== calendar
    ? null
    : parsed;
};
const safeOptionalUrl = (v) =>
  v === undefined || v === null || v === ''
    ? null
    : (normaliseDirectoryUrl(v, { allowHttp: true }) ?? undefined);
const count = (input) => ({ input, accepted: 0, rejected: { url: 0, http: 0, metadata: 0 } });
const reject = (counter, reason) => {
  counter.rejected[reason] += 1;
  return null;
};
function provenance(dataset, key, row, sourceDate, hashes) {
  return {
    dataset,
    repo: repos[dataset],
    commit: commits[dataset],
    path: key.endsWith('News') ? 'news-feed.json' : 'sources-registry.json',
    inputSHA256: hashes[key],
    observedAt,
    sourceDate,
    row,
  };
}
function articleObservation(item, dataset, row, counter, hashes) {
  const url = normaliseDirectoryUrl(item?.link, { news: true, allowHttp: true });
  if (!url) return reject(counter, 'url');
  if (url.startsWith('http:')) return reject(counter, 'http');
  const rawLanguage = nullable(item.language, 35);
  const rawPublishedAt = nullable(item.pubDate, 100);
  const topics = strings(item.categories, (v) => directoryPlainText(v, 120));
  const sourceHomepage = safeOptionalUrl(item.sourceHomepage);
  if (
    !directoryPlainText(item.title) ||
    !directoryPlainText(item.quelleName) ||
    rawLanguage === undefined ||
    (rawLanguage !== null && !lang(rawLanguage)) ||
    rawPublishedAt === undefined ||
    topics === null ||
    sourceHomepage === undefined
  )
    return reject(counter, 'metadata');
  const publishedAt = canonicalDate(rawPublishedAt);
  counter.accepted += 1;
  return {
    url,
    observation: {
      provenance: provenance(
        dataset,
        dataset === 'app' ? 'historicalNews' : 'currentNews',
        row,
        publishedAt,
        hashes,
      ),
      rawUrl: item.link,
      title: item.title,
      sourceName: item.quelleName,
      language: rawLanguage ?? 'und',
      rawLanguage,
      publishedAt,
      rawPublishedAt,
      topics,
      sourceHomepage,
    },
  };
}
function sourceObservation(item, dataset, row, sourceDate, counter, hashes) {
  const rawUrl = item?.canonicalUrl ?? item?.url ?? item?.homepage;
  const url = normaliseDirectoryUrl(rawUrl, { allowHttp: true });
  if (!url) return reject(counter, 'url');
  const languages = strings(item.languages, lang);
  const topics = strings(item.categories, (v) => directoryPlainText(v, 120));
  const mediaType = nullable(item.mediaType, 80);
  const status = nullable(item.status, 80);
  const active =
    item.active === undefined || item.active === null
      ? null
      : typeof item.active === 'boolean'
        ? item.active
        : undefined;
  const homepage = safeOptionalUrl(item.homepage);
  const originRegion = nullable(item.originRegion, 120);
  const originCountry = nullable(item.originCountry, 120);
  if (
    !directoryPlainText(item.name) ||
    languages === null ||
    topics === null ||
    [mediaType, status, active, homepage, originRegion, originCountry].includes(undefined)
  )
    return reject(counter, 'metadata');
  counter.accepted += 1;
  return {
    url,
    observation: {
      provenance: provenance(
        dataset,
        dataset === 'app' ? 'historicalSources' : 'currentSources',
        row,
        sourceDate,
        hashes,
      ),
      rawUrl,
      name: item.name,
      languages: [...new Set(languages)],
      mediaType,
      status,
      active,
      homepage,
      topics,
      originRegion,
      originCountry,
    },
  };
}
function group(records) {
  const result = new Map();
  for (const entry of records.filter(Boolean)) {
    const observations = result.get(entry.url) ?? [];
    observations.push(entry.observation);
    result.set(entry.url, observations);
  }
  return [...result.entries()];
}
export function buildDirectory(
  inputs,
  hashes = Object.fromEntries(
    Object.entries(inputs).map(([key, v]) => [key, hash(JSON.stringify(v))]),
  ),
) {
  for (const key of Object.keys(inputPins)) {
    const value = inputs[key];
    const bytes = Buffer.byteLength(JSON.stringify(value) ?? '');
    const rows = key.endsWith('News') ? value : value?.sources;
    if (bytes > MAX_INPUT_BYTES) throw new Error('input-too-large:' + key);
    if (
      !Array.isArray(rows) ||
      rows.length > 2000 ||
      (key.endsWith('Sources') &&
        (typeof value !== 'object' || value === null || Array.isArray(value)))
    )
      throw new Error('input-shape:' + key);
    if (!/^[a-f0-9]{64}$/u.test(hashes[key] ?? '')) throw new Error('input-hash:' + key);
  }
  const { currentNews, historicalNews, currentSources, historicalSources } = inputs;
  const rawLinks = [...historicalNews, ...currentNews]
    .map((x) => x?.link)
    .filter((x) => typeof x === 'string');
  const reconciliation = {
    news: {
      app: count(historicalNews.length),
      github: count(currentNews.length),
      rawLinkUnion: new Set(rawLinks).size,
      normalizedUrlUnionBeforeHttps: new Set(
        rawLinks
          .map((url) => normaliseDirectoryUrl(url, { news: true, allowHttp: true }))
          .filter(Boolean),
      ).size,
      collisions: 0,
    },
    sources: {
      app: count(historicalSources.sources.length),
      github: count(currentSources.sources.length),
      collisions: 0,
    },
  };
  const sources = group([
    ...historicalSources.sources.map((x, row) =>
      sourceObservation(
        x,
        'app',
        row,
        canonicalDate(historicalSources.generatedAt),
        reconciliation.sources.app,
        hashes,
      ),
    ),
    ...currentSources.sources.map((x, row) =>
      sourceObservation(
        x,
        'github',
        row,
        canonicalDate(currentSources.generatedAt),
        reconciliation.sources.github,
        hashes,
      ),
    ),
  ]).map(([url, observations]) => {
    const display =
      observations.findLast((o) => o.provenance.dataset === 'github') ?? observations.at(-1);
    return {
      id: 'source-' + hash(url),
      url,
      name: display.name,
      languages: display.languages,
      mediaType: display.mediaType,
      historicalHttp: url.startsWith('http:'),
      accessNote: url.startsWith('http:') ? 'insecure-url' : null,
      observations,
    };
  });
  const articles = group([
    ...historicalNews.map((x, row) =>
      articleObservation(x, 'app', row, reconciliation.news.app, hashes),
    ),
    ...currentNews.map((x, row) =>
      articleObservation(x, 'github', row, reconciliation.news.github, hashes),
    ),
  ])
    .map(([url, observations]) => {
      const current = observations.findLast((o) => o.provenance.dataset === 'github');
      const display = current ?? observations.at(-1);
      return {
        id: 'news-' + hash(url),
        url,
        title: display.title,
        sourceName: display.sourceName,
        language: display.language,
        publishedAt: display.publishedAt,
        topics: display.topics,
        historical: !current,
        endpointIds: directoryEndpointIds(
          observations.map((o) => o.sourceHomepage),
          sources,
        ),
        observations,
      };
    })
    .sort(
      (a, b) =>
        (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '') || a.id.localeCompare(b.id),
    );
  reconciliation.news.collisions =
    reconciliation.news.app.accepted + reconciliation.news.github.accepted - articles.length;
  reconciliation.sources.collisions =
    reconciliation.sources.app.accepted + reconciliation.sources.github.accepted - sources.length;
  const sports = [
    [
      'Senegal’s World Cup Exit: The Price of National Honor and Women’s Safety',
      'https://africanfeminism.com/senegals-world-cup-exit-the-price-of-national-honor-and-womens-safety/',
      'African Feminism',
      'Ndeye Debo Seck',
      '2026-07-22',
      'football',
      'Ein Kommentar über den Konflikt zwischen sportlichem Nationalprestige und dem Schutz von Frauen. Eine feministische Perspektive auf die Fußball-WM.',
      'A commentary on the tension between national sporting prestige and women’s safety. A feminist perspective on the football World Cup.',
      'https://africanfeminism.com/',
    ],
    [
      'Who Speaks for Argentina? Football, Palestine, and the Politics of Representation',
      'https://www.groundxero.in/2026/07/21/who-speaks-for-argentina-football-palestine-and-the-politics-of-representation/',
      'Groundxero · via Common Dreams',
      'Nafisa Nipun Tanjeem',
      '2026-07-21',
      'football',
      'Ein Kommentar über Fußballbegeisterung, politische Repräsentation und Palästinasolidarität. Er lädt dazu ein, Regierungspolitik und Stimmen aus der Bevölkerung getrennt zu betrachten.',
      'A commentary on football enthusiasm, political representation and Palestine solidarity. It invites readers to distinguish government policy from voices in the population.',
      'https://www.groundxero.in/',
    ],
    [
      'The politics of the football terrace',
      'https://africasacountry.com/2026/06/the-politics-of-the-football-terrace',
      'Africa Is a Country',
      'Maher Mezahi',
      '2026-06-27',
      'fan-culture',
      'Ein Essay über algerische Fankultur, Stadien und politischen Ausdruck. Ein Einstieg in die gesellschaftliche Bedeutung von Fußballtribünen.',
      'An essay on Algerian fan culture, stadiums and political expression. An introduction to the social significance of football terraces.',
      'https://africasacountry.com/',
    ],
  ].map(
    ([title, url, publisher, author, publishedAt, category, noteDe, noteEn, sourceHomepage]) => ({
      id: 'sport-' + hash(url),
      title,
      url,
      publisher,
      author,
      publishedAt,
      category,
      noteDe,
      noteEn,
      rights: 'wrn-editorial-reading-note',
      observedAt,
      sourceHomepage,
      articleId: articles.find((a) => a.url === url)?.id ?? null,
      endpointIds: directoryEndpointIds([sourceHomepage], sources),
    }),
  );
  const document = {
    schema: 'wrn.mobile-content-directory.v1',
    version: 1,
    sourceCommit: commits.github,
    observedAt,
    rights: 'metadata-and-links',
    articles,
    sources,
    sports,
    withdrawals: { articleIds: [], endpointIds: [] },
    reconciliation,
  };
  serialiseDirectory(document);
  return document;
}
export function serialiseDirectory(document) {
  const output = JSON.stringify(document) + '\n';
  if (Buffer.byteLength(output) > mobileContentDirectoryMaxBytes)
    throw new Error('output-too-large');
  if (!validateMobileContentDirectory(document)) throw new Error('output-contract');
  for (const [entries, prefix] of [
    [document.articles, 'news'],
    [document.sources, 'source'],
    [document.sports, 'sport'],
  ]) {
    if (entries.some((entry) => entry.id !== prefix + '-' + hash(entry.url)))
      throw new Error('output-identity');
  }
  return output;
}
export async function readPinnedJson(path, expectedHash) {
  if ((await stat(path)).size > MAX_INPUT_BYTES) throw new Error('input-too-large');
  const bytes = await readFile(path);
  if (bytes.byteLength > MAX_INPUT_BYTES) throw new Error('input-too-large');
  if (hash(bytes) !== expectedHash) throw new Error('input-pin');
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 7)
    throw new Error('Expected currentNews historicalNews currentSources historicalSources output');
  const keys = Object.keys(inputPins);
  const entries = await Promise.all(
    keys.map(async (key, i) => [key, await readPinnedJson(process.argv[i + 2], inputPins[key])]),
  );
  const document = buildDirectory(Object.fromEntries(entries), inputPins);
  await writeFile(process.argv[6], serialiseDirectory(document));
  process.stdout.write(
    JSON.stringify({
      bytes: Buffer.byteLength(serialiseDirectory(document)),
      articles: document.articles.length,
      sources: document.sources.length,
      sports: document.sports.length,
      reconciliation: document.reconciliation,
    }) + '\n',
  );
}
