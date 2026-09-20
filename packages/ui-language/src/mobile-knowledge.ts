import type { UiLanguage } from './index.js';

export type MobileKnowledgeCopy = Readonly<{
  title: string;
  library: string;
  lexicon: string;
  intro: string;
  search: string;
  language: string;
  source: string;
  format: string;
  all: string;
  reset: string;
  noResults: string;
  loadMore: string;
  shown: string;
  sources: string;
  openCatalog: string;
  openSource: string;
  read: string;
  downloads: string;
  category: string;
  definition: string;
  practice: string;
  perspectives: string;
  related: string;
  fallback: string;
  loading: string;
  error: string;
  retry: string;
  provenance: string;
  readingHelp: string;
  checkSourceDate: string;
  comparePerspectives: string;
  deepenRelated: string;
  mutualAid: string;
  snapshotDate: string;
  historicalReview: string;
  offlineNote: string;
  reloadView: string;
  reloadNote: string;
}>;
const english: MobileKnowledgeCopy = Object.freeze({
  reloadView: 'Reload view',
  reloadNote:
    'Reload this view when the connection is available. Temporary searches and filters will reset.',
  title: 'Knowledge',
  library: 'Library',
  lexicon: 'Glossary',
  intro: 'A local legacy catalogue and movement glossary. No external catalogue is requested.',
  search: 'Search titles, authors, topics or terms',
  language: 'Language',
  source: 'Source',
  format: 'Format',
  all: 'All',
  reset: 'Reset filters',
  noResults: 'No matching local entries.',
  loadMore: 'Load more',
  shown: '{shown} of {total}',
  sources: 'Sources and catalogues',
  openCatalog: 'Open catalogue',
  openSource: 'Open source',
  read: 'Read online',
  downloads: 'Downloads',
  category: 'Category',
  definition: 'In brief',
  practice: 'In practice',
  perspectives: 'Different perspectives',
  related: 'Related terms',
  fallback:
    'Editorial definitions are currently available in German and English. The English version is shown.',
  loading: 'Preparing local knowledge data…',
  error: 'Local knowledge data could not be prepared.',
  retry: 'Try again',
  provenance: 'Legacy-app snapshot · metadata and links only for library entries.',
  readingHelp: 'Reading help',
  checkSourceDate: 'Check the source and its date.',
  comparePerspectives: 'Compare perspectives and context.',
  deepenRelated: 'Use related terms to continue learning.',
  mutualAid: 'Start with mutual aid',
  snapshotDate: 'Catalogue snapshot',
  historicalReview: 'Historical source review date',
  offlineNote:
    'Loaded metadata remains readable locally. Opening external material requires a network connection.',
});
const german: MobileKnowledgeCopy = Object.freeze({
  reloadView: 'Ansicht neu laden',
  reloadNote:
    'Lade die Ansicht mit verfügbarer Verbindung neu. Vorübergehende Suchen und Filter werden zurückgesetzt.',
  title: 'Wissen',
  library: 'Bibliothek',
  lexicon: 'Lexikon',
  intro:
    'Ein lokaler Altkatalog und ein Bewegungslexikon. Es wird kein externer Katalog angefragt.',
  search: 'Titel, Autor*innen, Themen oder Begriffe suchen',
  language: 'Sprache',
  source: 'Quelle',
  format: 'Format',
  all: 'Alle',
  reset: 'Filter zurücksetzen',
  noResults: 'Keine passenden lokalen Einträge.',
  loadMore: 'Mehr laden',
  shown: '{shown} von {total}',
  sources: 'Quellen und Kataloge',
  openCatalog: 'Katalog öffnen',
  openSource: 'Quelle öffnen',
  read: 'Online lesen',
  downloads: 'Downloads',
  category: 'Kategorie',
  definition: 'Kurz erklärt',
  practice: 'In der Praxis',
  perspectives: 'Unterschiedliche Perspektiven',
  related: 'Verwandte Begriffe',
  fallback:
    'Redaktionelle Definitionen sind derzeit auf Deutsch und Englisch verfügbar. Die englische Fassung wird angezeigt.',
  loading: 'Lokale Wissensdaten werden vorbereitet…',
  error: 'Lokale Wissensdaten konnten nicht vorbereitet werden.',
  retry: 'Erneut versuchen',
  provenance: 'Alt-App-Snapshot · für Bibliothekseinträge nur Metadaten und Links.',
  readingHelp: 'Lesehilfe',
  checkSourceDate: 'Quelle und Datum prüfen.',
  comparePerspectives: 'Perspektiven und Kontext vergleichen.',
  deepenRelated: 'Mit verwandten Begriffen weiter vertiefen.',
  mutualAid: 'Mit gegenseitiger Hilfe beginnen',
  snapshotDate: 'Katalogstand',
  historicalReview: 'Historisches Prüfdatum der Quelle',
  offlineNote:
    'Geladene Metadaten bleiben lokal lesbar. Externes Material benötigt eine Netzverbindung.',
});
const spanish: MobileKnowledgeCopy = Object.freeze({
  reloadView: 'Volver a cargar la vista',
  reloadNote:
    'Vuelve a cargar cuando haya conexión. Se restablecerán las búsquedas y los filtros temporales.',
  title: 'Conocimiento',
  library: 'Biblioteca',
  lexicon: 'Glosario',
  intro:
    'Un catálogo heredado local y un glosario de movimientos. No se solicita ningún catálogo externo.',
  search: 'Buscar títulos, autoría, temas o términos',
  language: 'Idioma',
  source: 'Fuente',
  format: 'Formato',
  all: 'Todo',
  reset: 'Restablecer filtros',
  noResults: 'No hay entradas locales coincidentes.',
  loadMore: 'Cargar más',
  shown: '{shown} de {total}',
  sources: 'Fuentes y catálogos',
  openCatalog: 'Abrir catálogo',
  openSource: 'Abrir fuente',
  read: 'Leer en línea',
  downloads: 'Descargas',
  category: 'Categoría',
  definition: 'En breve',
  practice: 'En la práctica',
  perspectives: 'Perspectivas diferentes',
  related: 'Términos relacionados',
  fallback:
    'Las definiciones editoriales están disponibles actualmente en alemán e inglés. Se muestra la versión inglesa.',
  loading: 'Preparando los datos locales de conocimiento…',
  error: 'No se pudieron preparar los datos locales de conocimiento.',
  retry: 'Intentar de nuevo',
  provenance:
    'Instantánea de la aplicación anterior · solo metadatos y enlaces para entradas de biblioteca.',
  readingHelp: 'Ayuda de lectura',
  checkSourceDate: 'Comprueba la fuente y su fecha.',
  comparePerspectives: 'Compara perspectivas y contexto.',
  deepenRelated: 'Profundiza con términos relacionados.',
  mutualAid: 'Empezar con apoyo mutuo',
  snapshotDate: 'Estado del catálogo',
  historicalReview: 'Fecha histórica de revisión de la fuente',
  offlineNote:
    'Los metadatos cargados siguen legibles localmente. Abrir material externo requiere conexión de red.',
});
const french: MobileKnowledgeCopy = Object.freeze({
  reloadView: 'Recharger la vue',
  reloadNote:
    'Rechargez lorsque la connexion est disponible. Les recherches et filtres temporaires seront réinitialisés.',
  title: 'Connaissances',
  library: 'Bibliothèque',
  lexicon: 'Lexique',
  intro:
    'Un catalogue hérité local et un lexique des mouvements. Aucun catalogue externe n’est demandé.',
  search: 'Rechercher des titres, auteur·ices, thèmes ou termes',
  language: 'Langue',
  source: 'Source',
  format: 'Format',
  all: 'Tout',
  reset: 'Réinitialiser les filtres',
  noResults: 'Aucune entrée locale correspondante.',
  loadMore: 'Charger plus',
  shown: '{shown} sur {total}',
  sources: 'Sources et catalogues',
  openCatalog: 'Ouvrir le catalogue',
  openSource: 'Ouvrir la source',
  read: 'Lire en ligne',
  downloads: 'Téléchargements',
  category: 'Catégorie',
  definition: 'En bref',
  practice: 'Dans la pratique',
  perspectives: 'Perspectives différentes',
  related: 'Termes liés',
  fallback:
    'Les définitions éditoriales sont actuellement disponibles en allemand et en anglais. La version anglaise est affichée.',
  loading: 'Préparation des données locales de connaissances…',
  error: 'Les données locales de connaissances n’ont pas pu être préparées.',
  retry: 'Réessayer',
  provenance:
    'Instantané de l’ancienne application · métadonnées et liens seulement pour la bibliothèque.',
  readingHelp: 'Aide à la lecture',
  checkSourceDate: 'Vérifiez la source et sa date.',
  comparePerspectives: 'Comparez les perspectives et le contexte.',
  deepenRelated: 'Approfondissez avec les termes liés.',
  mutualAid: 'Commencer par l’entraide',
  snapshotDate: 'État du catalogue',
  historicalReview: 'Date historique de vérification de la source',
  offlineNote:
    'Les métadonnées chargées restent lisibles localement. L’ouverture d’un contenu externe nécessite une connexion réseau.',
});
const italian: MobileKnowledgeCopy = Object.freeze({
  reloadView: 'Ricarica la vista',
  reloadNote:
    'Ricarica quando la connessione è disponibile. Ricerche e filtri temporanei verranno reimpostati.',
  title: 'Conoscenza',
  library: 'Biblioteca',
  lexicon: 'Glossario',
  intro:
    'Un catalogo storico locale e un glossario dei movimenti. Non viene richiesto alcun catalogo esterno.',
  search: 'Cerca titoli, autori, temi o termini',
  language: 'Lingua',
  source: 'Fonte',
  format: 'Formato',
  all: 'Tutto',
  reset: 'Reimposta filtri',
  noResults: 'Nessuna voce locale corrispondente.',
  loadMore: 'Carica altro',
  shown: '{shown} di {total}',
  sources: 'Fonti e cataloghi',
  openCatalog: 'Apri catalogo',
  openSource: 'Apri fonte',
  read: 'Leggi online',
  downloads: 'Download',
  category: 'Categoria',
  definition: 'In breve',
  practice: 'Nella pratica',
  perspectives: 'Prospettive diverse',
  related: 'Termini correlati',
  fallback:
    'Le definizioni editoriali sono attualmente disponibili in tedesco e inglese. Viene mostrata la versione inglese.',
  loading: 'Preparazione dei dati locali di conoscenza…',
  error: 'Non è stato possibile preparare i dati locali di conoscenza.',
  retry: 'Riprova',
  provenance: 'Istantanea dell’app precedente · per la biblioteca solo metadati e link.',
  readingHelp: 'Aiuto alla lettura',
  checkSourceDate: 'Controlla la fonte e la data.',
  comparePerspectives: 'Confronta prospettive e contesto.',
  deepenRelated: 'Approfondisci con termini correlati.',
  mutualAid: 'Inizia con il mutuo aiuto',
  snapshotDate: 'Stato del catalogo',
  historicalReview: 'Data storica di verifica della fonte',
  offlineNote:
    'I metadati caricati restano leggibili localmente. L’apertura di materiale esterno richiede una connessione di rete.',
});
const portuguese: MobileKnowledgeCopy = Object.freeze({
  reloadView: 'Recarregar a vista',
  reloadNote:
    'Recarregue quando houver ligação. As pesquisas e os filtros temporários serão repostos.',
  title: 'Conhecimento',
  library: 'Biblioteca',
  lexicon: 'Glossário',
  intro:
    'Um catálogo legado local e um glossário de movimentos. Nenhum catálogo externo é solicitado.',
  search: 'Pesquisar títulos, autorias, temas ou termos',
  language: 'Idioma',
  source: 'Fonte',
  format: 'Formato',
  all: 'Tudo',
  reset: 'Redefinir filtros',
  noResults: 'Nenhuma entrada local correspondente.',
  loadMore: 'Carregar mais',
  shown: '{shown} de {total}',
  sources: 'Fontes e catálogos',
  openCatalog: 'Abrir catálogo',
  openSource: 'Abrir fonte',
  read: 'Ler online',
  downloads: 'Transferências',
  category: 'Categoria',
  definition: 'Em resumo',
  practice: 'Na prática',
  perspectives: 'Perspetivas diferentes',
  related: 'Termos relacionados',
  fallback:
    'As definições editoriais estão atualmente disponíveis em alemão e inglês. A versão inglesa é mostrada.',
  loading: 'A preparar dados locais de conhecimento…',
  error: 'Não foi possível preparar os dados locais de conhecimento.',
  retry: 'Tentar novamente',
  provenance: 'Instantâneo da aplicação anterior · apenas metadados e ligações para a biblioteca.',
  readingHelp: 'Ajuda de leitura',
  checkSourceDate: 'Verifique a fonte e a sua data.',
  comparePerspectives: 'Compare perspetivas e contexto.',
  deepenRelated: 'Aprofunde com termos relacionados.',
  mutualAid: 'Começar com ajuda mútua',
  snapshotDate: 'Estado do catálogo',
  historicalReview: 'Data histórica de verificação da fonte',
  offlineNote:
    'Os metadados carregados permanecem legíveis localmente. Abrir material externo requer ligação à rede.',
});
const russian: MobileKnowledgeCopy = Object.freeze({
  reloadView: 'Перезагрузить страницу',
  reloadNote:
    'Перезагрузите страницу при наличии соединения. Временные поисковые запросы и фильтры будут сброшены.',
  title: 'Знания',
  library: 'Библиотека',
  lexicon: 'Глоссарий',
  intro: 'Локальный исторический каталог и глоссарий движений. Внешний каталог не запрашивается.',
  search: 'Искать названия, авторов, темы или термины',
  language: 'Язык',
  source: 'Источник',
  format: 'Формат',
  all: 'Все',
  reset: 'Сбросить фильтры',
  noResults: 'Подходящих локальных записей нет.',
  loadMore: 'Загрузить ещё',
  shown: '{shown} из {total}',
  sources: 'Источники и каталоги',
  openCatalog: 'Открыть каталог',
  openSource: 'Открыть источник',
  read: 'Читать онлайн',
  downloads: 'Загрузки',
  category: 'Категория',
  definition: 'Кратко',
  practice: 'На практике',
  perspectives: 'Разные перспективы',
  related: 'Связанные термины',
  fallback:
    'Редакционные определения сейчас доступны на немецком и английском. Показана английская версия.',
  loading: 'Подготавливаются локальные данные знаний…',
  error: 'Не удалось подготовить локальные данные знаний.',
  retry: 'Повторить',
  provenance: 'Снимок прежнего приложения · для библиотеки только метаданные и ссылки.',
  readingHelp: 'Помощь в чтении',
  checkSourceDate: 'Проверьте источник и дату.',
  comparePerspectives: 'Сравните перспективы и контекст.',
  deepenRelated: 'Углубитесь через связанные термины.',
  mutualAid: 'Начать с взаимопомощи',
  snapshotDate: 'Состояние каталога',
  historicalReview: 'Историческая дата проверки источника',
  offlineNote:
    'Загруженные метаданные остаются читаемыми локально. Для открытия внешнего материала требуется сеть.',
});
const greek: MobileKnowledgeCopy = Object.freeze({
  reloadView: 'Επαναφόρτωση προβολής',
  reloadNote:
    'Επαναφορτώστε όταν υπάρχει σύνδεση. Οι προσωρινές αναζητήσεις και τα φίλτρα θα επαναφερθούν.',
  title: 'Γνώση',
  library: 'Βιβλιοθήκη',
  lexicon: 'Γλωσσάρι',
  intro:
    'Ένας τοπικός παλαιός κατάλογος και γλωσσάρι κινημάτων. Δεν ζητείται εξωτερικός κατάλογος.',
  search: 'Αναζήτηση τίτλων, συγγραφέων, θεμάτων ή όρων',
  language: 'Γλώσσα',
  source: 'Πηγή',
  format: 'Μορφή',
  all: 'Όλα',
  reset: 'Επαναφορά φίλτρων',
  noResults: 'Δεν υπάρχουν αντίστοιχες τοπικές εγγραφές.',
  loadMore: 'Φόρτωση περισσότερων',
  shown: '{shown} από {total}',
  sources: 'Πηγές και κατάλογοι',
  openCatalog: 'Άνοιγμα καταλόγου',
  openSource: 'Άνοιγμα πηγής',
  read: 'Ανάγνωση online',
  downloads: 'Λήψεις',
  category: 'Κατηγορία',
  definition: 'Σύντομα',
  practice: 'Στην πράξη',
  perspectives: 'Διαφορετικές οπτικές',
  related: 'Σχετικοί όροι',
  fallback:
    'Οι συντακτικοί ορισμοί είναι προς το παρόν διαθέσιμοι στα γερμανικά και στα αγγλικά. Εμφανίζεται η αγγλική έκδοση.',
  loading: 'Προετοιμασία τοπικών δεδομένων γνώσης…',
  error: 'Δεν ήταν δυνατή η προετοιμασία τοπικών δεδομένων γνώσης.',
  retry: 'Δοκιμάστε ξανά',
  provenance:
    'Στιγμιότυπο της προηγούμενης εφαρμογής · μόνο μεταδεδομένα και σύνδεσμοι για τη βιβλιοθήκη.',
  readingHelp: 'Βοήθεια ανάγνωσης',
  checkSourceDate: 'Ελέγξτε την πηγή και την ημερομηνία της.',
  comparePerspectives: 'Συγκρίνετε οπτικές και πλαίσιο.',
  deepenRelated: 'Εμβαθύνετε με σχετικούς όρους.',
  mutualAid: 'Ξεκινήστε με αμοιβαία βοήθεια',
  snapshotDate: 'Κατάσταση καταλόγου',
  historicalReview: 'Ιστορική ημερομηνία ελέγχου της πηγής',
  offlineNote:
    'Τα φορτωμένα μεταδεδομένα παραμένουν τοπικά αναγνώσιμα. Το άνοιγμα εξωτερικού υλικού απαιτεί σύνδεση δικτύου.',
});
const turkish: MobileKnowledgeCopy = Object.freeze({
  reloadView: 'Görünümü yeniden yükle',
  reloadNote: 'Bağlantı olduğunda yeniden yükleyin. Geçici aramalar ve filtreler sıfırlanacaktır.',
  title: 'Bilgi',
  library: 'Kütüphane',
  lexicon: 'Sözlük',
  intro: 'Yerel eski katalog ve hareketler sözlüğü. Harici katalog istenmez.',
  search: 'Başlık, yazar, konu veya terim ara',
  language: 'Dil',
  source: 'Kaynak',
  format: 'Biçim',
  all: 'Tümü',
  reset: 'Filtreleri sıfırla',
  noResults: 'Eşleşen yerel kayıt yok.',
  loadMore: 'Daha fazla yükle',
  shown: '{shown} / {total}',
  sources: 'Kaynaklar ve kataloglar',
  openCatalog: 'Kataloğu aç',
  openSource: 'Kaynağı aç',
  read: 'Çevrimiçi oku',
  downloads: 'İndirmeler',
  category: 'Kategori',
  definition: 'Kısaca',
  practice: 'Uygulamada',
  perspectives: 'Farklı bakış açıları',
  related: 'İlgili terimler',
  fallback:
    'Editoryal tanımlar şu anda Almanca ve İngilizce olarak kullanılabilir. İngilizce sürüm gösterilir.',
  loading: 'Yerel bilgi verileri hazırlanıyor…',
  error: 'Yerel bilgi verileri hazırlanamadı.',
  retry: 'Tekrar dene',
  provenance: 'Önceki uygulama anlık görüntüsü · kütüphane için yalnızca üstveri ve bağlantılar.',
  readingHelp: 'Okuma yardımı',
  checkSourceDate: 'Kaynağı ve tarihini kontrol edin.',
  comparePerspectives: 'Bakış açılarını ve bağlamı karşılaştırın.',
  deepenRelated: 'İlgili terimlerle derinleşin.',
  mutualAid: 'Karşılıklı yardımla başlayın',
  snapshotDate: 'Katalog durumu',
  historicalReview: 'Kaynağın tarihsel kontrol tarihi',
  offlineNote:
    'Yüklenen üstveriler yerel olarak okunabilir kalır. Harici materyal açmak ağ bağlantısı gerektirir.',
});
const mobileKnowledgeCopyByLanguage: Readonly<Record<UiLanguage, MobileKnowledgeCopy>> =
  Object.freeze({
    en: english,
    de: german,
    es: spanish,
    fr: french,
    it: italian,
    pt: portuguese,
    ru: russian,
    el: greek,
    tr: turkish,
  });
export function getMobileKnowledgeCopy(language: UiLanguage): MobileKnowledgeCopy {
  return mobileKnowledgeCopyByLanguage[language];
}
