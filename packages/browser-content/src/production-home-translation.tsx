import { useEffect, useState } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import { formatUiCopy } from '@wrn/ui-language';
import { getProductionTranslationCopy } from '@wrn/ui-language/production-translation';
import { isTranslationSourceLanguage } from '@wrn/api-contracts/translation-v1';
import type { ProductionArticleV1 } from '@wrn/content-contracts';
import {
  productionTranslationRenderKey,
  type DirectoryTitleTranslation,
  type ProductionTranslationAdapter,
  type ProductionTranslationAuthority,
  type ProductionTranslationOutcome,
} from './production-translation';

const homeCopy: Record<UiLanguage, { original: string; notice: string; unavailable: string }> = {
  de: {
    original: 'Original anzeigen',
    notice:
      'Anderssprachige Titel der sechs geprüften Lesestücke, der sichtbare Aufmacher-Anreißer und aktuelle Verzeichnistitel mit bekannter Quellsprache werden automatisch an den WRN-Übersetzungsdienst gesendet. Originaltitel und Links bleiben verfügbar.',
    unavailable: 'Übersetzung derzeit nicht verfügbar; Originale bleiben lesbar.',
  },
  en: {
    original: 'Show original',
    notice:
      'Titles in another language from the six reviewed reading pieces, the visible lead teaser, and current directory headlines with a known source language are sent automatically to the WRN translation service. Original titles and links remain available.',
    unavailable: 'Translation is currently unavailable; originals remain readable.',
  },
  es: {
    original: 'Mostrar original',
    notice:
      'Los títulos en otro idioma de las seis lecturas revisadas, el avance principal y los titulares actuales del directorio con idioma de origen conocido se envían automáticamente al servicio de traducción de WRN. Se conservan los títulos y enlaces originales.',
    unavailable: 'La traducción no está disponible; los originales siguen legibles.',
  },
  fr: {
    original: 'Voir l’original',
    notice:
      'Les titres dans une autre langue des six lectures vérifiées, le résumé principal et les titres récents du répertoire dont la langue source est connue sont envoyés automatiquement au service de traduction WRN. Les titres et liens originaux restent disponibles.',
    unavailable: 'La traduction est indisponible ; les originaux restent lisibles.',
  },
  it: {
    original: 'Mostra originale',
    notice:
      'I titoli in un’altra lingua delle sei letture verificate, l’anteprima principale e i titoli recenti dell’elenco con lingua di origine nota vengono inviati automaticamente al servizio di traduzione WRN. Titoli e link originali restano disponibili.',
    unavailable: 'Traduzione non disponibile; gli originali restano leggibili.',
  },
  pt: {
    original: 'Mostrar original',
    notice:
      'Os títulos noutra língua das seis leituras verificadas, o resumo principal e os títulos atuais do diretório com língua de origem conhecida são enviados automaticamente ao serviço de tradução WRN. Títulos e ligações originais continuam disponíveis.',
    unavailable: 'Tradução indisponível; os originais continuam legíveis.',
  },
  ru: {
    original: 'Показать оригинал',
    notice:
      'Иноязычные заголовки шести проверенных материалов, анонс главного материала и текущие заголовки каталога с известным языком оригинала автоматически отправляются в службу перевода WRN. Оригиналы и ссылки остаются доступны.',
    unavailable: 'Перевод недоступен; оригиналы остаются доступными.',
  },
  el: {
    original: 'Προβολή πρωτοτύπου',
    notice:
      'Οι ξενόγλωσσοι τίτλοι των έξι ελεγμένων κειμένων, η κύρια περίληψη και οι τρέχοντες τίτλοι καταλόγου με γνωστή γλώσσα πηγής αποστέλλονται αυτόματα στην υπηρεσία μετάφρασης WRN. Οι αρχικοί τίτλοι και σύνδεσμοι παραμένουν διαθέσιμοι.',
    unavailable: 'Η μετάφραση δεν είναι διαθέσιμη· τα πρωτότυπα παραμένουν αναγνώσιμα.',
  },
  tr: {
    original: 'Özgün metni göster',
    notice:
      'Altı incelenmiş yazının yabancı dildeki başlıkları, ana özet ve kaynak dili bilinen güncel dizin başlıkları WRN çeviri hizmetine otomatik gönderilir. Özgün başlıklar ve bağlantılar erişilebilir kalır.',
    unavailable: 'Çeviri şu anda kullanılamıyor; özgün metinler okunabilir.',
  },
};

export function getHomeTranslationCopy(language: UiLanguage) {
  return homeCopy[language];
}

