import type { UiLanguage } from './index.js';

const en = {
  intro:
    'Selected articles with verified sources and reuse evidence. More reports are available in the news directory.',
  full: 'Full text',
  partial: 'Excerpt',
  license: 'License',
  transformation: 'Text version',
  original: 'Original',
  transformed: 'Adapted',
  reference: 'Reference',
  unavailable: 'This article is unavailable or has been withdrawn.',
  needsCheck: 'Check for content to read articles. Saved entries remain on this device.',
  updateFailed:
    'The update failed. Previously checked articles remain readable while their validation is still valid.',
  capacity: 'Reading storage is full. Existing entries remain unchanged.',
  offlineReady: 'Articles are stored for offline reading.',
  clearQuestion: 'Remove downloaded articles? Saved entries remain on this device.',
  savePosition: 'Save reading position',
  positionSaved: 'Reading position saved.',
} as const;
export type ProductionContentCopy = Readonly<Record<keyof typeof en, string>>;
const entries: Readonly<Record<UiLanguage, ProductionContentCopy>> = {
  en,
  de: {
    intro:
      'Ausgewählte Artikel mit geprüften Quellen und Nutzungsbelegen. Weitere Meldungen findest du im Nachrichtenverzeichnis.',
    full: 'Volltext',
    partial: 'Auszug',
    license: 'Lizenz',
    transformation: 'Textfassung',
    original: 'Original',
    transformed: 'Bearbeitet',
    reference: 'Beleg',
    unavailable: 'Dieser Artikel ist nicht verfügbar oder wurde zurückgezogen.',
    needsCheck:
      'Prüfe auf neue Inhalte, um Artikel zu lesen. Gespeicherte Einträge bleiben auf diesem Gerät.',
    updateFailed:
      'Die Aktualisierung ist fehlgeschlagen. Bereits geprüfte Artikel bleiben innerhalb ihrer Gültigkeitsdauer lesbar.',
    capacity: 'Der Lesespeicher ist voll. Vorhandene Einträge bleiben unverändert.',
    offlineReady: 'Artikel sind zum Offline-Lesen gespeichert.',
    clearQuestion:
      'Heruntergeladene Artikel entfernen? Gespeicherte Einträge bleiben auf diesem Gerät.',
    savePosition: 'Leseposition speichern',
    positionSaved: 'Leseposition gespeichert.',
  },
  es: {
    intro:
      'Artículos seleccionados con fuentes y permisos de reutilización comprobados. Hay más noticias en el directorio.',
    full: 'Texto completo',
    partial: 'Extracto',
    license: 'Licencia',
    transformation: 'Versión del texto',
    original: 'Original',
    transformed: 'Adaptado',
    reference: 'Referencia',
    unavailable: 'Este artículo no está disponible o se ha retirado.',
    needsCheck:
      'Busca contenido para leer artículos. Las entradas guardadas permanecen en este dispositivo.',
    updateFailed:
      'La actualización falló. Los artículos comprobados siguen disponibles mientras su validación siga vigente.',
    capacity: 'El almacenamiento de lectura está lleno. Las entradas existentes no cambian.',
    offlineReady: 'Artículos guardados para leer sin conexión.',
    clearQuestion:
      '¿Eliminar los artículos descargados? Las entradas guardadas permanecen en este dispositivo.',
    savePosition: 'Guardar posición de lectura',
    positionSaved: 'Posición de lectura guardada.',
  },
  fr: {
    intro:
      'Articles sélectionnés avec sources et droits de réutilisation vérifiés. Retrouvez davantage de nouvelles dans le répertoire.',
    full: 'Texte intégral',
    partial: 'Extrait',
    license: 'Licence',
    transformation: 'Version du texte',
    original: 'Original',
    transformed: 'Adapté',
    reference: 'Référence',
    unavailable: 'Cet article est indisponible ou a été retiré.',
    needsCheck:
      'Recherchez du contenu pour lire les articles. Les entrées enregistrées restent sur cet appareil.',
    updateFailed:
      'La mise à jour a échoué. Les articles vérifiés restent lisibles pendant leur période de validité.',
    capacity: 'Le stockage de lecture est plein. Les entrées existantes restent inchangées.',
    offlineReady: 'Articles enregistrés pour une lecture hors ligne.',
    clearQuestion:
      'Supprimer les articles téléchargés ? Les entrées enregistrées restent sur cet appareil.',
    savePosition: 'Enregistrer la position de lecture',
    positionSaved: 'Position de lecture enregistrée.',
  },
  it: {
    intro:
      'Articoli selezionati con fonti e autorizzazioni al riutilizzo verificate. Altre notizie sono disponibili nella directory.',
    full: 'Testo completo',
    partial: 'Estratto',
    license: 'Licenza',
    transformation: 'Versione del testo',
    original: 'Originale',
    transformed: 'Adattato',
    reference: 'Riferimento',
    unavailable: 'Questo articolo non è disponibile o è stato ritirato.',
    needsCheck:
      'Cerca contenuti per leggere gli articoli. Le voci salvate restano su questo dispositivo.',
    updateFailed:
      'Aggiornamento non riuscito. Gli articoli verificati restano leggibili durante il loro periodo di validità.',
    capacity: 'Lo spazio di lettura è pieno. Le voci esistenti restano invariate.',
    offlineReady: 'Articoli salvati per la lettura offline.',
    clearQuestion:
      'Rimuovere gli articoli scaricati? Le voci salvate restano su questo dispositivo.',
    savePosition: 'Salva posizione di lettura',
    positionSaved: 'Posizione di lettura salvata.',
  },
  pt: {
    intro:
      'Artigos selecionados com fontes e permissões de reutilização verificadas. Há mais notícias no diretório.',
    full: 'Texto completo',
    partial: 'Excerto',
    license: 'Licença',
    transformation: 'Versão do texto',
    original: 'Original',
    transformed: 'Adaptado',
    reference: 'Referência',
    unavailable: 'Este artigo não está disponível ou foi retirado.',
    needsCheck:
      'Procure conteúdo para ler artigos. As entradas guardadas permanecem neste dispositivo.',
    updateFailed:
      'A atualização falhou. Os artigos verificados continuam disponíveis durante o seu período de validade.',
    capacity:
      'O armazenamento de leitura está cheio. As entradas existentes permanecem inalteradas.',
    offlineReady: 'Artigos guardados para leitura offline.',
    clearQuestion:
      'Remover os artigos descarregados? As entradas guardadas permanecem neste dispositivo.',
    savePosition: 'Guardar posição de leitura',
    positionSaved: 'Posição de leitura guardada.',
  },
  ru: {
    intro:
      'Избранные статьи с проверенными источниками и основаниями для повторного использования. Другие новости доступны в каталоге.',
    full: 'Полный текст',
    partial: 'Отрывок',
    license: 'Лицензия',
    transformation: 'Версия текста',
    original: 'Оригинал',
    transformed: 'Адаптация',
    reference: 'Основание',
    unavailable: 'Эта статья недоступна или отозвана.',
    needsCheck:
      'Проверьте наличие материалов для чтения. Сохранённые записи остаются на этом устройстве.',
    updateFailed:
      'Обновление не удалось. Проверенные статьи доступны в течение срока действия проверки.',
    capacity: 'Хранилище чтения заполнено. Существующие записи остаются без изменений.',
    offlineReady: 'Статьи сохранены для чтения без интернета.',
    clearQuestion: 'Удалить загруженные статьи? Сохранённые записи останутся на этом устройстве.',
    savePosition: 'Сохранить позицию чтения',
    positionSaved: 'Позиция чтения сохранена.',
  },
  el: {
    intro:
      'Επιλεγμένα άρθρα με ελεγμένες πηγές και τεκμήρια άδειας επαναχρησιμοποίησης. Περισσότερες ειδήσεις στον κατάλογο.',
    full: 'Πλήρες κείμενο',
    partial: 'Απόσπασμα',
    license: 'Άδεια',
    transformation: 'Έκδοση κειμένου',
    original: 'Πρωτότυπο',
    transformed: 'Προσαρμογή',
    reference: 'Τεκμήριο',
    unavailable: 'Το άρθρο δεν είναι διαθέσιμο ή έχει αποσυρθεί.',
    needsCheck:
      'Ελέγξτε για περιεχόμενο ώστε να διαβάσετε άρθρα. Οι αποθηκευμένες εγγραφές παραμένουν στη συσκευή.',
    updateFailed:
      'Η ενημέρωση απέτυχε. Τα ελεγμένα άρθρα παραμένουν διαθέσιμα όσο ισχύει ο έλεγχός τους.',
    capacity: 'Ο χώρος ανάγνωσης είναι πλήρης. Οι υπάρχουσες εγγραφές δεν αλλάζουν.',
    offlineReady: 'Τα άρθρα αποθηκεύτηκαν για ανάγνωση εκτός σύνδεσης.',
    clearQuestion:
      'Αφαίρεση των ληφθέντων άρθρων; Οι αποθηκευμένες εγγραφές παραμένουν στη συσκευή.',
    savePosition: 'Αποθήκευση θέσης ανάγνωσης',
    positionSaved: 'Η θέση ανάγνωσης αποθηκεύτηκε.',
  },
  tr: {
    intro:
      'Kaynakları ve yeniden kullanım izinleri doğrulanmış seçili makaleler. Diğer haberler haber dizininde bulunur.',
    full: 'Tam metin',
    partial: 'Alıntı',
    license: 'Lisans',
    transformation: 'Metin sürümü',
    original: 'Özgün',
    transformed: 'Uyarlanmış',
    reference: 'Dayanak',
    unavailable: 'Bu makale kullanılamıyor veya geri çekildi.',
    needsCheck:
      'Makaleleri okumak için içeriği kontrol edin. Kaydedilen girdiler bu cihazda kalır.',
    updateFailed:
      'Güncelleme başarısız oldu. Doğrulanan makaleler geçerlilik süresi boyunca okunabilir.',
    capacity: 'Okuma depolama alanı dolu. Mevcut girdiler değişmeden kalır.',
    offlineReady: 'Makaleler çevrimdışı okuma için kaydedildi.',
    clearQuestion: 'İndirilen makaleler kaldırılsın mı? Kaydedilen girdiler bu cihazda kalır.',
    savePosition: 'Okuma konumunu kaydet',
    positionSaved: 'Okuma konumu kaydedildi.',
  },
};
for (const copy of Object.values(entries)) Object.freeze(copy);
Object.freeze(entries);
export function getProductionContentCopy(language: UiLanguage): ProductionContentCopy {
  return entries[language];
}

