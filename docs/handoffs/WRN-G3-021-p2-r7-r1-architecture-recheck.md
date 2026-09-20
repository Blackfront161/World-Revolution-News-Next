# WRN-G3-021 P2-R7-R1 – Architektur-/Vertragsrecheck-Handoff

## Ergebnis

**RED / FAIL** auf fester Basis
`11aaff9d6486048111656511f583be437009452c`.

Counter:

- 0 Blocker;
- 0 High;
- 1 Medium;
- 1 Low, davon 1 separate Coverage-/Assurance-Low;
- 0 Privacy;
- 0 deferred.

## Geschlossene Teile

- R1-01 bindet einen Release-Transporthash je Revision nach vollständiger
  Rawvalidierung über Active, Candidate und Previous. Split-brain ist
  `protected`; der reguläre Previous/highest-Rollbackstand bleibt gültig.
- R1-03 schließt das frühere Nullwrite-Low mit echten
  `put/add/delete/clear`-Zählern, je Store exakt null, `finally`-Restore und
  Cleanup außerhalb des Messfensters.
- Lower, Equal-different, Higherkontrollen und Activate-only-
  `candidateBlocked()` bleiben kategorisch sauber.

## P2-R7-R1-RECHECK-M-001 – Safety-Persistenzphase widersprüchlich

R1-02 verlangt Candidate-Deckung durch den **gespeicherten** Safetyrecord und
erlaubt Equal-No-op nur, wenn `nextSafety()` vollständig gleich
`before.safety` ist.

- Ohne Safetywrite bei `saveCandidate()` kann der erste Candidate-only-Stand
  mit Fixturefloor 1, sechs References und leerer Safetyrevision 0 den neuen
  `validState()`-Check nicht passieren.
- Mit Safetywrite bei `saveCandidate()` ist Safety bei `activate()` bereits
  gleich. Der gebundene Safety-No-op macht den bestehenden Activation-
  Safety-Readback-/quota-/abort-Sink unerreichbar und ändert mehrere literal
  gebundene 26er Browsererwartungen (`safety:0`, spätere
  Safetygenerationen).

R7 behauptet zugleich, seine übrige Semantik und die R6-92-/26-/19-
Basismatrix blieben unverändert. Ein Writer braucht daher zuerst eine klare
Chief-Disposition: bestehende Activation-Persistenz plus reiner
`nextSafety()!=null`-Kompatibilitätscheck, oder ausdrücklich neue
Save-Persistenz mit neu gebundener Safety-/Rollback- und Faultsinkmatrix.

## P2-R7-R1-RECHECK-L-001 – nicht alle Split-brain-Paare sind Pflichtfälle

Die Norm gilt für beliebige Slotpaare, verlangt automatisiert aber nur
mindestens Active/Candidate. Die IDB-Matrix muss Active/Candidate,
Active/Previous und Candidate/Previous jeweils mit `protected`, unveränderten
Rawbytes und allen zwölf Store-/Mutationszählern exakt null belegen; bei
Candidate-Paaren zusätzlich kein Activate-Bypass.

## Erreichbarkeit und Scope

- Drei No-ops, drei Equal-different-Konflikte, regulärer
  Previous/highest-Rollback sowie Lower/Higher bleiben nach der
  Persistenzdisposition erreichbar.
- Lower = `invalid-candidate`, Equal-different = `conflict`, Split-brain und
  inkompatible Safety = `protected`.
- Lower-, Equal-different- und Higher-Safety-Präimages sind mit vollständig
  gültigen Rawrecords und passender Floor-/Referenceabdeckung erreichbar.
- Die unveränderte Fünf-Pfad-Allowlist ist mechanisch ausreichend; kein
  Loader-, Contract-, Harness-, Fixture-, Pin-, Asset-, Package- oder
  Dependencywrite ist erforderlich.

## Nächstes Gate

Chief bindet einen engen R7-R2-Vertragsnachtrag für die Safety-
Persistenzphase, die daraus folgende echte Basismatrix und alle drei
Split-brain-Paare. Danach ist ein frischer unabhängiger Sol/high-Recheck mit
null Findings erforderlich. Vorher besteht kein Produkt-, Test- oder
Browserwrite.

P3 und alle OUT-/externen Bereiche bleiben gesperrt.

## Rechteende

- Produkt-/Test-/Fixture-/Browserwrites: keine
- Git-Index/Commit: nicht berührt
- Eigene Writes: nur Evidence und dieser Handoff
- Status: Rechte beendet
- END-CHECK: :)
