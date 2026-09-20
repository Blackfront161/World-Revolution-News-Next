# WRN-G3-021 P2-R3 – kanonische Transitionen und Reviewbasis

Status: **REIN DOKUMENTARISCH – P2 BIS ABSCHLUSSRECHECK-GREEN GESPERRT**

Dieser Nachtrag schliesst ausschliesslich `P1-R2-M-001` und
`P1-R2-L-001` aus dem Belegcommit `7efd5c5`. P2, R1 und R2 bleiben ansonsten
unveraendert; bei Widerspruch hat dieses Dokument Vorrang.

## R3-01 – vollstaendige kanonische Transitionarrays

`playbackTransitions` ist exakt dieses JSON-Array in dieser Reihenfolge und
mit den bereits gebundenen Exact-keys `from,event,to`:

```json
[
  {"from":"idle","event":"user-play","to":"loading"},
  {"from":"loading","event":"decoder-ready","to":"playing"},
  {"from":"loading","event":"failure","to":"error"},
  {"from":"playing","event":"user-pause","to":"paused"},
  {"from":"paused","event":"user-play","to":"playing"},
  {"from":"playing","event":"media-ended","to":"ended"},
  {"from":"ended","event":"user-play","to":"loading"},
  {"from":"error","event":"user-reset","to":"idle"}
]
```

`availabilityTransitions` ist exakt dieses JSON-Array in dieser Reihenfolge:

```json
[
  {"from":"online","event":"network-lost","to":"offline"},
  {"from":"offline","event":"network-restored","to":"online"},
  {"from":"online","event":"freshness-expired","to":"stale"},
  {"from":"offline","event":"freshness-expired","to":"stale"},
  {"from":"local","event":"freshness-expired","to":"stale"},
  {"from":"local","event":"safety-block","to":"blocked"},
  {"from":"online","event":"safety-block","to":"blocked"},
  {"from":"offline","event":"safety-block","to":"blocked"},
  {"from":"stale","event":"safety-block","to":"blocked"}
]
```

Keine weitere Transition ist erlaubt. Der Validator vergleicht Laenge,
Position und jedes Literal; er sortiert, ergaenzt oder dedupliziert nicht.
Der bereits gebundene Duplikatschluessel bleibt zusaetzliche Invariante.
`blocked` ist terminal; `stale` wird nur durch das monotone `safety-block`
noch zu `blocked`. Dominanz-, Expiry-, Run-/Abort-/Timer- und Resume-Regeln
aus R2 bleiben unveraendert.

## R3-02 – korrigierte Basisbindung

- R2-Vertragscommit:
  `ff12e6fe791e32c30d6d78d5f8ee99fb41017f9e`.
- dazugehoeriger fester Gate-/Reviewbasiscommit:
  `60715eac758af39b631a23d688ba7bf329e9bfd2`.
- P1-R2-Belegcommit: `7efd5c5`.

Die fruehere Formulierung, P1-R2 laufe direkt auf `ff12e6f`, ist verworfen.
Der Review wurde tatsaechlich auf `60715ea` ausgefuehrt. Nach Sicherung dieses
R3 bindet der Chief erneut den tatsaechlichen vollen R3-Vertragscommit in
einem separaten Reviewbasiscommit. Nur dieser nachfolgende HEAD darf der
frische Abschlussrecheck verwenden.

## R3-03 – Abschlussgate

Ein frischer unabhaengiger Sol-Abschlussrecheck prueft wortwoertlich beide
Arrays, deren Transportdeterminismus und die korrigierte Basis-/Ancestrykette.
Er reproduziert Package- plus zehn Boundaryhashes und die drei
Fixturepraeimages. Vor null Findings und einem danach separaten Chief-
Writergatecommit bleibt P2 vollstaendig gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R3-TRANSITION-AND-BASIS-CORRECTION`
- Status: rein dokumentarisch; P2 gesperrt
- Adressiert: `P1-R2-M-001`, `P1-R2-L-001`
- Rechte: keine Produkt-/Test-/Fixture-/Asset-/Browserrechte
- Naechster Schritt: R3-Commitbindung, frischer Sol-Abschlussrecheck
- END-CHECK: :)
