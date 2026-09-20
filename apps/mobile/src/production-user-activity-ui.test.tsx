import { createRef, StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalPersonalizationState } from '@wrn/domain';
import { getUiCopy, uiLanguageIds } from '@wrn/ui-language';
import { getProductionActivityCopy } from '@wrn/ui-language/production-content';
import { ProductionContentArea } from './production-content-ui';
import { useProductionContentOfflineController } from './content-offline-ui';
import { productionTestResult, testProductionId } from './production-content-test-data';
import { productionReadingStateStorageKey } from './production-reading-state';
import {
  emptyActivityState,
  recordActivityVisit,
  freezeActivityState,
  ProductionUserActivityError,
  type ActivityState,
} from '../../../packages/browser-content/src/production-user-activity';
import { openProductionUserActivityStore } from '../../../packages/browser-content/src/production-user-activity/store';
import { useProductionUserActivity } from '../../../packages/browser-content/src/production-user-activity/use-activity';
import type { ActivityContext } from '../../../packages/browser-content/src/production-user-activity/controller';

vi.mock('./content-offline-ui', () => ({ useProductionContentOfflineController: vi.fn() }));
vi.mock('../../../packages/browser-content/src/production-user-activity/store', () => ({
  openProductionUserActivityStore: vi.fn(),
}));
let stored: ActivityState;
const closed: ReturnType<typeof vi.fn>[] = [];
const dialogDescriptors = ['showModal', 'close'].map(
  (key) => [key, Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, key)] as const,
);
const save = vi.fn(async (next: ActivityState, generation: number, signal?: AbortSignal) => {
  if (signal?.aborted) throw new ProductionUserActivityError('aborted');
  if (generation !== stored.generation) throw new ProductionUserActivityError('conflict');
  stored = freezeActivityState(next);
  return stored;
});
const preferences = createLocalPersonalizationState({
  interestIds: [],
  regionIds: [],
  contentLanguageIds: ['en'],
})!;
const input = () => ({
  target: 'following',
  articleId: null as string | null,
  archiveRoute: undefined,
  language: 'en' as const,
  headingRef: createRef<HTMLHeadingElement>(),
  onRead: vi.fn(),
  onArchiveRead: vi.fn(),
  onCloseReader: vi.fn(),
  onCloseArchive: vi.fn(),
  onOpenArchive: vi.fn(),
  shareAdapter: { share: vi.fn(async () => undefined) },
  preferences,
});
beforeEach(async () => {
  stored = emptyActivityState();
  save.mockClear();
  closed.length = 0;
  vi.mocked(openProductionUserActivityStore).mockImplementation(async () => {
    const close = vi.fn();
    closed.push(close);
    return {
      snapshot: async () => stored,
      save,
      clear: async (generation) => save(emptyActivityState(generation + 1), generation),
      close,
    };
  });
  const result = await productionTestResult();
  vi.mocked(useProductionContentOfflineController).mockReturnValue({
    result,
    operation: null,
    operationResult: result,
    invoke: vi.fn(async () => result),
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const [key, descriptor] of dialogDescriptors) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, key, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, key);
  }
});

