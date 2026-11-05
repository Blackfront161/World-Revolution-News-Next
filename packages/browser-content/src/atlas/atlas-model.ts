import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';

export type AtlasEntry = Readonly<{
  id: string;
  name: string;
  country: string;
}>;

const countryAliases: Record<string, string> = {
  Argentina: 'AR',
  Australia: 'AU',
  Austria: 'AT',
  Belarus: 'BY',
  Belgium: 'BE',
  Brazil: 'BR',
  Canada: 'CA',
  Chile: 'CL',
  Czechia: 'CZ',
  France: 'FR',
  Germany: 'DE',
  Greece: 'GR',
  India: 'IN',
  Iraq: 'IQ',
  Italy: 'IT',
  Kenya: 'KE',
  Mexico: 'MX',
  Poland: 'PL',
  Russia: 'RU',
  'South Africa': 'ZA',
  Spain: 'ES',
  Switzerland: 'CH',
  'United Kingdom': 'GB',
  'United States': 'US',
  Türkiye: 'TR',
};

function countryCode(value: string | null): string | null {
  if (value === null) return null;
  if (/^[A-Z]{2}$/u.test(value)) return value;
  return countryAliases[value] ?? null;
}

/** Only unambiguous country observations enter the beta game. */
export function projectAtlasEntries(directory: MobileContentDirectory): AtlasEntry[] {
  const withdrawn = new Set(directory.withdrawals.endpointIds);
  const seen = new Set<string>();
  return directory.sources
    .filter((source) => !withdrawn.has(source.id) && !source.historicalHttp)
    .flatMap((source) => {
      const observations = source.observations.filter((item) => item.active !== false);
      const countries = [...new Set(observations.map((item) => countryCode(item.originCountry)))];
      const country = countries[0];
      if (countries.length !== 1 || !country) return [];
      return [{ id: source.id, name: source.name, country }];
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id))
    .filter((entry) => {
      const key = `${entry.name.toLocaleLowerCase('en')}:${entry.country}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export type AtlasRound = Readonly<{
  source: AtlasEntry;
  options: readonly string[];
  answer: string;
}>;

/** Deterministic rounds; wrong answers never duplicate the correct country. */
export function makeAtlasRound(entries: readonly AtlasEntry[], index: number): AtlasRound | null {
  const countries = [...new Set(entries.map((entry) => entry.country))].sort();
  if (countries.length < 4 || entries.length === 0 || !Number.isSafeInteger(index) || index < 0)
    return null;
  const source = entries[index % entries.length]!;
  const start = countries.indexOf(source.country);
  const distractors = [1, 2, 3].map((offset) => countries[(start + offset) % countries.length]!);
  const position = index % 4;
  const options = distractors.toSpliced(position, 0, source.country);
  return { source, options, answer: source.country };
}
