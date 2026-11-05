import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import { AtlasBeta } from '../../../packages/browser-content/src/atlas/AtlasBeta';
import {
  makeAtlasRound,
  projectAtlasEntries,
} from '../../../packages/browser-content/src/atlas/atlas-model';

function fixture(): MobileContentDirectory {
  const countries = [
    ['Germany', 'Europe'],
    ['France', 'Europe'],
    ['Kenya', 'East Africa'],
    ['India', 'South Asia'],
    ['Brazil', 'South America'],
  ];
  return {
    sources: countries.map(([country, region], index) => ({
      id: `source-${index}`,
      name: `Source ${index}`,
      historicalHttp: false,
      observations: [{ originCountry: country, originRegion: region, active: true }],
    })),
    withdrawals: { endpointIds: ['source-1'] },
  } as unknown as MobileContentDirectory;
}

describe('World Revolution Atlas beta', () => {
  it('localizes the visible and accessible atlas title', () => {
    render(<AtlasBeta language="de" load={async () => ({ projection: fixture() })} />);
    expect(screen.getByRole('region', { name: 'Atlas der Weltrevolution' })).toContainElement(
      screen.getByRole('heading', { name: 'Atlas der Weltrevolution' }),
    );
  });

  it('uses only non-withdrawn, unambiguous source metadata and distinct quiz choices', () => {
    const directory = fixture();
    directory.sources.push({
      id: 'ambiguous',
      name: 'Ambiguous',
      historicalHttp: false,
      observations: [
        { originCountry: 'Germany', originRegion: 'Europe', active: true },
        { originCountry: 'France', originRegion: 'Europe', active: true },
      ],
    } as MobileContentDirectory['sources'][number]);
    directory.sources.push({
      id: 'duplicate',
      name: 'Source 0',
      historicalHttp: false,
      observations: [{ originCountry: 'DE', originRegion: 'Europe', active: true }],
    } as MobileContentDirectory['sources'][number]);
    const entries = projectAtlasEntries(directory);
    expect(entries.map((entry) => entry.country)).toEqual(['DE', 'KE', 'IN', 'BR']);
    expect(entries.find((entry) => entry.id === 'ambiguous')).toBeUndefined();
    const round = makeAtlasRound(entries, 0)!;
    expect(new Set(round.options).size).toBe(4);
    expect(round.options).toContain(round.answer);
    expect(makeAtlasRound(entries.slice(0, 3), 0)).toBeNull();
  });

  it('lets a reader explore regions and answer without storing a score or contacting source sites', async () => {
    let reads = 0;
    render(
      <AtlasBeta
        language="en"
        load={async () => {
          reads++;
          return { projection: fixture() };
        }}
      />,
    );
    expect(reads).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Open atlas' }));
    expect(await screen.findByLabelText('Explore countries')).toBeInTheDocument();
    expect(reads).toBe(1);
    expect(screen.queryByText('Source 1')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Explore countries'), { target: { value: 'KE' } });
    expect(within(screen.getByRole('list')).getByText('Source 2')).toBeInTheDocument();
    expect(within(screen.getByRole('list')).queryByText('Source 0')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Germany' }));
    expect(screen.getByRole('button', { name: 'Germany' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Correct.')).toBeInTheDocument();
    expect(screen.getByText('Correct answers: 1/1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));
    expect(screen.getByText('Correct answers: 1/1')).toBeInTheDocument();
  });
});
