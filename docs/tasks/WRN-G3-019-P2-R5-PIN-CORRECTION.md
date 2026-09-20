# WRN-G3-019 P2-R5 – Reader-v2 Pin-Semantik korrigieren

Status: **GEBUNDEN – PRODUKTWRITE BIS ZUM UNABHAENGIGEN PRECHECK GESPERRT**

## Anlass und Gate

Der P3-Browserlauf auf WIP `6147b84` bleibt korrekt im Reader-v1-Fallback.
Der unabhaengige Sol-Ursachenreview `8588f38` bestaetigt zwei Befunde:

- `P3-PIN-M-001`: P2-Build-Pin und Sidecar verschieben zwei Hashsemantiken;
- `P3-PIN-L-001`: eine echte Cross-Fixture-Regression fehlt.

Dies ist ein P2-Produkt-/Fixturefinding. Es ist kein P3-Ableitungs-, G3-016-
Generator-, Security-, Privacy- oder Datenverlustfehler. Reader v1 bleibt
funktionsfaehig und fail-closed. Vor jedem Produktwrite muss ein frischer
unabhaengiger Sol-Review diesen Korrekturvertrag GREEN bestaetigen.

## Exakte Semantik

Der validierte reale Release bindet:

- `releaseRevision`: `wrn-g3-016-mobile-home-release-v1`;
- `manifestSha256`:
  `77244d6774a91b30af2898f2c8ccf98633e8fcb609d4807852e0ea991db562f4`;
- `readerDetailsRevision`: `wrn-g3-016-local-home-reader-v1`;
- `readerDetailsWholeDocumentSha256`:
  `cb87e281ad020872ae7fdade538c0764db057d0b31e9543ed08b8a62cd3c0e14`;
- `readerDetailsIntegritySha256`:
  `e821e8ffe3845d9e8cbe83317add309987bce4aa673461e9ebe5ad403b534b99`.

`6fc207b46395f0bc3db2b4e1d2bcbd6a3ac23342007d7fe71c30c9c27d098b8f`
ist nur der SHA-256 der formatierten Readerdetails-Dateibytes. Er darf nicht
als kanonischer `readerDetailsWholeDocumentSha256` der fuenffeldigen
Releaseidentitaet verwendet werden.

## Einziger Writer und exakte Allowlist

Nach einem unabhaengigen Vertrags-GREEN darf genau ein frischer
`backend_data_reliability_engineer` Terra/high bearbeiten:

- `apps/mobile/public/wrn-mobile-reader-v2/v1/mobile-reader-v2.json`;
- `apps/mobile/src/mobile-reader-v2.ts`;
- `apps/mobile/src/mobile-reader-v2.test.ts`;
- eigene neue Evidence unter `docs/evidence/WRN-G3-019/P2-R5-*`;
- eigenes Handoff `docs/handoffs/WRN-G3-019-p2-r5-pin-correction.md`.

Alle anderen Dateien bleiben read-only. Insbesondere bleiben P3-WIP,
`App.tsx`, P3-UI/Styles/Sprachkataloge/Visualspec, G3-016-Releasefixture und
Generator, Content Contracts, Shared Reader v1, Website, Dependencies und
Konfiguration OUT. Keine Kinder und keine Selbsterweiterung der Allowlist.

## Pflichtkorrektur

1. Die zwei Sidecar-Snapshotfelder werden exakt auf `cb87...0e14` und
   `e821...4b99` korrigiert.
2. Der externe Build-Pin bindet dieselbe fuenffeldige Identitaet.
3. Weil sich die Sidecarbytes aendern, wird deren aeusserer
   `wholeDocumentSha256` aus den tatsaechlichen finalen Bytes neu berechnet
   und im Build-Pin aktualisiert. Der Writer darf keinen Hash erfinden oder
   aus einem semantisch anderen Feld uebernehmen.
4. Revision, Pfad, Artikel-/Abschnitts-/Quellinhalt, Rechte, Media-Registry,
   Translationdefault und alle Limits bleiben unveraendert.
5. Kein Fallback, Pinvergleich oder Validator wird gelockert.

## Pflichtregressionen

- exakte Fuenffeldgleichheit zwischen real validiertem G3-016-Release und
  Sidecar-/Build-Pin;
- Der Cross-Fixture-Test muss aus allen realen G3-016-Release-Dateien ueber
  `createValidatedLocalContentReleaseV1` ein offiziell validiertes
  `LocalContentReleaseReadyV1` erzeugen. Die fuenf Felder werden
  ausschliesslich aus diesem Readyobjekt abgeleitet; keine handgeschriebene
  Identitaet und keine Hashueberschreibung ist erlaubt.
- Derselbe Test verwendet den echten Sidecar als `?raw`, den unveraenderten
  Produktions-`mobileReaderV2BuildPin` und genau einen instrumentierten
  Request. Das Ergebnis muss `ready` sein und der Requestzaehler exakt `1`.
- Jede einzelne Abweichung aller fuenf Felder endet `fallback/missing-pin`
  und muss requestfrei bleiben (`0 Requests`).
- falscher physischer Dateibyteshash `6fc...b8f` im kanonischen Feld wird
  abgelehnt;
- aeusserer Sidecarhash: exakt finaler Bytehash accepted, abweichend rejected;
- Abort, MIME, Redirect, Transport-/Decoded-Caps, v1-Exact-cover, Media-
  Rechte und Translationbindung bleiben GREEN;
- Mobile- und Contract-Typecheck sowie bestehende fokussierte Reader-v2-
  Tests mit exakt Node 24.19.

## Reihenfolge nach Writerende

1. Chief prueft Allowlist, Hashwerte, Diff und reproduziert die fokussierte
   Matrix mit exakt Node 24.19.
2. Frische unabhaengige Terra-QA prueft Cross-Fixture, Grenzen und Regression.
3. Frischer versiegelter Sol-Security-Deltacheck prueft alle R5-Diffpfade und
   zusaetzlich read-only die durch R5 erstmals erreichbaren P3-WIP-
   Oberflaechen in `apps/mobile/src/App.tsx`,
   `apps/mobile/src/mobile-reader-v2-ui.ts`,
   `apps/mobile/src/mobile-reader-v2-media-safety.ts` und
   `packages/content-contracts/src/mobile-reader-v2.ts`. Die Coverage muss
   insbesondere UI-Zustand/DOM, Media-Safety-Persistenz/Revocation und die
   atomare Contractvalidierung umfassen. Diese transitive Coverage erteilt
   dort kein Schreibrecht.
4. Frischer Sol-Architekturabschluss schliesst beide Findings.
5. Erst danach darf ein frischer P3-R1-Frontendwriter den bestehenden WIP
   gegen die gesicherte neue Basis fertigstellen.

## Harte Grenzen

Keine echten Inhalte/Medien, Remoteprovider, Recherche, Website, Hosting/
Live, Android/AAB/Play, Signierung, Upload, Deployment oder Release. G3-020
und G3-021 bleiben vorbereitet, aber nicht gestartet.

END-CHECK: :)
