import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { createShellProtocol } from '../src/offline-shell/protocol.mjs';

import {
  renderWebsiteShellWorker,
  workerProtocolRevision,
} from '../src/offline-shell/worker-template.mjs';
import {
  renderStagingWebsiteShellWorker,
  stagingWorkerProtocolRevision,
} from '../src/offline-shell/staging-worker-template.mjs';

const maxGenerationBytes = 8 * 1024 * 1024;
const allowedImage =
  /^(solinaridao-header-mark-filled|wrn-future-header-white)-[A-Za-z0-9_-]+\.png$/;
const allowedAppIcon = /^wrn-app-icon-[A-Za-z0-9_-]+\.png$/;
const maxAppIconBytes = 16 * 1024;
const allowedIllustration = /^wrn-austerity-illustration-v1-[A-Za-z0-9_-]+\.webp$/;
const maxIllustrationBytes = 700 * 1024;
const approvedIllustration = JSON.parse(
  await readFile(
    new URL('../src/features/home/home-illustration-v1.json', import.meta.url),
    'utf8',
  ),
);
const allowedJson =
  /^(legacy-knowledge-v1|legacy-support-v1|content-directory-v1|production-events-media-v1)-[A-Za-z0-9_-]+\.json$/;
const mimeFor = (file) =>
  file.endsWith('.html')
    ? 'text/html; charset=utf-8'
    : file.endsWith('.js')
      ? 'text/javascript; charset=utf-8'
      : file.endsWith('.css')
        ? 'text/css; charset=utf-8'
        : file.endsWith('.json')
          ? 'application/json; charset=utf-8'
          : file.endsWith('.webp')
            ? 'image/webp'
            : 'image/png';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

const shellAssetPath = /^\/assets\/[A-Za-z0-9._-]+$/;
const viteAssetFile = /^assets\/[A-Za-z0-9._-]+$/;

