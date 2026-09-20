import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateBrandAssets } from './check-brand-assets.mjs';

const workspaceRoot = path.resolve(import.meta.dirname, '..');

function withBrandFixture(callback) {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'wrn-brand-assets-'));
  try {
    const fixtureAssets = path.join(fixtureRoot, 'packages', 'brand-tokens', 'assets');
    mkdirSync(fixtureAssets, { recursive: true });
    cpSync(path.join(workspaceRoot, 'packages', 'brand-tokens', 'assets'), fixtureAssets, {
      recursive: true,
    });
    for (const directory of [
      path.join(fixtureRoot, 'packages', 'brand-tokens', 'src'),
      path.join(fixtureRoot, 'apps', 'mobile', 'src'),
      path.join(fixtureRoot, 'apps', 'website', 'src'),
    ]) {
      mkdirSync(directory, { recursive: true });
      writeFileSync(path.join(directory, 'baseline.ts'), 'export {};\n', 'utf8');
    }
    callback(fixtureRoot);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function editFixtureManifest(fixtureRoot, mutate) {
  const manifestPath = path.join(
    fixtureRoot,
    'packages',
    'brand-tokens',
    'assets',
    'asset-manifest.json',
  );
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  mutate(manifest);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

test('the local WRN brand assets match their pinned manifest and binaries', () => {
  assert.doesNotThrow(() => validateBrandAssets());
});

test('fails closed when a manifest hash, byte count, or provenance is manipulated', () => {
  for (const mutate of [
    (manifest) => {
      manifest.assets[0].sha256 = '0'.repeat(64);
    },
    (manifest) => {
      manifest.assets[1].bytes = 1;
    },
    (manifest) => {
      manifest.assets[2].sourceCommit = '0'.repeat(40);
    },
  ]) {
    withBrandFixture((fixtureRoot) => {
      editFixtureManifest(fixtureRoot, mutate);
      assert.throws(() => validateBrandAssets({ workspaceRoot: fixtureRoot }), /gepinnten Wert/);
    });
  }
});

test('fails closed for an extra asset file and a forbidden source reference', () => {
  withBrandFixture((fixtureRoot) => {
    const assets = path.join(fixtureRoot, 'packages', 'brand-tokens', 'assets');
    writeFileSync(path.join(assets, 'unregistered.png'), 'not-an-approved-asset', 'utf8');
    assert.throws(
      () => validateBrandAssets({ workspaceRoot: fixtureRoot }),
      /Nicht registrierte Datei/,
    );
  });

  withBrandFixture((fixtureRoot) => {
    const prohibitedName = ['Qo', 'od'].join('');
    writeFileSync(
      path.join(fixtureRoot, 'apps', 'mobile', 'src', 'forbidden.ts'),
      `export const forbidden = '${prohibitedName}';\n`,
      'utf8',
    );
    assert.throws(
      () => validateBrandAssets({ workspaceRoot: fixtureRoot }),
      /Verbotene Font-, Asset- oder Remote-Referenz/,
    );
  });
});

test('fails closed when the editorial background is assigned to a client header', () => {
  withBrandFixture((fixtureRoot) => {
    writeFileSync(
      path.join(fixtureRoot, 'apps', 'mobile', 'src', 'styles.css'),
      '.mobile-header { background: var(--wrn-asset-editorial-background); }\n',
      'utf8',
    );
    assert.throws(
      () => validateBrandAssets({ workspaceRoot: fixtureRoot }),
      /Redaktionelles Hintergrundasset ist im Header verboten/,
    );
  });

  withBrandFixture((fixtureRoot) => {
    writeFileSync(
      path.join(fixtureRoot, 'apps', 'website', 'src', 'styles.css'),
      '.site-header { background: url("app-background.webp"); }\n',
      'utf8',
    );
    assert.throws(
      () => validateBrandAssets({ workspaceRoot: fixtureRoot }),
      /Redaktionelles Hintergrundasset ist im Header verboten/,
    );
  });
});
