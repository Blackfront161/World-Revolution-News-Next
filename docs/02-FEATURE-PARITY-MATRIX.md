# Feature-Paritätsmatrix

## Fortsetzung,10.September2026

AND-01/04: Neue native Quelle in `a4c2c69`, Capacitor8.5.0/SDK24–36;
Offlinecompile,3 JVM-Tests und voller Lint (0Fehler/13Templatewarnungen) PASS.
36 aktuelle Mobile-Webassets sind gegen die unsignierte APK bytegebunden.
Dies schließt den Projekt-/Compileteil; AND-02/03/05/06 und native Marken-,
Geräte-/Upgradeabnahme bleiben offen. Unabhängige Foundation-QA GREEN;
ein Prüfskript-LOW ist durch `e5b1010` und denselben Reviewer geschlossen.
SYS/Architektur:16 Paketimportverstöße und ausgelassener Workspacecheck in
`34c490b` behoben, unabhängig GREEN. MEDIA:11 bestätigte Videoquellen als
Originalverweise in beiden Clients; NEWS:5 reale Archivverweise am Appstart,
`2b4a303`/`694fc16` unabhängig geprüft. Weiterhin kein aktueller Volltextfeed.

## Jüngerer Inhaltsstand,9.September2026

Der explizite PO-Migrationsauftrag erweitert die früheren Fixtureabnahmen.
Wissen1f003a2/ebd275f, Supporta2fb524 und Directory918d06d sind unabhängig
technisch geprüft. Die folgenden neuen Ergebnisse gelten vor den älteren
CONTENT-OPEN/VERIFY-Zeilen; sie bedeuten keine vollständige Releaseparität.

| Bereich | Jetziger lokaler Umfang | Verbleibend |
| --- | --- | --- |
| INFO-02/03 |609 Bibliothekseinträge,9 Kataloge,22 Begriffe,12 Lexikonquellen; Suche/Filter/Bezüge,9UI-Sprachen | echte Offlinevolltexte und weitere redaktionelle Inhalte |
| HELP/Solidarität |11 Hilfsangebote,30 historische Profile,12 Quellen, geschützte lokale Briefwerkstatt, Druck/Download | gepflegte aktuelle Quellen, zusätzliche Regionen, geprüfte Offlinepakete |
| Quellen/News |532 Endpunkte,923 unverlorene Quellenbeobachtungen,973 sichere Newsverweise;493neuereStandard/481historischerFilter | fortlaufende Aktualisierung,645 fehlende exakte Quellenbezüge, echter Reader/Save |
| SPORT-01 |3 attribuierte eigene DE/EN-Lesehinweise aus belegten Originalartikeln, erreichbar über Start/Mehr/Entdecken | laufender Sportfeed und echte1+2Startrollen |

e5b29c1 ergänzt die korrekte Screenreader-Sprache für3 Katalogbeschreibungen;
der enge unabhängige Sprachrecheck ist GREEN. Keine PO-Sichtfreigabe oder
Website-/Android-/Provider-/Releaseabnahme vorweggenommen. Gesamtbeleg:
docs/evidence/WRN-CONTENT-MIGRATION-RESULT-2026-09-09.md.

## Historisches Inventar und frühere Gates

Statusabgleich:9.September2026. G3-016 bis G3-020 besitzen lokale
UI-Abnahmen; die nachträgliche G3-020-Korrektur e38cb5c ist unabhängig
technisch GREEN und wartet auf ihre enge Sichtprobe. G3-021 P2/P3 und die
sichtbare P4-B-Route samt R1 aaba48e sind unabhängig technisch GREEN.
Headerfix310ebfa ebenfalls unabhängig GREEN; konkrete PO-Sichtprobe offen.
Akzeptierte lokale Fixtures ersetzen keine echte Inhalts-/Medienmigration.
Historische Baselinezeilen unten sind Funktionsinventar, kein Release-GREEN.

Regel: Kein Eintrag gilt allein aufgrund eines Dateinamens als vollstaendig
verifiziert. `CONFIRMED` bedeutet nur, dass die Uebergabe oder ein vorhandener
QA-Bericht die Funktion ausdruecklich belegt. Die laufende Oberflaeche muss
spaeter trotzdem visuell und funktional aufgenommen werden.

## Statuswerte

