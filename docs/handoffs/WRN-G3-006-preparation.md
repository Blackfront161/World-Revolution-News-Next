# Agent Handoff

- Agent: Chief AI Architect / Main Agent
- Task-ID: WRN-G3-006
- Ergebnis: bestanden

## Kurzfazit

Der naechste lokale Reader-Slice ist vor dem ersten Code eng beschrieben. Er
portiert nur den vollstaendigen textbasierten Lesekern fuer die drei
manifestvalidierten Testartikel, behebt den bekannten Escape-/Fokusvertrag und
schafft stabile clientlokale Artikelrouten. Alle riskanten oder gekoppelten
Legacyaktionen bleiben getrennte Gates.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/02-FEATURE-PARITY-MATRIX.md`
- `docs/04-QUALITY-RULES.md`
- `docs/architecture/ADR-001-REPOSITORY-AND-PACKAGE-STRUCTURE.md`
- `docs/architecture/ADR-002-CLIENT-STACK.md`
- `docs/architecture/ADR-003-DESIGN-AND-BRAND-SYSTEM.md`
- `docs/architecture/ADR-004-IMMUTABLE-CONTENT-CONTRACT.md`
- `docs/architecture/ADR-008-SECURITY-AND-PRIVACY.md`
- `docs/architecture/ADR-009-QA-CI-CD-AND-RELEASE.md`
- `docs/architecture/MIGRATION-WAVES.md`
- G1-App-/Website-Reader- und Landingpage-Sichtbelege
- Legacy-App read-only
  `wrn-github-app-current@2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Legacy-Website read-only
  `wrn-web-portal-2026-08-20-r10n-work@9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- aktuelles Zielrepository ab G3-005-Abschluss `3c97cc3`

## Geaenderte Dateien

- `docs/tasks/WRN-G3-006-LOCAL-ARTICLE-READER.md`
- `docs/evidence/WRN-G3-006-READER-PARITY-AND-ACCEPTANCE-BRIEF.md`
- dieses Handoff sowie konsistente Governance-/Statusdokumente

Kein Produktcode, Testcode, Fixture, Asset, Legacybestand oder Live-System.

## Tests und Belege

- Legacy-App-/Website-Commit und Git-Status read-only verifiziert
- Reader-/History-/Detail-/Website-SEO-Code gezielt gelesen
- G1-Reader- und Landingpage-Screenshots visuell gegengeprueft
- Ziel-Contentvertrag und bestehende lokale Fixturegrenzen gelesen
- Task gegen Charter, Quality Rules, ADR-004, ADR-008, ADR-009 und Wave 3
  abgegrenzt
- Dokumentformat, Statuskonsistenz, Diff und Whitespace werden vor Commit
  geprueft

## Feststellungen nach Prioritaet

1. **High fuer Scope/Architektur:** Der Legacyreader koppelt mindestens zehn
   unabhaengige Funktionen. Eine gemeinsame Portierung waere nicht sauber
   test- oder ruecknehmbar.
2. **High fuer Datenkorrektheit:** Der Ziel-Feed besitzt keinen Artikelbody.
   Teaser duerfen nicht als Volltext ausgegeben werden; ein separater
   hashgebundener Detailvertrag ist erforderlich.
3. **Medium fuer Accessibility:** Escape war in App und Website wirkungslos;
   Fokus-, History- und 44-Pixel-Regeln muessen harte G3-006-Tests sein.
4. **Medium fuer Websitevertrag:** 935 Landingpages und 937 Sitemap-URLs sind
   nicht revisions-/mengengebunden belegt. G3-006 darf deshalb keine fertige
   Canonical-/SEO-Paritaet behaupten.
5. **Medium fuer UX:** Die alte horizontale Aktionsleiste ist mobil schwer
   ueberblickbar. Nicht implementierte Aktionen werden im neuen Reader nicht
   als Attrappen gezeigt.

## Annahmen und offene Fragen

- Der Product Owner akzeptiert fuer diesen ersten Readerbeleg bewusst
  textbasierte, selbst erstellte Fixtureartikel ohne Artikelbilder.
- `Artikel lesen` ist die vorbereitete deutsche Aktionsbezeichnung; eine
  sichtbare Anpassung bleibt bei der spaeteren Product-Owner-Abnahme moeglich.
- Statische Website-Landingpages, Share, Archiv und Revocation werden nach dem
  Readerkern in eigenen Tasks geplant, nicht still in G3-006 aufgenommen.

## Restrisiken

- App-/Website-Routen sind in G3-006 nur lokale Previewvertraege und noch
  keine Android-/SEO-/Sharezusage.
- Der lokale Reader beweist keine echte Inhaltsrechte-, Archiv- oder
  Takedownmigration.
- Spaetere Persistenz darf den in G3-006 ephemeren History-/Fokusvertrag nicht
  verdeckt veraendern.

## Empfohlener naechster Schritt

Nur Empfehlung; keine automatische Ausfuehrung.

Der Product Owner prueft Task Brief und einfachen Paritaetsbrief. Wenn der
Zuschnitt stimmt, erteilt er exakt `START WRN-G3-006`. Erst danach arbeitet
ein Backend/Data Reliability Engineer am Vertrag; nach dessen Checkpoint folgt
ein Frontend Brand Engineer und zuletzt unabhaengige QA.

## WRN-AGENT-STATUS

- Task: WRN-G3-006 lokale Artikel-/Readeransicht vorbereiten
- Status: GREEN
- Quellstand: Vorbereitung `8b7e292`; Zielbasis `3c97cc3`; App `2216ff3`;
  Website `9a59b17`
- Erledigt: Altanalyse, Zielvertrag, Scope, Tests, Sichtabnahme und Rollback
- Tests: read-only Quellen-/Sichtpruefung; Dokumentchecks vor Abschlusscommit
- Offen: ausschliesslich separates Implementierungsgate `START WRN-G3-006`
- Handoff: `docs/handoffs/WRN-G3-006-preparation.md`
- Naechster Schritt: Product-Owner-Pruefung; noch kein Code/Mitarbeiterstart
- END-CHECK: :)
