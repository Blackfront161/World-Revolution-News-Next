# Agent Handoffs

Hier liegen kompakte, dauerhafte Uebergaben einzelner Arbeitspakete. Ein Handoff
ersetzt keine Tests oder Git-Historie, verhindert aber die Weitergabe ganzer,
rauschender Chatverlaeufe.

## Dateiname

`<TASK-ID>-<agent-name>.md`

Beispiel:

`WRN-G1-001-legacy_product_analyst.md`

## Inhalt

Vorlage: `docs/templates/AGENT-HANDOFF.md`

Jeder Handoff nennt mindestens:

- Task und Agent;
- Quellpfade, Branch und Commit/Hash;
- erledigte und offene Arbeit;
- geaenderte Dateien;
- Tests und Belege;
- Entscheidungen, Annahmen und Restrisiken;
- Status GREEN/YELLOW/RED;
- `END-CHECK: :)`.

Handoffs werden nach Integration nicht automatisch geloescht. Veraltete
Uebergaben werden als abgeschlossen markiert und bleiben ueber Git
nachvollziehbar.
