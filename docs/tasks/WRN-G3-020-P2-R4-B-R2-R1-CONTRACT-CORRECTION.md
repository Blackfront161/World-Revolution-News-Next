# WRN-G3-020 P2-R4-B-R2-R1 – Vertragskorrektur

Status: **GEBUNDEN; TESTWRITE BIS ZU FRISCHEM SOL-R1-RECHECK-GREEN GESPERRT**

## Anlass

Der unabhaengige Precheck `9cb8e6d` widerlegt genau eine Medium-Annahme des
Designs `6af249f`: `validSafetyShape` verlangt Coverage von Entries zu
References, erlaubt aber historische, eindeutige Reference-Supersets. Deshalb
sind 1023 und 1024 References nicht durch 65536 Bytes dominiert. Ein gueltiger
minimaler Shape liegt reproduzierbar bei 43082 beziehungsweise 43124 Bytes;
1025 liegt bei 43166 Bytes, verletzt aber das 1024-Referencecap.

Das ist ein Testvertragsfehler, kein Produktfinding. Kein Produkt-, Test- oder
Fixturewrite ist daraus erlaubt.

## R1-01 – echte Referencegrenzen

Der R2-Writer muss einen schema-, sortier-, hash- und coveragegueltigen
historischen Safetyrecord mit eindeutigen Reference-Supersets konstruieren.
Auf dem echten finalen Chrome-/IndexedDB-Mergepfad gelten:

- 1023 finale References: Activate erfolgreich, genau ein Safety-`put`,
  Generation +1, Readback und Restart bytegleich;
- 1024 finale References: identischer positiver Grenzbeleg;
- 1025 finale References: `protected` vor erstem Safety-`put`, Safety,
  Control, Slots, Generation und Restart bytegleich zum Vorzustand.

Der Builder assertiert vor DB-Setup Eindeutigkeit, ASCII-Sortierung, exakte
Counts, Recordbytes kleiner/gleich 65536 fuer die zwei Positivfaelle, Hash und
Entry-to-Referencecoverage. 1025 isoliert das Referencecap und darf nicht
durch Entry- oder Bytecap vorentschieden werden.

Die getrennte Entry-/Bytematrix 511@65535, 512@65536, 513<65536 und
512@65537 bleibt unveraendert bindend.

## R1-02 – ehrliche Quota-Bezeichnung

`QuotaExceededError` wird deterministisch an der browserseitigen IDB-API-
Grenze injiziert. Evidence/Handoff bezeichnen dies nicht als nativen
physischen Speichermangel oder gemessene Geraetequota. Fehlercode,
Nullmutation beziehungsweise allein zulaessiger bereits committeter strengerer
Safetyzustand, Restart und kein Retry bleiben unveraendert Pflicht.

## Scope und Gate

Allowlist, Stopregeln, Mehrrelease-/Rollback-/Failurematrix, Testlaeufe und
externe Sperren bleiben exakt aus
`docs/tasks/WRN-G3-020-P2-R4-B-R2-REST-MATRIX.md`. Vor dem Writer muss ein
frischer unabhaengiger Sol-R1-Recheck beide Precheckfindings mit null neuen
Findings schliessen.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R4-B-R2-R1-CONTRACT-CORRECTION
- Status: gebunden; Testwrite gesperrt
- Basis: Design `6af249f`; RED-Precheck `9cb8e6d`
- Findings: `P2-R4-B-R2-PRE-M-001` und `P2-R4-B-R2-PRE-L-001`
- Rechte: beim Chief; kein Testwriter aktiviert
- Naechster Schritt: frischer unabhaengiger Sol-R1-Recheck
- END-CHECK: :)
