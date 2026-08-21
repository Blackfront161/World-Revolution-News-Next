# Architecture Handoff – WRN-G2-001

- Agent: Main Agent / sichtbarer Task `WRN G2 – Zielarchitektur & ADRs`
- Task-ID: `WRN-G2-001`
- Ergebnis: **YELLOW – Architekturpaket, unabhaengiger Review und Continuity
  Audit abgeschlossen; Product-Owner-Abnahme offen**
- Entwurfscheckpoint: `23f7462244f5050391307d3e6923d4bc1b66158a`
- Reviewremediationcheckpoint: `6d22632`
- Arbeitsform: ausschliesslich Dokumentation im isolierten Worktree

## Kurzfazit

Die vollstaendige G1-Baseline ist in ein implementierbares, aber noch nicht
freigegebenes Zielarchitekturpaket uebersetzt. Es empfiehlt ein
Plattform-Monorepo mit getrennten Mobile-/Website-Apps, React/TypeScript/Vite
plus Capacitor, immutable Contentrevisionen mit getrennten ID-Mengen,
providerneutrale `/v1`-Vertraege, eigene Worker-Rollbackeinheiten, getrennte
Offline-/Releaseketten und harte Security-/Privacygates.

Genau ein unabhaengiger Architecture Reviewer pruefte den gesicherten Entwurf
read-only und meldete drei High-, drei Medium- und ein Low-Finding. Der Main
Agent validierte und akzeptierte alle Findings. Die Korrekturen sind im
Reviewhandoff nachvollziehbar. Product-Owner-Entscheidungen sind nicht
vorweggenommen; `GO-IMPLEMENTATION` ist nicht erteilt.

## Verwendete Quellen

- `AGENTS.md` und `docs/tasks/WRN-G2-001-TARGET-ARCHITECTURE-ADR-PACKAGE.md`
- Product Charter, Source of Truth, Paritaetsmatrix, Ausgangsarchitektur,
  Quality Rules, Agent Roster, Decision Log, Risk Register, Context
  Continuity, Activity Index und Project State
- alle sechs G1-Task Briefs, Fachhandoffs und Continuity Audits
- `docs/handoffs/WRN-G1-BASELINE-SUMMARY.md`
- Security Validation Summary und SEC-001 bis SEC-003
- Screenshotmanifeste in den G1-002- und G1-006-Handoffs
- App `2216ff3` und Website `9a59b17` fuer lokale read-only Git-/
  Konfigurationsstichproben; Datenbeobachtung `acec88e` ausschliesslich aus
  gebundener G1-Evidenz
- unabhaengiger Review des Checkpoints `23f7462`

Keine Livequelle, kein Konto, kein Secretwert und kein externer Schreibzugriff
wurde verwendet.

## Geaenderte Dateien

### Neues Architekturpaket

- `docs/architecture/README.md`
- `docs/architecture/ADR-001-REPOSITORY-AND-PACKAGE-STRUCTURE.md` bis
  `docs/architecture/ADR-010-FUTURE-MAP-AND-GAME-BOUNDARY.md`
- `docs/architecture/MIGRATION-WAVES.md`
- `docs/architecture/COST-AND-MODEL-ROUTING.md`
- `docs/architecture/G2-OPEN-DECISIONS.md`

### Neue/aktualisierte Governancebelege

- `docs/handoffs/WRN-G2-001-independent-architecture-review.md`
- `docs/02-FEATURE-PARITY-MATRIX.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/06-DECISION-LOG.md`
- `docs/07-RISK-REGISTER.md`
- `docs/09-AGENT-ACTIVITY-INDEX.md`
- `docs/PROJECT-STATE.md`
- dieser Handoff

Keine Produkt-, Legacy-, Build-, Test-, Konfigurations- oder Screenshotdatei
wurde veraendert oder kopiert.

## Tests und Belege

- Keine Produkttests, Builds, Generatoren, Server, Browserlaeufe,
  Livezugriffe, Deployments, Signierungen oder Uploads; im Task Brief
  ausdruecklich verboten.
- Read-only: Gitstand der App und Website am erwarteten Commit bestaetigt.
- Read-only: relevante Capacitor-/Android-/Website-Konfigurationen als
  Stackevidenz gelesen.
- Zehn ADRs auf Kontext, Entscheidung, Alternativen, Kosten, Risiken,
  Konsequenzen, Migration und Verifikationsgate geprueft.
- Entwurfsdiff `23f7462` enthielt ausschliesslich Dokumentation und bestand
  `git diff --cached --check`.
- Genau ein unabhaengiger Sol/high-Architecture-Review abgeschlossen; keine
  zweite Instanz gestartet.
