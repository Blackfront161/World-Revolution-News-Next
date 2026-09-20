import { coreHarness, poll } from './website-shell-core-helper.mjs';

const h = await coreHarness('races');
const fresh = async () => {
  h.serve('A');
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
    'active A',
  );
  await page.reload();
  await h.attach(page);
  await page.evaluate(() => window.shell.refresh());
  return { context, page };
};
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
const nextWorker = async (context, page, injection, arg, holdLock = false) => {
  let arrived, release;
  const seen = new Promise((resolve) => {
    arrived = resolve;
  });
  const held = new Promise((resolve) => {
    release = resolve;
  });
  h.intercept(async ({ pathname }) => {
    if (pathname !== '/website-shell-sw.js') return false;
    arrived();
    await held;
    return false;
  });
  h.serve('B');
  await page.evaluate(() => {
    window.action = window.shell.update();
  });
  await seen;
  await page.evaluate(() => {
    void navigator.locks.request('wrn.website-shell.v1.lock', async () => {
      window.lockHeld = true;
      await new Promise((resolve) => {
        window.unlock = resolve;
      });
    });
  });
  await poll(() => page.evaluate(() => window.lockHeld), 'test-only pre-install lock acquired');
  const incoming = context.waitForEvent('serviceworker');
  release();
  const worker = await incoming;
  await worker.evaluate(injection, arg);
  if (!holdLock) await page.evaluate(() => window.unlock());
  h.intercept(null);
  return worker;
};

for (const method of ['open', 'put'])
  await scenario('awaited worker Cache.' + method + ' vs remove', async () => {
    const { context, page } = await fresh();
    const second = await context.newPage();
    await second.goto(h.origin);
    await h.attach(second);
    await second.evaluate(() => window.shell.refresh());
    const worker = await nextWorker(
      context,
      page,
      (method) => {
        const owner = method === 'open' ? CacheStorage.prototype : Cache.prototype;
        const original = owner[method];
        owner[method] = async function (...args) {
          const target = String(args[0]);
          if (
            (method === 'open' && target.includes('.payload.')) ||
            (method === 'put' && target.startsWith('/assets/'))
          ) {
            self.barrier = true;
            await new Promise((resolve) => {
              self.releaseBarrier = resolve;
            });
            owner[method] = original;
          }
          return original.apply(this, args);
        };
      },
      method,
    );
    await poll(
      () => worker.evaluate(() => self.barrier === true),
      'native cache barrier ' + method,
    );
    await second.evaluate(() => {
      window.removal = window.shell.remove().then((s) => {
        window.removedResult = s;
        return s;
      });
    });
    await poll(
      () => second.evaluate(() => window.shell.getSnapshot().kind === 'pending'),
      'remove pending behind cache write',
    );
    const pending = await h.snapshot(second);
    h.check(
      method + ' unresolved write never claims removed',
      pending.control.state === 'enabled' && pending.status.kind === 'pending',
      pending,
    );
    await worker.evaluate(() => self.releaseBarrier());
    const removed = await second.evaluate(() => window.removal);
    await page.evaluate(() => window.action);
    const final = await h.snapshot(second);
    h.check(
      method + ' settles before true removal, no late refill',
      removed.kind === 'removed' &&
        final.control.state === 'removed' &&
        final.caches.every((n) => !n.includes('.payload.')),
      { removed, final },
    );
    await context.close();
  });

await scenario('read match vs remove never recreates a cache', async () => {
  const { context, page } = await fresh();
  const second = await context.newPage();
  await second.goto(h.origin);
  await h.attach(second);
  await second.evaluate(() => window.shell.refresh());
  const worker = context.serviceWorkers()[0];
  await worker.evaluate(() => {
    const original = CacheStorage.prototype.match;
    CacheStorage.prototype.match = async function (...args) {
      if (args[1]?.cacheName?.includes('.payload.')) {
        self.readHeld = true;
        await new Promise((resolve) => {
          self.releaseRead = resolve;
        });
      }
      return original.apply(this, args);
    };
  });
  await page.evaluate(() => {
    window.readResult = fetch('/assets/index-a.js').then(
      () => 'response',
      () => 'failed',
    );
  });
  await poll(
    () => worker.evaluate(() => self.readHeld === true),
    'payload read held before native match',
  );
  const removed = await second.evaluate(() => window.shell.remove());
  await worker.evaluate(() => self.releaseRead());
  const result = await page.evaluate(() => window.readResult);
  const state = await h.snapshot(second);
  h.check(
    'read-after-delete has no open/refill',
    removed.kind === 'removed' &&
      result === 'failed' &&
      state.caches.every((n) => !n.includes('.payload.')),
    { result, state },
  );
  await context.close();
});

