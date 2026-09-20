# WRN-G3-015 – Website offline oeffnen und Shellupdates sicher wechseln

## Identitaet und Gate

Aktuelle Durchfuehrungsdisposition vom Chief: Outcome A ist freigegeben und
umgesetzt. Eingefrorener Produkt-/Testkandidat
`1dc087f3b3c9a73330f2481b3c2c444548eb00d6`; P1, P2, P3, P4-Q, P4-S und
P4-A GREEN/beendet. Der versiegelte Securityscan deckt 40/40 Positionen ab
und meldet null reportable/deferred Findings. G3-015 ist technisch zur
lokalen PO-Sichtabnahme bereit. Alle Slots und Schreibrechte sind frei.
Hosting, Live, Mobile, Android, Google Play, Signierung, Upload, Deployment
und Release bleiben getrennt gesperrt. Die folgenden benannten Startsaetze
und Kandidaten dokumentieren fruehere Zwischenstaende und starten keine
zusaetzlichen Mitarbeiter.

- Datum: 28. August 2026; Auftraggeber: Product Owner, „ok machen wir das
  naechste grosse paket“. PO-072 bindet die Vorbereitung des neuen Umfangs.
- Historischer Start-/P2-Status: durch PO-074 GESTARTET; P1-Recheck5c78ff9 und P2 GREEN/beendet.
  P2-Kern b062ab7/Testbuild5ede03d/Evidence7256d6a vom Chief uebernommen;
  jetzt S5/P3 gemaess WRN-G3-015-FRONTEND-PACKET.md, Startcheckpoint1e27d1f.
  Folgende P1-/P2-Startsaetze sind Historie, keine erneuten Mitarbeiterstarts.
- Vorbereitung `29d6766`; Startauftrag exakt
  `G3-014 VISUELL AKZEPTIERT – START WRN-G3-015`.
- Basis: `2191b0f`, Produkt `44b5cb1`, G3-014-QA `999b777`, Architektur `0b2bd2f`.
- G3-014 ist durch PO-073 mit Produkt `44b5cb1`, QA `999b777` und
  Architektur `0b2bd2f` visuell akzeptiert. Buttonfeinschliff bleibt vorgemerkt.
- Paritaet: Websiteanteil SYS-01/03, Voraussetzung WEB-04; R-07/22/33/43.
- Zielarchitektur: ADR-007; Mobile/Android-Shell bleibt getrennt.
- Owner/Slotvergeber: Chief; Register `docs/WRN-G3-015-DELEGATION-REGISTER.md`.
- Historischer P1-Start: genau ein unabhaengiger Vertragsreview; nur dessen Bericht/Handoff
  schreibbar. Produkt-/Test-/Buildkonfiguration vor GREEN gesperrt;
  nicht mutierende Baselinepruefungen mit vorhandener Toolchain sind erlaubt.
- Nach Start wird zuerst der Vertrag unabhaengig geprueft. Kein Produktcode
  vor GREEN; dann gesamtes Paket einschliesslich belegter enger Korrekturen
  und unabhaengiger Rechecks. Neue Produkt-/Architektur-/Befugnisentscheidungen
  bleiben Rueckfragegrenzen. Keine Freigabe eines unbekannten Folgeslices.

## Nutzerziel

Nach bewusstem Bereitstellen der Website fuer Offline-Nutzung und Speichern
der Inhalte kann sie bei vollstaendig blockiertem Netz erneut geoeffnet werden.
Die Oberflaeche startet; gepruefte, noch zulaessige Inhalte kommen aus G3-014.
Ein Oberflaechenupdate zerstoert weder den laufenden Stand noch lokale Daten.
Fehlende Inhalte werden ehrlich angezeigt, nicht aus einem zweiten Cache ersetzt.

Das ist ein grosses Websitepaket, nicht die Fertigstellung aller Offlineziele:
Android-Paketierung, Medien, Hilfe-Offlinepakete, echter Legacy-Cutover und
produktive Hosting-/Updatefreigabe bleiben eigene Auftraege.

## Read-only-Ausgangslage

- `apps/website/src/main.tsx` mountet React ohne Service-Worker-Registrierung.
  In beiden Produkt-Clients wurde keine SW-/Cache-Storage-Nutzung gefunden.
