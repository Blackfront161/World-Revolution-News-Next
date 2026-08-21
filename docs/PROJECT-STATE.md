# WRN Project State

Stand: 21. August 2026

## Aktuelle Phase

- Phase: G2 – Zielarchitektur und ADRs
- Task: `WRN-G2-001`
- Zustand: vollstaendiger Hauptentwurf liegt vor; genau ein unabhaengiger
  Architecture Review steht aus
- Gate: G1 fachlich YELLOW und continuity-geprueft; G2 noch nicht durch den
  Product Owner abgenommen
- `GO-IMPLEMENTATION`: **nicht erteilt**
- Produktcode, Produktstruktur, Build, Test, Server, Livezugriff, Deployment,
  Signierung und Upload: keiner

## Verbindliche Quellen

- App: `wrn-github-app-current@2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- sichtbarer App-Runtime-Release:
  `968c320adfe87d1e11e88f99f448a435d4242750`
- Website:
  `wrn-web-portal-2026-08-20-r10n-work@9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Datenbeobachtung: `acec88ef40814f70c1bb45001e397a6ca5872ed7`
- G1: sechs Fachhandoffs, sechs GREEN Continuity Audits, Baseline Summary,
  SEC-001/002/003 und Screenshotmanifeste
- Details/Ausschluesse: `docs/01-SOURCE-OF-TRUTH.md`

## G2-Artefakte

- Gesamtbild: `docs/03-TARGET-ARCHITECTURE.md`
- kanonische ADRs: `docs/architecture/ADR-001-*.md` bis `ADR-010-*.md`
- vertikale Slices: `docs/architecture/MIGRATION-WAVES.md`
- Kosten-/Agentenrouting: `docs/architecture/COST-AND-MODEL-ROUTING.md`
- offene Product-Owner-Entscheidungen:
  `docs/architecture/G2-OPEN-DECISIONS.md`
- aktualisiert: Paritaetsmatrix, Decision Log, Risk Register und
  Mitarbeiter-Dashboard
- Handoff: `docs/handoffs/WRN-G2-001-target-architecture-adr-package.md`

## Kernaussagen des Entwurfs

- Plattform-Monorepo mit getrennten Mobile-/Website-Apps; Content bleibt
  getrennt.
- React + TypeScript + Vite und Capacitor werden evidenzbasiert empfohlen,
  bleiben aber Product-Owner-Entscheidung.
- Daten werden immutable, schema-, hash- und revisionsgebunden; Feed,
  Landingpages, Manifest und Sitemap muessen dieselbe ID-Menge belegen.
- Cloudflare bleibt bedingt bevorzugt, aber nur nach read-only Liveinventar,
  Provider-/Kosten-/Retentionpruefung und mit providerneutralen Vertraegen.
- SEC-001/002 muessen vor Portierung geschlossen werden; SEC-003 vor Push.
- App und Website besitzen getrennte Offline-, Cache-, QA-, Release- und
  Rollbackketten.
- Map/Spiel bleibt ausserhalb Release 1; nur Anschlussvertraege.

## Offene Gates

1. Entwurf als Git-Checkpoint sichern.
2. Genau eine Instanz `independent_architecture_reviewer` Sol/high read-only
   prueft das vollstaendige Paket.
3. Main Agent validiert jedes Finding, arbeitet es ein oder lehnt es mit
   Evidenz ab.
4. Product Owner entscheidet die Punkte in `G2-OPEN-DECISIONS.md` und die
   G2-Abnahme.
5. Read-only Liveinventar und Rechte-/Lizenzregister vor betroffener G3-Arbeit.
6. `GO-IMPLEMENTATION` bleibt ein separates ausdrueckliches Gate.

## Offene Umgebungsabweichung

Die lokal registrierte Python-3.13-Installation konnte beim Governance-Setup
das Standardmodul `typing` nicht laden. In WRN-G2-001 wurde Python nicht
verwendet. Vor Python-basierten Produkttests braucht die Toolchain eine separat
autorisierte read-only Diagnose und gegebenenfalls Reparaturfreigabe.

## Naechste erlaubte Aktion

Dokumentdiff und Scope read-only pruefen, Entwurf committen und danach genau
einen unabhaengigen Architecture Reviewer starten. Weiterhin kein Produktcode.
