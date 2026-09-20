# Task Brief – WRN-G3-002 lokaler Manifest-Newsfeed

## Metadaten

- Task-ID: `WRN-G3-002`
- Phase/Welle: G3 / Wave 2, erstes End-to-End-Produktslice
- Auftraggeber: Product Owner
- Owner-Agent: Chief AI Architect
- Spaetere Implementierungsowner: Backend/Data Reliability Engineer und
  Frontend Brand Engineer; QA Release Engineer erst nach gesicherter Uebergabe
- Modellrouting: Terra/high fuer Implementierung und Integration; Luna/medium
  nur fuer klar begrenzte Evidenzaufbereitung; Sol/high nur bei Architektur-,
  Security- oder Releaseblocker
- Delegation nach Start: maximal zwei getrennte Schreibpakete; keine parallele
  Schreibarbeit am gleichen Vertrag oder Verzeichnis
- Paritaet: `NEWS-01`, begrenzte Vorarbeit fuer `NEWS-04/08/09`,
  `SYS-03/04/07`, `UX-03/04/05/07`
- Risiken: `R-04`, `R-05`, `R-06`, `R-16`, `R-22`, `R-37`
- Status: **ABGESCHLOSSEN – TECHNISCH GREEN UND VISUELL AKZEPTIERT**
- Startgate: `START WRN-G3-002` am 23. August 2026 erteilt

## Ziel in beobachtbarer Sprache

Eine kleine, vollstaendig lokale und reproduzierbare Nachrichtenfixture wird
ueber einen versionierten Manifest-v1-Vertrag in die neue Mobile-App und die
neue responsive Website eingelesen. Beide zeigen denselben gebundenen
Inhaltsstand, aber in einer fuer ihre Plattform passenden Feedansicht.

Der Product Owner erhaelt danach einen gefuehrten Alt-vs.-Neu-Vergleich statt
einer abstrakten Freigabe: aktuelle App links, neuer Mobilefeed rechts;
aktuelle Website links, neuer Websitefeed rechts. Quelle, Datum, Sprache, Tags,
Lesbarkeit, Markenwirkung und Responsive-Verhalten sind direkt sichtbar.

## Ausgangslage und verbindliche Belege

- neues Zielrepository: aktueller lokaler Stand auf
  `codex/g3-001-foundation`; technische Foundation `e4d78b4`, QA-Evidenzstand
  `ea2564f`
- App-Baseline, strikt read-only:
  `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
  auf `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`; sichtbare Runtime
  `968c320adfe87d1e11e88f99f448a435d4242750`
- Website-Baseline, strikt read-only:
  `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work`
  auf `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Produkt-/Quellgrenzen: `docs/00-PRODUCT-CHARTER.md` und
  `docs/01-SOURCE-OF-TRUTH.md`
- Paritaet: `docs/02-FEATURE-PARITY-MATRIX.md`
- Architektur: ADR-001, ADR-003, ADR-004 und ADR-009 sowie
  `docs/architecture/MIGRATION-WAVES.md`
- visuelle Baselines:
  `docs/handoffs/WRN-G1-002-visual-app-baseline.md` und
  `docs/handoffs/WRN-G1-006-visual-website-baseline.md`
- gefuehrte Abnahme: `docs/evidence/WRN-G3-002-VISUAL-ACCEPTANCE-BRIEF.md`

## Verbindlicher Slice

```text
lokale immutable Manifest-v1-Fixture
                  |
                  v
        Content-Schema und Validator
                  |
                  v
      plattformneutrales Feed-Domainmodell
             /                 \
            v                   v
  mobile Feedansicht      Website-Feedansicht
```

Die Fixture ist die einzige Datenquelle dieses Tasks. Es gibt keine externe
HTTP-Anfrage, keine bewegliche `main`-URL, keinen Worker und keine Datenbank.

## Scope

### Erlaubte Schreibpfade nach dem Startgate

- `packages/content-contracts/**`: Manifest-/Content-Schema, Validator und
  Contracttests;
