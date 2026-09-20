# Agent Handoff

- Agent: Frontend Brand Engineer – WRN-G3-006 H-002 Mobile Reflow
- Task-ID: `WRN-G3-006-H-002`
- Ergebnis: bestanden

## Kurzfazit

Die mobile Readeransicht verwendet jetzt unabhaengig von Zoom- oder
Textskalierung einen einzigen normalen Dokument-Scrollfluss. Dadurch kann ein
hoher Header oder eine mehrzeilige Bottom-Navigation den Reader nicht mehr auf
einen kleinen inneren Scrollbereich reduzieren oder Inhalt ueberdecken. Die
nicht-lesenden Mobile-Ansichten behalten ihre bisherige begrenzte Shell mit
unten verankerter Navigation.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-006-LOCAL-ARTICLE-READER.md`
- `docs/handoffs/WRN-G3-006-independent-qa.md`
- `docs/handoffs/WRN-G3-006-M001-long-reader-fixture.md`
- `docs/evidence/WRN-G3-006-VISUAL-QA-REPORT.md`
- `docs/evidence/WRN-G3-006/206a7e1_app_390x844_light_reader_200pct-reflow_2026-08-24.png`
- `docs/templates/AGENT-HANDOFF.md`

## Geaenderte Dateien

- `apps/mobile/src/App.tsx`
  - kennzeichnet ausschliesslich den aktiven lokalen Reader mit einer eigenen
    Shell-Klasse.
- `apps/mobile/src/styles.css`
  - laesst diese Reader-Shell als normalen, dokumentweiten Scrollfluss wachsen;
    Header, Reader und Bottom-Navigation bleiben nacheinander im normalen
    Fluss.
  - stellt die Readermetadaten im Readerfluss einspaltig dar, damit die lange
    Beschriftung `Originalsprache` bei 200 Prozent keinen Horizontaloverflow
    erzeugt.
- `tests/e2e/foundation.spec.ts`
  - neue H-002-Regression fuer Cedar bei 390 x 844 und 200 Prozent: kein
    innerer Main-Scrollzwang, mehrseitiger Dokumentfluss, erreichbare
    Ueberschrift und Quellenaktion, 0 horizontaler Overflow sowie 44-Pixel-
    Ziele.

Keine Website-, Contract-, Fixture-, Root-, Dependency-, Lockfile-,
QA-Evidenz-, Legacy- oder Live-Datei wurde geaendert. Es wurden keine finalen
Screenshots erstellt und keine vorhandenen Evidenzdateien veraendert.

## Ursache und Messwerte

Der RED-QA-Befund entstand durch die allgemeine Grid-Shell: Bei 390 x 844 und
200 Prozent belegten Header `441.95 px` und die mehrzeilige Bottom-Navigation
`329 px`; dem auf `minmax(0, 1fr)` begrenzten `main` blieben nur `73 px`.
Der lange Reader musste damit in einer praktisch unlesbaren inneren
Scrollflaeche liegen.

Nach der Korrektur bleibt der Header bei diesem strengen Testzustand weiterhin
`441.95 px` und die Navigation `329 px`, aber beide koennen den Reader nicht
mehr einschliessen: `main` ist `18'493 px` hoch, der Cedar-Reader
`17'737 px`, der Dokumentfluss `19'264 px`; `main` hat `overflow-y: visible`,
`main.clientHeight === main.scrollHeight` und der gemessene horizontale
Overflow ist `0 px`. Der Test scrollt sowohl die Readerueberschrift als auch
die Quellenaktion vollstaendig in den Viewport.

Die Umsetzung verwendet keine MutationObserver-, Zoom- oder Test-Style-
Erkennung. Sie ist daher auch bei Betriebssystem-Textgroessen, Browserzoom und
anderen vergroesserten Readerhoehen wirksam.

## Tests und Belege

Alle Befehle mit gebuendeltem Node `24.19.0` und pnpm `11.19.0`; keine
Installation:

- Mobile Unit-Test: `17/17 PASS`
- Mobile Typecheck: `PASS`
- Gezielte Mobile-Browserregression: `4 PASS`, `4 erwartete SKIP`, `0 FAIL`
  - normale 390 x 844 Navigation, Readerroute und Unknown-Route
  - Cedar Reader 390 x 844 bei 200 Prozent mit H-002-Messungen
- Vollstaendlicher Hauptcheck: `PASS`
  - 75 Unit-/Contract-/Komponententests und 16 Boundarytests
- Produktionsbuild Mobile: `PASS`
- Produktionsbuild Website (unveraendert mitgeprueft): `PASS`
- `git diff --check`: `PASS`

## Feststellungen nach Prioritaet

- High `WRN-G3-006-H-002` ist im mobilen Produktbereich behoben und durch eine
  maschinelle Regression gesichert.
- Keine Blocker, Mediums oder Lows im eigenen Aenderungsbereich.

## Annahmen und offene Fragen

- Die neue Shell-Klasse wird fuer jeden lokalen Reader verwendet, nicht nur
  fuer Cedar oder einen bestimmten Zoomwert. Das ist erforderlich, weil auch
  kuenftige lange, validierte lokale Readertexte sicher lesbar bleiben muessen.
- Eine visuelle Re-QA und die Product-Owner-Abnahme bleiben nach der
  vorgegebenen Sequenz unabhaengige nachfolgende Gates.

## Restrisiken

- Diese Korrektur belegt keine Android-WebView-, echte Content-, Medien-, SEO-,
  Remote-, Deployment- oder Releaseeigenschaft.
- Die Navigation liegt im langen Reader bewusst nach dem Dokumentinhalt statt
  dauerhaft am Viewportrand. Sie bleibt erreichbar und kann den Inhalt nicht
  verdecken; die unabhaengige visuelle Re-QA soll diese Leseflussentscheidung
  in der verbindlichen Screenshotmatrix beurteilen.

## Empfohlener naechster Schritt

Main Agent sichert den Kandidaten ohne weiteren Produktcode. Danach erfolgt die
vollstaendige unabhaengige Re-QA einschliesslich der verbindlichen Screenshot-
matrix; keine automatische Product-Owner-Freigabe.

## WRN-AGENT-STATUS

- Task: WRN-G3-006-H-002 mobile Reader-Reflowkorrektur
- Status: GREEN
- Quellstand: M-001-Checkpoint `31b96b4`; kein Commit durch diesen Agenten
- Erledigt: intrinsischer Reader-Seitenfluss, einspaltige Reflow-Metadaten,
  Cedar-200-Prozent-Regression und Messung
- Tests: Hauptcheck, beide Builds, gezielte Browser-E2E und Diff-Check PASS
- Offen: vollstaendige unabhaengige Re-QA und visuelle Product-Owner-Abnahme
- Handoff: `docs/handoffs/WRN-G3-006-H002-mobile-reflow.md`
- Naechster Schritt: Main-Agent-Kandidatensicherung, danach nur Re-QA
- END-CHECK: :)
