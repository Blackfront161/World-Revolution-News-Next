import { useEffect, useState } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import {
  parseLegacyBookmarks,
  parseLegacyOrphanReading,
  readLegacyOfflineArticles,
  type LegacySavedArticle,
  type LegacyOrphanReading,
} from './legacy-upgrade-data';

const labels: Readonly<
  Record<
    UiLanguage,
    {
      saved: string;
      retained: string;
      read: string;
      progress: string;
      noBody: string;
      readList: string;
      readIntro: string;
    }
  >
> = {
  en: {
    saved: 'Saved articles from version 2.1.1',
    retained: 'Locally saved copies. Earlier storage remains available.',
    read: 'Marked read',
    progress: 'Reading progress',
    noBody: 'No offline full text stored.',
    readList: 'Earlier reading list',
    readIntro: 'Locally stored reading status only; articles are not loaded.',
  },
  de: {
    saved: 'Gespeicherte Artikel aus Version 2.1.1',
    retained: 'Lokal gespeicherte Kopien. Der frühere Speicher bleibt erhalten.',
    read: 'Als gelesen markiert',
    progress: 'Lesefortschritt',
    noBody: 'Kein Offline-Volltext gespeichert.',
    readList: 'Frühere Leseliste',
    readIntro: 'Nur lokal gespeicherter Lesestatus; Artikel werden nicht geladen.',
  },
  es: {
    saved: 'Artículos guardados de la versión 2.1.1',
    retained: 'Copias guardadas localmente. Se conservan los datos anteriores.',
    read: 'Marcado como leído',
    progress: 'Progreso de lectura',
    noBody: 'No hay texto completo sin conexión.',
    readList: 'Lista de lectura anterior',
    readIntro: 'Solo se muestra el estado local de lectura; no se cargan artículos.',
  },
  fr: {
    saved: 'Articles enregistrés de la version 2.1.1',
    retained: 'Copies enregistrées localement. Les anciennes données sont conservées.',
    read: 'Marqué comme lu',
    progress: 'Progression de lecture',
    noBody: 'Aucun texte intégral hors ligne enregistré.',
    readList: 'Ancienne liste de lecture',
    readIntro: 'Seul l’état de lecture local est affiché ; aucun article n’est chargé.',
  },
  it: {
    saved: 'Articoli salvati della versione 2.1.1',
    retained: 'Copie salvate localmente. I dati precedenti restano disponibili.',
    read: 'Segnato come letto',
    progress: 'Avanzamento lettura',
    noBody: 'Nessun testo completo offline salvato.',
    readList: 'Elenco di lettura precedente',
    readIntro: 'È mostrato solo lo stato di lettura locale; gli articoli non vengono caricati.',
  },
  pt: {
    saved: 'Artigos guardados da versão 2.1.1',
    retained: 'Cópias guardadas localmente. Os dados anteriores são mantidos.',
    read: 'Marcado como lido',
    progress: 'Progresso da leitura',
    noBody: 'Nenhum texto integral offline guardado.',
    readList: 'Lista de leitura anterior',
    readIntro: 'Apenas o estado de leitura local é mostrado; os artigos não são carregados.',
  },
  ru: {
    saved: 'Сохранённые статьи версии 2.1.1',
    retained: 'Локально сохранённые копии. Прежние данные сохранены.',
    read: 'Отмечено как прочитанное',
    progress: 'Прогресс чтения',
    noBody: 'Полный текст для чтения офлайн не сохранён.',
    readList: 'Прежний список чтения',
    readIntro: 'Показан только локальный статус чтения; статьи не загружаются.',
  },
  el: {
    saved: 'Αποθηκευμένα άρθρα από την έκδοση 2.1.1',
    retained: 'Τοπικά αποθηκευμένα αντίγραφα. Τα προηγούμενα δεδομένα διατηρούνται.',
    read: 'Σημειώθηκε ως αναγνωσμένο',
    progress: 'Πρόοδος ανάγνωσης',
    noBody: 'Δεν έχει αποθηκευτεί πλήρες κείμενο εκτός σύνδεσης.',
    readList: 'Προηγούμενη λίστα ανάγνωσης',
    readIntro: 'Εμφανίζεται μόνο η τοπική κατάσταση ανάγνωσης· τα άρθρα δεν φορτώνονται.',
  },
  tr: {
    saved: '2.1.1 sürümünden kaydedilen yazılar',
    retained: 'Yerel olarak kaydedilmiş kopyalar. Eski veriler korunur.',
    read: 'Okundu olarak işaretlendi',
    progress: 'Okuma ilerlemesi',
    noBody: 'Çevrimdışı tam metin kaydedilmemiş.',
    readList: 'Önceki okuma listesi',
    readIntro: 'Yalnızca yerel okuma durumu gösterilir; yazılar yüklenmez.',
  },
};

function oldReadingBytes() {
  try {
    return {
      bookmarks: window.localStorage.getItem('wrn_bookmarks'),
      read: window.localStorage.getItem('wrn_read_list'),
      positions: window.localStorage.getItem('wrn_read_positions'),
    };
  } catch {
    return { bookmarks: null, read: null, positions: null };
  }
}

export function LegacyUpgradeSaved({ language }: { language: UiLanguage }) {
  const [articles, setArticles] = useState<readonly LegacySavedArticle[]>(() => {
    const old = oldReadingBytes();
    return parseLegacyBookmarks(old.bookmarks, null, old.read, old.positions);
  });
  const [orphans] = useState<readonly LegacyOrphanReading[]>(() => {
    const old = oldReadingBytes();
    return parseLegacyOrphanReading(old.bookmarks, old.read, old.positions);
  });
  useEffect(() => {
    let active = true;
    const old = oldReadingBytes();
    void readLegacyOfflineArticles().then((offline) => {
      if (active)
        setArticles(parseLegacyBookmarks(old.bookmarks, offline, old.read, old.positions));
    });
    return () => {
      active = false;
    };
  }, []);
  if (articles.length === 0 && orphans.length === 0) return null;
  const copy = labels[language];
  return (
    <section aria-label={copy.saved}>
      <h3>{copy.saved}</h3>
      <p>{copy.retained}</p>
      {articles.map((article) => (
        <details className="production-card" key={article.key}>
          <summary>{article.title}</summary>
          {article.source && <p>{article.source}</p>}
          {article.read && <p>{copy.read}</p>}
          {article.progress !== null && (
            <p>
              {copy.progress}: {Math.round(article.progress * 100)}%
            </p>
          )}
          <p style={{ overflowWrap: 'anywhere' }}>{article.key}</p>
          {article.content ? (
            <p style={{ whiteSpace: 'pre-wrap' }}>{article.content}</p>
          ) : (
            <p>{copy.noBody}</p>
          )}
        </details>
      ))}
      {orphans.length > 0 && (
        <section aria-label={copy.readList}>
          <h4>{copy.readList}</h4>
          <p>{copy.readIntro}</p>
          {orphans.map((entry) => (
            <article className="production-card" key={entry.key}>
              <h5>{entry.title}</h5>
              <p style={{ overflowWrap: 'anywhere' }}>{entry.key}</p>
              {entry.read && <p>{copy.read}</p>}
              {entry.progress !== null && (
                <p>
                  {copy.progress}: {Math.round(entry.progress * 100)}%
                </p>
              )}
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
