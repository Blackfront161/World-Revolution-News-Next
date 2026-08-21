# Architecture Handoff – WRN-G2-001

- Agent: Main Agent / sichtbarer Task `WRN G2 – Zielarchitektur & ADRs`
- Task-ID: `WRN-G2-001`
- Ergebnis: **YELLOW – Hauptentwurf vollstaendig, unabhaengiger Review ausstehend**
- Arbeitsform: ausschliesslich Dokumentation im isolierten Worktree

## Kurzfazit

Die vollstaendige G1-Baseline wurde in ein implementierbares, aber noch nicht
freigegebenes Zielarchitekturpaket uebersetzt. Es empfiehlt ein
Plattform-Monorepo mit getrennten Mobile-/Website-Apps, React/TypeScript/Vite
plus Capacitor, immutable Contentrevisionen, providerneutrale `/v1`-Vertraege,
getrennte Offline-/Releaseketten und harte Security-/Privacygates.

SEC-001/002/003, Feed-/SEO-ID-Drift, Retention/Loeschung, Rechte, Liveinventar
und Kosten sind mit Ownern und Gates versehen. Map und Spiel bleiben ausserhalb
Release 1. Product-Owner-Entscheidungen sind nicht vorweggenommen;
`GO-IMPLEMENTATION` ist nicht erteilt.

## Verwendete Quellen

- `AGENTS.md` und `docs/tasks/WRN-G2-001-TARGET-ARCHITECTURE-ADR-PACKAGE.md`
- Product Charter, Source of Truth, Paritaetsmatrix, bisherige
  Zielarchitektur, Quality Rules, Agent Roster, Decision Log, Risk Register,
  Context Continuity, Activity Index und Project State
- alle sechs G1-Task Briefs und Fachhandoffs
- alle sechs G1-Continuity-Audits und `WRN-G1-BASELINE-SUMMARY.md`
- `docs/security/WRN-G1-004/validation-summary.md` sowie SEC-001 bis SEC-003
- Screenshotmanifeste in den G1-002- und G1-006-Handoffs
- App `2216ff3` und Website `9a59b17` fuer lokale read-only Git-/
  Konfigurationsstichproben; Datenbeobachtung `acec88e` nur aus gebundener
  G1-Evidenz

Keine Livequelle, kein Konto, kein Secretwert und kein externer Schreibzugriff
wurde verwendet.

## Geaenderte Dateien

### Neu

- `docs/architecture/README.md`
- `docs/architecture/ADR-001-REPOSITORY-AND-PACKAGE-STRUCTURE.md`
- `docs/architecture/ADR-002-CLIENT-STACK.md`
- `docs/architecture/ADR-003-DESIGN-AND-BRAND-SYSTEM.md`
- `docs/architecture/ADR-004-IMMUTABLE-CONTENT-CONTRACT.md`
- `docs/architecture/ADR-005-BACKEND-AND-WORKER-BOUNDARIES.md`
- `docs/architecture/ADR-006-MEDIA-LIFECYCLE.md`
- `docs/architecture/ADR-007-OFFLINE-AND-CACHE-CONTRACTS.md`
- `docs/architecture/ADR-008-SECURITY-AND-PRIVACY.md`
- `docs/architecture/ADR-009-QA-CI-CD-AND-RELEASE.md`
- `docs/architecture/ADR-010-FUTURE-MAP-AND-GAME-BOUNDARY.md`
- `docs/architecture/MIGRATION-WAVES.md`
- `docs/architecture/COST-AND-MODEL-ROUTING.md`
- `docs/architecture/G2-OPEN-DECISIONS.md`

### Aktualisiert

- `docs/02-FEATURE-PARITY-MATRIX.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/06-DECISION-LOG.md`
- `docs/07-RISK-REGISTER.md`
- `docs/09-AGENT-ACTIVITY-INDEX.md`
- `docs/PROJECT-STATE.md`
- dieser Handoff

Keine Produkt-, Legacy-, Build-, Test-, Konfigurations- oder Evidenzdatei wurde
veraendert oder kopiert.

