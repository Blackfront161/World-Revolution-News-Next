# Decision Log

Architekturentscheidungen werden spaeter als einzelne ADR-Dateien ergaenzt.
Der aktuelle Log unterscheidet `ACCEPTED`, `PROPOSED` und `DEFERRED`.

## ADR-000 – Dokumentation vor Produktcode

- Status: `ACCEPTED`
- Datum: 21. August 2026
- Entscheidung: Zuerst Organisations-, Quellen-, Agenten- und Qualitaetsbasis
  anlegen. Kein Produktcode bis zur ausdruecklichen Freigabe.
- Grund: Der Product Owner steuert ueber Delegation, Tests und visuelle Abnahme;
  unklare Agentenrollen wuerden Fehler und Tokenverbrauch vervielfachen.

## ADR-001 – Neues lokales Arbeitsrepository

- Status: `ACCEPTED`
- Datum: 21. August 2026
- Entscheidung: Der Ordner `Sauberes Wo Rev Ne` ist das neue saubere
  Arbeitsrepository. Historische Repositories bleiben unveraendert als Quellen.
- Grenze: Remote/GitHub wird erst nach gesonderter Freigabe eingerichtet.

## ADR-002 – Plattform-Monorepo mit getrennten Anwendungen

- Status: `PROPOSED`
- Entscheidung: Mobile App und Website in einem privaten Plattform-Monorepo,
  aber als getrennte Anwendungen mit eigenen Deploy-/Cache-/Rollbackketten.
  Gemeinsame Pakete nur fuer Brand, UI-Bausteine, Domain und Vertraege.
- Alternative: weiterhin zwei vollstaendig getrennte Quellrepositories.
- Freigabekriterium: Baseline-, CI/CD-, Rechte-, Hosting- und
  Ownershipvergleich in G2.

## ADR-003 – Content bleibt getrennt

- Status: `PROPOSED`
- Entscheidung: Generatoren und grosse generierte Inhalte bleiben ausserhalb
  des Plattform-Repositories; Konsum nur ueber versionierte Schemata.
- Freigabekriterium: vollstaendiges Datenfluss- und Migrationsinventar.

## ADR-004 – Bevorzugter UI-Stack

- Status: `PROPOSED`
- Entscheidung: React + TypeScript + Vite + Capacitor als Startpunkt der
  Architekturpruefung.
- Noch zu beweisen: Offline-/Service-Worker-Migration, bestehende native
  Funktionen, Buildreproduzierbarkeit und fehlerfreie visuelle Paritaet.

## ADR-005 – Modellrouting und Reservepool

- Status: `ACCEPTED`
- Entscheidung: Sol fuer hohe Risiken/Gates, Terra fuer regulaere Umsetzung,
  Luna fuer klare Routine und Spark fuer eng begrenzte schnelle Arbeit.
  Fuenf Kernprofile plus sechs inaktive Reserveprofile werden projektbezogen
  konfiguriert.
- Kostenregel: standardmaessig ein bis zwei aktive Sub-Agenten.

## ADR-006 – Map und Spiel spaeter

- Status: `ACCEPTED`
- Entscheidung: Kein Map-/Spielcode in Migration Release 1. Nur IDs,
  Datenvertraege, Deep Links und Accessibility-Grenzen vorbereiten.

## ADR-007 – Deployment und Signierung sind eigene Operationen

- Status: `ACCEPTED`
- Entscheidung: Build, Test, Signierung, Upload und Rollout sind getrennte
  Gates. Kein lokaler Test oder Build darf als Nebenwirkung deployen.
