# Agent Handoff

- Agent: Main Agent / Orchestrierung
- Task-ID: WRN-G3-011 / PO-055
- Ergebnis: H-001-Korrekturgate dokumentiert

## Kurzfazit

Der Product Owner erteilte am 26. August 2026 exakt
`G3-011 H-001 BEHEBEN`. Der RED-QA-Befund `WRN-G3-011-H-001` aus `68fcb13`
ist die einzige freigegebene Produktkorrektur.

## Erlaubter Korrekturscope

- betroffene Lifecycle-/Content-ID-Projektion in `apps/mobile/src/App.tsx`
  und `apps/website/src/App.tsx`;
- eng zugehoerige Clienttests und `tests/e2e/foundation.spec.ts` fuer aktive
  gespeicherte Feed-/Reader-IDs sowie unveraendert sichere
  Gone/Revoked/Unknown-Projektionen;
- H-001-Implementierungsevidenz und
  `docs/handoffs/WRN-G3-011-H001-fix.md`.

Aktive Feed-/Reader-IDs muessen aus den bereits validierten lokalen Fixtures
belegbar gebunden werden. Keine ID darf allein durch Lesestatus als aktiv
gelten. Gone/Revoked dominieren, Unknown bleibt inhaltsfrei und entfernbar.

Nicht erlaubt sind Aenderungen an Vertrag, Domain, Fixtures, Storageformat,
Dependencies, Rootkonfiguration, Styling, allgemeiner UI, echten Daten,
Alt-/Liveprojekten oder externen Systemen.

## Verifikation und Rueckkehrpunkt

Der Fix braucht gezielte App-/Website-/E2E-Regressionen fuer einen aktiven
gespeicherten Feedartikel mit Readertrigger und Fortschritt sowie fuer
Gone/Revoked/Unknown ohne Payloadleck. Danach folgen Format, Lint,
Boundarytests, Typechecks, volle Units, beide Builds und voller Browserlauf.
Nach gesichertem Kandidaten wird der Frontend-Agent beendet. Erst danach darf
eine frische unabhaengige Re-QA die gesamte G3-011-Matrix wiederholen.
Nach einer GREEN-Re-QA prueft gemaess PO-056 ein separater unabhaengiger
Architekturkontrolleur den gesamten lokalen Zielprojektstand G3-001 bis G3-011
read-only. Er darf nichts korrigieren; Findings gehen an Main Agent und
Product Owner.

## WRN-AGENT-STATUS

- Task: WRN-G3-011 PO-055 / H-001-Korrektur
- Status: START FREIGEGEBEN
- Quellstand: Kandidat `0f51885`; RED-QA `68fcb13`; Status `3f59ed4`
- Offen: korrigieren, vollstaendig testen, Kandidat und Handoff sichern
- Handoff: `docs/handoffs/WRN-G3-011-H001-fix-start.md`
- Naechster Schritt: genau ein Frontend-Brand-Agent
- END-CHECK: :)
