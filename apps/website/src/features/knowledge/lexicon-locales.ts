import translations from './data/lexicon-locales.json';

type Term = {
  id: string;
  title: { de: string; en: string };
  summary: { de: string; en: string };
  practice: { de: string; en: string };
  debate: { de: string; en: string };
};
type Translation = { title: string; summary: string; practice: string; debate: string };
export function localizedKnowledgeTerm(
  term: Term,
  language: string,
  document: unknown = translations,
) {
  const fallback = language === 'de' ? 'de' : 'en';
  const base = {
    language: fallback,
    draft: false,
    title: term.title[fallback],
    summary: term.summary[fallback],
    practice: term.practice[fallback],
    debate: term.debate[fallback],
  };
  if (language !== 'fr' && language !== 'es') return base;
  if (!document || typeof document !== 'object') return base;
  const value = document as {
    schema?: string;
    rights?: string;
    editorialStatus?: string;
    terms?: Record<string, Record<string, Translation>>;
  };
  if (value.schema !== 'wrn.lexicon-locales.v1' || value.rights !== 'WRN-original-editorial-text')
    return base;
  const text = value.terms?.[term.id]?.[language];
  if (
    !text ||
    !['title', 'summary', 'practice', 'debate'].every((field) => {
      const content = text[field as keyof Translation];
      return (
        typeof content === 'string' &&
        !!content.trim() &&
        content.length <= 5000 &&
        !/[<>]/u.test(content) &&
        ![...content].some((character) => character.charCodeAt(0) < 32)
      );
    })
  )
    return base;
  return { ...text, language, draft: value.editorialStatus === 'draft' };
}
