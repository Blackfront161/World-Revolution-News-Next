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
          : 'image/png';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

function required(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function htmlAssetPaths(html) {
  const values = [...html.matchAll(/(?:src|href)=["'](\/assets\/[A-Za-z0-9._-]+)["']/g)].map(
    (match) => match[1],
  );
  if (values.length !== 2)
    throw new Error('Shell HTML must reference exactly one JS and one CSS asset');
  return values;
}

function assertClosedJavaScriptGraph(source, filename) {
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.ESNext, true);
  let violation = false;
  const visit = (node) => {
    if (
      ts.isImportDeclaration(node) ||
      (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword)
    ) {
      violation = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  if (violation) throw new Error('Dynamic or transitively split JavaScript is not a closed shell');
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
  const js = required(
    referenced.find((entry) => entry.endsWith('.js')),
    'Missing module script',
  );
  const css = required(
    referenced.find((entry) => entry.endsWith('.css')),
    'Missing stylesheet',
  );
  assertClosedJavaScriptGraph(await readFile(path.join(dist, js.slice(1)), 'utf8'), js);
  const cssSource = await readFile(path.join(dist, css.slice(1)), 'utf8');
  if (/url\(/iu.test(cssSource))
    throw new Error('CSS URL dependencies require an explicit closed-graph parser');
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
  const entry = vite?.['index.html'];
  if (
    !entry ||
    entry.isEntry !== true ||
    entry.file !== js.slice(1) ||
    JSON.stringify(entry.css) !== JSON.stringify([css.slice(1)]) ||
    !Array.isArray(entry.assets) ||
    JSON.stringify([...entry.assets].sort()) !==
      JSON.stringify(
        [
          ...images.map((image) => image.slice(1)),
          ...jsonAssets.map((asset) => `assets/${asset}`),
        ].sort(),
      ) ||
    Object.values(vite).some(
      (chunk) => (chunk.imports?.length ?? 0) !== 0 || (chunk.dynamicImports?.length ?? 0) !== 0,
    )
  ) {
    throw new Error('Vite manifest is not the closed HTML/CSS/brand shell graph');
  }
  const paths = [
    ...new Set([
      '/index.html',
      js,
      css,
      ...images,
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
