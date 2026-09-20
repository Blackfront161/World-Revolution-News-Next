import { createHash } from 'node:crypto';
import { cp, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { productionMediaInitialCsp } from '../../../packages/browser-content/src/production-media-profile.ts';

const noindex = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
const allowedReleaseFiles = new Set([
  'archive-lifecycle.json',
  'articles.json',
  'discover-index.json',
  'manifest.json',
  'reader-details.json',
  'release-descriptor.json',
  'supplemental-items.json',
  'website-publication.json',
]);
const expectedArticleFiles = [
  'articles/wrn-test-art-cedar/index.html',
  'articles/wrn-test-art-ember/index.html',
  'articles/wrn-test-art-fern/index.html',
];
const expectedHtmlFiles = [...expectedArticleFiles, 'index.html'];
const expectedActiveFileCount = 21;

const sha256Hex = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sha256Csp = (text) => `sha256-${createHash('sha256').update(text).digest('base64')}`;

function normalizedHttpsOrigin(value, label) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} is required`);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be an absolute HTTPS origin`);
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
    throw new Error(`${label} must be an absolute HTTPS origin`);
  if (parsed.pathname !== '/' || parsed.search || parsed.hash)
    throw new Error(`${label} must be an origin without path, query, or fragment`);
  return parsed.origin;
}

function isReservedProbeOrigin(origin) {
  const parsedHostname = new URL(origin).hostname.toLowerCase();
  const hostname = parsedHostname.endsWith('.') ? parsedHostname.slice(0, -1) : parsedHostname;
  return (
    ['localhost', 'test', 'invalid', 'example'].some(
      (reserved) => hostname === reserved || hostname.endsWith(`.${reserved}`),
    ) ||
    ['example.com', 'example.net', 'example.org'].some(
      (reserved) => hostname === reserved || hostname.endsWith(`.${reserved}`),
    )
  );
}

export function resolveStagingTarget({
  stagingOrigin,
  canonicalStrategy,
  sourceOrigin,
  packageMode,
}) {
  if (!stagingOrigin) throw new Error('WRN_STAGING_ORIGIN is required');
  if (!canonicalStrategy) throw new Error('WRN_STAGING_CANONICAL_STRATEGY is required');
  if (!packageMode) throw new Error('WRN_STAGING_PACKAGE_MODE is required');
  if (!['probe', 'candidate'].includes(packageMode))
    throw new Error('WRN_STAGING_PACKAGE_MODE must be probe or candidate');
  const staging = normalizedHttpsOrigin(stagingOrigin, 'WRN_STAGING_ORIGIN');
  const source = normalizedHttpsOrigin(sourceOrigin, 'sourceOrigin');
  if (staging === source) throw new Error('Staging origin must be separate from the source origin');
  if (!['self', 'source'].includes(canonicalStrategy))
    throw new Error('WRN_STAGING_CANONICAL_STRATEGY must be self or source');
  const reservedProbe = isReservedProbeOrigin(staging);
  if (packageMode === 'candidate' && reservedProbe)
    throw new Error('A reserved probe origin can never be an upload candidate');
  return Object.freeze({
    stagingOrigin: staging,
    canonicalOrigin: canonicalStrategy === 'self' ? staging : source,
    canonicalStrategy,
    indexing: 'noindex',
    packageMode,
    uploadEligible: packageMode === 'candidate' && !reservedProbe,
  });
}

function attributeMap(tag) {
  const attributes = new Map();
  const expression = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gu;
  for (const match of tag.matchAll(expression))
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]);
  return attributes;
}

function containsOwnedSeoTag(html) {
  for (const match of html.matchAll(/<(meta|link)\b[^>]*>/giu)) {
    const attributes = attributeMap(match[0]);
    if (match[1].toLowerCase() === 'meta' && attributes.get('name')?.toLowerCase() === 'robots')
      return true;
    if (
      match[1].toLowerCase() === 'link' &&
      attributes.get('rel')?.toLowerCase().split(/\s+/u).includes('canonical')
    )
      return true;
  }
  return false;
}

export function injectStagingHead(html, target) {
  if (typeof html !== 'string' || !/<head(?:\s[^>]*)?>/iu.test(html))
    throw new Error('Staging index HTML has no head element');
  if (containsOwnedSeoTag(html))
    throw new Error('Staging index HTML already contains caller-owned SEO directives');
  const insertion =
    `<meta name="robots" content="${noindex}">` +
    `<link rel="canonical" href="${target.canonicalOrigin}/">` +
    `<meta property="og:url" content="${target.canonicalOrigin}/">`;
  return html.replace(/<head(\s[^>]*)?>/iu, (head) => `${head}${insertion}`);
}

function inlineHashes(htmlDocuments, tag) {
  const hashes = new Set();
  const expression = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'giu');
  for (const html of htmlDocuments) {
    for (const match of html.matchAll(expression)) {
      if (tag === 'script' && /\\bsrc\\s*=/iu.test(match[1])) continue;
      hashes.add(sha256Csp(match[2]));
    }
  }
  return [...hashes].sort().map((hash) => `'${hash}'`);
}

