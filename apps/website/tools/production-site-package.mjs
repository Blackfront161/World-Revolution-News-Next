import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectShellManifest, buildOfflineShell } from './build-offline-shell.mjs';
import { loadWebsiteProductionContentReleaseFromDisk } from './production-content-release.mjs';
import { publishProductionArticleLandings } from './generate-production-article-landings.mjs';
import { buildStagingSecurityHeaders } from './staging-package.mjs';
import {
  isSourcePassRevocationsV1,
  mergeSourcePassRevocationsV1,
} from '../../../packages/content-contracts/src/directory/source-pass-revocations-v1.ts';

const origin = 'https://solinaridao.com/';
const schema = 'wrn.production-website-package.v1';
const maxBytes = 8 * 1024 * 1024;
const revisionNames = [
  'release-descriptor.json',
  'manifest.json',
  'articles.json',
  'admission.json',
  'discover-index.json',
  'reader-details.json',
  'archive-lifecycle.json',
  'website-publication.json',
];
const sourcePassSha256 = 'bcef5d2fa88ae4acfb0dce294d3d8245598308c99e992de735babcc8717556aa';
const sha = (value) => createHash('sha256').update(value).digest('hex');
const canonical = (value) =>
  JSON.stringify(value, function (_key, item) {
    return item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item;
  });
