import { coreHarness, poll } from './website-shell-core-helper.mjs';
import { readFile } from 'node:fs/promises';
import { buildOfflineShell } from '../../apps/website/tools/build-offline-shell.mjs';

const h = await coreHarness('matrix');
const fresh = async (revision = 'A') => {
  h.serve(revision);
  h.intercept(null);
  const context = await h.launch();
  const page = context.pages()[0];
  await page.goto(h.origin);
  await h.attach(page);
  await page.evaluate(() => window.shell.enable());
  await poll(
    () =>
      page.evaluate(
        async () =>
          (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated',
      ),
    'enabled ' + revision,
  );
  await page.reload();
  await h.attach(page);
  await page.evaluate(() => window.shell.refresh());
  return { context, page };
};
const asset = (page) =>
  page.evaluate(async () => {
    try {
      const r = await fetch('/assets/index-a.js');
      return { id: r.headers.get('x-wrn-shell-id'), body: await r.text() };
    } catch {
      return { failed: true };
    }
  });
const scenario = async (name, run) => {
  if (process.argv[2] && !name.includes(process.argv[2])) return;
  console.log('scenario: ' + name);
  try {
    await run();
  } catch (error) {
    h.report.errors.push({ name, message: error.message, stack: error.stack });
  }
  h.intercept(null);
};
const active = async (context, revision) =>
  poll(async () => {
    const states = await Promise.all(
      context.serviceWorkers().map((w) =>
        w
          .evaluate(async () => {
            const response = await caches.match('/__wrn_website_shell_control_v1__', {
              cacheName: 'wrn.website-shell.v1.control',
            });
            return { state: self.serviceWorker.state, active: (await response.json()).active };
          })
          .catch(() => null),
      ),
    );
    return states.some(
      (s) => s?.state === 'activated' && s.active === h.packages[revision].manifest.shellId,
    );
  }, revision + ' active/control reconciliation');

await scenario('three slots and complete rollback', async () => {
  const { context, page } = await fresh('P');
  h.serve('A');
  await page.evaluate(() => window.shell.update());
  await poll(
    () => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting),
    'A waiting',
  );
  await page.goto('about:blank');
  await active(context, 'A');
  await page.goto(h.origin);
  await h.attach(page);
  await page.evaluate(() => window.shell.refresh());
  h.serve('B');
  await page.evaluate(() => window.shell.update());
  const waiting = await h.snapshot(page);
  h.check(
    'P/A/B-waiting occupies exactly three slots',
    waiting.control.generations.length === 3 && waiting.waiting === 'installed',
    waiting,
  );
  const oldNavigation = await page.goto(h.origin + '/?article=not-persisted#home');
  h.check(
    'network B HTML cannot mix with controlled A assets',
    oldNavigation.headers()['x-wrn-shell-id'] === h.packages.A.manifest.shellId &&
      (await page.locator('main').innerText()) === 'CORE-A',
    { headers: oldNavigation.headers() },
  );
  await h.attach(page);
  h.serve('C');
  const requestStart = h.report.events.length;
  // Native automatic-update equivalent must hit the same worker slot guard.
  await page.evaluate(async () => {
    try {
      await (await navigator.serviceWorker.getRegistration()).update();
    } catch {
      /* rejected install */
    }
  });
  await poll(
    () => page.evaluate(async () => !(await navigator.serviceWorker.getRegistration())?.installing),
    'C rejected',
  );
  const afterC = await h.snapshot(page);
  const payloadRequests = h.report.events
    .slice(requestStart)
    .filter((e) => e.event === 'network' && e.value.pathname.startsWith('/assets/'));
  h.check(
    'C rejected before payload requests/writes without losing P/A/B',
    afterC.control.generations.length === 3 &&
      afterC.waiting === 'installed' &&
      payloadRequests.length === 0,
    { afterC, payloadRequests },
  );
  await page.goto('about:blank');
  await active(context, 'B');
  h.serve('B');
  await page.goto(h.origin);
  await h.attach(page);
  await page.evaluate(() => window.shell.refresh());
  await poll(
    async () => (await h.snapshot(page)).control.generations.length === 2,
    'P cleanup after B',
  );
  const b = await h.snapshot(page);
  h.check(
    'B activation protects A and prunes only P',
    b.control.active === h.packages.B.manifest.shellId &&
      b.control.previous === h.packages.A.manifest.shellId &&
      !b.caches.includes('wrn.website-shell.v1.payload.' + h.packages.P.manifest.shellId),
    b,
  );
  h.serve('C');
  const updateC = await page.evaluate(() => window.shell.update());
  h.check('C is possible after B lifecycle cleanup', updateC.kind === 'waiting', updateC);
  // Close C-waiting lifecycle, then rollback to full B package, retaining C.
  await page.goto('about:blank');
  await active(context, 'C');
  await page.goto(h.origin);
  await h.attach(page);
  await page.evaluate(() => window.shell.refresh());
  h.serve('B');
  await page.evaluate(() => window.shell.update());
  await poll(
    () => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting),
    'B rollback waiting',
  );
  await page.goto('about:blank');
  await active(context, 'B');
  await page.goto(h.origin);
  await h.attach(page);
  await page.evaluate(() => window.shell.refresh());
  const rollback = await h.snapshot(page);
  h.check(
    'complete package rollback B retains previous C',
    (await asset(page)).id === h.packages.B.manifest.shellId &&
      rollback.control.previous === h.packages.C.manifest.shellId,
    rollback,
  );
  await context.close();
});

