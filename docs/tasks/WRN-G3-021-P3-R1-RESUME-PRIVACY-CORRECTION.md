# WRN-G3-021 P3-R1 – Resume-Privacy-/Retention-Korrektur

Status: **ZUR FRISCHEN SOL-PRÜFUNG GEBUNDEN – KEIN WRITER-GATE**

## 1. Basis und Vorrang

- Vertragsbasis: `4b7cf5ea7a47ed7a00b6ea2874254d2e7b53aaa0`.
- Unabhängiger R1-Recheck: RED mit genau
  `P3-P0-R1-PRIV-M-001` und `P3-P0-R1-PRIV-M-002` sowie einer daran
  gekoppelten Coverage-Medium-Auswirkung.
- High, sonstige Mediums, Low und deferred: 0.

Dieser Nachtrag ändert ausschließlich Resume-Schema, Retention und die
Matrixpunkte 17/22. Er hat bei Widerspruch Vorrang vor §4.4 und den Punkten
17/22 des Vertrags
`docs/tasks/WRN-G3-021-P3-PLAYER-LIFECYCLE-UI-CONTRACT.md`. Alle anderen
Regeln, Allowlists, Hashes, OUT-Grenzen und Gates bleiben unverändert.

## 2. R1-01 – minimales exaktes Resume-Schema

Ein Resumerecord besitzt exakt und nur:

```text
{
  recordVersion: 1,
  key,
  episodeId,
  audioAssetId,
  releaseRevision,
  audioAssetHash,
  positionMs,
  durationMs
}
```

`updatedAt` ist ersatzlos gestrichen. Es gibt keinen persistierten
Aktivitäts-, Erstellungs-, Änderungs-, Abspiel-, Zugriffs- oder
Bereinigungszeitpunkt, kein semantisch gleiches Ersatzfeld und keine
Migration. Unknown-/Zusatzfelder sind nicht gültig, sondern `protected` und
read-only.

Alle übrigen Grenzen bleiben: maximal 64 Records, 4096 kanonische UTF-8-Bytes
je Record, 65536 Bytes gesamt, finite Safe-Integer und
`0 <= positionMs < durationMs`. Storage-, Console- und Requestinventur muss
ausdrücklich belegen, dass kein Zeitstempel oder zeitähnlicher Resume-Wert
persistiert oder geloggt wird.

## 3. R1-02 – automatische, ehrliche und race-sichere Bereinigung

### 3.1 Gemeinsamer bedingter Löschpfad

Automatische Expiry-/Revocation- und Mismatch-Bereinigung benutzen dieselbe
öffentliche Resume-Store-Operation `deleteIfExact` mit:

- erwarteter globaler Resume-Generation;
- exaktem Recordkey;
- vollständigem erwarteten Recordwert ohne Zeitfeld;
- Pre-read, Record-Gleichheit, Delete, `generation + 1` und vollständigem
  Readback in genau einer Readwrite-Transaktion.

Nur wenn Generation und vollständiger Recordwert noch exakt stimmen, darf
gelöscht werden. Ein inzwischen neuer oder geänderter Record bleibt dadurch
unangetastet. `missing` oder Mismatch ist ein bestätigter No-op, kein Erfolg
über eine fremde Löschung. Es gibt keinen Auto-Retry.

### 3.2 Expiry und Revocation

Bei `now >=` frühester Release-/Rights-Expiry oder bei `blocked`, `gone` oder
`replaced` gilt in dieser Reihenfolge:

1. Nutzung und Resume-Seek werden sofort gesperrt;
2. der Playerlauf wird invalidiert, abgebrochen, gestoppt und detached;
3. ein bereits bekannter, exakt zu Episode/Asset/Revision/Hash passender
   Resumerecord wird über `deleteIfExact` entfernt;
4. erst bestätigter Readback darf `resume-removed` melden.

Die Nutzung bleibt unabhängig vom Löschresultat gesperrt. Quota, Abort,
Transaction-, Readback- oder Storagefehler zeigen `resume-clear-failed` und
behaupten keine physische Löschung. Der unveränderte Record wird nie wieder
verwendet. Katalog-Safety, andere Resume-Records und fremde Stores bleiben
bytegleich.

Eine einmal wegen Expiry/Revocation gestartete exakte Privacy-Löschung darf
nach Navigation oder Unmount transaktional zu Ende laufen. Ihr später
Resolve/Reject darf wegen Mounted-/Run-Guard keinen UI-, Player- oder neuen
Resume-Sink auslösen. Die Generation- und Record-Gleichheitsprüfung verhindert
das Löschen eines inzwischen ersetzten Records.

### 3.3 Fremde Revision oder fremder Hash

