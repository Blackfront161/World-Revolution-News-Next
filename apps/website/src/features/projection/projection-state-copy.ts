import type { UiLanguage } from '@wrn/ui-language';
const states = {
  en: [
    'Saved snapshot; live freshness is unconfirmed.',
    'Offline: saved snapshot; originals need a connection.',
    'Refresh unconfirmed: showing the reviewed saved snapshot.',
    'Bound snapshot checked on the server; check its publication date.',
    'Withdrawal safety could not be verified. Directory links are blocked.',
  ],
  de: [
    'Gespeicherter Stand; Live-Aktualität ist unbestätigt.',
    'Offline: gespeicherter Stand; Originalseiten benötigen eine Verbindung.',
    'Aktualisierung unbestätigt: der geprüfte gespeicherte Stand wird gezeigt.',
    'Gebundener Stand am Server geprüft; Veröffentlichungsdatum beachten.',
    'Widerrufssicherheit nicht bestätigt. Verzeichnislinks sind gesperrt.',
  ],
  es: [
    'Copia guardada; actualidad en vivo sin confirmar.',
    'Sin conexión: copia guardada; los originales requieren conexión.',
    'Actualización sin confirmar: se muestra la copia revisada.',
    'Copia vinculada verificada en el servidor; consulte la fecha.',
    'No se pudieron verificar las retiradas. Enlaces bloqueados.',
  ],
  fr: [
    'Copie enregistrée; actualité en direct non confirmée.',
    'Hors ligne: copie enregistrée; les originaux nécessitent une connexion.',
    'Actualisation non confirmée: affichage de la copie examinée.',
    'Copie liée vérifiée sur le serveur; consultez sa date.',
    'Retraits non vérifiés. Les liens sont bloqués.',
  ],
  it: [
    'Copia salvata; aggiornamento dal vivo non confermato.',
    'Offline: copia salvata; gli originali richiedono una connessione.',
    'Aggiornamento non confermato: copia verificata salvata.',
    'Copia collegata verificata sul server; controllare la data.',
    'Revoche non verificate. Collegamenti bloccati.',
  ],
  pt: [
    'Cópia guardada; atualidade ao vivo não confirmada.',
    'Sem ligação: cópia guardada; os originais precisam de ligação.',
    'Atualização não confirmada: cópia revista guardada.',
    'Cópia vinculada verificada no servidor; consulte a data.',
    'Revogações não verificadas. Ligações bloqueadas.',
  ],
  ru: [
    'Сохранённая копия; актуальность в сети не подтверждена.',
    'Нет сети: сохранённая копия; оригиналам нужно подключение.',
    'Обновление не подтверждено: показана проверенная сохранённая копия.',
    'Связанная копия проверена на сервере; смотрите дату публикации.',
    'Отзыв материалов не проверен. Ссылки заблокированы.',
  ],
  el: [
    'Αποθηκευμένο στιγμιότυπο· η τρέχουσα κατάσταση δεν επιβεβαιώθηκε.',
    'Εκτός σύνδεσης: αποθηκευμένο στιγμιότυπο· τα πρωτότυπα χρειάζονται σύνδεση.',
    'Μη επιβεβαιωμένη ενημέρωση: εμφανίζεται το ελεγμένο αποθηκευμένο στιγμιότυπο.',
    'Δεσμευμένο στιγμιότυπο ελεγμένο στον διακομιστή· δείτε την ημερομηνία.',
    'Οι ανακλήσεις δεν επαληθεύτηκαν. Οι σύνδεσμοι αποκλείστηκαν.',
  ],
  tr: [
    'Kayıtlı anlık görüntü; canlı güncellik doğrulanmadı.',
    'Çevrimdışı: kayıtlı görüntü; özgün sayfalar bağlantı gerektirir.',
    'Güncelleme doğrulanmadı: incelenmiş kayıtlı görüntü gösteriliyor.',
    'Bağlı görüntü sunucuda doğrulandı; yayın tarihine bakın.',
    'Geri çekmeler doğrulanamadı. Dizin bağlantıları engellendi.',
  ],
} satisfies Record<UiLanguage, readonly string[]>;
export function projectionStateCopy(language: UiLanguage, state = 'saved') {
  const index = [
    'saved',
    'offline',
    'refresh-unconfirmed',
    'bound-live',
    'safety-unavailable',
  ].indexOf(state);
  return states[language][Math.max(0, index)];
}
export function projectionAvailableCopy(language: UiLanguage) {
  return {
    en: 'Available original links',
    de: 'Verfügbare Originallinks',
    es: 'Enlaces originales disponibles',
    fr: 'Liens originaux disponibles',
    it: 'Collegamenti originali disponibili',
    pt: 'Ligações originais disponíveis',
    ru: 'Доступные ссылки на оригиналы',
    el: 'Διαθέσιμοι σύνδεσμοι πρωτοτύπων',
    tr: 'Kullanılabilir özgün bağlantılar',
  }[language];
}