- `apps/website/package.json`: Vite-Build, danach statische Artikelintegration.
  Deren Ausgabevertrag darf durch den Shellgenerator nicht veraendert werden.
- Vorhandener lokaler Build: `index.html` 495 Bytes, vier Assets zusammen
  2.058.039 Bytes. Das ist eine Bestandsmessung, kein frisch reproduzierter Build.
  Vor Implementierung werden Assetmenge und Importgraph erneut gebunden.
- `tests/e2e/global-setup.ts`: gebauter strikter Website-Server 43174;
  43175 ist ein separater Sourceharness, kein Built-/Offline-Kaltstartbeleg.
- G3-014 besitzt getrennte IDB-Inhalte und ihre Sicherheits-/Zeitregeln;
  die Oberflaeche muss bisher weiterhin vom Server geladen werden (OFF-26 OUT).
- Kein Legacy-/Livezugriff, Build, Testlauf oder Cacheexperiment in Vorbereitung.

## Grundvertrag (durch Bindungen B1–B4 unten praezisiert)

1. Nur Website, erst nach bewusster Nutzeraktion „Website offline bereitstellen“.
   Normaler Besuch und Source-Devmodus registrieren keinen Worker. Die mobile
   App registriert auch spaeter in diesem Paket keinen Websiteworker.
2. Ein stabiler Workerpfad innerhalb der Website; nur eigener Scope/Namespace
   `wrn.website-shell.v1.*`. Keine fremden Registrierungen/Caches veraendern.
   HTTPS ist spaeter Betriebsbedingung; lokale Tests auf isolierter Loopbackorigin.
3. Deterministischer Buildmanifest-Vertrag: Shell-ID, Format/Compatibility,
   explizite erlaubte Pfade, MIME, Bytegroesse und SHA-256 fuer HTML/JS/CSS und
   benoetigte bereits lizenzierte Markenassets. Keine HTML-Artikel, Content-
   JSONs, Sitemap, robots, Medien, Sourcecode oder Drittanbieterantworten.
4. Neue Shell wird vollstaendig separat aufgebaut und geprueft, bevor sie
   nutzbar wird. Fehlender/kaputter Pflichtbestand, Abbruch oder Quote duerfen
   den letzten vollstaendigen Stand nicht verdrängen. Kein beliebiger Runtimecache.
5. Planbudget: hoechstens 8 MiB je Shellgeneration, maximal drei Generationen
   (aktiv, vorher, Aufbau ODER wartend), 24 MiB Nutzbytes plus 64 KiB Metadaten.
   Harte Stream-/Dateigrenzen, 10 Sekunden je Asset und 30 Sekunden je Aufbau.
   Vorreview bestaetigt Grenzen gegen Build und Importgraph; kein stilles Anheben.
6. Navigation network-first mit begrenzter Wartezeit gemaess ADR-007, aber nie
   fremde/neue HTML-Generation mit alten Assets vermischen. Eine Netzantwort
   wird nur bei belegter aktiver Shellkompatibilitaet verwendet; sonst bleibt
   der vollstaendige alte Stand und das Update wartet. Der Vorreview muss diese
   Kombination konkret festlegen, bevor Worker-/Fetchcode geschrieben wird.
7. Neue Worker warten nach Browser-Lifecycle auf das Ende alter kontrollierter
   Tabs. Kein pauschales `skipWaiting()`/`clients.claim()`, kein erzwungener
   Reload fremder Tabs. UI erklaert, wann Schliessen und erneutes Oeffnen noetig
   ist. Automatische Aktivierung nach Ende aller alten Clients wird nicht als
   weitere explizite Nutzerbestaetigung ausgegeben.
8. Nur feste Shellpfade beantworten. Root-/Hashnavigation und vorhandener
   `?article=`-Reader bleiben erhalten; Querywerte werden nicht als neue Cachekeys
   oder Logs persistiert. Keine globale SPA-Antwort fuer `/articles/`, unbekannte
   Pfade, Contentrequests oder Fehlerseiten. Statische SEO-Pfade bleiben online
   unveraendert und erhalten offline keinen gecachten alten Artikeltext.
