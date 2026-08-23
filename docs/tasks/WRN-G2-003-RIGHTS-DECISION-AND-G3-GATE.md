# Task Brief – WRN-G2-003

> Historischer Abschlussstand. Die damaligen Vorsichtsentscheidungen PO-014/015
> wurden spaeter durch PO-016/017 ersetzt; der aktuelle Rechteweg steht in
> `docs/06-DECISION-LOG.md`.

## Identitaet

- Task-ID: `WRN-G2-003`
- Titel: Sichere Rechteentscheidung und letzte G3-Gate-Vorbereitung
- Paritaets-/Risiko-ID: R-09, R-18, R-31, G3
- Auftraggeber: Product Owner, „ok weiterfahren bitte“ vom 23. August 2026
- Zustaendiger Agent: Chief AI Architect / Main Agent
- Modell/Reasoning: Architektur-/Rechtegate, high
- Delegation: nicht erlaubt

## Ziel in beobachtbarer Sprache

Die sichere Standardentscheidung „Qood ersetzen; ungeklärte Markenassets nicht
kopieren, sondern neu erstellen“ ist dokumentiert. Ein klarer Marken-/Font-
Freigabeplan zeigt, welche visuellen Belege der Product Owner vor dem spaeteren
Release sieht. Der vorbereitete Foundation-Task nennt danach nur noch echte,
sichtbare Vorbedingungen; `GO-IMPLEMENTATION` bleibt ein separater Befehl.

## Ausgangslage und Belege

- Quellstand/Commit: Zielrepository `be3a43e`; App `2216ff3`; Website `9a59b17`
- Reproduktion oder Referenz: Asset-/Rechteregister WRN-G2-002 und
  Qood-Lizenzhinweis
- Relevante Dateien: Decision Log, Risk Register, Product State,
  `WRN-G3-001-FIRST-CODE-READINESS.md`

## Scope

### Erlaubte Pfade

- schreibend ausschliesslich `docs/`
- read-only offizielle Font-/Lizenzquellen und vorhandene G1-Visualbelege

### Nicht-Ziele

- Produktcode, Scaffolding, Dependencies oder Produktassets erzeugen
- Legacyfonts/-bilder kopieren, konvertieren oder veraendern
- abschliessendes Logo-/Fontdesign ohne visuellen Product-Owner-Vergleich
- Liveinfrastruktur, Remotes, CI, Deployment, Signierung oder Upload

### Verbotene Aktionen

- aus „weiterfahren“ `GO-IMPLEMENTATION` ableiten
- ungeklärte Eigentumsrechte behaupten
- kostenpflichtige Asset-/Fontlizenz kaufen
- externe Dateien herunterladen oder installieren

## Akzeptanzkriterien

1. Qood ist als zu ersetzend und nicht zu importieren dokumentiert.
2. Ungeklärte Legacy-Markenassets sind als Neuschaffungsreferenz, nicht als
   kopierbare Quelle klassifiziert.
3. Fontauswahl verlangt eine offene Lizenz, lokale Auslieferung,
   Zeichensatz-/Lesbarkeits- und visuelle Vergleichsbelege.
4. Ein Marken-Recreation-Brief definiert Varianten, Viewports, Accessibility,
   Export- und Rechtebelege vor Produktnutzung.
5. Projektstatus, Risikoregister und G3-Vorbedingungen sind synchron.
6. `GO-IMPLEMENTATION` bleibt offen.

## Tests und visuelle Belege

- Unit/Contract: Dokument-, Pfad-, Status- und Tabellenpruefung
- Integration/E2E: keine; Produktcode ist gesperrt
- Viewports/Themes: Screenshotmatrix nur planen, noch keine Produktassets
- Offline/Fehlerfaelle: lokale Fontauslieferung und Systemfont-Fallback als
  spaetere Testanforderung

## Daten, Privacy, Security und Kosten

Keine Nutzerdaten, Secrets oder Inhalte uebertragen. Neue Font-/Markenassets
muessen lokal auslieferbar, trackingfrei und ohne laufende API-Kosten sein.
Bevorzugt werden nachweisbar offene Lizenzen; jede Drittquelle wird mit
Lizenzdatei, Ursprung, Version und Hash registriert.

## Rollback/Ruecknahme

Nur Dokumentation; Git-Checkpoint kann ohne Auswirkung auf Legacy oder
Produktionssysteme rueckgenommen werden.

## Uebergabeformat

- geaenderte Dateien und Git-Checkpoint
- dokumentierte Rechteentscheidung
- Font-/Markenfreigabeplan
- verbleibende Gates und exakter naechster Product-Owner-Befehl
- keine ungefragte Implementierung

## Abschlussstand

- Ergebnis: **BESTANDEN / GREEN fuer den Rechteentscheid**
- PO-014: Qood ausgeschlossen; keine Runtimeverwendung, kein Ersatz fuer
  Paritaet erforderlich.
- PO-015: ungeklaerte Markenassets werden nicht importiert; Recreation-Brief
  und spaeteres Product-Owner-Visualgate vorbereitet.
- G3-Foundation: weiterhin gesperrt; WRN-G2-004 Liveinventar ist das naechste
  noch nicht autorisierte Vor-G3-Arbeitspaket.
- Produktcode/-asset, Download, Installation oder Livezugriff: keiner.
- Handoff: `docs/handoffs/WRN-G2-003-rights-decision-and-g3-gate.md`
