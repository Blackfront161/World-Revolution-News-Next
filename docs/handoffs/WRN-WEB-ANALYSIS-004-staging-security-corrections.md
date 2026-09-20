# Agent Handoff

- Agent: separater Analysewebsite-Agent
- Task-ID: WRN-WEB-ANALYSIS-004 / S11-R1
- Ergebnis: bestanden
- Eltern-/Kindbrief, Rolle (Main/Fachlead/Helfer/Review) und Instanz-ID: Auftrag aus
  `01a021b2-3c31-7dd0-891e-6f2d39f8dbd1`; alleiniger Schreibagent; keine Kinder
- Basiscommit / Ergebniscommit / Branch und Worktree:
  `eced0bbbe1b894120aef53ebd5873949752bdc6f` / Code- und Paketquellcommit
  `98aa13de5fef40534bf5fcdb4af972a941806e1f` /
  `codex/wrn-web-analysis-003-staging-package` /
  `C:\Users\patri\AppData\Local\Temp\wrn-s11`
- Bestehende Branchfolge vor R1: `33902523e9dee6e1e3217186c2daf1ccaa63c8cf`,
  `a10b72e42e8e1e128a8efdf306a0377fec543304`
- R1-Commits: `ac2a272` (Securitykorrektur), `ab085b5` (CRLF-Integration),
  `8765759` (Normalbuild-Isolation), `c63e7b7` (Vergleichsausgaben),
  `98aa13d` (Testsuchraum)
- Slot-ID / zentraler Slotvergeber / Status aller Kinder: Main-Agent / Main-Agent /
  keine Kinder gestartet
- Schreibarbeit beendet / Rechteuebergabe und Slotfreigabe bestaetigt durch:
  diesen Handoff; Integrationsentscheidung bleibt beim Main-Agent
- Unabhaengiger Reviewadressat (Main/Chief): Main-Agent / Security-Reviewer

## Kurzfazit

Alle fuenf S11-R1-Findings sind lokal geschlossen. Browser und Worker sind vor
Registrierung beziehungsweise Ausfuehrung an die konfigurierte Origin gebunden.
Staging besitzt den separaten Worker `website-staging-shell-sw.js` und nur den
Cache-/Protokollnamensraum `wrn.website-staging-shell.*`. Eine reservierte
`.test`-Origin ist ausschliesslich `probe`, wird im Manifest mit
`uploadEligible=false` markiert und vom externen Uploadpruefer standardmaessig
abgelehnt.

Das aktive Paket akzeptiert exakt 21 Dateien und exakt die drei Artikel Cedar,
Ember und Fern. Extra-HTML wird vor CSP-Hashbildung abgelehnt, jede sonstige
Zusatzdatei erneut vor Kopie. `sourceCommit` wird nur nach einem sauberen
`git status --porcelain=v1 --untracked-files=all` geschrieben. Canonical- und
Robots-Duplikate werden unabhaengig von Attributreihenfolge, Whitespace,
Zeilenumbruch und Quote erkannt.

## Delegationsaufwand (falls zutreffend)

- Arbeits-/Koordinationszeit, Nacharbeitsrunden, Konflikte: keine Delegation;
  zwei lokale Integrationsbefunde (CRLF, Testsuche in Materialisierungen) wurden
  eng korrigiert
- Gemessene Token/Kosten mit Beleg oder `unbekannt`: unbekannt; keine externe
  API, neue Dependency oder kostenpflichtige Leistung
- Aufwands-/Versuchsgrenze eingehalten / Eskalation: eingehalten
- Helferhandoffs, gepruefte Befunde und Disposition: keine

## Verwendete Quellen

- `AGENTS.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/PROJECT-STATE.md`
- `docs/tasks/WRN-WEB-ANALYSIS-001-SEPARATE-PREVIEW.md`
- `docs/evidence/WRN-WEB-ANALYSIS-001/HOSTING-READINESS.md`
- `docs/handoffs/WRN-WEB-ANALYSIS-001-security-review.md`
- `docs/tasks/WRN-WEB-ANALYSIS-003-STAGING-PACKAGE.md`
- `docs/handoffs/WRN-WEB-ANALYSIS-003-staging-package.md`
- `docs/tasks/WRN-WEB-ANALYSIS-004-STAGING-SECURITY-CORRECTIONS.md`
- Git-Trees `eced0bb`, `3390252`, `a10b72e` und R1-Diff

