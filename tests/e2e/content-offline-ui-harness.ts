import { expect, type Page } from '@playwright/test';
import { createG3014OfflineFixtures } from '../../packages/test-support/src/g3-014-offline-fixtures';

export const articleTitle = 'Lokale Testmeldung zur gemeinsamen Leseliste';
export const articleId = 'wrn-test-art-cedar';
export async function uiSource(page: Page) {
  const fixtures = await createG3014OfflineFixtures();
  let source: 'a' | 'b' | 'c' = 'a';
  let broken = false;
  let held: Promise<void> | null = null;
  let release: (() => void) | null = null;
  let seen: (() => void) | null = null;
  const requests: { source: string; file: string }[] = [];
  await page.route('**/wrn-local-release/v1/*.json', async (route) => {
    const file = new URL(route.request().url()).pathname.split('/').at(-1)!;
    const fixture = fixtures[source];
    const documents = fixture.documents;
    const values: Record<string, unknown> = {
      'release-descriptor.json': fixture.descriptor,
      'manifest.json': documents.manifest,
      'articles.json': documents.payloads.articles,
      'supplemental-items.json': broken
        ? { invalid: true }
        : documents.payloads['supplemental-items'],
      'discover-index.json': documents.discoverIndex,
      'reader-details.json': documents.readerDetails,
      'archive-lifecycle.json': documents.archiveLifecycle,
      'website-publication.json': documents.websitePublication,
    };
    // Capture bytes before a barrier; changing sources never changes an in-flight response.
    const body = JSON.stringify(values[file]);
    requests.push({ source, file });
    if (file === 'supplemental-items.json' && held !== null) {
      seen?.();
      await held;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body }).catch(() => {});
  });
  return {
    fixtures,
    requests,
    set(next: 'a' | 'b' | 'c', invalid = false) {
      source = next;
      broken = invalid;
    },
    hold() {
      held = new Promise<void>((resolve) => {
        release = resolve;
      });
      return new Promise<void>((resolve) => {
        seen = resolve;
      });
    },
    release() {
      release?.();
      held = null;
    },
  };
}

export async function saveA(page: Page) {
  await page.goto('/#more');
  await page.getByRole('button', { name: 'Save content locally' }).click();
  await expect(page.getByText('Stored locally', { exact: true })).toBeVisible();
}

export async function contentStorage(page: Page, client: string) {
  return page.evaluate(async (name) => {
    const open = indexedDB.open(`wrn.${name}-content-offline`);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const tx = db.transaction(['bundles', 'control']);
    const bundles = tx.objectStore('bundles').getAllKeys();
    const control = tx.objectStore('control').get('control');
    const value = await new Promise<{ bundles: IDBValidKey[]; control: Record<string, unknown> }>(
      (resolve, reject) => {
        tx.oncomplete = () => resolve({ bundles: bundles.result, control: control.result });
        tx.onerror = () => reject(tx.error);
      },
    );
    db.close();
    return value;
  }, client);
}

export async function holdContentRead(page: Page, client: string) {
  await page.evaluate(async (name) => {
    const open = indexedDB.open(`wrn.${name}-content-offline`);
    const db = await new Promise<IDBDatabase>((resolve) => {
      open.onsuccess = () => resolve(open.result);
    });
    let holding = true;
    const tx = db.transaction(['control', 'bundles'], 'readwrite');
    const spin = () => {
      const request = tx.objectStore('control').get('control');
      request.onsuccess = () => {
        if (holding) spin();
      };
    };
    spin();
    (window as unknown as { releaseUiRead: () => void }).releaseUiRead = () => {
      holding = false;
    };
    tx.oncomplete = () => db.close();
  }, client);
  return () =>
    page.evaluate(() => (window as unknown as { releaseUiRead: () => void }).releaseUiRead());
}
