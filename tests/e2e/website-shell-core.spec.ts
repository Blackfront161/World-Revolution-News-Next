import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { expect, test } from '@playwright/test';

test('P2 real default shell, process restart, generation and storage/job matrix', async ({
  browserName,
}, info) => {
  test.skip(browserName !== 'chromium' || info.project.name !== 'website-390x844');
  test.setTimeout(420000);
  const childEnvironment = { ...process.env, FORCE_COLOR: '0' };
  delete childEnvironment.NO_COLOR;
  for (const file of ['regressions', 'matrix', 'races', 'coldstart', 'safety']) {
    const result = await promisify(execFile)(
      process.execPath,
      [`tests/e2e/website-shell-core-${file}.mjs`],
      { timeout: 180000, maxBuffer: 1024 * 1024, env: childEnvironment },
    );
    await info.attach('shell-core-' + file, {
      body: result.stdout + result.stderr,
      contentType: 'text/plain',
    });
    expect(result.stderr).toBe('');
  }
});
