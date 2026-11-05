import type { UiLanguage } from './index.js';

export type SourcePassCopy = Readonly<{
  curatedTitle: string;
  curatedIntro: string;
  completeTitle: string;
  completeIntro: string;
  region: string;
  country: string;
  topic: string;
  medium: string;
  selfDescription: string;
  editorialDescription: string;
  stableId: string;
  aliases: string;
  endpointHealth: string;
  lastSuccess: string;
  unchecked: string;
  rights: string;
  rightsCaveat: string;
  correctionContact: string;
  original: string;
  initialsFallback: string;
  unavailable: string;
}>;

const values: Record<UiLanguage, SourcePassCopy> = {
  en: {
    curatedTitle: 'Curated active sources',
    curatedIntro:
      'Canonical source profiles checked by WRN. Self-description and editorial assessment are shown separately.',
    completeTitle: 'Historical and current directory endpoints',
    completeIntro:
      'Recorded technical addresses from the legacy and current directories. They are not all independently verified source profiles.',
    region: 'World region',
    country: 'Country',
    topic: 'Topic or tendency',
    medium: 'Medium',
    selfDescription: 'Source self-description',
    editorialDescription: 'WRN editorial assessment',
    stableId: 'Stable source ID',
    aliases: 'Aliases',
    endpointHealth: 'Endpoint status',
    lastSuccess: 'Last successful check',
    unchecked: 'Not checked',
    rights: 'Rights by medium',
    rightsCaveat:
      'Source-level terms can contain exceptions. Every individual text, image and audio item still requires its own rights check.',
    correctionContact: 'Official public contact',
    original: 'Open original',
    initialsFallback: 'Neutral initials; no cleared logo stored.',
    unavailable:
      'Curated profiles could not be verified. The historical and current directory list remains available.',
  },
  de: {
    curatedTitle: 'Kuratierte aktive Quellen',
    curatedIntro:
      'Von WRN geprüfte kanonische Quellenprofile. Selbstbeschreibung und redaktionelle Einordnung stehen getrennt.',
    completeTitle: 'Historische und aktuelle Verzeichnis-Endpunkte',
    completeIntro:
      'Erfasste technische Adressen aus dem historischen und aktuellen Verzeichnis. Nicht alle sind unabhängig geprüfte Quellenprofile.',
    region: 'Weltregion',
    country: 'Land',
    topic: 'Thema oder Strömung',
    medium: 'Medium',
    selfDescription: 'Selbstbeschreibung der Quelle',
    editorialDescription: 'Redaktionelle Einordnung von WRN',
    stableId: 'Stabile Quellen-ID',
    aliases: 'Aliasse',
    endpointHealth: 'Status des Endpunkts',
    lastSuccess: 'Letzte erfolgreiche Prüfung',
    unchecked: 'Nicht geprüft',
    rights: 'Rechte nach Medium',
    rightsCaveat:
      'Rechteangaben der Quelle können Ausnahmen enthalten. Jeder einzelne Text sowie jedes Bild und Audio braucht weiterhin eine eigene Rechteprüfung.',
    correctionContact: 'Offizieller öffentlicher Kontakt',
    original: 'Original öffnen',
    initialsFallback: 'Neutrale Initialen; kein freigegebenes Logo gespeichert.',
    unavailable:
      'Kuratierte Profile konnten nicht geprüft werden. Die historische und aktuelle Verzeichnisliste bleibt verfügbar.',
  },
  es: {
    curatedTitle: 'Fuentes activas seleccionadas',
    curatedIntro:
      'Perfiles canónicos revisados por WRN. La autodescripción y la valoración editorial se muestran por separado.',
    completeTitle: 'Direcciones históricas y actuales del directorio',
    completeIntro:
      'Direcciones técnicas registradas en los directorios histórico y actual; no todas son perfiles verificados.',
    region: 'Región mundial',
    country: 'País',
    topic: 'Tema o corriente',
    medium: 'Medio',
    selfDescription: 'Autodescripción de la fuente',
    editorialDescription: 'Valoración editorial de WRN',
    stableId: 'ID estable de la fuente',
    aliases: 'Alias',
    endpointHealth: 'Estado de la dirección',
    lastSuccess: 'Última comprobación correcta',
    unchecked: 'Sin comprobar',
    rights: 'Derechos por medio',
    rightsCaveat:
      'Las condiciones de la fuente pueden incluir excepciones. Cada texto, imagen y audio requiere su propia revisión de derechos.',
    correctionContact: 'Contacto público oficial',
    original: 'Abrir original',
    initialsFallback: 'Iniciales neutras; no hay logotipo autorizado guardado.',
    unavailable:
      'No se pudieron verificar los perfiles seleccionados. La lista histórica y actual del directorio sigue disponible.',
  },
  fr: {
    curatedTitle: 'Sources actives sélectionnées',
    curatedIntro:
      'Profils canoniques vérifiés par WRN. Autodescription et évaluation éditoriale sont séparées.',
    completeTitle: 'Adresses historiques et actuelles du répertoire',
    completeIntro:
      'Adresses techniques des répertoires historique et actuel ; elles ne sont pas toutes vérifiées.',
    region: 'Région du monde',
    country: 'Pays',
    topic: 'Thème ou courant',
    medium: 'Média',
    selfDescription: 'Autodescription de la source',
    editorialDescription: 'Évaluation éditoriale de WRN',
    stableId: 'Identifiant stable de la source',
    aliases: 'Alias',
    endpointHealth: 'État de l’adresse',
    lastSuccess: 'Dernière vérification réussie',
    unchecked: 'Non vérifié',
    rights: 'Droits par média',
    rightsCaveat:
      'Les conditions de la source peuvent comporter des exceptions. Chaque texte, image et contenu audio nécessite encore sa propre vérification des droits.',
    correctionContact: 'Contact public officiel',
    original: 'Ouvrir l’original',
    initialsFallback: 'Initiales neutres ; aucun logo autorisé enregistré.',
    unavailable:
      'Les profils sélectionnés n’ont pas pu être vérifiés. La liste historique et actuelle du répertoire reste disponible.',
  },
  it: {
    curatedTitle: 'Fonti attive curate',
    curatedIntro:
      'Profili canonici verificati da WRN. Autodescrizione e valutazione editoriale sono separate.',
    completeTitle: 'Endpoint storici e attuali del repertorio',
    completeIntro:
      'Indirizzi tecnici dei repertori storico e attuale; non sono tutti profili verificati.',
    region: 'Regione del mondo',
    country: 'Paese',
    topic: 'Tema o corrente',
    medium: 'Mezzo',
    selfDescription: 'Autodescrizione della fonte',
    editorialDescription: 'Valutazione editoriale WRN',
    stableId: 'ID stabile della fonte',
    aliases: 'Alias',
    endpointHealth: 'Stato endpoint',
    lastSuccess: 'Ultimo controllo riuscito',
    unchecked: 'Non controllato',
    rights: 'Diritti per mezzo',
    rightsCaveat:
      'Le condizioni della fonte possono contenere eccezioni. Ogni testo, immagine e contenuto audio richiede comunque una propria verifica dei diritti.',
    correctionContact: 'Contatto pubblico ufficiale',
    original: 'Apri originale',
    initialsFallback: 'Iniziali neutre; nessun logo autorizzato memorizzato.',
    unavailable:
      'Impossibile verificare i profili curati. L’elenco storico e attuale resta disponibile.',
  },
  pt: {
    curatedTitle: 'Fontes ativas selecionadas',
    curatedIntro:
      'Perfis canónicos verificados pela WRN. Autodescrição e avaliação editorial aparecem separadas.',
    completeTitle: 'Endpoints históricos e atuais do diretório',
    completeIntro:
      'Endereços técnicos dos diretórios histórico e atual; nem todos são perfis verificados.',
    region: 'Região mundial',
    country: 'País',
    topic: 'Tema ou corrente',
    medium: 'Meio',
    selfDescription: 'Autodescrição da fonte',
    editorialDescription: 'Avaliação editorial da WRN',
    stableId: 'ID estável da fonte',
    aliases: 'Nomes alternativos',
    endpointHealth: 'Estado do endpoint',
    lastSuccess: 'Última verificação com sucesso',
    unchecked: 'Não verificado',
    rights: 'Direitos por meio',
    rightsCaveat:
      'As condições da fonte podem conter exceções. Cada texto, imagem e áudio continua a exigir a sua própria verificação de direitos.',
    correctionContact: 'Contacto público oficial',
    original: 'Abrir original',
    initialsFallback: 'Iniciais neutras; nenhum logótipo autorizado guardado.',
    unavailable:
      'Não foi possível verificar os perfis selecionados. A lista histórica e atual continua disponível.',
  },
  ru: {
    curatedTitle: 'Отобранные активные источники',
    curatedIntro:
      'Канонические профили проверены WRN. Самоописание и редакционная оценка разделены.',
    completeTitle: 'Исторические и текущие адреса каталога',
    completeIntro:
      'Технические адреса из исторического и текущего каталогов; не все являются проверенными профилями.',
    region: 'Регион мира',
    country: 'Страна',
    topic: 'Тема или течение',
    medium: 'Тип медиа',
    selfDescription: 'Самоописание источника',
    editorialDescription: 'Редакционная оценка WRN',
    stableId: 'Стабильный ID источника',
    aliases: 'Другие названия',
    endpointHealth: 'Состояние адреса',
    lastSuccess: 'Последняя успешная проверка',
    unchecked: 'Не проверено',
    rights: 'Права по типу медиа',
    rightsCaveat:
      'Условия источника могут содержать исключения. Права на каждый текст, изображение и аудиоматериал необходимо проверять отдельно.',
    correctionContact: 'Официальный публичный контакт',
    original: 'Открыть оригинал',
    initialsFallback: 'Нейтральные инициалы; разрешённый логотип не сохранён.',
    unavailable:
      'Проверить отобранные профили не удалось. Исторический и текущий список каталога доступен.',
  },
  el: {
    curatedTitle: 'Επιμελημένες ενεργές πηγές',
    curatedIntro:
      'Κανονικά προφίλ ελεγμένα από το WRN. Η αυτοπεριγραφή και η συντακτική αξιολόγηση εμφανίζονται χωριστά.',
    completeTitle: 'Ιστορικές και τρέχουσες διευθύνσεις καταλόγου',
    completeIntro:
      'Τεχνικές διευθύνσεις από τον ιστορικό και τρέχοντα κατάλογο· δεν είναι όλες επαληθευμένα προφίλ.',
    region: 'Παγκόσμια περιοχή',
    country: 'Χώρα',
    topic: 'Θέμα ή ρεύμα',
    medium: 'Μέσο',
    selfDescription: 'Αυτοπεριγραφή πηγής',
    editorialDescription: 'Συντακτική αξιολόγηση WRN',
    stableId: 'Σταθερό αναγνωριστικό πηγής',
    aliases: 'Άλλες ονομασίες',
    endpointHealth: 'Κατάσταση διεύθυνσης',
    lastSuccess: 'Τελευταίος επιτυχής έλεγχος',
    unchecked: 'Δεν ελέγχθηκε',
    rights: 'Δικαιώματα ανά μέσο',
    rightsCaveat:
      'Οι όροι της πηγής μπορεί να περιέχουν εξαιρέσεις. Κάθε κείμενο, εικόνα και ηχητικό στοιχείο χρειάζεται ξεχωριστό έλεγχο δικαιωμάτων.',
    correctionContact: 'Επίσημη δημόσια επικοινωνία',
    original: 'Άνοιγμα πρωτοτύπου',
    initialsFallback: 'Ουδέτερα αρχικά· δεν αποθηκεύτηκε εγκεκριμένο λογότυπο.',
    unavailable:
      'Τα επιμελημένα προφίλ δεν επαληθεύτηκαν. Η ιστορική και τρέχουσα λίστα παραμένει διαθέσιμη.',
  },
  tr: {
    curatedTitle: 'Seçilmiş etkin kaynaklar',
    curatedIntro:
      'WRN tarafından kontrol edilen kanonik profiller. Öz tanım ve editoryal değerlendirme ayrı gösterilir.',
    completeTitle: 'Tarihsel ve güncel dizin uç noktaları',
    completeIntro:
      'Tarihsel ve güncel dizinlerdeki teknik adresler; hepsi doğrulanmış kaynak profili değildir.',
    region: 'Dünya bölgesi',
    country: 'Ülke',
    topic: 'Konu veya akım',
    medium: 'Medya türü',
    selfDescription: 'Kaynağın öz tanımı',
    editorialDescription: 'WRN editoryal değerlendirmesi',
    stableId: 'Sabit kaynak kimliği',
    aliases: 'Diğer adlar',
    endpointHealth: 'Uç nokta durumu',
    lastSuccess: 'Son başarılı kontrol',
    unchecked: 'Kontrol edilmedi',
    rights: 'Medya türüne göre haklar',
    rightsCaveat:
      'Kaynak koşulları istisnalar içerebilir. Her metin, görsel ve ses içeriği için ayrıca hak denetimi gerekir.',
    correctionContact: 'Resmî açık iletişim',
    original: 'Özgünü aç',
    initialsFallback: 'Tarafsız baş harfler; onaylı logo saklanmadı.',
    unavailable:
      'Seçilmiş profiller doğrulanamadı. Tarihsel ve güncel dizin listesi kullanılabilir.',
  },
};

