import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const testRoot = process.env.WRN_G3_015_TEST_CWD ?? root;
const [spec, project = 'website-390x844', label = 'manual'] = process.argv.slice(2);
if (!spec) throw new Error('usage: website-shell-ui-runner.mjs <spec> [project] [label]');

const runId = `${label}-${process.pid}-${Date.now()}`;
const run = path.join(root, 'docs/evidence/WRN-G3-015/p3/runs', runId);
const output = path.join(run, 'playwright-output');
await mkdir(output, { recursive: true });

const command = [
  'node_modules/@playwright/test/cli.js',
  'test',
  spec,
  `--project=${project}`,
  '--workers=1',
  '--output',
  output,
];
const startedAt = new Date().toISOString();
const child = spawn(process.execPath, command, {
  cwd: testRoot,
  env: {
    ...process.env,
    verify_deps_before_run: 'error',
    WRN_G3_015_UI_REVISION: runId,
    WRN_G3_015_P3_RUN_DIRECTORY: run,
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

const source = {};
for (const file of [spec, 'tests/e2e/website-shell-ui-runner.mjs']) {
  const sourceRoot = file === 'tests/e2e/website-shell-ui-runner.mjs' ? root : testRoot;
  const bytes = await readFile(path.join(sourceRoot, file));
  source[file] = createHash('sha256').update(bytes).digest('hex');
}
await writeFile(
  path.join(run, 'run.json'),
  JSON.stringify(
    {
      runId,
      startedAt,
      finishedAt: new Date().toISOString(),
      node: process.version,
      testRoot,
      command: [process.execPath, ...command],
      exitCode,
      source,
    },
    null,
    2,
  ),
);

const hashes = {};
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(absolute);
    else if (path.basename(absolute) !== 'artifact-hashes.json') {
      hashes[path.relative(run, absolute).replaceAll('\\', '/')] = createHash('sha256')
        .update(await readFile(absolute))
        .digest('hex');
    }
  }
}
await collect(run);
await writeFile(path.join(run, 'artifact-hashes.json'), JSON.stringify(hashes, null, 2));
process.exitCode = exitCode;
