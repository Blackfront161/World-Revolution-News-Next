import type { UiLanguage } from './index.js';

export type SupportCopy = Readonly<{
  helpTitle: string;
  helpIntro: string;
  solidarityTitle: string;
  solidarityIntro: string;
  search: string;
  region: string;
  location: string;
  topic: string;
  language: string;
  all: string;
  reset: string;
  noResults: string;
  source: string;
  officialWebsite: string;
  officialContact: string;
  reviewOverdue: string;
  reviewDate: string;
  directContactHidden: string;
  globalService: string;
  profileSource: string;
  historicalEntry: string;
  historicalProvenance: string;
  historicalObservedAt: string;
  historicalReachability: string;
  lastChecked: string;
  letterTitle: string;
  letterIntro: string;
  greeting: string;
  body: string;
  closing: string;
  applyTemplate: string;
  download: string;
  print: string;
  discard: string;
  draftWarning: string;
  navigationPrompt: string;
  continueEditing: string;
  discardAndContinue: string;
  exportList: string;
  exportRegion: string;
  chooseExportRegion: string;
  loading: string;
  loadError: string;
  retry: string;
  reloadView: string;
  reloadNote: string;
}>;

const english: SupportCopy = {
  helpTitle: 'Help directory',
  helpIntro:
    'Search happens only in this device. No location, account, or criteria are transmitted.',
  solidarityTitle: 'Solidarity directory',
  solidarityIntro:
    'Historical solidarity entries with source links. This directory does not claim a current detention status.',
  search: 'Search',
  region: 'Region',
  location: 'Place',
  topic: 'Topic',
  language: 'Counselling language',
  all: 'All',
  reset: 'Reset filters',
  noResults: 'No matching entries',
  source: 'Sources',
  officialWebsite: 'Official website',
  officialContact: 'Official contact',
  reviewOverdue: 'Review overdue. Check the official website before acting.',
  reviewDate: 'Next review: {date}',
  directContactHidden: 'Direct contact is hidden until this entry is reviewed again.',
  globalService: 'Worldwide service',
  profileSource: 'Official profile source',
  historicalEntry: 'Historical directory entry',
  historicalProvenance: 'German historical editorial text from the observed legacy snapshot.',
  historicalObservedAt: 'Observed legacy snapshot: {date}',
  historicalReachability: 'Historical reachability: {status}',
  lastChecked: 'Historically checked: {date}',
  letterTitle: 'Letter workshop',
  letterIntro:
    'Your draft stays only while this view is open. Closing or navigating away discards unexported text.',
  greeting: 'Greeting',
  body: 'Letter text',
  closing: 'Closing',
  applyTemplate: 'Use neutral template',
  download: 'Download draft',
  print: 'Print draft',
  discard: 'Discard draft',
  draftWarning: 'The draft contains only your input. No address is included.',
  navigationPrompt: 'Discard this unexported draft?',
  continueEditing: 'Continue editing',
  discardAndContinue: 'Discard and continue',
  exportList: 'Export regional list',
  exportRegion: 'Region for list export',
  chooseExportRegion: 'Choose a region',
  loading: 'Loading local support data…',
  loadError: 'Local support data could not be loaded safely.',
  retry: 'Retry',
  reloadView: 'Reload view',
  reloadNote: 'Reloading this view clears its temporary filters and draft.',
};
const german: SupportCopy = {
  helpTitle: 'Hilfeverzeichnis',
  helpIntro:
    'Die Suche bleibt auf diesem Gerät. Es werden weder Standort, Konto noch Kriterien übertragen.',
  solidarityTitle: 'Solidaritätsverzeichnis',
  solidarityIntro:
    'Historische Solidaritätseinträge mit Quellenlinks. Das Verzeichnis behauptet keinen heutigen Haftstatus.',
  search: 'Suche',
  region: 'Region',
  location: 'Ort',
  topic: 'Thema',
  language: 'Beratungssprache',
  all: 'Alle',
  reset: 'Filter zurücksetzen',
  noResults: 'Keine passenden Einträge',
  source: 'Quellen',
  officialWebsite: 'Offizielle Website',
  officialContact: 'Offizieller Kontakt',
  reviewOverdue: 'Prüffrist überfällig. Bitte vor einer Handlung die offizielle Website prüfen.',
  reviewDate: 'Nächste Prüfung: {date}',
  directContactHidden: 'Direkter Kontakt bleibt bis zur erneuten Prüfung ausgeblendet.',
  globalService: 'Weltweites Angebot',
  profileSource: 'Offizielle Profilquelle',
  historicalEntry: 'Historischer Verzeichniseintrag',
  historicalProvenance: 'Deutscher historischer Redaktionstext aus dem beobachteten Altbestand.',
  historicalObservedAt: 'Beobachteter Altbestand: {date}',
  historicalReachability: 'Historischer Erreichbarkeitsstand: {status}',
  lastChecked: 'Historisch geprüft: {date}',
  letterTitle: 'Briefwerkstatt',
  letterIntro:
    'Der Entwurf bleibt nur während dieser Ansicht. Beim Schließen oder Navigieren geht nicht exportierter Text verloren.',
  greeting: 'Anrede',
  body: 'Brieftext',
  closing: 'Abschluss',
  applyTemplate: 'Neutrale Vorlage verwenden',
  download: 'Entwurf herunterladen',
  print: 'Entwurf drucken',
  discard: 'Entwurf verwerfen',
  draftWarning: 'Der Entwurf enthält nur Ihre Eingabe. Keine Anschrift ist enthalten.',
  navigationPrompt: 'Diesen nicht exportierten Entwurf verwerfen?',
  continueEditing: 'Weiter bearbeiten',
  discardAndContinue: 'Verwerfen und weiter',
  exportList: 'Regionale Liste exportieren',
  exportRegion: 'Region für Listenexport',
  chooseExportRegion: 'Region auswählen',
  loading: 'Lokale Hilfedaten werden geladen…',
  loadError: 'Lokale Hilfedaten konnten nicht sicher geladen werden.',
  retry: 'Erneut versuchen',
  reloadView: 'Ansicht neu laden',
  reloadNote: 'Das Neuladen dieser Ansicht löscht ihre temporären Filter und den Entwurf.',
};
const localized: Readonly<Record<UiLanguage, SupportCopy>> = Object.freeze({
  en: english,
  de: german,
  es: {
    helpTitle: 'Directorio de ayuda',
    helpIntro:
      'La búsqueda permanece en este dispositivo. No se transmiten ubicación, cuenta ni criterios.',
    solidarityTitle: 'Directorio de solidaridad',
    solidarityIntro:
      'Entradas históricas de solidaridad con enlaces a las fuentes. Este directorio no afirma una detención actual.',
    search: 'Buscar',
    region: 'Región',
    location: 'Lugar',
    topic: 'Tema',
    language: 'Idioma de asesoramiento',
    all: 'Todos',
    reset: 'Restablecer filtros',
    noResults: 'No hay entradas coincidentes',
    source: 'Fuentes',
    officialWebsite: 'Sitio web oficial',
    officialContact: 'Contacto oficial',
    reviewOverdue: 'La revisión está vencida. Consulte el sitio web oficial antes de actuar.',
    reviewDate: 'Próxima revisión: {date}',
    directContactHidden: 'El contacto directo queda oculto hasta una nueva revisión.',
    globalService: 'Servicio mundial',
    profileSource: 'Fuente oficial del perfil',
    historicalEntry: 'Entrada histórica del directorio',
    historicalProvenance: 'Texto editorial histórico alemán de la instantánea heredada observada.',
    historicalObservedAt: 'Instantánea heredada observada: {date}',
    historicalReachability: 'Accesibilidad histórica: {status}',
    lastChecked: 'Comprobación histórica: {date}',
    letterTitle: 'Taller de cartas',
    letterIntro:
      'El borrador permanece solo mientras esta vista está abierta. Al cerrar o navegar se pierde el texto no exportado.',
    greeting: 'Saludo',
    body: 'Texto de la carta',
    closing: 'Despedida',
    applyTemplate: 'Usar plantilla neutral',
    download: 'Descargar borrador',
    print: 'Imprimir borrador',
    discard: 'Descartar borrador',
    draftWarning: 'El borrador contiene solo su texto. No incluye ninguna dirección.',
    navigationPrompt: '¿Descartar este borrador no exportado?',
    continueEditing: 'Seguir editando',
    discardAndContinue: 'Descartar y continuar',
    exportList: 'Exportar lista regional',
    exportRegion: 'Región para exportar la lista',
    chooseExportRegion: 'Elija una región',
    loading: 'Cargando datos locales de apoyo…',
    loadError: 'Los datos locales de apoyo no se pudieron cargar de forma segura.',
    retry: 'Reintentar',
    reloadView: 'Recargar vista',
    reloadNote: 'Recargar esta vista borra sus filtros temporales y el borrador.',
  },
  fr: {
    helpTitle: 'Répertoire d’aide',
    helpIntro: 'La recherche reste sur cet appareil. Aucun lieu, compte ou critère n’est transmis.',
    solidarityTitle: 'Répertoire de solidarité',
    solidarityIntro:
      'Entrées historiques de solidarité avec des liens de sources. Ce répertoire ne prétend pas à une détention actuelle.',
    search: 'Rechercher',
    region: 'Région',
    location: 'Lieu',
    topic: 'Thème',
    language: 'Langue de conseil',
    all: 'Tous',
    reset: 'Réinitialiser les filtres',
    noResults: 'Aucune entrée correspondante',
    source: 'Sources',
    officialWebsite: 'Site officiel',
    officialContact: 'Contact officiel',
    reviewOverdue: 'Révision dépassée. Vérifiez le site officiel avant d’agir.',
    reviewDate: 'Prochaine révision : {date}',
    directContactHidden: 'Le contact direct est masqué jusqu’à une nouvelle révision.',
    globalService: 'Service mondial',
    profileSource: 'Source officielle du profil',
    historicalEntry: 'Entrée historique du répertoire',
    historicalProvenance:
      'Texte éditorial historique allemand provenant de l’instantané hérité observé.',
    historicalObservedAt: 'Instantané hérité observé : {date}',
    historicalReachability: 'Accessibilité historique : {status}',
    lastChecked: 'Vérifié historiquement : {date}',
    letterTitle: 'Atelier de lettre',
    letterIntro:
      'Votre brouillon reste seulement tant que cette vue est ouverte. Fermer ou naviguer efface le texte non exporté.',
    greeting: 'Formule d’appel',
    body: 'Texte de la lettre',
    closing: 'Formule de fin',
    applyTemplate: 'Utiliser le modèle neutre',
    download: 'Télécharger le brouillon',
    print: 'Imprimer le brouillon',
    discard: 'Supprimer le brouillon',
    draftWarning: 'Le brouillon contient uniquement votre texte. Aucune adresse n’est incluse.',
    navigationPrompt: 'Supprimer ce brouillon non exporté ?',
    continueEditing: 'Continuer à modifier',
    discardAndContinue: 'Supprimer et continuer',
    exportList: 'Exporter la liste régionale',
    exportRegion: 'Région pour exporter la liste',
    chooseExportRegion: 'Choisissez une région',
    loading: 'Chargement des données locales de soutien…',
    loadError: 'Les données locales de soutien n’ont pas pu être chargées en sécurité.',
    retry: 'Réessayer',
    reloadView: 'Recharger la vue',
    reloadNote: 'Recharger cette vue efface ses filtres temporaires et le brouillon.',
  },
  it: {
    helpTitle: 'Elenco di aiuto',
    helpIntro:
      'La ricerca resta su questo dispositivo. Non vengono trasmessi luogo, account o criteri.',
    solidarityTitle: 'Elenco di solidarietà',
    solidarityIntro:
      'Voci storiche di solidarietà con link alle fonti. Questo elenco non afferma una detenzione attuale.',
    search: 'Cerca',
    region: 'Regione',
    location: 'Luogo',
    topic: 'Argomento',
    language: 'Lingua di consulenza',
    all: 'Tutti',
    reset: 'Reimposta filtri',
    noResults: 'Nessuna voce corrispondente',
    source: 'Fonti',
    officialWebsite: 'Sito ufficiale',
    officialContact: 'Contatto ufficiale',
    reviewOverdue: 'Revisione scaduta. Controlla il sito ufficiale prima di agire.',
    reviewDate: 'Prossima revisione: {date}',
    directContactHidden: 'Il contatto diretto è nascosto fino a una nuova revisione.',
    globalService: 'Servizio mondiale',
    profileSource: 'Fonte ufficiale del profilo',
    historicalEntry: 'Voce storica dell’elenco',
    historicalProvenance: 'Testo editoriale storico tedesco dalla copia storica osservata.',
    historicalObservedAt: 'Copia storica osservata: {date}',
    historicalReachability: 'Raggiungibilità storica: {status}',
    lastChecked: 'Controllato storicamente: {date}',
    letterTitle: 'Laboratorio di lettere',
    letterIntro:
      'La bozza resta solo mentre questa vista è aperta. Chiudere o navigare elimina il testo non esportato.',
    greeting: 'Saluto',
    body: 'Testo della lettera',
    closing: 'Chiusura',
    applyTemplate: 'Usa modello neutro',
    download: 'Scarica bozza',
    print: 'Stampa bozza',
    discard: 'Elimina bozza',
    draftWarning: 'La bozza contiene solo il testo inserito. Non contiene indirizzi.',
    navigationPrompt: 'Eliminare questa bozza non esportata?',
    continueEditing: 'Continua a modificare',
    discardAndContinue: 'Elimina e continua',
    exportList: 'Esporta elenco regionale',
    exportRegion: 'Regione per esportare l’elenco',
    chooseExportRegion: 'Scegli una regione',
    loading: 'Caricamento dei dati locali di supporto…',
    loadError: 'I dati locali di supporto non sono stati caricati in sicurezza.',
    retry: 'Riprova',
    reloadView: 'Ricarica vista',
    reloadNote: 'Ricaricare questa vista cancella i filtri temporanei e la bozza.',
  },
  pt: {
    helpTitle: 'Diretório de ajuda',
    helpIntro:
      'A pesquisa permanece neste dispositivo. Não são transmitidos local, conta ou critérios.',
    solidarityTitle: 'Diretório de solidariedade',
    solidarityIntro:
      'Entradas históricas de solidariedade com ligações às fontes. Este diretório não afirma detenção atual.',
    search: 'Pesquisar',
    region: 'Região',
    location: 'Local',
    topic: 'Tema',
    language: 'Idioma de aconselhamento',
    all: 'Todos',
    reset: 'Repor filtros',
    noResults: 'Sem entradas correspondentes',
    source: 'Fontes',
    officialWebsite: 'Website oficial',
    officialContact: 'Contacto oficial',
    reviewOverdue: 'Revisão em atraso. Consulte o website oficial antes de agir.',
    reviewDate: 'Próxima revisão: {date}',
    directContactHidden: 'O contacto direto fica oculto até nova revisão.',
    globalService: 'Serviço mundial',
    profileSource: 'Fonte oficial do perfil',
    historicalEntry: 'Entrada histórica do diretório',
    historicalProvenance: 'Texto editorial histórico em alemão da captura antiga observada.',
    historicalObservedAt: 'Captura antiga observada: {date}',
    historicalReachability: 'Acessibilidade histórica: {status}',
    lastChecked: 'Verificado historicamente: {date}',
    letterTitle: 'Oficina de cartas',
    letterIntro:
      'O rascunho fica apenas enquanto esta vista está aberta. Fechar ou navegar elimina texto não exportado.',
    greeting: 'Saudação',
    body: 'Texto da carta',
    closing: 'Despedida',
    applyTemplate: 'Usar modelo neutro',
    download: 'Descarregar rascunho',
    print: 'Imprimir rascunho',
    discard: 'Descartar rascunho',
    draftWarning: 'O rascunho contém apenas o seu texto. Não inclui endereço.',
    navigationPrompt: 'Descartar este rascunho não exportado?',
    continueEditing: 'Continuar a editar',
    discardAndContinue: 'Descartar e continuar',
    exportList: 'Exportar lista regional',
    exportRegion: 'Região para exportar a lista',
    chooseExportRegion: 'Escolha uma região',
    loading: 'A carregar dados locais de apoio…',
    loadError: 'Não foi possível carregar com segurança os dados locais de apoio.',
    retry: 'Tentar novamente',
    reloadView: 'Recarregar vista',
    reloadNote: 'Recarregar esta vista limpa os filtros temporários e o rascunho.',
  },
  ru: {
    helpTitle: 'Каталог помощи',
    helpIntro:
      'Поиск выполняется только на этом устройстве. Местоположение, учётная запись и критерии не передаются.',
    solidarityTitle: 'Каталог солидарности',
    solidarityIntro:
      'Исторические записи солидарности со ссылками на источники. Каталог не утверждает текущий статус заключения.',
    search: 'Поиск',
    region: 'Регион',
    location: 'Место',
    topic: 'Тема',
    language: 'Язык консультации',
    all: 'Все',
    reset: 'Сбросить фильтры',
    noResults: 'Подходящих записей нет',
    source: 'Источники',
    officialWebsite: 'Официальный сайт',
    officialContact: 'Официальный контакт',
    reviewOverdue: 'Срок проверки истёк. Перед действием проверьте официальный сайт.',
    reviewDate: 'Следующая проверка: {date}',
    directContactHidden: 'Прямой контакт скрыт до повторной проверки.',
    globalService: 'Всемирная служба',
    profileSource: 'Официальный источник профиля',
    historicalEntry: 'Историческая запись каталога',
    historicalProvenance:
      'Немецкий исторический редакционный текст из наблюдаемого старого снимка.',
    historicalObservedAt: 'Наблюдаемый старый снимок: {date}',
    historicalReachability: 'Историческая доступность: {status}',
    lastChecked: 'Историческая проверка: {date}',
    letterTitle: 'Мастерская писем',
    letterIntro:
      'Черновик хранится только пока открыт этот экран. При закрытии или навигации неэкспортированный текст теряется.',
    greeting: 'Приветствие',
    body: 'Текст письма',
    closing: 'Завершение',
    applyTemplate: 'Использовать нейтральный шаблон',
    download: 'Скачать черновик',
    print: 'Печать черновика',
    discard: 'Удалить черновик',
    draftWarning: 'Черновик содержит только введённый вами текст. Адрес не включён.',
    navigationPrompt: 'Удалить этот неэкспортированный черновик?',
    continueEditing: 'Продолжить редактирование',
    discardAndContinue: 'Удалить и продолжить',
    exportList: 'Экспортировать региональный список',
    exportRegion: 'Регион для экспорта списка',
    chooseExportRegion: 'Выберите регион',
    loading: 'Загрузка локальных данных поддержки…',
    loadError: 'Локальные данные поддержки не удалось безопасно загрузить.',
    retry: 'Повторить',
    reloadView: 'Перезагрузить экран',
    reloadNote: 'Перезагрузка этого экрана очищает временные фильтры и черновик.',
  },
  el: {
    helpTitle: 'Κατάλογος βοήθειας',
    helpIntro:
      'Η αναζήτηση παραμένει σε αυτή τη συσκευή. Δεν μεταδίδονται τοποθεσία, λογαριασμός ή κριτήρια.',
    solidarityTitle: 'Κατάλογος αλληλεγγύης',
    solidarityIntro:
      'Ιστορικές καταχωρίσεις αλληλεγγύης με συνδέσμους πηγών. Ο κατάλογος δεν ισχυρίζεται τρέχουσα κράτηση.',
    search: 'Αναζήτηση',
    region: 'Περιοχή',
    location: 'Τόπος',
    topic: 'Θέμα',
    language: 'Γλώσσα συμβουλευτικής',
    all: 'Όλα',
    reset: 'Επαναφορά φίλτρων',
    noResults: 'Δεν υπάρχουν αντίστοιχες καταχωρίσεις',
    source: 'Πηγές',
    officialWebsite: 'Επίσημη ιστοσελίδα',
    officialContact: 'Επίσημη επικοινωνία',
    reviewOverdue: 'Η επανεξέταση έχει λήξει. Ελέγξτε την επίσημη ιστοσελίδα πριν ενεργήσετε.',
    reviewDate: 'Επόμενη επανεξέταση: {date}',
    directContactHidden: 'Η άμεση επικοινωνία είναι κρυφή μέχρι νέα επανεξέταση.',
    globalService: 'Παγκόσμια υπηρεσία',
    profileSource: 'Επίσημη πηγή προφίλ',
    historicalEntry: 'Ιστορική καταχώριση καταλόγου',
    historicalProvenance:
      'Γερμανικό ιστορικό συντακτικό κείμενο από το παρατηρημένο παλαιό στιγμιότυπο.',
    historicalObservedAt: 'Παρατηρημένο παλαιό στιγμιότυπο: {date}',
    historicalReachability: 'Ιστορική προσβασιμότητα: {status}',
    lastChecked: 'Ιστορικός έλεγχος: {date}',
    letterTitle: 'Εργαστήριο επιστολής',
    letterIntro:
      'Το πρόχειρο παραμένει μόνο όσο αυτή η προβολή είναι ανοιχτή. Το κλείσιμο ή η πλοήγηση χάνει το μη εξαγμένο κείμενο.',
    greeting: 'Χαιρετισμός',
    body: 'Κείμενο επιστολής',
    closing: 'Κλείσιμο',
    applyTemplate: 'Χρήση ουδέτερου προτύπου',
    download: 'Λήψη προχείρου',
    print: 'Εκτύπωση προχείρου',
    discard: 'Απόρριψη προχείρου',
    draftWarning: 'Το πρόχειρο περιέχει μόνο το δικό σας κείμενο. Δεν περιλαμβάνεται διεύθυνση.',
    navigationPrompt: 'Απόρριψη αυτού του μη εξαγμένου προχείρου;',
    continueEditing: 'Συνέχεια επεξεργασίας',
    discardAndContinue: 'Απόρριψη και συνέχεια',
    exportList: 'Εξαγωγή περιφερειακής λίστας',
    exportRegion: 'Περιοχή για εξαγωγή λίστας',
    chooseExportRegion: 'Επιλέξτε περιοχή',
    loading: 'Φόρτωση τοπικών δεδομένων υποστήριξης…',
    loadError: 'Δεν ήταν δυνατή η ασφαλής φόρτωση τοπικών δεδομένων υποστήριξης.',
    retry: 'Δοκιμή ξανά',
    reloadView: 'Επαναφόρτωση προβολής',
    reloadNote: 'Η επαναφόρτωση αυτής της προβολής διαγράφει τα προσωρινά φίλτρα και το πρόχειρο.',
  },
  tr: {
    helpTitle: 'Yardım dizini',
    helpIntro: 'Arama bu cihazda kalır. Konum, hesap veya ölçütler iletilmez.',
    solidarityTitle: 'Dayanışma dizini',
    solidarityIntro:
      'Kaynak bağlantıları içeren tarihsel dayanışma kayıtları. Bu dizin güncel tutukluluk durumu iddia etmez.',
    search: 'Ara',
    region: 'Bölge',
    location: 'Yer',
    topic: 'Konu',
    language: 'Danışmanlık dili',
    all: 'Tümü',
    reset: 'Filtreleri sıfırla',
    noResults: 'Eşleşen kayıt yok',
    source: 'Kaynaklar',
    officialWebsite: 'Resmî web sitesi',
    officialContact: 'Resmî iletişim',
    reviewOverdue: 'İnceleme süresi geçti. Hareket etmeden önce resmî web sitesini kontrol edin.',
    reviewDate: 'Sonraki inceleme: {date}',
    directContactHidden: 'Doğrudan iletişim yeni incelemeye kadar gizlidir.',
    globalService: 'Dünya çapında hizmet',
    profileSource: 'Resmî profil kaynağı',
    historicalEntry: 'Tarihsel dizin kaydı',
    historicalProvenance: 'Gözlemlenen eski anlık görüntüden Almanca tarihsel editoryal metin.',
    historicalObservedAt: 'Gözlemlenen eski anlık görüntü: {date}',
    historicalReachability: 'Tarihsel erişilebilirlik: {status}',
    lastChecked: 'Tarihsel kontrol: {date}',
    letterTitle: 'Mektup atölyesi',
    letterIntro:
      'Taslak yalnızca bu görünüm açıkken kalır. Kapatmak veya gezinmek dışa aktarılmamış metni kaybettirir.',
    greeting: 'Hitap',
    body: 'Mektup metni',
    closing: 'Kapanış',
    applyTemplate: 'Tarafsız şablonu kullan',
    download: 'Taslağı indir',
    print: 'Taslağı yazdır',
    discard: 'Taslağı sil',
    draftWarning: 'Taslak yalnızca girdiğiniz metni içerir. Adres içermez.',
    navigationPrompt: 'Bu dışa aktarılmamış taslak silinsin mi?',
    continueEditing: 'Düzenlemeye devam et',
    discardAndContinue: 'Sil ve devam et',
    exportList: 'Bölgesel listeyi dışa aktar',
    exportRegion: 'Liste dışa aktarımı için bölge',
    chooseExportRegion: 'Bir bölge seçin',
    loading: 'Yerel destek verileri yükleniyor…',
    loadError: 'Yerel destek verileri güvenle yüklenemedi.',
    retry: 'Yeniden dene',
    reloadView: 'Görünümü yeniden yükle',
    reloadNote: 'Bu görünümü yeniden yüklemek geçici filtreleri ve taslağı temizler.',
  },
});
export function getSupportCopy(language: UiLanguage): SupportCopy {
  return localized[language];
}