type CachedTranslation = { text: string; provider: string; expiresAt: number };
const cache = new Map<string, CachedTranslation>();
type Job = {
  priority: number;
  signal: AbortSignal;
  run: () => Promise<ProductionTranslationOutcome>;
  resolve: (result: ProductionTranslationOutcome) => void;
  started: boolean;
};
const jobs: Job[] = [];
const dispatches: number[] = [];
const directoryDispatches: number[] = [];
let reservedHomeRequests = 0;
let active = 0;
let wake: ReturnType<typeof setTimeout> | null = null;
let queuedDrain = false;

function scheduleDrain() {
  if (queuedDrain) return;
  queuedDrain = true;
  queueMicrotask(() => {
    queuedDrain = false;
    drain();
  });
}

function drain() {
  if (wake !== null) {
    clearTimeout(wake);
    wake = null;
  }
  while (jobs.length && active < 2) {
    const now = Date.now();
    while (dispatches.length && dispatches[0]! <= now - 60_000) dispatches.shift();
    while (directoryDispatches.length && directoryDispatches[0]! <= now - 60_000)
      directoryDispatches.shift();
    // Reserve capacity for an explicit Reader request in this tab.
    if (dispatches.length >= 8) {
      wake = setTimeout(drain, Math.max(1, dispatches[0]! + 60_001 - now));
      return;
    }
    jobs.sort((left, right) => left.priority - right.priority);
    // Home reserves its visible known-language requests before child effects run.
    // Directory metadata uses only the remaining capacity, even if it loads first.
    const directoryBudget = 8 - reservedHomeRequests;
    const next = jobs.findIndex(
      (job) => job.priority < 10 || directoryDispatches.length < directoryBudget,
    );
    if (next < 0) {
      if (directoryDispatches.length)
        wake = setTimeout(drain, Math.max(1, directoryDispatches[0]! + 60_001 - now));
      return;
    }
    const job = jobs.splice(next, 1)[0]!;
    if (job.signal.aborted) {
      job.resolve({ kind: 'discarded' });
      continue;
    }
    job.started = true;
    dispatches.push(now);
    if (job.priority >= 10) directoryDispatches.push(now);
    active += 1;
    void job
      .run()
      .then(job.resolve, () => job.resolve({ kind: 'error' }))
      .finally(() => {
        active -= 1;
        drain();
      });
  }
}

/** Home sets this before child title effects run; zero releases the budget for directory-only views. */
export function reserveAutomaticHomeTranslationRequests(count: number) {
  reservedHomeRequests = Math.max(0, Math.min(7, Math.trunc(count)));
  // StrictMode may clean up and re-run this effect before the next microtask.
  // Dispatch only after the final reservation is visible.
  scheduleDrain();
}

function queuedTranslation(
  adapter: ProductionTranslationAdapter,
  paragraph: Parameters<ProductionTranslationAdapter['translate']>[0] | DirectoryTitleTranslation,
  signal: AbortSignal,
  isCurrent: () => boolean,
  priority: number,
) {
  return new Promise<ProductionTranslationOutcome>((resolve) => {
    const job: Job = {
      priority,
      signal,
      run: () =>
        'kind' in paragraph
          ? (adapter.translateDirectoryTitle?.(paragraph, signal, isCurrent) ??
            Promise.resolve({ kind: 'unavailable' }))
          : adapter.translate(paragraph, signal, isCurrent),
      resolve,
      started: false,
    };
    signal.addEventListener(
      'abort',
      () => {
        if (job.started) return;
        const index = jobs.indexOf(job);
        if (index >= 0) jobs.splice(index, 1);
        resolve({ kind: 'discarded' });
        scheduleDrain();
      },
      { once: true },
    );
    jobs.push(job);
    scheduleDrain();
  });
}

/** Shares the reviewed-home rate limit while giving public directory titles lower priority. */
export function queueDirectoryTitleTranslation(
  adapter: ProductionTranslationAdapter,
  title: DirectoryTitleTranslation,
  signal: AbortSignal,
  isCurrent: () => boolean,
  position: number,
) {
  return queuedTranslation(adapter, title, signal, isCurrent, 10 + position);
}

