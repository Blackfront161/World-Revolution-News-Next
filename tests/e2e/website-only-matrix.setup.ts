import { createServer as createHttpServer, type Server } from 'node:http';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { createServer, type ViteDevServer } from 'vite';
import { createBrowserContentAliases } from '../../tools/browser-content-aliases.mjs';

async function staticWebsite(root: string, port: number): Promise<Server> {
  const server = createHttpServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://127.0.0.1').pathname);
      const relative =
        pathname === '/'
          ? 'index.html'
          : pathname.endsWith('/')
            ? pathname.slice(1) + 'index.html'
            : pathname.slice(1);
      const file = path.resolve(root, relative);
      if (!file.startsWith(root + path.sep) || !(await stat(file)).isFile()) throw Error('missing');
      const mime = file.endsWith('.html')
        ? 'text/html; charset=utf-8'
        : file.endsWith('.js')
          ? 'text/javascript; charset=utf-8'
          : file.endsWith('.css')
            ? 'text/css; charset=utf-8'
            : file.endsWith('.json')
              ? 'application/json; charset=utf-8'
              : file.endsWith('.png')
                ? 'image/png'
                : file.endsWith('.webp')
                  ? 'image/webp'
                  : file.endsWith('.xml')
                    ? 'application/xml; charset=utf-8'
                    : 'text/plain; charset=utf-8';
      res.writeHead(200, { 'content-type': mime, 'cache-control': 'no-store' });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return server;
}

export default async function setup() {
  const staticServers: Server[] = [],
    viteServers: ViteDevServer[] = [];
  const websiteRoot = path.resolve('apps/website');
  const cacheRoot = path.resolve('test-results', 'website-only-cache', randomUUID());
  const execute = async (args: string[], cwd = process.cwd()) =>
    promisify(execFile)(process.execPath, args, {
      cwd,
      env: { ...process.env, NODE_ENV: 'production' },
      maxBuffer: 4 * 1024 * 1024,
    });
  const close = async () => {
    await Promise.allSettled(viteServers.map((server) => server.close()));
    await Promise.allSettled(
      staticServers.map(
        (server) =>
          new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          ),
      ),
    );
  };
  try {
    // Use the built production candidate; its build/check is a separate explicit command.
    staticServers.push(await staticWebsite(path.join(websiteRoot, 'dist'), 43178));
    const fixtureOutput = path.join(cacheRoot, 'website-fixture-build');
    await execute([path.resolve('tests/e2e/build-website-fixture.mjs'), fixtureOutput]);
    for (const tool of ['integrate-static-article-landings.mjs', 'build-offline-shell.mjs'])
      await execute([path.join(websiteRoot, 'tools', tool), fixtureOutput], websiteRoot);
    staticServers.push(await staticWebsite(fixtureOutput, 43174));
    process.env.WRN_E2E_WEBSITE_FIXTURE_OUTPUT = fixtureOutput;
    for (const port of [43175, 43182]) {
      const server = await createServer({
        clearScreen: false,
        configFile: false,
        logLevel: 'error',
        root: websiteRoot,
        resolve: { alias: createBrowserContentAliases(websiteRoot) },
        cacheDir: path.join(cacheRoot, `website-${port}`),
        define:
          port === 43182
            ? {
                'import.meta.env.VITE_WRN_TRANSLATION_ENDPOINT': JSON.stringify(
                  'https://translation.example/v1/translations',
                ),
                'import.meta.env.VITE_WRN_TRANSLATION_ADAPTER_ID': JSON.stringify('browser-test'),
                'import.meta.env.VITE_WRN_TRANSLATION_ADAPTER_VERSION': JSON.stringify('1'),
                'import.meta.env.VITE_WRN_TRANSLATION_PROVIDER':
                  JSON.stringify('browser-test-provider'),
              }
            : {},
        plugins:
          port === 43175
            ? [
                {
                  name: 'website-only-empty-idb-harness',
                  configureServer(server) {
                    for (const route of ['/__media-first-boot', '/__content-idb'])
                      server.middlewares.use(route, (_req, res) => {
                        res.statusCode = 200;
                        res.setHeader('content-type', 'text/html; charset=utf-8');
                        res.end(
                          '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>',
                        );
                      });
                  },
                },
              ]
            : [],
        server: { host: '127.0.0.1', port, strictPort: true },
      });
      await server.listen();
      viteServers.push(server);
    }
    return close;
  } catch (error) {
    await close();
    throw error;
  }
}
