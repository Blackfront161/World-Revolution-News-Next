# Task Brief – WRN-G3-014 lokale Inhaltsrevisionen und sichere Wechsel

## Identitaet

- Datum: 28. August 2026
- Auftraggeber: Product Owner; `weiter bitte` nach G3-013-Abnahme und dem
  angebotenen Vorbereitungsschritt. PO-070 erlaubt ausschliesslich Vorbereitung.
- Status: TECHNISCH GREEN durch Umsetzung und unabhaengige Pruefungen unter
  PO-071; Produkt `44b5cb1`, QA `999b777`, Architektur `0b2bd2f`;
  durch PO-073 am 28. August 2026 visuell akzeptiert, kein Release
- Ausgang: G3-013-Abnahme `0f1cd7e`; Produkt `0462b4c`; Re-QA `40f37f6`
- Dokumentarischer Vorbereitungscheckpoint: `6e97b04`
- Paritaet: SYS-02/03, NEWS-05; Voraussetzung, kein Abschluss von SYS-01/AND-03
- Risiken: R-07/22/26/33/43; ADR-004 und ADR-007 bleiben massgeblich
- Owner: Main/Chief; Delegation: erlaubt, genau eine Fachinstanz gleichzeitig
- Weiterdelegation: nicht erlaubt; kein verschachtelter Pilot in diesem Slice
- Startgate: `START WRN-G3-014` am 28. August 2026 explizit erteilt
- Paketmodus: Umsetzung, enge nachgewiesene Fehlerkorrekturen und unabhaengige
  Nachpruefungen bis zur technisch geprueften Sichtabnahme; PO-071
- Register/Teilauftraege: `docs/WRN-G3-014-DELEGATION-REGISTER.md` und
  `docs/tasks/WRN-G3-014-WORK-PACKETS.md`; alleiniger Owner jeweils Chief
- Nach Start: sequenzielle Fachrollen gemaess Abschnitt Mitarbeiterfolge;
  kein paralleles Schreiben und kein externer kostenpflichtiger Aufruf

## Nutzerziel und bewusste Teilung

Eine bereits geladene App-/Website-Shell kann eine vollstaendig gepruefte
lokale Nachrichtenrevision speichern und spaeter ohne Inhaltsnetz lesen.
Ein unvollstaendiger Updateversuch zerstoert den nutzbaren Stand nicht.
Ein erlaubter Rueckwechsel reaktiviert keine bekannten widerrufenen Inhalte.

G3-014 ist der erste eng begrenzte Schritt des Offline-/Updateplans, nicht
das gesamte Wave-4-Paket. Er fuehrt IndexedDB fuer Inhaltsrevisionen ein,
aber weder Cache Storage noch Service Worker. Ein Website-Neustart mit
vollstaendig ausgeschaltetem Netz wird damit NICHT zugesichert. In G3-014-
Tests wird die Shell weiter lokal ausgeliefert, waehrend alle Inhaltsrequests
gezielt scheitern; dieser Test darf nicht als echter Offline-Kaltstart gelten.
Website-Shellcache, Workeraktivierung und deren Rollback sowie die paketierte
Android-Shell folgen in getrennten, noch nicht nummerierten Folgeauftraegen.
Der MUST-Offlineumfang bleibt bestehen; er wird nicht gestrichen.

## Ausgangslage

- `apps/{mobile,website}/src/local-content-release.ts` liest feste same-origin
  Pfade, erst Descriptor, dann geprueftes Manifest, danach sechs Payloads.
- `packages/content-contracts/src/index.ts` besitzt Descriptor-/Manifest-v1,
  atomare Komplettvalidierung und einen numerischen bekannten Revocationstand.
- Release-v1 enthaelt je Client acht selbst erstellte lokale JSON-Dateien,
  zusammen 18.258 Dateibytes; kein aktueller Live-Newsfeed.
- Noch keine persistente Inhaltsrevision, keine echte Cache-Rueckkehr und
  kein aktiver Service Worker. `?state=offline` ist bislang eine Testansicht.
