import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  prepareProductionContentDelivery,
  productionDeliveryEndpoint,
  productionDeliveryLedgerSchema,
} from './prepare-production-content-delivery.mjs';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const acceptedInput = path.join(
  workspace,
  'docs/evidence/WRN-PRODUCTION-ARTICLE-PILOT-2026-09-10/production-build-input.json',
);
const node = process.execPath;
const generatedAt = '2026-09-10T06:51:40.000Z';
const v3Input = path.join(
  workspace,
  'docs/evidence/WRN-NEWS-SIX-ARTICLE-INPUT-2026-09-11/candidate-1789065672080/production-build-input-v3.json',
);

async function fresh(label) {
  await mkdir(path.join(workspace, 'test-results'), { recursive: true });
  return mkdtemp(path.join(workspace, 'test-results', `${label}-${randomUUID()}-`));
}
async function files(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) result.push(...(await files(root, absolute)));
    else if (entry.isFile()) {
      const bytes = await readFile(absolute);
      result.push({
        path: path.relative(root, absolute).split(path.sep).join('/'),
        bytes: bytes.byteLength,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
  return result.toSorted((left, right) => left.path.localeCompare(right.path));
}
async function runGenesis(root, output = 'delivery') {
  return prepareProductionContentDelivery({
    buildInputPath: acceptedInput,
    previousLedgerPath: null,
    generatedAt,
    outputDirectory: path.join(root, output),
    trustedWorkspaceRoot: workspace,
  });
}
function junction(link, target) {
  const result = spawnSync('cmd.exe', ['/d', '/c', 'mklink', '/J', link, target], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

test('packages the actual two-admitted-article input deterministically and puts current.json last', async () => {
  const root = await fresh('delivery-positive');
  const first = await runGenesis(root, 'first');
  await runGenesis(root, 'second');
  const firstFiles = await files(path.join(root, 'first'));
  const secondFiles = await files(path.join(root, 'second'));
  assert.deepEqual(firstFiles, secondFiles);
  assert.equal(first.ledger.schema, productionDeliveryLedgerSchema);
  assert.equal(first.ledger.entries.length, 1);
  assert.equal(first.ledger.entries[0].articleIds.length, 2);
  assert.equal(first.manifest.endpointBase, productionDeliveryEndpoint);
  assert.equal(first.manifest.files.length, 14);
  assert.equal(
    first.manifest.activationOrder.at(-1),
    'activate/wrn-production-content/current.json',
  );
  assert.equal(
    first.manifest.files.some((entry) => entry.path.includes('.wrn-')),
    false,
  );
  assert.deepEqual(
    JSON.parse(await readFile(path.join(root, 'first', 'next-ledger.json'), 'utf8')),
    first.ledger,
  );
});

test('packages a sequence-one derivative of the SHA-bound six-article V3 input with pointer-last activation', async () => {
  const root = await fresh('delivery-v3');
  const input = JSON.parse(await readFile(v3Input, 'utf8'));
  input.sequence = 1;
  const genesis = path.join(root, 'v3-genesis.json');
  await writeFile(genesis, JSON.stringify(input));
  const result = await prepareProductionContentDelivery({
    buildInputPath: genesis,
    previousLedgerPath: null,
    generatedAt: '2026-09-11T00:00:00.000Z',
    outputDirectory: path.join(root, 'v3'),
    trustedWorkspaceRoot: workspace,
  });
  assert.equal(result.ledger.entries[0].articleIds.length, 6);
  assert.equal(
    result.manifest.activationOrder.at(-1),
    'activate/wrn-production-content/current.json',
  );
});

test('chains a later revision to exact ledger bytes without discarding identities or safety', async () => {
  const root = await fresh('delivery-follow-up');
  await runGenesis(root, 'first');
  const input = JSON.parse(await readFile(acceptedInput, 'utf8'));
  input.sequence = 2;
  input.releaseRevision = 'wrn-production-eff-2026-09-10-v2';
  const secondInput = path.join(root, 'second-input.json');
  await writeFile(secondInput, `${JSON.stringify(input)}\n`, 'utf8');
  const result = await prepareProductionContentDelivery({
    buildInputPath: secondInput,
    previousLedgerPath: path.join(root, 'first', 'next-ledger.json'),
    generatedAt: '2026-09-10T07:00:00.000Z',
    outputDirectory: path.join(root, 'second'),
    trustedWorkspaceRoot: workspace,
  });
  assert.equal(result.ledger.highestSequence, 2);
  assert.equal(result.ledger.entries.length, 2);
  assert.equal(
    result.ledger.previousLedgerSha256,
    createHash('sha256')
      .update(await readFile(path.join(root, 'first', 'next-ledger.json')))
      .digest('hex'),
  );
  assert.deepEqual(
    result.ledger.safetyLedger,
    JSON.parse(await readFile(path.join(root, 'first', 'next-ledger.json'), 'utf8')).safetyLedger,
  );
});

test('rejects malformed, duplicate-ID and revoked-ID-loss ledgers before creating an output', async () => {
  const root = await fresh('delivery-negative-ledger');
  await runGenesis(root, 'first');
  const original = JSON.parse(await readFile(path.join(root, 'first', 'next-ledger.json'), 'utf8'));
  const malformed = path.join(root, 'malformed.json');
  await writeFile(malformed, '{"schema":"wrong"}', 'utf8');
  await assert.rejects(
    prepareProductionContentDelivery({
      buildInputPath: acceptedInput,
      previousLedgerPath: malformed,
      generatedAt,
      outputDirectory: path.join(root, 'malformed-output'),
      trustedWorkspaceRoot: workspace,
    }),
  );
  const duplicate = structuredClone(original);
  duplicate.entries[0].articleIds = [
    duplicate.entries[0].articleIds[0],
    duplicate.entries[0].articleIds[0],
  ];
  const duplicatePath = path.join(root, 'duplicate.json');
  await writeFile(duplicatePath, JSON.stringify(duplicate), 'utf8');
  await assert.rejects(
    prepareProductionContentDelivery({
      buildInputPath: acceptedInput,
      previousLedgerPath: duplicatePath,
      generatedAt,
      outputDirectory: path.join(root, 'duplicate-output'),
      trustedWorkspaceRoot: workspace,
    }),
  );
  const revoked = structuredClone(original);
  revoked.safetyLedger = {
    revision: revoked.safetyLedger.revision + 1,
    revokedIds: ['wrn-art-00000000000000000000000000000000'],
  };
  revoked.entries[0].safetyRevision = revoked.safetyLedger.revision;
  const revokedPath = path.join(root, 'revoked-loss.json');
  await writeFile(revokedPath, JSON.stringify(revoked), 'utf8');
  await assert.rejects(
    prepareProductionContentDelivery({
      buildInputPath: acceptedInput,
      previousLedgerPath: revokedPath,
      generatedAt: '2026-09-10T07:00:00.000Z',
      outputDirectory: path.join(root, 'revoked-output'),
      trustedWorkspaceRoot: workspace,
    }),
  );
  assert.equal(
    await readdir(root).then((entries) => entries.some((entry) => entry.endsWith('-output'))),
    false,
  );
});

test('rejects an implicit genesis and preserves an existing empty caller target', async () => {
  const root = await fresh('delivery-target');
  await assert.rejects(
    prepareProductionContentDelivery({
      buildInputPath: acceptedInput,
      generatedAt,
      outputDirectory: path.join(root, 'missing-ledger'),
      trustedWorkspaceRoot: workspace,
    }),
  );
  const existing = path.join(root, 'existing');
  await mkdir(existing);
  await assert.rejects(
    prepareProductionContentDelivery({
      buildInputPath: acceptedInput,
      previousLedgerPath: null,
      generatedAt,
      outputDirectory: existing,
      trustedWorkspaceRoot: workspace,
    }),
  );
  assert.deepEqual(await readdir(existing), []);
});

test('rejects workspace traversal, symbolic-link input and a full 512-entry ledger', async (t) => {
  const root = await fresh('delivery-boundaries');
  await assert.rejects(
    prepareProductionContentDelivery({
      buildInputPath: path.resolve(workspace, '..', 'outside-input.json'),
      previousLedgerPath: null,
      generatedAt,
      outputDirectory: path.join(root, 'traversal'),
      trustedWorkspaceRoot: workspace,
    }),
  );
  const linkedInput = path.join(root, 'linked-input.json');
  try {
    await symlink(acceptedInput, linkedInput, 'file');
    await assert.rejects(
      prepareProductionContentDelivery({
        buildInputPath: linkedInput,
        previousLedgerPath: null,
        generatedAt,
        outputDirectory: path.join(root, 'symlink'),
        trustedWorkspaceRoot: workspace,
      }),
    );
  } catch (error) {
    if (!(error && typeof error === 'object' && error.code === 'EPERM')) throw error;
    t.diagnostic(
      'Windows sandbox denied symlink creation; lstat rejection is enforced by the same bounded input reader.',
    );
  }
  await runGenesis(root, 'first');
  const source = JSON.parse(await readFile(path.join(root, 'first', 'next-ledger.json'), 'utf8'));
  source.entries = Array.from({ length: 512 }, (_, index) => ({
    ...source.entries[0],
    sequence: index + 1,
    releaseRevision: `wrn-production-eff-2026-09-10-${index + 1}`,
    descriptorSha256: `${index + 1}`.padStart(64, '0'),
    generatedAt: new Date(Date.parse(generatedAt) + index * 1000).toISOString(),
  }));
  source.highestSequence = 512;
  source.previousLedgerSha256 = 'a'.repeat(64);
  source.safetyLedger.revision = source.entries[0].safetyRevision;
  const fullLedger = path.join(root, 'full-ledger.json');
  await writeFile(fullLedger, JSON.stringify(source), 'utf8');
  const input = JSON.parse(await readFile(acceptedInput, 'utf8'));
  input.sequence = 513;
  input.releaseRevision = 'wrn-production-eff-2026-09-10-513';
  const followUpInput = path.join(root, 'follow-up-input.json');
  await writeFile(followUpInput, JSON.stringify(input), 'utf8');
  await assert.rejects(
    prepareProductionContentDelivery({
      buildInputPath: followUpInput,
      previousLedgerPath: fullLedger,
      generatedAt: new Date(Date.parse(generatedAt) + 512000).toISOString(),
      outputDirectory: path.join(root, 'overflow'),
      trustedWorkspaceRoot: workspace,
    }),
    /Ledgerlimit von 512/u,
  );
  assert.equal((await readdir(root)).includes('overflow'), false);
});

test('CLI requires explicit genesis and succeeds from a non-root cwd', () => {
  const root = path.join(workspace, 'test-results', `delivery-cli-${randomUUID()}`);
  const tool = path.join(workspace, 'tools', 'prepare-production-content-delivery.mjs');
  const common = [
    '--input',
    acceptedInput,
    '--output',
    root,
    '--generated-at',
    generatedAt,
    '--workspace',
    workspace,
  ];
  const missing = spawnSync(node, [tool, ...common], {
    cwd: path.join(workspace, 'apps/website'),
    encoding: 'utf8',
  });
  assert.notEqual(missing.status, 0);
  const missingValue = spawnSync(node, [tool, '--genesis', '--input', acceptedInput], {
    cwd: path.join(workspace, 'apps/website'),
    encoding: 'utf8',
  });
  assert.notEqual(missingValue.status, 0);
  for (const invalid of [
    ['--unknown', 'x'],
    ['--output', root],
    ['--input', acceptedInput],
    ['--input', '--output'],
  ]) {
    const result = spawnSync(node, [tool, ...common, '--genesis', ...invalid], {
      cwd: path.join(workspace, 'apps/website'),
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.equal(existsSync(root), false);
  }
  const flagValue = [...common];
  flagValue[flagValue.indexOf('--input') + 1] = '--output';
  const rejectedValue = spawnSync(node, [tool, ...flagValue, '--genesis'], {
    cwd: path.join(workspace, 'apps/website'),
    encoding: 'utf8',
  });
  assert.notEqual(rejectedValue.status, 0);
  assert.equal(existsSync(root), false);
  const success = spawnSync(node, [tool, ...common, '--genesis'], {
    cwd: path.join(workspace, 'apps/website'),
    encoding: 'utf8',
  });
  assert.equal(success.status, 0, success.stderr);
  assert.match(success.stdout, /current\.json is last/u);
});

test('allows an absent output directly under the canonical trusted workspace root', async () => {
  const root = await fresh('delivery-direct-root');
  const input = path.join(root, 'input.json');
  await writeFile(input, await readFile(acceptedInput), { flag: 'wx' });
  const result = await prepareProductionContentDelivery({
    buildInputPath: input,
    previousLedgerPath: null,
    generatedAt,
    outputDirectory: path.join(root, 'delivery'),
    trustedWorkspaceRoot: root,
  });
  assert.equal(result.manifest.sequence, 1);
});

test('rejects real Windows junction ancestors for input, ledger and output parent', async () => {
  const root = await fresh('delivery-junction');
  const inputLink = path.join(root, 'input-link');
  junction(inputLink, path.dirname(acceptedInput));
  await assert.rejects(
    prepareProductionContentDelivery({
      buildInputPath: path.join(inputLink, path.basename(acceptedInput)),
      previousLedgerPath: null,
      generatedAt,
      outputDirectory: path.join(root, 'input-junction-output'),
      trustedWorkspaceRoot: workspace,
    }),
  );
  await runGenesis(root, 'first');
  const ledgerLink = path.join(root, 'ledger-link');
  junction(ledgerLink, path.join(root, 'first'));
  const input = JSON.parse(await readFile(acceptedInput, 'utf8'));
  input.sequence = 2;
  input.releaseRevision = 'wrn-production-eff-2026-09-10-junction';
  const follow = path.join(root, 'follow.json');
  await writeFile(follow, JSON.stringify(input));
  await assert.rejects(
    prepareProductionContentDelivery({
      buildInputPath: follow,
      previousLedgerPath: path.join(ledgerLink, 'next-ledger.json'),
      generatedAt: '2026-09-10T07:00:00.000Z',
      outputDirectory: path.join(root, 'ledger-junction-output'),
      trustedWorkspaceRoot: workspace,
    }),
  );
  const parentLink = path.join(root, 'output-link');
  junction(parentLink, path.join(workspace, 'test-results'));
  await assert.rejects(
    prepareProductionContentDelivery({
      buildInputPath: acceptedInput,
      previousLedgerPath: null,
      generatedAt,
      outputDirectory: path.join(parentLink, 'outside-output'),
      trustedWorkspaceRoot: workspace,
    }),
  );
  assert.equal(
    await readdir(path.join(workspace, 'test-results')).then((items) =>
      items.includes('outside-output'),
    ),
    false,
  );
});

test('wx collision retains injected bytes and returns no ready package', async () => {
  const root = await fresh('delivery-collision');
  let collision;
  await assert.rejects(
    prepareProductionContentDelivery({
      buildInputPath: acceptedInput,
      previousLedgerPath: null,
      generatedAt,
      outputDirectory: path.join(root, 'delivery'),
      trustedWorkspaceRoot: workspace,
      beforeWrite: async ({ target, path: relative }) => {
        if (relative.endsWith('/articles.json')) {
          collision = target;
          await writeFile(target, 'retained-collision', { flag: 'wx' });
        }
      },
    }),
  );
  assert.equal(await readFile(collision, 'utf8'), 'retained-collision');
  assert.equal((await readdir(root)).includes('delivery'), false);
});

test('rejects ledger genesis and previous-hash contradictions before a ready output', async () => {
  const root = await fresh('delivery-ledger-shapes');
  await runGenesis(root, 'first');
  const source = JSON.parse(await readFile(path.join(root, 'first', 'next-ledger.json'), 'utf8'));
  const cases = [
    [
      'starts-five',
      { ...source, highestSequence: 5, entries: [{ ...source.entries[0], sequence: 5 }] },
    ],
    ['one-hash', { ...source, previousLedgerSha256: 'a'.repeat(64) }],
    [
      'many-null',
      {
        ...source,
        highestSequence: 2,
        entries: [
          source.entries[0],
          {
            ...source.entries[0],
            sequence: 2,
            releaseRevision: 'wrn-production-eff-2026-09-10-many',
            descriptorSha256: 'b'.repeat(64),
            generatedAt: '2026-09-10T07:00:00.000Z',
          },
        ],
      },
    ],
  ];
  for (const [name, ledger] of cases) {
    const ledgerPath = path.join(root, `${name}.json`);
    await writeFile(ledgerPath, JSON.stringify(ledger));
    await assert.rejects(
      prepareProductionContentDelivery({
        buildInputPath: acceptedInput,
        previousLedgerPath: ledgerPath,
        generatedAt: '2026-09-10T08:00:00.000Z',
        outputDirectory: path.join(root, `${name}-output`),
        trustedWorkspaceRoot: workspace,
      }),
    );
  }
});
