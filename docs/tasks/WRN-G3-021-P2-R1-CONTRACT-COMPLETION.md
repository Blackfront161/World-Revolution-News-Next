# WRN-G3-021 P2-R1 – abschliessende Vertragsbindung vor Produktwrite

Status: **REIN DOKUMENTARISCH – P2 BIS FRISCHEM P1-R1-GREEN GESPERRT**

Dieser Nachtrag schliesst ausschliesslich `P1-R-M-001` bis `P1-R-M-004`
und `P1-R-L-001/-L-002` aus dem unabhaengigen Recheck auf
`38cb68911e708d578db2cff12ea841f2224be087`. Er hat bei Widerspruch Vorrang
vor `WRN-G3-021-P2-DATA-ADMISSION-RIGHTS.md`; alle dortigen strengeren
Grenzen bleiben bestehen.

## Feste Basis und Arbeitsbaum

- Start: `c6656f2be780951ce98917e3b59a4ef502811265`.
- P1-L/T/S: `29941c2e906493e622f18fccf229754e887cb859`.
- erstes P2-Paket: `38cb68911e708d578db2cff12ea841f2224be087`.
- P1-R-RED-Beleg: `f70a10d66ebb400068cacd8ebd36c356a80f3b65`.
- Branch: `codex/g3-015-website-offline-shell`.
- Checkout: `C:\Users\patri\Documents\ChatGPT\Sauberes Wo Rev Ne`.
- Bekannte unversionierte `.codex-remote-attachments/` und
  `.codex/environments/` gehoeren nicht zum Kandidaten und sind immer OUT.
- Dieser Nachtrag ist noch keine Writerbasis. Der Chief bindet nach seinem
  Commit dessen vollen SHA im Register. Der frische P1-R1 prueft genau diesen
  festen Commit. Nach GREEN bindet ein eigener Chief-Gatecommit den vollen
  P1-R1-Ergebnis-SHA als einzige Writerbasis. Writer und Reviewer nennen stets
  vollen Basis-/Ergebnis-SHA, Branch, Checkout, `git status --short`, exakte
  Pfade und Rechteende.

## R1-01 – exakte Zeit-, Revision- und Freshnessregeln

`UtcInstant` ist exakt `YYYY-MM-DDTHH:mm:ss.sssZ`, muss kalendarisch gueltig
sein und wird als UTC-Epochmillisekunden verglichen. Alle Entscheidungen
erhalten eine injizierte Clock; kein implizites `Date.now()` im Validator.

- Release und alle sechs Required-Dokumente tragen bytegleich dieselben
  `releaseId`, `revision`, `generatedAt`, `validUntil` und `owner`.
- `revision` ist eine positive Safe-Integer. `generatedAt < validUntil`,
  TTL hoechstens 604800000 ms. Gueltig nur bei
  `generatedAt <= now < validUntil`; Gleichheit mit `validUntil` ist stale.
- `owner` ist eine opake lower-case-ASCII-ID, 1 bis 128 Zeichen.
- Jede Source hat `healthAt <= generatedAt`, Alter hoechstens 86400000 ms,
  `validFrom <= generatedAt` und Source-`validUntil` exakt gleich Release-
  `validUntil`. Rights-`expiresAt` ist ebenfalls exakt Release-`validUntil`.
- Normaler Candidate: Revision kleiner als `highestAcceptedRevision` =
  reject; gleich plus gleicher Release-Transporthash = idempotentes no-op;
  gleich plus anderer Hash = conflict/reject; groesser = erst nach allen
  Checks aktivierbar.
- Expliziter Rollback darf ausschliesslich den bereits verifizierten
  `previous`-Slot atomar mit `active` tauschen. Er senkt
  `highestAcceptedRevision` und Safety nie, validiert Freshness/Rechte und den
  aktuell gespeicherten Safetyfloor neu und erzeugt bei Fehler null Slotwrite.
  Explizites Roll-forward ist derselbe Tausch zur unveraenderten hoechsten
  Revision. Automatischer Rueckgang und stilles Rollback existieren nicht.

## R1-02 – exakte Root- und Recordshapes