- Theme, UI-Sprache und Lesestatus sind schon getrennt lokal gespeichert.
  G3-011-Schutz fuer unbekannte Leseschemata bleibt unveraendert erhalten.
- Detailinventar: `docs/evidence/WRN-G3-014-READONLY-INVENTORY.md`.

## Vorgeschlagener lokaler Vertrag nach Start

### Speicher und Besitz

1. Genau eine getrennte Datenbank je Client: `wrn.mobile-content-offline`
   bzw. `wrn.website-content-offline`, IDB-Version 1. Keine Legacy-DB oeffnen.
2. Logische Stores `bundles` und `control`; gemeinsamer reiner Typ-/Validator-
   vertrag, aber getrennte Browseradapter. Kein neues Runtimepaket erforderlich.
3. Ein Bundle enthaelt Descriptor und alle sieben Ressourcendokumente. Sein
   Schluessel bindet die kanonischen Descriptor-/Ressourcenhashes; eine opake
   `releaseRevision` allein ist weder Schluessel noch zeitliche Sortierung.
   Gleiche Release-ID mit anderen Bytes ist Konflikt, kein stilles Update.
4. `control` bindet Storageformat, Generation/Clear-Epoch, Aktiv-/Vorher-/
   Kandidatzeiger, Zeit des letzten kompletten Quellenchecks und monotone
   Revocationsicherheit. Keine Artikeltexte, URLs oder Nutzeraktivitaetslogs.
5. Hoechstens aktiv + vorher + ein Kandidat; je Bundle maximal 4 MiB
   kanonische UTF-8-Dokumentbytes, insgesamt 12 MiB Bundlebudget plus
   256 KiB Control-/Revocationsbudget. Das ist ein Produktlimit, keine
   Garantie fuer freien Browserspeicher. Keine unbegrenzte Historie.

### Laden, Speichern und Wechseln

6. Ohne gespeicherten Stand bleibt der bestehende validierte Online-Lesepfad
   erhalten. Schemaanlage ist erlaubt, automatisches Speichern von Content
   nicht. `Inhalte lokal speichern` ist eine ausdrueckliche Nutzeraktion.
7. Mit gespeichertem Stand wird genau dieser bei jedem Laden zuerst erneut
   validiert und als `Gespeicherter Stand` mit Revision/Pruefzeit angezeigt.
   Offlineberechtigung und Inhaltaktualitaet sind getrennt. Keine Hintergrund-
   downloads, Timerpolls, automatischen Updatewechsel oder Onlinebehauptungen
   allein aus `navigator.onLine`.
8. `Auf neuen Stand pruefen` laedt ueber die bestehenden festen acht Pfade.
   Descriptor-/Compatibilityfehler: kein Manifest-/Payloadrequest;
   Manifest-/Revision-/Hashfehler: null der sechs Payloadrequests.
   Erst vollstaendige Validierung erlaubt einen gespeicherten Kandidaten.
9. `Stand uebernehmen` aktiviert nur einen erneut geprueften Kandidaten.
   Bundle und alle Zeiger werden in EINER IDB-Transaktion konsistent gesetzt;
   erst deren `complete` bedeutet gespeichert. Ein Request-`success` allein
   reicht nicht. Fetch und asynchrones Hashing passieren ausserhalb der
   Schreibtransaktion; darin Generation, Identitaet und Sicherheitsstand
   erneut vergleichen. Veraltete Operationen duerfen nicht committen.
10. Feed, Suche, Reader, Lifecycle und Lesestatus-Reconciliation verwenden
    denselben unveraenderlichen aktiven Snapshot. Fremder Tabwechsel loest
    niemals eine Teilaktualisierung einzelner Bereiche aus. Die statischen
    SEO-Seiten bleiben beim gebauten Publikationsstand; kein Publisherupdate.
