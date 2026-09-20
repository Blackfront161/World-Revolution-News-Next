import type { UiLanguage } from './index.js';

const selectionCopy: Readonly<
  Record<
    UiLanguage,
    Readonly<{
      title: string;
      local: string;
      followed: string;
      otherSource: string;
    }>
  >
> = {
  de: {
    title: 'Warum sehe ich das?',
    local:
      'Dieser Beitrag passt zu deiner lokalen Auswahl. Es werden nur Einstellungen verwendet, die du selbst gewählt hast.',
    followed: 'Du folgst dieser Quelle',
    otherSource:
      'Dieser Beitrag bleibt nach deinen Quellenfiltern sichtbar. Beiträge gefolgter Quellen erscheinen zuerst.',
  },
  en: {
    title: 'Why am I seeing this?',
    local:
      'This article matches your local choices. Only settings you explicitly selected are used.',
    followed: 'You follow this source',
    otherSource:
      'This article remains visible after your source filters. Articles from followed sources come first.',
  },
  es: {
    title: '¿Por qué veo esto?',
    local:
      'Este artículo coincide con tu selección local. Solo se usan los ajustes que has elegido.',
    followed: 'Sigues esta fuente',
    otherSource:
      'Este artículo sigue visible tras aplicar tus filtros de fuentes. Los artículos de fuentes seguidas aparecen primero.',
  },
  fr: {
    title: 'Pourquoi ce contenu ?',
    local:
      'Cet article correspond à vos choix locaux. Seuls les paramètres que vous avez choisis sont utilisés.',
    followed: 'Vous suivez cette source',
    otherSource:
      'Cet article reste visible après vos filtres de sources. Les articles des sources suivies apparaissent en premier.',
  },
  it: {
    title: 'Perché vedo questo?',
    local:
      'Questo articolo corrisponde alle tue scelte locali. Vengono usate solo le impostazioni che hai scelto.',
    followed: 'Segui questa fonte',
    otherSource:
      'Questo articolo resta visibile dopo i filtri sulle fonti. Gli articoli delle fonti seguite appaiono per primi.',
  },
  pt: {
    title: 'Porque vejo isto?',
    local:
      'Este artigo corresponde às tuas escolhas locais. Só são usadas as definições que escolheste.',
    followed: 'Segues esta fonte',
    otherSource:
      'Este artigo continua visível após os teus filtros de fontes. Os artigos das fontes seguidas aparecem primeiro.',
  },
  ru: {
    title: 'Почему я это вижу?',
    local:
      'Эта статья соответствует вашему локальному выбору. Используются только настройки, которые вы выбрали сами.',
    followed: 'Вы подписаны на этот источник',
    otherSource:
      'Эта статья остаётся видимой после применения фильтров источников. Статьи источников с подпиской показываются первыми.',
  },
  el: {
    title: 'Γιατί το βλέπω αυτό;',
    local:
      'Αυτό το άρθρο αντιστοιχεί στις τοπικές επιλογές σου. Χρησιμοποιούνται μόνο οι ρυθμίσεις που επέλεξες.',
    followed: 'Ακολουθείς αυτή την πηγή',
    otherSource:
      'Αυτό το άρθρο παραμένει ορατό μετά τα φίλτρα πηγών σου. Τα άρθρα από πηγές που ακολουθείς εμφανίζονται πρώτα.',
  },
  tr: {
    title: 'Bunu neden görüyorum?',
    local: 'Bu yazı yerel seçimlerinle eşleşiyor. Yalnızca kendin seçtiğin ayarlar kullanılıyor.',
    followed: 'Bu kaynağı takip ediyorsun',
    otherSource:
      'Bu yazı, kaynak filtrelerinden sonra görünür kalıyor. Takip edilen kaynakların yazıları önce gösteriliyor.',
  },
};

export function getProductionSelectionCopy(language: UiLanguage) {
  return selectionCopy[language];
}