await scenario('native remove and explicit re-enable', async () => {
  const { context, page } = await fresh();
  await page.evaluate(async () => {
    localStorage.setItem('wrn.website-ui-language.v1', 'de');
    await (await caches.open('foreign-sentinel')).put('/sentinel', new Response('unchanged'));
  });
  const removed = await page.evaluate(() => window.shell.remove());
  const state = await h.snapshot(page);
  h.check(
    'remove really finishes and preserves foreign/preferences',
    removed.kind === 'removed' &&
      state.control.state === 'removed' &&
      state.caches.every((n) => !n.includes('.payload.')) &&
      (await page.evaluate(() => localStorage.getItem('wrn.website-ui-language.v1'))) === 'de',
    { removed, state },
  );
  const again = await page.evaluate(() => window.shell.enable());
  h.check(
    'new explicit enable advances epoch and permits identical safe bytes',
    ['saved', 'active'].includes(again.kind) && again.epoch > removed.epoch,
    again,
  );
  await context.close();
});

for (const bad of ['{"version":99}', '{', '{"version":1,"epoch":1}'])
  await scenario('protected ' + bad, async () => {
    const context = await h.launch();
    const page = context.pages()[0];
    await page.goto(h.origin);
    await page.evaluate(async (body) => {
      await (
        await caches.open('wrn.website-shell.v1.control')
      ).put('/__wrn_website_shell_control_v1__', new Response(body));
    }, bad);
    await h.attach(page);
    const result = await page.evaluate(() => window.shell.enable());
    const preserved = await page.evaluate(async () =>
      (
        await caches.match('/__wrn_website_shell_control_v1__', {
          cacheName: 'wrn.website-shell.v1.control',
        })
      ).text(),
    );
    h.check(
      'malformed/unknown control preserved ' + bad,
      result.kind === 'protected' &&
        preserved === bad &&
        (await h.snapshot(page)).caches.length === 1,
      { result, preserved },
    );
    await context.close();
  });

await scenario('foreign root worker protected', async () => {
  const context = await h.launch();
  const page = context.pages()[0];
  h.intercept(async ({ pathname, res }) => {
    if (pathname !== '/foreign-sw.js') return false;
    res.writeHead(200, { 'content-type': 'text/javascript' });
    res.end("self.addEventListener('fetch', () => {});");
    return true;
  });
  await page.goto(h.origin);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/foreign-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
  });
  await h.attach(page);
  const result = await page.evaluate(() => window.shell.enable());
  h.check(
    'foreign root registration never replaced',
    result.kind === 'protected' &&
      (await page.evaluate(async () =>
        (await navigator.serviceWorker.getRegistration()).active.scriptURL.endsWith(
          '/foreign-sw.js',
        ),
      )),
    result,
  );
  await context.close();
});