11. `Vorherigen Stand verwenden` erfordert Bestaetigung, vollstaendige
    Revalidierung und aktuelle Revocationsicherheit. Kein Erzaehlen eines
    erfolgreichen Rollbacks, wenn der alte Stand nicht mehr zulaessig ist.
12. Teilwrite, Abort, Timeout, Quota, Prozessabbruch oder konkurrierender Tab
    lassen den alten gueltigen Stand unangetastet, soweit keine neu bekannte
    Sperre ihn verbietet. UI meldet fehlgeschlagene Persistenz ehrlich.

### Revocation hat Vorrang vor Verfuegbarkeit

13. Eine Zahl allein verhindert nicht, dass spaetere Revisionen alte Sperr-IDs
    vergessen. Der Controlvertrag bewahrt daher die hoechste verifizierte
    Revocationrevision UND kumulative minimale Sperreintraege/Hashes ohne
    entfernten Payload. Im Slice gibt es keinen Unrevoke-Pfad.
14. Nur gegen Descriptor und Manifest gepinnte, schema-/hash- und semantisch
    gepruefte Lifecycleinformation darf den Sicherheitsstand erhoehen. Sie
    wird unabhaengig von einer Contentaktivierung aufgenommen: Ein spaeterer
    Fehler einer anderen Payload darf bereits verifizierte Sperren nicht
    zuruecknehmen. Unvollstaendig pruefbare Daten sind keine neue Autoritaet.
15. Vorrangstrategie fuer diesen ersten Slice: Eine Revision unterhalb des
    Floors oder mit fehlenden bekannten Sperren ist als GANZES nicht offline
    aktivierbar. Keine nachtraegliche Umschreibung gehashter Altdokumente.
    Falls erforderlich wird die letzte Inhaltsansicht geschlossen, statt
    einen widerrufenen Artikel als verfuegbar darzustellen.
16. Der Safety-Commit invalidiert betroffene Zeiger und entfernt betroffene
    gespeicherte Bundles. Misslingt dieser Write, wird der aktuelle Client
    fail-closed gesperrt; kein Anspruch auf dauerhaften Takedownschutz trotz
    nicht verfuegbarem Storage. Neue verifizierte Sperren werden in der
    Sitzung trotzdem nicht ignoriert. Wiederanlauf muss neu abgleichen.
17. Vor Aktivierung, Readerzugriff und Rueckkehr aus dem Hintergrund wird
    der Controlstand erneut geprueft. Tabbenachrichtigungen sind nur Hinweise,
    keine Autoritaet. Gleiches Revocationlevel mit widerspruechlichen Daten
    ist ein Konflikt. Clear-/Update-/Rollback-Rennen besitzen Generation-Fences.

P1-Praezisierung zu 4/16/17 (innerhalb PO-071): Vor einem Quellencheck bei
vorhandenem offlineberechtigtem Stand muss ein generation-/clearEpoch-
gebundener Pending-Recheck-Marker in `control` transaktional bestaetigt sein.
Scheitert diese Vorbereitung, startet kein als sicher vorbereiteter
Updatepfad. Ein RAM-Flag allein genuegt nicht fuer den Wiederanlauf nach
fehlgeschlagenem Safetywrite. Nur ein nachweislich abgeschlossener passender
Abgleich mit gesichertem Ledger und aktueller Generation darf den Marker
entfernen; niemals `finally`, Timeout, Unmount oder ein fremder Tab.
Ein ausstehender Marker bei Neustart, Resume oder Readerguard verlangt
Schutzmodus und expliziten Quellencheck, keinen A-Fallback oder automatischen
Hintergrunddownload. Inhaltsloeschung erhaelt die ausstehende Sicherheitspflicht
und sperrt ueber Clear-Epoch alte Operationen; sie behauptet keinen erfolgreichen
Quellencheck. Fehlende/verlorene Controlmetadaten bleiben die in 18/23
beschriebenen ehrlichen Browsergrenzen. Kein neuer Store oder neues Feature.

### Fehler, Loeschung und Aufbewahrung