function htmlAssetPaths(html) {
  const values = [...html.matchAll(/(?:src|href)=["'](\/assets\/[A-Za-z0-9._-]+)["']/g)].map(
    (match) => match[1],
  );
  if (
    values.length < 2 ||
    values.length > 32 ||
    new Set(values).size !== values.length ||
    values.some((value) => !shellAssetPath.test(value))
  )
    throw new Error('Shell HTML asset references are invalid or unbounded');
  return values.sort();
}

function manifestFiles(value, pattern, label, maximum = 32) {
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    value.length > maximum ||
    new Set(value).size !== value.length ||
    value.some((entry) => typeof entry !== 'string' || !pattern.test(entry))
  )
    throw new Error(`Vite manifest has invalid ${label}`);
  return [...value];
}

function collectViteClosure(vite) {
  if (!vite || typeof vite !== 'object' || Array.isArray(vite) || Object.keys(vite).length > 128)
    throw new Error('Invalid Vite manifest');
  const entry = vite['index.html'];
  if (!entry || entry.isEntry !== true || entry.src !== 'index.html')
    throw new Error('Invalid Vite entry');
  const visited = new Set();
  const javascript = new Set();
  const css = new Set();
  const assets = new Set();
  const chunks = new Map();
  const visit = (key) => {
    if (visited.has(key)) return;
    if (visited.size >= 24) throw new Error('Vite shell graph has too many chunks');
    const chunk = vite[key];
    if (!chunk || typeof chunk !== 'object' || Array.isArray(chunk))
      throw new Error('Vite shell import is missing');
    if (key !== 'index.html' && chunk.isEntry === true)
      throw new Error('Vite shell graph contains a second entry');
    if (typeof chunk.file !== 'string' || !/^assets\/[A-Za-z0-9._-]+\.js$/.test(chunk.file))
      throw new Error('Vite shell chunk path is invalid');
    const imports = manifestFiles(chunk.imports, /^[A-Za-z0-9._-]+$/, 'static imports');
    if (manifestFiles(chunk.dynamicImports, /^[A-Za-z0-9._-]+$/, 'dynamic imports').length)
      throw new Error('Dynamic JavaScript is not a closed shell');
    visited.add(key);
    javascript.add(chunk.file);
    chunks.set(chunk.file, Object.freeze({ key, chunk, imports }));
    for (const file of manifestFiles(chunk.css, /^assets\/[A-Za-z0-9._-]+\.css$/, 'CSS'))
      css.add(file);
    for (const file of manifestFiles(chunk.assets, viteAssetFile, 'assets')) assets.add(file);
    for (const imported of imports) visit(imported);
  };
  visit('index.html');
  return Object.freeze({
    entry,
    javascript: [...javascript].sort(),
    css: [...css].sort(),
    assets: [...assets].sort(),
    chunks,
  });
}

function javascriptDependencies(source, filename) {
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.ESNext, true);
  const dependencies = new Set();
  const add = (specifier) => {
    if (!specifier || !ts.isStringLiteralLike(specifier))
      throw new Error('JavaScript shell import must use a literal path');
    if (!/^\.\/[A-Za-z0-9._-]+\.js$/.test(specifier.text))
      throw new Error('JavaScript shell import must remain inside the asset graph');
    const resolved = path.posix.normalize(
      path.posix.join(path.posix.dirname(`/${filename}`), specifier.text),
    );
    if (!/^\/assets\/[A-Za-z0-9._-]+\.js$/.test(resolved))
      throw new Error('JavaScript shell import resolved outside the asset graph');
    dependencies.add(resolved);
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) add(node.moduleSpecifier);
    else if (ts.isExportDeclaration(node) && node.moduleSpecifier) add(node.moduleSpecifier);
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword)
      throw new Error('Dynamic JavaScript is not a closed shell');
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return [...dependencies].sort();
}
function normalizeHtmlResponseHeaders(value) {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid HTML response headers');
  const entries = Object.entries(value);
  if (entries.length === 0 || entries.length > 16) throw new Error('Invalid HTML response headers');
  const normalized = {};
  for (const [name, headerValue] of entries.sort(([left], [right]) => left.localeCompare(right))) {
    if (
      !/^[a-z0-9-]{1,64}$/.test(name) ||
      ['content-type', 'cache-control', 'x-wrn-shell-id'].includes(name) ||
      typeof headerValue !== 'string' ||
      headerValue.length < 1 ||
      headerValue.length > 4096 ||
      /[\r\n]/.test(headerValue)
    )
      throw new Error('Invalid HTML response headers');
    normalized[name] = headerValue;
  }
  return Object.freeze(normalized);
}

