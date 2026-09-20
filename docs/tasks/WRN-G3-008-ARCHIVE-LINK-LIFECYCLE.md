# Task Brief – WRN-G3-008 Archiv- und Link-Lebenszyklus

## Identitaet

- Task-ID: `WRN-G3-008`
- Titel: lokales Artikelarchiv, Alias-/Gone-/Revocation-Aufloesung und stabile
  Share-Ziele
- Phase/Welle: G3, abschliessender lokaler Vertrags-/UI-Slice der Wave 3
- Paritaets-/Risiko-ID: primaer `NEWS-06`, `NEWS-10`, R-17, R-27 und R-33;
  mit `NEWS-03`, `WEB-01`, `WEB-02`, `WEB-03`, `SYS-07` und `SYS-08` als
  Integrationsgrenzen
- Auftraggeber: Product Owner
- Owner-Agent: Chief AI Architect
- spaetere sequenzielle Implementierungsowner: zuerst Backend/Data Reliability
  Engineer fuer Vertrag, Fixture und reine Aufloesungsdomain; danach Frontend
  Brand Engineer fuer getrennte Mobile-/Website-Projektionen; danach
  unabhaengige QA
- Reserve: Security/Privacy Reviewer bei Revocation-Bypass, Inhaltsoffenlegung,
  URL-/HTML-Injection oder unbeabsichtigtem Share; Data Migration Specialist
  erst bei einem spaeteren echten ID-Mapping; Architecture Reviewer nur bei
  notwendiger ADR-Aenderung
- Modellrouting: Terra/high fuer Vertrag und regulaere Umsetzung; Luna/medium
  nur fuer mechanische Belegtabellen; Spark/medium nur fuer eine exakt
  spezifizierte Kleinkorrektur; Sol/high nur bei dokumentiertem Security-,
  Migrations- oder Architekturtrigger
- Delegation nach Start: erlaubt, aber strikt sequenziell; hoechstens ein
  Contract-/Domain-Writer, danach ein Frontend-Writer, danach unabhaengige QA
- Status: **VISUELL AKZEPTIERT UND GESCHLOSSEN – SEPARATER BRANDNACHTRAG OFFEN**
- Vorbereitungsgate: PO-042 am 25. August 2026 mit `gerne weiterfahren` nach
  der ausdruecklichen Empfehlung `BEREITE WRN-G3-008 VOR`
- Vorbereitungscheckpoint: `23ad86f`
- Ausgangscheckpoint: G3-007-Abschluss `fe9a848`; Statusabgleich `2c75062`
- Arbeitsbranch: `codex/g3-008-archive-link-lifecycle`
- einziges Implementierungsgate: `START WRN-G3-008`
- Implementierungsgate: PO-043 am 25. August 2026 mit exakt
  `START WRN-G3-008` erteilt
- Startcheckpoint: `3d534b1`
- Contract-/Domain-/Fixture-Checkpoint: `5d01d77`
- Produktkandidat: `9affac8`
- unabhaengiger QA-/Evidenzcheckpoint: `2ec52ff`
- Product-Owner-Sichtabnahme: PO-044 am 25. August 2026 mit exakt
  `G3-008 VISUELL AKZEPTIERT`
- Abschluss-/Branddiagnosecheckpoint: `08d63bf`
- separater Nachtrag: `docs/evidence/WRN-G3-008-BRAND-PARITY-FOLLOWUP.md`

## Ziel in beobachtbarer Sprache

App und Website erhalten ein kleines lokales Nachrichtenarchiv mit
selbst erstellten Testartikeln. Ein historischer Artikel kann aus dem Archiv
geoeffnet und ueber eine stabile kanonische Websiteadresse geteilt werden.

Ein alter Alias fuehrt immer nachvollziehbar zum kanonischen Artikel. Eine
bewusst entfernte oder gesperrte ID zeigt dagegen nur einen neutralen,
barrierearmen Nicht-verfuegbar-Zustand und niemals alten Titel, Teaser,
Volltext, Share-Ziel oder eine andere Artikel-ID. Eine unbekannte ID bleibt
vom bekannten Gone-/Revocation-Zustand unterscheidbar.

