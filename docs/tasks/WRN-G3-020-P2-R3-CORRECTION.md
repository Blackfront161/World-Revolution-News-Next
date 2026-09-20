# WRN-G3-020 P2-R3 – finale Safety- und Evidenzkorrektur

Status: **GEBUNDEN; PRODUKTWRITE BIS ZU FRISCHEM SOL-PRECHECK-GREEN GESPERRT**

## Ziel und bindende Quellen

Dieses Paket schliesst ausschliesslich die nach dem Kandidaten `906ddc4`
offenen Punkte:

- Terra-QA `08b2cba`: `M-001` ungueltige Replacementreferenz und `M-002`
  unvollstaendige R1-05-/R2-Pflichtmatrix;
- versiegelter Sol-Scan `872b4cf5-2ef7-467b-bfdf-9fabdcb4ff8a`, Commit
  `b799679`: `P2-R1-S-L-001` finaler Safety-Merge ohne Vorabcap;
- Sol-Korrekturdesign `0108fc3`.

Das vollstaendige bevorzugte Design in
`docs/evidence/WRN-G3-020/P2-R3-CORRECTION-DESIGN.md` ist normativ und wird
ohne semantische Option oder Abschwaechung uebernommen. P2, P2-R1 und
P2-R2 gelten weiter; bei Abweichung hat dieses Paket Vorrang. Der
R1-Kandidat ist keine P2-Freigabe. P3 und externe Gates bleiben gesperrt.

## R3-01 – finales SafetyRecord-v1

DB-Name `wrn-mobile-regional-events-v1`, Version `1`, Stores und Keypaths
bleiben unveraendert. Es gibt keine Migration, Bereinigung, neue Dependency
oder vierten Store.

`SafetyReference` besitzt exakt und in dieser Reihenfolge:

1. `namespace: 'continent|country|region|event|source'`;
2. `id`: C-01-ID mit passendem Namespacepraefix, hoechstens 128 UTF-8-Bytes.

`SafetyRecord` besitzt exakt und in dieser Reihenfolge:

1. `storeSchema: 1`;
2. `key: 'safety'`;
3. `revision`: sichere Ganzzahl `>= 0`;
4. `sha256`: 64 lower-case Hexzeichen;
5. `entries: Revocation[]`;
6. `references: SafetyReference[]`.

Default: Revision `0`, leere Entries/References und korrekter Hash. Ein alter
Record ohne `references`, unbekannte Keys, Future-Record/DB, ungueltige Form,
Sortierung, Referenz oder Hash ergeben `protected` mit null Write, Upgrade,
Delete oder stiller Normalisierung.

Entries sind nach dem bestehenden R2-Tupel sortiert und eindeutig. References
sind nach `(namespace,id)` als ASCII-Codepoints sortiert und eindeutig.
Hashpraeimage ist exakt
`UTF8(JSON.stringify({revision,entries,references}))` mit neu konstruierten
Plain Objects in Schemareihenfolge. `storeSchema`, `key` und `sha256` sind
nicht Teil der Praeimage.

Gleichzeitig gelten fuer den **finalen** Record:

- hoechstens 512 Entries;
- hoechstens 1.024 References;
- hoechstens 65.536 UTF-8-Bytes fuer `JSON.stringify(exakter SafetyRecord)`.

Der vollstaendige Merge wird vor dem ersten `put` validiert. Bei Ueberschreitung
bleiben Safety, Control, Slots und Generation bytegleich. Keine Eviction,
Altersloeschung, LRU oder Verdichtung ist erlaubt.

## R3-02 – monotone Referenzprovenienz

References sind niemals Callereingang. Sie werden nur aus dem erneut
vollstaendig validierten gespeicherten Sourcebundle der konkreten Activate-
oder Rollbackoperation abgeleitet. Rawbytes/Transporthash, Bundle- und
Taxonomierevision muessen Record und Pointer entsprechen.

Fuer jede Revocation muessen Original und bei `replaced` das Replacementziel
im passenden Namespace des Sourcebundles existieren. Replacement besitzt
denselben Namespace, korrektes Praefix und ist ungleich Original. Missing,
falscher Namespace oder falscher Prefix ergibt `protected`, null Mutation.

