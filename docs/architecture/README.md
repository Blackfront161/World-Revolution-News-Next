# G2-Zielarchitekturpaket – Migration Release 1

Status: `PROPOSED` – entscheidungsreif, aber nicht freigegeben
Task: `WRN-G2-001`
Stand: 21. August 2026

Dieses Verzeichnis beschreibt die Zielarchitektur. Es ist keine angelegte
Produktstruktur und erteilt weder `GO-IMPLEMENTATION` noch eine Provider-,
Budget-, Deployment- oder Releasefreigabe.

## Verbindliche Lesereihenfolge

1. `../03-TARGET-ARCHITECTURE.md` – Systemkontext und Gesamtregeln
2. `ADR-001-REPOSITORY-AND-PACKAGE-STRUCTURE.md`
3. `ADR-002-CLIENT-STACK.md`
4. `ADR-003-DESIGN-AND-BRAND-SYSTEM.md`
5. `ADR-004-IMMUTABLE-CONTENT-CONTRACT.md`
6. `ADR-005-BACKEND-AND-WORKER-BOUNDARIES.md`
7. `ADR-006-MEDIA-LIFECYCLE.md`
8. `ADR-007-OFFLINE-AND-CACHE-CONTRACTS.md`
9. `ADR-008-SECURITY-AND-PRIVACY.md`
10. `ADR-009-QA-CI-CD-AND-RELEASE.md`
11. `ADR-010-FUTURE-MAP-AND-GAME-BOUNDARY.md`
12. `MIGRATION-WAVES.md` – vertikale Slices und Gates
13. `COST-AND-MODEL-ROUTING.md` – Kostenklassen und Agentenrouting
14. `G2-OPEN-DECISIONS.md` – nur echte Product-Owner-Entscheidungen
15. `../handoffs/WRN-G2-001-independent-architecture-review.md` – genau ein
    unabhaengiger Review und Main-Agent-Disposition
16. `../handoffs/WRN-G2-001-context-audit.md` – abschliessender read-only
    Continuity Audit

## Statussprache

- `PROPOSED`: fachliche Empfehlung des G2-Tasks, noch keine Freigabe.
- `ACCEPTED`: erst nach dokumentierter Product-Owner-Entscheidung.
- `DEFERRED`: bewusst ausserhalb Migration Release 1.
- `SUPERSEDED`: durch eine benannte neuere ADR ersetzt.

Architekturgates, fehlende Livebelege und technische Vorbedingungen sind keine
Product-Owner-Entscheidungen. Sie bleiben in ADRs, Migration Waves und
Risikoregister, nicht in der Liste offener Produktentscheidungen.
