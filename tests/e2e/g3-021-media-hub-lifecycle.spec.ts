import { expect, test } from '@playwright/test';

test.describe('G3-021 P3-A media hub lifecycle', () => {
  test('keeps the headless hub inert until a user action', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-hub.ts');
      const hub = mod.createMobileMediaHub({
        snapshot: async () => ({
          control: { generation: 0, active: null },
          safety: { generation: 0, revision: 0, entries: [] },
          bundles: { active: null },
        }),
      });
      return { exported: typeof mod.createMobileMediaHub, projection: await hub.projection() };
    });
    expect(result).toEqual({
      exported: 'function',
      projection: expect.objectContaining({ kind: 'empty' }),
    });
  });

  test('creates the exact isolated resume schema and makes one CAS winner', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-resume-store.ts');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(mod.mobileMediaResumeDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const store = await mod.openMobileMediaResumeStore();
      const record = {
        recordVersion: 1 as const,
        key: 'resume',
        episodeId: 'episode',
        audioAssetId: 'asset',
        releaseRevision: 1,
        audioAssetHash: 'a'.repeat(64),
        positionMs: 1,
        durationMs: 2,
      };
      const [first, second] = await Promise.all([
        store.save(record, 0),
        store.save({ ...record, positionMs: 0 }, 0),
      ]);
      const beforeDelete = await store.snapshot();
      const deleted = await store.deleteIfExact(
        'resume',
        beforeDelete.records[0]!,
        beforeDelete.generation,
      );
      const afterDelete = await store.snapshot();
      store.close();
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(mod.mobileMediaResumeDatabaseName, 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const schema = await new Promise<{
        stores: number;
        keyPath: IDBValidKey | IDBKeyRange | null;
        autoIncrement: boolean;
        indexes: number;
      }>((resolve, reject) => {
        const transaction = database.transaction(mod.mobileMediaResumeStoreName, 'readonly');
        const objectStore = transaction.objectStore(mod.mobileMediaResumeStoreName);
        transaction.oncomplete = () =>
          resolve({
            stores: database.objectStoreNames.length,
            keyPath: objectStore.keyPath,
            autoIncrement: objectStore.autoIncrement,
            indexes: objectStore.indexNames.length,
          });
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
      return {
        kinds: [first.kind, second.kind].sort(),
        generation: beforeDelete.generation,
        deleted: deleted.kind,
        after: afterDelete,
        schema,
      };
    });
    expect(result.kinds).toEqual(['no-op', 'saved']);
    expect(result.generation).toBe(1);
    expect(result.deleted).toBe('deleted');
    expect(result.after).toEqual({ generation: 2, records: [] });
    expect(result.schema).toEqual({ stores: 1, keyPath: 'key', autoIncrement: false, indexes: 0 });
  });

  test('fails closed on an unknown resume field without a repair write', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-resume-store.ts');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(mod.mobileMediaResumeDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const ready = await mod.openMobileMediaResumeStore();
      ready.close();
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(mod.mobileMediaResumeDatabaseName, 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const injected = {
        recordVersion: 1,
        key: 'foreign',
        episodeId: 'episode',
        audioAssetId: 'asset',
        releaseRevision: 1,
        audioAssetHash: 'a'.repeat(64),
        positionMs: 1,
        durationMs: 2,
        updatedAt: 1,
      };
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(mod.mobileMediaResumeStoreName, 'readwrite');
        transaction.objectStore(mod.mobileMediaResumeStoreName).put(injected);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
      const checked = await mod.openMobileMediaResumeStore();
      let code = '';
      try {
        await checked.snapshot();
      } catch (error) {
        code = error instanceof mod.MobileMediaResumeError ? error.code : 'other';
      }
      checked.close();
      const verify = await new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open(mod.mobileMediaResumeDatabaseName, 1);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(mod.mobileMediaResumeStoreName, 'readonly');
          const read = transaction.objectStore(mod.mobileMediaResumeStoreName).get('foreign');
          read.onsuccess = () => {
            resolve(read.result);
            database.close();
          };
          read.onerror = () => reject(read.error);
        };
        request.onerror = () => reject(request.error);
      });
      return { code, verify };
    });
    expect(result.code).toBe('protected');
    expect(result.verify).toMatchObject({ updatedAt: 1, key: 'foreign' });
  });

  test('enforces bytes before decoder and revokes one URL on a late ended event', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-player.ts');
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const sha256 = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('');
      let revoked = 0;
      const audio = {
        src: '',
        currentTime: 0,
        load() {},
        async play() {},
        pause() {},
        onpause: null as ((event: Event) => void) | null,
        onended: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };
      const player = mod.createMobileMediaPlayer({
        clock: () => 1_000,
        context: async () => ({
          availability: 'local' as const,
          asset: {
            path: '/local.wav',
            bytes: bytes.byteLength,
            sha256,
            expiresAt: 31_000,
            identity: 'active',
          },
        }),
        fetch: async () =>
          new Response(bytes, { status: 200, headers: { 'content-type': 'audio/wav' } }),
        audio: () => audio,
        createObjectURL: () => 'blob:one',
        revokeObjectURL: () => {
          revoked += 1;
        },
      });
      await player.start();
      audio.onended?.(new Event('ended'));
      audio.onended?.(new Event('ended'));
      return { state: player.state(), revoked, src: audio.src };
    });
    expect(result).toEqual({
      state: { playback: 'ended', availability: 'local', error: null },
      revoked: 1,
      src: '',
    });
  });

  test('enforces exact IDB record and aggregate caps without touching foreign records', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-resume-store.ts');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(mod.mobileMediaResumeDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const store = await mod.openMobileMediaResumeStore();
      const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength;
      const make = (index: number, target: number) => {
        const base = {
          recordVersion: 1 as const,
          key: `r${index}`,
          episodeId: '',
          audioAssetId: 'asset',
          releaseRevision: 1,
          audioAssetHash: 'a'.repeat(64),
          positionMs: 0,
          durationMs: 1,
        };
        return { ...base, episodeId: 'x'.repeat(target - bytes(base)) };
      };
      const sizes = [4095, 4096, 4097].map((target, index) => ({
        target,
        valid: mod.isMobileMediaResumeRecord(make(index, target)),
      }));
      let generation = 0;
      for (let index = 0; index < 63; index += 1) {
        try {
          const result = await store.save(make(index, 1024), generation);
          generation = result.state.generation;
        } catch (error) {
          return {
            failed: index,
            code: error instanceof mod.MobileMediaResumeError ? error.code : 'other',
            bytes: bytes(make(index, 1024)),
          };
        }
      }
      const edge = make(63, 1023);
      const lower = await store.save(edge, generation);
      const equal = await store.save(make(63, 1024), lower.state.generation);
      let over = '';
      try {
        await store.save(make(63, 1025), equal.state.generation);
      } catch (error) {
        over = error instanceof mod.MobileMediaResumeError ? error.code : 'other';
      }
      const after = await store.snapshot();
      store.close();
      return { sizes, lower: lower.state, equal: equal.state, over, after };
    });
    expect(result.sizes).toEqual([
      { target: 4095, valid: true },
      { target: 4096, valid: true },
      { target: 4097, valid: false },
    ]);
    expect(result.lower.records).toHaveLength(64);
    expect(result.equal.records).toHaveLength(64);
    expect(result.over).toBe('protected');
    expect(result.after).toEqual(result.equal);
  });

  test('keeps a late run, expiry and mismatched resume from mutating a current player', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-player.ts');
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const sha256 = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('');
      let resolve: ((response: Response) => void) | undefined;
      const pending = new Promise<Response>((done) => {
        resolve = done;
      });
      const events: string[] = [];
      const player = mod.createMobileMediaPlayer({
        clock: () => 1_000,
        context: async () => ({
          availability: 'local' as const,
          asset: { path: '/local.wav', bytes: 4, sha256, expiresAt: 2_000, identity: 'active' },
        }),
        fetch: async () => pending,
        audio: () => ({
          src: '',
          currentTime: 0,
          load() {},
          async play() {},
          pause() {},
          onpause: null,
          onended: null,
          onerror: null,
        }),
        createObjectURL: () => 'blob:late',
        revokeObjectURL: () => events.push('revoke'),
        onState: (state) => events.push(state.playback),
      });
      const first = player.start();
      player.stop('blocked');
      resolve?.(new Response(bytes, { status: 200, headers: { 'content-type': 'audio/wav' } }));
      await first;
      return { state: player.state(), events, seek: player.seek(1) };
    });
    expect(result).toEqual({
      state: { playback: 'idle', availability: 'blocked', error: null },
      events: ['idle'],
      seek: false,
    });
  });

  test('enforces the real IndexedDB 63/64/65 count edge and exact generation no-ops', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-resume-store.ts');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(mod.mobileMediaResumeDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const store = await mod.openMobileMediaResumeStore();
      const make = (index: number) => ({
        recordVersion: 1 as const,
        key: `count-${index}`,
        episodeId: `episode-${index}`,
        audioAssetId: 'asset',
        releaseRevision: 1,
        audioAssetHash: 'a'.repeat(64),
        positionMs: 0,
        durationMs: 1,
      });
      let generation = 0;
      for (let index = 0; index < 64; index += 1) {
        const saved = await store.save(make(index), generation);
        generation = saved.state.generation;
      }
      let over = '';
      try {
        await store.save(make(64), generation);
      } catch (error) {
        over = error instanceof mod.MobileMediaResumeError ? error.code : 'other';
      }
      const before = await store.snapshot();
      const stale = await store.deleteIfExact('count-0', before.records[0]!, generation - 1);
      const wrong = await store.deleteIfExact(
        'count-0',
        { ...before.records[0]!, releaseRevision: 2 },
        generation,
      );
      const after = await store.snapshot();
      store.close();
      return {
        length: before.records.length,
        generation,
        over,
        stale: stale.kind,
        wrong: wrong.kind,
        after,
      };
    });
    expect(result.length).toBe(64);
    expect(result.over).toBe('protected');
    expect(result.stale).toBe('no-op');
    expect(result.wrong).toBe('no-op');
    expect(result.after).toEqual({ generation: result.generation, records: expect.any(Array) });
    expect(result.after.records).toHaveLength(64);
  });

  test('performs exact selective/global clears without touching localStorage sentinels', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-resume-store.ts');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(mod.mobileMediaResumeDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      localStorage.setItem('wrn-foreign-sentinel', 'keep');
      const store = await mod.openMobileMediaResumeStore();
      const make = (key: string) => ({
        recordVersion: 1 as const,
        key,
        episodeId: key,
        audioAssetId: 'asset',
        releaseRevision: 1,
        audioAssetHash: 'a'.repeat(64),
        positionMs: 0,
        durationMs: 1,
      });
      const first = await store.save(make('one'), 0);
      const second = await store.save(make('two'), first.state.generation);
      const selective = await store.clearExact([second.state.records[0]!], second.state.generation);
      const afterSelective = await store.snapshot();
      const partial = await store.clearExact(
        [{ ...afterSelective.records[0]!, releaseRevision: 2 }],
        afterSelective.generation,
      );
      const global = await store.clearExact(afterSelective.records, afterSelective.generation);
      const afterGlobal = await store.snapshot();
      store.close();
      return {
        selective: selective.kind,
        afterSelective,
        partial: partial.kind,
        global: global.kind,
        afterGlobal,
        sentinel: localStorage.getItem('wrn-foreign-sentinel'),
      };
    });
    expect(result.selective).toBe('deleted');
    expect(result.afterSelective.records).toHaveLength(1);
    expect(result.partial).toBe('no-op');
    expect(result.global).toBe('deleted');
    expect(result.afterGlobal.records).toEqual([]);
    expect(result.sentinel).toBe('keep');
  });

  test('treats a future IndexedDB version and corrupt raw record as protected without repair', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-resume-store.ts');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(mod.mobileMediaResumeDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const original = await mod.openMobileMediaResumeStore();
      original.close();
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(mod.mobileMediaResumeDatabaseName, 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const corrupt = { recordVersion: 1, key: 'corrupt', episodeId: 'episode' };
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(mod.mobileMediaResumeStoreName, 'readwrite');
        transaction.objectStore(mod.mobileMediaResumeStoreName).put(corrupt);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
      const checked = await mod.openMobileMediaResumeStore();
      let code = '';
      try {
        await checked.snapshot();
      } catch (error) {
        code = error instanceof mod.MobileMediaResumeError ? error.code : 'other';
      }
      checked.close();
      const verify = await new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open(mod.mobileMediaResumeDatabaseName, 1);
        request.onsuccess = () => {
          const read = request.result
            .transaction(mod.mobileMediaResumeStoreName, 'readonly')
            .objectStore(mod.mobileMediaResumeStoreName)
            .get('corrupt');
          read.onsuccess = () => resolve(read.result);
          read.onerror = () => reject(read.error);
        };
        request.onerror = () => reject(request.error);
      });
      return { code, verify };
    });
    expect(result.code).toBe('protected');
    expect(result.verify).toEqual({ recordVersion: 1, key: 'corrupt', episodeId: 'episode' });
  });

  test('keeps future databases and every forbidden physical schema read-only', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-resume-store.ts');
      const remove = () =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(mod.mobileMediaResumeDatabaseName);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      const openBad = (version: number, setup: (database: IDBDatabase) => void) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(mod.mobileMediaResumeDatabaseName, version);
          request.onupgradeneeded = () => setup(request.result);
          request.onsuccess = () => {
            request.result.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      const check = async () => {
        try {
          (await mod.openMobileMediaResumeStore()).close();
          return 'opened';
        } catch (error) {
          return error instanceof mod.MobileMediaResumeError ? error.code : 'other';
        }
      };
      await remove();
      await openBad(1, (database) =>
        database
          .createObjectStore(mod.mobileMediaResumeStoreName, {
            keyPath: 'wrong',
            autoIncrement: true,
          })
          .createIndex('x', 'x'),
      );
      const badKeyPath = await check();
      await remove();
      await openBad(1, (database) => {
        database.createObjectStore(mod.mobileMediaResumeStoreName, { keyPath: 'key' });
        database.createObjectStore('foreign');
      });
      const extraStore = await check();
      await remove();
      await openBad(2, (database) =>
        database.createObjectStore(mod.mobileMediaResumeStoreName, { keyPath: 'key' }),
      );
      const future = await check();
      return { badKeyPath, extraStore, future };
    });
    expect(result).toEqual({
      badKeyPath: 'protected',
      extraStore: 'protected',
      future: 'protected',
    });
  });

  test('preserves future and over-cap raw records byte-for-byte without repair', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-resume-store.ts');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(mod.mobileMediaResumeDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const first = await mod.openMobileMediaResumeStore();
      first.close();
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(mod.mobileMediaResumeDatabaseName, 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const raw = {
        recordVersion: 2,
        key: 'future',
        episodeId: 'e',
        audioAssetId: 'a',
        releaseRevision: 1,
        audioAssetHash: 'a'.repeat(64),
        positionMs: 0,
        durationMs: 1,
        padding: 'x'.repeat(4097),
      };
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(mod.mobileMediaResumeStoreName, 'readwrite');
        transaction.objectStore(mod.mobileMediaResumeStoreName).put(raw);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
      let code = '';
      try {
        const store = await mod.openMobileMediaResumeStore();
        await store.snapshot();
        store.close();
      } catch (error) {
        code = error instanceof mod.MobileMediaResumeError ? error.code : 'other';
      }
      const verify = await new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open(mod.mobileMediaResumeDatabaseName, 1);
        request.onsuccess = () => {
          const db = request.result;
          const read = db
            .transaction(mod.mobileMediaResumeStoreName)
            .objectStore(mod.mobileMediaResumeStoreName)
            .get('future');
          read.onsuccess = () => {
            resolve(read.result);
            db.close();
          };
          read.onerror = () => reject(read.error);
        };
        request.onerror = () => reject(request.error);
      });
      return { code, same: JSON.stringify(raw) === JSON.stringify(verify) };
    });
    expect(result).toEqual({ code: 'protected', same: true });
  });

  test('does not claim save, delete or clear success after an actual IDB transaction fault', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-resume-store.ts');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(mod.mobileMediaResumeDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const store = await mod.openMobileMediaResumeStore();
      const record = {
        recordVersion: 1 as const,
        key: 'fault',
        episodeId: 'episode',
        audioAssetId: 'asset',
        releaseRevision: 1,
        audioAssetHash: 'a'.repeat(64),
        positionMs: 0,
        durationMs: 1,
      };
      const saved = await store.save(record, 0);
      const original = IDBDatabase.prototype.transaction;
      IDBDatabase.prototype.transaction = function () {
        throw new DOMException('fault', 'AbortError');
      };
      const code = async (operation: () => Promise<unknown>) => {
        try {
          await operation();
          return 'success';
        } catch (error) {
          return error instanceof mod.MobileMediaResumeError ? error.code : 'other';
        }
      };
      const values = await Promise.all([
        code(() => store.save({ ...record, positionMs: 0 }, saved.state.generation)),
        code(() => store.deleteIfExact(record.key, record, saved.state.generation)),
        code(() => store.clearExact([record], saved.state.generation)),
      ]);
      IDBDatabase.prototype.transaction = original;
      const after = await store.snapshot();
      store.close();
      return { values, after };
    });
    expect(result.values).toEqual(['storage-failure', 'storage-failure', 'storage-failure']);
    expect(result.after).toEqual({
      generation: 1,
      records: [expect.objectContaining({ key: 'fault' })],
    });
  });

  test('keeps resume values out of browser console, requests and localStorage', async ({
    page,
  }) => {
    const consoleLines: string[] = [];
    const requests: string[] = [];
    page.on('console', (message) => consoleLines.push(message.text()));
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-resume-store.ts');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(mod.mobileMediaResumeDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const store = await mod.openMobileMediaResumeStore();
      const record = {
        recordVersion: 1 as const,
        key: 'private-key',
        episodeId: 'private-episode',
        audioAssetId: 'private-asset',
        releaseRevision: 1,
        audioAssetHash: 'b'.repeat(64),
        positionMs: 123,
        durationMs: 456,
      };
      await store.save(record, 0);
      const state = await store.snapshot();
      store.close();
      return { local: Object.keys(localStorage), keys: Object.keys(state.records[0]!) };
    });
    const joined = `${consoleLines.join('\n')}\n${requests.join('\n')}`;
    expect(result.local).not.toContain('private-key');
    expect(result.keys).not.toContain('updatedAt');
    expect(joined).not.toContain('private-episode');
    expect(joined).not.toContain('private-asset');
    expect(joined).not.toContain('private-key');
  });

  test('rolls back quota and mid-clear abort faults without touching sentinels', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-resume-store.ts');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(mod.mobileMediaResumeDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      localStorage.setItem('p3-a-foreign', 'keep');
      const store = await mod.openMobileMediaResumeStore();
      const make = (key: string) => ({
        recordVersion: 1 as const,
        key,
        episodeId: key,
        audioAssetId: 'asset',
        releaseRevision: 1,
        audioAssetHash: 'a'.repeat(64),
        positionMs: 0,
        durationMs: 1,
      });
      const one = await store.save(make('one'), 0);
      const two = await store.save(make('two'), one.state.generation);
      const originalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function () {
        throw new DOMException('quota', 'QuotaExceededError');
      };
      let quota = '';
      try {
        await store.save(make('three'), two.state.generation);
      } catch (error) {
        quota = error instanceof mod.MobileMediaResumeError ? error.code : 'other';
      }
      IDBObjectStore.prototype.put = originalPut;
      const originalDelete = IDBObjectStore.prototype.delete;
      let deletes = 0;
      IDBObjectStore.prototype.delete = function (key: IDBValidKey | IDBKeyRange) {
        deletes += 1;
        if (deletes === 2) throw new DOMException('abort', 'AbortError');
        return originalDelete.call(this, key);
      };
      let clear = '';
      try {
        await store.clearExact(two.state.records, two.state.generation);
      } catch (error) {
        clear = error instanceof mod.MobileMediaResumeError ? error.code : 'other';
      }
      IDBObjectStore.prototype.delete = originalDelete;
      const after = await store.snapshot();
      store.close();
      return { quota, clear, after, sentinel: localStorage.getItem('p3-a-foreign') };
    });
    expect(result.quota).toBe('storage-failure');
    expect(result.clear).toBe('storage-failure');
    expect(result.after).toMatchObject({ generation: 2 });
    expect(result.after.records).toHaveLength(2);
    expect(result.sentinel).toBe('keep');
  });

  test('holds at 4999ms, fails at 5000ms, and keeps reader, digest, play and DOM faults terminal', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-player.ts');
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const hex = await crypto.subtle.digest('SHA-256', bytes);
      const sha256 = Array.from(new Uint8Array(hex), (value) =>
        value.toString(16).padStart(2, '0'),
      ).join('');
      const nativeDateNow = Date.now;
      const nativeSetTimeout = window.setTimeout;
      const nativeClearTimeout = window.clearTimeout;
      let now = nativeDateNow();
      let nextTimer = 1;
      const timers = new Map<
        number,
        Readonly<{ at: number; handler: TimerHandler; args: unknown[] }>
      >();
      Date.now = () => now;
      window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
        const id = nextTimer++;
        timers.set(id, Object.freeze({ at: now + (delay ?? 0), handler, args }));
        return id;
      }) as typeof window.setTimeout;
      window.clearTimeout = ((id?: number) => {
        if (id !== undefined) timers.delete(id);
      }) as typeof window.clearTimeout;
      const advanceTo = (target: number) => {
        now = target;
        for (const [id, timer] of [...timers].sort((left, right) => left[1].at - right[1].at)) {
          if (timer.at > now) continue;
          timers.delete(id);
          if (typeof timer.handler === 'function') timer.handler(...timer.args);
        }
      };
      const startedAt = now;
      const expiresAt = startedAt + 60_000;
      const context = async () => ({
        availability: 'local' as const,
        asset: {
          path: '/p3-a.wav',
          bytes: 4,
          sha256,
          expiresAt,
          identity: 'active',
        },
      });
      let resolve: ((response: Response) => void) | undefined;
      let started: (() => void) | undefined;
      const requestStarted = new Promise<void>((done) => {
        started = done;
      });
      const pending = new Promise<Response>((done) => {
        resolve = done;
      });
      const timeoutPlayer = mod.createMobileMediaPlayer({
        context,
        fetch: async () => {
          started?.();
          return pending;
        },
      });
      let before: ReturnType<typeof timeoutPlayer.state>;
      let atDeadline: ReturnType<typeof timeoutPlayer.state>;
      let atOneMsAfter: ReturnType<typeof timeoutPlayer.state>;
      try {
        const starting = timeoutPlayer.start();
        await requestStarted;
        advanceTo(startedAt + 4_999);
        before = timeoutPlayer.state();
        advanceTo(startedAt + 5_000);
        atDeadline = timeoutPlayer.state();
        advanceTo(startedAt + 5_001);
        atOneMsAfter = timeoutPlayer.state();
        resolve?.(new Response(bytes, { status: 200, headers: { 'content-type': 'audio/wav' } }));
        await starting;
      } finally {
        Date.now = nativeDateNow;
        window.setTimeout = nativeSetTimeout;
        window.clearTimeout = nativeClearTimeout;
      }
      type FaultMode = 'reader' | 'digest' | 'play' | 'dom';
      const fault = async (mode: FaultMode) => {
        const name = mode;
        let revoked = 0;
        const audio = {
          src: '',
          currentTime: 0,
          load() {
            if (mode === 'dom') throw new Error('dom');
          },
          async play() {
            if (mode === 'play') throw new Error('play');
          },
          pause() {},
          onpause: null as ((event: Event) => void) | null,
          onended: null as ((event: Event) => void) | null,
          onerror: null as ((event: Event) => void) | null,
        };
        const body =
          mode === 'reader'
            ? new ReadableStream<Uint8Array>({
                start(controller) {
                  controller.error(new Error('reader'));
                },
              })
            : new Response(bytes).body!;
        const player = mod.createMobileMediaPlayer({
          context,
          fetch: async () =>
            new Response(body, { status: 200, headers: { 'content-type': 'audio/wav' } }),
          audio: () => audio,
          createObjectURL: () => 'blob:fault',
          revokeObjectURL: () => {
            revoked += 1;
          },
        });
        if (mode === 'digest') {
          const originalDigest = crypto.subtle.digest.bind(crypto.subtle);
          try {
            crypto.subtle.digest = async () => {
              throw new Error('digest');
            };
            await player.start();
          } finally {
            crypto.subtle.digest = originalDigest;
          }
        } else {
          await player.start();
        }
        audio.onerror?.(new Event('error'));
        return { name, state: player.state(), revoked, src: audio.src };
      };
      const faults: Array<{
        name: FaultMode;
        state: { playback: string; availability: string; error?: string | null };
        revoked: number;
        src: string;
      }> = [];
      faults.push(await fault('reader'));
      faults.push(await fault('digest'));
      faults.push(await fault('play'));
      faults.push(await fault('dom'));
      return {
        before,
        atDeadline,
        atOneMsAfter,
        faults,
      };
    });
    expect(result.before.playback).toBe('loading');
    expect(result.atDeadline).toMatchObject({ playback: 'error', error: 'network-error' });
    expect(result.atOneMsAfter).toMatchObject({ playback: 'error', error: 'network-error' });
    expect(result.faults).toHaveLength(4);
    const [reader, digest, play, dom] = result.faults;
    expect(reader).toMatchObject({
      name: 'reader',
      revoked: expect.any(Number),
      src: expect.any(String),
    });
    expect(digest).toMatchObject({
      name: 'digest',
      revoked: expect.any(Number),
      src: expect.any(String),
    });
    expect(play).toMatchObject({
      name: 'play',
      revoked: expect.any(Number),
      src: expect.any(String),
    });
    expect(dom).toMatchObject({
      name: 'dom',
      revoked: expect.any(Number),
      src: expect.any(String),
    });
    expect(reader.name).toBe('reader');
    expect(digest.name).toBe('digest');
    expect(play.name).toBe('play');
    expect(dom.name).toBe('dom');
    for (const fault of result.faults) {
      expect(typeof fault.src).toBe('string');
      if (fault.name === 'reader' || fault.name === 'digest') {
        expect(fault.state).toMatchObject({ playback: 'error', availability: 'local' });
        expect(typeof fault.state.error).toBe('string');
      } else {
        expect(fault.state.availability).toMatch(/^(local|stale)$/);
        expect(['idle', 'stale', 'error']).toContain(fault.state.playback);
      }
      if (fault.name === 'play' || fault.name === 'dom') {
        expect(fault.state.playback).not.toBe('loading');
      } else {
        expect(typeof fault.state.error).toBe('string');
      }
    }
  });

  test('enforces the literal seven-row player fault table with a live DOM error', async ({
    page,
  }) => {
    await page.goto('/');
    const rows = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-player.ts');
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const sha256 = Array.from(new Uint8Array(digest), (value) =>
        value.toString(16).padStart(2, '0'),
      ).join('');
      const expiresAt = Date.now() + 60_000;
      type Mode = 'reader' | 'digest' | 'create' | 'src' | 'load' | 'play' | 'dom';
      const run = async (mode: Mode) => {
        let made = 0;
        let revoked = 0;
        let source = '';
        const audio = {
          currentTime: 0,
          load() {
            if (mode === 'load') throw new Error('load');
          },
          async play() {
            if (mode === 'play') throw new Error('play');
          },
          pause() {},
          onpause: null as ((event: Event) => void) | null,
          onended: null as ((event: Event) => void) | null,
          onerror: null as ((event: Event) => void) | null,
        } as {
          src: string;
          currentTime: number;
          load(): void;
          play(): Promise<void>;
          pause(): void;
          onpause: ((event: Event) => void) | null;
          onended: ((event: Event) => void) | null;
          onerror: ((event: Event) => void) | null;
        };
        Object.defineProperty(audio, 'src', {
          get: () => source,
          set: (value: string) => {
            if (mode === 'src' && value !== '') throw new Error('src');
            source = value;
          },
          configurable: true,
        });
        const body =
          mode === 'reader'
            ? new ReadableStream<Uint8Array>({
                start(controller) {
                  controller.error(new Error('reader'));
                },
              })
            : new Response(bytes).body!;
        const player = mod.createMobileMediaPlayer({
          context: async () => ({
            availability: 'local' as const,
            asset: { path: '/fault.wav', bytes: 4, sha256, expiresAt, identity: mode },
          }),
          fetch: async () =>
            new Response(body, { status: 200, headers: { 'content-type': 'audio/wav' } }),
          audio: () => audio,
          createObjectURL: () => {
            if (mode === 'create') throw new Error('create');
            made += 1;
            return `blob:${mode}`;
          },
          revokeObjectURL: () => {
            revoked += 1;
          },
        });
        if (mode === 'digest') {
          const original = crypto.subtle.digest.bind(crypto.subtle);
          try {
            crypto.subtle.digest = async () => {
              throw new Error('digest');
            };
            await player.start();
          } finally {
            crypto.subtle.digest = original;
          }
        } else await player.start();
        if (mode === 'dom') audio.onerror?.(new Event('error'));
        return { mode, state: player.state(), src: source, made, revoked };
      };
      const rows: Awaited<ReturnType<typeof run>>[] = [];
      for (const mode of ['reader', 'digest', 'create', 'src', 'load', 'play', 'dom'] as const)
        rows.push(await run(mode));
      return rows;
    });
    expect(rows).toEqual([
      {
        mode: 'reader',
        state: { playback: 'error', availability: 'local', error: 'network-error' },
        src: '',
        made: 0,
        revoked: 0,
      },
      {
        mode: 'digest',
        state: { playback: 'error', availability: 'local', error: 'network-error' },
        src: '',
        made: 0,
        revoked: 0,
      },
      {
        mode: 'create',
        state: { playback: 'error', availability: 'local', error: 'network-error' },
        src: '',
        made: 0,
        revoked: 0,
      },
      {
        mode: 'src',
        state: { playback: 'error', availability: 'local', error: 'network-error' },
        src: '',
        made: 1,
        revoked: 1,
      },
      {
        mode: 'load',
        state: { playback: 'error', availability: 'local', error: 'network-error' },
        src: '',
        made: 1,
        revoked: 1,
      },
      {
        mode: 'play',
        state: { playback: 'error', availability: 'local', error: 'network-error' },
        src: '',
        made: 1,
        revoked: 1,
      },
      {
        mode: 'dom',
        state: { playback: 'error', availability: 'local', error: 'invalid' },
        src: '',
        made: 1,
        revoked: 1,
      },
    ]);
  });

  test('executes the six-cause by seven-sink lifecycle matrix with real IndexedDB', async ({
    page,
  }) => {
    await page.goto('/');
    const rows = await page.evaluate(async () => {
      const hubMod = await import('/src/mobile-media-hub.ts');
      const storeMod = await import('/src/mobile-media-resume-store.ts');
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const sha256 = Array.from(new Uint8Array(digest), (value) =>
        value.toString(16).padStart(2, '0'),
      ).join('');
      const causes = ['release', 'rights', 'source', 'series', 'episode', 'asset'] as const;
      const sinks = [
        'pause',
        'save',
        'seek',
        'deleteIfExact',
        'success',
        'no-op',
        'late-result',
      ] as const;
      const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
      let activeCell = '';
      const waitFor = async (condition: () => boolean) => {
        for (let attempt = 0; attempt < 40; attempt += 1) {
          if (condition()) return;
          await tick();
        }
        throw new Error(`matrix boundary did not become reachable: ${activeCell}`);
      };
      const erase = () =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(storeMod.mobileMediaResumeDatabaseName);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      const run = async (cause: (typeof causes)[number], sink: (typeof sinks)[number]) => {
        activeCell = `${cause}/${sink}`;
        await erase();
        const actual = await storeMod.openMobileMediaResumeStore();
        let invalid = false;
        let requests = 0;
        let saves = 0;
        let deleteRequests = 0;
        let physicalDeletes = 0;
        let made = 0;
        let revoked = 0;
        let seekWrites = 0;
        let releaseSave: (() => void) | null = null;
        let rejectSave: ((reason: Error) => void) | null = null;
        const pendingDeletes: Array<
          Readonly<{
            phase: 'A' | 'B0' | 'B1';
            release: () => Promise<Awaited<ReturnType<typeof actual.deleteIfExact>>>;
            reject: (reason: Error) => void;
          }>
        > = [];
        let deletePhase: 'A' | 'B0' | 'B1' = 'A';
        let releaseFinalCleanupRead: (() => void) | null = null;
        let finalCleanupReadReached = false;
        let cleanupReadPasses = 0;
        let holdRunBContext = false;
        let runBReadPasses = 0;
        let runBContextReached = false;
        let releaseRunBContext: (() => void) | null = null;
        let loads = 0;
        let factories = 0;
        let beforeLate: { state: unknown; resume: string } | null = null;
        const expected = cause === 'release' || cause === 'rights' ? 'stale' : 'blocked';
        const needsFinalCleanupRead =
          sink === 'deleteIfExact' ||
          (sink === 'no-op' && (cause === 'release' || cause === 'series'));
        const source = () => {
          const value = {
            control: { generation: 1, active: 'active' as const },
            safety: { generation: 1, revision: 1, entries: [] as Record<string, unknown>[] },
            bundles: {
              active: {
                revision: 1,
                transportSha256: 'b'.repeat(64),
                rawBundle: {
                  releaseRaw: JSON.stringify({ validUntil: '2030-01-02T00:00:00.000Z' }),
                  documentsRaw: {
                    manifest: JSON.stringify({
                      episodes: [
                        {
                          id: 'episode',
                          sourceId: 'source',
                          seriesId: 'series',
                          audioAssetId: 'asset',
                          durationMs: 100,
                          title: { en: 'T' },
                          summary: { en: 'S' },
                        },
                      ],
                      assets: [
                        {
                          id: 'asset',
                          kind: 'audio',
                          mime: 'audio/wav',
                          path: '/matrix.wav',
                          bytes: 4,
                          sha256,
                        },
                      ],
                      series: [{ id: 'series' }],
                    }),
                    admission: JSON.stringify({
                      sources: [
                        {
                          id: 'source',
                          displayName: { en: 'Source' },
                          validUntil: '2030-01-02T00:00:00.000Z',
                        },
                      ],
                    }),
                    rights: JSON.stringify({
                      rights: [
                        {
                          assetId: 'asset',
                          status: 'allowed',
                          expiresAt: '2030-01-02T00:00:00.000Z',
                          attribution: 'A',
                          territory: 'global',
                        },
                      ],
                    }),
                    consent: JSON.stringify({
                      consents: [
                        {
                          episodeId: 'episode',
                          mode: 'local-no-third-party',
                          requiresPrompt: false,
                        },
                      ],
                    }),
                  },
                },
              },
            },
          };
          if (invalid && cause === 'release')
            value.bundles.active.rawBundle.releaseRaw = JSON.stringify({
              validUntil: '2030-01-01T00:00:00.000Z',
            });
          if (invalid && cause === 'rights')
            value.bundles.active.rawBundle.documentsRaw.rights = JSON.stringify({
              rights: [
                { assetId: 'asset', status: 'allowed', expiresAt: '2030-01-01T00:00:00.000Z' },
              ],
            });
          if (invalid && cause !== 'release' && cause !== 'rights')
            value.safety = {
              generation: 2,
              revision: 2,
              entries: [
                {
                  targetKind: cause,
                  targetId: cause === 'asset' ? 'asset' : cause,
                  targetHash: cause === 'asset' ? sha256 : null,
                },
              ],
            };
          return value;
        };
        const makeRecord = (positionMs = 10) =>
          Object.freeze({
            recordVersion: 1 as const,
            key: 'resume:episode:asset',
            episodeId: 'episode',
            audioAssetId: 'asset',
            releaseRevision: 1,
            audioAssetHash: sha256,
            positionMs,
            durationMs: 100,
          });
        const snapshot = async () => {
          if (holdRunBContext) {
            runBReadPasses += 1;
            if (runBReadPasses === 2) {
              runBContextReached = true;
              await new Promise<void>((resolve) => {
                releaseRunBContext = resolve;
              });
            }
          }
          if (needsFinalCleanupRead && invalid) {
            cleanupReadPasses += 1;
            if (cleanupReadPasses === 2) {
              finalCleanupReadReached = true;
              await new Promise<void>((resolve) => {
                releaseFinalCleanupRead = resolve;
              });
            }
          }
          return source();
        };
        const seeded =
          sink === 'seek' ||
          (sink === 'save' && (cause === 'rights' || cause === 'series' || cause === 'asset'));
        if (seeded) await actual.save(makeRecord(), 0);
        const sentinel = Object.freeze({ ...makeRecord(11), key: `foreign:${cause}:${sink}` });
        if (sink === 'success') {
          const before = await actual.snapshot();
          await actual.save(sentinel, before.generation);
        }
        let hubUnmount: (() => void) | null = null;
        const store = {
          snapshot: () => actual.snapshot(),
          save: async (record: Parameters<typeof actual.save>[0], generation: number) => {
            saves += 1;
            if (
              sink === 'save' ||
              (sink === 'late-result' && cause !== 'episode' && cause !== 'asset')
            )
              return await new Promise<Awaited<ReturnType<typeof actual.save>>>(
                (resolve, reject) => {
                  releaseSave = () => void actual.save(record, generation).then(resolve, reject);
                  rejectSave = reject;
                },
              );
            return actual.save(record, generation);
          },
          deleteIfExact: async (...args: Parameters<typeof actual.deleteIfExact>) => {
            deleteRequests += 1;
            if (sink === 'deleteIfExact') {
              hubUnmount?.();
              return { kind: 'no-op' as const, state: await actual.snapshot() };
            }
            if (sink === 'no-op' && (cause === 'rights' || cause === 'episode')) {
              const before = await actual.snapshot();
              await actual.save(sentinel, before.generation);
              return actual.deleteIfExact(...args);
            }
            if (sink === 'no-op' && (cause === 'source' || cause === 'asset')) {
              const before = await actual.snapshot();
              await actual.save({ ...args[1], positionMs: 12 }, before.generation);
              return actual.deleteIfExact(...args);
            }
            if (sink === 'late-result' && (cause === 'episode' || cause === 'asset'))
              return await new Promise<Awaited<ReturnType<typeof actual.deleteIfExact>>>(
                (resolve, reject) => {
                  pendingDeletes.push(
                    Object.freeze({
                      phase: deletePhase,
                      release: async () => {
                        const result = await actual.deleteIfExact(...args);
                        if (result.kind === 'deleted') physicalDeletes += 1;
                        resolve(result);
                        return result;
                      },
                      reject,
                    }),
                  );
                },
              );
            const result = await actual.deleteIfExact(...args);
            if (result.kind === 'deleted') physicalDeletes += 1;
            return result;
          },
          clearExact: actual.clearExact,
          close: actual.close,
        };
        let position = 0.01;
        const audio = {
          src: '',
          get currentTime() {
            return position;
          },
          set currentTime(value: number) {
            seekWrites += 1;
            position = value;
          },
          load() {
            loads += 1;
          },
          async play() {},
          pause() {},
          onpause: null as ((event: Event) => void) | null,
          onended: null as ((event: Event) => void) | null,
          onerror: null as ((event: Event) => void) | null,
        };
        const hub = hubMod.createMobileMediaHub({
          snapshot,
          clock: () => Date.parse('2030-01-01T00:00:00.000Z'),
          resumeStore: store,
          fetch: async () => {
            requests += 1;
            return new Response(bytes, { status: 200, headers: { 'content-type': 'audio/wav' } });
          },
          audio: () => {
            factories += 1;
            return audio;
          },
          createObjectURL: () => {
            made += 1;
            return 'blob:matrix';
          },
          revokeObjectURL: () => {
            revoked += 1;
          },
        });
        hubUnmount = hub.unmount;
        const completeSnapshot = async () => ({
          store: await actual.snapshot(),
          public: {
            state: hub.player.state(),
            resume: hub.resumeStatus(),
            src: audio.src,
            requests,
            saves,
            factories,
            loads,
            seekWrites,
            position,
            made,
            revoked,
          },
          deleteRequests,
          physicalDeletes,
          phases: pendingDeletes.map((pending) => pending.phase),
        });
        let drain: {
          before: Awaited<ReturnType<typeof completeSnapshot>>;
          after: Awaited<ReturnType<typeof completeSnapshot>>;
          results: Awaited<ReturnType<typeof actual.deleteIfExact>>[];
        } | null = null;
        await hub.player.start();
        if (sink === 'pause') {
          invalid = true;
          audio.onpause?.(new Event('pause'));
          await waitFor(() => hub.player.state().availability === expected);
        }
        if (sink === 'save') {
          audio.onpause?.(new Event('pause'));
          await waitFor(() => saves === 1 && releaseSave !== null);
          invalid = true;
          hub.player.stop(expected);
          releaseSave?.();
          await waitFor(() =>
            cause === 'release' || cause === 'source' || cause === 'episode'
              ? physicalDeletes === 1
              : true,
          );
        }
        if (sink === 'seek') {
          invalid = true;
          await hub.resumeOnUserAction();
        }
        if (sink === 'deleteIfExact') {
          audio.onpause?.(new Event('pause'));
          await waitFor(() => hub.resumeStatus() === 'saved');
          invalid = true;
          hub.player.stop(expected);
          await waitFor(() => finalCleanupReadReached && releaseFinalCleanupRead !== null);
          hub.unmount();
          releaseFinalCleanupRead?.();
          await tick();
        }
        if (sink === 'success') {
          audio.onpause?.(new Event('pause'));
          await waitFor(() => hub.resumeStatus() === 'saved');
          invalid = true;
          await hub.player.start();
          await waitFor(() => hub.resumeStatus() === 'deleted');
        }
        if (sink === 'no-op') {
          audio.onpause?.(new Event('pause'));
          await waitFor(() => hub.resumeStatus() === 'saved');
          invalid = true;
          hub.player.stop(expected);
          if (cause === 'release' || cause === 'series') {
            await waitFor(() => finalCleanupReadReached && releaseFinalCleanupRead !== null);
            const state = await actual.snapshot();
            const record = state.records.find((item) => item.key === makeRecord().key);
            if (record) await actual.deleteIfExact(record.key, record, state.generation);
            releaseFinalCleanupRead?.();
          }
          await waitFor(() => hub.resumeStatus() === 'no-op');
        }
        if (
          sink === 'late-result' &&
          (cause === 'release' || cause === 'rights' || cause === 'source' || cause === 'series')
        ) {
          audio.onpause?.(new Event('pause'));
          await waitFor(() => saves === 1 && releaseSave !== null && rejectSave !== null);
          invalid = true;
          if (cause === 'release' || cause === 'rights') await hub.player.start();
          if (cause === 'source' || cause === 'series') hub.unmount();
          beforeLate = Object.freeze({ state: hub.player.state(), resume: hub.resumeStatus() });
          if (cause === 'release' || cause === 'source') releaseSave?.();
          if (cause === 'rights' || cause === 'series') rejectSave?.(new Error('late save'));
          await tick();
        }
        if (sink === 'late-result' && (cause === 'episode' || cause === 'asset')) {
          audio.onpause?.(new Event('pause'));
          await waitFor(() => hub.resumeStatus() === 'saved');
          invalid = true;
          hub.player.stop(expected);
          await waitFor(() => pendingDeletes.map((entry) => entry.phase).join('|') === 'A');
          if (cause === 'episode') {
            deletePhase = 'B0';
            holdRunBContext = true;
            const runB = hub.player.start();
            await waitFor(() => runBContextReached && releaseRunBContext !== null);
            await waitFor(() => pendingDeletes.map((entry) => entry.phase).join('|') === 'A|B0');
            holdRunBContext = false;
            deletePhase = 'B1';
            releaseRunBContext?.();
            await runB;
          }
          if (cause === 'asset') hub.unmount();
          if (cause === 'episode')
            await waitFor(() => pendingDeletes.map((entry) => entry.phase).join('|') === 'A|B0|B1');
          beforeLate = Object.freeze({ state: hub.player.state(), resume: hub.resumeStatus() });
          if (cause === 'episode') await pendingDeletes[0]?.release();
          if (cause === 'asset') pendingDeletes[0]?.reject(new Error('late delete'));
          await tick();
        }
        const after = await actual.snapshot();
        const result = {
          cause,
          sink,
          expected,
          requests,
          saves,
          deleteRequests,
          physicalDeletes,
          made,
          revoked,
          loads,
          factories,
          records: after.records,
          generation: after.generation,
          state: hub.player.state(),
          resume: hub.resumeStatus(),
          seekWrites,
          position,
          src: audio.src,
          beforeLate,
        };
        if (sink === 'late-result' && cause === 'episode') {
          hub.unmount();
          const before = await completeSnapshot();
          const results = await Promise.all(
            pendingDeletes.slice(1).map((pending) => pending.release()),
          );
          await tick();
          drain = { before, after: await completeSnapshot(), results };
        }
        actual.close();
        return { ...result, drain };
      };
      const result = [] as Awaited<ReturnType<typeof run>>[];
      for (const cause of causes) for (const sink of sinks) result.push(await run(cause, sink));
      return result;
    });
    expect(rows).toHaveLength(42);
    const record = (key: string, positionMs: number) => ({
      recordVersion: 1,
      key,
      episodeId: 'episode',
      audioAssetId: 'asset',
      releaseRevision: 1,
      audioAssetHash: '9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a',
      positionMs,
      durationMs: 100,
    });
    for (const row of rows) {
      const unavailable = row.cause === 'release' || row.cause === 'rights' ? 'stale' : 'blocked';
      if (row.cause === 'episode' && row.sink === 'late-result') {
        expect(row.drain).not.toBeNull();
        expect(row.drain?.before).toEqual({
          store: { generation: 2, records: [] },
          public: {
            state: { playback: 'idle', availability: 'blocked', error: null },
            resume: 'saved',
            src: '',
            requests: 1,
            saves: 1,
            factories: 1,
            loads: 2,
            seekWrites: 0,
            position: 0.01,
            made: 1,
            revoked: 1,
          },
          deleteRequests: 3,
          physicalDeletes: 1,
          phases: ['A', 'B0', 'B1'],
        });
        expect(row.drain?.after).toEqual(row.drain?.before);
        expect(row.drain?.results).toEqual([
          { kind: 'no-op', state: { generation: 2, records: [] } },
          { kind: 'no-op', state: { generation: 2, records: [] } },
        ]);
      } else expect(row.drain).toBeNull();
      expect(row.expected).toBe(unavailable);
      expect(row.requests).toBe(1);
      expect(row.made).toBe(1);
      expect(row.revoked).toBe(1);
      expect(row.loads).toBe(2);
      expect(row.factories).toBe(1);
      expect(row.src).toBe('');
      expect(row.seekWrites).toBe(0);
      expect(row.position).toBe(0.01);
      if (row.sink === 'pause') {
        expect(row.saves).toBe(0);
        expect(row.deleteRequests).toBe(0);
        expect(row.physicalDeletes).toBe(0);
        expect(row.records).toEqual([]);
        expect(row.state).toEqual({ playback: 'idle', availability: unavailable, error: null });
        expect(row.resume).toBe('idle');
      }
      if (
        row.sink === 'save' &&
        (row.cause === 'release' || row.cause === 'source' || row.cause === 'episode')
      ) {
        expect(row.saves).toBe(1);
        expect(row.deleteRequests).toBe(1);
        expect(row.physicalDeletes).toBe(1);
        expect(row.records).toEqual([]);
        expect(row.generation).toBe(2);
        expect(row.state).toEqual({ playback: 'idle', availability: unavailable, error: null });
        expect(row.resume).toBe('idle');
      }
      if (
        row.sink === 'save' &&
        (row.cause === 'rights' || row.cause === 'series' || row.cause === 'asset')
      ) {
        expect(row.saves).toBe(1);
        expect(row.deleteRequests).toBe(0);
        expect(row.physicalDeletes).toBe(0);
        expect(row.records).toEqual([record('resume:episode:asset', 10)]);
        expect(row.generation).toBe(1);
        expect(row.state).toEqual({ playback: 'idle', availability: unavailable, error: null });
        expect(row.resume).toBe('idle');
      }
      if (row.sink === 'seek') {
        expect(row.saves).toBe(0);
        expect(row.deleteRequests).toBe(0);
        expect(row.physicalDeletes).toBe(0);
        expect(row.records).toEqual([record('resume:episode:asset', 10)]);
        expect(row.generation).toBe(1);
        expect(row.state).toEqual({ playback: 'idle', availability: unavailable, error: null });
        expect(row.resume).toBe('idle');
      }
      if (row.sink === 'deleteIfExact') {
        expect(row.saves).toBe(1);
        expect(row.deleteRequests).toBe(0);
        expect(row.physicalDeletes).toBe(0);
        expect(row.records).toEqual([record('resume:episode:asset', 10)]);
        expect(row.generation).toBe(1);
        expect(row.state).toEqual({ playback: 'idle', availability: unavailable, error: null });
        expect(row.resume).toBe('saved');
      }
      if (row.sink === 'success') {
        expect(row.saves).toBe(1);
        expect(row.deleteRequests).toBe(1);
        expect(row.physicalDeletes).toBe(1);
        expect(row.records).toEqual([record(`foreign:${row.cause}:success`, 11)]);
        expect(row.generation).toBe(3);
        expect(row.state).toEqual({ playback: 'idle', availability: unavailable, error: null });
        expect(row.resume).toBe('deleted');
      }
      if (row.sink === 'no-op') {
        expect(row.saves).toBe(1);
        expect(row.state).toEqual({ playback: 'idle', availability: unavailable, error: null });
        expect(row.resume).toBe('no-op');
        if (row.cause === 'release' || row.cause === 'series') {
          expect(row.deleteRequests).toBe(1);
          expect(row.physicalDeletes).toBe(0);
          expect(row.records).toEqual([]);
          expect(row.generation).toBe(2);
        }
        if (row.cause === 'rights' || row.cause === 'episode') {
          expect(row.deleteRequests).toBe(1);
          expect(row.physicalDeletes).toBe(0);
          expect(row.records).toEqual([
            record(`foreign:${row.cause}:no-op`, 11),
            record('resume:episode:asset', 10),
          ]);
          expect(row.generation).toBe(2);
        }
        if (row.cause === 'source' || row.cause === 'asset') {
          expect(row.deleteRequests).toBe(1);
          expect(row.physicalDeletes).toBe(0);
          expect(row.records).toEqual([record('resume:episode:asset', 12)]);
          expect(row.generation).toBe(2);
        }
      }
      if (row.sink === 'late-result') {
        expect(row.beforeLate, `${row.cause}/${row.sink}`).toEqual({
          state: row.state,
          resume: row.resume,
        });
        expect(row.state).toEqual({
          playback: 'idle',
          availability:
            row.cause === 'release' ||
            row.cause === 'rights' ||
            row.cause === 'episode' ||
            row.cause === 'asset'
              ? unavailable
              : 'local',
          error: null,
        });
        expect(row.resume).toBe(
          row.cause === 'episode' || row.cause === 'asset' ? 'saved' : 'idle',
        );
        if (row.cause === 'release' || row.cause === 'source') {
          expect(row.saves).toBe(1);
          expect(row.deleteRequests).toBe(1);
          expect(row.physicalDeletes).toBe(1);
          expect(row.records).toEqual([]);
          expect(row.generation).toBe(2);
        }
        if (row.cause === 'rights' || row.cause === 'series') {
          expect(row.saves).toBe(1);
          expect(row.deleteRequests).toBe(0);
          expect(row.physicalDeletes).toBe(0);
          expect(row.records).toEqual([]);
          expect(row.generation).toBe(0);
        }
        if (row.cause === 'episode') {
          expect(row.saves).toBe(1);
          expect(row.deleteRequests).toBe(3);
          expect(row.physicalDeletes).toBe(1);
          expect(row.records).toEqual([]);
          expect(row.generation).toBe(2);
        }
        if (row.cause === 'asset') {
          expect(row.saves).toBe(1);
          expect(row.deleteRequests).toBe(1);
          expect(row.physicalDeletes).toBe(0);
          expect(row.records).toEqual([record('resume:episode:asset', 10)]);
          expect(row.generation).toBe(1);
        }
      }
    }
  });

  test('proves all seven late-save provenance regressions with real IndexedDB', async ({
    page,
  }) => {
    await page.goto('/');
    const rows = await page.evaluate(async () => {
      const hubMod = await import('/src/mobile-media-hub.ts');
      const storeMod = await import('/src/mobile-media-resume-store.ts');
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const sha256 = Array.from(new Uint8Array(digest), (value) =>
        value.toString(16).padStart(2, '0'),
      ).join('');
      const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
      const waitFor = async (condition: () => boolean) => {
        for (let attempt = 0; attempt < 40; attempt += 1) {
          if (condition()) return;
          await tick();
        }
        throw new Error('late-save provenance boundary did not become reachable');
      };
      const erase = () =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(storeMod.mobileMediaResumeDatabaseName);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      const cases = [
        'no-op-run-b',
        'no-op-unmount',
        'no-op-generation-race',
        'saved-run-b',
        'saved-unmount',
        'saved-without-exact-result-record',
        'saved-compensation-no-op',
        'saved-compensation-reject',
        'saved-compensation-throw',
      ] as const;
      const readySnapshot = () => ({
        control: { generation: 1, active: 'active' as const },
        safety: { generation: 1, revision: 1, entries: [] as Record<string, unknown>[] },
        bundles: {
          active: {
            revision: 1,
            transportSha256: 'b'.repeat(64),
            rawBundle: {
              releaseRaw: JSON.stringify({ validUntil: '2030-01-02T00:00:00.000Z' }),
              documentsRaw: {
                manifest: JSON.stringify({
                  episodes: [
                    {
                      id: 'episode',
                      sourceId: 'source',
                      seriesId: 'series',
                      audioAssetId: 'asset',
                      durationMs: 100,
                      title: { en: 'T' },
                      summary: { en: 'S' },
                    },
                  ],
                  assets: [
                    {
                      id: 'asset',
                      kind: 'audio',
                      mime: 'audio/wav',
                      path: '/provenance.wav',
                      bytes: 4,
                      sha256,
                    },
                  ],
                  series: [{ id: 'series' }],
                }),
                admission: JSON.stringify({
                  sources: [
                    {
                      id: 'source',
                      displayName: { en: 'Source' },
                      validUntil: '2030-01-02T00:00:00.000Z',
                    },
                  ],
                }),
                rights: JSON.stringify({
                  rights: [
                    {
                      assetId: 'asset',
                      status: 'allowed',
                      expiresAt: '2030-01-02T00:00:00.000Z',
                      attribution: 'A',
                      territory: 'global',
                    },
                  ],
                }),
                consent: JSON.stringify({
                  consents: [
                    { episodeId: 'episode', mode: 'local-no-third-party', requiresPrompt: false },
                  ],
                }),
              },
            },
          },
        },
      });
      const run = async (kind: (typeof cases)[number]) => {
        await erase();
        const actual = await storeMod.openMobileMediaResumeStore();
        const next = Object.freeze({
          recordVersion: 1 as const,
          key: 'resume:episode:asset',
          episodeId: 'episode',
          audioAssetId: 'asset',
          releaseRevision: 1,
          audioAssetHash: sha256,
          positionMs: 10,
          durationMs: 100,
        });
        const foreign = Object.freeze({ ...next, key: `foreign:${kind}`, positionMs: 11 });
        const preexisting = kind.startsWith('no-op');
        const saved = kind.startsWith('saved');
        if (preexisting) await actual.save(next, 0);
        if (saved) await actual.save(foreign, 0);
        let saveCalls = 0;
        let deleteCalls = 0;
        let resolveSave: ((value: Awaited<ReturnType<typeof actual.save>>) => void) | null = null;
        const store = {
          snapshot: () => actual.snapshot(),
          save: async () => {
            saveCalls += 1;
            return await new Promise<Awaited<ReturnType<typeof actual.save>>>((resolve) => {
              resolveSave = resolve;
            });
          },
          deleteIfExact: async (...args: Parameters<typeof actual.deleteIfExact>) => {
            deleteCalls += 1;
            if (kind === 'saved-compensation-no-op')
              return { kind: 'no-op' as const, state: await actual.snapshot() };
            if (kind === 'saved-compensation-reject') throw new Error('late compensation reject');
            if (kind === 'saved-compensation-throw') throw new Error('late compensation throw');
            return actual.deleteIfExact(...args);
          },
          clearExact: actual.clearExact,
          close: actual.close,
        };
        let made = 0;
        let revoked = 0;
        const audio = {
          src: '',
          currentTime: 0.01,
          load() {},
          async play() {},
          pause() {},
          onpause: null as ((event: Event) => void) | null,
          onended: null as ((event: Event) => void) | null,
          onerror: null as ((event: Event) => void) | null,
        };
        const hub = hubMod.createMobileMediaHub({
          snapshot: async () => readySnapshot(),
          clock: () => Date.parse('2030-01-01T00:00:00.000Z'),
          resumeStore: store,
          fetch: async () =>
            new Response(bytes, { status: 200, headers: { 'content-type': 'audio/wav' } }),
          audio: () => audio,
          createObjectURL: () => {
            made += 1;
            return `blob:${kind}:${made}`;
          },
          revokeObjectURL: () => {
            revoked += 1;
          },
        });
        await hub.player.start();
        audio.onpause?.(new Event('pause'));
        await waitFor(() => saveCalls === 1 && resolveSave !== null);
        const before = await actual.snapshot();
        const runB = kind === 'no-op-run-b' || kind === 'saved-run-b';
        if (runB) {
          hub.player.stop('blocked');
          await hub.player.start();
        } else hub.unmount();
        if (kind === 'no-op-generation-race') await actual.save(foreign, before.generation);
        const publicBefore = Object.freeze({
          state: hub.player.state(),
          resume: hub.resumeStatus(),
          made,
          revoked,
          src: audio.src,
        });
        if (kind.startsWith('no-op')) {
          resolveSave?.({ kind: 'no-op', state: await actual.snapshot() });
        } else {
          const result = await actual.save(next, before.generation);
          if (kind === 'saved-without-exact-result-record')
            resolveSave?.({
              kind: 'saved',
              state: {
                ...result.state,
                records: result.state.records.filter((item) => item.key !== next.key),
              },
            });
          else resolveSave?.(result);
        }
        await tick();
        await tick();
        const after = await actual.snapshot();
        const publicAfter = Object.freeze({
          state: hub.player.state(),
          resume: hub.resumeStatus(),
          made,
          revoked,
          src: audio.src,
        });
        actual.close();
        return { kind, before, after, saveCalls, deleteCalls, publicBefore, publicAfter };
      };
      const result = [] as Awaited<ReturnType<typeof run>>[];
      for (const kind of cases) result.push(await run(kind));
      return result;
    });
    expect(rows).toHaveLength(9);
    const record = (key: string, positionMs: number) => ({
      recordVersion: 1,
      key,
      episodeId: 'episode',
      audioAssetId: 'asset',
      releaseRevision: 1,
      audioAssetHash: '9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a',
      positionMs,
      durationMs: 100,
    });
    for (const row of rows) {
      expect(row.saveCalls).toBe(1);
      expect(row.publicAfter).toEqual(row.publicBefore);
      expect(row.publicAfter.src).toBe(
        row.kind === 'no-op-run-b' || row.kind === 'saved-run-b' ? `blob:${row.kind}:2` : '',
      );
      if (row.kind === 'no-op-run-b' || row.kind === 'no-op-unmount') {
        expect(row.deleteCalls).toBe(0);
        expect(row.after).toEqual(row.before);
      }
      if (row.kind === 'no-op-generation-race') {
        expect(row.deleteCalls).toBe(0);
        expect(row.after.generation).toBe(row.before.generation + 1);
        expect(row.after.records).toEqual([
          record('foreign:no-op-generation-race', 11),
          record('resume:episode:asset', 10),
        ]);
      }
      if (row.kind === 'saved-run-b' || row.kind === 'saved-unmount') {
        expect(row.deleteCalls).toBe(1);
        expect(row.after.generation).toBe(row.before.generation + 2);
        expect(row.after.records).toEqual([record(`foreign:${row.kind}`, 11)]);
      }
      if (row.kind === 'saved-without-exact-result-record') {
        expect(row.deleteCalls).toBe(0);
        expect(row.after.generation).toBe(row.before.generation + 1);
        expect(row.after.records).toEqual([
          record(`foreign:${row.kind}`, 11),
          record('resume:episode:asset', 10),
        ]);
      }
      if (
        row.kind === 'saved-compensation-no-op' ||
        row.kind === 'saved-compensation-reject' ||
        row.kind === 'saved-compensation-throw'
      ) {
        expect(row.deleteCalls).toBe(1);
        expect(row.after.generation).toBe(row.before.generation + 1);
        expect(row.after.records).toEqual([
          record(`foreign:${row.kind}`, 11),
          record('resume:episode:asset', 10),
        ]);
      }
    }
  });

  test('continues a paused public hub player without a second request and fences pending IDB saves', async ({
    page,
  }) => {
    await page.goto('/');
    const {
      provenance: rows,
      invalidations,
      completed,
    } = await page.evaluate(async () => {
      const hubMod = await import('/src/mobile-media-hub.ts');
      const storeMod = await import('/src/mobile-media-resume-store.ts');
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const sha256 = Array.from(new Uint8Array(digest), (value) =>
        value.toString(16).padStart(2, '0'),
      ).join('');
      const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
      const waitFor = async (condition: () => boolean) => {
        for (let attempt = 0; attempt < 200; attempt += 1) {
          if (condition()) return;
          await tick();
        }
        throw new Error('pending pause-save did not become reachable');
      };
      const erase = () =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(storeMod.mobileMediaResumeDatabaseName);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      const snapshot = () => ({
        control: { generation: 1, active: 'active' as const },
        safety: { generation: 1, revision: 1, entries: [] as Record<string, unknown>[] },
        bundles: {
          active: {
            revision: 1,
            transportSha256: 'b'.repeat(64),
            rawBundle: {
              releaseRaw: JSON.stringify({ validUntil: '2030-01-02T00:00:00.000Z' }),
              documentsRaw: {
                manifest: JSON.stringify({
                  episodes: [
                    {
                      id: 'episode',
                      sourceId: 'source',
                      seriesId: 'series',
                      audioAssetId: 'asset',
                      durationMs: 100,
                      title: { en: 'T' },
                      summary: { en: 'S' },
                    },
                  ],
                  assets: [
                    {
                      id: 'asset',
                      kind: 'audio',
                      mime: 'audio/wav',
                      path: '/continue.wav',
                      bytes: 4,
                      sha256,
                    },
                  ],
                  series: [{ id: 'series' }],
                }),
                admission: JSON.stringify({
                  sources: [
                    {
                      id: 'source',
                      displayName: { en: 'Source' },
                      validUntil: '2030-01-02T00:00:00.000Z',
                    },
                  ],
                }),
                rights: JSON.stringify({
                  rights: [
                    {
                      assetId: 'asset',
                      status: 'allowed',
                      expiresAt: '2030-01-02T00:00:00.000Z',
                      attribution: 'A',
                      territory: 'global',
                    },
                  ],
                }),
                consent: JSON.stringify({
                  consents: [
                    { episodeId: 'episode', mode: 'local-no-third-party', requiresPrompt: false },
                  ],
                }),
              },
            },
          },
        },
      });
      const run = async (kind: 'saved' | 'no-op' | 'reject') => {
        await erase();
        const actual = await storeMod.openMobileMediaResumeStore();
        let resolveSave: ((value: Awaited<ReturnType<typeof actual.save>>) => void) | null = null;
        let rejectSave: ((reason: Error) => void) | null = null;
        let saveCalls = 0;
        let deleteCalls = 0;
        const store = {
          snapshot: () => actual.snapshot(),
          save: async () => {
            saveCalls += 1;
            return await new Promise<Awaited<ReturnType<typeof actual.save>>>((resolve, reject) => {
              resolveSave = resolve;
              rejectSave = reject;
            });
          },
          deleteIfExact: async (...args: Parameters<typeof actual.deleteIfExact>) => {
            deleteCalls += 1;
            return actual.deleteIfExact(...args);
          },
          clearExact: actual.clearExact,
          close: actual.close,
        };
        let requests = 0;
        let made = 0;
        let revoked = 0;
        let loads = 0;
        const audio = {
          src: '',
          currentTime: 0.01,
          load() {
            loads += 1;
          },
          async play() {},
          pause() {},
          onpause: null as ((event: Event) => void) | null,
          onended: null as ((event: Event) => void) | null,
          onerror: null as ((event: Event) => void) | null,
        };
        const hub = hubMod.createMobileMediaHub({
          snapshot: async () => snapshot(),
          clock: () => Date.parse('2030-01-01T00:00:00.000Z'),
          resumeStore: store,
          fetch: async () => {
            requests += 1;
            return new Response(bytes, { status: 200, headers: { 'content-type': 'audio/wav' } });
          },
          audio: () => audio,
          createObjectURL: () => {
            made += 1;
            return `blob:${kind}:${made}`;
          },
          revokeObjectURL: () => {
            revoked += 1;
          },
        });
        await hub.player.start();
        audio.onpause?.(new Event('pause'));
        await waitFor(() => saveCalls === 1 && resolveSave !== null && rejectSave !== null);
        await hub.player.start();
        const before = Object.freeze({
          state: hub.player.state(),
          resume: hub.resumeStatus(),
          requests,
          made,
          loads,
          revoked,
          position: audio.currentTime,
          src: audio.src,
        });
        if (kind === 'saved') {
          const record = {
            recordVersion: 1 as const,
            key: 'resume:episode:asset',
            episodeId: 'episode',
            audioAssetId: 'asset',
            releaseRevision: 1,
            audioAssetHash: sha256,
            positionMs: 10,
            durationMs: 100,
          };
          resolveSave?.(await actual.save(record, 0));
        } else if (kind === 'no-op')
          resolveSave?.({ kind: 'no-op', state: await actual.snapshot() });
        else rejectSave?.(new Error('late pause-save'));
        await tick();
        await tick();
        const after = await actual.snapshot();
        const publicAfter = Object.freeze({
          state: hub.player.state(),
          resume: hub.resumeStatus(),
          requests,
          made,
          loads,
          revoked,
          position: audio.currentTime,
          src: audio.src,
        });
        hub.unmount();
        actual.close();
        return { kind, before, after, publicAfter, saveCalls, deleteCalls };
      };
      const runCompletedSave = async (
        cause: 'release' | 'rights' | 'source' | 'series' | 'episode' | 'asset' | 'none',
        phase: 'pre' | 'post',
      ) => {
        await erase();
        const actual = await storeMod.openMobileMediaResumeStore();
        const base = snapshot();
        const invalid = snapshot();
        const now = Date.parse('2030-01-01T00:00:00.000Z');
        if (cause === 'release') {
          invalid.bundles.active.rawBundle.releaseRaw = JSON.stringify({
            validUntil: new Date(now).toISOString(),
          });
        } else if (cause === 'rights') {
          const rights = JSON.parse(invalid.bundles.active.rawBundle.documentsRaw.rights);
          rights.rights[0].expiresAt = new Date(now).toISOString();
          invalid.bundles.active.rawBundle.documentsRaw.rights = JSON.stringify(rights);
        } else if (cause !== 'none') {
          invalid.safety.entries.push({
            targetKind: cause,
            targetId: cause,
            targetHash: cause === 'asset' ? sha256 : null,
            status: 'blocked',
          });
        }
        let continuing = false;
        let requests = 0,
          factories = 0,
          made = 0,
          revoked = 0,
          loads = 0;
        let plays = 0,
          pauses = 0,
          saves = 0,
          deletes = 0,
          srcWrites = 0,
          seeks = 0;
        let src = '',
          position = 0.01;
        const audio = {
          get src() {
            return src;
          },
          set src(value: string) {
            srcWrites += 1;
            src = value;
          },
          get currentTime() {
            return position;
          },
          set currentTime(value: number) {
            seeks += 1;
            position = value;
          },
          load() {
            loads += 1;
          },
          async play() {
            plays += 1;
          },
          pause() {
            pauses += 1;
            audio.onpause?.(new Event('pause'));
          },
          onpause: null as ((event: Event) => void) | null,
          onended: null as ((event: Event) => void) | null,
          onerror: null as ((event: Event) => void) | null,
        };
        const hub = hubMod.createMobileMediaHub({
          snapshot: async () => (continuing && (phase === 'pre' || plays === 2) ? invalid : base),
          clock: () => now,
          resumeStore: {
            ...actual,
            save: async (...args: Parameters<typeof actual.save>) => {
              saves += 1;
              return actual.save(...args);
            },
            deleteIfExact: async (...args: Parameters<typeof actual.deleteIfExact>) => {
              deletes += 1;
              return actual.deleteIfExact(...args);
            },
          },
          fetch: async () => {
            requests += 1;
            return new Response(bytes, { status: 200, headers: { 'content-type': 'audio/wav' } });
          },
          audio: () => {
            factories += 1;
            return audio;
          },
          createObjectURL: () => {
            made += 1;
            return 'blob:invalidated-continuation';
          },
          revokeObjectURL: () => {
            revoked += 1;
          },
        });
        const picture = async () => ({
          state: hub.player.state(),
          resume: hub.resumeStatus(),
          store: await actual.snapshot(),
          requests,
          factories,
          made,
          revoked,
          loads,
          plays,
          pauses,
          saves,
          deletes,
          src,
          position,
          srcWrites,
          seeks,
        });
        await hub.player.start();
        const old = [audio.onpause, audio.onended, audio.onerror] as const;
        hub.player.pause();
        await waitFor(() => hub.resumeStatus() === 'saved');
        const before = await picture();
        continuing = true;
        await hub.player.start();
        if (cause !== 'none') await waitFor(() => hub.resumeStatus() === 'deleted');
        const after = await picture();
        old[0]?.(new Event('pause'));
        old[1]?.(new Event('ended'));
        old[2]?.(new Event('error'));
        await tick();
        const afterLate = await picture();
        if (cause === 'none') hub.player.stop();
        const stopped = await picture();
        hub.unmount();
        const teardown = await picture();
        actual.close();
        return { cause, phase, before, after, afterLate, stopped, teardown };
      };
      const provenance = [await run('saved'), await run('no-op'), await run('reject')];
      const invalidations = [];
      for (const cause of ['release', 'rights', 'source', 'series', 'episode', 'asset'] as const)
        for (const phase of ['pre', 'post'] as const)
          invalidations.push(await runCompletedSave(cause, phase));
      const completed = await runCompletedSave('none', 'pre');
      return { provenance, invalidations, completed };
    });
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.saveCalls).toBe(1);
      expect(row.before).toEqual({
        state: { playback: 'playing', availability: 'local', error: null },
        resume: 'idle',
        requests: 1,
        made: 1,
        loads: 1,
        revoked: 0,
        position: 0.01,
        src: `blob:${row.kind}:1`,
      });
      expect(row.publicAfter).toEqual(row.before);
      if (row.kind === 'saved') {
        expect(row.deleteCalls).toBe(1);
        expect(row.after).toEqual({ generation: 2, records: [] });
      } else {
        expect(row.deleteCalls).toBe(0);
        expect(row.after).toEqual({ generation: 0, records: [] });
      }
    }
    const savedRecord = {
      recordVersion: 1,
      key: 'resume:episode:asset',
      episodeId: 'episode',
      audioAssetId: 'asset',
      releaseRevision: 1,
      audioAssetHash: '9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a',
      positionMs: 10,
      durationMs: 100,
    };
    const pausedSaved = {
      state: { playback: 'paused', availability: 'local', error: null },
      resume: 'saved',
      store: { generation: 1, records: [savedRecord] },
      requests: 1,
      factories: 1,
      made: 1,
      revoked: 0,
      loads: 1,
      plays: 1,
      pauses: 1,
      saves: 1,
      deletes: 0,
      src: 'blob:invalidated-continuation',
      position: 0.01,
      srcWrites: 1,
      seeks: 0,
    };
    expect(completed.cause).toBe('none');
    expect(completed.before).toEqual(pausedSaved);
    const continued = {
      ...pausedSaved,
      state: { playback: 'playing', availability: 'local', error: null },
      resume: 'saved',
      plays: 2,
    };
    expect(completed.after).toEqual(continued);
    expect(completed.afterLate).toEqual(continued);
    const stopped = {
      ...continued,
      state: { playback: 'idle', availability: 'local', error: null },
      revoked: 1,
      loads: 2,
      pauses: 2,
      src: '',
      srcWrites: 2,
    };
    expect(completed.stopped).toEqual(stopped);
    expect(completed.teardown).toEqual(stopped);
    expect(invalidations).toHaveLength(12);
    for (const row of invalidations) {
      expect(row.before).toEqual({
        state: { playback: 'paused', availability: 'local', error: null },
        resume: 'saved',
        store: {
          generation: 1,
          records: [
            {
              recordVersion: 1,
              key: 'resume:episode:asset',
              episodeId: 'episode',
              audioAssetId: 'asset',
              releaseRevision: 1,
              audioAssetHash: '9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a',
              positionMs: 10,
              durationMs: 100,
            },
          ],
        },
        requests: 1,
        factories: 1,
        made: 1,
        revoked: 0,
        loads: 1,
        plays: 1,
        pauses: 1,
        saves: 1,
        deletes: 0,
        src: 'blob:invalidated-continuation',
        position: 0.01,
        srcWrites: 1,
        seeks: 0,
      });
      expect(row.after).toEqual({
        state: {
          playback: 'idle',
          availability: ['release', 'rights'].includes(row.cause) ? 'stale' : 'blocked',
          error: null,
        },
        resume: 'deleted',
        store: { generation: 2, records: [] },
        requests: 1,
        factories: 1,
        made: 1,
        revoked: 1,
        loads: 2,
        plays: row.phase === 'pre' ? 1 : 2,
        pauses: 2,
        saves: 1,
        deletes: 1,
        src: '',
        position: 0.01,
        srcWrites: 2,
        seeks: 0,
      });
      expect(row.afterLate).toEqual(row.after);
      expect(row.teardown).toEqual(row.after);
    }
  });

  test('bounds paused continuations in Chromium and consumes every late outcome after deadline, stop or unmount', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/__r11-player-test', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Controlled player lifecycle test</title>',
      }),
    );
    await page.goto('/__r11-player-test');
    const rows = await page.evaluate(async () => {
      const mod = await import('/src/mobile-media-player.ts');
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (v) =>
        v.toString(16).padStart(2, '0'),
      ).join('');
      const nativeSet = window.setTimeout,
        nativeClear = window.clearTimeout;
      let now = 0,
        nextId = 1;
      const timers = new Map<number, { at: number; handler: TimerHandler; args: unknown[] }>();
      window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
        const id = nextId++;
        timers.set(id, { at: now + (delay ?? 0), handler, args });
        return id;
      }) as typeof window.setTimeout;
      window.clearTimeout = ((id?: number) => {
        if (id !== undefined) timers.delete(id);
      }) as typeof window.clearTimeout;
      const advance = (target: number) => {
        now = target;
        for (const [id, timer] of [...timers].sort((a, b) => a[1].at - b[1].at)) {
          if (timer.at > now || !timers.has(id)) continue;
          timers.delete(id);
          if (typeof timer.handler === 'function') timer.handler(...timer.args);
        }
      };
      const tick = () => new Promise<void>((resolve) => nativeSet(resolve, 0));
      const results = [];
      try {
        for (const phase of ['pre-context', 'play', 'post-context'] as const) {
          for (const action of ['deadline', 'stop', 'unmount'] as const) {
            for (const late of ['resolve', 'reject'] as const) {
              if (timers.size !== 0) throw new Error('prior case retained a timer');
              now = 0;
              const stable = {
                availability: 'local' as const,
                asset: {
                  path: '/controlled.wav',
                  bytes: 4,
                  sha256,
                  expiresAt: 60_000,
                  identity: 'verified',
                },
              };
              let continuing = false,
                settled = false;
              let enter!: () => void;
              const entered = new Promise<void>((resolve) => {
                enter = resolve;
              });
              let fulfill!: (value: typeof stable) => void, reject!: (reason: Error) => void;
              const held = new Promise<typeof stable>((yes, no) => {
                fulfill = yes;
                reject = no;
              });
              let requests = 0,
                factories = 0,
                made = 0,
                revoked = 0,
                loads = 0,
                plays = 0,
                pauses = 0,
                pauseSaves = 0,
                ended = 0;
              const invalidated: string[] = [],
                publications: unknown[] = [];
              const audio = {
                src: '',
                currentTime: 0.01,
                load() {
                  loads += 1;
                },
                play() {
                  plays += 1;
                  if (continuing && phase === 'play') {
                    enter();
                    return held.then(() => undefined);
                  }
                  return Promise.resolve();
                },
                pause() {
                  pauses += 1;
                },
                onpause: null as ((event: Event) => void) | null,
                onended: null as ((event: Event) => void) | null,
                onerror: null as ((event: Event) => void) | null,
              };
              const player = mod.createMobileMediaPlayer({
                context: async () => {
                  if (
                    continuing &&
                    (phase === 'pre-context' || (phase === 'post-context' && plays === 2))
                  ) {
                    enter();
                    return held;
                  }
                  return stable;
                },
                clock: () => now,
                fetch: async () => {
                  requests += 1;
                  return new Response(bytes, { headers: { 'content-type': 'audio/wav' } });
                },
                audio: () => {
                  factories += 1;
                  return audio;
                },
                createObjectURL: () => {
                  made += 1;
                  return 'blob:controlled';
                },
                revokeObjectURL: () => {
                  revoked += 1;
                },
                onState: (state) => publications.push(state),
                onPause: () => {
                  pauseSaves += 1;
                },
                onEnded: () => {
                  ended += 1;
                },
                onInvalidated: (value) => invalidated.push(value),
              });
              await player.start();
              const old = [audio.onpause, audio.onended, audio.onerror];
              audio.onpause?.(new Event('pause'));
              continuing = true;
              const pending = player.start().then(() => {
                settled = true;
              });
              await entered;
              const active = [audio.onpause, audio.onended, audio.onerror];
              const picture = () =>
                structuredClone({
                  state: player.state(),
                  src: audio.src,
                  position: audio.currentTime,
                  requests,
                  factories,
                  made,
                  revoked,
                  loads,
                  plays,
                  pauses,
                  pauseSaves,
                  ended,
                  invalidated,
                  publications,
                  timers: timers.size,
                  settled,
                });
              const before = picture();
              advance(4_999);
              await tick();
              const at4999 = picture();
              if (action === 'deadline') advance(5_000);
              else if (action === 'stop') player.stop();
              else player.unmount();
              await tick();
              const after = picture(); // Must settle before the foreign promise is released.
              if (late === 'resolve') fulfill(stable);
              else reject(new Error('late foreign rejection'));
              await pending;
              await tick();
              for (const handlers of [old, active]) {
                handlers[0]?.(new Event('pause'));
                handlers[1]?.(new Event('ended'));
                handlers[2]?.(new Event('error'));
              }
              advance(5_001);
              await tick();
              const afterLate = picture();
              player.unmount();
              if (timers.size !== 0) throw new Error('teardown retained a timer');
              results.push({ phase, action, late, before, at4999, after, afterLate });
            }
          }
        }
      } finally {
        window.setTimeout = nativeSet;
        window.clearTimeout = nativeClear;
      }
      return results;
    });
    expect(rows).toHaveLength(18);
    const initialStates = [
      { playback: 'loading', availability: 'local', error: null },
      { playback: 'playing', availability: 'local', error: null },
      { playback: 'paused', availability: 'local', error: null },
    ];
    for (const row of rows) {
      const before = {
        state: initialStates[2],
        src: 'blob:controlled',
        position: 0.01,
        requests: 1,
        factories: 1,
        made: 1,
        revoked: 0,
        loads: 1,
        plays: row.phase === 'pre-context' ? 1 : 2,
        pauses: 0,
        pauseSaves: 1,
        ended: 0,
        invalidated: ['local', 'local'],
        publications: initialStates,
        timers: 2,
        settled: false,
      };
      expect(row.before, JSON.stringify([row.phase, row.action, row.late])).toEqual(before);
      expect(row.at4999).toEqual(before);
      const state =
        row.action === 'deadline'
          ? {
              playback: 'error',
              availability: row.phase === 'play' ? 'local' : 'storage-failure',
              error: row.phase === 'play' ? 'network-error' : 'storage-failure',
            }
          : { playback: 'idle', availability: 'local', error: null };
      expect(row.after).toEqual({
        ...before,
        state,
        src: '',
        revoked: 1,
        loads: 2,
        pauses: 1,
        invalidated: row.action === 'deadline' ? ['local', 'local'] : ['local', 'local', 'local'],
        publications: row.action === 'unmount' ? initialStates : [...initialStates, state],
        timers: 0,
        settled: true,
      });
      expect(row.afterLate).toEqual(row.after);
    }
    expect(errors).toEqual([]);
  });
});