Der Slice arbeitet nur mit lokalen, selbst erstellten Testfaellen. Er importiert
keine der 935 Legacyseiten, liest keine Livequelle und veraendert weder Hosting
noch Android oder produktive Daten.

## Verifizierte Ausgangslage

- G3-006 liefert den akzeptierten lokalen Reader fuer drei kanonische
  Fixture-IDs.
- G3-007 liefert fuer dieselben IDs deterministische statische Landingpages,
  Canonical/JSON-LD, Sitemap/Robots und ein hashgebundenes
  Publikationsmanifest.
- Der Manifest-v1-Vertrag kennt bereits getrennte `activeFeedIds`,
  `archiveIds`, `landingIds`, `redirectSourceIds` und `sitemapArticleIds`.
- In der akzeptierten Fixture sind Redirect-, Gone- und Revocationfaelle
  bewusst leer; eine belastbare Aufloesung ist noch nicht implementiert.
- `Gespeichert` und `Mehr` sind vorhandene stabile Navigationsziele. Das
  Archiv darf als klarer Unterbereich von `Mehr` entstehen, ohne die
  akzeptierten fuenf Hauptziele umzubenennen oder neu zu ordnen.
- Die autoritative Legacy-Website bleibt read-only bei `9a59b17` mit 935
  Artikelverzeichnissen. Diese Zahl ist nur Migrationsbeleg, kein Importumfang.

## Verbindlicher Zielvertrag

### 1. Lokale Lifecycle-Fixture

Eine neue, separat hashgebundene G3-008-Fixture bildet mindestens folgende
Faelle ab:

1. eine aktive kanonische ID;
2. eine nicht mehr aktive, aber archivierte kanonische ID mit selbst
   erstelltem Volltext;
3. eine alte Alias-ID, die genau auf eine kanonische archivierte ID zeigt;
4. eine dauerhaft `gone` markierte ID ohne Inhalt;
5. eine durch eine hoehere monotone Revocationrevision `blocked` oder
   `replaced` markierte ID, deren alter Payload nicht mehr erreichbar ist;
6. eine syntaktisch gueltige, aber unbekannte ID.

Keine ID wird wiederverwendet. Aliasquellen sind disjunkt zu kanonischen IDs;
Redirectketten, Zyklen, Selbstverweise, unbekannte Ziele, mehrere Ziele und
Rueckspruenge auf eine niedrigere Revocationrevision sind ungueltig.

### 2. Reine Artikelaufloesung

Eine plattformneutrale, seiteneffektfreie Domainfunktion liefert exakt einen
der Zustaende:

- `canonical-active`;
- `canonical-archived`;
- `redirected` mit kanonischer Ziel-ID;
- `gone` ohne Inhalt;
- `revoked` ohne Inhalt;
- `unknown` ohne Inhalt;
- `invalid` fuer unsichere Eingaben.

Revocation hat Vorrang vor Contentrevision, Archiv, Landingpage, Alias,
Reader, Share und Cacheannahme. Kein Fehlerfall darf still auf den ersten,
neuesten oder aehnlich benannten Artikel zurueckfallen.

### 3. Archivansicht

- App und Website erhalten getrennte responsive Archivprojektionen auf Basis
  derselben validierten Domainergebnisse.
- Das Archiv ist ueber `Mehr` erreichbar; bestehende Hauptnavigation und
  G3-004-History-/Fokusregeln bleiben erhalten.
- Nur kanonische, direkt aufloesbare Archivartikel werden gelistet.
- Sortierung ist deterministisch nach Publikationsdatum und stabiler ID.
- Quelle, Datum und Originalsprache bleiben sichtbar; Archivstatus wird klar,
  aber nicht nur durch Farbe vermittelt.
- Suche/Filter ueber das produktive Archiv und gespeicherter Lesestatus sind
  nicht Teil dieses Slices.

### 4. Deep Links und sichtbare Fehlerzustaende

- Kanonische aktive und historische IDs oeffnen denselben akzeptierten Reader.
- Ein Alias wird auf die kanonische ID normalisiert; Browser-History darf
  keinen Redirectloop erzeugen und die sichtbare URL darf keine Alias-ID als
  kanonisch behaupten.
