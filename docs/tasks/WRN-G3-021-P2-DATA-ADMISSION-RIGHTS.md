# WRN-G3-021 P2 – Medien-Daten, Admission, Rechte und Safety

Status: **CHIEF-SYNTHESE GEBUNDEN – P2 BIS FRISCHEM SOL-P1-R-GREEN GESPERRT**

## Gate und normative Quellen

- PO-100 startete G3-021 mit exakt `START WRN-G3-021`.
- Startcommit: `c6656f2be780951ce98917e3b59a4ef502811265`.
- P1-L, P1-T und P1-S sind im Commit `29941c2` read-only beendet.
- Die Abschnitte C-01 bis C-20, Gate-/Writertrennung, Pflicht-Negativmatrix
  und Boundary-Hashes aus
  `docs/evidence/WRN-G3-021/P1-S-ARCHITECTURE-PRIVACY.md` sind normativer
  Bestandteil dieses Pakets. Die numerischen Entscheidungen und die exakte
  Allowlist dieses Dokuments praezisieren sie. Bei Widerspruch gilt die
  strengere fail-closed-Regel; der Writer stoppt beim Chief.
- Vor einem frischen unabhaengigen Sol-P1-R-GREEN bestehen keine Produkt-,
  Test-, Fixture-, Browser- oder Assetrechte.

## P2-Ziel

P2 erstellt ausschliesslich einen additiven, Mobile-only, providerfreien
Medienkatalogkern. Er kennt nur selbst erstellte, paketierte, endliche lokale
Testmedien. P2 baut noch keinen sichtbaren Hub und keinen Player. Website,
Shared Reader v1, bestehende Content-/Reader-/Termin-/Preference-Stores und
App-UI bleiben byteunveraendert.

## C-01 bis C-20 – verbindliche Ausfuehrungsregeln

### Identitaet, Release und Vertrauensgrenze

- **C-01 Klassen:** v1 repraesentiert nur `packaged-local-audio` und optional
  `packaged-local-thumbnail`/`packaged-local-transcript`. Radio, Livestream,
  Video, externe URL, Download, Generierung, Transcoding und Provider sind im
  Schema unrepresentierbar und OUT.
- **C-02 IDs:** getrennte lower-case-ASCII-Namespaces fuer Release, Source,
  Series, Episode und Asset; maximal 128 Zeichen; stabil, opak, nie aus
  sichtbarem Text oder Position erzeugt und nie wiederverwendet. Grammatik:
  `^wrn-media-(release|source|series|episode|asset)-[a-z0-9]+(?:-[a-z0-9]+)*$`.
  Alias und Nachfolger bleiben same-namespace, eindeutig, zyklenfrei und
  deterministisch. Ein Nachfolger ersetzt Resume spaeter nie still.
- **C-03 Rootpin:** ein buildgebundener Pin ausserhalb der JSON-Dokumente
  bindet Pfad `/wrn-mobile-media/v1/mobile-media-release.json`, Contract
  `1.0.0`, positive Releaserevision und SHA-256 der exakten Transportbytes.
  Kein Request ohne exakten Pin; kein bewegliches `current`.
- **C-04 Releaseumschlag:** Schema `wrn.mobile-media-release.v1`; Exact-keys;
  bindet genau sechs Required-Dokumente mit festem same-origin Pfad,
  Dokumentklasse, Contractversion, Revision, Bytes, SHA-256, Recordcount,
  Compatibility und gemeinsamem `revocationFloor`. Fehlend, extra, doppelt,
  widerspruechlich oder nicht hashgleich verwirft den ganzen Candidate.
- **C-05 Authentizitaet/Future:** Buildpin und elementweise Assethashes sind
  die einzige lokale Vertrauensgrenze. Keine Remote-Signatur wird behauptet.
  Future-Dokument-/Storeschema bleibt bytegleich read-only und wird als
  `protected` gemeldet; kein Normalize, Migrate, Clear oder Overwrite.