Entries werden nach R2 vereinigt. References bilden eine reine monotone
Union; bestehende Keys werden nie entfernt oder ueberschrieben. Jeder finale
Entry braucht Originalreference und bei `replaced` Replacementreference.
References duerfen historischer Superset bleiben. Snapshot validiert exakt
Schema, Hash, Sortierung, Eindeutigkeit, Entry-Referencecoverage und Caps.
Wenn ein Payloadanker noch in den drei Slots liegt, muss dessen Identitaet
passen; nach planmaessiger Rotation bleibt der atomar aufgenommene,
hashgebundene Referencekey die lokale historische Evidenz. Die Union nur aus
`active|candidate|previous` ist ausdruecklich unzureichend.

## R3-03 – Revision, Persist-before und Generation

Jede Entscheidung liest Control, Safety und Slots in der Transaktion erneut.
Ein vorheriger Snapshot ist kein CAS-Orakel.

- Activate: niedrigere Safetyrevision `protected`; gleiche nur bei
  bytegleichen Entries und vollstaendig vorhandenen References; hoehere wird
  monoton vereinigt.
- Rollback: niedrigere Source-Safetyrevision darf das Ledger nie senken und
  ist nur bei vollstaendiger blockierender Entry-/Referencecoverage erlaubt;
  gleiche verlangt identischen Ledger; hoehere darf monoton mergen.
- Safety persist-before schreibt in eigener Transaktion Safety und
  `control.safetyRevision`, liest beide bytegleich zurueck und committed vor
  Rotation. Es aendert keinen Slot und **nicht** `control.generation`.
- Eine spaeter scheiternde Rotation darf den bereits strengeren Safetyzustand
  behalten; Slots bleiben alt, es gibt keinen Auto-Retry.

Oeffentliche Generation:

- mutierendes `saveCandidate`, erfolgreiches `activate` und erfolgreiches
  `rollback`: jeweils insgesamt exakt `+1`;
- Snapshot, Read, No-change, Reject, Conflict und interne Safetytransaktion:
  `+0`;
- Selection bleibt nach R2 getrennt.

Zwischen Safetycommit und Rotation gewinnt hoechstens eine Operation. Die
Rotation prueft Generation, Sourcepointer, Safetyhash/-revision und Slots
erneut. Abweichung ist Conflict ohne Rotation oder Retry.

## R3-04 – atomare Rotation und Resurrection

Activate setzt Candidate als Active, loescht Candidate und altes Previous,
und setzt altes Active oder null als Previous. Rollback setzt Previous als
Active, altes Active als Previous und loescht Candidate. Vor Commit werden
alle drei Stores, Pointer/Records, Raw-/Transporthashes, Revisionen,
Safetyrecord/-references/-caps und `generation === expected + 1` gelesen.
Jede Abweichung abortiert.

A1/B2/A3 verlangt strikt steigende Bundlerevision. Wildcard blockiert jede
Version; Hashentry nur die bytegleiche Version. Ledger und References
ueberleben mehr als drei weitere Releases, Restart und Rollback. Content-
oder Selection-Clear, G3-017 und Website oeffnen oder loeschen EventSafety
nicht. Zwei Tabs mit gleicher Generation liefern hoechstens einen Erfolg;
der Verlierer endet Conflict.

## R3-05 – verpflichtende Testmatrix

Jede Position braucht eine explizite Assertion; Sammelnamen oder reine
Quellinspection reichen nicht:

1. QA-M-001-Repro nun `protected`; alter Record ohne References; Missing,
   falscher Namespace/Prefix; legitime alte Replacementreference nach
   mindestens vier Releases.
2. Safety 511/512/513, References 1023/1024/1025 und finaler Record
   65535/65536/65537 Bytes. Mathematisch von einem strengeren Cap dominierte
   Faelle werden durch eine explizite Groesseninvariante belegt. Echter
   Storepfad: Cap vor `put`, Reject und bytegleicher Restartzustand.
3. Safetyrevision kleiner, gleich-identisch, gleich-konflikt, hoeher fuer
   Activate; Rollback-lower nur bei voller Coverage.
