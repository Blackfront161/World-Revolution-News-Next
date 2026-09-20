import { StrictMode } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getUiCopy } from '@wrn/ui-language';
import type {
  WebsiteShellAdapter,
  WebsiteShellOperationResult,
  WebsiteShellStatus,
} from '../offline-shell/adapter';
import { WebsiteShellPanel } from './WebsiteShellPanel';

type TestAdapter = WebsiteShellAdapter & {
  publish: (next: WebsiteShellStatus) => void;
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createAdapter(initial: WebsiteShellStatus): TestAdapter {
  let snapshot = Object.freeze(initial);
  const listeners = new Set<() => void>();
  const publish = (next: WebsiteShellStatus) => {
    snapshot = Object.freeze(next);
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: vi.fn((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    refresh: vi.fn(async () => snapshot),
    enable: vi.fn(async () => snapshot),
    update: vi.fn(async () => snapshot),
    remove: vi.fn(async () => snapshot),
    dispose: vi.fn(),
    publish,
  };
}

describe('WebsiteShellPanel', () => {
  it.each([
    ['initializing', 'Loading', undefined],
    ['uncontrolled', 'No website shell controls this page yet.', 'Save website shell'],
    [
      'saved',
      'The website interface is saved. Close all pages of this website, then reopen it to use the saved interface.',
      'Check for shell update',
    ],
    [
      'active',
      'Website shell controls this page. It does not prove news or media are saved.',
      'Check for shell update',
    ],
    [
      'waiting',
      'An update is waiting. Close all pages using this website, then reopen it.',
      'Remove website shell',
    ],
    ['pending', 'The website shell operation is still being verified.', undefined],
    ['removed', 'Website shell removed. A small protection marker remains.', 'Save website shell'],
    [
      'protected',
      'Offline website availability cannot be confirmed. Storage may be unavailable or protected.',
      undefined,
    ],
    [
      'error',
      'Offline website availability cannot be confirmed. Storage may be unavailable or protected.',
      undefined,
    ],
  ] as const)(
    'projects %s without inventing an offline-content guarantee',
    async (kind, detail, action) => {
      const adapter = createAdapter({ kind, epoch: 1, controlled: kind === 'active' });
      render(<WebsiteShellPanel adapterFactory={() => adapter} />);

      expect(await screen.findByText(detail)).toBeVisible();
      if (action === undefined) {
        expect(screen.queryByRole('button', { name: 'Save website shell' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Check for shell update' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Remove website shell' })).toBeNull();
      } else {
        expect(screen.getByRole('button', { name: action })).toBeEnabled();
      }
    },
  );

  it('separates verified availability from the session-only update attempt', async () => {
    const adapter = createAdapter({
      kind: 'active',
      epoch: 1,
      controlled: true,
      shellId: 'active-a',
    });
    render(<WebsiteShellPanel adapterFactory={() => adapter} />);

    const readiness = await screen.findByRole('region', { name: 'Website availability' });
    const updateAttempt = screen.getByRole('region', { name: 'Last update check' });
    expect(readiness).toHaveTextContent(
      'Website shell controls this page. It does not prove news or media are saved.',
    );
    expect(updateAttempt).toHaveTextContent('No update check has been started in this session.');
    expect(updateAttempt).toHaveAttribute('aria-busy', 'false');
  });

  it('ends an unconfirmed update as indeterminate, keeps positive readiness, and never retries automatically', async () => {
    const user = userEvent.setup();
    const adapter = createAdapter({
      kind: 'active',
      epoch: 4,
      controlled: true,
      shellId: 'active-a',
    });
    const operation = deferred<WebsiteShellOperationResult>();
    vi.mocked(adapter.update).mockImplementation(() => {
      adapter.publish({
        kind: 'pending',
        epoch: 4,
        controlled: true,
        shellId: 'active-a',
        operation: 'update',
      });
      return operation.promise;
    });
    render(<WebsiteShellPanel adapterFactory={() => adapter} />);

    await user.click(await screen.findByRole('button', { name: 'Check for shell update' }));
    const updateAttempt = screen.getByRole('region', { name: 'Last update check' });
    const readiness = screen.getByRole('region', { name: 'Website availability' });
    expect(updateAttempt).toHaveTextContent('Checking for an update.');
    expect(updateAttempt).toHaveAttribute('aria-busy', 'true');
    expect(readiness).toHaveTextContent('Website shell controls this page.');
    expect(readiness).toHaveAttribute('aria-busy', 'false');

    operation.resolve({
      kind: 'active',
      epoch: 5,
      controlled: true,
      shellId: 'active-a',
      outcome: {
        kind: 'indeterminate',
        operation: 'update',
        epoch: 5,
        code: 'native-outcome-unbound',
      },
    });
    act(() =>
      adapter.publish({
        kind: 'active',
        epoch: 5,
        controlled: true,
        shellId: 'active-a',
      }),
    );

    await waitFor(() => expect(updateAttempt).toHaveAttribute('aria-busy', 'false'));
    expect(updateAttempt).toHaveTextContent(
      'The update request was sent, but the result could not be confirmed.',
    );
    expect(readiness).toHaveTextContent('Website shell controls this page.');
    expect(screen.getByRole('button', { name: 'Try update check again' })).toBeEnabled();
    await act(async () => undefined);
    expect(adapter.update).toHaveBeenCalledTimes(1);
  });

  it('offers a deliberate retry only after the observed readiness allows update again', async () => {
    const user = userEvent.setup();
    const adapter = createAdapter({
      kind: 'active',
      epoch: 8,
      controlled: true,
      shellId: 'active-a',
    });
    vi.mocked(adapter.update).mockImplementation(async () => {
      const result: WebsiteShellOperationResult = {
        kind: 'waiting',
        epoch: 9,
        controlled: true,
        shellId: 'active-a',
        waitingShellId: 'waiting-b',
        outcome: {
          kind: 'failed',
          operation: 'update',
          epoch: 9,
          code: 'stale',
        },
      };
      adapter.publish(result);
      return result;
    });
    render(<WebsiteShellPanel adapterFactory={() => adapter} />);

    await user.click(await screen.findByRole('button', { name: 'Check for shell update' }));
    await screen.findByText('The update check could not be completed.');
    expect(screen.queryByRole('button', { name: 'Try update check again' })).toBeNull();

    act(() =>
      adapter.publish({
        kind: 'active',
        epoch: 10,
        controlled: true,
        shellId: 'active-b',
      }),
    );
    expect(await screen.findByRole('button', { name: 'Try update check again' })).toBeEnabled();
    expect(adapter.update).toHaveBeenCalledTimes(1);
  });

  it('turns a late readiness publication after a running result into indeterminate, never success', async () => {
    const user = userEvent.setup();
    const adapter = createAdapter({
      kind: 'active',
      epoch: 12,
      controlled: true,
      shellId: 'active-a',
    });
    vi.mocked(adapter.update).mockImplementation(async () => {
      const result: WebsiteShellOperationResult = {
        kind: 'pending',
        epoch: 13,
        controlled: true,
        shellId: 'active-a',
        operation: 'update',
        outcome: { kind: 'running', operation: 'update', epoch: 13 },
      };
      adapter.publish(result);
      return result;
    });
    render(<WebsiteShellPanel adapterFactory={() => adapter} />);

    await user.click(await screen.findByRole('button', { name: 'Check for shell update' }));
    const updateAttempt = screen.getByRole('region', { name: 'Last update check' });
    expect(updateAttempt).toHaveAttribute('aria-busy', 'true');
    act(() =>
      adapter.publish({
        kind: 'active',
        epoch: 14,
        controlled: true,
        shellId: 'active-b',
      }),
    );

    await screen.findByText('The update request was sent, but the result could not be confirmed.');
    expect(updateAttempt).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryByText('The update check completed successfully.')).toBeNull();
  });

  it('does not carry a completed update result into a fresh panel session', async () => {
    const user = userEvent.setup();
    const first = createAdapter({ kind: 'saved', epoch: 1, controlled: false });
    vi.mocked(first.update).mockResolvedValue({
      kind: 'saved',
      epoch: 2,
      controlled: false,
      outcome: { kind: 'succeeded', operation: 'update', epoch: 2 },
    });
    const firstView = render(<WebsiteShellPanel adapterFactory={() => first} />);

    await user.click(await screen.findByRole('button', { name: 'Check for shell update' }));
    await screen.findByText('The update check completed successfully.');
    firstView.unmount();

    const second = createAdapter({ kind: 'saved', epoch: 2, controlled: false });
    render(<WebsiteShellPanel adapterFactory={() => second} />);
    expect(
      await screen.findByText('No update check has been started in this session.'),
    ).toBeVisible();
    expect(screen.queryByText('The update check completed successfully.')).toBeNull();
  });

  it('binds remove confirmation to the observed shell identity and cancels stale confirmation', async () => {
    const user = userEvent.setup();
    const adapter = createAdapter({
      kind: 'saved',
      epoch: 1,
      controlled: false,
      shellId: 'saved-a',
    });
    render(<WebsiteShellPanel adapterFactory={() => adapter} />);

    const remove = await screen.findByRole('button', { name: 'Remove website shell' });
    await user.click(remove);
    expect(screen.getByRole('dialog')).toHaveTextContent('Website offline shell');
    expect(screen.getByRole('dialog')).toHaveTextContent('A small protection marker remains');
    expect(
      [...document.body.children].some(
        (element) =>
          element instanceof HTMLElement &&
          !element.classList.contains('confirmation-backdrop') &&
          element.inert,
      ),
    ).toBe(true);

    act(() => adapter.publish({ kind: 'active', epoch: 2, controlled: true, shellId: 'active-b' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(adapter.remove).not.toHaveBeenCalled();
    expect(remove).toHaveFocus();
    expect(
      [...document.body.children].every(
        (element) =>
          !(element instanceof HTMLElement) ||
          element.classList.contains('confirmation-backdrop') ||
          !element.inert,
      ),
    ).toBe(true);
  });

  it('makes Escape non-destructive and returns focus to its triggering remove control', async () => {
    const user = userEvent.setup();
    const adapter = createAdapter({
      kind: 'active',
      epoch: 1,
      controlled: true,
      shellId: 'active-a',
    });
    render(<WebsiteShellPanel adapterFactory={() => adapter} />);

    const remove = await screen.findByRole('button', { name: 'Remove website shell' });
    await user.click(remove);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(adapter.remove).not.toHaveBeenCalled();
    expect(remove).toHaveFocus();
  });

  it('runs remove only after confirmation and immediately projects the adapter pending state', async () => {
    const user = userEvent.setup();
    const adapter = createAdapter({
      kind: 'active',
      epoch: 1,
      controlled: true,
      shellId: 'active-a',
    });
    vi.mocked(adapter.remove).mockImplementation(async () => {
      adapter.publish({ kind: 'pending', epoch: 2, controlled: true, operation: 'remove' });
      return adapter.getSnapshot();
    });
    render(<WebsiteShellPanel adapterFactory={() => adapter} />);

    await user.click(await screen.findByRole('button', { name: 'Remove website shell' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove website shell' }),
    );
    expect(adapter.remove).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText('The website shell operation is still being verified.')).toBeVisible();
  });

  it('disposes every StrictMode adapter owner and leaves no discarded owner subscribed', async () => {
    const first = createAdapter({ kind: 'initializing', epoch: null, controlled: false });
    const second = createAdapter({ kind: 'uncontrolled', epoch: null, controlled: false });
    const factory = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const view = render(
      <StrictMode>
        <WebsiteShellPanel adapterFactory={factory} />
      </StrictMode>,
    );

    await screen.findByText('No website shell controls this page yet.');
    expect(factory).toHaveBeenCalledTimes(2);
    expect(first.dispose).toHaveBeenCalledTimes(1);
    expect(first.subscribe).not.toHaveBeenCalled();
    view.unmount();
    expect(second.dispose).toHaveBeenCalledTimes(1);
  });

  it('does not start a second deferred enable after the first action publishes pending', async () => {
    const user = userEvent.setup();
    const adapter = createAdapter({ kind: 'uncontrolled', epoch: null, controlled: false });
    let settle!: () => void;
    vi.mocked(adapter.enable).mockImplementation(
      () =>
        new Promise((resolve) => {
          adapter.publish({ kind: 'pending', epoch: 1, controlled: false, operation: 'enable' });
          settle = () => resolve(adapter.getSnapshot());
        }),
    );
    render(<WebsiteShellPanel adapterFactory={() => adapter} />);

    await user.dblClick(await screen.findByRole('button', { name: 'Save website shell' }));
    expect(adapter.enable).toHaveBeenCalledTimes(1);
    expect(screen.getByText('The website shell operation is still being verified.')).toBeVisible();
    settle();
  });

  it('keeps its adapter owner while copy changes and disposes it on unmount during pending work', async () => {
    const adapter = createAdapter({
      kind: 'pending',
      epoch: 4,
      controlled: true,
      operation: 'remove',
    });
    const factory = vi.fn(() => adapter);
    const view = render(<WebsiteShellPanel adapterFactory={factory} />);

    expect(
      await screen.findByText('The website shell operation is still being verified.'),
    ).toBeVisible();
    view.rerender(<WebsiteShellPanel adapterFactory={factory} copy={getUiCopy('de')} />);
    expect(screen.getByText(getUiCopy('de').websiteShellWorking)).toBeVisible();
    expect(factory).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(adapter.dispose).toHaveBeenCalledTimes(1);
  });
});