const en = {
  title: 'Source choices',
  intro:
    'Only on this device. Followed sources come first; hidden sources leave news lists. Saved articles remain available.',
  profile: 'Source profile',
  endpoint: 'This choice applies to this feed endpoint.',
  follow: 'Follow',
  unfollow: 'Unfollow',
  hide: 'Hide',
  unhide: 'Show again',
  hidden: 'Source hidden. This saved article or direct link remains available.',
  missing: 'Not in the current local catalogue',
  clear: 'Clear source choices',
  clearQuestion: 'Clear only your source choices? Interests and saved articles will remain.',
  saved: 'Source choices saved.',
  failed: 'The change could not be confirmed. Reload your source choices before trying again.',
  protected:
    'Saved source choices have an unknown or damaged format. They are preserved; source filtering is paused.',
  unavailable: 'Source choices are unavailable. Source filtering is paused.',
  empty: 'No sources followed or hidden.',
} as const;
export type SourcePreferencesCopy = Readonly<Record<keyof typeof en, string>>;
const entries: Readonly<Record<UiLanguage, SourcePreferencesCopy>> = {
  en,
  de: {
    title: 'Quellenauswahl',
    intro:
      'Nur auf diesem Gerät. Gefolgte Quellen erscheinen zuerst, ausgeblendete fehlen in Nachrichtenlisten. Gemerkte Artikel bleiben verfügbar.',
    profile: 'Quellenprofil',
    endpoint: 'Diese Auswahl gilt für diesen Feed-Endpunkt.',
    follow: 'Folgen',
    unfollow: 'Nicht mehr folgen',
    hide: 'Ausblenden',
    unhide: 'Wieder anzeigen',
    hidden: 'Quelle ausgeblendet. Dieser gemerkte Artikel oder Direktlink bleibt verfügbar.',
    missing: 'Nicht im aktuellen lokalen Katalog',
    clear: 'Quellenauswahl löschen',
    clearQuestion:
      'Nur deine Quellenauswahl löschen? Interessen und gemerkte Artikel bleiben erhalten.',
    saved: 'Quellenauswahl gespeichert.',
    failed:
      'Die Änderung konnte nicht bestätigt werden. Lade die Quellenauswahl vor dem nächsten Versuch neu.',
    protected:
      'Die gespeicherte Quellenauswahl hat ein unbekanntes oder beschädigtes Format. Sie bleibt erhalten; die Quellenfilterung pausiert.',
    unavailable: 'Die Quellenauswahl ist nicht verfügbar. Die Quellenfilterung pausiert.',
    empty: 'Keine Quellen gefolgt oder ausgeblendet.',
  },
  es: {
    title: 'Selección de fuentes',
    intro:
      'Solo en este dispositivo. Las fuentes seguidas aparecen primero; las ocultas no aparecen en las listas de noticias. Los artículos guardados siguen disponibles.',
    profile: 'Perfil de la fuente',
    endpoint: 'Esta selección se aplica a este canal de noticias.',
    follow: 'Seguir',
    unfollow: 'Dejar de seguir',
    hide: 'Ocultar',
    unhide: 'Mostrar de nuevo',
    hidden: 'Fuente oculta. Este artículo guardado o enlace directo sigue disponible.',
    missing: 'No está en el catálogo local actual',
    clear: 'Borrar selección de fuentes',
    clearQuestion:
      '¿Borrar solo tu selección de fuentes? Se conservarán los intereses y artículos guardados.',
    saved: 'Selección de fuentes guardada.',
    failed:
      'No se pudo confirmar el cambio. Recarga la selección de fuentes antes de intentarlo de nuevo.',
    protected:
      'La selección guardada tiene un formato desconocido o dañado. Se conserva; el filtrado por fuentes está en pausa.',
    unavailable:
      'La selección de fuentes no está disponible. El filtrado por fuentes está en pausa.',
    empty: 'No hay fuentes seguidas ni ocultas.',
  },
  fr: {
    title: 'Choix des sources',
    intro:
      'Uniquement sur cet appareil. Les sources suivies passent en premier ; les sources masquées quittent les listes. Les articles enregistrés restent disponibles.',
    profile: 'Profil de la source',
    endpoint: 'Ce choix concerne ce point d’accès au flux.',
    follow: 'Suivre',
    unfollow: 'Ne plus suivre',
    hide: 'Masquer',
    unhide: 'Afficher à nouveau',
    hidden: 'Source masquée. Cet article enregistré ou ce lien direct reste disponible.',
    missing: 'Absent du catalogue local actuel',
    clear: 'Effacer les choix des sources',
    clearQuestion:
      'Effacer uniquement vos choix des sources ? Les intérêts et articles enregistrés seront conservés.',
    saved: 'Choix des sources enregistrés.',
    failed:
      'La modification n’a pas pu être confirmée. Rechargez les choix des sources avant de réessayer.',
    protected:
      'Les choix enregistrés ont un format inconnu ou endommagé. Ils sont conservés ; le filtrage des sources est suspendu.',
    unavailable: 'Les choix des sources sont indisponibles. Le filtrage des sources est suspendu.',
    empty: 'Aucune source suivie ou masquée.',
  },
  it: {
    title: 'Scelta delle fonti',
    intro:
      'Solo su questo dispositivo. Le fonti seguite vengono prima; quelle nascoste non compaiono negli elenchi. Gli articoli salvati restano disponibili.',
    profile: 'Profilo della fonte',
    endpoint: 'Questa scelta riguarda questo punto di accesso al feed.',
    follow: 'Segui',
    unfollow: 'Non seguire più',
    hide: 'Nascondi',
    unhide: 'Mostra di nuovo',
    hidden: 'Fonte nascosta. Questo articolo salvato o collegamento diretto resta disponibile.',
    missing: 'Non presente nel catalogo locale attuale',
    clear: 'Cancella la scelta delle fonti',
    clearQuestion:
      'Cancellare solo la scelta delle fonti? Interessi e articoli salvati verranno conservati.',
    saved: 'Scelta delle fonti salvata.',
    failed:
      'Impossibile confermare la modifica. Ricarica la scelta delle fonti prima di riprovare.',
    protected:
      'La scelta salvata ha un formato sconosciuto o danneggiato. Viene conservata; il filtro delle fonti è sospeso.',
    unavailable: 'La scelta delle fonti non è disponibile. Il filtro delle fonti è sospeso.',
    empty: 'Nessuna fonte seguita o nascosta.',
  },
  pt: {
    title: 'Escolha de fontes',
    intro:
      'Apenas neste dispositivo. As fontes seguidas aparecem primeiro; as ocultas saem das listas. Os artigos guardados continuam disponíveis.',
    profile: 'Perfil da fonte',
    endpoint: 'Esta escolha aplica-se a este endereço do feed.',
    follow: 'Seguir',
    unfollow: 'Deixar de seguir',
    hide: 'Ocultar',
    unhide: 'Mostrar novamente',
    hidden: 'Fonte oculta. Este artigo guardado ou ligação direta continua disponível.',
    missing: 'Não consta do catálogo local atual',
    clear: 'Apagar escolha de fontes',
    clearQuestion:
      'Apagar apenas a escolha de fontes? Os interesses e artigos guardados serão mantidos.',
    saved: 'Escolha de fontes guardada.',
    failed:
      'Não foi possível confirmar a alteração. Recarregue a escolha de fontes antes de tentar novamente.',
    protected:
      'A escolha guardada tem um formato desconhecido ou danificado. É preservada; a filtragem por fontes está em pausa.',
    unavailable: 'A escolha de fontes não está disponível. A filtragem por fontes está em pausa.',
    empty: 'Nenhuma fonte seguida ou oculta.',
  },
  ru: {
    title: 'Выбор источников',
    intro:
      'Только на этом устройстве. Источники с подпиской показываются первыми, скрытые убираются из списков новостей. Сохранённые статьи остаются доступны.',
    profile: 'Профиль источника',
    endpoint: 'Этот выбор относится к данному адресу ленты.',
    follow: 'Подписаться',
    unfollow: 'Отписаться',
    hide: 'Скрыть',
    unhide: 'Показать снова',
    hidden: 'Источник скрыт. Эта сохранённая статья или прямая ссылка остаётся доступной.',
    missing: 'Нет в текущем локальном каталоге',
    clear: 'Очистить выбор источников',
    clearQuestion: 'Очистить только выбор источников? Интересы и сохранённые статьи останутся.',
    saved: 'Выбор источников сохранён.',
    failed:
      'Не удалось подтвердить изменение. Перед новой попыткой перезагрузите выбор источников.',
    protected:
      'Сохранённый выбор имеет неизвестный или повреждённый формат. Данные сохранены; фильтрация источников приостановлена.',
    unavailable: 'Выбор источников недоступен. Фильтрация источников приостановлена.',
    empty: 'Нет источников с подпиской или скрытых источников.',
  },
  el: {
    title: 'Επιλογή πηγών',
    intro:
      'Μόνο σε αυτή τη συσκευή. Οι πηγές που ακολουθείς εμφανίζονται πρώτες, ενώ οι κρυφές αφαιρούνται από τις λίστες. Τα αποθηκευμένα άρθρα παραμένουν διαθέσιμα.',
    profile: 'Προφίλ πηγής',
    endpoint: 'Η επιλογή αφορά αυτή τη διεύθυνση ροής.',
    follow: 'Ακολούθηση',
    unfollow: 'Διακοπή ακολούθησης',
    hide: 'Απόκρυψη',
    unhide: 'Εμφάνιση ξανά',
    hidden: 'Κρυφή πηγή. Αυτό το αποθηκευμένο άρθρο ή ο άμεσος σύνδεσμος παραμένει διαθέσιμος.',
    missing: 'Δεν υπάρχει στον τρέχοντα τοπικό κατάλογο',
    clear: 'Διαγραφή επιλογής πηγών',
    clearQuestion:
      'Διαγραφή μόνο της επιλογής πηγών; Τα ενδιαφέροντα και τα αποθηκευμένα άρθρα θα παραμείνουν.',
    saved: 'Η επιλογή πηγών αποθηκεύτηκε.',
    failed: 'Η αλλαγή δεν επιβεβαιώθηκε. Φόρτωσε ξανά την επιλογή πηγών πριν προσπαθήσεις ξανά.',
    protected:
      'Η αποθηκευμένη επιλογή έχει άγνωστη ή κατεστραμμένη μορφή. Διατηρείται· το φιλτράρισμα πηγών έχει ανασταλεί.',
    unavailable: 'Η επιλογή πηγών δεν είναι διαθέσιμη. Το φιλτράρισμα πηγών έχει ανασταλεί.',
    empty: 'Δεν υπάρχουν πηγές που ακολουθείς ή έχεις αποκρύψει.',
  },
  tr: {
    title: 'Kaynak seçimi',
    intro:
      'Yalnızca bu cihazda. Takip edilen kaynaklar önce gösterilir; gizlenenler haber listelerinden çıkarılır. Kaydedilen yazılar erişilebilir kalır.',
    profile: 'Kaynak profili',
    endpoint: 'Bu seçim, bu akış adresi için geçerlidir.',
    follow: 'Takip et',
    unfollow: 'Takibi bırak',
    hide: 'Gizle',
    unhide: 'Yeniden göster',
    hidden: 'Kaynak gizlendi. Bu kayıtlı yazı veya doğrudan bağlantı erişilebilir kalır.',
    missing: 'Geçerli yerel katalogda yok',
    clear: 'Kaynak seçimini temizle',
    clearQuestion:
      'Yalnızca kaynak seçimi temizlensin mi? İlgi alanları ve kayıtlı yazılar korunacak.',
    saved: 'Kaynak seçimi kaydedildi.',
    failed: 'Değişiklik doğrulanamadı. Yeniden denemeden önce kaynak seçimini yeniden yükleyin.',
    protected:
      'Kayıtlı seçim bilinmeyen veya bozuk bir biçimde. Veriler korunuyor; kaynak filtreleme duraklatıldı.',
    unavailable: 'Kaynak seçimi kullanılamıyor. Kaynak filtreleme duraklatıldı.',
    empty: 'Takip edilen veya gizlenen kaynak yok.',
  },
};
export const getSourcePreferencesCopy = (language: UiLanguage): SourcePreferencesCopy =>
  entries[language];
