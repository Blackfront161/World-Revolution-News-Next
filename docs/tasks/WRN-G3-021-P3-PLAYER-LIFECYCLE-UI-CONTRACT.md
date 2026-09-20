# WRN-G3-021 P3/P4 – Player-Lifecycle-, Resume- und Mobile-UI-Vertrag

Status: **ZUR UNABHÄNGIGEN SOL-PRÜFUNG GEBUNDEN – KEIN WRITER-GATE**

## 1. Freigabe, Basis und Reihenfolge

- Product-Owner-Fortsetzung: `ok fahre fort bitte` nach technisch GREENem P2;
  sie erlaubt diese sichere Vorbereitung, aber keinen Produktwrite.
- Feste Vertragsbasis: `46b20d40afbdc629ad95dd2bb658dc4813ae4079`.
- P2-Produktbasis: `c096d7d6ccfdb8bc08225c757bcf8cb86e101517`.
- P2-Evidencebasis: `93496e0f307ac3a7701d8531d74b01f64cd9bef0`.
- Zuerst P3-A: headless Player/Lifecycle, Assetenforcement und Resume.
- Erst nach vollständigem P3-A-GREEN folgt P4-B: sichtbare Mobile-Projektion,
  Sprache und Visual-/Accessibility-Belege.

Ein frischer unabhängiger Sol/high-Architektur-/Privacy-Recheck muss diesen
Vertrag mit null High-, Medium-, Low-, Privacy-, Coverage- oder deferred
Findings bestätigen. Vor dessen GREEN und einem danach separat gebundenen
Writer-Gate gibt es kein Produkt-, Test-, Fixture- oder Browser-Schreibrecht.

## 2. Verbindliche Quellen und geschlossene Vorfindings

Dieser Vertrag bindet gemeinsam:

1. `P3-P0-S-M-001`: Active-Snapshot, aktuelle Uhr, Rights und Safety an jeder
   Render-, Request-, Decoder-, Seek- und Resume-Senke;
2. `P3-P0-S-M-002`: vollständiger Asset-byte-zu-Decoder-Enforcementpunkt;
3. `P3-P0-S-M-003` und `P3-P0-T-M-001`: Run-/Abort-/DOM-Event- und
   Late-result-Semantik;
4. `P3-P0-S-PRIV-M-001`: minimaler, gekappter, sicher löschbarer Resume-Store;
5. `P3-P0-T-M-002`: echte Produktroute getrennt vom test-only Visualharness;
6. `P3-P0-T-M-003`: vollständige neunsprachige Copy- und Viewportmatrix;
7. das Kontinuitätsfinding zur disjunkten P3-A-/P4-B-Sequenz.

Maßgebliche Belege sind die drei P3-P0-L/T/S-Berichte und ihre Handoffs sowie
der finale P2-R7-Architekturabschluss. Bei Widerspruch gilt die engere,
fail-closed Regel dieses Vertrags.

## 3. Harte Architekturgrenze

```text
buildgepinntes P2-JSON -> P2 save/activate -> Active + Control + Safety
  -> P3 frischer Snapshot + Current-time/Rights/Safety-Recheck
  -> reines Active-only Viewmodel
  -> sichtbare User-Play-Aktion
  -> fester lokaler Audiopfad -> 5000-ms-/MIME-/Byte-/SHA-Prüfung
  -> Blob audio/wav -> genau eine Object URL -> HTMLAudioElement
  -> Run-/Abort-/Element-/URL-gebundene Playbackevents
  -> optional minimaler, separat gespeicherter Resumezustand

Expiry/blocked/clear/navigation/unmount/snapshot change
  -> Run invalidieren -> Abort -> pause -> src entfernen -> load
  -> Object URL exakt einmal freigeben -> kein später UI-/Resume-Sink
```