- `packages/domain/**`: plattformneutrale Feedmodelle und Zustandsabbildung;
- `packages/test-support/**`: selbst erstellte deterministische Fixture und
  Testbuilder;
- `packages/brand-tokens/**`: nur bereits freigegebene semantische Tokens oder
  die kleinste fuer Feedkarte/Status notwendige Erweiterung;
- `apps/mobile/**`: nur Mobilefeed und seine lokalen Zustaende;
- `apps/website/**`: nur responsiver Websitefeed und seine lokalen Zustaende;
- `tests/e2e/**`, eng notwendige lokale Pruefwerkzeuge unter `tools/**` und die
  zu diesem Task gehoerenden `docs/**`-Belege;
- Root-/Workspacekonfiguration nur, wenn die bestehende Foundation den
  notwendigen Paket- oder Testeintrag nicht bereits abdeckt. Neue Dependencies
  brauchen vor Download eine sichtbare Einzelgenehmigung.

### Eigentumsgrenzen bei spaeterer Delegation

1. Backend/Data besitzt `packages/content-contracts`, die vertragsbezogenen
   Teile von `packages/domain` und `packages/test-support`. Dieser Owner liefert
   zuerst den gruenen Vertrag und einen gesicherten Handoff.
2. Frontend/Brand besitzt `apps/mobile`, `apps/website` und eine eng begrenzte
   Erweiterung von `packages/brand-tokens`. Er konsumiert nur den uebergebenen
   Vertrag und veraendert ihn nicht parallel.
3. QA arbeitet danach unabhaengig read-only. Der Main Agent integriert,
   entscheidet bei Konflikten und legt dem Product Owner die visuelle Abnahme
   vor.

### Nicht-Ziele

- keine Suche oder Filter (`NEWS-02` wird nur durch kompatible Metadaten
  vorbereitet);
- kein Artikelreader, Share, Archiv, Landingpages, Canonical, Sitemap oder SEO;
- kein vollstaendiger Offlinecache; `offline` ist in diesem Slice ein ehrlicher
  lokaler Testzustand;
- keine echten Nachrichten, keine Livefeeds und kein Zugriff auf das
  Contentrepository;
- keine Bilder, Fonts, Logos oder sonstigen Dateien aus den Legacyquellen;
- kein Markenasset- oder Font-Ersatz-Task;
- keine Translation, Podcasts, Push, Feedback, Standort, Hilfe, Zine,
  World-Revolution-Map oder Kartenspiel;
- keine Worker, Datenbank, Provider, Analytics oder sonstige externen Dienste;
- kein natives Android-Scaffolding, AAB/APK, Versionscode, Signing oder Upload;
- kein Remote, CI-Setup, Deployment, Hostinger-, Cloudflare- oder
  Google-Play-Zugriff.

### Verbotene Aktionen

- jede Aenderung in der aktuellen Live-App, deren Repository, der aktuellen
  Website, deren Repository, den Live-Daten oder der Infrastruktur;
- Legacycode, Legacyassets oder echte Inhalte in das neue Repository kopieren;
- Tests, Snapshots oder Erwartungen abschwaechen, nur damit sie gruen werden;
- externe Requests oder kostenpflichtige APIs in Build, Test oder Runtime;
- Folgefeatures oder Folgeagenten ohne neuen Task Brief starten.

## Daten- und Contractanforderungen

1. Das Release-Manifest erfuellt ADR-004 mit `contractVersion`, eindeutiger
   `revision`, UTC-`generatedAt`, realem gebundenem `sourceCommit`,
   `resources`, `articleSets`, getrennten `articleSetHashes`, `compatibility`,
   `provenance` und `revocationRevision`.
2. Der reale `sourceCommit` verweist auf einen gesicherten Fixture-Seed-
   Checkpoint. Das Manifest darf nicht sich selbst oder ein bewegliches
   Branchlabel als Quelle referenzieren.
3. Jede Ressource ist exakt `required`, `optional-empty` oder
   `optional-absent`. Ein bewusst fehlender Testbereich wird im Manifest
   beschrieben und nicht per fehlschlagender URL abgefragt.