- `gone`, `revoked`, `unknown` und `invalid` besitzen getrennte, ehrliche
  Texte. Gone/Revoked zeigen keine entfernten Metadaten und nennen keine
  vertrauliche Begruendung.
- Zurueck, Escape und Fokus-Rueckkehr funktionieren aus Archiv, Reader und
  Nicht-verfuegbar-Zustand.

### 5. Stabile Share-Ziele

- Teilen ist eine ausdrueckliche Nutzeraktion im kanonischen Reader.
- Geteilt wird ausschliesslich
  `https://solinaridao.com/articles/<canonical-id>/`.
- Alias-Reader erzeugen immer das kanonische Ziel; Query-, Fragment-,
  Tracking-, Originalquellen- oder lokale Entwicklungsadressen werden nie
  geteilt.
- Gone-, revoked-, unknown- und invalid-Zustaende sind nicht teilbar.
- Der Shareadapter ist injizierbar und lokal testbar. Tests duerfen weder ein
  echtes Shareziel oeffnen noch Clipboard-, native oder Netzwerkaktionen
  ausserhalb des kontrollierten Testadapters ausfuehren.
- Website darf Web Share mit einem ehrlichen lokalen Fallback anbieten;
  Capacitor-/Android-Native-Share bleibt ein spaeteres Androidgate.

### 6. Publisher- und Mengenregeln

- `activeFeedIds subseteq archiveIds`, `landingIds subseteq archiveIds`,
  `sitemapArticleIds = landingIds` und
  `redirectSourceIds` disjunkt zu kanonischen IDs bleiben fail-closed.
- `shareableIds subseteq resolvableIds`; Gone/Revoked sind nie shareable.
- Redirectquellen erscheinen weder als kanonische Landingpage noch als
  Sitemapartikel.
- Eine lokale, deploymentneutrale Redirect-/Gone-Projektion darf fuer Tests
  erzeugt werden. Sie behauptet keinen produktiven HTTP-301/308/410-Status.
- Apache-/Hostinger-Regeln und produktive Originstatus bleiben ein separates
  Release-/Hostinggate.

## Scope nach spaeterem `START WRN-G3-008`

### Erlaubte Schreibpfade

- `packages/content-contracts/src/**` und Tests: additive Lifecycle-, Alias-,
  Gone- und Revocationvertraege
- `packages/domain/src/**` und Tests: reine Aufloesung, Archivprojektion und
  kanonische Share-Zielbildung
- `packages/test-support/fixtures/wrn-g3-008/**`, Loader und Tests: nur neue
  selbst erstellte Lifecycle-Testfaelle
- `apps/mobile/src/**` und Tests: Archivansicht unter `Mehr`, Reader-/Alias-/
  Nicht-verfuegbar- und lokaler Shareadapter
- `apps/website/src/**`, `apps/website/tools/**` und Tests: getrennte
  responsive Archiv-/Readerprojektion und deploymentneutrale
  Lifecycle-Buildintegration
- `tests/e2e/**` und `tools/**`: lokale Flow-, Boundary- und Evidenztests
- `docs/tasks/WRN-G3-008-*`, `docs/evidence/WRN-G3-008/**`,
  `docs/handoffs/WRN-G3-008-*` und notwendige Statusdokumente

### Nicht-Ziele

- keine echten Nachrichten, Medien, Personen- oder Drittinhalte
- kein Import, Mapping oder Reconciliation der 935 Legacyseiten
- keine produktiven Redirects, HTTP-301/308/410, `.htaccess`-, Hostinger- oder
  CDN-Konfiguration
- kein Service Worker, Cache-Purge, Offline-DB, Speicherung oder Lesestatus
- keine produktive Archivsuche oder Archivfilter
- kein Android-/Capacitor-Native-Share, APK/AAB oder Geraetecode
- keine Uebersetzung, Zusammenfassung, Podcast, Push, Analytics oder KI
- kein Remote-/CI-Setup, Deployment, Signierung, Upload oder Veroeffentlichung

