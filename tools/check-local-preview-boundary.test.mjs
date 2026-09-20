import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkLocalPreviewBoundaries } from './check-local-preview-boundary.mjs';

function withWorkspaceFixture(files, callback) {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'wrn-preview-boundary-'));
  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const absolutePath = path.join(fixtureRoot, relativePath);
      mkdirSync(path.dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, content, 'utf8');
    }

    return callback(fixtureRoot);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function baseFixtureFiles() {
  return {
    'apps/mobile/package.json': JSON.stringify(
      {
        name: '@wrn/mobile',
        dependencies: {
          '@wrn/test-support': 'workspace:*',
        },
      },
      null,
      2,
    ),
    'apps/website/package.json': JSON.stringify(
      {
        name: '@wrn/website',
        dependencies: {
          '@wrn/test-support': 'workspace:*',
        },
      },
      null,
      2,
    ),
    'apps/mobile/src/App.tsx':
      'import { createPinnedLocalNewsfeedFixture } from "@wrn/test-support";\nexport default createPinnedLocalNewsfeedFixture;\n',
    'apps/website/src/App.tsx':
      'import { createPinnedLocalNewsfeedFixture } from "@wrn/test-support";\nexport default createPinnedLocalNewsfeedFixture;\n',
    'apps/mobile/src/helper.ts': 'const x = 1;\n',
    'apps/website/src/helper.ts': 'const x = 2;\n',
  };
}

test('preview mode accepts exact workspace-boundary fixture', () => {
  withWorkspaceFixture(baseFixtureFiles(), (fixtureRoot) => {
    const result = checkLocalPreviewBoundaries(fixtureRoot, { release: false });
    assert.equal(result.ok, true);
    assert.equal(result.violations.length, 0);
  });
});

test('preview mode rejects additional test-support imports outside App.tsx', () => {
  withWorkspaceFixture(
    {
      ...baseFixtureFiles(),
      'apps/mobile/src/bad-feature.ts':
        'import { createPinnedLocalNewsfeedFixture } from "@wrn/test-support";\nexport {};\n',
      'apps/mobile/src/App.tsx':
        'import { createPinnedLocalNewsfeedFixture } from "@wrn/test-support";\nexport default createPinnedLocalNewsfeedFixture;\n',
    },
    (fixtureRoot) => {
      const result = checkLocalPreviewBoundaries(fixtureRoot, { release: false });
      assert.equal(result.ok, false);
      const message = result.violations.map((violation) => violation.message).join('\n');
      assert.match(message, /darf im Preview nur in .*App.tsx importiert werden/i);
    },
  );
});

test('preview mode rejects test-support subpath imports outside App.tsx', () => {
  withWorkspaceFixture(
    {
      ...baseFixtureFiles(),
      'apps/website/src/bad-feature.ts':
        'import { anything } from "@wrn/test-support/internal";\nexport { anything };\n',
    },
    (fixtureRoot) => {
      const result = checkLocalPreviewBoundaries(fixtureRoot, { release: false });
      assert.equal(result.ok, false);
      assert.match(JSON.stringify(result.violations), /bad-feature\.ts/);
    },
  );
});

test('preview mode rejects wrong dependency specifier', () => {
  const files = baseFixtureFiles();
  const mobilePackage = JSON.parse(files['apps/mobile/package.json']);
  mobilePackage.dependencies['@wrn/test-support'] = '1.0.0';
  files['apps/mobile/package.json'] = JSON.stringify(mobilePackage, null, 2);

  withWorkspaceFixture(files, (fixtureRoot) => {
    const result = checkLocalPreviewBoundaries(fixtureRoot, { release: false });
    assert.equal(result.ok, false);
    const message = result.violations.map((violation) => violation.message).join('\n');
    assert.match(message, /muss genau "workspace:\*"/);
  });
});

test('release mode rejects any test-support dependency or runtime import', () => {
  withWorkspaceFixture(
    {
      ...baseFixtureFiles(),
      'apps/mobile/src/App.tsx': 'export default function App() {}\n',
    },
    (fixtureRoot) => {
      const result = checkLocalPreviewBoundaries(fixtureRoot, { release: true });
      assert.equal(result.ok, false);
      assert.match(JSON.stringify(result.violations), /Dependency .*test-support/);
    },
  );
});

test('release mode accepts clean apps without test-support', () => {
  const files = baseFixtureFiles();
  const mobilePackage = JSON.parse(files['apps/mobile/package.json']);
  const websitePackage = JSON.parse(files['apps/website/package.json']);
  delete mobilePackage.dependencies['@wrn/test-support'];
  delete websitePackage.dependencies['@wrn/test-support'];
  files['apps/mobile/package.json'] = JSON.stringify(mobilePackage, null, 2);
  files['apps/website/package.json'] = JSON.stringify(websitePackage, null, 2);
  files['apps/mobile/src/App.tsx'] = 'export default function App() {}\n';
  files['apps/website/src/App.tsx'] = 'export default function App() {}\n';

  withWorkspaceFixture(files, (fixtureRoot) => {
    const result = checkLocalPreviewBoundaries(fixtureRoot, { release: true });
    assert.equal(result.ok, true);
  });
});

test('release mode rejects a website publisher import from the fixture package', () => {
  const files = baseFixtureFiles();
  const mobilePackage = JSON.parse(files['apps/mobile/package.json']);
  const websitePackage = JSON.parse(files['apps/website/package.json']);
  delete mobilePackage.dependencies['@wrn/test-support'];
  delete websitePackage.dependencies['@wrn/test-support'];
  files['apps/mobile/package.json'] = JSON.stringify(mobilePackage, null, 2);
  files['apps/website/package.json'] = JSON.stringify(websitePackage, null, 2);
  files['apps/mobile/src/App.tsx'] = 'export default function App() {}\n';
  files['apps/website/src/App.tsx'] = 'export default function App() {}\n';
  files['apps/website/tools/generate-static-article-landings.mjs'] =
    'import fixture from "../../../packages/test-support/src/index.ts";\nexport { fixture };\n';

  withWorkspaceFixture(files, (fixtureRoot) => {
    const result = checkLocalPreviewBoundaries(fixtureRoot, { release: true });
    expectReleaseViolation(result, /website Publisher.*nicht erlaubt/i);
  });
});

test('release mode rejects embedded test-support references in final artifacts', () => {
  const files = baseFixtureFiles();
  const mobilePackage = JSON.parse(files['apps/mobile/package.json']);
  const websitePackage = JSON.parse(files['apps/website/package.json']);
  delete mobilePackage.dependencies['@wrn/test-support'];
  delete websitePackage.dependencies['@wrn/test-support'];
  files['apps/mobile/package.json'] = JSON.stringify(mobilePackage, null, 2);
  files['apps/website/package.json'] = JSON.stringify(websitePackage, null, 2);
  files['apps/mobile/src/App.tsx'] = 'export default function App() {}\n';
  files['apps/website/src/App.tsx'] = 'export default function App() {}\n';
  files['apps/website/dist/assets/app.js'] = '/* packages/test-support/src/index.ts */';

  withWorkspaceFixture(files, (fixtureRoot) => {
    const result = checkLocalPreviewBoundaries(fixtureRoot, { release: true });
    expectReleaseViolation(result, /Finales Artefakt darf keine Test-Support-Referenz/i);
  });
});

function expectReleaseViolation(result, messagePattern) {
  assert.equal(result.ok, false);
  assert.match(result.violations.map((violation) => violation.message).join('\n'), messagePattern);
}