- `CONFIRMED`: durch Uebergabe/QA als vorhandene Baseline belegt
- `VERIFY`: in Dateien/Dokumenten sichtbar, Verhalten noch systematisch pruefen
- `KNOWN-ISSUE`: bekannte Abweichung oder Fehlerquelle
- `PRODUCT-DECISION`: Zielumfang braucht Freigabe des Product Owners
- `PLANNED`: Zielumfang vom Product Owner gebunden, Implementierung nicht gestartet
- `FUTURE`: nicht Teil von Migration Release 1

## A. Marke, Navigation und Darstellung

| ID | Faehigkeit | App-Baseline | Website-Baseline | Ziel fuer Migration Release 1 | Abnahme | Status |
|---|---|---|---|---|---|---|
| UX-01 | Solinaridao-/WRN-Header und aktive Bildmarke | aktueller `News App 2`-Header: dunkler Chrome-Hintergrund, grosse Mark/Mask-Kombination und Web-/Menue-/Sprachaktionen | eigener kompakter responsiver Header; aktive Runtime ebenfalls mit Chrome-Hintergrund statt direktem `app-background.webp` | gemeinsame Brand-Tokens, plattformspezifisches Layout und keine erfundenen Funktionen | G3-009-Kandidat `973c129` entfernt die falsche Headerrolle, vergroessert die mobile Marke responsiv und haelt die Website kompakt; QA `692fe24` GREEN und durch PO-047 visuell akzeptiert; spaetere Headerfunktionen bleiben eigene Slices | CONFIRMED |
| UX-02 | Hauptnavigation und Tabs | bestehende mobile Navigation | eigenstaendige Web-/Desktopnavigation | Funktionsparitaet ohne erzwungene identische Navigation | WRN-G3-004-Kandidat `3d89fbc05c53` technisch/unabhaengig GREEN und durch PO visuell akzeptiert | CONFIRMED |
| UX-03 | Responsive Smartphone | aktuelle App ist mobile Baseline | Reflow ab 320 px dokumentiert | 320/360/390/412 px ohne horizontalen Overflow | Screenshot- und Interaktionstest | CONFIRMED |
| UX-04 | Responsive Tablet | Verhalten noch aufzunehmen | 800x1280-Dark-Feed ohne horizontalen Overflow visuell aufgenommen | definierte Hoch-/Querformatlayouts | weitere Tabletgroessen plus Querformat-Screenshot und Reflowtest | CONFIRMED |
| UX-05 | Responsive Desktop | nicht primaeres Appziel | 1024–1920 px und Zweispaltenraster dokumentiert | markenkonsistente Desktopoberflaeche | Screenshots 1024/1280/1440/1920 | CONFIRMED |
| UX-06 | Themes | Dark, OLED, Soft, Pink, Light, System und Contrast; System loest dynamisch auf Hell/Dunkel auf | Dark, Light, OLED, Contrast und Soft lokal persistiert | sechs gemeinsame Paletten plus `system` als Praeferenz; getrennte responsive Bedienung erlaubt | G3-010-Kandidat `3cc85e1` und QA `f3e2c94` GREEN und durch PO-051 visuell akzeptiert; finaler Font bleibt separates Gate | CONFIRMED |
| UX-07 | Schriftgroesse/Reflow | 200-%-Baseline zeigt ueberlappende Bottom-Nav-Beschriftungen bei 390 px | Normal/Gross/Sehr gross dokumentiert | keine Inhaltsverluste bei Vergroesserung | G3-004 schliesst Bottom-Nav-, Websitepanel- und Markenreflow; unabhaengig GREEN und durch PO akzeptiert | CONFIRMED |
| UX-08 | Intro/Onboarding | Module vorhanden | Intro-Module vorhanden | Nutzen und Wiederanzeige mit Product Owner klaeren | visueller Flow und Persistenztest | PRODUCT-DECISION |
| UX-09 | Theme-reaktiver Header und Markenschriftzug | sieben Praeferenzen; Logo-Schimmer und maskierter Schriftzug reagieren ueber `--cyan`/`--red`, Pink nutzt `#ff4fa3`/`#9b82ff` | fuenf Paletten und ebenfalls akzentgekoppelte Markenwirkung; kein Pink/System | semantische Theme-Akzenttokens, plattformspezifische Darstellung, kontrastgepruefte Markenwirkung und hoechstens eine gepinnte Originalmaske | `WRN-BRAND-THEME-PARITY-M-002` ist im Kandidaten `3cc85e1` umgesetzt, durch QA `f3e2c94` ohne Finding geprueft und durch PO-051 visuell akzeptiert | CONFIRMED |
| UX-10 | UI-Sprachwahl | Headerselect mit en/de/es/fr/it/pt/ru/el/tr, Erststart Englisch und persistierter letzter Auswahl | eigenstaendige responsive Website; gemeinsame Markenanforderung fuer die Ziel-Sprachwahl | echte vollstaendige dynamische Shelllokalisierung in beiden Clients, getrennte Keys, natives zugaengliches Headerselect; Content-Originalsprache bleibt separat | G3-013-Kandidat `0462b4c`, finale GREEN-Re-QA `40f37f6` mit 216/216 Nach-Mount-Reflowfaellen, durch PO-069 am 28. August 2026 visuell akzeptiert; M-001 geschlossen. Zusätzlicher Normalgrößen-Clippingfix310ebfa unabhängig GREEN, enge PO-Sichtprobe offen | CONFIRMED / FIX-VERIFIED / PO-VISUAL-OPEN |

