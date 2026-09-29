import type { ReactNode } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import { liveTvSourceLinks, type LiveTvSourceLink } from './live-tv-source-links';

type CardCopy = Readonly<{ kind: string; description: string }>;
type LiveTvCopy = Readonly<{
  heading: string;
  note: string;
  cards: Readonly<Record<LiveTvSourceLink['copyKey'], CardCopy>>;
}>;

const copy: Readonly<Record<UiLanguage, LiveTvCopy>> = {
  en: {
    heading: 'Live TV & programmes',
    note: 'Free live offerings on official publisher pages. Check schedules and availability with the provider. Playback is in the original language; external pages open only after your confirmation.',
    cards: {
      democracyNow: {
        kind: 'News programme',
        description: 'Weekdays 08:00–08:59 America/New_York; confirm the schedule at the source.',
      },
      barricada: {
        kind: 'Community TV',
        description:
          'Nonprofit, self-managed community television from Buenos Aires. Current signal availability is unconfirmed.',
      },
      abajo: {
        kind: 'Community channel',
        description:
          'Self-managed channel from Temuco covering sport, Mapuche culture and local news. Current signal availability is unconfirmed.',
      },
      fs1: {
        kind: 'Civil-society TV',
        description: 'Noncommercial and ad-free television from Salzburg with public funding.',
      },
    },
  },
  de: {
    heading: 'Live-TV & Live-Sendungen',
    note: 'Kostenfreie Live-Angebote auf den offiziellen Seiten. Sendezeiten und Verfügbarkeit findest du beim Anbieter. Wiedergabe in Originalsprache; externe Seiten öffnen sich erst nach deiner Bestätigung.',
    cards: {
      democracyNow: {
        kind: 'Nachrichtensendung',
        description: 'Werktags 08:00–08:59 America/New_York; Sendezeit bei der Quelle prüfen.',
      },
      barricada: {
        kind: 'Gemeinschaftsfernsehen',
        description:
          'Gemeinnütziges, selbstverwaltetes Gemeinschaftsfernsehen aus Buenos Aires. Die aktuelle Signalverfügbarkeit ist unbestätigt.',
      },
      abajo: {
        kind: 'Gemeinschaftskanal',
        description:
          'Selbstverwalteter Kanal aus Temuco mit Sport, Mapuche-Kultur und lokalen Nachrichten. Die aktuelle Signalverfügbarkeit ist unbestätigt.',
      },
      fs1: {
        kind: 'Zivilgesellschaftliches Fernsehen',
        description:
          'Nichtkommerzielles, werbefreies Fernsehen aus Salzburg mit öffentlicher Förderung.',
      },
    },
  },
  es: {
    heading: 'TV en directo y programas',
    note: 'Ofertas gratuitas en directo en las páginas oficiales. Consulta horarios y disponibilidad con el proveedor. Reproducción en idioma original; las páginas externas solo se abren tras tu confirmación.',
    cards: {
      democracyNow: {
        kind: 'Programa informativo',
        description:
          'Días laborables, 08:00–08:59 America/New_York; confirma el horario en la fuente.',
      },
      barricada: {
        kind: 'Televisión comunitaria',
        description:
          'Televisión comunitaria sin fines de lucro y autogestionada de Buenos Aires. La disponibilidad actual de la señal no está confirmada.',
      },
      abajo: {
        kind: 'Canal comunitario',
        description:
          'Canal autogestionado de Temuco sobre deporte, cultura mapuche y noticias locales. La disponibilidad actual de la señal no está confirmada.',
      },
      fs1: {
        kind: 'Televisión de la sociedad civil',
        description:
          'Televisión no comercial y sin publicidad de Salzburgo con financiación pública.',
      },
    },
  },
  fr: {
    heading: 'Télévision en direct et émissions',
    note: 'Offres gratuites en direct sur les pages officielles. Vérifiez les horaires et la disponibilité auprès du diffuseur. Lecture en langue originale ; les pages externes ne s’ouvrent qu’après votre confirmation.',
    cards: {
      democracyNow: {
        kind: 'Émission d’information',
        description:
          'En semaine, de 08:00 à 08:59 America/New_York ; vérifiez l’horaire à la source.',
      },
      barricada: {
        kind: 'Télévision communautaire',
        description:
          'Télévision communautaire à but non lucratif et autogérée de Buenos Aires. La disponibilité actuelle du signal n’est pas confirmée.',
      },
      abajo: {
        kind: 'Chaîne communautaire',
        description:
          'Chaîne autogérée de Temuco consacrée au sport, à la culture mapuche et aux nouvelles locales. La disponibilité actuelle du signal n’est pas confirmée.',
      },
      fs1: {
        kind: 'Télévision citoyenne',
        description:
          'Télévision non commerciale et sans publicité de Salzbourg bénéficiant d’un financement public.',
      },
    },
  },
  it: {
    heading: 'TV in diretta e programmi',
    note: 'Offerte gratuite in diretta sulle pagine ufficiali. Verifica orari e disponibilità presso l’emittente. Riproduzione in lingua originale; le pagine esterne si aprono solo dopo la tua conferma.',
    cards: {
      democracyNow: {
        kind: 'Programma di notizie',
        description:
          'Nei giorni feriali, 08:00–08:59 America/New_York; verifica l’orario alla fonte.',
      },
      barricada: {
        kind: 'TV comunitaria',
        description:
          'Televisione comunitaria senza scopo di lucro e autogestita di Buenos Aires. La disponibilità attuale del segnale non è confermata.',
      },
      abajo: {
        kind: 'Canale comunitario',
        description:
          'Canale autogestito di Temuco su sport, cultura mapuche e notizie locali. La disponibilità attuale del segnale non è confermata.',
      },
      fs1: {
        kind: 'TV della società civile',
        description:
          'Televisione non commerciale e senza pubblicità di Salisburgo con finanziamenti pubblici.',
      },
    },
  },
  pt: {
    heading: 'TV ao vivo e programas',
    note: 'Ofertas gratuitas ao vivo nas páginas oficiais. Confirme horários e disponibilidade com o emissor. Reprodução no idioma original; as páginas externas só se abrem após a sua confirmação.',
    cards: {
      democracyNow: {
        kind: 'Programa noticioso',
        description: 'Dias úteis, 08:00–08:59 America/New_York; confirme o horário na fonte.',
      },
      barricada: {
        kind: 'TV comunitária',
        description:
          'Televisão comunitária sem fins lucrativos e autogerida de Buenos Aires. A disponibilidade atual do sinal não está confirmada.',
      },
      abajo: {
        kind: 'Canal comunitário',
        description:
          'Canal autogerido de Temuco sobre desporto, cultura mapuche e notícias locais. A disponibilidade atual do sinal não está confirmada.',
      },
      fs1: {
        kind: 'TV da sociedade civil',
        description:
          'Televisão não comercial e sem publicidade de Salzburgo com financiamento público.',
      },
    },
  },
  ru: {
    heading: 'Прямой эфир и передачи',
    note: 'Бесплатные прямые эфиры на официальных страницах. Уточняйте расписание и доступность у вещателя. Воспроизведение на языке оригинала; внешние страницы открываются только после вашего подтверждения.',
    cards: {
      democracyNow: {
        kind: 'Новостная передача',
        description: 'По будням, 08:00–08:59 America/New_York; уточняйте расписание у источника.',
      },
      barricada: {
        kind: 'Общественное телевидение',
        description:
          'Некоммерческое самоуправляемое общественное телевидение Буэнос-Айреса. Доступность сигнала сейчас не подтверждена.',
      },
      abajo: {
        kind: 'Общественный канал',
        description:
          'Самоуправляемый канал из Темуко о спорте, культуре мапуче и местных новостях. Доступность сигнала сейчас не подтверждена.',
      },
      fs1: {
        kind: 'Гражданское телевидение',
        description:
          'Некоммерческое телевидение без рекламы из Зальцбурга при государственном финансировании.',
      },
    },
  },
  el: {
    heading: 'Ζωντανή τηλεόραση και εκπομπές',
    note: 'Δωρεάν ζωντανές προσφορές στις επίσημες σελίδες. Ελέγξτε ώρες και διαθεσιμότητα στον φορέα. Αναπαραγωγή στην αρχική γλώσσα· οι εξωτερικές σελίδες ανοίγουν μόνο μετά την επιβεβαίωσή σας.',
    cards: {
      democracyNow: {
        kind: 'Ενημερωτική εκπομπή',
        description:
          'Καθημερινές, 08:00–08:59 America/New_York· επιβεβαιώστε το πρόγραμμα στην πηγή.',
      },
      barricada: {
        kind: 'Κοινοτική τηλεόραση',
        description:
          'Μη κερδοσκοπική, αυτοδιαχειριζόμενη κοινοτική τηλεόραση από το Μπουένος Άιρες. Η τρέχουσα διαθεσιμότητα σήματος δεν έχει επιβεβαιωθεί.',
      },
      abajo: {
        kind: 'Κοινοτικό κανάλι',
        description:
          'Αυτοδιαχειριζόμενο κανάλι από το Τεμούκο για αθλητισμό, πολιτισμό Μαπούτσε και τοπικές ειδήσεις. Η τρέχουσα διαθεσιμότητα σήματος δεν έχει επιβεβαιωθεί.',
      },
      fs1: {
        kind: 'Τηλεόραση της κοινωνίας των πολιτών',
        description:
          'Μη εμπορική τηλεόραση χωρίς διαφημίσεις από το Σάλτσμπουργκ με δημόσια χρηματοδότηση.',
      },
    },
  },
  tr: {
    heading: 'Canlı TV ve programlar',
    note: 'Resmî sayfalardaki ücretsiz canlı yayınlar. Saatleri ve erişilebilirliği yayıncıdan kontrol edin. Oynatma özgün dilindedir; dış sayfalar yalnızca onayınızdan sonra açılır.',
    cards: {
      democracyNow: {
        kind: 'Haber programı',
        description: 'Hafta içi 08:00–08:59 America/New_York; yayın saatini kaynaktan doğrulayın.',
      },
      barricada: {
        kind: 'Topluluk televizyonu',
        description:
          'Buenos Aires merkezli, kâr amacı gütmeyen ve öz yönetimli topluluk televizyonu. Sinyalin şu anki erişilebilirliği doğrulanmadı.',
      },
      abajo: {
        kind: 'Topluluk kanalı',
        description:
          'Temuco merkezli, spor, Mapuçe kültürü ve yerel haberlere odaklanan öz yönetimli kanal. Sinyalin şu anki erişilebilirliği doğrulanmadı.',
      },
      fs1: {
        kind: 'Sivil toplum televizyonu',
        description:
          'Salzburg merkezli, kamu fonuyla desteklenen, ticari olmayan ve reklamsız televizyon.',
      },
    },
  },
};

export function LiveTvSources({
  language,
  headingLevel,
  renderOriginalLink,
}: {
  language: UiLanguage;
  headingLevel: 1 | 2;
  renderOriginalLink: (url: string) => ReactNode;
}) {
  const Heading = headingLevel === 1 ? 'h2' : 'h3';
  const CardHeading = headingLevel === 1 ? 'h3' : 'h4';
  const text = copy[language];
  return (
    <section className="events-media-additional-sources" aria-label={text.heading}>
      <Heading>{text.heading}</Heading>
      <p>{text.note}</p>
      <ul>
        {liveTvSourceLinks.map((source) => (
          <li key={source.id} data-live-tv-source={source.id}>
            <CardHeading lang={source.language}>{source.name}</CardHeading>
            <p>
              {text.cards[source.copyKey].kind} · {source.location} ·{' '}
              {source.language.toUpperCase()}
            </p>
            <p>{text.cards[source.copyKey].description}</p>
            {renderOriginalLink(source.originalUrl)}
          </li>
        ))}
      </ul>
    </section>
  );
}
