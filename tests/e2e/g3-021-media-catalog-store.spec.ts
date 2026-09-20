import { expect, test } from '@playwright/test';

const fixedNow = Date.parse('2026-09-01T12:00:00.000Z');
test('G3-021 P2 has an isolated real IndexedDB catalog schema', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'one deterministic mobile browser-IDB proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async () => {
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(() => Date.parse('2026-09-01T12:00:00.000Z'));
    const state = await db.snapshot();
    db.close();
    return {
      name: mod.mobileMediaCatalogDatabaseName,
      keys: Object.keys(state.bundles),
      generation: state.control.generation,
    };
  });
  expect(value).toEqual({
    name: 'wrn-mobile-media-catalog-v1',
    keys: ['active', 'candidate', 'previous'],
    generation: 0,
  });
});

test('G3-021 P2 saves and activates a complete pinned raw bundle atomically in real IndexedDB', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'one deterministic mobile browser-IDB proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(() => now);
    const saved = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
    const active = await db.activate(saved.control.generation);
    db.close();
    return {
      saved: saved.control.generation,
      active: active.control.generation,
      revision: active.bundles.active?.revision,
      safety: active.safety.revision,
    };
  }, fixedNow);
  expect(value).toEqual({ saved: 1, active: 2, revision: 1, safety: 1 });
});

test('G3-021 P2 keeps higher additive safety across A/B/A, restart, rollback and a blocked candidate', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'real browser-IDB monotone safety matrix');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha = async (raw: string) => {
      const value = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(value), (item) => item.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    await remove();
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const revision = async (
      number: number,
      mode: 'additive' | 'nonadditive' | 'blocked' | 'cycle' | 'missing-reference',
    ) => {
      const release = JSON.parse(loaded.rawBundle.releaseRaw);
      const documents = Object.fromEntries(
        Object.entries(loaded.rawBundle.documentsRaw).map(([kind, raw]) => [kind, JSON.parse(raw)]),
      ) as Record<string, Record<string, unknown>>;
      for (const document of Object.values(documents)) document.revision = number;
      const revocation = documents.revocation as {
        safetyRevision: number;
        references: Array<{ kind: string; id: string }>;
        entries: Array<Record<string, unknown>>;
      };
      revocation.safetyRevision = number;
      if (mode === 'additive') {
        for (let history = 2; history <= number; history += 1) {
          revocation.references.push({ kind: 'asset', id: `wrn-media-asset-history-${history}` });
          revocation.entries.push({
            targetKind: 'asset',
            targetId: `wrn-media-asset-history-${history}`,
            targetHash: String(history).repeat(64),
            status: 'blocked',
            replacementKind: null,
            replacementId: null,
          });
        }
      }
      if (mode === 'nonadditive') {
        revocation.references = revocation.references.filter(
          (reference) => reference.id !== 'wrn-media-asset-history-2',
        );
        revocation.entries = [];
      }
      if (mode === 'blocked') {
        for (let history = 2; history < number; history += 1) {
          revocation.references.push({ kind: 'asset', id: `wrn-media-asset-history-${history}` });
          revocation.entries.push({
            targetKind: 'asset',
            targetId: `wrn-media-asset-history-${history}`,
            targetHash: String(history).repeat(64),
            status: 'blocked',
            replacementKind: null,
            replacementId: null,
          });
        }
        const manifest = documents.manifest as { assets: Array<{ id: string; sha256: string }> };
        const asset = manifest.assets[0]!;
        revocation.entries.push({
          targetKind: 'asset',
          targetId: asset.id,
          targetHash: asset.sha256,
          status: 'blocked',
          replacementKind: null,
          replacementId: null,
        });
      }
      if (mode === 'cycle') {
        const manifest = documents.manifest as { assets: Array<{ id: string; sha256: string }> };
        const [audio, thumbnail] = manifest.assets;
        revocation.entries.push(
          {
            targetKind: 'asset',
            targetId: audio!.id,
            targetHash: audio!.sha256,
            status: 'replaced',
            replacementKind: 'asset',
            replacementId: thumbnail!.id,
          },
          {
            targetKind: 'asset',
            targetId: thumbnail!.id,
            targetHash: thumbnail!.sha256,
            status: 'replaced',
            replacementKind: 'asset',
            replacementId: audio!.id,
          },
        );
      }
      if (mode === 'missing-reference') {
        revocation.references.push({ kind: 'asset', id: 'wrn-media-asset-history-2' });
        revocation.entries.push({
          targetKind: 'asset',
          targetId: 'wrn-media-asset-history-2',
          targetHash: '2'.repeat(64),
          status: 'replaced',
          replacementKind: 'asset',
          replacementId: 'wrn-media-asset-history-5',
        });
      }
      revocation.references.sort((left, right) => {
        const leftKey = `${left.kind}\0${left.id}`;
        const rightKey = `${right.kind}\0${right.id}`;
        return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
      });
      revocation.entries.sort((left, right) => {
        const leftKey = `${left.targetKind}\0${left.targetId}\0${left.targetHash}`;
        const rightKey = `${right.targetKind}\0${right.targetId}\0${right.targetHash}`;
        return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
      });
      const documentsRaw = {} as Record<string, string>;
      for (const descriptor of release.documents) {
        const raw = JSON.stringify(documents[descriptor.documentClass]);
        documentsRaw[descriptor.documentClass] = raw;
        descriptor.revision = number;
        descriptor.bytes = new TextEncoder().encode(raw).byteLength;
        descriptor.sha256 = await sha(raw);
        const doc = documents[descriptor.documentClass];
        descriptor.recordCount =
          descriptor.documentClass === 'manifest'
            ? (doc.series as unknown[]).length +
              (doc.episodes as unknown[]).length +
              (doc.assets as unknown[]).length
            : descriptor.documentClass === 'admission'
              ? (doc.sources as unknown[]).length + (doc.identityLinks as unknown[]).length
              : descriptor.documentClass === 'rights'
                ? (doc.rights as unknown[]).length
                : descriptor.documentClass === 'consent'
                  ? (doc.consents as unknown[]).length
                  : descriptor.documentClass === 'lifecycle'
                    ? 1
                    : (doc.entries as unknown[]).length;
      }
      release.revision = number;
      const releaseRaw = JSON.stringify(release);
      return {
        rawBundle: { releaseRaw, documentsRaw },
        pin: {
          ...loader.mobileMediaBuildPin,
          revision: number,
          transportSha256: await sha(releaseRaw),
        },
      };
    };
    const b2 = await revision(2, 'additive');
    const b3 = await revision(3, 'additive');
    const bad3 = await revision(3, 'nonadditive');
    const blocked2 = await revision(2, 'blocked');
    const blocked4 = await revision(4, 'blocked');
    const cyclic4 = await revision(4, 'cycle');
    const missingReference4 = await revision(4, 'missing-reference');
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(
      () => now,
      [
        loader.mobileMediaBuildPin,
        b2.pin,
        b3.pin,
        bad3.pin,
        blocked2.pin,
        blocked4.pin,
        cyclic4.pin,
        missingReference4.pin,
      ],
    );
    const a = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
    const activeA = await db.activate(a.control.generation);
    const b = await db.saveCandidate({
      rawBundle: b2.rawBundle,
      expectedGeneration: activeA.control.generation,
    });
    const activeB = await db.activate(b.control.generation);
    let lower = '';
    try {
      await db.saveCandidate({
        rawBundle: loaded.rawBundle,
        expectedGeneration: activeB.control.generation,
      });
    } catch (error) {
      lower = (error as Error).message;
    }
    const same = await db.saveCandidate({
      rawBundle: b2.rawBundle,
      expectedGeneration: activeB.control.generation,
    });
    let conflict = '';
    try {
      await db.saveCandidate({
        rawBundle: blocked2.rawBundle,
        expectedGeneration: same.control.generation,
      });
    } catch (error) {
      conflict = (error as Error).message;
    }
    let nonadditive = '';
    try {
      await db.saveCandidate({
        rawBundle: bad3.rawBundle,
        expectedGeneration: same.control.generation,
      });
    } catch (error) {
      nonadditive = (error as Error).message;
    }
    const c = await db.saveCandidate({
      rawBundle: b3.rawBundle,
      expectedGeneration: same.control.generation,
    });
    const activeC = await db.activate(c.control.generation);
    let cycle = '';
    try {
      await db.saveCandidate({
        rawBundle: cyclic4.rawBundle,
        expectedGeneration: activeC.control.generation,
      });
    } catch (error) {
      cycle = (error as Error).message;
    }
    let missingReference = '';
    try {
      await db.saveCandidate({
        rawBundle: missingReference4.rawBundle,
        expectedGeneration: activeC.control.generation,
      });
    } catch (error) {
      missingReference = (error as Error).message;
    }
    const blocked = await db.saveCandidate({
      rawBundle: blocked4.rawBundle,
      expectedGeneration: activeC.control.generation,
    });
    let blockedCode = '';
    try {
      await db.activate(blocked.control.generation);
    } catch (error) {
      blockedCode = (error as Error).message;
    }
    db.close();
    const restarted = await mod.openMobileMediaCatalogStore(
      () => now,
      [
        loader.mobileMediaBuildPin,
        b2.pin,
        b3.pin,
        bad3.pin,
        blocked2.pin,
        blocked4.pin,
        cyclic4.pin,
        missingReference4.pin,
      ],
    );
    let rollback = '';
    try {
      await restarted.rollback(blocked.control.generation);
    } catch (error) {
      rollback = (error as Error).message;
    }
    const after = await restarted.snapshot();
    restarted.close();
    return {
      lower,
      sameGeneration: same.control.generation,
      conflict,
      nonadditive,
      cycle,
      missingReference,
      blockedCode,
      rollback,
      active: after.bundles.active?.revision,
      safety: after.safety.revision,
      generation: after.control.generation,
    };
  }, fixedNow);
  expect(value).toEqual({
    lower: 'invalid-candidate',
    sameGeneration: 4,
    conflict: 'conflict',
    nonadditive: 'protected',
    cycle: 'invalid-candidate',
    missingReference: 'invalid-candidate',
    blockedCode: 'protected',
    rollback: '',
    active: 2,
    safety: 3,
    generation: 8,
  });
});

test('G3-021 P2 rejects raw divergence and leaves the real IDB state untouched', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'negative real browser-IDB proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(() => now);
    const rawBundle = {
      ...loaded.rawBundle,
      documentsRaw: {
        ...loaded.rawBundle.documentsRaw,
        manifest: `${loaded.rawBundle.documentsRaw.manifest} `,
      },
    };
    let code = '';
    try {
      await db.saveCandidate({ rawBundle, expectedGeneration: 0 });
    } catch (error) {
      code = (error as Error).message;
    }
    const state = await db.snapshot();
    db.close();
    return { code, generation: state.control.generation, candidate: state.bundles.candidate };
  }, fixedNow);
  expect(value).toEqual({ code: 'invalid-candidate', generation: 0, candidate: null });
});

test('G3-021 P2 R4-R2-03 reaches the coupled total JSON maximum through saveCandidate', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'real browser-IDB cap proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const sha = async (raw: string) => {
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const bytes = (raw: string) => new TextEncoder().encode(raw).byteLength;
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const documentsRaw = { ...loaded.rawBundle.documentsRaw };
    const kinds = Object.keys(documentsRaw) as Array<keyof typeof documentsRaw>;
    let remaining = 524288 - kinds.reduce((sum, kind) => sum + bytes(documentsRaw[kind]), 0);
    for (const kind of kinds) {
      const pad = Math.max(0, Math.min(remaining, 524288 - bytes(documentsRaw[kind])));
      documentsRaw[kind] = `${documentsRaw[kind]}${' '.repeat(pad)}`;
      remaining -= pad;
    }
    if (remaining !== 0 || kinds.some((kind) => bytes(documentsRaw[kind]) > 524288))
      throw new Error('unreachable');
    const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
      documents: Array<{ documentClass: keyof typeof documentsRaw; bytes: number; sha256: string }>;
    };
    for (const descriptor of release.documents) {
      descriptor.bytes = bytes(documentsRaw[descriptor.documentClass]);
      descriptor.sha256 = await sha(documentsRaw[descriptor.documentClass]);
    }
    const releaseRaw = JSON.stringify(release);
    const pin = {
      schema: release.schema,
      contractVersion: release.contractVersion,
      path: '/wrn-mobile-media/v1/mobile-media-release.json',
      revision: release.revision,
      transportSha256: await sha(releaseRaw),
    };
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(() => now, pin);
    const equal = await db.saveCandidate({
      rawBundle: { releaseRaw, documentsRaw },
      expectedGeneration: 0,
    });
    let code = '';
    try {
      await db.saveCandidate({
        rawBundle: {
          releaseRaw,
          documentsRaw: { ...documentsRaw, manifest: `${documentsRaw.manifest} ` },
        },
        expectedGeneration: equal.control.generation,
      });
    } catch (error) {
      code = (error as Error).message;
    }
    const after = await db.snapshot();
    db.close();
    return {
      equal: equal.control.generation,
      total: kinds.reduce((sum, kind) => sum + bytes(documentsRaw[kind]), 0),
      code,
      lkg: after.control.generation,
      candidateBytes:
        after.bundles.candidate?.rawBundle.documentsRaw.manifest === documentsRaw.manifest,
    };
  }, fixedNow);
  expect(value).toEqual({
    equal: 1,
    total: 524288,
    code: 'invalid-candidate',
    lkg: 1,
    candidateBytes: true,
  });
});

