# WRN-G3-014 – semantische Safety-Gleichheit

PO-071; Chief-Disposition zu S7-H-002. Erst nach gesicherter S7-Diagnose,
genau ein frischer `backend_data_reliability_engineer`, Terra/high, keine
Kinder. Alle anderen Produkt-Schreibrechte bleiben geschlossen.

## Enges Eigentum

- `packages/content-contracts/src/index.ts`: ausschliesslich
  `sameContentOfflineSafetyLedger` und unmittelbar benoetigte Mergegrenze.
- Zugehoerige Contract-Unitregressionen im vorhandenen Testfile.
- Neue externe `tests/e2e/content-offline-safety-equality.spec.ts` fuer
  Defaultloader mit bereits bekanntem Ledger; keine Controller-/Storefixes.
- `docs/evidence/WRN-G3-014/SAFETY-EQUALITY-CORRECTION.md` und
  `docs/handoffs/WRN-G3-014-safety-equality-correction.md`.

Die S7-Diagnose und deren Rohbelege bleiben unveraendert. Keine UI, Loader-,
Store-, Fixture-, Root-/Packageconfig-, Live- oder Dependency-Aenderung.

## Pflicht und Nachweis

S7-D09 ist der bereits reproduzierte rote Ausgang. Gleiche kanonische
Safetyfakten bleiben trotz anderer Objektfeldreihenfolge gleich. Ein
kanonischer Roundtrip darf keinen Konflikt erzeugen. Array-/ID-/Status-/
Kategorie-/Floorregeln werden nicht gelockert, fehlende bekannte Sperren
und echte Widersprueche bleiben abgewiesen. Kein Unrevoke-Pfad.

Zuerst direkte Contractregression mit rotem Beleg, danach kleinste Korrektur.
Beidseitige Defaultloader lesen geroutete echte A/B-Dokumente gegen bereits
bekannten A-Ledger; fertige injizierte `check`-Resultate sind kein Ersatz.
D09 und D03 der unveraenderten S7-Diagnose nachpruefen. Bei D02 separat
belegen, dass B jetzt staged und Pending abgeschlossen ist; dessen noch
fehlender voller aktiver Snapshot bleibt ausdruecklich Controllerauftrag.
Kein pauschales GREEN fuer den gesamten S7-Harness oder P2.

Gebundene Node-24.19-/pnpm-11.19-Toolchain, keine Installation. Direkter
Playwright-CLI, keine `pnpm run ... --`-Argumentweitergabe. Nur eigene Dateien
formatieren; bestehende unformatierte Controllerentwuerfe nicht anfassen.
Relevante Contracttests/Typecheck/Boundaries und neue reale Browserproben
ausfuehren, vorhandene fremde Fehler ehrlich getrennt nennen.

Hoestens zwei erfolglose Fixrunden desselben Befunds, danach Chief. Lokal nur
eigene Dateien committen; exakten Checkpoint/Handoff liefern, Agent beenden.
Danach erst separater kritischer Controllerabschluss, kein P3.

END-CHECK: :)