export const getSourcePassCopy = (language: UiLanguage): SourcePassCopy => values[language];

export type SourcePassTechnicalValue =
  | 'homepage'
  | 'feed'
  | 'healthy'
  | 'degraded'
  | 'inactive'
  | 'unchecked'
  | 'not-applicable'
  | 'metadata'
  | 'text'
  | 'image'
  | 'audio'
  | 'logo'
  | 'allowed'
  | 'link-only'
  | 'unknown'
  | 'prohibited';

const technicalValues: Record<UiLanguage, Readonly<Record<SourcePassTechnicalValue, string>>> = {
  en: {
    homepage: 'Website',
    feed: 'Feed',
    healthy: 'Available',
    degraded: 'Limited',
    inactive: 'Inactive',
    unchecked: 'Not checked',
    'not-applicable': 'Not applicable',
    metadata: 'Metadata',
    text: 'Text',
    image: 'Images',
    audio: 'Audio',
    logo: 'Logo',
    allowed: 'Generally allowed',
    'link-only': 'Link only',
    unknown: 'Not established',
    prohibited: 'Prohibited',
  },
  de: {
    homepage: 'Website',
    feed: 'Feed',
    healthy: 'Erreichbar',
    degraded: 'Eingeschränkt',
    inactive: 'Inaktiv',
    unchecked: 'Nicht geprüft',
    'not-applicable': 'Nicht anwendbar',
    metadata: 'Metadaten',
    text: 'Text',
    image: 'Bilder',
    audio: 'Audio',
    logo: 'Logo',
    allowed: 'Grundsätzlich erlaubt',
    'link-only': 'Nur verlinken',
    unknown: 'Nicht geklärt',
    prohibited: 'Nicht erlaubt',
  },
  es: {
    homepage: 'Sitio web',
    feed: 'Fuente web',
    healthy: 'Disponible',
    degraded: 'Limitado',
    inactive: 'Inactivo',
    unchecked: 'Sin comprobar',
    'not-applicable': 'No aplicable',
    metadata: 'Metadatos',
    text: 'Texto',
    image: 'Imágenes',
    audio: 'Audio',
    logo: 'Logotipo',
    allowed: 'Permitido en general',
    'link-only': 'Solo enlace',
    unknown: 'Sin determinar',
    prohibited: 'Prohibido',
  },
  fr: {
    homepage: 'Site web',
    feed: 'Flux',
    healthy: 'Disponible',
    degraded: 'Limité',
    inactive: 'Inactif',
    unchecked: 'Non vérifié',
    'not-applicable': 'Sans objet',
    metadata: 'Métadonnées',
    text: 'Texte',
    image: 'Images',
    audio: 'Audio',
    logo: 'Logo',
    allowed: 'Autorisé en général',
    'link-only': 'Lien uniquement',
    unknown: 'Non établi',
    prohibited: 'Interdit',
  },
  it: {
    homepage: 'Sito web',
    feed: 'Feed',
    healthy: 'Disponibile',
    degraded: 'Limitato',
    inactive: 'Inattivo',
    unchecked: 'Non controllato',
    'not-applicable': 'Non applicabile',
    metadata: 'Metadati',
    text: 'Testo',
    image: 'Immagini',
    audio: 'Audio',
    logo: 'Logo',
    allowed: 'Generalmente consentito',
    'link-only': 'Solo collegamento',
    unknown: 'Non definito',
    prohibited: 'Vietato',
  },
  pt: {
    homepage: 'Site',
    feed: 'Feed',
    healthy: 'Disponível',
    degraded: 'Limitado',
    inactive: 'Inativo',
    unchecked: 'Não verificado',
    'not-applicable': 'Não aplicável',
    metadata: 'Metadados',
    text: 'Texto',
    image: 'Imagens',
    audio: 'Áudio',
    logo: 'Logótipo',
    allowed: 'Geralmente permitido',
    'link-only': 'Apenas ligação',
    unknown: 'Não estabelecido',
    prohibited: 'Proibido',
  },
  ru: {
    homepage: 'Сайт',
    feed: 'Лента',
    healthy: 'Доступен',
    degraded: 'Ограничен',
    inactive: 'Неактивен',
    unchecked: 'Не проверено',
    'not-applicable': 'Не применимо',
    metadata: 'Метаданные',
    text: 'Текст',
    image: 'Изображения',
    audio: 'Аудио',
    logo: 'Логотип',
    allowed: 'В целом разрешено',
    'link-only': 'Только ссылка',
    unknown: 'Не установлено',
    prohibited: 'Запрещено',
  },
  el: {
    homepage: 'Ιστότοπος',
    feed: 'Ροή',
    healthy: 'Διαθέσιμο',
    degraded: 'Περιορισμένο',
    inactive: 'Ανενεργό',
    unchecked: 'Δεν ελέγχθηκε',
    'not-applicable': 'Δεν εφαρμόζεται',
    metadata: 'Μεταδεδομένα',
    text: 'Κείμενο',
    image: 'Εικόνες',
    audio: 'Ήχος',
    logo: 'Λογότυπο',
    allowed: 'Γενικά επιτρέπεται',
    'link-only': 'Μόνο σύνδεσμος',
    unknown: 'Δεν έχει διαπιστωθεί',
    prohibited: 'Απαγορεύεται',
  },
  tr: {
    homepage: 'Web sitesi',
    feed: 'Akış',
    healthy: 'Erişilebilir',
    degraded: 'Sınırlı',
    inactive: 'Etkin değil',
    unchecked: 'Kontrol edilmedi',
    'not-applicable': 'Uygulanamaz',
    metadata: 'Üst veriler',
    text: 'Metin',
    image: 'Görseller',
    audio: 'Ses',
    logo: 'Logo',
    allowed: 'Genel olarak izinli',
    'link-only': 'Yalnızca bağlantı',
    unknown: 'Belirlenmedi',
    prohibited: 'Yasak',
  },
};

export const getSourcePassTechnicalValue = (
  language: UiLanguage,
  value: SourcePassTechnicalValue,
): string => technicalValues[language][value];
