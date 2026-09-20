# Task Brief – WRN-G3-009 Marken- und Headerparitaetskorrektur

## Identitaet

- Task-ID: `WRN-G3-009`
- Titel: Aktuelle App-Headerwirkung und korrekte Hintergrundrolle
- Paritaets-/Risiko-ID: `UX-01`, `WRN-BRAND-PARITY-M-001`, `R-04`, `R-31`,
  `R-38`
- Auftraggeber: Product Owner
- Zustaendiger Agent nach separatem Start: `frontend_brand_engineer`
- Modell/Reasoning: `gpt-5.6-terra`, high; unabhaengige QA ebenfalls Terra
- Delegation: nach `START WRN-G3-009` erlaubt, aber strikt sequenziell mit
  genau einem schreibenden Frontend-Agenten und danach einem unabhaengigen
  read-only QA-Agenten; Reserve nur bei dokumentiertem Ausloeser

## Gate und aktueller Status

- Der Product Owner erteilte am 25. August 2026 exakt
  `BEREITE WRN-G3-009 VOR`.
- Freigegeben ist nur diese Dokumentvorbereitung mit Paritaets-/Abnahmeplan,
  Vorbereitungshandoff und konsistenten Statusdokumenten.
- Es wurde kein Produkt-, Test-, Fixture-, Asset- oder Legacycode geaendert und
  kein Mitarbeiter gestartet.
- Dokumentarischer Vorbereitungscheckpoint: `c0ae31f`.
- Der Product Owner erteilte am 25. August 2026 exakt `START WRN-G3-009`.
- Damit ist nur der hier schriftlich begrenzte lokale Produkt-/Testscope in
  der festgelegten Sequenz freigegeben; Startcheckpoint `5e9f64b`.
- Produktkandidat: `973c129`; Implementierungshandoff: `aedaa02`.
- Unabhaengiger QA-/Evidenzcheckpoint: `692fe24`; technische QA GREEN ohne
  offene Blocker, Highs, Mediums oder Lows.
- Technischer GREEN-Statuscheckpoint: `8339aa2`.
- Sichtbare Product-Owner-Abnahme: PO-047 am 25. August 2026 mit exakt
  `G3-009 VISUELL AKZEPTIERT`; Scope geschlossen.

## Ziel in beobachtbarer Sprache

Die neue Mobile-App soll im Header wieder wie die aktuelle `News App 2`
wirken: dunkler beziehungsweise themegerechter Chrome-Hintergrund, eine grosse
und unverzerrte Solinaridao-Marke und kein blaues redaktionelles Foto direkt im
Header. Die Website bleibt eine eigene responsive Komposition und behaelt den
bereits akzeptierten kompakten Header, verwendet das redaktionelle
`app-background.webp` aber ebenfalls nicht als Headerbild.

Die Korrektur darf weder ein allgemeines Redesign noch eine neue Funktion sein.
Alle in G3-002 bis G3-008 akzeptierten lokalen Funktionen und Flows bleiben
unveraendert.

## Ausgangslage und Belege

### Autoritative Quellen