const productionActivityEnglish = {
  heading: 'Since your last visit',
  explanation: 'Remember visits to “For me” and article versions on this device only.',
  enable: 'Enable local overview',
  firstVisit: 'Your starting point is saved. Future visits can show new matching articles.',
  count: 'New matching articles: {count}',
  none: 'No new matching articles since your last visit.',
  newBadge: 'New since your last visit',
  changed: 'The article version has changed.',
  acknowledge: 'Mark this version as seen',
  reset: 'Disable and clear overview',
  resetQuestion:
    'Clear the local visit and version overview? Saved articles, reading positions and source choices stay unchanged.',
  localNotifications: 'Local notifications',
  enableNotifications: 'Enable notifications',
  disableNotifications: 'Turn notifications off',
  foregroundOnly:
    'New items are detected while this view is open. Background delivery is not set up on this device.',
  notificationsUnsupported:
    'Notifications are unavailable in this browser or app. The local overview remains available.',
  permissionDenied: 'Notifications were not permitted. The local overview remains available.',
  unavailable:
    'The local overview could not be saved or loaded. Existing data stays protected. Reopen the view to retry.',
  stored: 'Saved on this device.',
  quietStart: 'Quiet hours start',
  quietEnd: 'Quiet hours end',
  saveHours: 'Save quiet hours',
  quietNote:
    'Uses this device’s local time. Equal start and end times silence notifications all day.',
  notificationTitle: 'World Revolution News',
  notificationBody: 'New items are available in your local overview.',
  selectFirst: 'Choose topics, regions, languages or sources under “For me” to use this overview.',
};
export type ProductionActivityCopy = Readonly<
  Record<keyof typeof productionActivityEnglish, string>
