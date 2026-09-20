# Task Brief – WRN-G3-011 Lokale Merkliste und Lesestatus

## Identitaet

- Task-ID: `WRN-G3-011`
- Titel: Gespeicherte Artikel, Gelesen/Ungelesen und lokaler Lesefortschritt
- Paritaets-/Risiko-ID: `NEWS-05`, `SYS-02`, `R-07`, `R-22`, `R-26`, `R-40`
- Auftraggeber: Product Owner
- Zustaendige Agenten nach separatem Start:
  `backend_data_reliability_engineer`, danach `frontend_brand_engineer`, danach
  `visual_accessibility_reviewer`
- Modell/Reasoning: Terra/high fuer Vertrag, Implementierung und QA
- Delegation: nach `START WRN-G3-011` erlaubt, aber strikt sequenziell; immer
  nur ein schreibender Agent, unabhaengige QA erst nach gesichertem Kandidaten

## Gate und aktueller Status

- Der Product Owner antwortete am 26. August 2026 mit `fahre fort`, nachdem der
  Main Agent den naechsten Schritt als Auswahl und ausschliessliche
  Vorbereitung eines neuen Slices beschrieben hatte.
- Damit ist nur die dokumentarische Vorbereitung dieses naechsten
  risikoarmen Wave-4-Slices freigegeben.
- Noch wurde kein Produkt-, Test-, Fixture-, Asset- oder Legacycode geaendert
  und kein Mitarbeiter gestartet.
- Das einzige Implementierungsgate lautet `START WRN-G3-011`.
- Dokumentarischer Vorbereitungscheckpoint: `fc248f1`.
- Der Product Owner erteilte am 26. August 2026 exakt
  `START WRN-G3-011`. Damit ist ausschliesslich der hier schriftlich
  begrenzte lokale Produkt-/Testscope in der festgelegten Agentensequenz
  freigegeben.
- Startcheckpoint: `b4c72bc`.
- Contract-/Domain-/Fixture-Produktcheckpoint: `b0aee26`; Handoff `4cf249f`.
- Der erste Frontendlauf stoppte korrekt mit `TS2307`, weil beide Clients den
  V1-Validator/Typ weder direkt importieren duerfen noch ueber
  `@wrn/domain` erhalten. Der noch nicht kompilierbare Mobile-WIP ist in
  `e7f627f`, der YELLOW-Handoff in `63218cd` gesichert.
- Der Product Owner erteilte am 26. August 2026 exakt
  `G3-011 VERTRAGSBRUECKE BEHEBEN`. PO-054 gibt ausschliesslich den minimalen
  additiven Re-Export des bereits vorhandenen V1-Validators und der fuer die
  Clientadapter notwendigen V1-Typen/Konstanten aus `@wrn/domain` sowie eng
  zugehoerige Exporttests frei. Schema, Semantik, Fixture, Dependencies,
  Rootkonfiguration, App, Website und E2E bleiben in diesem Korrekturschritt
  unveraendert. Nach gesichertem GREEN-Handoff wird der Backend/Data-Agent
  beendet; erst dann darf ein frischer Frontend-Agent fortsetzen.
- PO-054-Brueckencheckpoint: `d856f64`; Handoff `34a60d8`.
- Vollstaendiger App-/Website-Produktkandidat: `0f51885`;
  Implementierungsevidenz und Handoff `962ae9e`. Der Implementierungslauf
  bestaetigt 117 Unit-/Contract-/Komponententests, 17 Boundarytests, Format,
  Lint, Typechecks, beide Builds und den vollen Browserlauf mit 55 PASS,
  127 erwarteten Skips und null Fehlern. Dies ist noch keine unabhaengige QA
  und keine Product-Owner-Abnahme.
- Unabhaengige QA `68fcb13`: **RED** mit High
  `WRN-G3-011-H-001`. Gueltige aktuelle Feed-/Reader-IDs werden durch die nur
  auf G3-008-IDs begrenzte Client-Lifecyclebindung als unknown projiziert;
  Reader-Ausloeser und Fortschrittsfluss fehlen dadurch in `Gespeichert` fuer
  aktive Artikel. Keine Produktkorrektur ist freigegeben. Nach einer sichtbaren
  eng begrenzten PO-Entscheidung muss ein korrigierter Kandidat die gesamte
  unabhaengige Matrix erneut durchlaufen.
