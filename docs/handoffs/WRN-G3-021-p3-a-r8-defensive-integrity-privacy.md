# WRN-G3-021 P3-A-R8 – Defensive Integrity-/Privacy-Handoff

Status: **RED – ZWEI MEDIUMS, P4-B BLEIBT GESPERRT**

## Basis

- Governance: `f8f99d4`.
- Produktkandidat:
  `c2265afd8cb4c8391f6a34d8f9b97533cba3e8d9`.
- Gate: `dcb19c5`.
- Vollbeleg:
  `docs/evidence/WRN-G3-021/P3-A-R8-DEFENSIVE-INTEGRITY-PRIVACY.md`.
- Formaler Securityscan: `c4b6e077-26a0-436c-9290-8c4c01df1574`.

## Ergebnis

High 0, Medium 2, Low 0, Product/Integrity 1, Assurance/Coverage 1,
Privacy 0, formell security-reportable 0, deferred 0.

### `P3-A-R8-DIP-M-001` – Product Medium

Ein später Storagefehler an einem Player-Recheck wird reproduzierbar als

```text
playback=error, availability=local, error=storage-failure
```

veröffentlicht. `terminal()` in
`apps/mobile/src/mobile-media-player.ts:174-180` setzt die Fehlerklasse, aber
nicht Availability; die Storage-Recheckpfade, unter anderem `287-290`, nutzen
genau diesen Helper. R8-01 verlangt Availability und Fehler beide
`storage-failure`. Medien, `src` und Object URL werden fail-closed abgeräumt;
daher null Privacyfinding und mangels Angreifer-/UI-Pfad kein formell
security-reportable Finding. Der Produktvertrag bleibt trotzdem verletzt.

### `P3-A-R8-DIP-A-M-001` – Assurance Medium

Die 6×7-Unit-/Browsermatrix ist nicht vollständig senkentreu und entspricht
inhaltlich `P3-A-R8-QA-M-001`:

- Unit-`save` ist nicht pending;
- Unit-`deleteIfExact` verliert keinen Epoch und erwartet entgegen Vertrag
  einen Delete;
- Unit-`late-result` ist kein spätes Resolve/Reject;
- Browser verwendet echte IndexedDB und hält Save/Late-save pending, aber
  Delete-Resultate werden nicht verzögert/rejected;
- Browserorakel `tests/e2e/g3-021-media-hub-lifecycle.spec.ts:1278-1286`
  prüfen die erforderlichen Zellsenken und Nachzustände nicht literal;
- Missing-/Generation-/Record-No-op sowie Run-B-/Unmount-Resolve/Reject sind
  nicht vollständig belegt.

## Geschlossen

- aktuelle Pause-Save-/Resume-Seek-Storagefehler im Hub;
- originäre Hub-Epoch-/Mountguards an den geprüften Asyncgrenzen;
- kein normales Delete nach Epochverlust;
- einmalige generation-/recordexakte, stets sinklose Late-save-Kompensation;
- kein `hub.player.unmount`;
- CAS-/Caps-/Raw-/IDB-Integrität des unveränderten Resume-Stores;
- keine neue Datenabgabe, keine Privacy- oder Datenverlustfindings.

## Reproduktion

- Node `v24.19.0` gezielter Storage-Recheck: Fehler reproduziert.
- Hub-/Player-/Resume-Store-Vitest: 3 Dateien, 134/134 PASS.
- Browsermatrix wurde quellseitig vollständig geprüft. Ihr echter IDB-Einsatz
  ist bestätigt; ein grüner Lauf beweist wegen der schwachen Orakel nicht die
  gebundene Semantik.

## Nächster zulässiger Schritt

Chief bindet eine enge Korrektur für:

1. atomare Player-Availability `storage-failure` an allen späteren
   Storage-Rechecks;
2. eine echte senkengesteuerte 6×7-Unit-/Chromium-IDB-Matrix mit vollständigen
   Zellorakeln, dreifachem No-op und späten Resolve-/Rejectpfaden;
3. wahrheitsgemäße Evidence-/Handoffaktualisierung.

Vor frischem unabhängigem Precheck-GREEN gibt es keinen Produkt- oder
Testwrite. P4-B, UI, Website, reale Quellen/Medien, Provider und externe
Gates bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R8-DEFENSIVE-INTEGRITY-PRIVACY`
- Status: RED
- Findings: `P3-A-R8-DIP-M-001`, `P3-A-R8-DIP-A-M-001`
- Privacy/deferred: 0/0
- Schreibrechte: ausschließlich diese zwei Belege, abgeschlossen
- END-CHECK: :)
