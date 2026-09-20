# WRN-G3-021 P2-R5-R2 – finale Revocation-Capdisposition

## Feste Basis und Zweck

Der frische R5-R1-Recheck auf Basis
`1cc8dc3869b9f42f23bc525d3ec3a267693d5502` schließt
`P2-R5-PRE-M-001` und `P2-R5-PRE-M-002`, bleibt aber RED nur mit
`P2-R5-R1-M-001`: Die allgemeine Target-max-Dreierregel für sechs
Dokumentklassen kollidiert bei Revocation mit dem engeren Safetycap. Dieser
reine Chief-R2-Nachtrag disponiert exakt diesen Sonderfall. Alle übrigen R5-
und R5-R1-Pflichten sowie die fünfpfadige Writer-Allowlist bleiben
unverändert.

Vor einem frischen unabhängigen Sol/high-R2-Abschlussrecheck mit null
Findings besteht kein Produkt-, Test-, Fixture-, Browser- oder Assetwrite. P3
und alle OUT-/externen Bereiche bleiben gesperrt.

## R2-01 – fünf allgemeine Dokumentklassen

Manifest, Admission, Rights, Consent und Lifecycle behalten jeweils die
Target-max-Dreierregel aus R5:

1. Der Writer konstruiert einen vollständigen kanonischen Candidate mit den
   fünf jeweils anderen Peerdokumenten in ihrer kleinsten tatsächlich
   validierbaren Form. Revocation bleibt dabei als gültiges, leeres und unter
   `safetyBytes` liegendes Dokument vorhanden.
2. Das benannte Zieldokument erhält ausschließlich erlaubtes JSON-Whitespace
   bis zum exakt verbleibenden Anteil; alle sechs Dokumentbytes summieren sich
   auf `totalJson = 524288`.
3. Descriptorbytes/-hashes, Release-Transporthash und voller Rootpin werden
   frisch gebunden. Save, Activate und exakter Readback müssen erfolgreich
   sein.
4. Die isolierte Dokumentgrenze `524288` Equal / `524289` Ablehnung und die
   tatsächliche Invariante
   `524288 + sum(minimale positive Peerbytes) > 524288` bleiben je Klasse
   sichtbar.

Die fünf Produktfälle dürfen parametrisiert in einem Browser-/IDB-Test
stehen, müssen aber je Klasse ihre tatsächlichen Peerbytes, Zielbytes,
Gesamtsumme und erfolgreiche Senke einzeln ausgeben und prüfen.

## R2-02 – Revocation als dominierte Safetygrenze

Revocation wird aus der allgemeinen Target-max-Erfolgsregel ausgenommen und
erhält genau diese vierteilige, engere Disposition:

1. Größter erfolgreicher Revocation-Produktfall ist Raw/Safety exakt `65536`
   Bytes mit vollständig gebundenem Descriptor, Release, Transporthash und
   Rootpin sowie erfolgreichem Save, Activate und exaktem Safetyreadback.
2. `65537` gelangt mit denselben vollständigen Bindungen bis `nextSafety()`,
   liefert gemäß R5-R1 `protected` und erhält alle Stores byte-/
   strukturidentisch.
3. Die allgemeine isolierte Dokumentrawgrenze `524288` Equal / `524289`
   Ablehnung bleibt ein Validatorbeleg, kein erfolgreicher Storefall.
4. Der Test berechnet die tatsächliche Summe der fünf kleinsten gültigen
   Nicht-Revocation-Peers und bindet literal:
   `524288 - sum(minimale Peerbytes) > 65536`. Deshalb dominiert der
   Safetycap jeden Revocation-Target-max-Restanteil. Ein separater
   `totalJson = 524288`-Erfolgsfall weist sein Padding ausschließlich einer
   Nicht-Revocation-Klasse zu.

Kein Test darf Revocation über `65536` erfolgreich aktivieren, den
Safetyguard mocken oder eine Fixture beziehungsweise den Store ändern.

## Weitergeltende Abschlussgrenzen

- Produktionspin und 2838-Byte-Ready-Fall bleiben unverändert;
  Release-524288/524289 prüfen Hashguard beziehungsweise Bodycap.
- Der `totalJson`-`+1`-Fall bindet Descriptor, Release, Transporthash und
  Rootpin neu und erreicht ausschließlich die Gesamtsenke.
- Der Revisionstest bindet intern alle Revision-2-Dokumente/Descriptoren/
  Hashes/Pin korrekt und lässt nur Outer Revision 1 falsch.
- Fetch- und Body-Stream-Reject liefern `network-error`; Contentfehler bleiben
  `invalid`; keine Logs oder Telemetrie.
- Writer-/Chief-Matrix, Nullwrite-/LKG-Orakel, Schutz-Hashes, Folgegates und
  fünfpfadige Allowlist aus R5/R5-R1 gelten wortwörtlich weiter.

## Gate

Genau ein frischer unabhängiger Sol/high-R2-Abschlussrecheck prüft R5, R5-R1
und diesen Nachtrag als gemeinsame feste Vertragskette. Nur null High-/
Medium-/Low-/Coverage-/Privacy-/deferred Findings aktivieren den Writer. Der
Reviewer schreibt ausschließlich eigene Evidence/Handoff, ohne Git-Index.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R5-R2-FINAL-CONTRACT`
- Status: gebunden; frischer Sol-R2-Abschlussrecheck erforderlich
- Geschlossen im Vertrag: `P2-R5-R1-M-001`
- Writer-Allowlist: unverändert fünf Pfade, noch gesperrt
- P3/OUT/extern: gesperrt
- END-CHECK: :)
