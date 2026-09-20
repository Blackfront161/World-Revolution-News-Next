import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeProductionOfflineFixture,
  firstProductionTestId,
} from '../../../tests/e2e/production-content-offline-harness';
import { createProductionContentOfflineController } from './production-content-offline-controller';
import {
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
} from './production-reading-state';
import { App } from './App';

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