await scenario('window delete barrier and process restart durable removing', async () => {
  const { context, page } = await fresh();
  await page.evaluate(() => {
    const original = CacheStorage.prototype.delete;
    CacheStorage.prototype.delete = async function (...args) {
      window.deleteHeld = true;
      await new Promise((resolve) => {
        window.releaseDelete = resolve;
      });
      return original.apply(this, args);
    };
    window.removal = window.shell.remove();
  });
  await poll(() => page.evaluate(() => window.deleteHeld === true), 'native delete barrier');
  const during = await h.snapshot(page);
  h.check(
    'durable removing before native delete settlement',
    during.control.state === 'removing' && during.status.kind === 'pending',
    during,
  );
  const profile = context.testProfile;
  await context.close();
  const next = await h.launch(profile);
  const reopened = next.pages()[0];
  await reopened.goto(h.origin);
  await h.attach(reopened);
  await poll(
    async () => (await reopened.evaluate(() => window.shell.refresh())).kind === 'removed',
    'durable removing recovery',
  ).catch(() => undefined);
  const after = await h.snapshot(reopened);
  h.check(
    'restarted removing resumes deletion only',
    after.control.state === 'removed' && after.caches.every((n) => !n.includes('.payload.')),
    after,
  );
  await next.close();
});

await scenario('quota before ready preserves complete A', async () => {
  const { context, page } = await fresh();
  await nextWorker(context, page, () => {
    const original = Cache.prototype.put;
    Cache.prototype.put = function (...args) {
      if (String(args[0]).startsWith('/assets/'))
        return Promise.reject(new DOMException('test quota', 'QuotaExceededError'));
      return original.apply(this, args);
    };
  });
  const result = await page.evaluate(() => window.action);
  const state = await h.snapshot(page);
  h.check(
    'quota rejects stage and keeps A',
    result.kind === 'error' &&
      state.control.generations.length === 1 &&
      state.control.active === h.packages.A.manifest.shellId,
    { result, state },
  );
  await context.close();
});

await scenario('activate bookkeeping failure cannot make ready B unreadable', async () => {
  const { context, page } = await fresh();
  const worker = await nextWorker(
    context,
    page,
    (b) => {
      const original = Cache.prototype.put;
      Cache.prototype.put = async function (...args) {
        if (String(args[0]).includes('__wrn_website_shell_control')) {
          const control = await args[1].clone().json();
          if (control.active === b) {
            self.activateFailed = true;
            throw new Error('test activate persistence failure');
          }
        }
        return original.apply(this, args);
      };
    },
    h.packages.B.manifest.shellId,
  );
  await page.evaluate(() => window.action);
  await poll(
    () =>
      page.evaluate(
        async () =>
          (await navigator.serviceWorker.getRegistration())?.waiting?.state === 'installed',
      ),
    'B waiting before activate interruption',
  );
  const ready = await h.snapshot(page);
  h.check(
    'B is durable ready before activate',
    ready.control.generations.some((g) => g.id === h.packages.B.manifest.shellId && g.ready),
    ready,
  );
  await page.goto('about:blank');
  await poll(
    () => worker.evaluate(() => self.activateFailed === true),
    'activate critical write fault',
  );
  const response = await page.goto(h.origin);
  h.check(
    'B served despite failed activate bookkeeping',
    response.headers()['x-wrn-shell-id'] === h.packages.B.manifest.shellId &&
      (await page.locator('main').innerText()) === 'CORE-B',
    { header: response.headers()['x-wrn-shell-id'], state: await h.snapshot(page) },
  );
  await context.close();
});

