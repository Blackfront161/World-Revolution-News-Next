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

const now = Date.parse('2026-11-13T20:45:00.000Z');
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(now);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('actual regional client', () => {
  it('pins the reviewed actual input and projects only the explicitly chosen region', async () => {
    expect(regionalInputSha256).toBe(
      '12f7b72c4e258319d004b4a82496abbbe6c234d2f242edcb71bf8a65ff4d7ff2',
    );
    const catalog = await loadCurrentRegionalEvents();
    expect(catalog?.events).toHaveLength(5);
    expect(catalog?.sources.every((source) => source.checkedOn === '2026-11-13')).toBe(true);
    expect(projectProductionRegionalEventsV1(catalog!, emptyRegionalSelection, now).status).toBe(
      'unselected',
    );
    expect(
      projectProductionRegionalEventsV1(
        catalog!,
        { continentId: 'continent-europe', countryId: 'country-gb', regionId: 'region-london' },
        now,
      ).events.map((event) => event.id),
    ).toEqual(['event-london-state-histories-2026-11-26']);
  });
  it('preserves date-only precision and exact source-local times', async () => {
    const catalog = (await loadCurrentRegionalEvents())!;
    const santiago = catalog.events.find(
      (event) => event.id === 'event-santiago-dialogo-judicial-derechos-humanos-2026-11-25',
    )!;
    expect(formatRegionalSchedule(santiago.schedule, 'de')).toContain('Uhrzeit nicht angegeben');
    expect(formatRegionalSchedule(santiago.schedule, 'de')).not.toContain('00:00');
    const nyc = formatRegionalSchedule(
      catalog.events.find(
        (event) => event.id === 'event-interference-volunteer-orientation-2026-11-16',
      )!.schedule,
      'de',
    );
    expect(nyc).toContain('19:00');
    expect(nyc).toContain('20:30');
    const london = formatRegionalSchedule(
      catalog.events.find((event) => event.id === 'event-london-state-histories-2026-11-26')!
        .schedule,
      'de',
    );
    expect(london).toContain('18:00');
    expect(london).toContain('20:00');
    const manchester = catalog.events.find(
      (event) => event.id === 'event-manchester-creative-writing-industry-day-2026',
    )!;
    expect(formatRegionalSchedule(manchester.schedule, 'de')).toContain('Uhrzeit nicht angegeben');
    expect(formatRegionalSchedule(manchester.schedule, 'de')).not.toContain('00:00');
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
    expect(
      screen.getByRole('heading', {
        name: 'State Histories: The Politics of Teaching the Past in Iran',
      }),
    ).toHaveAttribute('lang', 'en');
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
    vi.mocked(Date.now).mockReturnValue(Date.parse('2026-11-20T20:42:17.000Z'));
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
      screen.getByRole('heading', {
        name: 'State Histories: The Politics of Teaching the Past in Iran',
        level: 4,
      }),
    ).toBeVisible();
  });
});