test('G3-021 P2 R4-R2-03 reaches the safety raw maximum through save and activate', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'real browser-IDB safety cap proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const sha = async (raw: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const bytes = (raw: string) => new TextEncoder().encode(raw).byteLength;
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const documentsRaw = { ...loaded.rawBundle.documentsRaw };
    documentsRaw.revocation = `${documentsRaw.revocation}${' '.repeat(65536 - bytes(documentsRaw.revocation))}`;
    const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
      schema: string;
      contractVersion: string;
      revision: number;
      documents: Array<{ documentClass: keyof typeof documentsRaw; bytes: number; sha256: string }>;
    };
    const descriptor = release.documents.find((item) => item.documentClass === 'revocation');
    if (!descriptor || bytes(documentsRaw.revocation) !== 65536) throw new Error('unreachable');
    descriptor.bytes = 65536;
    descriptor.sha256 = await sha(documentsRaw.revocation);
    const releaseRaw = JSON.stringify(release);
    const pin = {
      schema: release.schema,
      contractVersion: release.contractVersion,
      path: '/wrn-mobile-media/v1/mobile-media-release.json',
      revision: release.revision,
      transportSha256: await sha(releaseRaw),
    };
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(() => now, pin);
    const saved = await db.saveCandidate({
      rawBundle: { releaseRaw, documentsRaw },
      expectedGeneration: 0,
    });
    const active = await db.activate(saved.control.generation);
    let code = '';
    try {
      await db.saveCandidate({
        rawBundle: {
          releaseRaw,
          documentsRaw: { ...documentsRaw, revocation: `${documentsRaw.revocation} ` },
        },
        expectedGeneration: active.control.generation,
      });
    } catch (error) {
      code = (error as Error).message;
    }
    const after = await db.snapshot();
    db.close();
    return {
      save: saved.control.generation,
      activate: active.control.generation,
      safetyBytes: bytes(after.safety.raw),
      code,
      lkg: after.control.generation,
      activeBytes:
        after.bundles.active?.rawBundle.documentsRaw.revocation === documentsRaw.revocation,
    };
  }, fixedNow);
  expect(value).toEqual({
    save: 1,
    activate: 2,
    safetyBytes: 65536,
    code: 'invalid-candidate',
    lkg: 2,
    activeBytes: true,
  });
});

test('G3-021 P2 R6 binds literal minimal peers, target maxima, safety dominance and totalJson sink', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'R6 target-max and safety browser-IDB matrix');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const bytes = (raw: string) => new TextEncoder().encode(raw).byteLength;
    const sha = async (raw: string) =>
      Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))),
        (byte) => byte.toString(16).padStart(2, '0'),
      ).join('');
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const contracts = await import('/@id/@wrn/content-contracts/mobile-media-v1');
    const common = (schema: string) => ({
      schema,
      contractVersion: '1.0.0',
      releaseId: 'wrn-media-release-a',
      revision: 1,
      generatedAt: '2026-09-01T00:00:00.000Z',
      validUntil: '2026-09-02T00:00:00.000Z',
      owner: 'a',
    });
    const documents = {
      manifest: {
        ...common('wrn.mobile-media-manifest.v1'),
        series: [],
        episodes: [],
        assets: [],
      },
      admission: {
        ...common('wrn.mobile-media-admission.v1'),
        sources: [],
        identityLinks: [],
      },
      rights: { ...common('wrn.mobile-media-rights.v1'), rights: [] },
      consent: { ...common('wrn.mobile-media-consent.v1'), consents: [] },
      lifecycle: {
        ...common('wrn.mobile-media-lifecycle.v1'),
        lifecycle: {
          playbackStates: ['idle', 'loading', 'ready', 'playing', 'paused', 'ended', 'error'],
          availabilityStates: ['local', 'online', 'offline', 'stale', 'blocked'],
          playbackTransitions: [
            { from: 'idle', event: 'user-play', to: 'loading' },
            { from: 'loading', event: 'decoder-ready', to: 'playing' },
            { from: 'loading', event: 'failure', to: 'error' },
            { from: 'playing', event: 'user-pause', to: 'paused' },
            { from: 'paused', event: 'user-play', to: 'playing' },
            { from: 'playing', event: 'media-ended', to: 'ended' },
            { from: 'ended', event: 'user-play', to: 'loading' },
            { from: 'error', event: 'user-reset', to: 'idle' },
          ],
          availabilityTransitions: [
            { from: 'online', event: 'network-lost', to: 'offline' },
            { from: 'offline', event: 'network-restored', to: 'online' },
            { from: 'online', event: 'freshness-expired', to: 'stale' },
            { from: 'offline', event: 'freshness-expired', to: 'stale' },
            { from: 'local', event: 'freshness-expired', to: 'stale' },
            { from: 'local', event: 'safety-block', to: 'blocked' },
            { from: 'online', event: 'safety-block', to: 'blocked' },
            { from: 'offline', event: 'safety-block', to: 'blocked' },
            { from: 'stale', event: 'safety-block', to: 'blocked' },
          ],
          dominanceRules: [
            {
              availability: 'local',
              stopPlayback: false,
              detachDecoder: false,
              allowNewStart: true,
              allowResumeWrite: true,
            },
            {
              availability: 'online',
              stopPlayback: false,
              detachDecoder: false,
              allowNewStart: true,
              allowResumeWrite: true,
            },
            {
              availability: 'offline',
              stopPlayback: false,
              detachDecoder: false,
              allowNewStart: false,
              allowResumeWrite: true,
            },
            {
              availability: 'stale',
              stopPlayback: true,
              detachDecoder: true,
              allowNewStart: false,
              allowResumeWrite: false,
            },
            {
              availability: 'blocked',
              stopPlayback: true,
              detachDecoder: true,
              allowNewStart: false,
              allowResumeWrite: false,
            },
          ],
        },
      },
      revocation: {
        ...common('wrn.mobile-media-revocation.v1'),
        safetyRevision: 1,
        revocationFloor: 1,
        references: [],
        entries: [],
      },
    };
    const minimum = Object.fromEntries(
      Object.entries(documents).map(([kind, document]) => [kind, JSON.stringify(document)]),
    ) as Record<string, string>;
    const bind = async (documentsRaw: Record<string, string>) => {
      const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
        schema: string;
        contractVersion: string;
        releaseId: string;
        revision: number;
        generatedAt: string;
        validUntil: string;
        owner: string;
        documents: Array<{
          documentClass: string;
          bytes: number;
          sha256: string;
          recordCount: number;
        }>;
      };
      release.releaseId = 'wrn-media-release-a';
      release.generatedAt = '2026-09-01T00:00:00.000Z';
      release.validUntil = '2026-09-02T00:00:00.000Z';
      release.owner = 'a';
      for (const descriptor of release.documents) {
        const document = JSON.parse(documentsRaw[descriptor.documentClass]!);
        descriptor.bytes = bytes(documentsRaw[descriptor.documentClass]!);
        descriptor.sha256 = await sha(documentsRaw[descriptor.documentClass]!);
        descriptor.recordCount =
          descriptor.documentClass === 'manifest'
            ? document.series.length + document.episodes.length + document.assets.length
            : descriptor.documentClass === 'admission'
              ? document.sources.length + document.identityLinks.length
              : descriptor.documentClass === 'rights'
                ? document.rights.length
                : descriptor.documentClass === 'consent'
                  ? document.consents.length
                  : descriptor.documentClass === 'lifecycle'
                    ? 1
                    : document.entries.length;
      }
      const releaseRaw = JSON.stringify(release);
      return {
        release,
        rawBundle: { releaseRaw, documentsRaw },
        pin: {
          ...loader.mobileMediaBuildPin,
          transportSha256: await sha(releaseRaw),
        },
      };
    };
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const minimumBound = await bind(minimum);
    const minimumValid = Object.entries(documents).every(([kind, document]) =>
      contracts.validateMobileMediaDocument(kind, document),
    );
    const candidateValid =
      contracts.validateMobileMediaCandidate(
        minimumBound.release,
        documents,
        minimum,
        () => now,
      ) !== null;
    if (!minimumValid || !candidateValid) throw new Error('minimum validator rejection');
    const targets = [
      { target: 'manifest', peers: 2903, targetBytes: 521385, redundancy: 527191 },
      { target: 'admission', peers: 2908, targetBytes: 521380, redundancy: 527196 },
      { target: 'rights', peers: 2931, targetBytes: 521357, redundancy: 527219 },
      { target: 'consent', peers: 2928, targetBytes: 521360, redundancy: 527216 },
      { target: 'lifecycle', peers: 1199, targetBytes: 523089, redundancy: 525487 },
    ];
    const cases = [] as Array<Record<string, unknown>>;
    for (const expected of targets) {
      await remove();
      const peers = Object.entries(minimum)
        .filter(([kind]) => kind !== expected.target)
        .reduce((total, [, raw]) => total + bytes(raw), 0);
      const targetBytes = 524288 - peers;
      const documentsRaw = {
        ...minimum,
        [expected.target]: `${minimum[expected.target]!}${' '.repeat(
          targetBytes - bytes(minimum[expected.target]!),
        )}`,
      };
      const bound = await bind(documentsRaw);
      const parsed = Object.fromEntries(
        Object.entries(documentsRaw).map(([kind, raw]) => [kind, JSON.parse(raw)]),
      );
      if (
        contracts.validateMobileMediaCandidate(bound.release, parsed, documentsRaw, () => now) ===
        null
      )
        throw new Error('target candidate validator rejection');
      const db = await mod.openMobileMediaCatalogStore(() => now, bound.pin);
      const saved = await db.saveCandidate({ rawBundle: bound.rawBundle, expectedGeneration: 0 });
      const active = await db.activate(saved.control.generation);
      const after = await db.snapshot();
      db.close();
      cases.push({
        target: expected.target,
        peers,
        targetBytes,
        total: Object.values(documentsRaw).reduce((sum, raw) => sum + bytes(raw), 0),
        save: saved.control.generation,
        activate: active.control.generation,
        readback:
          after.bundles.active?.rawBundle.documentsRaw[expected.target] ===
          documentsRaw[expected.target],
        redundancy: 524288 + peers,
        strictlyExceeds: 524288 + peers > 524288,
      });
    }
    await remove();
    const equal = { ...minimum, manifest: `${minimum.manifest}${' '.repeat(1)}` };
    const equalBytes = Object.values(equal).reduce((sum, raw) => sum + bytes(raw), 0);
    const padded = { ...equal, manifest: `${equal.manifest}${' '.repeat(524288 - equalBytes)}` };
    const plus = { ...padded, manifest: `${padded.manifest} ` };
    const equalBound = await bind(padded);
    const plusBound = await bind(plus);
    const db = await mod.openMobileMediaCatalogStore(() => now, [equalBound.pin, plusBound.pin]);
    const saved = await db.saveCandidate({
      rawBundle: equalBound.rawBundle,
      expectedGeneration: 0,
    });
    const before = await db.snapshot();
    let plusCode = '';
    try {
      await db.saveCandidate({
        rawBundle: plusBound.rawBundle,
        expectedGeneration: saved.control.generation,
      });
    } catch (error) {
      plusCode = (error as Error).message;
    }
    const after = await db.snapshot();
    db.close();
    await remove();
    const equalDocuments = { ...minimum };
    equalDocuments.revocation = `${equalDocuments.revocation}${' '.repeat(
      65536 - bytes(equalDocuments.revocation),
    )}`;
    const equalSafety = await bind(equalDocuments);
    const plusDocuments = JSON.parse(equalDocuments.revocation) as Record<string, unknown>;
    plusDocuments.revision = 2;
    plusDocuments.safetyRevision = 2;
    const higherDocuments = Object.fromEntries(
      Object.entries(documents).map(([kind, document]) => [
        kind,
        kind === 'revocation' ? plusDocuments : { ...document, revision: 2 },
      ]),
    ) as Record<string, Record<string, unknown>>;
    const higherRaw = Object.fromEntries(
      Object.entries(higherDocuments).map(([kind, document]) => [kind, JSON.stringify(document)]),
    ) as Record<string, string>;
    higherRaw.revocation = `${higherRaw.revocation}${' '.repeat(65537 - bytes(higherRaw.revocation))}`;
    const higherSafety = await bind(higherRaw);
    higherSafety.release.revision = 2;
    for (const descriptor of higherSafety.release.documents) descriptor.revision = 2;
    const higherReleaseRaw = JSON.stringify(higherSafety.release);
    higherSafety.rawBundle.releaseRaw = higherReleaseRaw;
    higherSafety.pin = {
      ...higherSafety.pin,
      revision: 2,
      transportSha256: await sha(higherReleaseRaw),
    };
    const safetyDb = await mod.openMobileMediaCatalogStore(
      () => now,
      [equalSafety.pin, higherSafety.pin],
    );
    const savedSafety = await safetyDb.saveCandidate({
      rawBundle: equalSafety.rawBundle,
      expectedGeneration: 0,
    });
    const activeSafety = await safetyDb.activate(savedSafety.control.generation);
    const beforeSafety = await safetyDb.snapshot();
    let safetyCode = '';
    try {
      await safetyDb.saveCandidate({
        rawBundle: higherSafety.rawBundle,
        expectedGeneration: activeSafety.control.generation,
      });
    } catch (error) {
      safetyCode = (error as Error).message;
    }
    const afterSafety = await safetyDb.snapshot();
    safetyDb.close();
    return {
      minimum: Object.fromEntries(Object.entries(minimum).map(([kind, raw]) => [kind, bytes(raw)])),
      minimumValid,
      candidateValid,
      cases,
      plus: {
        equalTotal: Object.values(padded).reduce((sum, raw) => sum + bytes(raw), 0),
        plusTotal: Object.values(plus).reduce((sum, raw) => sum + bytes(raw), 0),
        code: plusCode,
        unchanged: JSON.stringify(before) === JSON.stringify(after),
      },
      safety: {
        nonRevocationPeers: 2871,
        remaining: 521417,
        dominates: 521417 > 65536,
        actualPeers:
          bytes(minimum.manifest) +
          bytes(minimum.admission) +
          bytes(minimum.rights) +
          bytes(minimum.consent) +
          bytes(minimum.lifecycle),
        equalBytes: bytes(equalSafety.rawBundle.documentsRaw.revocation),
        plusBytes: bytes(higherSafety.rawBundle.documentsRaw.revocation),
        save: savedSafety.control.generation,
        activate: activeSafety.control.generation,
        safetyBytes: bytes(beforeSafety.safety.raw),
        code: safetyCode,
        unchanged: JSON.stringify(beforeSafety) === JSON.stringify(afterSafety),
      },
    };
  }, fixedNow);
  expect(value.minimum).toEqual({
    manifest: 245,
    admission: 240,
    rights: 217,
    consent: 220,
    lifecycle: 1949,
    revocation: 277,
  });
  expect(value.minimumValid).toBe(true);
  expect(value.candidateValid).toBe(true);
  expect(value.cases).toEqual([
    {
      target: 'manifest',
      peers: 2903,
      targetBytes: 521385,
      total: 524288,
      save: 1,
      activate: 2,
      readback: true,
      redundancy: 527191,
      strictlyExceeds: true,
    },
    {
      target: 'admission',
      peers: 2908,
      targetBytes: 521380,
      total: 524288,
      save: 1,
      activate: 2,
      readback: true,
      redundancy: 527196,
      strictlyExceeds: true,
    },
    {
      target: 'rights',
      peers: 2931,
      targetBytes: 521357,
      total: 524288,
      save: 1,
      activate: 2,
      readback: true,
      redundancy: 527219,
      strictlyExceeds: true,
    },
    {
      target: 'consent',
      peers: 2928,
      targetBytes: 521360,
      total: 524288,
      save: 1,
      activate: 2,
      readback: true,
      redundancy: 527216,
      strictlyExceeds: true,
    },
    {
      target: 'lifecycle',
      peers: 1199,
      targetBytes: 523089,
      total: 524288,
      save: 1,
      activate: 2,
      readback: true,
      redundancy: 525487,
      strictlyExceeds: true,
    },
  ]);
  expect(value.plus).toEqual({
    equalTotal: 524288,
    plusTotal: 524289,
    code: 'invalid-candidate',
    unchanged: true,
  });
  expect(value.safety).toEqual({
    nonRevocationPeers: 2871,
    remaining: 521417,
    dominates: true,
    actualPeers: 2871,
    equalBytes: 65536,
    plusBytes: 65537,
    save: 1,
    activate: 2,
    safetyBytes: 65536,
    code: 'protected',
    unchanged: true,
  });
});