9. Content-, Descriptor-, Manifest- und Safetyrequests werden vom SW weder
   beantwortet noch gespeichert. Ausschliesslich der bestehende G3-014-Controller
   entscheidet ueber Inhaltsnutzung, Alter, Sperre und Wiederherstellung.
    Shellbereit bedeutet nicht Content gespeichert oder Content zulaessig.
    Artikelbilder/Audio/Video erhalten dadurch keine Offlinegarantie;
    vorhandene ehrliche Medienfallbacks bleiben, keine Mediencache-Erweiterung.
10. Versionswechsel migriert/loescht keine G3-014-IDB, Sprache, Theme oder
    Lesestatus. Unbekannte neuere Shellschemata bleiben geschuetzt; kein blinder
    Reset. Gezieltes Aufraeumen nur bekannter eigener ungeschuetzter Generationen.
11. „Offline-Oberflaeche entfernen“ ist getrennt von „Inhalte entfernen“ und
    bestaetigungspflichtig. Nur eigene Registration/Caches; laufende Seiten
    koennen bis zum Schliessen kontrolliert bleiben. Keine falsche Komplett-
    loeschmeldung, kein Nachfuellen durch laufende Installation nach Abbruch.
12. Lokaler Code-Rollback wird als vollstaendiges vorheriges kompatibles
    Websitepaket getestet, nicht als Content-Rollback. Vorherige Shell erhalten;
    automatische Aktivierungs-/Bereinigungsreihenfolge braucht expliziten
    Mehrtab-, Wiederanlauf- und Quote-Nachweis. Kein Produktionsrollbackauftrag.
13. Fehlende API/Privatmodus/Storageausfall: online weiter nutzbar und ehrlicher
    Status, kein behaupteter Offlineschutz. Eviction/Originverlust, Browser-
    Force-Reload und allererster Aufruf ohne Netz erhalten keine Offlinegarantie.
14. Keine externen Requests, Telemetrie, Background Sync, Push oder APIkosten.
    Registrierungs-/Aktivierungsnachrichten strikt typisiert und validiert;
    Nachrichten duerfen keine frei waehlbaren URLs, Caches oder Loeschziele steuern.

Die folgenden Bindungen uebernehmen die konkreten B1–B4-Schliessungen des
unabhaengigen P1-Berichts `ac5aef1`. Sie konkretisieren innerhalb ADR-007 die
zuvor offenen Regeln, haben bei ungenauer Formulierung oben Vorrang und sind
keine Produkt-GREEN-Behauptung. P2 bleibt bis zum engen Dokumentrecheck gesperrt.
Eine ADR-Abweichung oder neue Datenverlust-/Befugnisgrenze geht an den PO.

## Verbindliche Chief-Praezisierungen B1–B4 nach P1

### B1 – Geschlossener Build und generationstreues network-first

- Stabiler generierter Worker `/website-shell-sw.js`, Scope `/` nur auf der
  isolierten Websiteorigin. Fremde Rootregistration anhand Scope/Scriptbesitz
  erkennen und nicht ersetzen. Rootkontrolle erlaubt keinen SEO-Cache.
- Reihenfolge Vite -> unveraenderter statischer Publisher -> Shellgenerator.
  Vite-Manifest ueber die erlaubte Website-Buildzeile; nur geschlossener
  transitiver Shellimport-/CSS-Graph und genau die zwei vorhandenen Markenbilder.
  Kein `dist/**`. Unbekannte dynamische Imports, CSS-URLs oder Assetklassen
  lassen den Build scheitern. Generierte Ausgaben sind keine Quellpflege.
- Kanonisch sortiertes Format/Compatibility/Pfade/MIME/Bytes/SHA-256-Dataset.
  Shell-ID bindet Dataset und Worker-/Protokollfassung; Manifest fest im Worker,
  keine mutable Runtime-Vertrauensquelle. Workerbytes nicht selbst als Payload
  hashen. Budgets und reproduzierbarer Graph werden bei jedem Build geprueft.
- Nur GET-Navigation `/` und `/index.html`; Hash und Queryreader bleiben in der
  Browser-URL, aber nicht in Cachekeys/Logs. HTML-Netzprobe immer fester Pfad
  ohne Nutzerquery, no-store, credentials omit, referrerPolicy no-referrer,
  redirects error, fuenf Sekunden Gesamtablauf einschliesslich Body.