18. IDB nicht verfuegbar: gueltiges Onlinebundle bleibt sitzungsweise lesbar,
    aber nie als gespeichert bezeichnet. Nicht lesbarer/beschaedigter/neuerer
    DB- oder Controlvertrag bleibt unangetastet; keine stille Neuerzeugung
    oder Downgrade-Migration. Unklarer Safetyzustand sperrt Offlineaktivierung.
19. `versionchange` schliesst eigene Verbindungen; `blocked`/`VersionError`
    zeigt einen behebbaren Status. IDB-Operationen haben einen 5-s-Waechter;
    spaete Ergebnisse nach Abort/Unmount duerfen keinen UI- oder DB-Commit
    mehr ausloesen. Keine Entladeaktion als einzige Persistenzstrategie.
20. Bestehende 512-KiB-Transportgrenze pro Dokument bleibt; sie ist beim
    Lesen des Streams und nicht erst nach unbegrenztem `arrayBuffer()`
    durchzusetzen. Ein Update hat maximal 15 s Gesamtzeit; je Request 5 s.
    Maximal eine Operation je Clientinstanz, keine automatischen Retries.
21. Offline-Lesefrist fuer den lokalen Slice: 24 Stunden seit erfolgreichem
    vollstaendigem Quellencheck. Cachelesen/Rollback verlaengert sie nicht.
    Abgelaufene oder rueckwaerts laufende beobachtete Zeit fordert erneuten
    Quellencheck; erzeugtes Inhaltsdatum bleibt separat sichtbar. Kein
    manipulationssicherer Zeit-/Lizenzschutz gegen Geraeteuhr oder Originreset
    wird behauptet; echte Contentpolitik benoetigt spaeter ein eigenes Gate.
22. `Lokale Inhalte entfernen` loescht in einer Transaktion Bundlepayloads,
    Zeiger und Offlineaktivierung, erhoeht Clear-Epoch und verhindert spaete
    Re-Population. Theme, Sprache, Gespeichert/Gelesen/Progress bleiben
    unveraendert. Minimale Sperrmetadaten bleiben sichtbar erklaert erhalten;
    dies ist NICHT `Alle lokalen Daten loeschen`. Kein fremder Cache/Store
    darf geloescht werden, kein `localStorage.clear()`/globales DB-Loeschen.
23. Browser-Eviction und vollstaendige manuelle Originloeschung sind kein
    beherrschbarer Approllback. Fehlende Safetydaten bei vorhandenen Bundles
    bedeuten Schutzmodus. Nach vollstaendigem Originverlust ist ein frischer
    Quellencheck erforderlich; keine Phantom-Offlinegarantie.

## Erlaubte Pfade erst nach Start und Vorreview

- Backend: additive Typen/Validatoren in `packages/content-contracts/src/`
  und reine Uebergangsregeln/Exports in `packages/domain/src/`, jeweils Tests.
  Bestehende Manifest-, Descriptor-, Lifecycle- und Lesestatus-v1-Semantik
  darf nicht abgeschwaecht oder still neu versioniert werden.
- Backend: `apps/mobile/src/content-offline-store.ts`, entsprechende
  Website-Datei, eng benannte Lifecycle-/Transporthelfer, getrennte
  `local-content-release.ts` und deren Tests. Keine Client-Querimporte.
- Testdaten: neue selbst erstellte A/B/C- und Negativfixtures ausschliesslich
  in `packages/test-support/src/g3-014-offline-fixtures.ts`, enger Export
  und Tests; Browserharness unter `tests/e2e/`. Kein Fixtureimport aus
  Produktquellen, normalen Builds oder Publishern. Bestehende public-
  Release-v1-Dateien bleiben unveraendert; Varianten nur Test-Routen.
  Der aktuelle Releasechecker erfasst auch Clienttestimporte: deshalb kein
  direkter Test-Support-Import unter `apps/*/src`, auch nicht in Tests.
  Gemeinsame Varianten nur im externen E2E-Harness/Test-Support pruefen.