Vorgemerkter UI-Feinschliff `UX-POLISH-001` (28. August 2026): Der Product
Owner empfindet Buttons teilweise als zu gross und moechte die Anpassung
gegebenenfalls am Ende buendeln. Vor finaler Releaseabnahme Buttonhoehen,
Innenabstaende und visuelle Hierarchie fuer App sowie responsive Website
kompakter abstimmen. Mindestens 44 x 44 CSS-Pixel Touchziele, Reflow, neun
Sprachen, Tastatur und Fokus bleiben geprueft. Nicht implementiert; kein
Widerruf der technischen G3-014-Gates und keine vorweggenommene Sichtabnahme.

### PO-081 – Produktoberflächen und aktueller lokaler Umsetzungsstand

| ID | Faehigkeit | Belegter lokaler Iststand | Gebundenes Ziel | Task/Gate | Status |
|---|---|---|---|---|---|
| HOME-01 | Anonyme Startseite | Mobile-Projektion mit Aufmacher, fünf Hauptmeldungen und lokalen Platzhaltermedien vorhanden | echte redaktionelle Inhalte separat anbinden; akzeptierte Rollen beibehalten | `WRN-G3-016`, PO-083 lokal visuell akzeptiert | LOCAL-ACCEPTED |
| SPORT-01 | Sport & Fankultur | lokale 1+2-Projektion, Kategorien und Aktualitätsgrenze vorhanden; abgelaufene Sportdaten werden ausgeblendet | echte rechtegeprüfte Sportquellen in `WRN-CONTENT-SPORT-001`; kein automatischer Import | UI in `WRN-G3-016` akzeptiert; Content offen | LOCAL-ACCEPTED / CONTENT-OPEN |
| PERSONAL-01 | Für mich | lokale versionierte Auswahl und Löschdialog vorhanden; stale-clear-Fix in `a489f83` mit fünf Regressionen | datensparsame lokale Personalisierung; neue Auswahl vor veralteter Löschbestätigung geschützt, ohne atomare LocalStorage-Garantie | `WRN-G3-017`, PO-089 akzeptiert; enger Sol-Fixreview am 8. September GREEN | LOCAL-ACCEPTED / FIX-VERIFIED |
| DISCOVER-01 | Entdecken-Hub | kompakte lokale Suche/Filter für Region, Thema, Quelle, Originalsprache und Format vorhanden | echte Daten später über gleiche Verträge | `WRN-G3-018`, PO-093 akzeptiert | LOCAL-ACCEPTED |
| READER-02 | Reader-v2 | integrierte Sidecarprojektion und semantische lokale Medien; bewusste abschnittsweise Übersetzung per injiziertem Adapter vorbereitet, im App-Default deaktiviert | echte Inhalte, Rechte und externer Übersetzungsprovider bleiben separat offen | `WRN-G3-019`, PO-097 akzeptiert | LOCAL-ACCEPTED / PROVIDER-OPEN |
| EVENTS-01 | Regionale Termine | Mobile-Route vorhanden; drei UI-Korrekturen e38cb5c sowie kanonisches Manifest unabhängig GREEN | enge Sichtprobe der Korrektur, echte Termine separat | `WRN-G3-020`, Basis PO-099 akzeptiert; Sol-Backfill f69f28c geschlossen | FIX-VERIFIED / PO-VISUAL-OPEN |
| MEDIA-06 | Medien-/Podcast-Hub | P2-Katalog, Player/Resume und sichtbare neunsprachige Route samt R1-Recovery aaba48e unabhängig technisch GREEN | lokale PO-Sichtprobe; echte Medien/Provider separat | `WRN-G3-021`; R1-Abschlüsse in d90304d | TECH-GREEN / PO-VISUAL-OPEN |

