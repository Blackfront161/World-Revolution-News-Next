import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: directory,
  resolve: {
    alias: {
      '@wrn/api-contracts/translation-v1': path.resolve(
        directory,
        '../../packages/api-contracts/src/translation-v1.ts',
      ),
    },
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