Ein formal gültiger Resumerecord mit fremder Episode, Asset-ID,
Release-Revision oder Assethash wird niemals für Seek, Play oder Anzeige
verwendet. Beim nächsten gültigen Active-Zugriff startet höchstens ein
`deleteIfExact`-Versuch für genau den vorgefundenen Record.

- bestätigtes Löschen zeigt eine harmlose Meldung `resume-discarded`;
- No-op wegen Generation-/Recordwechsel zeigt keinen falschen Erfolg und
  berührt den neuen Record nicht;
- Storagefehler zeigt `resume-cleanup-failed` und behauptet keine Löschung;
- kein Pfad enthält fremde IDs, Hashes oder Positionsdaten im sichtbaren Text
  oder Log;
- kein automatischer Wiederholungsloop.

## 4. Ersetzte Pflichtmatrix 17 und 22

### Matrix 17 – Validierung und Mismatch-Cleanup

Echte Unit- und Chrome-/IndexedDB-Fälle belegen:

1. exakt gültiger Record ohne `updatedAt` wird akzeptiert;
2. `updatedAt`, jedes Zeitersatzfeld und jedes Unknown-Feld führen
   `protected`/read-only herbei;
3. Position `-1/0/duration-1/duration/duration+1`, NaN, Infinity und
   Nicht-Integer;
4. fremde Episode, Asset-ID, Revision und Hash werden nie für Seek/Play
   verwendet;
5. jeder dieser vier Fremdfälle löst beim nächsten gültigen Active-Zugriff
   genau einen `deleteIfExact`-Versuch aus;
6. Success: erwarteter Record fehlt, Generation exakt `+1`, alle anderen
   Resume-Records und fremden DB-/LocalStorage-Sentinels bytegleich;
7. Generation- oder Recordrace: bestätigter No-op, neuer Record bytegleich;
8. Quota, Abort, Transaction- und Readbackfehler: keine Erfolgsbehauptung,
   Rohrecord und Generation entsprechen der atomaren Fehlersemantik;
9. spätes Resolve und Reject nach neuem Lauf, Navigation oder Unmount mutiert
   keine UI, keinen Player und keinen neuen Resume-Record;
10. kein Auto-Retry, kein Zeitfeld und keine ID-/Hash-/Positionsausgabe.

### Matrix 22 – automatische Expiry-/Revocation-Löschung

Echte Unit- und Chrome-/IndexedDB-Fälle belegen jeweils für Release-Expiry,
Rights-Expiry sowie Block von Source, Series, Episode und Audioasset:

1. Event vor Assetload, während Body/Digest, nach Object URL, während
   Play/Pause, vor Resume-Save und direkt nach bestätigtem Resume-Save;
2. Nutzung wird sofort gesperrt und der Lauf vor Storebereinigung invalidiert;
3. vorhandener exakt passender Record wird über `deleteIfExact` entfernt,
   Generation genau `+1`, Readback missing;
4. kein Record ist bestätigter No-op ohne Generationsänderung;
5. Record-/Generationrace löscht niemals einen inzwischen neuen Record;
6. Quota, Abort, Transaction-, Storage- und Readbackfehler bleiben sichtbar,
   behaupten keine Löschung und erlauben nie Seek/Play;
7. später Success/Reject nach Snapshotwechsel, Navigation oder Unmount hat
   keine UI-/Player-/Resume-Nachwirkung; nur eine noch exakt passende
   Privacy-Löschung darf persistieren;
8. andere Resume-Records, Katalog/Control/Safety, UI-Sprache, Theme, Reading,
   Content, Events und fremde DB-/LocalStorage-Sentinels bleiben bytegleich;
9. Storage-/Console-/Requestinventur enthält weder Aktivitätszeitpunkt noch
   Titel, Source, URL, Transcript, Consent, IDs, Hashes oder Positionen;
10. keine Katalog-Clear-API, keine physische Löschbehauptung paketierter Bytes
    und kein Auto-Retry.

## 5. Gate

Nur ein frischer unabhängiger Sol/high-Recheck darf beide Privacy-Mediums und
die Coverage-Auswirkung schließen. Vor null Findings gibt es kein P3-A-
Writergate und keinen Produkt-/Test-/Fixture-/Browserwrite. P4-B und alle
OUT-/externen Bereiche bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-R1-RESUME-PRIVACY-CORRECTION`
- Status: enger Dokumentnachtrag; Recheck ausstehend
- Basis: `4b7cf5ea7a47ed7a00b6ea2874254d2e7b53aaa0`
- Gebunden: kein Aktivitätszeitpunkt, deleteIfExact, Expiry/Revocation,
  Mismatch-Cleanup, vollständige IDB-/CAS-/Failure-/Late-result-Matrix
- Produktwrites: keine
- Nächster Schritt: separater Commit und frischer Sol/high-Recheck
- END-CHECK: :)