test('G3-021 P2 R5 preserves the existing 65536/65537 safety product path', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'R5 safety cap browser-IDB matrix');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const bytes = (raw: string) => new TextEncoder().encode(raw).byteLength;
    const sha = async (raw: string) =>
      Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))),
        (byte) => byte.toString(16).padStart(2, '0'),
      ).join('');
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const bind = async (revocation: string, revision: number) => {
      const documents = Object.fromEntries(
        Object.entries(loaded.rawBundle.documentsRaw).map(([kind, raw]) => [kind, JSON.parse(raw)]),
      ) as Record<string, Record<string, unknown>>;
      for (const document of Object.values(documents)) document.revision = revision;
      (documents.revocation as { safetyRevision: number }).safetyRevision = revision;
      const documentsRaw = Object.fromEntries(
        Object.entries(documents).map(([kind, document]) => [kind, JSON.stringify(document)]),
      ) as Record<string, string>;
      documentsRaw.revocation = revocation;
      const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
        revision: number;
        documents: Array<{
          documentClass: string;
          revision: number;
          bytes: number;
          sha256: string;
        }>;
      };
      for (const descriptor of release.documents) {
        descriptor.revision = revision;
        descriptor.bytes = bytes(documentsRaw[descriptor.documentClass]!);
        descriptor.sha256 = await sha(documentsRaw[descriptor.documentClass]!);
      }
      release.revision = revision;
      const releaseRaw = JSON.stringify(release);
      return {
        rawBundle: { releaseRaw, documentsRaw },
        pin: { ...loader.mobileMediaBuildPin, revision, transportSha256: await sha(releaseRaw) },
      };
    };
    const equalRaw = `${loaded.rawBundle.documentsRaw.revocation}${' '.repeat(
      65536 - bytes(loaded.rawBundle.documentsRaw.revocation),
    )}`;
    const equal = await bind(equalRaw, 1);
    const plusDocument = JSON.parse(loaded.rawBundle.documentsRaw.revocation) as Record<
      string,
      unknown
    >;
    plusDocument.revision = 2;
    plusDocument.safetyRevision = 2;
    const plusBase = JSON.stringify(plusDocument);
    const plus = await bind(`${plusBase}${' '.repeat(65537 - bytes(plusBase))}`, 2);
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(() => now, [equal.pin, plus.pin]);
    const saved = await db.saveCandidate({ rawBundle: equal.rawBundle, expectedGeneration: 0 });
    const active = await db.activate(saved.control.generation);
    const before = await db.snapshot();
    let code = '';
    try {
      await db.saveCandidate({
        rawBundle: plus.rawBundle,
        expectedGeneration: active.control.generation,
      });
    } catch (error) {
      code = (error as Error).message;
    }
    const after = await db.snapshot();
    db.close();
    return {
      equalBytes: bytes(equal.rawBundle.documentsRaw.revocation),
      plusBytes: bytes(plus.rawBundle.documentsRaw.revocation),
      save: saved.control.generation,
      activate: active.control.generation,
      safetyBytes: bytes(before.safety.raw),
      code,
      unchanged: JSON.stringify(before) === JSON.stringify(after),
    };
  }, fixedNow);
  expect(value).toEqual({
    equalBytes: 65536,
    plusBytes: 65537,
    save: 1,
    activate: 2,
    safetyBytes: 65536,
    code: 'protected',
    unchanged: true,
  });
});

test('G3-021 P2 R5 reaches only the outer/raw revision relation and preserves the raw IDB record', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'R5 outer/raw revision browser-IDB proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const sha = async (raw: string) =>
      Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))),
        (byte) => byte.toString(16).padStart(2, '0'),
      ).join('');
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      {
        clock: () => now,
      },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
      revision: number;
      documents: Array<{
        documentClass: string;
        revision: number;
        bytes: number;
        sha256: string;
        recordCount: number;
      }>;
    };
    const documents = Object.fromEntries(
      Object.entries(loaded.rawBundle.documentsRaw).map(([kind, raw]) => [kind, JSON.parse(raw)]),
    ) as Record<string, Record<string, unknown>>;
    for (const document of Object.values(documents)) document.revision = 2;
    (documents.revocation as { safetyRevision: number }).safetyRevision = 2;
    const documentsRaw = {} as Record<string, string>;
    for (const descriptor of release.documents) {
      const document = documents[descriptor.documentClass]!;
      const raw = JSON.stringify(document);
      documentsRaw[descriptor.documentClass] = raw;
      descriptor.revision = 2;
      descriptor.bytes = new TextEncoder().encode(raw).byteLength;
      descriptor.sha256 = await sha(raw);
      descriptor.recordCount =
        descriptor.documentClass === 'manifest'
          ? (document.series as unknown[]).length +
            (document.episodes as unknown[]).length +
            (document.assets as unknown[]).length
          : descriptor.documentClass === 'admission'
            ? (document.sources as unknown[]).length + (document.identityLinks as unknown[]).length
            : descriptor.documentClass === 'rights'
              ? (document.rights as unknown[]).length
              : descriptor.documentClass === 'consent'
                ? (document.consents as unknown[]).length
                : descriptor.documentClass === 'lifecycle'
                  ? 1
                  : (document.entries as unknown[]).length;
    }
    release.revision = 2;
    const releaseRaw = JSON.stringify(release);
    const pin = {
      ...loader.mobileMediaBuildPin,
      revision: 2,
      transportSha256: await sha(releaseRaw),
    };
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(() => now, pin);
    const saved = await db.saveCandidate({
      rawBundle: { releaseRaw, documentsRaw },
      expectedGeneration: 0,
    });
    db.close();
    const before = await new Promise<string>((resolve, reject) => {
      const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
      request.onsuccess = () => {
        const tx = request.result.transaction(['mediaBundles'], 'readwrite');
        const store = tx.objectStore('mediaBundles');
        const get = store.get('candidate');
        get.onsuccess = () => {
          const record = get.result as { revision: number };
          record.revision = 1;
          store.put(record);
          tx.oncomplete = () => {
            request.result.close();
            resolve(JSON.stringify(record));
          };
        };
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
    const reopened = await mod.openMobileMediaCatalogStore(() => now, pin);
    let code = '';
    try {
      await reopened.snapshot();
    } catch (error) {
      code = (error as Error).message;
    }
    reopened.close();
    const after = await new Promise<string>((resolve, reject) => {
      const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
      request.onsuccess = () => {
        const get = request.result
          .transaction(['mediaBundles'], 'readonly')
          .objectStore('mediaBundles')
          .get('candidate');
        get.onsuccess = () => {
          request.result.close();
          resolve(JSON.stringify(get.result));
        };
        get.onerror = () => reject(get.error);
      };
      request.onerror = () => reject(request.error);
    });
    return { saved: saved.control.generation, code, unchanged: before === after };
  }, fixedNow);
  expect(value).toEqual({ saved: 1, code: 'protected', unchanged: true });
});

test('G3-021 P2 R4-R2-03 rejects a release recordcount plus one before real-IDB writes', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'real browser-IDB recordcount proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const sha = async (raw: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
      schema: string;
      contractVersion: string;
      revision: number;
      documents: Array<{ recordCount: number }>;
    };
    release.documents[0]!.recordCount += 1;
    const releaseRaw = JSON.stringify(release);
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(() => now, {
      schema: release.schema,
      contractVersion: release.contractVersion,
      path: '/wrn-mobile-media/v1/mobile-media-release.json',
      revision: release.revision,
      transportSha256: await sha(releaseRaw),
    });
    let code = '';
    try {
      await db.saveCandidate({
        rawBundle: { releaseRaw, documentsRaw: loaded.rawBundle.documentsRaw },
        expectedGeneration: 0,
      });
    } catch (error) {
      code = (error as Error).message;
    }
    const after = await db.snapshot();
    db.close();
    return { code, generation: after.control.generation, candidate: after.bundles.candidate };
  }, fixedNow);
  expect(value).toEqual({ code: 'invalid-candidate', generation: 0, candidate: null });
});

test('G3-021 P2 R4-R2-03 covers each document recordcount equal and plus one through saveCandidate', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'mobile-390x844',
    'parametric real browser-IDB recordcount proof',
  );
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha = async (raw: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const classes = [
      'manifest',
      'admission',
      'rights',
      'consent',
      'lifecycle',
      'revocation',
    ] as const;
    const outcomes: Record<string, { equal: number; code: string; lkg: number; raw: boolean }> = {};
    for (const documentClass of classes) {
      await remove();
      const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
        schema: string;
        contractVersion: string;
        revision: number;
        documents: Array<{ documentClass: typeof documentClass; recordCount: number }>;
      };
      const pin = async (raw: string) => ({
        schema: release.schema,
        contractVersion: release.contractVersion,
        path: '/wrn-mobile-media/v1/mobile-media-release.json',
        revision: release.revision,
        transportSha256: await sha(raw),
      });
      const equalRaw = JSON.stringify(release);
      const mod = await import('/src/mobile-media-catalog-store.ts');
      const db = await mod.openMobileMediaCatalogStore(() => now, await pin(equalRaw));
      const saved = await db.saveCandidate({
        rawBundle: { releaseRaw: equalRaw, documentsRaw: loaded.rawBundle.documentsRaw },
        expectedGeneration: 0,
      });
      const active = await db.activate(saved.control.generation);
      const descriptor = release.documents.find((item) => item.documentClass === documentClass);
      if (!descriptor) throw new Error(documentClass);
      descriptor.recordCount += 1;
      const plusRaw = JSON.stringify(release);
      let code = '';
      let invalid: Awaited<ReturnType<typeof mod.openMobileMediaCatalogStore>> | undefined;
      try {
        invalid = await mod.openMobileMediaCatalogStore(() => now, await pin(plusRaw));
        await invalid.saveCandidate({
          rawBundle: { releaseRaw: plusRaw, documentsRaw: loaded.rawBundle.documentsRaw },
          expectedGeneration: active.control.generation,
        });
      } catch (error) {
        code = (error as Error).message;
      }
      invalid?.close();
      const after = await db.snapshot();
      db.close();
      outcomes[documentClass] = {
        equal: active.control.generation,
        code,
        lkg: after.control.generation,
        raw: after.bundles.active?.rawBundle.releaseRaw === equalRaw,
      };
    }
    return outcomes;
  }, fixedNow);
  expect(value).toEqual(
    Object.fromEntries(
      ['manifest', 'admission', 'rights', 'consent', 'lifecycle', 'revocation'].map(
        (documentClass) => [
          documentClass,
          { equal: 2, code: 'invalid-candidate', lkg: 2, raw: true },
        ],
      ),
    ),
  );
});

