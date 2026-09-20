import { access, mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  canonicalJson,
  sha256Utf8,
  utf8ByteLength,
  decodeProductionReaderImageBytesV2,
} from '../../../packages/content-contracts/src/index.ts';
import {
  escapeHtml,
  escapeScriptJson,
  renderBlocks,
  staticLandingStyles,
} from './generate-static-article-landings.mjs';
import {
  loadWebsiteProductionContentReleaseFromDisk,
  productionWebsiteOrigin,
  productionWebsitePublisherVersion,
} from './production-content-release.mjs';

const artifactNames = Object.freeze([
  'articles',
  'sitemap.xml',
  'robots.txt',
  'article-publication-manifest.json',
]);
const safeId = /^wrn-art-[a-f0-9]{32}$/;

function fail(message) {
  throw new Error(`WRN-Stage-C-Landings: ${message}`);
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return false;
    throw error;
  }
}

function articleUrl(id) {
  if (!safeId.test(id)) fail('unsichere Artikel-ID');
  return new URL(`articles/${id}/`, productionWebsiteOrigin).href;
}

function readerUrl(id) {
  return `/?article=${encodeURIComponent(id)}`;
}

function productionLandingStyles() {
  return `${staticLandingStyles()}:root{color-scheme:dark;--canvas:#000000;--surface:#151b25;--raised:#151b25;--text:#f8f5ff;--muted:#cdc6d7;--border:#b787ff;--accent:#b787ff;--accent-contrast:#21040a;--focus:#ffd25d}.landing-header{background:linear-gradient(115deg,#b787ff2b,transparent),var(--surface)}.actions a:first-child{border-color:#ff5266;background:#ff5266;color:#21040a}.actions a:focus-visible,.skip-link:focus{outline-color:#ffd25d}`;
}

function renderProductionBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.kind !== 'image') return renderBlocks([block]);
      if (
        !['image/png', 'image/jpeg'].includes(block.mime) ||
        decodeProductionReaderImageBytesV2(block.base64) === null
      )
        fail('ungueltiges Bild im validierten Reader');
      // Static pages cannot create Blob URLs. Only the admitted bytes are
      // embedded; the source website is never contacted by the page load.
      return `        <figure class="article-image"><img src="data:${block.mime};base64,${block.base64}" width="${escapeHtml(String(block.width))}" height="${escapeHtml(String(block.height))}" alt="${escapeHtml(block.altText)}" lang="${escapeHtml(block.altLanguage)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" /><figcaption>${escapeHtml(block.attribution)} · <a href="${escapeHtml(block.licenseUrl)}" rel="noopener noreferrer" referrerpolicy="no-referrer">${escapeHtml(block.licenseId)}</a></figcaption></figure>`;
    })
    .join('\n');
}

export function renderProductionStaticLandingPage({ article, detail, publication }) {
  const canonical = articleUrl(article.id);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    datePublished: article.publishedAt,
    inLanguage: article.originalLanguage,
    url: canonical,
    mainEntityOfPage: canonical,
    author: article.source.authors.map((name) => ({ '@type': 'Person', name })),
    publisher: { '@type': 'Organization', name: 'World Revolution News' },
    isBasedOn: article.originalUrl,
    license: article.rights.licenseUrl,
  };
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="publication-revision" content="${escapeHtml(publication.revision)}" />
    <title>${escapeHtml(article.title)} | World Revolution News</title>
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="icon" href="data:," />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(article.title)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <style>${productionLandingStyles()}.article-image{margin:1.5rem 0}.article-image img{display:block;max-width:100%;height:auto}.article-image figcaption{margin-top:.5rem;overflow-wrap:anywhere}</style>
    <script type="application/ld+json">${escapeScriptJson(jsonLd)}</script>
  </head>
  <body>
    <a class="skip-link" href="#article-content">Zum Artikelinhalt springen</a>
    <header class="landing-header"><div class="landing-header__inner"><div><p class="brand-kicker">Solinaridao</p><p class="brand-name">World Revolution News</p></div></div></header>
    <main class="landing"><article id="article-content" data-article-id="${escapeHtml(article.id)}">
      <header><h1 lang="${escapeHtml(article.originalLanguage)}">${escapeHtml(article.title)}</h1>
        <dl class="meta"><div><dt>Quelle</dt><dd>${escapeHtml(article.source.name)}</dd></div><div><dt>Autor:innen</dt><dd>${escapeHtml(article.source.authors.join(', '))}</dd></div><div><dt>Datum</dt><dd>${escapeHtml(article.publishedAt.slice(0, 10))}</dd></div><div><dt>Originalsprache</dt><dd>${escapeHtml(article.originalLanguage)}</dd></div><div><dt>Vollstaendigkeit</dt><dd>${escapeHtml(article.contentCompleteness)}</dd></div><div><dt>Lizenz</dt><dd><a href="${escapeHtml(article.rights.licenseUrl)}" rel="noopener noreferrer" referrerpolicy="no-referrer">${escapeHtml(article.rights.licenseId)}</a></dd></div></dl>
      </header>
      <div class="reader-content" lang="${escapeHtml(article.originalLanguage)}">
