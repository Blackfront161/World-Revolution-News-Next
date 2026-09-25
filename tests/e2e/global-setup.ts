import { createServer as createHttpServer, type Server } from 'node:http';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { createServer, type ViteDevServer } from 'vite';
import { createBrowserContentAliases } from '../../tools/browser-content-aliases.mjs';

type FoundationServer = {
  port: number;
  root: string;
  outputDirectory?: string;
};

const foundationServers: FoundationServer[] = [
  { port: 43_173, root: 'apps/mobile' },
  { port: 43_174, root: 'apps/website' },
  // Test-only source harness: the production website remains the strict static server above.
  { port: 43_175, root: 'apps/website' },
  // Unmodified production Mobile entry, separate from explicit fixture acceptance.
  { port: 43_177, root: 'apps/mobile' },
  // Genuine default production Website, isolated from fixture shell acceptance.
  { port: 43_178, root: 'apps/website' },
];

async function closeServers(servers: ViteDevServer[]) {
  await Promise.allSettled(servers.map(async (server) => server.close()));
}

async function closeStaticServer(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function mimeType(filePath: string) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.xml')) return 'application/xml; charset=utf-8';
  if (filePath.endsWith('.txt')) return 'text/plain; charset=utf-8';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

async function startStrictStaticServer({ port, root, outputDirectory }: FoundationServer) {
  const staticRoot = outputDirectory ?? path.resolve(root, 'dist');
  const staticRootPrefix = `${staticRoot}${path.sep}`;
  const server = createHttpServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const pathname = decodeURIComponent(requestUrl.pathname);
      const relativePath = pathname.replace(/^\/+/, '');
      const requestedFile =
        pathname === '/'
          ? 'index.html'
          : pathname.endsWith('/')
            ? path.join(relativePath, 'index.html')
            : relativePath;
      const candidate = path.resolve(staticRoot, requestedFile);
      if (candidate !== staticRoot && !candidate.startsWith(staticRootPrefix)) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }
      const details = await stat(candidate).catch(() => null);
      if (details === null || !details.isFile()) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }
      response.writeHead(200, { 'content-type': mimeType(candidate), 'cache-control': 'no-store' });
      response.end(await readFile(candidate));
    } catch {
      response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Bad request');
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  return server;
}

export default async function globalSetup() {
  const servers: ViteDevServer[] = [];
  const cacheRoot = path.resolve('test-results', 'vite-cache', randomUUID());
  const websiteStaticServers: Server[] = [];

  try {
    const mobileServer = foundationServers[0];
    const mobile = await createServer({
      clearScreen: false,
      configFile: false,
      logLevel: 'error',
      root: path.resolve(mobileServer.root),
      resolve: { alias: createBrowserContentAliases(path.resolve(mobileServer.root)) },
      cacheDir: path.join(cacheRoot, 'mobile-fixture'),
      plugins: [
        {
          name: 'explicit-mobile-offline-fixture-entry',
          enforce: 'pre',
          transform(source, id) {
            if (id.replaceAll('\\', '/').endsWith('/apps/mobile/src/main.tsx')) {
              if ([...source.matchAll(/<App(?=\s)/g)].length !== 1)
                throw new Error('Mobile fixture entry injection no longer matches');
              return source.replace(/<App(?=\s)/, '<App contentMode="fixture-offline"');
            }
          },
        },
      ],
      server: {
        host: '127.0.0.1',
        port: mobileServer.port,
        strictPort: true,
      },
    });
    await mobile.listen();
    servers.push(mobile);

    const productionMobile = await createServer({
      clearScreen: false,
      configFile: false,
      logLevel: 'error',
      root: path.resolve('apps/mobile'),
      resolve: { alias: createBrowserContentAliases(path.resolve('apps/mobile')) },
      cacheDir: path.join(cacheRoot, 'mobile-production'),
      plugins: [
        {
          name: 'wrn-empty-regional-idb-harness',
          configureServer(server) {
            server.middlewares.use('/__regional-idb', (_request, response) => {
              response.statusCode = 200;
              response.setHeader('content-type', 'text/html; charset=utf-8');
              response.end(
                '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>',
              );
            });
          },
        },
      ],
      server: { host: '127.0.0.1', port: 43_177, strictPort: true },
    });
    await productionMobile.listen();
    servers.push(productionMobile);

    const websiteServer = foundationServers[1];
    const websiteRoot = path.resolve(websiteServer.root);
    // createServer above sets this process to development. Build the website
    // in its own production Node process; never mutate the mobile/source env.
    await promisify(execFile)(
      process.execPath,
      [
        path.resolve('node_modules/vite/bin/vite.js'),
        'build',
        '--mode',
        'production',
        '--manifest',
      ],
      {
        cwd: websiteRoot,
        env: { ...process.env, NODE_ENV: 'production' },
        maxBuffer: 4 * 1024 * 1024,
      },
    );
    for (const buildTool of [
      'tools/integrate-production-article-landings.mjs',
      'tools/build-offline-shell.mjs',
    ]) {
      await promisify(execFile)(process.execPath, [path.resolve(websiteRoot, buildTool), 'dist'], {
        cwd: websiteRoot,
        env: { ...process.env, NODE_ENV: 'production' },
        maxBuffer: 4 * 1024 * 1024,
      });
    }
    websiteStaticServers.push(await startStrictStaticServer(foundationServers[4]!));

    // A separate explicit fixture build keeps old static/SW acceptance meaningful.
    // This transform is test-owned; the default build has no runtime fixture switch.
    const fixtureOutput = path.join(cacheRoot, 'website-fixture-build');
    await promisify(execFile)(
      process.execPath,
      [path.resolve('tests/e2e/build-website-fixture.mjs'), fixtureOutput],
      { env: { ...process.env, NODE_ENV: 'production' }, maxBuffer: 4 * 1024 * 1024 },
    );
    for (const buildTool of [
      'tools/integrate-static-article-landings.mjs',
      'tools/build-offline-shell.mjs',
    ]) {
      await promisify(execFile)(
        process.execPath,
        [path.resolve(websiteRoot, buildTool), fixtureOutput],
        {
          cwd: websiteRoot,
          env: { ...process.env, NODE_ENV: 'production' },
          maxBuffer: 4 * 1024 * 1024,
        },
      );
    }
    websiteStaticServers.push(
      await startStrictStaticServer({ ...websiteServer, outputDirectory: fixtureOutput }),
    );
    process.env.WRN_E2E_WEBSITE_FIXTURE_OUTPUT = fixtureOutput;

    const websiteHarness = foundationServers[2];
    const websiteHarnessServer = await createServer({
      clearScreen: false,
      configFile: false,
      logLevel: 'error',
      root: path.resolve(websiteHarness.root),
      resolve: { alias: createBrowserContentAliases(path.resolve(websiteHarness.root)) },
      cacheDir: path.join(cacheRoot, 'website-harness'),
      server: { host: '127.0.0.1', port: websiteHarness.port, strictPort: true },
    });
    await websiteHarnessServer.listen();
    servers.push(websiteHarnessServer);
  } catch (error) {
    await closeServers(servers);
    await Promise.allSettled(websiteStaticServers.map(closeStaticServer));
    throw error;
  }

  return async () => {
    await closeServers(servers);
    await Promise.allSettled(websiteStaticServers.map(closeStaticServer));
  };
}
