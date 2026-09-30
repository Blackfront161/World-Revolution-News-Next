import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { coreHarness, poll } from './website-shell-core-helper.mjs';

const h = await coreHarness('compression');
try {
  for (const encoding of ['br', 'gzip']) {
    const transfers = [];
    h.intercept(async ({ pathname, res, served, packages }) => {
      const file = pathname === '/' ? '/index.html' : pathname;
      const entry = packages[served].manifest.entries.find((e) => e.path === file);
      if (!entry) return false;
      const bytes = await readFile(path.join(packages[served].directory, file.slice(1)));
      const coded = encoding === 'br' ? brotliCompressSync(bytes) : gzipSync(bytes);
      transfers.push({ path: file, decoded: bytes.length, encoded: coded.length, encoding });
      res.writeHead(200, {
        'content-type': entry.mime,
        'content-encoding': encoding,
        'content-length': coded.length,
        'cache-control': 'no-store',
      });
      res.end(coded);
      return true;
    });
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
      encoding + ' actual compressed installation',
    );
    const before = await h.snapshot(page);
    assert.equal(before.control.generations[0].ready, true);
    assert(transfers.some((entry) => entry.encoded !== entry.decoded));
    await page.close();
    await context.setOffline(true);
    const reopened = await context.newPage();
    await reopened.goto(h.origin);
    assert.equal(await reopened.locator('main').textContent(), 'CORE-A');
    const stored = await reopened.evaluate(async (entries) => {
      const result = [];
      for (const entry of entries) {
        const response = await fetch(entry.path);
        const bytes = await response.arrayBuffer();
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        result.push({
          path: entry.path,
          bytes: bytes.byteLength,
          sha256: [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join(''),
          mime: response.headers.get('content-type'),
          encoding: response.headers.get('content-encoding'),
        });
      }
      return result;
    }, h.packages.A.manifest.entries);
    for (let i = 0; i < stored.length; i++) {
      const expected = h.packages.A.manifest.entries[i];
      assert.equal(stored[i].bytes, expected.bytes);
      assert.equal(stored[i].sha256, expected.sha256);
      assert.equal(stored[i].mime, expected.mime);
      assert.equal(stored[i].encoding, null);
    }
    h.check(
      encoding + ': real compressed HTTP installation and offline reopened exact nine-entry shell',
      true,
      { transfers, stored, control: before.control },
    );
    await context.close();
  }
} catch (error) {
  h.report.errors.push({ message: error.message, stack: error.stack });
}
const report = await h.finish();
process.exitCode = report.errors.length ? 2 : report.assertions.some((x) => !x.passed) ? 1 : 0;