for (const fault of ['hash', 'mime', '404', 'redirect', 'body-timeout'])
  await scenario('failed update ' + fault, async () => {
    const { context, page } = await fresh();
    h.serve('B');
    let requestSeen = false;
    h.intercept(async ({ pathname, res, packages }) => {
      if (pathname !== '/assets/index-a.js') return false;
      requestSeen = true;
      if (fault === '404') {
        res.writeHead(404);
        res.end();
      } else if (fault === 'redirect') {
        res.writeHead(302, { location: '/assets/index-a.css' });
        res.end();
      } else if (fault === 'body-timeout') {
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
        res.flushHeaders();
        res.write('x');
      } else {
        const body =
          fault === 'hash'
            ? Buffer.from(
                'x'.repeat(packages.B.manifest.entries.find((e) => e.path === pathname).bytes),
              )
            : await readFile(packages.B.directory + pathname);
        res.writeHead(200, {
          'content-type': fault === 'mime' ? 'text/plain' : 'text/javascript; charset=utf-8',
        });
        res.end(body);
      }
      return true;
    });
    const result = await page.evaluate(() => window.shell.update());
    h.check(
      'failed ' + fault + ' update reports failure rather than unchanged active as success',
      result.kind === 'error',
      result,
    );
    const state = await h.snapshot(page);
    h.check(
      'failed ' + fault + ' update leaves complete A, no stage',
      requestSeen &&
        (await asset(page)).id === h.packages.A.manifest.shellId &&
        state.control.generations.length === 1 &&
        !state.waiting,
      { result, state },
    );
    await context.close();
  });

await scenario('missing jobs crash recovery', async () => {
  const { context, page } = await fresh();
  await page.evaluate(async () => {
    const { createShellProtocol } = await import('/__shell/protocol.mjs');
    const p = createShellProtocol();
    await navigator.locks.request(p.lock, async () => {
      const c = (await p.read(caches)).value;
      await p.write(caches, {
        ...c,
        pendingJob: { id: 'abandoned-job', epoch: c.epoch, kind: 'update' },
      });
    });
  });
  const profile = context.testProfile;
  await context.close();
  const next = await h.launch(profile);
  const reopened = next.pages()[0];
  await reopened.goto(h.origin);
  await h.attach(reopened);
  const state = await reopened.evaluate(() => window.shell.refresh());
  h.check('abandoned update is pending, never silent success', state.kind === 'pending', state);
  const removed = await reopened.evaluate(() => window.shell.remove());
  h.check(
    'remove fences abandoned native job after process restart',
    removed.kind === 'removed',
    removed,
  );
  await next.close();
});

await scenario('strict URL boundaries and slow HTML body', async () => {
  const { context, page } = await fresh();
  h.intercept(async ({ pathname, res }) => {
    if (pathname !== '/index.html') return false;
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.flushHeaders();
    res.write('<');
    return true;
  });
  const started = Date.now();
  const navigation = await page.goto(h.origin + '/?article=query-not-a-cachekey#home');
  h.check(
    '5 second network HTML deadline includes slow body then serves exact A',
    Date.now() - started >= 4500 &&
      Date.now() - started < 12000 &&
      navigation.headers()['x-wrn-shell-id'] === h.packages.A.manifest.shellId,
    { elapsed: Date.now() - started, header: navigation.headers()['x-wrn-shell-id'] },
  );
  h.intercept(null);
  const paths = [
    '/articles/wrn-test-art-cedar/',
    '/unknown',
    '/wrn-local-release/v1/release-descriptor.json',
    '/wrn-local-release/v1/archive-lifecycle.json',
    '/media/image.png',
    '/assets/index-a.js?secret=not-persisted',
  ];
  await context.setOffline(true);
  const results = await page.evaluate(
    async (paths) =>
      Promise.all(
        paths.map(async (url) => {
          try {
            const r = await fetch(url);
            return { url, body: await r.text(), ok: r.ok };
          } catch {
            return { url, failed: true };
          }
        }),
      ),
    paths,
  );
  h.check(
    'SEO/unknown/content/safety/media/query-asset get no offline shell response',
    results.every((r) => r.failed),
    results,
  );
  const keys = await page.evaluate(async () => {
    const output = [];
    for (const name of await caches.keys())
      output.push({
        name,
        paths: (await (await caches.open(name)).keys()).map(
          (r) => new URL(r.url).pathname + new URL(r.url).search,
        ),
      });
    return output;
  });
  h.check(
    'cache keys never persist queries or content/safety URLs',
    keys.every((c) =>
      c.paths.every((key) => !key.includes('?') && !key.includes('wrn-local-release')),
    ),
    keys,
  );
  await context.close();
});

