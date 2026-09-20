# WRN-G3-021 P2-R7-R2 – finaler Idempotenzvertrag

## Feste Basis und Disposition

Der frische R7-R1-Recheck auf Basis
`11aaff9d6486048111656511f583be437009452c` schließt das ursprüngliche
Nullwrite-Low und die Split-brain-Norm, bleibt aber RED mit
`P2-R7-R1-RECHECK-M-001` und `P2-R7-R1-RECHECK-L-001`. Dieser reine Chief-R2-
Nachtrag trifft die eine fehlende Safety-Persistenzentscheidung und
vervollständigt die Split-brain-Matrix. R7 und R7-R1 gelten nur in der hier
präzisierten Form weiter.

Vor einem frischen unabhängigen Sol/high-R2-Abschlussrecheck mit null
Findings besteht kein Produkt-, Test- oder Browserwrite. P3 und alle OUT-/
externen Bereiche bleiben gesperrt.

## R2-01 – Safety bleibt persist-on-activate

Die bestehende Architektur bleibt unverändert:

1. `saveCandidate()` validiert `nextSafety()` read-only, persistiert aber
   weder beim ersten Save noch beim identischen Retry einen Safetyrecord.
2. Erst `activate()` führt die monotone Safetypersistenz, den exakten
   Safetyreadback und anschließend die Slotrotation in derselben atomaren
   Transaktion aus.
3. `validState()` prüft die gespeicherte Safetydeckung weiterhin für
   `active` und `previous`, nicht für `candidate`. Der Candidate ist vor
   Aktivierung vollständig raw-, descriptor-, rootpin-, current-, rights-
   und admissionvalidiert, seine Safety wird jedoch bewusst nur als noch
   nicht persistierte Aktivierungsvoraussetzung geführt.
4. Damit bleibt der normale Candidate-only-Zustand mit Candidate Revision 1,
   Generation 1 und leerem Safetyrecord Revision 0 gültig. Expiry-, Quota-,
   Abort- und Safety-Readback-Fehlersenken bei Aktivierung bleiben
   wortwörtlich erreichbar und unverändert.

Die gegenteilige R7-R1-Forderung, Candidate bereits in `validState()` durch
den gespeicherten Safetyrecord abzudecken, entfällt vollständig. Ebenso
entfällt die Forderung, `nextSafety()` müsse vor einem Equal-No-op
byte-/strukturidentisch zu `before.safety` sein.

## R2-02 – read-only Safetykompatibilität vor Equal-No-op

Vor jedem Equal-No-op wird nach vollständigem Input-/Statecheck,
`expectedGeneration` und frischer Clock genau
`nextSafety(candidate, rawBundle, before.safety)` read-only ausgeführt:

- Ergebnis ungleich `null`: Der Candidate ist mit dem aktuellen monotonen
  Safetyrecord vereinbar. Der identische Slotmatch darf als No-op den
  vollständigen unveränderten Vorherzustand zurückgeben, selbst wenn eine
  spätere Aktivierung Safety erstmals oder additiv persistieren müsste.
- Ergebnis `null`: `saveCandidate()` liefert `protected`; alle Stores bleiben
  unverändert und es gibt exakt null Mutationsmethodenaufrufe.

Damit gilt deterministisch:

- Candidate-only mit leerem Safetyrecord und identischem gültigem Candidate:
  idempotenter No-op, weil dessen Safety bei späterer Aktivierung monoton
  hinzufügbar ist;
- aktueller Safetyrecord höher als der eingehende Candidate-Safetystand:
  `protected` wegen Lower-Safety;
- gleiche Safetyrevision mit anderen exakten Revocation-Rawbytes:
  `protected`;
- gültiger additiv höherer eingehender Safetystand: No-op des bereits
  vorhandenen identischen Bundles; die Persistenz bleibt der späteren
  expliziten Aktivierung vorbehalten;
- `candidateBlocked()` bleibt ausschließlich Activate-Semantik.

