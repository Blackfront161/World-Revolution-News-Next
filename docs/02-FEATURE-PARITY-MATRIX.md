# Vorlaeufige Feature-Paritaetsmatrix

Status: Ausgangsmatrix fuer die read-only Baseline-Analyse

Regel: Kein Eintrag gilt allein aufgrund eines Dateinamens als vollstaendig
verifiziert. `CONFIRMED` bedeutet nur, dass die Uebergabe oder ein vorhandener
QA-Bericht die Funktion ausdruecklich belegt. Die laufende Oberflaeche muss
spaeter trotzdem visuell und funktional aufgenommen werden.

## Statuswerte

- `CONFIRMED`: durch Uebergabe/QA als vorhandene Baseline belegt
- `VERIFY`: in Dateien/Dokumenten sichtbar, Verhalten noch systematisch pruefen
- `KNOWN-ISSUE`: bekannte Abweichung oder Fehlerquelle
- `PRODUCT-DECISION`: Zielumfang braucht Freigabe des Product Owners
- `FUTURE`: nicht Teil von Migration Release 1

## A. Marke, Navigation und Darstellung

| ID | Faehigkeit | App-Baseline | Website-Baseline | Ziel fuer Migration Release 1 | Abnahme | Status |
|---|---|---|---|---|---|---|
| UX-01 | Solinaridao-/WRN-Header und aktive Bildmarke | aktive Mark/Mask-Kombination dokumentiert | eigene Web-Headerassets und kompakter Desktopheader | gemeinsame Brand-Tokens, plattformspezifisches Layout | Referenzvergleich in allen Viewports | CONFIRMED |
| UX-02 | Hauptnavigation und Tabs | bestehende mobile Navigation | eigenstaendige Web-/Desktopnavigation | Funktionsparitaet ohne erzwungene identische Navigation | alle Hauptziele erreichbar, keine Ueberlagerung | VERIFY |
| UX-03 | Responsive Smartphone | aktuelle App ist mobile Baseline | Reflow ab 320 px dokumentiert | 320/360/390/412 px ohne horizontalen Overflow | Screenshot- und Interaktionstest | CONFIRMED |
| UX-04 | Responsive Tablet | Verhalten noch aufzunehmen | Verhalten noch aufzunehmen | definierte Hoch-/Querformatlayouts | Screenshot- und Reflowtest | VERIFY |
| UX-05 | Responsive Desktop | nicht primaeres Appziel | 1024–1920 px und Zweispaltenraster dokumentiert | markenkonsistente Desktopoberflaeche | Screenshots 1024/1280/1440/1920 | CONFIRMED |
| UX-06 | Themes | Themepfade dokumentiert | Light-/weitere Theme-Dateien vorhanden | gleiche Semantik, getrennte Implementierung erlaubt | persistenter Wechsel, Kontrasttest | VERIFY |
| UX-07 | Schriftgroesse/Reflow | 200-%-Baseline zeigt ueberlappende Bottom-Nav-Beschriftungen bei 390 px | Normal/Gross/Sehr gross dokumentiert | keine Inhaltsverluste bei Vergroesserung | 200-%-Reflowaequivalent und Tastatur | KNOWN-ISSUE |
| UX-08 | Intro/Onboarding | Module vorhanden | Intro-Module vorhanden | Nutzen und Wiederanzeige mit Product Owner klaeren | visueller Flow und Persistenztest | PRODUCT-DECISION |

## B. News, Artikel und Herkunft

