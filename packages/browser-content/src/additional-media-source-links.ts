/** Publisher directories only: no episode admission, feed loading, playback or media reuse. */
export type AdditionalAudioSourceLink = Readonly<{
  id: string;
  name: string;
  language: 'es' | 'it';
  originalUrl: string;
}>;

const sources: readonly AdditionalAudioSourceLink[] = [
  {
    id: 'audio-source:radio-almaina',
    name: 'Radio Almaina',
    language: 'es',
    originalUrl: 'https://podcast.radioalmaina.org/',
  },
  {
    id: 'audio-source:radio-zapatista',
    name: 'Radio Zapatista',
    language: 'es',
    originalUrl: 'https://radiozapatista.org/?cat=1',
  },
  {
    id: 'audio-source:radio-fragola',
    name: 'Radio Fragola',
    language: 'it',
    originalUrl: 'https://www.radiofragola.com/',
  },
];

export const additionalAudioSourceLinks: readonly AdditionalAudioSourceLink[] = Object.freeze(
  sources.map((source) => Object.freeze(source)),
);
