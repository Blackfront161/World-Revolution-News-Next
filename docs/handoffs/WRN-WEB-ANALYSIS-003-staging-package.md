# WRN-WEB-ANALYSIS-003 – Staging-Paket-Handoff

- Agent: S11, separate Analysewebsite
- Task-ID: `WRN-WEB-ANALYSIS-003`
- Ergebnis: bestanden; lokales Stagingpaket GREEN, Upload weiterhin BLOCKED
- Eltern-/Kindbrief und Rolle: Chief-Auftrag S11, alleiniger Staging-Schreiber
- Basiscommit: `eced0bbbe1b894120aef53ebd5873949752bdc6f`
- Ergebniscommit Produkt/Tests/Task: `33902523e9dee6e1e3217186c2daf1ccaa63c8cf`
- Branch: `codex/wrn-web-analysis-003-staging-package`
- Isolierter Worktree: `C:\Users\patri\AppData\Local\Temp\wrn-s11`
- Kinder/Slots: keine gestartet; keine offenen Kinder
- Schreibarbeit: nach diesem Handoff beendet; Integrations- und
  Freigabeentscheidung geht an Chief/Product Owner zurueck
- Unabhaengiger Reviewadressat: Chief, danach bei Disposition unabhaengige
  Security/QA; S11 nimmt sich nicht selbst als Release ab

## Kurzfazit

Der separate Stagingbuild verlangt jetzt zwingend eine genehmigte andere
HTTPS-Origin und die ausdrueckliche Canonical-Strategie `self` oder `source`.
Ohne diese Angaben gibt es kein Paket. Er erzeugt Meta-Noindex, gesperrte
Robots, strategiekonsistente Canonicals/Sitemap, eine CSP ohne
`unsafe-inline`, identische Apache-/Service-Worker-HTML-Header, eine geschlossene
21-Dateien-Runtime mit exakter Hashliste und ein separates vierteiliges
Retirementpaket. Nichts wurde hochgeladen oder extern konfiguriert.

## Delegationsaufwand

- Keine Delegation, Kinder, Koordinationskonflikte oder externen Kosten.
- Neue Dependencies: keine; vorhandene Node-24.19-/pnpm-11.19-/Vite-8.2.2-
  Toolchain nur lesend verwendet.
- Der urspruenglich zugewiesene Worktree war auf `bb77c06` und ein Wechsel
  scheiterte an Windows-Pfadlaengen. Der dadurch halbfertige Worktree wurde aus
  Sicherheitsgruenden nicht zurueckgesetzt. S11 arbeitete stattdessen in einem
  neuen kurzen echten Git-Worktree direkt von `eced0bb`.

## Verwendete Quellen

- `AGENTS.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/04-QUALITY-RULES.md`
- `docs/PROJECT-STATE.md`
- `docs/tasks/WRN-WEB-ANALYSIS-001-SEPARATE-PREVIEW.md`
- `docs/evidence/WRN-WEB-ANALYSIS-001/HOSTING-READINESS.md`
- `docs/handoffs/WRN-WEB-ANALYSIS-002-security-fixes.md`
- `docs/architecture/ADR-009-QA-CI-CD-AND-RELEASE.md`
- Basisquellen unter `apps/website/tools/` und
  `apps/website/src/offline-shell/`

## Geaenderte Dateien

- `.gitignore`
- `apps/website/package.json`
- `apps/website/src/offline-shell/worker-runtime.mjs`
- `apps/website/tools/build-offline-shell.mjs`
- `apps/website/tools/build-offline-shell.test.mjs`
- `apps/website/tools/generate-static-article-landings.mjs`
- `apps/website/tools/generate-static-article-landings.test.mjs`
- `apps/website/tools/integrate-static-article-landings.mjs`
- `apps/website/tools/build-staging-package.mjs`
- `apps/website/tools/staging-package.mjs`
- `apps/website/tools/staging-package.test.mjs`
- `apps/website/tools/validate-staging-config.mjs`
- `docs/tasks/WRN-WEB-ANALYSIS-003-STAGING-PACKAGE.md`
- `docs/evidence/WRN-WEB-ANALYSIS-003/STAGING-PACKAGE-AND-RETIREMENT.md`
- dieser Handoff

Keine Mobile-, Android-, Hauptwebsite-Live-, G3-015-Outcome-, Dependency- oder
Hostingdatei wurde geaendert.

## Tests und Belege

Test-first:

- erster fokussierter Lauf RED wegen noch fehlendem
  `tools/staging-package.mjs`;
- nach Implementierung 26/26 Node-Publisher-/Worker-/Paket-/Protokolltests PASS;
- der Worker-Test fuehrt eine echte rekonstruierte Cache-Navigation aus und
  prueft CSP, Noindex, Nosniff, No-Store und Shell-ID auf der Response.

Abschlussmatrix mit Node `24.19.0`, pnpm `11.19.0`, Vite `8.2.2`:

- Website Vitest: 101/101 PASS;
- Boundary-/Fixture-/Assetchecks: 19/19 PASS;
- Website-Typecheck: PASS;
- fokussiertes ESLint: PASS;
- Prettier und `git diff --check`: PASS;
- normaler Websitebuild: PASS; bestehende oeffentliche Robots- und
  Produktions-Canonical-Semantik unveraendert;
