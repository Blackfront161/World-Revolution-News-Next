import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ATLAS_VERSION } from './atlas-route/atlas-contract.js';

export const SNAPSHOT_SHA256 = '958700b090d3af4ac448117d124ddf5e5d90d4a95277d16bc541247e565fd06b';
export const SOURCE_COMMIT = '6a8edf0b8e2ddd462db2e750f672c3f114801171';
const hostFiles = ['index.html', 'atlas-host.css', 'atlas-host.js', 'atlas-contract.js','atlas-settings.js','atlas-presentation.js','atlas-frame.css','atlas-display.css'];
const hostRoot = fileURLToPath(new URL('./atlas-route/', import.meta.url));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export function safeRelativePath(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_.\/-]+$/.test(value) &&
    !value.startsWith('/') && value.split('/').every(part => part && part !== '.' && part !== '..');
}
async function regularBytes(root, relative) {
  if (!safeRelativePath(relative)) throw Error('Unsafe Atlas path');
  // Reject symlinks in every component, including the supplied snapshot root.
  let current = path.resolve(root);
  if ((await fs.lstat(current)).isSymbolicLink()) throw Error('Atlas root is a symlink');
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if ((await fs.lstat(current)).isSymbolicLink()) throw Error('Atlas path is a symlink');
  }
  if (!(await fs.stat(current)).isFile()) throw Error('Atlas path is not a file');
  return fs.readFile(current);
}
export async function prepareWebsiteAtlasPackage({ snapshotRoot }) {
  const manifestBytes = await regularBytes(snapshotRoot, 'snapshot-manifest.json');
  if (hash(manifestBytes) !== SNAPSHOT_SHA256) throw Error('Atlas snapshot manifest differs from frozen r77');
  const snapshot = JSON.parse(manifestBytes);
  if (snapshot.version !== ATLAS_VERSION || snapshot.files.length !== 201 || snapshot.bytes !== 104323582) throw Error('Atlas snapshot contract differs');
  const files = new Map();
  let total = 0;
  for (const entry of snapshot.files) {
    if (!safeRelativePath(entry.path) || files.has(`atlas/versions/${ATLAS_VERSION}/${entry.path}`)) throw Error('Unsafe or duplicate Atlas snapshot path');
    const bytes = await regularBytes(snapshotRoot, entry.path);
    if (bytes.length !== entry.bytes || hash(bytes) !== entry.sha256) throw Error(`Atlas snapshot integrity failed: ${entry.path}`);
    files.set(`atlas/versions/${ATLAS_VERSION}/${entry.path}`, bytes);
    total += bytes.length;
  }
  if (total !== snapshot.bytes) throw Error('Atlas snapshot byte total differs');
  files.set(`atlas/versions/${ATLAS_VERSION}/snapshot-manifest.json`, manifestBytes);
  for (const relative of hostFiles) files.set('atlas/' + relative, await regularBytes(hostRoot, relative));
  files.set('atlas/wrn-icon.png',await regularBytes(fileURLToPath(new URL('../src/assets/',import.meta.url)),'wrn-app-icon.png'));
  // Reuse the Website's versioned palette bytes without importing the Atlas
  // into its production bundle. Only semantic theme declarations enter here.
  const brandRoot=fileURLToPath(new URL('../../../packages/brand-tokens/src/',import.meta.url));
  const brandCss=(await regularBytes(brandRoot,'styles.css')).toString('utf8');
  const declarations=brandCss.slice(0,brandCss.indexOf('\n* {'));
  if(!declarations || !declarations.includes("data-theme='editorial'"))throw Error('Website theme contract differs');
  files.set('atlas/atlas-theme-tokens.css',Buffer.from(declarations.replaceAll('data-theme','data-wrn-host-theme')+"\n:root[data-wrn-host-theme='autonom']{--wrn-color-canvas:#000;--wrn-color-surface:#0c0c0c;--wrn-color-surface-raised:#171414;--wrn-color-chrome:#000;--wrn-color-text:#fff7f4;--wrn-color-muted:#d7c5c0;--wrn-color-border:#812431;--wrn-color-accent-cyan:#f04a56;--wrn-color-action:#f04a56;--wrn-color-accent:#f04a56;--wrn-color-accent-contrast:#21040a}\n"));
  const gameHtml = files.get(`atlas/versions/${ATLAS_VERSION}/index.html`).toString('utf8');
  const csp = gameHtml.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1];
  if (!csp || /[\r\n]/.test(csp)) throw Error('Atlas CSP missing');
  const wrapperCsp = files.get('atlas/index.html').toString('utf8').match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1];
  if (!wrapperCsp || /[\r\n]/.test(wrapperCsp)) throw Error('Atlas wrapper CSP missing');
  // Directory-scoped policy: do not modify the website root policy. The wrapper
  // also has a tighter meta CSP. This is a trusted same-origin runtime, not a
  // hostile-content isolation boundary.
  const policy = (cache, contentPolicy) => Buffer.from([
    'Options -Indexes', 'DirectoryIndex index.html',
    'AddType text/javascript .js', 'AddType text/css .css', 'AddType application/geo+json .geojson',
    'AddType image/svg+xml .svg', 'AddType audio/mpeg .mp3', 'AddType audio/ogg .ogg',
    'AddType application/octet-stream .pmtiles', 'AddType application/manifest+json .webmanifest',
    '<IfModule mod_headers.c>',
    ...['Content-Security-Policy','X-Frame-Options','X-Content-Type-Options','Referrer-Policy','Permissions-Policy','Cache-Control'].flatMap(name=>[`Header onsuccess unset ${name}`,`Header always unset ${name}`]),
    `Header always set Content-Security-Policy "${contentPolicy}; frame-ancestors 'self'"`,
    'Header always set X-Frame-Options "SAMEORIGIN"',
    'Header always set X-Content-Type-Options "nosniff"',
    'Header always set Referrer-Policy "same-origin"',
    'Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"',
    `Header always set Cache-Control "${cache}"`, '</IfModule>', '',
  ].join('\n'));
  files.set('atlas/.htaccess', policy('no-cache', wrapperCsp));
  files.set(`atlas/versions/${ATLAS_VERSION}/.htaccess`, policy('public, max-age=31536000, immutable', csp));
  const manifest = {
    schema: 'wrn.website-atlas-package.v1', route: '/atlas/', version: ATLAS_VERSION,
    sourceCommit: SOURCE_COMMIT, snapshotManifestSha256: SNAPSHOT_SHA256,
    snapshotFiles: 201, snapshotBytes: total, websiteShellIncluded: false,
    autoStart: false, publicationPerformed: false, publicationAuthorizedByPackage: false,
    mediaApproval: snapshot.mediaApproval,
    files: [...files].map(([relative, bytes]) => ({path:relative,bytes:bytes.length,sha256:hash(bytes)})).sort((a,b)=>a.path.localeCompare(b.path)),
  };
  return {files,manifest};
}
export async function buildWebsiteAtlasPackage({snapshotRoot, outputRoot}) {
  const prepared = await prepareWebsiteAtlasPackage({snapshotRoot});
  await fs.mkdir(outputRoot); // Exclusive output; never overwrite a frozen release.
  for (const [relative, bytes] of prepared.files) {
    const destination = path.join(outputRoot, relative);
    await fs.mkdir(path.dirname(destination), {recursive:true});
    await fs.writeFile(destination, bytes, {flag:'wx'});
  }
  await fs.writeFile(path.join(outputRoot,'atlas-package.manifest.json'), JSON.stringify(prepared.manifest,null,2)+'\n',{flag:'wx'});
  return prepared.manifest;
}
