import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { UiLanguage } from '@wrn/ui-language';
import { appTopicLabel } from './home-editorial';
import { getWebsiteHomeCopy } from './website-home-copy';

const credits: Record<UiLanguage, string> = {
  de: 'WRN · Themenillustration',
  en: 'WRN · Thematic illustration',
  es: 'WRN · Ilustración temática',
  fr: 'WRN · Illustration thématique',
  it: 'WRN · Illustrazione tematica',
  pt: 'WRN · Ilustração temática',
  ru: 'WRN · Тематическая иллюстрация',
  el: 'WRN · Θεματική εικονογράφηση',
  tr: 'WRN · Tematik illüstrasyon',
};

function artworkKind(topics: readonly string[]) {
  if (topics.includes('Libraries') || topics.includes('Theory & Strategy')) return 'books';
  if (topics.includes('Labor Struggles')) return 'work';
  if (
    topics.includes('Indigenous Struggles') ||
    topics.includes('Eco-Anarchism') ||
    topics.includes('Animal Liberation')
  )
    return 'land';
  if (topics.includes('Radical Health & Disability')) return 'health';
  if (topics.includes('Occupations & Housing')) return 'homes';
  if (topics.includes('Cyberactivism') || topics.includes('Movement News')) return 'media';
  if (
    topics.includes('No Borders') ||
    topics.includes('Anti-Imperialism') ||
    topics.includes('Against War')
  )
    return 'world';
  return 'solidarity';
}

/** Original WRN vector artwork: no source photograph or claim about an actual event. */
export function WebsiteTopicArtwork({
  article,
  language,
}: {
  article: DirectoryArticle;
  language: UiLanguage;
}) {
  const kind = artworkKind(article.topics);
  const credit = credits[language];
  const topic = article.topics[0] ? appTopicLabel(article.topics[0], language) : article.sourceName;
  return (
    <figure className="app-start-illustration app-start-topic-art" data-wrn-topic-art={article.id}>
      <svg
        viewBox="0 0 960 540"
        role="img"
        aria-label={`${credit} · ${topic}`}
        lang={language}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="960" height="540" fill="#f0e4cc" />
        <path d="M0 0h960v80L0 365z" fill="#e7d6b7" />
        <path d="M0 445 960 182v358H0z" fill="#d6c4a4" />
        <circle cx="730" cy="157" r="117" fill="#b9253e" />
        <circle cx="730" cy="157" r="94" fill="none" stroke="#f0e4cc" strokeWidth="2" />
        <path d="M38 38h176M38 38v69M922 433v69H746" fill="none" stroke="#283d39" strokeWidth="4" />
        <g
          fill="none"
          stroke="#283d39"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {kind === 'land' && (
            <>
              <path d="m75 305 137-157 97 110 68-63 111 118 118-91 115 100h174M87 358q356-88 782 8M64 408q371-96 828 12M100 475q350-109 769 1" />
              <path
                d="M477 350v113m0-65q-88-9-88-73 76 0 88 73m0-29q77-3 77-66-67-6-77 66"
                fill="#496652"
              />
            </>
          )}
          {kind === 'books' && (
            <>
              <path d="M134 372h326V173H134zM460 372h326V173H460z" fill="#f0e4cc" />
              <path
                d="M134 173q163-53 326 0v240q-163-63-326-19zm326 0q163-53 326 0v221q-163-63-326 19z"
                fill="#f0e4cc"
              />
              <path
                d="M176 214q121-32 239 0m-239 48q121-32 239 0m-239 48q121-32 239 0m89-96q121-32 239 0m-239 48q121-32 239 0m-239 48q121-32 239 0"
                strokeWidth="4"
              />
              <path d="M160 432h592m-542 37h490" />
            </>
          )}
          {kind === 'work' && (
            <>
              <path d="M103 440V251l167-97v97l170-97v97h287v189z" fill="#f0e4cc" />
              <path d="M163 301h65v58h-65zm122 0h65v58h-65zm122 0h65v58h-65zM545 318h119v122H545zM155 473h600" />
              <path
                d="M564 246V93h44v153M738 318h120v122H738zm60 0v50h-26m-34 72 60-72 60 72"
                fill="#d6c4a4"
              />
            </>
          )}
          {kind === 'homes' && (
            <>
              <path
                d="m103 281 114-100 114 100v158H103zm252 0 114-100 114 100v158H355zm252 0 114-100 114 100v158H607z"
                fill="#f0e4cc"
              />
              <path d="M183 439V333h68v106m184 0V333h68v106m184 0V333h68v106M91 474h756" />
            </>
          )}
          {kind === 'media' && (
            <>
              <rect x="145" y="135" width="582" height="297" rx="14" fill="#f0e4cc" />
              <path d="M145 186h582m-528-27h4m28 0h4m28 0h4M189 231h195v153H189zm243 4h238m-238 49h238m-238 49h165m-165 49h238" />
              <path d="m216 351 46-49 40 31 42-53 24 71" stroke="#b9253e" />
              <path d="M280 470h312m-156-37v37" />
            </>
          )}
          {kind === 'health' && (
            <>
              <path
                d="M468 431 232 231c-103-101 48-240 149-144l87 84 86-84c101-96 252 43 149 144z"
                fill="#f0e4cc"
              />
              <path d="M207 265h157l39-69 55 153 45-103h221" stroke="#b9253e" strokeWidth="12" />
              <path d="M326 474h285" />
            </>
          )}
          {kind === 'world' && (
            <>
              <circle cx="440" cy="273" r="180" fill="#f0e4cc" />
              <ellipse cx="440" cy="273" rx="91" ry="180" />
              <path d="M260 273h360m-337-87h314m-314 174h314M440 93v360m223-104 91-33 70 46m-117-190 86 29 63-33" />
              <circle cx="754" cy="316" r="10" fill="#b9253e" stroke="none" />
            </>
          )}
          {kind === 'solidarity' && (
            <>
              <path
                d="M192 324v-69l63-32v-71l64-24 77 33 40 94v69m-233 0 18-66 70-7 53 47m-124-112 82-8 37 63"
                fill="#f0e4cc"
              />
              <path
                d="M520 324v-69l63-32v-71l64-24 77 33 40 94v69m-233 0 18-66 70-7 53 47m-124-112 82-8 37 63"
                fill="#f0e4cc"
              />
              <path d="M180 333h270v70H180zm328 0h270v70H508zM207 407v70m211-70v70m117-70v70m211-70v70" />
            </>
          )}
        </g>
        <g fill="#283d39" opacity=".15">
          <path d="M48 485h3v3h-3zm12 0h3v3h-3zm12 0h3v3h-3zm12 0h3v3h-3zm12 0h3v3h-3z" />
          <path d="M860 48h3v3h-3zm12 0h3v3h-3zm12 0h3v3h-3zm12 0h3v3h-3zm12 0h3v3h-3z" />
        </g>
      </svg>
      <figcaption lang={language}>
        <strong>{credit}</strong>
        {' · '}
        {getWebsiteHomeCopy(language).illustrationCaption}
      </figcaption>
    </figure>
  );
}
