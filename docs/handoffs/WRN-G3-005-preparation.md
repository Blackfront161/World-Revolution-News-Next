# Agent Handoff – WRN-G3-005 Vorbereitung

- Agent: Chief AI Architect / Main Agent
- Task-ID: `WRN-G3-005`
- Ergebnis: Dokumentvorbereitung abgeschlossen; PO-032-Implementierungsgate
  nachtraeglich erteilt

## Kurzfazit

Der naechste Funktionsslice ist vor dem ersten Code eng beschrieben. Das Ziel
`Entdecken` erhaelt nach einem separaten Startgate eine rein lokale Suche und
fuenf Facetten. Fachlogik und Ergebnisreihenfolge werden gemeinsam und rein
implementiert; App und Website behalten getrennte responsive Oberflaechen.
Archive, echte Daten, Uebersetzung und Spezialmodule bleiben ausserhalb.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/02-FEATURE-PARITY-MATRIX.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `packages/content-contracts/src/index.ts`
- `packages/domain/src/index.ts`
- `packages/test-support/fixtures/wrn-g3-002/articles.json`
- App-Baseline `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- App-Runtime `968c320adfe87d1e11e88f99f448a435d4242750`
- Website-Baseline `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- `docs/handoffs/WRN-G1-002-visual-app-baseline.md`
- `docs/handoffs/WRN-G1-005-website-brand-baseline.md`
- `docs/evidence/WRN-G3-004-NAVIGATION-PARITY-BRIEF.md`
- akzeptierter G3-004-Kandidat
  `3d89fbc05c5349aed4f7caff11099d40b26febb2`

## Read-only Altbefunde

- Die App- und Website-HEADs entsprechen weiterhin Source-of-Truth und beide
  Arbeitsbaeume waren bei der Vorbereitung sauber.
- Die Legacy-Header-Suche fuehrt nach `Entdecken`.
- Die Legacyseite kombiniert Freitext, Region, Thema, Quelle, Quellsprache,
  Herkunft und Format; Archive, Zeitraum, Sortierung und Ansichtsmodi sind
  eng damit gekoppelt.
- Die Kernsuche vergleicht Titel, Einleitung, Quelle, Region und Thema. Die
  nachgelagerte Schicht filtert Sprache, Herkunft, Quelle und Format.
- Filterwerte werden teilweise lokal persistiert; Suchtext nicht. Der G1-
  Sichtbeleg dokumentiert einen unklaren Reset.
- Der neue lokale Artikelvertrag besitzt noch keine getrennten Regions-,
  Themen- oder Formatfelder. Er wird nicht in-place erweitert; der Task plant
  dafuer einen eigenen hashgeprueften Discover-Index.

## Vorbereitete Dateien

- `docs/tasks/WRN-G3-005-DISCOVER-LOCAL-SEARCH-FILTERS.md`
- `docs/evidence/WRN-G3-005-DISCOVER-PARITY-BRIEF.md`
- dieser Vorbereitungshandoff
- konsistente Governance-, Source-of-Truth-, Paritaets- und Projektstatuszeilen

Kein Produkt-/Testcode, Fixture, Asset, Legacybestand oder Livezustand wurde
geaendert. Kein Mitarbeiter wurde gestartet.

## Architektur- und Produktentscheidungen

1. G3-005 bleibt vollstaendig lokal und kostet zur Laufzeit 0 CHF.
2. App und Website teilen Such-/Filtersemantik, nicht ihre UI-Komposition.
3. Der akzeptierte Artikel-/Manifest-v1-Vertrag wird nicht still gebrochen.
   Neue Klassifikation liegt in einem separaten hashgeprueften Discover-Index.
4. Suche und aktive Facetten gelten mit AND; eine Facette besitzt zunaechst
   genau einen Wert oder `Alle`.
5. Reihenfolge bleibt manifestgebunden; kein Ranking oder Editorial Balancing.
6. Suchtext und Filter bleiben nur im Arbeitsspeicher der offenen Sitzung.
7. Zeitraum, Archive, Sortierung, Ansichtsmodi und Spezialmodule folgen spaeter.

## Tests und Belege der Vorbereitung

- `git diff --check`: bestanden
- `pnpm run format`: bestanden; alle Dateien entsprechen Prettier
- read-only Kontrolle von Legacy-HEAD und Arbeitsbaum
- Diff-/Scopepruefung: nur Dokumentation und Governance

Der separate Toolchaincheck stoppt korrekt, weil das aktuelle Terminal Node
`24.16.0` statt der vorgeschriebenen Version `24.19.0` verwendet. Fuer die
reine Markdownvorbereitung war kein Produktbuild erforderlich. Vor einem
spaeteren `START WRN-G3-005` muss die bereits fixierte Node-Version aktiv sein.

Keine Produkt-, Browser- oder visuellen Tests sind fuer die reine Vorbereitung
erforderlich. Die verbindliche spaetere Matrix steht im Task Brief.

## Restrisiken und offene Grenzen

- Die sichtbare Filteranordnung ist als Leitplanke, nicht als finales Pixel-
  Design festgelegt und wird nach dem Start mit Screenshots entschieden.
- Die lokale Dreierfixture erlaubt nur kleine, selbst erstellte Beispiele; sie
  ist kein Beleg fuer echte Datenqualitaet oder Produktionsvolumen.
- Die aktuelle Terminal-Laufzeit weicht von `.node-version` ab; Produktchecks
  duerfen diese Guardrail nicht umgehen.
- Ein spaeterer echter Contentvertrag muss Region, Themen und Format
  redaktionell und versioniert liefern. Textheuristiken bleiben verboten.
- Reader, Archive, Uebersetzung und echte Daten bleiben separate Gates.

## Naechster Schritt

Der Product Owner erteilte am 24. August 2026 exakt `START WRN-G3-005`.
Produkt-/Testcode und die im Task Brief erlaubte Mitarbeitersequenz duerfen
damit ausschliesslich innerhalb des vorbereiteten Scope starten.

## WRN-AGENT-STATUS

- Task: WRN-G3-005 Vorbereitung
- Status: GREEN fuer Dokumentvorbereitung; PO-032-Implementierung gestartet
- Scope: Task Brief, Paritaets-/Abnahmebrief, Handoff und Statuskonsistenz
- Erledigt: Alt-Paritaet inventarisiert und lokaler Zielvertrag vorbereitet
- Geaenderte Dateien: nur neue/aktualisierte Markdowndokumente
- Tests: Diff/Format/Quellen/Scope PASS; Toolchain erwartungsgemaess gestoppt
  (Node 24.16 aktiv statt 24.19); keine Produkttests erforderlich
- Offene Punkte: Implementierung, Main-Review, unabhaengige QA und PO-Sichtabnahme
- Risiken: echte Datenklassifikation und Archivlogik bleiben spaetere Tasks
- Naechster Schritt: ein schreibender Implementierungsagent, danach QA
- END-CHECK: :)
