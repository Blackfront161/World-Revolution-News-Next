import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProductionEventsMediaDocumentV1 } from '@wrn/content-contracts/production-events-media-v1';
import type { UiLanguage } from '@wrn/ui-language';
import { liveTvSourceLinks } from '../../../packages/browser-content/src/live-tv-source-links';
import { ProductionEventsMediaDirectory } from '../../../packages/browser-content/src/events-media-directory';
import snapshot from './features/events-media/data/production-events-media-v1.json';

const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
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
  cleanup();
  if (showModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModal);
  else delete (HTMLDialogElement.prototype as { showModal?: unknown }).showModal;
  if (close) Object.defineProperty(HTMLDialogElement.prototype, 'close', close);
  else delete (HTMLDialogElement.prototype as { close?: unknown }).close;
});

const document = snapshot as ProductionEventsMediaDocumentV1;
const media = (
  load: (signal: AbortSignal) => Promise<ProductionEventsMediaDocumentV1>,
  language: UiLanguage = 'en',
) => (
  <ProductionEventsMediaDirectory
    load={load}
    language={language}
    mode="media"
    headingId="media-heading"
    headingRef={{ current: null }}
    headingLevel={1}
  />
);

describe('shared live TV publisher directory', () => {
  it('keeps four distinct HTTPS publisher pages separate from admitted media', () => {
    expect(liveTvSourceLinks).toHaveLength(4);
    expect(new Set(liveTvSourceLinks.map((source) => source.id)).size).toBe(4);
    expect(liveTvSourceLinks.map((source) => source.originalUrl)).toEqual([
      'https://www.democracynow.org/live/todays_democracy_now',
      'https://barricadatv.blogspot.com/',
      'https://abajoelalinea.cl/',
      'https://fs1.tv/',
    ]);
  });

  it('shows source-only cards while loading and after a failed historical load, never in Events', async () => {
    const load = vi.fn(() => Promise.reject(new Error('historical snapshot unavailable')));
    const { container, rerender } = render(media(load));
    expect(container.querySelectorAll('[data-live-tv-source]')).toHaveLength(4);
    expect(container.querySelectorAll('audio, video, iframe, img')).toHaveLength(0);
    expect(container.querySelectorAll('[data-live-tv-source] a[href]')).toHaveLength(0);
    expect(await screen.findByRole('status')).toBeVisible();
    expect(
      container.querySelector('[data-live-tv-source="live-tv:abajo-e-la-linea"]'),
    ).toHaveTextContent('Current signal availability is unconfirmed');
    expect(
      container.querySelector('[data-live-tv-source="live-tv:barricada-tv"]'),
    ).toHaveTextContent('Current signal availability is unconfirmed');
    rerender(
      <ProductionEventsMediaDirectory
        load={load}
        language="en"
        mode="events"
        headingId="event-heading"
        headingRef={{ current: null }}
      />,
    );
    expect(container.querySelectorAll('[data-live-tv-source]')).toHaveLength(0);
  });

  it('requires user consent and restores focus after the historical snapshot finishes loading', async () => {
    let finishLoad!: (value: ProductionEventsMediaDocumentV1) => void;
    const load = vi.fn(
      () =>
        new Promise<ProductionEventsMediaDocumentV1>((resolve) => {
          finishLoad = resolve;
        }),
    );
    const { container } = render(media(load));
    const source = container.querySelector('[data-live-tv-source="live-tv:fs1"]') as HTMLElement;
    const trigger = within(source).getByRole('button', { name: 'Open original' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeVisible();
    const destination = screen.getByRole('link', { name: 'Continue' });
    expect(destination).toHaveAttribute('href', 'https://fs1.tv/');
    expect(destination).toHaveAttribute('target', '_blank');
    expect(destination).toHaveAttribute('rel', 'noopener noreferrer');
    expect(destination).toHaveAttribute('referrerPolicy', 'no-referrer');
    await act(async () => finishLoad(document));
    expect(screen.getByRole('dialog')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(container.querySelectorAll('audio, video, iframe')).toHaveLength(0);
  });

  it.each(['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const)(
    'provides localized directory copy in %s',
    (language) => {
      const { container } = render(media(() => new Promise(() => {}), language));
      expect(container.querySelectorAll('[data-live-tv-source]')).toHaveLength(4);
      const section = container.querySelector('.events-media-additional-sources') as HTMLElement;
      expect(within(section).getByText('Democracy Now!')).toBeVisible();
      expect(within(section).getByText('Abajo e’ la Línea')).toBeVisible();
      expect(section.textContent).toContain('America/New_York');
    },
  );
});
