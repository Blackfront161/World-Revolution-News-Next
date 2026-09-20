# Task Brief – WRN-G3-010 Theme-reaktive Markenparitaet

## Identitaet

- Task-ID: `WRN-G3-010`
- Titel: Theme-Auswahl und theme-reaktive Header-/Logo-Markenwirkung
- Paritaets-/Risiko-ID: `UX-06`, `UX-09`, `WRN-BRAND-THEME-PARITY-M-002`,
  `R-39`
- Auftraggeber: Product Owner
- Zustaendiger Agent nach separatem Start: `frontend_brand_engineer`
- Modell/Reasoning: `gpt-5.6-terra`, high; unabhaengige visuelle QA ebenfalls
  Terra high
- Delegation: nach `START WRN-G3-010` erlaubt, aber strikt sequenziell mit
  genau einem schreibenden Frontend-Agenten und danach einem unabhaengigen
  read-only QA-Agenten; Reserve nur bei dokumentiertem Ausloeser

## Gate und aktueller Status

- Der Product Owner erteilte am 25. August 2026 exakt
  `BEREITE WRN-G3-010 VOR`.
- Freigegeben ist ausschliesslich diese Dokumentvorbereitung mit Themeinventar,
  Paritaets-/Abnahmeplan, Vorbereitungshandoff und konsistenten
  Statusdokumenten.
- Es wurde kein Produkt-, Test-, Asset- oder Legacycode geaendert und kein
  Mitarbeiter gestartet.
- Dokumentarischer Vorbereitungscheckpoint: `d7880a1`.
- Der Product Owner erteilte am 26. August 2026 exakt
  `START WRN-G3-010`.
- Damit ist ausschliesslich der hier schriftlich begrenzte lokale
  Produkt-/Testscope in der festgelegten Agentensequenz freigegeben.
- Startcheckpoint: `7c9cb7f`.
- Produktkandidat: `3cc85e1`; Implementierungshandoff: `6ec6010`.
- Unabhaengige technische, visuelle, Accessibility- und Runtime-QA:
  `f3e2c94`, GREEN mit null offenen Blockern, Highs, Mediums oder Lows.
- Technisches GREEN ersetzte nicht die sichtbare Product-Owner-Abnahme. Bis zu
  dieser nachfolgend dokumentierten Entscheidung blieben Produktcode und
  Folgefeatures unveraendert.
- Der Product Owner akzeptierte am 26. August 2026 mit exakt
  `G3-010 VISUELL AKZEPTIERT` den Kandidaten und die unabhaengige QA.
- G3-010 ist damit geschlossen. Die Abnahme startet kein Folgefeature und
  erweitert keine Android-, Remote-, Deployment- oder Releasefreigabe.
- Abnahmecheckpoint: `39f95ec`.

## Ziel in beobachtbarer Sprache

App und Website bieten eine einfache, beschriftete Farbdarstellung mit sechs
echten Paletten: Dunkel, OLED-Schwarz, Gedaempft, Pink, Hell und Hoher
Kontrast. Die zusaetzliche Auswahl `System` ist keine siebte Palette, sondern
folgt dynamisch der Betriebssystemvorgabe fuer Hell oder Dunkel.

Beim Themewechsel reagieren Header und Marke sichtbar mit. Das unveraenderte
Solinaridao-Original bleibt die Bildquelle; Schimmer und der zweifarbige
Markenschriftzug verwenden semantische Theme-Akzente. Beim Pink-Theme sind die
belegten Ausgangsakzente `#ff4fa3` und `#9b82ff`. Mobile und Website fuehlen
sich wie dieselbe Marke an, behalten aber ihre getrennten, bereits
akzeptierten Headerlayouts.

Alle Einstellungen bleiben lokal auf dem Geraet. Der Themewechsel sendet
nichts an Server und veraendert keine Inhalte, Navigation oder Datenvertraege.

## Ausgangslage und Belege

### Autoritative Quellen

- aktuelle App, strikt read-only:
  `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current` bei
  Gesamt-HEAD `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0` und sichtbarem
  Runtime-Commit `968c320adfe87d1e11e88f99f448a435d4242750`;
- aktuelle Website, strikt read-only:
  `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work`
  bei `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`;
- Folgebefund:
  `docs/evidence/WRN-G3-009-THEME-REACTIVE-BRAND-FOLLOWUP.md`;