function useAutomaticTranslation(
  text: string | null,
  index: number,
  article: ProductionArticleV1,
  authority: ProductionTranslationAuthority | null,
  language: UiLanguage,
  adapter: ProductionTranslationAdapter | null,
) {
  const sourceLanguageKnown = isTranslationSourceLanguage(article.originalLanguage);
  const paragraph =
    authority && authority.articleId === article.id && sourceLanguageKnown && text
      ? {
          ...authority,
          route: 'home',
          blockIndex: index,
          text,
          sourceLanguage: article.originalLanguage,
          targetLanguage: language,
        }
      : null;
  const key =
    paragraph && adapter
      ? `${productionTranslationRenderKey(paragraph)}:${JSON.stringify(adapter.identity)}`
      : '';
  const [state, setState] = useState<{ key: string; result: ProductionTranslationOutcome } | null>(
    null,
  );
  useEffect(() => {
    if (
      !paragraph ||
      !adapter ||
      paragraph.sourceLanguage === language ||
      Date.now() > paragraph.expiresAt
    )
      return;
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return;
    if (cached) cache.delete(key);
    const controller = new AbortController();
    const isCurrent = () => !controller.signal.aborted && Date.now() <= paragraph.expiresAt;
    void queuedTranslation(adapter, paragraph, controller.signal, isCurrent, index)
      .then((result) => {
        if (!isCurrent()) return;
        if (result.kind === 'translated') {
          const expiresAt = Math.min(
            Date.parse(result.response.cache.expiresAt),
            paragraph.expiresAt,
          );
          if (expiresAt <= Date.now()) return;
          if (cache.size >= 96) cache.delete(cache.keys().next().value!);
          cache.set(key, {
            text: result.response.translation.text,
            provider: result.response.adapter.provider,
            expiresAt,
          });
        }
        setState({ key, result });
      })
      .catch(() => {
        if (isCurrent()) setState({ key, result: { kind: 'error' } });
      });
    return () => controller.abort();
  }, [key, adapter]);
  const expiry = Math.min(
    authority?.expiresAt ?? Infinity,
    cache.get(key)?.expiresAt ??
      (state?.key === key && state.result.kind === 'translated'
        ? Date.parse(state.result.response.cache.expiresAt)
        : Infinity),
  );
  useEffect(() => {
    if (!Number.isFinite(expiry)) return;
    const timer = setTimeout(
      () => setState({ key, result: { kind: 'discarded' } }),
      Math.max(0, expiry + 1 - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [expiry, key]);
  if (!text || !sourceLanguageKnown || (paragraph && paragraph.sourceLanguage === language))
    return { translation: null, fallback: null } as const;
  if (!paragraph) return { translation: null, fallback: 'unavailable' } as const;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now())
    return { translation: cached, fallback: null } as const;
  const result = state?.key === key ? state.result : null;
  return {
    translation:
      result?.kind === 'translated'
        ? {
            text: result.response.translation.text,
            provider: result.response.adapter.provider,
            expiresAt: Date.parse(result.response.cache.expiresAt),
          }
        : null,
    fallback:
      result && result.kind !== 'translated' && result.kind !== 'discarded' ? result.kind : null,
  } as const;
}

export function AutomaticHomeCardText({
  article,
  role,
  headingLevel,
  authority,
  language,
  adapter,
}: {
  article: ProductionArticleV1;
  role: 'lead' | 'main';
  headingLevel: 3 | 4;
  authority: ProductionTranslationAuthority | null;
  language: UiLanguage;
  adapter: ProductionTranslationAdapter | null;
}) {
  const title = useAutomaticTranslation(article.title, 0, article, authority, language, adapter);
  const teaser = useAutomaticTranslation(
    role === 'lead' ? article.teaser : null,
    1,
    article,
    authority,
    language,
    adapter,
  );
  const translated = Boolean(title.translation || teaser.translation);
  const provider = title.translation?.provider ?? teaser.translation?.provider;
  const fallback = title.fallback || teaser.fallback;
  const Heading = headingLevel === 4 ? 'h4' : 'h3';
  const copy = getHomeTranslationCopy(language);
  const translationCopy = getProductionTranslationCopy(language);
  return (
    <>
      <Heading lang={title.translation ? language : article.originalLanguage}>
        {title.translation?.text ?? article.title}
      </Heading>
      {role === 'lead' && (
        <p lang={teaser.translation ? language : article.originalLanguage}>
          {teaser.translation?.text ?? article.teaser}
        </p>
      )}
      {translated && (
        <div className="production-home-translation" lang={language}>
          <small>
            {formatUiCopy(translationCopy.translatedLabel, { language })} ·{' '}
            {formatUiCopy(translationCopy.provenance, { provider: provider! })}
          </small>
          <details>
            <summary>{copy.original}</summary>
            <p lang={article.originalLanguage}>{article.title}</p>
            {role === 'lead' && <p lang={article.originalLanguage}>{article.teaser}</p>}
          </details>
        </div>
      )}
      {adapter && fallback && (
        <small className="production-home-translation-fallback" role="status" lang={language}>
          {copy.original} · {fallback === 'offline' ? translationCopy.offline : copy.unavailable}
        </small>
      )}
    </>
  );
}