export function buildStagingSecurityHeaders(htmlDocuments) {
  if (!Array.isArray(htmlDocuments) || htmlDocuments.length === 0)
    throw new Error('At least one HTML document is required for CSP binding');
  const scripts = inlineHashes(htmlDocuments, 'script');
  const styles = inlineHashes(htmlDocuments, 'style');
  const csp = [
    "default-src 'self'",
    "base-uri 'none'",
    "connect-src 'self'",
    "font-src 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "manifest-src 'self'",
    productionMediaInitialCsp,
    "object-src 'none'",
    `script-src 'self'${scripts.length ? ` ${scripts.join(' ')}` : ''}`,
    `style-src 'self'${styles.length ? ` ${styles.join(' ')}` : ''}`,
    "worker-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
  return Object.freeze({
    'content-security-policy': csp,
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'referrer-policy': 'no-referrer',
    'strict-transport-security': 'max-age=31536000',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-robots-tag': noindex,
  });
}

export function renderApacheConfig(headers) {
  const lines = [
    'Options -Indexes',
    '',
    ...Object.entries(headers).map(([name, value]) => `Header always set ${name} "${value}"`),
    'Header always unset X-Powered-By',
    '',
    '<FilesMatch "\\.(?:html?|json|xml|txt)$">',
    '  Header always set Cache-Control "no-store"',
    '</FilesMatch>',
    '<FilesMatch "\\.(?:css|js|png)$">',
    '  Header always set Cache-Control "public, max-age=31536000, immutable"',
    '</FilesMatch>',
    '<Files "website-staging-shell-sw.js">',
    '  Header always set Cache-Control "no-store"',
    '  Header always set Service-Worker-Allowed "/"',
    '</Files>',
    '',
  ];
  return lines.join('\n');
}

export function renderRetirementWorker() {
  return `/* generated WRN staging retirement worker */
self.addEventListener('install',(event)=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',(event)=>event.waitUntil((async()=>{
  const names=await caches.keys();
  for(const name of names)if(name.startsWith('wrn.website-staging-shell.'))await caches.delete(name);
  await self.clients.claim();
  await self.registration.unregister();
})()));
`;
}

async function listFiles(directory, relative = '') {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (relative === '' && entry.name === '.vite') continue;
    const next = path.join(relative, entry.name);
    const details = await lstat(path.join(directory, next));
    if (details.isSymbolicLink()) throw new Error(`Package symlink is forbidden: ${next}`);
    if (entry.isDirectory()) files.push(...(await listFiles(directory, next)));
    else if (entry.isFile()) files.push(next.split(path.sep).join('/'));
    else throw new Error(`Unsupported package entry: ${next}`);
  }
  return files;
}

export async function assertExpectedStagingHtml(directory) {
  const actual = (await listFiles(directory)).filter((entry) => entry.endsWith('.html'));
  const unexpected = actual.filter((entry) => !expectedHtmlFiles.includes(entry));
  const missing = expectedHtmlFiles.filter((entry) => !actual.includes(entry));
  if (unexpected.length) throw new Error(`Unexpected staging HTML: ${unexpected.join(', ')}`);
  if (missing.length) throw new Error(`Missing staging HTML: ${missing.join(', ')}`);
  return actual;
}

export function assertCleanGitSource(status) {
  if (typeof status !== 'string') throw new Error('Git source status is unavailable');
  if (status.trim() !== '') throw new Error('Relevant Git worktree is not clean');
}

export async function createPackageManifest({
  directory,
  sourceCommit,
  lockfileSha256,
  stagingOrigin,
  canonicalStrategy,
  packageMode,
  uploadEligible,
  contentRevision,
  kind = 'active',
}) {
  if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error('Invalid source commit');
  if (!/^[a-f0-9]{64}$/.test(lockfileSha256)) throw new Error('Invalid lockfile SHA-256');
  const files = [];
  for (const relativePath of await listFiles(directory)) {
    const bytes = await readFile(path.join(directory, ...relativePath.split('/')));
    files.push({ path: relativePath, bytes: bytes.byteLength, sha256: sha256Hex(bytes) });
  }
  const identity = {
    schema: 'wrn.staging-package.v1',
    kind,
    sourceCommit,
    lockfileSha256,
    stagingOrigin,
    canonicalStrategy,
    packageMode,
    uploadEligible,
    contentRevision,
    files,
  };
  return Object.freeze({ ...identity, packageId: sha256Hex(JSON.stringify(identity)) });
}

function allowedPublicPath(relativePath) {
  if (
    [
      '.htaccess',
      'article-publication-manifest.json',
      'index.html',
      'robots.txt',
      'sitemap.xml',
      'website-staging-shell-sw.js',
    ].includes(relativePath)
  )
    return true;
  if (expectedArticleFiles.includes(relativePath)) return true;
  if (
    /^assets\/(?:index-[A-Za-z0-9_-]+\.(?:css|js)|solinaridao-header-mark-filled-[A-Za-z0-9_-]+\.png|wrn-future-header-white-[A-Za-z0-9_-]+\.png)$/.test(
      relativePath,
    )
  )
    return true;
  const release = relativePath.match(/^wrn-local-release\/v1\/([^/]+)$/);
  return Boolean(release && allowedReleaseFiles.has(release[1]));
}