- akzeptierter G3-009-Produktkandidat `973c129` und GREEN-QA `692fe24` als
  visuelle und funktionale Regressionsbasis;
- Asset-/Rechteregister:
  `docs/evidence/WRN-G2-002-ASSET-RIGHTS-REGISTER.md`.

### Aktive App-Runtime

- `index.html` bietet `dark`, `oled`, `soft`, `pink`, `light`, `system` und
  `contrast`.
- `news-app-2.js` validiert diese Auswahl. `system` wird per
  `prefers-color-scheme` zu `light` oder `dark` aufgeloest und reagiert auf
  Aenderungen der Systemvorgabe.
- `news-app-2.css` speist die Dropshadows von `.brand img` und den maskierten
  Markenschriftzug aus `--cyan` und `--red`.
- Das Pink-Theme setzt diese Werte auf `#ff4fa3` und `#9b82ff`.
- `news-app-2-release.css` enthaelt die OLED- und Soft-Paletten.

### Aktive Website-Runtime

- `accessibility.js` bietet und persistiert `theme-dark`, `theme-light`,
  `theme-oled`, `theme-contrast` und `theme-soft` lokal.
- `styles.css` enthaelt getrennte Paletten fuer diese fuenf Website-Themes.
- `news-app-2-website.css` koppelt Logo-Dropshadows und einen zweifarbigen
  Markenstreifen bereits an `--cyan` und `--red`.
- Pink und System sind in der Website-Baseline nicht vorhanden. Ihre Aufnahme
  in G3-010 ist eine bewusste gemeinsame Markenweiterentwicklung, die erst ein
  spaeteres `START WRN-G3-010` freigibt.

### Neues Zielprojekt vor G3-010

- `packages/brand-tokens/src/styles.css` besitzt nur Hell und Dunkel.
- `apps/mobile/src/App.tsx` und `apps/website/src/App.tsx` begrenzen `Theme`
  jeweils auf `light | dark` und verwenden einen Zweizustandsbutton.
- Der Zustand ist noch nicht als versionierte lokale Nutzereinstellung
  implementiert.
- `.mobile-brand-mark img` und `.site-brand-mark img` verwenden keine
  themeabhaengigen Schimmer-/Schriftzugtokens.

## Verbindlicher Themevertrag

| Praeferenz-ID | Sichtbare Palette | App-Baseline | Website-Baseline | Ziel G3-010 |
|---|---|---|---|---|
| `dark` | Dunkel | ja | ja | App + Website |
| `oled` | OLED-Schwarz | ja | ja | App + Website |
| `soft` | Gedaempft/Augenschonend | ja | ja | App + Website |
| `pink` | Pink | ja | nein | App + Website als gemeinsame Marke |
| `light` | Hell | ja | ja | App + Website |
| `contrast` | Hoher Kontrast | ja | ja | App + Website |
| `system` | dynamisch Hell/Dunkel | ja | nein | App + Website; keine eigene Palette |

Regeln:

1. Es gibt genau sechs freigegebene Paletten und sieben Praeferenzwerte.
2. `system` speichert die Praeferenz, nicht das gerade aufgeloeste Ergebnis.
3. Aendert sich die Betriebssystemvorgabe, aktualisieren beide Clients nur bei
   aktiver `system`-Praeferenz sofort ihre effektive Palette.
4. Ungueltige gespeicherte oder injizierte Werte fallen fail-closed auf
   `dark` zurueck.
5. Der normale Erststart verwendet `dark`, passend zu beiden autoritativen
   Baselines. Deterministische Testinjektionen duerfen dies explizit
   ueberschreiben.
6. Die lokale Speicherung erhaelt einen versionierten, inhaltsfreien Key. Sie
   enthaelt ausschliesslich die Theme-ID und keine Nutzer-, Artikel- oder
   Geraetedaten.
7. Die effektive Palette wird am Dokumentwurzelelement semantisch gesetzt;
   Clientkomponenten duplizieren keine Farbregeln.

## Scope nach einem spaeteren `START WRN-G3-010`

### Erlaubte Pfade

- `packages/brand-tokens/src/index.ts` und
  `packages/brand-tokens/src/styles.css`: versionierter Themevertrag,
  validierte IDs und semantische Paletten-/Markenwirkungstokens;
- `packages/brand-tokens/assets/asset-manifest.json` und exakt ein moeglicher
  kontrollierter Originalimport:
  `solinaridao-world-revolution-news-mask.png`, 35.938 Bytes, SHA-256
  `18C4E5A504CFAA0AAC882B68118B7D81DD2B91B3BB9AB3265D54D5480907D411`,
  Quelle App `2216ff3`, owner-attested durch PO-017, unveraendert;
