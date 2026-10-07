import { useEffect, useRef, useState } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import {
  prisonerReviewState,
  websitePrisonerReview,
  type PrisonerReviewState,
} from './prisoner-review';

const copy = {
  de: {
    title: 'Öffentliche Unterstützungsangebote',
    intro: 'Originalverweise zu Buchhilfe, Unterstützungsnetzwerken und Stimmen aus Gefängnissen.',
    match: 'Datierter Adressabgleich',
    pending: 'Erneute Prüfung erforderlich',
    expired: 'Prüffrist abgelaufen',
    checked: 'Geprüft',
    until: 'Erneut prüfen bis',
    limit:
      'Der Adressabgleich bestätigt weder den Haftstatus noch die Zulässigkeit eines Briefversands.',
    evidence: 'Beleg des Adressabgleichs',
    edition: 'NYC-ABC-Beitrag: Guide 19.8; verknüpfte PDF: Edition 19.9.',
    page: 'PDF-Seite',
  },
  en: {
    title: 'Public support resources',
    intro: 'Original links to book support, support networks and voices from prisons.',
    match: 'Dated address match',
    pending: 'Further review required',
    expired: 'Review deadline passed',
    checked: 'Reviewed',
    until: 'Review again by',
    limit: 'The address match confirms neither custody status nor permission to send mail.',
    evidence: 'Address-match evidence',
    edition: 'NYC ABC post: Guide 19.8; linked PDF: Edition 19.9.',
    page: 'PDF page',
  },
  es: {
    title: 'Recursos públicos de apoyo',
    intro:
      'Enlaces originales a apoyo con libros, redes de solidaridad y voces desde las prisiones.',
    match: 'Cotejo de dirección fechado',
    pending: 'Se requiere una nueva revisión',
    expired: 'Plazo de revisión vencido',
    checked: 'Revisado',
    until: 'Revisar de nuevo antes del',
    limit:
      'El cotejo de dirección no confirma la situación de detención ni el permiso para enviar cartas.',
    evidence: 'Evidencia del cotejo',
    edition: 'Publicación de NYC ABC: guía 19.8; PDF enlazado: edición 19.9.',
    page: 'Página del PDF',
  },
  fr: {
    title: 'Ressources publiques de soutien',
    intro: 'Liens originaux vers l’aide en livres, les réseaux de soutien et les voix des prisons.',
    match: 'Vérification datée de l’adresse',
    pending: 'Nouvelle vérification requise',
    expired: 'Délai de vérification dépassé',
    checked: 'Vérifié',
    until: 'À vérifier de nouveau avant le',
    limit:
      'La concordance de l’adresse ne confirme ni la situation de détention ni l’autorisation d’envoyer du courrier.',
    evidence: 'Preuve de concordance de l’adresse',
    edition: 'Publication de NYC ABC : guide 19.8 ; PDF lié : édition 19.9.',
    page: 'Page du PDF',
  },
  it: {
    title: 'Risorse pubbliche di sostegno',
    intro: 'Link originali per il sostegno con libri, le reti solidali e le voci dalle carceri.',
    match: 'Confronto dell’indirizzo datato',
    pending: 'È necessaria una nuova verifica',
    expired: 'Termine di verifica scaduto',
    checked: 'Verificato',
    until: 'Verificare nuovamente entro il',
    limit:
      'Il confronto dell’indirizzo non conferma né lo stato di detenzione né il permesso di inviare lettere.',
    evidence: 'Prova del confronto dell’indirizzo',
    edition: 'Articolo NYC ABC: guida 19.8; PDF collegato: edizione 19.9.',
    page: 'Pagina PDF',
  },
  pt: {
    title: 'Recursos públicos de apoio',
    intro: 'Links originais para apoio com livros, redes de solidariedade e vozes das prisões.',
    match: 'Conferência de endereço datada',
    pending: 'É necessária uma nova revisão',
    expired: 'Prazo de revisão vencido',
    checked: 'Revisto',
    until: 'Rever novamente até',
    limit:
      'A conferência do endereço não confirma a situação de detenção nem a autorização para enviar cartas.',
    evidence: 'Evidência da conferência do endereço',
    edition: 'Publicação NYC ABC: guia 19.8; PDF vinculado: edição 19.9.',
    page: 'Página do PDF',
  },
  ru: {
    title: 'Открытые ресурсы поддержки',
    intro: 'Оригинальные ссылки на помощь книгами, сети солидарности и голоса из тюрем.',
    match: 'Датированная сверка адреса',
    pending: 'Требуется повторная проверка',
    expired: 'Срок проверки истёк',
    checked: 'Проверено',
    until: 'Повторно проверить до',
    limit: 'Сверка адреса не подтверждает статус заключения или разрешение на отправку писем.',
    evidence: 'Основание сверки адреса',
    edition: 'Публикация NYC ABC: руководство 19.8; связанный PDF: издание 19.9.',
    page: 'Страница PDF',
  },
  el: {
    title: 'Δημόσιοι πόροι υποστήριξης',
    intro: 'Αρχικοί σύνδεσμοι για βοήθεια με βιβλία, δίκτυα αλληλεγγύης και φωνές από τις φυλακές.',
    match: 'Χρονολογημένη αντιπαραβολή διεύθυνσης',
    pending: 'Απαιτείται νέος έλεγχος',
    expired: 'Η προθεσμία ελέγχου έληξε',
    checked: 'Ελέγχθηκε',
    until: 'Νέος έλεγχος έως',
    limit:
      'Η αντιπαραβολή της διεύθυνσης δεν επιβεβαιώνει την κατάσταση κράτησης ή την άδεια αποστολής επιστολών.',
    evidence: 'Τεκμήριο αντιπαραβολής διεύθυνσης',
    edition: 'Ανάρτηση NYC ABC: οδηγός 19.8· συνδεδεμένο PDF: έκδοση 19.9.',
    page: 'Σελίδα PDF',
  },
  tr: {
    title: 'Kamusal destek kaynakları',
    intro: 'Kitap desteği, dayanışma ağları ve hapishanelerden sesler için özgün bağlantılar.',
    match: 'Tarihli adres karşılaştırması',
    pending: 'Yeniden inceleme gerekli',
    expired: 'İnceleme süresi doldu',
    checked: 'İncelendi',
    until: 'Yeniden inceleme için son tarih',
    limit: 'Adres karşılaştırması, tutukluluk durumunu veya mektup gönderme iznini doğrulamaz.',
    evidence: 'Adres karşılaştırmasının dayanağı',
    edition: 'NYC ABC yazısı: rehber 19.8; bağlantılı PDF: baskı 19.9.',
    page: 'PDF sayfası',
  },
} as const;

