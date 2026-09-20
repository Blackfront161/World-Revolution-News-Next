import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectShellManifest, buildOfflineShell } from './build-offline-shell.mjs';
import { loadWebsiteProductionContentReleaseFromDisk } from './production-content-release.mjs';
import { publishProductionArticleLandings } from './generate-production-article-landings.mjs';
import { buildStagingSecurityHeaders } from './staging-package.mjs';

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
  const viteBytes = await take('.vite/manifest.json');
  const vite = JSON.parse(viteBytes.toString('utf8'));
  const viteEntry = vite['index.html'];
  if (!viteEntry || !Array.isArray(viteEntry.assets) || !Array.isArray(viteEntry.css))
    throw Error('Invalid Vite entry');
  const shellPaths = [
    ...new Set([viteEntry.file, ...viteEntry.css, ...viteEntry.assets].map(relative)),
  ];
  if (shellPaths.length !== 8 || shellPaths.some((p) => !/^assets\/[a-zA-Z0-9._-]+$/.test(p)))
    throw Error('Expected closed nine-asset graph');
  await inspect(root, path.join(build, 'assets'), true);
  if (
    !equal(
      (await readdir(path.join(build, 'assets'))).sort(),
      shellPaths.map((p) => p.slice(7)).sort(),
    )
  )
    throw Error('Source has extra or missing assets');
  for (const rel of shellPaths) await take(rel);
  for (const rel of ['index.html', '.vite/manifest.json', ...shellPaths])
    await writeBound(root, scratch, rel, captured.get(rel));
  const sourceShell = await collectShellManifest({
    outputDirectory: scratch,
    compatibility: 'g3-015-v1',
  });
  if (sourceShell.entries.length !== 9) throw Error('Incomplete production shell');
  const allHtml = [index, ...publication.landingPages.map((e) => captured.get(e.path))];
  const security = Object.fromEntries(
    Object.entries(buildStagingSecurityHeaders(allHtml.map((b) => b.toString('utf8')))).filter(
      ([key]) => key !== 'x-robots-tag',
    ),
  );
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
    'Local production candidate. Verify with the bound source input and trusted workspace before authorized rollout. Deploy immutable revision files first and current.json last; retain old server assets for rollback. Actual Apache headers require a separate server check.\n',
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
  const expected = await plan({
    buildDirectory: path.join(root, relative(supplied.sourceInput.buildDirectory)),
    trustedWorkspaceRoot: root,
    sourceCommit: supplied.sourceCommit,
    generatedAtUTC: supplied.generatedAtUTC,
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
    const allowed = ['--build', '--output', '--workspace', '--commit', '--generated'];
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
        }),
      ),
    );
  } catch (error) {
    console.error('WRN site package failed: ' + error.message);
    process.exitCode = 1;
  }
}
