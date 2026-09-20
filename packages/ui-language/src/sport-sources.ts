import type { UiLanguage } from './index.js';

export type SportSourcesCopy = Readonly<{
  heading: string;
  summary: string;
  intro: string;
  category: string;
  originalLanguage: string;
  openOriginal: string;
  record: string;
  observed: string;
  directoryOnly: string;
  rightsUnknown: string;
  feedUnchecked: string;
  linkedReadingNote: string;
  categories: Readonly<Record<string, string>>;
}>;
export type SportFanSourcesCopy = Readonly<{
  fanHeading: string;
  fanSummary: string;
  fanIntro: string;
  fanCategories: Readonly<Record<string, string>>;
}>;

const categories = (values: readonly string[]): Readonly<Record<string, string>> => ({
  'critical-football-journalism': values[0]!,
  'queer-fan-culture-antidiscrimination': values[1]!,
  antidiscrimination: values[2]!,
  'history-inclusion': values[3]!,
  'community-sport-right-to-sport': values[4]!,
  'sport-for-all': values[5]!,
  'sport-society': values[6]!,
  'feminist-perspectives': values[7]!,
  'sport-politics': values[8]!,
});
const fanCategories = (values: readonly string[]): Readonly<Record<string, string>> => ({
  'fan-antifascist': values[0]!,
  'fan-rights-democracy': values[1]!,
  'fan-antidiscrimination': values[2]!,
  'fan-queer-gender': values[3]!,
  'fan-community-solidarity': values[4]!,
  'fan-sport-adjacent': values[5]!,
});

