# Task Brief – WRN-G2-002

## Identitaet

- Task-ID: `WRN-G2-002`
- Titel: G2-Abnahme, Vorimplementierungsbelege und G3-Bereitschaft
- Paritaets-/Risiko-ID: G2/G3, R-09, R-12, R-23, R-29, R-36
- Auftraggeber: Product Owner, Bestaetigung „ja mach weiter bitte“ vom
  23. August 2026 auf das vollstaendig beschriebene G2-Empfehlungspaket
- Zustaendiger Agent: Chief AI Architect / Main Agent
- Modell/Reasoning: Architektur-Routing, high; Routineextraktion lokal seriell
- Delegation: nicht erlaubt

## Ziel in beobachtbarer Sprache

Die G2-Empfehlung und PO-001–013 sind nachvollziehbar dokumentiert. Ein
Asset-/Rechteregister, ein lokales read-only Infrastruktur-Inventar und ein
kleiner G3-Startplan zeigen dem Product Owner vor jedem Produktcode, welche
Belege vorhanden sind, welche fehlen und welche Aktion erst nach einem
separaten `GO-IMPLEMENTATION` erlaubt waere.

## Ausgangslage und Belege

- Quellstand/Commit: Zielrepository `66a9eb6`; App `2216ff3`; Runtime
  `968c320`; Website `9a59b17`; Datenbeobachtung `acec88e`
- Reproduktion oder Referenz: G2-Handoff, Architecture Review und Continuity
  Audit GREEN 10/12
- Relevante Dateien: `AGENTS.md`, Product Charter, Source-of-Truth,
  Zielarchitektur, ADR-001–010, Quality Rules, Decision Log, Risk Register,
  offene G2-Entscheidungen und G2-Handoff

## Scope

### Erlaubte Pfade

- schreibend ausschliesslich `docs/`
- read-only die verbindliche App- und Website-Baseline sowie deren
  nicht-geheime Konfigurations-, Asset-, Lizenz- und Paketmetadaten
- read-only aktuelle offizielle Dokumentation fuer Stack- und
  Cloudflare-Konfigurationsbelege

### Nicht-Ziele

- Produktcode, Scaffolding oder neue Produktverzeichnisse
- vollstaendige juristische Rechtepruefung
- Live-Cloudflare-, Hostinger-, GitHub- oder Play-Console-Inventar
- Schliessen der Findings SEC-001 bis SEC-003
- Map- oder Spielimplementierung

### Verbotene Aktionen

- Secrets, Tokens, Keystores oder Passwortdateien suchen, lesen oder kopieren
- Dependencies installieren, Builds/Server/Tests starten oder Legacydateien
  aendern
- Remotes, Cloudressourcen, Deployments, Domains, Signierungen oder Uploads
  erstellen oder veraendern
- `GO-IMPLEMENTATION` aus dieser Teilfreigabe ableiten

## Akzeptanzkriterien

1. PO-001–013 sind mit Option, Auswirkung und verbleibendem Gate dokumentiert.
2. Jedes fuer den ersten Slice erkennbare Asset ist nach Pfad, Typ, Hash,
   Ursprung/Lizenzstatus und Importentscheidung klassifiziert; Unbekanntes
   bleibt blockiert.
3. Lokale nicht-geheime Infrastrukturhinweise sind nach Quelle, beobachtetem
   Zustand und Evidenzgrenze inventarisiert; Livezustand wird nicht behauptet.
4. Der Zielstack ist gegen aktuelle offizielle Quellen und erkennbare
   Lizenzangaben read-only verifiziert, ohne Versionen zu installieren.
5. Ein kleiner G3-Startplan benennt erstes Slice, vorab definierte Tests,
   UX-Referenzen, erlaubte Pfade und Rollbackgrenze.
6. Das separate Gate `GO-IMPLEMENTATION` bleibt offen und sichtbar.

## Tests und visuelle Belege

- Unit/Contract: Dokumentstruktur, Pfad-/Hashinventar und Link-/Statuspruefung
- Integration/E2E: keine; Produktcode ist gesperrt
- Viewports/Themes: keine neuen Screenshots; vorhandene G1-Referenzen werden
  nur verlinkt
- Offline/Fehlerfaelle: als G3-Testanforderungen dokumentieren, nicht ausfuehren

## Daten, Privacy, Security und Kosten

Keine Inhalte oder Secrets an externe Dienste uebertragen. Keine
kostenpflichtigen API-Aufrufe. Dateihashes duerfen lokal berechnet werden.
Unbekannte Rechte, Tarife, Retention, Bindings oder Providerzustaende werden
als `UNGEKLAERT` markiert und blockieren den betroffenen Import beziehungsweise
Service-Slice.

## Rollback/Ruecknahme

Nur Dokumentationsaenderungen im Zielrepository. Ruecknahme erfolgt ueber den
dedizierten Git-Checkpoint; Legacyquellen bleiben unveraendert.

## Uebergabeformat

- geaenderte Dateien
- Testergebnisse
- Asset-/Rechte- und Infrastrukturregister
- Annahmen und Restrisiken
- G3-Startempfehlung ohne ungefragte Implementierung

## Abschlussstand

- Ergebnis: **TEILWEISE BESTANDEN / YELLOW**
- Erfuellt: PO-Entscheidungen, lokales Asset-/Rechteregister, lokales
  Infrastrukturinventar, offizieller Stack-/Lizenzbeleg und vorbereiteter
  G3-Foundation-Task.
- Blockiert: Qood darf nicht uebernommen werden; Marken-/Medienrechte und
  Cloudflare-/Provider-Livezustand sind nicht belegt.
- Produktcode/Scaffolding/Installation/Livezugriff: keiner.
- `GO-IMPLEMENTATION`: weiterhin nicht erteilt.
- Handoff: `docs/handoffs/WRN-G2-002-preimplementation-evidence.md`
