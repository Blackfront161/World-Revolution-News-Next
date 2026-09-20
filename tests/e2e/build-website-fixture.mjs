import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

// Test-owned static/SW fixture build; no production environment/query switch.
const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const root = path.join(workspace, 'apps/website');
const output = process.argv[2];
const results = path.join(workspace, 'test-results');
if (
  !output ||
  !path.isAbsolute(output) ||
  !output.startsWith(results + path.sep) ||
  path.relative(results, output).startsWith('..') ||
  existsSync(output)
)
  throw new Error('Expected a fresh absolute test-results output');
await build({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  mode: 'production',
  logLevel: 'error',
  cacheDir: path.join(path.dirname(output), 'website-fixture-build-cache'),
  plugins: [
    {
      name: 'explicit-website-fixture-entry',
      enforce: 'pre',
      transform(source, id) {
        if (!id.replaceAll('\\', '/').endsWith('/apps/website/src/main.tsx')) return;
        if ([...source.matchAll(/<App(?=\s)/g)].length !== 1)
          throw new Error('Website fixture entry injection no longer matches');
        return source.replace(/<App(?=\s)/, '<App contentMode="fixture-offline"');
      },
    },
  ],
  build: { outDir: output, manifest: true, emptyOutDir: false },
});