## Tests und Belege

- Keine Tests, Builds, Generatoren, Server, Browserlaeufe, Livezugriffe,
  Deployments, Signierungen oder Uploads; im Task Brief ausdruecklich verboten.
- Read-only: Gitstand der App und Website am erwarteten Commit bestaetigt.
- Read-only: relevante Capacitor-/Android-/Website-Konfigurationen als
  Stackevidenz gelesen.
- Dokumentpruefung und Scope-/Diffpruefung stehen vor dem Entwurfscheckpoint
  noch aus.
- Unabhaengiger Architecture Review steht noch aus und wird nach gesichertem
  vollstaendigen Entwurf genau einmal gestartet.

## Feststellungen nach Prioritaet

### Blocker vor G3

1. Product Owner muss G2 und den Zielstack akzeptieren oder gezielt aendern.
2. Rechte-/Lizenzregister und read-only Liveinventar muessen die im ersten
   Slice verwendeten Assets, Dienste, Provider, Retention und Kosten belegen.
3. `GO-IMPLEMENTATION` muss ausdruecklich und separat erteilt werden.

### High-Gates vor betroffenen Funktionen

- SEC-001 vor jeder Translation-Portierung.
- SEC-002 vor jeder Podcastgenerierung.
- SEC-003 und bestaetigter Widerruf vor Push.
- Immutable Revision/Hash/Required-Optional vor parallelem Clientkonsum.
- Same-ID-Vertrag vor Website-Landing-/Sitemaprelease.
- getrennte Cachemigration/Rollback vor Offline-Paritaet.
- Rechtebeleg vor Asset-/Medienuebernahme.

## Annahmen und offene Fragen

- React/TypeScript/Vite/Capacitor ist eine Empfehlung, keine Freigabe.
- Cloudflare ist bedingt bevorzugt; aktueller Livezustand, Tarif, Usage,
  Bindings, Lifecycle und Providerretention bleiben unbewiesen.
- Retentionobergrenzen sind technische Vorschlaege und benoetigen
  Product-Owner-/gegebenenfalls Rechtspruefung.
- Offene echte Produktentscheidungen stehen ausschliesslich in
  `docs/architecture/G2-OPEN-DECISIONS.md`.

## Restrisiken

- Architektur ist noch nicht implementiert oder durch Produkttests bewiesen.
- Ein Framework-/Providerstand kann sich bis G3 aendern und muss dann
  read-only gegen aktuelle offizielle Quellen verifiziert werden.
- Historische Legacytests, AAB- und Websitepakete bleiben Referenzbelege, keine
  aktuelle Releasefreigabe.
- Die lokale Python-3.13-Abweichung bleibt fuer spaetere Python-Tests offen.

## Empfohlener naechster Schritt

Dokumentdiff auf Vollstaendigkeit, ungewollte Dateien und Secrets pruefen,
Entwurf als Git-Checkpoint sichern und genau eine read-only Instanz
`independent_architecture_reviewer` auf Sol/high starten. Findings danach durch
den Main Agent validieren und diesen Handoff abschliessen.

## WRN-AGENT-STATUS

- Task: `WRN-G2-001`
- Status: YELLOW
- Quellstand: Governance ab `30a54c6`; Entwurfscheckpoint ausstehend; App `2216ff3`; Website `9a59b17`; Daten `acec88e`
- Erledigt: Hauptentwurf, ADR-001–010, Migrationswellen, Kostenrouting, offene Entscheidungen und Registerupdates
- Tests: keine; laut Task Brief verboten; lokale read-only Quell-/Konfigurationspruefung
- Offen: Dokument-/Diffpruefung, Entwurfscheckpoint, genau ein Architecture Review und Findingsdisposition
- Handoff: `docs/handoffs/WRN-G2-001-target-architecture-adr-package.md`
- Naechster Schritt: Entwurf pruefen und committen, dann genau einen Reviewer starten
- END-CHECK: :)

