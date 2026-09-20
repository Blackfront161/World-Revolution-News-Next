# WRN-G3-021 P2-R5-R1 – finaler Cap-/Safety-Vertragsnachtrag

## Zweck und feste Basis

Der unabhängige P2-R5-Precheck auf Basis
`393e69b69e10d1fbb9111eb9df459a1769eadd8f` bestätigt Revision,
Streamtyping, `totalJson` und die gekoppelte Sechs-Dokument-Disposition, bleibt
aber RED mit `P2-R5-PRE-M-001` und `P2-R5-PRE-M-002`. Dieser reine
Chief-Nachtrag schließt ausschließlich diese beiden Vertragswidersprüche.
Produktkandidat und fünfpfadige Writer-Allowlist bleiben unverändert.

Vor einem frischen unabhängigen Sol/high-R1-Recheck mit null Findings besteht
kein Produkt-, Test-, Fixture-, Browser- oder Assetwrite. P3 und alle OUT-/
externen Bereiche bleiben gesperrt.

## R1-01 – Releasecap ohne neue Vertrauenswurzel

Der buildgebundene C-03-Rootpin bleibt unverändert. Ein anderer oder
testinjizierter Releasepin, eine neue Fixture oder ein gemockter Erfolgs-Hash
sind verboten.

Die Release-Rawbytegrenze wird exakt so belegt:

1. Die unveränderte gepinnte Releasefixture mit 2838 Bytes bleibt der
   vollständige `loadMobileMediaRelease()`-`ready`-Positivfall.
2. Valides Release-JSON wird ausschließlich mit erlaubtem JSON-Whitespace auf
   exakt `524288` Bytes erweitert. Über den exportierten Loader muss es die
   echte Bodycap passieren, genau den realen Digest-/Hashguard erreichen und
   dort wegen des unveränderten Produktionspins `invalid` enden. Ein
   Digest-Aufruf- und Requestzählorakel belegt, dass weder Bodycap noch
   Folgedokumente das Ergebnis dominieren.
3. Dasselbe valide JSON bei `524289` Bytes endet an der Bodycap als `invalid`,
   bevor Digest, JSON-Admission oder Folgerequest aufgerufen werden.
4. Die vorhandene isolierte Rawbytegrenze Equal/`+1` bleibt als vierter Beleg
   erhalten.

Damit wird kein unmöglicher voller Equal-`ready`-Fall behauptet und die
Root-of-Trust nicht für Tests aufgeweicht. Diese Disposition ersetzt R5-01
Absatz 1 vollständig.

## R1-02 – Safetycap bleibt monotones `protected`

Ein hash-/descriptor-/release-/rootpin-korrekter Revocation-Rawbody mit
`65537` Bytes muss bis `nextSafety()` gelangen. Die öffentliche Kategorie ist
bewusst `protected`, nicht `invalid-candidate`, weil dieselbe monotone
Safetygrenze auch Downgrade, nichtadditive Entries und fehlende References
fail-closed bündelt. Der Store wird nicht geändert und nicht in die Allowlist
aufgenommen.

Das Orakel bindet:

- Safetyraw `65536`: Save plus Activate erfolgreich, exakter Safetyreadback;
- Safetyraw `65537`: `saveCandidate` oder Activate erreicht nachweislich
  `nextSafety()`, liefert `protected` und erhält Active, Previous, Candidate,
  Control und Safety vollständig byte-/strukturidentisch;
- Descriptorbytes/-hash, Release-Transporthash und voller Rootpin sind für
  beide Preimages frisch und korrekt gebunden, sodass kein früher Parser- oder
  Descriptorguard dominiert.

Diese enge Disposition ersetzt ausschließlich den generischen Satz
„Store `invalid-candidate`“ aus R4-R2-03 für die *nachgelagerte monotone
Safetymerge-Cap*. Raw-/JSON-/Descriptor-/`totalJson`-Capfehler vor dem
Safetymerge bleiben `invalid-candidate`. Es gibt keine Aufweichung,
Normalisierung oder zusätzliche Persistenz.

## Weitergeltende R5-Pflichten

Unverändert bleiben:

- je sechs Dokumentklassen der größte real erreichbare Produktfall mit
  tatsächlichen Minimal-Peerbytes, Gesamt `524288`, erfolgreichem Save/
  Activate/Readback, isolierter `524288`-/`524289`-Validatorgrenze und
  expliziter Redundanzinvariante;
- senkentreuer `totalJson`-`+1`-Fall mit neu gebundenem Descriptor, Release,
  Transporthash und Full-rootpin;
- intern vollständig gültiges Revision-2-Rawbundle gegen absichtlich äußere
  Bundle-Revision 1;
- typisierte unmittelbare Fetch- und Body-Stream-Rejections als
  `network-error`, während Inhaltsfehler `invalid` bleiben;
- Logverbot, Nullwrite-/LKG-Orakel, fünfpfadige Allowlist, vollständige
  Node-24.19-Matrix und Folgegates aus R5.

## Gate

Genau ein frischer unabhängiger Sol/high-R1-Recheck prüft R5 plus diesen
Nachtrag gegen die feste Reviewbasis. Nur null High-/Medium-/Low-/Coverage-/
Privacy-/deferred Findings aktivieren den fünfpfadigen Writer. Der Reviewer
schreibt nur eigene Evidence/Handoff und ändert keinen Git-Index.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R5-R1-CONTRACT-COMPLETION`
- Status: gebunden; frischer Sol-R1-Recheck erforderlich
- Geschlossen im Vertrag: `P2-R5-PRE-M-001`, `P2-R5-PRE-M-002`
- Produkt-/Testwrite: gesperrt
- P3/OUT/extern: gesperrt
- END-CHECK: :)