- Der Product Owner erteilte am 26. August 2026 exakt
  `G3-011 H-001 BEHEBEN`. PO-055 erlaubt nur die Clientkorrektur, durch die
  validierte aktive Feed-/Reader-IDs zusammen mit der bestehenden
  G3-008-Lifecyclemenge korrekt aufgeloest werden. Gone/Revoked/Unknown bleiben
  fail-closed und payloadfrei. Vertrag, Domain, Fixtures, Storageformat,
  Dependencies, Rootkonfiguration und allgemeine UI bleiben unveraendert.
  Nach einem neuen Korrekturkandidaten ist die gesamte unabhaengige QA-Matrix
  frisch zu wiederholen.
- Der Product Owner verlangte danach zusaetzlich, dass ein Kontrolleur einmal
  alles kontrolliert. PO-056 setzt deshalb nach einer GREEN-Re-QA ein eigenes
  read-only Gesamtgate: Ein `independent_architecture_reviewer` prueft den
  gesamten lokalen Zielprojektstand G3-001 bis G3-011 auf Architektur,
  Vertraege, Security/Privacy, Datenminimierung, Kosten-/Providergrenzen,
  vollstaendige Tests/Belege, Scopeabweichungen und offene Risiken. Er darf
  nichts korrigieren. Findings werden vor der Product-Owner-Abnahme sichtbar
  entschieden.
- PO-055-Korrekturkandidat `67ffc39`; Implementierungsevidenz und Handoff
  `853be13`. Der Implementierungslauf bestaetigt 119 Unit-/Contract-/
  Komponententests, 17 Boundarytests, Format, Lint, Typechecks, beide Builds
  und 57 Browser-PASS bei 132 erwarteten Skips und null Fehlern. Als naechstes
  ist eine frische vollstaendige unabhaengige G3-011-Re-QA erforderlich;
  PO-056 folgt nur nach deren GREEN-Handoff.
- Re-QA `ab41b91`: H-001 geschlossen, aber YELLOW mit Medium
  `WRN-G3-011-M-002`. Der Lesedaten-Loeschdialog besitzt in beiden Clients
  korrekten initialen Abbrechen-Fokus, schliesst jedoch nicht mit Escape. Die
  Korrektur ist nicht freigegeben; PO-056 bleibt bis zu einem korrigierten und
  unabhaengig GREEN geprueften Kandidaten gesperrt.
- Der Product Owner erteilte am 26. August 2026 exakt
  `G3-011 M-002 BEHEBEN`. PO-057 erlaubt nur den Escape-/Fokusvertrag der
  vorhandenen Lesedaten-Loeschdialoge beider Clients und eng zugehoerige
  Client-/E2E-Regressionen. Escape schliesst ohne Loeschung und fuehrt Fokus
  an den Ausloeser zurueck. Bestaetigen, sichtbares Abbrechen, Styling, Texte,
  sonstige UI, Domain, Storage, Vertraege und Fixtures bleiben unveraendert.
  Danach folgen frische unabhaengige Re-QA und nur bei GREEN PO-056.
- PO-057-Korrekturkandidat `b619533`; Implementierungsevidenz und Handoff
  `70a69ef`. Format, Lint, 17 Boundarytests, Typechecks, 119 Unit-/Contract-/
  Komponententests, beide Builds und der volle Browserlauf mit 59 PASS,
  137 erwarteten Skips und null Fehlern sind im Implementierungslauf GREEN.
  Eine frische unabhaengige Re-QA ist offen; PO-056 folgt nur bei GREEN.
- M-002-Re-QA `657a00e`: GREEN mit null offenen Findings. 119 Tests,
  17 Boundarytests, beide Builds, 59 Browser-PASS/137 erwartete Skips/null
  Fehler sowie 20 frische Runtimebeobachtungen und 12 Screenshots bestaetigen
  Dialog-/Fokus-, H-001-, Lifecycle-, Storage-, Privacy- und A11y-Grenzen.
  Als naechstes und einziges Gate folgt PO-056 read-only ueber den gesamten
  lokalen Zielprojektstand G3-001 bis G3-011.