Alle neuen Oberflaechen erhalten additive Keys in allen neun registrierten
UI-Sprachen; UI- und Inhalts-/Originalsprache bleiben getrennt. App und Website
sind getrennte Projektionen. PO-081 erteilt weder Produktstart noch echten
Contentimport, Hosting, Android, AAB, Google Play oder Release.

## B. News, Artikel und Herkunft

| ID | Faehigkeit | App-Baseline | Website-Baseline | Ziel fuer Migration Release 1 | Abnahme | Status |
|---|---|---|---|---|---|---|
| NEWS-01 | Newsfeed | mehrsprachiger Feed dokumentiert | produktiver Feed und Snapshots | gleiche Inhaltsvertraege, geeignete Plattformdarstellung | G3-002 lokal akzeptiert; G3-012 bereitet die releasefoermige Runtimequelle und Entfernung der Test-Support-Produktkopplung vor, Implementierung gesperrt | CONFIRMED |
| NEWS-02 | Suche und Filter | Themen, Regionen, Quellen, Sprache, Format; Header-Suche fuehrt nach Entdecken, Gesamtreset im G1-Sichtbeleg unklar | Filtermodule vorhanden | lokale Suche plus Region, Thema, Quelle, Originalsprache und Format; Archive/Remote spaeter | Kandidat `9a9a2216a4fa` und QA `a84c445` technisch GREEN, null Findings; durch PO-034 visuell akzeptiert; Archive/Remote bleiben offen | VERIFY |
| NEWS-03 | Artikelansicht | Dialog/Detailansicht vorhanden | Dialog plus statische Landingpages | vollstaendiger Inhalt, sichere externe Links | lokaler Readerkandidat `6a4c64b` und lokale Landingpage-/SEO-Basis `5db27a5` unabhaengig GREEN und visuell akzeptiert; echte Inhalte, produktiver Bestand, Archiv und Share bleiben offen | CONFIRMED |
| NEWS-04 | Vollstaendiger erster Satz | vertraglich getestet | Desktop-QA bestaetigt | keine willkuerliche Ellipsen-Kuerzung | Segmenter- und Fallbacktests | CONFIRMED |
| NEWS-05 | Speichern/Lesestatus | gespeicherte Artikel, Gelesen/Ungelesen und Leseposition; teils URL-/Objekt-basiert und mit Offlinepayload gekoppelt | gleiches `reading-state.js`-Grundmodell | kanonische IDs, versionierter rein lokaler Zustand, getrennte Clients, transparent und loeschbar | Kandidat `d19ce4d` implementiert Saved/Read/Progress/Loeschung und bewahrt unbekannte neuere oder defekte Rohwerte im Nur-Lese-Schutzmodus; Re-QA `f1ebf70` GREEN und B-003 fuer den lokalen Kandidaten geschlossen; aktuelles Abnahmegate siehe Source-of-Truth | VERIFY |
| NEWS-06 | Teilen | native Bruecke vorhanden | stabile Web-/Landingpage-URLs | sichere, aufloesbare Share-Ziele | G3-008 lokal technisch GREEN und durch PO-044 visuell akzeptiert; kanonische Web-Shareziele/Stubtests geschlossen, Android-Native-Share bleibt spaeter | VERIFY |
| NEWS-07 | Uebersetzung | Titel/Teaser, Herkunftsregeln; Home-Uebersetzung wird automatisch angestossen; clientgelieferter Cachekey ist manipulierbar | asynchroner Webflow dokumentiert | bewusst und transparent ausgeloest, Provenienz sichtbar, Cachekey serverseitig inhaltsgebunden | Race-, Fehler-, Cacheintegritaets- und Datenschutztest | KNOWN-ISSUE |
| NEWS-08 | Originalsprache | nur verlaessliche Erkennung | generischer Status bei unbekannt | keine erfundene Sprachangabe | Codes/unknown/UND-Testmatrix | CONFIRMED |
| NEWS-09 | Quellenpass/Herkunft | Produktumfang dokumentiert | Quellenprofile/-verifikation vorhanden | Quelle, URL, Datum unveraendert | Schema- und UI-Test | VERIFY |
| NEWS-10 | Archiv und historische Artikel | Nachrichtenarchiv vorhanden | 935 statische Artikelverzeichnisse dokumentiert | stabile IDs und Reader-Fallback | G3-008 lokale historische/alias/gone/revoked-Testfaelle und Archivansichten technisch GREEN und durch PO-044 visuell akzeptiert; echte 935-ID-Migration bleibt offen | KNOWN-ISSUE |
| NEWS-11 | Briefings/Tageslage/Dossiers | Produktumfang und Module vorhanden | `Globale Lage` aus Start/Fuer mich/Entdecken sowie G3-019 bis G3-021 ausgeschlossen; nur als spaetere klar erklaerte FUTURE-Funktion vorgemerkt | Eigener Produktbrief, redaktionelle Regeln, Regionen-/Quellenbalance, Rechte/Provenienz und sichtbares START-Gate | Separate Contract-, Content-, Flow-, Visual-, A11y- und PO-Abnahme | DEFERRED |

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
| SYS-02 | Lokale Datenbank | IndexedDB `world-revolution-news` mit `datasets` und `translations`; `wrn_bookmarks`, `wrn_read_list` und `wrn_read_positions` in Local Storage | eigenes Offline-/Reading-State-Verhalten mit denselben Legacykeys | getrennte versionierte Adapter, idempotente Migration und sichere Loeschung | G3-011-Kandidat `d19ce4d` und Re-QA `f1ebf70` belegen getrennte lokale V1-Adapter, reine Fixturemigration und sicheren Read-only-Rollbackschutz; IndexedDB/Cache/echter Cutover bleiben eigene spaetere Gates | VERIFY |
| SYS-03 | Langsames/fehlendes Netz | Fallbacks vorhanden | Fallbacks mit bekannten 404-Warnungen | ehrliche Zustandsanzeige, keine Haenger | Netzwerkprofiltests | KNOWN-ISSUE |
| SYS-04 | Optionale Spezialfeeds | Library-, Video- und Editorialpfade fehlen am gebundenen Datencommit trotz Clientconfig | mehrere bekannte 404s | Required/Optional-Vertrag; bereitstellen oder Abfrage entfernen | G3-012 bereitet feste Resource-Allowlist, `optional-absent` ohne Request und fail-closed Required-/Integritaetsfehler vor; Implementierung offen | KNOWN-ISSUE |
| SYS-05 | Diagnose/Selbsttest | Runtime- und App-Diagnose vorhanden | QA-Verzeichnisse vorhanden | menschenlesbarer Healthreport | deterministischer Diagnosecheck | CONFIRMED |
| SYS-06 | Datenschutz | Fluesse statisch inventarisiert; automatische Uebersetzung widerspricht Privacytext, Feedbackreferenz fehlt in UI, Push-Widerruf kann still scheitern; Live-Retention/Logging offen | `privacy.html`, CSP und Header | Datenflussvertrag, Minimierung, bestaetigte End-to-End-Loeschung und aktuelle Erklaerung | unabhaengiger Privacy-Review plus Negativ-/Loeschtests | KNOWN-ISSUE |
| SYS-07 | Barrierefreiheit | sichtbarer Fokus; einzelne Touchziele unter 44 px und Artikel-Escape ohne Wirkung beobachtet | 44-px-Ziele und Reflow-QA | WCAG-orientierte automatische und manuelle Gates | Axe/Keyboard/Screenreader-Smoke | KNOWN-ISSUE |
| SYS-08 | Content Security Policy | App-WebView-Regeln pruefen | Apache-CSP vorhanden | minimale, dokumentierte Origins | CSP-/External-Link-Test | VERIFY |
| SYS-09 | Push/Benachrichtigungen | Gateway und lokale Notifications; keine Maximalretention, stiller Backend-Unsubscribe-Fehler und bedingte 2.500er-Verdraengung | optionale Pushpfade | Produktentscheid, bestaetigte Admission/Expiry/Widerruf und sichtbares Fehler-/Datenschutzverhalten | Berechtigungs-, Fantasieendpoint-, Retention- und Widerrufstest | PRODUCT-DECISION |