### Verbotene Aktionen

- Legacy-App, Legacy-Website, Contentrepository oder Liveinfrastruktur
  veraendern oder dort Generatoren schreibend ausfuehren
- entfernte Inhalte, Sperrgruende, Rechtebehauptungen oder historische
  Zuordnungen erfinden
- einen Gone-/Revoked-Fall durch einen allgemeinen Fallback wieder anzeigen
- echte Share-, Clipboard-, externe Browser- oder Netzwerknachrichten aus QA
  ausloesen
- vorhandene G3-001-bis-G3-007-Tests abschwaechen oder akzeptierte
  Erwartungen blind aktualisieren
- Dependencies, Browser oder Programme ohne separates sichtbares Gate laden
- Git-Remote, Push, Deployment, Signierung, Upload oder Veroeffentlichung

## Akzeptanzkriterien

1. Alle sechs Lifecyclefaelle validieren deterministisch und fail-closed.
2. Aliaszyklen, Selbstverweise, unsichere IDs, unbekannte Ziele,
   Mengenkollisionen und niedrigere Revocationrevisionen werden abgelehnt.
3. Revocation ueberstimmt nachweislich eine aeltere gueltige Contentrevision
   sowie Alias-, Landing-, Reader- und Shareaufloesung.
4. App und Website zeigen dieselbe kanonische Archivmenge in jeweils
   plattformgerechtem Layout.
5. Der historische kanonische Artikel oeffnet vollstaendig im Reader und kann
   ueber eine stabile kanonische Website-URL geteilt werden.
6. Ein Alias oeffnet denselben kanonischen Artikel, normalisiert URL/State und
   erzeugt niemals ein Alias-Shareziel.
7. Gone, revoked, unknown und invalid sind sichtbar unterscheidbar und legen
   keinerlei entfernten Titel, Teaser, Inhalt oder Originalquelle offen.
8. Gone/Revoked sind aus Feed, Archivliste, Landing-/Sitemapmenge und
   Shareaktion ausgeschlossen.
9. Zurueck, Escape, History und Fokus-Rueckkehr funktionieren ohne Loop oder
   Fokusverlust.
10. Smartphone, Tablet und Desktop besitzen keinen horizontalen Hauptseiten-
    Overflow; 200-Prozent-Reflow verliert keinen Inhalt.
11. Tastatur, sichtbarer Fokus, semantische Statusmeldung, Kontrast,
    Screenreader-Smoke und 44-Pixel-Ziele sind geprueft.
12. Beide Builds und der vollstaendige Hauptcheck bleiben GREEN; Browserlauf
    meldet null unerwartete Konsole-, Request-, Storage- oder Shareeffekte.
13. Unabhaengige QA bestaetigt Contract, UI, Accessibility, Securitygrenzen
    und visuelle Matrix mit null offenen Blocker/High. Medium braucht eine
    ausdrueckliche Product-Owner-Entscheidung.
14. Der Product Owner nimmt Archiv, historischen Reader, Aliasnormalisierung
    und Nicht-verfuegbar-Zustaende anhand beschrifteter Belege sichtbar ab.

## Tests und visuelle Belege

### Statisch, Unit und Contract

- Format, Lint, Typen, Importgrenzen und Secret-/Artefaktscan
- Schema, Hash, Sortierung, Eindeutigkeit und alle ID-Mengenbeziehungen
- aktive/historische/alias/gone/revoked/unknown/invalid-Matrix
- Aliaszyklus, Selbstalias, unsicheres Ziel, unbekanntes Ziel und Mehrfachziel
- monotone Revocation, Vorrang vor alter Revision und kein Payload-Leak
- kanonische Share-URL ohne Query, Fragment, Tracking oder Dev-Origin
- deterministische Doppelprojektion

### Integration und Browser E2E

- Archiv ueber `Mehr` in App und Website
- historischer Artikel: Archiv -> Reader -> Zurueck
- Alias-Kaltstart -> kanonischer Reader -> kanonisches Shareziel
- Gone, revoked, unknown und invalid mit Fokus-/Historypruefung
- Share-Erfolg, Share-Abbruch und nicht verfuegbarer Adapter nur ueber Stubs
- beide Builds; keine G3-008-Lifecycleartefakte ausserhalb ihrer Zielpakete
- null echte externe Requests, kein Storage und keine Service-Worker-Aktion

