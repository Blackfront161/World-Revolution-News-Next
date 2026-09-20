# Agent Handoff – WRN-G3-004 Vorbereitung

- Agent: Chief AI Architect / Main Agent
- Task-ID: `WRN-G3-004`
- Ergebnis: Dokumentvorbereitung abgeschlossen; PO-029-Startgate nachtraeglich
  erteilt

## Kurzfazit

Der Navigations-Slice ist vor dem ersten Code als begrenztes, testbares
Arbeitspaket beschrieben. Die bekannte mobile Fuenfernavigation bleibt
erhalten. Die umfangreichere Website-Navigation wird in responsive
Hauptgruppen geordnet. Gemeinsam sind nur stabile Ziel-IDs; App und Website
behalten eigene sichtbare Kompositionen, History-Adapter und Releasewege.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/02-FEATURE-PARITY-MATRIX.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- App-Baseline `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Website-Baseline `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- `docs/handoffs/WRN-G1-002-visual-app-baseline.md`
- `docs/handoffs/WRN-G1-006-visual-website-baseline.md`
- akzeptierter G3-003-Kandidat `f54a2993e1eca52b75c1af3ddefd48ca434716b1`

## Geaenderte Bereiche

- G3-003-Abnahme und PO-028 in Governance-/Statusdokumenten
- `docs/tasks/WRN-G3-004-NAVIGATION-SHELL.md`
- `docs/evidence/WRN-G3-004-NAVIGATION-PARITY-BRIEF.md`
- dieser Vorbereitungshandoff
- konsistente Paritaets-, Dashboard- und Projektstatuszeilen

Kein Produktcode, Testcode, Asset, Legacybestand oder Livezustand wurde
geaendert. Kein Mitarbeiter wurde gestartet.

## Feststellungen

- App-Baseline: `Start`, `Für mich`, `Entdecken`, `Medien`, `Gespeichert`.
- Website-Baseline: breitere Informationsarchitektur mit Briefing,
  Entwicklungen, Start, Regionen, Themen, Video, Termine, Audio, Gespeichert,
  Solidarität, Zine, Lexikon und Projekt-/Nebenfunktionen.
- Eine identische Leiste wuerde entweder die App ueberladen oder die Website
  unnoetig beschneiden. Stabile IDs plus getrennte Projektionen entsprechen
  der akzeptierten Zielarchitektur.
- Noch nicht migrierte Inhalte brauchen ehrliche, seiteneffektfreie
  Zwischenzustaende; G3-004 behauptet keine Funktionsparitaet.

## Tests und Belege

- nur Dokumentvorbereitung: `git diff --check` und Repositoryformatierung
- Legacy-HEADs und saubere Arbeitsbaeume read-only kontrolliert
- keine Builds, Produkttests, Browserlaeufe oder Screenshots erforderlich,
  weil kein Produktcode geaendert wurde

## Restrisiken und offene Grenzen

- Die empfohlene sichtbare Anordnung wird erst durch `START WRN-G3-004` als
  Implementierungsscope akzeptiert.
- Suche/Filter, Reader, Inhalte, Medien, Gespeichert, Personalisierung und
  Sekundaerfunktionen bleiben eigene Folgeslices.
- Website-SEO-URLs und Android-Zurueckverhalten bleiben ausserhalb dieses
  lokalen Navigations-Slices und erhalten spaetere eigene Gates.

## Empfohlener naechster Schritt

Der Product Owner hat nach dieser Vorbereitung exakt `START WRN-G3-004`
erteilt. Als naechstes wird ein Frontend Brand Engineer gestartet; danach
prueft ein unabhaengiger QA Release Engineer den unveraenderten Kandidaten.

## WRN-AGENT-STATUS

- Task: WRN-G3-004 Vorbereitung
- Status: GREEN dokumentarisch / PO-029-Implementierung gestartet
- Quellstand: akzeptierter Produktkandidat `f54a2993e1ec`, aktueller
  Dokumentbranch `codex/g3-003-brand-design`
- Erledigt: Task Brief, Navigationsparitaet, Abnahmeplan und Gates vorbereitet
- Tests: Dokumentformatierung und Diffpruefung; keine Produktpruefung notwendig
- Offen: Produktkandidat, vollstaendige Tests und unabhaengige QA
- Handoff: `docs/handoffs/WRN-G3-004-preparation.md`
- Naechster Schritt: genau ein Frontend Brand Engineer im schriftlichen Scope
- END-CHECK: :)
