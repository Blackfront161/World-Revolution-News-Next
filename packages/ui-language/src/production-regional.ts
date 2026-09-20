import type { UiLanguage } from './index';

type CopyKey =
  | 'title'
  | 'intro'
  | 'continent'
  | 'country'
  | 'region'
  | 'choose'
  | 'allCountries'
  | 'allRegions'
  | 'save'
  | 'clear'
  | 'saved'
  | 'temporary'
  | 'loading'
  | 'storageError'
  | 'conflict'
  | 'empty'
  | 'unselected'
  | 'invalid'
  | 'stale'
  | 'unavailable'
  | 'coverage'
  | 'source'
  | 'checked'
  | 'through'
  | 'timeUnknown'
  | 'venueUnknown'
  | 'original'
  | 'changed'
  | 'sources'
  | 'localTime';
export type ProductionRegionalCopy = Readonly<Record<CopyKey, string>>;
const entries: Readonly<Record<UiLanguage, ProductionRegionalCopy>> = {
  de: {
    title: 'Termine in deiner Region',
    intro:
      'Wähle deine Region. Erst „Speichern“ merkt sie sich auf diesem Gerät; dein Standort wird nicht abgefragt.',
    continent: 'Kontinent',
    country: 'Land',
    region: 'Region',
    choose: 'Bitte wählen',
    allCountries: 'Alle erfassten Länder',
    allRegions: 'Alle erfassten Regionen',
    save: 'Auswahl auf diesem Gerät speichern',
    clear: 'Regionsauswahl löschen',
    saved: 'Auswahl auf diesem Gerät gespeichert.',
    temporary: 'Diese Auswahl gilt vorerst nur für diese Ansicht.',
    loading: 'Termine werden geladen …',
    storageError:
      'Die Auswahl kann hier nicht gespeichert werden. Du kannst die Termine trotzdem ansehen; vorhandene gespeicherte Daten bleiben erhalten.',
    conflict:
      'Die gespeicherte Auswahl hat sich geändert. Lade die Ansicht neu, bevor du erneut speicherst.',
    empty: 'Für diese Auswahl sind aktuell keine kommenden Termine erfasst.',
    unselected: 'Wähle einen Kontinent, um passende Termine zu sehen.',
    invalid:
      'Diese gespeicherte Region ist im aktuellen Verzeichnis nicht enthalten. Bitte wähle erneut.',
    stale:
      'Dieser Stand ist nicht mehr aktuell. Prüfe neue Termine und Änderungen direkt bei den Quellen.',
    unavailable: 'Die Termine können gerade nicht geprüft werden.',
    coverage:
      'Bis zu fünf kommende oder laufende Termine. Die regionale Abdeckung ist noch begrenzt; prüfe vor einem Besuch die Originalankündigung.',
    source: 'Quelle',
    checked: 'Quelle eingesehen',
    through: 'Stand gültig bis',
    timeUnknown: 'Uhrzeit nicht angegeben',
    venueUnknown: 'Veranstaltungsort noch nicht angegeben',
    original: 'Originalankündigung öffnen',
    changed: 'Geändert',
    sources: 'Quellen der Termine',
    localTime: 'Ortszeit',
  },
  en: {
    title: 'Events in your region',
    intro:
      'Choose your region. Only Save remembers it on this device; your location is not requested.',
    continent: 'Continent',
    country: 'Country',
    region: 'Region',
    choose: 'Choose',
    allCountries: 'All listed countries',
    allRegions: 'All listed regions',
    save: 'Save selection on this device',
    clear: 'Clear region selection',
    saved: 'Selection saved on this device.',
    temporary: 'This selection applies to this view for now.',
    loading: 'Loading events …',
    storageError:
      'Your selection cannot be saved here. You can still browse events; existing saved data is preserved.',
    conflict: 'The saved selection has changed. Reload this view before saving again.',
    empty: 'No upcoming events are currently listed for this selection.',
    unselected: 'Choose a continent to see matching events.',
    invalid: 'This saved region is not in the current directory. Please choose again.',
    stale: 'This snapshot is out of date. Check the sources directly for new events and changes.',
    unavailable: 'Events cannot be checked right now.',
    coverage:
      'Up to five upcoming or ongoing events. Regional coverage is still limited; check the original announcement before visiting.',
    source: 'Source',
    checked: 'Source viewed',
    through: 'Snapshot valid until',
    timeUnknown: 'Time not specified',
    venueUnknown: 'Venue not yet specified',
    original: 'Open original announcement',
    changed: 'Changed',
    sources: 'Event sources',
    localTime: 'Local time',
  },
  es: {
    title: 'Eventos en tu región',
    intro:
      'Elige tu región. Solo Guardar la recuerda en este dispositivo; no se solicita tu ubicación.',
    continent: 'Continente',
    country: 'País',
    region: 'Región',
    choose: 'Elige',
    allCountries: 'Todos los países registrados',
    allRegions: 'Todas las regiones registradas',
    save: 'Guardar selección en este dispositivo',
    clear: 'Borrar selección de región',
    saved: 'Selección guardada en este dispositivo.',
    temporary: 'Por ahora, esta selección solo se aplica a esta vista.',
    loading: 'Cargando eventos …',
    storageError:
      'No se puede guardar tu selección aquí. Puedes consultar los eventos; los datos guardados se conservan.',
    conflict: 'La selección guardada ha cambiado. Recarga esta vista antes de volver a guardar.',
    empty: 'Actualmente no hay próximos eventos registrados para esta selección.',
    unselected: 'Elige un continente para ver los eventos correspondientes.',
    invalid: 'Esta región guardada no está en el directorio actual. Elige de nuevo.',
    stale:
      'Esta información está desactualizada. Consulta las fuentes para conocer nuevos eventos y cambios.',
    unavailable: 'Ahora mismo no se pueden comprobar los eventos.',
    coverage:
      'Hasta cinco eventos próximos o en curso. La cobertura regional aún es limitada; consulta el anuncio original antes de asistir.',
    source: 'Fuente',
    checked: 'Fuente consultada',
    through: 'Información válida hasta',
    timeUnknown: 'Hora no indicada',
    venueUnknown: 'Lugar aún no indicado',
    original: 'Abrir anuncio original',
    changed: 'Modificado',
    sources: 'Fuentes de los eventos',
    localTime: 'Hora local',
  },
  fr: {
    title: 'Événements dans votre région',
    intro:
      'Choisissez votre région. Seul Enregistrer la mémorise sur cet appareil ; votre position n’est pas demandée.',
    continent: 'Continent',
    country: 'Pays',
    region: 'Région',
    choose: 'Choisir',
    allCountries: 'Tous les pays répertoriés',
    allRegions: 'Toutes les régions répertoriées',
    save: 'Enregistrer la sélection sur cet appareil',
    clear: 'Effacer la sélection de région',
    saved: 'Sélection enregistrée sur cet appareil.',
    temporary: 'Pour le moment, cette sélection concerne uniquement cette vue.',
    loading: 'Chargement des événements …',
    storageError:
      'La sélection ne peut pas être enregistrée ici. Vous pouvez consulter les événements ; les données déjà enregistrées sont conservées.',
    conflict:
      'La sélection enregistrée a changé. Rechargez cette vue avant d’enregistrer à nouveau.',
    empty: 'Aucun événement à venir n’est actuellement répertorié pour cette sélection.',
    unselected: 'Choisissez un continent pour voir les événements correspondants.',
    invalid:
      'Cette région enregistrée ne figure pas dans le répertoire actuel. Veuillez choisir à nouveau.',
    stale:
      'Ces informations ne sont plus à jour. Consultez les sources pour les nouveaux événements et les changements.',
    unavailable: 'Les événements ne peuvent pas être vérifiés pour le moment.',
    coverage:
      'Jusqu’à cinq événements à venir ou en cours. La couverture régionale reste limitée ; consultez l’annonce originale avant de vous déplacer.',
    source: 'Source',
    checked: 'Source consultée',
    through: 'Informations valables jusqu’au',
    timeUnknown: 'Horaire non indiqué',
    venueUnknown: 'Lieu pas encore indiqué',
    original: 'Ouvrir l’annonce originale',
    changed: 'Modifié',
    sources: 'Sources des événements',
    localTime: 'Heure locale',
  },
  it: {
    title: 'Eventi nella tua regione',
    intro:
      'Scegli la tua regione. Solo Salva la memorizza su questo dispositivo; la tua posizione non viene richiesta.',
    continent: 'Continente',
    country: 'Paese',
    region: 'Regione',
    choose: 'Scegli',
    allCountries: 'Tutti i paesi elencati',
    allRegions: 'Tutte le regioni elencate',
    save: 'Salva selezione su questo dispositivo',
    clear: 'Cancella selezione della regione',
    saved: 'Selezione salvata su questo dispositivo.',
    temporary: 'Per ora questa selezione vale solo per questa vista.',
    loading: 'Caricamento eventi …',
    storageError:
      'Qui non è possibile salvare la selezione. Puoi comunque consultare gli eventi; i dati salvati vengono conservati.',
    conflict: 'La selezione salvata è cambiata. Ricarica questa vista prima di salvare di nuovo.',
    empty: 'Al momento non sono elencati eventi in programma per questa selezione.',
    unselected: 'Scegli un continente per vedere gli eventi corrispondenti.',
    invalid: 'Questa regione salvata non è nel catalogo attuale. Scegli di nuovo.',
    stale:
      'Queste informazioni non sono più aggiornate. Consulta le fonti per nuovi eventi e modifiche.',
    unavailable: 'Al momento non è possibile verificare gli eventi.',
    coverage:
      'Fino a cinque eventi in programma o in corso. La copertura regionale è ancora limitata; consulta l’annuncio originale prima di partecipare.',
    source: 'Fonte',
    checked: 'Fonte consultata',
    through: 'Informazioni valide fino al',
    timeUnknown: 'Orario non indicato',
    venueUnknown: 'Luogo non ancora indicato',
    original: 'Apri annuncio originale',
    changed: 'Modificato',
    sources: 'Fonti degli eventi',
    localTime: 'Ora locale',
  },
  pt: {
    title: 'Eventos na tua região',
    intro:
      'Escolhe a tua região. Só Guardar a memoriza neste dispositivo; a tua localização não é solicitada.',
    continent: 'Continente',
    country: 'País',
    region: 'Região',
    choose: 'Escolher',
    allCountries: 'Todos os países listados',
    allRegions: 'Todas as regiões listadas',
    save: 'Guardar seleção neste dispositivo',
    clear: 'Limpar seleção da região',
    saved: 'Seleção guardada neste dispositivo.',
    temporary: 'Por enquanto, esta seleção aplica-se apenas a esta vista.',
    loading: 'A carregar eventos …',
    storageError:
      'Não é possível guardar a seleção aqui. Podes consultar os eventos; os dados guardados são preservados.',
    conflict: 'A seleção guardada mudou. Recarrega esta vista antes de guardar novamente.',
    empty: 'Não há eventos futuros listados para esta seleção neste momento.',
    unselected: 'Escolhe um continente para ver os eventos correspondentes.',
    invalid: 'Esta região guardada não consta do diretório atual. Escolhe novamente.',
    stale:
      'Estas informações estão desatualizadas. Consulta as fontes para novos eventos e alterações.',
    unavailable: 'Não é possível verificar os eventos neste momento.',
    coverage:
      'Até cinco eventos futuros ou em curso. A cobertura regional ainda é limitada; consulta o anúncio original antes de participar.',
    source: 'Fonte',
    checked: 'Fonte consultada',
    through: 'Informações válidas até',
    timeUnknown: 'Hora não indicada',
    venueUnknown: 'Local ainda não indicado',
    original: 'Abrir anúncio original',
    changed: 'Alterado',
    sources: 'Fontes dos eventos',
    localTime: 'Hora local',
  },
  ru: {
    title: 'События в вашем регионе',
    intro:
      'Выберите регион. Он запоминается на этом устройстве только после сохранения; ваше местоположение не запрашивается.',
    continent: 'Континент',
    country: 'Страна',
    region: 'Регион',
    choose: 'Выберите',
    allCountries: 'Все указанные страны',
    allRegions: 'Все указанные регионы',
    save: 'Сохранить выбор на этом устройстве',
    clear: 'Удалить выбор региона',
    saved: 'Выбор сохранён на этом устройстве.',
    temporary: 'Пока этот выбор действует только в данном представлении.',
    loading: 'Загрузка событий …',
    storageError:
      'Здесь нельзя сохранить выбор. Вы можете просматривать события; ранее сохранённые данные остаются без изменений.',
    conflict: 'Сохранённый выбор изменился. Обновите страницу перед повторным сохранением.',
    empty: 'Для этого выбора пока нет предстоящих событий.',
    unselected: 'Выберите континент, чтобы увидеть подходящие события.',
    invalid: 'Сохранённого региона нет в текущем каталоге. Выберите регион снова.',
    stale:
      'Эти сведения устарели. Проверяйте новые события и изменения непосредственно в источниках.',
    unavailable: 'Сейчас проверить события не удалось.',
    coverage:
      'До пяти предстоящих или текущих событий. Региональный охват пока ограничен; перед посещением проверьте исходное объявление.',
    source: 'Источник',
    checked: 'Источник просмотрен',
    through: 'Сведения действительны до',
    timeUnknown: 'Время не указано',
    venueUnknown: 'Место пока не указано',
    original: 'Открыть исходное объявление',
    changed: 'Изменено',
    sources: 'Источники событий',
    localTime: 'Местное время',
  },
  el: {
    title: 'Εκδηλώσεις στην περιοχή σου',
    intro:
      'Επίλεξε την περιοχή σου. Αποθηκεύεται σε αυτή τη συσκευή μόνο με την Αποθήκευση· δεν ζητείται η τοποθεσία σου.',
    continent: 'Ήπειρος',
    country: 'Χώρα',
    region: 'Περιοχή',
    choose: 'Επίλεξε',
    allCountries: 'Όλες οι καταχωρισμένες χώρες',
    allRegions: 'Όλες οι καταχωρισμένες περιοχές',
    save: 'Αποθήκευση επιλογής σε αυτή τη συσκευή',
    clear: 'Διαγραφή επιλογής περιοχής',
    saved: 'Η επιλογή αποθηκεύτηκε σε αυτή τη συσκευή.',
    temporary: 'Προς το παρόν, αυτή η επιλογή ισχύει μόνο σε αυτή την προβολή.',
    loading: 'Φόρτωση εκδηλώσεων …',
    storageError:
      'Δεν μπορεί να αποθηκευτεί η επιλογή εδώ. Μπορείς να δεις τις εκδηλώσεις· τα αποθηκευμένα δεδομένα διατηρούνται.',
    conflict: 'Η αποθηκευμένη επιλογή άλλαξε. Φόρτωσε ξανά την προβολή πριν αποθηκεύσεις πάλι.',
    empty: 'Δεν υπάρχουν καταχωρισμένες προσεχείς εκδηλώσεις για αυτή την επιλογή.',
    unselected: 'Επίλεξε ήπειρο για να δεις τις αντίστοιχες εκδηλώσεις.',
    invalid: 'Η αποθηκευμένη περιοχή δεν υπάρχει στον τρέχοντα κατάλογο. Επίλεξε ξανά.',
    stale:
      'Αυτές οι πληροφορίες δεν είναι πλέον ενημερωμένες. Έλεγξε τις πηγές για νέες εκδηλώσεις και αλλαγές.',
    unavailable: 'Δεν είναι δυνατός ο έλεγχος των εκδηλώσεων αυτή τη στιγμή.',
    coverage:
      'Έως πέντε προσεχείς ή τρέχουσες εκδηλώσεις. Η γεωγραφική κάλυψη παραμένει περιορισμένη· έλεγξε την αρχική ανακοίνωση πριν πας.',
    source: 'Πηγή',
    checked: 'Η πηγή ελέγχθηκε',
    through: 'Οι πληροφορίες ισχύουν έως',
    timeUnknown: 'Δεν αναφέρεται ώρα',
    venueUnknown: 'Δεν αναφέρεται ακόμη χώρος',
    original: 'Άνοιγμα αρχικής ανακοίνωσης',
    changed: 'Τροποποιήθηκε',
    sources: 'Πηγές εκδηλώσεων',
    localTime: 'Τοπική ώρα',
  },
  tr: {
    title: 'Bölgendeki etkinlikler',
    intro: 'Bölgeni seç. Yalnızca Kaydet seçeneği bunu bu cihazda hatırlar; konumun istenmez.',
    continent: 'Kıta',
    country: 'Ülke',
    region: 'Bölge',
    choose: 'Seç',
    allCountries: 'Listelenen tüm ülkeler',
    allRegions: 'Listelenen tüm bölgeler',
    save: 'Seçimi bu cihazda kaydet',
    clear: 'Bölge seçimini temizle',
    saved: 'Seçim bu cihazda kaydedildi.',
    temporary: 'Bu seçim şimdilik yalnızca bu görünüm için geçerlidir.',
    loading: 'Etkinlikler yükleniyor …',
    storageError:
      'Seçimin burada kaydedilemiyor. Etkinliklere göz atabilirsin; mevcut kayıtlı veriler korunur.',
    conflict: 'Kayıtlı seçim değişti. Tekrar kaydetmeden önce bu görünümü yenile.',
    empty: 'Bu seçim için şu anda yaklaşan etkinlik listelenmiyor.',
    unselected: 'İlgili etkinlikleri görmek için bir kıta seç.',
    invalid: 'Kayıtlı bölge güncel dizinde yok. Lütfen yeniden seç.',
    stale:
      'Bu bilgiler güncelliğini yitirdi. Yeni etkinlikler ve değişiklikler için doğrudan kaynaklara bak.',
    unavailable: 'Etkinlikler şu anda kontrol edilemiyor.',
    coverage:
      'En fazla beş yaklaşan veya devam eden etkinlik. Bölgesel kapsam henüz sınırlı; gitmeden önce özgün duyuruyu kontrol et.',
    source: 'Kaynak',
    checked: 'Kaynağa bakılma tarihi',
    through: 'Bilgilerin geçerlilik sonu',
    timeUnknown: 'Saat belirtilmemiş',
    venueUnknown: 'Mekân henüz belirtilmemiş',
    original: 'Özgün duyuruyu aç',
    changed: 'Değiştirildi',
    sources: 'Etkinlik kaynakları',
    localTime: 'Yerel saat',
  },
};
export function getProductionRegionalCopy(language: UiLanguage): ProductionRegionalCopy {
  return entries[language];
}

const continentNames: Readonly<Record<UiLanguage, readonly [string, string, string]>> = {
  de: ['Europa', 'Nordamerika', 'Südamerika'],
  en: ['Europe', 'North America', 'South America'],
  es: ['Europa', 'América del Norte', 'América del Sur'],
  fr: ['Europe', 'Amérique du Nord', 'Amérique du Sud'],
  it: ['Europa', 'America del Nord', 'America del Sud'],
  pt: ['Europa', 'América do Norte', 'América do Sul'],
  ru: ['Европа', 'Северная Америка', 'Южная Америка'],
  el: ['Ευρώπη', 'Βόρεια Αμερική', 'Νότια Αμερική'],
  tr: ['Avrupa', 'Kuzey Amerika', 'Güney Amerika'],
};
export function getRegionalContinentName(language: UiLanguage, id: string): string | null {
  const index = ['continent-europe', 'continent-north-america', 'continent-south-america'].indexOf(
    id,
  );
  return continentNames[language][index] ?? null;
}