- `apps/mobile/src/App.tsx`, `apps/mobile/src/styles.css` und bestehende
  Mobile-Komponententests: Themeauswahl, lokale Praeferenz, Systemaufloesung
  und mobile Markenwirkung;
- `apps/website/src/App.tsx`, `apps/website/src/styles.css` und bestehende
  Website-Komponententests: dieselben Themefunktionen bei weiterhin kompaktem
  eigenstaendigem Websiteheader;
- `tools/check-brand-assets.mjs` und
  `tools/check-brand-assets.test.mjs`: den exakt gepinnten Maskenimport sowie
  fail-closed Assetgrenzen pruefen;
- `tests/e2e/foundation.spec.ts` sowie eng notwendige lokale
  G3-010-Evidenzhelfer;
- `docs/tasks/WRN-G3-010-*`, `docs/evidence/WRN-G3-010/**`,
  `docs/handoffs/WRN-G3-010-*` und notwendige Governance-/Statusdokumente.

Rootkonfiguration, Dependencies und andere Produktpfade bleiben gesperrt. Wenn
eine Umsetzung sie wider Erwarten benoetigt, ist vor jeder Aenderung ein neues
sichtbares Product-Owner-Gate erforderlich.

### Bedien- und Markengrenzen

1. Der bisherige Hell/Dunkel-Zweizustandsbutton wird durch eine einfache,
   semantisch beschriftete Themeauswahl ersetzt. Sichtbare Kurzbezeichnungen
   duerfen `Dunkel`, `OLED`, `Soft`, `Pink`, `Hell`, `System` und `Kontrast`
   lauten; der zugaengliche Name lautet `Farbdarstellung`.
2. Die Auswahl bleibt in der vorhandenen Header-/Mehr-Komposition leicht
   erreichbar, darf aber bei 320 Pixeln weder Marke noch Navigation
   verdraengen. App und Website duerfen sie responsiv unterschiedlich
   platzieren.
3. Die originale Bildmarke wird nicht umgefaerbt, ersetzt oder dupliziert.
   Themefarben steuern nur semantische Schimmer, Konturen und den optional
   maskierten Markenschriftzug.
4. Die Maske darf nur importiert werden, wenn sie fuer die belegte
   zweifarbige Schriftzugwirkung verwendet und vollstaendig im Manifest sowie
   im Asset-Gate gepinnt wird. Keine weitere Bilddatei ist erlaubt.
5. Pink verwendet als Ausgangsreferenz Primaer `#ff4fa3` und Sekundaer
   `#9b82ff`. Andere Paletten orientieren sich an der aktiven App-/Website-
   Baseline, muessen aber die Ziel-Kontrastregeln bestehen.
6. Hoher Kontrast darf durch Glow, Transparenz oder rein farbliche
   Unterscheidung nicht geschwaecht werden. Dekorativer Schimmer darf dort
   reduziert oder deaktiviert werden.
7. `prefers-reduced-motion` bleibt verbindlich. Der Themewechsel fuehrt keine
   neue Animation ein; notwendige Farbtransitionen werden bei reduzierter
   Bewegung effektiv deaktiviert.
8. Mobile und Website behalten die mit PO-047 akzeptierte Headergeometrie.
   G3-010 ist kein erneutes Headerredesign.

### Nicht-Ziele

- keine neue Marke, Logoneuzeichnung, KI-Bildgenerierung oder manuelle
  Bitmapumfaerbung;
- kein Fontdownload und keine Fontentscheidung;
- keine Schriftgroessen-, Dichte-, Sprach- oder allgemeine Einstellungsseite;
- keine Neuordnung von Navigation, Feed, Reader, Suche, Archiv, Share oder SEO;
- keine echten Inhalte, Feeds, Datenbanken, APIs, Telemetrie oder Dienste;
- keine Theme-Synchronisation ueber Konten, Server oder mehrere Geraete;
- keine Migration unbekannter Legacy-Local-Storage-Werte;
- keine Androidhuelle, native Status-/Navigationsleistenvalidierung, AAB/APK
  oder Google-Play-Arbeit;
- keine Remote-/CI-, Cloudflare-, Hostinger-, Deployment-, Signier-, Upload-
  oder Veroeffentlichungsaktion.

