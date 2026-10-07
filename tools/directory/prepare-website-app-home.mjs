import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { normaliseDirectoryUrl } from '../../packages/content-contracts/src/directory/mobile-content-directory-v1.ts';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const semanticRoot = new URL('./app-home-semantic/', import.meta.url);
/** Execute only hash-pinned approved App selection code, never upstream feed code. */
export async function prepareWebsiteAppHome({ feedBytes, directory }) {
  const approved = JSON.parse(await fs.readFile(new URL('approved.json', semanticRoot)));
  if (!/^[a-f0-9]{40}$/.test(approved.appCommit)) throw Error('Unapproved App semantic identity');
  const root = new URL(approved.appCommit + '/', semanticRoot),
    bindingBytes = await fs.readFile(new URL('binding.json', root));
  if (hash(bindingBytes) !== approved.bindingSha256) throw Error('App semantic binding drift');
  const binding = JSON.parse(bindingBytes);
  if (
    binding.appCommit !== approved.appCommit ||
    binding.homeCount !== 10 ||
    binding.mode !== 'anonymous-public-feed-DE-not-personalized'
  )
    throw Error('App semantic contract drift');
  const files = {};
  for (const name of [
    'news-app-2-core.js',
    'news-card-copy.js',
    'editorial-decisions.json',
    'home-selection.js',
  ]) {
    const url = new URL(name, root);
    if ((await fs.lstat(url)).isSymbolicLink()) throw Error('Linked App semantic input');
    const bytes = await fs.readFile(url),
      expected = binding.files[name];
    if (bytes.length !== expected?.bytes || hash(bytes) !== expected.sha256)
      throw Error('App semantic file drift');
    files[name] = bytes.toString('utf8');
  }
  const api = (name) => {
    const context = { module: { exports: {} }, URL, Intl, Date };
    vm.runInNewContext(files[name], context, { timeout: 1500 });
    return context.module.exports;
  };
  const core = api('news-app-2-core.js'),
    cardCopy = api('news-card-copy.js');
  const articles = core.applyEditorialDecisions(
    core.normalizeArticles(JSON.parse(feedBytes)).filter(core.hasVisibleArticle),
    JSON.parse(files['editorial-decisions.json']),
  );
  const context = {
    core,
    cardCopy,
    HOME_COUNT: 10,
    viewRoot: { dataset: {} },
    state: {
      articles,
      quickArticleIds: new Set(articles.map((a) => a.id)),
      cardArticles: [],
      language: 'de',
    },
    personalizedHomeGroups: () => [],
    renderError: () => null,
  };
  if (binding.selectorModule) {
    context.module = { exports: {} };
    context.selection = null;
    context.feed = JSON.parse(feedBytes);
    context.decisions = JSON.parse(files['editorial-decisions.json']);
    context.require = (name) => {
      if (name === './app-home-core.cjs') return core;
      if (name === './app-home-card-copy.cjs') return cardCopy;
      throw Error('Unbound App selector import');
    };
    vm.runInNewContext(
      files['home-selection.js'] + '\nselection=module.exports(feed,decisions);',
      context,
      { timeout: 1500 },
    );
  } else
    vm.runInNewContext(files['home-selection.js'] + '\nselection=selectHome();', context, {
      timeout: 1500,
    });
  const byUrl = new Map(directory.articles.filter((a) => !a.historical).map((a) => [a.url, a]));
  const canonical = (value) => normaliseDirectoryUrl(value, { news: true, allowHttp: true });
  // Both inputs bind the same feed SHA. App normalization may change display titles;
  // canonical article URLs retain the identity used by the frozen App exporter.
  const match = (a) => byUrl.get(canonical(a.originalUrl ?? a.link)) ?? null;
  const visible = articles.flatMap((a) => {
    const item = match(a);
    return item ? [{ a, item }] : [];
  });
  const pick = (items) =>
    (items ?? []).flatMap((a) => {
      const item = match(a);
      return item ? [item.id] : [];
    });
  const selected = context.selection ?? {};
  return {
    schema: 'wrn.website-app-home-layout.v1',
    appFreeze: binding.appCommit,
    directoryCommit: directory.sourceCommit,
    feedSha256: hash(feedBytes),
    handoffSha256: binding.handoffSha256,
    selectorSha256: binding.selectionSourceSha256,
    sourceFiles: binding.files,
    lead: pick(selected.lead)[0] ?? null,
    top: pick(selected.top),
    sport: pick(selected.sport),
    more: pick(selected.more),
    briefing: pick(selected.briefing),
    visibleIds: visible.map(({ item }) => item.id),
    appTopics: Object.fromEntries(
      visible.map(({ a, item }) => [
        item.id,
        [a.primaryTopic, ...(a.secondaryTopics ?? [])].filter(Boolean),
      ]),
    ),
    excludedSelection: Object.values(selected)
      .flat()
      .filter((a) => !match(a))
      .map((a) => ({ url: a.originalUrl ?? a.link, reason: 'not-admitted-or-identity-mismatch' })),
    selectionPolicy:
      'Exact hash-pinned frozen App Home selector; anonymous public-feed selection; Website admission remains restrictive.',
  };
}