- Parameterprobe: missing = Exit 1, HTTP = Exit 1, gueltige reservierte
  Test-Origin = Exit 0;
- zwei unabhaengige lokale Stagingbuilds vom Ergebniscommit: Runtime-Dateien,
  Paketmanifest und Retirementmanifest byteidentisch.

Lokale, ausdrücklich nicht deploybare Probe mit der reservierten Test-Origin
`https://preview.example.test` und Strategie `self`:

- aktives Paket: 21 Dateien, Paket-ID
  `fe8480ff0a4fa6a8641bace9cf8037389d00e35470df16695834a4bbc20e181c`;
- Shell-ID:
  `c720ed8a4c6647b7ece4960061d2b8e590e4933f10962ef6114342dd3f2f093d`;
- aktives Manifest SHA-256:
  `1ad3ddc11c38466d3b0132fe416c273c40eb5de9d96946fcbd24a80065c8a224`;
- Retirementpaket: 4 Dateien, Paket-ID
  `1d1777f2fed1fd1dddebf2281b71d921579429d08981816d791a30fcbd7208a8`;
- Retirementmanifest SHA-256:
  `2d324e2370966ecd5d7bb050751d2f77494ec589fa700c84aa320d45d287dd51`.

Die lokal erzeugten, ignorierten Artefakte liegen unter
`apps/website/dist-staging-*-final1`; `final2` ist der bytegleiche Gegenbuild.
Sie sind nur Testbelege. Nach echter Originentscheidung muss frisch vom
Ergebniscommit gebaut werden. Keine Screenshots erforderlich, da keine
sichtbare Produktfunktion veraendert wurde.

## Feststellungen nach Prioritaet

1. GREEN: fehlende/unsichere Origin und Strategie stoppen fail-closed.
2. GREEN: Hauptshell und statische Seiten besitzen Noindex; Robots sperrt `/`
   und bewirbt keine Sitemap.
3. GREEN: CSP-Hashes binden alle Build-Inlinebloecke ohne `unsafe-inline`.
4. GREEN: Apache und workerbedientes HTML verwenden denselben Headervertrag.
5. GREEN: unbekannte Dateien, Source Maps, `.vite`, Quellen und Secrets koennen
   nicht in das aktive Paket gelangen.
6. GREEN: Retirement loescht nur `wrn.website-shell.*` und deregistriert den
   eigenen Worker; lokale Lese-/Contentdaten und fremde Caches bleiben erhalten.

## Annahmen und offene Fragen

- Die reale Test-Origin ist noch unbekannt; keine wurde erfunden.
- Product Owner muss `self` oder `source` fuer Canonicals waehlen.
- Noindex ersetzt keinen Zugriffsschutz.
- Hostinger muss isolierten Document Root, HTTPS, `mod_headers`-/`.htaccess`-
  Wirkung und 0-CHF-Nutzung spaeter read-only beziehungsweise nach Freigabe
  praktisch bestaetigen.
- Passwortschutz kann mit den credentiallosen Offline-Shell-Fetches
  kollidieren; Auth/Offline bleibt ein separates Hostinggate.

## Restrisiken

- Kein Live-/Apache-/Hostinger-Smoke und keine externe Sicherheitspruefung in
  S11; lokal erzeugte Header beweisen noch nicht die Providerwirkung.
- Vollstaendig offline befindliche alte Tabs koennen nicht sofort remote
  bereinigt werden. Deshalb nur nicht vertrauliche Testfixtures.
- `Clear-Site-Data` ist bewusst nicht enthalten, weil es weitere lokale Daten
  loeschen wuerde und eine eigene PO-Entscheidung braucht.
- Der normale Worker erhaelt wegen der quellgebundenen Runtimeaenderung eine
  neue Protokollrevision, zeigt ohne Stagingheader aber unveraendertes Verhalten.
  Es fand kein Deployment oder Cacheumschalten statt.

## Empfohlener naechster Schritt

Chief liest Commit, Task, Evidence und Handoff. Danach entscheidet der Product
Owner reale separate Origin, Canonical-Strategie und Auth-/Offline-Modell. Erst
bei genehmigtem Hostinggate frisch bauen, unabhaengig pruefen und eine einzelne
Uploadfreigabe einholen. Keine automatische Veroeffentlichung.

## WRN-AGENT-STATUS

- Task: WRN-WEB-ANALYSIS-003 / S11
- Status: GREEN fuer lokales Staging-/Retirementpaket; Publish BLOCKED
- Quellstand: `eced0bbbe1b894120aef53ebd5873949752bdc6f`
- Ergebnis: `33902523e9dee6e1e3217186c2daf1ccaa63c8cf`
- Tests: 26 Node, 101 Website, 19 Boundaries, Typecheck, Lint, Format,
  Normalbuild und deterministischer Doppelbuild PASS
- Offen: reale Origin, Canonicalentscheidung, Hostinger/HTTPS/Auth und
  unabhaengiger Review/Uploadfreigabe
- Handoff: dieser Pfad
- Naechster Schritt: Chief-Review und PO-Entscheidungen, kein Upload
- END-CHECK: :)
