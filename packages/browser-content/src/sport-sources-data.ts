export type SportSourceCategory =
  | 'critical-football-journalism'
  | 'queer-fan-culture-antidiscrimination'
  | 'antidiscrimination'
  | 'history-inclusion'
  | 'community-sport-right-to-sport'
  | 'sport-for-all'
  | 'sport-society'
  | 'feminist-perspectives'
  | 'sport-politics';
export type SportFanSourceCategory =
  | 'fan-antifascist'
  | 'fan-rights-democracy'
  | 'fan-antidiscrimination'
  | 'fan-queer-gender'
  | 'fan-community-solidarity'
  | 'fan-sport-adjacent';

export type SportSource = Readonly<{
  id: string;
  name: string;
  category: SportSourceCategory;
  originalLanguage: 'de' | 'en' | 'es' | 'fr' | 'it' | 'pt';
  originalUrl: string;
  sourceEvidenceUrl: string;
  observedDate: '2026-09-20';
  directoryOnly: true;
  rights: 'unknown';
  feed: 'unchecked' | 'observed';
  feedUrl?: string;
  feedFormat?: 'RSS' | 'Atom';
  linkedSportNotePublisher?: true;
}>;

export type SportFanSource = Omit<SportSource, 'category'> & {
  category: SportFanSourceCategory;
  politicalClaimLevel:
    'explicit' | 'anti-discrimination' | 'community-democracy' | 'sport-adjacent';
};

/** Directory references and observed feed endpoints; no blanket article admission. */
export const sportSources: readonly SportSource[] = [
  {
    id: 'ballesterer',
    name: 'ballesterer',
    category: 'critical-football-journalism',
    originalLanguage: 'de',
    originalUrl: 'https://ballesterer.at/redaktion/',
    sourceEvidenceUrl: 'https://ballesterer.at/redaktion/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
  },
  {
    id: 'qff',
    name: 'Queer Football Fanclubs (QFF)',
    category: 'queer-fan-culture-antidiscrimination',
    originalLanguage: 'de',
    originalUrl: 'https://queerfootballfanclubs.org/ueber-uns',
    sourceEvidenceUrl: 'https://queerfootballfanclubs.org/ueber-uns',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
  },
  {
    id: 'fare',
    name: 'Fare',
    category: 'antidiscrimination',
    originalLanguage: 'en',
    originalUrl: 'https://farenet.org/',
    sourceEvidenceUrl: 'https://farenet.org/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
  },
  {
    id: 'football-makes-history',
    name: 'Football Makes History',
    category: 'history-inclusion',
    originalLanguage: 'en',
    originalUrl: 'https://footballmakeshistory.eu/',
    sourceEvidenceUrl: 'https://footballmakeshistory.eu/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
  },
  {
    id: 'fsgt',
    name: 'FSGT',
    category: 'community-sport-right-to-sport',
    originalLanguage: 'fr',
    originalUrl: 'https://www.fsgt.org/la-fsgt/',
    sourceEvidenceUrl: 'https://www.fsgt.org/la-fsgt/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'observed',
    feedUrl: 'https://www.fsgt.org/feed/',
    feedFormat: 'RSS',
  },
  {
    id: 'uisp',
    name: 'UISP',
    category: 'sport-for-all',
    originalLanguage: 'it',
    originalUrl: 'https://www.uisp.it/nazionale/pagina/chi-siamo',
    sourceEvidenceUrl: 'https://www.uisp.it/nazionale/pagina/chi-siamo',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
  },
  {
    id: 'africa-is-a-country',
    name: 'Africa Is a Country',
    category: 'sport-society',
    originalLanguage: 'en',
    originalUrl: 'https://africasacountry.com/',
    sourceEvidenceUrl: 'https://www.africasacountry.com/department/football-is-a-country?page=6',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'observed',
    feedUrl: 'https://africasacountry.com/feed/',
    feedFormat: 'Atom',
    linkedSportNotePublisher: true,
  },
  {
    id: 'african-feminism',
    name: 'African Feminism',
    category: 'feminist-perspectives',
    originalLanguage: 'en',
    originalUrl: 'https://africanfeminism.com/',
    sourceEvidenceUrl: 'https://africanfeminism.com/home/about/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    linkedSportNotePublisher: true,
  },
  {
    id: 'groundxero',
    name: 'Groundxero',
    category: 'sport-politics',
    originalLanguage: 'en',
    originalUrl: 'https://www.groundxero.in/',
    sourceEvidenceUrl: 'https://www.groundxero.in/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    linkedSportNotePublisher: true,
  },
];

