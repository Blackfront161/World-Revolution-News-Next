import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const app = process.argv[2];
const feedPath = process.argv[3];
const output = process.argv[4];
if (!app || !feedPath || !output) throw Error('Usage: app-directory bound-feed output');
const appFreeze = 'ce2b5565e539cbd1373fef5684cf1997fab5b6e2';
const sourceFiles = {};
const api = (filename) => {
  const context = { module: { exports: {} }, URL, Intl, Date };
  const code = execFileSync('git', ['-C', app, 'show', `${appFreeze}:${filename}`], {
    encoding: 'utf8',
  });
  sourceFiles[filename] = crypto.createHash('sha256').update(code).digest('hex');
  vm.runInNewContext(code, context);
  return context.module.exports;
};
const core = api('news-app-2-core.js'),
  copy = api('news-card-copy.js');
const raw = fs.readFileSync(feedPath);
const directory = JSON.parse(
  fs.readFileSync('apps/website/src/features/projection/data/content-directory-v1.json'),
);
const feedSha256 = crypto.createHash('sha256').update(raw).digest('hex');
if (
  !directory.articles
    .filter((a) => !a.historical)
    .every((a) =>
      a.observations.some(
        (o) =>
          o.provenance.commit === directory.sourceCommit && o.provenance.inputSHA256 === feedSha256,
      ),
    )
)
  throw Error('Feed is not the bound current directory input');
const byUrl = new Map(directory.articles.filter((a) => !a.historical).map((a) => [a.url, a.id]));
const articles = core.normalizeArticles(JSON.parse(raw)).filter(core.hasCompleteArticle);
const balanced = core.balanceEditorially(articles, 22, { maxPerFamily: 2, poolSize: 90 });
const hero =
  balanced.find((a) => core.isLeadEligible(a) && a.image) || balanced.find(core.isLeadEligible);
const sportWords =
  /\b(sport|football|fußball|fussball|futbol|soccer|basketball|cycling|radsport|ultras?|fankultur|fan culture)\b/i;
const sport = core.balanceBySource(
  articles.filter(
    (a) =>
      a.id !== hero.id &&
      core.isLeadEligible(a) &&
      sportWords.test([a.primaryTopic, ...a.categories, a.title].join(' ')),
  ),
  3,
  1,
);
const candidates = balanced.filter(
  (a) =>
    a.id !== hero.id &&
    !sport.some((s) => s.id === a.id) &&
    core.isLeadEligible(a) &&
    copy.completeFirstSentence(a.content || a.intro, 'de'),
);
const top = [...candidates.filter((a) => a.image), ...candidates.filter((a) => !a.image)].slice(
  0,
  5,
);
const more = balanced
  .filter((a) => ![hero, ...top, ...sport].some((s) => s.id === a.id))
  .slice(0, 9);
const briefing = articles
  .filter(
    (a) => core.isLeadEligible(a) && ![hero, ...top, ...more, ...sport].some((s) => s.id === a.id),
  )
  .slice(0, 5);
const canonical = (value) => {
  const url = new URL(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()])
    if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key);
  return url.href;
};
const select = (items) => items.map((a) => byUrl.get(canonical(a.link))).filter(Boolean);
const result = {
  schema: 'wrn.website-app-home-layout.v1',
  appFreeze,
  sourceFiles,
  feedSha256,
  directoryCommit: directory.sourceCommit,
  lead: select([hero])[0] ?? null,
  top: select(top),
  sport: select(sport),
  more: select(more),
  briefing: select(briefing),
  excludedSelection: [hero, ...top, ...sport, ...more, ...briefing]
    .filter((a) => !byUrl.has(canonical(a.link)))
    .map((a) => ({ title: a.title, url: a.link })),
  selectionPolicy:
    'App renderHome release62: balanced22, picture-first lead/top5, sport3, more9, briefing5; display only admitted directory metadata',
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify({ ...result, leadTitle: hero.title, topTitles: top.map((a) => a.title) }, null, 2),
);
