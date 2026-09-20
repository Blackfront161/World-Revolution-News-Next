# WRN-G3-020 – Sol-Backfill-Korrekturvertrag

Status: **Chief-geprüfter Korrekturvertrag. Aktiv erst mit eigenem Gatecommit und freier Browserressource.**

Datum: 9. September 2026

## 1. Anlass, Ziel und Gategrenze

Der unabhaengige Sol/high-Backfill
`docs/evidence/WRN-G3-020/P5-SOL-ASSURANCE-BACKFILL-2026-09-09.md`
hat drei Medium-Findings und ein Low-Evidencefinding am weiterhin
content-identischen G3-020-Produktkandidaten `57dac7c0a3ae6be7342c66850cd7bb4861ab5e82`
gefunden:

1. `G3-020-SOL-M-001`: Der innere Catch eines spaet rejected
   Recovery-Snapshots besitzt keinen Current-/Abortguard.
2. `G3-020-SOL-M-002`: `offline-none` wird sichtbar mit der unzutreffenden
   Aussage kombiniert, lokale Daten seien aktuell.
3. `G3-020-SOL-M-003`: Bei `bundle:null` fehlt der einzige sichtbare
   Reloadweg.
4. `G3-020-SOL-L-001`: Der dokumentierte P4-R2-Visualaggregathash ist aus dem
   weiterhin vorhandenen Evidenceordner nicht reproduzierbar.

Ziel ist die kleinste vollstaendige Korrektur dieser vier Befunde. Dieser
Entwurf startet keinen Agenten und erteilt keine Schreibrechte. Solange der
aktuelle G3-021-R11-Writer aktiv ist, darf kein G3-020-Produkt-/Testwriter
starten. Erst nach dessen gesichertem Ende, Chief-Abgleich, separatem
Gatecommit, zentraler Slotreservierung und einem ausdruecklichen Start darf
genau ein frischer `frontend_brand_engineer` Terra/high ohne Kinder die unten
genannte Writer-Allowlist bearbeiten.

Der Vertrag erteilt weder G3-021-, Provider-, Content-, Website-, Hosting-,
Android-, Play-, Live- noch Release-GREEN. PO-099 bleibt als historische
lokale Sichtannahme erhalten; die korrigierten sichtbaren Fehlerzustaende
brauchen danach eine neue eng begrenzte Sicht-/QA-Bindung.

## 2. Verbindliche Quellen und Startpins

Vor einem spaeteren Start liest der Writer nur die fuer diese Korrektur
erforderlichen Quellen:

- `AGENTS.md`, `docs/00-PRODUCT-CHARTER.md`,
  `docs/01-SOURCE-OF-TRUTH.md`, `docs/03-TARGET-ARCHITECTURE.md` und
  `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-020-P3-FRONTEND-PACKET.md`
- `docs/tasks/WRN-G3-020-P3-R2-QA-CORRECTION.md`
- `docs/tasks/WRN-G3-020-P3-R3-LATE-SELECTION-REJECTION.md`
- `docs/evidence/WRN-G3-020/P5-SOL-ASSURANCE-BACKFILL-2026-09-09.md`
- die drei spaeter schreibbaren Quellpfade sowie die unten gepinnten
  read-only Nachbarpfade

Der Chief prueft vor dem Gatecommit, dass folgende Startinhalte entweder
exakt vorliegen oder jede Abweichung separat bewertet und neu gebunden ist:

| Pfad | erwarteter SHA-256 |
| --- | --- |
| `apps/mobile/src/mobile-regional-events-ui.tsx` | `04577e94372cebb5c4934eba41e07bdc65882acabdc1e0d6ed3291b359ccfbe9` |
| `apps/mobile/src/mobile-regional-events-ui.test.tsx` | `d8e1129ae16290b2d780254fa9983f429096c01dbc42d93ac1666d36ad288569` |
| `tests/e2e/g3-020-regional-events-visual.spec.ts` | `737dd5ddaaf43c248c00eebd861e4fcaf8dc63ceda3aecca34bb73c3f6ecf859` |
| `tests/e2e/g3-020-regional-events-visual-harness.tsx` | `825e342e52b0251d0a5405e59fee23bbb19a0a2b93e00af22e2cfbe95a30dcb2` |
| `apps/mobile/src/styles.css` | `3e2ffeaeeefbf88f1242153a4edba35386814d929423ad48fad8db8f5ec532b7` |