### Verbindliche Screenshotmatrix

- App 390 x 844 hell: Archivliste
- App 390 x 844 dunkel: historischer Reader mit Teilen
- App 390 x 844 bei 200 Prozent: Gone-/Revoked-Zustand
- App 844 x 390: Archiv/Reader ohne verdeckte Aktion
- Website 390 x 844 hell: Archivliste und historischer Reader
- Website 390 x 844 dunkel: Alias auf kanonische ID normalisiert
- Website 800 x 1280: Gone-/Revoked-Vergleich
- Website 1024 x 800: sichtbarer Tastaturfokus
- Website 1440 x 900 und 1920 x 1080: Archiv und begrenzte Lesespalte
- Kontaktboegen: App/Website-Archiv, Alias/kanonisch sowie
  Gone/Revoked/Unknown ohne Inhaltsleck

## Daten, Privacy, Security und Kosten

- nur selbst erstellte lokale Testtexte und erfundene Fixture-IDs
- Gone-/Revocationdatensaetze enthalten keinen entfernten Inhalt und nur eine
  sichere abstrakte Statuskategorie
- keine Livequelle, API, Cloud, KI, Nutzerkonten, Analytics oder Telemetrie
- keine persistierten Such-, Lese-, Share- oder Standortdaten
- Share wird nur nach Nutzeraktion und in QA ausschliesslich ueber einen Stub
  ausgeloest
- erwartete Zusatzkosten: 0 CHF; vorhandene lokale Toolchain verwenden

## Rollback/Ruecknahme

Produktseitiger Rueckkehrpunkt ist der visuell akzeptierte G3-007-Kandidat
`5db27a5` mit GREEN-Re-QA `02a4e90`. G3-008 bleibt additiv. Ruecknahme entfernt
Lifecycle-Fixture, Aufloesungsdomain, Archivansichten und lokalen Shareadapter;
Feed, Entdecken, Reader, Marke, Navigation und G3-007-Landingpages bleiben
unveraendert.

Dieser Task fuehrt keinen produktiven Content-, Hosting-, Cache- oder
Deploymentrollback aus.

## Uebergabeformat

- Ausgangs-, Contract-/Domain-, Frontend- und QA-Checkpoint
- geaenderte Dateien getrennt nach Vertrag, Fixture, App, Website und Tests
- vollstaendige Lifecycle-, Share-, Build-, Browser- und Accessibilitybelege
- beschriftete Screenshots/Kontaktboegen mit Kandidatencommit
- Nachweis, dass Gone/Revoked keinen Payload oder Shareweg besitzen
- offene Findings, Restrisiken und exakter Rueckkehrpunkt
- Handoff nach `docs/templates/AGENT-HANDOFF.md` mit `END-CHECK: :)`
- keine ungefragte Folgefunktion, echte Migration oder Releaseaktion

## Freigabegrenze

PO-042 erlaubte ausschliesslich die Dokumentvorbereitung. PO-043 erteilte am
25. August 2026 exakt `START WRN-G3-008`. Damit ist nur der hier geschriebene
Scope in der festgelegten Sequenz Contract/Domain/Fixture, Frontend und
unabhaengige QA freigegeben.

Auch nach diesem Start bleiben echte Inhalte, die 935 Legacyseiten,
produktive Redirects/410/Revocation, Apache/Hostinger, Service Worker,
Speichern/Offline, Android, Remote/CI, Deployment, Signierung, Upload und
Veroeffentlichung separate Gates.

PO-044 akzeptierte am 25. August 2026 den Kandidaten `9affac8` und die
unabhaengige QA `2ec52ff` visuell. G3-008 ist geschlossen. Der danach
diagnostizierte geerbte Headerparitaetsbefund
`WRN-BRAND-PARITY-M-001` betrifft nicht den akzeptierten Lifecycle-Scope und
benoetigt einen separaten Task.
