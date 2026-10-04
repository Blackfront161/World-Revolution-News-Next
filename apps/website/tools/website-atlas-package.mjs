import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ATLAS_VERSION } from './atlas-route/atlas-contract.js';

export const SNAPSHOT_SHA256 = 'b14a48b7682f9a153c4e8e8abaca3ab4ae3a45846b4d5eabf33b6db539b20968';
export const SOURCE_COMMIT = '9029461a94f23042b9ff8ad7ba46594c557c7dbc';
const hostFiles = ['index.html', 'atlas-host.css', 'atlas-host.js', 'atlas-contract.js'];
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
  if (hash(manifestBytes) !== SNAPSHOT_SHA256) throw Error('Atlas snapshot manifest differs from admitted r76');
  const snapshot = JSON.parse(manifestBytes);
  if (snapshot.version !== ATLAS_VERSION || snapshot.files.length !== 199 || snapshot.bytes !== 104318011) throw Error('Atlas snapshot contract differs');
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
    snapshotFiles: 199, snapshotBytes: total, websiteShellIncluded: false,
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