await scenario('stale and unsolicited prepare messages are inert', async () => {
  const { context, page } = await fresh();
  const worker = context.serviceWorkers()[0];
  await worker.evaluate(() => {
    const original = CacheStorage.prototype.open;
    self.opens = 0;
    CacheStorage.prototype.open = function (...args) {
      self.opens++;
      return original.apply(this, args);
    };
  });
  await page.evaluate(() => {
    for (const m of [
      { requestId: 'old-job', epoch: 1 },
      { requestId: 'old-job', epoch: 999 },
      { requestId: 'x'.repeat(100), epoch: 1 },
    ])
      navigator.serviceWorker.controller.postMessage({
        protocol: 'wrn.website-shell.v1',
        type: 'prepare',
        ...m,
      });
  });
  // Use a status round trip as an ordered message queue barrier, not a sleep.
  await page.evaluate(() => window.shell.refresh());
  h.check(
    'prepare without exact current register ticket performs no writes',
    (await worker.evaluate(() => self.opens)) === 0,
    await h.snapshot(page),
  );
  await page.evaluate(async () => {
    const { createShellProtocol } = await import('/__shell/protocol.mjs');
    const p = createShellProtocol();
    await navigator.locks.request(p.lock, async () => {
      const c = (await p.read(caches)).value;
      window.beforeNegativeTicket = c;
      await p.write(caches, {
        ...c,
        pendingJob: { id: 'current-register-ticket', epoch: c.epoch, kind: 'register' },
      });
      for (const message of [
        { requestId: 'old-ticket', epoch: c.epoch },
        { requestId: 'current-register-ticket', epoch: c.epoch + 1 },
      ])
        navigator.serviceWorker.controller.postMessage({
          protocol: p.protocol,
          type: 'prepare',
          ...message,
        });
    });
  });
  await page.evaluate(() => window.shell.refresh());
  h.check(
    'old ticket and wrong epoch cannot consume a current register job',
    (await worker.evaluate(() => self.opens)) === 0 &&
      (await h.snapshot(page)).control.pendingJob.id === 'current-register-ticket',
    await h.snapshot(page),
  );
  await page.evaluate(async () => {
    const p = (await import('/__shell/protocol.mjs')).createShellProtocol();
    await navigator.locks.request(p.lock, () => p.write(caches, window.beforeNegativeTicket));
  });
  await context.close();
});

