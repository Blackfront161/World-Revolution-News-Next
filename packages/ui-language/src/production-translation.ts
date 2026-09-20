import type { UiLanguage } from './index';

export type ProductionTranslationCopy = Readonly<{
  action: string;
  disclosure: string;
  loading: string;
  offline: string;
  timeout: string;
  error: string;
  discarded: string;
  sameLanguage: string;
  unavailable: string;
  translatedLabel: string;
  provenance: string;
  retry: string;
}>;
const entries: Readonly<Record<UiLanguage, ProductionTranslationCopy>> = {
  de: {
    action: 'Diesen Absatz übersetzen',
    disclosure:
      'Nur der gewählte öffentliche Absatz und die Ausgangs- und Zielsprache werden an den WRN-Übersetzungsdienst gesendet.',
    loading: 'Übersetzung wird geladen.',
    offline: 'Offline: Das Original bleibt lesbar.',
    timeout: 'Die Übersetzung hat zu lange gedauert.',
    error: 'Die Übersetzung ist fehlgeschlagen.',
    discarded: 'Die Übersetzung ist nicht mehr gültig.',
    sameLanguage: 'Dieser Absatz ist bereits in der gewählten Sprache.',
    unavailable: 'Die Absatzübersetzung ist derzeit nicht verfügbar.',
    translatedLabel: 'Maschinelle Übersetzung · {language}',
    provenance: 'Übersetzungsdienst: {provider}',
    retry: 'Erneut übersetzen',
  },
  en: {
    action: 'Translate this paragraph',
    disclosure:
      'Only the selected public paragraph and its source and target languages are sent to the WRN translation service.',
    loading: 'Loading translation.',
    offline: 'Offline: the original remains readable.',
    timeout: 'The translation took too long.',
    error: 'The translation failed.',
    discarded: 'The translation is no longer valid.',
    sameLanguage: 'This paragraph is already in the selected language.',
    unavailable: 'Paragraph translation is currently unavailable.',
    translatedLabel: 'Machine translation · {language}',
    provenance: 'Translation service: {provider}',
    retry: 'Translate again',
  },
  es: {
    action: 'Traducir este párrafo',
    disclosure:
      'Solo se envían al servicio de traducción de WRN el párrafo público seleccionado y los idiomas de origen y destino.',
    loading: 'Cargando traducción.',
    offline: 'Sin conexión: el original sigue disponible.',
    timeout: 'La traducción ha tardado demasiado.',
    error: 'La traducción ha fallado.',
    discarded: 'La traducción ya no es válida.',
    sameLanguage: 'Este párrafo ya está en el idioma seleccionado.',
    unavailable: 'La traducción de párrafos no está disponible actualmente.',
    translatedLabel: 'Traducción automática · {language}',
    provenance: 'Servicio de traducción: {provider}',
    retry: 'Traducir de nuevo',
  },
  fr: {
    action: 'Traduire ce paragraphe',
    disclosure:
      'Seuls le paragraphe public sélectionné et les langues source et cible sont envoyés au service de traduction WRN.',
    loading: 'Chargement de la traduction.',
    offline: 'Hors connexion : le texte original reste lisible.',
    timeout: 'La traduction a pris trop de temps.',
    error: 'La traduction a échoué.',
    discarded: 'La traduction n’est plus valide.',
    sameLanguage: 'Ce paragraphe est déjà dans la langue sélectionnée.',
    unavailable: 'La traduction de paragraphes est actuellement indisponible.',
    translatedLabel: 'Traduction automatique · {language}',
    provenance: 'Service de traduction : {provider}',
    retry: 'Traduire à nouveau',
  },
  it: {
    action: 'Traduci questo paragrafo',
    disclosure:
      'Al servizio di traduzione WRN vengono inviati solo il paragrafo pubblico selezionato e le lingue di origine e destinazione.',
    loading: 'Caricamento della traduzione.',
    offline: 'Offline: il testo originale resta leggibile.',
    timeout: 'La traduzione ha richiesto troppo tempo.',
    error: 'La traduzione non è riuscita.',
    discarded: 'La traduzione non è più valida.',
    sameLanguage: 'Questo paragrafo è già nella lingua selezionata.',
    unavailable: 'La traduzione dei paragrafi non è attualmente disponibile.',
    translatedLabel: 'Traduzione automatica · {language}',
    provenance: 'Servizio di traduzione: {provider}',
    retry: 'Traduci di nuovo',
  },
  pt: {
    action: 'Traduzir este parágrafo',
    disclosure:
      'Apenas o parágrafo público selecionado e os idiomas de origem e destino são enviados ao serviço de tradução WRN.',
    loading: 'A carregar a tradução.',
    offline: 'Sem ligação: o original continua legível.',
    timeout: 'A tradução demorou demasiado.',
    error: 'A tradução falhou.',
    discarded: 'A tradução já não é válida.',
    sameLanguage: 'Este parágrafo já está no idioma selecionado.',
    unavailable: 'A tradução de parágrafos está indisponível de momento.',
    translatedLabel: 'Tradução automática · {language}',
    provenance: 'Serviço de tradução: {provider}',
    retry: 'Traduzir novamente',
  },
  ru: {
    action: 'Перевести этот абзац',
    disclosure:
      'В службу перевода WRN отправляются только выбранный общедоступный абзац и языки оригинала и перевода.',
    loading: 'Загрузка перевода.',
    offline: 'Нет сети: оригинал остаётся доступным.',
    timeout: 'Время ожидания перевода истекло.',
    error: 'Не удалось перевести текст.',
    discarded: 'Перевод больше не действителен.',
    sameLanguage: 'Этот абзац уже на выбранном языке.',
    unavailable: 'Перевод абзацев сейчас недоступен.',
    translatedLabel: 'Машинный перевод · {language}',
    provenance: 'Служба перевода: {provider}',
    retry: 'Перевести ещё раз',
  },
  el: {
    action: 'Μετάφραση αυτής της παραγράφου',
    disclosure:
      'Στην υπηρεσία μετάφρασης WRN αποστέλλονται μόνο η επιλεγμένη δημόσια παράγραφος και οι γλώσσες προέλευσης και προορισμού.',
    loading: 'Φόρτωση μετάφρασης.',
    offline: 'Εκτός σύνδεσης: το πρωτότυπο παραμένει διαθέσιμο.',
    timeout: 'Η μετάφραση άργησε πολύ.',
    error: 'Η μετάφραση απέτυχε.',
    discarded: 'Η μετάφραση δεν είναι πλέον έγκυρη.',
    sameLanguage: 'Αυτή η παράγραφος είναι ήδη στην επιλεγμένη γλώσσα.',
    unavailable: 'Η μετάφραση παραγράφων δεν είναι προς το παρόν διαθέσιμη.',
    translatedLabel: 'Αυτόματη μετάφραση · {language}',
    provenance: 'Υπηρεσία μετάφρασης: {provider}',
    retry: 'Νέα μετάφραση',
  },
  tr: {
    action: 'Bu paragrafı çevir',
    disclosure:
      'WRN çeviri hizmetine yalnızca seçilen herkese açık paragraf ile kaynak ve hedef diller gönderilir.',
    loading: 'Çeviri yükleniyor.',
    offline: 'Çevrimdışı: özgün metin okunabilir durumda.',
    timeout: 'Çeviri çok uzun sürdü.',
    error: 'Çeviri başarısız oldu.',
    discarded: 'Çeviri artık geçerli değil.',
    sameLanguage: 'Bu paragraf zaten seçilen dilde.',
    unavailable: 'Paragraf çevirisi şu anda kullanılamıyor.',
    translatedLabel: 'Makine çevirisi · {language}',
    provenance: 'Çeviri hizmeti: {provider}',
    retry: 'Yeniden çevir',
  },
};
export function getProductionTranslationCopy(language: UiLanguage): ProductionTranslationCopy {
  return entries[language];
}
