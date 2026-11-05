import type { UiLanguage } from './index';

export type VideoSourcesCopy = Readonly<{
  title: string;
  intro: string;
  language: string;
  all: string;
  count: string;
  open: string;
  empty: string;
  privacy: string;
  channel: string;
  collection: string;
  creator: string;
  selected: string;
  pilotNote: string;
  selectedEmpty: string;
  short: string;
  video: string;
  openVideo: string;
}>;

const copy: Readonly<Record<UiLanguage, VideoSourcesCopy>> = {
  de: {
    title: 'Videos entdecken',
    intro:
      'Kurzvideos, Gespräche und Erklärungen bei unseren ausgewählten Quellen. Hier öffnest du das Originalangebot; einzelne Clips sind noch nicht in WRN eingebettet.',
    language: 'Inhaltssprache',
    all: 'Alle Sprachen',
    count: 'Quellen: {count}',
    open: 'Originalangebot öffnen',
    empty: 'Keine Quellen in dieser Sprache.',
    privacy:
      'Externe Seiten laden erst, wenn du einen Link öffnest. Die verlinkten Videos sind nicht offline in WRN verfügbar.',
    channel: 'Videokanal',
    collection: 'Videosammlung & Redaktion',
    creator: 'Creator & Hintergründe',
    selected: 'Video-Links im Pilot',
    pilotNote: 'Titel, Kanal und Format geprüft; die redaktionelle Inhaltsprüfung steht noch aus.',
    selectedEmpty: 'Noch keine Video-Links in dieser Sprache.',
    short: 'Kurzvideo',
    video: 'Erklärvideo',
    openVideo: 'Originalvideo öffnen',
  },
  en: {
    title: 'Discover videos',
    intro:
      'Short videos, conversations and explainers from our selected sources. Open the original offering here; individual clips are not yet embedded in WRN.',
    language: 'Content language',
    all: 'All languages',
    count: 'Sources: {count}',
    open: 'Open original offering',
    empty: 'No sources in this language.',
    privacy:
      'External sites load only when you open a link. Linked videos are not available offline in WRN.',
    channel: 'Video channel',
    collection: 'Video collection & editorial',
    creator: 'Creator & background',
    selected: 'Pilot video links',
    pilotNote: 'Title, channel and format checked; editorial content review is still pending.',
    selectedEmpty: 'No video links in this language yet.',
    short: 'Short video',
    video: 'Explainer video',
    openVideo: 'Open original video',
  },
  es: {
    title: 'Descubrir vídeos',
    intro:
      'Vídeos cortos, conversaciones y explicaciones de nuestras fuentes seleccionadas. Aquí puedes abrir la oferta original; los clips aún no están integrados en WRN.',
    language: 'Idioma del contenido',
    all: 'Todos los idiomas',
    count: 'Fuentes: {count}',
    open: 'Abrir oferta original',
    empty: 'No hay fuentes en este idioma.',
    privacy:
      'Los sitios externos solo se cargan al abrir un enlace. Los vídeos enlazados no están disponibles sin conexión en WRN.',
    channel: 'Canal de vídeo',
    collection: 'Videoteca y redacción',
    creator: 'Creación y contexto',
    selected: 'Enlaces de vídeo en prueba',
    pilotNote: 'Título, canal y formato comprobados; aún falta revisar el contenido.',
    selectedEmpty: 'Aún no hay enlaces de vídeo en este idioma.',
    short: 'Vídeo corto',
    video: 'Vídeo explicativo',
    openVideo: 'Abrir vídeo original',
  },
  fr: {
    title: 'Découvrir des vidéos',
    intro:
      'Vidéos courtes, entretiens et explications de nos sources sélectionnées. Accédez ici à leur offre originale ; les clips ne sont pas encore intégrés à WRN.',
    language: 'Langue du contenu',
    all: 'Toutes les langues',
    count: 'Sources : {count}',
    open: 'Ouvrir l’offre originale',
    empty: 'Aucune source dans cette langue.',
    privacy:
      'Les sites externes se chargent uniquement à l’ouverture d’un lien. Les vidéos liées ne sont pas disponibles hors ligne dans WRN.',
    channel: 'Chaîne vidéo',
    collection: 'Vidéothèque et rédaction',
    creator: 'Création et contexte',
    selected: 'Liens vidéo pilotes',
    pilotNote: 'Titre, chaîne et format vérifiés ; l’examen éditorial du contenu reste à faire.',
    selectedEmpty: 'Aucun lien vidéo dans cette langue pour le moment.',
    short: 'Vidéo courte',
    video: 'Vidéo explicative',
    openVideo: 'Ouvrir la vidéo originale',
  },
  it: {
    title: 'Scopri i video',
    intro:
      'Video brevi, conversazioni e approfondimenti dalle fonti selezionate. Qui puoi aprire l’offerta originale; i singoli video non sono ancora incorporati in WRN.',
    language: 'Lingua dei contenuti',
    all: 'Tutte le lingue',
    count: 'Fonti: {count}',
    open: 'Apri l’offerta originale',
    empty: 'Nessuna fonte in questa lingua.',
    privacy:
      'I siti esterni si caricano solo quando apri un link. I video collegati non sono disponibili offline in WRN.',
    channel: 'Canale video',
    collection: 'Videoteca e redazione',
    creator: 'Autori e contesto',
    selected: 'Link video pilota',
    pilotNote: 'Titolo, canale e formato verificati; la revisione dei contenuti è ancora in corso.',
    selectedEmpty: 'Nessun link video in questa lingua per ora.',
    short: 'Video breve',
    video: 'Video esplicativo',
    openVideo: 'Apri il video originale',
  },
  pt: {
    title: 'Descobrir vídeos',
    intro:
      'Vídeos curtos, conversas e explicações das nossas fontes selecionadas. Aqui podes abrir a oferta original; os vídeos ainda não estão incorporados na WRN.',
    language: 'Idioma do conteúdo',
    all: 'Todos os idiomas',
    count: 'Fontes: {count}',
    open: 'Abrir oferta original',
    empty: 'Sem fontes neste idioma.',
    privacy:
      'Os sites externos só carregam quando abres um link. Os vídeos associados não estão disponíveis offline na WRN.',
    channel: 'Canal de vídeo',
    collection: 'Videoteca e redação',
    creator: 'Criação e contexto',
    selected: 'Links de vídeo em teste',
    pilotNote:
      'Título, canal e formato verificados; a revisão editorial do conteúdo ainda está pendente.',
    selectedEmpty: 'Ainda não há links de vídeo neste idioma.',
    short: 'Vídeo curto',
    video: 'Vídeo explicativo',
    openVideo: 'Abrir vídeo original',
  },
  ru: {
    title: 'Открывайте видео',
    intro:
      'Короткие видео, беседы и объяснения из выбранных нами источников. Здесь можно открыть оригинальный сайт; отдельные ролики пока не встроены в WRN.',
    language: 'Язык материала',
    all: 'Все языки',
    count: 'Источников: {count}',
    open: 'Открыть оригинальный сайт',
    empty: 'Нет источников на этом языке.',
    privacy:
      'Внешние сайты загружаются только при открытии ссылки. Видео по ссылкам недоступны офлайн в WRN.',
    channel: 'Видеоканал',
    collection: 'Видеотека и редакция',
    creator: 'Авторы и контекст',
    selected: 'Пилотные ссылки на видео',
    pilotNote:
      'Название, канал и формат проверены; редакционная проверка содержания ещё не завершена.',
    selectedEmpty: 'Пока нет ссылок на видео на этом языке.',
    short: 'Короткое видео',
    video: 'Объясняющее видео',
    openVideo: 'Открыть оригинал видео',
  },
  el: {
    title: 'Ανακάλυψε βίντεο',
    intro:
      'Σύντομα βίντεο, συζητήσεις και αναλύσεις από τις επιλεγμένες πηγές μας. Εδώ ανοίγεις το αρχικό περιεχόμενο· τα βίντεο δεν έχουν ακόμη ενσωματωθεί στο WRN.',
    language: 'Γλώσσα περιεχομένου',
    all: 'Όλες οι γλώσσες',
    count: 'Πηγές: {count}',
    open: 'Άνοιγμα αρχικής σελίδας',
    empty: 'Δεν υπάρχουν πηγές σε αυτή τη γλώσσα.',
    privacy:
      'Οι εξωτερικές σελίδες φορτώνουν μόνο όταν ανοίγεις έναν σύνδεσμο. Τα συνδεδεμένα βίντεο δεν είναι διαθέσιμα εκτός σύνδεσης στο WRN.',
    channel: 'Κανάλι βίντεο',
    collection: 'Βιντεοθήκη και σύνταξη',
    creator: 'Δημιουργοί και πλαίσιο',
    selected: 'Πιλοτικοί σύνδεσμοι βίντεο',
    pilotNote:
      'Ο τίτλος, το κανάλι και η μορφή ελέγχθηκαν· εκκρεμεί ο συντακτικός έλεγχος περιεχομένου.',
    selectedEmpty: 'Δεν υπάρχουν ακόμη σύνδεσμοι βίντεο σε αυτή τη γλώσσα.',
    short: 'Σύντομο βίντεο',
    video: 'Επεξηγηματικό βίντεο',
    openVideo: 'Άνοιγμα αρχικού βίντεο',
  },
  tr: {
    title: 'Videoları keşfet',
    intro:
      'Seçtiğimiz kaynaklardan kısa videolar, söyleşiler ve açıklamalar. Buradan özgün içeriği açabilirsin; videolar henüz WRN içine yerleştirilmedi.',
    language: 'İçerik dili',
    all: 'Tüm diller',
    count: 'Kaynaklar: {count}',
    open: 'Özgün içeriği aç',
    empty: 'Bu dilde kaynak yok.',
    privacy:
      'Dış siteler yalnızca bir bağlantıyı açtığında yüklenir. Bağlantılı videolar WRN içinde çevrimdışı kullanılamaz.',
    channel: 'Video kanalı',
    collection: 'Video arşivi ve yayın',
    creator: 'Üreticiler ve bağlam',
    selected: 'Pilot video bağlantıları',
    pilotNote: 'Başlık, kanal ve biçim kontrol edildi; içerik incelemesi henüz tamamlanmadı.',
    selectedEmpty: 'Bu dilde henüz video bağlantısı yok.',
    short: 'Kısa video',
    video: 'Açıklayıcı video',
    openVideo: 'Özgün videoyu aç',
  },
};

export function getVideoSourcesCopy(language: UiLanguage): VideoSourcesCopy {
  return copy[language];
}