| ID | Faehigkeit | App-Baseline | Website-Baseline | Ziel fuer Migration Release 1 | Abnahme | Status |
|---|---|---|---|---|---|---|
| NEWS-01 | Newsfeed | mehrsprachiger Feed dokumentiert | produktiver Feed und Snapshots | gleiche Inhaltsvertraege, geeignete Plattformdarstellung | Contract-, Lade- und Screenshottest | CONFIRMED |
| NEWS-02 | Suche und Filter | Themen, Regionen, Quellen, Sprache, Format | Filtermodule vorhanden | alle freigegebenen Filter erhalten | Ergebnismatrix und Resettest | VERIFY |
| NEWS-03 | Artikelansicht | Dialog/Detailansicht vorhanden | Dialog plus statische Landingpages | vollstaendiger Inhalt, sichere externe Links | Deep-Link-, Reader- und Tastaturtest | CONFIRMED |
| NEWS-04 | Vollstaendiger erster Satz | vertraglich getestet | Desktop-QA bestaetigt | keine willkuerliche Ellipsen-Kuerzung | Segmenter- und Fallbacktests | CONFIRMED |
| NEWS-05 | Speichern/Lesestatus | gespeicherte Artikel und Reading State | Reading-State-Modul vorhanden | lokal, transparent, loeschbar | Neustart-/Loeschtest | VERIFY |
| NEWS-06 | Teilen | native Bruecke vorhanden | stabile Web-/Landingpage-URLs | sichere, aufloesbare Share-Ziele | Android- und Web-Sharetest | VERIFY |
| NEWS-07 | Uebersetzung | Titel/Teaser, Herkunftsregeln; Home-Uebersetzung wird automatisch angestossen; clientgelieferter Cachekey ist manipulierbar | asynchroner Webflow dokumentiert | bewusst und transparent ausgeloest, Provenienz sichtbar, Cachekey serverseitig inhaltsgebunden | Race-, Fehler-, Cacheintegritaets- und Datenschutztest | KNOWN-ISSUE |
| NEWS-08 | Originalsprache | nur verlaessliche Erkennung | generischer Status bei unbekannt | keine erfundene Sprachangabe | Codes/unknown/UND-Testmatrix | CONFIRMED |
| NEWS-09 | Quellenpass/Herkunft | Produktumfang dokumentiert | Quellenprofile/-verifikation vorhanden | Quelle, URL, Datum unveraendert | Schema- und UI-Test | VERIFY |
| NEWS-10 | Archiv und historische Artikel | Nachrichtenarchiv vorhanden | 935 statische Artikelverzeichnisse dokumentiert | stabile IDs und Reader-Fallback | historische Deep-Link-Tests | KNOWN-ISSUE |
| NEWS-11 | Briefings/Tageslage/Dossiers | Produktumfang und Module vorhanden | Briefing-Module vorhanden | Zielumfang je Oberflaeche bestaetigen | Product-Owner-Flowabnahme | VERIFY |

## C. Multimedia

| ID | Faehigkeit | App-Baseline | Website-Baseline | Ziel fuer Migration Release 1 | Abnahme | Status |
|---|---|---|---|---|---|---|
| MEDIA-01 | Podcasts | Daten und Medienmodule vorhanden; anonyme Generierung kann Azure/R2 und oeffentlichen Katalog belasten | Podcastkatalog vorhanden | kontrolliertes Laden/Erzeugen, Admission, kanonische Quellen, Moderation/Takedown und stabiler Player | Abspielen/Pause/Fehler/Resume plus Abuse-/No-Side-Effect-Test | KNOWN-ISSUE |
| MEDIA-02 | Freie Radios | Produktumfang dokumentiert | Radioquellen und Stationen vorhanden | freigegebene Quellen und sichere externe Medien | Quellen-/Player-Test | VERIFY |
| MEDIA-03 | Audio-Hub | Medienfunktionen vorhanden | Audio-Hub und Katalog vorhanden | mobile und Webbedienung konsistent | Tastatur-, Hintergrund- und Fehlercheck | VERIFY |
| MEDIA-04 | Video-Hub | Pipeline dokumentiert | Video-Hub/-Feed vorhanden | bewusstes Laden, Rechte/Quelle sichtbar | Netz-/Consent-/Fallbacktest | VERIFY |
| MEDIA-05 | Medien-Fallbacks | Config referenziert am G1-Datensnapshot fehlende Video-/Librarydateien; lokale Artefakte und Fallbacks vorhanden | optionale Video-Feeds teils 404 | keine unklaren Dauerwarnungen | Required/Optional-Manifest, Netzwerk- und Konsolentest | KNOWN-ISSUE |

## D. Wissen, Termine und Solidaritaet

