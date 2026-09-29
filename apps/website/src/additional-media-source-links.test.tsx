import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProductionEventsMediaDocumentV1 } from '@wrn/content-contracts/production-events-media-v1';
import { videoSourceCatalogV1 } from '@wrn/content-contracts/video-sources-v1';
import { additionalAudioSourceLinks } from '../../../packages/browser-content/src/additional-media-source-links';
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

describe('additional media publisher links', () => {
  it('preserves the original video selection and only adds distinct HTTPS directory entries', () => {
    expect(videoSourceCatalogV1.selectedOn).toBe('2026-09-09');
    expect(videoSourceCatalogV1.sources).toHaveLength(13);
    expect(videoSourceCatalogV1.sources.map((source) => source.id)).toContain(
      'video-source:labournet-tv',
    );
    expect(videoSourceCatalogV1.sources.map((source) => source.id)).toContain(
      'video-source:actvism-munich',
    );
    expect(new Set(additionalAudioSourceLinks.map((source) => source.id)).size).toBe(3);
    expect(
      additionalAudioSourceLinks.every((source) => source.originalUrl.startsWith('https://')),
    ).toBe(true);
  });

  it('loads no audio or images and requires consent for new audio and video link-outs', async () => {
    const { container } = render(
      <ProductionEventsMediaDirectory
        load={() => Promise.resolve(snapshot as ProductionEventsMediaDocumentV1)}
        language="en"
        mode="media"
        headingId="test-media"
        headingRef={{ current: null }}
        videoChannels={
          <>
            <a href="https://www.labournet.tv/de/videos">Labournet TV</a>
            <a href="http://source.example/insecure">Unsafe HTTP</a>
          </>
        }
      />,
    );
    await screen.findByTestId('events-media-count');
    expect(container.querySelectorAll('audio, video, iframe, img')).toHaveLength(0);
    const radio = container.querySelector(
      '[data-additional-audio-source="audio-source:radio-almaina"]',
    );
    expect(radio).not.toBeNull();
    fireEvent.click(within(radio as HTMLElement).getByRole('button', { name: 'Open original' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute(
      'href',
      'https://podcast.radioalmaina.org/',
    );
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('link', { name: 'Unsafe HTTP' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Labournet TV' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute(
      'href',
      'https://www.labournet.tv/de/videos',
    );
  });

  it('keeps an audio link consent open when historical metadata finishes loading', async () => {
    let finishLoad!: (value: ProductionEventsMediaDocumentV1) => void;
    render(
      <ProductionEventsMediaDirectory
        load={() =>
          new Promise<ProductionEventsMediaDocumentV1>((resolve) => {
            finishLoad = resolve;
          })
        }
        language="en"
        mode="media"
        headingId="loading-media"
        headingRef={{ current: null }}
      />,
    );
    const radio = screen.getByText('Radio Zapatista').closest('li')!;
    fireEvent.click(within(radio).getByRole('button', { name: 'Open original' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    await act(async () => finishLoad(snapshot as ProductionEventsMediaDocumentV1));
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute(
      'href',
      'https://radiozapatista.org/?cat=1',
    );
  });
});
