import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflow = await readFile(
  path.join(workspace, '.github/workflows/wrn-content-supply.yml'),
  'utf8',
);

test('scheduled content supply is bounded, public-only, and does not publish', () => {
  assert.match(workflow, /schedule:\s*\n\s*- cron: '17 \*\/6 \* \* \*'/u);
  assert.match(workflow, /workflow_dispatch:/u);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/u);
  assert.match(workflow, /if: github\.event\.repository\.private == false/u);
  assert.match(workflow, /timeout-minutes: 8/u);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/u);
  assert.match(workflow, /Receipt SHA-256/u);
  assert.match(workflow, /publicationPerformed !== false/u);
  assert.match(workflow, /cancel-in-progress: false/u);
  assert.match(workflow, /persist-credentials: false/u);
  assert.match(workflow, /tools\/run-legacy-news-supply\.mjs/u);
  assert.doesNotMatch(
    workflow,
    /upload-artifact|actions\/cache|retention-days|wrangler|deploy|activate|gh\s+api|GITHUB_TOKEN/u,
  );
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
