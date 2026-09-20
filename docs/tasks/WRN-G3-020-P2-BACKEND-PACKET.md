# WRN-G3-020 P2 – Daten-/Vertragskern

Status: **VERTRAGSKORREKTUR GEBUNDEN – P2 BIS P1-R-GREEN GESPERRT**

Praezisierung: Der erste P1-R-Recheck `ab2644b` fand vier weitere
Ausfuehrungsluecken. `docs/tasks/WRN-G3-020-P2-R1-CONTRACT-COMPLETION.md`
bindet sie enger und hat bei Abweichung Vorrang. P2 bleibt bis P1-R1-GREEN
gesperrt.

## Gate und normative Quellen

- PO-098 startete G3-020 mit exakt `START WRN-G3-020`.
- P1 `7793919` ist YELLOW mit `P1-M-001` bis `P1-M-004`.
- Die Abschnitte `C-01` bis `C-20`, `Exakt empfohlene P2-Allowlist`,
  `Pflicht-Negativmatrix fuer P2` und `Gate- und Reviewfolge` aus
  `docs/evidence/WRN-G3-020/P1-ARCHITECTURE-PRIVACY.md` im unveraenderten
  Commit `7793919ca4b495fcec555ea8a8c654e82af655e4` sind normativer Bestandteil
  dieses Pakets. Bei Widerspruch gilt die strengere fail-closed-Regel; der
  Writer stoppt beim Chief und entscheidet nicht selbst.
- Vor einem frischen unabhaengigen Sol-P1-R-GREEN bestehen keine Produkt-,
  Test-, Fixture- oder Browserrechte.

## P2-Ziel

Ein additiver, Mobile-only, providerfreier Terminvertrag mit selbst erstellter
lokaler Fixture. P2 baut noch keine sichtbare App-Oberflaeche. Website,
Shared Reader v1, bestehende Content-/Offlinepfade, G3-017-Praeferenzen und
App-UI bleiben byteunveraendert.

## Verbindliche C-01 bis C-20

### Identitaet, Hierarchie und Dedupe

- **C-01:** IDs sind lower-case ASCII, maximal 128 Zeichen, nie aus Anzeige-
  text/Position erzeugt. Exakte Praefixe und Grammatik:
  `^wrn-(cont|country|region|event|source)-[a-z0-9]+(?:-[a-z0-9]+)*$`;
  Namespace-intern eindeutig, publizierte IDs nie wiederverwenden.
- **C-02:** Land referenziert genau einen vorhandenen Kontinent, Region genau
  ein vorhandenes Land; Arrays kanonisch nach ID. Anzeigenamen decken exakt
  `en,de,es,fr,it,pt,ru,el,tr`, EN als Basis. Kollision, unbekannter Parent
  oder fehlende Sprache verwirft das Bundle.
- **C-03:** `alias|successor` nur innerhalb eines Namespace, eindeutige Source,
  existierendes Target und azyklischer Graph. Alias kanonisiert, aendert den
  gespeicherten Rawwert nicht automatisch. Successor ist neue Identitaet und
  verlangt eine neue bewusste Auswahl.
- **C-04:** Dedupe nur durch kanonische `eventId`, niemals Titel/Ort/URL/Zeit.
  `contentRevision` ist positiv und monoton; gleiche Revision verlangt gleichen
  Hash, Konflikt oder Rueckgang verwirft den ganzen Kandidaten.

### Zeit, Status und Projektion

- **C-05:** `startInstant`/optionales `endInstant` sind kanonische UTC-Strings
  `YYYY-MM-DDTHH:mm:ss.sssZ`; Ende nicht vor Start. `timeZone` ist kanonischer
  IANA-Name. Lokaler Sekundenwert und `utcOffsetMinutes` `-840..840` belegen
  Start/Ende.
- **C-06:** Instant wird in IANA-Zone formatiert und muss Wall-clock plus
  effektiven Offset bytegleich reproduzieren. Gap, fehlender/falscher Offset,
  unbekannte/nichtkanonische Zone oder Widerspruch verwirft das Bundle. Fold
  ist nur mit explizitem Instant und passendem Offset gueltig.
- **C-07:** Eventstatus nur `scheduled|changed|cancelled`; Safety/Revocation
  bleibt getrennt und vorrangig. `observedAt`, `publishedAt`, Revision, Hash
  und `validUntil` sind Pflicht. `generatedAt <= validUntil`, maximal sieben
  Tage. Cancelled/stale/blocked erscheinen nie als kommende Termine.
- **C-08:** Mit injiziertem Referenz-Instant: nicht widerrufene
  `scheduled|changed`, `start >= reference`, gueltige Freshness; Sortierung
  exakt `(start epoch ms, eventId ASCII)`, dann `slice(0,5)`. Ehrliche Zustaende
  `ready-1..5|empty|offline-lkg|offline-none|invalid-update-lkg|protected|stale|error`.
  Getrennte hoechstens fuenf Lifecycleeintraege; blocked zeigt nur ID und
  sichere Statuskategorie. Kein Auffuellen.