const equal = (a, b) => canonical(a) === canonical(b);
function relative(value) {
  if (
    typeof value !== 'string' ||
    !/^[a-zA-Z0-9._/-]+$/.test(value) ||
    value.startsWith('/') ||
    value.split('/').some((s) => !s || s === '.' || s === '..')
  )
    throw Error('Unsafe relative path');
  return value;
}
function utc(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
async function present(file) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
async function inspect(root, target, directory = false) {
  const resolved = path.resolve(target);
  const rel = path.relative(root, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw Error('Path outside trusted workspace');
  let cursor = root;
  for (const segment of rel ? rel.split(path.sep) : []) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    if (info.isSymbolicLink()) throw Error('Link or Junction is forbidden');
    if ((await realpath(cursor)) !== cursor) throw Error('Noncanonical path alias');
    if (cursor !== resolved && !info.isDirectory()) throw Error('Invalid path ancestor');
  }
  if (directory && !(await lstat(resolved)).isDirectory()) throw Error('Directory required');
  return resolved;
}
async function trustedRoot(value) {
  if (typeof value !== 'string' || !value || !path.isAbsolute(value))
    throw Error('Explicit absolute trustedWorkspaceRoot required');
  const resolved = path.resolve(value);
  if ((await lstat(resolved)).isSymbolicLink() || (await realpath(resolved)) !== resolved)
    throw Error('Trusted root alias or Junction');
  return inspect(resolved, resolved, true);
}
async function readBound(root, base, rel) {
  const file = await inspect(root, path.join(base, ...relative(rel).split('/')));
  const info = await lstat(file);
  if (!info.isFile() || info.size > maxBytes) throw Error('Not a bounded regular file');
  const data = await readFile(file);
  if (data.length > maxBytes) throw Error('File exceeds byte cap');
  return data;
}
async function writeBound(root, base, rel, data) {
  const file = path.join(base, ...relative(rel).split('/'));
  await mkdir(path.dirname(file), { recursive: true });
  await inspect(root, path.dirname(file), true);
  await writeFile(file, data, { flag: 'wx' });
}
async function list(root, dir, prefix = '') {
  await inspect(root, dir, true);
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = relative(prefix + entry.name);
    await inspect(root, path.join(dir, entry.name));
    if (entry.isDirectory())
      result.push(...(await list(root, path.join(dir, entry.name), rel + '/')));
    else if (entry.isFile()) result.push(rel);
    else throw Error('Unsupported file entry');
  }
  return result.sort();
}
function noDuplicateHeader(name, value) {
  return [
    'Header onsuccess unset ' + name,
    'Header always unset ' + name,
    ...(value === undefined ? [] : ['Header always set ' + name + ' "' + value + '"']),
  ];
}
function policies(security, shell) {
  const rootHeaders = { ...security, 'cache-control': 'no-store' };
  const assetNames = shell.entries
    .filter((e) => e.path.startsWith('/assets/'))
    .map((e) => path.posix.basename(e.path).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const apache = [
    'Options -Indexes',
    'AddType text/html .html',
    'AddType text/javascript .js',
    'AddType text/css .css',
    'AddType application/json .json',
    'AddType application/xml .xml',
    'AddType text/plain .txt',
    'AddType image/png .png',
    'AddType image/webp .webp',
    ...Object.entries({
      html: 'text/html',
      js: 'text/javascript',
      css: 'text/css',
      json: 'application/json',
      xml: 'application/xml',
      txt: 'text/plain',
    }).flatMap(([extension, mime]) => [
      '<FilesMatch "\\.' + extension + '$">',
      ...noDuplicateHeader('Content-Type', mime + '; charset=utf-8'),
      '</FilesMatch>',
    ]),
    ...Object.entries(rootHeaders).flatMap(([k, v]) => noDuplicateHeader(k, v)),
    ...noDuplicateHeader('Access-Control-Allow-Origin'),
    ...noDuplicateHeader('Access-Control-Allow-Credentials'),
    ...noDuplicateHeader('X-Powered-By'),
    '<FilesMatch "^(?:' + assetNames.join('|') + ')$">',
    ...noDuplicateHeader('Cache-Control', 'public, max-age=31536000, immutable'),
    '</FilesMatch>',
    '<Files "website-shell-sw.js">',
    ...noDuplicateHeader('Cache-Control', 'no-store'),
    ...noDuplicateHeader('Service-Worker-Allowed', '/'),
    '</Files>',
    '',
  ].join('\n');
  const contentApache = [
    ...noDuplicateHeader('Access-Control-Allow-Origin', '*'),
    ...noDuplicateHeader('Access-Control-Allow-Credentials'),
    ...noDuplicateHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
    '<FilesMatch "^(?!current\\.json$).+\\.json$">',
    ...noDuplicateHeader('Cache-Control', 'public, max-age=31536000, immutable'),
    '</FilesMatch>',
    '<Files "current.json">',
    ...noDuplicateHeader('Cache-Control', 'no-store'),
    '</Files>',
    '',
  ].join('\n');
  return { apache, contentApache, rootHeaders };
}
function metaIndex(bytes, security) {
  const source = bytes.toString('utf8');
  if (
    !/<head(?:\s[^>]*)?>/i.test(source) ||
    /http-equiv=["']content-security-policy["']/i.test(source)
  )
    throw Error('Source index head or CSP invalid');
  const csp = security['content-security-policy']
    .split(';')
    .filter((v) => !v.trim().startsWith('frame-ancestors'))
    .join(';');
  return Buffer.from(
    source.replace(
      /<head(?:\s[^>]*)?>/i,
      (match) =>
        match +
        '<meta http-equiv="Content-Security-Policy" content="' +
        csp.replaceAll('"', '&quot;') +
        '"><meta name="referrer" content="no-referrer">',
    ),
  );
}
function entry(file, data) {
  return { path: file, bytes: data.length, sha256: sha(data) };
}

async function plan({
  buildDirectory,
  trustedWorkspaceRoot,
  sourceCommit,
  generatedAtUTC,
  previousRevocationsFile,
  canonicalOrigin = origin,
}) {
  const root = await trustedRoot(trustedWorkspaceRoot);
  if (
    !/^[a-f0-9]{40}$/.test(sourceCommit ?? '') ||
    !utc(generatedAtUTC) ||
    canonicalOrigin !== origin
  )
    throw Error('Invalid commit, UTC timestamp or canonical origin');
  if (typeof buildDirectory !== 'string' || !path.isAbsolute(buildDirectory))
    throw Error('Absolute buildDirectory required');
  const build = await inspect(root, buildDirectory, true);
  const scratch = path.join(root, 'test-results', 'production-site-validation-' + randomUUID());
  await inspect(root, path.dirname(scratch), true);
  await mkdir(scratch);
  const captured = new Map();
  const take = async (rel) => {
    const data = await readBound(root, build, rel);
    captured.set(rel, data);
    return data;
  };
  const current = JSON.parse((await take('wrn-production-content/current.json')).toString('utf8'));
  if (!/^[a-z0-9][a-z0-9-]{2,127}$/.test(current.releaseRevision ?? ''))
    throw Error('Invalid revision path');
  for (const name of revisionNames)
    await take('wrn-production-content/' + current.releaseRevision + '/' + name);
  const sourcePassBytes = await take('wrn-source-passes/current.json');
  if (sha(sourcePassBytes) !== sourcePassSha256)
    throw Error('Supplemental current file mismatch: wrn-source-passes/current.json');
  const revocationBytes = await take('wrn-source-pass-revocations/current.json');
  if (typeof previousRevocationsFile !== 'string' || !path.isAbsolute(previousRevocationsFile))
    throw Error('Absolute previously delivered revocation snapshot required');
  const previousPath = await inspect(root, previousRevocationsFile);
  const previousRelative = path.relative(root, previousPath).replaceAll(path.sep, '/');
  const previousBytes = await readBound(root, root, previousRelative);
  const bundledBytes = await readBound(
    root,
    root,
    'packages/browser-content/src/data/source-pass-revocations-v1.json',
  );
  let revocations;
  let bundled;
  let previous;
  try {
    revocations = JSON.parse(revocationBytes.toString('utf8'));
    bundled = JSON.parse(bundledBytes.toString('utf8'));
    previous = JSON.parse(previousBytes.toString('utf8'));
  } catch {
    throw Error('Invalid source pass revocation JSON');
  }
  if (
    !isSourcePassRevocationsV1(bundled) ||
    !isSourcePassRevocationsV1(revocations) ||
    !isSourcePassRevocationsV1(previous) ||
    mergeSourcePassRevocationsV1(bundled, revocations) === null ||
    mergeSourcePassRevocationsV1(previous, revocations) === null
  )
    throw Error('Source pass revocation snapshot is not cumulative');
  for (const [rel, data] of captured) await writeBound(root, scratch, rel, data);
  const content = await loadWebsiteProductionContentReleaseFromDisk({
    root: path.join(scratch, 'wrn-production-content'),
  });
  const revision = content.ready.descriptor.releaseRevision;
  const generated = path.join(scratch, 'expected-static');
  const publication = await publishProductionArticleLandings({
    releaseRoot: path.join(scratch, 'wrn-production-content'),
    outputDirectory: generated,
  });
  const staticPaths = [
    'robots.txt',
    'sitemap.xml',
    'article-publication-manifest.json',
    ...publication.landingPages.map((e) => e.path),
  ];
  for (const rel of staticPaths) {
    const source = await take(rel);
    if (!source.equals(await readBound(root, generated, rel)))
      throw Error('Static publication bytes/identity mismatch: ' + rel);
  }
  const index = await take('index.html');
  // Public network disclosures travel with the reviewed release, not an older
  // separately hosted privacy page. Capture only these three bounded local files.
  const privacyHtml = await take('privacy.html');
  for (const name of ['privacy.html', 'privacy.css', 'privacy.js']) {
    const bytes = name === 'privacy.html' ? privacyHtml : await take(name);
    const limit = name === 'privacy.js' ? 262144 : 65536;
    if (
      bytes.length > limit ||
      !bytes.equals(await readBound(root, root, 'apps/website/public/' + name))
    )
      throw Error('Privacy publication bytes/identity mismatch: ' + name);
  }
  await take('.vite/manifest.json');
  const assetDirectory = await inspect(root, path.join(build, 'assets'), true);
  const sourceAssets = await readdir(assetDirectory, { withFileTypes: true });
  if (
    sourceAssets.length < 2 ||
    sourceAssets.length > 31 ||
    sourceAssets.some((item) => !item.isFile() || !/^[a-zA-Z0-9._-]+$/.test(item.name))
  )
    throw Error('Source has extra or missing assets');
  const shellPaths = sourceAssets.map((item) => `assets/${item.name}`).sort();
  for (const rel of shellPaths) await take(rel);
  for (const rel of ['index.html', '.vite/manifest.json', ...shellPaths])
    await writeBound(root, scratch, rel, captured.get(rel));
  const sourceShell = await collectShellManifest({
    outputDirectory: scratch,
    compatibility: 'g3-015-v1',
  });
  if (sourceShell.entries.length !== shellPaths.length + 1)
    throw Error('Incomplete production shell');
  const allHtml = [
    index,
    privacyHtml,
    ...publication.landingPages.map((e) => captured.get(e.path)),
  ];
  const security = Object.fromEntries(
    Object.entries(buildStagingSecurityHeaders(allHtml.map((b) => b.toString('utf8')))).filter(
      ([key]) => key !== 'x-robots-tag',
    ),
  );
  // The Website's article client uses only the installed App's WRN cache.
  // Staging retains connect-src 'self'; no wildcard or direct provider access.
  if (security['content-security-policy'].split("connect-src 'self'").length !== 2)
    throw Error('Production connection policy changed');
  security['content-security-policy'] = security['content-security-policy'].replace(
    "connect-src 'self'",
    "connect-src 'self' https://wrn-translation-cache.paghklo.workers.dev",
  );
  // Only the exact HTTPS origins in the source-bound App image register may
  // load. Image bytes never enter the hosting packet or offline shell.
  const images=JSON.parse(await readFile(fileURLToPath(new URL('../src/features/home/app-article-images-v1.json',import.meta.url)),'utf8'));
  if(images.schema!=='wrn.website-app-image-references.v1'||images.imageBytesHosted!==false||images.imageBytesOffline!==false||!Array.isArray(images.origins)||images.origins.some(value=>{try{const u=new URL(value);return u.protocol!=='https:'||u.origin!==value||!!u.username||!!u.password;}catch{return true;}}))throw Error('App image origin policy differs');
  security['content-security-policy']=security['content-security-policy'].replace("img-src 'self' data: blob:","img-src 'self' data: blob: "+images.origins.join(' '));
  const packaged = path.join(scratch, 'packaged-shell');
  await mkdir(packaged);
  await writeBound(root, packaged, 'index.html', metaIndex(index, security));
  for (const rel of ['.vite/manifest.json', ...shellPaths])
    await writeBound(root, packaged, rel, captured.get(rel));
  const shell = await collectShellManifest({
    outputDirectory: packaged,
    compatibility: 'g3-015-v1',
  });
  await buildOfflineShell({ outputDirectory: packaged, compatibility: 'g3-015-v1' });
  const publicFiles = new Map([...captured].filter(([p]) => p !== '.vite/manifest.json'));
  publicFiles.set('index.html', await readBound(root, packaged, 'index.html'));
  publicFiles.set('website-shell-sw.js', await readBound(root, packaged, 'website-shell-sw.js'));
  const policy = policies(security, shell);
  publicFiles.set('.htaccess', Buffer.from(policy.apache));
  publicFiles.set('wrn-production-content/.htaccess', Buffer.from(policy.contentApache));
  publicFiles.set('wrn-source-pass-revocations/.htaccess', Buffer.from(policy.contentApache));
  const publicPaths = [...publicFiles.keys()].sort();
  const headers = Object.fromEntries(
    publicPaths
      .filter((p) => !p.endsWith('.htaccess'))
      .map((p) => {
        const values = { ...policy.rootHeaders };
        if (p.startsWith('assets/'))
          values['cache-control'] = 'public, max-age=31536000, immutable';
        if (p === 'website-shell-sw.js') values['service-worker-allowed'] = '/';
        if (p.startsWith('wrn-production-content/')) {
          values['access-control-allow-origin'] = '*';
          values['cross-origin-resource-policy'] = 'cross-origin';
          if (p !== 'wrn-production-content/current.json')
            values['cache-control'] = 'public, max-age=31536000, immutable';
        }
        if (p === 'wrn-source-pass-revocations/current.json') {
          values['access-control-allow-origin'] = '*';
          values['cross-origin-resource-policy'] = 'cross-origin';
        }
        return [p, values];
      }),
  );
  const manifest = {
    schema,
    sourceCommit,
    generatedAtUTC,
    canonicalOrigin,
    revision,
    sequence: content.ready.descriptor.sequence,
    shellId: shell.shellId,
    sourceInput: {
      buildDirectory: path.relative(root, build).replaceAll(path.sep, '/'),
      previousRevocations: entry(previousRelative, previousBytes),
      files: [...captured.keys()].sort().map((p) => entry(p, captured.get(p))),
    },
    files: publicPaths.map((p) => entry(p, publicFiles.get(p))),
    headers,
    activationOrder: [
      ...publicPaths.filter((p) => p.startsWith('wrn-production-content/' + revision + '/')),
      ...publicPaths.filter(
        (p) =>
          !p.startsWith('wrn-production-content/' + revision + '/') &&
          p !== 'wrn-production-content/current.json',
      ),
      'wrn-production-content/current.json',
    ],
  };
  return { root, manifest, publicFiles, scratch };
}

export async function prepareProductionWebsitePackage(options) {
  const root = await trustedRoot(options.trustedWorkspaceRoot);
  if (typeof options.outputDirectory !== 'string' || !path.isAbsolute(options.outputDirectory))
    throw Error('Absolute outputDirectory required');
  const out = path.resolve(options.outputDirectory);
  await inspect(root, path.dirname(out), true);
  for (const target of [out, out + '.manifest.json', out + '.README.txt'])
    if (await present(target)) throw Error('Output exists and is preserved');
  const prepared = await plan(options);
  await inspect(root, path.dirname(out), true);
  await mkdir(out);
  for (const [rel, data] of prepared.publicFiles) await writeBound(root, out, rel, data);
  await writeFile(out + '.manifest.json', canonical(prepared.manifest) + '\n', { flag: 'wx' });
  await writeFile(
    out + '.README.txt',
    'Local production candidate. The previousRevocationsFile input must be the last delivered host snapshot; verify its receipt before rollout. Deploy immutable revision files first and current.json last; retain old server assets for rollback. Actual Apache headers require a separate server check.\n',
    { flag: 'wx' },
  );
  await inspect(root, out, true);
  return {
    outputDirectory: out,
    manifestPath: out + '.manifest.json',
    files: prepared.manifest.files.length,
    revision: prepared.manifest.revision,
    shellId: prepared.manifest.shellId,
  };
}

/** Reconstructs from bound source inputs in fresh retained validation scratch, never edits the package. */
export async function verifyProductionWebsitePackage({
  directory,
  trustedWorkspaceRoot,
  manifest,
}) {
  const root = await trustedRoot(trustedWorkspaceRoot);
  const dir = await inspect(root, directory, true);
  const supplied =
    manifest ??
    JSON.parse(
      (await readBound(root, path.dirname(dir), path.basename(dir) + '.manifest.json')).toString(
        'utf8',
      ),
    );
  if (!supplied || !supplied.sourceInput || typeof supplied.sourceInput.buildDirectory !== 'string')
    throw Error('Invalid manifest');
  if (
    !supplied.sourceInput.previousRevocations ||
    typeof supplied.sourceInput.previousRevocations.path !== 'string'
  )
    throw Error('Missing bound previous revocation snapshot');
  const expected = await plan({
    buildDirectory: path.join(root, relative(supplied.sourceInput.buildDirectory)),
    trustedWorkspaceRoot: root,
    sourceCommit: supplied.sourceCommit,
    generatedAtUTC: supplied.generatedAtUTC,
    previousRevocationsFile: path.join(
      root,
      relative(supplied.sourceInput.previousRevocations.path),
    ),
    canonicalOrigin: supplied.canonicalOrigin,
  });
  if (!equal(supplied, expected.manifest))
    throw Error('Manifest schema, metadata, input or identity mismatch');
  const actual = await list(root, dir);
  if (!equal(actual, [...expected.publicFiles.keys()].sort()))
    throw Error('Public closure mismatch');
  for (const [rel, data] of expected.publicFiles)
    if (!data.equals(await readBound(root, dir, rel)))
      throw Error('Package bytes mismatch: ' + rel);
  return { files: actual.length, revision: supplied.revision, shellId: supplied.shellId };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2),
      values = new Map();
    const allowed = [
      '--build',
      '--output',
      '--workspace',
      '--commit',
      '--generated',
      '--previous-revocations',
    ];
    for (let i = 0; i < args.length; i += 2) {
      if (
        !allowed.includes(args[i]) ||
        values.has(args[i]) ||
        !args[i + 1] ||
        args[i + 1].startsWith('--')
      )
        throw Error('Unknown, duplicate, positional or missing CLI argument');
      values.set(args[i], args[i + 1]);
    }
    if (values.size !== allowed.length) throw Error('Missing required CLI arguments');
    console.log(
      JSON.stringify(
        await prepareProductionWebsitePackage({
          buildDirectory: values.get('--build'),
          outputDirectory: values.get('--output'),
          trustedWorkspaceRoot: values.get('--workspace'),
          sourceCommit: values.get('--commit'),
          generatedAtUTC: values.get('--generated'),
          previousRevocationsFile: values.get('--previous-revocations'),
        }),
      ),
    );
  } catch (error) {
    console.error('WRN site package failed: ' + error.message);
    process.exitCode = 1;
  }
}