- PO-056-Gesamtcontroller `0bfc9e3`: **RED / FAIL** mit Blocker
  `WRN-G3-011-B-003` und Low `WRN-GOV-L-004`. Bei unbekanntem neuerem
  Reading-State bleibt der Rohwert nach Reload zunaechst erhalten, wird aber
  in beiden Clients bei einer normalen Saved-/Read-/Progress-Aktion durch V1
  ueberschrieben. Damit ist der explizite Rollbackvertrag verletzt. Drei
  sekundaere Governance-Register enthalten ausserdem veraltete Statuszeilen.
  Der Controller bestaetigt ansonsten exakte Toolchain, 123/123 Tests,
  17 Boundarytests, beide Builds und 59 Browser-PASS/137 erwartete Skips/null
  Fehler. Er aenderte keinen Produktcode und fuehrte keine externe Aktion aus.
  G3-011 bleibt bis zu einem sichtbaren Korrekturgate, neuem Kandidaten,
  vollstaendiger unabhaengiger Re-QA und erneutem PO-056-Gesamtcheck gesperrt.
- Der Product Owner erteilte am 26. August 2026 exakt
  `G3-011 B-003 UND GOV-L-004 BEHEBEN`. PO-058 erlaubt nur:
  1. beide clientlokalen Loader unterscheiden gueltiges/fehlendes V1 von
     unbekanntem neuerem, ungueltigem oder nicht lesbarem Rohwert;
  2. alle unbekannten oder unlesbaren Rohwerte bleiben unangetastet und jede
     automatische sowie nutzergesteuerte Saved-/Read-/Progress-/Clear-
     Mutation wird in einem ehrlichen Nur-Lese-Schutzmodus gesperrt;
  3. Komponenten- und Browsertests reproduzieren V2 und defektes JSON durch
     Reload und normale Nutzeraktionen und pruefen bytegleiche Erhaltung;
  4. nach dem Produktkandidaten werden ausschliesslich die drei von
     `WRN-GOV-L-004` benannten sekundaeren Statuszeilen aktualisiert.
  Ein stiller Reset, Styling-/Copy-Redesign, neue Funktionen, Domain- oder
  Contractaenderungen, Dependencies, Rootkonfiguration, echte Daten,
  Alt-/Liveprojekte und externe Aktionen bleiben verboten. Die Arbeit erfolgt
  strikt sequenziell: Backend/Data-Kandidat und Handoff, Main-Agent-
  Governancekorrektur, vollstaendige unabhaengige Re-QA und bei GREEN erneuter
  read-only PO-056-Gesamtcheck.
- B-003-Produktkandidat `d19ce4d`; Implementierungsevidenz und Handoff
  `e38696d`. Fehlende/gueltige V1-Daten bleiben schreibbar; V2, ungueltige,
  defekte oder nicht lesbare Daten wechseln in einen sichtbaren Nur-Lese-
  Schutzmodus. Automatische Reconciliation sowie Saved-/Read-/Progress-/Clear-
  Mutationen sind gesperrt und der Rohwert bleibt unangetastet. Format, Lint,
  Typechecks, 17 Boundarytests, 127 Unit-/Contract-/Komponententests, beide
  Builds und 61 Browser-PASS/142 erwartete Skips/null Fehler sind GREEN.
  Danach wurden ausschliesslich die drei durch GOV-L-004 benannten
  sekundaeren Statuszeilen aktualisiert. Als naechstes ist eine vollstaendige
  frische unabhaengige G3-011-Re-QA erforderlich; nur bei GREEN folgt der
  erneute read-only PO-056-Gesamtcheck.
- B-003-Re-QA `f1ebf70`: GREEN mit null offenen Blockern, Highs, Mediums oder
  Lows. Fehlend/gueltiges V1, unbekanntes V2, ungueltiges Schema, defektes
  JSON und `getItem`-Fehler sind fuer beide Clients unabhaengig geprueft;
  Rohwerte bleiben bytegleich und alle Mutationen/Reconciliation sind im
  Schutzmodus gesperrt. Bestaetigt sind Format, Lint, Typechecks,
  17 Boundarytests, 127 Tests, beide Builds, 61 Browser-PASS/142 erwartete
  Skips/null Fehler sowie 41 neue visuelle Belege. Als naechstes darf genau
  ein frischer `independent_architecture_reviewer` PO-056 read-only ueber den
  gesamten lokalen Stand G3-001 bis G3-011 wiederholen.