/** Independently reviewed supporter groups and networks; directory-only and no provider fetch. */
export const sportFanSources: readonly SportFanSource[] = [
  {
    id: 'fan-roter-stern-leipzig',
    name: "Roter Stern Leipzig '99 e.V.",
    category: 'fan-antifascist',
    originalLanguage: 'de',
    originalUrl: 'https://rotersternleipzig.de/',
    sourceEvidenceUrl: 'https://rotersternleipzig.de/rsl-selbstverstaendnis-rsl-thesen/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'explicit',
  },
  {
    id: 'fan-fc-st-pauli',
    name: 'FC St. Pauli fan clubs',
    category: 'fan-antidiscrimination',
    originalLanguage: 'de',
    originalUrl: 'https://www.fcstpauli.com/',
    sourceEvidenceUrl: 'https://leichtesprache.fcstpauli.com/de-de/werte',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'anti-discrimination',
  },
  {
    id: 'fan-f-in',
    name: 'F_in Netzwerk Frauen im Fußball',
    category: 'fan-queer-gender',
    originalLanguage: 'de',
    originalUrl: 'https://www.f-in.org/',
    sourceEvidenceUrl: 'https://www.f-in.org/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'anti-discrimination',
  },
  {
    id: 'fan-alerta-network',
    name: 'Alerta Network',
    category: 'fan-antifascist',
    originalLanguage: 'en',
    originalUrl: 'https://alertanetwork.org/',
    sourceEvidenceUrl: 'https://alertanetwork.org/manifesto/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'explicit',
  },
  {
    id: 'fan-rebel-ultras',
    name: 'Rebel Ultras',
    category: 'fan-antifascist',
    originalLanguage: 'en',
    originalUrl: 'https://rebelultras.com/',
    sourceEvidenceUrl: 'https://rebelultras.com/the-network/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'explicit',
  },
  {
    id: 'fan-football-supporters-europe',
    name: 'Football Supporters Europe',
    category: 'fan-rights-democracy',
    originalLanguage: 'en',
    originalUrl: 'https://www.fanseurope.org/',
    sourceEvidenceUrl: 'https://www.fanseurope.org/about-fse/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'community-democracy',
  },
  {
    id: 'fan-football-v-homophobia',
    name: 'Football v Homophobia',
    category: 'fan-queer-gender',
    originalLanguage: 'en',
    originalUrl: 'https://www.footballvhomophobia.com/',
    sourceEvidenceUrl: 'https://www.footballvhomophobia.com/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'anti-discrimination',
  },
  {
    id: 'fan-kick-it-out',
    name: 'Kick It Out',
    category: 'fan-antidiscrimination',
    originalLanguage: 'en',
    originalUrl: 'https://www.kickitout.org/',
    sourceEvidenceUrl: 'https://www.kickitout.org/about-us',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'anti-discrimination',
  },
  {
    id: 'fan-clapton-community-fc',
    name: 'Clapton Community FC',
    category: 'fan-community-solidarity',
    originalLanguage: 'en',
    originalUrl: 'https://www.claptoncfc.co.uk/',
    sourceEvidenceUrl: 'https://www.claptoncfc.co.uk/about-clapton-community-fc/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'explicit',
  },
  {
    id: 'fan-fc-united-manchester',
    name: 'FC United of Manchester',
    category: 'fan-rights-democracy',
    originalLanguage: 'en',
    originalUrl: 'https://fc-utd.co.uk/',
    sourceEvidenceUrl: 'https://fc-utd.co.uk/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'community-democracy',
  },
  {
    id: 'fan-bukaneros',
    name: 'Bukaneros',
    category: 'fan-antifascist',
    originalLanguage: 'es',
    originalUrl: 'https://bukaneros.org/',
    sourceEvidenceUrl: 'https://bukaneros.org/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'explicit',
  },
  {
    id: 'fan-uisp-progetto-ultra',
    name: 'Progetto Ultrà (UISP)',
    category: 'fan-community-solidarity',
    originalLanguage: 'it',
    originalUrl: 'https://www.uisp.it/milano/pagina/progetto-ultr',
    sourceEvidenceUrl: 'https://www.uisp.it/milano/pagina/progetto-ultr',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'anti-discrimination',
  },
  {
    id: 'fan-mondiali-antirazzisti',
    name: 'Mondiali Antirazzisti',
    category: 'fan-community-solidarity',
    originalLanguage: 'it',
    originalUrl: 'https://www.uisp.it/firenze/pagina/mondiali-antirazzisti-uisp-firenze-2026',
    sourceEvidenceUrl: 'https://www.uisp.it/firenze/pagina/mondiali-antirazzisti-uisp-firenze-2026',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'anti-discrimination',
  },
  {
    id: 'fan-association-nationale-supporters',
    name: 'Association Nationale des Supporters',
    category: 'fan-rights-democracy',
    originalLanguage: 'fr',
    originalUrl: 'https://www.association-nationale-supporters.fr/',
    sourceEvidenceUrl: 'https://www.association-nationale-supporters.fr/qui-sommes-nous/',
    observedDate: '2026-09-20',
    directoryOnly: true,
    rights: 'unknown',
    feed: 'unchecked',
    politicalClaimLevel: 'community-democracy',
  },
];