G3-014-Konkretisierung (PO-071, technisch GREEN; durch PO-073 akzeptiert): SYS-02/03 und der
Inhalts-Persistenzanteil von NEWS-05 werden mit getrennten IDB-Namen,
atomaren Revisionswechseln und Revocationschutz umgesetzt. Die Backendbasis
`7b449c7` und die Frontendintegration samt Korrekturen im Kandidaten `44b5cb1`
sind gesichert; frische Gesamt-Re-QA `999b777` und Architektur-Recheck
`0b2bd2f` GREEN. OFF-01–25, getrennte Speicherung, Schutz-/Update-/Rueckwechsel-
und Loeschgrenzen sind im QA-Bericht konkret belegt. Sichtabnahme PO-073 erteilt.
Keine globale Paritaetsabnahme aus
diesen Teilbelegen. SYS-01, echter
Offline-Shell-Kaltstart und AND-03 werden dadurch noch nicht als implementiert
oder abgenommen erklaert. Aktuelle Gates stehen ausschliesslich in
Source-of-Truth und Project State.

## F. Website-spezifisch

G3-015 (Vorbereitung PO-072, Start PO-074) bindet jetzt den Websiteanteil von SYS-01/03:
eigene bewusst bereitgestellte Shell, echtes Web-Neuoeffnen bei gesperrtem
Gesamtnetz, sichere Shellupdates und Paketrollback. Keine Implementierung,
SW-/Cacheaktion oder Paritaetsabnahme vor P1-GREEN. Android-, Hilfe-/Medienoffline und
Legacy-Cutover bleiben offen; Task `WRN-G3-015-WEBSITE-OFFLINE-SHELL.md`.

