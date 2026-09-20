import { readFile } from 'node:fs/promises';
import { coreHarness, poll } from './website-shell-core-helper.mjs';

const h = await coreHarness('outcome-a');

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
    'A activated',
  );
  await page.reload();
  await h.attach(page);
  await page.evaluate(() => window.shell.refresh());
  return { context, page };
};

await scenario(
  'unchanged native update is indeterminate and restart does not invent success',
  async () => {
    const { context, page } = await fresh();
    const result = await page.evaluate(() => window.shell.update());
    const readiness = await page.evaluate(() => window.shell.getSnapshot());
    const state = await h.snapshot(page);
    h.check(
      'unbound native update terminates indeterminate while readiness remains active',
      result.kind === 'active' &&
        result.outcome?.kind === 'indeterminate' &&
        result.outcome?.operation === 'update' &&
        result.outcome?.code === 'native-outcome-unbound' &&
        !('outcome' in readiness) &&
        state.control.pendingJob === null,
      { result, readiness, state },
    );

    const profile = context.testProfile;
    await context.close();
    const reopened = await h.launch(profile);
    const next = reopened.pages()[0];
    await next.goto(h.origin);
    await h.attach(next);
    const afterRestart = await next.evaluate(() => window.shell.refresh());
    h.check(
      'restart exposes readiness only and cannot retrospectively promote the old attempt',
      ['active', 'saved'].includes(afterRestart.kind) && !('outcome' in afterRestart),
      afterRestart,
    );
    const explicitRetry = await next.evaluate(() => window.shell.update());
    h.check(
      'explicit retry is admitted only after the prior pending fence is clear',
      explicitRetry.outcome?.kind === 'indeterminate',
      explicitRetry,
    );
    await reopened.close();
  },
);

await scenario('known native install failure remains failed', async () => {
  const { context, page } = await fresh();
  h.serve('B');
  h.intercept(async ({ pathname, res }) => {
    if (pathname !== '/assets/index-a.js') return false;
    res.writeHead(404);
    res.end();
    return true;
  });
  const result = await page.evaluate(() => window.shell.update());
  const readiness = await page.evaluate(() => window.shell.getSnapshot());
  h.check(
    'bound redundant worker is a known failed attempt, not indeterminate',
    result.kind === 'error' &&
      result.outcome?.kind === 'failed' &&
      result.outcome?.code === 'incomplete' &&
      !('outcome' in readiness),
    { result, readiness },
  );
  await context.close();
});

await scenario('single bound native update succeeds', async () => {
  const { context, page } = await fresh();
  h.serve('B');
  const result = await page.evaluate(() => window.shell.update());
  const readiness = await page.evaluate(() => window.shell.getSnapshot());
  h.check(
    'single bound non-redundant worker yields succeeded separate from waiting readiness',
    result.kind === 'waiting' &&
      result.outcome?.kind === 'succeeded' &&
      result.outcome?.operation === 'update' &&
      !('outcome' in readiness),
    { result, readiness },
  );
  await context.close();
});

await scenario('competing tab cannot cross the pending fence', async () => {
  const { context, page } = await fresh();
  const peer = await context.newPage();
  await peer.goto(h.origin);
  await h.attach(peer);
  await peer.evaluate(() => window.shell.refresh());
  h.serve('B');

  let releaseAsset;
  let blocked = false;
  const gate = new Promise((resolve) => {
    releaseAsset = resolve;
  });
  h.intercept(async ({ pathname, res, packages }) => {
    if (pathname !== '/assets/index-a.js') return false;
    blocked = true;
    await gate;
    const body = await readFile(packages.B.directory + pathname);
    res.writeHead(200, {
      'content-type': 'text/javascript; charset=utf-8',
      'content-length': body.length,
    });
    res.end(body);
    return true;
  });

  const first = page.evaluate(() => window.shell.update());
  await poll(() => blocked, 'first tab entered B install');
  const competing = await peer.evaluate(() => window.shell.update());
  releaseAsset();
  await first;
  h.check(
    'competing tab is a known failed attempt and does not start a retry',
    competing.kind === 'error' &&
      competing.outcome?.kind === 'failed' &&
      competing.outcome?.code === 'incomplete',
    competing,
  );
  await context.close();
});

const report = await h.finish();
process.exitCode = report.errors.length ? 2 : report.assertions.some((x) => !x.passed) ? 1 : 0;