const entries: Readonly<Record<UiLanguage, SportSourcesCopy>> = {
  en: {
    heading: 'Sport sources',
    summary: 'Sport sources (9)',
    intro: 'A curated directory of original links. It is not a feed or news claim.',
    category: 'Category',
    originalLanguage: 'Original language',
    openOriginal: 'Open original',
    record: 'Source record',
    observed: 'Recorded: {date}',
    directoryOnly: 'Directory link only.',
    rightsUnknown: 'Reuse rights are not recorded.',
    feedUnchecked: 'Feed availability has not been checked.',
    linkedReadingNote: 'This publisher is linked to an existing sport reading note.',
    categories: categories([
      'Critical football journalism',
      'Queer fan culture and anti-discrimination',
      'Anti-discrimination',
      'History and inclusion',
      'Community sport and the right to sport',
      'Sport for all',
      'Sport and society',
      'Feminist perspectives',
      'Sport and politics',
    ]),
  },
  de: {
    heading: 'Sportquellen',
    summary: 'Sportquellen (9)',
    intro:
      'Ein kuratiertes Verzeichnis mit Original-Links. Kein Feed und keine Nachrichtenbehauptung.',
    category: 'Kategorie',
    originalLanguage: 'Originalsprache',
    openOriginal: 'Original öffnen',
    record: 'Quellenangabe',
    observed: 'Erfasst: {date}',
    directoryOnly: 'Nur Verzeichnis-Link.',
    rightsUnknown: 'Nachnutzungsrechte sind nicht dokumentiert.',
    feedUnchecked: 'Die Feed-Verfügbarkeit wurde nicht geprüft.',
    linkedReadingNote: 'Dieser Verlag ist mit einem bestehenden Sport-Lesehinweis verknüpft.',
    categories: categories([
      'Kritischer Fußballjournalismus',
      'Queere Fankultur und Antidiskriminierung',
      'Antidiskriminierung',
      'Geschichte und Inklusion',
      'Breitensport und Recht auf Sport',
      'Sport für alle',
      'Sport und Gesellschaft',
      'Feministische Perspektiven',
      'Sport und Politik',
    ]),
  },
  es: {
    heading: 'Fuentes deportivas',
    summary: 'Fuentes deportivas (9)',
    intro:
      'Un directorio seleccionado de enlaces originales. No es un canal ni una afirmación de noticias.',
    category: 'Categoría',
    originalLanguage: 'Idioma original',
    openOriginal: 'Abrir original',
    record: 'Ficha de la fuente',
    observed: 'Registrado: {date}',
    directoryOnly: 'Solo enlace de directorio.',
    rightsUnknown: 'No se registran derechos de reutilización.',
    feedUnchecked: 'No se ha comprobado la disponibilidad del canal.',
    linkedReadingNote: 'Esta publicación está vinculada a una nota de lectura deportiva existente.',
    categories: categories([
      'Periodismo crítico de fútbol',
      'Cultura de aficionados queer y antidiscriminación',
      'Antidiscriminación',
      'Historia e inclusión',
      'Deporte comunitario y derecho al deporte',
      'Deporte para todas las personas',
      'Deporte y sociedad',
      'Perspectivas feministas',
      'Deporte y política',
    ]),
  },
  fr: {
    heading: 'Sources sportives',
    summary: 'Sources sportives (9)',
    intro:
      'Un répertoire sélectionné de liens originaux. Ce n’est ni un flux ni une affirmation d’actualité.',
    category: 'Catégorie',
    originalLanguage: 'Langue originale',
    openOriginal: 'Ouvrir l’original',
    record: 'Fiche source',
    observed: 'Relevé : {date}',
    directoryOnly: 'Lien de répertoire uniquement.',
    rightsUnknown: 'Les droits de réutilisation ne sont pas documentés.',
    feedUnchecked: 'La disponibilité du flux n’a pas été vérifiée.',
    linkedReadingNote: 'Cette publication est liée à une note de lecture sportive existante.',
    categories: categories([
      'Journalisme critique sur le football',
      'Culture des supporteur·ices queer et lutte contre les discriminations',
      'Lutte contre les discriminations',
      'Histoire et inclusion',
      'Sport populaire et droit au sport',
      'Sport pour toutes et tous',
      'Sport et société',
      'Perspectives féministes',
      'Sport et politique',
    ]),
  },
  it: {
    heading: 'Fonti sportive',
    summary: 'Fonti sportive (9)',
    intro: 'Un elenco curato di link originali. Non è un feed né una dichiarazione di notizie.',
    category: 'Categoria',
    originalLanguage: 'Lingua originale',
    openOriginal: 'Apri l’originale',
    record: 'Scheda della fonte',
    observed: 'Registrato: {date}',
    directoryOnly: 'Solo link di elenco.',
    rightsUnknown: 'I diritti di riuso non sono documentati.',
    feedUnchecked: 'La disponibilità del feed non è stata verificata.',
    linkedReadingNote: 'Questa pubblicazione è collegata a una nota di lettura sportiva esistente.',
    categories: categories([
      'Giornalismo critico sul calcio',
      'Cultura dei tifosi queer e antidiscriminazione',
      'Antidiscriminazione',
      'Storia e inclusione',
      'Sport di base e diritto allo sport',
      'Sport per tutte e tutti',
      'Sport e società',
      'Prospettive femministe',
      'Sport e politica',
    ]),
  },
  pt: {
    heading: 'Fontes de desporto',
    summary: 'Fontes de desporto (9)',
    intro:
      'Um diretório selecionado de ligações originais. Não é um feed nem uma afirmação de notícias.',
    category: 'Categoria',
    originalLanguage: 'Idioma original',
    openOriginal: 'Abrir original',
    record: 'Registo da fonte',
    observed: 'Registado: {date}',
    directoryOnly: 'Apenas ligação de diretório.',
    rightsUnknown: 'Os direitos de reutilização não estão registados.',
    feedUnchecked: 'A disponibilidade do feed não foi verificada.',
    linkedReadingNote: 'Esta publicação está ligada a uma nota de leitura desportiva existente.',
    categories: categories([
      'Jornalismo crítico de futebol',
      'Cultura de adeptos queer e antidiscriminação',
      'Antidiscriminação',
      'História e inclusão',
      'Desporto comunitário e direito ao desporto',
      'Desporto para todas as pessoas',
      'Desporto e sociedade',
      'Perspetivas feministas',
      'Desporto e política',
    ]),
  },
  ru: {
    heading: 'Спортивные источники',
    summary: 'Спортивные источники (9)',
    intro: 'Подборка оригинальных ссылок в каталоге. Это не лента и не новостное утверждение.',
    category: 'Категория',
    originalLanguage: 'Язык оригинала',
    openOriginal: 'Открыть оригинал',
    record: 'Запись источника',
    observed: 'Зафиксировано: {date}',
    directoryOnly: 'Только ссылка каталога.',
    rightsUnknown: 'Права на повторное использование не зафиксированы.',
    feedUnchecked: 'Доступность ленты не проверялась.',
    linkedReadingNote: 'Это издание связано с существующей спортивной заметкой для чтения.',
    categories: categories([
      'Критическая футбольная журналистика',
      'Квир-фан-культура и антидискриминация',
      'Антидискриминация',
      'История и инклюзия',
      'Массовый спорт и право на спорт',
      'Спорт для всех',
      'Спорт и общество',
      'Феминистские перспективы',
      'Спорт и политика',
    ]),
  },
  el: {
    heading: 'Αθλητικές πηγές',
    summary: 'Αθλητικές πηγές (9)',
    intro:
      'Ένας επιλεγμένος κατάλογος πρωτότυπων συνδέσμων. Δεν είναι ροή ούτε δημοσιογραφικός ισχυρισμός.',
    category: 'Κατηγορία',
    originalLanguage: 'Γλώσσα πρωτοτύπου',
    openOriginal: 'Άνοιγμα πρωτοτύπου',
    record: 'Καταχώριση πηγής',
    observed: 'Καταγράφηκε: {date}',
    directoryOnly: 'Σύνδεσμος καταλόγου μόνο.',
    rightsUnknown: 'Δεν έχουν καταγραφεί δικαιώματα επαναχρησιμοποίησης.',
    feedUnchecked: 'Η διαθεσιμότητα της ροής δεν έχει ελεγχθεί.',
    linkedReadingNote: 'Αυτή η έκδοση συνδέεται με υπάρχουσα αθλητική σημείωση ανάγνωσης.',
    categories: categories([
      'Κριτική ποδοσφαιρική δημοσιογραφία',
      'Κουίρ οπαδική κουλτούρα και κατά των διακρίσεων',
      'Κατά των διακρίσεων',
      'Ιστορία και συμπερίληψη',
      'Κοινοτικός αθλητισμός και δικαίωμα στον αθλητισμό',
      'Αθλητισμός για όλες και όλους',
      'Αθλητισμός και κοινωνία',
      'Φεμινιστικές οπτικές',
      'Αθλητισμός και πολιτική',
    ]),
  },
  tr: {
    heading: 'Spor kaynakları',
    summary: 'Spor kaynakları (9)',
    intro: 'Özgün bağlantılardan seçilmiş bir dizin. Bir akış ya da haber iddiası değildir.',
    category: 'Kategori',
    originalLanguage: 'Özgün dil',
    openOriginal: 'Özgünü aç',
    record: 'Kaynak kaydı',
    observed: 'Kaydedildi: {date}',
    directoryOnly: 'Yalnızca dizin bağlantısı.',
    rightsUnknown: 'Yeniden kullanım hakları kaydedilmemiştir.',
    feedUnchecked: 'Akış kullanılabilirliği kontrol edilmemiştir.',
    linkedReadingNote: 'Bu yayın mevcut bir spor okuma notuyla bağlantılıdır.',
    categories: categories([
      'Eleştirel futbol gazeteciliği',
      'Queer taraftar kültürü ve ayrımcılık karşıtlığı',
      'Ayrımcılık karşıtlığı',
      'Tarih ve kapsayıcılık',
      'Topluluk sporu ve spor hakkı',
      'Herkes için spor',
      'Spor ve toplum',
      'Feminist perspektifler',
      'Spor ve politika',
    ]),
  },
};