- Netz-HTML erst nach 200, erwarteter MIME, begrenzter Bytezahl und exakt dem
  HTML-SHA der bedienenden Generation ausliefern. Kein Vorabstreaming.
  Fehler/Timeout/anderer Hash -> vollstaendige eigene Cachegeneration, keine
  Runtimewrites. Gleiche Schema-ID oder HTTP 200 ist keine Generationstreue.
- Assets ausschliesslich genaue Manifestpfade derselben Generation; keine
  globale caches.match-Suche, keine Einzelassetkaskade A/B, kein Runtimefill
  oder stille Teilreparatur. Integritaets-/Lesefehler ehrlich degradiert.
  Content, Safety, SEO, Medien, unknown und externe Requests nicht behandeln.

### B2 – Install vor Aktivierung, Browserlifecycle und Paketrollback

- Alle Pflichtbytes, Integritaet und persistenter Ready-Beleg vor erfolgreichem
  install.waitUntil. Generation danach ohne kritischen activate-Schreibschritt
  nutzbar. Unfertige Stage nie ausliefern. Bedienen ist an Workeridentitaet
  gebunden, nie an einen vorzeitig umgelegten globalen Activepointer.
- Activate darf nur idempotente, nichtkritische Status-/Cleanupnacharbeit tun.
  Fehlende Nacharbeit macht B nicht unlesbar und loescht A nicht. Cleanup erst
  nach positivem Ready-/eigener-Activeidentitaet-/Rollbackabgleich; sonst
  behalten und weitere Updates blockieren. Aktivierungsfehler sind kein
  behaupteter Browserrollback auf A.
- Kein skipWaiting, clients.claim, erzwungener Reload oder eigener Tabzaehler
  als Ersatz fuer den Browserlifecycle. Alte Tabs bleiben A; Refresh kann A
  halten, alle kontrollierten Clients schliessen erlaubt Browserwechsel.
  Erstbereitstellung unterscheidet gespeichert von bereits kontrollierter
  Seite; waiting/aktiv/pending sind eigenstaendige beobachtbare Zustaende.
- Rollback: komplettes kompatibles G3-015-faehiges Paket A am stabilen Workerpfad,
  A voll pruefen oder exakt manifestgebundenen Cache verifizieren/wiederverwenden,
  Waiting respektieren, danach A bedienen und B als vorherige Shell erhalten.
  Vor-SW-Produkt 44b5cb1 ist kein automatischer SW-Rollbackpartner; Ruecknahme
  darauf ist ein spaeterer Betriebsauftrag, keine jetzige Garantie.
- Unknownschema, fremder Besitzer oder inkompatibler Rollback bleibt read-only/
  degraded, keine Migration/Loeschung. G3-014-IDB/Safety nicht dafuer oeffnen.
- Pflichtprobe: Unterbrechung nach Ready, waehrend Activate, vor erstem B-Fetch;
  danach vollstaendige Generation. Fehlgeschlagenes Install allein reicht nicht.

### B3 – Harte drei Slots, waiting zaehlt mit

- Genau aktiv + vorher + (Aufbau ODER waiting). P vorher/A aktiv/B waiting
  blockiert C vor Payloadrequests/-writes: kein vierter Slot, kein Opfern von
  P/A/B und kein manuelles Verwerfen des wartenden Workers. Nach B-Aktivierung
  A schuetzen, P erst bei positivem Lifecycle-/Ready-/Rollbackabgleich loeschen.
  Cleanupfehler blockiert C; keine Budgeterhoehung oder Cachealterheuristik.
- Alle Operationen unter B4. Nur belegte eigene bekannte verwaiste Stages
  bereinigen. Unknown bleibt unberuehrt und blockiert bei unklarem Budget.
- 8 MiB je Generation, 24 MiB dekodierte Payloadbytes insgesamt, alle eigenen
  Metadatenduplikate zusammen maximal 64 KiB. Kein unbeschraenktes Journal.
  Das garantiert nicht physische Browserplattenbelegung, HTTP-Cache,
  Worker-Scriptstore oder Browseroverhead unter 24 MiB.
- Zehn Sekunden pro Datei, 30 Sekunden Gesamtaufbau inklusive Lockwartezeit.
  Body/Streams zaehlen; Cacheput nur bereits gepruefte begrenzte Bytes.
  Bei Deadline keine unawaited Restschreibarbeit: Lock bis zur bestaetigten
  Quieszenz halten; ungeklärter Storageabschluss bleibt pending statt Erfolg.
