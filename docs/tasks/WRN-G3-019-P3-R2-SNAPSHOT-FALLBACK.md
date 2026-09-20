# WRN-G3-019 P3-R2 – Snapshotbindung und reiner v1-Fallback

Status: **GEBUNDEN – WRITER BIS ZUM UNABHAENGIGEN PRECHECK GESPERRT**

## Anlass

Der finale P5-Review `71fa38b` meldet genau zwei Medium-Findings:

- `P5-M-001`: Ein bereits geladener Sidecar A kann beim synchronen Wechsel
  auf Snapshot B einen Render lang mit B-v1-Details kombiniert werden.
- `P5-M-002`: Eine explizit `rejected` markierte Projektion faellt beim Text
  auf v1 zurueck, zeigt aber weiterhin das v2-Quellenprofil.

Es bestehen keine Critical-/High-, Security-, Privacy-, Datenverlust-,
Remote- oder Kostenfindings. Vor jedem Produktwrite prueft ein frischer
unabhaengiger Sol-Review diesen Vertrag.

## Zielvertrag

1. Jede v2-Oberflaeche ist renderseitig an exakte Fuenffeldgleichheit zwischen
   `sidecar.document.snapshot` und aktuellem `snapshot` gebunden. Ein alter
   Sidecarstate darf auch vor dem naechsten Effect nur v1 rendern.
2. `projection: rejected` rendert ausschliesslich v1: keine v2-Sektion, kein
   Quellenprofil, keine Translation, kein Medium und kein v2-Status.
3. Absent, invalid, future, snapshot-mismatch und rejected bleiben
   fail-closed. Originaltext, Back/Fokus, Save/Offline, Archiv-v1 und History
   bleiben unveraendert.
4. Kein Pin-, Loader-, Contract-, Fixture-, P2-, Website- oder
   Offline-Schema wird geaendert oder gelockert.

## Exakte Writer-Allowlist

Nach unabhaengigem Vertrags-GREEN darf genau ein frischer
`frontend_brand_engineer` Terra/high bearbeiten:

- `apps/mobile/src/mobile-reader-v2-ui.ts`;
- `apps/mobile/src/mobile-reader-v2-ui.test.ts`;
- `apps/mobile/src/App.test.tsx`;
- optional `apps/mobile/src/App.tsx` nur wenn der renderseitige Vergleich im
  Presentationlayer allein den synchronen A/B-/Rollbacktest nicht sauber
  ermoeglicht; jede Nutzung muss im Handoff begruendet werden;
- eigene neue Evidence unter `docs/evidence/WRN-G3-019/P3-R2-*`;
- `docs/handoffs/WRN-G3-019-p3-r2-snapshot-fallback.md`.

Alle anderen Dateien bleiben read-only. Keine Kinder, Dependencies,
Konfigurationen, CSS-/Sprach-/Visualspec-Aenderungen oder Scopeerweiterung.

## Pflichtregressionen

- exakte Fuenffeldgleichheit und je Feld eine Mismatch-Regression;
- synchroner A->B-Render vor passivem Effect zeigt nur B-v1;
- A/B/A, Aktivierung und Rollback zeigen niemals eine fremde v2-Projektion;
- `rejected` zeigt nur v1 und null Quellenprofil/Translation/Medium/v2-DOM;
- normale passende, `ambiguous` und v1-Fallback-Zustaende bleiben GREEN;
- Originaltext, Quellenprofiltrennung im gueltigen Fall, Offline, stale
  Translation, Back/Fokus, Save/Reading State und Archiv-v1 bleiben GREEN;
- fokussierte Units plus gesamte relevante Mobile-/Reader-v2-Matrix, beide
  Typechecks und Boundaries mit exakt Node 24.19;
- keine Browserbilder fuer synthetische mismatch/rejected-Zustaende noetig;
  DOM-/A11y-Tests sind der ehrliche Beleg. Produktionsvisuals bleiben
  byteidentisch, sofern keine optionale `App.tsx`-Produktkorrektur noetig ist.

## Folgegates

Chief reproduziert zuerst die fokussierte Matrix. Danach frische unabhaengige
Terra-QA fuer beide Findings, ein enger Sol-Security-Deltacheck der geaenderten
Snapshot-/DOM-Grenze und ein frischer Sol-P5-Abschluss. Erst dessen GREEN
erlaubt lokale PO-Sichtpruefung.

Website, Hosting/Live, Android/AAB/Play, Signierung, Upload, Deployment,
Release, echte Medien/Quellen und Provider bleiben gesperrt.

END-CHECK: :)
