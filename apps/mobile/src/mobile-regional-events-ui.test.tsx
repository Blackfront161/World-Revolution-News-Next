import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import fixture from '../public/wrn-mobile-regional-events/v1/mobile-regional-events.json';
import { RegionalEventsStoreError } from './mobile-regional-events-store';
import { getUiCopy } from '@wrn/ui-language';
import type { RegionalEventBundleV1 } from '@wrn/content-contracts/mobile-regional-events-v1';
import {
  MobileRegionalEventsView,
  formatRegionalEventTime,
  useMobileRegionalEventsController,
  type RegionalEventsControllerAdapters,
  type RegionalEventsViewModel,
} from './mobile-regional-events-ui';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((next, fail) => {
    resolve = next;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const fixedNow = () => Date.parse('2026-09-01T00:00:00.000Z');

function ControllerProbe({ adapters }: Readonly<{ adapters: RegionalEventsControllerAdapters }>) {
  const controller = useMobileRegionalEventsController({ now: fixedNow, adapters });
  return (
    <>
      <output data-testid="phase">
        {controller.model.phase}:{controller.model.message}
      </output>
      <button type="button" onClick={controller.reload}>
        reload
      </button>
    </>
  );
}

function ControllerMutationProbe({
  adapters,
}: Readonly<{ adapters: RegionalEventsControllerAdapters }>) {
  const controller = useMobileRegionalEventsController({ now: fixedNow, adapters });
  return (
    <>
      <output data-testid="phase">
        {controller.model.phase}:{controller.model.message}
      </output>
      <button onClick={controller.saveSelection}>save</button>
      <button onClick={controller.clearSelection}>clear</button>
      <button onClick={controller.reload}>reload</button>
      <button
        onClick={() => {
          controller.setDraftContinentId('wrn-cont-test');
          controller.setDraftCountryId('wrn-country-test');
          controller.setDraftRegionId('wrn-region-test');
        }}
      >
        choose
      </button>
    </>
  );
}

const snapshot = {
  control: { generation: 0, active: null },
  safety: { entries: [] },
  bundles: { active: null },
} as never;

const activeSnapshot = () =>
  ({
    control: { generation: 0, active: { transportSha256: 'a'.repeat(64) } },
    safety: { entries: [] },
    bundles: {
      active: {
        rawJson: JSON.stringify(fixture),
        bundleRevision: 1,
        taxonomyRevision: 1,
        transportSha256: 'a'.repeat(64),
      },
    },
  }) as never;

const activeStore = (close = vi.fn()) => ({
  snapshot: async () => activeSnapshot(),
  saveCandidate: vi.fn(),
  activate: vi.fn(),
  close,
});

const bundle = fixture as unknown as RegionalEventBundleV1;
const model = (overrides: Partial<RegionalEventsViewModel> = {}): RegionalEventsViewModel => ({
  phase: 'ready',
  referenceInstant: '2026-09-01T00:00:00.000Z',
  bundle,
  safety: [],
  projection: { contentStatus: 'empty', deliveryStatus: 'online', events: [], lifecycle: [] },
  selectionStatus: 'inactive',
  selectionGeneration: 0,
  selectedRegionId: null,
  message: 'none',
  ...overrides,
});

function renderView(value: RegionalEventsViewModel, onReload = vi.fn()) {
  return render(
    <MobileRegionalEventsView
      model={value}
      copy={getUiCopy('de')}
      language="de"
      draftContinentId=""
      draftCountryId=""
      draftRegionId=""
      onContinent={vi.fn()}
      onCountry={vi.fn()}
      onRegion={vi.fn()}
      onSave={vi.fn()}
      onClear={vi.fn()}
      onReload={onReload}
    />,
  );
}

describe('G3-020 regional events view', () => {
  it('preserves a ready new run when an old recovery snapshot rejects', async () => {
    const recovery = deferred<never>();
    const oldRead = vi
      .fn()
      .mockResolvedValueOnce(activeSnapshot())
      .mockReturnValueOnce(recovery.promise);
    const oldClose = vi.fn(),
      newRead = vi.fn(async () => activeSnapshot());
    const save = vi.fn(async () => ({ regionId: 'wrn-region-test', generation: 4 }));
    const selection = {
      read: vi.fn(async () => ({
        kind: 'ready',
        record: { regionId: 'wrn-region-test', generation: 3 },
      })),
      save,
      clear: vi.fn(),
      close: vi.fn(),
    };
    const adapters = {
      openStore: vi
        .fn()
        .mockResolvedValueOnce({ ...activeStore(oldClose), snapshot: oldRead })
        .mockResolvedValueOnce({ ...activeStore(), snapshot: newRead }),
      load: vi
        .fn()
        .mockRejectedValueOnce(new Error('first load failed'))
        .mockResolvedValue({ kind: 'no-change' }),
      openSelection: vi.fn(async () => selection),
    } as unknown as RegionalEventsControllerAdapters;
    let instant = fixedNow();
    const now = () => instant;
    const { result } = renderHook(() => useMobileRegionalEventsController({ now, adapters }));
    await waitFor(() => expect(oldRead).toHaveBeenCalledTimes(2));
    instant += 60_000;
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.model.phase).toBe('ready'));
    const ready = result.current.model;
    expect(ready).toEqual(
      model({
        referenceInstant: '2026-09-01T00:01:00.000Z',
        selectionStatus: 'ready',
        selectionGeneration: 3,
        selectedRegionId: 'wrn-region-test',
      }),
    );
    await act(async () => {
      recovery.reject(new Error('old recovery failed'));
      await Promise.resolve();
    });
    expect(result.current.model).toEqual(ready);
    expect(oldClose).toHaveBeenCalledOnce();
    expect(oldRead).toHaveBeenCalledTimes(2);
    expect(newRead).toHaveBeenCalledOnce();
    expect(adapters.load).toHaveBeenCalledTimes(2);
    expect(adapters.openSelection).toHaveBeenCalledOnce();
    expect(selection.read).toHaveBeenCalledOnce();
    act(() => {
      result.current.setDraftContinentId('wrn-cont-test');
      result.current.setDraftCountryId('wrn-country-test');
      result.current.setDraftRegionId('wrn-region-test');
    });
    await act(async () => {
      await result.current.saveSelection();
    });
    expect(save).toHaveBeenCalledOnce();
    expect(result.current.model.selectionGeneration).toBe(4);
    expect(result.current.model.message).toBe('none');
  });

  it('consumes an unmounted recovery rejection without new work or warnings', async () => {
    const recovery = deferred<never>();
    const read = vi
        .fn()
        .mockResolvedValueOnce(activeSnapshot())
        .mockReturnValueOnce(recovery.promise),
      close = vi.fn();
    const adapters = {
      openStore: vi.fn(async () => ({ ...activeStore(close), snapshot: read })),
      load: vi.fn().mockRejectedValue(new Error('load failed')),
      openSelection: vi.fn(),
    } as unknown as RegionalEventsControllerAdapters;
    const warnings = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { result, unmount } = renderHook(() =>
        useMobileRegionalEventsController({ now: fixedNow, adapters }),
      );
      await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
      const before = result.current;
      unmount();
      await act(async () => {
        recovery.reject(new Error('late recovery'));
        await Promise.resolve();
      });
      expect(result.current).toBe(before);
      expect(close).toHaveBeenCalledOnce();
      expect(read).toHaveBeenCalledTimes(2);
      expect(adapters.load).toHaveBeenCalledOnce();
      expect(adapters.openStore).toHaveBeenCalledOnce();
      expect(adapters.openSelection).not.toHaveBeenCalled();
      expect(warnings).not.toHaveBeenCalled();
    } finally {
      warnings.mockRestore();
    }
  });

  it.each(['error', 'protected'] as const)(
    'keeps a current recovery rejection %s',
    async (phase) => {
      const recovery = deferred<never>();
      const read = vi
        .fn()
        .mockResolvedValueOnce(activeSnapshot())
        .mockReturnValueOnce(recovery.promise);
      const adapters = {
        openStore: vi.fn(async () => ({ ...activeStore(), snapshot: read })),
        load: vi.fn().mockRejectedValue(new Error('load failed')),
        openSelection: vi.fn(),
      } as unknown as RegionalEventsControllerAdapters;
      const { result } = renderHook(() =>
        useMobileRegionalEventsController({ now: fixedNow, adapters }),
      );
      await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
      await act(async () => {
        recovery.reject(
          phase === 'protected' ? new RegionalEventsStoreError('protected') : new Error('storage'),
        );
      });
      expect(result.current.model).toEqual(
        model({
          phase,
          bundle: null,
          projection: { contentStatus: phase, deliveryStatus: 'online', events: [], lifecycle: [] },
          selectionStatus: phase === 'protected' ? 'protected' : 'inactive',
        }),
      );
      expect(read).toHaveBeenCalledTimes(2);
      expect(adapters.load).toHaveBeenCalledOnce();
      expect(adapters.openSelection).not.toHaveBeenCalled();
    },
  );

  it('projects network failure with no active data as offline-none', async () => {
    const adapters = {
      openStore: vi.fn(async () => ({ ...activeStore(), snapshot: async () => snapshot })),
      load: vi.fn(async () => ({ kind: 'network-error' })),
      openSelection: vi.fn(),
    } as unknown as RegionalEventsControllerAdapters;
    const { result } = renderHook(() =>
      useMobileRegionalEventsController({ now: fixedNow, adapters }),
    );
    await waitFor(() => expect(result.current.model.phase).toBe('ready'));
    expect(result.current.model).toEqual(
      model({
        bundle: null,
        projection: {
          contentStatus: 'offline-none',
          deliveryStatus: 'offline-lkg',
          events: [],
          lifecycle: [],
        },
      }),
    );
    expect(adapters.openSelection).not.toHaveBeenCalled();
  });

  it.each(['network-error', 'invalid'] as const)(
    'preserves the truthful %s banner with active data',
    async (kind) => {
      const adapters = {
        openStore: vi.fn(async () => activeStore()),
        load: vi.fn(async () => ({ kind })),
        openSelection: vi.fn(async () => ({
          read: async () => ({ kind: 'inactive' }),
          close: vi.fn(),
        })),
      } as unknown as RegionalEventsControllerAdapters;
      const { result } = renderHook(() =>
        useMobileRegionalEventsController({ now: fixedNow, adapters }),
      );
      await waitFor(() => expect(result.current.model.phase).toBe('ready'));
      expect(result.current.model.bundle).toEqual(bundle);
      expect(result.current.model.projection.deliveryStatus).toBe(
        kind === 'network-error' ? 'offline-lkg' : 'invalid-update-lkg',
      );
      renderView(result.current.model);
      const copy = getUiCopy('de');
      expect(
        screen.getByText(
          kind === 'network-error' ? copy.eventsOfflineLkg : copy.eventsInvalidUpdateLkg,
          { exact: false },
        ),
      ).toBeVisible();
      expect(screen.queryByText(copy.eventsOnline, { exact: false })).toBeNull();
      expect(screen.getAllByRole('button', { name: copy.eventsReload })).toHaveLength(1);
    },
  );

  it.each([
    ['error', 'error'],
    ['protected', 'protected'],
    ['ready', 'error'],
    ['ready', 'offline-none'],
  ] as const)(
    'offers one usable reload for %s/%s without false freshness',
    async (phase, contentStatus) => {
      const reload = vi.fn(),
        copy = getUiCopy('de');
      renderView(
        model({
          phase,
          bundle: null,
          projection: {
            contentStatus,
            deliveryStatus: contentStatus === 'offline-none' ? 'offline-lkg' : 'online',
            events: [],
            lifecycle: [],
          },
        }),
        reload,
      );
      const button = screen.getByRole('button', { name: copy.eventsReload });
      expect(button).toBeVisible();
      expect(button).toBeEnabled();
      expect(screen.getAllByRole('button', { name: copy.eventsReload })).toHaveLength(1);
      await userEvent.setup().click(button);
      expect(reload).toHaveBeenCalledOnce();
      expect(screen.queryByRole('combobox')).toBeNull();
      expect(screen.queryByRole('button', { name: copy.eventsSaveSelection })).toBeNull();
      expect(screen.queryByRole('button', { name: copy.eventsClearSelection })).toBeNull();
      expect(screen.queryByText(copy.eventsOnline, { exact: false })).toBeNull();
      expect(screen.queryByText(copy.eventsOfflineLkg, { exact: false })).toBeNull();
      if (contentStatus === 'offline-none')
        expect(screen.getAllByText(copy.eventsOfflineNone)).toHaveLength(1);
    },
  );

  it('does not add a terminal reload control while initially loading', () => {
    renderView(model({ phase: 'loading', bundle: null }));
    expect(screen.queryByRole('button', { name: getUiCopy('de').eventsReload })).toBeNull();
  });
  it('keeps the empty production projection explicit and has no location control', () => {
    render(
      <MobileRegionalEventsView
        model={model()}
        copy={getUiCopy('en')}
        language="en"
        draftContinentId=""
        draftCountryId=""
        draftRegionId=""
        onContinent={vi.fn()}
        onCountry={vi.fn()}
        onRegion={vi.fn()}
        onSave={vi.fn()}
        onClear={vi.fn()}
        onReload={vi.fn()}
      />,
    );
    expect(screen.getByText(/No upcoming events are available/u)).toBeVisible();
    expect(screen.getByLabelText('Continent')).toBeVisible();
    expect(document.body.textContent).not.toMatch(/geolocation|permission|latitude|longitude/iu);
  });

  it('requires an explicit clear confirmation and exposes a reload-required alert', async () => {
    const user = userEvent.setup();
    const clear = vi.fn();
    render(
      <MobileRegionalEventsView
        model={model({ selectionStatus: 'ready', selectionGeneration: 1 })}
        copy={getUiCopy('en')}
        language="en"
        draftContinentId=""
        draftCountryId=""
        draftRegionId=""
        onContinent={vi.fn()}
        onCountry={vi.fn()}
        onRegion={vi.fn()}
        onSave={vi.fn()}
        onClear={clear}
        onReload={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Clear saved region' }));
    expect(screen.getByText(/Clear the saved region from/u)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(clear).toHaveBeenCalledOnce();
  });

  it('names the persisted canonical region visibly without treating it as a draft', () => {
    render(
      <MobileRegionalEventsView
        model={model({
          selectionStatus: 'ready',
          selectionGeneration: 1,
          selectedRegionId: 'wrn-region-test',
        })}
        copy={getUiCopy('de')}
        language="de"
        draftContinentId=""
        draftCountryId=""
        draftRegionId=""
        onContinent={vi.fn()}
        onCountry={vi.fn()}
        onRegion={vi.fn()}
        onSave={vi.fn()}
        onClear={vi.fn()}
        onReload={vi.fn()}
      />,
    );
    expect(screen.getByText('Testregion')).toBeVisible();
  });

  it('formats the instant in its canonical IANA zone rather than startLocal', () => {
    const event = {
      startInstant: '2026-10-25T00:30:00.000Z',
      startLocal: 'ignored',
      timeZone: 'Europe/Zurich',
    } as RegionalEventBundleV1['events'][number];
    expect(formatRegionalEventTime(event, 'de')).toMatch(/25\./u);
  });

  it('aborts every superseded run and closes an openStore handle that resolves after unmount', async () => {
    const first = deferred<{ snapshot(): Promise<typeof snapshot>; close(): void }>();
    const second = deferred<{ snapshot(): Promise<typeof snapshot>; close(): void }>();
    const firstClose = vi.fn();
    const secondClose = vi.fn();
    const adapters = {
      openStore: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise),
      openSelection: vi.fn(),
      load: vi.fn(),
    } as unknown as RegionalEventsControllerAdapters;
    const rendered = render(<ControllerProbe adapters={adapters} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'reload' }));
    rendered.unmount();
    await act(async () => {
      first.resolve({ snapshot: async () => snapshot, close: firstClose });
      second.resolve({ snapshot: async () => snapshot, close: secondClose });
      await Promise.resolve();
    });
    expect(firstClose).toHaveBeenCalledOnce();
    expect(secondClose).toHaveBeenCalledOnce();
  });

  it('renders a fail-closed reload-required state after selection storage open failure', async () => {
    const adapters = {
      openStore: async () => ({
        snapshot: async () => activeSnapshot(),
        saveCandidate: vi.fn(),
        activate: vi.fn(),
        close: vi.fn(),
      }),
      openSelection: async () => {
        throw new Error('selection storage unavailable');
      },
      load: async () => ({ kind: 'no-change' as const }),
    } as unknown as RegionalEventsControllerAdapters;
    render(<ControllerProbe adapters={adapters} />);
    await waitFor(() =>
      expect(screen.getByTestId('phase')).toHaveTextContent('ready:reload-required'),
    );
  });

  it('aborts initial plus two superseded loads and ignores every late completion', async () => {
    const loads = [
      deferred<{ kind: 'network-error' }>(),
      deferred<{ kind: 'network-error' }>(),
      deferred<{ kind: 'network-error' }>(),
    ];
    const signals: AbortSignal[] = [];
    const stores = [vi.fn(), vi.fn(), vi.fn()];
    const adapters = {
      openStore: vi.fn(async () => activeStore(stores.shift()!)),
      openSelection: vi.fn(async () => ({
        read: async () => ({ kind: 'inactive' as const, generation: 0 }),
        save: vi.fn(),
        clear: vi.fn(),
        close: vi.fn(),
      })),
      load: vi.fn((signal: AbortSignal) => {
        signals.push(signal);
        return loads[signals.length - 1]!.promise;
      }),
    } as unknown as RegionalEventsControllerAdapters;
    render(<ControllerProbe adapters={adapters} />);
    await waitFor(() => expect(signals).toHaveLength(1));
    await userEvent.setup().click(screen.getByRole('button', { name: 'reload' }));
    await waitFor(() => expect(signals).toHaveLength(2));
    await userEvent.setup().click(screen.getByRole('button', { name: 'reload' }));
    await waitFor(() => expect(signals).toHaveLength(3));
    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(true);
    await act(async () => {
      loads[0]!.resolve({ kind: 'network-error' });
      loads[1]!.resolve({ kind: 'network-error' });
      await Promise.resolve();
    });
    expect(screen.getByTestId('phase')).toHaveTextContent('loading:none');
    loads[2]!.resolve({ kind: 'network-error' });
    await waitFor(() => expect(screen.getByTestId('phase')).toHaveTextContent('ready:none'));
    expect(stores).toHaveLength(0);
  });

  it('closes a late snapshot handle exactly once and makes no late state write', async () => {
    const pending = deferred<unknown>();
    const close = vi.fn();
    const adapters = {
      openStore: async () => ({ snapshot: () => pending.promise, close }),
      openSelection: vi.fn(),
      load: vi.fn(),
    } as unknown as RegionalEventsControllerAdapters;
    const rendered = render(<ControllerProbe adapters={adapters} />);
    rendered.unmount();
    await act(async () => {
      pending.resolve(snapshot);
      await Promise.resolve();
    });
    expect(close).toHaveBeenCalledOnce();
    expect(adapters.load).not.toHaveBeenCalled();
  });

  it.each(['open', 'read'] as const)(
    'fails closed for selection %s errors and recovers only by reload',
    async (kind) => {
      const selection = {
        read: vi.fn(async () => {
          throw new Error('read');
        }),
        save: vi.fn(),
        clear: vi.fn(),
        close: vi.fn(),
      };
      const adapters = {
        openStore: vi.fn(async () => activeStore()),
        openSelection:
          kind === 'open'
            ? vi.fn(async () => {
                throw new Error('open');
              })
            : vi.fn(async () => selection),
        load: vi.fn(async () => ({ kind: 'no-change' as const })),
      } as unknown as RegionalEventsControllerAdapters;
      render(<ControllerProbe adapters={adapters} />);
      await waitFor(() =>
        expect(screen.getByTestId('phase')).toHaveTextContent('ready:reload-required'),
      );
      expect(selection.close).toHaveBeenCalledTimes(kind === 'read' ? 1 : 0);
      await userEvent.setup().click(screen.getByRole('button', { name: 'reload' }));
      await waitFor(() => expect(adapters.openStore).toHaveBeenCalledTimes(2));
    },
  );

  it.each(['save', 'clear'] as const)(
    'turns a selection %s rejection into reload-required without retry',
    async (operation) => {
      const selection = {
        read: async () => ({
          kind: 'ready' as const,
          record: { regionId: 'wrn-region-test', generation: 1 },
        }),
        save: vi.fn(async () => {
          throw new Error('write');
        }),
        clear: vi.fn(async () => {
          throw new Error('verify');
        }),
        close: vi.fn(),
      };
      const adapters = {
        openStore: async () => activeStore(),
        openSelection: async () => selection,
        load: async () => ({ kind: 'no-change' as const }),
      } as unknown as RegionalEventsControllerAdapters;
      render(<ControllerMutationProbe adapters={adapters} />);
      await waitFor(() => expect(screen.getByTestId('phase')).toHaveTextContent('ready:none'));
      await userEvent.setup().click(screen.getByRole('button', { name: 'choose' }));
      await userEvent.setup().click(screen.getByRole('button', { name: operation }));
      await waitFor(() =>
        expect(screen.getByTestId('phase')).toHaveTextContent('ready:reload-required'),
      );
      expect(selection[operation]).toHaveBeenCalledOnce();
    },
  );

  it.each(['save', 'clear'] as const)(
    'ignores a late %s rejection after a fully successful reload and keeps the new mutation usable',
    async (operation) => {
      const pending = deferred<never>();
      const oldMutation = vi.fn(() => pending.promise);
      const newMutation = vi.fn(async () =>
        operation === 'save' ? { regionId: 'wrn-region-test', generation: 2 } : undefined,
      );
      const selection = (mutation: () => Promise<unknown>) => ({
        read: async () => ({
          kind: 'ready' as const,
          record: { regionId: 'wrn-region-test', generation: 1 },
        }),
        save: operation === 'save' ? mutation : vi.fn(),
        clear: operation === 'clear' ? mutation : vi.fn(),
        close: vi.fn(),
      });
      const adapters = {
        openStore: vi.fn(async () => activeStore()),
        openSelection: vi
          .fn()
          .mockResolvedValueOnce(selection(oldMutation))
          .mockResolvedValueOnce(selection(newMutation)),
        load: vi.fn(async () => ({ kind: 'no-change' as const })),
      } as unknown as RegionalEventsControllerAdapters;
      render(<ControllerMutationProbe adapters={adapters} />);
      const user = userEvent.setup();
      await waitFor(() => expect(screen.getByTestId('phase')).toHaveTextContent('ready:none'));
      await user.click(screen.getByRole('button', { name: 'choose' }));
      await user.click(screen.getByRole('button', { name: operation }));
      await waitFor(() => expect(oldMutation).toHaveBeenCalledOnce());
      await user.click(screen.getByRole('button', { name: 'reload' }));
      await waitFor(() => expect(adapters.openSelection).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(screen.getByTestId('phase')).toHaveTextContent('ready:none'));
      await act(async () => {
        pending.reject(new Error('old run rejected'));
        await Promise.resolve();
      });
      expect(screen.getByTestId('phase')).toHaveTextContent('ready:none');
      await user.click(screen.getByRole('button', { name: 'choose' }));
      await user.click(screen.getByRole('button', { name: operation }));
      await waitFor(() => expect(newMutation).toHaveBeenCalledOnce());
    },
  );

  it.each(['save', 'clear'] as const)(
    'ignores a late %s rejection after unmount without a React warning',
    async (operation) => {
      const pending = deferred<never>();
      const mutation = vi.fn(() => pending.promise);
      const selection = {
        read: async () => ({
          kind: 'ready' as const,
          record: { regionId: 'wrn-region-test', generation: 1 },
        }),
        save: operation === 'save' ? mutation : vi.fn(),
        clear: operation === 'clear' ? mutation : vi.fn(),
        close: vi.fn(),
      };
      const adapters = {
        openStore: vi.fn(async () => activeStore()),
        openSelection: vi.fn(async () => selection),
        load: vi.fn(async () => ({ kind: 'no-change' as const })),
      } as unknown as RegionalEventsControllerAdapters;
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      try {
        const rendered = render(<ControllerMutationProbe adapters={adapters} />);
        const user = userEvent.setup();
        await waitFor(() => expect(screen.getByTestId('phase')).toHaveTextContent('ready:none'));
        await user.click(screen.getByRole('button', { name: 'choose' }));
        await user.click(screen.getByRole('button', { name: operation }));
        await waitFor(() => expect(mutation).toHaveBeenCalledOnce());
        rendered.unmount();
        await act(async () => {
          pending.reject(new Error('unmounted run rejected'));
          await Promise.resolve();
        });
        expect(consoleError).not.toHaveBeenCalled();
      } finally {
        consoleError.mockRestore();
      }
    },
  );

  it.each(['saveCandidate', 'activate'] as const)('stops after a late %s', async (stage) => {
    const pending = deferred<unknown>();
    const saveCandidate = vi.fn(() => pending.promise);
    const activate = vi.fn(() => pending.promise);
    if (stage === 'activate') saveCandidate.mockResolvedValue({ control: { generation: 1 } });
    const adapters = {
      openStore: async () => ({
        snapshot: async () => activeSnapshot(),
        saveCandidate,
        activate,
        close: vi.fn(),
      }),
      openSelection: vi.fn(),
      load: async () => ({
        kind: 'ready' as const,
        rawJson: JSON.stringify(fixture),
        transportSha256: 'a'.repeat(64),
        bundle: fixture as never,
      }),
    } as unknown as RegionalEventsControllerAdapters;
    const rendered = render(<ControllerProbe adapters={adapters} />);
    await waitFor(() =>
      expect(stage === 'saveCandidate' ? saveCandidate : activate).toHaveBeenCalledOnce(),
    );
    rendered.unmount();
    await act(async () => {
      pending.resolve(activeSnapshot());
      await Promise.resolve();
    });
    expect(stage === 'saveCandidate' ? activate : adapters.openSelection).not.toHaveBeenCalled();
  });

  it.each(['open', 'read'] as const)(
    'closes a late selection %s handle exactly once',
    async (stage) => {
      const pending = deferred<unknown>();
      const selectionClose = vi.fn();
      const read = vi.fn(() => pending.promise);
      const selection = { read, save: vi.fn(), clear: vi.fn(), close: selectionClose };
      const openSelection = vi.fn(() => (stage === 'open' ? pending.promise : selection));
      const adapters = {
        openStore: async () => activeStore(),
        openSelection,
        load: async () => ({ kind: 'no-change' as const }),
      } as unknown as RegionalEventsControllerAdapters;
      const rendered = render(<ControllerProbe adapters={adapters} />);
      await waitFor(() => expect(openSelection).toHaveBeenCalledOnce());
      if (stage === 'read') await waitFor(() => expect(read).toHaveBeenCalledOnce());
      rendered.unmount();
      await act(async () => {
        pending.resolve(stage === 'open' ? selection : { kind: 'inactive', generation: 0 });
        await Promise.resolve();
      });
      expect(selectionClose).toHaveBeenCalledOnce();
    },
  );
});
