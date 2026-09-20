import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateProductionMediaReleaseV1 } from '@wrn/content-contracts/production-media-v1';
import {
  ManagedProductionMediaExperience,
  ProductionMediaExperience,
} from '../../../packages/browser-content/src/production-media-ui';
import type { ProductionMediaControllerState } from '../../../packages/browser-content/src/production-media-controller';
import { makeProductionMediaTestInput } from './production-media-test-fixture';

const dialogDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
});
afterEach(() => {
  if (dialogDescriptor)
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', dialogDescriptor);
  else delete (HTMLDialogElement.prototype as { showModal?: unknown }).showModal;
  if (closeDescriptor) Object.defineProperty(HTMLDialogElement.prototype, 'close', closeDescriptor);
  else delete (HTMLDialogElement.prototype as { close?: unknown }).close;
});

async function readyState(overrides: Partial<ProductionMediaControllerState> = {}) {
  const ready = await validateProductionMediaReleaseV1(await makeProductionMediaTestInput());
  if (!ready) throw new Error('genuine fixture must admit');
  return {
    phase: 'local',
    reason: 'ready',
    active: { ready, generation: 'media:1:0:test', clearEpoch: 0, checkedAt: Date.now() },
    player: { phase: 'idle', episodeId: null, positionMs: 0, durationMs: null, error: null },
    resume: { kind: 'none' },
    ...overrides,
  } as ProductionMediaControllerState;
}
function harness() {
  const prompt = vi.fn();
  return {
    controller: {
      preparePlay: prompt,
      prepareResume: prompt,
      confirmPlay: vi.fn(() => true),
      cancelConsent: vi.fn(),
      pause: vi.fn(),
      continue: vi.fn(),
      seek: vi.fn(),
      clearLocal: vi.fn(async () => undefined),
    } as unknown as Parameters<typeof ProductionMediaExperience>[0]['controller'],
    prompt,
  };
}

