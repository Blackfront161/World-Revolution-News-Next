import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProductionContentOfflineController } from './production-content-offline-controller';
import type { ProductionContentOfflineStore } from './production-content-offline-store';
import type { ProductionContentOfflineControlV1 } from '@wrn/content-contracts/production-content-offline-v1';
import type { ProductionContentSafetyReceipt } from './production-content-release';
import { ProductionContentOfflineStoreError } from './production-content-offline-store';
import { productionTestResult } from './production-content-test-data';
import type { ProductionContentSourceV1 } from './production-content-release';
import { createProductionContentSourceV1 } from './production-content-release';
import { makeCapacityTestPacket } from './production-capacity-test-data';

afterEach(() => vi.useRealTimers());
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const receipt: ProductionContentSafetyReceipt = {
  pointer: {
    schema: 'wrn.production-content-current.v1',
    releaseRevision: 'authored',
    sequence: 1,
    descriptorPath: '/wrn-production-content/authored/release-descriptor.json',
    descriptorSha256: 'a'.repeat(64),
  },
  descriptor: {},
  manifest: {},
  archiveLifecycle: {},
  safety: { revision: 1, revokedIds: [] },
};
function inertStore(): ProductionContentOfflineStore {
  return {
    snapshot: vi.fn(async () => ({ control, bundles: [] })),
    observeTime: vi.fn(async () => control),
    prepareRecheck: vi.fn(async () => control),
    commitSafety: vi.fn(async () => ({ ...control, safety: receipt.safety })),
    finishRecheck: vi.fn(async () => control),
    saveCandidate: vi.fn(async () => {
      throw new Error('unexpected save');
    }),
    activateCandidate: vi.fn(async () => {
      throw new Error('unexpected activation');
    }),
    rollback: vi.fn(async () => control),
    clear: vi.fn(async () => control),
    readActive: vi.fn(async () => null),
    close: vi.fn(),
  };
}

const control: ProductionContentOfflineControlV1 = Object.freeze({
  format: 'wrn.production-content-offline.v1' as const,
  generation: 0,
  clearEpoch: 0,
  activeKey: null,
  previousKey: null,
  candidateKey: null,
  pendingRecheck: null,
  lastSuccessfulSourceCheckAt: null,
  lastObservedAt: null,
  safety: Object.freeze({ revision: 0, revokedIds: Object.freeze([]) }),
  highestAcceptedSequence: 0,
  acceptedIdentities: Object.freeze([]),
});

