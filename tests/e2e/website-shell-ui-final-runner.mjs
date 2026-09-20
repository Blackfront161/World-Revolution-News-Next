import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const nodeDirectory =
  'C:/Users/patri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node';
const pnpm = `${nodeDirectory}/node_modules/pnpm/bin/pnpm.mjs`;
const [kind, detail] = process.argv.slice(2);
const gates = [
  'toolchain:check',
  'format',
  'lint',
  'typecheck',
  'check:fixture-provenance',
  'check:brand-assets',
  'test:unit',
  'build:mobile',
  'build:website',
  'check:release-boundaries',
];

if (!['core', 'gate', 'root', 'ui'].includes(kind ?? ''))
  throw new Error('usage: website-shell-ui-final-runner.mjs <core|gate|root|ui> [gate|spec]');
if (kind === 'gate' && !gates.includes(detail ?? '')) throw new Error('unknown final gate');
if (kind === 'ui' && (!detail || !detail.startsWith('tests/e2e/website-shell-ui-')))
  throw new Error('ui runs require one website-shell-ui test path');

const label = `${kind}${detail ? `-${path.basename(detail, path.extname(detail))}` : ''}`;
const runId = `${label}-${process.pid}-${Date.now()}`;
const run = path.join(root, 'docs/evidence/WRN-G3-015/p3-final/runs', runId);
const artifacts = path.join(run, 'artifacts');
await mkdir(artifacts, { recursive: true });

const sourceFiles = [
  'package.json',
  'pnpm-lock.yaml',
  'playwright.config.ts',
  'tests/e2e/website-shell-ui-final-runner.mjs',
];
if (kind === 'core')
  sourceFiles.push(
    'tests/e2e/website-shell-core-matrix.mjs',
    'tests/e2e/website-shell-core-helper.mjs',
    'apps/website/tools/build-offline-shell.mjs',
    'apps/website/src/offline-shell/worker-template.mjs',
    'apps/website/src/offline-shell/worker-runtime.mjs',
    'apps/website/src/offline-shell/protocol.mjs',
    'apps/website/src/offline-shell/protocol.d.mts',
    'apps/website/src/offline-shell/adapter.ts',
    'apps/website/src/offline-shell/browser-platform.ts',
  );
if (kind === 'ui') sourceFiles.push(detail);

async function hashSources() {
  const hashes = {};
  for (const file of sourceFiles) {
    const bytes = await readFile(path.join(root, file));
    hashes[file] = createHash('sha256').update(bytes).digest('hex');
  }
  return hashes;
}

const command =
  kind === 'core'
    ? [process.execPath, 'tests/e2e/website-shell-core-matrix.mjs']
    : kind === 'gate'
      ? [process.execPath, pnpm, '--config.enableGlobalVirtualStore=false', 'run', detail]
      : [
          process.execPath,
          'node_modules/@playwright/test/cli.js',
          'test',
          ...(kind === 'ui' ? [detail] : []),
          '--workers=2',
          '--reporter=json',
          `--output=${artifacts}`,
        ];
const startedAt = new Date().toISOString();
const runRecord = {
  runId,
  kind,
  detail: detail ?? null,
  startedAt,
  node: process.version,
  nodeExecutable: process.execPath,
  command,
  sourceBefore: await hashSources(),
};
await writeFile(path.join(run, 'run.json'), JSON.stringify(runRecord, null, 2));

const child = spawn(command[0], command.slice(1), {
  cwd: root,
  env: {
    ...process.env,
    PATH: `${nodeDirectory};${process.env.PATH ?? ''}`,
    pnpm_config_verify_deps_before_run: 'error',
    pnpm_config_pm_on_fail: 'ignore',
    ...(kind === 'root' || kind === 'ui'
      ? { PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(run, 'report.json') }
      : {}),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let stdout = '';
let stderr = '';
child.stdout.on('data', (chunk) => {
  const text = String(chunk);
  stdout += text;
  process.stdout.write(text);
});
child.stderr.on('data', (chunk) => {
  const text = String(chunk);
  stderr += text;
  process.stderr.write(text);
});
const exitCode = await new Promise((resolve, reject) => {
  child.once('error', reject);
  child.once('close', (code) => resolve(code ?? 1));
});
await writeFile(path.join(run, 'stdout.txt'), stdout);
await writeFile(path.join(run, 'stderr.txt'), stderr);
await writeFile(
  path.join(run, 'run.json'),
  JSON.stringify(
    {
      ...runRecord,
      finishedAt: new Date().toISOString(),
      exitCode,
      sourceAfter: await hashSources(),
    },
    null,
    2,
  ),
);

const artifactHashes = {};
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (path.basename(file) !== 'artifact-hashes.json')
      artifactHashes[path.relative(run, file).replaceAll('\\', '/')] = createHash('sha256')
        .update(await readFile(file))
        .digest('hex');
  }
}
await collect(run);
await writeFile(path.join(run, 'artifact-hashes.json'), JSON.stringify(artifactHashes, null, 2));
console.log(
  JSON.stringify({
    run,
    exitCode,
    sourceUnchanged: JSON.stringify(runRecord.sourceBefore) === JSON.stringify(await hashSources()),
  }),
);
process.exitCode = exitCode;