### Sechs gemeinsam gebundene Dokumentvertraege

Die sechs Required-Dokumente sind exakt:

1. `media-manifest.json` / `wrn.mobile-media-manifest.v1`,
2. `media-admission.json` / `wrn.mobile-media-admission.v1`,
3. `media-rights.json` / `wrn.mobile-media-rights.v1`,
4. `media-consent.json` / `wrn.mobile-media-consent.v1`,
5. `media-lifecycle.json` / `wrn.mobile-media-lifecycle.v1`,
6. `media-revocation.json` / `wrn.mobile-media-revocation.v1`.

- **C-06 Admission:** Exact-keys; Source-ID, getrennte Selbstbeschreibung und
  redaktionelle Einordnung, neunsprachiger Anzeigename oder explizit
  `unavailable`, Sprache, Region, Healthzeit/-status, Deliveryklasse,
  Admissionrevision, `validFrom`, `validUntil`, Owner sowie beschrifteter
  Korrektur-/Takedownkontakt. Nur `admitted-local-fixture` ist zulaessig;
  unknown, stale oder abgelaufen ist fail-closed.
- **C-07 Rechte:** Audio, Thumbnail und Transkript besitzen getrennt Asset-ID,
  SHA-256, Rightsstatus, Lizenz, Attribution, Territorium, Offline-/Cache-
  Erlaubnis, Ablauf, Provenienz und Korrekturkontakt. Nur
  `self-authored-local-fixture` mit lokaler Offline-/Cache-Erlaubnis ist
  zulaessig. Missing, unknown, expired oder inkompatibel entfernt das Element
  vor Projektion. Artikel-/Markenrechte werden nie geerbt.
- **C-08 Consent:** referenziert exakte Episode, Deliveryklasse, Origin und
  Datenkategorien. `local-no-third-party` erzeugt keinen Dialog und keinen
  externen Request. Andere Klassen sind schema-unrepresentierbar. Kein
  globales Origin-Opt-in und kein rueckwirkender Widerrufsanspruch.
- **C-09 Privacy:** keine persoenliche ID, Cookies/Credentials, Hoerhistorie,
  Inhalts-/URL-/Resume-/Consentlogs, Analytics, Telemetrie oder aus Inhalt
  abgeleitete Correlation-ID. Fehler nur als endliche sichere Kategorie.
- **C-10 Exact-cover:** jede Episode referenziert genau eine admitted Source,
  genau eine Series, genau ein Audioasset und hoechstens je ein vorhandenes
  Thumbnail/Transkript. Jedes sichtbare Element besitzt Rechte und
  Provenienz. Verwaist, doppelt, zirkulaer, extra oder fehlend verwirft den
  ganzen Candidate.

### Aktivierung, Safety und spaetere Resumegrenze

- **C-11 Atomar:** Transport-, Decode-, Parse-, Hash-, Schema-, Reference-,
  Rights-, Consent-, Cap- und Futurefehler erzeugen null Teilstand. Eigene DB
  `wrn-mobile-media-catalog-v1` mit Stores `mediaBundles`, `mediaControl` und
  `mediaSafety`; maximal `active|candidate|previous`. Candidatebau und
  Slotwechsel sind je genau eine abgeschlossene IndexedDB-Transaktion.
- **C-12 Safety:** monoton, persist-before-activate/-rollback/-render/-play,
  gecappter Merge vor Write, Replacement-Exact-cover, Readback und Generation
  `+1` pro erfolgreicher oeffentlicher Mutation. A/B/A, Neustart, alter Cache,
  Approllback und Content-Clear senken Safety nie. `blocked|gone|replaced`
  sperrt auch noch paketierte Bytes.
- **C-13 LKG:** Last-known-good wird nur bei gueltiger Admission, Rechten,
  Consent und ohne bekannte Sperre projiziert. Rightsablauf oder bekannte
  Revocation sperrt LKG. Offline nie empfangene Sperren werden nicht
  vorgetaeuscht; beim naechsten Update gilt Safety vor weiterer Wiedergabe.