${renderProductionBlocks(detail.blocks)}
      </div>
      <section aria-label="Quellennachweis"><h2>Quellennachweis</h2><dl class="meta"><div><dt>Rechtebeleg</dt><dd><a href="${escapeHtml(article.rights.evidenceUrl)}" rel="noopener noreferrer" referrerpolicy="no-referrer">Pruefen</a></dd></div><div><dt>Rechteumfang</dt><dd lang="${escapeHtml(article.originalLanguage)}">${escapeHtml(article.rights.scope)}</dd></div><div><dt>Pruefdatum</dt><dd>${escapeHtml(article.rights.checkedAt)}</dd></div><div><dt>Bearbeitung</dt><dd lang="${escapeHtml(article.originalLanguage)}">${escapeHtml(article.transformation.reference)}</dd></div></dl></section>
      <div class="actions"><a id="interactive-reader" href="${escapeHtml(readerUrl(article.id))}">Interaktiv lesen</a><a href="${escapeHtml(article.originalUrl)}" rel="noopener noreferrer" referrerpolicy="no-referrer">Originalquelle (extern)</a></div>
    </article></main>
  </body>
</html>
`;
}

function renderSitemap(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(({ article }) => `  <url><loc>${escapeHtml(articleUrl(article.id))}</loc><lastmod>${escapeHtml(article.publishedAt.slice(0, 10))}</lastmod></url>`).join('\n')}
</urlset>
`;
}

async function writeText(root, relative, content) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(`${root}${path.sep}`)) fail('Ausgabepfad verlaesst die Publikation');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

/** Local, deterministic publication only. The target must be newly reserved. */
export async function publishProductionArticleLandings({
  outputDirectory,
  releaseRoot,
  publicationTarget,
} = {}) {
  if (typeof outputDirectory !== 'string' || outputDirectory.trim().length === 0)
    fail('outputDirectory fehlt');
  if (publicationTarget !== undefined)
    fail('Produktionspublikation akzeptiert kein abweichendes Publikationsziel');
  const output = path.resolve(outputDirectory);
  if (await exists(output)) fail('Ausgabeziel existiert bereits und bleibt unveraendert');
  const release = await loadWebsiteProductionContentReleaseFromDisk({ root: releaseRoot });
  if (
    release.publication.siteOrigin !== productionWebsiteOrigin ||
    release.publication.generatorVersion !== productionWebsitePublisherVersion
  )
    fail('Publikation ist nicht fuer den Produktionspublisher gebunden');
  const byId = new Map(
    release.ready.documents.articles.articles.map((article) => [article.id, article]),
  );
  const details = new Map(
    release.ready.documents.readerDetails.entries.map((entry) => [entry.articleId, entry]),
  );
  const entries = release.publication.landingIds.map((id) => {
    const article = byId.get(id);
    const detail = details.get(id);
    if (!article || !detail) fail('validierte Landing-ID ist nicht aufloesbar');
    return { article, detail };
  });

  await mkdir(path.dirname(output), { recursive: true });
  try {
    await mkdir(output);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'EEXIST')
      fail('Ausgabeziel existiert bereits und bleibt unveraendert');
    throw error;
  }
  const staging = path.join(output, '.wrn-stage-c-staging');
  await mkdir(staging);
  const landingPages = [];
  for (const { article, detail } of entries) {
    const relative = `articles/${article.id}/index.html`;
    const content = renderProductionStaticLandingPage({
      article,
      detail,
      publication: release.publication,
    });
    await writeText(staging, relative, content);
    landingPages.push(
      Object.freeze({
        articleId: article.id,
        path: relative,
        canonical: articleUrl(article.id),
        sha256: await sha256Utf8(content),
        bytes: utf8ByteLength(content),
      }),
    );
  }
  const sitemap = renderSitemap(entries);
  const robots = `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', productionWebsiteOrigin).href}\n`;
  await writeText(staging, 'sitemap.xml', sitemap);
  await writeText(staging, 'robots.txt', robots);
  const manifest = Object.freeze({
    contractVersion: 'wrn.production-website-static-publication-manifest.v1',
    revision: release.publication.revision,
    sourceManifestRevision: release.ready.manifest.revision,
    sourceManifestSha256: release.ready.manifestSha256,
    siteOrigin: productionWebsiteOrigin,
    generatedAt: release.publication.generatedAt,
    generatorVersion: productionWebsitePublisherVersion,
    articleIds: Object.freeze([...release.ready.articleIds]),
    landingIds: Object.freeze([...release.publication.landingIds]),
    sitemapArticleIds: Object.freeze([...release.publication.sitemapArticleIds]),
    landingPages: Object.freeze(landingPages),
    sitemap: Object.freeze({
      path: 'sitemap.xml',
      sha256: await sha256Utf8(sitemap),
      bytes: utf8ByteLength(sitemap),
    }),
    robots: Object.freeze({
      path: 'robots.txt',
      sha256: await sha256Utf8(robots),
      bytes: utf8ByteLength(robots),
    }),
  });
  await writeText(staging, 'article-publication-manifest.json', `${canonicalJson(manifest)}\n`);
  for (const name of artifactNames) await rename(path.join(staging, name), path.join(output, name));
  return manifest;
}