await scenario('unknown shell cache blocks payload budget without deleting it', async () => {
  const { context, page } = await fresh();
  await page.evaluate(async () => {
    await (
      await caches.open('wrn.website-shell.v99.future')
    ).put('/sentinel', new Response('future'));
  });
  h.serve('B');
  const before = h.report.events.length;
  const update = await page.evaluate(() => window.shell.update());
  const remove = await page.evaluate(() => window.shell.remove());
  h.check(
    'unknown namespace is protected for both update and removal',
    update.kind === 'protected' &&
      remove.kind === 'protected' &&
      (await page.evaluate(async () =>
        (await caches.match('/sentinel', { cacheName: 'wrn.website-shell.v99.future' })).text(),
      )) === 'future' &&
      !h.report.events
        .slice(before)
        .some((e) => e.event === 'network' && e.value.pathname.startsWith('/assets/')),
    { update, remove },
  );
  await context.close();
});

await scenario('evicted or corrupted own payload is not advertised ready', async () => {
  const { context, page } = await fresh();
  await page.evaluate(async () => {
    const names = await caches.keys();
    const payload = await caches.open(names.find((n) => n.includes('.payload.')));
    await payload.put(
      '/assets/index-a.js',
      new Response('corrupt', { headers: { 'content-type': 'text/javascript; charset=utf-8' } }),
    );
  });
  const corrupted = await page.evaluate(() => window.shell.refresh());
  h.check(
    'cached integrity failure is an honest incomplete status',
    corrupted.kind === 'error' && corrupted.code === 'incomplete',
    corrupted,
  );
  await page.evaluate(async () => {
    for (const name of await caches.keys())
      if (name.includes('.payload.')) await caches.delete(name);
  });
  const evicted = await page.evaluate(() => window.shell.refresh());
  h.check(
    'evicted payload is not advertised saved or active',
    evicted.kind === 'error' && evicted.code === 'incomplete',
    evicted,
  );
  await context.close();
});

await scenario('incompatible full package cannot become a rollback candidate', async () => {
  const { context, page } = await fresh();
  const incompatible = await buildOfflineShell({
    outputDirectory: h.packages.B.directory,
    compatibility: 'future-incompatible',
  });
  h.packages.B.manifest = incompatible.manifest;
  h.report.packages.B = incompatible.manifest;
  h.serve('B');
  const start = h.report.events.length;
  const result = await page.evaluate(() => window.shell.update());
  const state = await h.snapshot(page);
  h.check(
    'incompatible package rejected before writes or payload requests',
    result.kind === 'error' &&
      state.control.generations.length === 1 &&
      !state.waiting &&
      !h.report.events
        .slice(start)
        .some((e) => e.event === 'network' && e.value.pathname.startsWith('/assets/')),
    { result, state },
  );
  h.check(
    'incompatible update preserves complete active A',
    (await asset(page)).id === h.packages.A.manifest.shellId,
    state,
  );
  await context.close();
});

await scenario('oversized existing control stays protected and byte identical', async () => {
  const context = await h.launch();
  const page = context.pages()[0];
  h.serve('A');
  await page.goto(h.origin);
  const body = await page.evaluate(async () => {
    const p = (await import('/__shell/protocol.mjs')).createShellProtocol();
    const body = JSON.stringify(p.initial(1)) + ' '.repeat(p.maxControlMetadata);
    await (await caches.open(p.controlCache)).put(p.controlKey, new Response(body));
    return body;
  });
  await h.attach(page);
  const enable = await page.evaluate(() => window.shell.enable());
  const remove = await page.evaluate(() => window.shell.remove());
  const retained = await page.evaluate(async () =>
    (
      await caches.match('/__wrn_website_shell_control_v1__', {
        cacheName: 'wrn.website-shell.v1.control',
      })
    ).text(),
  );
  h.check(
    'oversized control is never truncated reset or deleted',
    enable.kind === 'protected' && remove.kind === 'protected' && retained === body,
    { enable, remove, bytes: new TextEncoder().encode(retained).byteLength },
  );
  await context.close();
});

const report = await h.finish();
process.exitCode = report.errors.length ? 2 : report.assertions.some((x) => !x.passed) ? 1 : 0;