export type WebsiteSupportCopy = SupportCopy &
  Readonly<{
    localDirectory: string;
    historicalSources: string;
    allRegions: string;
    results: string;
    sourcesAndLimits: string;
    contactUnavailable: string;
    historicalSnapshot: string;
    historicalDescriptionHidden: string;
    historicalVerification: string;
    review: string;
    letterPrivacy: string;
    discardQuestion: string;
    libraryResults: string;
  }>;

const websiteLocalized: Readonly<Record<UiLanguage, WebsiteSupportCopy>> = Object.freeze({
  en: {
    ...localized.en,
    localDirectory: 'Local directory',
    historicalSources: 'Historical sources',
    allRegions: 'All regions',
    results: 'results',
    sourcesAndLimits: 'Sources and limits',
    contactUnavailable: 'Direct contact is unavailable because its review has expired.',
    historicalSnapshot:
      'Historical directory snapshot: profiles are not current contact claims. Check the cited source before acting.',
    historicalDescriptionHidden:
      'The historical profile is pending review and its description is hidden.',
    historicalVerification: 'Historical verification',
    review: 'Review',
    letterPrivacy:
      'Your draft stays in this browser. Printing or download is your explicit action; no message is sent.',
    discardQuestion: 'Discard this local draft?',
    libraryResults: 'Library results',
  },
  de: {
    ...localized.de,
    localDirectory: 'Lokales Verzeichnis',
    historicalSources: 'Historische Quellen',
    allRegions: 'Alle Regionen',
    results: 'Ergebnisse',
    sourcesAndLimits: 'Quellen und Grenzen',
    contactUnavailable:
      'Der direkte Kontakt ist nicht verfügbar, weil seine Prüfung abgelaufen ist.',
    historicalSnapshot:
      'Historische Verzeichnismomentaufnahme: Profile sind keine aktuellen Kontaktbehauptungen. Prüfen Sie die zitierte Quelle, bevor Sie handeln.',
    historicalDescriptionHidden:
      'Das historische Profil wartet auf Prüfung; seine Beschreibung ist ausgeblendet.',
    historicalVerification: 'Historische Prüfung',
    review: 'Prüfung',
    letterPrivacy:
      'Ihr Entwurf bleibt in diesem Browser. Drucken oder Download ist Ihre ausdrückliche Aktion; keine Nachricht wird gesendet.',
    discardQuestion: 'Diesen lokalen Entwurf verwerfen?',
    libraryResults: 'Bibliotheksergebnisse',
  },
  es: {
    ...localized.es,
    localDirectory: 'Directorio local',
    historicalSources: 'Fuentes históricas',
    allRegions: 'Todas las regiones',
    results: 'resultados',
    sourcesAndLimits: 'Fuentes y límites',
    contactUnavailable: 'El contacto directo no está disponible porque su revisión ha vencido.',
    historicalSnapshot:
      'Instantánea histórica del directorio: los perfiles no son afirmaciones de contacto actuales. Consulte la fuente citada antes de actuar.',
    historicalDescriptionHidden:
      'El perfil histórico está pendiente de revisión y su descripción está oculta.',
    historicalVerification: 'Verificación histórica',
    review: 'Revisión',
    letterPrivacy:
      'Su borrador permanece en este navegador. Imprimir o descargar es su acción explícita; no se envía ningún mensaje.',
    discardQuestion: '¿Descartar este borrador local?',
    libraryResults: 'Resultados de la biblioteca',
  },
  fr: {
    ...localized.fr,
    localDirectory: 'Répertoire local',
    historicalSources: 'Sources historiques',
    allRegions: 'Toutes les régions',
    results: 'résultats',
    sourcesAndLimits: 'Sources et limites',
    contactUnavailable: 'Le contact direct n’est pas disponible car sa révision a expiré.',
    historicalSnapshot:
      'Instantané historique du répertoire : les profils ne sont pas des affirmations de contact actuelles. Vérifiez la source citée avant d’agir.',
    historicalDescriptionHidden:
      'Le profil historique attend une révision et sa description est masquée.',
    historicalVerification: 'Vérification historique',
    review: 'Révision',
    letterPrivacy:
      'Votre brouillon reste dans ce navigateur. Imprimer ou télécharger est votre action explicite ; aucun message n’est envoyé.',
    discardQuestion: 'Supprimer ce brouillon local ?',
    libraryResults: 'Résultats de la bibliothèque',
  },
  it: {
    ...localized.it,
    localDirectory: 'Elenco locale',
    historicalSources: 'Fonti storiche',
    allRegions: 'Tutte le regioni',
    results: 'risultati',
    sourcesAndLimits: 'Fonti e limiti',
    contactUnavailable: 'Il contatto diretto non è disponibile perché la sua revisione è scaduta.',
    historicalSnapshot:
      'Istante storico dell’elenco: i profili non sono affermazioni di contatto attuali. Controlla la fonte citata prima di agire.',
    historicalDescriptionHidden:
      'Il profilo storico è in attesa di revisione e la descrizione è nascosta.',
    historicalVerification: 'Verifica storica',
    review: 'Revisione',
    letterPrivacy:
      'La bozza resta in questo browser. Stampare o scaricare è una tua azione esplicita; nessun messaggio viene inviato.',
    discardQuestion: 'Eliminare questa bozza locale?',
    libraryResults: 'Risultati della biblioteca',
  },
  pt: {
    ...localized.pt,
    localDirectory: 'Diretório local',
    historicalSources: 'Fontes históricas',
    allRegions: 'Todas as regiões',
    results: 'resultados',
    sourcesAndLimits: 'Fontes e limites',
    contactUnavailable: 'O contacto direto não está disponível porque a revisão expirou.',
    historicalSnapshot:
      'Captura histórica do diretório: os perfis não são afirmações de contacto atuais. Verifique a fonte citada antes de agir.',
    historicalDescriptionHidden: 'O perfil histórico aguarda revisão e a descrição está oculta.',
    historicalVerification: 'Verificação histórica',
    review: 'Revisão',
    letterPrivacy:
      'O rascunho fica neste navegador. Imprimir ou descarregar é uma ação explícita sua; nenhuma mensagem é enviada.',
    discardQuestion: 'Descartar este rascunho local?',
    libraryResults: 'Resultados da biblioteca',
  },
  ru: {
    ...localized.ru,
    localDirectory: 'Локальный каталог',
    historicalSources: 'Исторические источники',
    allRegions: 'Все регионы',
    results: 'результатов',
    sourcesAndLimits: 'Источники и ограничения',
    contactUnavailable: 'Прямой контакт недоступен, потому что срок проверки истёк.',
    historicalSnapshot:
      'Исторический снимок каталога: профили не являются текущими контактными утверждениями. Проверьте указанную источник перед действием.',
    historicalDescriptionHidden: 'Исторический профиль ожидает проверки, и его описание скрыто.',
    historicalVerification: 'Историческая проверка',
    review: 'Проверка',
    letterPrivacy:
      'Черновик остаётся в этом браузере. Печать или скачивание — ваше явное действие; сообщение не отправляется.',
    discardQuestion: 'Удалить этот локальный черновик?',
    libraryResults: 'Результаты библиотеки',
  },
  el: {
    ...localized.el,
    localDirectory: 'Τοπικός κατάλογος',
    historicalSources: 'Ιστορικές πηγές',
    allRegions: 'Όλες οι περιοχές',
    results: 'αποτελέσματα',
    sourcesAndLimits: 'Πηγές και όρια',
    contactUnavailable: 'Η άμεση επικοινωνία δεν είναι διαθέσιμη επειδή η επανεξέταση έληξε.',
    historicalSnapshot:
      'Ιστορικό στιγμιότυπο καταλόγου: τα προφίλ δεν αποτελούν τρέχοντες ισχυρισμούς επικοινωνίας. Ελέγξτε την αναφερόμενη πηγή πριν ενεργήσετε.',
    historicalDescriptionHidden:
      'Το ιστορικό προφίλ αναμένει επανεξέταση και η περιγραφή του είναι κρυφή.',
    historicalVerification: 'Ιστορική επαλήθευση',
    review: 'Επανεξέταση',
    letterPrivacy:
      'Το πρόχειρο παραμένει σε αυτό το πρόγραμμα περιήγησης. Η εκτύπωση ή η λήψη είναι ρητή ενέργειά σας· δεν στέλνεται μήνυμα.',
    discardQuestion: 'Απόρριψη αυτού του τοπικού προχείρου;',
    libraryResults: 'Αποτελέσματα βιβλιοθήκης',
  },
  tr: {
    ...localized.tr,
    localDirectory: 'Yerel dizin',
    historicalSources: 'Tarihsel kaynaklar',
    allRegions: 'Tüm bölgeler',
    results: 'sonuç',
    sourcesAndLimits: 'Kaynaklar ve sınırlar',
    contactUnavailable: 'Doğrudan iletişim, inceleme süresi geçtiği için kullanılamıyor.',
    historicalSnapshot:
      'Tarihsel dizin anlık görüntüsü: profiller güncel iletişim iddiaları değildir. Harekete geçmeden önce belirtilen kaynağı kontrol edin.',
    historicalDescriptionHidden: 'Tarihsel profil inceleme bekliyor ve açıklaması gizleniyor.',
    historicalVerification: 'Tarihsel doğrulama',
    review: 'İnceleme',
    letterPrivacy:
      'Taslak bu tarayıcıda kalır. Yazdırma veya indirme sizin açık eyleminizdir; mesaj gönderilmez.',
    discardQuestion: 'Bu yerel taslak silinsin mi?',
    libraryResults: 'Kütüphane sonuçları',
  },
});

export function getWebsiteSupportCopy(language: UiLanguage): WebsiteSupportCopy {
  return websiteLocalized[language];
}

const reachabilityCopy: Readonly<Record<UiLanguage, readonly [string, string, string]>> = {
  en: ['reachable', 'limited', 'unknown'],
  de: ['erreichbar', 'eingeschränkt', 'unbekannt'],
  es: ['accesible', 'limitada', 'desconocida'],
  fr: ['accessible', 'limitée', 'inconnue'],
  it: ['raggiungibile', 'limitata', 'sconosciuta'],
  pt: ['acessível', 'limitada', 'desconhecida'],
  ru: ['доступна', 'ограничена', 'неизвестна'],
  el: ['διαθέσιμη', 'περιορισμένη', 'άγνωστη'],
  tr: ['erişilebilir', 'sınırlı', 'bilinmiyor'],
};
export function getSupportReachabilityCopy(
  language: UiLanguage,
  status: 'reachable' | 'limited' | 'unknown',
) {
  return reachabilityCopy[language][status === 'reachable' ? 0 : status === 'limited' ? 1 : 2];
}