| ID | Faehigkeit | Baseline | Ziel | Abnahme | Status |
|---|---|---|---|---|---|
| WEB-01 | SEO-Landingpages | 935 statische Artikelordner; aktuelles Manifest enthaelt nicht die von Generator/Runtime erwarteten IDs, Anzahl und Revision | deterministisch, append-only und revisionsgebunden erzeugen | G3-007-Drei-ID-Fixture akzeptiert; G3-012 bereitet die Entkopplung des Publishers vom direkten Test-Support-Quellimport und dieselbe gepinnte Runtime-/Publikationsrevision vor; produktiver 935-Seiten-Bestand bleibt offen | KNOWN-ISSUE |
| WEB-02 | Stabile Artikel-URLs | `/articles/<id>/` plus `?article=` | alte und neue IDs aufloesbar | G3-007 bestaetigt lokalen direkten Kaltstart, Same-ID-Readerlink und ehrlichen Unknown-Pfad; historische produktive IDs bleiben Teil der spaeteren Archivmigration | CONFIRMED |
| WEB-03 | Sitemap/Robots | vorhanden; 937 Sitemap-URLs beobachtet, gemeinsame Revision mit 935 Artikelseiten wegen Manifestdrift nicht bewiesen | gleiche immutable Datenrevision wie Landingpages | G3-007 bestaetigt lokal Schema-, ID-Mengen-, Revisions-, Canonical-, Sitemap-/Robots- und Linkchecks; produktiver Bestand bleibt wegen Legacy-Manifestdrift offen | KNOWN-ISSUE |
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

## H. G2-Architekturzuordnung

Diese Tabelle ersetzt keine einzelne Paritaetszeile. Sie benennt die
Zielkontrolle, den technischen Owner und das Gate, damit keine G1-Faehigkeit
zwischen ADR und Implementierung verloren geht.

