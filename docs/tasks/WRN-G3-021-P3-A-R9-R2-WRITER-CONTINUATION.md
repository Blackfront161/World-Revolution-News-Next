# WRN-G3-021 P3-A-R9-R2 – sequenzielle Matrix-Writerfortsetzung

Status: **WIP GESICHERT – GENAU EIN FRISCHER ERSATZWRITER NACH DIESEM COMMIT**

## Basis und Übergabegrund

- Fester Produktkandidat vor R9: `c2265af`.
- R9/R1-Verträge: `dd6bbad` und `56705ed`.
- R1-Precheck: `192997d`, null Findings.
- Writer-Gate: `e5c7be0`.
- Erhaltener Zustand: unstaged und uncommitted in exakt sieben erlaubten
  Pfaden; kein Git-Indexeintrag.

Der erste R9-R1-Writer hat die beiden Produktkorrekturen, fünf Player-
Recheckbelege und R1-Provenienz-Units abgeschlossen. Er stoppt korrekt
fail-closed, weil in der echten Chromium-/IndexedDB-Matrix nur die sechs
`pause`-Zellen vollständig literalisiert sind. Die übrigen 36 Zellen dürfen
nicht aus grünen Testnamen oder breiten Orakeln abgeleitet werden.

Dieser Vertrag ändert keine Produktsemantik, Matrixzuordnung oder Allowlist.
Er bindet nur die sequenzielle Fertigstellung des erhaltenen WIP. Genau ein
frischer `frontend_brand_engineer` Terra/high darf nach dem separaten
Continuationcommit ohne Kinder und Git-Index fortsetzen.

## Gesicherter, nicht erneut zu entwerfender Teilstand

- Aktueller Player-Storagefehler setzt atomar Playback `error`, Availability
  und Fehler `storage-failure`; andere Faultklassen bleiben unverändert.
- Late-save-Kompensation verlangt `result.kind === 'saved'` und einen
  feldgleichen Record im Result-State. Jedes späte `no-op` bleibt ohne Delete,
  Storemutation oder öffentliche Senke.
- Fokussierte Hub-/Player-/Resume-Suite: **146/146 PASS**.
- Sieben Typechecks, Build, scoped Lint/Format, 19 Boundaries sowie Fixture-/
  Releasechecks: PASS.
- Voller Mobilelauf: **334/337**, ausschließlich die drei bekannten,
  gesperrten `App.test.tsx`-Baselinefehler.

Der Ersatzwriter erhält diese Ergebnisse als Baseline, muss sie aber nach
seinem finalen Delta vollständig neu reproduzieren.

## Exakte Restarbeit – 36 echte Browser-/IDB-Zellen

Für jede der sechs Ursachen werden die sechs noch offenen Senken vollständig
ausgeführt: `save`, `seek`, `deleteIfExact`, `success`, `no-op` und
`late-result`. Zusammen mit den erhaltenen sechs `pause`-Zellen müssen am
Ende alle 42 Top-Level-Zellen nachweisbar sein.

1. **`save`:** echter Store-Save bleibt pending; Ursache invalidiert vor
   Fulfillment. Release-Expiry, Source-Block und Episode-Block liefern
   `saved` und genau eine sinklose Exact-Kompensation. Rights-Expiry,
   Series-Block und Audioasset-Block beginnen mit einem vorbestehenden exakten
   Record, liefern `no-op`, starten null Delete und erhalten Record sowie
   Generation.
2. **`seek`:** realer passender IDB-Record liegt vor; die Ursache wird vor der
   frischen Seekprüfung aktiv. Seek bleibt null; nur das nach R9/R1 erlaubte
   Exact-cleanup darf erfolgen.
3. **`deleteIfExact`:** normales Cleanup erreicht über den steuerbaren
   letzten `snapshot`-/Katalog-Read die Grenze unmittelbar vor Delete. Danach
   erfolgt Runwechsel oder Unmount; es gibt literal null Deleteaufrufe.