Candidate und Previous sind niemals UI-, Player- oder Resume-Fallback. Ein
historisch valider Store-Snapshot ist kein Current-time-Freibrief. P3 prüft
vor jeder sensiblen Senke erneut denselben Active, dieselbe Safety und die
aktuelle Uhr.

## 4. P3-A – headless Player/Lifecycle/Resume

### 4.1 Exakte Laufidentität

Jeder Lauf bindet mindestens:

`(control.generation, active.revision, active.transportSha256,
safety.generation, safety.revision, episodeId, audioAssetId, audioAssetHash)`.

Vor Projektion, Assetrequest, Object-URL-Zuweisung, `play()`, Resume-Seek und
Resume-Write müssen frischer Snapshot und frische Uhr bestätigen:

- exakt denselben Active und dieselbe Laufidentität;
- gültige Release- und elementweise Audiorechte;
- keine Sperre für Source, Series, Episode oder Audioasset;
- keine Future-/Corrupt-/Protected-/Storagefailure-Lage.

`now >=` früheste Release-/Rights-Expiry ist `stale`. `blocked`, `gone` oder
`replaced` dominiert stale. Es gibt kein automatisches Folgen von
Replacement, keinen Repairwrite und kein LKG nach bekannter Sperre oder
Expiry.

### 4.2 Assetenforcement vor dem Decoder

Nur eine sichtbare `user-play`-Aktion darf den im Active gebundenen lokalen
Audiopfad laden. P3-A lädt weder Thumbnail noch Transkript.

- Request: `credentials:'omit'`, `redirect:'error'`,
  `referrerPolicy:'no-referrer'`, `cache:'no-store'`, kein `Range`;
- eigenes Gesamtzeitlimit exakt 5000 ms;
- nur HTTP 200, kein `Content-Range`, MIME exakt `audio/wav`;
- vorhandenes `Content-Length` ist strikt dezimal, capkonform und exakt den
  Descriptorbytes gleich;
- ohne Header gilt ein Streamingcap von 262144 Bytes;
- Bodygröße ist höchstens 262144 Bytes und danach exakt Descriptorbytes;
- SHA-256 muss vor Blob, Object URL, `src`, `load()` oder Decoderzugriff
  exakt dem Active-Descriptor entsprechen;
- Blobtyp ist fest `audio/wav`; genau eine Object URL gehört genau einem Lauf.

Redirect, 206, Range, MIME-Sniffing, Direkt-`src`, Remote- oder
Streamingfallback sind verboten. Jede erzeugte URL wird bei Ersetzung,
Failure, Ended, Expiry, Block, Clear, Navigation und Unmount exakt einmal
freigegeben. Vor URL-Erzeugung gibt es keinen Revoke-Aufruf.

### 4.3 Playback und Availability

Playback und Availability bleiben orthogonale Zustandsachsen. Playback nutzt
exakt `idle`, `loading`, `playing`, `paused`, `ended`, `error`. Availability
folgt dem P2-Vertrag; insbesondere:

- `local` wird nicht aus `navigator.onLine` abgeleitet;
- `offline` verbietet einen neuen Start;
- `stale` und `blocked` stoppen und detachen; `blocked` dominiert monoton;
- kein Autoplay, kein Preload und kein Resume-Autostart.

Jeder User-Playlauf erhält eine streng steigende Run-ID, einen eigenen
AbortController und eine gebundene Element-/Object-URL-Identität. Jeder
Resolve-, Catch- und DOM-Eventpfad prüft Run-ID, Abortsignal, Mounted-Status
und Identität vor jeder UI-, URL- oder Resume-Mutation.

Medienwechsel, Snapshotwechsel, Consentwechsel, Expiry, Safetyblock, Clear,
Navigation und Unmount invalidieren zuerst den Lauf und abortieren; danach
folgen Stop, Detach und Revoke. Pro aktiver Episode besteht genau ein
abbrechbarer Timer auf die früheste Expiry. Alte Timer und alte
`play()`-/Fetch-/Digest-/Store-Results sowie `pause`-/`ended`-/`error`-Events
sind wirkungslos. Es gibt keinen Auto-Retry.