const fanEntries: Readonly<Record<UiLanguage, SportFanSourcesCopy>> = {
  en: {
    fanHeading: 'Supporter groups and networks',
    fanSummary: 'Supporter groups and networks ({count})',
    fanIntro:
      'Official self-descriptions of supporter groups and networks. Directory links only; political labels are not inferred.',
    fanCategories: fanCategories([
      'Antifascist fan network',
      'Supporter rights and democracy',
      'General anti-discrimination',
      'Queer and gender inclusion',
      'Community solidarity',
      'Sport-adjacent collective',
    ]),
  },
  de: {
    fanHeading: 'Fangruppen und Netzwerke',
    fanSummary: 'Fangruppen und Netzwerke ({count})',
    fanIntro:
      'Offizielle Selbstbeschreibungen von Fangruppen und Netzwerken. Nur Verzeichnis-Links; politische Etiketten werden nicht abgeleitet.',
    fanCategories: fanCategories([
      'Antifaschistisches Fannetzwerk',
      'Supporterrechte und Demokratie',
      'Allgemeine Antidiskriminierung',
      'Queere und geschlechtliche Inklusion',
      'Solidarität in der Gemeinschaft',
      'Sportnahes Kollektiv',
    ]),
  },
  es: {
    fanHeading: 'Grupos y redes de aficionados',
    fanSummary: 'Grupos y redes de aficionados ({count})',
    fanIntro:
      'Autodescripciones oficiales de grupos y redes de aficionados. Solo enlaces de directorio; no se infieren etiquetas políticas.',
    fanCategories: fanCategories([
      'Red antifascista de aficionados',
      'Derechos y democracia de aficionados',
      'Antidiscriminación general',
      'Inclusión queer y de género',
      'Solidaridad comunitaria',
      'Colectivo relacionado con el deporte',
    ]),
  },
  fr: {
    fanHeading: 'Groupes et réseaux de supporteur·ices',
    fanSummary: 'Groupes et réseaux de supporteur·ices ({count})',
    fanIntro:
      'Autodescriptions officielles de groupes et réseaux de supporteur·ices. Liens de répertoire uniquement ; aucune étiquette politique n’est déduite.',
    fanCategories: fanCategories([
      'Réseau de supporteur·ices antifasciste',
      'Droits et démocratie des supporteur·ices',
      'Lutte générale contre les discriminations',
      'Inclusion queer et de genre',
      'Solidarité communautaire',
      'Collectif lié au sport',
    ]),
  },
  it: {
    fanHeading: 'Gruppi e reti di tifosi',
    fanSummary: 'Gruppi e reti di tifosi ({count})',
    fanIntro:
      'Autodescrizioni ufficiali di gruppi e reti di tifosi. Solo link di elenco; le etichette politiche non sono dedotte.',
    fanCategories: fanCategories([
      'Rete di tifosi antifascista',
      'Diritti e democrazia dei tifosi',
      'Antidiscriminazione generale',
      'Inclusione queer e di genere',
      'Solidarietà comunitaria',
      'Collettivo vicino allo sport',
    ]),
  },
  pt: {
    fanHeading: 'Grupos e redes de adeptos',
    fanSummary: 'Grupos e redes de adeptos ({count})',
    fanIntro:
      'Autodescrições oficiais de grupos e redes de adeptos. Apenas ligações de diretório; não são inferidos rótulos políticos.',
    fanCategories: fanCategories([
      'Rede antifascista de adeptos',
      'Direitos e democracia dos adeptos',
      'Antidiscriminação geral',
      'Inclusão queer e de género',
      'Solidariedade comunitária',
      'Coletivo ligado ao desporto',
    ]),
  },
  ru: {
    fanHeading: 'Группы и сети болельщиков',
    fanSummary: 'Группы и сети болельщиков ({count})',
    fanIntro:
      'Официальные самоописания групп и сетей болельщиков. Только ссылки каталога; политические ярлыки не выводятся.',
    fanCategories: fanCategories([
      'Антифашистская сеть болельщиков',
      'Права и демократия болельщиков',
      'Общая антидискриминация',
      'Квир- и гендерная инклюзия',
      'Общественная солидарность',
      'Связанное со спортом объединение',
    ]),
  },
  el: {
    fanHeading: 'Ομάδες και δίκτυα οπαδών',
    fanSummary: 'Ομάδες και δίκτυα οπαδών ({count})',
    fanIntro:
      'Επίσημες αυτοπεριγραφές ομάδων και δικτύων οπαδών. Μόνο σύνδεσμοι καταλόγου· δεν συνάγονται πολιτικές ετικέτες.',
    fanCategories: fanCategories([
      'Αντιφασιστικό δίκτυο οπαδών',
      'Δικαιώματα και δημοκρατία οπαδών',
      'Γενική καταπολέμηση των διακρίσεων',
      'Κουίρ και έμφυλη συμπερίληψη',
      'Κοινοτική αλληλεγγύη',
      'Αθλητικά συναφής συλλογικότητα',
    ]),
  },
  tr: {
    fanHeading: 'Taraftar grupları ve ağları',
    fanSummary: 'Taraftar grupları ve ağları ({count})',
    fanIntro:
      'Taraftar grupları ve ağlarının resmî öz tanımları. Yalnızca dizin bağlantıları; siyasi etiketler çıkarılmaz.',
    fanCategories: fanCategories([
      'Antifaşist taraftar ağı',
      'Taraftar hakları ve demokrasi',
      'Genel ayrımcılık karşıtlığı',
      'Queer ve toplumsal cinsiyet kapsayıcılığı',
      'Topluluk dayanışması',
      'Sporla ilgili kolektif',
    ]),
  },
};

export function getSportSourcesCopy(language: UiLanguage): SportSourcesCopy & SportFanSourcesCopy {
  return { ...entries[language], ...fanEntries[language] };
}