Der spaetere Gatecommit und der tatsaechliche Quellen-HEAD werden im
Delegationsregister und Writer-Handoff mit Vollhash festgehalten. Ein
abweichender Produkt-, Test-, Harness-, CSS-, Copy- oder P2-Startinhalt ist
eine Stopbedingung, bis der Chief den Vertrag angepasst hat.

## 3. Exakte Writer-Allowlist

Nach einem spaeteren ausdruecklichen Gate darf genau ein Writer nur diese
fuenf Repositorypfade schreiben:

1. `apps/mobile/src/mobile-regional-events-ui.tsx`
2. `apps/mobile/src/mobile-regional-events-ui.test.tsx`
3. `tests/e2e/g3-020-regional-events-visual.spec.ts`
4. `docs/evidence/WRN-G3-020/P6-SOL-BACKFILL-CORRECTION.md` neu
5. `docs/handoffs/WRN-G3-020-sol-backfill-correction.md` neu

Der Writer darf weder stagen noch committen. Insbesondere bleiben
`tests/e2e/g3-020-regional-events-visual-harness.tsx`, `styles.css`,
`App.tsx`, UI-Sprachvertrag und alle neun Copykataloge, P2-Eventsmodule und
-tests, Fixture, Pin, Contentvertraege, globale Testconfig, Dependencies,
Lockfile, Website und Governance read-only.

Die Allowlist ist absichtlich klein:

- Der Harness reicht unveraendert `model`, Sprache, Drafts und Callbacks an
  die reine Produktionsview durch.
- Die vorhandene Klasse `.regional-events-actions` liefert bereits Grid,
  Fokus und mindestens 44 x 44 CSS-Pixel fuer einen Reloadbutton ausserhalb
  der Selectionsektion; keine CSS-Aenderung ist erforderlich.
- `eventsOfflineNone`, `eventsOnline`, `eventsOfflineLkg` und `eventsReload`
  existieren in allen neun Katalogen. Die Korrektur braucht keine neue Copy.
- P2 liefert die benoetigte Projektion und Persistenzschnittstelle bereits;
  weder Schema noch Storagegeneration werden geaendert.

## 4. Verbindliche Produktkorrekturen

### C-01 – jeder asynchrone Recoverypfad bleibt rungebunden

Im inneren Catch des nach einem Load-/Save-/Activatefehler gestarteten
Recovery-`snapshot()` muss vor jedem Ref-, Draft- oder React-Statewrite
dieselbe dreifache Bedingung wie in den bestehenden R3-Catches gelten:

1. gespeicherte Run-ID entspricht `runRef.current`,
2. `activeRunRef.current?.id` entspricht der gespeicherten Run-ID,
3. das zu diesem Run gehoerende Signal ist nicht aborted.

Ist eine Bedingung falsch, endet nur die alte Fortsetzung. Sie darf weder
den neuen Run verdecken noch neue Handles schliessen, Mutation sperren,
Drafts aendern, State schreiben, retryen oder weitere Store-/Selectionarbeit
starten. Ist der Run noch aktuell, bleibt der heutige fail-closed Ausgang
erhalten: ein geschuetzter Fehler wird `protected`, ein sonstiger
Recovery-Snapshotfehler `error`; keine Inhalte oder Selection werden danach
geoeffnet.

Die Korrektur darf keine neue Controllerabstraktion, Queue, Timer,
Promise-Race-Hilfe oder globale Lifecycleverwaltung einfuehren. Ein enger
Guard an der fehlenden Fortsetzung ist ausreichend.