## Geaenderte Dateien

- `.gitignore`
- `apps/website/package.json`
- `apps/website/vite.config.ts`
- `apps/website/src/offline-shell/worker-runtime.mjs`
- `apps/website/src/offline-shell/staging-worker-template.mjs`
- `apps/website/tools/build-offline-shell.mjs`
- `apps/website/tools/build-offline-shell.test.mjs`
- `apps/website/tools/build-staging-package.mjs`
- `apps/website/tools/generate-static-article-landings.mjs`
- `apps/website/tools/generate-static-article-landings.test.mjs`
- `apps/website/tools/staging-package.mjs`
- `apps/website/tools/staging-package.test.mjs`
- `apps/website/tools/staging-vite-plugin.mjs`
- `apps/website/tools/staging-vite-plugin.d.mts`
- `apps/website/tools/staging-vite-plugin.test.mjs`
- `apps/website/tools/validate-staging-config.mjs`
- `apps/website/tools/verify-staging-package.mjs`
- `docs/evidence/WRN-WEB-ANALYSIS-003/STAGING-PACKAGE-AND-RETIREMENT.md`
- `docs/tasks/WRN-WEB-ANALYSIS-004-STAGING-SECURITY-CORRECTIONS.md`
- dieser Handoff

## Tests und Belege

### RED -> GREEN

- RED: fokussierter Node-Lauf: 8 bestanden, 4 fehlgeschlagen. Belegt waren
  fehlender staging-eigener Worker, fehlende Provenienz-/HTML-Allowlist-API und
  fehlender Vite-Isolationsschritt.
- GREEN: fokussierter Lauf nach Korrektur: 19/19; nach CRLF-Regression 3/3
  Vite-Plugin-Tests.

### Abschlussmatrix

- Vitest Website: 8 Dateien, 101/101 Tests bestanden.
- Node-Paketmatrix: 30/30 Tests bestanden.
- Repository-Boundaries/Provenienz/Brand: 19/19 Tests bestanden.
- Website-Typecheck: bestanden (`tsc --noEmit -p apps/website/tsconfig.json`).
- Website-Lint: bestanden (`eslint src tools vite.config.ts --max-warnings=0`).
- Prettier: alle geaenderten Code-/Konfigurationsdateien bestanden.
- `git diff --check`: bestanden; Worktree vor Paketbuild sauber.
- Keine visuelle Produktfunktion geaendert; daher keine neue Screenshotmatrix.
- Die repositoryweite historische Formatpruefung meldete vor der Aenderung zwei
  unveraenderte Altdateien (`integrate-static-article-landings.test.mjs`,
  `local-content-release.mjs`). Diese wurden nicht scopefremd umformatiert;
  alle R1-Dateien sind format-GREEN.

### Zwei deterministische finale Stagingbuilds

Lokale Belegausgaben: `dist-staging-*-r1e` und `dist-staging-*-r1f`.

- gebundener `sourceCommit`:
  `98aa13de5fef40534bf5fcdb4af972a941806e1f`
- Probe-Origin: `https://preview.example.test`
- `packageMode=probe`, `uploadEligible=false`
- aktiv: exakt 21 Dateien, 0 Unterschiede
- Retirement: exakt 4 Dateien, 0 Unterschiede
- aktive Paket-ID:
  `af1a173c86d35ea2b3b65562e9f0556694f720b3c8bfa8f07ade13cf080853fc`
- Shell-ID:
  `06a5c93332606cf71065a1544c35f3dc15adebc766c424465fbe837c63767228`
- aktives externes Manifest SHA-256:
  `06f5e7930223713cbf453454dcb5a60816bfdf05c27adc7f0e1ac5d54c8721f8`
- Retirement-Paket-ID:
  `930fc83483b53641f29dfa76568934bfbe65833a7c944c7f4a543be406f30316`
- Retirement-Manifest SHA-256:
  `4d6408d9f11eabd3c3d26a482ce443ff17ab7ebf3c12bfa4803e09d0e75eb709`
- beide Pakete bestanden den externen Datei-/Byte-/SHA-/Origin-/Workercheck
  mit dem ausdruecklich lokalen `--allow-probe`.
- derselbe Pruefer ohne `--allow-probe` brach erwartungsgemaess mit Exit 1 und
  `Probe package is not upload eligible` ab.