- PO-056-Recheck `1b344b6`: B-003 mit exakter Node-24.19-/pnpm-11.19-
  Toolchain, 127 Tests, 17 Boundarytests, beiden Builds und 61 Browser-PASS/
  142 erwarteten Skips/null Fehlern eigenstaendig geschlossen. RED blieb nur
  wegen Low `WRN-GOV-L-004`, da die drei sekundaeren Register nach der
  GREEN-Re-QA erneut einen Gate-Stand zuruecklagen. Innerhalb des bereits
  freigegebenen PO-058-Auftrags wurden sie dauerhaft auf stabile Kandidat-/
  Re-QA-Belege und einen Verweis auf die autoritativen dynamischen Register
  umgestellt. Als naechstes ist nur ein unabhaengiger read-only Registerabgleich
  erforderlich; Produkt und Tests bleiben unveraendert.
- GOV-L-004-Registerabschluss `695b1c0`: GREEN mit null offenen Blockern,
  Highs, Mediums oder Lows. Die drei sekundaeren Register binden dauerhaft
  Kandidat `d19ce4d` und Re-QA `f1ebf70` und delegieren wechselnde Gates an
  Source-of-Truth/Project State. Seit dem Vollrecheck wurde kein Produkt- oder
  Testpfad geaendert. B-003 und GOV-L-004 sind damit unabhaengig geschlossen;
  G3-011 war damit technisch GREEN und wartete zu diesem Zeitpunkt auf die
  sichtbare Product-Owner-Entscheidung.
- Vor der Abnahme wurde der sichtbare Task `WRN G2 – Zielarchitektur & ADRs`
  gelesen und sein isolierter Worktree `f430f95` durch einen
  `context_continuity_auditor` mit dem aktuellen Zielrepository verglichen.
  Ergebnis: GREEN; die dortige parallele G3-001-Foundation und ihre
  unversionierten Produktdateien sind historisch, keine aktuellere Quelle und
  enthalten keine fuer G3-011 fehlende Architekturentscheidung. Es wird
  daraus nichts kopiert oder gemergt.
- Der Product Owner akzeptierte am 26. August 2026 mit exakt
  `G3-011 VISUELL AKZEPTIERT` den Kandidaten `d19ce4d`, die GREEN-Re-QA
  `f1ebf70`, den technischen Vollrecheck `1b344b6` und den GREEN-
  Registerabschluss `695b1c0`. G3-011 ist damit geschlossen. Kein Folgeslice
  und keine Android-, Remote-, Deployment- oder Releaseaktion wurde gestartet.

## Ziel in beobachtbarer Sprache

Nutzer koennen einen lokalen Testartikel in App und Website bewusst fuer
spaeter speichern, als gelesen oder ungelesen markieren und einen begonnenen
langen Artikel mit sichtbarem Lesefortschritt wiederfinden. Die bereits
vorhandene Navigation `Gespeichert` wird zu einer echten lokalen Ansicht mit
getrennten Bereichen fuer `Spaeter lesen` und `Gelesen`.

Der Zustand bleibt ausschliesslich im jeweiligen Client auf diesem Geraet.
Es gibt kein Konto, keine Synchronisation, keine Cloud, keine Telemetrie und
keine externe Anfrage. Nutzer koennen einzelne Eintraege sowie alle
Lesedaten nachvollziehbar loeschen, ohne Theme oder andere lokale
Einstellungen mitzuloeschen.

## Ausgangslage und Belege

### Autoritative Quellen

- aktuelles Zielrepository nach G3-010-Abnahme: Kandidat `3cc85e1`, QA
  `f3e2c94`, PO-051-Abnahme `39f95ec`, Bindung `e8e736d`;
- aktuelle App, strikt read-only:
  `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current` bei
  `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`, sichtbare Runtime `968c320`;
- aktuelle Website, strikt read-only:
  `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work`
  bei `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`;
- akzeptierte lokale Reader-/ID-/Lifecyclebasis aus G3-006 bis G3-008;
- `docs/architecture/ADR-004-IMMUTABLE-CONTENT-CONTRACT.md` und
  `docs/architecture/ADR-007-OFFLINE-AND-CACHE-CONTRACTS.md`;
