import status from './data/lexicon-editorial-status.json';
import type { MobileKnowledgeV1 } from '@wrn/content-contracts/mobile-knowledge-v1';
import type { UiLanguage } from '@wrn/ui-language';

export function draftKnowledgeTermIds(document: MobileKnowledgeV1) {
  if (
    status.schema !== 'wrn.website-lexicon-editorial-status.v1' ||
    status.sourceCommit !== document.sourceCommit ||
    status.inputLexiconSha256 !== document.input.lexiconSha256 ||
    status.terms.length !== 10 ||
    new Set(status.terms.map((term) => term.id)).size !== status.terms.length ||
    status.terms.some(
      (term) =>
        term.status !== 'draft' ||
        !document.lexicon.terms.some((entry) => entry.id === term.id) ||
        term.revision.version !== 'knowledge-expansion-4' ||
        term.revision.date !== '2026-10-03' ||
        !term.revision.note.includes('independent editorial review pending'),
    )
  )
    throw new TypeError('lexicon-editorial-status-binding');
  return new Set(status.terms.map((term) => term.id));
}

export const knowledgeDraftCopy: Record<UiLanguage, string> = {
  de: 'WRN-Entwurf · Die unabhängige redaktionelle Prüfung steht noch aus.',
  en: 'WRN draft · Independent editorial review is pending.',
  es: 'Borrador WRN · La revisión editorial independiente está pendiente.',
  fr: 'Brouillon WRN · La révision éditoriale indépendante reste à effectuer.',
  it: 'Bozza WRN · La revisione editoriale indipendente è ancora in attesa.',
  pt: 'Rascunho WRN · A revisão editorial independente está pendente.',
  ru: 'Черновик WRN · Независимая редакционная проверка ещё не завершена.',
  el: 'Προσχέδιο WRN · Εκκρεμεί ανεξάρτητος συντακτικός έλεγχος.',
  tr: 'WRN taslağı · Bağımsız editoryal inceleme bekleniyor.',
};