### Pin, Aktivierung, Revocation und lokale Auswahl

- **C-09:** Schema `wrn.mobile-regional-events.v1`, Contract `1.0.0`, fester
  same-origin Pfad `/wrn-mobile-regional-events/v1/mobile-regional-events.json`.
  Buildexterner Pin bindet Pfad, Revision und SHA-256 des Transportdokuments.
  Ohne exakten Pin kein Request. Transportcap/Whole-document-Hash vor Parse;
  danach Exact-keys, Schema, Compatibility, interne Hashes, Referenzen/Caps.
- **C-10:** Jeder Fehler verwirft Candidate atomar. Eigener Mobile-Eventstore
  mit hoechstens `active|candidate|previous` plus Control/Safety; Bau und
  Slotwechsel je abgeschlossene IndexedDB-Transaktion. Last-known-good bleibt.
- **C-11:** Monotones Safetyledger mit Revision und sortierten Namespace/ID/
  optional Hash/`blocked|gone|replaced`. Persist-before-activate/-rollback;
  Writefehler, Future/corrupt Safetyraw oder Rueckgang blockiert. A/B/A,
  Neustart, Cache und Content-Clear reaktivieren bekannte Sperren nicht.
- **C-12:** Future Bundle-/Storeschema bleibt bytegleich read-only. Storage-
  full, Permission, Abort, Transaktionsabbruch und Readbackabweichung enden
  ohne Erfolg und ohne Verlust neuerer Daten.
- **C-13:** Auswahlkey exakt `wrn.mobile-regional-events-selection.v1`; Exact-
  keys `contractVersion:1`, `schema`, `revision`, `regionId`; 4096 UTF-8-Bytes.
  Missing=`inactive`; Future/malformed/over-cap=`protected` mit Raw-Erhalt.
  Save: Expected-load, Pre-read, Storage-Invalidierung, genau ein `setItem`,
  validierter Readback, kein Auto-Retry. Clear nur eigener Key plus Nullreadback.
- **C-14:** Auswahl, Eventstore, G3-017-Praeferenzen und Content-v1-Store sind
  getrennt. Contentupdate/-rollback/-clear oder Takedown aendert Auswahl nicht.
  Keine Geolocation, Permission, IP, Cookie, URL/Hash, Telemetrie, Analytics,
  Console- oder Fehlerlogsenke erhaelt Auswahl-/Raw-/Standortwerte.

### Caps, Rechte, sichere Ausgabe und Medien

- **C-15:** Transport und dekodiertes JSON je 512 KiB; Kontinente 8, Laender
  256, Regionen 2048, Quellen 512, Events 4096, Identitaetslinks 4096,
  Revocations 512; sichtbarer Name/Titel/Ort je 512 UTF-8-Bytes,
  Kurzbeschreibung 2048, URL 2048; je Event ein Medium, je Bundle 64;
  Safetyledger maximal 64 KiB/512 Eintraege; drei Bundlepayloads. Jede
  erreichbare Grenze testet limit-1/limit/limit+1 plus Redundanzinvarianten.
- **C-16:** Quelle: ID, neun Namen oder explizit `und`, Original-URL,
  Rechte-/Provenienzreferenz, observed/published und beschrifteter Korrektur-/
  Takedownkontakt. Event referenziert vorhandene Quelle und eigene Rechte/
  Provenienz. Unbekannte/fehlende Rechte sind fail-closed.
- **C-17:** Nur absolute HTTPS-URLs ohne Credentials; Fixtures nur `.invalid`.
  Kein Autoabruf/Prefetch/Preview/Hotlink. Spaetere bewusste Oeffnung nur mit
  `noopener`/`noreferrer`. Alle Inhalte Plain text; kein HTML/Markdown/
  `dangerouslySetInnerHTML`/`javascript:`. Kontakt bleibt Text.
- **C-18:** Optionales Medium braucht lokale Asset-ID/Pfad, MIME, Bytes,
  Dimensionen/Flaeche, SHA-256, Alttext+Provenienz, Rechte/Lizenz/Attribution.
  Nur `self-authored-local-fixture`, lokal gepackt; sonst kein Slot/neutraler
  Placeholder. Caps 256 KiB, 2048x2048, 4_194_304 Pixel. Echte Medien OUT.

### Spaetere UI- und Kostengrenzen

- **C-19:** P3 bindet neun Sprachen, EN-Erststart, Auswahlpersistenz,
  deterministischen Fokus/Rueckfokus, Screenreader/Tastatur, 44x44 px, vier
  Themes, `320x568|390x844|600x960|844x390`, 200%-Reflow ohne Overflow.
  P2 aendert keine UI.
- **C-20:** Keine Dependency, Runtimeprovider, API, Feed, Geocoding, Map,
  Tile- oder Gamebibliothek und keine Kosten. `locationId` bleibt spaeter
  opak. Keine Koordinate/Nutzerposition. App/Website konsumieren einander
  nicht; Shared-v1 und Website bleiben byteunveraendert.