export async function collectShellManifest({
  outputDirectory,
  compatibility,
  htmlResponseHeaders,
  stagingOrigin,
}) {
  const dist = path.resolve(outputDirectory);
  const html = await readFile(path.join(dist, 'index.html'));
  const referenced = htmlAssetPaths(html.toString('utf8'));
  const assets = await readdir(path.join(dist, 'assets'));
  const images = assets
    .filter((entry) => allowedImage.test(entry))
    .sort()
    .map((entry) => `/assets/${entry}`);
  if (
    images.length !== 2 ||
    new Set(images.map((image) => allowedImage.exec(path.basename(image))[1])).size !== 2
  )
    throw new Error('Exactly the two approved brand image families are required');
  const jsonAssets = assets.filter((entry) => allowedJson.test(entry)).sort();
  const jsonFamilies = new Set(jsonAssets.map((asset) => allowedJson.exec(asset)[1]));
  if (
    ![3, 4].includes(jsonAssets.length) ||
    jsonFamilies.size !== jsonAssets.length ||
    !['legacy-knowledge-v1', 'legacy-support-v1', 'content-directory-v1'].every((family) =>
      jsonFamilies.has(family),
    )
  )
    throw new Error(
      'Exactly the original three or complete four approved local JSON asset families are required',
    );
  const vite = JSON.parse(await readFile(path.join(dist, '.vite', 'manifest.json'), 'utf8'));
  const graph = collectViteClosure(vite);
  const appIcons = assets.filter((entry) => allowedAppIcon.test(entry));
  const illustrations = assets.filter((entry) => allowedIllustration.test(entry));
  if (illustrations.length > 1) throw new Error('Duplicate WRN illustration family');
  if (appIcons.length > 1) throw new Error('Duplicate app icon family');
  // Preserve historical header-favicon graphs for rollback. The dedicated icon
  // is only admitted when this exact family is referenced by the HTML favicon.
  const favicon = html
    .toString('utf8')
    .match(
      /<link rel="icon" type="image\/png" href="(\/assets\/(?:solinaridao-header-mark-filled|wrn-app-icon)-[A-Za-z0-9_-]+\.png)"\s*\/?>/,
    )?.[1];
  const appIcon = appIcons.length ? `/assets/${appIcons[0]}` : null;
  if (
    (appIcon && favicon !== appIcon) ||
    (favicon && !images.includes(favicon) && favicon !== appIcon)
  )
    throw new Error('Favicon is not an approved shell image');
  const expectedReferences = [
    ...[...graph.javascript, ...graph.css].map((file) => `/${file}`),
    ...(favicon ? [favicon] : []),
  ].sort();
  const approvedAssets = [
    ...images.map((image) => image.slice(1)),
    ...(appIcon ? [appIcon.slice(1)] : []),
    ...illustrations.map((asset) => `assets/${asset}`),
    ...jsonAssets.map((asset) => `assets/${asset}`),
  ].sort();
  const permittedViteFiles = new Set([...graph.javascript, ...graph.css, ...approvedAssets]);
  if (
    JSON.stringify(referenced) !== JSON.stringify(expectedReferences) ||
    JSON.stringify(graph.assets) !== JSON.stringify(approvedAssets) ||
    Object.values(vite).some(
      (record) =>
        !record ||
        typeof record !== 'object' ||
        Array.isArray(record) ||
        typeof record.file !== 'string' ||
        !permittedViteFiles.has(record.file),
    )
  )
    throw new Error('Vite manifest is not the closed HTML/CSS/brand shell graph');
  for (const file of graph.javascript) {
    const metadata = graph.chunks.get(file);
    const declared = metadata.imports.map((key) => `/${vite[key].file}`).sort();
    const actual = javascriptDependencies(await readFile(path.join(dist, file), 'utf8'), file);
    if (JSON.stringify(actual) !== JSON.stringify(declared))
      throw new Error(`JavaScript imports disagree with Vite manifest: ${file}`);
  }
  for (const file of graph.css) {
    const source = await readFile(path.join(dist, file), 'utf8');
    if (/url\(/iu.test(source))
      throw new Error('CSS URL dependencies require an explicit closed-graph parser');
  }
  const paths = [
    ...new Set([
      '/index.html',
      ...graph.javascript.map((file) => `/${file}`),
      ...graph.css.map((file) => `/${file}`),
      ...images,
      ...(appIcon ? [appIcon] : []),
      ...illustrations.map((asset) => `/assets/${asset}`),
      ...jsonAssets.map((asset) => `/assets/${asset}`),
    ]),
  ].sort();
  const permittedAssetNames = new Set(
    paths
      .filter((entry) => entry.startsWith('/assets/'))
      .map((entry) => entry.slice('/assets/'.length)),
  );
  if (assets.some((entry) => !permittedAssetNames.has(entry)))
    throw new Error('Unapproved shell asset class or orphaned build chunk');
  const entries = [];
  let totalBytes = 0;
  for (const entryPath of paths) {
    const diskPath = path.join(dist, entryPath.slice(1));
    const details = await stat(diskPath);
    if (!details.isFile() || details.size > maxGenerationBytes)
      throw new Error(`Invalid shell asset: ${entryPath}`);
    if (allowedAppIcon.test(path.basename(entryPath)) && details.size > maxAppIconBytes)
      throw new Error(`App icon exceeds its 16 KiB byte cap: ${entryPath}`);
    if (allowedIllustration.test(path.basename(entryPath))) {
      const bytes = await readFile(diskPath);
      if (
        details.size > maxIllustrationBytes ||
        details.size !== approvedIllustration.bytes ||
        digest(bytes) !== approvedIllustration.sha256 ||
        approvedIllustration.assetType !== 'wrn-original-generated-illustration' ||
        approvedIllustration.noForeignSourceImageCopied !== true
      )
        throw new Error('WRN illustration does not match the approved handoff');
    }
    if (
      entryPath.endsWith('.json') &&
      details.size >
        (entryPath.includes('/legacy-support-v1-')
          ? 1
          : entryPath.includes('/production-events-media-v1-')
            ? 4
            : 3) *
          1024 *
          1024
    )
      throw new Error(`JSON asset exceeds its family byte cap: ${entryPath}`);
    const bytes = await readFile(diskPath);
    totalBytes += bytes.byteLength;
    if (totalBytes > maxGenerationBytes) throw new Error('Shell payload exceeds 8 MiB');
    entries.push(
      Object.freeze({
        path: entryPath,
        mime: mimeFor(entryPath),
        bytes: bytes.byteLength,
        sha256: digest(bytes),
      }),
    );
  }
  const normalizedHeaders = normalizeHtmlResponseHeaders(htmlResponseHeaders);
  if ((normalizedHeaders === undefined) !== (stagingOrigin === undefined))
    throw new Error('Staging origin and HTML response headers must be bound together');
  if (stagingOrigin !== undefined) {
    const parsed = new URL(stagingOrigin);
    if (parsed.protocol !== 'https:' || parsed.origin !== stagingOrigin)
      throw new Error('Invalid staging worker origin');
  }
  const selectedWorkerRevision = stagingOrigin
    ? stagingWorkerProtocolRevision
    : workerProtocolRevision;
  const canonical = JSON.stringify({
    version: 1,
    compatibility,
    workerProtocolRevision: selectedWorkerRevision,
    entries,
    ...(normalizedHeaders ? { htmlResponseHeaders: normalizedHeaders } : {}),
    ...(stagingOrigin ? { stagingOrigin } : {}),
  });
  const manifest = Object.freeze({
    version: 1,
    compatibility,
    workerProtocolRevision: selectedWorkerRevision,
    shellId: digest(Buffer.from(canonical)),
    totalBytes,
    entries: Object.freeze(entries),
    ...(normalizedHeaders ? { htmlResponseHeaders: normalizedHeaders } : {}),
    ...(stagingOrigin ? { stagingOrigin } : {}),
  });
  if (!createShellProtocol().metadata(manifest))
    throw new Error('Shell metadata violates bounded closed-path contract');
  return manifest;
}

export async function buildOfflineShell({
  outputDirectory,
  compatibility = 'g3-015-v1',
  htmlResponseHeaders,
  stagingOrigin,
}) {
  const manifest = await collectShellManifest({
    outputDirectory,
    compatibility,
    htmlResponseHeaders,
    stagingOrigin,
  });
  const worker = stagingOrigin
    ? renderStagingWebsiteShellWorker(manifest)
    : renderWebsiteShellWorker(manifest);
  const workerFilename = stagingOrigin ? 'website-staging-shell-sw.js' : 'website-shell-sw.js';
  await writeFile(path.join(outputDirectory, workerFilename), worker, 'utf8');
  return Object.freeze({ ...manifest, manifest });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputDirectory = process.argv[2];
  if (!outputDirectory)
    throw new Error('Usage: node tools/build-offline-shell.mjs <dist-directory>');
  const result = await buildOfflineShell({ outputDirectory });
  process.stdout.write(`${result.shellId} ${result.totalBytes}\n`);
}