- Frontend: beide `App.tsx`, eng notwendige Offlinepanel-/Statuskomponenten,
  deren Styles/Tests; `packages/ui-language/src/` nur neue G3-014-Schluessel
  und alle neun Uebersetzungen. Bestehende Copy/Marke/Header bleiben gleich.
- Tests: neue `tests/e2e/content-offline.spec.ts`; eng gebundene Anpassungen
  bestehender No-Side-Effect-Assertions. Nur die exakten neuen IDB-Namen und
  Datenklassen zulassen, nicht Storagepruefungen entfernen.
- G3-014-Task-, Evidenz-, Handoff- und Statusdokumente.

Die Vorbereitung war ausschliesslich dokumentarisch. Nach PO-071 und GREEN-
Vorreview gelten die oben benannten Produkt-/Testpfade.
Dependencies, Package-Manifeste, Rootconfig/Lockfile, Publisher, Assets,
Service Worker, Cache Storage, Android, echte Inhalte/Legacydaten,
Remote/CI, Livezugriffe, Deployments und Releases bleiben gesperrt.

## Akzeptanz, Mitarbeiterfolge und Stoppregeln

1. Nach `START WRN-G3-014` zuerst frischer `independent_architecture_reviewer`
   read-only: insbesondere Sicherheitsledger, IDB-Transaktionsreihenfolge,
   Zeit-/Storageausfall und Abnahmevertrag. Er darf nur Bericht/Handoff
   schreiben. Bei Finding kein Produktcode bis zur Chief-Disposition und
   bestandenem Vorreview; notwendige PO-Entscheidungen nicht vorwegnehmen.
2. Bei GREEN ein `backend_data_reliability_engineer` fuer Vertrag, reine
   Domain, zwei getrennte Adapter/Loader und rote Fehlerfalltests. Exporte
   und Client-Imports an der echten Packagegrenze vor Handoff kompilieren.
3. Nach gesichertem GREEN-Checkpoint und beendetem Backend ein frischer
   `frontend_brand_engineer`: getrennte Oberflaechen, neun Sprachen und Tests.
4. Nach Kandidat/Handoff und beendetem Frontend ein frischer
   `qa_release_engineer`: volle unabhaengige G3-014- und Regressionsmatrix.
5. Danach bei GREEN ein frischer `independent_architecture_reviewer` fuer
   abschliessende read-only Storage-/Rollback-/Revocationkontrolle.
6. Technisches GREEN ersetzt keine sichtbare PO-Abnahme. Reserve
   `incident_debugger` nur bei reproduzierbar widerspruechlichen Befunden;
   `security_privacy_reviewer` bei ungeklärter Sicherheitsgrenze. Keine
   parallelen Vollreviews. PO-071 erlaubt interne scoped Korrekturen mit
   gesichertem Finding, Regressionstest und unabhaengiger Re-QA. QA korrigiert
   niemals selbst Produktcode; vor Rueckgabe an Implementierer Rechte sichern.

Alle Kontrollfaelle aus dem separaten Abnahmeplan muessen bestehen. Bei
Scope-/Vertragsluecke stoppen, nicht improvisieren. Empfehlungen sind kein
Startsignal. Bestehende browsergestuetzte Tests nutzen die gebundene Node-
24.19-/pnpm-11.19-Toolchain; keine Installation neuer Test-/DB-Bibliotheken.

## Ruecknahme

Produktcode-Ruecknahme nur auf dokumentierten kompatiblen Kandidaten; keine
Loeschung neuer DBs als Git-Rollback-Nebenwirkung. Unbekannte neuere Daten
bleiben geschuetzt. Ein altes G3-013-Programm kennt den neuen Offlinevertrag
nicht und ist deshalb kein belegter produktiver Takedown-/Datenrollback.
Die historische Vorbereitung aenderte nur Dokumente. Ab PO-071 werden
Produktkandidaten separat gesichert; Produktrollback ist nicht gleich
Datenrollback. Details/Quellen stehen in Inventar und Vorpruefung.

END-CHECK: :)