await scenario('late native registration settlement cannot re-enable after remove', async () => {
  const context = await h.launch();
  const page = context.pages()[0];
  h.serve('A');
  await page.goto(h.origin);
  await h.attach(page);
  await page.evaluate(() => {
    const original = navigator.serviceWorker.register.bind(navigator.serviceWorker);
    navigator.serviceWorker.register = async (...args) => {
      const value = await original(...args);
      window.nativeSettled = true;
      await new Promise((resolve) => {
        window.releaseNative = resolve;
      });
      return value;
    };
    window.oldEnable = window.shell.enable();
  });
  await poll(
    () => page.evaluate(() => window.nativeSettled),
    'real native registration settled before delayed JS publication',
  );
  await poll(
    () =>
      page.evaluate(
        async () =>
          (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated',
      ),
    'native install ready',
  );
  const second = await context.newPage();
  await second.goto(h.origin);
  await h.attach(second);
  await second.evaluate(() => window.shell.refresh());
  const removed = await second.evaluate(() => window.shell.remove());
  const enabled = await second.evaluate(() => window.shell.enable());
  const before = await h.snapshot(second);
  await page.evaluate(() => window.releaseNative());
  await page.evaluate(() => window.oldEnable);
  const after = await h.snapshot(second);
  h.check(
    'late old job cannot adopt new enabled epoch',
    removed.kind === 'removed' &&
      enabled.epoch > removed.epoch &&
      JSON.stringify(before.control) === JSON.stringify(after.control),
    { removed, enabled, before, after },
  );
  await context.close();
});

await scenario('prepare versus remove is epoch fenced and awaited', async () => {
  const { context, page } = await fresh();
  const worker = context.serviceWorkers()[0];
  await page.evaluate(() => window.shell.remove());
  await worker.evaluate(() => {
    const original = Cache.prototype.put;
    Cache.prototype.put = async function (...args) {
      if (String(args[0]).startsWith('/assets/')) {
        self.prepareHeld = true;
        await new Promise((resolve) => {
          self.releasePrepare = resolve;
        });
        Cache.prototype.put = original;
      }
      return original.apply(this, args);
    };
  });
  await page.evaluate(() => {
    window.preparing = window.shell.enable();
  });
  await poll(
    () => worker.evaluate(() => self.prepareHeld),
    'identical worker prepare in real cacheput',
  );
  const second = await context.newPage();
  await second.goto(h.origin + '/__shell/adapter.js');
  await h.attach(second);
  await second.evaluate(() => window.shell.refresh());
  await second.evaluate(() => {
    window.removal = window.shell.remove();
  });
  await poll(
    () => second.evaluate(() => window.shell.getSnapshot().kind === 'pending'),
    'prepare-remove pending',
  );
  await worker.evaluate(() => self.releasePrepare());
  const removed = await second.evaluate(() => window.removal);
  await page.evaluate(() => window.preparing);
  h.check(
    'remove waits for prepare then leaves disabled marker',
    removed.kind === 'removed' &&
      (await h.snapshot(second)).caches.every((n) => !n.includes('.payload.')),
    await h.snapshot(second),
  );
  await context.close();
});

await scenario('30 second install deadline includes actual WebLock wait', async () => {
  const { context, page } = await fresh();
  await nextWorker(context, page, () => undefined, undefined, true);
  await new Promise((resolve) => setTimeout(resolve, 31000));
  await page.evaluate(() => window.unlock());
  const result = await page.evaluate(() => window.action);
  const state = await h.snapshot(page);
  h.check(
    'lockwait deadline rejects before stage/payload writes',
    result.kind === 'error' &&
      state.control.generations.length === 1 &&
      state.control.active === h.packages.A.manifest.shellId,
    { result, state },
  );
  await context.close();
});

await scenario('after Ready worker termination and process restart stays complete', async () => {
  const { context, page } = await fresh();
  h.serve('B');
  await page.evaluate(() => window.shell.update());
  const ready = await h.snapshot(page);
  const cdp = await context.newCDPSession(page);
  const versions = new Map();
  cdp.on('ServiceWorker.workerVersionUpdated', ({ versions: updates }) => {
    for (const version of updates) versions.set(version.versionId, version);
  });
  await cdp.send('ServiceWorker.enable');
  await poll(
    () => [...versions.values()].some((v) => v.status === 'installed'),
    'installed version for termination',
  );
  const waiting = [...versions.values()].find((v) => v.status === 'installed');
  await cdp.send('ServiceWorker.stopWorker', { versionId: waiting.versionId });
  h.record('after-ready-worker-termination', { ready, waiting });
  const profile = context.testProfile;
  await context.close();
  const next = await h.launch(profile, true);
  const reopened = next.pages()[0];
  const response = await reopened.goto(h.origin);
  h.check(
    'ready B survives termination before first B fetch',
    response.headers()['x-wrn-shell-id'] === h.packages.B.manifest.shellId &&
      (await reopened.locator('main').innerText()) === 'CORE-B',
    { header: response.headers()['x-wrn-shell-id'], state: await h.snapshot(reopened) },
  );
  await next.close();
});

await scenario('termination before Ready never serves a partial stage', async () => {
  const { context, page } = await fresh();
  const cdp = await context.newCDPSession(page);
  const versions = new Map();
  cdp.on('ServiceWorker.workerVersionUpdated', ({ versions: updates }) => {
    for (const v of updates) versions.set(v.versionId, v);
  });
  await cdp.send('ServiceWorker.enable');
  const worker = await nextWorker(context, page, () => {
    const original = Cache.prototype.put;
    Cache.prototype.put = async function (...args) {
      const result = await original.apply(this, args);
      if (String(args[0]).startsWith('/assets/')) {
        self.beforeReadyHeld = true;
        await new Promise(() => undefined);
      }
      return result;
    };
  });
  await poll(() => worker.evaluate(() => self.beforeReadyHeld), 'actual native put before Ready');
  await poll(
    () => [...versions.values()].some((v) => v.status === 'installing'),
    'installing version',
  );
  const target = [...versions.values()].find((v) => v.status === 'installing');
  await cdp.send('ServiceWorker.stopWorker', { versionId: target.versionId });
  await poll(
    () => page.evaluate(async () => !(await navigator.serviceWorker.getRegistration())?.installing),
    'terminated installation settled',
  );
  const state = await h.snapshot(page);
  const response = await page.evaluate(async () => {
    const r = await fetch('/assets/index-a.js');
    return r.headers.get('x-wrn-shell-id');
  });
  h.check(
    'terminated partial B has no Ready and A remains readable',
    !state.control.generations.some((g) => g.id === h.packages.B.manifest.shellId && g.ready) &&
      response === h.packages.A.manifest.shellId,
    state,
  );
  const second = await context.newPage();
  await second.goto(h.origin + '/__shell/adapter.js');
  await h.attach(second);
  await second.evaluate(() => window.shell.refresh());
  const removed = await second.evaluate(() => window.shell.remove());
  h.check(
    'terminated stage can be removed through the native queue fence',
    removed.kind === 'removed',
    { removed, state: await h.snapshot(second) },
  );
  await context.close();
});

await scenario('late Ready storage completion must not exceed the build deadline', async () => {
  const { context, page } = await fresh();
  const worker = await nextWorker(
    context,
    page,
    (b) => {
      const original = Cache.prototype.put;
      Cache.prototype.put = async function (...args) {
        if (String(args[0]).includes('__wrn_website_shell_control')) {
          const c = await args[1].clone().json();
          if (c.generations.some((g) => g.id === b && g.ready)) {
            self.readyHeld = true;
            await new Promise((resolve) => {
              self.releaseReady = resolve;
            });
            Cache.prototype.put = original;
          }
        }
        return original.apply(this, args);
      };
    },
    h.packages.B.manifest.shellId,
  );
  await poll(() => worker.evaluate(() => self.readyHeld), 'last Ready write paused');
  await new Promise((resolve) => setTimeout(resolve, 31000));
  await worker.evaluate(() => self.releaseReady());
  const result = await page.evaluate(() => window.action);
  const state = await h.snapshot(page);
  h.check(
    'late Ready write is awaited then rejected, never a successful late install',
    result.kind === 'error' &&
      !state.control.generations.some((g) => g.id === h.packages.B.manifest.shellId),
    { result, state },
  );
  await context.close();
});

await scenario('actual window closes after native register starts', async () => {
  h.serve('A');
  const context = await h.launch();
  const page = context.pages()[0];
  await page.goto(h.origin);
  await h.attach(page);
  const second = await context.newPage();
  await second.goto(h.origin + '/__shell/adapter.js');
  await h.attach(second);
  let arrived, release;
  const seen = new Promise((resolve) => {
    arrived = resolve;
  });
  const held = new Promise((resolve) => {
    release = resolve;
  });
  h.intercept(async ({ pathname }) => {
    if (pathname !== '/website-shell-sw.js') return false;
    arrived();
    await held;
    return false;
  });
  await page.evaluate(() => {
    void window.shell.enable();
  });
  await seen;
  const dispatched = await second.evaluate(async () =>
    (
      await caches.match('/__wrn_website_shell_control_v1__', {
        cacheName: 'wrn.website-shell.v1.control',
      })
    ).json(),
  );
  await page.close();
  release();
  h.intercept(null);
  await second.evaluate(() => window.shell.refresh());
  const removed = await second.evaluate(() => window.shell.remove());
  const result = await second.evaluate(() => window.shell.refresh());
  const after = await h.snapshot(second);
  h.check(
    'closed native-job owner cannot report false removal or create late payload',
    dispatched.pendingJob?.kind === 'register' &&
      ['pending', 'removed'].includes(removed.kind) &&
      ['pending', 'removed'].includes(result.kind) &&
      after.control.enabled === false &&
      after.caches.every((n) => !n.includes('.payload.')),
    { dispatched, removed, result, after },
  );
  const profile = context.testProfile;
  await context.close();
  const restarted = await h.launch(profile);
  const reopened = restarted.pages()[0];
  await reopened.goto(h.origin);
  await h.attach(reopened);
  const observed = await reopened.evaluate(() => window.shell.refresh());
  const again = await h.snapshot(reopened);
  h.check(
    'native-job owner crash remains disabled across full browser restart',
    ['pending', 'removed'].includes(observed.kind) &&
      again.control.enabled === false &&
      again.caches.every((n) => !n.includes('.payload.')),
    { observed, again },
  );
  await restarted.close();
});

for (const closeOwner of [false, true])
  await scenario(
    'open script download default observe and durable remove fence ownerClosed=' + closeOwner,
    async () => {
      h.serve('A');
      const context = await h.launch();
      const page = context.pages()[0];
      await page.goto(h.origin);
      await h.attach(page);
      const second = await context.newPage();
      await second.goto(h.origin + '/__shell/adapter.js');
      let arrived, release;
      const seen = new Promise((resolve) => {
        arrived = resolve;
      });
      const held = new Promise((resolve) => {
        release = resolve;
      });
      h.intercept(async ({ pathname }) => {
        if (pathname !== '/website-shell-sw.js') return false;
        arrived();
        await held;
        return false;
      });
      await page.evaluate(() => {
        void window.shell.enable();
      });
      await seen;
      try {
        if (closeOwner) await page.close();
        await second.evaluate(() => {
          void navigator.serviceWorker.getRegistration().then(() => {
            window.singularDone = true;
          });
          void navigator.serviceWorker.getRegistrations().then(() => {
            window.pluralDone = true;
          });
        });
        await h.attach(second);
        await poll(
          () => second.evaluate(() => window.shell.getSnapshot().kind === 'pending'),
          'observe open native job',
          2500,
        ).catch(() => undefined);
        const observed = await second.evaluate(() => ({
          singular: !!window.singularDone,
          plural: !!window.pluralDone,
          status: window.shell.getSnapshot(),
        }));
        h.check(
          'default observe bounded pending with native script download still open',
          observed.status.kind === 'pending' && observed.status.epoch === 1,
          observed,
        );
        await second.evaluate(() => {
          window.openQueueRemove = window.shell.remove();
        });
        await poll(
          () =>
            second.evaluate(
              async () =>
                (
                  await (
                    await caches.match('/__wrn_website_shell_control_v1__', {
                      cacheName: 'wrn.website-shell.v1.control',
                    })
                  ).json()
                ).enabled === false,
            ),
          'durable disabled while script download open',
          2500,
        ).catch(() => undefined);
        const fenced = await second.evaluate(async () => ({
          control: await (
            await caches.match('/__wrn_website_shell_control_v1__', {
              cacheName: 'wrn.website-shell.v1.control',
            })
          ).json(),
          status: window.shell.getSnapshot(),
          singular: !!window.singularDone,
          plural: !!window.pluralDone,
        }));
        h.check(
          'default remove reaches durable disabled without awaiting native download under lock',
          fenced.control.state === 'removing' &&
            !fenced.control.enabled &&
            fenced.status.kind === 'pending',
          fenced,
        );
      } finally {
        release();
        h.intercept(null);
      }
      await second.evaluate(() => window.openQueueRemove);
      const after = await second.evaluate(() => window.shell.refresh());
      const snapshot = await h.snapshot(second);
      h.check(
        'open queue release cannot refill disabled removed shell',
        ['pending', 'removed'].includes(after.kind) &&
          !snapshot.control.enabled &&
          snapshot.caches.every((name) => !name.includes('.payload.')),
        { after, snapshot },
      );
      await context.close();
    },
  );

await scenario(
  'default subscriptions follow foreign tab and dispose suppresses publications',
  async () => {
    const { context, page } = await fresh();
    await page.evaluate(() => {
      window.publications = 0;
      window.unsubscribeShell = window.shell.subscribe(() => {
        window.publications++;
      });
    });
    const second = await context.newPage();
    await second.goto(h.origin + '/__shell/adapter.js');
    await h.attach(second);
    await second.evaluate(() => window.shell.refresh());
    await second.evaluate(() => window.shell.remove());
    await poll(
      () => page.evaluate(() => window.shell.getSnapshot().kind === 'removed'),
      'foreign-tab remove publication',
    );
    const removed = await page.evaluate(() => ({
      count: window.publications,
      status: window.shell.getSnapshot(),
    }));
    h.check(
      'default subscription receives foreign-tab durable removal',
      removed.count > 0 && removed.status.kind === 'removed',
      removed,
    );
    await page.evaluate(() => {
      window.unsubscribeShell();
      window.shell.dispose();
    });
    const enabled = await second.evaluate(() => window.shell.enable());
    const after = await page.evaluate(() => ({
      count: window.publications,
      status: window.shell.getSnapshot(),
    }));
    h.check(
      'disposed default adapter keeps frozen snapshot and no publications after re-enable',
      ['active', 'saved'].includes(enabled.kind) &&
        JSON.stringify(removed) === JSON.stringify(after),
      { enabled, after },
    );
    await context.close();
  },
);

const report = await h.finish();
process.exitCode = report.errors.length ? 2 : report.assertions.some((x) => !x.passed) ? 1 : 0;
