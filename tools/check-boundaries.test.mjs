import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { assertWorkspaceBoundaries, findBoundaryViolations } from './check-boundaries.mjs';

function withWorkspaceFixture(files, callback) {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'wrn-boundaries-'));
  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const target = path.join(fixtureRoot, relativePath);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, content, 'utf8');
    }
    callback(fixtureRoot);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

test('accepts declared public package imports', () => {
  withWorkspaceFixture(
    {
      'apps/mobile/src/main.ts': 'import { shellStates } from "@wrn/domain";\nvoid shellStates;\n',
      'apps/website/src/main.ts':
        'import { foundationContractVersion } from "@wrn/api-contracts";\nvoid foundationContractVersion;\n',
      'packages/api-contracts/src/index.ts':
        'import { parseShellState } from "@wrn/domain";\nvoid parseShellState;\n',
      'packages/test-support/src/index.ts':
        'import { foundationContractVersion } from "@wrn/api-contracts";\nvoid foundationContractVersion;\n',
    },
    (fixtureRoot) => {
      assert.deepEqual(findBoundaryViolations(fixtureRoot), []);
      assert.doesNotThrow(() => assertWorkspaceBoundaries(fixtureRoot));
    },
  );
});

test('rejects direct and path-based app-to-app imports', () => {
  withWorkspaceFixture(
    {
      'apps/mobile/src/main.ts': 'export {};\n',
      'apps/website/src/main.ts': 'import "@wrn/mobile";\nimport "../../mobile/src/main.ts";\n',
    },
    (fixtureRoot) => {
      const violations = findBoundaryViolations(fixtureRoot);
      assert.equal(violations.length, 2);
      assert.throws(() => assertWorkspaceBoundaries(fixtureRoot), /Apps duerfen einander/);
    },
  );
});

test('rejects package-to-app imports and source-path bypasses', () => {
  withWorkspaceFixture(
    {
      'apps/mobile/src/main.ts': 'export {};\n',
      'packages/domain/src/index.ts':
        'import "@wrn/mobile";\nimport "../../../apps/mobile/src/main.ts";\n',
      'packages/api-contracts/src/index.ts': 'import "../../domain/src/index.ts";\n',
    },
    (fixtureRoot) => {
      const absoluteAppPath = path
        .join(fixtureRoot, 'apps', 'mobile', 'src', 'main.ts')
        .replaceAll('\\', '/');
      writeFileSync(
        path.join(fixtureRoot, 'packages', 'domain', 'src', 'absolute-bypass.ts'),
        `import "${absoluteAppPath}";\n`,
        'utf8',
      );

      const violations = findBoundaryViolations(fixtureRoot);
      assert.equal(violations.length, 4);
      assert.match(violations.map(({ rule }) => rule).join('\n'), /Pakete duerfen/);
      assert.match(violations.map(({ rule }) => rule).join('\n'), /Paketgrenzen/);
    },
  );
});

test('rejects platform and provider imports from pure packages', () => {
  withWorkspaceFixture(
    {
      'packages/domain/src/index.ts': 'import "react";\nimport "@capacitor/core";\n',
      'packages/api-contracts/src/index.ts':
        'import "firebase/app";\nimport "@azure/ai-translation-text";\n',
    },
    (fixtureRoot) => {
      const violations = findBoundaryViolations(fixtureRoot);
      assert.equal(violations.length, 4);
      assert.ok(violations.every(({ rule }) => rule.includes('unabhaengig')));
    },
  );
});