- `docs/architecture/MIGRATION-WAVES.md`, Wave 4.

### Aktive Legacy-Runtime

App und Website enthalten dieselbe `reading-state.js`-Basis mit:

- `wrn_bookmarks` fuer gespeicherte Artikel;
- `wrn_read_list` fuer gelesene URL-/ID-Schluessel;
- `wrn_read_positions` fuer Lesepositionen;
- `Spaeter lesen`, `Gemerkt`, `Gelesen`, `Als gelesen/ungelesen` und
  `Lesefortschritt`;
- automatischer Gelesen-Markierung nahe Artikelende;
- lokaler Ansicht fuer gespeicherte und gelesene Artikel.

Die neuere App-Runtime speichert zusaetzlich vollstaendige Offlineartikel und
Medienassets in IndexedDB/Cache Storage. Diese Kopplung wird nicht blind in
G3-011 uebernommen. URLs, Titel oder ganze Artikelobjekte sind keine stabilen
Zielschluessel; die neue Domain verwendet ausschliesslich stabile
kanonische Artikel-IDs.

### Neues Zielprojekt vor G3-011

- `saved` ist eine stabile Navigations-ID in beiden Clients;
- die Ansicht zeigt ehrlich `Noch nicht migriert`;
- G3-006 bis G3-008 stellen lokale kanonische Artikel-IDs, Readerdetails,
  Aliasnormalisierung und sichere Gone-/Revoked-/Unknown-Zustaende bereit;
- G3-010 speichert bereits eine getrennte validierte Theme-Praeferenz; sie
  darf durch Lesedatenloeschung nicht veraendert werden;
- es existiert noch kein versionierter Lesestatusvertrag und kein
  clientlokaler Reading-State-Adapter.

## Fachlicher Zielvertrag

### Zustand V1

Der reine Vertrag modelliert mindestens:

- `schemaVersion: 1`;
- kanonische stabile Artikel-ID;
- `savedAt` fuer bewusst gespeicherte Artikel;
- `readAt` fuer gelesene Artikel oder `null` fuer ungelesen;
- normalisierten Lesefortschritt zwischen 0 und 1 mit `updatedAt`;
- getrennte, deterministische Listenprojektionen fuer `Spaeter lesen` und
  `Gelesen`.

Es werden weder Artikeltext, Titel, Bild-URL, Quell-URL noch personenbezogene
oder Geraetedaten im V1-Zustand dupliziert. Sichtbare Artikeldaten werden
ausschliesslich aus der gebundenen lokalen Content-/Lifecyclefixture
aufgeloest.

### ID- und Lifecycleregeln

- Aliase werden beim Einlesen idempotent auf die kanonische ID normalisiert.
- Doppelte Eintraege werden deterministisch zusammengefuehrt.
- Revoked/Gone duerfen keinen alten Titel, Teaser oder Inhalt aus Lesedaten
  reaktivieren; sie zeigen nur den bereits definierten sicheren
  Lifecyclezustand und eine lokale Loeschaktion.
- Eine syntaktisch valide, derzeit unbekannte ID wird nicht still geloescht.
  Sie bleibt als inhaltsfreier `Derzeit nicht verfuegbar`-Eintrag entfernbar.
- Ungueltige Struktur, ungueltige Werte, fremde Felder und nicht endliche
  Fortschritte werden fail-closed behandelt und niemals als Produktinhalt
  dargestellt.

### Zustandsregeln

- `Speichern` und `Als gelesen` sind voneinander unabhaengig.
- Entfernen aus `Spaeter lesen` loescht nicht automatisch den Lesestatus.
- `Als ungelesen` loescht nur `readAt`; ein vorhandener sicherer Fortschritt
  darf erhalten bleiben.
- Ein Fortschritt nahe Artikelende darf deterministisch als gelesen gelten;
  der exakte Schwellwert wird im Vertrag zentral festgelegt und getestet.
- Ein Fortschritt unterhalb der Mindestschwelle wird nicht gespeichert.
- Die letzten zulaessigen V1-Daten bleiben bei Storagefehlern im Speicher
  unveraendert; die UI meldet den Fehler sichtbar und behauptet keinen Erfolg.