- Die vollstaendige exakte 21-Datei-/Byte-/SHA-Liste steht ausserhalb des
  Pakets in
  `apps/website/dist-staging-package-r1e.manifest.json`; sie wurde bytegleich
  gegen `r1f` geprueft.

### Exakte Normalbuildwirkung gegen `eced0bb`

Beide Seiten wurden aus materialisierten Git-Trees mit identischer vorhandener
Toolchain gebaut. Damit wurden Junctionpfade und Worktree-Zeilenenden nicht als
Codewirkung fehlinterpretiert.

- Basis: `eced0bbbe1b894120aef53ebd5873949752bdc6f`
- Ergebnis: `98aa13de5fef40534bf5fcdb4af972a941806e1f`
- je 21 Normalbuilddateien
- Unterschiede nach Pfad, Bytezahl und SHA-256: exakt 0
- gemeinsamer Normalbuild-Baumhash:
  `5662bb59f9115c856373a5b8b2f2e81e67edee98ed2c2d451f4e8c0bf92a7e5a`
- gemeinsame Normal-Shell-ID:
  `7bf8c4b956af86faec152c60045c733e314f0d3a04d50330565965cf2814a12d`

## Feststellungen nach Prioritaet

1. GREEN: Falsche Browser-Origin kann den Stagingworker nicht registrieren;
   der Worker prueft dieselbe Origin zusaetzlich selbst.
2. GREEN: Staging und Normalbetrieb teilen weder Workerpfad noch Cache- und
   Protokollnamensraum.
3. GREEN: Allowlist ist exakt 21 Dateien und genau drei Artikel; Extra-HTML
   erreicht die CSP-Hashbildung nicht.
4. GREEN: Dirty- oder unversionierte relevante Quellen verhindern Build und
   `sourceCommit`.
5. GREEN: Normalbuild von `eced0bb` bleibt byteidentisch.

## Annahmen und offene Fragen

- Keine reale Stagingadresse wurde angenommen. Der Product Owner muss die
  separate HTTPS-Origin und `self` oder `source` festlegen.
- Fuer einen spaeteren echten Kandidaten muss
  `WRN_STAGING_PACKAGE_MODE=candidate` gesetzt werden. Reservierte
  Beispieladressen bleiben unzulaessig.
- Der tatsaechlich konfigurierte Hosting-Origin muss unmittelbar vor einem
  genehmigten Upload als `WRN_STAGING_ACTUAL_ORIGIN` mit dem externen Manifest
  geprueft werden; `--allow-probe` ist dabei verboten.

## Restrisiken

- Keine Hostinger-, Apache-, HTTPS-, Zugriffsschutz-, DNS- oder Browserwirkung
  wurde live geprueft; dies war ausdruecklich ausser Scope.
- Noindex ist kein Zugriffsschutz. Providerseitiger Zugriffsschutz bleibt ein
  eigenes Hostinggate und muss zusammen mit credentiallosen Offline-Fetches
  getestet werden.
- Offline befindliche alte Tabs koennen erst beim naechsten Onlinekontakt den
  staging-eigenen Retirementworker erhalten.
- Das Paket ist lokal pruefbar, aber weder Upload- noch Releasefreigabe.

## Empfohlener naechster Schritt

Nach PO-Entscheidung fuer reale separate Origin und Canonical-Strategie einen
frischen `candidate`-Build vom freigegebenen Codecommit erzeugen. Danach
unabhaengig und ohne `--allow-probe` gegen die tatsaechliche Auslieferungs-Origin
pruefen. Erst nach separater Hosting-/Uploadfreigabe duerfen hPanel, DNS,
Document Root oder Dateien veraendert werden.

## WRN-AGENT-STATUS

- Task: WRN-WEB-ANALYSIS-004 / S11-R1
- Status: GREEN
- Quellstand: Basis `eced0bb`; Paketquellcommit `98aa13d`
- Erledigt: alle fuenf Findings, deterministisches Probe-/Retirementpaket,
  externer Origin-/Manifestcheck, bytegleicher Normalbuild
- Tests: 101 Vitest + 30 Node + 19 Boundaries; Typecheck/Lint/Format/Build GREEN
- Offen: reale PO-Origin/Canonical-Entscheidung und spaetere getrennte
  Hosting-/Uploadfreigabe
- Handoff: `docs/handoffs/WRN-WEB-ANALYSIS-004-staging-security-corrections.md`
- Naechster Schritt: Main-/Security-Review; keine automatische Ausfuehrung
- END-CHECK: :)
