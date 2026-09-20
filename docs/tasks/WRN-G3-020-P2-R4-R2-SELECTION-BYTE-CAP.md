# WRN-G3-020 P2-R4-R2 – Selection-Bytecap-Korrektur

Status: **GEBUNDEN; PRODUKTWRITE BIS ZU FRISCHEM SOL-PRECHECK-GREEN GESPERRT**

## Anlass und reproduzierte Ursache

Der echte R4-B-Chrome-/IndexedDB-Pflichttest hat auf Basis `78bdf8c` einen
Produktfehler reproduziert: `save()` speichert einen ansonsten gueltigen
Selectionrecord mit mehr als 4096 UTF-8-Bytes. `validRecord()` schuetzt zwar
spaetere Reads, der neu erzeugte `next`-Record wird vor `put()` jedoch nicht
gegen dieselbe serialisierte Bytegrenze validiert. R4-B stoppte regelkonform;
Evidence/Handoff liegen in `fd6da12`. Es blieb keine temporaere Test- oder
Produktmutation zurueck.

## Verbindliche Korrektur

1. `save()` erzeugt den kanonischen `next`-Record erst nach erfolgreicher
   Generation-CAS-Pruefung.
2. Vor dem ersten `put()` muss der exakt zu persistierende Record mit derselben
   4096-UTF-8-Byte-Regel wie `validRecord()` geprueft werden.
3. Ein Record mit 4095 oder 4096 Bytes darf den normalen Save-/Readback-/
   Restartpfad durchlaufen; 4097 Bytes endet deterministisch mit
   `RegionalEventsSelectionError('storage-failure')`.
4. Die 4097-Ablehnung veraendert den bestehenden Record und seine Generation
   nicht, hinterlaesst keinen Teilwrite, versucht keinen Retry und bleibt nach
   Close/Reopen bytegleich.
5. `invalid-region`, `conflict`, geschuetzte Alt-/Future-/Fremdrecords,
   `clear()`, Datenbankisolation und bestehende Selection-CAS-Semantik bleiben
   unveraendert.
6. Die Grenze gilt fuer die UTF-8-Bytes des kanonisch serialisierten gesamten
   `next`-Records, nicht nur fuer `regionId.length` oder UTF-16-Codeunits.

## Exakte Allowlist

Erst nach frischem Sol-Precheck-GREEN darf genau ein
`backend_data_reliability_engineer` Terra/high ohne Kinder schreiben:

1. `apps/mobile/src/mobile-regional-events-selection.ts`
2. `tests/e2e/g3-020-regional-events-store-harness.ts`
3. `tests/e2e/g3-020-regional-events-store.spec.ts`
4. `docs/evidence/WRN-G3-020/P2-R4-R2-SELECTION-BYTE-CAP.md`
5. `docs/handoffs/WRN-G3-020-p2-r4-r2-selection-byte-cap.md`

Contract-/Loadertests, Storeprodukt/-units, Selectionunit, Fixture/Pin,
Packageindex, UI, Config/Lock, Dependencies, Website, Provider und externe
Gates bleiben OUT. Ein Produkt-Testhook, Export, Flag oder Zusatzpfad fuehrt
zum Stop.

## Pflichtbelege

- echte isolierte Chrome-/IndexedDB-Faelle fuer exakt 4095, 4096 und 4097
  UTF-8-Bytes des gesamten Records;
- 4097 mit bestehendem Record: Fehlercode, null Mutation, bytegleicher
  Restartzustand und unveraenderte Generation;
- mindestens ein Mehrbyte-Zeichenfall, der UTF-8 statt Stringlaenge belegt;
- bestehende sechs G3-020-Browserfaelle bleiben GREEN;
- fokussierte und volle Contract-/Mobiletests, beide Typechecks;
- zehnpfadiger ESLint/Prettier, 19 Boundaries, Releaseboundary,
  Fixtureprovenienz, acht Hashgrenzen und Diffcheck;
- Produktcommit enthaelt nur Source/Harness/Spec, Dokumentcommit nur
  Evidence/Handoff.

## Gatefolge

1. Frischer unabhaengiger Sol-Precheck prueft Fehlerursache, Semantik,
   Testbarkeit und Allowlist.
2. Nur bei null Findings genau ein Terra/high-Writer.
3. Chief reproduziert Scope und Matrix.
4. Frische unabhaengige Terra-QA und versiegelter Sol-Security-/Privacy-
   Deltacheck muessen GREEN sein.
5. Danach wird R4-B auf dem korrigierten Kandidaten neu aktiviert; R4-A darf
   unabhaengig beendet und seriell integriert werden.
6. P2, P3, G3-021 sowie Website/Live/Android/AAB/Play/Release bleiben ohne
   spaetere Abschlussgates gesperrt.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R4-R2-SELECTION-BYTE-CAP
- Status: Vertrag gebunden; Produktwrite bis Sol-Precheck-GREEN gesperrt
- Basis: R4-A/B-Aktivierung `78bdf8c`; RED-Evidence `fd6da12`
- Finding: `P2-R4-R2-M-001` – Selection-Nextrecord-Bytecap vor `put()` fehlt
- Rechte: beim Chief; kein Korrekturwriter aktiviert
- Naechster Schritt: frischer unabhaengiger Sol-Precheck
- END-CHECK: :)