### Speicherung und Loeschung

- App und Website besitzen getrennte versionierte Storagekeys und Adapter.
- Speicherung erfolgt atomar als ein validiertes V1-Dokument je Client.
- Einzelauswahl: aus Spaeter-lesen entfernen; gelesen/ungelesen umschalten;
  Fortschritt zuruecksetzen.
- Bereichsloeschung: alle gespeicherten Artikel oder alle Lesemarkierungen
  nach klarer Bestaetigung entfernen.
- `Alle Lesedaten loeschen` entfernt nur G3-011-Daten. Theme, Navigation,
  Contentfixtures und andere Einstellungen bleiben unveraendert.
- Kein Cookie, IndexedDB, Cache Storage, Service Worker oder Remoteadapter in
  diesem Slice.

### Legacy-Migrationsvertrag

G3-011 darf eine reine, selbst erstellte Testfixture fuer die drei bekannten
Legacykeys modellieren. Die Migration:

- liest keine echte Nutzerdatei und keinen Legacy-Arbeitsbaum schreibend;
- ordnet nur belegbar aufloesbare URL-/ID-Schluessel einer kanonischen ID zu;
- importiert keine Artikeltexte, Bilder oder URLs in den neuen V1-Zustand;
- bewahrt nicht aufloesbare, aber syntaktisch sichere Identitaeten als
  inhaltsfreie Quarantaene oder meldet sie sichtbar im Migrationsresultat;
- ist idempotent und ueberschreibt keine neueren gueltigen V1-Daten;
- wird in G3-011 nur als reine Domain-/Fixturelogik getestet. Der echte
  Android-/Website-Cutover bleibt ein spaeteres eigenes Gate.

## Scope

### Erlaubte Pfade nach `START WRN-G3-011`

- `packages/content-contracts/src/index.ts` und zugehoerige Tests fuer den
  versionierten V1-Lesestatusvertrag;
- `packages/domain/src/index.ts` und zugehoerige Tests fuer reine Zustands-,
  Reconciliation-, Lifecycle- und Migrationsfunktionen;
- `packages/test-support/fixtures/wrn-g3-011/**` und notwendige
  Test-Support-Exports;
- `apps/mobile/src/App.tsx`, `apps/mobile/src/styles.css`, App-Tests und ein
  eng begrenzter clientlokaler Storageadapter;
- `apps/website/src/App.tsx`, `apps/website/src/styles.css`, Website-Tests und
  ein eng begrenzter clientlokaler Storageadapter;
- `tests/e2e/foundation.spec.ts` sowie eng notwendige lokale
  G3-011-Evidenzhelfer;
- `docs/tasks/WRN-G3-011-*`, `docs/evidence/WRN-G3-011/**`,
  `docs/handoffs/WRN-G3-011-*` und notwendige Governance-/Statusdokumente.

Rootkonfiguration, Dependencies und andere Produktpfade bleiben gesperrt.
Jede unerwartete Pfadnotwendigkeit stoppt die Arbeit und braucht eine neue
sichtbare Entscheidung.

### Nicht-Ziele

- vollstaendige Offlineartikel, Bilder oder Medienassets speichern;
- IndexedDB-, Cache-Storage-, Service-Worker- oder Android-Datenmigration;
- Konto, Cloudsync, Export/Import oder geraeteuebergreifende Merkliste;
- echte Nutzer- oder Legacydaten lesen, kopieren oder veraendern;
- Personalisierung, `Fuer mich`, Empfehlungen oder Tracking aus Lesestatus;
- Inhalte, echte 935-ID-Migration oder produktive Contentrevision;
- Uebersetzung, Zusammenfassung, Podcast, Zine, Medien oder Push;
- Theme-, Header-, Navigation-, Font- oder allgemeines Redesign;
- Remote/CI, Cloudflare, Hostinger, Deployment, Signierung, Upload oder
  Veroeffentlichung.

### Verbotene Aktionen

- aktuelle App, aktuelle Website, deren Repositories, Datenrepository oder
  Liveinfrastruktur veraendern;
