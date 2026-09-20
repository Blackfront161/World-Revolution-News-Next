import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptySourcePreferences } from '@wrn/domain';
import { projectProductionRegionalEventsV1 } from '@wrn/content-contracts/production-regional-events-v1';
import {
  loadCurrentRegionalEvents,
  regionalInputSha256,
} from '../../../packages/browser-content/src/regional-events/data';
import {
  CurrentRegionalEvents,
  formatRegionalSchedule,
} from '../../../packages/browser-content/src/regional-events/regional-events';
import {
  emptyRegionalSelection,
  isRegionalSelection,
  openRegionalSelectionStore,
} from '../../../packages/browser-content/src/regional-events/selection-store';
import { ProductionHome } from '../../../packages/browser-content/src/production-home';
import { ProductionEventsMediaDirectory } from '../../../packages/browser-content/src/events-media-directory';

const now = Date.parse('2026-09-12T14:00:00.000Z');
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(now);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('actual regional client', () => {
  it('pins the reviewed actual input and projects only the explicitly chosen region', async () => {
    expect(regionalInputSha256).toBe(
      'fa62d54dfaf562f41b4a4a5f54e6338985e2d84d9e9dc92b0e21d894ff17174b',
    );
    const catalog = await loadCurrentRegionalEvents();
    expect(catalog?.events).toHaveLength(5);
    expect(
      catalog?.sources.find((source) => source.id === 'source-noticias-anarquistas')?.checkedOn,
    ).toBe('2026-09-11');
    expect(projectProductionRegionalEventsV1(catalog!, emptyRegionalSelection, now).status).toBe(
      'unselected',
    );
    expect(
      projectProductionRegionalEventsV1(
        catalog!,
        { continentId: 'continent-europe', countryId: 'country-gb', regionId: 'region-london' },
        now,
      ).events.map((event) => event.id),
    ).toEqual(['event-london-anarchist-bookfair-2026']);
  });
  it('preserves date-only precision and London summer time', async () => {
    const catalog = (await loadCurrentRegionalEvents())!;
    expect(formatRegionalSchedule(catalog.events[0]!.schedule, 'de')).toContain(
      'Uhrzeit nicht angegeben',
    );
    expect(formatRegionalSchedule(catalog.events[0]!.schedule, 'de')).not.toContain('00:00');
    const london = formatRegionalSchedule(catalog.events[1]!.schedule, 'de');
    expect(london).toContain('10:00');
    expect(london).toContain('18:00');
    expect(london).toContain('GMT+1');
  });
  it('validates minimal selection without accepting extra location or history fields', async () => {
    expect(isRegionalSelection(emptyRegionalSelection)).toBe(true);
    expect(isRegionalSelection({ ...emptyRegionalSelection, coordinates: [1, 2] })).toBe(false);
    expect(isRegionalSelection({ ...emptyRegionalSelection, regionId: 'region-london' })).toBe(
      false,
    );
    expect(isRegionalSelection({ ...emptyRegionalSelection, continentId: 'bad\n' })).toBe(false);
    await expect(openRegionalSelectionStore('other' as never)).rejects.toMatchObject({
      code: 'incompatible-storage',
    });
  });
  it('permits temporary filtering when IDB is unavailable, resets descendants and exposes original sources', async () => {
    render(<CurrentRegionalEvents client="mobile" language="de" />);
    const continent = await screen.findByLabelText('Kontinent');
    fireEvent.change(continent, { target: { value: 'continent-europe' } });
    fireEvent.change(screen.getByLabelText('Land'), { target: { value: 'country-gb' } });
    fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'region-london' } });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'London Anarchist Bookfair 2026' })).toHaveAttribute(
      'lang',
      'en',
    );
    expect(screen.getByRole('link', { name: 'Originalankündigung öffnen' })).toHaveAttribute(
      'referrerpolicy',
      'no-referrer',
    );
    expect(await screen.findByText(/Die Auswahl kann hier nicht gespeichert/)).toBeVisible();
    fireEvent.change(continent, { target: { value: 'continent-south-america' } });
    expect(screen.getByLabelText('Land')).toHaveValue('');
    expect(screen.getByLabelText('Region')).toHaveValue('');
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
  it('removes the current event list when the clock reaches validUntil', async () => {
    render(<CurrentRegionalEvents client="website" language="de" />);
    fireEvent.change(await screen.findByLabelText('Kontinent'), {
      target: { value: 'continent-europe' },
    });
    expect(screen.getAllByRole('article')).toHaveLength(2);
    vi.mocked(Date.now).mockReturnValue(Date.parse('2026-09-19T00:00:00.000Z'));
    fireEvent.focus(window);
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByText(/Dieser Stand ist nicht mehr aktuell/)).toBeVisible();
    expect(screen.getByText('Quellen der Termine')).toBeVisible();
  });
  it('places the actual regional slot on Home without requiring historical directory loading', async () => {
    render(
      <ProductionHome
        articles={[]}
        language="de"
        sourcePreferences={emptySourcePreferences()}
        renderCard={() => null}
        regionalEvents={<CurrentRegionalEvents client="mobile" language="de" />}
      />,
    );
    expect(
      await within(screen.getByTestId('production-home')).findByRole('heading', {
        name: 'Termine in deiner Region',
        level: 2,
      }),
    ).toBeVisible();
  });
  it('keeps current regional events available when the historical directory fails', async () => {
    render(
      <ProductionEventsMediaDirectory
        load={async () => {
          throw new Error('test');
        }}
        mode="events"
        language="de"
        headingId="events-heading"
        headingRef={createRef<HTMLHeadingElement>()}
        currentEvents={<CurrentRegionalEvents client="mobile" language="de" headingLevel={3} />}
      />,
    );
    fireEvent.change(await screen.findByLabelText('Kontinent'), {
      target: { value: 'continent-europe' },
    });
    expect(
      screen.getByRole('heading', { name: 'Termine in deiner Region', level: 3 }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'London Anarchist Bookfair 2026', level: 4 }),
    ).toBeVisible();
  });
});