4. Hash, Bytezahl, Recordzahl, Schema, Owner und Fallbackklasse werden
   deterministisch validiert. Veraenderter Inhalt bei altem Hash muss
   fehlschlagen.
5. Artikel-IDs sind stabile opake Test-IDs. `activeFeedIds` ist Teilmenge von
   `archiveIds`; alle in diesem Slice verwendeten ID-Mengen und Hashes sind
   kanonisch sortiert.
6. Die selbst erstellte Fixture enthaelt keine realen Personenbehauptungen und
   keine Drittmedien. Je Feedkarte sind mindestens stabile ID, vollstaendiger
   Titel, vollstaendiger erster Satz/Teaser, UTC-Publikationszeit, Original-URL
   als nicht aufgerufene Test-URL, Quelle, Originalsprache oder `und`, Tags,
   Rechte-/Lizenzstatus und Transformations-/Uebersetzungsreferenz vorhanden.
7. Unbekannte Werte bleiben explizit unbekannt. Weder Sprache noch Herkunft
   oder Verifikation werden erfunden.

## UI- und Zustandsanforderungen

1. Beide Clients rendern nachweislich dieselbe Manifestrevision und dieselben
   Artikel-IDs; App und Website importieren einander nicht.
2. Die Feedkarte zeigt Titel, vollstaendigen ersten Satz/Teaser, Quelle, Datum,
   Sprache und Tags in einer klaren Hierarchie. Ein neutraler, selbst erzeugter
   Medienplatzhalter darf den Bildbereich markieren, ist aber kein
   Bildparitaetsbeleg.
3. Mobile bleibt eine appgerechte einspaltige Kartenansicht. Website bleibt
   website-spezifisch: Smartphone einspaltig, Tablet passend verdichtet und
   Desktop ab der bestaetigten breiten Baseline als Mehrspaltenraster.
4. `loading`, `empty`, `error`, `offline`, `optional-absent` und `ready` sind
   deterministisch direkt testbar. Kein Zustand darf haengen, eine nicht
   vorhandene Quelle vortaeuschen oder einen externen Request ausloesen.
5. Dark/Light, 200-Prozent-Reflowaequivalent, Tastaturfokus, semantische
   Artikelstruktur, verstaendliche Statusmeldungen und mindestens 44x44 CSS-px
   grosse interaktive Zielzonen bestehen ohne horizontalen Seitenoverflow.
6. Markenwirkung wird aus den neutralen Foundation-Tokens weiterentwickelt,
   aber noch nicht als finale Marken- oder Assetparitaet bezeichnet.

## Akzeptanzkriterien

1. Alle Daten-/Contractanforderungen werden durch positive und negative
   Contracttests bewiesen.
2. Mobile und Website bauen und testen getrennt mit Frozen Lockfile; ihre
   Importgrenzen bleiben gruen.
3. Unit-/Komponententests decken Metadaten, unbekannte Werte und alle sechs
   Feedzustaende in beiden Clients ab.
4. Browser-E2E beweist gleiche Revision/IDs, null externe Requests im Sollpfad,
   Tastaturbedienung, 44-px-Ziele, Reflow und keinen horizontalen Overflow.
5. Axe oder der bestehende gleichwertige Accessibility-Smoke meldet keine
   ernsthafte Verletzung im geprueften Slice.
6. Die definierte Screenshotmatrix ist commitgebunden, reproduzierbar und ohne
   unerklaerte Konsolen- oder Netzwerkfehler.
7. Ein unabhaengiger QA-Review meldet null offene Blocker/High; Medium braucht
   dokumentierten Owner und eine ausdrueckliche Product-Owner-Entscheidung.
8. Der Product Owner erhaelt den gefuehrten Alt-vs.-Neu-Abnahmebogen und
   akzeptiert die sichtbare Richtung oder beschreibt konkrete Korrekturen.
9. Ein Diff-/Secret-/Artefaktscan belegt, dass ausschliesslich das neue
   Repository geaendert wurde und weder Legacydateien noch Secrets eindrangen.