### C-02 – Offline ohne LKG hat intern und sichtbar nur eine ehrliche Aussage

Bei `network-error` ohne validierten Active gelten gemeinsam:

- `contentStatus === 'offline-none'`;
- das Viewmodel darf diesen Zustand nicht als `online`/aktuell ausgeben;
- sichtbar erscheint `eventsOfflineNone` genau einmal;
- sichtbar erscheinen weder `eventsOnline` noch `eventsOfflineLkg`, weil
  weder aktuelle Daten noch ein gezeigter LKG existieren.

Das bestehende P2-Projektionsmodell verwendet fuer einen Offlinekontext den
Lieferwert `offline-lkg`, auch wenn `contentStatus` mangels Bundle
`offline-none` ist. P3 darf diesen Vertrag nicht aendern. Der Controller
setzt deshalb fuer den echten Offlinepfad den P2-konsistenten Lieferwert;
die View unterdrueckt bei `offline-none` den generischen LKG-Suffix, weil die
vollstaendige lokale `eventsOfflineNone`-Copy bereits die wahre sichtbare
Aussage enthaelt.

Auch `error` oder `protected` ohne Bundle duerfen nicht unbelegt mit
`eventsOnline` behaupten, lokale Daten seien aktuell. Bei vorhandenem,
validiertem Bundle bleiben die bestehenden getrennten Banner erhalten:

- echter Offline-LKG: Inhaltsstatus plus `eventsOfflineLkg`;
- abgelehntes Update mit LKG: Inhaltsstatus plus
  `eventsInvalidUpdateLkg`;
- erfolgreicher aktueller Lauf: Inhaltsstatus plus `eventsOnline`.

Keine neue Netzwerksonde, `navigator.onLine`, Copy oder Statusenum-Erweiterung
wird eingefuehrt.

### C-03 – jeder terminale No-Bundle-Zustand bietet genau einen Reload

Wenn der Lauf nicht mehr `loading` ist und `bundle === null`, rendert die
View genau einen sichtbaren, aktivierten nativen Button mit der bestehenden
lokalisierten Copy `eventsReload`. Das umfasst mindestens:

- Store-Open-/Initial-Snapshotfehler (`phase:error`),
- geschuetzten Store oder ungueltigen Active (`phase:protected`),
- Invalid/Future/No-request ohne LKG (`phase:ready`, `contentStatus:error`),
- Networkfehler ohne LKG (`phase:ready`, `contentStatus:offline-none`).

Der Button ruft ausschliesslich das bestehende `onReload` auf. Er loescht,
repariert oder mutiert keine Daten und startet keinen Auto-Retry. Solange
`bundle !== null` bleibt der bereits vorhandene Reloadweg innerhalb der
Selectionsektion erhalten; es darf nie zwei Reloadbuttons zugleich geben.
Selection-, Save- und Clearcontrols werden ohne Bundle weiterhin nicht
gerendert. Der Fallbackbutton verwendet die vorhandene
`.regional-events-actions`-Darstellung; CSS-/Copywrite ist nicht erlaubt.

## 5. Verbindliche Unit-/Komponentenorakel

Die fokussierte Testdatei erhaelt kontrollierte Deferred-Adapter. Mindestens
folgende getrennte Orakel sind Pflicht; allgemeine Snapshot- oder Textmatches
reichen nicht:

### Lifecycle-Negativorakel fuer C-01

1. **Recovery-Reject nach erfolgreichem Reload:** Run 1 hat einen sicheren
   initialen Snapshot, der Load-/Save-/Activatepfad scheitert und sein exakt
   einmaliger Recovery-Snapshot bleibt pending. Reload abortiert Run 1 und
   Run 2 beendet Store, Load, Selection und Projektion vollstaendig als
   `ready`. Erst danach rejected der Recovery-Snapshot aus Run 1. Orakel:
   Modell, `referenceInstant`, Selectiongeneration und Projektion von Run 2
   bleiben unveraendert; keine Mutation wird gesperrt; eine neue
   Selectionmutation von Run 2 bleibt bedienbar; keine weitere Store-, Load-
   oder Selectionoperation startet.
