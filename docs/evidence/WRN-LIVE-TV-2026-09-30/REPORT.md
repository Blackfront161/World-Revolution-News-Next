# Live-TV in App und Website

Auftrag: kostenlose passende Live-TV-Angebote ergänzen. Lokaler Quellenpass am
30.09.2026 (Asia/Singapore), Beobachtung am 29.09.2026 gegen 22:24 UTC.

Aufnahme als Quellenverzeichnis mit selbst verfassten Kurzbeschreibungen und
offiziellen HTTPS-Originallinks, nicht als freigegebener Medienfeed. Keine
politische Zuschreibung als anarchistische Sender, keine pauschale Freigabe
ihres gesamten Programms. Die bestehende Darstellung bleibt erhalten.

| Angebot | Primärbeleg und Beobachtung | Grenze |
| --- | --- | --- |
| Democracy Now! | [Selbstbeschreibung](https://www.democracynow.org/about): gemeinnützige unabhängige Nachrichten, keine Werbung oder Regierungsfinanzierung. [Senderinformationen](https://www.democracynow.org/about/broadcasters/current): werktags 08:00–08:59 Eastern Time. [Livesendung](https://www.democracynow.org/live/todays_democracy_now): offizieller Player und Zeitangabe im Browser erreichbar. | Livesendung, kein 24-Stunden-Sender. Kostenlose Bereitstellung für Sender ersetzt keine WRN-spezifische Einbettungsfreigabe. |
| Barricada TV | [Offizielles Blogangebot](https://barricadatv.blogspot.com/): aktuelle Beiträge vom 28.09.2026, Abschnitt „BARRICADA TV EN VIVO“ mit Player, Herausgeber Asoc. sin fines de lucro Trabajo, Educación y Cultura. | Eigene populäre/selbstverwaltete Perspektive. Blog-CC-Lizenz nicht pauschal auf alle Live-Inhalte übertragen. Alter Live-Navigationslink verwendet HTTP; verlinkt wird ausschließlich das offizielle HTTPS-Blog mit Live-Abschnitt. Signalwiedergabe nicht bestätigt. |
| FS1 | [FAQ](https://fs1.tv/fragen-faq/): Trägerschaft Zivilgesellschaft, keine Parteikontrolle, weltweiter Internet-Livestream. [Modell](https://fs1.tv/schaltdichein/): nichtkommerziell, werbefrei und öffentlich gefördert. [Homepage](https://fs1.tv/): aktueller Programmplan vom 30.09.2026; nach Play im Browser „Pause“ und „Stream Type LIVE“. | Angrenzendes Community-TV, öffentliche Förderung transparent. [Nutzungsbedingungen](https://fs1.tv/nutzungsbedingungen/) betreffen Rechte der Produzierenden an FS1, keine allgemeine WRN-Einbettungserlaubnis. |
| Abajo e’ la Línea | [Offizielle Homepage](https://abajoelalinea.cl/): Selbstbeschreibung als selbstverwaltetes Community-TV in Temuco, Lokalnachrichten, Sport und Mapuche-Kultur; Live-Player vorhanden. | Player bei Stichprobe ohne geladenes Videosignal (readyState 0, videoWidth 0). Verfügbarkeit ausdrücklich unbestätigt, keine „Jetzt live“-Behauptung. |

Alle vier Einträge öffnen ausschließlich das Originalangebot nach dem bestehenden
Consent. Keine Bilder, Player, Audios oder Videos werden importiert, vorab geladen,
eingebettet oder offline gespeichert. Kein Proxy, keine extrahierten Stream-URLs.
Originalsprache bleibt sichtbar; keine automatische Videoübersetzung behauptet.

Free Speech TV wurde untersucht, aber nicht in dieses Paket aufgenommen: das
[Live-Programm](https://freespeech.org/live-tv/) enthält auch übernommene Angebote
wie Al Jazeera English; die Eignung des Gesamtprogramms ist damit nicht pauschal
belegt. Weitere Sender können separat nach denselben Kriterien ergänzt werden.

## Ergebnis und Prüfung

Vier Einträge stehen im gemeinsamen Medienbereich beider Clients zur Verfügung,
auch während Laden/Fehler historischer Metadaten. Bestehende Quellen und Inhalte
bleiben erhalten. Neun Oberflächensprachen; keine CSS-/Designänderung.

Prüfung: Website 196 Vitest- und 71 Node-Tests bestanden; finale Live-TV-Prüfung
12/12, Medienregression 15/15 und Mobile-Medien/Terminregression 13/13, beide
Client-Typprüfungen und Builds bestanden.
Finaler Website-Offline-Shell: 8.372.929 Bytes, unveränderte Grenze 8 MiB.
Formatprüfung und git diff --check bestanden. Unabhängiger Controller: PASS.

Browser App 5180 und Website 8766: je vier Karten, null Senderanfragen vor dem
Öffnen, keine Bilder/Audio/Video/Iframes oder direkten Links in den TV-Karten.
Consent mit HTTPS und noopener/noreferrer/no-referrer; Abbruch gibt Fokus zum
Auslöser zurück. Termine ohne TV-Karten. Kein Überlauf bei 390, 820 und 1440
Pixeln in den repräsentativen Ansichten. Finale Vorschauen app-390.png und
website-1440.png im Paket; zugehöriges Hashmanifest SHA256SUMS.txt.

Lokale Umsetzung abgeschlossen, keine Live-Veröffentlichung, keine neue native
Signierung oder Installation. Direkte Wiedergabe innerhalb von WRN bleibt ohne
bestätigte Einbettungsrechte offen. Abajo und Barricada sind sichtbar als aktuell
unbestätigte Signale gekennzeichnet; Verzeichnisaufnahme ist keine Feed-Freigabe.