test('G3-021 P2 R4-R2-03 saves the coupled canonical asset and geometry maximum', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'real browser-IDB coupled cap proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const sha = async (raw: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const documents = Object.fromEntries(
      Object.entries(loaded.rawBundle.documentsRaw).map(([kind, raw]) => [kind, JSON.parse(raw)]),
    ) as Record<string, Record<string, unknown>>;
    const assets = documents.manifest.assets as Array<Record<string, unknown>>;
    const audio = assets.find((asset) => asset.kind === 'audio')!;
    const thumbnail = assets.find((asset) => asset.kind === 'thumbnail')!;
    const transcript = assets.find((asset) => asset.kind === 'transcript')!;
    audio.bytes = 262144;
    thumbnail.bytes = 131072;
    thumbnail.width = 2048;
    thumbnail.height = 2048;
    transcript.bytes = 32768;
    const documentsRaw = Object.fromEntries(
      Object.entries(documents).map(([kind, document]) => [kind, JSON.stringify(document)]),
    ) as Record<string, string>;
    const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
      schema: string;
      contractVersion: string;
      revision: number;
      documents: Array<{ documentClass: string; bytes: number; sha256: string }>;
    };
    for (const descriptor of release.documents) {
      descriptor.bytes = new TextEncoder().encode(
        documentsRaw[descriptor.documentClass]!,
      ).byteLength;
      descriptor.sha256 = await sha(documentsRaw[descriptor.documentClass]!);
    }
    const releaseRaw = JSON.stringify(release);
    const pin = {
      schema: release.schema,
      contractVersion: release.contractVersion,
      path: '/wrn-mobile-media/v1/mobile-media-release.json',
      revision: release.revision,
      transportSha256: await sha(releaseRaw),
    };
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(() => now, pin);
    const saved = await db.saveCandidate({
      rawBundle: { releaseRaw, documentsRaw },
      expectedGeneration: 0,
    });
    const active = await db.activate(saved.control.generation);
    const after = await db.snapshot();
    db.close();
    return {
      generation: active.control.generation,
      audio: audio.bytes,
      thumbnail: thumbnail.bytes,
      transcript: transcript.bytes,
      aggregate: Number(audio.bytes) + Number(thumbnail.bytes) + Number(transcript.bytes),
      pixels: Number(thumbnail.width) * Number(thumbnail.height),
      raw: after.bundles.active?.rawBundle.releaseRaw === releaseRaw,
    };
  }, fixedNow);
  expect(value).toEqual({
    generation: 2,
    audio: 262144,
    thumbnail: 131072,
    transcript: 32768,
    aggregate: 425984,
    pixels: 4194304,
    raw: true,
  });
});

test('G3-021 P2 R4-R2-04 blocks a source candidate without changing the pre-activate LKG', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'real browser-IDB source blocked proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha = async (raw: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    await remove();
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const build = async (
      kind: 'source' | 'series' | 'episode' | 'asset',
      status: 'blocked' | 'gone' | 'replaced',
      assetHash?: string | null | 'missing',
    ) => {
      const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
        revision: number;
        documents: Array<{
          documentClass: string;
          revision: number;
          bytes: number;
          sha256: string;
          recordCount: number;
        }>;
      };
      const documents = Object.fromEntries(
        Object.entries(loaded.rawBundle.documentsRaw).map(([kind, raw]) => [kind, JSON.parse(raw)]),
      ) as Record<string, Record<string, unknown>>;
      for (const document of Object.values(documents)) document.revision = 2;
      const revocation = documents.revocation as {
        safetyRevision: number;
        references: Array<{ kind: string; id: string }>;
        entries: Array<Record<string, unknown>>;
      };
      revocation.safetyRevision = 2;
      const targetId =
        kind === 'source'
          ? 'wrn-media-source-local'
          : kind === 'series'
            ? 'wrn-media-series-local'
            : kind === 'episode'
              ? 'wrn-media-episode-local'
              : 'wrn-media-asset-audio-local';
      const replacementId =
        kind === 'source'
          ? 'wrn-media-source-history-2'
          : kind === 'series'
            ? 'wrn-media-series-history-2'
            : kind === 'episode'
              ? 'wrn-media-episode-history-2'
              : 'wrn-media-asset-history-2';
      if (status === 'replaced') revocation.references.push({ kind, id: replacementId });
      const entry: Record<string, unknown> = {
        targetKind: kind,
        targetId,
        targetHash:
          kind === 'asset'
            ? assetHash === undefined || assetHash === 'missing'
              ? 'c726d333dd159a31423f3480dbb1c5c4a9dfcd30efe1f7e12ade390dc92e8908'
              : assetHash
            : null,
        status,
        replacementKind: status === 'replaced' ? kind : null,
        replacementId: status === 'replaced' ? replacementId : null,
      };
      if (assetHash === 'missing') delete entry.targetHash;
      revocation.entries.push(entry);
      revocation.references.sort((a, b) =>
        `${a.kind}\0${a.id}`.localeCompare(`${b.kind}\0${b.id}`),
      );
      revocation.entries.sort((a, b) =>
        `${a.targetKind}\0${a.targetId}\0${a.targetHash}`.localeCompare(
          `${b.targetKind}\0${b.targetId}\0${b.targetHash}`,
        ),
      );
      const documentsRaw = {} as Record<string, string>;
      for (const descriptor of release.documents) {
        const raw = JSON.stringify(documents[descriptor.documentClass]);
        documentsRaw[descriptor.documentClass] = raw;
        descriptor.revision = 2;
        descriptor.bytes = new TextEncoder().encode(raw).byteLength;
        descriptor.sha256 = await sha(raw);
        const document = documents[descriptor.documentClass]!;
        descriptor.recordCount =
          descriptor.documentClass === 'manifest'
            ? (document.series as unknown[]).length +
              (document.episodes as unknown[]).length +
              (document.assets as unknown[]).length
            : descriptor.documentClass === 'admission'
              ? (document.sources as unknown[]).length +
                (document.identityLinks as unknown[]).length
              : descriptor.documentClass === 'rights'
                ? (document.rights as unknown[]).length
                : descriptor.documentClass === 'consent'
                  ? (document.consents as unknown[]).length
                  : descriptor.documentClass === 'lifecycle'
                    ? 1
                    : (document.entries as unknown[]).length;
      }
      release.revision = 2;
      const releaseRaw = JSON.stringify(release);
      return {
        rawBundle: { releaseRaw, documentsRaw },
        pin: { ...loader.mobileMediaBuildPin, revision: 2, transportSha256: await sha(releaseRaw) },
      };
    };
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const outcomes: Record<string, unknown> = {};
    for (const kind of ['source', 'series', 'episode', 'asset'] as const)
      for (const status of ['blocked', 'gone', 'replaced'] as const) {
        await remove();
        const blocked = await build(kind, status);
        const db = await mod.openMobileMediaCatalogStore(
          () => now,
          [loader.mobileMediaBuildPin, blocked.pin],
        );
        const saved = await db.saveCandidate({
          rawBundle: loaded.rawBundle,
          expectedGeneration: 0,
        });
        const active = await db.activate(saved.control.generation);
        const candidate = await db.saveCandidate({
          rawBundle: blocked.rawBundle,
          expectedGeneration: active.control.generation,
        });
        const before = await db.snapshot();
        let code = '';
        try {
          await db.activate(candidate.control.generation);
        } catch (error) {
          code = (error as Error).message;
        }
        const after = await db.snapshot();
        db.close();
        outcomes[`${kind}/${status}`] = {
          code,
          same: JSON.stringify(before) === JSON.stringify(after),
          active: after.bundles.active?.revision,
          candidate: after.bundles.candidate?.revision,
          safety: after.safety.revision,
        };
      }
    await remove();
    const different = await build('asset', 'blocked', 'd'.repeat(64));
    const positive = await mod.openMobileMediaCatalogStore(
      () => now,
      [loader.mobileMediaBuildPin, different.pin],
    );
    const first = await positive.saveCandidate({
      rawBundle: loaded.rawBundle,
      expectedGeneration: 0,
    });
    const firstActive = await positive.activate(first.control.generation);
    const next = await positive.saveCandidate({
      rawBundle: different.rawBundle,
      expectedGeneration: firstActive.control.generation,
    });
    const activated = await positive.activate(next.control.generation);
    const positiveAfter = await positive.snapshot();
    positive.close();
    outcomes['asset/different-hash'] = {
      generation: activated.control.generation,
      active: positiveAfter.bundles.active?.revision,
      previous: positiveAfter.bundles.previous?.revision,
      candidate: positiveAfter.bundles.candidate,
      safety: positiveAfter.safety.revision,
    };
    for (const assetHash of ['missing', null] as const) {
      await remove();
      const invalidBundle = await build('asset', 'blocked', assetHash);
      const invalid = await mod.openMobileMediaCatalogStore(
        () => now,
        [loader.mobileMediaBuildPin, invalidBundle.pin],
      );
      const beforeInvalid = await invalid.snapshot();
      let code = '';
      try {
        await invalid.saveCandidate({ rawBundle: invalidBundle.rawBundle, expectedGeneration: 0 });
      } catch (error) {
        code = (error as Error).message;
      }
      const afterInvalid = await invalid.snapshot();
      invalid.close();
      outcomes[`asset/${assetHash === null ? 'null-hash' : 'missing-hash'}`] = {
        code,
        same: JSON.stringify(beforeInvalid) === JSON.stringify(afterInvalid),
      };
    }
    return outcomes;
  }, fixedNow);
  expect(value).toEqual(
    Object.fromEntries([
      ...['source', 'series', 'episode', 'asset'].flatMap((kind) =>
        ['blocked', 'gone', 'replaced'].map((status) => [
          `${kind}/${status}`,
          { code: 'protected', same: true, active: 1, candidate: 2, safety: 1 },
        ]),
      ),
      [
        'asset/different-hash',
        { generation: 4, active: 2, previous: 1, candidate: null, safety: 2 },
      ],
      ['asset/missing-hash', { code: 'invalid-candidate', same: true }],
      ['asset/null-hash', { code: 'invalid-candidate', same: true }],
    ]),
  );
});

test('G3-021 P2 R4-R2-04 blocks a real Previous rollback after a transcript removal', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'real browser-IDB Previous rollback proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha = async (raw: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    await remove();
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
      revision: number;
      documents: Array<{
        documentClass: string;
        revision: number;
        bytes: number;
        sha256: string;
        recordCount: number;
      }>;
    };
    const documents = Object.fromEntries(
      Object.entries(loaded.rawBundle.documentsRaw).map(([kind, raw]) => [kind, JSON.parse(raw)]),
    ) as Record<string, Record<string, unknown>>;
    const manifest = documents.manifest as {
      assets: Array<{ id: string; kind: string; sha256: string }>;
      episodes: Array<{ transcriptAssetId: string | null }>;
    };
    const transcript = manifest.assets.find((asset) => asset.kind === 'transcript');
    if (!transcript) throw new Error('missing-transcript');
    manifest.assets = manifest.assets.filter((asset) => asset.id !== transcript.id);
    for (const episode of manifest.episodes) episode.transcriptAssetId = null;
    const rights = documents.rights as { rights: Array<{ assetId: string }> };
    rights.rights = rights.rights.filter((right) => right.assetId !== transcript.id);
    const revocation = documents.revocation as {
      safetyRevision: number;
      references: Array<{ kind: string; id: string }>;
      entries: Array<Record<string, unknown>>;
    };
    revocation.safetyRevision = 2;
    revocation.entries.push({
      targetKind: 'asset',
      targetId: transcript.id,
      targetHash: transcript.sha256,
      status: 'blocked',
      replacementKind: null,
      replacementId: null,
    });
    revocation.references.sort((left, right) =>
      `${left.kind}\0${left.id}`.localeCompare(`${right.kind}\0${right.id}`),
    );
    revocation.entries.sort((left, right) =>
      `${left.targetKind}\0${left.targetId}\0${left.targetHash}`.localeCompare(
        `${right.targetKind}\0${right.targetId}\0${right.targetHash}`,
      ),
    );
    for (const document of Object.values(documents)) document.revision = 2;
    const documentsRaw = {} as Record<string, string>;
    for (const descriptor of release.documents) {
      const raw = JSON.stringify(documents[descriptor.documentClass]);
      const document = documents[descriptor.documentClass]!;
      documentsRaw[descriptor.documentClass] = raw;
      descriptor.revision = 2;
      descriptor.bytes = new TextEncoder().encode(raw).byteLength;
      descriptor.sha256 = await sha(raw);
      descriptor.recordCount =
        descriptor.documentClass === 'manifest'
          ? (document.series as unknown[]).length +
            (document.episodes as unknown[]).length +
            (document.assets as unknown[]).length
          : descriptor.documentClass === 'admission'
            ? (document.sources as unknown[]).length + (document.identityLinks as unknown[]).length
            : descriptor.documentClass === 'rights'
              ? (document.rights as unknown[]).length
              : descriptor.documentClass === 'consent'
                ? (document.consents as unknown[]).length
                : descriptor.documentClass === 'lifecycle'
                  ? 1
                  : (document.entries as unknown[]).length;
    }
    release.revision = 2;
    const releaseRaw = JSON.stringify(release);
    const rev2 = {
      rawBundle: { releaseRaw, documentsRaw },
      pin: {
        ...loader.mobileMediaBuildPin,
        revision: 2,
        transportSha256: await sha(releaseRaw),
      },
    };
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(
      () => now,
      [loader.mobileMediaBuildPin, rev2.pin],
    );
    const first = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
    const active1 = await db.activate(first.control.generation);
    const second = await db.saveCandidate({
      rawBundle: rev2.rawBundle,
      expectedGeneration: active1.control.generation,
    });
    await db.activate(second.control.generation);
    const beforeRollback = await db.snapshot();
    let rollback = '';
    try {
      await db.rollback(beforeRollback.control.generation);
    } catch (error) {
      rollback = (error as Error).message;
    }
    const afterRollback = await db.snapshot();
    db.close();
    const activeDocuments = Object.fromEntries(
      Object.entries(beforeRollback.bundles.active!.rawBundle.documentsRaw).map(([kind, raw]) => [
        kind,
        JSON.parse(raw),
      ]),
    ) as Record<string, Record<string, unknown>>;
    const activeManifest = activeDocuments.manifest as {
      series: Array<{ id: string }>;
      assets: Array<{ id: string }>;
      episodes: Array<{ id: string; transcriptAssetId: string | null }>;
    };
    const activeRights = activeDocuments.rights as { rights: Array<{ assetId: string }> };
    const activeRevocation = activeDocuments.revocation as {
      references: Array<{ kind: string; id: string }>;
      entries: Array<Record<string, unknown>>;
    };
    const expectedReferences = [
      ...(activeDocuments.admission as { sources: Array<{ id: string }> }).sources.map((source) => [
        'source',
        source.id,
      ]),
      ...activeManifest.series.map((series) => ['series', series.id]),
      ...activeManifest.episodes.map((episode) => ['episode', episode.id]),
      ...activeManifest.assets.map((asset) => ['asset', asset.id]),
      ['asset', transcript.id],
    ]
      .map(([kind, id]) => `${kind}\0${id}`)
      .sort();
    return {
      rollback,
      same: JSON.stringify(beforeRollback) === JSON.stringify(afterRollback),
      generation: afterRollback.control.generation,
      active: afterRollback.bundles.active?.revision,
      previous: afterRollback.bundles.previous?.revision,
      candidate: afterRollback.bundles.candidate,
      safety: afterRollback.safety.revision,
      transcriptRemoved:
        !activeManifest.assets.some((asset) => asset.id === transcript.id) &&
        activeManifest.episodes.every((episode) => episode.transcriptAssetId === null) &&
        !activeRights.rights.some((right) => right.assetId === transcript.id),
      entry: activeRevocation.entries,
      referencesExact:
        JSON.stringify(
          activeRevocation.references.map((reference) => `${reference.kind}\0${reference.id}`),
        ) === JSON.stringify(expectedReferences),
      transcript: { id: transcript.id, sha256: transcript.sha256 },
    };
  }, fixedNow);
  expect(value).toEqual({
    rollback: 'protected',
    same: true,
    generation: 4,
    active: 2,
    previous: 1,
    candidate: null,
    safety: 2,
    transcriptRemoved: true,
    entry: [
      {
        targetKind: 'asset',
        targetId: 'wrn-media-asset-transcript-local',
        targetHash: 'ab5596429ec71dd956a264ad8beb93d42ed9e41bd480ff52b9f4c059454d6041',
        status: 'blocked',
        replacementKind: null,
        replacementId: null,
      },
    ],
    referencesExact: true,
    transcript: {
      id: 'wrn-media-asset-transcript-local',
      sha256: 'ab5596429ec71dd956a264ad8beb93d42ed9e41bd480ff52b9f4c059454d6041',
    },
  });
});

