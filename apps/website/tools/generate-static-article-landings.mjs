import { mkdir, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  canonicalJson,
  sha256Utf8,
  utf8ByteLength,
} from '../../../packages/content-contracts/src/index.ts';
import { loadWebsiteLocalContentReleaseFromDisk } from './local-content-release.mjs';

const safeIdPattern = /^wrn-test-art-[a-z0-9-]+$/;
const publisherVersion = 'wrn-g3-007-static-publisher/1';

function fail(message) {
  throw new Error(`WRN-G3-007-Publisher: ${message}`);
}

export function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function escapeScriptJson(value) {
  return canonicalJson(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function escapeXml(value) {
  return escapeHtml(value);
}

function canonicalArticleUrl(origin, id) {
  if (!safeIdPattern.test(id)) {
    fail(`unsichere Artikel-ID: ${id}`);
  }
  return `${origin}/articles/${id}/`;
}

function readerUrl(id) {
  return `/?article=${encodeURIComponent(id)}`;
}

export function renderBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.kind === 'paragraph') return `        <p>${escapeHtml(block.text)}</p>`;
      if (block.kind === 'heading') {
        return `        <h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
      }
      if (block.kind === 'quote') {
        const attribution = block.attribution
          ? `\n          <footer>${escapeHtml(block.attribution)}</footer>`
          : '';
        return `        <blockquote>\n          <p>${escapeHtml(block.text)}</p>${attribution}\n        </blockquote>`;
      }
      const tag = block.style === 'ordered' ? 'ol' : 'ul';
      return `        <${tag}>\n${block.items
        .map((item) => `          <li>${escapeHtml(item)}</li>`)
        .join('\n')}\n        </${tag}>`;
    })
    .join('\n');
}

export function staticLandingStyles() {
  /*
   * This intentionally mirrors the already approved semantic brand values in
   * @wrn/brand-tokens. Static documents cannot depend on a hashed Vite asset
   * or a runtime stylesheet, so the values stay local to this publisher.
   */
  return `:root{color-scheme:light;--canvas:#f5f4f8;--surface:#fff;--raised:#fff;--text:#16131e;--muted:#57515f;--border:#bdb5c8;--accent:#006d82;--accent-contrast:#fff;--focus:#7d1377;--radius:.625rem;--space-1:.5rem;--space-2:.75rem;--space-3:1rem;--space-4:1.5rem;--control:2.75rem;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans',sans-serif}*{box-sizing:border-box}html{background:var(--canvas)}body{min-width:min(20rem,100%);margin:0;background:var(--canvas);color:var(--text)}.skip-link{position:fixed;z-index:2;top:-5rem;left:var(--space-2);padding:var(--space-2);color:var(--text);background:var(--surface)}.skip-link:focus{top:var(--space-2)}.landing-header{border-bottom:1px solid var(--border);background:linear-gradient(115deg,#006d821a,transparent),var(--surface)}.landing-header__inner,main{width:min(100%,72rem);margin-inline:auto;padding-inline:clamp(1rem,5vw,4rem)}.landing-header__inner{display:flex;align-items:center;min-height:var(--control);padding-block:var(--space-2)}.brand-kicker,.eyebrow{margin:0;color:var(--accent);font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.brand-name{margin:.15rem 0 0;font-family:'Segoe UI Variable Display','Arial Narrow','Noto Sans Display',sans-serif;font-size:.875rem;font-weight:900;letter-spacing:.055em;text-transform:uppercase}.landing{max-width:48rem;padding-block:clamp(2rem,7vw,5rem)}article{display:grid;gap:var(--space-3);min-width:0;padding:clamp(1rem,3vw,2rem);border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);box-shadow:0 .5rem 2rem #16131e14}h1,h2,h3,p,blockquote,ol,ul{margin:0;overflow-wrap:anywhere}h1,h2,h3{font-family:'Segoe UI Variable Display','Arial Narrow','Noto Sans Display',sans-serif;line-height:1.08}h1{font-size:clamp(2.25rem,7vw,4.5rem);letter-spacing:-.045em}.meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-2);margin:0}.meta div{min-width:0}.meta dt{color:var(--muted);font-size:.75rem;font-weight:800}.meta dd{margin:var(--space-1) 0 0;overflow-wrap:anywhere}.reader-content{display:grid;gap:var(--space-3);max-width:44rem;font-family:Atkinson Hyperlegible,Aptos,'Segoe UI',Roboto,'Noto Sans',sans-serif;font-size:1.0625rem;line-height:1.7}.reader-content blockquote{padding-inline-start:var(--space-3);border-inline-start:.3rem solid var(--accent);color:var(--muted)}.reader-content blockquote footer{margin-top:var(--space-2);font-weight:700}.reader-content ol,.reader-content ul{padding-inline-start:1.5rem}.reader-content li+li{margin-top:var(--space-1)}.actions{display:flex;flex-wrap:wrap;gap:var(--space-2);padding-top:var(--space-2);border-top:1px solid var(--border)}.actions a{display:inline-grid;min-width:var(--control);min-height:var(--control);place-items:center;padding:var(--space-1) var(--space-2);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font-weight:700;text-align:center;text-decoration:none}.actions a:first-child{color:var(--accent-contrast);border-color:var(--accent);background:var(--accent)}:focus-visible{outline:.1875rem solid var(--focus);outline-offset:.125rem}@media (max-width:34rem){.meta{grid-template-columns:1fr}}@media (prefers-color-scheme:dark){:root{color-scheme:dark;--canvas:#0b1017;--surface:#151b25;--raised:#1c2430;--text:#f8f5ff;--muted:#cdc6d7;--border:#6f7180;--accent:#56ddeb;--accent-contrast:#07181e;--focus:#ffd25d}.landing-header{background:linear-gradient(115deg,#56ddeb24,transparent),var(--surface)}article{box-shadow:0 .5rem 2rem #0008}}`;
}

export function renderStaticLandingPage({ article, detail, canonical, publication, robots }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': canonical,
    headline: article.title,
    datePublished: article.publishedAt,
    inLanguage: article.originalLanguage,
    url: canonical,
    mainEntityOfPage: canonical,
    isBasedOn: article.originalUrl,
    publisher: { '@type': 'Organization', name: 'World Revolution News' },
  };
  const robotsMeta = robots ? `    <meta name="robots" content="${escapeHtml(robots)}" />\n` : '';
  return `<!doctype html>
<html lang="${escapeHtml(article.originalLanguage)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="publication-revision" content="${escapeHtml(publication.revision)}" />
${robotsMeta}    <title>${escapeHtml(article.title)} | World Revolution News</title>
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="icon" href="data:," />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(article.title)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <style>${staticLandingStyles()}</style>
    <script type="application/ld+json">${escapeScriptJson(jsonLd)}</script>
  </head>
  <body>
    <a class="skip-link" href="#article-content">Zum Artikelinhalt springen</a>
    <header class="landing-header">
      <div class="landing-header__inner">
        <div><p class="brand-kicker">Solinaridao</p><p class="brand-name">World Revolution News</p></div>
      </div>
    </header>
    <main class="landing">
      <article id="article-content" data-article-id="${escapeHtml(article.id)}">
        <header>
          <p class="eyebrow">Lokale Testpublikation · ${escapeHtml(publication.revision)}</p>
          <h1>${escapeHtml(article.title)}</h1>
          <dl class="meta"><div><dt>Quelle</dt><dd>${escapeHtml(article.source.name)}</dd></div><div><dt>Datum</dt><dd>${escapeHtml(article.publishedAt.slice(0, 10))}</dd></div><div><dt>Originalsprache</dt><dd>${escapeHtml(article.originalLanguage)}</dd></div></dl>
        </header>
        <div class="reader-content">
${renderBlocks(detail.blocks)}
        </div>
        <div class="actions"><a id="interactive-reader" href="${escapeHtml(readerUrl(article.id))}">Interaktiv lesen</a><a href="${escapeHtml(article.originalUrl)}" rel="noopener noreferrer" referrerpolicy="no-referrer">Originalquelle (extern)</a></div>
      </article>
    </main>
    <script>window.addEventListener('pageshow',(event)=>{const navigation=performance.getEntriesByType('navigation')[0];if(event.persisted||navigation?.type==='back_forward')document.getElementById('interactive-reader')?.focus()})</script>
  </body>
</html>
`;
}

function renderSitemap(origin, articles) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${articles
  .map(
    (article) =>
      `  <url><loc>${escapeXml(canonicalArticleUrl(origin, article.id))}</loc><lastmod>${article.publishedAt.slice(0, 10)}</lastmod></url>`,
  )
  .join('\n')}
</urlset>
`;
}

function renderRobots(origin, indexing) {
  return indexing === 'noindex'
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;
}

async function writeText(root, relativePath, content) {
  const target = path.resolve(root, relativePath);
  const expectedPrefix = `${path.resolve(root)}${path.sep}`;
  if (!target.startsWith(expectedPrefix))
    fail(`Ausgabepfad verlaesst das Staging: ${relativePath}`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

/** Reserviert das konkrete Ziel atomar. Bereits vorhandene Caller-Ziele bleiben unangetastet. */
async function claimNewOutputDirectory(outputDirectory) {
  try {
    await mkdir(outputDirectory);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'EEXIST') {
      fail('Ausgabeziel existiert bereits und bleibt unveraendert.');
    }
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      fail('Elternverzeichnis des Ausgabeziels fehlt.');
    }
    throw error;
  }
}

async function promoteOwnedStaging(stagingDirectory, outputDirectory) {
  for (const name of [
    'articles',
    'sitemap.xml',
    'robots.txt',
    'article-publication-manifest.json',
  ]) {
    await rename(path.join(stagingDirectory, name), path.join(outputDirectory, name));
  }
  await rmdir(stagingDirectory);
}

/**
 * Erzeugt ausschliesslich lokale, deterministische Buildartefakte. Kein
 * Netzwerk, keine Uhrzeit und kein Website-UI-Import sind Teil dieses Pfads.
 */
export async function publishStaticArticleLandings({ outputDirectory, publicationTarget }) {
  if (typeof outputDirectory !== 'string' || outputDirectory.trim().length === 0) {
    fail('outputDirectory fehlt');
  }
  const output = path.resolve(outputDirectory);
  const release = await loadWebsiteLocalContentReleaseFromDisk();
  const publication = release.ready.websitePublication;
  const delivery = publicationTarget
    ? Object.freeze({
        stagingOrigin: publicationTarget.stagingOrigin,
        canonicalOrigin: publicationTarget.canonicalOrigin,
        canonicalStrategy: publicationTarget.canonicalStrategy,
        indexing: publicationTarget.indexing,
      })
    : null;
  if (
    delivery &&
    (delivery.indexing !== 'noindex' ||
      !['self', 'source'].includes(delivery.canonicalStrategy) ||
      !delivery.stagingOrigin ||
      !delivery.canonicalOrigin)
  )
    fail('ungueltiges Staging-Publikationsziel');
  const canonicalOrigin = delivery?.canonicalOrigin ?? publication.siteOrigin;
  const robotsDirective =
    delivery?.indexing === 'noindex'
      ? 'noindex, nofollow, noarchive, nosnippet, noimageindex'
      : undefined;
  const articlePayload = release.ready.payloads.articles;
  if (!('articles' in articlePayload)) fail('Release enthaelt keinen Artikelpayload.');
  if (publication.generatorVersion !== publisherVersion) {
    fail('Generatorversion der Fixture passt nicht zum Publisher.');
  }

  const articlesById = new Map(articlePayload.articles.map((article) => [article.id, article]));
  const detailsById = new Map(
    release.ready.readerDetails.entries.map((detail) => [detail.articleId, detail]),
  );
  const articles = publication.landingIds.map((id) => {
    const article = articlesById.get(id);
    const detail = detailsById.get(id);
    if (!article || !detail) fail(`validierte ID ist nicht aufloesbar: ${id}`);
    return { article, detail };
  });

  let ownsOutput = false;
  try {
    await claimNewOutputDirectory(output);
    ownsOutput = true;
    /** Staging liegt im selbst beanspruchten Ziel und damit auf demselben Volume. */
    const staging = path.join(output, '.wrn-g3-007-staging');
    await mkdir(staging);
    const entries = [];
    for (const { article, detail } of articles) {
      const relativePath = `articles/${article.id}/index.html`;
      const content = renderStaticLandingPage({
        article,
        detail,
        canonical: canonicalArticleUrl(canonicalOrigin, article.id),
        publication,
        robots: robotsDirective,
      });
      await writeText(staging, relativePath, content);
      entries.push({
        articleId: article.id,
        path: relativePath,
        canonical: canonicalArticleUrl(canonicalOrigin, article.id),
        sha256: await sha256Utf8(content),
        bytes: utf8ByteLength(content),
      });
    }
    const sitemap = renderSitemap(
      canonicalOrigin,
      articles.map(({ article }) => article),
    );
    const robots = renderRobots(canonicalOrigin, delivery?.indexing ?? 'public');
    await writeText(staging, 'sitemap.xml', sitemap);
    await writeText(staging, 'robots.txt', robots);
    const publicationManifest = {
      contractVersion: 'wrn.website-publication-manifest.v1',
      revision: publication.revision,
      releaseRevision: release.ready.descriptor.releaseRevision,
      sourceManifestRevision: release.ready.manifest.revision,
      sourceManifestIntegritySha256: release.ready.manifestSha256,
      siteOrigin: canonicalOrigin,
      ...(delivery ? { delivery } : {}),
      generatedAt: publication.generatedAt,
      generatorVersion: publisherVersion,
      articleSetHashes: release.ready.manifest.articleSetHashes,
      landingPages: entries,
      sitemap: {
        path: 'sitemap.xml',
        sha256: await sha256Utf8(sitemap),
        bytes: utf8ByteLength(sitemap),
      },
      robots: {
        path: 'robots.txt',
        sha256: await sha256Utf8(robots),
        bytes: utf8ByteLength(robots),
      },
    };
    await writeText(
      staging,
      'article-publication-manifest.json',
      `${canonicalJson(publicationManifest)}\n`,
    );
    await promoteOwnedStaging(staging, output);
    return Object.freeze(publicationManifest);
  } catch (error) {
    if (ownsOutput) {
      /** Nur das durch `claimNewOutputDirectory` selbst erzeugte Ziel wird bereinigt. */
      await rm(output, { recursive: true, force: true });
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const outputDirectory = process.argv[2];
  const result = await publishStaticArticleLandings({ outputDirectory });
  process.stdout.write(
    `WRN-G3-007-Publisher: ${result.landingPages.length} lokale Landingpages erzeugt.\n`,
  );
}
