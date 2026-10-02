import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeProductionOfflineFixture,
  firstProductionTestId,
} from '../../../tests/e2e/production-content-offline-harness';
import type { ProductionContentOfflineControllerResult } from '../../../packages/browser-content/src/production-content-offline-controller';
import { createEmptyProductionContentOfflineControlV1 } from '@wrn/content-contracts/production-content-offline-v1';
import { createProductionContentOfflineController } from './production-content-offline-controller';
import {
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
} from './production-reading-state';
import { App } from './App';
import {
  isVirginPublicationControl,
  useProductionContentOfflineController,
} from './production-content-ui';

vi.mock('./production-content-offline-controller', () => ({
  createProductionContentOfflineController: vi.fn(),
}));

beforeEach(async () => {
  window.history.replaceState({}, '', '/');
  window.localStorage.clear();
  const runtime = await makeProductionOfflineFixture();
  const result = {
    status: 'active' as const,
    reason: 'ready' as const,
    runtime,
    activeKey: runtime.manifestSha256,
    expiresAt: Date.now() + 86400000,
    control: null,
    safety: runtime.safetyLedger,
    confirmedWrites: [],
    storageFailure: null,
  };
  vi.mocked(createProductionContentOfflineController).mockReturnValue({
    restore: vi.fn(async () => result),
    check: vi.fn(async () => result),
    rollback: vi.fn(async () => result),
    clear: vi.fn(async () => result),
    dispose: vi.fn(),
  });
});

