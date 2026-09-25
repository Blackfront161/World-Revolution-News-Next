import { execFileSync } from 'node:child_process';
import { lstat, mkdir, mkdtemp, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// A clean source snapshot, not a rewrite of the preserved local history.
const sourceRoot = await realpath(process.cwd());
const workRoot = path.join(sourceRoot, 'work');
const sourceCommit = gitText(['rev-parse', 'HEAD']);
const evidenceInputs = [
  'WRN-PO-SCOPE-STATUS-2026-09-10.md',
  'WRN-PRODUCTION-ARTICLE-PILOT-2026-09-10/production-build-input.json',
  'WRN-PRODUCTION-ARTICLE-PILOT-2026-09-10/generated-core-e8506a4/',
  'WRN-NEWS-SIX-ARTICLE-INPUT-2026-09-11/candidate-1789065672080/',
  'WRN-PRODUCTION-IMAGES-ADMISSION-2026-09-10/production-build-input-v2.json',
  'WRN-LEGACY-NEWS-UPDATE-2026-09-14/',
  'WRN-CURRENT-REGIONAL-CONTRACT-2026-09-12/input.json',
  'WRN-ARTICLE-INTAKE-2026-09-20/candidate/',
  'WRN-SCHEDULED-SUPPLY-2026-09-20/',
  'WRN-LIVE-DIRECTORY-SUPPLY-2026-09-25/',
  'WRN-PRE-PLAY-HOSTING-PACKET-2026-09-25/',
  'WRN-REGIONAL-EVENTS-REFRESH-2026-09-25/',
  'WRN-PRE-PLAY-RC-2026-09-25/',
  'WRN-SPORT-FULLTEXT-2026-09-20/candidate/',
  'WRN-FAN-SOURCES-2026-09-20/',
  'WRN-SEPARATE-PLATFORM-2026-09-20/',
];

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: sourceRoot,
    maxBuffer: 24 * 1024 * 1024,
    ...options,
  });
}

function gitText(args) {
  return git(args, { encoding: 'utf8' }).trim();
}

function isInside(root, candidate) {
  return candidate !== root && candidate.startsWith(`${root}${path.sep}`);
}

async function safeExistingDirectory(root, candidate, label) {
  const resolved = path.resolve(candidate);
  if (!isInside(root, resolved)) throw new Error(`${label} lies outside the workspace`);
  const relative = path.relative(root, resolved);
  let cursor = root;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    const entry = await lstat(cursor);
    if (!entry.isDirectory() || entry.isSymbolicLink())
      throw new Error(`${label} uses a link or is not a directory`);
    const physical = await realpath(cursor);
    if (!isInside(root, physical)) throw new Error(`${label} leaves the real workspace`);
  }
  return resolved;
}

async function safeExportParent(root, target, file) {
  const output = path.resolve(target, file);
  if (!isInside(root, output)) throw new Error(`Unsafe export path: ${file}`);
  const relativeParent = path.relative(root, path.dirname(output));
  let cursor = root;
  for (const segment of relativeParent.split(path.sep)) {
    cursor = path.join(cursor, segment);
    try {
      await mkdir(cursor);
    } catch (error) {
      if (!(error && typeof error === 'object' && error.code === 'EEXIST')) throw error;
    }
    const entry = await lstat(cursor);
    if (!entry.isDirectory() || entry.isSymbolicLink())
      throw new Error(`Unsafe export parent: ${file}`);
    const physical = await realpath(cursor);
    if (!isInside(root, physical) && physical !== root)
      throw new Error(`Export parent leaves the temporary snapshot: ${file}`);
  }
  return output;
}

function treeFiles(commit) {
  const entries = git(['ls-tree', '-r', '-z', '--full-tree', commit]).toString('utf8').split('\0');
  return entries.filter(Boolean).map((entry) => {
    const separator = entry.indexOf('\t');
    if (separator < 0) throw new Error('Invalid Git tree entry');
    const [mode, type] = entry.slice(0, separator).split(' ');
    const file = entry.slice(separator + 1);
    if ((mode !== '100644' && mode !== '100755') || type !== 'blob')
      throw new Error(`Unsupported Git tree entry: ${file}`);
    return file;
  });
}

function approved(file) {
  if (file.startsWith('.codex/') || file.startsWith('work/')) return false;
  if (/(^|\/)(node_modules|dist|build|\.gradle|test-results)\//.test(file)) return false;
  if (/\.(apk|aab|jks|keystore|p12|pfx|pem|key|log|tsbuildinfo)$/i.test(file)) return false;
  if (/(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith('.env.example')) return false;
  if (!file.startsWith('docs/evidence/')) return true;
  const relative = file.slice('docs/evidence/'.length);
  return evidenceInputs.some((prefix) => relative === prefix || relative.startsWith(prefix));
}

function assertNoCredentialShape(bytes, file) {
  const text = bytes.toString('utf8');
  if (
    /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AIza[A-Za-z0-9_-]{35}|hf_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(
      text,
    )
  )
    throw new Error(`Credential-shaped value requires review: ${file}`);
}

await safeExistingDirectory(sourceRoot, workRoot, 'Export work directory');
const target = await mkdtemp(path.join(workRoot, 'wrn-platform-export-'));
const targetRoot = await realpath(target);
if (!isInside(sourceRoot, targetRoot))
  throw new Error('Temporary export lies outside the workspace');

const files = [];
for (const file of treeFiles(sourceCommit).filter(approved)) {
  const bytes = git(['show', `${sourceCommit}:${file}`], { maxBuffer: 21 * 1024 * 1024 });
  if (bytes.length > 20 * 1024 * 1024) throw new Error(`Oversized export file: ${file}`);
  assertNoCredentialShape(bytes, file);
  const output = await safeExportParent(targetRoot, targetRoot, file);
  await writeFile(output, bytes, { flag: 'wx' });
  files.push({
    path: file,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}
await writeFile(
  path.join(targetRoot, 'SOURCE-SNAPSHOT.json'),
  JSON.stringify(
    {
      schema: 'wrn.clean-platform-snapshot.v1',
      sourceCommit,
      generatedAt: new Date().toISOString(),
      excluded: [
        'Local agent settings',
        'Historical build/QA archive (preserved locally)',
        'Credentials and build output',
      ],
      files,
    },
    null,
    2,
  ) + '\n',
  { flag: 'wx' },
);
console.log(
  JSON.stringify({
    target: targetRoot,
    sourceCommit,
    files: files.length,
    bytes: files.reduce((sum, file) => sum + file.bytes, 0),
    published: false,
  }),
);