- **C-14 Resume-P3-Grenze:** P2 speichert keinen Resumezustand. P3 muss eine
  getrennte DB mit Assetrevision/-hash und Episode-ID, maximal 64 Records,
  64 KiB gesamt und 4096 UTF-8-Bytes je Record verwenden. Future/corrupt
  bleibt protected/read-only; fremde Stores bleiben unveraendert.
- **C-15 Loeschung:** P2 bietet nur enges Loeschen eigener Candidate-/Previous-
  Daten; Safety wird nie mitgeloescht. Ein spaeteres `Alle lokalen
  Mediendaten loeschen` muss Katalog und Resume getrennt lesen/zurueckmelden;
  Teilerfolg darf nie als voller Erfolg erscheinen.

### Player-, Netzwerk-, Kosten- und UI-Grenzen

- **C-16 Player-P3-Vertrag:** States exakt `idle`, `loading`, `ready`,
  `playing`, `paused`, `ended`, `error`, `blocked`, `offline`; kein Autoplay
  und kein `src`/Decoder vor
  sichtbarer Aktion. Run-ID, Abort und Mounted-Guard gelten in Resolve und
  Catch. Revocation, Consentwiderruf, Medienwechsel, Clear und Unmount stoppen
  und verhindern spaete Mutation.
- **C-17 Netzwerk/MIME:** nur feste same-origin Pfade unter
  `/wrn-mobile-media/v1/`; `credentials: omit`, `redirect: error`,
  `referrerPolicy: no-referrer`, kein Sniffing. Audio exakt `audio/wav`,
  Thumbnail exakt `image/png`, Transkript exakt `text/plain;charset=utf-8`.
  Kein Range, Remote-CSP-Origin, Wildcard, iframe, Poster-Hotlink oder
  Service-Worker-Mediencache.
- **C-18 Kosten/Kill-switch:** lokaler Slice = 0 CHF Runtimekosten, null
  Provider/API/Feed/Generierung/Transcoding. Jede spaetere Adapterklasse ist
  initial deaktiviert und benoetigt eigenes PO-/Security-/Rechte-/Kosten-
  Gate; Gate-/Cap-/Counterfehler erzeugt null Side Effect.
- **C-19 UI/A11y:** P2 aendert keine UI. P4 muss Exact-cover fuer
  `en,de,es,fr,it,pt,ru,el,tr`, EN-Erststart, vorhandenen Sprachkey,
  Tastatur/Screenreader/Fokus, 44x44 px, vier Themes, `320x568`, `390x844`,
  `600x960`, `844x390`, Reduced Motion und 200-%-Reflow pruefen.
- **C-20 Entkopplung:** Map/Game, Geo/Position, Website, Shared Reader v1,
  bestehende Content-/Reader-/Termin-/Preference-Stores, Provider und neue
  Runtimepakete bleiben vollstaendig OUT.

## Exakte numerische Caps und Pruefreihenfolge

Pruefreihenfolge vor jeder Persistenz: Pin -> HTTP/Transportcap ->
Whole-document-Hash -> Strict-UTF-8/BOM -> Parse -> Exact-keys/Schema/
Compatibility -> Komponentenhashes/Referenzen -> Rechte/Consent/Safety ->
Record-/Asset-/Aggregatcaps -> atomarer Write -> Readback.