- Pflichtprobe P/A/B-waiting -> C abgewiesen -> A-Seiten zu -> B aktiv -> P
  gesichert bereinigt -> C erneut moeglich; Budget gilt bei allen Zwischenstaenden.

### B4 – Dauerhafte Entfernsperre und gemeinsame Schreibserialisierung

- Ein fester exklusiver benannter Web Lock fuer alle eigenen Control-,
  Generation- und Registrationmutationen aus Window, aktivem/installierendem
  Worker und Cleanup. Keine Zeitlocklease; fehlende Web-Locks-API online-only.
- Genau ein versionierter Controlrecord im eigenen Metadatencache
  `wrn.website-shell.v1.control`: Enable-Epoch, enabled/removing/removed,
  begrenzte Generationsdeskriptoren. Keine Artikel, Querywerte oder Profile.
  Fehlend/malformed/unknown ist nicht enabled. Besuch ohne Opt-in erzeugt
  keinen Controlcache; spaeter bewusst installierte Shell wird nicht ignoriert.
- Installer haelt denselben Lock fuer begrenzten Aufbau und alle awaited
  Cacheoperationen. Remove darf best-effort abbrechen, wartet aber ehrlich auf
  Quieszenz. Keine Lockfreigabe bei noch ausstehenden eigenen Cachewrites;
  kein Timeoutabschluss mit spaeter weiterlaufenden Writes.
- Remove schreibt unter Lock zuerst dauerhaft removing + disabled + neue Epoch,
  danach nur bekannte eigene Payloadcaches loeschen und eigene Registration
  abmelden. Alte UI-/Installeraktionen tragen erwartete Epoch und werden
  gesperrt. Neues Enable erfordert eine neue ausdrueckliche Nutzeraktion.
- ACK/unregister(true)/leere Momentliste sind kein Abschlussbeweis. Eigene
  Payload-/Registrationreste, in-flight und waiting pruefen. Ungeklaerte
  Quieszenz/Cleanup -> pending oder Fehler/fail-closed, keine Komplettloeschung.
  Bis zum Schliessen fortbestehende Seitenkontrolle separat erklaeren.
- Crash nach durable removing: naechster bekannter Adapter-/Workerstart setzt
  enges Cleanup idempotent fort, ohne Neuregistrierung/Downloads/Contentzugriff.
  Alte Epoch unbrauchbar; Controlverlust disabled. Browserlocks serialisieren
  Beteiligte, sind keine atomare Cache-/Registration-Transaktion.
- Nach Entfernen bleibt absichtlich nur der kleine disabled/removed-
  Schutzmarker (innerhalb 64 KiB). Nutzertext darf keine Loeschung aller
  Origindaten behaupten: Ziel sind Offline-Shellpayloads, nicht Schutzmarker,
  G3-014-Inhalte oder fremde Daten. Unknownschema/fremde Registrierung nicht
  ersetzen/loeschen, sondern degradiert stoppen.
- Pflichtproben: echte Cache-open/put/delete-Barrieren und Termination,
  spaete Promises, zweites Fenster Enable gegen Remove, Wiederanlauf nach
  durable removing. Nachrichten streng Protokoll/Request-ID/erwartete Epoch/
  same-origin Client gebunden, keine frei waehlbaren Ziele.

Der P1-Bericht `docs/evidence/WRN-G3-015/ARCHITECTURE-PRECHECK.md` bindet die
SHELL-01–12-Verfeinerungen und primaeren API-Quellen. Diese Sollmatrix gehoert
zur Umsetzung; weder injizierte Resultate noch ein Sourceharness ersetzen
die dort verlangten realen Built-/SW-/Restart-/Fehlerablaufbelege.

Frische Chief-Baseline 28.08.2026: 224+8 Tests, 19 Boundaries, sieben Typechecks,
beide Builds und Releaseboundary GREEN; keine neue Browsermatrix behauptet.
Frischer Shellgrundbestand 1.841.533 Bytes (index 495, vier Assets 1.841.038),
Hashliste im P1-Bericht. Alte Messzahl oben bleibt historische Bestandsmessung.

## Dateieigentum nach GREEN-P1

Bis GREEN-P1 sind alle folgenden Produktpfade gesperrt. Danach enger Schreibscope:

