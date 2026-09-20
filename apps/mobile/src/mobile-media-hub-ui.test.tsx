import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMobileMediaCopy } from '@wrn/ui-language';
import { MobileMediaCatalogError } from './mobile-media-catalog-store';
import {
  MobileMediaHubPage,
  MobileMediaHubView,
  createControllerResumeHandle,
  type MobileMediaHubControllerAdapters,
  type MobileMediaHubViewModel,
} from './mobile-media-hub-ui';

const at = Date.parse('2030-01-01T00:00:00.000Z');
const hash = 'a'.repeat(64);
const empty = (kind: MobileMediaHubViewModel['kind'] = 'empty'): MobileMediaHubViewModel =>
  Object.freeze({
    kind,
    identity: null,
    episodeId: null,
    audioAssetId: null,
    audioAssetHash: null,
    releaseRevision: null,
    expiresAt: null,
    title: null,
    summary: null,
    source: null,
    durationMs: null,
    attribution: null,
    territory: null,
    delivery: null,
    loading: false,
    bootstrapFailure: false,
    bootstrap: 'none',
    recovery: false,
    recoveryBusy: false,
    player: { playback: 'idle' as const, availability: 'local' as const, error: null },
    resume: 'idle',
  });

const ready = (expiresAt = at + 1_000): MobileMediaHubViewModel =>
  Object.freeze({
    ...empty('ready'),
    identity: 'test-context',
    episodeId: 'presentational-episode',
    audioAssetId: 'presentational-asset',
    audioAssetHash: hash,
    releaseRevision: 1,
    expiresAt,
    title: { en: 'Escaped <em> local title' },
    summary: { en: 'A local summary.' },
    source: { en: 'Local source' },
    durationMs: 125_000,
    attribution: 'Local audio attribution',
    territory: 'global',
    delivery: 'local-no-third-party',
  });

