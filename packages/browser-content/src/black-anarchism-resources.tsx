import type { UiLanguage } from '@wrn/ui-language';

/** Curated original links, not admitted articles, copied texts, or live feeds. */
export const blackAnarchismResources = [
  {
    id: 'freedom-black-anarchism-2026',
    name: 'Freedom News · Black anarchism (Summer 2026)',
    originalUrl: 'https://freedomnews.org.uk/2026/05/04/freedom-summer-2026-black-anarchism/',
  },
  {
    id: 'freedom-continuing-necessity-2026',
    name: 'Freedom News · The continuing necessity of Black anarchism',
    originalUrl:
      'https://freedomnews.org.uk/2026/05/17/the-continuing-necessity-of-black-anarchism/',
  },
  {
    id: 'dugout-radical-archive',
    name: 'The Dugout · Radical Archive',
    originalUrl: 'https://www.thedugoutpodcast.com/radical-archive',
  },
  {
    id: 'black-rose-reader',
    name: 'Black Rose / Rosa Negra · Black Anarchism: A Reader',
    originalUrl: 'https://www.blackrosefed.org/black-anarchism-a-reader/',
  },
  {
    id: 'anarchist-library-black-anarchy',
    name: 'The Anarchist Library · Black Anarchy',
    originalUrl: 'https://theanarchistlibrary.org/category/topic/black-anarchy',
  },
  {
    id: 'true-leap-press',
    name: 'True Leap Press · Archive',
    originalUrl: 'https://trueleappress.wordpress.com/',
  },
  {
    id: 'anarkata-workshop',
    name: 'Anarkata Workshop · Resources',
    originalUrl: 'https://anarkataworkshop.wixsite.com/anarkataaself-direct',
  },
] as const;

const copy: Record<UiLanguage, { title: string; intro: string; open: string }> = {
  en: {
    title: 'Black anarchism',
    intro:
      'Selected original links on Black anarchism and related Black radical traditions. No content is republished here.',
    open: 'Open original',
  },
  de: {
    title: 'Schwarzer Anarchismus',
    intro:
      'Ausgewählte Originallinks zu Schwarzem Anarchismus und verwandten Schwarzen radikalen Traditionen. Hier werden keine Inhalte erneut veröffentlicht.',
    open: 'Original öffnen',
  },
  es: {
    title: 'Anarquismo negro',
    intro:
      'Enlaces originales seleccionados sobre el anarquismo negro y otras tradiciones radicales negras afines. No se republican contenidos aquí.',
    open: 'Abrir original',
  },
  fr: {
    title: 'Anarchisme noir',
    intro:
      'Liens originaux sélectionnés sur l’anarchisme noir et les traditions radicales noires proches. Aucun contenu n’est republié ici.',
    open: 'Ouvrir l’original',
  },
  it: {
    title: 'Anarchismo nero',
    intro:
      'Link originali selezionati sull’anarchismo nero e sulle tradizioni radicali nere affini. Nessun contenuto viene ripubblicato qui.',
    open: 'Apri l’originale',
  },
  pt: {
    title: 'Anarquismo negro',
    intro:
      'Links originais selecionados sobre o anarquismo negro e tradições radicais negras relacionadas. Nenhum conteúdo é republicado aqui.',
    open: 'Abrir original',
  },
  ru: {
    title: 'Чёрный анархизм',
    intro:
      'Подборка ссылок на материалы о чёрном анархизме и близких чёрных радикальных традициях. Материалы здесь не перепубликуются.',
    open: 'Открыть оригинал',
  },
  el: {
    title: 'Μαύρος αναρχισμός',
    intro:
      'Επιλεγμένοι σύνδεσμοι για τον Μαύρο αναρχισμό και συγγενείς Μαύρες ριζοσπαστικές παραδόσεις. Δεν αναδημοσιεύεται περιεχόμενο εδώ.',
    open: 'Άνοιγμα πρωτοτύπου',
  },
  tr: {
    title: 'Siyah anarşizm',
    intro:
      'Siyah anarşizm ve ilgili Siyah radikal gelenekler üzerine seçilmiş özgün bağlantılar. İçerikler burada yeniden yayımlanmaz.',
    open: 'Özgün kaynağı aç',
  },
};

export function BlackAnarchismResources({
  language,
  headingLevel,
  listClassName,
}: {
  language: UiLanguage;
  headingLevel: 2 | 3;
  listClassName: string;
}) {
  const labels = copy[language];
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section
      aria-labelledby="black-anarchism-resources-title"
      data-testid="black-anarchism-resources"
    >
      <Heading id="black-anarchism-resources-title">{labels.title}</Heading>
      <p>{labels.intro}</p>
      <ul className={listClassName}>
        {blackAnarchismResources.map((resource) => (
          <li key={resource.id}>
            <strong lang="en">{resource.name}</strong>
            <p>
              <a
                href={resource.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
              >
                {labels.open}
              </a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
