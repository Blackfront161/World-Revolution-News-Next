import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createServer, type ViteDevServer } from 'vite';
import { createBrowserContentAliases } from '../../tools/browser-content-aliases.mjs';

/** Real application entries with isolated, intercepted test-only public endpoint configuration. */
export default async function setupProductionTranslation() {
  const servers: ViteDevServer[] = [];
  const run = randomUUID();
  try {
    for (const [app, port] of [
      ['mobile', 43181],
      ['website', 43182],
    ] as const) {
      const root = path.resolve('apps', app);
      const server = await createServer({
        configFile: false,
        root,
        clearScreen: false,
        logLevel: 'error',
        cacheDir: path.resolve('test-results', 'translation-vite', run, app),
        resolve: { alias: createBrowserContentAliases(root) },
        define: {
          'import.meta.env.VITE_WRN_TRANSLATION_ENDPOINT': JSON.stringify(
            'https://translation.example/v1/translations',
          ),
          'import.meta.env.VITE_WRN_TRANSLATION_ADAPTER_ID': JSON.stringify('browser-test'),
          'import.meta.env.VITE_WRN_TRANSLATION_ADAPTER_VERSION': JSON.stringify('1'),
          'import.meta.env.VITE_WRN_TRANSLATION_PROVIDER': JSON.stringify('browser-test-provider'),
        },
        server: { host: '127.0.0.1', port, strictPort: true },
      });
      await server.listen();
      servers.push(server);
    }
  } catch (error) {
    await Promise.allSettled(servers.map((server) => server.close()));
    throw error;
  }
  return async () => {
    await Promise.allSettled(servers.map((server) => server.close()));
  };
}
