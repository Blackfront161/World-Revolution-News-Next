import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflow = await readFile(
  path.join(workspace, '.github/workflows/wrn-content-supply.yml'),
  'utf8',
);
const manifest = JSON.parse(
  await readFile(
    path.join(workspace, 'docs/evidence/WRN-LIVE-DIRECTORY-SUPPLY-2026-09-25/manifest.json'),
    'utf8',
  ),
);
const hashManifest = JSON.parse(
  await readFile(
    path.join(workspace, 'docs/evidence/WRN-LIVE-DIRECTORY-SUPPLY-2026-09-25/hash-manifest.json'),
    'utf8',
  ),
);

test('scheduled content supply is bounded, private-repository compatible, and does not publish', () => {
  assert.match(workflow, /schedule:\s*\n\s*- cron: '17 \*\/6 \* \* \*'/u);
  assert.match(workflow, /workflow_dispatch:/u);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/u);
  assert.doesNotMatch(workflow, /github\.event\.repository\.private == false/u);
  assert.match(workflow, /timeout-minutes: 8/u);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/u);
  assert.match(workflow, /Receipt SHA-256/u);
  assert.match(workflow, /publicationPerformed !== false/u);
  assert.match(workflow, /receipt\?\.dryRun !== true/u);
  assert.match(workflow, /DRY_RUN/u);
  assert.match(workflow, /github\.event_name != 'workflow_dispatch'/u);
  assert.match(workflow, /\[\[ "\$DRY_RUN" == "true" \]\]/u);
  assert.match(workflow, /--dry-run/u);
  assert.match(workflow, /Client pointer transfer: false/u);
  assert.match(workflow, /cancel-in-progress: false/u);
  assert.match(workflow, /persist-credentials: false/u);
  assert.match(workflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\.0\.1/u);
  assert.match(
    workflow,
    /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7\.0\.0/u,
  );
  assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v\d/u);
  assert.match(workflow, /tools\/run-legacy-news-supply\.mjs/u);
  assert.match(
    workflow,
    /actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7\.0\.1/u,
  );
  assert.match(workflow, /retention-days: 3/u);
  assert.match(workflow, /include-hidden-files: true/u);
  assert.doesNotMatch(workflow, /actions\/cache|wrangler|deploy|activate|gh\s+api|GITHUB_TOKEN/u);
  assert.match(workflow, /tools\/check-current-regional-events\.mjs --minimum-hours 48/u);
  assert.match(workflow, /wrn\.regional-events-freshness-check\.v1/u);
  assert.match(workflow, /regional-events-status\.json/u);
  assert.match(workflow, /Renewal lead time/u);
  assert.match(workflow, /prepare-live-content-directory\.mjs/u);
  assert.match(workflow, /cmp --silent "\$mobile" "\$website"/u);
  assert.match(workflow, /wrn\.live-content-directory-receipt\.v1/u);
  assert.match(workflow, /current metadata-only review packet prepared/u);
  assert.match(workflow, /receipt\?\.publicationPerformed !== false/u);
  assert.doesNotMatch(workflow, /directory_commit" != "\$UPSTREAM_COMMIT"/u);
});

test('the default resolves main then produces awaiting-admission without a reviewed batch', () => {
  assert.match(
    workflow,
    /git ls-remote https:\/\/github\.com\/Blackfront161\/Revolution-News-Data\.git refs\/heads\/main/u,
  );
  assert.match(workflow, /timeout 20s git ls-remote/u);
  assert.match(workflow, /INCLUDE_REVIEWED_V5/u);
  assert.match(workflow, /if \[\[ "\$INCLUDE_REVIEWED_V5" == "true" \]\]; then/u);
  assert.match(
    workflow,
    /--previous "\$previous" --previous-sha256 "\$previous_sha256" --ledger "\$ledger" --reviewed "\$reviewed" --bindings "\$bindings"/u,
  );
  assert.match(workflow, /\[\[ "\$REQUESTED_COMMIT" =~ \^\[a-f0-9\]\{40\}\$ \]\]/u);
  assert.doesNotMatch(workflow, /\$\{\{ inputs\.upstream_commit \}\}" =~/u);
});

test('the versioned operations manifest describes the same local-only dry-run contract', () => {
  assert.deepEqual(manifest, {
    schema: 'wrn.live-directory-supply-manifest.v1',
    version: 1,
    workflowPath: '.github/workflows/wrn-content-supply.yml',
    schedule: '17 */6 * * *',
    mode: 'dry-run-review-artifact-only',
    rights: 'metadata-and-links',
    upstream: {
      repository: 'Blackfront161/Revolution-News-Data',
      ref: 'main',
      commitBinding: 'resolved-40-hex-commit',
    },
    baselinePolicy: 'preserve-validated-app-observations',
    currentPolicy: 'replace-github-observations-at-exact-commit',
    localPipeline: [
      'bounded-status-feed-and-source-registry',
      'freshness-and-publication-validation',
      'metadata-only-directory-reconciliation',
      'stable-id-and-contract-validation',
      'immutable-snapshot-and-pointer-last-package',
      'pinned-regional-events-freshness-gate',
      'short-lived-review-artifact',
    ],
    guards: [
      'contents-read-only',
      'credential-free-no-redirect-fetch',
      'single-shared-thirty-second-deadline',
      'three-mebibyte-directory-limit',
      'no-full-text-or-image-copy',
      'forty-eight-hour-regional-renewal-window',
      'no-publication-or-client-pointer-transfer',
    ],
    statusReceipts: [
      'wrn.continuous-legacy-news-supply-run.v1',
      'wrn.live-content-directory-receipt.v1',
      'wrn.regional-events-freshness-check.v1',
    ],
  });
});

test('the hash manifest binds the packet to its source commit and exact SHA-256 entries', async () => {
  assert.match(hashManifest.sourceCommit, /^[a-f0-9]{40}$/u);
  assert.equal(hashManifest.schema, 'wrn.live-directory-supply-hash-manifest.v1');
  assert.equal(hashManifest.version, 1);
  assert.equal(hashManifest.files.length, 12);
  for (const entry of hashManifest.files) {
    assert.match(entry.path, /^(?:package\.json$|(?:\.github|tools|docs\/evidence)\/)/u);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/u);
    const bytes = await readFile(path.join(workspace, entry.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, entry.path);
  }
});