>;
const productionActivityEntries: Readonly<Record<UiLanguage, ProductionActivityCopy>> = {
  en: productionActivityEnglish,
  de: {
    heading: 'Seit deinem letzten Besuch',
    explanation:
      'Merkt Besuche in „Für mich“ und Artikelfassungen ausschließlich auf diesem Gerät.',
    enable: 'Lokale Übersicht aktivieren',
    firstVisit:
      'Dein Ausgangsstand ist gespeichert. Beim nächsten Besuch können neue passende Artikel erscheinen.',
    count: 'Neue passende Artikel: {count}',
    none: 'Keine neuen passenden Artikel seit deinem letzten Besuch.',
    newBadge: 'Neu seit deinem letzten Besuch',
    changed: 'Die Artikelfassung hat sich geändert.',
    acknowledge: 'Diese Fassung als gesehen markieren',
    reset: 'Übersicht deaktivieren und löschen',
    resetQuestion:
      'Lokale Besuchs- und Versionsübersicht löschen? Gespeicherte Artikel, Lesepositionen und Quellenwahl bleiben erhalten.',
    localNotifications: 'Lokale Benachrichtigungen',
    enableNotifications: 'Benachrichtigungen aktivieren',
    disableNotifications: 'Benachrichtigungen ausschalten',
    foregroundOnly:
      'Neue Einträge werden bei geöffneter Ansicht erkannt. Eine Hintergrundzustellung ist auf diesem Gerät nicht eingerichtet.',
    notificationsUnsupported:
      'Benachrichtigungen sind in diesem Browser oder dieser App nicht verfügbar. Die lokale Übersicht bleibt verfügbar.',
    permissionDenied:
      'Benachrichtigungen wurden nicht erlaubt. Die lokale Übersicht bleibt verfügbar.',
    unavailable:
      'Die lokale Übersicht konnte nicht gespeichert oder geladen werden. Vorhandene Daten bleiben geschützt. Öffne die Ansicht erneut.',
    stored: 'Auf diesem Gerät gespeichert.',
    quietStart: 'Ruhezeit beginnt',
    quietEnd: 'Ruhezeit endet',
    saveHours: 'Ruhezeiten speichern',
    quietNote:
      'Es gilt die Ortszeit dieses Geräts. Gleicher Beginn und gleiches Ende schalten Hinweise ganztägig stumm.',
    notificationTitle: 'World Revolution News',
    notificationBody: 'Neue Einträge sind in deiner lokalen Übersicht verfügbar.',
    selectFirst:
      'Wähle unter „Für mich“ Themen, Regionen, Sprachen oder Quellen für diese Übersicht.',
  },
  es: {
    heading: 'Desde tu última visita',
    explanation:
      'Recuerda las visitas a «Para mí» y las versiones de artículos solo en este dispositivo.',
    enable: 'Activar resumen local',
    firstVisit:
      'El punto de partida está guardado. En futuras visitas se mostrarán nuevos artículos coincidentes.',
    count: 'Nuevos artículos coincidentes: {count}',
    none: 'No hay nuevos artículos coincidentes desde tu última visita.',
    newBadge: 'Nuevo desde tu última visita',
    changed: 'La versión del artículo ha cambiado.',
    acknowledge: 'Marcar esta versión como vista',
    reset: 'Desactivar y borrar el resumen',
    resetQuestion:
      '¿Borrar el resumen local de visitas y versiones? Los artículos guardados, las posiciones de lectura y las fuentes elegidas se conservan.',
    localNotifications: 'Notificaciones locales',
    enableNotifications: 'Activar notificaciones',
    disableNotifications: 'Desactivar notificaciones',
    foregroundOnly:
      'Se detectan novedades mientras esta vista está abierta. No hay entrega en segundo plano configurada en este dispositivo.',
    notificationsUnsupported:
      'Las notificaciones no están disponibles en este navegador o aplicación. El resumen local sigue disponible.',
    permissionDenied: 'No se permitieron las notificaciones. El resumen local sigue disponible.',
    unavailable:
      'No se pudo guardar o cargar el resumen local. Los datos existentes siguen protegidos. Vuelve a abrir la vista.',
    stored: 'Guardado en este dispositivo.',
    quietStart: 'Inicio del horario silencioso',
    quietEnd: 'Fin del horario silencioso',
    saveHours: 'Guardar horario silencioso',
    quietNote:
      'Usa la hora local del dispositivo. Horas iguales silencian las notificaciones todo el día.',
    notificationTitle: 'World Revolution News',
    notificationBody: 'Hay novedades en tu resumen local.',
    selectFirst: 'Elige temas, regiones, idiomas o fuentes en «Para mí» para usar este resumen.',
  },
  fr: {
    heading: 'Depuis votre dernière visite',
    explanation:
      'Mémorise les visites à «Pour moi» et les versions des articles uniquement sur cet appareil.',
    enable: 'Activer le suivi local',
    firstVisit:
      'Le point de départ est enregistré. Les prochaines visites pourront afficher de nouveaux articles correspondants.',
    count: 'Nouveaux articles correspondants : {count}',
    none: 'Aucun nouvel article correspondant depuis votre dernière visite.',
    newBadge: 'Nouveau depuis votre dernière visite',
    changed: 'La version de cet article a changé.',
    acknowledge: 'Marquer cette version comme vue',
    reset: 'Désactiver et effacer le suivi',
    resetQuestion:
      'Effacer le suivi local des visites et versions ? Les articles enregistrés, les positions de lecture et les sources choisies sont conservés.',
    localNotifications: 'Notifications locales',
    enableNotifications: 'Activer les notifications',
    disableNotifications: 'Désactiver les notifications',
    foregroundOnly:
      'Les nouveautés sont détectées lorsque cette vue est ouverte. La réception en arrière-plan n’est pas configurée sur cet appareil.',
    notificationsUnsupported:
      'Les notifications ne sont pas disponibles dans ce navigateur ou cette application. Le résumé local reste disponible.',
    permissionDenied:
      'Les notifications n’ont pas été autorisées. Le suivi local reste disponible.',
    unavailable:
      'Impossible d’enregistrer ou de charger le suivi local. Les données existantes restent protégées. Rouvrez cette vue.',
    stored: 'Enregistré sur cet appareil.',
    quietStart: 'Début des heures silencieuses',
    quietEnd: 'Fin des heures silencieuses',
    saveHours: 'Enregistrer les heures silencieuses',
    quietNote:
      'Utilise l’heure locale de cet appareil. Des heures identiques rendent les notifications silencieuses toute la journée.',
    notificationTitle: 'World Revolution News',
    notificationBody: 'Des nouveautés sont disponibles dans votre suivi local.',
    selectFirst:
      'Choisissez des thèmes, régions, langues ou sources dans «Pour moi» pour utiliser ce suivi.',
  },
  it: {
    heading: 'Dalla tua ultima visita',
    explanation:
      'Ricorda le visite a «Per me» e le versioni degli articoli solo su questo dispositivo.',
    enable: 'Attiva il riepilogo locale',
    firstVisit:
      'Il punto di partenza è salvato. Alle prossime visite potranno apparire nuovi articoli corrispondenti.',
    count: 'Nuovi articoli corrispondenti: {count}',
    none: 'Nessun nuovo articolo corrispondente dalla tua ultima visita.',
    newBadge: 'Nuovo dalla tua ultima visita',
    changed: 'La versione dell’articolo è cambiata.',
    acknowledge: 'Segna questa versione come vista',
    reset: 'Disattiva e cancella il riepilogo',
    resetQuestion:
      'Cancellare il riepilogo locale di visite e versioni? Articoli salvati, posizioni di lettura e fonti scelte restano invariati.',
    localNotifications: 'Notifiche locali',
    enableNotifications: 'Attiva le notifiche',
    disableNotifications: 'Disattiva le notifiche',
    foregroundOnly:
      'Le novità vengono rilevate mentre questa vista è aperta. La ricezione in background non è configurata su questo dispositivo.',
    notificationsUnsupported:
      'Le notifiche non sono disponibili in questo browser o app. Il riepilogo locale resta disponibile.',
    permissionDenied:
      'Le notifiche non sono state autorizzate. Il riepilogo locale resta disponibile.',
    unavailable:
      'Impossibile salvare o caricare il riepilogo locale. I dati esistenti restano protetti. Riapri la vista.',
    stored: 'Salvato su questo dispositivo.',
    quietStart: 'Inizio delle ore silenziose',
    quietEnd: 'Fine delle ore silenziose',
    saveHours: 'Salva le ore silenziose',
    quietNote:
      'Usa l’ora locale del dispositivo. Orari uguali silenziano le notifiche per tutto il giorno.',
    notificationTitle: 'World Revolution News',
    notificationBody: 'Sono disponibili novità nel tuo riepilogo locale.',
    selectFirst: 'Scegli temi, regioni, lingue o fonti in «Per me» per usare questo riepilogo.',
  },
  pt: {
    heading: 'Desde a sua última visita',
    explanation:
      'Guarda as visitas a «Para mim» e as versões dos artigos apenas neste dispositivo.',
    enable: 'Ativar resumo local',
    firstVisit:
      'O ponto de partida foi guardado. Nas próximas visitas poderão aparecer novos artigos correspondentes.',
    count: 'Novos artigos correspondentes: {count}',
    none: 'Não há novos artigos correspondentes desde a sua última visita.',
    newBadge: 'Novo desde a sua última visita',
    changed: 'A versão do artigo mudou.',
    acknowledge: 'Marcar esta versão como vista',
    reset: 'Desativar e apagar o resumo',
    resetQuestion:
      'Apagar o resumo local de visitas e versões? Artigos guardados, posições de leitura e fontes escolhidas são mantidos.',
    localNotifications: 'Notificações locais',
    enableNotifications: 'Ativar notificações',
    disableNotifications: 'Desativar notificações',
    foregroundOnly:
      'As novidades são detetadas enquanto esta vista está aberta. A entrega em segundo plano não está configurada neste dispositivo.',
    notificationsUnsupported:
      'As notificações não estão disponíveis neste navegador ou aplicação. O resumo local continua disponível.',
    permissionDenied: 'As notificações não foram permitidas. O resumo local continua disponível.',
    unavailable:
      'Não foi possível guardar ou carregar o resumo local. Os dados existentes continuam protegidos. Abra novamente a vista.',
    stored: 'Guardado neste dispositivo.',
    quietStart: 'Início do horário silencioso',
    quietEnd: 'Fim do horário silencioso',
    saveHours: 'Guardar horário silencioso',
    quietNote:
      'Usa a hora local do dispositivo. Horas iguais silenciam as notificações durante todo o dia.',
    notificationTitle: 'World Revolution News',
    notificationBody: 'Há novidades no seu resumo local.',
    selectFirst: 'Escolha temas, regiões, idiomas ou fontes em «Para mim» para usar este resumo.',
  },
  ru: {
    heading: 'С вашего последнего посещения',
    explanation:
      'Сохраняет посещения раздела «Для меня» и версии статей только на этом устройстве.',
    enable: 'Включить локальный обзор',
    firstVisit:
      'Начальный список сохранён. При следующих посещениях могут появиться новые подходящие статьи.',
    count: 'Новых подходящих статей: {count}',
    none: 'С последнего посещения новых подходящих статей нет.',
    newBadge: 'Новое с последнего посещения',
    changed: 'Версия статьи изменилась.',
    acknowledge: 'Отметить эту версию как просмотренную',
    reset: 'Отключить и очистить обзор',
    resetQuestion:
      'Очистить локальный обзор посещений и версий? Сохранённые статьи, позиции чтения и выбранные источники останутся.',
    localNotifications: 'Локальные уведомления',
    enableNotifications: 'Включить уведомления',
    disableNotifications: 'Отключить уведомления',
    foregroundOnly:
      'Новые записи обнаруживаются, пока открыт этот раздел. Фоновая доставка на этом устройстве не настроена.',
    notificationsUnsupported:
      'Уведомления недоступны в этом браузере или приложении. Локальный обзор остаётся доступным.',
    permissionDenied: 'Уведомления не разрешены. Локальный обзор остаётся доступным.',
    unavailable:
      'Не удалось сохранить или загрузить локальный обзор. Существующие данные защищены. Откройте раздел снова.',
    stored: 'Сохранено на этом устройстве.',
    quietStart: 'Начало тихих часов',
    quietEnd: 'Конец тихих часов',
    saveHours: 'Сохранить тихие часы',
    quietNote:
      'Используется местное время устройства. Одинаковое время начала и конца отключает уведомления на весь день.',
    notificationTitle: 'World Revolution News',
    notificationBody: 'В вашем локальном обзоре есть новые записи.',
    selectFirst: 'Выберите темы, регионы, языки или источники в разделе «Для меня».',
  },
  el: {
    heading: 'Από την τελευταία επίσκεψή σου',
    explanation:
      'Αποθηκεύει επισκέψεις στο «Για μένα» και εκδόσεις άρθρων μόνο σε αυτή τη συσκευή.',
    enable: 'Ενεργοποίηση τοπικής επισκόπησης',
    firstVisit:
      'Η αρχική κατάσταση αποθηκεύτηκε. Στις επόμενες επισκέψεις μπορούν να εμφανιστούν νέα σχετικά άρθρα.',
    count: 'Νέα σχετικά άρθρα: {count}',
    none: 'Δεν υπάρχουν νέα σχετικά άρθρα από την τελευταία επίσκεψή σου.',
    newBadge: 'Νέο από την τελευταία επίσκεψη',
    changed: 'Η έκδοση του άρθρου άλλαξε.',
    acknowledge: 'Σήμανση αυτής της έκδοσης ως προβληθείσας',
    reset: 'Απενεργοποίηση και διαγραφή επισκόπησης',
    resetQuestion:
      'Να διαγραφεί η τοπική επισκόπηση επισκέψεων και εκδόσεων; Τα αποθηκευμένα άρθρα, οι θέσεις ανάγνωσης και οι επιλεγμένες πηγές διατηρούνται.',
    localNotifications: 'Τοπικές ειδοποιήσεις',
    enableNotifications: 'Ενεργοποίηση ειδοποιήσεων',
    disableNotifications: 'Απενεργοποίηση ειδοποιήσεων',
    foregroundOnly:
      'Οι νέες εγγραφές εντοπίζονται όταν αυτή η προβολή είναι ανοιχτή. Η παράδοση στο παρασκήνιο δεν έχει ρυθμιστεί σε αυτή τη συσκευή.',
    notificationsUnsupported:
      'Οι ειδοποιήσεις δεν είναι διαθέσιμες σε αυτό το πρόγραμμα περιήγησης ή την εφαρμογή. Η τοπική επισκόπηση παραμένει διαθέσιμη.',
    permissionDenied: 'Οι ειδοποιήσεις δεν επιτράπηκαν. Η τοπική επισκόπηση παραμένει διαθέσιμη.',
    unavailable:
      'Δεν ήταν δυνατή η αποθήκευση ή φόρτωση της τοπικής επισκόπησης. Τα υπάρχοντα δεδομένα προστατεύονται. Άνοιξε ξανά την προβολή.',
    stored: 'Αποθηκεύτηκε σε αυτή τη συσκευή.',
    quietStart: 'Έναρξη ωρών σίγασης',
    quietEnd: 'Λήξη ωρών σίγασης',
    saveHours: 'Αποθήκευση ωρών σίγασης',
    quietNote:
      'Χρησιμοποιείται η τοπική ώρα της συσκευής. Ίδια ώρα έναρξης και λήξης θέτει τις ειδοποιήσεις σε σίγαση όλη την ημέρα.',
    notificationTitle: 'World Revolution News',
    notificationBody: 'Υπάρχουν νέες εγγραφές στην τοπική επισκόπησή σου.',
    selectFirst:
      'Επίλεξε θέματα, περιοχές, γλώσσες ή πηγές στο «Για μένα» για αυτή την επισκόπηση.',
  },
  tr: {
    heading: 'Son ziyaretinden beri',
    explanation: '«Benim için» ziyaretlerini ve makale sürümlerini yalnızca bu cihazda tutar.',
    enable: 'Yerel özeti etkinleştir',
    firstVisit:
      'Başlangıç durumu kaydedildi. Sonraki ziyaretlerde yeni eşleşen makaleler görünebilir.',
    count: 'Yeni eşleşen makaleler: {count}',
    none: 'Son ziyaretinden beri yeni eşleşen makale yok.',
    newBadge: 'Son ziyaretinden beri yeni',
    changed: 'Makalenin sürümü değişti.',
    acknowledge: 'Bu sürümü görülmüş olarak işaretle',
    reset: 'Özeti kapat ve temizle',
    resetQuestion:
      'Yerel ziyaret ve sürüm özeti temizlensin mi? Kaydedilen makaleler, okuma konumları ve kaynak seçimleri korunur.',
    localNotifications: 'Yerel bildirimler',
    enableNotifications: 'Bildirimleri etkinleştir',
    disableNotifications: 'Bildirimleri kapat',
    foregroundOnly:
      'Bu görünüm açıkken yeni kayıtlar algılanır. Bu cihazda arka planda bildirim iletimi ayarlanmamıştır.',
    notificationsUnsupported:
      'Bildirimler bu tarayıcıda veya uygulamada kullanılamıyor. Yerel özet kullanılabilir durumda.',
    permissionDenied: 'Bildirimlere izin verilmedi. Yerel özet kullanılabilir durumda.',
    unavailable:
      'Yerel özet kaydedilemedi veya yüklenemedi. Mevcut veriler korunur. Görünümü yeniden aç.',
    stored: 'Bu cihaza kaydedildi.',
    quietStart: 'Sessiz saatlerin başlangıcı',
    quietEnd: 'Sessiz saatlerin sonu',
    saveHours: 'Sessiz saatleri kaydet',
    quietNote:
      'Cihazın yerel saatini kullanır. Başlangıç ve bitişin aynı olması bildirimleri gün boyu susturur.',
    notificationTitle: 'World Revolution News',
    notificationBody: 'Yerel özetinde yeni kayıtlar var.',
    selectFirst: 'Bu özet için «Benim için» bölümünde konu, bölge, dil veya kaynak seç.',
  },
};
export const getProductionActivityCopy = (language: UiLanguage): ProductionActivityCopy =>
  productionActivityEntries[language];