describe('production media experience', () => {
  it('retains the controller across language changes, bootstraps once, and disposes on route unmount', async () => {
    const state = await readyState({ active: null, reason: 'no-active-release' });
    const base = harness().controller;
    const controller = {
      ...base,
      getState: () => state,
      mount: vi.fn(async () => state),
      bootstrapInitial: vi.fn(async () => state),
      dispose: vi.fn(),
    };
    const factory = vi.fn((onState: (next: ProductionMediaControllerState) => void) => {
      onState(state);
      return controller;
    });
    const view = render(
      <ManagedProductionMediaExperience
        createController={factory}
        language="en"
        headingLevel={2}
      />,
    );
    await waitFor(() => expect(controller.bootstrapInitial).toHaveBeenCalledOnce());
    view.rerender(
      <ManagedProductionMediaExperience
        createController={factory}
        language="de"
        headingLevel={2}
      />,
    );
    expect(factory).toHaveBeenCalledOnce();
    expect(controller.mount).toHaveBeenCalledOnce();
    view.unmount();
    expect(controller.dispose).toHaveBeenCalledOnce();
    expect(controller.cancelConsent).toHaveBeenCalled();
  });
  it('never bootstraps a mount that completes after route unmount', async () => {
    const state = await readyState({ active: null, reason: 'no-active-release' });
    let finish!: (state: ProductionMediaControllerState) => void;
    const mount = new Promise<ProductionMediaControllerState>((resolve) => {
      finish = resolve;
    });
    const controller = {
      ...harness().controller,
      getState: () => state,
      mount: vi.fn(() => mount),
      bootstrapInitial: vi.fn(async () => state),
      dispose: vi.fn(),
    };
    const view = render(
      <ManagedProductionMediaExperience
        createController={() => controller}
        language="en"
        headingLevel={2}
      />,
    );
    view.unmount();
    finish(state);
    await mount;
    await Promise.resolve();
    expect(controller.bootstrapInitial).not.toHaveBeenCalled();
    expect(controller.dispose).toHaveBeenCalledOnce();
  });
  it('uses an admitted fixture, discloses real consent data, and confirms inside the click gesture', async () => {
    const state = await readyState();
    const { controller, prompt } = harness();
    const consent = state.active!.ready.documents.consent.entries[0]!;
    const rights = state.active!.ready.documents.rights.entries[0]!;
    prompt.mockReturnValue({
      episode: state.active!.ready.documents.manifest.episodes[0]!,
      consent,
      rights,
    });
    render(
      <ProductionMediaExperience
        controller={controller}
        state={state}
        language="en"
        headingLevel={2}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open original' }));
    const original = screen.getByRole('link', { name: 'Continue' });
    expect(original).toHaveAttribute('rel', 'noopener noreferrer');
    expect(original).toHaveAttribute('referrerpolicy', 'no-referrer');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play from start' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(consent.recipientName);
    expect(document.activeElement).toHaveTextContent('Cancel');
    fireEvent.click(screen.getByRole('button', { name: 'Allow and play' }));
    expect(controller.confirmPlay).toHaveBeenCalledWith(expect.objectContaining({ consent }));
  });

  it('cancels consent on Escape, renders an error honestly, and retains the English content language fallback', async () => {
    const state = await readyState({
      player: {
        phase: 'error',
        episodeId: 'episode-0',
        positionMs: 0,
        durationMs: null,
        error: 'stream-unavailable',
      },
    });
    const { controller, prompt } = harness();
    const ready = state.active!.ready;
    prompt.mockReturnValue({
      episode: ready.documents.manifest.episodes[0]!,
      consent: ready.documents.consent.entries[0]!,
      rights: ready.documents.rights.entries[0]!,
    });
    render(
      <ProductionMediaExperience
        controller={controller}
        state={state}
        language="de"
        headingLevel={2}
      />,
    );
    expect(screen.getAllByText('Publisher episode')[0]).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('status')).toHaveTextContent('Audiostream ist nicht verfügbar.');
    fireEvent.click(screen.getByRole('button', { name: 'Von Anfang an abspielen' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(controller.cancelConsent).toHaveBeenCalled();
  });

  it('does not create a fake update when A4 has no source and requires a separate clear confirmation', async () => {
    const state = await readyState({
      phase: 'unavailable',
      reason: 'source-disabled',
      active: null,
    });
    const { controller } = harness();
    render(
      <ProductionMediaExperience
        controller={controller}
        state={state}
        language="en"
        headingLevel={2}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Current audio is unavailable.');
    fireEvent.click(screen.getByRole('button', { name: 'Clear local media' }));
    expect(controller.clearLocal).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Clear media' }));
    expect(controller.clearLocal).toHaveBeenCalledOnce();
  });

  it('uses the requested section and card heading levels and renders no disposed surface', async () => {
    const state = await readyState();
    const { controller } = harness();
    const view = render(
      <ProductionMediaExperience
        controller={controller}
        state={state}
        language="en"
        headingLevel={2}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Current audio' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Publisher episode' })).toBeVisible();
    view.rerender(
      <ProductionMediaExperience
        controller={controller}
        state={state}
        language="en"
        headingLevel={3}
      />,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Current audio' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 4, name: 'Publisher episode' })).toBeVisible();
    view.rerender(
      <ProductionMediaExperience
        controller={controller}
        state={{ ...state, phase: 'disposed', reason: 'disposed', active: null }}
        language="en"
        headingLevel={3}
      />,
    );
    expect(view.container).toBeEmptyDOMElement();
  });

  it('keeps confirmation synchronous, reports a rejected prompt, traps focus, returns it, and cancels on unmount', async () => {
    const state = await readyState();
    const { controller, prompt } = harness();
    const ready = state.active!.ready;
    prompt.mockReturnValue({
      episode: ready.documents.manifest.episodes[0]!,
      consent: ready.documents.consent.entries[0]!,
      rights: ready.documents.rights.entries[0]!,
    });
    (controller.confirmPlay as ReturnType<typeof vi.fn>).mockImplementation(() => {
      expect(screen.getByRole('dialog')).toHaveTextContent('Publisher episode');
      return false;
    });
    const view = render(
      <ProductionMediaExperience
        controller={controller}
        state={state}
        language="en"
        headingLevel={2}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Play from start' });
    fireEvent.click(trigger);
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.keyDown(cancel, { key: 'Tab' });
    expect(document.activeElement).toHaveTextContent('Privacy notice');
    view.rerender(
      <ProductionMediaExperience
        controller={controller}
        state={{ ...state }}
        language="en"
        headingLevel={2}
      />,
    );
    expect(document.activeElement).toHaveTextContent('Privacy notice');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Allow and play' }));
    expect(controller.confirmPlay).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Audio stream is unavailable.');
    view.unmount();
    expect(controller.cancelConsent).toHaveBeenCalled();
  });

  it('closes a stale consent prompt when its active generation changes', async () => {
    const state = await readyState();
    const { controller, prompt } = harness();
    const ready = state.active!.ready;
    prompt.mockReturnValue({
      episode: ready.documents.manifest.episodes[0]!,
      consent: ready.documents.consent.entries[0]!,
      rights: ready.documents.rights.entries[0]!,
    });
    const view = render(
      <ProductionMediaExperience
        controller={controller}
        state={state}
        language="en"
        headingLevel={2}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Play from start' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    view.rerender(
      <ProductionMediaExperience
        controller={controller}
        state={{ ...state, active: { ...state.active!, generation: 'media:2:0:test' } }}
        language="en"
        headingLevel={2}
      />,
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(controller.cancelConsent).toHaveBeenCalled();
  });

  it('exposes resume, pause, continue and bounded seek, while checking disables every playback control', async () => {
    const base = await readyState({
      player: {
        phase: 'playing',
        episodeId: 'episode-0',
        positionMs: 500,
        durationMs: 1_000,
        error: null,
      },
    });
    const { controller, prompt } = harness();
    const ready = base.active!.ready;
    prompt.mockReturnValue({
      episode: ready.documents.manifest.episodes[0]!,
      consent: ready.documents.consent.entries[0]!,
      rights: ready.documents.rights.entries[0]!,
    });
    const view = render(
      <ProductionMediaExperience
        controller={controller}
        state={{ ...base, phase: 'checking' }}
        language="en"
        headingLevel={2}
      />,
    );
    expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled();
    expect(screen.getByRole('slider', { name: 'Seek' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear local media' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(controller.pause).not.toHaveBeenCalled();
    view.rerender(
      <ProductionMediaExperience
        controller={controller}
        state={base}
        language="en"
        headingLevel={2}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Seek' }), { target: { value: '700' } });
    expect(controller.pause).toHaveBeenCalledOnce();
    expect(controller.seek).toHaveBeenCalledWith(700);
    view.rerender(
      <ProductionMediaExperience
        controller={controller}
        state={{ ...base, player: { ...base.player, phase: 'paused' } }}
        language="en"
        headingLevel={2}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(controller.continue).toHaveBeenCalledOnce();
    view.rerender(
      <ProductionMediaExperience
        controller={controller}
        state={{
          ...base,
          player: { ...base.player, phase: 'idle', episodeId: null },
          resume: { kind: 'available', episodeId: 'episode-0', positionMs: 500, durationMs: 1_000 },
        }}
        language="en"
        headingLevel={2}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Resume saved position' }));
    expect(controller.prepareResume).toHaveBeenCalledWith('episode-0');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  });
});