- jeder JSON-Transport und jedes dekodierte JSON: 524288 Bytes;
- Summe der sechs dekodierten Required-Dokumente: 524288 Bytes;
- Sources 32, Series 8, Episodes 32, Assets insgesamt 64;
- je Episode exakt ein Audio, hoechstens ein Thumbnail und ein Transkript;
- Audio 262144 Bytes, Dauer 1 bis 60000 ms;
- Thumbnail 131072 Bytes, Breite/Hoehe je 1 bis 2048, Flaeche max. 4194304;
- Transkript 32768 UTF-8-Bytes, Plain text ohne HTML/Markdown/Controlchars;
- Aggregat aller drei Assets einer Episode 425984 Bytes;
- Safety 65536 UTF-8-Bytes und 512 Eintraege;
- drei Bundlepayloads `active|candidate|previous`;
- IDs 128 ASCII-Zeichen; sichtbarer Kurztext 2048 UTF-8-Bytes,
  Anzeigename/Titel/Attribution/Kontakt je 512, lokaler Pfad 512;
- Requesttimeout 5000 ms; Redirect, Rangeantwort, fehlendes/abweichendes MIME,
  fehlendes `content-length` mit chunked over-cap und Decoderfehler sind
  fail-closed.

Diskret erreichbare Caps brauchen `limit-1`, `limit`, `limit+1`. Bei
gekoppelten Grenzen sind Gegenachse 1, Equal-Fall und Redundanzinvarianten
Pflicht; mathematisch unerreichbare isolierte Faelle werden ehrlich als
Invariante statt als Fake-Test dokumentiert.

## Exakte P2-Allowlist

Nach P1-R-GREEN darf genau ein `backend_data_reliability_engineer` Terra/high
ohne Kinder ausschliesslich schreiben:

1. `packages/content-contracts/package.json` – nur additiver Subpath,
2. `packages/content-contracts/src/mobile-media-v1.ts` – neu,
3. `packages/content-contracts/tests/mobile-media-v1.test.ts` – neu,
4. `apps/mobile/src/mobile-media-release.ts` – neu,
5. `apps/mobile/src/mobile-media-release.test.ts` – neu,
6. `apps/mobile/src/mobile-media-catalog-store.ts` – neu,
7. `apps/mobile/src/mobile-media-catalog-store.test.ts` – neu,
8. `apps/mobile/public/wrn-mobile-media/v1/mobile-media-release.json` – neu,
9. die sechs oben exakt benannten JSON-Dokumente im selben neuen Verzeichnis,
10. genau eine selbst erstellte WAV-, eine PNG- und eine TXT-Fixture dort,
11. `tests/e2e/g3-021-media-catalog-store-harness.ts` – neu,
12. `tests/e2e/g3-021-media-catalog-store.spec.ts` – neu,
13. eigene P2-Evidence und eigenes P2-Handoff.

Fixtures muessen reproduzierbar erzeugt oder bytegenau dokumentiert, lokal,
harmlos, rechtefrei durch Eigenerstellung, hashgebunden und unter den Caps
sein. Kein Alt-App-/AAB-/Internetasset darf kopiert werden.

Ausdruecklich OUT: Contract-Index, Domain/Test-Support, `App.tsx`, CSS,
UI-Sprache, vorhandene Reader-/Content-/Termin-/Preference-/Websitepfade,
Root/Lock/Config, fremde E2E-Specs, Dependencies, Worker, Provider,
Recherche/Feeds, Hosting/Live und Release. Zusaetzlicher Pfad = Stop.

## Pflicht-Negativmatrix

1. Exact-keys, Typen, IDs, Duplikate, Alias-/Nachfolgerzyklen, verwaiste/
   extra Referenzen und kompletter Candidate-Abbruch.
2. Missing/falscher Pin, no-request ohne Pin, Strict-UTF-8, BOM, Parse,
   Compatibility, Whole-/Component-/Assethash, Required/Optional/Future.
3. Admission unknown/stale/expired; getrennte Einordnung; Rechte je Element
   missing/unknown/expired/territory/offline-inkompatibel; null Projektion.
4. Safety lower/equal/conflict/higher, cap vor Write, Replacementcoverage,
   persist-before, Readback, A/B/A, Neustart, alter Cache, Rollback, Clear.
