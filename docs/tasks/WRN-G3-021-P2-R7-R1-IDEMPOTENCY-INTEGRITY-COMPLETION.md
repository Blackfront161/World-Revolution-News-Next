# WRN-G3-021 P2-R7-R1 – Idempotenz-/Integritätsabschluss

## Zweck und feste Basis

Der unabhängige R7-Precheck auf Basis
`c83c9c71119b3f85449d701cebb5b2abc2d29af7` bestätigt die reguläre
Drei-Slot-Matrix und die Fünf-Pfad-Umsetzbarkeit, bleibt aber RED mit
`P2-R7-PRE-M-001`, `P2-R7-PRE-M-002` und `P2-R7-PRE-L-001`. Dieser reine
Chief-R1-Nachtrag schließt ausschließlich diese drei Vertragslücken. R7 und
seine Fünf-Pfad-Allowlist gelten im Übrigen unverändert weiter.

Vor einem frischen unabhängigen Sol/high-R1-Recheck mit null Findings besteht
kein Produkt-, Test- oder Browserwrite. P3 und alle OUT-/externen Bereiche
bleiben gesperrt.

## R1-01 – eindeutiger Same-revision-Transporthash im gespeicherten Zustand

`validState()` bindet zusätzlich folgende Invariante über `active`,
`candidate` und `previous`:

- Für jede vorhandene Revision existiert im gesamten Zustand genau ein
  Transporthashwert. Tragen zwei oder drei Slots dieselbe Revision, müssen
  alle diese Slots bytegleich denselben `transportSha256` besitzen.
- Dieselbe Revision mit verschiedenen Transporthashes in beliebigen
  Slotpaaren ist ein geschützter, nicht reparierbarer Zustand. `snapshot()`,
  `saveCandidate()`, `activate()` und `rollback()` enden `protected`, bevor
  irgendein Write oder Slottausch möglich ist.
- Die Invariante vergleicht nach vollständiger Einzelvalidierung der Slots
  sowohl Revision als auch den SHA-256 der exakten Release-Transportbytes.
  Ein Match nur nach `releaseId`, nur nach Revision oder nur nach einem nicht
  gegen Rawbytes verifizierten Recordfeld ist unzulässig.

Der normale Rollbackzustand bleibt gültig: Active A trägt eine niedrigere
Revision, Previous B als einziger Slot die höchste Revision. Mehrere Slots
derselben Revision und desselben Hashs dürfen als bereits konsistenter Zustand
gelesen werden; sie öffnen keine Rotation außerhalb der bestehenden
expliziten APIs.

Ein echter Chrome-/IndexedDB-Negativfall injiziert mindestens Active Revision
2/Hash H1 und Candidate Revision 2/Hash H2, jeweils einzeln vollständig
shape-, raw-, descriptor-, rootpin- und current-valide, mit konsistentem
Control-/Safetyrecord. Die öffentliche Beobachtung ist `protected`; weder
Retry noch nachfolgende Aktivierung kann H2 nach Active verschieben. Der rohe
IDB-Zustand bleibt byteidentisch.

## R1-02 – Equal-No-op nur bei exakt unverändertem Safetyzustand

Nach vollständigem Input- und `state()`-Check, `expectedGeneration`, frischer
Clock und vor jedem Equal-No-op wird `nextSafety(candidate, rawBundle,
before.safety)` read-only ausgeführt.

Der No-op ist ausschließlich erlaubt, wenn:

1. `nextSafety()` nicht `null` liefert; und
2. sein vollständiges Ergebnis byte-/strukturidentisch zu `before.safety`
   ist, also keine Safetyrevision, Rawbytes, Entries, References oder
   Generation verändert werden müsste.

`null` oder ein von `before.safety` abweichendes Ergebnis liefert
`protected` und null Writes. Dadurch werden Lower-Safety, Equal-different-
Raw und eine nur durch Mutation erreichbare Higher-Safety nicht als No-op
quittiert. `candidateBlocked()` bleibt unverändert ausschließlich eine
Aktivierungsprüfung und wird nicht in die Save-No-op-Semantik verschoben.