## Tests und visuelle Belege

### Automatisiert

- Format, Lint, Typen, Workspace-/Importgrenzen und Frozen-Lockfile;
- Contracttests fuer Schema, Required/Optional, Hash, Provenienz, Revision,
  Mengenbeziehungen, falsche Hashes und unbekannte Werte;
- Unit-/Komponententests fuer beide Feedimplementierungen und alle Zustaende;
- getrennte Mobile-/Website-Builds;
- Browser-E2E fuer Same-Revision, Same-IDs, Keyboard, Reflow, Touchziele,
  Overflow, Axe und Requestliste;
- Diff-, Secret-, Legacyimport- und unerwartete-Artefaktpruefung.

### Screenshotmatrix

- Mobile: 390x844 Dark/Ready, 390x844 Light/Ready, 600x960 Dark/Ready und
  390x844 Light bei 200-Prozent-Reflowaequivalent;
- Website: 390x844 Dark/Ready, 390x844 Light/Ready,
  800x1280 Dark/Ready und 1440x900 Dark/Ready;
- Zustandsbeleg: `loading`, `empty`, `error`, `offline` und
  `optional-absent` mindestens in 390x844, fuer beide Clients in einem klar
  beschrifteten Kontaktbogen;
- Vergleich: G1-Appreferenz 390x844/600x960 und G1-Webreferenz
  390x844/800x1280/1440x900 jeweils neben dem neuen Kandidaten;
- jeder neue Beleg nennt Kandidatencommit, Viewport, Theme, Zustand und
  Fixture-Revision. Legacybilder bleiben unveraenderte Referenzen.

## Daten, Privacy, Security und Kosten

- nur oeffentliche, selbst erstellte Testinhalte und notwendige Provenienz;
- keine Nutzerdaten, Telemetrie, Logs mit Content oder Remoteuebertragung;
- externe API-/KI-Kosten: 0 CHF; Gemini ist hoechstens eine spaetere manuelle
  Zweitmeinung und kein Bestandteil von Build oder Test;
- vorhandene lokale Toolchain und Abodeckung zuerst nutzen;
- R-37 bleibt beobachtet und wird durch diesen rein webbasierten Slice nicht
  erweitert. Keine neue Dependency ohne eigene Genehmigung und
  Lizenz-/Auditbeleg.

## Rollback/Ruecknahme

Der Task erhaelt vor Implementierung einen neuen Branch/Checkpoint. Contract,
Fixture und beide Feedrouten muessen als geschlossener Kandidat ruecknehmbar
sein. Die G3-001-Foundation bleibt der technische Rueckkehrpunkt. Legacy-App,
Website, Live-Daten und Live-Systeme werden nie Teil der Ruecknahme, weil sie
in diesem Task unveraendert bleiben.

## Uebergabeformat

- geaenderte Dateien nach Eigentumsbereich;
- Fixture-Seed-Commit, Kandidatencommit und Manifestrevision;
- Befehle, Testergebnisse, Request-/Konsolenbericht und Hashbelege;
- beschriftete Screenshots plus ausgefuellter visueller Abnahmebogen;
- bekannte Abweichungen, Annahmen, Risiken und exakter Rueckkehrpunkt;
- unabhaengiger QA-Handoff nach `docs/templates/AGENT-HANDOFF.md`;
- keine ungefragte Folgeaktion.

## Freigabegrenze

Der Product Owner hat mit `START WRN-G3-002` exakt diesen Slice freigegeben.
Diese Freigabe autorisiert keine darueber hinausgehende Arbeit. Assetimport,
Liveintegration, Artikelreader, Android, Remote/CI,
Deployment, Signierung und Veroeffentlichung bleiben auch danach gesperrt.

Die visuelle Abnahme erfolgte am 23. August 2026 mit
`G3-002 VISUELL AKZEPTIERT – BEREITE WRN-G3-003 VOR`. Sie akzeptiert die
Produktrichtung dieses begrenzten Newsfeed-Slices, nicht die noch fehlenden
Funktionen oder eine finale Marken-/Designparitaet.