4. **`success`:** Exact-delete beginnt bei gültigem Epoch und liefert real
   `deleted`; nur der aktuelle Lauf sieht den gebundenen Erfolgsstatus. Der
   IDB-Record ist exakt entfernt, andere Records und Fremdsentinel bleiben.
5. **`no-op`:** Release-Expiry/Series-Block erzeugen real Missing,
   Rights-Expiry/Episode-Block Generationrace und Source-Block/Audioasset-
   Block Recordrace. Es gibt keinen Erfolg und Retry; neuer/fremder Record
   sowie Generation entsprechen literal dem erwarteten IDB-Nachzustand.
6. **`late-result`:** Die feste R9-Zuordnung wird mit wirklich pending Save-
   oder Deleteoperation, anschließendem Run B oder Unmount und erst danach
   Resolve beziehungsweise Reject ausgeführt. Physische Exact-resultate
   dürfen vertraglich enden; alle späten öffentlichen Senken bleiben null.

Jede Zelle isoliert Datenbank und Instrumentierung und prüft literal:
Request, Decoder, Seek, Save, Delete, vollständigen IDB-Nachzustand,
Playback, Availability, Playerfehler, Resume-Status, Element/`src`, Object-
URL-Erzeugung und Revoke. `>= 0`, breite Zustandsmengen, gemeinsame
Else-Happy-Paths oder bloße Testnamen sind unzulässig.

Die sieben R1-Datenverlustregressionen bleiben zusätzlich sichtbar. Sofern
sie als Unterfälle einer Zelle laufen, muss die Ausgabe sie einzeln zählen
und ihre Record-/Generationserhaltung beziehungsweise Exact-Kompensation
literal belegen.

## Unveränderte exakte Sieben-Pfad-Allowlist

1. `apps/mobile/src/mobile-media-hub.ts`
2. `apps/mobile/src/mobile-media-player.ts`
3. `apps/mobile/src/mobile-media-player.test.ts`
4. `apps/mobile/src/mobile-media-hub.test.ts`
5. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
6. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
7. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Alle anderen Pfade bleiben read-only. Resume-Store, Harness, P2, Fixtures,
Assets, App/UI, Config, Dependencies, Lockfiles und Git-Index dürfen nicht
verändert werden. Neue Produkt-Testhooks sind verboten. Der Ersatzwriter
darf fremde Änderungen nicht zurücksetzen und muss auf dem erhaltenen WIP
aufbauen.

## Pflichtabschluss vor Kandidat

Unter exakt Node 24.19 müssen vollständig neu laufen:

- fokussierte Hub-/Player-/Resume-Units einschließlich fünf Rechecks,
  42-Zellen-Unitmatrix und sieben Provenienzregressionen;
- die gesamte Chromium-/IndexedDB-Spec **zweimal unmittelbar nacheinander**;
- sieben Typechecks, Mobile-Build und scoped ESLint/Prettier;
- 19 Boundaries, Fixture-/Releasechecks und alle Schutz-Hashes;
- voller Mobilelauf mit ehrlicher Abgrenzung der drei Baselinefehler;
- Diffcheck und exakte Sieben-Pfad-Allowlist.

Die zwei Writerbelege müssen die tatsächliche Matrix, Laufzahlen und alle
sieben geänderten oder unveränderten Allowlistpfade wahrheitsgemäß nennen.
Der Ersatzwriter hinterlässt den vollständigen WIP weiter unstaged und
uncommitted und gibt alle Rechte an den Chief zurück. Erst Chief-
Reproduktion darf einen Produktkandidaten erzeugen.

P4-B und alle OUT-/externen Bereiche bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R9-R2-WRITER-CONTINUATION`
- Status: Produkt/Units gesichert; 36 Browserzellen offen
- Writer: genau ein frischer Terra/high-Ersatzwriter nach Commit
- Commit/Index: vor Chief-GREEN verboten
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