2. **Recovery-Reject nach Unmount:** Run 1 wartet im Recovery-Snapshot,
   danach Unmount, dann Rejection. Orakel: kein spaeter Render-/Statepfad,
   kein React- oder unhandled-Rejection-Warnpfad, keine Ref-/Draftmutation,
   kein Retry und keine folgende Selectionoeffnung. Der beim Unmount
   vorhandene Handle wird weiterhin genau einmal geschlossen.
3. **Recovery-Reject im aktuellen Run:** Ohne Reload/Unmount rejected der
   exakt eine Recovery-Snapshot. Gewoehnlicher Storagefehler ergibt
   `phase:error`; ein `RegionalEventsStoreError('protected')` in der
   massgeblichen Fehlerkette ergibt `phase:protected`. In beiden Faellen
   keine Inhalte, kein Selectionopen und kein Retry.

Die Tests muessen die zweite `snapshot()`-Anforderung eindeutig von der
initialen unterscheiden. Ein Test, der nur einen spaet aufgeloesten
Initial-Snapshot oder einen als Ergebnis zurueckgegebenen `network-error`
prueft, schliesst M-001 nicht.

### Statusorakel fuer C-02

4. Leerer initialer Snapshot plus `load() -> { kind:'network-error' }`
   ergibt im Controller exakt `phase:ready`, `bundle:null`,
   `contentStatus:offline-none`, den P2-konsistenten Offline-Lieferkontext,
   null Events/Lifecycle und keine Selectionoeffnung.
5. Die View zeigt in diesem Modell exakt `eventsOfflineNone`, aber weder
   `eventsOnline` noch `eventsOfflineLkg`.
6. Je ein Nichtregressionsfall bestaetigt, dass ein vorhandener sicherer
   Active bei `network-error` weiterhin `offline-lkg` sichtbar zeigt und ein
   vorhandener Active bei invalidem Update weiterhin
   `invalid-update-lkg` sichtbar zeigt.
7. `error` und `protected` ohne Bundle zeigen keine unbelegte
   `eventsOnline`-Aussage.

### Reloadorakel fuer C-03

8. Eine parametrisierte Viewmatrix fuer `error`, `protected`,
   `ready/error` ohne LKG und `ready/offline-none` fordert jeweils genau
   einen sichtbaren, aktivierten Button mit dem lokalisierten zugänglichen
   Namen `eventsReload`; Click ruft `onReload` exakt einmal auf.
9. Bei validiertem Bundle gibt es weiterhin genau einen Reloadbutton in der
   Selectionsektion. Loading zeigt keinen zusaetzlichen terminalen
   Fehlercontrol. No-Bundle-Zustaende zeigen keine Select-, Save- oder
   Clearcontrols.

Kein bestehendes R2-/R3-Orakel darf entfernt, gelockert oder durch die neue
Erwartung ersetzt werden.

## 6. Visual-/A11y-Korrektur ohne Harness- oder Layoutausweitung

Nur die bestehende
`tests/e2e/g3-020-regional-events-visual.spec.ts` wird angepasst:

- Das Presentational-Modell fuer `offline-none` verwendet `bundle:null` und
  den P2-konsistenten Offline-Lieferkontext. Sein sichtbarer Status enthaelt
  `eventsOfflineNone`, aber weder `eventsOnline` noch `eventsOfflineLkg`.
- Die vorhandenen `error`- und `protected`-Darstellungen verwenden fuer den
  in diesem Finding relevanten Start-/Storefehlerfall ebenfalls
  `bundle:null`.
- `offline-none`, `error` und `protected` besitzen jeweils exakt einen
  sichtbaren, enabled Reloadbutton mit zugänglichem Namen; er erreicht
  mindestens 44 x 44 CSS-Pixel, ist per Tastatur fokussierbar und erzeugt
  keinen horizontalen Overflow.