5. Null Requests vor Nutzeraktion inklusive src/poster/preload/prefetch/
   preconnect/iframe; Credentials/Referrer/Redirect/MIME/chunked/Timeout/
   Abort/Decoder/Range.
6. Atomare active/candidate/previous-Pfade, Transaktions-/Quota-/Abortfehler,
   Future-Raw-Erhalt, LKG bei Rightsablauf/Revocation blockiert.
7. alle numerischen Capgrenzen samt kombinierten Invarianten und maximalem
   Thumbnail-Equal-Fall.
8. null Analytics/Telemetry/Console-/Content-/URL-/Consentlog und null
   Provider-/Kosten-/Generierungseffekt bei jeder Ablehnung.
9. beide relevanten Typechecks, Contract-/Mobileunits, echte Browser-IDB,
   19 Boundaries, Fixture-/Releasehash, Format/Lint und Diffcheck.
10. P3/P4 vorgemerkt: Consent-/Lifecycle-Late-results, Resumegrenzen,
    neun Sprachen, A11y, Themes, Viewports, Reduced Motion und Reflow.

## Eingefrorene Boundary-Hashes

Auf Basis `c6656f2` und weiterhin auf `29941c2` gelten:

- Contract-Index `6dc6288929c199932c346de185b4b871b1e5e06da5a0b9051f8162ee56e4a263`
- Regional-Events-Vertrag `ca3026422975b83294c4b968354803fe038e92eeb39a2986925974229e249f47`
- Content-Offline-Store `c1dcc87c0caddb42d6f8b5559b1eea05d915841f473edafb0bbc8d09edfa6699`
- Content-Offline-Controller `d60702a56a3e7e2b49ee788a49398c2be1352a09b30d3d90b889321a4f9f0547`
- Regional-Events-Store `2f37ca753e8adcb0e454d466f67769d601cab9a751e99a67cd88bd43cdf5e55e`
- Local-Reading-State `23202ae7e9d3ce7b13b179184dfaf4b963407be81d3b47251ce5cc3b29d237ab`
- UI-Language-Preference `1e6e860ebd6609850d800066bf98e085440526007ce35742fc591c83fc6bf0ac`
- UI-Language-Package `a0f242d6904753495f79d696688ce6aebf93ae932c945a98a8aa2b9cfbb9244a`
- Mobile-App `209b32ba0f4d69eb9128d97f34391e69393f9212624ff547d2ae4c2210f3b611`
- Website-App `16ef0995ea766a0818f247d1a6296f4b9b339d4dd470fcb50574314518382382`

Alle zehn bleiben in P2 bytegleich. `packages/content-contracts/package.json`
ist die einzige additive Bestandsdatei und braucht eigenen Vor-/Nachhash.

## Sequenz und Stopregeln

1. Frischer unabhaengiger Sol-P1-R prueft dieses Paket gegen P1-L/T/S.
2. Nur bei null offenen Findings setzt der Chief P2 schreibbar.
3. Genau ein Terra/high-Backend-/Data-Writer, keine Kinder oder Parallelwrites.
4. Writer committet und gibt Rechte zurueck; Chief reproduziert alles.
5. Frische Terra-QA, versiegelter Sol-Security-/Privacy-Diffscan und finaler
   Sol-P2-Architekturabschluss.
6. Erst nach gesichertem P2-GREEN wird P3 Player/Lifecycle/Consent/Resume
   separat gebunden; App-UI folgt als P4. Findings erzeugen enge neue Pakete.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-DATA-ADMISSION-RIGHTS`
- Status: Chief-Synthese gebunden; Produktwrite gesperrt
- Basis: Start `c6656f2`, P1-Belege `29941c2`
- Findings adressiert: P1-S-M-001 bis P1-S-M-005 sowie P1-L/T-YELLOW-Punkte
- Rechte: keine Produkt-/Test-/Fixture-/Browserrechte vor P1-R-GREEN
- Naechster Schritt: frischer unabhaengiger Sol-P1-R
- END-CHECK: :)