function assertClosedPublicFileSet(sourceFiles) {
  const unexpected = sourceFiles.filter((entry) => !allowedPublicPath(entry));
  if (unexpected.length) throw new Error(`Unexpected public build files: ${unexpected.join(', ')}`);
  const requiredRoot = [
    '.htaccess',
    'article-publication-manifest.json',
    'index.html',
    'robots.txt',
    'sitemap.xml',
    'website-staging-shell-sw.js',
  ];
  const assets = sourceFiles.filter((entry) => entry.startsWith('assets/'));
  const releases = sourceFiles
    .filter((entry) => entry.startsWith('wrn-local-release/v1/'))
    .map((entry) => entry.slice('wrn-local-release/v1/'.length));
  if (
    sourceFiles.length !== expectedActiveFileCount ||
    [...requiredRoot, ...expectedArticleFiles].some((entry) => !sourceFiles.includes(entry)) ||
    assets.length !== 4 ||
    releases.length !== allowedReleaseFiles.size ||
    releases.some((entry) => !allowedReleaseFiles.has(entry))
  )
    throw new Error(`Public staging build must contain exactly ${expectedActiveFileCount} files`);
}

export async function copyClosedPublicPackage(buildDirectory, packageDirectory) {
  await mkdir(packageDirectory);
  const sourceFiles = await listFiles(buildDirectory);
  assertClosedPublicFileSet(sourceFiles);
  for (const relativePath of sourceFiles) {
    const source = path.join(buildDirectory, ...relativePath.split('/'));
    const target = path.join(packageDirectory, ...relativePath.split('/'));
    await mkdir(path.dirname(target), { recursive: true });
    await cp(source, target, { errorOnExist: true, force: false });
  }
  return sourceFiles;
}

export async function verifyStagingPackage({
  directory,
  manifest,
  actualOrigin,
  allowProbe = false,
}) {
  if (!manifest || manifest.schema !== 'wrn.staging-package.v1' || manifest.kind !== 'active')
    throw new Error('External manifest is not an active WRN staging package');
  const normalizedActual = normalizedHttpsOrigin(actualOrigin, 'WRN_STAGING_ACTUAL_ORIGIN');
  if (normalizedActual !== manifest.stagingOrigin)
    throw new Error('Actual delivery origin does not match the bound staging origin');
  if ((!manifest.uploadEligible || manifest.packageMode !== 'candidate') && !allowProbe)
    throw new Error('Probe package is not upload eligible');
  if (manifest.uploadEligible && isReservedProbeOrigin(manifest.stagingOrigin))
    throw new Error('Reserved probe origin is not upload eligible');

  const diskFiles = await listFiles(directory);
  assertClosedPublicFileSet(diskFiles);
  if (!Array.isArray(manifest.files) || manifest.files.length !== expectedActiveFileCount)
    throw new Error('External manifest must bind exactly 21 active files');
  if (JSON.stringify(manifest.files.map((entry) => entry.path)) !== JSON.stringify(diskFiles))
    throw new Error('External manifest file list does not match the package');
  for (const entry of manifest.files) {
    const bytes = await readFile(path.join(directory, ...entry.path.split('/')));
    if (bytes.byteLength !== entry.bytes || sha256Hex(bytes) !== entry.sha256)
      throw new Error(`External manifest hash mismatch: ${entry.path}`);
  }
  const { packageId } = manifest;
  const identity = { ...manifest };
  delete identity.packageId;
  delete identity.shellId;
  if (sha256Hex(JSON.stringify(identity)) !== packageId)
    throw new Error('External manifest package identity mismatch');
  const worker = await readFile(path.join(directory, 'website-staging-shell-sw.js'), 'utf8');
  if (
    !worker.includes(JSON.stringify(manifest.stagingOrigin)) ||
    !worker.includes('wrn.website-staging-shell.v1') ||
    worker.includes('wrn.website-shell.v1') ||
    !worker.includes('htmlResponseHeaders')
  )
    throw new Error('Staging worker is not bound to the origin, namespace, and HTML headers');
  return Object.freeze({ packageId, files: diskFiles.length, actualOrigin: normalizedActual });
}

export async function writeRetirementPackage({ directory, headers }) {
  await mkdir(directory);
  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${noindex}"><title>Analyse beendet</title></head><body><main><h1>Analyse beendet</h1><p>Diese getrennte Testvorschau ist nicht mehr aktiv.</p></main></body></html>\n`;
  await writeFile(path.join(directory, 'index.html'), html, 'utf8');
  await writeFile(path.join(directory, 'robots.txt'), 'User-agent: *\nDisallow: /\n', 'utf8');
  await writeFile(
    path.join(directory, 'website-staging-shell-sw.js'),
    renderRetirementWorker(),
    'utf8',
  );
  await writeFile(path.join(directory, '.htaccess'), renderApacheConfig(headers), 'utf8');
}

export { noindex as stagingNoindexDirective };