Alle JSON-Objekte sind Exact-key-Objekte: fehlender oder zusaetzlicher Key ist
invalid. Arrays sind nach ihrem primaeren ASCII-ID-Key streng aufsteigend,
duplikatfrei und werden nicht vom Validator umsortiert. Integer sind endliche
Safe-Integers. `LocalizedText` hat exakt die neun Keys
`en,de,es,fr,it,pt,ru,el,tr`, jeweils Plain text 1..2048 UTF-8-Bytes.

### Releaseumschlag

Exakte Rootkeys:

`schema, contractVersion, releaseId, revision, generatedAt, validUntil,
owner, revocationFloor, documents`

- Literale: `schema="wrn.mobile-media-release.v1"`,
  `contractVersion="1.0.0"`.
- `revocationFloor` ist positive Safe-Integer.
- `documents` enthaelt exakt sechs Eintraege in der unten genannten
  Dokumentklassenreihenfolge. Descriptor-Exact-keys:
  `documentClass,path,schema,contractVersion,revision,bytes,sha256,
  recordCount,compatibility`.
- `compatibility` hat exakt
  `minReaderContract,maxReaderContract`, beide literal `1.0.0`.
- Descriptorrevision = Releaserevision. `bytes` = exakte Transportbytes;
  `sha256` = SHA-256 dieser unveraenderten Bytes.

### Gemeinsame Required-Rootkeys

Jedes Required-Dokument beginnt mit genau den gemeinsamen Keys
`schema,contractVersion,releaseId,revision,generatedAt,validUntil,owner` und
danach ausschliesslich den unten je Dokument genannten Payloadkeys.
Contractversion ist `1.0.0`; gemeinsame Felder entsprechen dem Umschlag.
Der Descriptorhash ist die einzige Dokumenthashpraeimage: exakte
Transportbytes, keine normalisierte oder neu serialisierte JSON-Fassung.

### Manifest

- Schema `wrn.mobile-media-manifest.v1`; volle Rootkeyliste exakt
  `schema,contractVersion,releaseId,revision,generatedAt,validUntil,owner,
  series,episodes,assets`.
- Series-Recordkeys exakt `id,sourceId,title,episodeIds`; `episodeIds` streng
  nach ASCII-ID und nicht leer.
- Episode-Recordkeys exakt
  `id,seriesId,sourceId,title,summary,audioAssetId,thumbnailAssetId,
  transcriptAssetId,durationMs`. Die zwei optionalen IDs sind immer vorhanden
  und entweder gueltige ID oder `null`.
- Asset-Recordkeys exakt
  `id,kind,path,mime,bytes,sha256,width,height`; `kind` ist
  `audio|thumbnail|transcript`. Audio/Transkript haben `width=height=null`,
  Thumbnail positive Integer. MIME und Pfad muessen R1-06 entsprechen.
- `recordCount = series.length + episodes.length + assets.length`.

### Admission

- Schema `wrn.mobile-media-admission.v1`; volle Rootkeyliste exakt gemeinsame
  sieben Keys plus `sources`.
- Source-Recordkeys exakt
  `id,displayName,selfDescription,editorialDescription,language,region,
  healthAt,healthStatus,deliveryClass,admissionRevision,validFrom,validUntil,
  owner,correctionContact`.
- `language` ist einer der neun UI-Codes; `healthStatus="ok"`,
  `deliveryClass="admitted-local-fixture"`, positive Admissionrevision;
  Selbstbeschreibung und redaktionelle Einordnung sind getrennte
  `LocalizedText`. Kontakt ist beschrifteter Plain text, keine URL.
- `recordCount = sources.length`.

### Rights

- Schema `wrn.mobile-media-rights.v1`; volle Rootkeyliste exakt gemeinsame
  sieben Keys plus `rights`.
- Rights-Recordkeys exakt
  `assetId,assetHash,status,license,attribution,territory,offlineAllowed,
  cacheAllowed,expiresAt,provenance,correctionContact`.
- Literale: `status="allowed"`, `license="WRN-self-authored-fixture"`,
  `territory="global"`, beide Booleans `true`.
- `recordCount = rights.length`.

### Consent

- Schema `wrn.mobile-media-consent.v1`; volle Rootkeyliste exakt gemeinsame
  sieben Keys plus `consents`.
