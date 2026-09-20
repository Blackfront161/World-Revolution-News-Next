import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicSources = Object.freeze({
  '@wrn/ui-language/production-regional': 'packages/ui-language/src/production-regional.ts',
  '@wrn/content-contracts/production-media-offline-v1':
    'packages/content-contracts/src/production-media-offline-v1.ts',
  '@wrn/content-contracts/production-regional-events-v1':
    'packages/content-contracts/src/directory/production-regional-events-v1.ts',
  '@wrn/content-contracts/production-media-v1':
    'packages/content-contracts/src/production-media-v1.ts',
  '@wrn/ui-language/production-translation': 'packages/ui-language/src/production-translation.ts',
  '@wrn/api-contracts/translation-v1': 'packages/api-contracts/src/translation-v1.ts',
  '@wrn/content-contracts': 'packages/content-contracts/src/index.ts',
  '@wrn/content-contracts/production-content-offline-v1':
    'packages/content-contracts/src/production-content-offline-v1.ts',
  '@wrn/content-contracts/production-content-release-v1':
    'packages/content-contracts/src/production-content-release-v1.ts',
  '@wrn/content-contracts/mobile-reader-v2': 'packages/content-contracts/src/mobile-reader-v2.ts',
  '@wrn/content-contracts/mobile-content-directory-v1':
    'packages/content-contracts/src/directory/mobile-content-directory-v1.ts',
  '@wrn/content-contracts/production-events-media-v1':
    'packages/content-contracts/src/directory/production-events-media-v1.ts',
  '@wrn/domain': 'packages/domain/src/index.ts',
  '@wrn/ui-language': 'packages/ui-language/src/index.ts',
  '@wrn/ui-language/production-content': 'packages/ui-language/src/production-content.ts',
  '@wrn/ui-language/production-home': 'packages/ui-language/src/production-home.ts',
  '@wrn/ui-language/directory': 'packages/ui-language/src/directory-copy.ts',
  '@wrn/ui-language/events-media': 'packages/ui-language/src/events-media.ts',
  '@wrn/ui-language/source-preferences': 'packages/ui-language/src/source-preferences.ts',
  '@wrn/ui-language/sport-sources': 'packages/ui-language/src/sport-sources.ts',
});

export function createBrowserContentAliases(consumingAppPath) {
  if (typeof consumingAppPath !== 'string' || !path.isAbsolute(consumingAppPath))
    throw new TypeError('consumingAppPath must be an absolute trusted app path');
  const require = createRequire(path.join(consumingAppPath, 'package.json'));
  const aliases = Object.entries(publicSources).map(([find, source]) => ({
    find: new RegExp(`^${find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
    replacement: path.join(root, source),
  }));
  for (const dependency of [
    'react',
    'react-dom',
    'react-dom/client',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
  ])
    aliases.push({ find: new RegExp(`^${dependency}$`), replacement: require.resolve(dependency) });
  return aliases;
}
