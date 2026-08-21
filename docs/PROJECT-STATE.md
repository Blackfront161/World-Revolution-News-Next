# WRN Project State

Stand: 21. August 2026

## Aktuelle Phase

- Phase: G2 – Zielarchitektur und ADRs
- Task: `WRN-G2-001`
- Entwurfscheckpoint: `23f7462244f5050391307d3e6923d4bc1b66158a`
- Reviewremediationcheckpoint: `6d22632`
- Review: genau eine Instanz `independent_architecture_reviewer` Sol/high,
  read-only abgeschlossen
- Reviewbefund: drei High, drei Medium, ein Low; alle vom Main Agent validiert,
  akzeptiert und am Checkpoint `6d22632` korrigiert
- Continuity Audit: **GREEN 10/12** auf `6d22632`; einziges Warnsignal waren
  die mit diesem Update synchronisierten Statusreferenzen
- Gate: **YELLOW – G2-Dokumentation und Review abgeschlossen;
  Product-Owner-Abnahme offen**
- `GO-IMPLEMENTATION`: **nicht erteilt**
- Produktcode, neue Produktstruktur, Produkttest, Build, Server, Livezugriff,
  Deployment, Signierung und Upload: keiner

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
- Review/Disposition:
  `docs/handoffs/WRN-G2-001-independent-architecture-review.md`
- Continuity Audit:
  `docs/handoffs/WRN-G2-001-context-audit.md`
- Hauptuebergabe:
  `docs/handoffs/WRN-G2-001-target-architecture-adr-package.md`
- aktualisiert: Paritaetsmatrix, Decision Log, Risk Register und
  Mitarbeiter-Dashboard

## Zielentscheidungen nach Reviewremediation

- Plattform-Monorepo mit getrennten Mobile-/Website-Apps; gemeinsame Pakete
  werden versioniert und pro Consumer gepinnt; Content bleibt getrennt.
- React + TypeScript + Vite und Capacitor werden anhand gewichteter,
  G1-gebundener Kriterien empfohlen; aktuelle Versionen/Lizenzen bleiben
  vor G3 read-only zu verifizieren.
- Content nutzt getrennte Mengen/Hashes fuer aktiven Feed, Archiv,
  Landingpages, Redirects und Sitemap-Artikel. Definierte Beziehungen ersetzen
  die im Review beanstandete globale Gleichheit.
- Ein monotones Revocation-/Tombstone-Manifest dominiert immutable Revisionen,
  Gateways und bekannte Clientcaches.
- Content Gateway, Translation, Feedback, Podcast und Push sind eigene
  physische Deploy-/Rollbackeinheiten.
- Jede Paritaets-ID ist `MUST`, `MUST-SPLIT` oder `OPTIONAL-PO`.
  Briefings/Dossiers, Termine, Bibliothek, Lexikon,
  Gefangenensolidaritaet, Hilfe und Medienkern besitzen konkrete W5-Slices.
- GitHub/Actions ist bedingt vorgeschlagen und benoetigt PO-013; G2 hat keinen
  Remote eingerichtet oder veraendert.
- SEC-001/002 muessen vor Portierung geschlossen werden; SEC-003 vor Push.
- App und Website besitzen getrennte Offline-, Cache-, QA-, Release- und
  Rollbackketten. Map/Spiel bleibt ausserhalb Release 1.

## Reviewdisposition

| Finding | Disposition | Korrektur |
|---|---|---|
| High ID-Mengenvertrag | akzeptiert | getrennte Sets/Hashes/Beziehungen in ADR-004, W3 und R-27 |
| High fehlende Kern-Slices/MUST | akzeptiert | vollstaendige Klassifikation und neue W5/W6-Slices |
| High Worker-Rollback | akzeptiert | fuenf fachliche Deployables, keine behaupteten logischen Teilrollbacks |
| Medium Takedownvorrang | akzeptiert | Revocation-/Tombstone-Overlay, Purge/410/Offline-Grenze |
| Medium GitHub | akzeptiert | Least-Privilege-/Environment-/Credentialvertrag und PO-013 |
| Medium Stackevidenz | akzeptiert | Kriterien, Gewichte, Formel, G1-Evidenz und Messpunkte |
| Low Statusdrift | akzeptiert | Dashboard, State und Handoffs werden synchronisiert |

## Offene Gates

1. Product Owner entscheidet PO-001–013 und die G2-Abnahme.
2. Read-only Liveinventar und Rechte-/Lizenzregister vor betroffener G3-Arbeit.
3. `GO-IMPLEMENTATION` bleibt ein separates ausdrueckliches Gate.

## Offene Umgebungsabweichung

Die lokal registrierte Python-3.13-Installation konnte beim Governance-Setup
das Standardmodul `typing` nicht laden. In WRN-G2-001 wurde Python nicht
verwendet. Vor Python-basierten Produkttests braucht die Toolchain eine separat
autorisierte read-only Diagnose und gegebenenfalls Reparaturfreigabe.

## Naechste erlaubte Aktion

Product Owner prueft das G2-Paket, Review und die offenen Entscheidungen.
Weiterhin kein Produktcode und keine externe Mutation. Eine G2-Abnahme erteilt
`GO-IMPLEMENTATION` nur, wenn dies separat und ausdruecklich erklaert wird.