- aktuelle App, strikt read-only:
  `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
  bei Gesamt-HEAD `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0` und sichtbarem
  Runtime-Commit `968c320adfe87d1e11e88f99f448a435d4242750`;
- aktuelle Website, strikt read-only:
  `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work`
  bei `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`;
- Diagnose:
  `docs/evidence/WRN-G3-008-BRAND-PARITY-FOLLOWUP.md`;
- bestehende visuelle App-/Website-Baselines:
  `docs/handoffs/WRN-G1-002-visual-app-baseline.md` und
  `docs/handoffs/WRN-G1-006-visual-website-baseline.md`;
- akzeptierte G3-003-Markenbasis und spaetere Funktionsslices G3-004 bis
  G3-008 als Regressionbaseline.

### Product-Owner-Referenz

Der Product Owner stellte am 25. August 2026 einen aktuellen
Mobile-App-Screenshot bereit:

- Abmessung: `591 x 1280` Rasterpixel;
- SHA-256:
  `564718A50876D6879E134ED928F5758261E6D7BBBAC66E05B52A1BE6410428FC`;
- sichtbare Merkmale: nahezu schwarzer Header, grosse Solinaridao-Marke,
  rechts angeordnete Web-/Menue-/Sprachaktionen und kein blaues Headerfoto.

Der Screenshot bleibt wegen sichtbarer redaktioneller Drittinhalte ein nur
lokal betrachteter Product-Owner-Beleg. Er wird weder importiert noch
versioniert. Da Pixeldichte und CSS-Viewport des Aufnahmegeraets unbekannt
sind, dient er fuer Komposition und Markenwirkung, nicht als exakte
CSS-Pixelmessung.

### Aktive Runtime-Belege statt Dateinamensannahme

- App `index.html`: `.next-header` verwendet
  `solinaridao-header-mark-filled.png`.
- App `news-app-2.css`: `.next-header` verwendet
  `background: var(--chrome-strong)`; die Markenbreite ist bei typischen
  mobilen Breiten mit `--brand-size: 118px` belegt und wird bei sehr schmalen
  Viewports reduziert.
- App und Website `app-background.css`: `app-background.webp` ist ein stark
  abgedunkelter Body-/Recoveryhintergrund, kein direktes Headerbild.
- Website `news-app-2.css`: auch der aktive Websiteheader nutzt den dunklen
  Chrome-Hintergrund; die Websitekomposition bleibt dennoch eigenstaendig.
- Neues Projekt: `--wrn-asset-editorial-background` wird derzeit direkt in
  `apps/mobile/src/styles.css` und `apps/website/src/styles.css` im Header
  verwendet. Das Assetmanifest erlaubt faelschlich `mobile-header` und
  `website-header`.

## Scope nach einem spaeteren `START WRN-G3-009`

### Erlaubte Pfade

- `packages/brand-tokens/assets/asset-manifest.json`: belegte Runtime-Rolle von
  `app-background.webp` korrigieren; keine neuen Assets;
- `packages/brand-tokens/src/styles.css` und bei zwingender semantischer
  Versionierung `packages/brand-tokens/src/index.ts`;
- `apps/mobile/src/App.tsx` und `apps/mobile/src/styles.css`: nur mobile
  Header-/Markenkomposition und eng notwendige Semantik;
- `apps/website/src/App.tsx` und `apps/website/src/styles.css`: nur Entfernung
  der falschen Headerbildrolle und Erhalt der kompakten responsiven
  Websitekomposition;
- eng notwendige bestehende Komponenten-, Boundary- und E2E-Tests;
- `docs/tasks/WRN-G3-009-*`, `docs/evidence/WRN-G3-009/**`,
  `docs/handoffs/WRN-G3-009-*` und notwendige Statusdokumente.

Rootkonfiguration, Dependencies und andere Produktpfade bleiben gesperrt. Wenn
eine Umsetzung sie wider Erwarten benoetigt, ist vor jeder Aenderung ein neues
sichtbares Product-Owner-Gate erforderlich.

### Verbindliche Korrekturgrenzen

1. `app-background.webp` darf nach der Korrektur in keinem mobilen oder
   Website-Header mehr als direktes Hintergrundbild vorkommen.
2. Das Asset darf im Repository verbleiben. Seine spaetere Body-/Recoveryrolle
   wird nur verwendet, wenn sie fuer diesen engen Korrekturscope ohne neue
   Seitenwirkung erforderlich ist; andernfalls bleibt es ungenutzt.
3. Mobile verwendet die vorhandene, hashgebundene
   `solinaridao-header-mark-filled.png` unverzerrt und deutlich groesser als
   die aktuelle neue 2,75-rem-Marke. Die aktive Legacy-CSS-Groesse von 118
   CSS-Pixeln bei typischen mobilen Breiten und 94 CSS-Pixeln bei sehr schmalen
   Breiten ist die Ausgangsreferenz, kein Grund fuer Overflow oder verdeckten
   Inhalt.
4. Dark-, Light- und weitere vorhandene Themes verwenden semantische
   Chrome-/Surface-Farben. Kein Theme darf die blaue redaktionelle Grafik im
   Header wieder aktivieren.
5. Website und Mobile konsumieren gemeinsame semantische Tokens, behalten aber
   getrennte Headerlayouts. Der nach PO-026 akzeptierte kompakte Websiteheader
   darf nicht wieder vergroessert werden.
6. Es werden keine funktionslosen Web-, Menue- oder Sprachbuttons erfunden.
   Bereits funktionsfaehige lokale Aktionen bleiben erhalten; spaetere
   Funktionsparitaet erhaelt eigene Slices. Das Layout soll spaetere Aktionen
   nicht strukturell blockieren.
7. Markennamen, Fallback, Skip-Link, Fokus, Navigation, Reader, Suche, Archiv,
   Teilen und alle akzeptierten lokalen Zustandsansichten bleiben erhalten.

### Nicht-Ziele

- keine vollstaendige visuelle Paritaet der gesamten aktuellen App;
- keine neue oder geaenderte Web-, Menue-, Sprach-, Theme- oder
  Einstellungsfunktion;
- keine Neuordnung der akzeptierten Bottom-/Website-Navigation;
- keine Karten-, Feed-, Reader-, Such-, Filter-, Archiv-, Share-,
  Lifecycle-, SEO- oder Inhaltsaenderung;
- keine echten Nachrichten, Artikelbilder, Feeds, Datenbanken oder Dienste;
- keine neue Marke, Logoneuzeichnung, Bildbearbeitung, generatives Asset oder
  zusaetzlicher Assetimport;
- kein Fontdownload und keine Fontentscheidung;
- keine Androidhuelle, Safe-Area-Nativvalidierung, AAB/APK oder Play-Arbeit;
- keine Remote-/CI-, Cloudflare-, Hostinger-, Deployment-, Signier-, Upload-
  oder Veroeffentlichungsaktion.

### Verbotene Aktionen

- jede Aenderung an aktueller App, aktueller Website, deren Repositories,
  Datenrepository oder Liveinfrastruktur;
- Import oder Commit des Product-Owner-Screenshots;
- Kopieren weiterer Legacyassets oder Drittmedien;
- pauschales Ersetzen akzeptierter Screenshots oder Abschwaechen bestehender
  Tests;
- Mitarbeiterstart vor `START WRN-G3-009`;
- parallele Schreibarbeit an Brandtokens oder Clientheadern.

## Akzeptanzkriterien

1. Mobile Dark zeigt bei 390 x 844 einen dunklen Chrome-Header ohne sichtbare
   blaue Hintergrundgrafik und eine prominente, unverzerrte
   Solinaridao-Marke.
2. Mobile 320/360/390/412, Tablet, Querformat und 200-Prozent-Reflow besitzen
   keinen horizontalen Hauptseitenoverflow, keinen verdeckten Inhalt und keine
   Kollision von Marke, Aktionen oder Hauptinhalt.
3. Mobile Light und weitere vorhandene Themes zeigen eine themegerechte
   Surface statt des redaktionellen Headerbilds; Kontrast und Fokus bestehen.
4. Der Websiteheader bleibt auf Smartphone, Tablet und Desktop kompakt und
   verwendet ebenfalls kein `app-background.webp`.
5. Das Assetmanifest nennt fuer `app-background.webp` keine Headeroberflaeche;
   Quellcommit, Rechte, Bytes und SHA-256 bleiben korrekt. Kein neues Asset
   kommt hinzu.
6. Negative Tests erkennen eine erneute Verwendung des redaktionellen Assets
   in Mobile- oder Website-Headern.
7. Bestehende Markennamen-/Fallback-, Accessibility-, Navigation-, Feed-,
   Suche-, Reader-, SEO-, Archiv-, Lifecycle- und Sharetests bleiben gruen;
   beide Clients bauen reproduzierbar.
8. Browser-QA meldet keine neuen Konsolenfehler, externen Requests,
   Storage-Schreibvorgaenge oder ungeklaerten Layoutfehler.
9. Ein unabhaengiger QA-Agent prueft den unveraenderten Kandidaten und meldet
   null offene Blocker, Highs oder Mediums. Ein Low braucht Dokumentation und
   Product-Owner-Entscheidung.
10. Der Product Owner beurteilt anhand beschrifteter Vorher-/Nachher-Belege die
    sichtbare Headerwirkung. Erst seine sichtbare Abnahme schliesst G3-009.

## Tests und visuelle Belege

### Automatisiert

- Format, Lint, Typen, Frozen Lockfile und Import-/Boundaryregeln;
- Assetmanifest-, Hash- und Negativtest fuer verbotene Headerrolle;
- bestehende vollstaendige Unit-/Contract-/Komponenten- und Boundarysuite;
- beide Builds;
- bestehender Browser-E2E-Lauf plus gezielte Headerfaelle fuer Semantik,
  Fallback, Tastatur, Fokus, Touchziele, Reflow, Overflow, Themes, Konsole,
  Requests und Storage.

### Verbindliche visuelle Matrix

- Mobile: 320 x 568 Dark, 360 x 800 Dark, 390 x 844 Dark und Light,
  412 x 915 Dark, 600 x 960 Dark, mindestens ein Querformat sowie 390 x 844
  bei 200-Prozent-Reflow;
- Website: 390 x 844 Dark/Light, 800 x 1280 Dark, 1024 x 800 Dark,
  1440 x 900 Dark/Light und layoutaequivalenter 200-Prozent-Reflow;
- mindestens je ein absichtlich fehlschlagendes Markenbild mit lesbarem
  Textfallback;
- direkte Mobile-Vorher-/Nachher-Tafel gegen den letzten akzeptierten neuen
  Kandidaten und eine getrennte Kompositionsreferenz zum aktuellen
  Product-Owner-Screenshot;
- Website-Vorher-/Nachher-Tafel zum Nachweis, dass der Header kompakt bleibt;
- jeder Beleg nennt Kandidatencommit, Client, Viewport, Theme, Zustand und
  Testdatum.

## Daten, Privacy, Security und Kosten

- keine Nutzer-, Live-, redaktionellen oder personenbezogenen Daten;
- keine externen Runtimeanfragen, Telemetrie oder neuen Speicherungen;
- keine API-/KI-Ausgaben ausserhalb vorhandener Codex-Abokontingente;
- keine neue Dependency, kein Download und keine externe Bildverarbeitung;
- Implementierung und QA laufen nacheinander, damit derselbe Kandidat
  unabhaengig geprueft wird.

## Rollback/Ruecknahme

Ausgangspunkt ist der dokumentierte G3-008-Abschluss auf `ab44e06`. Die
spaetere Produktkorrektur erhaelt einen eigenen Kandidatencheckpoint. Eine
Ruecknahme darf ausschliesslich die G3-009-Aenderungen an Assetrolle,
Brandtokens, Headerkomposition und zugehoerigen Tests entfernen; die
akzeptierten G3-002-bis-G3-008-Funktionen und alle Legacyquellen bleiben
unveraendert.

## Geplante Agentensequenz nach dem Startgate

1. `frontend_brand_engineer`: einziger schreibender Implementierungsagent fuer
   die exakt erlaubten Produkt-/Testpfade; gesicherter Git-Checkpoint und
   Handoff.
2. `visual_accessibility_reviewer`: unabhaengige read-only technische und
   visuelle QA des unveraenderten Kandidaten; nur Evidenz-/Handoffpfade duerfen
   geschrieben werden.
3. Bei Finding: Stopp und sichtbare Product-Owner-Entscheidung. Kein Agent
   korrigiert seinen eigenen Kandidaten stillschweigend.
4. Reserve `context_continuity_auditor` nur bei widerspruechlichem Handoff,
   Quellverwechslung oder YELLOW-Kontextsignal; kein automatischer Start.

## Uebergabeformat

- geaenderte Dateien nach Eigentumsbereich;
- Ausgangs-, Produktkandidaten- und QA-/Evidenzcheckpoint;
- Assetmanifest-/Hash- und Negativtestbelege;
- alle Testbefehle und Ergebnisse;
- beschriftete Vorher-/Nachher-Screenshots und Visual-QA-Bericht;
- Konsolen-, Request-, Storage-, Overflow-, Touchziel- und A11y-Bericht;
- Annahmen, Findings, Restrisiken und exakter Rueckkehrpunkt;
- Handoff nach `docs/templates/AGENT-HANDOFF.md` mit `END-CHECK: :)`;
- keine ungefragte Folgeaktion.

## Freigabegrenze

`BEREITE WRN-G3-009 VOR` erlaubte keinerlei Produktumsetzung. Der Product Owner
erteilte danach den exakten sichtbaren Befehl

```text
START WRN-G3-009
```

Dieser Befehl erlaubt den hier schriftlich begrenzten lokalen
Produkt-/Testscope und die
sequenzielle Mitarbeiteraktivierung. Auch dieses spaetere Startgate erlaubt
keine Live-, Android-, Remote-, Deployment- oder Releaseaktion.

## Abschluss

Der Produktkandidat `973c129` und die unabhaengige QA `692fe24` wurden durch
PO-047 sichtbar akzeptiert. G3-009 ist geschlossen. Diese Entscheidung startet
kein Folgefeature und erweitert keine Live-, Android-, Remote-, Deployment-
oder Releasefreigabe.

## Post-Acceptance-Folgebefund

Nach der Abnahme benannte der Product Owner die themeabhaengige
Logo-/Headerwirkung der aktuellen App als zu erhaltende Staerke. Die
read-only Analyse ist in
`docs/evidence/WRN-G3-009-THEME-REACTIVE-BRAND-FOLLOWUP.md` dokumentiert und
als `WRN-BRAND-THEME-PARITY-M-002` offen. Sie widerruft PO-047 nicht und
erweitert diesen Task nicht. Vorbereitung und Umsetzung brauchen ein neues
sichtbares Gate. Der gemeinsame Abnahme-/Folgebefundcheckpoint ist `bf96d21`.
