import { coreHarness, poll } from './website-shell-core-helper.mjs';

const h = await coreHarness('regressions');
try {
  // Independent missing-opt-in case; it is never used to establish lawful A.
  const missing = await h.launch();
  const m = missing.pages()[0];
  await m.goto(h.origin);
  await m.evaluate(async () => {
    try {
      await navigator.serviceWorker.register('/website-shell-sw.js', { scope: '/' });
    } catch {
      /* expected rejection */
    }
  });
  await poll(
    () => m.evaluate(async () => !(await navigator.serviceWorker.getRegistration())?.installing),
    'missing installer settled',
  );
  const absent = await h.snapshot(m);
  h.check(
    'S3-H-001: missing control never authorizes installation',
    !absent.control && absent.caches.length === 0 && !absent.active,
    absent,
  );
  await missing.close();

  const context = await h.launch();
  const a = context.pages()[0];
  await a.goto(h.origin);
  await h.attach(a);
  const pristine = await h.snapshot(a);
  h.check(
    'default construction is observational',
    pristine.caches.length === 0 && !pristine.active,
    pristine,
  );
  h.record('enable-result', await a.evaluate(() => window.shell.enable()));
  await poll(
    () =>
      a.evaluate(
        async () =>
          (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated',
      ),
    'lawful A active',
  );
  await a.reload();
  await h.attach(a);
  const a2 = await context.newPage();
  await a2.goto(h.origin);
  const asset = (page) =>
    page.evaluate(async () => {
      try {
        const r = await fetch('/assets/index-a.js');
        return { id: r.headers.get('x-wrn-shell-id'), body: await r.text() };
      } catch (error) {
        return { error: error.message };
      }
    });
  const before = await asset(a);
  if (before.id !== h.packages.A.manifest.shellId) throw new Error('lawful A precondition failed');
  h.serve('B');
  h.record('update-result', await a.evaluate(() => window.shell.update()));
  await poll(
    () =>
      a.evaluate(
        async () =>
          (await navigator.serviceWorker.getRegistration())?.waiting?.state === 'installed',
      ),
    'B truly waiting',
  );
  h.record('B-waiting', await h.snapshot(a));
  const after = [await asset(a), await asset(a2)];
  h.check(
    'S3-H-002: two lawful A tabs retain A bytes while B waits',
    after.every((x) => x.id === h.packages.A.manifest.shellId),
    after,
  );
  await poll(
    () => a.evaluate(() => window.shell.getSnapshot().kind === 'waiting'),
    'adapter waiting publication',
  );
  h.check(
    'default adapter exposes real waiting',
    (await h.snapshot(a)).status?.kind === 'waiting',
    await h.snapshot(a),
  );
} catch (error) {
  h.report.errors.push({ message: error.message, stack: error.stack });
}
const report = await h.finish();
process.exitCode = report.errors.length ? 2 : report.assertions.some((x) => !x.passed) ? 1 : 0;