export function useWebsitePrisonerReviewClock() {
  const [now, setNow] = useState(() => new Date());
  const expired = useRef(new Set<string>());
  useEffect(() => {
    let timer: number;
    const refresh = () => {
      const current = new Date();
      setNow(current);
      const midnight = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
      const delay = midnight.getTime() - current.getTime();
      timer = window.setTimeout(refresh, Number.isFinite(delay) ? Math.max(1, delay + 20) : 60_000);
    };
    const awaken = () => {
      window.clearTimeout(timer);
      refresh();
    };
    refresh();
    window.addEventListener('focus', awaken);
    document.addEventListener('visibilitychange', awaken);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', awaken);
      document.removeEventListener('visibilitychange', awaken);
    };
  }, []);
  const states = new Map(
    websitePrisonerReview.profiles.map((p) => [p.id, prisonerReviewState(p, now, expired.current)]),
  );
  return states;
}

export function PrisonerSupportLinks({ language }: { language: UiLanguage }) {
  const c = copy[language];
  return (
    <section className="website-prisoner-resources" aria-labelledby="prisoner-resources-title">
      <h2 id="prisoner-resources-title">{c.title}</h2>
      <p>{c.intro}</p>
      <ul>
        {websitePrisonerReview.links.map((s) => (
          <li key={s.id} data-prisoner-support-link={s.id}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
              {s.name}
            </a>
            <small>
              {c.checked}: <time dateTime={s.checkedAt}>{s.checkedAt}</time>
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PrisonerReviewBadge({
  profileId,
  language,
  state,
}: {
  profileId: string;
  language: UiLanguage;
  state: PrisonerReviewState | undefined;
}) {
  const profile = websitePrisonerReview.profiles.find((p) => p.id === profileId);
  if (!profile || !state) return null;
  const c = copy[language];
  return (
    <div
      className="website-prisoner-review"
      data-prisoner-review-id={profileId}
      data-prisoner-review-state={state}
    >
      <p>
        <strong>
          {state === 'dated-address-match' ? c.match : state === 'expired' ? c.expired : c.pending}
        </strong>
      </p>
      {profile.status === 'dated-address-match' ? (
        <>
          <p>
            {c.checked}: <time dateTime={profile.verifiedAt}>{profile.verifiedAt}</time>; {c.until}:{' '}
            <time dateTime={profile.nextReviewAt}>{profile.nextReviewAt}</time>.
          </p>
          <p>{c.limit}</p>
          <details>
            <summary>{c.evidence}</summary>
            <p>{c.edition}</p>
            <p>
              {c.page}: {profile.evidence?.pdfPage}
            </p>
            <a
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
            >
              NYC ABC
            </a>
          </details>
        </>
      ) : null}
    </div>
  );
}
