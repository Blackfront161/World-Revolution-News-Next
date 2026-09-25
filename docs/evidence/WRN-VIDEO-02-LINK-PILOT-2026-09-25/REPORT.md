# VIDEO-02: kleiner Pilot für einzeln verlinkte Videos

Stand: 25. September 2026. Verantwortlich: `/root`.

App und Website zeigen nun neben dem unveränderten Verzeichnis der elf
angenommenen Videoquellen zwei ausdrücklich als Pilot gekennzeichnete Originalverweise mit
Sprachfilter: [„Klopp ANSAGE An AfD!“ von DerDaraUncut](https://www.youtube.com/shorts/3SUzjmdDORU)
und [„How Anarchy Works“ von Andrewism](https://www.youtube.com/watch?v=lrTzjaXskUU).
Original-URL, Titel und Kanalzuordnung wurden am 25.09.2026 auf den jeweiligen
YouTube-Seiten geprüft. Der Short ist als deutsch, das Erklärvideo als englisch
erfasst. DerDaraUncut wird nicht als anarchistischer Kanal eingeordnet.

| ID | Direkt reproduzierbarer Metadatenbeleg | Reichweite der Prüfung |
| --- | --- | --- |
| `3SUzjmdDORU` | YouTube-Kanonikaladresse `/shorts/3SUzjmdDORU`, `og:title` „Klopp ANSAGE An AfD!“, sichtbarer Kanal `@DerDaraUncut`, deutschsprachiger Titel und Kanalbeschreibung. | Format „Short“ folgt der Kanonikaladresse. Kein vollständiger Inhalts-/Faktencheck. |
| `lrTzjaXskUU` | YouTube-Kanonikaladresse `/watch?v=lrTzjaXskUU`, `og:title` „How Anarchy Works“, sichtbarer Link `Andrewism` → `/@Andrewism`, englische Beschreibung über Anarchie, Selbstbestimmung und Mutual Aid. | Längeres Erklärvideo laut Originalseite (53:25). Kein vollständiger Inhalts-/Faktencheck. |

Die Tabelle transkribiert am Prüftag sichtbare Originalseiten-Metadaten; die
verlinkten Originalseiten sind der reproduzierbare Primärbeleg. Das bisherige
Recherchepapier vom 09.09. belegt nur Kanäle, nicht diese zwei Videos. Nach
unabhängigem Review wurde die sichtbare Bezeichnung daher von „Ausgewählte
Videos“ zu „Video-Links im Pilot“ geändert und der fehlende Inhaltscheck in
allen neun UI-Sprachen direkt erklärt. `metadataCheckedOn` bezeichnet nur
Metadatenprüfung, keine redaktionelle Inhaltsfreigabe.

Die Karten laden weder Player noch Bild noch YouTube-Skript beim Listenaufruf.
Erst der bewusst geöffnete Originallink verlässt WRN; `noopener noreferrer` und
`no-referrer` bleiben gesetzt. Keine Medienkopie, Übersetzung, Untertitel-,
Verfügbarkeits-, Einbettungs- oder Offlinezusage. Die Prüfung des kompletten
Video-Inhalts und eine regelmäßige redaktionelle Einzelaufnahme stehen aus;
VIDEO-02 bleibt deshalb **in Arbeit**.

Prüfung: 39/39 Content-Contract-Unit-Tests, fokussierte ESLint-/Typprüfung,
beide Produktionsbuilds und Chunk-Gate bestanden. Website-Offline-Shell:
8.383.039 Byte unter 8 MiB. Die finalen repräsentativen 390px-Browserfälle
(Mobile und Website) bestanden mit neun Sprachfiltern, Tastaturbedienung, drei Themes,
Reflow, sicheren Links und null Drittrequests vor Klick. Die zunächst
fehlgeschlagene Testfassung suchte den Theme-Selector noch auf der Medienroute;
die korrigierte Fassung wechselt die Route mit Theme-Parameter und behält alle
Orakel bei. Der finale Lauf: 3/3 ausgeführte Browserfälle PASS, ein
website-seitig nicht anwendbarer Mobile-Home-Fall SKIP.

Sichtbelege: `mobile-de-violet.png` und `website-de-violet.png`.
Ein unabhängiger, rein lesender Abschlussreview fand M-001: fehlende gebundene
Einzelvideo-Admission bei der ursprünglichen Bezeichnung „Ausgewählte Videos“.
Die Pilotkennzeichnung und die Metadatenabgrenzung wurden erneut unabhängig
geprüft: **PASS für den Linkpilot; M-001 geschlossen.** Die Inhaltsaufnahme
bleibt weiterhin offen.

Die laufende Medienversorgung, mehrsprachige Einzelvideos, inhaltliche
Einzelprüfung, das Zine, die authentisierte Produktionsauslieferung und der
Play-interne Release-Test sind weiterhin offen.