### 4.4 Resume-Privacyvertrag

Eigene IndexedDB: `wrn-mobile-media-resume-v1`, Version 1, exakt ein Store
`mediaResume` mit `keyPath:'key'`.

Zulässig sind exakt:

- ein Controlrecord
  `{recordVersion:1,key:'control',generation}`;
- höchstens 64 Resumerecords
  `{recordVersion:1,key,episodeId,audioAssetId,releaseRevision,
  audioAssetHash,positionMs,durationMs,updatedAt}`.

Verboten sind Titel, Source, URL/Pfad, Transcript, Consent, Nutzer-, Geräte-,
Session- oder Correlation-ID. Je Record gelten maximal 4096 kanonische
UTF-8-Bytes, insgesamt maximal 65536. `positionMs` und `durationMs` sind
finite Safe-Integer mit `0 <= positionMs < durationMs` und müssen zum aktuell
verifizierten Active passen.

Save und Clear verwenden eine Readwrite-Transaktion mit erwarteter globaler
Generation, Pre-cap, Readback und `generation + 1` exakt pro erfolgreicher
Mutation. Future-DB, Zusatzstore, unbekannter/falscher/future/corrupt/
over-cap Record sind `protected`, strikt read-only und werden nicht repariert.
Quota, Abort, Transaction- und Readbackfehler sind sichtbar getrennt; kein
Auto-Retry.

Resume wird nur nach ausdrücklichem Pausezustand gespeichert. `timeupdate`,
Mount, Reload und Unmount schreiben nichts. Seek erfolgt erst nach erneut
verifiziertem Asset und neuer Nutzeraktion; Wiedergabe startet nie
automatisch. Ended und selektives Clear entfernen nur den passenden bekannten
Record. Globales Clear entfernt nur bekannte P3-Resumerecords. Katalog-Safety,
Sprach-, Theme-, Reading-, Content-, Events- und fremde Storagewerte bleiben
unangetastet. Bei Teilerfolg wird kein Gesamterfolg behauptet.

## 5. P4-B – sichtbare Mobile-Projektion

P4-B darf erst nach technisch GREENem P3-A und eigenem Writer-Gate starten.
Die `#media`-Route ersetzt ausschließlich den ehrlichen Media-Platzhalter.
Sie liest nur das reine P3-A-Viewmodel und ändert keine Trust-, Rights-,
Consent-, Asset-, Player- oder Resumeentscheidung.

Mindestens sichtbar getrennt sind loading, ready/local, empty, offline,
stale, blocked/gone, protected/invalid/storage-failure sowie Player-error.
Ready zeigt nur feste Felder desselben validierten Active: lokalisierter Titel
und Summary, Quelle, Dauer, Audio-Rechte/Attribution, Territorium, Ablauf,
lokale Auslieferung und `local-no-third-party`. Keine opaque ID, Hash,
Rawbytes oder Safety-Details werden gerendert. React-Escaping ist Pflicht;
`dangerouslySetInnerHTML` ist verboten.

Der lokale Consent mit leerer Datenkategorie und `requiresPrompt:false`
erzeugt keinen Scheindialog und keine Persistenz. Vor Play bestehen null
Audio-/Thumbnail-/Transkriptrequests, kein `audio[src]`, Poster, Preload,
Prefetch, Preconnect, DNS-Hint, iframe, XHR, WebSocket oder Beacon.

Die UI nutzt semantische Überschriften, Listen, `button`, `audio`, `time` und
`details`/`summary`. Statusmeldungen verwenden gezielt `role=status`, nur
blockierende Fehler `role=alert`. Fokus, Zurück/Escape, 44×44 CSS-Pixel,
Kontrast, Reduced Motion, Tastatur und Screenreader sind bindend.