test('G3-021 P2 R4-R2-04 activates higher additive current episode and asset IDs', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'real browser-IDB higher additive proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha = async (raw: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    await remove();
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
      revision: number;
      documents: Array<{
        documentClass: string;
        revision: number;
        bytes: number;
        sha256: string;
        recordCount: number;
      }>;
    };
    const documents = Object.fromEntries(
      Object.entries(loaded.rawBundle.documentsRaw).map(([kind, raw]) => [kind, JSON.parse(raw)]),
    ) as Record<string, Record<string, unknown>>;
    const manifest = documents.manifest as {
      series: Array<{ id: string; episodeIds: string[] }>;
      episodes: Array<Record<string, unknown>>;
      assets: Array<Record<string, unknown>>;
    };
    const baseEpisode = manifest.episodes[0]!;
    const baseAudio = manifest.assets.find((asset) => asset.kind === 'audio');
    if (!baseAudio) throw new Error('missing-audio');
    const episodeId = 'wrn-media-episode-history-2';
    const assetId = 'wrn-media-asset-history-2';
    manifest.episodes.push({
      ...baseEpisode,
      id: episodeId,
      audioAssetId: assetId,
      thumbnailAssetId: null,
      transcriptAssetId: null,
    });
    manifest.assets.push({ ...baseAudio, id: assetId });
    manifest.series[0]!.episodeIds.push(episodeId);
    manifest.episodes.sort((left, right) => String(left.id).localeCompare(String(right.id)));
    manifest.assets.sort((left, right) => String(left.id).localeCompare(String(right.id)));
    manifest.series[0]!.episodeIds.sort();
    const rights = documents.rights as { rights: Array<Record<string, unknown>> };
    const baseRight = rights.rights.find((right) => right.assetId === baseAudio.id);
    if (!baseRight) throw new Error('missing-right');
    rights.rights.push({ ...baseRight, assetId });
    rights.rights.sort((left, right) => String(left.assetId).localeCompare(String(right.assetId)));
    const consent = documents.consent as { consents: Array<Record<string, unknown>> };
    consent.consents.push({ ...consent.consents[0], episodeId });
    consent.consents.sort((left, right) =>
      String(left.episodeId).localeCompare(String(right.episodeId)),
    );
    const revocation = documents.revocation as {
      safetyRevision: number;
      references: Array<{ kind: string; id: string }>;
      entries: Array<Record<string, unknown>>;
    };
    revocation.safetyRevision = 2;
    revocation.references.push({ kind: 'episode', id: episodeId }, { kind: 'asset', id: assetId });
    revocation.references.sort((left, right) =>
      `${left.kind}\0${left.id}`.localeCompare(`${right.kind}\0${right.id}`),
    );
    for (const document of Object.values(documents)) document.revision = 2;
    const documentsRaw = {} as Record<string, string>;
    for (const descriptor of release.documents) {
      const raw = JSON.stringify(documents[descriptor.documentClass]);
      const document = documents[descriptor.documentClass]!;
      documentsRaw[descriptor.documentClass] = raw;
      descriptor.revision = 2;
      descriptor.bytes = new TextEncoder().encode(raw).byteLength;
      descriptor.sha256 = await sha(raw);
      descriptor.recordCount =
        descriptor.documentClass === 'manifest'
          ? (document.series as unknown[]).length +
            (document.episodes as unknown[]).length +
            (document.assets as unknown[]).length
          : descriptor.documentClass === 'admission'
            ? (document.sources as unknown[]).length + (document.identityLinks as unknown[]).length
            : descriptor.documentClass === 'rights'
              ? (document.rights as unknown[]).length
              : descriptor.documentClass === 'consent'
                ? (document.consents as unknown[]).length
                : descriptor.documentClass === 'lifecycle'
                  ? 1
                  : (document.entries as unknown[]).length;
    }
    release.revision = 2;
    const releaseRaw = JSON.stringify(release);
    const rev2 = {
      rawBundle: { releaseRaw, documentsRaw },
      pin: {
        ...loader.mobileMediaBuildPin,
        revision: 2,
        transportSha256: await sha(releaseRaw),
      },
    };
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(
      () => now,
      [loader.mobileMediaBuildPin, rev2.pin],
    );
    const first = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
    const active1 = await db.activate(first.control.generation);
    const second = await db.saveCandidate({
      rawBundle: rev2.rawBundle,
      expectedGeneration: active1.control.generation,
    });
    const active2 = await db.activate(second.control.generation);
    const after = await db.snapshot();
    db.close();
    const activeDocuments = Object.fromEntries(
      Object.entries(after.bundles.active!.rawBundle.documentsRaw).map(([kind, raw]) => [
        kind,
        JSON.parse(raw),
      ]),
    ) as Record<string, Record<string, unknown>>;
    const activeManifest = activeDocuments.manifest as {
      episodes: Array<{ id: string; audioAssetId: string }>;
      assets: Array<{ id: string }>;
    };
    const activeRevocation = activeDocuments.revocation as {
      entries: unknown[];
      references: Array<{ kind: string; id: string }>;
    };
    return {
      generation: active2.control.generation,
      active: after.bundles.active?.revision,
      previous: after.bundles.previous?.revision,
      candidate: after.bundles.candidate,
      safety: after.safety.revision,
      entries: activeRevocation.entries.length,
      newCurrentIds:
        activeManifest.episodes.some(
          (episode) => episode.id === episodeId && episode.audioAssetId === assetId,
        ) && activeManifest.assets.some((asset) => asset.id === assetId),
      exactNewReferences:
        activeRevocation.references.filter(
          (reference) => reference.id === episodeId || reference.id === assetId,
        ).length === 2 &&
        activeRevocation.references.some(
          (reference) => reference.kind === 'episode' && reference.id === episodeId,
        ) &&
        activeRevocation.references.some(
          (reference) => reference.kind === 'asset' && reference.id === assetId,
        ),
    };
  }, fixedNow);
  expect(value).toEqual({
    generation: 4,
    active: 2,
    previous: 1,
    candidate: null,
    safety: 2,
    entries: 0,
    newCurrentIds: true,
    exactNewReferences: true,
  });
});

test('G3-021 P2 R3 matrix 8 preserves real IDB bytes for version, pin and deep raw corruption', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'versioned deep-record real browser-IDB proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha = async (raw: string) => {
      const value = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(value), (item) => item.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const mutate = async (
      kind: 'extra-key' | 'transport' | 'outer-revision' | 'unbound-root' | 'descriptor-raw',
    ) => {
      await remove();
      const loader = await import('/src/mobile-media-release.ts');
      const loaded = await loader.loadMobileMediaRelease(
        new AbortController().signal,
        undefined,
        undefined,
        { clock: () => now },
      );
      if (loaded.kind !== 'ready') throw new Error(loaded.kind);
      const mod = await import('/src/mobile-media-catalog-store.ts');
      const db = await mod.openMobileMediaCatalogStore(() => now);
      const saved = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
      db.close();
      const before = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const transaction = request.result.transaction(['mediaBundles'], 'readwrite');
          const store = transaction.objectStore('mediaBundles');
          const get = store.get('candidate');
          get.onsuccess = async () => {
            const record = get.result as Record<string, unknown>;
            if (kind === 'extra-key') record.unexpected = true;
            if (kind === 'transport') record.transportSha256 = '0'.repeat(64);
            if (kind === 'outer-revision') record.revision = 2;
            if (kind === 'unbound-root') {
              const rawBundle = record.rawBundle as { releaseRaw: string };
              rawBundle.releaseRaw = rawBundle.releaseRaw.replace('"revision":1', '"revision":2');
              record.transportSha256 = await sha(rawBundle.releaseRaw);
              record.revision = 2;
            }
            if (kind === 'descriptor-raw') {
              const rawBundle = record.rawBundle as { documentsRaw: Record<string, string> };
              rawBundle.documentsRaw.manifest = `${rawBundle.documentsRaw.manifest} `;
            }
            store.put(record);
            transaction.oncomplete = () => {
              request.result.close();
              resolve(JSON.stringify(record));
            };
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
      const reopened = await mod.openMobileMediaCatalogStore(() => now);
      let code = '';
      try {
        await reopened.snapshot();
      } catch (error) {
        code = (error as Error).message;
      }
      reopened.close();
      const after = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const transaction = request.result.transaction(['mediaBundles'], 'readonly');
          const get = transaction.objectStore('mediaBundles').get('candidate');
          get.onsuccess = () => {
            request.result.close();
            resolve(JSON.stringify(get.result));
          };
          get.onerror = () => reject(get.error);
        };
        request.onerror = () => reject(request.error);
      });
      return { code, unchanged: before === after, saved: saved.control.generation };
    };
    const results: Array<readonly [string, Awaited<ReturnType<typeof mutate>>]> = [];
    for (const kind of [
      'extra-key',
      'transport',
      'outer-revision',
      'unbound-root',
      'descriptor-raw',
    ] as const)
      results.push([kind, await mutate(kind)]);
    return Object.fromEntries(results);
  }, fixedNow);
  expect(value).toEqual({
    'extra-key': { code: 'protected', unchanged: true, saved: 1 },
    transport: { code: 'protected', unchanged: true, saved: 1 },
    'outer-revision': { code: 'protected', unchanged: true, saved: 1 },
    'unbound-root': { code: 'protected', unchanged: true, saved: 1 },
    'descriptor-raw': { code: 'protected', unchanged: true, saved: 1 },
  });
});

test('G3-021 P2 R4-R2-05 A protects future and malformed Bundle Control Safety records without repair', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'R4-R2-05 A real browser-IDB record matrix');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const prepare = async (target: 'bundle' | 'control' | 'safety') => {
      await remove();
      const loader = await import('/src/mobile-media-release.ts');
      const loaded = await loader.loadMobileMediaRelease(
        new AbortController().signal,
        undefined,
        undefined,
        { clock: () => now },
      );
      if (loaded.kind !== 'ready') throw new Error(loaded.kind);
      const mod = await import('/src/mobile-media-catalog-store.ts');
      const db = await mod.openMobileMediaCatalogStore(() => now);
      const saved = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
      if (target !== 'bundle') await db.activate(saved.control.generation);
      db.close();
      return mod;
    };
    const run = async (
      target: 'bundle' | 'control' | 'safety',
      mode:
        'future-version' | 'extra-key' | 'missing-key' | 'wrong-type' | 'negative' | 'deep-unbound',
    ) => {
      const mod = await prepare(target);
      const storeName =
        target === 'bundle'
          ? 'mediaBundles'
          : target === 'control'
            ? 'mediaControl'
            : 'mediaSafety';
      const key = target === 'bundle' ? 'candidate' : target;
      const before = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const transaction = request.result.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const get = store.get(key);
          get.onsuccess = () => {
            const record = get.result as Record<string, unknown>;
            if (mode === 'future-version') record.recordVersion = 2;
            if (mode === 'extra-key') record.unexpected = true;
            if (mode === 'missing-key')
              if (target === 'bundle') delete record.transportSha256;
              else if (target === 'control') delete record.previous;
              else delete record.entries;
            if (mode === 'wrong-type')
              if (target === 'bundle') record.revision = '1';
              else if (target === 'control') record.generation = '2';
              else record.revision = '1';
            if (mode === 'negative')
              if (target === 'bundle') record.revision = -1;
              else if (target === 'control') record.generation = -1;
              else record.revision = -1;
            if (mode === 'deep-unbound') {
              if (target === 'bundle') {
                const rawBundle = record.rawBundle as { releaseRaw: string };
                rawBundle.releaseRaw = `${rawBundle.releaseRaw} `;
              } else if (target === 'control') record.active = 'candidate';
              else record.references = [];
            }
            store.put(record);
            transaction.oncomplete = () => {
              request.result.close();
              resolve(JSON.stringify(record));
            };
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
      const db = await mod.openMobileMediaCatalogStore(() => now);
      let code = '';
      try {
        await db.snapshot();
      } catch (error) {
        code = (error as Error).message;
      }
      db.close();
      const after = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const transaction = request.result.transaction([storeName], 'readonly');
          const get = transaction.objectStore(storeName).get(key);
          get.onsuccess = () => {
            request.result.close();
            resolve(JSON.stringify(get.result));
          };
          get.onerror = () => reject(get.error);
        };
        request.onerror = () => reject(request.error);
      });
      return { code, unchanged: before === after };
    };
    const results: Array<readonly [string, Awaited<ReturnType<typeof run>>]> = [];
    for (const target of ['bundle', 'control', 'safety'] as const)
      for (const mode of [
        'future-version',
        'extra-key',
        'missing-key',
        'wrong-type',
        'negative',
        'deep-unbound',
      ] as const)
        results.push([`${target}/${mode}`, await run(target, mode)]);
    return Object.fromEntries(results);
  }, fixedNow);
  expect(value).toEqual(
    Object.fromEntries(
      ['bundle', 'control', 'safety'].flatMap((target) =>
        [
          'future-version',
          'extra-key',
          'missing-key',
          'wrong-type',
          'negative',
          'deep-unbound',
        ].map((mode) => [`${target}/${mode}`, { code: 'protected', unchanged: true }]),
      ),
    ),
  );
});