- Backend/Data: neue `apps/website/src/offline-shell/**`,
  `apps/website/tools/build-offline-shell.mjs` und zugehoeriger Test;
  Website-`package.json` nur fuer den deterministischen lokalen Buildschritt.
  Keine Dependency-/Lockfileaenderung. Worker-Ausgabe nur generiertes Buildartefakt.
- Frontend: Website `App.tsx`, `main.tsx`, enge `styles.css`-Ergaenzungen,
  neue Shell-UI-Tests; `packages/ui-language/src/index.ts` und `index.test.ts`
  nur additive Website-Shellschluessel, kanonisches Englisch und Vollstaendigkeit.
- Sprachhelfer: ausschliesslich neue Schluessel in den acht bestehenden
  `packages/ui-language/src/catalogs/{de,es,fr,it,pt,tr,ru,el}.ts`.
- Tests: neue `tests/e2e/website-shell-*.spec.ts` und isolierter Helper/Config;
  `tests/e2e/global-setup.ts` nur falls ein eigener Built-Shellserver noetig ist.
  Keine Abschwaechung alter Null-SW-Erwartungen fuer nicht aktivierten Modus.
- Chief: Task-/Evidence-/Handoff-/Register-/Statusdokumente. QA/Reviews schreiben
  nur eigene Belege, keine Selbstkorrektur an Produkt oder Bestandstests.

Mobilequellen, Contentvertraege/-Controller/-Stores, Releasefixtures,
Publisher/SEO-Generatoren, Brandassets, allgemeines Design und Rootconfig
bleiben read-only. Jede eng zwingende zusaetzliche Datei wird vor Aenderung
mit Ursache und Owner nachgetragen, nie pauschal ein ganzer Ordner freigegeben.

## Mitarbeiterfolge und begrenzter Pilot

Delegation: durch PO-074 erlaubt; global maximal zwei Subagenten einschliesslich
wartender Instanzen und Nachkommen. Sonst strikt sequenziell.
Weiterdelegation: nur P3-Frontend-Fachlead an genau einen Spark-Sprachhelfer.
Maximale Tiefe Main -> Fachlead -> Helfer; Helfer delegiert nicht.

1. P1: frischer unabh. Architekturreview Sol/high, nur Vertragsreview/Handoff.
2. P2: Backend/Data Terra/high, Test-first Shellvertrag/Build/Worker/Adapter,
   echte Browserproben und gesicherter API-Handoff; danach Ende.
3. P3: Frontend-Fachlead Terra/high bindet zunaechst maximal zwoelf neue
   Copykeys und ihre Bedeutungen, englische Texte sowie UI-API als Checkpoint.
   Erst danach reserviert Chief den zweiten Slot fuer einen
   `spark_micro_task_worker` mit genau diesen Keys in acht Katalogdateien.
   Lead bearbeitet waehrenddessen nur Website-UI/Tests, keine Katalogdatei
   und keinen Copyvertrag. Unvollstaendige Zwischenstaende sind keine Kandidaten.
   Helfer liefert Tests/Diff/Handoff und endet; Chief gibt Schreibrechte frei,
   Lead integriert und prueft neun Sprachen. Kein zweiter Helfer parallel.
4. P4: frischer Security/Privacy-Review Sol/high, danach unabh. Gesamt-QA
   Terra/high mit visueller Matrix, dann gezielter Architekturabschluss Sol/high.
5. Chief uebernimmt Ergebnis und Pilotauswertung, kurzer Kontinuitaetscheck,
   sichtbare PO-Abnahme. Technisches GREEN ist keine Veroeffentlichung.

Pilotnutzen: vorbereitete Katalogarbeit ist vom technischen SW-/UIvertrag
trennbar; Lead bleibt fachlicher Owner. Maximal ein Helferauftrag und eine
Rueckmeldungsrunde. Bei wechselnden Keys, unklarem Sprachsinn, Modellfehler oder
fehlender Runtime-Weiterdelegation kein improvisierter Agentenpool: Chief
dispatcht denselben begrenzten Auftrag direkt oder Lead arbeitet selbst weiter.
Tokenkosten, soweit messbar, sonst unbekannt; keine Einsparungszusage.
Koordinationsaufwand, Nacharbeit und Fehler werden im Handoff bilanziert.