describe('production offline controller safety barrier', () => {
  it('awaits the durable V3 safety transaction before requesting any of its six article payloads', async () => {
    const { packet } = await makeCapacityTestPacket({ readerBytes: 600 * 1024 });
    const commit = deferred<void>();
    let state = control;
    const store = inertStore();
    store.snapshot = async () => ({ control: state, bundles: [] });
    store.prepareRecheck = async (operationId) =>
      (state = { ...state, pendingRecheck: { operationId, generation: 0, clearEpoch: 0 } });
    store.commitSafety = vi.fn(async (_id, safety) => {
      await commit.promise;
      state = { ...state, safety };
      return state;
    });
    store.finishRecheck = vi.fn(async () => (state = { ...state, pendingRecheck: null }));
    const urls: string[] = [];
    const source = createProductionContentSourceV1(async (url) => {
      urls.push(url);
      if (url.endsWith('/articles.json'))
        throw Error('Authored payload failure after committed safety');
      return structuredClone(packet.get(url));
    }, 'bundled-v1');
    const controller = createProductionContentOfflineController({
      openStore: async () => store,
      bootstrapSource: source,
    });
    const pending = controller.check();
    await vi.waitFor(() => expect(store.commitSafety).toHaveBeenCalledOnce());
    expect(urls).toEqual([...packet.keys()].slice(0, 4));
    expect(state.safety).toEqual({ revision: 0, revokedIds: [] });
    commit.resolve();
    await expect(pending).resolves.toMatchObject({
      status: 'needs-source-check',
      reason: 'transport-or-validation',
      confirmedWrites: ['prepare-recheck', 'commit-safety', 'finish-recheck'],
    });
    expect(urls).toEqual([...packet.keys()]);
    expect(state.safety).toEqual({ revision: 1, revokedIds: [] });
    expect(store.saveCandidate).not.toHaveBeenCalled();
    controller.dispose();
  });
  it.each([
    { generation: 1 },
    { clearEpoch: 1 },
    { activeKey: 'a' },
    { previousKey: 'b' },
    { candidateKey: 'c' },
    { lastObservedAt: 0 },
    { lastSuccessfulSourceCheckAt: 0 },
    { highestAcceptedSequence: 1 },
    { safety: { revision: 1, revokedIds: [] } },
  ])('forbids bootstrap for a non-virgin control delta %j', async (delta) => {
    const store = inertStore();
    store.snapshot = async () => ({ control: { ...control, ...delta }, bundles: [] });
    const bootstrapSource: ProductionContentSourceV1 = {
      id: 'bundled-v1',
      verifySafety: vi.fn(async () => ({ kind: 'failed' as const, safety: null })),
      completeRelease: vi.fn(async () => ({ kind: 'failed' as const })),
    };
    const refreshSource: ProductionContentSourceV1 = {
      ...bootstrapSource,
      id: 'solinaridao-static-v1',
      verifySafety: vi.fn(async () => ({ kind: 'failed' as const, safety: null })),
    };
    const controller = createProductionContentOfflineController({
      openStore: async () => store,
      bootstrapSource,
      refreshSource,
    });
    await controller.check();
    expect(bootstrapSource.verifySafety).not.toHaveBeenCalled();
    expect(refreshSource.verifySafety).toHaveBeenCalledOnce();
    expect(store.finishRecheck).toHaveBeenCalledWith(
      expect.any(String),
      'unverified-preserve-check-time',
      expect.any(Number),
      expect.anything(),
      expect.anything(),
    );
    controller.dispose();
  });
  it('captures the selected phase pair before prepare and never switches to a mutated source', async () => {
    const store = inertStore();
    const completeRelease = vi.fn(async () => ({ kind: 'failed' as const }));
    const alternate = vi.fn(async () => ({ kind: 'failed' as const }));
    const source = {
      id: 'bundled-v1' as const,
      verifySafety: vi.fn(async () => ({
        kind: 'verified' as const,
        receipt,
        safety: receipt.safety,
      })),
      completeRelease,
    };
    store.prepareRecheck = async () => {
      source.completeRelease = alternate;
      return control;
    };
    const controller = createProductionContentOfflineController({
      openStore: async () => store,
      bootstrapSource: source,
    });
    await controller.check();
    expect(completeRelease).toHaveBeenCalledOnce();
    expect(alternate).not.toHaveBeenCalled();
    controller.dispose();
  });
  it('makes no source request when the chosen virgin snapshot loses the prepare race', async () => {
    const store = inertStore();
    store.prepareRecheck = async () => {
      throw new ProductionContentOfflineStoreError('stale-operation');
    };
    const verifySafety = vi.fn(async () => ({ kind: 'failed' as const, safety: null }));
    const source: ProductionContentSourceV1 = {
      id: 'bundled-v1',
      verifySafety,
      completeRelease: vi.fn(),
    };
    const controller = createProductionContentOfflineController({
      openStore: async () => store,
      bootstrapSource: source,
      refreshSource: source,
    });
    await expect(controller.check()).resolves.toMatchObject({
      status: 'storage-error',
      storageFailure: 'stale-operation',
    });
    expect(verifySafety).not.toHaveBeenCalled();
    controller.dispose();
  });
  it('retains legacy unverified outcome when only explicit phase dependencies are injected', async () => {
    const store = inertStore();
    const controller = createProductionContentOfflineController({
      openStore: async () => store,
      verifySafety: async () => ({ kind: 'failed', safety: null }),
    });
    await expect(controller.check()).resolves.toMatchObject({ status: 'needs-source-check' });
    expect(store.finishRecheck).toHaveBeenCalledWith(
      expect.any(String),
      'unverified',
      expect.any(Number),
      expect.anything(),
      expect.anything(),
    );
    controller.dispose();
  });
  it('reports the active bundle expiry rather than a newer global source time', async () => {
    const fixture = await productionTestResult(1000);
    const stored = { ...fixture.control!, lastSuccessfulSourceCheckAt: 2000, lastObservedAt: 2000 };
    const store = inertStore();
    store.snapshot = async () => ({ control: stored, bundles: [] });
    store.readActive = async () => ({
      ready: fixture.runtime!,
      generation: stored.generation,
      clearEpoch: stored.clearEpoch,
      checkedAt: 1000,
    });
    const controller = createProductionContentOfflineController({
      openStore: async () => store,
      now: () => 2000,
    });
    const restored = await controller.restore();
    expect(restored.status).toBe('active');
    expect(restored.control?.lastSuccessfulSourceCheckAt).toBe(2000);
    expect(restored.expiresAt).toBe(1000 + 86_400_000);
    controller.dispose();
  });
  it('commits verified archive safety before it may start a later payload phase, and retains it on payload failure', async () => {
    const calls: string[] = [];
    let staged = control;
    const store: ProductionContentOfflineStore = {
      snapshot: async () => Object.freeze({ control: staged, bundles: Object.freeze([]) }),
      observeTime: async () => staged,
      prepareRecheck: async (operationId) => {
        calls.push('prepare');
        staged = Object.freeze({
          ...staged,
          pendingRecheck: Object.freeze({ operationId, generation: 0, clearEpoch: 0 }),
        });
        return staged;
      },
      commitSafety: async (_id, safety) => {
        calls.push('commit-safety');
        staged = Object.freeze({ ...staged, safety });
        return staged;
      },
      finishRecheck: async () => {
        calls.push('finish');
        staged = Object.freeze({ ...staged, pendingRecheck: null });
        return staged;
      },
      saveCandidate: async () => {
        throw new Error('must not save a failed payload');
      },
      activateCandidate: async () => {
        throw new Error('must not activate a failed payload');
      },
      rollback: async () => staged,
      clear: async () => staged,
      readActive: async () => null,
      close: () => undefined,
    };
    const controller = createProductionContentOfflineController({
      openStore: async () => store,
      verifySafety: async () =>
        Object.freeze({
          kind: 'verified' as const,
          safety: Object.freeze({ revision: 1, revokedIds: Object.freeze([]) }),
          receipt,
        }),
      completeRelease: async () => {
        calls.push('complete-payload');
        expect(calls).toContain('commit-safety');
        return Object.freeze({ kind: 'failed' as const });
      },
      operationId: () => 'test-safety-barrier',
      now: () => 100,
    });
    await expect(controller.check()).resolves.toMatchObject({
      status: 'needs-source-check',
      reason: 'transport-or-validation',
      confirmedWrites: ['prepare-recheck', 'commit-safety', 'finish-recheck'],
    });
    expect(calls).toEqual(['prepare', 'commit-safety', 'complete-payload', 'finish']);
    expect(staged.safety.revision).toBe(1);
  });

  it('does not request payloads until the actual safety write resolves', async () => {
    const store = inertStore();
    const write = deferred<ProductionContentOfflineControlV1>();
    store.commitSafety = vi.fn(() => write.promise);
    const completeRelease = vi.fn(async () => ({ kind: 'failed' as const }));
    const controller = createProductionContentOfflineController({
      openStore: async () => store,
      verifySafety: async () => ({ kind: 'verified', receipt, safety: receipt.safety }),
      completeRelease,
    });
    const pending = controller.check();
    await vi.waitFor(() => expect(store.commitSafety).toHaveBeenCalledOnce());
    expect(completeRelease).not.toHaveBeenCalled();
    write.resolve({ ...control, safety: receipt.safety });
    await pending;
    expect(completeRelease).toHaveBeenCalledOnce();
    controller.dispose();
  });

  it('blocks the payload phase when the safety transaction fails', async () => {
    const store = inertStore();
    store.commitSafety = vi.fn(async () => {
      throw new ProductionContentOfflineStoreError('quota-or-write-failure');
    });
    const completeRelease = vi.fn(async () => ({ kind: 'failed' as const }));
    const controller = createProductionContentOfflineController({
      openStore: async () => store,
      verifySafety: async () => ({ kind: 'verified', receipt, safety: receipt.safety }),
      completeRelease,
    });
    await expect(controller.check()).resolves.toMatchObject({
      reason: 'safety-write-failed',
      storageFailure: 'quota-or-write-failure',
      confirmedWrites: ['prepare-recheck'],
    });
    expect(completeRelease).not.toHaveBeenCalled();
    controller.dispose();
  });

  it('times out an uncooperative store open and closes the late connection without reading it', async () => {
    vi.useFakeTimers();
    const opening = deferred<ProductionContentOfflineStore>();
    const store = inertStore();
    const controller = createProductionContentOfflineController({
      openStore: () => opening.promise,
    });
    const pending = controller.restore();
    await vi.advanceTimersByTimeAsync(15000);
    await expect(pending).resolves.toMatchObject({ status: 'aborted', reason: 'timeout' });
    opening.resolve(store);
    await vi.advanceTimersByTimeAsync(0);
    expect(store.close).toHaveBeenCalledOnce();
    expect(store.snapshot).not.toHaveBeenCalled();
    controller.dispose();
  });

  it('retains confirmed safety on a payload timeout and suppresses all late payload writes', async () => {
    vi.useFakeTimers();
    const store = inertStore();
    const payload = deferred<{ kind: 'failed' }>();
    const completeRelease = vi.fn(() => payload.promise);
    const controller = createProductionContentOfflineController({
      openStore: async () => store,
      verifySafety: async () => ({ kind: 'verified', receipt, safety: receipt.safety }),
      completeRelease,
    });
    const pending = controller.check();
    await vi.advanceTimersByTimeAsync(1);
    expect(completeRelease).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(15000);
    await expect(pending).resolves.toMatchObject({
      reason: 'timeout',
      confirmedWrites: ['prepare-recheck', 'commit-safety'],
    });
    payload.resolve({ kind: 'failed' });
    await vi.advanceTimersByTimeAsync(0);
    expect(store.finishRecheck).not.toHaveBeenCalled();
    expect(store.saveCandidate).not.toHaveBeenCalled();
    controller.dispose();
  });

  it('clear supersedes a pending source check and the old completion cannot re-save', async () => {
    const store = inertStore();
    const source = deferred<{ kind: 'failed'; safety: null }>();
    const verifySafety = vi.fn(() => source.promise);
    const controller = createProductionContentOfflineController({
      openStore: async () => store,
      verifySafety,
    });
    const pending = controller.check();
    await vi.waitFor(() => expect(verifySafety).toHaveBeenCalledOnce());
    await expect(controller.clear()).resolves.toMatchObject({
      reason: 'no-active-bundle',
      confirmedWrites: ['clear'],
    });
    source.resolve({ kind: 'failed', safety: null });
    await expect(pending).resolves.toMatchObject({ status: 'aborted' });
    expect(store.finishRecheck).not.toHaveBeenCalled();
    expect(store.saveCandidate).not.toHaveBeenCalled();
    controller.dispose();
  });
});