- Axe wird fuer die No-Bundle-Reloadprojektion in allen vier gebundenen
  Themes ausgefuehrt. Bestehende Selection-, ready-5- und Lifecycle-Axe-
  Orakel bleiben erhalten.
- Die bestehenden 72 Sprach-/Theme-/Reflowbilder, 32 Viewportbilder und 15
  Zustandsbilder bleiben insgesamt **119 PNGs**. Es wird keine neue
  Screenshotmatrix und kein Layoutredesign eingefuehrt.

Der unveraenderte Harness importiert weiterhin nur die reine Produktionsview
und erhaelt lokale Presentational-Viewmodels. Er bleibt kein Pin-, Store-,
IDB-, Admission- oder Inhaltsbeweis. Das echte leere Produktfixture bleibt
separat und unveraendert.

## 7. Kanonische neue Visualmanifestbindung fuer L-001

Der Produktwriter darf in seinem Report nur einen vorlaeufigen Visual-PASS
melden. Die endgueltige Schliessung von `G3-020-SOL-L-001` erfolgt nach einem
separaten Chief-Kandidatencommit durch eine frische unabhaengige
Terra/high-QA. Sie erhaelt erst in einem eigenen Gate Schreibrecht auf genau:

1. `docs/evidence/WRN-G3-020/P7-SOL-BACKFILL-INDEPENDENT-QA.md`
2. `docs/handoffs/WRN-G3-020-sol-backfill-independent-qa.md`
3. `docs/evidence/WRN-G3-020/P7-SOL-BACKFILL-VISUAL-MANIFEST.tsv`

Keine dieser drei QA-Rechte entsteht durch diesen Entwurf. Der Chief bindet
Kandidat, Agent, Slot und Pfade nach dem Produktcommit separat. Die QA nutzt
einen neu angelegten, vorher nicht vorhandenen Tempordner als
`WRN_EVIDENCE_ROOT` und den kurzen, lowercase Kandidatencommit als
`WRN_EVIDENCE_REVISION`. Die bestehende Capturefunktion kopiert damit alle
PNG-Dateien flach und commitpraefigiert in diesen Evidence-Root.

Der kanonische Manifestalgorithmus lautet exakt:

1. Eingabe sind nur regulaere direkte Kinddateien des frischen
   Evidence-Roots, deren Dateiname auf `.png` endet. Unterordner,
   symbolische Links/Reparse-Points, andere Dateien oder doppelte Dateinamen
   sind ein Fehler.
2. Es muessen exakt 119 PNGs mit dem erwarteten lowercase Commitpraefix
   existieren. Die QA dokumentiert ausserdem die Summe der PNG-Dateibytes.
3. Der relative Name ist nur der Dateiname, ASCII und durch das Muster
   `^[a-z0-9][a-z0-9._-]*\.png$` begrenzt. Dadurch gibt es keine Separator-,
   Unicode-Normalisierungs- oder Plattformmehrdeutigkeit.
4. Die Namen werden byteweise aufsteigend nach ihren ASCII-/UTF-8-Bytes
   sortiert.
5. Fuer jede PNG werden die exakten Dateibytes mit SHA-256 gehasht; der Hash
   wird als 64 lowercase Hexzeichen ausgegeben.
6. Jede Manifestzeile ist exakt
   `<dateiname>\t<lowercase-sha256>`. Die Zeilen werden mit einem einzelnen
   LF (`0x0a`) verbunden. Es gibt keinen abschliessenden LF und kein CR.
7. `P7-SOL-BACKFILL-VISUAL-MANIFEST.tsv` enthaelt exakt diese UTF-8-Bytes,
   ohne BOM. Das Manifest wird als generiertes Evidenceartefakt nie manuell
   formatiert oder sortiert.
