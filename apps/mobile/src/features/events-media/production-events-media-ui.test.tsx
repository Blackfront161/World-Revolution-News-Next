import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ProductionEventsMediaDocumentV1,
  ProductionEventsMediaEpisodeV1,
} from '@wrn/content-contracts/production-events-media-v1';
import { ProductionEventsMediaDirectory } from '../../../../../packages/browser-content/src/events-media-directory';
import {
  emptyEventFilters,
  emptyMediaFilters,
  filterProductionEvents,
  filterProductionMedia,
} from '../../../../../packages/browser-content/src/events-media-model';
import snapshot from './data/production-events-media-v1.json';

const document = snapshot as ProductionEventsMediaDocumentV1;
type EventsMediaLoad = (signal: AbortSignal) => Promise<ProductionEventsMediaDocumentV1>;
const loadDocument: EventsMediaLoad = () => Promise.resolve(document);
const directory = (
  mode: 'events' | 'media',
  load: EventsMediaLoad = loadDocument,
  language: 'en' | 'de' = 'en',
) => (
  <ProductionEventsMediaDirectory
    load={load}
    language={language}
    mode={mode}
    headingId="events-media"
    headingRef={{ current: null }}
  />
);
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

describe('production events/media UI', () => {
  it('keeps actual and secondary observation source joins, video IDs, accent search, inclusive dates and sort order', () => {
    const video = document.videos[0]!;
    expect(
      filterProductionMedia(document.videos, { ...emptyMediaFilters, sourceId: video.sourceId }),
    ).toContainEqual(video);
    const episode = document.episodes.find((item) => item.observations.length > 1)!;
    const secondary = episode.observations.at(-1)!;
    expect(
      filterProductionMedia(document.episodes, {
        ...emptyMediaFilters,
        sourceId: secondary.sourceId,
      }),
    ).toContainEqual(episode);
    const synthetic: ProductionEventsMediaEpisodeV1 = {
      ...episode,
      id: `${episode.id}-two-observations`,
      observations: [episode.observations[0]!, { ...secondary, sourceId: 'secondary-only-source' }],
      observationCount: 2,
    };
    expect(
      filterProductionMedia([synthetic], {
        ...emptyMediaFilters,
        sourceId: 'secondary-only-source',
      }),
    ).toEqual([synthetic]);
    const event = document.events.find((item) => /[\u00c0-\u017f]/u.test(item.title))!;
    expect(
      filterProductionEvents(document.events, {
        ...emptyEventFilters,
        query: event.title.normalize('NFD').replace(/\p{Diacritic}/gu, ''),
        from: event.startAt.slice(0, 10),
        to: event.startAt.slice(0, 10),
      }),
    ).toContainEqual(event);
    const upcoming = filterProductionEvents(
      document.events,
      { ...emptyEventFilters, scope: 'upcoming' },
      '2000-01-01T00:00:00.000Z',
    );
    expect(upcoming[0]!.startAt.localeCompare(upcoming.at(-1)!.startAt)).toBeLessThanOrEqual(0);
  });

  it('filters real episode observations, video IDs and podcast sources without raw source IDs in options', async () => {
    const episode = document.episodes.find((item) => item.observations.length > 1)!;
    const source = document.sources.find(
      (item) => item.legacyId === episode.observations.at(-1)!.sourceId,
    )!;
    render(directory('media'));
    await screen.findByTestId('events-media-count');
    fireEvent.click(screen.getByRole('button', { name: 'Podcast episodes' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Source' }), {
      target: { value: source.legacyId },
    });
    await waitFor(() =>
      expect(screen.getByTestId(`events-media-count`)).toHaveTextContent(/of [1-9]/u),
    );
    expect(screen.getByTestId('production-events-media').textContent).toContain(source.name);
    fireEvent.click(screen.getByRole('button', { name: 'Podcast sources' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Source' }), {
      target: { value: source.legacyId },
    });
    await waitFor(() => expect(screen.getByTestId(`events-media-count`)).toHaveTextContent('of 1'));
    expect(screen.getByTestId('production-events-media')).toContainElement(
      globalThis.document.querySelector(`[data-events-media-id="${source.id}"]`),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Videos' }));
    const video = document.videos[0]!;
    fireEvent.change(screen.getByRole('combobox', { name: 'Source' }), {
      target: { value: video.sourceId },
    });
    await waitFor(() =>
      expect(screen.getByTestId('production-events-media').textContent).toContain(video.title),
    );
  });

  it('resets city and pagination after changing real event filters', async () => {
    const { container } = render(directory('events'));
    await screen.findByTestId('events-media-count');
    fireEvent.click(screen.getByRole('button', { name: 'Show 30 more' }));
    await waitFor(() =>
      expect(container.querySelectorAll('[data-events-media-id]')).toHaveLength(60),
    );
    const target = document.events.find((item) => item.country && item.city)!;
    const otherCountry = document.events.find(
      (item) => item.country && item.country !== target.country,
    )!.country!;
    fireEvent.change(screen.getByRole('combobox', { name: 'Country' }), {
      target: { value: target.country },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'City' }), {
      target: { value: target.city },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Country' }), {
      target: { value: otherCountry },
    });
    expect(screen.getByRole('combobox', { name: 'City' })).toHaveValue('');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), {
      target: { value: target.title },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value: '' } });
    await waitFor(() =>
      expect(container.querySelectorAll('[data-events-media-id]')).toHaveLength(30),
    );
  });

  it('keeps the first available page increment through mode, section and data transitions, but preserves extent on language change', async () => {
    const { container, rerender } = render(directory('events'));
    const count = () => container.querySelectorAll('[data-events-media-id]').length;
    const expand = async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'Show 30 more' }));
      await waitFor(() => expect(count()).toBe(60));
    };
    await expand();
    rerender(directory('media'));
    expect(count()).toBe(13);
    fireEvent.click(screen.getByRole('button', { name: 'Podcast episodes' }));
    expect(count()).toBe(30);
    await expand();
    rerender(directory('events'));
    expect(count()).toBe(30);
    await expand();

    const replacementLoad: EventsMediaLoad = () =>
      Promise.resolve({
        ...document,
        events: document.events.slice(0, 120),
      });
    rerender(directory('events', replacementLoad));
    await waitFor(() =>
      expect(screen.getByTestId('events-media-count')).toHaveTextContent('of 120'),
    );
    expect(count()).toBe(30);
    await expand();
    rerender(directory('events', replacementLoad, 'de'));
    expect(count()).toBe(60);
    expect(screen.getByTestId('events-media-count')).toHaveTextContent('120');
  });

  it('marks review and unknown languages and keeps HTTP historical metadata inert', async () => {
    const review = document.episodes.find((item) => item.languageReviewRequired)!;
    const unknown = document.events.find((item) => item.language === 'und')!;
    const httpDocument: ProductionEventsMediaDocumentV1 = {
      ...document,
      events: [{ ...unknown, originalUrl: 'http://historical.invalid/' }],
      episodes: [review],
    };
    const { rerender } = render(directory('events', () => Promise.resolve(httpDocument)));
    await screen.findByText('Historical HTTP address; not opened here.');
    expect(screen.queryByRole('link', { name: 'Open original' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open original' })).not.toBeInTheDocument();
    expect(globalThis.document.querySelector('a[href^="http://"]')).toBeNull();
    expect(screen.getByRole('heading', { name: unknown.title })).toHaveAttribute('lang', '');
    rerender(directory('media', () => Promise.resolve(httpDocument)));
    await screen.findByTestId('events-media-count');
    fireEvent.click(screen.getByRole('button', { name: 'Podcast episodes' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), {
      target: { value: review.title },
    });
    await screen.findByText(/Language needs review/u);
  });

  it('retries failures, rejects stale late loads, and closes consent on escape after dialog cleanup', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(document);
    const { rerender } = render(directory('events', load));
    expect(
      await screen.findByText('Local historical metadata could not be loaded.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByTestId('events-media-count');
    const open = screen.getAllByRole('button', { name: 'Open original' })[0]!;
    const expectedHref = filterProductionEvents(document.events, emptyEventFilters)[0]!.originalUrl;
    fireEvent.click(open);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute('href', expectedHref);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(open).toHaveFocus();

    fireEvent.click(open);
    await screen.findByRole('dialog');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), {
      target: { value: document.events[0]!.title },
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value: '' } });
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Open original' }).length).toBeGreaterThan(0),
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Open original' })[0]!);
    await screen.findByRole('dialog');
    rerender(directory('media', load));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    rerender(directory('events', load));
    await screen.findByTestId('events-media-count');
    fireEvent.click(screen.getAllByRole('button', { name: 'Open original' })[0]!);
    await screen.findByRole('dialog');
    rerender(directory('events', () => Promise.resolve({ ...document })));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await screen.findByTestId('events-media-count');

    let resolveOld: ((value: ProductionEventsMediaDocumentV1) => void) | undefined;
    let resolveNew: ((value: ProductionEventsMediaDocumentV1) => void) | undefined;
    let oldSignal: AbortSignal | undefined;
    const oldLoad = vi.fn(
      (signal: AbortSignal) =>
        new Promise<ProductionEventsMediaDocumentV1>((resolve) => {
          oldSignal = signal;
          resolveOld = resolve;
        }),
    );
    const newLoad = vi.fn((signal: AbortSignal) => {
      void signal;
      return new Promise<ProductionEventsMediaDocumentV1>((resolve) => {
        resolveNew = resolve;
      });
    });
    rerender(directory('events', oldLoad));
    await waitFor(() => expect(oldLoad).toHaveBeenCalledOnce());
    rerender(directory('events', newLoad));
    await waitFor(() => expect(newLoad).toHaveBeenCalledOnce());
    expect(oldSignal?.aborted).toBe(true);
    resolveNew!({ ...document, events: [{ ...document.events[0]!, title: 'fresh event' }] });
    expect(await screen.findByText('fresh event')).toBeInTheDocument();
    resolveOld!({ ...document, events: [{ ...document.events[0]!, title: 'stale event' }] });
    await waitFor(() => expect(screen.queryByText('stale event')).not.toBeInTheDocument());
  });
});