| Paritaetsbereich | Zielkontrolle | ADR / Welle | Owner nach Freigabe | Gate |
|---|---|---|---|---|
| UX-01–08 | gemeinsame semantische Tokens/Assets, getrennte Navigation/Layouts, G1-Screenshotmatrix | ADR-003; W1–W3 | Frontend Brand + QA | Product-Owner-Visualabnahme, 44x44, Escape, Reflow |
| NEWS-01/02/04/08/09 | immutable Revision, typisierte Domainmodelle, Provenienz und sichere Unknown-Werte | ADR-004; W2 | Backend/Data + Frontend | Schema/Hash/Required-Optional und Feedparitaet |
| NEWS-03/06/10 | stabiler Reader-/Share-/Archivvertrag mit getrennten aktiven, archivierten, Landing-/Redirect-/Sitemapmengen | ADR-004/009; W3 | Website + Data + QA | Mengenbeziehung/Hash, Deep-Link, Canonical, historischer Fallback |
| NEWS-05 | clientlokaler, transparenter Lesestatus mit selektiver/gesamter Loeschung | ADR-007; W4 | Frontend + Backend/Data | Upgrade-, Rollback- und Loeschtest |
| NEWS-07 | explizite Uebersetzung, serverseitiger kanonischer Cachekey, sichtbare Provenienz | ADR-005/008; W6 | Backend/Data + Security | SEC-001 und Privacy-/Fehler-/Race-Negativtests |
| NEWS-11 | getrennte Feature-Slices gegen freigegebene Produktflows | ADR-001/003; W5 | Product Owner + Frontend | Flow-/Visualabnahme pro enthaltenem Format |
| MEDIA-01 | Katalog/Player als Kern; Generierung nur mit Admission, kanonischen IDs, Rechten, Moderation, Takedown und Kosten-Caps | ADR-006/008; W5/W6 | Product Owner + Backend/Data + Security | Playerparitaet; fuer Generierung SEC-002 und No-Side-Effect-Test |
| MEDIA-02–05 | Medienmanifest, Health, Consent, Rechte und deklarierte Fallbacks | ADR-004/006; W5 | Backend/Data + Frontend | Schema/CSP/Player/Offline/Rechte |
| INFO-01–03, INFO-05 | stabile IDs, Zeit/Ort/Quelle, redaktionelle Owner und getrennte Kernslices | ADR-004/006/010; W5 | Data + Product Owner | Contract-, Redaktions-, Rechte- und Accessibilitygate |
| INFO-04 | Zine-/Druckwerkzeuge nur nach PO-003 | ADR-003/009; W6 optional | Product Owner + Frontend + QA | Export-/Print-/Visual-/Accessibilitygate |
| INFO-06 | Action Radar getrennt von Hilfe; freiwilliger lokaler Standort | ADR-008; W6 optional | Product Owner + Security | PO-004 und No-Transmission |
| HELP-01–03 | No-Geolocation/No-Persistence, Safetygrenzen, revisionsgebundene Offlinepakete | ADR-007/008; W4 | Backend/Data + Security + QA | Filter-, Aktualitaets-, Offline- und Loeschtest |
| SYS-01–05 | getrennte App-/Website-Cache-, Storage-, Diagnose- und Fallbackvertraege | ADR-004/007; W2/W4 | Backend/Data + QA | Online/Slow/Offline/Upgrade/Rollback |
| SYS-06/08 | minimierte Datenfluesse, No-Content-Logging, Origin/CSP und End-to-End-Loeschung | ADR-005/008; W2–W7 | Security + Backend/Data | Privacyreview und Negativtests |
| SYS-07 | semantische Komponenten plus automatische und manuelle Accessibilitygates | ADR-003/009; alle UI-Wellen | Frontend + QA | Keyboard, Reflow, Kontrast, Screenreader, Touchziele |
| SYS-09 | Challenge, Ablauf, Caps, Pruning und bestaetigter Widerruf | ADR-005/008; W6 optional | Product Owner + Security | PO-005 und SEC-003 |
| WEB-01–03 | Feed/Landing/Manifest/Sitemap aus gleicher Revision mit getrennten Mengenhashes und definierten Beziehungen | ADR-004/009; W3 | Website + Data + QA | Hash-/Mengenbeziehungs-/Canonical-/Fallbackgate |
| WEB-04/05 | getrenntes Apache-Paket, Service-Worker-Rollback und Performancebudget | ADR-007/009; W7 | Website + QA | Apache-Smoke, CWV, Paket-/Rollbackbeleg |
| AND-01–06 | Capacitor-Adapter, API-Ziel, reproduzierbarer AAB und getrennte Freigabeoperationen | ADR-002/009; W7 | Mobile + QA | Lint/Unit/Instrumentation/Lifecycle/Hash/Signatur |