8. Der Aggregathash ist SHA-256 ueber genau die gespeicherten Manifestbytes.
   Node 24.19 und eine zweite unabhaengige PowerShell-Berechnung muessen
   denselben Aggregathash liefern. Abweichung ist RED, kein Retry durch
   Umsortieren oder Aendern des Algorithmus.
9. Der QA-Bericht bindet Vollhash des Kandidatencommits, Hashes der drei
   geaenderten Produkt-/Testpfade, Evidence-Root, `.last-run.json`,
   PNG-Anzahl, Gesamtbytes, Manifestpfad, Manifestbytezahl, Aggregathash
   sowie erste und letzte Manifestzeile. Er bezeichnet die Bilder nur als
   Presentational-/A11y-Evidence.

Der alte Hash `09321b...` wird als nicht reproduzierbarer historischer Wert
erhalten und weder ueberschrieben noch rueckwirkend als korrekt bezeichnet.
Der neue Kandidat erzeugt neue PNG-Dateibytes; deren neuer Hash darf deshalb
nicht mit einem alten Wert verglichen oder auf ihn festgeschrieben werden.

## 8. Pflichtpruefungen nach spaeterem Writerstart

Alle JavaScript-/TypeScriptlaeufe verwenden installationsfrei exakt Node
`v24.19.0`; keine Dependencyinstallation.

1. Fokussierte `mobile-regional-events-ui.test.tsx` inklusive aller Orakel
   aus Abschnitt 5.
2. Vollstaendige aktuelle Mobile-Units; keine historische Fallzahl als
   Ersatz fuer den aktuellen Gesamtlauf.
3. Content-Contract- und UI-language-Units sowie Typechecks fuer Mobile,
   Content-contracts und UI-language.
4. Diffbegrenztes ESLint mit `--max-warnings=0`, Prettier und
   `git diff --check` fuer die tatsaechliche Allowlist.
5. Die 19 Boundaries sowie Release- und Fixture-Provenienzgrenzen.
6. Die bestehenden 16 realen Chrome-/IndexedDB-G3-020-P2-Faelle seriell und
   unveraendert GREEN.
7. Die bestehende G3-020-Visualspec 3/3 GREEN mit 119 PNGs; keine parallele
   Nutzung desselben Ports oder Evidence-Roots.
8. Bestehender realer `#events`-App-Routentest und Mobile-Production-Build.
   Die bekannte Chunkwarnung bleibt sichtbar; neue Warnungen sind RED.

Der Writer dokumentiert jeden Befehl, Exitcode, Testzahl, Warnung, exakte
Dateiliste und SHA-256. Ein Fehler wird nicht durch Wiederholungen verdeckt;
eine Wiederholung ist nur nach dokumentierter Infrastrukturursache zulaessig.

## 9. Statische Negativgates und Architekturgrenzen

Der Allowlistdiff muss zusaetzlich beweisen:

- kein Write an Harness, CSS, Copy, `App.tsx`, P2, Fixture, Pin, Schema,
  Packageexport, Dependency, Config oder Lockfile;
- keine Geolocation, Permission-, IP-, URL-/Hash- oder LocalStorage-
  Regionsableitung;
- keine Analytics, Telemetrie, Cookies, Rohdaten-/Auswahllogs, Remote-Medien,
  neuen Requests, Timer, Polls oder Auto-Retries;
- keine Mutation, Loeschung oder Reparatur gespeicherter Events-/Selection-
  Daten durch Reload;
- keine Website-, Service-Worker-, Hosting-, Android-, Play- oder
  Providerkopplung;
- keine Map-/Spielimplementierung. Stabile Event-/Region-IDs, IANA-Zeit und
  barrierefreie Listen bleiben die einzige Zukunftsgrenze.

Die Korrektur aendert weder Datenvertrag noch IDB-Schema, Generation,
Admission, Safety/Revocation oder Rollback. Operative Laufzeitkosten bleiben
unveraendert: Reload ist weiterhin ausschliesslich usergesteuert und fuehrt
genau den vorhandenen lokalen Pinload aus.

