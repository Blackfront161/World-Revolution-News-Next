# WRN-G3-021 P3-P0-S – Handoff

- Basis: `46b20d40afbdc629ad95dd2bb658dc4813ae4079`
- Ergebnis: **YELLOW – P3-Start bleibt gesperrt**
- Bestehende P3-Produktvulnerabilitaeten: `0`
- Reportable Vertragsfindings: `3 Medium`
- Privacy: `1 Medium`
- Deferred: `0`
- Parallelinput: P3-P0-T ist YELLOW mit `P3-P0-T-M-001..003`;
  `T-M-001` ueberlappt mit `S-M-003`.

## Offene Findings

1. `P3-P0-S-M-001`: Active-only-Projektion ist noch nicht an frische
   Current-time-/Rights-/Safetypruefung und eine exakte Snapshot-/Asset-
   Identitaet vor jeder Render-/Play-/Resume-Senke gebunden.
2. `P3-P0-S-M-002`: Zwischen P2-Assetmetadaten und Decoder fehlt der exakte
   user-gesture-, HTTP-/MIME-/Range-/Cap-/Hash-, Blob-/Object-URL- und
   Cleanup-Enforcementpunkt.
3. `P3-P0-S-M-003`: Run-ID, Abort, Mounted-/Elementguard, DOM-Late-events,
   Expirytimer und stale/blocked-Dominanz sind noch nicht als implementierbare
   Controllergrenze gebunden.
4. `P3-P0-S-PRIV-M-001`: Der minimale isolierte Resume-Store, seine
   64-Record-/64-KiB-/4096-Byte-Caps, Generation-CAS, Future-Schutz und
   ehrlicher selektiver/globaler Resume-Clear fehlen.

## Gebundene Richtung fuer die Chief-Synthese

- Nur ein vollstaendig erneut validierter P2-`active`-Snapshot darf UI,
  Assetload oder Resume erreichen; Candidate und Previous werden nie
  projiziert.
- Vor Klick null Asset-/Drittoriginrequest. Nach Klick nur der feste lokale
  Audio-Pfad mit `credentials:omit`, `redirect:error`, `no-referrer`,
  `no-store`, Status 200, ohne Range, exakt `audio/wav`, 262144-Byte-Cap,
  exact bytes und SHA-256 vor Blob/Decoder.
- Genau eine Object URL je Run; idempotentes Stop/Detach/Revoke bei Fehler,
  Ended, Wechsel, Expiry, Block, Clear und Unmount.
- Playback und Availability bleiben orthogonal. Jede Success-/Catch-/DOM-
  Eventsenke prueft Run-ID, Abort, Mounted-Status und Snapshot-/Assetidentitaet.
- Resume nur in `wrn-mobile-media-resume-v1`, Version 1, exakt Store
  `mediaResume`; minimale ID-/Revision-/Hash-/Position-/Dauerdaten, keine
  Titel, URLs, Inhalte, Aktivitaetszeitpunkte, persoenlichen IDs, Logs,
  Analytics oder Telemetrie. Clear bedeutet nur selektiv oder `Alle
  Wiedergabepositionen loeschen`; der P2-Katalog besitzt keine Clear-API und
  darf durch P3 weder umgangen noch als geloescht dargestellt werden.
- Die aktuelle reale Fixture ist am Prueftag abgelaufen. `ready/local` wird
  nur ueber echte Produktpipeline mit injizierter Testuhr vor Expiry belegt;
  Produktionsdefault bleibt `Date.now` und zeigt ab Expiry ehrlich stale.
- P3-P0-T-Visual-/A11y-, echte Route-, neunsprachige Copy- und Viewportmatrix
  werden vollstaendig in denselben Vertrag aufgenommen.

## Moegliche Scope- und Gategrenze

Die Evidence definiert eine exakte moegliche 18-Pfad-Allowlist: drei neue
Produktmodule (Hub, Player, Resume), die fuenf bestehenden App-/Style-/
Sprachpfade aus P3-P0-T, drei neue Unitdateien, zwei echte Lifecycle-/IDB-
E2E-Pfade, zwei Visualpfade sowie drei Ergebnisbelege. Alle P2-Dateien,
Fixtures/Assets/Pins, Configs, Package-/Lockfiles, Website, Provider und
externe Gates bleiben read-only/OUT.

Naechste zulässige Folge: Chief bindet alle sieben S-/T-Findings und die
25-Punkt-Negativmatrix in einem separaten P3-Vertragscommit; danach frischer
unabhaengiger Sol/high-Recheck mit null Findings. Erst dann kann genau ein
Terra/high-Frontendwriter ohne Kinder starten. Vollstaendige Details,
Vorhashes, Source-to-sink-Modell, Matrix und Folgegates stehen in
`docs/evidence/WRN-G3-021/P3-P0-S-ARCHITECTURE-PRIVACY-PRECHECK.md`.

Eigene Writes: nur Evidence und dieses Handoff. Kein Git-Index/Commit, keine
Produkt-/Test-/Fixture-/Browser-/Netz-/Provideraktion.

END-CHECK: :)