- Consent-Recordkeys exakt
  `episodeId,deliveryClass,origin,dataCategories,mode,requiresPrompt`.
- Literale: `deliveryClass="packaged-local-audio"`,
  `origin="same-origin-local"`, `dataCategories=[]`,
  `mode="local-no-third-party"`, `requiresPrompt=false`.
- `recordCount = consents.length`.

### Lifecycle

- Schema `wrn.mobile-media-lifecycle.v1`; volle Rootkeyliste exakt gemeinsame
  sieben Keys plus `lifecycle`; `recordCount=1`.
- Lifecycle-Exact-keys:
  `playbackStates,availabilityStates,playbackTransitions,
  availabilityTransitions,dominanceRules`.
- Die Statearrays sind exakt
  `idle,loading,ready,playing,paused,ended,error` und
  `local,online,offline,stale,blocked` in dieser Reihenfolge.
- Transition-Records haben exakt `from,event,to`. Playback erlaubt nur:
  `idle/user-play/loading`, `loading/decoder-ready/playing`,
  `loading/failure/error`, `playing/user-pause/paused`,
  `paused/user-play/playing`, `playing/media-ended/ended`,
  `ended/user-play/loading`, `error/user-reset/idle`.
- Availability erlaubt nur `online/network-lost/offline`,
  `offline/network-restored/online`, `online/freshness-expired/stale`,
  `offline/freshness-expired/stale` und aus jedem nicht blockierten State
  `safety-block/blocked`. Fuer den lokalen P2/P3-Basisslice sind normal nur
  `local` und nach Safety `blocked` erreichbar; Netzwechsel aendert `local`
  nicht.
- Dominanzregeln sind exakt: `blocked` und `stale` verhindern neuen Start;
  `blocked` stoppt laufende Wiedergabe, entkoppelt Source/Decoder, setzt
  Playback `idle` und verhindert Resume-Write; `local` ist netzunabhaengig.
  Run-ID, Abortsignal und Mounted-Guard muessen Resolve und Catch pruefen.
  Clear, Revocation, Consentwiderruf, Medienwechsel und Unmount invalidieren
  den Run vor Side Effect; spaete Resolve/Reject duerfen UI und Resume nicht
  mutieren. P2 validiert nur diesen konstanten Vertrag und implementiert
  keinen Player.

### Revocation/Safety

- Schema `wrn.mobile-media-revocation.v1`; volle Rootkeyliste exakt gemeinsame
  sieben Keys plus `safetyRevision,revocationFloor,references,entries`.
- `safetyRevision >= revocationFloor`, beide positive Safe-Integer.
- Reference-Recordkeys exakt `kind,id`; kind ist
  `source|series|episode|asset`. Die Liste enthaelt mindestens die exakte
  sortierte Union aller aktuellen IDs; zusaetzliche historische IDs sind nur
  erlaubt, wenn sie von einem Entry referenziert werden.
- Entry-Recordkeys exakt
  `targetKind,targetId,targetHash,status,replacementKind,replacementId`.
  `status=blocked|gone|replaced`; Hash ist Assethash oder `null` fuer andere
  Kinds. Replacementfelder sind beide `null`, ausser bei `replaced`; dann
  gleiche Kindklasse, vorhandener anderer Reference-Eintrag, keine Self-
  Referenz und der gesamte Replacementgraph ist zyklenfrei.
- `recordCount = entries.length`; Safetybytes/-count bleiben vor jedem Write
  unter den Hauptcaps.

## R1-03 – Cross-document Exact-cover und Fehlergranularitaet

1. Admission-Sources sind exakt die Source-ID-Menge des Manifests.
2. Jede Series referenziert eine Source; ihre `episodeIds` sind exakt alle
   und nur die zugehoerigen Manifest-Episoden.
3. Jede Episode referenziert dieselbe Source wie ihre Series.
4. Assetmenge ist exakt die Union aller referenzierten Audio-/nicht-null
   Thumbnail-/nicht-null Transkript-IDs; Kind muss zur Referenz passen.