## 10. Rollback, Stopbedingungen und Folgegates

Die Ruecknahmegrenze ist ein einzelner spaeterer Chief-Kandidatencommit mit
den drei funktionalen Pfaden und Writerbelegen. Ein Revert dieses Commits
stellt den vorherigen G3-020-Code her; persistierte Events- und
Selectiondaten brauchen keine Migration oder Loeschung. Der Visualmanifest-
QA-Commit bleibt als historischer Beleg erhalten und wird nicht automatisch
geloescht.

Der Writer stoppt sofort bei:

- abweichendem Startpin oder benoetigter Allowlistenerweiterung;
- unerwartetem Test-, Type-, Browser-, A11y-, Boundary- oder Buildfehler;
- erforderlicher Copy-, CSS-, Harness-, P2-, Fixture-, Config- oder
  Dependencyaenderung;
- neuer Persistenz-, Privacy-, Security-, Datenverlust-, Offline- oder
  Rollbackwirkung;
- parallel aktivem Produktwriter oder gemeinsam belegter Browserressource.

Nach Writerende prueft und committed allein der Chief den Kandidaten. Danach
folgen seriell die separat gebundene Terra-QA samt kanonischem Manifest und
ein frischer unabhaengiger Sol/high-Recheck der vier Findings. Erst dieser
Recheck darf G3-020 wieder GREEN setzen. Eine erneute lokale PO-Sichtpruefung
betrifft nur die korrigierten No-Bundle-/Offlinezustaende und bleibt vom
technischen Gate getrennt. Alle externen und Releasegates bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-020-SOL-BACKFILL-CORRECTION`
- Status: **ENTWURF / NICHT SCHREIBBAR**
- Quellstand: Befunde gegen Produkt `57dac7c0a3ae6be7342c66850cd7bb4861ab5e82`; spaeterer Gatecommit noch vom Chief zu binden
- Erledigt: kleinste Produkt-/Test-Allowlist, Lifecycle-/Status-/Reloadorakel, Visual- und Manifestvertrag
- Tests: keine; reine Vertragsarbeit gemaess Auftrag
- Offen: R11-Writerende, Chief-Gatecommit und ausdruecklicher Start; danach Writer, Chief-Kandidat, unabhaengige QA/Manifest und Sol-Recheck
- Handoff: der bestehende Assurance-Handoff bleibt Befundquelle; fuer diesen Vertragsentwurf kein weiterer Schreibpfad erlaubt
- Naechster Schritt: Chief prueft und bindet diesen Entwurf in einem separaten Gatecommit oder korrigiert ihn vor jeder Ausfuehrung
- END-CHECK: :)

## Chief-Ausführungsbindung, 9. September

R11-Produktwriter ist in ad9488fd30d26808e4f6e704496d104d291778be beendet.
Die Runtime erlaubt keine neue Instanz; der frühere Produktwriter ist nach
mehreren unvollständigen Rückgaben nicht zur weiteren Umsetzung vorgesehen.
Chief übernimmt deshalb sequenziell exakt die fünf Korrekturpfade. Die
funktionalen Regeln C-01..03, Negativorakel und unabhängige Prüfung bleiben
unverändert. Erst nach beendetem R11-QA-Testlauf darf Chief Produkt/Test
schreiben, damit dessen Kandidatenprüfung eingefroren bleibt. Sol prüft den
R11-Player statisch und kann während des disjunkten Eventsfixes fortfahren.
Kein anderer Produktwriter. Prüferinstanzen können wegen Runtime-Limit
wiederverwendet werden, sofern sie den jeweiligen Code/Tests nicht geschrieben
haben; diese Abweichung wird ehrlich im Bericht genannt.

Die fünf Startpins wurden vom Chief vor der Bindung exakt verglichen.
Der Chief darf diesen Vertrag, Findings und Startberechtigung im separaten
Commit binden; der folgende Registereintrag nennt dessen Ergebnis-SHA.