- Mitarbeiterstart vor `START WRN-G3-011`;
- unvalidierte `localStorage`-Daten direkt in Reactzustand uebernehmen;
- URL, Titel oder Artikelobjekt als neuen Primaerschluessel verwenden;
- unaufloesbare IDs still loeschen oder alte Inhalte bei Revocation anzeigen;
- Lesestatus an Netzwerk, URL, Cookies, Logs oder Analytics senden;
- Tests abschwaechen oder bestehende G3-002-bis-G3-010-Flows neu gestalten.

## Akzeptanzkriterien

1. Ein versionierter V1-Vertrag validiert ausschliesslich erlaubte lokale
   Reading-State-Felder und scheitert bei Manipulation fail-closed.
2. Beide Clients verwenden getrennte Storagekeys, aber dieselbe reine Domain-
   semantik und dieselben kanonischen Artikel-IDs.
3. Speichern/Entfernen funktioniert aus Feed und Reader; die Ansicht
   `Gespeichert` zeigt korrekte Zaehler, Empty-, Ready- und Fehlerzustaende.
4. Gelesen/Ungelesen und Lesefortschritt sind unabhaengig von `Spaeter lesen`,
   reproduzierbar und nach Reload erhalten.
5. Ein langer Reader setzt/aktualisiert Fortschritt deterministisch; nahe
   Artikelende wird genau nach Vertragsregel gelesen markiert.
6. Aliaszustand wird kanonisiert; Gone/Revoked/Unknown reaktivieren keinen
   gespeicherten Inhalt und bleiben lokal entfernbar.
7. Einzel-, Bereichs- und Alle-Lesedaten-Loeschung sind bestaetigt, sichtbar
   erfolgreich oder ehrlich fehlgeschlagen und lassen das Theme unangetastet.
8. Legacy-Testmigration ist idempotent, importiert keinen Artikelpayload und
   ueberschreibt keine neueren V1-Daten.
9. App und Website bleiben bei 320/360/390/412 Pixeln, Querformat, Tablet,
   Desktop und 200-Prozent-Reflow ohne horizontalen Overflow oder verdeckte
   Aktionen; alle Ziele sind mindestens 44 x 44 CSS-Pixel.
10. Tastatur, Fokus, Escape/Zurueck, Reload und Browser-History funktionieren
    fuer Saved-Liste, Reader und Bestaetigungsdialoge.
11. Browser-QA meldet null Axe-Verstoesse, unerwartete Konsolenfehler,
    externe Requests, Cookies oder andere Storagekeys als die zwei erlaubten
    clientlokalen V1-Keys.
12. Alle akzeptierten G3-002-bis-G3-010-Funktionen, beide Builds und die
    vollstaendige bestehende Testmatrix bleiben GREEN.
13. Ein unabhaengiger QA-Agent prueft den unveraenderten Kandidaten und meldet
    null offene Blocker, Highs oder Mediums. Ein Low braucht PO-Entscheidung.
14. Erst die sichtbare Product-Owner-Abnahme schliesst G3-011.

## Tests und visuelle Belege

### Automatisiert

- Schema-/Contracttests fuer gueltig, falsch versioniert, fremde Felder,
  Duplikate, ungueltige Zeitwerte und Fortschrittsgrenzen;
- reine Domaintests fuer Save/Remove, Read/Unread, Progress, Merge,
  Aliasnormalisierung, Gone/Revoked/Unknown und Loeschung;
- Legacy-Migrationsfixtures fuer wiederholten Lauf, Teilmapping, ungueltiges
  JSON, neuere V1-Daten und No-Payload-Ziel;
- Komponenten-/Integrationstests fuer beide Clients, Storagefehler,
  Reload, History, Fokus und Bestaetigungen;
- bestehende volle Unit-/Contract-/Boundarysuite, Format, Lint, Typen und
  beide Builds;
- voller Browser-E2E-Lauf plus gezielte G3-011-Faelle.

### Verbindliche visuelle Matrix

- App 390 x 844: leer, gespeicherte Liste, gelesen, Fortschritt und
  Loeschbestaetigung in Dunkel und Pink;
- App 320 x 568, 360 x 800, 412 x 915, 844 x 390 und 390 x 844 bei 200 Prozent;
- Website 390 x 844: leer, gespeichert, gelesen und Loeschbestaetigung;
- Website 800 x 1280, 1024 x 800, 1440 x 900 und 1920 x 1080;
- je Client ein Gone/Revoked/Unknown-Fall ohne Inhaltsleck;
- je Client Tastaturfokus, Storagefehler und Reloadpersistenz;
- identische App-/Website-Kontaktboegen fuer denselben lokalen Zustand.