## Exakte P2-Allowlist

Genau ein `backend_data_reliability_engineer`/Terra-high darf erst nach
P1-R-GREEN ausschliesslich schreiben:

1. `packages/content-contracts/package.json` – nur additiver Export,
2. `packages/content-contracts/src/mobile-regional-events-v1.ts` – neu,
3. `packages/content-contracts/tests/mobile-regional-events-v1.test.ts` – neu,
4. `apps/mobile/src/mobile-regional-events.ts` – neu,
5. `apps/mobile/src/mobile-regional-events.test.ts` – neu,
6. `apps/mobile/src/mobile-regional-events-store.ts` – neu,
7. `apps/mobile/src/mobile-regional-events-store.test.ts` – neu,
8. `apps/mobile/src/mobile-regional-events-selection.ts` – neu,
9. `apps/mobile/src/mobile-regional-events-selection.test.ts` – neu,
10. `apps/mobile/public/wrn-mobile-regional-events/v1/mobile-regional-events.json` – neue selbst erstellte lokale Fixture,
11. verpflichtend `tests/e2e/g3-020-regional-events-store-harness.ts` – neu,
12. verpflichtend `tests/e2e/g3-020-regional-events-store.spec.ts` – neu,
13. eigene P2-Evidence und ein P2-Handoff.

Ausdruecklich OUT: Contract-Index, Domain/Test-Support, `App.tsx`, CSS,
UI-Sprache/Main, G3-017, Reader-v1/v2, Content-Offlinecontroller/-store,
Public-v1, Website, Root/Lock/Config, fremde E2E-Specs, Dependencies,
Provider, Worker, Hosting/Live und Release. Zusaetzlicher Pfad = Stop.

## Eingefrorene Boundary-Hashes

Diese Pfade muessen nach P2 bytegleich bleiben:

- Contract-Index `6dc6288929c199932c346de185b4b871b1e5e06da5a0b9051f8162ee56e4a263`
- Mobile local-content-release `cb2fa06fd6c94f8b078030ab5eecd81031b178647d653d99fd56ef6ca94a9df4`
- Mobile content-offline-store `c1dcc87c0caddb42d6f8b5559b1eea05d915841f473edafb0bbc8d09edfa6699`
- Mobile content-offline-controller `d60702a56a3e7e2b49ee788a49398c2be1352a09b30d3d90b889321a4f9f0547`
- G3-017 local-personalization-state `2a6944c6b2e3338e88ee657a76a51085c77264b79df6b25929f53281dc01beb7`
- Mobile Reader-v2 `7cc34081151f0d0a9018638cf93cbf586a88510aa12d990034fdca463f688466`
- Website local-content-release `4a0c8e651d9549ace0ba75cdfdef30b02ff5b96657cde96e0c3a51a1e73c6a01`

## Pflicht-Negativmatrix

P2 muss die neun Gruppen des P1-Berichts vollstaendig abdecken:

1. Exact-keys/ID/Parent/Sprachen/Alias/Successor/Dedupe;
2. UTC/IANA/Gap/Fold/Offset/Wall-clock/Ende/Start-gleich-Referenz;
3. Status/Freshness/0-1-4-5-6/gleiche Startzeit und stabile Ordnung;
4. Pin/no-request/HTTP/Abort/chunked Stream/Transport+Decode/Hashes/Caps;
5. Active/Candidate/Previous/Neustart/A-B-A/Transaktionsfehler/Future/LKG;
6. Revocation Revision/Merge/persist-before/A-B-A/Neustart/Clear;
7. Auswahl 4095/4096/4097, stale Saves, Storageevent, Readback, Fremdkeys;
8. URL/HTML/Controltext/Rechte/Remote-Medium sowie null Geo/Logs/Tracking;
9. beide Typechecks, Units, falls noetig echte Browser-IDB, 19 Boundaries,
   Fixtureprovenienz, Releaseboundary, Prettier, Diffcheck und Hashbelege.

## Sequenz und Stopregeln

1. Frischer unabhaengiger Sol-P1-R prueft dieses Paket gegen alle Findings.
2. Nur bei null offenen Findings setzt der Chief S2 auf schreibbar.
3. Genau ein Terra/high-P2-Writer, keine Kinder/parallelen Produktwriter.
4. Writer committet, uebergibt Rechte; Chief reproduziert Scope/Tests/Hashes.
5. Danach frische Terra-QA, Sol-Securitydelta und finaler Sol-P2-Abschluss.
6. P3 bleibt bis zum gesicherten P2-GREEN gesperrt.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-Vertrag
- Status: dokumentarisch gebunden; Produktwrite gesperrt
- Basis: P1 `7793919`
- Findings adressiert: P1-M-001 bis P1-M-004 durch C-01 bis C-20
- Offen: frischer P1-R-Recheck
- Rechte: keine Produkt-/Test-/Fixture-/Browserrechte
- Naechster Schritt: Sol-P1-R
- END-CHECK: :)