- Korrigierter Abschlussdiff wurde als `6d22632` gesichert. Der anschliessende
  Continuity Audit ist GREEN mit 10/12; die einzige Auflage war diese
  Statussynchronisierung.

## Findingsdisposition

| Severity | Finding | Main-Disposition | Zielkontrolle |
|---|---|---|---|
| High | aktive/archivierte/Landing-/Sitemap-IDs faelschlich gleichgesetzt | akzeptiert | getrennte Mengen/Hashes und pruefbare Beziehungen; Revocationoverlay |
| High | mehrere bestaetigte Kernfunktionen ohne Slice/MUST-Klasse | akzeptiert | jede Paritaets-ID klassifiziert; W5-Kernslices und W6-gated Slices |
| High | gebuendelte Worker versus unabhaengiger Rollback | akzeptiert | Gateway, Translation, Feedback, Podcast und Push eigene Deployables |
| Medium | Takedown ohne Vorrang vor immutable Revision | akzeptiert | monotone Tombstones, Origin-410, Cache-Purge, Offline-Revalidierung |
| Medium | GitHub-Entscheidung/Credentialgrenze fehlt | akzeptiert | GitHub bedingt vorgeschlagen; Least Privilege/Environments; PO-013 |
| Medium | Stack-/KI-Wartbarkeitswertung nicht nachvollziehbar | akzeptiert | gewichtete Kriterien, Formel, G1-Evidenz und spaetere Messpunkte |
| Low | gespeicherte Statusangaben veraltet | akzeptiert | Dashboard, State und Handoffs synchronisiert |

Vollstaendige Evidenz:
`docs/handoffs/WRN-G2-001-independent-architecture-review.md`.

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
- Immutable Revision/Hash/Required-Optional und definierte ID-Mengenbeziehungen
  vor parallelem Clientkonsum.
- Revocation-/Tombstone-Vorrang vor Medien-/Offlinefreigabe.
- getrennte Cachemigration/Rollback vor Offline-Paritaet.
- Rechtebeleg vor Asset-/Medienuebernahme.
- fuenf getrennte fachliche Worker-Deployables vor Servicefreigabe.

## Annahmen und offene Fragen

- React/TypeScript/Vite/Capacitor ist eine Empfehlung, keine Freigabe.
- Cloudflare ist bedingt bevorzugt; Livezustand, Tarif, Usage, Bindings,
  Lifecycle und Providerretention bleiben unbewiesen.
- Retentionobergrenzen sind technische Vorschlaege und benoetigen
  Product-Owner-/gegebenenfalls Rechtspruefung.
- GitHub/Actions ist PO-013; kein Remote wurde eingerichtet oder beschrieben,
  als sei er bereits aktiv.
- Offene echte Produktentscheidungen PO-001–013 stehen ausschliesslich in
  `docs/architecture/G2-OPEN-DECISIONS.md`.

## Restrisiken

- Architektur und Reviewremediation sind noch nicht implementiert oder durch
  Produkttests bewiesen.
- Framework-/Providerstaende koennen sich bis G3 aendern und muessen dann
  read-only gegen aktuelle offizielle Quellen verifiziert werden.
- Historische Legacytests, AAB- und Websitepakete bleiben Referenzbelege, keine
  aktuelle Releasefreigabe.
- Offlineclients koennen einen neuen Takedown ohne Netz nicht sofort kennen;
  maximale Offline-Gueltigkeit und naechster Onlineabgleich sind Pflicht.
- Die lokale Python-3.13-Abweichung bleibt fuer spaetere Python-Tests offen.

## Empfohlener naechster Schritt

Der Product Owner prueft Zielarchitektur, genau einen Architecture Review,
Continuity Audit und PO-001–013. Rechte-/Lizenzregister und read-only
Liveinventar bleiben Vorbedingungen der betroffenen G3-Arbeit. Kein Produktcode
vor separatem `GO-IMPLEMENTATION`.

## WRN-AGENT-STATUS

- Task: `WRN-G2-001`
- Status: YELLOW
- Quellstand: Entwurf `23f7462`; Remediation `6d22632`; App `2216ff3`; Website `9a59b17`; Daten `acec88e`
- Erledigt: ADR-001–010, Migrationswellen, Kostenrouting, Registerupdates, genau ein Architecture Review, validierte Findingskorrekturen und Continuity Audit GREEN 10/12
- Tests: keine Produkttests; laut Task Brief verboten; reine Quell-/Dokument-/Diffpruefung
- Offen: Product-Owner-Entscheidungen PO-001–013, G2-Abnahme, Rechte-/Lizenzregister und read-only Liveinventar
- Handoff: `docs/handoffs/WRN-G2-001-target-architecture-adr-package.md`
- Naechster Schritt: Product Owner prueft G2-Paket; `GO-IMPLEMENTATION` bleibt separat
- END-CHECK: :)
