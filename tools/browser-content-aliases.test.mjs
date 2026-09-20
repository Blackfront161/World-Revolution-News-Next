import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createBrowserContentAliases } from './browser-content-aliases.mjs';

test('resolves only explicit public workspace exports and consuming-app React', () => {
  const aliases = createBrowserContentAliases(path.resolve('apps/mobile'));
  const resolve = (specifier) => aliases.find((alias) => alias.find.test(specifier))?.replacement;
  assert.match(
    resolve('@wrn/content-contracts'),
    /packages[\\/]content-contracts[\\/]src[\\/]index\.ts$/,
  );
  assert.match(resolve('@wrn/domain'), /packages[\\/]domain[\\/]src[\\/]index\.ts$/);
  assert.match(
    resolve('react'),
    /node_modules[\\/](?:\.pnpm[\\/]react@[^\\/]+[\\/]node_modules[\\/])?react/,
  );
  assert.equal(resolve('react').includes(`${path.sep}apps${path.sep}website${path.sep}`), false);
  for (const name of [
    '@wrn/content-contracts/src/private',
    '@wrn/domain/private',
    'react/private',
    '@wrn/ui-language/unknown',
  ])
    assert.equal(resolve(name), undefined);
  for (const name of [
    '@wrn/content-contracts/production-content-offline-v1',
    '@wrn/content-contracts/production-media-offline-v1',
    '@wrn/content-contracts/production-regional-events-v1',
    '@wrn/content-contracts/mobile-content-directory-v1',
    '@wrn/ui-language/production-content',
    '@wrn/ui-language/production-regional',
    '@wrn/ui-language/directory',
  ]) {
    const [, packageName, ...subpath] = name.split('/');
    const packageRoot = path.resolve('packages', packageName);
    const pkg = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
    assert.equal(
      resolve(name),
      path.resolve(packageRoot, pkg.exports['./' + subpath.join('/')].default),
    );
  }
  assert.notEqual(resolve('react'), resolve('react/jsx-runtime'));
  assert.notEqual(resolve('react-dom'), resolve('react-dom/client'));
});
test('requires a trusted absolute consuming-app path', () => {
  assert.throws(() => createBrowserContentAliases('apps/mobile'), /absolute trusted/);
});