Jeder Beleg nennt Kandidat, Client, Viewport, Theme, Zustand und Datum.

## Daten, Privacy, Security und Kosten

- ausschliesslich lokale stabile Artikel-IDs und minimale Zeit-/Fortschrittswerte;
- keine Inhalte, URLs, Bilder, Suchbegriffe, Standort- oder Geraetedaten im
  neuen V1-Reading-State;
- keine Cookies, externen Requests, Telemetrie, Provider oder Cloudkosten;
- keine neue Dependency und kein Download;
- maximale Eintragszahl und Payloadgroesse werden begrenzt und getestet;
- Revocation/Gone dominiert gespeicherten Nutzerzustand;
- Codex-Arbeit innerhalb vorhandener Abokontingente; keine bezahlte API.

## Rollback/Ruecknahme

- Ausgang ist der akzeptierte G3-010-Stand `39f95ec` mit Bindung `e8e736d`.
- Die spaetere Umsetzung erhaelt getrennte Contract-, Produkt- und
  QA-Checkpoints.
- Ruecknahme entfernt nur V1-Reading-State-Vertrag, lokale Fixture,
  clientlokale Adapter, Saved-/Read-/Progress-UI und zugehoerige Tests.
- Keine Ruecknahme darf vorhandene V1-Daten automatisch loeschen. Ein aelterer
  Client zeigt bei unbekannter Version einen sicheren Read-only-/Reset-mit-
  Bestaetigung-Zustand.
- Theme und alle G3-002-bis-G3-010-Funktionen bleiben unveraendert.

## Geplante Agentensequenz nach dem Startgate

1. `backend_data_reliability_engineer`: einziger schreibender Agent fuer
   Vertrag, Domain, Fixture und Migrationstests; eigener Checkpoint/Handoff.
2. Agent beenden; danach `frontend_brand_engineer`: getrennte App-/Website-
   Adapter und UI, Komponenten-/E2E-Tests; eigener Kandidat/Handoff.
3. Agent beenden; danach `visual_accessibility_reviewer`: unabhaengige QA des
   unveraenderten Kandidaten; nur Evidenz und Handoff schreiben.
4. Nach der PO-055-Korrektur: vollstaendige frische Re-QA; bei GREEN danach
   genau ein read-only `independent_architecture_reviewer` fuer PO-056 ueber
   den gesamten lokalen Zielprojektstand G3-001 bis G3-011.
5. Bei Finding: Stopp und sichtbare Product-Owner-Entscheidung. Keine
   stillschweigende Eigenkorrektur.
6. Reserve `security_privacy_reviewer` nur bei unerwartetem Datenfluss,
   Payloadpersistenz oder Loeschwiderspruch.
7. Reserve `data_migration_specialist` nur falls der reine Legacy-Fixture-
   Vertrag nicht ohne reale Datenmutation entscheidbar ist.

## Uebergabeformat

- geaenderte Dateien nach Eigentumsbereich;
- Ausgangs-, Contract-, Produkt- und QA-/Evidenzcheckpoint;
- Schema-, ID-, Lifecycle-, Persistenz-, Migrations- und Loeschbelege;
- alle Testbefehle und Ergebnisse;
- beschriftete Kontaktboegen und Visual-QA-Bericht;
- Storagekey-, Request-, Cookie-, Overflow-, Touchziel- und A11y-Bericht;
- Annahmen, Findings, Restrisiken und exakter Rueckkehrpunkt;
- Handoff nach `docs/templates/AGENT-HANDOFF.md` mit `END-CHECK: :)`;
- keine ungefragte Folgeaktion.

## Freigabegrenze

Diese Vorbereitung startet keine Umsetzung. Nur der spaetere exakte sichtbare
Befehl

```text
START WRN-G3-011
```

erlaubt den schriftlich begrenzten lokalen Produkt-/Testscope und die strikt
sequenzielle Mitarbeiteraktivierung. Auch dieses Gate erlaubt keine echten
Nutzerdaten, Offline-Asset-Caches, Android-, Remote-, Deployment- oder
Releaseaktion.