## Abnahme- und Testmatrix (SHELL-01 bis SHELL-12)

1. Normalbesuch/Dev/Mobile: keine Registrierung und kein Shellcache.
2. Bewusste Bereitstellung: nur vollstaendige hashgebundene Shell wird bereit.
3. ECHTER Web-Kaltstart: Shell und Inhalt vorbereiten, alle Seiten schliessen,
   Browserprozess sauber beenden, gesamten Netztransport sperren, denselben
   isolierten Profilstand erneut starten; Root/Hashreader funktionieren.
   HTTP-Cache reicht als Beleg nicht: Server/Netzsperre plus aktive Worker-
   Zuordnung und Cacheprovenienz nachweisen; Source-/Routenmocks reichen nicht.
4. Shell ohne gespeicherten Inhalt, abgelaufener/gesperrter Inhalt, Uhrregression:
   ehrliche G3-014-Zustaende, keine Umgehung durch Cache oder HTML.
5. A -> kaputtes B: A bleibt nutzbar; Hash/MIME/Redirect/404/Quote/Timeout/Abort.
6. A -> vollstaendiges B: neuer Stand wartet, mehrere alte Tabs bleiben konsistent;
   nach Ende alter Clients neue zusammengehoerige Shell und unveraenderte Inhalte.
7. Lokaler Paketrollback B -> kompatibles A, unbekanntes Schema und Abbruch
   waehrend Aktivierung: keine Datenloeschung oder ungepruefte Mischgeneration.
8. Entfernen/Cancel/Installationsrace, erneutes Oeffnen; fremde Cache-/SW-Sentinel
   sowie IDB/Sprache/Theme/Lesestatus bleiben unveraendert.
9. Direkte SEO-/unknown-/Content-/externe URLs: keine falsche Shellantwort,
   kein Contentcache, kein neues Logging oder Externrequest.
10. Neun Sprachen, Themes, alle Websiteviewports aus Quality Rules; 200 Prozent
    initial und nach Mount, Tastatur, Fokus, Axe, 44-Pixel-Touchziele.
11. Frische volle G3-014-Regressionsmatrix beider Clients plus neue Shellfaelle;
    exakte vorhandene Toolchain, Unit/Contract/Boundary/Build/Reproduzierbarkeit.
12. PO-Belege: normal -> bereit -> vollstaendig offline neu geoeffnet -> Update
    wartet -> neues Paket -> Entfernen/Cancel, Originalbilder mit Build/Viewport.

SHELL-03 gilt nur fuer die getestete Website/Browserkombination nach erfolgreicher
Vorbereitung. Ein physischer Flugmodus-/Androidgeraetebeleg wird nicht daraus
abgeleitet. OFF-26 wird dadurch hoechstens fuer diesen Webteil geschlossen.

## Kosten, Grenzen und Uebergabe

Vorhandene Tools/Abos, neue APIausgaben 0 CHF. Keine Installation, Live-/Legacy-
Mutation, neuen Medien, Cloud, Remote/CI, Android, Signierung, Deployment oder
Upload. Lokale Tests nur eigene isolierte Profile/Origins; bestehende PO-
Vorschauen nicht zur SW-Migration oder Loeschprobe verwenden.
Handoffs nennen Quellencommit, genauen Dateiscope, Tests/Exitcodes, getrennte
Implementierer-/Reviewerbelege, Grenzen und END-CHECK. Keine endlosen Vollreviews
ohne neue Frage; reproduzierte Fehler innerhalb Scope korrigieren und nachpruefen.

## Technische Primaerreferenzen (28. August 2026 gelesen)

- [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers):
  sichere Origins, Registrierung, Installation und kontrollierte Clients.
- [MDN: Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache):
  explizite Versions-/Bereinigungspolitik; Eintraege altern nicht automatisch,
  Browser koennen Originspeicher entfernen; HTTP-Cacheheader sind keine Cache-API-Policy.
- [Chrome/Web.dev: Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle):
  wartende Updates, Risiken erzwungener Uebernahme und gemeinsame Origin-Cachenamen.

Unsere Budgets, Namespaces und Testgates sind WRN-Planentscheidungen, keine
Zusicherungen dieser Quellen. Kein neuer Bibliotheks-/Providerentscheid.

END-CHECK: :)