| ID | Faehigkeit | App-Baseline | Website-Baseline | Ziel fuer Migration Release 1 | Abnahme | Status |
|---|---|---|---|---|---|---|
| INFO-01 | Termine | Events im Produktumfang | Eventdaten und Modul vorhanden | valide Zeit-/Ort-/Quellenangaben | Schema-, Zeitzonen- und UI-Test | VERIFY |
| INFO-02 | Bibliothek | Produktumfang dokumentiert | Bibliotheksfeed/-quellen vorhanden | fehlende optionale Quellen kontrollieren | Daten- und Fallbacktest | KNOWN-ISSUE |
| INFO-03 | Bewegungslexikon | Produktumfang dokumentiert | umfangreiches Lexikonmodul | stabile Eintraege und Suchbarkeit | Navigation/Suche/Accessibility | VERIFY |
| INFO-04 | Zine-/Druckwerkzeuge | Produktumfang dokumentiert | Zine-Designer vorhanden | Zielumfang explizit bestaetigen | visueller Export-/Drucktest | PRODUCT-DECISION |
| INFO-05 | Gefangenensolidaritaet | Konzept und Module vorhanden | Daten und Module vorhanden | sensible Angaben mit Provenienz/Aktualitaet | Content-, Privacy- und UI-Review | VERIFY |
| HELP-01 | „Hilfe finden“ | zehn Profile, Filter und Grenzen dokumentiert | Portierungsregeln vorhanden | gleiche Sicherheits- und Datenschutzregeln | Filtermatrix und No-Persistence-Test | CONFIRMED |
| HELP-02 | Regionale Offline-Pakete | vorhanden laut Uebergabe | Zielzustand pruefen | keine Standortableitung, kontrollierte Aktualitaet | Offline-/Loesch-/Datenschutztest | CONFIRMED |
| HELP-03 | Notfall- und Zustandsgrenzen | 142/117/144-Regeln dokumentiert | Portierungsmanifest vorhanden | Grenzen unverkuerzt sichtbar | redaktioneller Sicherheitstest | CONFIRMED |
| INFO-06 | Action Radar / Aktionen | nicht abschliessend inventarisiert | Module und verifizierte Actions vorhanden | Zielumfang entscheiden | Product-Owner-Abnahme | PRODUCT-DECISION |

## E. Plattform, Offline und Betrieb

| ID | Faehigkeit | App-Baseline | Website-Baseline | Ziel fuer Migration Release 1 | Abnahme | Status |
|---|---|---|---|---|---|---|
| SYS-01 | Offline-App-Shell | atomare Caches dokumentiert | eigener Service Worker | getrennte, reproduzierbare Cachevertraege | Erst-/Zweitstart, Flugmodus, Update | CONFIRMED |
| SYS-02 | Lokale Datenbank | IndexedDB `world-revolution-news` mit `datasets` und `translations`; weitere localStorage-Pfade | eigenes Offline-/Reading-State-Verhalten | versionierte Migration und sichere Loeschung | Upgrade-/Rollback-/Loeschtest | VERIFY |
| SYS-03 | Langsames/fehlendes Netz | Fallbacks vorhanden | Fallbacks mit bekannten 404-Warnungen | ehrliche Zustandsanzeige, keine Haenger | Netzwerkprofiltests | KNOWN-ISSUE |
| SYS-04 | Optionale Spezialfeeds | Library-, Video- und Editorialpfade fehlen am gebundenen Datencommit trotz Clientconfig | mehrere bekannte 404s | Required/Optional-Vertrag; bereitstellen oder Abfrage entfernen | null 404-Dauerwarnungen im Sollpfad | KNOWN-ISSUE |
| SYS-05 | Diagnose/Selbsttest | Runtime- und App-Diagnose vorhanden | QA-Verzeichnisse vorhanden | menschenlesbarer Healthreport | deterministischer Diagnosecheck | CONFIRMED |
| SYS-06 | Datenschutz | Fluesse statisch inventarisiert; automatische Uebersetzung widerspricht Privacytext, Feedbackreferenz fehlt in UI, Push-Widerruf kann still scheitern; Live-Retention/Logging offen | `privacy.html`, CSP und Header | Datenflussvertrag, Minimierung, bestaetigte End-to-End-Loeschung und aktuelle Erklaerung | unabhaengiger Privacy-Review plus Negativ-/Loeschtests | KNOWN-ISSUE |
| SYS-07 | Barrierefreiheit | sichtbarer Fokus; einzelne Touchziele unter 44 px und Artikel-Escape ohne Wirkung beobachtet | 44-px-Ziele und Reflow-QA | WCAG-orientierte automatische und manuelle Gates | Axe/Keyboard/Screenreader-Smoke | KNOWN-ISSUE |
| SYS-08 | Content Security Policy | App-WebView-Regeln pruefen | Apache-CSP vorhanden | minimale, dokumentierte Origins | CSP-/External-Link-Test | VERIFY |
| SYS-09 | Push/Benachrichtigungen | Gateway und lokale Notifications; keine Maximalretention, stiller Backend-Unsubscribe-Fehler und bedingte 2.500er-Verdraengung | optionale Pushpfade | Produktentscheid, bestaetigte Admission/Expiry/Widerruf und sichtbares Fehler-/Datenschutzverhalten | Berechtigungs-, Fantasieendpoint-, Retention- und Widerrufstest | PRODUCT-DECISION |