function catalogSnapshot(expiresAt: number) {
  return {
    control: {
      generation: 1,
      active: 'active' as const,
      candidate: null,
      previous: null,
    },
    safety: { generation: 1, revision: 1, entries: [] },
    bundles: {
      active: {
        revision: 1,
        transportSha256: 'b'.repeat(64),
        rawBundle: {
          releaseRaw: JSON.stringify({ validUntil: new Date(expiresAt).toISOString() }),
          documentsRaw: {
            manifest: JSON.stringify({
              episodes: [
                {
                  id: 'episode',
                  sourceId: 'source',
                  seriesId: 'series',
                  audioAssetId: 'asset',
                  durationMs: 100,
                  title: { en: 'Local title' },
                  summary: { en: 'Local summary' },
                },
              ],
              assets: [
                {
                  id: 'asset',
                  kind: 'audio',
                  mime: 'audio/wav',
                  path: '/local.wav',
                  bytes: 4,
                  sha256: hash,
                },
              ],
              series: [{ id: 'series' }],
            }),
            admission: JSON.stringify({
              sources: [
                {
                  id: 'source',
                  displayName: { en: 'Local source' },
                  validUntil: new Date(expiresAt).toISOString(),
                },
              ],
            }),
            rights: JSON.stringify({
              rights: [
                {
                  assetId: 'asset',
                  status: 'allowed',
                  expiresAt: new Date(expiresAt).toISOString(),
                  attribution: 'Local attribution',
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
      candidate: null,
      previous: null,
    },
  };
}

function adaptersFor(snapshot: ReturnType<typeof catalogSnapshot>): {
  adapters: MobileMediaHubControllerAdapters;
  close: ReturnType<typeof vi.fn>;
} {
  const close = vi.fn();
  const store = {
    snapshot: vi.fn(async () => snapshot),
    close,
  };
  return {
    adapters: {
      openCatalog: vi.fn(async () => store as never),
      openResume: vi.fn(async () => ({ close: vi.fn() }) as never),
      load: vi.fn(async () => ({ kind: 'no-request' as const })),
    },
    close,
  };
}

afterEach(() => vi.useRealTimers());

async function flush() {
  await act(async () => {
    for (let index = 0; index < 10; index += 1) await Promise.resolve();
  });
}

type Catalog = Awaited<ReturnType<MobileMediaHubControllerAdapters['openCatalog']>>;
type Snapshot = Awaited<ReturnType<Catalog['snapshot']>>;

function recoveryFixture() {
  const active = catalogSnapshot(at + 60_000).bundles.active;
  let value: Snapshot = {
    control: {
      recordVersion: 1,
      key: 'control',
      generation: 1,
      highestAcceptedRevision: 1,
      active: null,
      candidate: 'candidate',
      previous: null,
    },
    safety: {
      recordVersion: 1,
      key: 'safety',
      generation: 0,
      revision: 0,
      raw: '',
      entries: [],
      references: [],
    },
    bundles: {
      active: null,
      previous: null,
      candidate: {
        ...active,
        recordVersion: 1,
        slot: 'candidate',
        rawBundle: {
          ...active.rawBundle,
          documentsRaw: { ...active.rawBundle.documentsRaw, lifecycle: '{}', revocation: '{}' },
        },
      },
    },
  };
  const snapshot = vi.fn(async () => value);
  const activate = vi.fn(async (generation: number) => {
    if (generation !== value.control.generation || value.bundles.candidate === null)
      throw new MobileMediaCatalogError('conflict');
    value = {
      ...value,
      control: { ...value.control, generation: generation + 1, active: 'active', candidate: null },
      bundles: {
        active: { ...value.bundles.candidate, slot: 'active' },
        candidate: null,
        previous: null,
      },
    };
    return value;
  });
  const close = vi.fn();
  const saveCandidate = vi.fn<Catalog['saveCandidate']>();
  const rollback = vi.fn<Catalog['rollback']>();
  const adapters: MobileMediaHubControllerAdapters = {
    openCatalog: vi.fn(async () => ({ snapshot, activate, saveCandidate, rollback, close })),
    openResume: vi.fn(async () => ({ close: vi.fn() }) as never),
    load: vi.fn(async () => ({ kind: 'no-request' as const })),
  };
  const mount = () =>
    render(
      <MobileMediaHubPage
        copy={getMobileMediaCopy('en')}
        language="en"
        now={() => at}
        headingRef={{ current: null }}
        adapters={adapters}
      />,
    );
  return {
    adapters,
    snapshot,
    activate,
    close,
    saveCandidate,
    rollback,
    mount,
    get: () => value,
    set: (next: Snapshot) => {
      value = next;
    },
  };
}

describe('R1 recovery at the public Catalog adapter with the real Hub', () => {
  const action = () => screen.getByRole('button', { name: 'Complete local preparation' });

  it('drops the interrupted hint when another run has already activated the Catalog', async () => {
    const fixture = recoveryFixture();
    const observed = fixture.get();
    fixture.snapshot.mockResolvedValueOnce(observed);
    fixture.set({
      ...observed,
      control: { ...observed.control, generation: 2, active: 'active', candidate: null },
      bundles: {
        active: { ...observed.bundles.candidate!, slot: 'active' },
        candidate: null,
        previous: null,
      },
    });
    fixture.mount();
    await screen.findByText('Local title');
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(getMobileMediaCopy('en').ready);
    expect(screen.queryByRole('button', { name: 'Complete local preparation' })).toBeNull();
    expect(fixture.activate).not.toHaveBeenCalled();
    expect(fixture.adapters.load).not.toHaveBeenCalled();
  });

  it.each(['generation', 'raw', 'bundle-metadata'] as const)(
    'requires a new confirmation after a %s change before the fresh read',
    async (change) => {
      const fixture = recoveryFixture();
      fixture.mount();
      await screen.findByRole('button', { name: 'Complete local preparation' });
      const changed = structuredClone(fixture.get());
      const next: Snapshot =
        change === 'generation'
          ? { ...changed, control: { ...changed.control, generation: 2 } }
          : {
              ...changed,
              bundles: {
                ...changed.bundles,
                candidate: {
                  ...changed.bundles.candidate!,
                  ...(change === 'raw'
                    ? {
                        rawBundle: {
                          ...changed.bundles.candidate!.rawBundle,
                          releaseRaw: JSON.stringify({
                            validUntil: new Date(at + 120_000).toISOString(),
                          }),
                        },
                      }
                    : { transportSha256: 'c'.repeat(64) }),
                },
              },
            };
      fixture.set(next);
      const bytes = JSON.stringify(next);
      await userEvent.setup().click(action());
      await flush();
      expect(fixture.activate).not.toHaveBeenCalled();
      expect(JSON.stringify(fixture.get())).toBe(bytes);
      expect(action()).toBeEnabled();
      expect(document.querySelector('audio')).toBeNull();
      expect(fixture.adapters.load).not.toHaveBeenCalled();
      expect(fixture.saveCandidate).not.toHaveBeenCalled();
      expect(fixture.rollback).not.toHaveBeenCalled();
    },
  );

  it.each(['invalid-candidate', 'protected', 'storage-failure', 'unavailable'] as const)(
    'shows the existing %s outcome without changing saved bytes',
    async (code) => {
      const fixture = recoveryFixture();
      fixture.activate.mockRejectedValueOnce(new MobileMediaCatalogError(code));
      const bytes = JSON.stringify(fixture.get());
      fixture.mount();
      await screen.findByRole('button', { name: 'Complete local preparation' });
      await userEvent.setup().click(action());
      await flush();
      const copy = getMobileMediaCopy('en');
      expect(screen.getByRole(code === 'protected' ? 'alert' : 'status')).toHaveTextContent(
        code === 'invalid-candidate'
          ? copy.unavailable
          : code === 'protected'
            ? copy.protected
            : copy.storageFailure,
      );
      expect(screen.queryByRole('button', { name: copy.completePreparation })).toBeNull();
      expect(screen.getByRole('button', { name: copy.retry })).toBeVisible();
      expect(fixture.activate).toHaveBeenCalledExactlyOnceWith(1);
      expect(JSON.stringify(fixture.get())).toBe(bytes);
      expect(document.querySelector('audio')).toBeNull();
      expect(fixture.saveCandidate).not.toHaveBeenCalled();
    },
  );

  it('keeps an inactive Previous state protected without trying recovery', async () => {
    const fixture = recoveryFixture();
    const value = fixture.get();
    fixture.set({
      ...value,
      control: { ...value.control, candidate: null, previous: 'previous' },
      bundles: {
        active: null,
        candidate: null,
        previous: { ...value.bundles.candidate!, slot: 'previous' },
      },
    });
    const bytes = JSON.stringify(fixture.get());
    fixture.mount();
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent(getMobileMediaCopy('en').protected);
    expect(screen.queryByRole('button', { name: 'Complete local preparation' })).toBeNull();
    expect(fixture.activate).not.toHaveBeenCalled();
    expect(fixture.adapters.load).not.toHaveBeenCalled();
    expect(JSON.stringify(fixture.get())).toBe(bytes);
  });

  it('preserves a protected error while rereading a recovery conflict', async () => {
    const fixture = recoveryFixture();
    fixture.activate.mockImplementationOnce(async () => {
      fixture.snapshot.mockRejectedValueOnce(new MobileMediaCatalogError('protected'));
      throw new MobileMediaCatalogError('conflict');
    });
    const bytes = JSON.stringify(fixture.get());
    fixture.mount();
    await screen.findByRole('button', { name: 'Complete local preparation' });
    await userEvent.setup().click(action());
    await flush();
    expect(screen.getByRole('alert')).toHaveTextContent(getMobileMediaCopy('en').protected);
    expect(JSON.stringify(fixture.get())).toBe(bytes);
    expect(fixture.activate).toHaveBeenCalledOnce();
  });

  it('keeps a Previous state that replaced the confirmed Candidate protected', async () => {
    const fixture = recoveryFixture();
    fixture.mount();
    await screen.findByRole('button', { name: 'Complete local preparation' });
    const value = fixture.get();
    fixture.set({
      ...value,
      control: { ...value.control, generation: 2, candidate: null, previous: 'previous' },
      bundles: {
        active: null,
        candidate: null,
        previous: { ...value.bundles.candidate!, slot: 'previous' },
      },
    });
    const bytes = JSON.stringify(fixture.get());
    await userEvent.setup().click(action());
    await flush();
    expect(screen.getByRole('alert')).toHaveTextContent(getMobileMediaCopy('en').protected);
    expect(fixture.activate).not.toHaveBeenCalled();
    expect(JSON.stringify(fixture.get())).toBe(bytes);
  });

  it('coalesces a double click while the confirmation read is pending', async () => {
    const fixture = recoveryFixture();
    fixture.mount();
    await screen.findByRole('button', { name: 'Complete local preparation' });
    let release!: (value: Snapshot) => void;
    fixture.snapshot.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const before = fixture.snapshot.mock.calls.length;
    await userEvent.setup().dblClick(action());
    expect(action()).toBeDisabled();
    expect(fixture.snapshot).toHaveBeenCalledTimes(before + 1);
    expect(fixture.activate).not.toHaveBeenCalled();
    await act(async () => release(fixture.get()));
    await screen.findByText('Local title');
    expect(fixture.activate).toHaveBeenCalledExactlyOnceWith(1);
    expect(fixture.get().control.generation).toBe(2);
  });

  it('does not activate when unmounted during the fresh confirmation read', async () => {
    const fixture = recoveryFixture();
    const mounted = fixture.mount();
    await screen.findByRole('button', { name: 'Complete local preparation' });
    let release!: (value: Snapshot) => void;
    fixture.snapshot.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const bytes = JSON.stringify(fixture.get());
    await userEvent.setup().click(action());
    mounted.unmount();
    await act(async () => release(fixture.get()));
    expect(fixture.activate).not.toHaveBeenCalled();
    expect(fixture.close).toHaveBeenCalledOnce();
    expect(JSON.stringify(fixture.get())).toBe(bytes);
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('P4-B mobile media presentation', () => {
  it.each(['older-ready', 'older-reject'] as const)(
    'ignores %s without replacing the latest projection or expiry timer',
    async (outcome) => {
      vi.resetModules();
      const pending: Array<{
        resolve: (value: MobileMediaHubViewModel) => void;
        reject: (reason: unknown) => void;
      }> = [];
      const hub = {
        projection: vi.fn(
          () =>
            new Promise<MobileMediaHubViewModel>((resolve, reject) => {
              pending.push({ resolve, reject });
            }),
        ),
        player: {
          start: vi.fn(async () => undefined),
          pause: vi.fn(),
          state: vi.fn(() => ({
            playback: 'idle' as const,
            availability: 'local' as const,
            error: null,
          })),
        },
        resumeStatus: vi.fn(() => 'idle' as const),
        resumeOnUserAction: vi.fn(async () => undefined),
        unmount: vi.fn(),
      };
      vi.doMock('./mobile-media-hub', () => ({ createMobileMediaHub: () => hub }));
      const timers = vi.spyOn(window, 'setTimeout');
      const clears = vi.spyOn(window, 'clearTimeout');
      try {
        const { MobileMediaHubPage: IsolatedPage } = await import('./mobile-media-hub-ui');
        const { adapters } = adaptersFor(catalogSnapshot(at + 1_000));
        render(
          <IsolatedPage
            copy={getMobileMediaCopy('en')}
            language="en"
            now={() => at}
            headingRef={{ current: null }}
            adapters={adapters}
          />,
        );
        await waitFor(() => expect(pending).toHaveLength(1));
        pending[0]!.resolve(ready());
        await flush();
        await userEvent.setup().click(screen.getByRole('button', { name: 'Play' }));
        await waitFor(() => expect(pending).toHaveLength(3));
        pending[2]!.resolve(outcome === 'older-ready' ? empty('blocked') : ready());
        await flush();
        const beforeLate = [timers.mock.calls.length, clears.mock.calls.length];
        if (outcome === 'older-ready') pending[1]!.resolve(ready());
        else pending[1]!.reject(new Error('late projection failure'));
        await flush();
        expect([timers.mock.calls.length, clears.mock.calls.length]).toEqual(beforeLate);
        expect(hub.projection).toHaveBeenCalledTimes(3);
        if (outcome === 'older-ready') {
          expect(screen.getByRole('alert')).toHaveTextContent(getMobileMediaCopy('en').blocked);
          expect(screen.queryByText('Escaped <em> local title')).toBeNull();
        } else {
          expect(screen.getByText('Escaped <em> local title')).toBeVisible();
          expect(screen.getAllByRole('status')[0]).toHaveTextContent(
            getMobileMediaCopy('en').ready,
          );
        }
      } finally {
        timers.mockRestore();
        clears.mockRestore();
        vi.doUnmock('./mobile-media-hub');
        vi.resetModules();
      }
    },
  );

  it('renders escaped active metadata and one inert stable audio element before play', () => {
    const { container } = render(
      <MobileMediaHubView
        model={ready()}
        copy={getMobileMediaCopy('en')}
        language="en"
        onStart={() => undefined}
        onPause={() => undefined}
        onResume={() => undefined}
      />,
    );
    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio).toHaveAttribute('preload', 'none');
    expect(audio).not.toHaveAttribute('controls');
    expect(audio).not.toHaveAttribute('src');
    expect(screen.getByText('Escaped <em> local title')).toBeVisible();
    expect(container.querySelector('em')).toBeNull();
    expect(screen.getByText('Local delivery; no third party')).toBeVisible();
    expect(screen.getByText(/UTC/u)).toBeVisible();
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Local media is ready.');
    expect(screen.getByRole('button', { name: 'Resume saved position' })).toBeVisible();
  });

  it('keeps a paused Continue action separate from an older saved-position action', async () => {
    const user = userEvent.setup();
    const start = vi.fn();
    const resume = vi.fn();
    const { rerender } = render(
      <MobileMediaHubView
        model={{
          ...ready(),
          player: { playback: 'paused', availability: 'local', error: null },
          resume: 'saved',
        }}
        copy={getMobileMediaCopy('en')}
        language="en"
        onStart={start}
        onPause={() => undefined}
        onResume={resume}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(start).toHaveBeenCalledOnce();
    expect(resume).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Resume saved position' })).toBeNull();
    rerender(
      <MobileMediaHubView
        model={{ ...ready(), resume: 'saved' }}
        copy={getMobileMediaCopy('en')}
        language="en"
        onStart={start}
        onPause={() => undefined}
        onResume={resume}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Resume saved position' }));
    expect(resume).toHaveBeenCalledOnce();
  });

  it('shows only the supplied offline or invalid state and offers an explicit reload', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    const { rerender } = render(
      <MobileMediaHubView
        model={{
          ...empty(),
          bootstrapFailure: true,
          bootstrap: 'offline',
          player: { playback: 'idle', availability: 'offline', error: null },
        }}
        copy={getMobileMediaCopy('en')}
        language="en"
        onStart={() => undefined}
        onPause={() => undefined}
        onResume={() => undefined}
        onReload={reload}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('cannot be loaded while offline');
    await user.click(screen.getByRole('button', { name: 'Reload local media' }));
    expect(reload).toHaveBeenCalledOnce();
    rerender(
      <MobileMediaHubView
        model={{ ...empty(), bootstrapFailure: true, bootstrap: 'invalid' }}
        copy={getMobileMediaCopy('en')}
        language="en"
        onStart={() => undefined}
        onPause={() => undefined}
        onResume={() => undefined}
        onReload={reload}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('currently unavailable');
  });

  it('shows the interrupted preparation only with its explicit completion action', async () => {
    const user = userEvent.setup();
    const complete = vi.fn();
    render(
      <MobileMediaHubView
        model={{ ...empty(), recovery: true }}
        copy={getMobileMediaCopy('en')}
        language="en"
        onStart={() => undefined}
        onPause={() => undefined}
        onResume={() => undefined}
        onCompletePreparation={complete}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('preparation was interrupted');
    await user.click(screen.getByRole('button', { name: 'Complete local preparation' }));
    expect(complete).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Reload local media' })).toBeNull();
  });

  it('uses the public hub projection at one idle expiry boundary and never leaves ready metadata usable', async () => {
    vi.useFakeTimers();
    let clock = at;
    const { adapters } = adaptersFor(catalogSnapshot(at + 500));
    render(
      <MobileMediaHubPage
        copy={getMobileMediaCopy('en')}
        language="en"
        now={() => clock}
        headingRef={{ current: null }}
        adapters={adapters}
      />,
    );
    await flush();
    expect(screen.getByRole('heading', { name: 'Media' })).toBeVisible();
    expect(screen.getByText('Local title')).toBeVisible();
    clock = at + 500;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent('no longer current');
    expect(screen.queryByText('Local title')).toBeNull();
    expect(document.querySelector('audio')).toBeNull();
  });

  it.each([
    ['stale', (snapshot: ReturnType<typeof catalogSnapshot>) => snapshot],
    [
      'blocked',
      (snapshot: ReturnType<typeof catalogSnapshot>) => ({
        ...snapshot,
        safety: {
          generation: 2,
          revision: 2,
          entries: [{ targetKind: 'episode', targetId: 'episode', targetHash: null }] as never,
        },
      }),
    ],
  ] as const)(
    'removes ready metadata after a %s result discovered by a user action',
    async (kind, changed) => {
      let clock = at;
      let snapshot = catalogSnapshot(at + 1_000);
      const { adapters } = adaptersFor(snapshot);
      (adapters.openCatalog as ReturnType<typeof vi.fn>).mockResolvedValue({
        snapshot: vi.fn(async () => snapshot),
        close: vi.fn(),
      } as never);
      render(
        <MobileMediaHubPage
          copy={getMobileMediaCopy('en')}
          language="en"
          now={() => clock}
          headingRef={{ current: null }}
          adapters={adapters}
        />,
      );
      await flush();
      expect(screen.getByText('Local title')).toBeVisible();
      if (kind === 'stale') clock = at + 1_000;
      else snapshot = changed(snapshot);
      await userEvent.setup().click(screen.getByRole('button', { name: 'Play' }));
      await waitFor(() => expect(screen.queryByText('Local title')).toBeNull());
      expect(screen.getByRole(kind === 'blocked' ? 'alert' : 'status')).toHaveTextContent(
        kind === 'blocked' ? getMobileMediaCopy('en').blocked : getMobileMediaCopy('en').stale,
      );
      expect(document.querySelector('audio')).toBeNull();
    },
  );

  it('closes a catalog that resolves after unmount without publishing a late route state', async () => {
    let resolveOpen: (() => void) | undefined;
    const close = vi.fn();
    const adapters: MobileMediaHubControllerAdapters = {
      openCatalog: vi.fn(
        () =>
          new Promise<never>((resolve) => {
            resolveOpen = () =>
              resolve({ snapshot: async () => catalogSnapshot(at + 1_000), close } as never);
          }),
      ),
      openResume: vi.fn(async () => ({ close: vi.fn() }) as never),
      load: vi.fn(async () => ({ kind: 'no-request' as const })),
    };
    const rendered = render(
      <MobileMediaHubPage
        copy={getMobileMediaCopy('en')}
        language="en"
        now={() => at}
        headingRef={{ current: null }}
        adapters={adapters}
      />,
    );
    rendered.unmount();
    resolveOpen?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(close).toHaveBeenCalledOnce();
  });

  it('does not activate a candidate that appeared after the observed canonical-empty generation', async () => {
    const initial = {
      control: { generation: 0, active: null, candidate: null, previous: null },
      safety: { generation: 0, revision: 0, entries: [] },
      bundles: { active: null, candidate: null, previous: null },
    };
    const foreign = {
      ...initial,
      control: { generation: 1, active: null, candidate: 'candidate' as const, previous: null },
      bundles: { active: null, candidate: { rawBundle: { foreign: true } }, previous: null },
    };
    const saveCandidate = vi.fn(async () => foreign as never);
    const activate = vi.fn(async () => initial as never);
    const adapters: MobileMediaHubControllerAdapters = {
      openCatalog: vi.fn(
        async () =>
          ({
            snapshot: vi.fn(async () => initial),
            saveCandidate,
            activate,
            close: vi.fn(),
          }) as never,
      ),
      openResume: vi.fn(async () => ({ close: vi.fn() }) as never),
      load: vi.fn(async () => ({ kind: 'ready' }) as never),
    };
    render(
      <MobileMediaHubPage
        copy={getMobileMediaCopy('en')}
        language="en"
        now={() => at}
        headingRef={{ current: null }}
        adapters={adapters}
      />,
    );
    await flush();
    expect(saveCandidate).toHaveBeenCalledWith(expect.objectContaining({ expectedGeneration: 0 }));
    expect(activate).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('currently unavailable');
  });

  it('does not save after an unmounted bootstrap load and closes the controller-owned resume handle', async () => {
    let resolveLoad: (() => void) | undefined;
    const saveCandidate = vi.fn();
    const resumeClose = vi.fn();
    const adapters: MobileMediaHubControllerAdapters = {
      openCatalog: vi.fn(
        async () =>
          ({
            snapshot: vi.fn(async () => ({
              control: { generation: 0, active: null, candidate: null, previous: null },
              safety: { generation: 0, revision: 0, entries: [] },
              bundles: { active: null, candidate: null, previous: null },
            })),
            saveCandidate,
            close: vi.fn(),
          }) as never,
      ),
      openResume: vi.fn(async () => ({ close: resumeClose }) as never),
      load: vi.fn(
        () =>
          new Promise<never>((resolve) => {
            resolveLoad = () => resolve({ kind: 'ready' } as never);
          }),
      ),
    };
    const rendered = render(
      <MobileMediaHubPage
        copy={getMobileMediaCopy('en')}
        language="en"
        now={() => at}
        headingRef={{ current: null }}
        adapters={adapters}
      />,
    );
    await flush();
    rendered.unmount();
    resolveLoad?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(saveCandidate).not.toHaveBeenCalled();
    expect(resumeClose).toHaveBeenCalledOnce();
  });

  it('holds a controller-owned resume handle through a late save compensation and closes it once', async () => {
    let resolveSave: ((value: never) => void) | undefined;
    let resolveDelete: ((value: never) => void) | undefined;
    const close = vi.fn();
    const raw = {
      snapshot: vi.fn(async () => ({ generation: 0, records: [] })),
      save: vi.fn(
        () =>
          new Promise<never>((resolve) => {
            resolveSave = resolve;
          }),
      ),
      deleteIfExact: vi.fn(
        () =>
          new Promise<never>((resolve) => {
            resolveDelete = resolve;
          }),
      ),
      clearExact: vi.fn(async () => ({ kind: 'no-op', state: { generation: 0, records: [] } })),
      close,
    } as never;
    const handle = createControllerResumeHandle(raw);
    const save = handle.store.save({} as never, 0);
    const compensation = save.then(() => handle.store.deleteIfExact('resume', {} as never, 0));
    handle.closeWhenIdle();
    resolveSave?.({} as never);
    await Promise.resolve();
    expect(
      (raw as { deleteIfExact: ReturnType<typeof vi.fn> }).deleteIfExact,
    ).toHaveBeenCalledOnce();
    expect(close).not.toHaveBeenCalled();
    resolveDelete?.({} as never);
    await compensation;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(close).toHaveBeenCalledOnce();
  });
});
