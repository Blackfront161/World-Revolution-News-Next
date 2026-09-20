# WRN-G3-015 Frontend R1 WIP-Handoff

Status: YELLOW/WIP. Keine P3-Freigabe.

Produkt-/Teststand: Frontend-UI aus `b5e2ea9` plus Source-Dev-Guard `06dad6f`;
die aktuell uncommitteten P3-Test-/Evidence-Ergänzungen sind als exakter Folgecommit
zu sichern. Eigene Pfade: Website Shell UI, `website-shell-ui-*`-Tests,
`docs/evidence/WRN-G3-015/p3/**` und dieser Handoff.

Wichtige dauerhafte Läufe:

- `p3/runs/r1-visual-final-19140-1787915349315` — PASS, 204 Bilder.
- `p3/runs/r1-source-guard-final-*` — PASS, Source 0/0 und Built Opt-in.
- `p3/runs/r1-built-real-b-foreign-*` — PASS, echtes Build A/B und Fremdfenster.
- `p3/runs/r1-built-error-*` — PASS, isolierter Built-Assetfehler.
- `p3/runs/r1-root-intermediate-20260828-1322/raw` — unvollständiger/fehlgeschlagener
  Root-Zwischenlauf, nur Rohbeleg; nicht wiederverwenden als Gate.

Noch zwingend: Remount/late-settlement, UI-Updateoperation und echter Themewechsel;
danach neuer dauerhafter kompletter Gate-/Rootreport. Keine Backend-, Generator-,
Rootconfig-, Mobile- oder Katalogsemantikänderung ohne neuen Auftrag.

END-CHECK: :)