Offene Produktentscheidungen fuer UX-08, INFO-04/06 und SYS-09 sowie
automatische Uebersetzung und generierte Podcasts stehen ausschliesslich in
`docs/architecture/G2-OPEN-DECISIONS.md`. Ohne Entscheidung ist die jeweilige
optionale Funktion nicht Teil eines Implementierungsslices.

## I. Verbindliche Release-1-Klassifikation

Diese Klassifikation macht die in Charter/Quality Rules verwendete
`MUST`-Abnahme pruefbar. `OPTIONAL-PO` ist nur nach expliziter Product-Owner-
Entscheidung Bestandteil von Release 1. `MUST-SPLIT` trennt eine bestaetigte
Kernfaehigkeit von einem optionalen Betriebsmodus.

| Paritaets-IDs | Klasse | Konkreter Release-1-Vertrag | Slice |
|---|---|---|---|
| UX-01–07 | `MUST` | Marke, getrennte Navigationen, Responsive, Themes, Reflow/A11y ohne bekannte Defekte | W1–W7 querschnittlich |
| UX-08 | `OPTIONAL-PO` | Intro nur bei PO-002 | W6 |
| NEWS-01–06, NEWS-08–11 | `MUST` | Feed, Suche/Filter, Reader, Satz, Lesestatus, Share, Sprache, Herkunft, Archiv, Briefings/Dossiers | W2–W5 |
| NEWS-07 | `MUST-SPLIT` | nutzergesteuerte Uebersetzung MUST; automatische Remoteuebersetzung nur PO-006 | W6 |
| MEDIA-01 | `MUST-SPLIT` | Podcastkatalog/Player MUST; generierte Podcasts nur PO-007 | W5/W6 |
| MEDIA-02–05 | `MUST` | Radio, Audio, Video und kontrollierte Fallbacks | W5 |
| INFO-01–03, INFO-05 | `MUST` | Termine, Bibliothek, Lexikon und Gefangenensolidaritaet | W5 |
| INFO-04 | `OPTIONAL-PO` | Zine-/Druckwerkzeuge nur PO-003 | W6 |
| INFO-06 | `OPTIONAL-PO` | Action Radar nur PO-004 | W6 |
| HELP-01–03 | `MUST` | Hilfeprofile, regionale Offlinepakete und unverkuerzte Safetygrenzen | W4/W5 |
| SYS-01–08 | `MUST` | Offline, Storage, Fehler, Spezialfeeds, Diagnose, Privacy, A11y und CSP | W2–W7 querschnittlich |
| SYS-09 | `OPTIONAL-PO` | Push nur PO-005 und SEC-003 | W6 |
| WEB-01–05 | `MUST` | SEO/IDs/Sitemap, Apachepaket und Performance | W3/W7 |
| AND-01–06 | `MUST` | Capacitor/native Adapter, API-Ziel, reproduzierbarer AAB und getrennte Releaseoperationen | W7 |

`FUTURE`: World Revolution Map und historisches Kartenspiel besitzen keine
Paritaetszeile und keinen Release-1-Slice; nur ADR-010-Vertragsgrenzen.
Signierung, Upload und Deployment in AND-06 bleiben auch als MUST-Nachweis
separate G6-Operationen und werden nicht automatisch ausgefuehrt.

## J. G3-002-Umsetzungsnachweis

Der lokale Manifest-Newsfeed-Kandidat `422917b7a686` belegt einen begrenzten
technischen Teil von `NEWS-01`, `NEWS-04`, `NEWS-08`, `NEWS-09`, `SYS-03`,
`SYS-04`, `SYS-07` und `UX-03` bis `UX-07`. Er beweist denselben
commitgebundenen Inhaltsstand in getrennten Mobile-/Websiteansichten,
vollstaendige lokale Testteaser und Metadaten, sechs ehrliche Zustaende,
Responsive, Themes, 200-Prozent-Reflow, Fokus und 44x44-Ziele.

Dieser Nachweis aendert keine Release-1-Paritaetszeile auf „vollstaendig
implementiert“: echte Inhalte, Assets, Liveadapter, vollstaendiger Offlinecache,
Suche, Reader, Android und Release bleiben in spaeteren Slices. Technische QA
ist GREEN; die sichtbare Produktrichtung wartet auf Product-Owner-Abnahme.