## F. Website-spezifisch

| ID | Faehigkeit | Baseline | Ziel | Abnahme | Status |
|---|---|---|---|---|---|
| WEB-01 | SEO-Landingpages | 935 statische Artikelordner; aktuelles Manifest enthaelt nicht die von Generator/Runtime erwarteten IDs, Anzahl und Revision | deterministisch, append-only und revisionsgebunden erzeugen | Generator-, Manifest-, Verzeichnis- und Sitemapgleichheit | KNOWN-ISSUE |
| WEB-02 | Stabile Artikel-URLs | `/articles/<id>/` plus `?article=` | alte und neue IDs aufloesbar | direkter Kaltstart und unbekannter Fallback | CONFIRMED |
| WEB-03 | Sitemap/Robots | vorhanden; 937 Sitemap-URLs beobachtet, gemeinsame Revision mit 935 Artikelseiten wegen Manifestdrift nicht bewiesen | gleiche immutable Datenrevision wie Landingpages | Schema-, ID-Mengen-, Revisions- und Linkcheck | KNOWN-ISSUE |
| WEB-04 | Apache/Hosting | `.htaccess` und Hostinger | getrennte Deploy-/Rollbackkette | Paket-Smoke in Apache-kompatibler Umgebung | CONFIRMED |
| WEB-05 | Web-Performance | offene Core-Web-Vitals-Arbeit | Budgets nach Baseline festlegen | reale CWV- und langsame-Netz-Messung | KNOWN-ISSUE |

## G. Android- und Play-spezifisch

| ID | Faehigkeit | Baseline | Ziel | Abnahme | Status |
|---|---|---|---|---|---|
| AND-01 | Capacitor-Wrapper | Capacitor 8.4.0 dokumentiert | eine konsistente, freigegebene Toolchain | Lockfile-, Sync- und Buildtest | CONFIRMED |
| AND-02 | Native Teilen-/Geraetebruecke | vorhanden | plattformsicher und getestet | Emulator-/Geraetetest | VERIFY |
| AND-03 | Play In-App Updates | native Klassen vorhanden, vorherige Dokumente widersprechen sich zeitlich | aktuellen Codepfad und Policy verifizieren | Unit-, Instrumentation- und Tracktest | VERIFY |
| AND-04 | Android API 36 | 9+5 Tests bestanden | mindestens gleiche oder hoehere Gatequalitaet | Lint, Unit, Instrumentation, Smoke | CONFIRMED |
| AND-05 | Reproduzierbarer AAB-Build | Doppelbuild byteidentisch | neuer Kandidat commit-/hashgebunden | zwei unabhaengige Builds vergleichen | CONFIRMED |
| AND-06 | Signierung/Play-Upload | Code-26-Kandidat signiert, nicht hochgeladen | nur gesondert autorisierte Releaseoperation | Zertifikat, Hash, Play-Verarbeitung | CONFIRMED |

## Abschlussregel

Vor `GO-IMPLEMENTATION` muss der Legacy Product Analyst jede `MUST`-Zeile mit
konkreten Dateien, Screenshots, Testpfaden und beobachtetem Verhalten ergaenzen.
Ein Unterschied zwischen App und Website ist nicht automatisch ein Defekt; er
muss als bewusst plattformspezifisch oder als echte Paritaetsluecke klassifiziert
werden.