### Verbotene Aktionen

- jede Aenderung an aktueller App, aktueller Website, deren Repositories,
  Datenrepository oder Liveinfrastruktur;
- Mitarbeiterstart vor `START WRN-G3-010`;
- Import eines anderen Assets als der exakt hashgebundenen Maske;
- Speichern der Themeauswahl in URL, Analytics, Cookies oder Remote-Diensten;
- Abschwaechen von Kontrast-, Asset-, Storage-, Request- oder Reflowtests;
- parallele Schreibarbeit an Brandtokens oder Clienttheming.

## Akzeptanzkriterien

1. Beide Clients bieten exakt die sieben Praeferenzwerte und wenden die sechs
   sichtbaren Paletten korrekt an; unbekannte Werte fallen auf Dark zurueck.
2. `system` folgt Hell/Dunkel der simulierten Betriebssystemvorgabe und
   reagiert ohne Neuladen auf deren Aenderung, solange `system` aktiv ist.
3. Eine Auswahl bleibt nach lokalem Neuladen erhalten. Nur die validierte
   Theme-ID wird gespeichert; keine externe Anfrage, kein Cookie und kein
   weiterer Storagewert entsteht.
4. Mobile und Website zeigen bei Pink eine sichtbar pink/violett reagierende
   Header-/Logo-Markenwirkung. Das Originalbild bleibt byteidentisch und wird
   nicht durch Themevarianten ersetzt.
5. Dark, Light, OLED, Soft, Pink und Contrast besitzen ausreichenden Text-,
   Fokus- und Bedienelementkontrast. Hoher Kontrast bleibt ohne dekorative
   Unlesbarkeit nutzbar.
6. Der Theme-Selector ist per Tastatur und Screenreader benannt bedienbar,
   zeigt die aktuelle Praeferenz und besitzt ein mindestens 44 x 44
   CSS-Pixel grosses Ziel.
7. Bei 320/360/390/412 Pixeln, Querformat, Tablet, Desktop und
   200-Prozent-Reflow entstehen kein horizontaler Hauptseitenoverflow, keine
   Markenkollision und kein verdeckter Inhalt.
8. Die durch G3-002 bis G3-009 akzeptierten Navigation-, Feed-, Suche-,
   Reader-, SEO-, Archiv-, Lifecycle-, Share- und Headerfunktionen bleiben
   funktional unveraendert; beide Clients bauen reproduzierbar.
9. Assetmanifest und Asset-Gate erlauben weiterhin nur die gepinnten
   Originale. Bei Maskenimport werden falscher Hash, falsche Bytes,
   Provenienzmanipulation und jedes zusaetzliche Asset fail-closed erkannt.
10. Browser-QA meldet null neue Konsolenfehler, fehlgeschlagene oder externe
    Requests, unerklaerte Storagewerte, Axe-Verstoesse oder Layoutfehler.
11. Ein unabhaengiger QA-Agent prueft den unveraenderten Kandidaten und meldet
    null offene Blocker, Highs oder Mediums. Ein Low braucht Dokumentation und
    Product-Owner-Entscheidung.
12. Der Product Owner beurteilt beschriftete identische App-/Website-
    Vergleiche fuer alle sechs Paletten, insbesondere Pink. Erst seine
    sichtbare Abnahme schliesst G3-010.

## Tests und visuelle Belege

### Automatisiert

- Format, Lint, Typen, Frozen Lockfile und Boundaryregeln;
- Unit-/Komponententests fuer Validierung, Fallback, Auswahl, Persistenz,
  Systemaufloesung, Media-Query-Aenderung und Listener-Cleanup;
- Assetmanifest-, Hash-, Byte-, Provenienz- und Negativtests;
- bestehende vollstaendige Unit-/Contract-/Komponenten- und Boundarysuite;
- beide Builds;
- bestehender Browser-E2E-Lauf plus gezielte G3-010-Faelle fuer alle
  Praeferenzen, Reload, Systemwechsel, Tastatur, Fokus, Touchziele, Reflow,
  Overflow, Konsole, Requests und Storage.

### Verbindliche visuelle Matrix

- Mobile 390 x 844: Dark, Light, OLED, Soft, Pink, Contrast und System je mit
  eindeutig belegter effektiver Palette;
- Mobile Boundary: 320 x 568 Dark/Pink, 360 x 800 Soft, 412 x 915 Contrast,
  844 x 390 Pink sowie 390 x 844 bei 200-Prozent-Reflow;
