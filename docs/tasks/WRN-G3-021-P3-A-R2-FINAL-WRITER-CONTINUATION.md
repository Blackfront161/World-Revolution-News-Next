# WRN-G3-021 P3-A-R2 – finale sequenzielle Writerfortsetzung

Status: **GEBUNDEN – ZWEI MEDIUMS OFFEN; ERSATZWRITER ERST NACH COMMIT**

## 1. Basis und Auftrag

- PO-101 und das ursprüngliche P3-A-Gate bleiben unverändert gültig.
- R1-Continuationcommit:
  `7585c84013427f4133104b6ca2fecd4f8d6c3491`.
- Der R1-Writer gibt alle Rechte zurück. Sein unstaged, uncommitted WIP
  liegt ausschließlich in den zehn erlaubten P3-A-Pfaden.
- Exakt Node 24.19 bestätigt Mobile-Typecheck, 12/12 fokussierte Vitestfälle,
  4/4 echte Chromium-/IndexedDB-/Request-Fälle, Format, Diffcheck und zwölf
  Schutz-Hashes.
- Das ist kein vollständiger Produktkandidat. Offen bleiben exakt
  `P3-A-R1-WIP-M-001` und `P3-A-R1-WIP-M-002`.

Nach dem separaten Commit darf genau ein frischer
`frontend_brand_engineer` Terra/high ohne Kinder, Git-Index oder Commit den
WIP sequenziell fertigstellen. Alle Regeln aus P3-A-Gate, Parentvertrag,
Privacy-Nachtrag und R1-Continuation bleiben bindend.

## 2. Unveränderte Allowlist

Es bleiben exakt dieselben zehn Pfade erlaubt: drei P3-A-Produktmodule, drei
zugehörige Unitdateien, Lifecycle-Harness und -Spec sowie dieselben Evidence-
und Handoffdateien. Kein neuer oder bestehender elfter Pfad darf verändert
werden. P4-B/UI, P2, Fixtures, Assets, Config, Packages, Lockfile, Website und
OUT/extern bleiben gesperrt.

## 3. R2-01 – `P3-A-R1-WIP-M-001` schließen

Der Hub orchestriert den injizierten Resume-Store vollständig, ohne direkte
P2- oder UI-Kopplung:

1. Jeder Resume-Read, Seek, Save und Cleanup erhält unmittelbar zuvor einen
   frischen Snapshot und danach eine frische Uhrprobe sowie vollständigen
   Identity-/Rights-/Safetyvergleich.
2. Nur ein ausdrücklich bestätigter Pauseübergang speichert einen exakt
   achtfeldrigen, aktuellen Record. Timeupdate, Mount, Reload und Unmount
   schreiben nichts.
3. Ein Resume-Seek erfordert einen vollständig validierten passenden Record,
   verifizierte Assetbytes und eine neue ausdrückliche Nutzeraktion. Kein
   Autostart und kein automatischer Seek.
4. Ended entfernt nur den bekannten exakten Record. Release-/Rights-Expiry,
   `blocked`, `gone`, `replaced` und fremde Episode/Asset/Revision/Hash
   sperren zuerst Nutzung/Seek, invalidieren und detachieren den Lauf und
   verwenden danach höchstens einmal `deleteIfExact`.
5. `saved`, `deleted`, `no-op`, `resume-clear-failed`,
   `resume-cleanup-failed` und `resume-discarded` bleiben ehrlich und dürfen
   keine IDs, Hashes oder Positionen ausgeben.
6. Resolve/Reject nach Runwechsel, Snapshotwechsel, Navigation oder Unmount
   erreicht keine UI-, Player- oder neue Resume-Senke; eine bereits gestartete
   recordexakte Privacy-Löschung darf nur ihren alten Record transaktional
   abschließen.

## 4. R2-02 – `P3-A-R1-WIP-M-002` schließen

Die vorhandenen Tests werden zu einer nachvollziehbaren Matrix 1 bis 23
ausgebaut. Jeder Vertragsunterpunkt erhält mindestens ein konkretes Orakel;
gekoppelte Varianten dürfen tabellengesteuert sein, dürfen aber keine Senke
auslassen.

Pflicht sind insbesondere:

- Identity-/Snapshot-/Safetywechsel in jeder relevanten Asyncphase;
- Release-/Rights `expiry-1`, `expiry`, `expiry+1` an Projektion, Request,
  URL/Play, Seek und Save sowie Block von Source, Series, Episode und Asset;
- Status, Redirect, 206, Range, MIME, optionaler Content-Length, Streambody
  262143/262144/262145, Descriptor minus/equal/plus eins und SHA/Digest/
  Reader/CreateURL/Decoder/Play-Faults;
- Timeout 4999/5000/5001, Supersession und alle späten Resolve-/Reject-/DOM-
  Events ohne Mutation;
- vollständiges Object-URL-Ledger für Wechsel, Retry, Error, Ended, Expiry,
  Block, Clear, Navigation und Unmount;
- Playback-/Availabilityübergänge, Offline-/Stale-/Blocked-Dominanz und exakt
  ein Expirytimer;
- Recordbytes 4095/4096/4097, Count 63/64/65 und Gesamtbytes
  65535/65536/65537;
- echte Chrome-/IndexedDB-Fälle für gültig/Unknown/Future/Corrupt/Over-cap,
  Save/Delete/Clear, zwei Tabs/CAS, Missing/Record-/Generation-No-op, Quota,
  Abort, Transaction, Storage und Readback;
- Release-/Rights-Expiry sowie Block von Source, Series, Episode und Asset an
  den vertraglichen sieben Lifecycle-Senken;
- bytegleiche andere Resume-Records, Katalog/Control/Safety, Sprach-/Theme-/
  Reading-/Content-/Events- und fremde DB-/LocalStorage-Sentinels;
- Privacyinventur ohne Zeitfeld oder sensible Werte, kein Auto-Retry und
  keine Katalog-Clear-API.

Evidence bildet Matrix 1 bis 23 auf konkrete Testnamen und Zähler ab. Eine
reine Behauptung, ein Import-Smoke oder ein allgemeiner Testname gilt nicht
als Beleg.

## 5. Pflichtabschluss und Stop

Der Writer nutzt exakt das gebündelte Node v24.19.0 und Playwright über
`node_modules\@playwright\test\cli.js`. Vor GREEN sind fokussierte und volle
Mobiletests, beide Typechecks, echte Chromium-/IDB-Matrix, Build, scoped
Lint/Format, 19 Boundaries, Fixture-/Releasechecks, zwölf Schutz-Hashes,
Diffcheck und Allowlistprüfung auszuführen und wahrheitsgemäß zu
dokumentieren.

Bei verbleibender Matrixlücke, Produktfinding, Zusatzpfad, Hashdrift,
Dependencybedarf oder nicht reproduzierbarem Lauf stoppt der Writer erneut
fail-closed. Erst der Chief darf nach eigener vollständiger Reproduktion
einen Produktkandidaten committen. Danach folgen unabhängige QA, defensiver
Integrity-/Privacy-Recheck und finaler Architekturabschluss. P4-B startet
nicht automatisch.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R2-FINAL-WRITER-CONTINUATION`
- Status: zwei Mediums gebunden; kein Writerrecht vor separatem Commit
- Basis: `7585c84013427f4133104b6ca2fecd4f8d6c3491` plus Zehn-Pfad-WIP
- Writer: genau ein frischer `frontend_brand_engineer` Terra/high ohne Kinder
- Offen: Resume-Orchestrierung und vollständige Matrix 1 bis 23
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