test('G3-021 P2 R4-R2-05 B protects every hash-correct descriptor document mismatch', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'mobile-390x844',
    'R4-R2-05 B real browser-IDB descriptor matrix',
  );
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha = async (raw: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const run = async (
      documentClass: 'manifest' | 'admission' | 'rights' | 'consent' | 'lifecycle' | 'revocation',
      mismatch: 'bytes' | 'hash' | 'schema' | 'revision',
    ) => {
      await remove();
      const loader = await import('/src/mobile-media-release.ts');
      const loaded = await loader.loadMobileMediaRelease(
        new AbortController().signal,
        undefined,
        undefined,
        { clock: () => now },
      );
      if (loaded.kind !== 'ready') throw new Error(loaded.kind);
      const mod = await import('/src/mobile-media-catalog-store.ts');
      const db = await mod.openMobileMediaCatalogStore(() => now);
      const saved = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
      db.close();
      const mutation = await new Promise<{
        before: string;
        pin: typeof loader.mobileMediaBuildPin;
      }>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const transaction = request.result.transaction(['mediaBundles'], 'readwrite');
          const store = transaction.objectStore('mediaBundles');
          const get = store.get('candidate');
          get.onsuccess = async () => {
            const record = get.result as {
              rawBundle: { releaseRaw: string; documentsRaw: Record<string, string> };
              transportSha256: string;
            };
            const release = JSON.parse(record.rawBundle.releaseRaw) as {
              documents: Array<{
                documentClass: string;
                bytes: number;
                sha256: string;
                revision: number;
              }>;
            };
            const descriptor = release.documents.find(
              (item) => item.documentClass === documentClass,
            );
            if (!descriptor) throw new Error(documentClass);
            if (mismatch === 'bytes') descriptor.bytes += 1;
            if (mismatch === 'hash') descriptor.sha256 = '0'.repeat(64);
            if (mismatch === 'schema' || mismatch === 'revision') {
              const document = JSON.parse(record.rawBundle.documentsRaw[documentClass]!) as Record<
                string,
                unknown
              >;
              if (mismatch === 'schema') document.schema = `${document.schema}-future`;
              else document.revision = 2;
              const raw = JSON.stringify(document);
              record.rawBundle.documentsRaw[documentClass] = raw;
              descriptor.bytes = new TextEncoder().encode(raw).byteLength;
              descriptor.sha256 = await sha(raw);
            }
            const releaseRaw = JSON.stringify(release);
            const transportSha256 = await sha(releaseRaw);
            record.rawBundle.releaseRaw = releaseRaw;
            record.transportSha256 = transportSha256;
            store.put(record);
            transaction.oncomplete = () => {
              request.result.close();
              resolve({
                before: JSON.stringify(record),
                pin: { ...loader.mobileMediaBuildPin, transportSha256 },
              });
            };
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
      const reopened = await mod.openMobileMediaCatalogStore(() => now, mutation.pin);
      let code = '';
      try {
        await reopened.snapshot();
      } catch (error) {
        code = (error as Error).message;
      }
      reopened.close();
      const after = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const transaction = request.result.transaction(['mediaBundles'], 'readonly');
          const get = transaction.objectStore('mediaBundles').get('candidate');
          get.onsuccess = () => {
            request.result.close();
            resolve(JSON.stringify(get.result));
          };
          get.onerror = () => reject(get.error);
        };
        request.onerror = () => reject(request.error);
      });
      return { code, unchanged: mutation.before === after, saved: saved.control.generation };
    };
    const results: Array<readonly [string, Awaited<ReturnType<typeof run>>]> = [];
    for (const documentClass of [
      'manifest',
      'admission',
      'rights',
      'consent',
      'lifecycle',
      'revocation',
    ] as const)
      for (const mismatch of ['bytes', 'hash', 'schema', 'revision'] as const)
        results.push([`${documentClass}/${mismatch}`, await run(documentClass, mismatch)]);
    return Object.fromEntries(results);
  }, fixedNow);
  expect(value).toEqual(
    Object.fromEntries(
      ['manifest', 'admission', 'rights', 'consent', 'lifecycle', 'revocation'].flatMap(
        (documentClass) =>
          ['bytes', 'hash', 'schema', 'revision'].map((mismatch) => [
            `${documentClass}/${mismatch}`,
            { code: 'protected', unchanged: true, saved: 1 },
          ]),
      ),
    ),
  );
});

test('G3-021 P2 R4-R2-05 C separately protects transport revision and full-rootpin failures', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'R4-R2-05 C real browser-IDB pin matrix');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha = async (raw: string) =>
      Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))),
        (byte) => byte.toString(16).padStart(2, '0'),
      ).join('');
    const run = async (
      mode: 'transport' | 'outer-revision' | 'raw-revision' | 'incomplete-pin' | 'unknown-pin',
    ) => {
      await remove();
      const loader = await import('/src/mobile-media-release.ts');
      const loaded = await loader.loadMobileMediaRelease(
        new AbortController().signal,
        undefined,
        undefined,
        { clock: () => now },
      );
      if (loaded.kind !== 'ready') throw new Error(loaded.kind);
      const mod = await import('/src/mobile-media-catalog-store.ts');
      const db = await mod.openMobileMediaCatalogStore(() => now);
      const saved = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
      db.close();
      let pin: unknown = loader.mobileMediaBuildPin;
      const before = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const transaction = request.result.transaction(['mediaBundles'], 'readwrite');
          const store = transaction.objectStore('mediaBundles');
          const get = store.get('candidate');
          get.onsuccess = async () => {
            const record = get.result as {
              revision: number;
              transportSha256: string;
              rawBundle: { releaseRaw: string };
            };
            if (mode === 'transport') record.transportSha256 = '0'.repeat(64);
            if (mode === 'outer-revision') record.revision = 2;
            if (mode === 'raw-revision') {
              record.rawBundle.releaseRaw = record.rawBundle.releaseRaw.replace(
                '"revision":1',
                '"revision":2',
              );
              record.transportSha256 = await sha(record.rawBundle.releaseRaw);
              pin = {
                ...loader.mobileMediaBuildPin,
                revision: 2,
                transportSha256: record.transportSha256,
              };
            }
            store.put(record);
            transaction.oncomplete = () => {
              request.result.close();
              resolve(JSON.stringify(record));
            };
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
      if (mode === 'incomplete-pin') {
        const incomplete = { ...loader.mobileMediaBuildPin };
        delete (incomplete as { path?: string }).path;
        pin = incomplete;
      }
      if (mode === 'unknown-pin')
        pin = { ...loader.mobileMediaBuildPin, transportSha256: 'd'.repeat(64) };
      const reopened = await mod.openMobileMediaCatalogStore(() => now, pin as never);
      let code = '';
      try {
        await reopened.snapshot();
      } catch (error) {
        code = (error as Error).message;
      }
      reopened.close();
      const after = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const get = request.result
            .transaction(['mediaBundles'], 'readonly')
            .objectStore('mediaBundles')
            .get('candidate');
          get.onsuccess = () => {
            request.result.close();
            resolve(JSON.stringify(get.result));
          };
          get.onerror = () => reject(get.error);
        };
        request.onerror = () => reject(request.error);
      });
      return { code, unchanged: before === after, saved: saved.control.generation };
    };
    const results: Array<readonly [string, Awaited<ReturnType<typeof run>>]> = [];
    for (const mode of [
      'transport',
      'outer-revision',
      'raw-revision',
      'incomplete-pin',
      'unknown-pin',
    ] as const)
      results.push([mode, await run(mode)]);
    return Object.fromEntries(results);
  }, fixedNow);
  expect(value).toEqual(
    Object.fromEntries(
      ['transport', 'outer-revision', 'raw-revision', 'incomplete-pin', 'unknown-pin'].map(
        (mode) => [mode, { code: 'protected', unchanged: true, saved: 1 }],
      ),
    ),
  );
});

test('G3-021 P2 aborts quota, transaction-abort and readback faults with null real-IDB writes', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'real browser-IDB failure injection');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const run = async (mode: 'quota' | 'abort' | 'readback') => {
      await remove();
      const original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
        if (
          this.name === 'mediaBundles' &&
          typeof value === 'object' &&
          value !== null &&
          (value as { slot?: unknown }).slot === 'candidate'
        ) {
          if (mode === 'quota') throw new DOMException('quota', 'QuotaExceededError');
          const request = original.call(this, value, key as never);
          if (mode === 'abort') this.transaction.abort();
          if (mode === 'readback')
            original.call(
              this,
              { ...(value as Record<string, unknown>), revision: 999 },
              key as never,
            );
          return request;
        }
        return original.call(this, value, key as never);
      };
      const db = await mod.openMobileMediaCatalogStore(() => now);
      let code = '';
      try {
        await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
      } catch (error) {
        code = (error as Error).message;
      } finally {
        IDBObjectStore.prototype.put = original;
      }
      const state = await db.snapshot();
      db.close();
      return {
        code,
        generation: state.control.generation,
        candidate: state.bundles.candidate,
        active: state.bundles.active,
        safety: state.safety.revision,
      };
    };
    return {
      quota: await run('quota'),
      abort: await run('abort'),
      readback: await run('readback'),
    };
  }, fixedNow);
  const nullState = { generation: 0, candidate: null, active: null, safety: 0 };
  expect(value).toEqual({
    quota: { code: 'storage-failure', ...nullState },
    abort: { code: 'storage-failure', ...nullState },
    readback: { code: 'storage-failure', ...nullState },
  });
});

test('G3-021 P2 R3 matrix 8 keeps control and safety corruption read-only in real IndexedDB', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'mobile-390x844',
    'control and safety corruption real browser-IDB proof',
  );
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const run = async (
      target:
        | 'control-extra'
        | 'control-type'
        | 'control-negative'
        | 'control-pointer'
        | 'safety-extra'
        | 'safety-type'
        | 'safety-negative'
        | 'safety-deep',
    ) => {
      await remove();
      const loader = await import('/src/mobile-media-release.ts');
      const loaded = await loader.loadMobileMediaRelease(
        new AbortController().signal,
        undefined,
        undefined,
        { clock: () => now },
      );
      if (loaded.kind !== 'ready') throw new Error(loaded.kind);
      const mod = await import('/src/mobile-media-catalog-store.ts');
      const db = await mod.openMobileMediaCatalogStore(() => now);
      const saved = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
      await db.activate(saved.control.generation);
      db.close();
      const storeName = target.startsWith('control') ? 'mediaControl' : 'mediaSafety';
      const key = target.startsWith('control') ? 'control' : 'safety';
      const before = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const transaction = request.result.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const get = store.get(key);
          get.onsuccess = () => {
            const record = get.result as Record<string, unknown>;
            if (target === 'control-extra' || target === 'safety-extra') record.unexpected = true;
            if (target === 'control-type') record.generation = '2';
            if (target === 'safety-type') record.entries = {};
            if (target === 'control-negative') record.generation = -1;
            if (target === 'safety-negative') record.revision = -1;
            if (target === 'control-pointer') record.active = 'candidate';
            if (target === 'safety-deep') record.entries = [{ targetKind: 'asset' }];
            store.put(record);
            transaction.oncomplete = () => {
              request.result.close();
              resolve(JSON.stringify(record));
            };
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
      const reopened = await mod.openMobileMediaCatalogStore(() => now);
      let code = '';
      try {
        await reopened.snapshot();
      } catch (error) {
        code = (error as Error).message;
      }
      reopened.close();
      const after = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const transaction = request.result.transaction([storeName], 'readonly');
          const get = transaction.objectStore(storeName).get(key);
          get.onsuccess = () => {
            request.result.close();
            resolve(JSON.stringify(get.result));
          };
          get.onerror = () => reject(get.error);
        };
        request.onerror = () => reject(request.error);
      });
      return { code, unchanged: before === after };
    };
    const results: Array<readonly [string, Awaited<ReturnType<typeof run>>]> = [];
    for (const target of [
      'control-extra',
      'control-type',
      'control-negative',
      'control-pointer',
      'safety-extra',
      'safety-type',
      'safety-negative',
      'safety-deep',
    ] as const)
      results.push([target, await run(target)]);
    return Object.fromEntries(results);
  }, fixedNow);
  expect(value).toEqual({
    'control-extra': { code: 'protected', unchanged: true },
    'control-type': { code: 'protected', unchanged: true },
    'control-negative': { code: 'protected', unchanged: true },
    'control-pointer': { code: 'protected', unchanged: true },
    'safety-extra': { code: 'protected', unchanged: true },
    'safety-type': { code: 'protected', unchanged: true },
    'safety-negative': { code: 'protected', unchanged: true },
    'safety-deep': { code: 'protected', unchanged: true },
  });
});

test('G3-021 P2 rechecks expiry between save and activation without slot or safety writes', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'fresh-clock real browser-IDB proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (initialNow) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    let now = initialNow;
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(() => now);
    const saved = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
    now = Date.parse('2026-09-02T00:00:00.000Z');
    let code = '';
    try {
      await db.activate(saved.control.generation);
    } catch (error) {
      code = (error as Error).message;
    }
    const state = await db.snapshot();
    db.close();
    return {
      code,
      generation: state.control.generation,
      active: state.bundles.active,
      candidate: state.bundles.candidate?.revision,
      safety: state.safety.revision,
    };
  }, fixedNow);
  expect(value).toEqual({
    code: 'invalid-candidate',
    generation: 1,
    active: null,
    candidate: 1,
    safety: 0,
  });
});

