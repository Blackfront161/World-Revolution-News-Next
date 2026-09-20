import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { getProductionMediaCopy } from '../../packages/ui-language/src/events-media';

const harness = `/@fs/${path.resolve('tests/e2e/production-media-first-boot-harness.tsx').replaceAll('\\', '/')}`;
const runner = `/docs/evidence/WRN-RC-MEDIA-2026-09-12/work/first-boot/index.html`;
const expectedEmptyControl = {
  format: 'wrn.production-media-offline.v1',
  generation: 0,
  clearEpoch: 0,
  activeKey: null,
  previousKey: null,
  candidateKey: null,
  pendingRecheck: null,
  lastSuccessfulSourceCheckAt: null,
  lastObservedAt: null,
  safety: { revision: 0, floor: 0, revocationSha256: null, entries: [] },
  highestAcceptedSequence: 0,
  acceptedIdentities: [],
};
type Harness = Readonly<{
  before: {
    offline: { control: unknown; bundles: unknown[] };
    resume: { generation: number; records: unknown[] };
  };
  audioCount(): number;
  audio(index: number): {
    currentTime: number;
    duration: number;
    plays: number;
    src: string;
    srcWrites: number;
  } | null;
  setCurrentTime(index: number, seconds: number): void;
  metadata(index: number): void;
  state(index: number): unknown;
  recheck(index: number): Promise<unknown> | undefined;
  snapshots(): Promise<{
    offline: { control: { activeKey: string | null; clearEpoch: number }; bundles: unknown[] };
    resume: { records: unknown[] };
  }>;
  mountSecondary(): void;
}>;
const api = (page: Page) =>
  page.evaluateHandle(
    () =>
      (window as unknown as { wrnProductionMediaFirstBoot: Harness }).wrnProductionMediaFirstBoot,
  );

for (const [client, port] of [
  ['mobile', 43201],
  ['website', 43202],
] as const) {
  test(`${client} blank first boot, explicit fake playback, resume and durable clear`, async ({
    page,
  }) => {
    const origin = `http://127.0.0.1:${port}`;
    const errors: string[] = [];
    const foreign: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== origin) foreign.push(request.url());
    });
    await page.goto(`${origin}${runner}?client=${client}`);
    await page.evaluate(
      async ({ client, harness }) => {
        const module = (await import(harness)) as {
          mountProductionMediaFirstBootHarness(client: 'mobile' | 'website'): Promise<unknown>;
        };
        await module.mountProductionMediaFirstBootHarness(client);
      },
      { client, harness },
    );
    const copy = getProductionMediaCopy('en');
    const primary = page.locator('#root');
    await expect(
      primary.getByRole('heading', { name: "Why Three is Tor's Magic Number" }),
    ).toBeVisible();

    let handle = await api(page);
    expect(await handle.evaluate((value) => value.before.offline.control)).toEqual(
      expectedEmptyControl,
    );
    expect(await handle.evaluate((value) => value.before.offline.bundles)).toEqual([]);
    expect(await handle.evaluate((value) => value.before.resume)).toEqual({
      generation: 0,
      records: [],
    });

    const beforeDisabledRecheck = await handle.evaluate((value) => value.snapshots());
    expect(await handle.evaluate((value) => value.recheck(0))).toMatchObject({
      phase: 'unavailable',
      reason: 'source-disabled',
    });
    expect(await handle.evaluate((value) => value.snapshots())).toEqual(beforeDisabledRecheck);

    const play = primary.getByRole('button', { name: copy.play, exact: true });
    await play.click();
    let dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: copy.cancel, exact: true })).toBeFocused();
    await dialog.getByRole('button', { name: copy.cancel, exact: true }).click();
    expect(await handle.evaluate((value) => value.audioCount())).toBe(0);

    await play.click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: copy.confirmPlay, exact: true }).click();
    expect(await handle.evaluate((value) => value.audioCount())).toBe(1);
    expect(await handle.evaluate((value) => value.audio(0))).toMatchObject({
      plays: 1,
      srcWrites: 1,
      src: 'https://dn721204.ca.archive.org/0/items/htfti-s6e3-isabela-fernandes-vfinal/htfti-s6e3-isabela-fernandes-vfinal.mp3',
    });
    await handle.evaluate((value) => value.metadata(0));
    await expect(primary.getByRole('button', { name: copy.pause, exact: true })).toBeVisible();

    await handle.evaluate((value) => value.setCurrentTime(0, 12.345));
    await primary.getByRole('button', { name: copy.pause, exact: true }).click();
    await expect
      .poll(async () => (await handle.evaluate((value) => value.snapshots())).resume.records.length)
      .toBe(1);
    await primary.getByRole('button', { name: copy.continue, exact: true }).click();
    await expect
      .poll(async () => (await handle.evaluate((value) => value.audio(0)))?.plays)
      .toBe(2);
    await expect
      .poll(async () => (await handle.evaluate((value) => value.snapshots())).resume.records.length)
      .toBe(0);

    await handle.evaluate((value) => value.setCurrentTime(0, 23.456));
    await primary.getByRole('button', { name: copy.pause, exact: true }).click();
    await expect
      .poll(async () => (await handle.evaluate((value) => value.snapshots())).resume.records.length)
      .toBe(1);
    await handle.evaluate((value) => value.mountSecondary());
    const secondary = page.locator('#secondary-root');
    const resume = secondary.getByRole('button', { name: copy.resume, exact: true });
    await expect(resume).toBeVisible();
    await resume.click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: copy.confirmPlay, exact: true }).click();
    expect(await handle.evaluate((value) => value.audioCount())).toBe(2);
    await handle.evaluate((value) => value.metadata(1));
    await expect(secondary.getByRole('button', { name: copy.pause, exact: true })).toBeVisible();
    expect(await handle.evaluate((value) => value.audio(1))).toMatchObject({
      currentTime: 23.456,
      plays: 1,
      srcWrites: 1,
    });

    await secondary.getByRole('button', { name: copy.clear, exact: true }).click();
    dialog = secondary.getByRole('dialog');
    await dialog.getByRole('button', { name: copy.confirmClear, exact: true }).click();
    await expect(secondary.getByRole('status')).toHaveText(copy.cleared);
    await expect
      .poll(async () => handle.evaluate((value) => value.snapshots()))
      .toMatchObject({
        offline: { control: { activeKey: null }, bundles: [] },
        resume: { records: [] },
      });

    await page.reload();
    await page.evaluate(
      async ({ client, harness }) => {
        const module = (await import(harness)) as {
          mountProductionMediaFirstBootHarness(client: 'mobile' | 'website'): Promise<unknown>;
        };
        await module.mountProductionMediaFirstBootHarness(client);
      },
      { client, harness },
    );
    handle = await api(page);
    await expect(page.locator('#root').getByRole('status')).toHaveText(copy.cleared);
    await expect(page.locator('#root').getByRole('button', { name: copy.play })).toHaveCount(0);
    expect(await handle.evaluate((value) => value.audioCount())).toBe(0);
    const final = await handle.evaluate((value) => value.snapshots());
    expect(final.offline.control.activeKey).toBeNull();
    expect(final.offline.control.clearEpoch).toBeGreaterThan(0);
    expect(final.offline.bundles).toEqual([]);
    expect(final.resume.records).toEqual([]);
    expect(errors).toEqual([]);
    expect(foreign).toEqual([]);
  });
}
