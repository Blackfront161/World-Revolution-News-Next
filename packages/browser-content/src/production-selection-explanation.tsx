import type { LocalPersonalizationStateV1, ProductionArticleV1 } from '@wrn/content-contracts';
import { getSourcePreference } from '@wrn/domain';
import { getUiCopy, type UiLanguage } from '@wrn/ui-language';
import { getProductionSelectionCopy } from '@wrn/ui-language/source-preferences';
import type { ProductionContentOfflineControllerResult } from './production-content-offline-controller';
import { getProductionPreferenceMatches } from './production-content-view';
import { useSourcePreferences } from './source-preferences-ui';

/** Rendered only by personalized production cards, never the anonymous Home. */
export function ProductionSelectionExplanation({
  article,
  result,
  preferences,
  language,
}: {
  article: ProductionArticleV1;
  result: ProductionContentOfflineControllerResult | null;
  preferences?: LocalPersonalizationStateV1 | undefined;
  language: UiLanguage;
}) {
  const source = useSourcePreferences();
  const activeSources = source.state.choices.some((choice) => choice.catalog === 'production');
  const matches = preferences ? getProductionPreferenceMatches(article, result, preferences) : null;
  if ((!preferences && !activeSources) || (preferences && !matches)) return null;
  const copy = getProductionSelectionCopy(language);
  const ui = getUiCopy(language);
  const followed = getSourcePreference(source.state, 'production', article.source.id) === 'follow';
  const interests = {
    'fan-culture': ui.personalizationInterestFanCulture,
    football: ui.personalizationInterestFootball,
    'local-organizing': ui.personalizationInterestLocalOrganizing,
    'media-technology': ui.personalizationInterestMediaTechnology,
    'movement-news': ui.personalizationInterestMovementNews,
    sport: ui.personalizationInterestSport,
    'women-feminist': ui.personalizationInterestWomenFeminist,
  };
  const regions = {
    africa: ui.personalizationRegionAfrica,
    asia: ui.personalizationRegionAsia,
    europe: ui.personalizationRegionEurope,
    global: ui.personalizationRegionGlobal,
    'latin-america-caribbean': ui.personalizationRegionLatinAmericaCaribbean,
    'middle-east-north-africa': ui.personalizationRegionMiddleEastNorthAfrica,
    'north-america': ui.personalizationRegionNorthAmerica,
    oceania: ui.personalizationRegionOceania,
  };
  const languages = {
    de: 'Deutsch',
    el: 'Ελληνικά',
    en: 'English',
    es: 'Español',
    fr: 'Français',
    it: 'Italiano',
    pt: 'Português',
    ru: 'Русский',
    tr: 'Türkçe',
  };
  return (
    <details className="production-selection-explanation" lang={language}>
      <summary aria-label={`${copy.title}: ${article.title}`}>{copy.title}</summary>
      <p>{copy.local}</p>
      <dl>
        {!!matches?.interestIds.length && (
          <>
            <dt>{ui.personalizationInterests}</dt>
            <dd>{matches.interestIds.map((id) => interests[id]).join(', ')}</dd>
          </>
        )}
        {!!matches?.regionIds.length && (
          <>
            <dt>{ui.personalizationRegions}</dt>
            <dd>{matches.regionIds.map((id) => regions[id]).join(', ')}</dd>
          </>
        )}
        {!!matches?.contentLanguageIds.length && (
          <>
            <dt>{ui.personalizationContentLanguages}</dt>
            <dd>
              {matches.contentLanguageIds.map((id, index) => (
                <span key={id}>
                  {index > 0 ? ', ' : ''}
                  <span lang={id}>{languages[id]}</span>
                </span>
              ))}
            </dd>
          </>
        )}
        {followed && (
          <>
            <dt>{copy.followed}</dt>
            <dd>{article.source.name}</dd>
          </>
        )}
      </dl>
      {activeSources && !followed && <p>{copy.otherSource}</p>}
    </details>
  );
}