4. Persist-before und Rotation jeweils mit Write-/Readback-/Abort-/Quota-
   Fehler: keine unsichere Rotation; Slots bytegleich; Safety darf nur
   strenger bleiben.
5. Generation fuer Candidate, Activate mit Safetymerge, B2, A3, Rollback,
   No-change/Reject und echte Zwei-Tab-CAS exakt.
6. Vollstaendige Activate-/Rollback-Slottabelle, Restart, A1/B2/A3, mehr als
   drei weitere Releases, Wildcard/Hash, Rollback und Resurrection.
7. Future-DB, Future-Record jedes Stores, alter Safetyrecord, Extra-/Missing-
   Store, unbekannter Key, corrupt Bundle/Control/Safety und Foreign-Sentinel;
   keine Produktbereinigung.
8. Gesamte bestehende R1-05/R2-Matrix: sieben Hashpraeimages, Pin/BOM/fatal
   UTF-8/no-request/Loadercaps; Exact-keys/IDs/Parents/Locales/Alias/Successor;
   UTC/IANA/Gap/Fold/Offset; Freshnesskombinationen; 0/1/4/5/6; Eventreplay;
   Count/Text/URL/Media/Dimension; Rechte/Plaintext/no Remote/Geo/Tracking/
   Logs; Selection Save/Clear/Restart/Future/Abort/Quota/Readback/2-Tab-CAS.
9. Fokussierte und volle Contract-/Mobiletests, beide Typechecks,
   zehnpfadiger ESLint, Prettier, echte G3-020-Playwright-IDB ohne stille
   Skips, 19 Boundaries, Releaseboundary, Fixtureprovenienz, sieben
   Boundaryhashes und Diffcheck.

## Exakte Writer-Allowlist

Erst nach frischem Sol-Precheck-GREEN darf genau ein
`backend_data_reliability_engineer` Terra/high ohne Kinder schreiben:

1. `packages/content-contracts/src/mobile-regional-events-v1.ts`
2. `packages/content-contracts/tests/mobile-regional-events-v1.test.ts`
3. `apps/mobile/src/mobile-regional-events.ts`
4. `apps/mobile/src/mobile-regional-events.test.ts`
5. `apps/mobile/src/mobile-regional-events-store.ts`
6. `apps/mobile/src/mobile-regional-events-store.test.ts`
7. `apps/mobile/src/mobile-regional-events-selection.ts`
8. `apps/mobile/src/mobile-regional-events-selection.test.ts`
9. `tests/e2e/g3-020-regional-events-store-harness.ts`
10. `tests/e2e/g3-020-regional-events-store.spec.ts`
11. eigene neue P2-R3-Writer-Evidence
12. eigenes neues P2-R3-Writer-Handoff

Fixture/Pin, Packageindex/-export, UI/CSS, Delegationsregister/Governance,
G3-017, Reader, Content-v1, Website, Config/Lock, Dependencies, Provider und
externe Gates bleiben OUT. Zusatzpfad, Fixturemutation, vierter Store, neue
Dependency oder nicht reproduzierbare Capgrenze = Stop an Chief.

## Gatefolge

1. Frischer unabhaengiger Sol-Precheck dieses Pakets.
2. Nur bei null Findings genau ein Terra/high-Writer.
3. Chief reproduziert Scope, Hashes und komplette Node-24.19-/IDB-Matrix.
4. Frische Terra-QA schliesst `M-001/M-002`.
5. Versiegelter Sol-Deltacheck schliesst `P2-R1-S-L-001` mit null
   reportable/deferred Findings.
6. Finaler unabhaengiger Sol-P2-Architekturabschluss mit null Findings.
7. P3 startet erst danach separat; kein automatischer Live-/Releaseauftrag.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R3-CORRECTION
- Status: Vertrag gebunden; Produktwrite bis Sol-Precheck-GREEN gesperrt
- Basis/Kandidat: `cc800a2` / `906ddc4`
- Reviews: QA `08b2cba`; Security `b799679`; Design `0108fc3`
- Offen: Precheck, Writer, Chief-Matrix, QA, Security und P2-Abschluss
- Rechte: alle Produkt-/Testrechte beim Chief; noch kein Writer aktiviert
- Naechster Schritt: frischer Sol-Precheck
- END-CHECK: :)
