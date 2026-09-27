import { useEffect, useState } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import { formatUiCopy } from '@wrn/ui-language';
import { getProductionTranslationCopy } from '@wrn/ui-language/production-translation';
import type { ProductionArticleV1 } from '@wrn/content-contracts';
import {
  productionTranslationRenderKey,
  type ProductionTranslationAdapter,
  type ProductionTranslationAuthority,
  type ProductionTranslationOutcome,
} from './production-translation';

const homeCopy: Record<UiLanguage, { original: string; notice: string; unavailable: string }> = {
  de: {
    original: 'Original anzeigen',
    notice:
      'Anderssprachige Titel der sechs geprüften Lesestücke und der sichtbare Aufmacher-Anreißer werden automatisch an den WRN-Übersetzungsdienst gesendet. Verzeichnismeldungen behalten Originaltitel und Links.',
    unavailable: 'Übersetzung derzeit nicht verfügbar; Originale bleiben lesbar.',
  },
  en: {
    original: 'Show original',
    notice:
      'Titles in another language from the six reviewed reading pieces and the visible lead teaser are sent automatically to the WRN translation service. Directory reports retain original titles and links.',
    unavailable: 'Translation is currently unavailable; originals remain readable.',
  },
  es: {
    original: 'Mostrar original',
    notice:
      'Los títulos en otro idioma de las seis lecturas revisadas y el avance visible del artículo principal se envían automáticamente al servicio de traducción de WRN. El directorio conserva títulos y enlaces originales.',
    unavailable: 'La traducción no está disponible; los originales siguen legibles.',
  },
  fr: {
    original: 'Voir l’original',
    notice:
      'Les titres dans une autre langue des six lectures vérifiées et le résumé visible de l’article principal sont envoyés automatiquement au service de traduction WRN. Le répertoire conserve ses titres et liens originaux.',
    unavailable: 'La traduction est indisponible ; les originaux restent lisibles.',
  },
  it: {
    original: 'Mostra originale',
    notice:
      'I titoli in un’altra lingua delle sei letture verificate e l’anteprima visibile dell’articolo principale vengono inviati automaticamente al servizio di traduzione WRN. L’elenco mantiene titoli e link originali.',
    unavailable: 'Traduzione non disponibile; gli originali restano leggibili.',
  },
  pt: {
    original: 'Mostrar original',
    notice:
      'Os títulos noutra língua das seis leituras verificadas e o resumo visível do artigo principal são enviados automaticamente ao serviço de tradução WRN. O diretório mantém títulos e ligações originais.',
    unavailable: 'Tradução indisponível; os originais continuam legíveis.',
  },
  ru: {
    original: 'Показать оригинал',
    notice:
      'Иноязычные заголовки шести проверенных материалов и видимый анонс главного материала автоматически отправляются в службу перевода WRN. Каталог сохраняет исходные заголовки и ссылки.',
    unavailable: 'Перевод недоступен; оригиналы остаются доступными.',
  },
  el: {
    original: 'Προβολή πρωτοτύπου',
    notice:
      'Οι τίτλοι άλλης γλώσσας των έξι ελεγμένων κειμένων και η ορατή περίληψη του κύριου άρθρου αποστέλλονται αυτόματα στην υπηρεσία μετάφρασης WRN. Ο κατάλογος κρατά αρχικούς τίτλους και συνδέσμους.',
    unavailable: 'Η μετάφραση δεν είναι διαθέσιμη· τα πρωτότυπα παραμένουν αναγνώσιμα.',
  },
  tr: {
    original: 'Özgün metni göster',
    notice:
      'Altı incelenmiş yazının başka dildeki başlıkları ve ana yazının görünen özeti WRN çeviri hizmetine otomatik gönderilir. Dizin özgün başlıkları ve bağlantıları korur.',
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
let active = 0;
let wake: ReturnType<typeof setTimeout> | null = null;
let queuedDrain = false;

function drain() {
  if (wake !== null) {
    clearTimeout(wake);
    wake = null;
  }
  while (jobs.length && active < 2) {
    const now = Date.now();
    while (dispatches.length && dispatches[0]! <= now - 60_000) dispatches.shift();
    // Reserve capacity for an explicit Reader request in this tab.
    if (dispatches.length >= 8) {
      wake = setTimeout(drain, Math.max(1, dispatches[0]! + 60_001 - now));
      return;
    }
    jobs.sort((left, right) => left.priority - right.priority);
    const job = jobs.shift()!;
    if (job.signal.aborted) {
      job.resolve({ kind: 'discarded' });
      continue;
    }
    job.started = true;
    dispatches.push(now);
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

function queuedTranslation(
  adapter: ProductionTranslationAdapter,
  paragraph: Parameters<ProductionTranslationAdapter['translate']>[0],
  signal: AbortSignal,
  isCurrent: () => boolean,
  priority: number,
) {
  return new Promise<ProductionTranslationOutcome>((resolve) => {
    const job: Job = {
      priority,
      signal,
      run: () => adapter.translate(paragraph, signal, isCurrent),
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
      },
      { once: true },
    );
    jobs.push(job);
    if (!queuedDrain) {
      queuedDrain = true;
      queueMicrotask(() => {
        queuedDrain = false;
        drain();
      });
    }
  });
}

function useAutomaticTranslation(
  text: string | null,
  index: number,
  article: ProductionArticleV1,
  authority: ProductionTranslationAuthority | null,
  language: UiLanguage,
  adapter: ProductionTranslationAdapter | null,
) {
  const paragraph =
    authority && text
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
  if (!text || (paragraph && paragraph.sourceLanguage === language))
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
