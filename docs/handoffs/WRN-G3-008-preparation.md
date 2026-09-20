# Agent Handoff

- Agent: Chief AI Architect / Main Agent
- Task-ID: WRN-G3-008
- Ergebnis: bestanden

## Kurzfazit

WRN-G3-008 ist ausschliesslich dokumentarisch vorbereitet. Der geplante
lokale Slice beweist einen sicheren Artikel-Lebenszyklus fuer aktive,
historische, aliasierte, gone, revoked, unbekannte und ungueltige IDs. Er
ergaenzt ein kleines Archiv unter `Mehr`, kanonische Share-Ziele und ehrliche
Nicht-verfuegbar-Zustaende in getrennten App-/Website-Projektionen.

Echte Inhalte, die 935 Legacyseiten, produktive Redirects/410, Hosting,
Cache-Purge, Android-Native-Share und Releases bleiben ausgeschlossen.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/02-FEATURE-PARITY-MATRIX.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/07-RISK-REGISTER.md`
- `docs/architecture/ADR-004-IMMUTABLE-CONTENT-CONTRACT.md`
- `docs/architecture/ADR-007-OFFLINE-AND-CACHE-CONTRACTS.md`
- `docs/architecture/ADR-009-QA-CI-CD-AND-RELEASE.md`
- `docs/architecture/MIGRATION-WAVES.md`
- abgeschlossener G3-006-Reader und G3-007-Landingpage-/SEO-Scope
- sichtbare Product-Owner-Freigabe `gerne weiterfahren` nach der Empfehlung
  `BEREITE WRN-G3-008 VOR`

## Geaenderte Dateien

- `docs/tasks/WRN-G3-008-ARCHIVE-LINK-LIFECYCLE.md`
- `docs/evidence/WRN-G3-008-ARCHIVE-LIFECYCLE-PARITY-AND-ACCEPTANCE-BRIEF.md`
- `docs/handoffs/WRN-G3-008-preparation.md`
- notwendige Governance-/Statusdokumente

Kein Produkt-, Test-, Fixture-, Legacy- oder Livecode.

## Tests und Belege

- Ausgangsrepository vor Vorbereitung sauber bei Statuscheckpoint `2c75062`;
  G3-008-Vorbereitungscheckpoint `23ad86f`
- neuer getrennter lokaler Branch
  `codex/g3-008-archive-link-lifecycle`
- Scope gegen ADR-004, ADR-007, Wave 3, Paritaetsmatrix und R-17/R-27/R-33
  abgeglichen
- `git diff --check` ohne Befund
- Prettier-Check fuer alle neun vorbereiteten/geaenderten Leitdokumente PASS
- Gate- und verbotene-Pfade-Pruefung ohne Widerspruch
- keine Produkt- oder Browsertests erforderlich, weil kein Produktcode

## Feststellungen nach Prioritaet

### High-Governance-Grenze

Revocation muss jeden alten Content-, Alias-, Landing-, Reader-, Share- und
spaeteren Cachepfad ueberstimmen. Ein lokaler Test kann die Domain- und
Clientwirkung beweisen, aber keinen produktiven Origin-410 oder Offline-Purge
behaupten.

### Verbindliche Migrationstrennung

Die 935 Legacyseiten benoetigen spaeter ein eigenes ID-Mapping mit
Reconciliation, Rechtepruefung und reversibler Migration. Der
Data Migration Specialist wird in G3-008 nicht gestartet.

## Annahmen und offene Fragen

- Das Archiv wird als Unterbereich von `Mehr` geplant, damit die akzeptierten
  fuenf Hauptziele unveraendert bleiben.
- `https://solinaridao.com/articles/<canonical-id>/` bleibt das einzige
  Sharezielformat; die Verwendung im lokalen Vertrag ist kein Remoteaufruf.
- Gone-/Revocationgruende bleiben abstrakt und enthalten keinen entfernten
  Inhalt oder sensible Falldetails.

## Restrisiken

- produktive Redirect-/410-Wirkung in Apache/Hostinger bleibt unbewiesen;
- Offlinecache-Purge und alte Clientversionen bleiben fuer Wave 4/G5 offen;
- reale Legacy-ID-Kollisionen, Rechte und Vollstaendigkeit sind noch nicht
  kartiert;
- Android-Native-Share bleibt fuer Wave 7 offen.

## Empfohlener naechster Schritt

Nur Empfehlung; keine automatische Ausfuehrung.

Der Product Owner prueft Task Brief und Abnahmebrief. Erst mit
`START WRN-G3-008` duerfen Mitarbeiter strikt sequenziell starten: zuerst
Contract/Domain/Fixture, danach Frontend, danach unabhaengige QA.

## WRN-AGENT-STATUS

- Task: WRN-G3-008 Archiv- und Link-Lebenszyklus
- Status: GREEN – NUR DOKUMENTARISCH VORBEREITET
- Quellstand: G3-007-Abschluss `fe9a848`; Statuscheckpoint `2c75062`;
  G3-008-Vorbereitung `23ad86f`;
  Legacyquellen unveraendert read-only
- Erledigt: Scope, Lifecyclefaelle, Vertragsgrenzen, Tests, visuelle Matrix,
  Kosten, Rollback und Agentensequenz vorbereitet
- Tests: Dokument-/Whitespace-/Konsistenzpruefung; keine Produkttests
- Offen: separates sichtbares Implementierungsgate `START WRN-G3-008`
- Handoff: `docs/handoffs/WRN-G3-008-preparation.md`
- Naechster Schritt: Product-Owner-Pruefung, danach optional
  `START WRN-G3-008`
- END-CHECK: :)