test('G3-021 P2 R4 rejects unreachable control and active-safety state without real-IDB repair writes', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'mobile-390x844',
    'R4 control and safety exact-state browser-IDB proof',
  );
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const prepareActive = async () => {
      await remove();
      const loader = await import('/src/mobile-media-release.ts');
      const loaded = await loader.loadMobileMediaRelease(
        new AbortController().signal,
        undefined,
        undefined,
        { clock: () => now },
      );
      if (loaded.kind !== 'ready') throw new Error(loaded.kind);
      const mod = await import('/src/mobile-media-catalog-store.ts');
      const db = await mod.openMobileMediaCatalogStore(() => now);
      const saved = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
      await db.activate(saved.control.generation);
      db.close();
      return mod;
    };
    const mutate = async (
      mode: 'empty-generation' | 'active-generation' | 'inflated-highest' | 'missing-safety',
    ) => {
      let mod;
      if (mode === 'empty-generation') {
        await remove();
        mod = await import('/src/mobile-media-catalog-store.ts');
        const db = await mod.openMobileMediaCatalogStore(() => now);
        await db.snapshot();
        db.close();
      } else mod = await prepareActive();
      const storeName = mode === 'missing-safety' ? 'mediaSafety' : 'mediaControl';
      const key = mode === 'missing-safety' ? 'safety' : 'control';
      const before = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const transaction = request.result.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const get = store.get(key);
          get.onsuccess = () => {
            const record = (get.result ?? {
              recordVersion: 1,
              key: 'control',
              generation: 0,
              highestAcceptedRevision: 0,
              active: null,
              candidate: null,
              previous: null,
            }) as Record<string, unknown>;
            if (mode === 'empty-generation') record.generation = 1;
            if (mode === 'active-generation') record.generation = 1;
            if (mode === 'inflated-highest') record.highestAcceptedRevision = 2;
            if (mode === 'missing-safety') {
              record.generation = 0;
              record.revision = 0;
              record.raw = '';
              record.entries = [];
              record.references = [];
            }
            store.put(record);
            transaction.oncomplete = () => {
              request.result.close();
              resolve(JSON.stringify(record));
            };
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
      const db = await mod.openMobileMediaCatalogStore(() => now);
      let code = '';
      try {
        await db.snapshot();
      } catch (error) {
        code = (error as Error).message;
      }
      db.close();
      const after = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
        request.onsuccess = () => {
          const transaction = request.result.transaction([storeName], 'readonly');
          const get = transaction.objectStore(storeName).get(key);
          get.onsuccess = () => {
            request.result.close();
            resolve(JSON.stringify(get.result));
          };
          get.onerror = () => reject(get.error);
        };
        request.onerror = () => reject(request.error);
      });
      return { code, unchanged: before === after };
    };
    const results: Array<readonly [string, Awaited<ReturnType<typeof mutate>>]> = [];
    for (const mode of [
      'empty-generation',
      'active-generation',
      'inflated-highest',
      'missing-safety',
    ] as const)
      results.push([mode, await mutate(mode)]);
    return Object.fromEntries(results);
  }, fixedNow);
  expect(value).toEqual({
    'empty-generation': { code: 'protected', unchanged: true },
    'active-generation': { code: 'protected', unchanged: true },
    'inflated-highest': { code: 'protected', unchanged: true },
    'missing-safety': { code: 'protected', unchanged: true },
  });
});

test('G3-021 P2 R4-R2 maps rotation postwrite faults to storage-failure and rolls back all stores', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'R4-R2 real rotation fault matrix');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const run = async (
      mode: 'active-readback' | 'active-quota' | 'active-abort' | 'safety-readback',
    ) => {
      await remove();
      const loader = await import('/src/mobile-media-release.ts');
      const loaded = await loader.loadMobileMediaRelease(
        new AbortController().signal,
        undefined,
        undefined,
        { clock: () => now },
      );
      if (loaded.kind !== 'ready') throw new Error(loaded.kind);
      const mod = await import('/src/mobile-media-catalog-store.ts');
      const db = await mod.openMobileMediaCatalogStore(() => now);
      const saved = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
      const original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (record: unknown, key?: IDBValidKey) {
        const slot =
          typeof record === 'object' && record !== null
            ? (record as { slot?: unknown }).slot
            : null;
        if (this.name === 'mediaBundles' && slot === 'active') {
          if (mode === 'active-quota') throw new DOMException('quota', 'QuotaExceededError');
          const request = original.call(this, record, key as never);
          if (mode === 'active-abort') this.transaction.abort();
          if (mode === 'active-readback')
            original.call(
              this,
              { ...(record as Record<string, unknown>), revision: 999 },
              key as never,
            );
          return request;
        }
        if (this.name === 'mediaSafety' && mode === 'safety-readback')
          return original.call(
            this,
            { ...(record as Record<string, unknown>), revision: 999 },
            key as never,
          );
        return original.call(this, record, key as never);
      };
      let code = '';
      try {
        await db.activate(saved.control.generation);
      } catch (error) {
        code = (error as Error).message;
      } finally {
        IDBObjectStore.prototype.put = original;
      }
      const after = await db.snapshot();
      db.close();
      return {
        code,
        generation: after.control.generation,
        active: after.bundles.active,
        candidate: after.bundles.candidate?.revision,
        safety: after.safety.revision,
      };
    };
    const results: Array<readonly [string, Awaited<ReturnType<typeof run>>]> = [];
    for (const mode of [
      'active-readback',
      'active-quota',
      'active-abort',
      'safety-readback',
    ] as const)
      results.push([mode, await run(mode)]);
    return Object.fromEntries(results);
  }, fixedNow);
  const lkg = { generation: 1, active: null, candidate: 1, safety: 0 };
  expect(value).toEqual({
    'active-readback': { code: 'storage-failure', ...lkg },
    'active-quota': { code: 'storage-failure', ...lkg },
    'active-abort': { code: 'storage-failure', ...lkg },
    'safety-readback': { code: 'storage-failure', ...lkg },
  });
});

test('G3-021 P2 R4-R2-05 D reaches each rotation sink for quota abort and readback', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'mobile-390x844',
    'R4-R2-05 D real browser-IDB rotation sink matrix',
  );
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha = async (raw: string) =>
      Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))),
        (byte) => byte.toString(16).padStart(2, '0'),
      ).join('');
    const rev2 = async (
      loader: typeof import('/src/mobile-media-release.ts'),
      rawBundle: { releaseRaw: string; documentsRaw: Record<string, string> },
    ) => {
      const release = JSON.parse(rawBundle.releaseRaw) as {
        revision: number;
        documents: Array<{
          documentClass: string;
          revision: number;
          bytes: number;
          sha256: string;
          recordCount: number;
        }>;
      };
      const documents = Object.fromEntries(
        Object.entries(rawBundle.documentsRaw).map(([kind, raw]) => [kind, JSON.parse(raw)]),
      ) as Record<string, Record<string, unknown>>;
      for (const document of Object.values(documents)) document.revision = 2;
      (documents.revocation as { safetyRevision: number }).safetyRevision = 2;
      const documentsRaw = {} as Record<string, string>;
      for (const descriptor of release.documents) {
        const raw = JSON.stringify(documents[descriptor.documentClass]);
        const document = documents[descriptor.documentClass]!;
        documentsRaw[descriptor.documentClass] = raw;
        descriptor.revision = 2;
        descriptor.bytes = new TextEncoder().encode(raw).byteLength;
        descriptor.sha256 = await sha(raw);
        descriptor.recordCount =
          descriptor.documentClass === 'manifest'
            ? (document.series as unknown[]).length +
              (document.episodes as unknown[]).length +
              (document.assets as unknown[]).length
            : descriptor.documentClass === 'admission'
              ? (document.sources as unknown[]).length +
                (document.identityLinks as unknown[]).length
              : descriptor.documentClass === 'rights'
                ? (document.rights as unknown[]).length
                : descriptor.documentClass === 'consent'
                  ? (document.consents as unknown[]).length
                  : descriptor.documentClass === 'lifecycle'
                    ? 1
                    : (document.entries as unknown[]).length;
      }
      release.revision = 2;
      const releaseRaw = JSON.stringify(release);
      return {
        rawBundle: { releaseRaw, documentsRaw },
        pin: { ...loader.mobileMediaBuildPin, revision: 2, transportSha256: await sha(releaseRaw) },
      };
    };
    const run = async (
      sink: 'safety' | 'active' | 'previous',
      fault: 'quota' | 'abort' | 'readback',
    ) => {
      await remove();
      const loader = await import('/src/mobile-media-release.ts');
      const loaded = await loader.loadMobileMediaRelease(
        new AbortController().signal,
        undefined,
        undefined,
        { clock: () => now },
      );
      if (loaded.kind !== 'ready') throw new Error(loaded.kind);
      const second = await rev2(loader, loaded.rawBundle);
      const mod = await import('/src/mobile-media-catalog-store.ts');
      const db = await mod.openMobileMediaCatalogStore(
        () => now,
        [loader.mobileMediaBuildPin, second.pin],
      );
      const first = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
      const active = await db.activate(first.control.generation);
      const candidate = await db.saveCandidate({
        rawBundle: second.rawBundle,
        expectedGeneration: active.control.generation,
      });
      const before = await db.snapshot();
      const original = IDBObjectStore.prototype.put;
      let reached = false;
      IDBObjectStore.prototype.put = function (record: unknown, key?: IDBValidKey) {
        const slot =
          typeof record === 'object' && record !== null
            ? (record as { slot?: unknown }).slot
            : null;
        const target =
          (sink === 'safety' && this.name === 'mediaSafety') ||
          (sink !== 'safety' && this.name === 'mediaBundles' && slot === sink);
        if (!target) return original.call(this, record, key as never);
        reached = true;
        if (fault === 'quota') throw new DOMException('quota', 'QuotaExceededError');
        const request = original.call(this, record, key as never);
        if (fault === 'abort') this.transaction.abort();
        if (fault === 'readback')
          original.call(
            this,
            { ...(record as Record<string, unknown>), revision: 999 },
            key as never,
          );
        return request;
      };
      let code = '';
      try {
        await db.activate(candidate.control.generation);
      } catch (error) {
        code = (error as Error).message;
      } finally {
        IDBObjectStore.prototype.put = original;
      }
      const after = await db.snapshot();
      db.close();
      return { reached, code, same: JSON.stringify(before) === JSON.stringify(after) };
    };
    const results: Array<readonly [string, Awaited<ReturnType<typeof run>>]> = [];
    for (const sink of ['safety', 'active', 'previous'] as const)
      for (const fault of ['quota', 'abort', 'readback'] as const)
        results.push([`${sink}/${fault}`, await run(sink, fault)]);
    return Object.fromEntries(results);
  }, fixedNow);
  expect(value).toEqual(
    Object.fromEntries(
      ['safety', 'active', 'previous'].flatMap((sink) =>
        ['quota', 'abort', 'readback'].map((fault) => [
          `${sink}/${fault}`,
          { reached: true, code: 'storage-failure', same: true },
        ]),
      ),
    ),
  );
});

test('G3-021 P2 never lowers a pre-existing real IndexedDB safety revision', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'monotone-safety real browser-IDB proof');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('wrn-mobile-media-catalog-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const mod = await import('/src/mobile-media-catalog-store.ts');
    const db = await mod.openMobileMediaCatalogStore(() => now);
    const saved = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('wrn-mobile-media-catalog-v1', 1);
      request.onsuccess = () => {
        const transaction = request.result.transaction(['mediaSafety'], 'readwrite');
        transaction.objectStore('mediaSafety').put({
          recordVersion: 1,
          key: 'safety',
          generation: 7,
          revision: 2,
          raw: '{"higher":true}',
          entries: [],
          references: [],
        });
        transaction.oncomplete = () => {
          request.result.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });
    let code = '';
    try {
      await db.activate(saved.control.generation);
    } catch (error) {
      code = (error as Error).message;
    }
    let snapshot = 'ok';
    try {
      await db.snapshot();
    } catch (error) {
      snapshot = (error as Error).message;
    }
    db.close();
    return {
      code,
      snapshot,
    };
  }, fixedNow);
  expect(value).toEqual({
    code: 'protected',
    snapshot: 'protected',
  });
});