describe('actual mobile local overview integration', () => {
  it('retries a cancelled visit after a filter change without treating the filter as new availability', async () => {
    const first = {
      id: testProductionId,
      admittedContentSha256: 'a'.repeat(64),
      selected: true,
      readOrSaved: false,
    };
    const second = { ...first, id: 'wrn-art-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
    stored = recordActivityVisit({ ...emptyActivityState(), enabled: true }, [first]);
    let finish!: (value: ActivityState) => void;
    const pending = new Promise<ActivityState>((resolve) => {
      finish = resolve;
    });
    const snapshot = vi
      .fn()
      .mockResolvedValueOnce(stored)
      .mockImplementationOnce(() => pending)
      .mockImplementation(async () => stored);
    vi.mocked(openProductionUserActivityStore).mockResolvedValue({
      snapshot,
      save,
      clear: vi.fn(),
      close: vi.fn(),
    });
    function Subject({ context }: { context: ActivityContext }) {
      const activity = useProductionUserActivity('mobile', context, {
        supported: false,
        permission: () => 'denied',
        request: async () => 'denied',
        show: () => ({ close() {} }),
      });
      return <output>{activity.view?.newIds.length ?? 0}</output>;
    }
    const context: ActivityContext = {
      key: 'following:both',
      active: true,
      following: true,
      personalized: true,
      articles: [first, second],
    };
    const rendered = render(<Subject context={context} />);
    await waitFor(() => expect(snapshot).toHaveBeenCalledTimes(2));
    rendered.rerender(
      <Subject
        context={{
          ...context,
          key: 'following:first',
          articles: [first, { ...second, selected: false }],
        }}
      />,
    );
    finish(stored);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(stored.availableIds).toEqual([first.id, second.id]);
    expect(screen.getByRole('status')).toHaveTextContent('0');
  });
  it('cancels a pending notification opt-in when explicit choices are removed in the live component', async () => {
    let grant!: () => void;
    const request = vi.fn(
      () =>
        new Promise<NotificationPermission>((resolve) => {
          grant = () => resolve('granted');
        }),
    );
    class NotificationProbe {
      static permission = 'default';
      static requestPermission = request;
      close() {}
    }
    vi.stubGlobal('Notification', NotificationProbe);
    vi.stubGlobal('isSecureContext', true);
    const props = input(),
      copy = getProductionActivityCopy('en');
    const rendered = render(<ProductionContentArea {...props} />);
    const enable = await screen.findByRole('button', { name: copy.enable });
    await waitFor(() => expect(enable).toBeEnabled());
    fireEvent.click(enable);
    await screen.findByText(copy.firstVisit);
    fireEvent.click(screen.getByText(copy.localNotifications, { selector: 'summary' }));
    fireEvent.click(screen.getByRole('button', { name: copy.enableNotifications }));
    expect(request).toHaveBeenCalledTimes(1);
    rendered.rerender(<ProductionContentArea {...props} preferences={undefined} />);
    await act(async () => grant());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: copy.enableNotifications })).toBeDisabled(),
    );
    expect(stored.notifications.enabled).toBe(false);
  });
  it('does not offer activation before the current content guard completes', async () => {
    const result = await productionTestResult();
    let complete!: () => void;
    const pending = new Promise<typeof result>((resolve) => {
      complete = () => resolve(result);
    });
    vi.mocked(useProductionContentOfflineController).mockReturnValue({
      result,
      operation: null,
      operationResult: result,
      invoke: vi.fn(() => pending),
    });
    render(<ProductionContentArea {...input()} />);
    const enable = await screen.findByRole('button', {
      name: getProductionActivityCopy('en').enable,
    });
    expect(enable).toBeDisabled();
    fireEvent.click(enable);
    expect(save).not.toHaveBeenCalled();
    complete();
    await waitFor(() => expect(enable).toBeEnabled());
    fireEvent.click(enable);
    await screen.findByText(getProductionActivityCopy('en').firstVisit);
    expect(stored.enabled).toBe(true);
  });
  it('survives StrictMode, defaults off, requires explicit choices and leaves other routes without the panel', async () => {
    const props = input();
    const rendered = render(
      <StrictMode>
        <ProductionContentArea {...props} preferences={undefined} />
      </StrictMode>,
    );
    const enable = await screen.findByRole('button', {
      name: getProductionActivityCopy('en').enable,
    });
    expect(enable).toBeDisabled();
    expect(save).not.toHaveBeenCalled();
    rendered.rerender(
      <StrictMode>
        <ProductionContentArea {...props} />
      </StrictMode>,
    );
    await waitFor(() => expect(enable).toBeEnabled());
    fireEvent.click(enable);
    await screen.findByText(getProductionActivityCopy('en').firstVisit);
    expect(stored.availableIds).toContain(testProductionId);
    expect(stored.notifications.enabled).toBe(false);
    expect(
      vi
        .mocked(openProductionUserActivityStore)
        .mock.calls.every(([client]) => client === 'mobile'),
    ).toBe(true);
    for (const target of ['home', 'saved', 'discover']) {
      rendered.rerender(
        <StrictMode>
          <ProductionContentArea {...props} target={target} />
        </StrictMode>,
      );
      await waitFor(() =>
        expect(
          screen.queryByRole('heading', { name: getProductionActivityCopy('en').heading }),
        ).toBeNull(),
      );
    }
    rendered.unmount();
    expect(closed.every((close) => close.mock.calls.length > 0)).toBe(true);
  });

  it('confirms clear with keyboard focus, leaves reading data intact and remains disabled after remount', async () => {
    const props = input(),
      copy = getProductionActivityCopy('en');
    const rendered = render(<ProductionContentArea {...props} />);
    const enable = await screen.findByRole('button', { name: copy.enable });
    await waitFor(() => expect(enable).toBeEnabled());
    fireEvent.click(enable);
    await screen.findByText(copy.firstVisit);
    const reading = localStorage.getItem(productionReadingStateStorageKey);
    const trigger = screen.getByRole('button', { name: copy.reset });
    fireEvent.click(trigger);
    let dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: getUiCopy('en').cancel })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(stored.enabled).toBe(true);
    fireEvent.click(trigger);
    dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: getUiCopy('en').deleteNow }));
    await screen.findByRole('button', { name: copy.enable });
    expect(stored.enabled).toBe(false);
    expect(stored.availableIds).toEqual([]);
    expect(localStorage.getItem(productionReadingStateStorageKey)).toBe(reading);
    rendered.unmount();
    render(<ProductionContentArea {...props} />);
    await screen.findByRole('button', { name: copy.enable });
    expect(stored.enabled).toBe(false);
  });

  it('distinguishes unsupported notifications from denial and offers all nine UI translations', async () => {
    const props = input();
    const rendered = render(<ProductionContentArea {...props} />);
    const enable = await screen.findByRole('button', {
      name: getProductionActivityCopy('en').enable,
    });
    await waitFor(() => expect(enable).toBeEnabled());
    fireEvent.click(enable);
    await screen.findByText(getProductionActivityCopy('en').firstVisit);
    for (const language of uiLanguageIds) {
      rendered.rerender(<ProductionContentArea {...props} language={language} />);
      const copy = getProductionActivityCopy(language);
      expect(screen.getByRole('heading', { name: copy.heading })).toBeInTheDocument();
      expect(screen.getByText(copy.notificationsUnsupported)).toBeInTheDocument();
      expect(screen.queryByText(copy.permissionDenied)).toBeNull();
      expect(screen.getByLabelText(copy.quietStart)).toHaveValue('22:00');
    }
  });
});
