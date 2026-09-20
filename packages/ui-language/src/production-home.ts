import type { UiLanguage } from './index';

export type ProductionHomeCopy = Readonly<{
  featured: string;
  latest: string;
  sport: string;
  further: string;
  archive: string;
  archiveIntro: string;
  browseArchive: string;
}>;

const entries: Readonly<Record<UiLanguage, ProductionHomeCopy>> = Object.freeze({
  en: {
    featured: 'Featured',
    latest: 'Latest news',
    sport: 'Sport reading notes',
    further: 'Further news',
    archive: 'From the news archive',
    archiveIntro: 'Recorded metadata and original links from the checked snapshot.',
    browseArchive: 'Browse the news directory',
  },
  de: {
    featured: 'Im Blickpunkt',
    latest: 'Aktuelle Nachrichten',
    sport: 'Sport-Lesehinweise',
    further: 'Weitere Nachrichten',
    archive: 'Aus dem Nachrichtenarchiv',
    archiveIntro: 'Erfasste Metadaten und Original-Links aus dem geprüften Stand.',
    browseArchive: 'Nachrichtenverzeichnis öffnen',
  },
  es: {
    featured: 'Destacado',
    latest: 'Últimas noticias',
    sport: 'Lecturas de deporte',
    further: 'Más noticias',
    archive: 'Del archivo de noticias',
    archiveIntro: 'Metadatos registrados y enlaces originales de la instantánea comprobada.',
    browseArchive: 'Abrir el directorio de noticias',
  },
  fr: {
    featured: 'À la une',
    latest: 'Dernières actualités',
    sport: 'Lectures sportives',
    further: 'Autres actualités',
    archive: 'Dans les archives d’actualité',
    archiveIntro: 'Métadonnées enregistrées et liens originaux de l’instantané vérifié.',
    browseArchive: 'Parcourir le répertoire d’actualités',
  },
  it: {
    featured: 'In evidenza',
    latest: 'Ultime notizie',
    sport: 'Letture sullo sport',
    further: 'Altre notizie',
    archive: 'Dall’archivio delle notizie',
    archiveIntro: 'Metadati registrati e collegamenti originali dalla fotografia verificata.',
    browseArchive: 'Apri l’elenco delle notizie',
  },
  pt: {
    featured: 'Em destaque',
    latest: 'Últimas notícias',
    sport: 'Leituras sobre desporto',
    further: 'Mais notícias',
    archive: 'Do arquivo de notícias',
    archiveIntro: 'Metadados registados e ligações originais do retrato verificado.',
    browseArchive: 'Abrir o diretório de notícias',
  },
  ru: {
    featured: 'Главное',
    latest: 'Последние новости',
    sport: 'Спортивные материалы',
    further: 'Другие новости',
    archive: 'Из архива новостей',
    archiveIntro: 'Зафиксированные метаданные и оригинальные ссылки из проверенного снимка.',
    browseArchive: 'Открыть каталог новостей',
  },
  el: {
    featured: 'Κύριο θέμα',
    latest: 'Τελευταίες ειδήσεις',
    sport: 'Αναγνώσεις αθλητισμού',
    further: 'Περισσότερες ειδήσεις',
    archive: 'Από το αρχείο ειδήσεων',
    archiveIntro: 'Καταγεγραμμένα μεταδεδομένα και αρχικοί σύνδεσμοι από το ελεγμένο στιγμιότυπο.',
    browseArchive: 'Άνοιγμα καταλόγου ειδήσεων',
  },
  tr: {
    featured: 'Öne çıkan',
    latest: 'Son haberler',
    sport: 'Spor okuma notları',
    further: 'Diğer haberler',
    archive: 'Haber arşivinden',
    archiveIntro: 'Kontrol edilmiş anlık görüntüden kaydedilmiş üstveriler ve özgün bağlantılar.',
    browseArchive: 'Haber dizinini aç',
  },
});

export function getProductionHomeCopy(language: UiLanguage): ProductionHomeCopy {
  return entries[language];
}
