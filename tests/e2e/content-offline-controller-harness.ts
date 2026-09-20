import { expect, type Page, type TestInfo } from '@playwright/test';
import type {
  createMobileContentOfflineController,
  ContentOfflineControllerResult,
} from '../../apps/mobile/src/content-offline-controller';
import type {
  openMobileContentOfflineStore,
  ContentOfflineStoreError,
} from '../../apps/mobile/src/content-offline-store';
import type { createG3014OfflineFixtures } from '../../packages/test-support/src/g3-014-offline-fixtures';

export const initialTime = 1_788_000_000_000;
type Fixtures = Awaited<ReturnType<typeof createG3014OfflineFixtures>>;
export type BrowserHarness = {
  create: typeof createMobileContentOfflineController;
  open: typeof openMobileContentOfflineStore;
  Error: typeof ContentOfflineStoreError;
  controller: ReturnType<typeof createMobileContentOfflineController>;
  now: number;
  fixtures: Fixtures;
  pending?: Promise<ContentOfflineControllerResult>;
  release?: () => void;
  seen?: Promise<void>;
  events: string[];
};
declare global {
  interface Window {
    recovery: BrowserHarness;
  }
}

export async function controllerHarness(page: Page, info: TestInfo) {
  const mobile = info.project.name.startsWith('mobile');
  const origin = `http://127.0.0.1:${mobile ? 43173 : 43175}`;
  const requests: { source: string; file: string }[] = [];
  const external: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.route('**/__controller_recovery__', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Isolated controller recovery</title>',
    }),
  );
  await page.goto(`${origin}/__controller_recovery__`);
  const fixtures = await page.evaluate(
    async ({ mobile, initialTime }) => {
      const controller = await import('/src/content-offline-controller.ts');
      const stores = await import('/src/content-offline-store.ts');
      const fixture =
        await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes Wo Rev Ne/packages/test-support/src/g3-014-offline-fixtures.ts');
      const create = mobile
        ? controller.createMobileContentOfflineController
        : controller.createWebsiteContentOfflineController;
      const open = mobile
        ? stores.openMobileContentOfflineStore
        : stores.openWebsiteContentOfflineStore;
      const fixtures = await fixture.createG3014OfflineFixtures();
      window.recovery = {
        create,
        open,
        fixtures,
        Error: stores.ContentOfflineStoreError,
        now: initialTime,
        controller: create({ now: () => window.recovery.now }),
        events: [],
      };
      window.addEventListener('unhandledrejection', (event) =>
        window.recovery.events.push('unhandled:' + String(event.reason)),
      );
      return fixtures as Fixtures;
    },
    { mobile, initialTime },
  );
  let source: 'a' | 'b' | 'c' = 'a';
  let broken = false;
  let offline = false;
  let heldFile: string | null = null;
  let gate: Promise<void> | null = null;
  let seen: (() => void) | null = null;
  await page.route('**/wrn-local-release/v1/*.json', async (route) => {
    const file = new URL(route.request().url()).pathname.split('/').at(-1)!;
    const fixture = fixtures[source];
    requests.push({ source, file });
    if (file === heldFile && gate) {
      seen?.();
      await gate;
    }
    if (offline) return route.abort();
    const d = fixture.documents;
    const bodies: Record<string, unknown> = {
      'release-descriptor.json': fixture.descriptor,
      'manifest.json': d.manifest,
      'articles.json': d.payloads.articles,
      'supplemental-items.json': broken
        ? { ...d.payloads['supplemental-items'], wrongHash: true }
        : d.payloads['supplemental-items'],
      'discover-index.json': d.discoverIndex,
      'reader-details.json': d.readerDetails,
      'archive-lifecycle.json': d.archiveLifecycle,
      'website-publication.json': d.websitePublication,
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(bodies[file]),
    });
  });
  return {
    fixtures,
    requests,
    source(value: 'a' | 'b' | 'c', bad = false) {
      source = value;
      broken = bad;
    },
    offline() {
      offline = true;
    },
    hold(file: string) {
      heldFile = file;
      let release!: () => void;
      const arrived = new Promise<void>((resolve) => {
        seen = resolve;
      });
      gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      return {
        seen: arrived,
        release: () => {
          heldFile = null;
          release();
        },
      };
    },
    call: (
      action:
        'restore' | 'save' | 'check' | 'guard' | 'resumeGuard' | 'activate' | 'rollback' | 'clear',
    ) => page.evaluate((action) => window.recovery.controller[action](), action),
    snapshot: () =>
      page.evaluate(async () => {
        const db = await window.recovery.open();
        try {
          return await db.snapshot();
        } finally {
          db.close();
        }
      }),
    async evidence(value: unknown) {
      const events = await page.evaluate(() => window.recovery.events);
      await info.attach('controller-observations', {
        body: JSON.stringify(
          { value, requests, external, errors, events },
          (key, v) =>
            key === 'runtime' && v
              ? {
                  revision: v.ready.descriptor.releaseRevision,
                  manifestHash: v.ready.manifestSha256,
                  ids: v.ready.payloads.articles.articles.map((a: { id: string }) => a.id),
                }
              : v,
          2,
        ),
        contentType: 'application/json',
      });
      expect(external).toEqual([]);
      expect(errors).toEqual([]);
      expect(events).toEqual([]);
    },
  };
}