5. Rights sind exakt ein Record je Asset und Hash muss dem Asset entsprechen.
6. Consent ist exakt ein Record je Episode.
7. Lifecycle ist byteinhaltlich der oben gebundene konstante Automat.
8. Revocationreferences decken alle aktuellen IDs und alle Entryziele/
   Replacementziele nach den obigen Regeln.

Ein im Manifest referenziertes Element mit fehlender, ungueltiger,
abgelaufener oder inkompatibler Admission-/Rights-/Consent-/Safetybindung
verwirft **den gesamten Candidate**. Optionalitaet existiert nur durch `null`
im Manifest; nie durch stilles Ausduennen einer referenzierten Menge.

## R1-04 – exakte Revision-/Safetyoperationen

- Safety-Gleichheitspraeimage ist
  `(safetyRevision, SHA256(exakte Revocation-Transportbytes))`.
- Incoming lower = reject/null writes. Equal plus gleicher Hash = no-op/null
  writes. Equal plus anderer Hash = conflict/reject/null writes.
- Incoming higher ist nur gueltig, wenn jeder gespeicherte Entry im neuen
  Dokument byteinhaltlich identisch vorhanden bleibt; kein Entfernen,
  Downgrade oder Umschreiben. Neue Entries und zulaessige neue References
  duerfen additiv hinzukommen. Reference-/Replacement-/Graph- und Capschecks
  laufen vollstaendig vor dem ersten Write.
- Danach genau eine Safetytransaktion, validierter Readback, Generation
  exakt `+1`; erst dann darf Candidateaktivierung oder Rollback beginnen.
- Candidateaktivierung und expliziter Rollback lesen Safety nach dessen
  Persistenz erneut, pruefen `safetyRevision >= release.revocationFloor` und
  blockieren jede betroffene ID/hash. Safetyfehler erzeugt weder Slotrotation
  noch Wiedergabe-/Resumeerfolg.

## R1-05 – exakte Writer-Allowlist, Packageexport und Fixtures

Der einzige erlaubte Bestandswrite ist
`packages/content-contracts/package.json`, Prehash
`19fda392db9ee15a71d00dd83505f564b2bcb801917c54ffcf66818b22d923a3`.
Erlaubt ist nur genau dieser additive Export ohne Aenderung bestehender Keys:

```json
"./mobile-media-v1": {
  "types": "./src/mobile-media-v1.ts",
  "default": "./src/mobile-media-v1.ts"
}
```

Die vollstaendige P2-Allowlist lautet wortwoertlich:

1. `packages/content-contracts/package.json`,
2. `packages/content-contracts/src/mobile-media-v1.ts`,
3. `packages/content-contracts/tests/mobile-media-v1.test.ts`,
4. `apps/mobile/src/mobile-media-release.ts`,
5. `apps/mobile/src/mobile-media-release.test.ts`,
6. `apps/mobile/src/mobile-media-catalog-store.ts`,
7. `apps/mobile/src/mobile-media-catalog-store.test.ts`,
8. `apps/mobile/public/wrn-mobile-media/v1/mobile-media-release.json`,
9. `apps/mobile/public/wrn-mobile-media/v1/media-manifest.json`,
10. `apps/mobile/public/wrn-mobile-media/v1/media-admission.json`,
11. `apps/mobile/public/wrn-mobile-media/v1/media-rights.json`,
12. `apps/mobile/public/wrn-mobile-media/v1/media-consent.json`,
13. `apps/mobile/public/wrn-mobile-media/v1/media-lifecycle.json`,
14. `apps/mobile/public/wrn-mobile-media/v1/media-revocation.json`,
15. `apps/mobile/public/wrn-mobile-media/v1/episode-local.wav`,
16. `apps/mobile/public/wrn-mobile-media/v1/episode-local.png`,
17. `apps/mobile/public/wrn-mobile-media/v1/episode-local.txt`,
18. `tests/e2e/g3-021-media-catalog-store-harness.ts`,
19. `tests/e2e/g3-021-media-catalog-store.spec.ts`,
20. `docs/evidence/WRN-G3-021/P2-DATA-ADMISSION-RIGHTS.md`,
21. `docs/handoffs/WRN-G3-021-p2-data-admission-rights.md`.

