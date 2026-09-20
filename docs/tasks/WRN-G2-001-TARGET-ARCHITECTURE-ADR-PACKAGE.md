# Task Brief – WRN-G2-001

## Identitaet

- Task-ID: `WRN-G2-001`
- Titel: Zielarchitektur und ADR-Paket fuer Migration Release 1
- Ausfuehrung: eigener sichtbarer Codex-Projekt-Task im isolierten Worktree
- Federfuehrung: Chief-AI-Architect-Task
- Review: genau eine Instanz `independent_architecture_reviewer` nach dem Entwurf
- Produktcode: verboten

## Ziel

Uebersetze die vollstaendige G1-Baseline in eine entscheidungsreife,
implementierbare Zielarchitektur fuer Android-App, responsive Website,
Backend, Daten, Medien, Offline, Security, QA und Release. Jede tragende
Entscheidung muss Alternativen, Kosten, Risiken, Migrationswirkung und ein
Abnahmekriterium enthalten.

G2 erstellt ausschliesslich Dokumentation, keine neue Appstruktur und keinen
Produktcode. `GO-IMPLEMENTATION` bleibt dem Product Owner vorbehalten.

## Verbindliche Eingaben

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/02-FEATURE-PARITY-MATRIX.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/05-AGENT-ROSTER.md`
- `docs/06-DECISION-LOG.md`
- `docs/07-RISK-REGISTER.md`
- `docs/08-CONTEXT-CONTINUITY.md`
- `docs/09-AGENT-ACTIVITY-INDEX.md`
- `docs/PROJECT-STATE.md`
- alle G1-Task Briefs, Fachhandoffs, Audits, Securityvalidierungen und
  Screenshotmanifeste
- App `2216ff3`, Website `9a59b17`, Datenbeobachtung `acec88e` nur read-only

## Pflichtentscheidungen / ADR-Paket

1. **ADR-001 Repository- und Paketstruktur:** Plattform-Monorepo, Apps,
   Packages, Services, Dokumentation, Infrastruktur und Archivgrenzen.
2. **ADR-002 Clientstack:** bestehende Web-/Capacitor-Richtung gegen Flutter,
   React Native und andere realistische Optionen; Paritaet, KI-Generierbarkeit,
   Android/Website, Testing, Migration und Kosten bewerten.
3. **ADR-003 Design-/Markensystem:** gemeinsame Tokens/Assets/Komponenten,
   aber getrennte App-/Website-Navigation und Responsive-Layouts.
4. **ADR-004 Datenvertrag:** immutable Revisionen, Schemas, IDs, Provenienz,
   Required/Optional-Manifest, Feed-/Landing-/Sitemap-Hashgleichheit.
5. **ADR-005 Backend-/Workergrenzen:** HTTP-Vertraege, Cloudflare-/Alternative,
   Auth/Admission, CORS, Quoten, Observability und Liveinventar.
6. **ADR-006 Medien:** Bilder, Audio, Video, generierte Podcasts, Hosting,
   Rechte, Moderation/Takedown, Lifecycle und Kosten.
7. **ADR-007 Offline/Cache:** App und Website getrennte Service-Worker-/Storage-
   Vertrage, Datenklassen, TTL, Migration, Rollback und Loeschung.
8. **ADR-008 Security/Privacy:** SEC-001/002/003, Drittanbieteruebertragung,
   Retention, Auskunft/Loeschung, Push, Standort und No-Content-Logging.
9. **ADR-009 QA/CI/CD/Release:** Testpyramide, Screenshots, Accessibility,
   reproduzierbarer Android-Build, Websitepaket, GitHub, Play und Rollback.
10. **ADR-010 kuenftige Map-/Spielgrenze:** nur Versionierungs-/Schnittstellen-
    vertrag; kein Spielscope in Migration Release 1.

## Zusaetzliche Pflichtausgaben

- aktualisierte `docs/03-TARGET-ARCHITECTURE.md` mit einem kleinen Systembild;
- `docs/architecture/ADR-001-...md` bis mindestens ADR-010;
- `docs/architecture/MIGRATION-WAVES.md` mit vertikalen Slices und Gates;
- `docs/architecture/COST-AND-MODEL-ROUTING.md` fuer Codex/Spark/Luna/Terra/Sol
  und manuelle Gemini-Zweitmeinung ohne zusaetzliche API-Pflicht;
- `docs/architecture/G2-OPEN-DECISIONS.md` nur fuer echte Product-Owner-
  Entscheidungen;
- aktualisierte Paritaetsmatrix, Decision Log, Risk Register und Project State;
- `docs/handoffs/WRN-G2-001-target-architecture-adr-package.md`.

## Arbeitsweise und Kostenrouting

1. Hauptentwurf seriell und quellengebunden erstellen.
2. Spark/Luna nur fuer klar begrenzte Tabellen-/Konsistenzarbeit, falls
   Delegation tatsaechlich Token oder Kontext spart.
3. Nach vollstaendigem Entwurf genau einen Sol/high Architecture Reviewer
   read-only starten.
4. Reviewerfindings durch den G2-Haupttask validieren und einarbeiten oder mit
   Begruendung ablehnen.
5. Continuity Audit erst nach gesichertem G2-Handoff.

## Verboten

- kein App-, Website-, Backend-, Worker-, Test- oder Buildcode
- keine neue Monorepo-/Produktordnerstruktur anlegen
- keine Legacydateien kopieren oder veraendern
- keine Tests, Builds, Generatoren, Server, Live-Endpunkte oder Deployments
- keine GitHub-/Cloudflare-/Hostinger-/Play-Schreibaktion
- keine Secrets, Keystores, Tokens, Konten oder Secretwerte lesen
- keine Preise, Livekonfigurationen, Rechte oder Providervertraege erfinden
- keine Release-, Architektur- oder Produktfreigabe anstelle des Product Owners

## Akzeptanzkriterien

1. Jede ADR nennt Kontext, Entscheidung, Alternativen, Kosten, Risiken,
   Konsequenzen, Migration und Verifikationsgate.
2. App und Website teilen nur bewusst definierte Pakete und bleiben getrennt
   build-, cache-, navigation- und releasefaehig.
3. Alle G1-High-Risiken besitzen Zielkontrolle, Owner und Gate.
4. Tech-Stack-Entscheidung ist evidenzbasiert, nicht trend- oder modellgetrieben.
5. Kostenmodell trennt Abo-Nutzung, optionale APIs und Betriebsprovider.
6. Map/Spiel vergroessert Release-1-Scope nicht.
7. Kein Produktcode und keine externe Mutation.
8. Unabhaengiger Architecture Review und vollstaendiger WRN-Statusblock.

## WRN-AGENT-STATUS

- Task: `WRN-G2-001`
- Status: YELLOW
- Quellstand: Start ab Governance `86f2615` plus Dashboard-/Task-Checkpoint
- Erledigt: Task Brief vorbereitet
- Tests: keine
- Offen: Architekturentwurf, ADRs und unabhaengiger Review
- Handoff: `docs/handoffs/WRN-G2-001-target-architecture-adr-package.md`
- Naechster Schritt: sichtbaren G2-Projekt-Task im Worktree starten
- END-CHECK: :)

