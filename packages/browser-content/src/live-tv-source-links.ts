/** Official publisher pages only; no stream, programme or media asset is admitted here. */
export type LiveTvSourceLink = Readonly<{
  id: string;
  copyKey: 'democracyNow' | 'barricada' | 'abajo' | 'fs1';
  name: string;
  language: 'en' | 'es' | 'de';
  originalUrl: string;
  location: string;
}>;

const sources: readonly LiveTvSourceLink[] = [
  {
    id: 'live-tv:democracy-now',
    copyKey: 'democracyNow',
    name: 'Democracy Now!',
    language: 'en',
    originalUrl: 'https://www.democracynow.org/live/todays_democracy_now',
    location: 'United States',
  },
  {
    id: 'live-tv:barricada-tv',
    copyKey: 'barricada',
    name: 'Barricada TV',
    language: 'es',
    originalUrl: 'https://barricadatv.blogspot.com/',
    location: 'Buenos Aires, Argentina',
  },
  {
    id: 'live-tv:abajo-e-la-linea',
    copyKey: 'abajo',
    name: 'Abajo e’ la Línea',
    language: 'es',
    originalUrl: 'https://abajoelalinea.cl/',
    location: 'Temuco, Chile',
  },
  {
    id: 'live-tv:fs1',
    copyKey: 'fs1',
    name: 'FS1',
    language: 'de',
    originalUrl: 'https://fs1.tv/',
    location: 'Salzburg, Austria',
  },
];

export const liveTvSourceLinks: readonly LiveTvSourceLink[] = Object.freeze(
  sources.map((source) => Object.freeze(source)),
);
