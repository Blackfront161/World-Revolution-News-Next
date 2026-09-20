# WRN-G3-016 – unabhaengiger Security-/Privacy-Diffreview

## Identitaet

- Task-ID: `WRN-G3-016-P4-S`.
- Auftraggeber und Integrationsowner: Main/Chief `/root`.
- Reviewowner: genau ein frischer `security_privacy_reviewer`, Sol/high.
- Scan-ID: `889ed2c8-8a97-4a3e-8c41-d079e11403a1`.
- Exakter Gitbereich: `0f29d47..b689f11`.
- Delegation/Weiterdelegation: nicht erlaubt; keine Kinder.
- Schreibrechte: Produkt, Tests und Governance read-only. Erlaubt sind nur
  der vom Codex-Security-Workflow verwaltete Scanordner sowie
  `docs/evidence/WRN-G3-016/security/` und
  `docs/handoffs/WRN-G3-016-security.md`.
- Startbedingung: Codex-Security-Preflight meldet `ready`; bis dahin keine
  Quellpruefung.

## Ziel

Der gesamte exakte G3-016-Diff wird unabhaengig auf reportable oder deferred
Security-/Privacy-Befunde geprueft. Der Reviewer veraendert keinen Produkt-
oder Testcode und trifft keine Produkt-, Live- oder Releaseentscheidung.

## Verbindliche Quellen und Fokus

- `AGENTS.md`, dieser Brief, `docs/tasks/WRN-G3-016-HOME-AND-SPORT-FRONT-PAGE.md`.
- P1-/P2-/P3-Handoffs sowie die P4-QA- und P4-R1-Berichte.
- Alle im exakten Diff geaenderten Quelldateien; unterstuetzende unveraenderte
  Quellen nur soweit zur Erklaerung des Diffs erforderlich.
- Lokale Fixture-Admission, atomare Hash-/Releasebindung und Fail-Closed-
  Verhalten bei ungueltigen oder veralteten Projektionen.
- Untrusted Artikeltexte, Bilder/URLs, React-Rendering/XSS, Navigation und
  bestaetigte Quellenoeffnung.
- Lokale Speicherung/Privacy, unerwartete Netz- oder Cookieaktivitaet,
  Datenabfluss, test-only Uhr-/Fixturekontrollen und Scopeleckage.

## Verboten / OUT

- Selbstkorrektur, neue Tests, Produkt- oder Governanceaenderung.
- Repositoryweite Vollanalyse ausserhalb des Diffs.
- Echte Sportrecherche/-klassifikation oder `WRN-CONTENT-SPORT-001`.
- Websiteprodukt, Legacy/Live, Hosting, Android/AAB/Play, Signierung,
  Deployment, neue Dependencies oder externe Kosten.

## Pflichtverfahren und Akzeptanz

1. Den bereits gestarteten Codex-Security-Diffscan mit unveraenderter Scan-ID
   und unveraendertem Gitbereich fortsetzen; keine Ersatzscan-ID erzeugen.
2. Threat Model, vollstaendige geaenderte Dateiinventur, Finding Discovery,
   gegebenenfalls Validation und Attack-Path-Analyse sowie finalen
   vollstaendigen Draft gemaess `security-diff-scan`-Skill ausfuehren.
3. Jede geaenderte Quelldatei und jeder Kandidat sind accounted for;
   Abdeckungsluecken werden ehrlich als deferred/offen ausgewiesen.
4. Den Scan genau einmal versiegeln und kanonischen Report/SARIF referenzieren.
5. Ein eigener kurzer Projektbericht und Handoff nennen Scan-ID, Scope,
   Findings nach Schwere, Abdeckung, Tests/Checks, Restrisiken, Kosten
   (`unbekannt`, falls nicht messbar) und `END-CHECK: :)`.
6. Bei reportable/deferred Finding stoppen und an Chief uebergeben. Null
   Findings ergibt nur P4-S-GREEN, keine PO-, Architektur-, Live- oder
   Releasefreigabe.

## Aufwands- und Abbruchgrenze

Eine vollstaendige Diffscanrunde, keine Wiederholung und keine Remediation.
Bei Tool-/Preflightblocker bleibt der langlebige Scan fortsetzbar und der
Reviewer meldet den exakten Blocker, ohne ihn als Scanfehler auszugeben.

