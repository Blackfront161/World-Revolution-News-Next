# WRN-G3-021 P3-A-R6 – Browserdeterminismus

Status: **TEST-ONLY-KORREKTUR GEBUNDEN – KEIN WRITER VOR COMMIT**

## Befund

Chief reproduziert unter Node 24.19 80/80 Units GREEN, aber nur 14/15
Chromiumfälle. Im letzten Browserfall laufen Reader-, Digest-, Play- und
DOM-Fault parallel. Der Digestfall überschreibt dabei global
`crypto.subtle.digest` und kann andere gleichzeitig laufende Orakel
beeinflussen. Das ist ein Testisolationsfehler, kein bestätigter Produktfehler.
Außerdem prüft der Fall 4999 und nach sechs weiteren Millisekunden 5005,
nicht den vertraglich literalen Punkt 5001.

## Enge Korrektur

Nach separatem Commit darf genau ein frischer `spark_micro_task_worker` ohne
Kinder oder Git-Index nur diese drei vorhandenen P3-A-Pfade ändern:

1. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
2. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
3. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Die vier Faultfälle werden sequenziell ausgeführt; jeder gibt seinen Namen
zurück, globale Digest-Injektion wird in `try/finally` exakt restauriert und
jeder Zustand separat geprüft. Timeoutorakel prüfen literal 4999, 5000 und
5001. Danach sind 80 Units und die vollständige Browserdatei mindestens
zweimal hintereinander unter Node 24.19 auszuführen. Evidence/Handoff nennen
beide Läufe und dürfen nur reale PASS-Zähler enthalten.

Produktmodule, übrige Tests, P2, App/P4-B, Config, Dependencies und OUT sind
read-only. Bei erneutem Flake oder Produktfinding gilt Stop an den Chief.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R6-BROWSER-DETERMINISM`
- Status: Testisolation und 5001 gebunden; kein Writer vor Commit
- Allowlist: exakt drei bestehende P3-A-Pfade
- Produktcode: read-only
- END-CHECK: :)
