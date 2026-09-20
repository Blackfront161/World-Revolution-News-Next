# WRN-G3-021 P2-R4-R3 – sequenzielle Writerfortsetzung

## Gate und Zweck

Der R4-R2-Writer hat den uncommitteten WIP innerhalb der gebundenen
Zehn-Pfad-Allowlist wesentlich erweitert, ist aber bei der Konstruktion des
Previous-Rollback-Falls nach mehreren engen Fortsetzungsturns kontextuell
beendet. Alle Schreibrechte dieser Instanz sind frei. Dieser Vertrag erlaubt
genau einem frischen `backend_data_reliability_engineer` mit Terra/high die
sequenzielle Uebernahme des erhaltenen WIP. Er erteilt keine neuen Produkt-,
Pfad-, Agenten- oder Releasebefugnisse.

Basis ist der Chief-Vertragscommit
`9d8e1a4b0fe5b2a4a050d1a4efff027e310d8cf5` plus der ausschliesslich in den
erlaubten Pfaden liegende unstaged WIP. Der Ersatzwriter hat keine Kinder,
keinen Git-Indexzugriff bis zur vollstaendigen Matrix und keinen
Parallelwriter.

## Unveraenderte Allowlist

1. `packages/content-contracts/src/mobile-media-v1.ts`
2. `packages/content-contracts/tests/mobile-media-v1.test.ts`
3. `apps/mobile/src/mobile-media-release.ts`
4. `apps/mobile/src/mobile-media-release.test.ts`
5. `apps/mobile/src/mobile-media-catalog-store.ts`
6. `apps/mobile/src/mobile-media-catalog-store.test.ts`
7. `tests/e2e/g3-021-media-catalog-store-harness.ts`
8. `tests/e2e/g3-021-media-catalog-store.spec.ts`
9. `docs/evidence/WRN-G3-021/P2-R4-READBACK-CONTROL-MATRIX-CORRECTION.md`
10. `docs/handoffs/WRN-G3-021-p2-r4-readback-control-matrix-correction.md`

Fixture-, Asset-, Package-, Dependency-, P3-, UI-, Player-, Website-, Live-
und externe Pfade bleiben OUT. Fremde oder untracked Dateien bleiben
unangetastet.

## Belastbar abgeschlossener WIP

- R4-R2-01: Rotationsreadback mappt post-write `state()`-Fehler auf
  `storage-failure`; pre-state-Korruption bleibt `protected`.
- R4-R2-02: Der exportierte Admission-Dokumentvalidator erzwingt
  Source-Freshness gegen sein eigenes `generatedAt`.
- R4-R2-03: reale Loader-/Storegrenzen, sechs Dokumentklassen, Safetyraw,
  Recordcounts und erreichbare gekoppelte Asset-/Geometrie-Maxima sind
  abgedeckt; mathematisch gekoppelte `+1`-Grenzen besitzen explizite
  Redundanzinvarianten.
- R4-R2-04-A: alle zwoelf
  `source|series|episode|asset x blocked|gone|replaced`-Kombinationen sind
  echte Chrome-/IndexedDB-Faelle. Gleicher Assethash blockiert, anderer
  kanonischer Hash aktiviert, fehlender und `null`-Hash sind
  `invalid-candidate`; alle Negativfaelle besitzen vollstaendige
  Nullwrite-/LKG-Orakel.
- R4-R2-06: Status 200 mit `Content-Range`, 206 und ungueltige/fehlende MIME
  sind `invalid`; Transport, Timeout und Abort bleiben getrennt.

Der letzte fokussierte Stand bestaetigte den Mobile-Typecheck und den
R4-R2-04-A-Chrome-/IndexedDB-Test GREEN. Das ist kein Gesamt-GREEN und keine
Commitfreigabe.

## Verbleibende Pflichtarbeit

1. **Previous-Rollback:** Revision 2 entfernt das bisherige Transcript-Asset
   aus Manifest, Episode und Rights, fuehrt dessen alte ID und gebundenen Hash
   aber als monotones `asset/blocked`-Safetyentry samt exakter Reference-Union.
   Revision 2 aktiviert erfolgreich. Der folgende Rollback auf die als
   Previous gespeicherte Revision 1 trifft die blockierte alte aktuelle ID,
   liefert `protected` und laesst den vollstaendigen Pre-Rollback-Zustand
   byte-/strukturidentisch.
2. **Higher/additive-current-ids-only:** neue aktuelle Episode- und Asset-IDs
   mit exakt neuen References, aber ohne neue Entries, aktivieren erfolgreich.
3. **R4-R2-05:** echte Future-/Exact-key-/Typ-/Negativmatrix fuer Bundle,
   Control und Safety; je sechs Dokumentklassen getrennte Bytes-, Hash-,
   Schema- und Revisionsmismatches; getrennte Transporthash-, aeussere/raw
   Revision- und Full-rootpinfaelle; Rotationsfaults Quota, Abort und Readback
   an Safety-, Active- und Previous-Senken.
4. Evidence/Handoff muessen die tatsaechlich ausgefuehrte Gesamtmatrix ehrlich
   wiedergeben. Ein Produktcommit darf keinen erfundenen Selbst-SHA behaupten;
   die finale SHA-Bindung erfolgt in einem separaten Chief-Metadatencommit.

## Commit- und Stopregel

Vor vollstaendig gruener Pflichtmatrix gibt es weder Stage noch Commit. Bei
neuem Produktfinding, Pfadbedarf, Dependency-/Fixture-/Assetbedarf oder nicht
deterministisch reproduzierbarem Fehler stoppt der Writer fail-closed. Erst
nach beiden Typechecks, scoped Format/Lint, fokussierter Vitestmatrix, echter
Chrome-/IndexedDB-Matrix, 19 Boundarytests, Fixture-/Releasechecks,
`git diff --check` und Allowlistpruefung darf genau ein Ergebniscommit
entstehen.

Danach reproduziert der Chief unabhaengig. Erst ein gesicherter
Produktkandidat und Chief-Metadatenstand erlauben frische Terra-QA und einen
defensiven Sol-Integrity-/Privacy-Deltarecheck parallel. Ein finaler frischer
Sol-Architekturabschluss bleibt Pflicht. P3 und alle OUT-/externen Bereiche
bleiben bis dahin gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R4-R3-WRITER-CONTINUATION`
- Status: gebunden; frischer sequenzieller Ersatzwriter darf nach eigenem
  Chief-Commit starten
- Basis: `9d8e1a4b0fe5b2a4a050d1a4efff027e310d8cf5` plus erlaubter unstaged WIP
- Offen: Previous-Rollback, Higher/additive, R4-R2-05, Gesamtmatrix
- END-CHECK: :)