Kein No-op schreibt den von `nextSafety()` berechneten Zustand. Die bereits
gebundenen `put/add/delete/clear = 0`-Zähler müssen dies beweisen.

## R2-03 – vollständige Same-revision-Split-brain-Matrix

Die R7-R1-Invariante „genau ein Transporthash je Revision über alle Slots“
bleibt vollständig verbindlich. Die echte Chrome-/IndexedDB-Negativmatrix
injiziert und prüft alle drei ungeordneten Same-revision-/Different-hash-
Slotpaare getrennt:

1. Active / Candidate;
2. Active / Previous;
3. Candidate / Previous.

Jeder Slot ist einzeln vollständig raw-, descriptor-, pin- und current-
valide; Control und Safety sind shape- und relationsgültig bis ausschließlich
zur neuen paarweisen Hashinvariante. Erwartet werden für jedes Paar:

- `snapshot()` beziehungsweise der erste öffentliche Zustandsread endet
  `protected`;
- vollständige rohe IDB-Byteidentität;
- `put/add/delete/clear = 0` getrennt für `mediaBundles`, `mediaControl` und
  `mediaSafety`;
- bei Paaren mit Candidate kann ein nachfolgender `activate()`-Versuch keinen
  Hashwechsel oder Write auslösen und endet ebenfalls `protected`.

Der normale Previous/highest-Rollbackzustand mit niedrigerer Active-Revision
bleibt gültig. Mehrere Slots derselben Revision und desselben Hashs bleiben
konsistent lesbar; sie erteilen keine implizite Rotationsberechtigung.

## R2-04 – vollständige reguläre Matrix und unveränderte Baseline

R7/R7-R1 binden weiterhin:

- drei idempotente No-ops: Candidate-only, Active, Previous/highest;
- drei Equal-revision-/Different-hash-Konflikte in denselben Slotformen;
- echte Nullwrite-Zähler für alle sechs regulären Fälle, alle drei Split-
  brain-Paare und beide inkompatiblen Safetyformen;
- vollständige Snapshot-/Rawidentität, Generation, Slots, Control und Safety;
- Lower `invalid-candidate`, Higher mit vollständigen Safety-/Rights-/Cap-
  Kontrollen, expliziter Rollback/Roll-forward und Activate-only Blockcheck.

Die vollständige bestehende 92-Vitest-/26-Browser-/19-Boundary-Basismatrix
muss unverändert bestehen. Neue R7-Fälle kommen hinzu; kein vorhandener Test
oder Activation-Safety-/Expiry-/Faultsink darf entfernt, integriert,
umbenannt oder in seiner erwarteten Semantik verändert werden.

## Scope und Folgegate

Die exakte Fünf-Pfad-Allowlist bleibt unverändert:

1. `apps/mobile/src/mobile-media-catalog-store.ts`
2. `apps/mobile/src/mobile-media-catalog-store.test.ts`
3. `tests/e2e/g3-021-media-catalog-store.spec.ts`
4. `docs/evidence/WRN-G3-021/P2-R7-CANDIDATE-IDEMPOTENCY-CORRECTION.md`
5. `docs/handoffs/WRN-G3-021-p2-r7-candidate-idempotency-correction.md`

Ein frischer unabhängiger Sol/high-R2-Abschlussrecheck prüft R7, R7-R1 und
diesen Nachtrag als gemeinsame Vertragskette. Nur null High-/Medium-/Low-,
Coverage-, Privacy- und deferred Findings erlauben ein separates Chief-
Writergate. Loader, Contract, Fixtures, Assets, Pin, Packages, Dependencies,
App-/Website-UI und Player bleiben read-only.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R7-R2-FINAL-IDEMPOTENCY-CONTRACT`
- Status: gebunden; frischer unabhängiger Sol/high-R2-Abschlussrecheck Pflicht
- Safety: ausdrücklich read-only bei Save, persist-on-activate
- Split-brain: alle drei ungeordneten Slotpaare Pflicht
- Writer-Allowlist: unverändert fünf Pfade, noch gesperrt
- P3/OUT/extern: gesperrt
- END-CHECK: :)