Alle neuen Keys bestehen typisiert in `en,de,es,fr,it,pt,ru,el,tr`. Die
Visualmatrix umfasst 9 Sprachen × 4 Themes × `390x844` normal und 200 Prozent
(72 Fälle) plus 8 Viewports × 4 Themes (32 Fälle): `320x568`, `360x800`,
`390x844`, `412x915`, `600x960`, `800x1280`, `844x390`, `1280x800`.
Zusätzliche Viewports setzt der Spec lokal; globale Playwrightconfig bleibt
unverändert. Websiteprojekte sind erwartete Skips.

Die echte `#media`-Route belegt die unveränderte P2-Pipeline. Wegen der am
Prüftag abgelaufenen lokalen Fixture darf ready/local nur mit injizierter
Testuhr vor Expiry belegt werden. Produktionsdefault bleibt `Date.now`; kein
URL-, Query- oder Produkt-Testschalter. Weitere Zustände kommen ausschließlich
aus einem selbst erstellten test-only Viewmodelharness.

## 6. Disjunkte mögliche Writer-Allowlists

Diese Listen sind Vertragsgrenzen, noch kein Schreibrecht.

### P3-A – zehn Pfade

1. `apps/mobile/src/mobile-media-hub.ts` neu
2. `apps/mobile/src/mobile-media-player.ts` neu
3. `apps/mobile/src/mobile-media-resume-store.ts` neu
4. `apps/mobile/src/mobile-media-hub.test.ts` neu
5. `apps/mobile/src/mobile-media-player.test.ts` neu
6. `apps/mobile/src/mobile-media-resume-store.test.ts` neu
7. `tests/e2e/g3-021-media-hub-lifecycle-harness.tsx` neu
8. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts` neu
9. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md` neu
10. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md` neu

### P4-B – zwölf Pfade, erst nach P3-A-GREEN

1. `apps/mobile/src/mobile-media-hub-ui.tsx` neu
2. `apps/mobile/src/App.tsx`
3. `apps/mobile/src/styles.css`
4. `packages/ui-language/src/index.ts`
5. `apps/mobile/src/mobile-media-hub-ui.test.tsx` neu
6. `apps/mobile/src/App.test.tsx`
7. `packages/ui-language/src/index.test.ts`
8. `tests/e2e/g3-021-media-hub-visual-harness.tsx` neu
9. `tests/e2e/g3-021-media-hub-visual.spec.ts` neu
10. `docs/evidence/WRN-G3-021/P4-B-MOBILE-MEDIA-HUB-IMPLEMENTATION.md` neu
11. `docs/handoffs/WRN-G3-021-p4-b-mobile-media-hub-implementation.md` neu
12. `docs/evidence/WRN-G3-021/P4-B-MOBILE-MEDIA-HUB-VISUAL-MANIFEST.md` neu

Die Phasen teilen keinen Schreibpfad. P4-B konsumiert P3-A ausschließlich
read-only. Sämtliche P2-Contracts, Loader, Store, Tests, JSON, Fixtures,
Assets und Pins bleiben unverändert. Ebenso read-only/OUT: `packages/domain`,
globale Playwright-/Vite-/Vitest-/Capacitorconfig, Package-/Lockfiles,
Dependencies, Website, Shared Reader, andere Stores, Service Worker, echte
Quellen/Medien, Provider, Android und Release.

## 7. Pflicht-Negativmatrix

P3-A muss mindestens belegen:

1. nur Active wird projiziert; leere/Candidate-/Previous-/protected Zustände
   erzeugen keine Projektion und keinen Assetrequest;
2. Snapshot-/Control-/Raw-/Transport-/Safetywechsel in jeder Asyncphase macht
   alte Resolve- und Rejectpfade wirkungslos;
3. Release-/Rightszeit jeweils `expiry-1`, `expiry`, `expiry+1` an Render,
   Request, URL/Play, Seek und Resume-Write;
4. Safetyblock für Source, Series, Episode und Audioasset vor und während
   Load, Digest, URL, Play/Pause und Resume; blocked dominiert stale;
5. gone/replaced ohne alte Projektion, Auto-Follow oder Request;
6. vor User-Play null Assetrequest und kein Audio-src;
7. falscher Pfad, Redirect, Status != 200, 206, Content-Range, MIMEfehler;
8. Content-Length malformed/abweichend sowie 262143/262144/262145 mit und
   ohne Header; Descriptorbytes minus/equal/plus eins;
9. SHA-, Digest-, Bodyreader- und createObjectURL-Fehler;
10. Timeout 4999/5000/5001 und Abort vor/bei Header/Body/Digest;
11. src/load/decoder/play resolve/reject/fault-injected, nie ungeprüfte Bytes
    am Decoder;
12. Object-URL-Ledger für Wechsel, Retry, Reject, Error, Ended, Expiry,
    Block, Clear, Navigation, Unmount: jede URL exakt einmal revoked;
13. alle erlaubten Playbacktransitionen und No-op für unerlaubte Events;
14. offline/stale/blocked-Dominanz ohne navigator.onLine-Erfindung;
15. sämtliche späten Fetch-/Digest-/play-/Store-Ergebnisse und alten DOM-
    Events nach Runwechsel, Snapshot, Clear, Expiry, Block oder Unmount;
16. genau ein Expirytimer, Gleichheit stale, alter Timer wirkungslos;
17. Resume-Position -1/0/duration-1/duration/duration+1, NaN, Infinity und
    Nicht-Integer sowie fremde Episode/Asset/Revision/Hash;
18. Resume-Recordbytes 4095/4096/4097, Count 63/64/65 und Gesamtbytes
    65535/65536/65537 jeweils vor Write;
19. zwei Tabs mit gleicher Generation: genau eine Mutation; Quota, Abort,
    Transaction- und Readbackfehler ohne Erfolg/Auto-Retry;
20. Future-DB, Zusatzstore und unknown/future/corrupt/over-cap Record strikt
    read-only mit identischen Rohbytes;
21. nur Pause speichert; timeupdate/mount/reload/unmount null Writes; Seek
    erst nach Validierung und Useraktion; Ended löscht den bekannten Record;
22. selektiver/globaler Clear und Teilerfolg ohne Fremddatenverlust oder
    falsche Erfolgsbehauptung;
23. Storage-/Console-/Requestinventur ohne Titel, Source, URL, Transcript,
    Consent, Nutzer-/Geräte-/Session-/Correlation-ID, Analytics oder Beacon.

P4-B muss zusätzlich belegen:

24. echte Produktroute und strikt getrenntes test-only Viewmodelharness für
    alle Status-, A11y-, Keyboard-, Request- und Viewportfälle;
25. reale Pipeline mit Testuhr vor Expiry ready/local, Produktionsuhr am/ab
    Expiry ehrlich stale/fail-closed; kein Fixture-, Pin- oder Produkthookdelta.

## 8. Schutz-Hashes

Vor jedem Writer-Gate werden mindestens diese Basiswerte erneut geprüft:

| Pfad | SHA-256 |
| --- | --- |
| `apps/mobile/src/App.tsx` | `209b32ba0f4d69eb9128d97f34391e69393f9212624ff547d2ae4c2210f3b611` |
| `apps/mobile/src/App.test.tsx` | `2cae476afad20c35260291c26378bf553cce2e187895011c144481c67cb11bba` |
| `apps/mobile/src/styles.css` | `3e2ffeaeeefbf88f1242153a4edba35386814d929423ad48fad8db8f5ec532b7` |
| `packages/ui-language/src/index.ts` | `a0f242d6904753495f79d696688ce6aebf93ae932c945a98a8aa2b9cfbb9244a` |
| `packages/ui-language/src/index.test.ts` | `f974ad2b6f9b8a478fa3fee2e7bc7ad78d556a79fe7295f5311df48bbe1de3fe` |
| `packages/content-contracts/src/mobile-media-v1.ts` | `defd8aba273e66558376f7e82fd463cb3bccea72153bc3d938b64ed37cc36581` |
| `apps/mobile/src/mobile-media-release.ts` | `a8c6b04a7c0cb202c90352db9ea46df1f500e763f3eb2d226326532ed71fd19e` |
| `apps/mobile/src/mobile-media-catalog-store.ts` | `6a9c25da779fc682565361bed21b762bab2cf7bc9071d32c626eb7c0dc691c53` |
| `apps/mobile/public/wrn-mobile-media/v1/mobile-media-release.json` | `311c9d4ec2c3614f20e8b66735e09fc9c85bcdf667781c738f5120aeae9f9994` |
| `apps/mobile/package.json` | `d53bda53a51cf65bb3b267ea81336dd551bfda16b0f854fb6fabd9baf311ff7e` |
| `pnpm-lock.yaml` | `f97a7a4c992880cb99a80a51ac68e28de74b498a9666152d232276698c8cb6d7` |
| `apps/website/src/App.tsx` | `16ef0995ea766a0818f247d1a6296f4b9b339d4dd470fcb50574314518382382` |

Jede Abweichung, zusätzliche Datei oder notwendige Contract-/Fixture-/Config-
Änderung ist Stop an den Chief, keine Selbsterweiterung.

## 9. Gatefolge und Pflichtläufe

1. Dieser Vertrag wird separat committed.
2. Frischer unabhängiger Sol/high-Recheck mit null Findings.
3. Separates P3-A-Writergate und genau ein frischer Terra/high-
   Frontendwriter ohne Kinder oder Git-Index.
4. Chief reproduziert mit exakt Node 24.19 beide Typechecks, fokussierte und
   vollständige Mobiletests, echte Chrome-/IDB-/Request-/Race-/Cap-/Clear-
   Matrix, Build, Lint/Format, 19 Boundaries, Fixture-/Releasechecks, Hashes,
   Diff und Allowlist.
5. Frische unabhängige Terra-QA und defensiver Sol-Security-/Privacy-Recheck;
   danach finaler Sol-P3-A-Architekturabschluss.
6. Erst P3-A-GREEN erlaubt ein separates P4-B-Writergate und dessen eigene
   Writer-, Chief-, Visual-/A11y-, Security- und Architekturfolge.
7. Erst technisches P4-B-GREEN erlaubt eine lokale PO-Sichtprobe.

## 10. OUT und Stopbedingungen

Reale Quellen/Medien, Remoteprovider, Streaming, Download/CacheStorage,
Transcoding, Generierung, neue Dependencies/Kosten, Website, Shared Reader,
Service Worker, Capacitor/Android/AAB/Play, Signierung, Hosting/Live, Upload,
Deployment und Release bleiben gesperrt. Keine Aussage über physische
Löschung paketierter Bytes oder offline nie empfangene Takedowns.

Der Writer stoppt bei Zusatzpfad, Hashdrift, notwendiger Dependency,
Fixture-/Pinänderung, nicht erreichbarer Pflichtsenke, Testreduktion,
Security-/Privacyfinding oder nicht reproduzierbarer Matrix.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-PLAYER-LIFECYCLE-UI-CONTRACT`
- Status: zur unabhängigen Sol-Prüfung gebunden; kein Writer-Gate
- Basis: `46b20d40afbdc629ad95dd2bb658dc4813ae4079`
- Findings gebunden: S-M-001..003, S-PRIV-M-001, T-M-001..003, Kontinuität
- P3-A/P4-B: disjunkt und sequenziell
- Nächster Schritt: separater Commit, dann frischer Sol/high-Recheck
- END-CHECK: :)