test('G3-021 P2 R7 keeps equal retries, conflicts, split brains and incompatible safety read-only', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile-390x844', 'R7 real browser-IDB idempotency matrix');
  await page.goto('http://127.0.0.1:43173');
  const value = await page.evaluate(async (now) => {
    const database = 'wrn-mobile-media-catalog-v1';
    const slots = ['mediaBundles', 'mediaControl', 'mediaSafety'] as const;
    const methods = ['put', 'add', 'delete', 'clear'] as const;
    const remove = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(database);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha = async (raw: string) => {
      const result = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const countRecords = (documentClass: string, document: Record<string, unknown>) =>
      documentClass === 'manifest'
        ? ((document.series as unknown[]).length ?? 0) +
          ((document.episodes as unknown[]).length ?? 0) +
          ((document.assets as unknown[]).length ?? 0)
        : documentClass === 'admission'
          ? ((document.sources as unknown[]).length ?? 0) +
            ((document.identityLinks as unknown[]).length ?? 0)
          : documentClass === 'rights'
            ? ((document.rights as unknown[]).length ?? 0)
            : documentClass === 'consent'
              ? ((document.consents as unknown[]).length ?? 0)
              : documentClass === 'lifecycle'
                ? 1
                : ((document.entries as unknown[]).length ?? 0);
    const rawRecords = () =>
      new Promise<string>((resolve, reject) => {
        const request = indexedDB.open(database, 1);
        request.onsuccess = () => {
          const connection = request.result;
          const transaction = connection.transaction(slots, 'readonly');
          const reads = [
            transaction.objectStore('mediaBundles').get('active'),
            transaction.objectStore('mediaBundles').get('candidate'),
            transaction.objectStore('mediaBundles').get('previous'),
            transaction.objectStore('mediaControl').get('control'),
            transaction.objectStore('mediaSafety').get('safety'),
          ];
          transaction.oncomplete = () => {
            connection.close();
            resolve(JSON.stringify(reads.map((read) => read.result ?? null)));
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
    const replace = (records: {
      active?: unknown;
      candidate?: unknown;
      previous?: unknown;
      control?: unknown;
      safety?: unknown;
    }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(database, 1);
        request.onsuccess = () => {
          const connection = request.result;
          const transaction = connection.transaction(slots, 'readwrite');
          const bundles = transaction.objectStore('mediaBundles');
          for (const [slot, record] of Object.entries({
            active: records.active,
            candidate: records.candidate,
            previous: records.previous,
          })) {
            if (record === undefined) bundles.delete(slot);
            else bundles.put(record);
          }
          const control = transaction.objectStore('mediaControl');
          if (records.control === undefined) control.delete('control');
          else control.put(records.control);
          const safety = transaction.objectStore('mediaSafety');
          if (records.safety === undefined) safety.delete('safety');
          else safety.put(records.safety);
          transaction.oncomplete = () => {
            connection.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
    const measure = async <Result>(operation: () => Promise<Result>) => {
      const counts = Object.fromEntries(
        slots.flatMap((store) => methods.map((method) => [`${store}.${method}`, 0])),
      ) as Record<string, number>;
      const original = {
        put: IDBObjectStore.prototype.put,
        add: IDBObjectStore.prototype.add,
        delete: IDBObjectStore.prototype.delete,
        clear: IDBObjectStore.prototype.clear,
      };
      IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
        if (slots.includes(this.name as (typeof slots)[number])) counts[`${this.name}.put`] += 1;
        return original.put.call(this, value, key);
      };
      IDBObjectStore.prototype.add = function (value: unknown, key?: IDBValidKey) {
        if (slots.includes(this.name as (typeof slots)[number])) counts[`${this.name}.add`] += 1;
        return original.add.call(this, value, key);
      };
      IDBObjectStore.prototype.delete = function (key: IDBValidKey | IDBKeyRange) {
        if (slots.includes(this.name as (typeof slots)[number])) counts[`${this.name}.delete`] += 1;
        return original.delete.call(this, key);
      };
      IDBObjectStore.prototype.clear = function () {
        if (slots.includes(this.name as (typeof slots)[number])) counts[`${this.name}.clear`] += 1;
        return original.clear.call(this);
      };
      try {
        return { value: await operation(), counts };
      } finally {
        IDBObjectStore.prototype.put = original.put;
        IDBObjectStore.prototype.add = original.add;
        IDBObjectStore.prototype.delete = original.delete;
        IDBObjectStore.prototype.clear = original.clear;
      }
    };
    const outcome = async <Result>(operation: () => Promise<Result>) => {
      try {
        return { code: 'ok', result: await operation() };
      } catch (error) {
        return { code: (error as Error).message, result: null };
      }
    };
    const loader = await import('/src/mobile-media-release.ts');
    const loaded = await loader.loadMobileMediaRelease(
      new AbortController().signal,
      undefined,
      undefined,
      { clock: () => now },
    );
    if (loaded.kind !== 'ready') throw new Error(loaded.kind);
    const alternate = {
      rawBundle: { ...loaded.rawBundle, releaseRaw: `${loaded.rawBundle.releaseRaw} ` },
      pin: {
        ...loader.mobileMediaBuildPin,
        transportSha256: await sha(`${loaded.rawBundle.releaseRaw} `),
      },
    };
    const revision = async (number: number, suffix = '') => {
      const release = JSON.parse(loaded.rawBundle.releaseRaw) as {
        revision: number;
        documents: Array<{
          documentClass: string;
          revision: number;
          bytes: number;
          sha256: string;
          recordCount: number;
        }>;
      };
      const documents = Object.fromEntries(
        Object.entries(loaded.rawBundle.documentsRaw).map(([kind, raw]) => [kind, JSON.parse(raw)]),
      ) as Record<string, Record<string, unknown>>;
      for (const document of Object.values(documents)) document.revision = number;
      (documents.revocation as { safetyRevision: number }).safetyRevision = number;
      const documentsRaw = {} as Record<string, string>;
      for (const descriptor of release.documents) {
        const document = documents[descriptor.documentClass]!;
        const raw = JSON.stringify(document);
        documentsRaw[descriptor.documentClass] = raw;
        descriptor.revision = number;
        descriptor.bytes = new TextEncoder().encode(raw).byteLength;
        descriptor.sha256 = await sha(raw);
        descriptor.recordCount = countRecords(descriptor.documentClass, document);
      }
      release.revision = number;
      const releaseRaw = `${JSON.stringify(release)}${suffix}`;
      return {
        rawBundle: { releaseRaw, documentsRaw },
        pin: {
          ...loader.mobileMediaBuildPin,
          revision: number,
          transportSha256: await sha(releaseRaw),
        },
      };
    };
    const safetyFor = (rawBundle: { documentsRaw: Record<string, string> }, generation = 1) => {
      const revocation = JSON.parse(rawBundle.documentsRaw.revocation) as {
        safetyRevision: number;
        entries: unknown[];
        references: unknown[];
      };
      return {
        recordVersion: 1,
        key: 'safety',
        generation,
        revision: revocation.safetyRevision,
        raw: rawBundle.documentsRaw.revocation,
        entries: revocation.entries,
        references: revocation.references,
      };
    };
    const bundle = async (
      slot: 'active' | 'candidate' | 'previous',
      rawBundle: typeof loaded.rawBundle,
    ) => ({
      recordVersion: 1,
      slot,
      rawBundle,
      transportSha256: await sha(rawBundle.releaseRaw),
      revision: JSON.parse(rawBundle.releaseRaw).revision as number,
    });
    const create = async (pins: readonly (typeof loader.mobileMediaBuildPin)[]) => {
      await remove();
      const mod = await import('/src/mobile-media-catalog-store.ts');
      return mod.openMobileMediaCatalogStore(() => now, pins);
    };
    const same = async (
      db: Awaited<ReturnType<typeof create>>,
      rawBundle: typeof loaded.rawBundle,
      generation: number,
    ) => {
      const before = await rawRecords();
      const snapshot = await db.snapshot();
      const measured = await measure(() =>
        outcome(() => db.saveCandidate({ rawBundle, expectedGeneration: generation })),
      );
      const after = await rawRecords();
      return {
        code: measured.value.code,
        rawSame: before === after,
        beforeSnapshot: JSON.stringify(snapshot),
        returnedSnapshot:
          measured.value.result === null ? null : JSON.stringify(measured.value.result),
        counts: measured.counts,
      };
    };
    const rev2 = await revision(2);
    const rev2Alternate = await revision(2, ' ');

    const candidateDb = await create([loader.mobileMediaBuildPin, alternate.pin]);
    const candidateSaved = await candidateDb.saveCandidate({
      rawBundle: loaded.rawBundle,
      expectedGeneration: 0,
    });
    const candidateNoop = await same(
      candidateDb,
      loaded.rawBundle,
      candidateSaved.control.generation,
    );
    const candidateConflict = await same(
      candidateDb,
      alternate.rawBundle,
      candidateSaved.control.generation,
    );
    candidateDb.close();

    const activeDb = await create([loader.mobileMediaBuildPin, alternate.pin]);
    const activeSaved = await activeDb.saveCandidate({
      rawBundle: loaded.rawBundle,
      expectedGeneration: 0,
    });
    const active = await activeDb.activate(activeSaved.control.generation);
    const activeNoop = await same(activeDb, loaded.rawBundle, active.control.generation);
    const activeConflict = await same(activeDb, alternate.rawBundle, active.control.generation);
    activeDb.close();

    const previousDb = await create([loader.mobileMediaBuildPin, rev2.pin, rev2Alternate.pin]);
    const first = await previousDb.saveCandidate({
      rawBundle: loaded.rawBundle,
      expectedGeneration: 0,
    });
    const firstActive = await previousDb.activate(first.control.generation);
    const second = await previousDb.saveCandidate({
      rawBundle: rev2.rawBundle,
      expectedGeneration: firstActive.control.generation,
    });
    const secondActive = await previousDb.activate(second.control.generation);
    const rollback = await previousDb.rollback(secondActive.control.generation);
    const previousNoop = await same(previousDb, rev2.rawBundle, rollback.control.generation);
    const previousConflict = await same(
      previousDb,
      rev2Alternate.rawBundle,
      rollback.control.generation,
    );
    previousDb.close();

    const safetyCase = async (safety: unknown) => {
      const db = await create([loader.mobileMediaBuildPin]);
      const saved = await db.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
      db.close();
      await replace({
        control: saved.control,
        safety,
        candidate: await bundle('candidate', loaded.rawBundle),
      });
      const reopened = await (
        await import('/src/mobile-media-catalog-store.ts')
      ).openMobileMediaCatalogStore(() => now);
      const result = await same(reopened, loaded.rawBundle, saved.control.generation);
      reopened.close();
      return result;
    };
    const lowerSafety = safetyFor((await revision(2)).rawBundle, 2);
    const equalDifferentSafety = safetyFor(
      {
        documentsRaw: {
          ...loaded.rawBundle.documentsRaw,
          revocation: `${loaded.rawBundle.documentsRaw.revocation} `,
        },
      },
      1,
    );
    const safetyLower = await safetyCase(lowerSafety);
    const safetyEqualDifferent = await safetyCase(equalDifferentSafety);

    const split = async (
      records: Parameters<typeof replace>[0],
      pins: readonly (typeof loader.mobileMediaBuildPin)[],
      activateGeneration?: number,
    ) => {
      await remove();
      const db = await create(pins);
      db.close();
      await replace(records);
      const reopened = await (
        await import('/src/mobile-media-catalog-store.ts')
      ).openMobileMediaCatalogStore(() => now, pins);
      const before = await rawRecords();
      const measured = await measure(async () => {
        const snapshot = await outcome(() => reopened.snapshot());
        const activate =
          activateGeneration === undefined
            ? { code: 'none' }
            : await outcome(() => reopened.activate(activateGeneration));
        return `${snapshot.code}/${activate.code}`;
      });
      const after = await rawRecords();
      reopened.close();
      return { code: measured.value, rawSame: before === after, counts: measured.counts };
    };
    const baseSafety = safetyFor(loaded.rawBundle);
    const activeCandidate = await split(
      {
        active: await bundle('active', loaded.rawBundle),
        candidate: await bundle('candidate', alternate.rawBundle),
        control: {
          recordVersion: 1,
          key: 'control',
          generation: 3,
          highestAcceptedRevision: 1,
          active: 'active',
          candidate: 'candidate',
          previous: null,
        },
        safety: baseSafety,
      },
      [loader.mobileMediaBuildPin, alternate.pin],
      3,
    );
    const activePrevious = await split(
      {
        active: await bundle('active', loaded.rawBundle),
        previous: await bundle('previous', alternate.rawBundle),
        control: {
          recordVersion: 1,
          key: 'control',
          generation: 4,
          highestAcceptedRevision: 1,
          active: 'active',
          candidate: null,
          previous: 'previous',
        },
        safety: baseSafety,
      },
      [loader.mobileMediaBuildPin, alternate.pin],
    );
    const candidatePrevious = await split(
      {
        active: await bundle('active', loaded.rawBundle),
        candidate: await bundle('candidate', rev2.rawBundle),
        previous: await bundle('previous', rev2Alternate.rawBundle),
        control: {
          recordVersion: 1,
          key: 'control',
          generation: 5,
          highestAcceptedRevision: 2,
          active: 'active',
          candidate: 'candidate',
          previous: 'previous',
        },
        safety: safetyFor(rev2.rawBundle, 2),
      },
      [loader.mobileMediaBuildPin, rev2.pin, rev2Alternate.pin],
      5,
    );
    await remove();
    return {
      noops: [candidateNoop, activeNoop, previousNoop],
      conflicts: [candidateConflict, activeConflict, previousConflict],
      safety: [safetyLower, safetyEqualDifferent],
      split: [activeCandidate, activePrevious, candidatePrevious],
    };
  }, fixedNow);
  const zeroMutations = {
    'mediaBundles.put': 0,
    'mediaBundles.add': 0,
    'mediaBundles.delete': 0,
    'mediaBundles.clear': 0,
    'mediaControl.put': 0,
    'mediaControl.add': 0,
    'mediaControl.delete': 0,
    'mediaControl.clear': 0,
    'mediaSafety.put': 0,
    'mediaSafety.add': 0,
    'mediaSafety.delete': 0,
    'mediaSafety.clear': 0,
  };
  for (const noop of value.noops) {
    expect(noop.code).toBe('ok');
    expect(noop.rawSame).toBe(true);
    expect(noop.returnedSnapshot).toBe(noop.beforeSnapshot);
    expect(noop.counts).toEqual(zeroMutations);
  }
  for (const conflict of value.conflicts) {
    expect(conflict.code).toBe('conflict');
    expect(conflict.rawSame).toBe(true);
    expect(conflict.returnedSnapshot).toBeNull();
    expect(conflict.counts).toEqual(zeroMutations);
  }
  for (const safety of value.safety) {
    expect(safety.code).toBe('protected');
    expect(safety.rawSame).toBe(true);
    expect(safety.returnedSnapshot).toBeNull();
    expect(safety.counts).toEqual(zeroMutations);
  }
  expect(value.split.map((split) => split.code)).toEqual([
    'protected/protected',
    'protected/none',
    'protected/protected',
  ]);
  for (const split of value.split) {
    expect(split.rawSame).toBe(true);
    expect(split.counts).toEqual(zeroMutations);
  }
});
