# WRN-G3-016 QA-001 – enger Formatfix

Stand: 30. August 2026. Produkt `4113a72`, QA-RED `ed50660`.

## Auftrag

QA-001 Medium wird ausschliesslich durch Prettier-Formatierung der neuen
P3-Datei `tests/e2e/g3-016-home-visual.spec.ts` geschlossen.

## Schreibscope

- `tests/e2e/g3-016-home-visual.spec.ts`
- eigener Handoff `docs/handoffs/WRN-G3-016-qa001-format.md`

Keine andere Datei. Keine semantische Test-, Produkt-, Selektor-, Timeout-,
Matrix- oder Evidenceaenderung. Keine Kinder, kein Commit.

## Nachweis

- Prettiercheck nur fuer die Datei vor Fix RED, nach Fix GREEN;
- Diff ist ausschliesslich Format/Whitespace;
- Mobile-Typecheck und der P3-Visualtest bleiben GREEN;
- `git diff --check` PASS;
- Rootformat darf wegen dokumentierter Baseline weiter andere Pfade melden,
  muss aber diese Datei nicht mehr nennen.

Danach frischer unabhaengiger Recheck durch die bestehende QA-Instanz; der
Mikroagent erteilt kein P4-GREEN.

END-CHECK: :)