Kein separates Generator-/Hashmanifest ist erlaubt. Assetgeneratorpraeimage
ist Node `24.19.0` und folgende bytegenaue Spezifikation:

- WAV: 1644 Bytes; RIFF/WAVE PCM, mono, 8000 Hz, 16-bit, 800 Nullsamples,
  100 ms; SHA-256
  `c726d333dd159a31423f3480dbb1c5c4a9dfcd30efe1f7e12ade390dc92e8908`.
- PNG: 79 Bytes; 2x2 RGBA8, non-interlaced; Reihe 1 Magenta `#ff2f6d`,
  Cyan `#28d7e7`, Reihe 2 Cyan, Magenta; Filterbyte 0 je Reihe; zlib Level 9;
  exakte Base64bytes
  `iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mP4r5/7X+P68/8MIALEAQBgLQr/rXvY1gAAAABJRU5ErkJggg==`;
  SHA-256
  `65479503f1dc2208b5a90912e728e95c17daab9e041f3efe6df6d077c13219fd`.
- TXT: exakt UTF-8 `WRN local media fixture.\n`, 25 Bytes; SHA-256
  `ab5596429ec71dd956a264ad8beb93d42ed9e41bd480ff52b9f4c059454d6041`.

Writerbeleg muss Generator-/Nodeversion, Bytes und diese drei Sollhashes sowie
alle sieben JSON-Bytes/-Hashes und den Releasepin nennen. Abweichung = Stop.

## R1-06 – JSON-MIME und literale Pfade

Die sieben JSON-Pfade sind exakt die Allowlistpositionen 8 bis 14. Vor jeder
URL-Konstruktion muss der String literal einem dieser sieben Werte
entsprechen. Query, Fragment, Credentials, Backslash, Prozentzeichen,
Dotsegment, Protokoll-/Originwechsel und Normalisierungsabweichung sind
fail-closed. `redirect`, unerwartete 206-/Rangeantwort und anderer Endpfad
sind Fehler vor Decode/Persistenz.

JSON-Content-Type wird ASCII-case-insensitive geparst. Erlaubt ist nur
`application/json` ohne Parameter oder mit genau einem Parameter
`charset=utf-8`; Whitespace um Semikolon/Gleichheitszeichen darf getrimmt
werden. Andere, doppelte oder zusaetzliche Parameter sind invalid. Asset-MIME
bleibt exakt `audio/wav`, `image/png` oder `text/plain;charset=utf-8`.

## R1-07 – ehrlich deferred

Geschlossen werden nur Vertrag und selbst erstellte lokale Fixtures. Reale
Quellen, Alias/Nachfolge, Feeds, echte Audio-/Bild-/Transkriptrechte,
Streaming, Download, Provider, Egress/Storage, Generierung, Moderation und
deren Warnschwellen/Hard-Caps/Retention/Fallback sind **deferred und
ungeprueft**. Keine reale Quelle ist admitted. Vor jeder solchen Erweiterung
braucht es einen eigenen Quellenpass, Rechte-/Privacy-/Security-/Kostenvertrag
und ein sichtbares PO-Gate. Lokales P2-GREEN darf nie als dieses GREEN gelten.

## R1-08 – Recheck- und Writergate

1. Chief sichert diesen Nachtrag und bindet dessen vollen Commit im Register.
2. Ein frischer unabhaengiger Sol-P1-R1 prueft P2+R1 gegen alle sechs Findings.
3. Nur null offene Findings erlauben einen separaten Chief-Gatecommit.
4. Dieser Gatecommit bindet vollen Recheck-SHA, Writerbasis, sauberen Status,
   21-Pfad-Allowlist, Rechte und Abbruchregel.
5. Erst dann genau ein Terra/high-Backend-/Data-Writer, keine Kinder.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R1-CONTRACT-COMPLETION`
- Status: rein dokumentarisch; P2 weiterhin gesperrt
- Adressiert im Nachtrag: P1-R-M-001 bis M-004, L-001 und L-002
- Deferred/ungeprueft: reale Quellen/Medien/Provider/Kosten
- Rechte: keine Produkt-/Test-/Fixture-/Asset-/Browserrechte
- Naechster Schritt: Commitbindung, dann frischer Sol-P1-R1
- END-CHECK: :)