- Website 390 x 844: Dark/Pink/Contrast;
- Website 800 x 1280: Soft;
- Website 1024 x 800: OLED;
- Website 1440 x 900: Dark/Light/Pink;
- Website 1920 x 1080: System sowie layoutaequivalenter
  200-Prozent-Reflow;
- je Client ein Tastaturfokusbeleg am Theme-Selector und ein absichtlich
  fehlschlagendes Markenbild mit lesbarem Textfallback;
- eine App- und eine Website-Kontaktbogenreihe mit identischem Zustand und
  Viewport, damit ausschliesslich der Themeunterschied beurteilt wird;
- jeder Beleg nennt Kandidatencommit, Client, Viewport, Praeferenz, effektive
  Palette, Zustand und Testdatum.

## Daten, Privacy, Security und Kosten

- gespeichert wird nur eine validierte Theme-ID in einem versionierten lokalen
  Key; keine personenbezogenen, redaktionellen oder Geraetedaten;
- keine Cookies, externen Requests, Telemetrie oder Serverabhaengigkeit;
- keine neue Dependency und kein Download;
- der einzig moegliche Assetimport stammt lokal aus der rechtegeprueften
  autoritativen Appquelle und wird byte-/hashgebunden;
- keine API-/KI-Ausgaben ausserhalb vorhandener Codex-Abokontingente;
- Implementierung und QA laufen nacheinander, damit derselbe Kandidat
  unabhaengig geprueft wird.

## Rollback/Ruecknahme

Ausgangspunkt ist der dokumentierte G3-009-Abschluss- und
Folgebefundcheckpoint `bf96d21` mit Bindung `36c475a`. Die spaetere
Produktumsetzung erhaelt einen eigenen Kandidatencheckpoint. Eine Ruecknahme
darf ausschliesslich Themevertrag, Paletten, Themeauswahl, lokale
Theme-Praeferenz, reaktive Markendarstellung, gegebenenfalls die neue Maske
und zugehoerige Tests entfernen. Alle akzeptierten G3-002-bis-G3-009-
Funktionen und Legacyquellen bleiben unveraendert.

## Geplante Agentensequenz nach dem Startgate

1. `frontend_brand_engineer`: einziger schreibender Implementierungsagent fuer
   die exakt erlaubten Brand-, Mobile-, Website- und Testpfade; gesicherter
   Produktkandidatencheckpoint und Handoff.
2. `visual_accessibility_reviewer`: unabhaengige read-only technische und
   visuelle QA des unveraenderten Kandidaten; nur Evidenz-/Handoffpfade duerfen
   geschrieben werden.
3. Bei Finding: Stopp und sichtbare Product-Owner-Entscheidung. Kein Agent
   korrigiert seinen eigenen Kandidaten stillschweigend.
4. Reserve `spark_micro_task_worker` nur nach einem exakt spezifizierten,
   kleinen Finding und neuer sichtbarer Korrekturfreigabe.
5. Reserve `context_continuity_auditor` nur bei widerspruechlichem Handoff,
   Quellverwechslung oder YELLOW-Kontextsignal; kein automatischer Start.

## Uebergabeformat

- geaenderte Dateien nach Eigentumsbereich;
- Ausgangs-, Produktkandidaten- und QA-/Evidenzcheckpoint;
- Themevertrags-, Palette-, Persistenz- und Systemaufloesungsbelege;
- Assetmanifest-/Hash- und Negativtestbelege;
- alle Testbefehle und Ergebnisse;
- beschriftete Theme-Kontaktboegen und Visual-QA-Bericht;
- Konsolen-, Request-, Storage-, Overflow-, Touchziel-, Kontrast- und
  A11y-Bericht;
- Annahmen, Findings, Restrisiken und exakter Rueckkehrpunkt;
- Handoff nach `docs/templates/AGENT-HANDOFF.md` mit `END-CHECK: :)`;
- keine ungefragte Folgeaktion.

## Freigabegrenze

`BEREITE WRN-G3-010 VOR` erlaubt keinerlei Produktumsetzung. Nur der spaetere
exakte sichtbare Befehl

```text
START WRN-G3-010
```

erlaubt den hier schriftlich begrenzten lokalen Produkt-/Testscope und die
sequenzielle Mitarbeiteraktivierung. Auch dieses spaetere Startgate erlaubt
keine Live-, Android-, Remote-, Deployment- oder Releaseaktion.
