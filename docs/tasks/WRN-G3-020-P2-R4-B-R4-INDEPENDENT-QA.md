# WRN-G3-020 P2-R4-B-R4 – unabhaengige Testcompletion-QA

Status: **GEBUNDEN; READ-ONLY-QA DARF NACH CHIEF-INTEGRATION STARTEN**

## Identitaet

- Task-ID: WRN-G3-020-P2-R4-B-R4-QA
- Zustaendiger Agent: `qa_release_engineer`, Terra/high
- Delegation: nicht erlaubt
- Basis: Produkt `cb0f6bc`, Browserbasis `47a6fc3`, Kandidat `85a08b8`
- Schreibowner: nur eigene Evidence und Handoff; Produkt-/Testpfade read-only

## Ziel

Unabhaengig feststellen, ob `P2-R3-QA-M-001` durch die kombinierte R3-A-/
R3-B-Matrix vollstaendig und reproduzierbar geschlossen ist. Insbesondere
muessen Referenz-/Entry-/Bytecaps, Hash-/Wildcardblock, Replacement- und
Safetyrevision, A1-H9-Lifecycle, Selectiongrenzen, S-/R-Fehlerinjektionen,
Future-/Corrupt-/Storegrenzen, Nullmutation und Restart abgedeckt sein.

## Schreibscope

1. `docs/evidence/WRN-G3-020/P2-R4-B-R4-INDEPENDENT-QA.md`
2. `docs/handoffs/WRN-G3-020-p2-r4-b-r4-independent-qa.md`

Keine anderen Dateien, kein Git-Index, kein Commit, keine Kinder.

## Pflichtmatrix

- alle drei G3-020-Playwright-Specs gemeinsam, `mobile-390x844`, ein Worker,
  null Zielskips;
- volle Contract- und Mobileunits sowie beide Typechecks;
- Prettier/ESLint auf dem gesamten R3-A-/R3-B-Testdelta;
- 19 Boundaries, Releaseboundary, Fixtureprovenienz und acht Hashgrenzen;
- statische Traceability jeder Briefpflicht zu Test und Assertion;
- kein Produkt-, Fixture-, Harness-, Config- oder Dependencydelta.

Jeder unerwartete Skip, ungebundene Fall, falsche Erwartung, produktiver
Testhook oder nicht reproduzierbarer Nachweis endet YELLOW/RED und blockiert
P2. Writerberichte sind nur Quellen, nicht Beweisersatz.

## WRN-AGENT-STATUS

- Task: WRN-G3-020 P2-R4-B-R4-QA
- Status: gebunden
- Quellstand: `85a08b8`
- Rechte: nur zwei eigene Berichte
- Naechster Schritt: frische Terra-QA
- END-CHECK: :)
