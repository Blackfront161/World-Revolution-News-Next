import { chromium } from '@playwright/test';
import { mkdtemp, mkdir, readFile, writeFile, cp, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';

// Preserve canonical worker source even when Playwright imports this harness.
export async function buildOfflineShell(options) {
  const { stdout } = await promisify(execFile)(process.execPath, [
    '--input-type=module',
    '-e',
    "import { buildOfflineShell } from './apps/website/tools/build-offline-shell.mjs'; process.stdout.write(JSON.stringify(await buildOfflineShell(JSON.parse(process.argv[1]))));",
    JSON.stringify(options),
  ]);
  return JSON.parse(stdout);
}

const root = process.cwd();
const sourceRoot = path.join(root, 'apps/website/src/offline-shell');
export const poll = async (probe, label, timeout = 15000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await probe()) return;
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  throw new Error('poll timeout: ' + label);
};
export async function coreHarness(label) {
  const evidence = path.join(root, 'docs/evidence/WRN-G3-015/completion');
  await mkdir(evidence, { recursive: true });
  const run = await mkdtemp(path.join(evidence, label + '-'));
  const report = {
    label,
    started: new Date().toISOString(),
    node: process.version,
    assertions: [],
    errors: [],
    events: [],
    packages: {},
  };
  report.source = {};
  await mkdir(path.join(run, 'source'));
  for (const name of [
    'worker-template.mjs',
    'worker-runtime.mjs',
    'protocol.mjs',
    'protocol.d.mts',
    'adapter.ts',
    'browser-platform.ts',
  ]) {
    const bytes = await readFile(path.join(sourceRoot, name));
    report.source[name] = createHash('sha256').update(bytes).digest('hex');
    await writeFile(path.join(run, 'source', name), bytes);
  }
  for (const file of [
    process.argv[1],
    'tests/e2e/website-shell-core-helper.mjs',
    'apps/website/tools/build-offline-shell.mjs',
  ]) {
    const bytes = await readFile(file);
    report.source[path.basename(file)] = createHash('sha256').update(bytes).digest('hex');
    await writeFile(path.join(run, 'source', path.basename(file)), bytes);
  }
  const record = (event, value) =>
    report.events.push({ at: new Date().toISOString(), event, value });
  const check = (name, passed, observed) => report.assertions.push({ name, passed, observed });
  const packages = {};
  for (const revision of ['P', 'A', 'B', 'C']) {
    const directory = path.join(run, revision);
    await mkdir(path.join(directory, 'assets'), { recursive: true });
    await mkdir(path.join(directory, '.vite'), { recursive: true });
    await writeFile(
      path.join(directory, '.vite/manifest.json'),
      JSON.stringify({
        'index.html': {
          file: 'assets/index-a.js',
          isEntry: true,
          css: ['assets/index-a.css'],
          assets: [
            'assets/solinaridao-header-mark-filled-a.png',
            'assets/wrn-future-header-white-a.png',
            'assets/legacy-knowledge-v1-a.json',
            'assets/legacy-support-v1-a.json',
            'assets/content-directory-v1-a.json',
          ],
        },
      }),
    );
    const files = {
      'index.html': `<!doctype html><html lang="en"><head><link rel="stylesheet" href="/assets/index-a.css"><script type="module" src="/assets/index-a.js"></script></head><body><main>CORE-${revision}</main></body></html>`,
      'assets/index-a.js': `document.body.dataset.revision = '${revision}';`,
      'assets/index-a.css': `body { --revision: '${revision}'; color: #111; }`,
      'assets/solinaridao-header-mark-filled-a.png': 'synthetic-image-one',
      'assets/wrn-future-header-white-a.png': 'synthetic-image-two',
      'assets/legacy-knowledge-v1-a.json': '{}',
      'assets/legacy-support-v1-a.json': '{}',
      'assets/content-directory-v1-a.json': '{}',
    };
    for (const [file, value] of Object.entries(files))
      await writeFile(path.join(directory, file), value);
    const built = await buildOfflineShell({ outputDirectory: directory });
    packages[revision] = { directory, manifest: built.manifest };
    report.packages[revision] = built.manifest;
  }
  let served = 'A';
  let intercept = null;
  let stopped = false;
  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    record('network', { pathname, served });
    try {
      if (intercept && (await intercept({ req, res, pathname, served, packages }))) return;
      if (pathname.startsWith('/__shell/')) {
        const file = pathname.slice('/__shell/'.length);
        if (!/^[a-z-]+\.(js|mjs)$/.test(file)) throw new Error('invalid');
        const isTS = file.endsWith('.js');
        const source = await readFile(
          path.join(sourceRoot, isTS ? file.replace(/\.js$/, '.ts') : file),
          'utf8',
        );
        const code = isTS
          ? ts
              .transpileModule(source, {
                compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
              })
              .outputText.replace(/from '(\.\/[a-z-]+)'/g, "from '$1.js'")
          : source;
        res.writeHead(200, {
          'content-type': 'text/javascript; charset=utf-8',
          'cache-control': 'no-store',
        });
        res.end(code);
        return;
      }
      const file = pathname === '/' ? '/index.html' : pathname;
      const entry = packages[served].manifest.entries.find((x) => x.path === file);
      if (
        !entry &&
        file !== '/website-shell-sw.js' &&
        !(
          packages[served].built &&
          /^\/(wrn-local-release\/v1\/[a-z-]+\.json|articles\/[a-z0-9-]+\/|robots\.txt|sitemap\.xml)$/.test(
            file,
          )
        )
      )
        throw new Error('not found');
      const body = await readFile(
        path.join(
          packages[served].directory,
          file.slice(1) + (file.endsWith('/') ? 'index.html' : ''),
        ),
      );
      const mime = file.endsWith('.json')
        ? 'application/json; charset=utf-8'
        : file.endsWith('/')
          ? 'text/html; charset=utf-8'
          : 'text/javascript; charset=utf-8';
      res.writeHead(200, {
        'content-type': entry?.mime ?? mime,
        'content-length': body.length,
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  report.origin = origin;
  const contexts = [];
  const launch = async (existing, offline = false) => {
    const profile = existing ?? (await mkdtemp(path.join(os.tmpdir(), 'wrn-s4-')));
    const context = await chromium.launchPersistentContext(profile, {
      channel: 'chrome',
      headless: true,
      serviceWorkers: 'allow',
      offline,
      viewport: { width: 390, height: 844 },
    });
    context.testProfile = profile;
    report.browser = context.browser()?.version() ?? 'persistent chrome';
    contexts.push(context);
    record('profile', { profile, offline });
    return context;
  };
  const attach = async (page) => {
    await page.evaluate(async () => {
      const { createWebsiteShellAdapter } = await import('/__shell/adapter.js');
      const { createBrowserWebsiteShellPlatform } = await import('/__shell/browser-platform.js');
      window.shell = createWebsiteShellAdapter(createBrowserWebsiteShellPlatform());
    });
  };
  const snapshot = (page) =>
    page.evaluate(async () => {
      const response = await caches.match('/__wrn_website_shell_control_v1__', {
        cacheName: 'wrn.website-shell.v1.control',
      });
      const reg = await navigator.serviceWorker.getRegistration();
      return {
        control: response ? await response.json().catch(() => ({ malformed: true })) : null,
        caches: await caches.keys(),
        active: reg?.active?.state,
        waiting: reg?.waiting?.state,
        installing: reg?.installing?.state,
        status: window.shell?.getSnapshot(),
      };
    });
  const finish = async () => {
    for (const context of contexts) await context.close().catch(() => undefined);
    if (!stopped) await new Promise((resolve) => server.close(resolve));
    report.finished = new Date().toISOString();
    await writeFile(path.join(run, 'raw-report.json'), JSON.stringify(report, null, 2));
    const hashes = {};
    const walk = async (directory) => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) await walk(file);
        else
          hashes[path.relative(run, file).replaceAll('\\', '/')] = createHash('sha256')
            .update(await readFile(file))
            .digest('hex');
      }
    };
    await walk(run);
    await writeFile(path.join(run, 'artifact-hashes.json'), JSON.stringify(hashes, null, 2));
    console.log(
      JSON.stringify(
        {
          run,
          passed: report.assertions.filter((a) => a.passed).length,
          failed: report.assertions.filter((a) => !a.passed).map((a) => a.name),
          errors: report.errors,
        },
        null,
        2,
      ),
    );
    return report;
  };
  const useBuilt = async () => {
    const directory = path.join(run, 'built');
    const fixtureOutput = process.env.WRN_E2E_WEBSITE_FIXTURE_OUTPUT;
    if (!fixtureOutput) throw new Error('Missing explicit Website fixture build');
    await cp(fixtureOutput, directory, { recursive: true });
    const built = await buildOfflineShell({ outputDirectory: directory });
    packages.built = { directory, manifest: built.manifest, built: true };
    report.packages.built = built.manifest;
    served = 'built';
  };
  return {
    report,
    record,
    check,
    packages,
    origin,
    launch,
    attach,
    snapshot,
    finish,
    useBuilt,
    run,
    stopServer: async () => {
      stopped = true;
      await new Promise((resolve) => server.close(resolve));
    },
    intercept: (callback) => {
      intercept = callback;
    },
    serve: (name) => {
      served = name;
    },
  };
}