describe('Website production adapter and entry', () => {
  it('limits automatic publication recovery to untouched controls', () => {
    const virgin = createEmptyProductionContentOfflineControlV1();
    expect(isVirginPublicationControl(virgin)).toBe(true);
    expect(isVirginPublicationControl({ ...virgin, clearEpoch: 1 })).toBe(false);
    expect(
      isVirginPublicationControl({
        ...virgin,
        safety: { revision: 1, revokedIds: ['wrn-art-revoked'] },
      }),
    ).toBe(false);
  });
  it('recovers a virgin first visit when the initial guarded check was busy', async () => {
    const runtime = await makeProductionOfflineFixture();
    const virgin = {
      status: 'needs-source-check',
      reason: 'no-active-bundle',
      control: createEmptyProductionContentOfflineControlV1(),
    } as ProductionContentOfflineControllerResult;
    const active = {
      status: 'active',
      reason: 'ready',
      runtime,
      activeKey: runtime.manifestSha256,
      expiresAt: Date.now() + 86400000,
      control: null,
      safety: runtime.safetyLedger,
      confirmedWrites: [],
      storageFailure: null,
    } as ProductionContentOfflineControllerResult;
    const check = vi.fn().mockResolvedValueOnce({ status: 'busy' }).mockResolvedValue(active);
    vi.mocked(createProductionContentOfflineController).mockReturnValue({
      restore: vi.fn(async () => virgin),
      check,
      rollback: vi.fn(async () => virgin),
      clear: vi.fn(async () => virgin),
      dispose: vi.fn(),
    });
    render(<App />);
    await waitFor(() => expect(check).toHaveBeenCalledTimes(2), { timeout: 3000 });
    expect(await screen.findByText('Authored test 0')).toBeVisible();
  });

  it('recovers a first-visit transport failure without a manual update', async () => {
    const controller = vi.mocked(createProductionContentOfflineController)();
    const active = await controller.check();
    const empty = createEmptyProductionContentOfflineControlV1();
    const virgin = {
      ...active,
      status: 'needs-source-check' as const,
      reason: 'no-active-bundle' as const,
      runtime: null,
      activeKey: null,
      control: empty,
    };
    const touched = { ...virgin, control: { ...empty, generation: 2, lastObservedAt: Date.now() } };
    const check = vi
      .fn()
      .mockResolvedValueOnce({ ...virgin, control: null, reason: 'transport-or-validation' })
      .mockResolvedValue(active);
    vi.mocked(createProductionContentOfflineController).mockReturnValue({
      ...controller,
      check,
      restore: vi.fn(async () => (check.mock.calls.length ? touched : virgin)),
    });
    render(<App />);
    expect(await screen.findByText('Authored test 0')).toBeVisible();
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('recovers more than three coalesced first-visit checks', async () => {
    const controller = vi.mocked(createProductionContentOfflineController)();
    const active = await controller.check();
    const virgin = {
      ...active,
      status: 'needs-source-check' as const,
      reason: 'no-active-bundle' as const,
      runtime: null,
      activeKey: null,
      control: createEmptyProductionContentOfflineControlV1(),
    };
    const check = vi
      .fn()
      .mockResolvedValueOnce({ status: 'busy' })
      .mockResolvedValueOnce({ status: 'busy' })
      .mockResolvedValueOnce({ status: 'busy' })
      .mockResolvedValueOnce({ status: 'busy' })
      .mockResolvedValue(active);
    vi.mocked(createProductionContentOfflineController).mockReturnValue({
      ...controller,
      check,
      restore: vi.fn(async () => virgin),
    });
    render(<App />);
    expect(await screen.findByText('Authored test 0')).toBeVisible();
    expect(check).toHaveBeenCalledTimes(5);
  });

  it('bounds first-visit transport retries and stops them after unmount', async () => {
    const controller = vi.mocked(createProductionContentOfflineController)();
    const active = await controller.check();
    const virgin = {
      ...active,
      status: 'needs-source-check' as const,
      reason: 'no-active-bundle' as const,
      runtime: null,
      activeKey: null,
      control: createEmptyProductionContentOfflineControlV1(),
    };
    const failed = { ...virgin, control: null, reason: 'transport-or-validation' as const };
    const check = vi.fn(async () => failed);
    vi.mocked(createProductionContentOfflineController).mockReturnValue({
      ...controller,
      check,
      restore: vi.fn(async () => virgin),
    });
    const hook = renderHook(() => useProductionContentOfflineController());
    await act(async () => {
      await hook.result.current.invoke('guard');
    });
    await act(async () => {
      await hook.result.current.invoke('check');
    });
    expect(check).toHaveBeenCalledTimes(3);
    check.mockClear();
    await act(async () => {
      await hook.result.current.invoke('guard');
    });
    let pending!: Promise<ProductionContentOfflineControllerResult | null>;
    act(() => {
      pending = hook.result.current.invoke('check');
    });
    await waitFor(() => expect(check).toHaveBeenCalledTimes(1));
    hook.unmount();
    await pending;
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('does not auto-check a generation-zero control with prior safety state, but permits manual check', async () => {
    const nonVirgin = {
      status: 'needs-source-check',
      reason: 'no-active-bundle',
      runtime: null,
      activeKey: null,
      expiresAt: null,
      control: {
        ...createEmptyProductionContentOfflineControlV1(),
        safety: { revision: 1, revokedIds: ['wrn-art-revoked'] },
      },
      safety: null,
      confirmedWrites: [],
      storageFailure: null,
    } satisfies ProductionContentOfflineControllerResult;
    const check = vi.fn(async () => nonVirgin);
    const restore = vi.fn(async () => nonVirgin);
    vi.mocked(createProductionContentOfflineController).mockReturnValue({
      restore,
      check,
      rollback: vi.fn(async () => nonVirgin),
      clear: vi.fn(async () => nonVirgin),
      dispose: vi.fn(),
    });
    render(<App />);
    const manualCheck = await screen.findByRole('button', { name: 'Check for a newer revision' });
    await waitFor(() => expect(restore).toHaveBeenCalledTimes(2));
    expect(check).not.toHaveBeenCalled();
    await userEvent.setup().click(manualCheck);
    await waitFor(() => expect(check).toHaveBeenCalledTimes(1));
  });

  it('stops a virgin auto-check retry when Clear preempts its guard', async () => {
    const virgin = {
      status: 'needs-source-check',
      reason: 'no-active-bundle',
      control: createEmptyProductionContentOfflineControlV1(),
    } as ProductionContentOfflineControllerResult;
    const cleared = {
      ...virgin,
      control: { ...virgin.control!, generation: 1, clearEpoch: 1 },
    } as ProductionContentOfflineControllerResult;
    let finishGuard: ((value: ProductionContentOfflineControllerResult) => void) | undefined;
    const restore = vi
      .fn()
      .mockResolvedValueOnce(virgin)
      .mockResolvedValueOnce(virgin)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishGuard = resolve;
          }),
      );
    const check = vi.fn(async () => ({
      ...virgin,
      status: 'busy' as const,
      reason: 'operation-in-progress' as const,
    }));
    vi.mocked(createProductionContentOfflineController).mockReturnValue({
      restore,
      check,
      rollback: vi.fn(async () => virgin),
      clear: vi.fn(async () => cleared),
      dispose: vi.fn(),
    });
    const { result } = renderHook(() => useProductionContentOfflineController());
    await waitFor(() => expect(restore).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.invoke('guard');
    });
    let pendingCheck!: Promise<ProductionContentOfflineControllerResult | null>;
    act(() => {
      pendingCheck = result.current.invoke('check');
    });
    await waitFor(() => expect(restore).toHaveBeenCalledTimes(3));
    await act(async () => {
      await result.current.invoke('clear');
    });
    await act(async () => {
      finishGuard?.(virgin);
      await pendingCheck;
    });
    expect(check).toHaveBeenCalledTimes(1);
    expect(result.current.result?.control?.clearEpoch).toBe(1);
  });

  it('Clear cancels a delayed first-visit transport retry', async () => {
    const controller = vi.mocked(createProductionContentOfflineController)();
    const active = await controller.check();
    const virgin = {
      ...active,
      status: 'needs-source-check' as const,
      reason: 'no-active-bundle' as const,
      runtime: null,
      activeKey: null,
      control: createEmptyProductionContentOfflineControlV1(),
    };
    const failed = { ...virgin, control: null, reason: 'transport-or-validation' as const };
    const cleared = { ...virgin, control: { ...virgin.control, generation: 1, clearEpoch: 1 } };
    const check = vi.fn(async () => failed);
    vi.mocked(createProductionContentOfflineController).mockReturnValue({
      ...controller,
      check,
      restore: vi.fn(async () => virgin),
      clear: vi.fn(async () => cleared),
    });
    const { result } = renderHook(() => useProductionContentOfflineController());
    await act(async () => {
      await result.current.invoke('guard');
    });
    let pending!: Promise<ProductionContentOfflineControllerResult | null>;
    act(() => {
      pending = result.current.invoke('check');
    });
    await waitFor(() => expect(check).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.invoke('clear');
      await pending;
    });
    expect(check).toHaveBeenCalledTimes(1);
    expect(result.current.result?.control?.clearEpoch).toBe(1);
  });

  it('default mode uses production even with old query switches and never reads either v1 or Mobile reading keys', async () => {
    window.history.replaceState({}, '', '/?state=ready&contentMode=fixture-offline');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    render(<App />);
    expect(await screen.findByText('Authored test 0')).toBeVisible();
    expect(screen.queryByTestId('manifest-revision')).not.toBeInTheDocument();
    expect(screen.queryByText('Local test publication')).not.toBeInTheDocument();
    expect(getItem.mock.calls.map(([key]) => key)).not.toContain(
      'wrn.website-local-reading-state.v1',
    );
    expect(getItem.mock.calls.map(([key]) => key)).not.toContain(
      'wrn.mobile-production-reading-state.v2',
    );
    expect(getItem).toHaveBeenCalledWith(productionReadingStateStorageKey);
  });
  it('persists only Website v2 and preserves corrupt values instead of overwriting them', () => {
    window.localStorage.setItem('wrn.website-local-reading-state.v1', 'old-v1');
    window.localStorage.setItem('wrn.mobile-production-reading-state.v2', 'mobile');
    const store = createProductionReadingStateStore();
    expect(
      store.change({
        kind: 'save',
        articleId: firstProductionTestId,
        time: '2026-09-10T00:00:00.000Z',
      }).kind,
    ).toBe('ready');
    expect(createProductionReadingStateStore().load().state.entries[0]?.articleId).toBe(
      firstProductionTestId,
    );
    expect(window.localStorage.getItem('wrn.website-local-reading-state.v1')).toBe('old-v1');
    expect(window.localStorage.getItem('wrn.mobile-production-reading-state.v2')).toBe('mobile');
    window.localStorage.setItem(productionReadingStateStorageKey, 'corrupt');
    expect(store.change({ kind: 'clear', target: 'all' }).kind).toBe('read-only');
    expect(window.localStorage.getItem(productionReadingStateStorageKey)).toBe('corrupt');
  });
  it('main navigation leaves the reader and removes its query even for the current Home target', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', `/?article=${firstProductionTestId}#home`);
    render(<App />);
    expect(await screen.findByText('Self-authored browser test text.')).toBeVisible();
    const home = screen.getAllByRole('link', { name: 'Home' })[0]!;
    await user.click(home);
    await waitFor(() =>
      expect(new URL(window.location.href).searchParams.has('article')).toBe(false),
    );
    expect(await screen.findByText('Authored test 1')).toBeVisible();
    expect(screen.queryByText('Self-authored browser test text.')).not.toBeInTheDocument();
  });
});