Zusätzlich deckt `validState()` die monotone Safetyrelation nicht nur für
`active` und `previous`, sondern auch für `candidate`: Der gespeicherte
Safetyrecord muss dessen `revocationFloor`, Entries und References abdecken.
Ein shape-/rawgültiger Candidate-only-Zustand mit unzureichendem oder
anders gebundenem Safetyrecord ist bereits `protected` und read-only.

Pflichtfälle sind mindestens:

- reguläre Candidate-/Active-/Previous-No-ops mit exakt identischem Safety;
- Candidate-only plus höherer, niedrigerer oder gleichrevidiert anders
  gebundener gültiger Safetyrecord, soweit die jeweilige Präimage den
  gespeicherten Zustandsvalidator erreicht; Erwartung immer `protected`;
- kein Schutzfall darf einen Safetyrecord ergänzen, normalisieren oder
  zurücksetzen.

## R1-03 – echte Nullwrite-Zähler

Für alle drei positiven No-ops, alle drei Equal-different-Hash-Konflikte, den
Same-revision-Split-brain-Fall und die neuen Safety-Schutzfälle bindet die
echte Chrome-/IndexedDB-Matrix zusätzlich zu vollständiger Snapshot-
Byteidentität und unveränderter Generation:

- `IDBObjectStore.prototype.put` exakt `0`;
- `IDBObjectStore.prototype.add` exakt `0`;
- `IDBObjectStore.prototype.delete` exakt `0`;
- `IDBObjectStore.prototype.clear` exakt `0`;
- getrennte beziehungsweise auswertbare Zählung für `mediaBundles`,
  `mediaControl` und `mediaSafety`, sodass jeder Store nachweislich null
  Mutationsaufrufe besitzt.

Die Prototypmethoden werden in `finally` zuverlässig und exakt auf ihre
ursprünglichen Funktionen zurückgesetzt. Das Löschen der Testdatenbank vor
oder nach der Messphase gehört nicht in die Zählphase. Ein abgebrochener
Schreibversuch, der zufällig denselben Endsnapshot hinterlässt, ist kein
Nullwrite und muss den Test fehlschlagen lassen.

## Weitergeltende Grenzen

- R7-01/R7-02 binden weiterhin Candidate, Active und Previous für identische
  No-ops und Equal-different-Konflikte.
- Lower bleibt `invalid-candidate`; Higher durchläuft alle Safety-, Rechte-,
  Reference-, Cap- und Readbackkontrollen.
- Rollback/Roll-forward bleiben explizite atomare Slottausche; ein Previous-
  Retry staged oder aktiviert nichts.
- R6-92-/26-/19-Basismatrix, Rootpin, Rawbinding, Current-time, Rights/
  Admission, Timeout/Abort, Caps, Future/Corrupt, Logging und Privacy bleiben
  unverändert.
- Kein Testmock für Digest, Transporthash, Pin, Safety oder gespeicherte
  Erfolgszustände.

## Scope und Gate

Die exakte R7-Fünf-Pfad-Allowlist bleibt unverändert:

1. `apps/mobile/src/mobile-media-catalog-store.ts`
2. `apps/mobile/src/mobile-media-catalog-store.test.ts`
3. `tests/e2e/g3-021-media-catalog-store.spec.ts`
4. `docs/evidence/WRN-G3-021/P2-R7-CANDIDATE-IDEMPOTENCY-CORRECTION.md`
5. `docs/handoffs/WRN-G3-021-p2-r7-candidate-idempotency-correction.md`

Genau ein frischer unabhängiger Sol/high-R1-Recheck prüft R7 plus diesen
Nachtrag als gemeinsame feste Vertragskette. Nur null High-/Medium-/Low-,
Coverage-, Privacy- und deferred Findings erlauben danach ein separates
Chief-Writergate. Loader, Contract, Fixtures, Assets, Pin, Packages,
Dependencies, App-/Website-UI und Player bleiben read-only.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R7-R1-IDEMPOTENCY-INTEGRITY-COMPLETION`
- Status: gebunden; frischer unabhängiger Sol/high-R1-Recheck erforderlich
- Geschlossen im Vertrag: `P2-R7-PRE-M-001`, `P2-R7-PRE-M-002`,
  `P2-R7-PRE-L-001`
- Writer-Allowlist: unverändert fünf Pfade, noch gesperrt
- P3/OUT/extern: gesperrt
- END-CHECK: :)
