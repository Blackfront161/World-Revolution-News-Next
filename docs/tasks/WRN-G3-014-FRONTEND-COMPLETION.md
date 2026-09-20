# WRN-G3-014 – P3-Vervollstaendigung nach Diagnose

Status: durch Chief nach S11 freigegebener Folgebrief, Slot S12 reserviert.
PO-071; Backend `7b449c7`, P3-WIP `058e156`, Diagnose `e13eaf2`.
Profil `worker` als Frontend-Owner, explizit `gpt-5.6-sol`/high: einmaliges
risikobasiertes Routing nach belegtem High-Lifecycleincident und unvollstaendiger
Terra-Uebergabe, keine Profilaenderung/externen API-Kostenrechte. Die bestehende
P3-Freigabe wird nicht erweitert. Genau ein Schreiber, keine Kinder.

Gebundene Befunde: S11-UI-001 High (History/Direktmount nach Busy/Restore),
S11-UI-002 Medium (Operations-/Ticketbesitz und falsche Save-Rueckmeldung),
S11-HAR-001 (vorzeitiger Quellenwechsel) und S11-HAR-002 (falsche Sollrevision).
Der Original-RED ist kein allgemeiner Backend-Stagingfehler. Die S11-
Fokusreportrekonstruktion ist transparent gekennzeichnet; unveraenderte
Roh-Ausgaben/Traces/Snapshots tragen den Nachweis. Historische Logpoint-
Harnesses sind an den alten Quelltext gebunden: robuste neue Verhaltenstests
verwenden, nicht alte lexikalische Instrumentierung als Produktvertrag behandeln.

## Quellen und Eigentum

WORK-PACKETS P3/P4, Haupttask und OFF-Plan, Controller-Handoff und gesicherte
S11-Diagnose sind verbindlich. Die alten WIP-PNGs/Teilchecks sind keine finale
Evidence. Gleiche P3-Pfade: beide App.tsx, eng notwendige clientlokale
Offline-UI-Helfer/Komponenten/Styles/Tests, neue G3-014-Katalogschluessel und
neun Uebersetzungen, UI-E2E sowie erforderliche reine Harnessisolierung.
Backendcontroller/Loader/Stores/Vertraege bleiben read-only. Keine Root-/
Package-/Publisher-/Assetaenderung und keine neuen externen Befugnisse.
Chief besitzt Governance; alle fremden Aenderungen und Attachments erhalten.

## Fachlich vollstaendiger Abschluss

1. Gesicherte S11-Befunde mit roten Regressionen zuerst schliessen. Ein
   nachtraeglich gefundener Harnessfehler ist kein Produktfehler. S10 hatte
   fuer weite Teile keinen RED-vor-Code-Nachweis: Prozessabweichung benennen,
   nicht rueckwirkend Test-first behaupten.
2. Eine deterministische clientlokale Operations-/Publikationsgrenze fuer
   Save/Check/Activate/Rollback/Clear und Guard. Busy darf nicht Gewinner-
   Ergebnisse verdraengen, ein alter Guard nicht nach Clear publizieren.
   Aktion laeuft sichtbar; nicht ausfuehrbare Klicks nicht still verschlucken.
   Clear bleibt im erlaubten Fall bewusst vorziehbar. Keine neue Safety-/
   IDB-/TTL-Policy in React. Sinnvolle enge UI-Helfer aus App extrahieren,
   statt konkurrierende Effekte oder dieselbe Policy mehrfach einzubauen.
3. History/Direct Route/Reader/Archiv/Quelle erst nach positivem aktuellen
   Guard anzeigen. Bereits offene gesperrte Inhalte schliessen; Resume und
   Fristablauf ohne Quellenpoll. Kein Rendern alter geschuetzter Daten
   waehrend einer noch ungeprueften Navigation. Pro Mount neue Instanz,
   Cleanup und React StrictMode mit echter Wirkung pruefen.
4. Alle Consumer aus einem aktiven Snapshot; A bleibt bei B-Staging sichtbar,
   Wechsel nur nach bewusster Bestaetigung. Schutz/null Runtime ist keine
   leere Inhaltsautoritaet fuer Lesestatus-Reconciliation.
5. Panel zeigt Operationsmeldung getrennt vom erlaubten Lesestand: ein
   fehlgeschlagener B-Check kann A lesbar lassen und muss dennoch als Fehler
   erklaert werden. Unbekannter Speicher, Session-only, Pruefbedarf, Ablauf,
   Kandidat und erlaubter Rueckwechsel ehrlich zeigen. Keine rohen Kategorien,
   technischen Logs oder unersetzten Platzhalter im UI. Texte in neun
   Sprachen; Pruefzeit sinnvoll zur gewaelten UI-Sprache formatieren.
6. Confirmations mit Escape/Cancel/Fokusrueckgabe/Fokusbegrenzung; nach
   Bestaetigung sinnvolles Fokusziel, auch wenn der Ausloeser verschwindet.
   Cleartext erklaert erhaltene minimale Sicherheitsmetadaten, ohne eine
   globale Loeschung zu behaupten. Header/Brand/Theme/Sprachwahl unveraendert.
   Chief-Lesehinweis aus `058e156`: `confirmation-backdrop` und
   `confirmation-dialog` besitzen bislang keine eigenen Layoutregeln;
   nur ihre Buttons sind gestaltet. Vorhandene source-dialog-Gestaltung
   passend wiederverwenden oder die neue lokale Grenze vervollstaendigen,
   damit ein als modal bezeichnetes Element nicht bloss im Dokumentfluss
   hinter der Navigation auftaucht. Dies braucht einen echten Sichtbeleg.

## Erforderliche Implementierungsbelege

- UI beider Clients auf Mobile und gebauter Website: A speichern; B pruefen
  bei weiter aktivem A; abbrechen/uebernehmen; zulassig zu A zurueckwechseln.
- B-Teilfehlermeldung bei erlaubtem A; C-Teilfehlersperre mit schon offenem
  Reader/Quellendialog, History und Resume; keine Wiederbelebung gesperrter IDs.
- Clear Escape/Cancel/Confirm, echte Lesekey-/Sprach-/Themeerhaltung,
  spaeter Download-/Guardcallback, konkurrierende Benutzeraktionen.
- Sitzungsmodus bei fehlender IDB, unbekannte geschuetzte Storageversion;
  keine falsche gespeicherte oder erfolgreiche Updateaussage.
- Verzoegerte Guards/Operationen mit beobachtbaren Barrieren, StrictMode/
  Unmount/Remount, initialer und nachtraeglicher 200-Prozent-Reflow.
- UI-Nebenwirkungen exakt erlaubte Client-DB/Stores/Keys; keine Cache Storage,
  Service Worker, Cookies, fremden DBs oder externen Requests. Reine alte
  Backendharnesses duerfen nicht nebenher die neue React-App mounten.

Backendbelege nicht alle neu erfinden: Controller-/Storagefehler sind dort
gesichert, aber reine Backendproben ersetzen keinen integrierten UI-Flow.

Chief-Praezisierung waehrend S12: In den drei vorhandenen Lesestatus-
Setupfaellen von `tests/e2e/foundation.spec.ts` ist vor dem anschliessenden
Reload eine additive, beobachtbare Initialisierungsbarriere auf die sichtbare
gueltige Manifestrevision erlaubt. Die Sollassertions bleiben unveraendert.
Ein sonst absichtlich mitten im Defaultrestore ausgeloester Reload hinterlaesst
zu Recht die Pendingbarriere und prueft nicht den behaupteten normalen
Lesestatusablauf. Unterbrochener Restore bleibt separat als Fehlerfall zu
belegen. Betroffene Tests und Begruendung im Handoff exakt nennen. Der enge
Source-Dialog-Fokusfix nach einem Guard-Readerremount ist ebenfalls bestehender
P3-Regressionsscope; kein Backendfix oder allgemeines UI-Redesign.

Gleiche enge Freigabe nach konkretem Chief-Leseabgleich: Im bestehenden
`unknown future or malformed local reading data stays byte-identical and
read-only`-Loop vor Testkey/Reload sowie nach dem abschliessenden Reload vor
dem naechsten Durchgang den normalen Restore beobachten. Im bestehenden
`preview states fail closed without a remote service`-Loop erst die
unveraenderten Statusassertions und Screenshots ausfuehren, danach ueber den
vorhandenen Ready-Knopf die Manifestbereitschaft vor der naechsten URL
abwarten. Keine Sollassertion streichen/aendern. Die fuer den echten
Prozessrestart-Test selbst gestarteten PersistentContexts duerfen dieselbe
Blankpageisolierung in `launch()` erhalten; alle Storeassertions bleiben.
Ein enger Archivfokusfix, der auf Guardfreigabe/Content statt bloss auf
requestedId wartet, gehoert ebenfalls zu den gebundenen Regressionen.

Nach erstem Vollbrowserlauf zusaetzlich eng bestaetigt: Die beiden alten
Website-Navigationserwartungen fuer More muessen den jetzt implementierten
Inhaltsbereich und die Abwesenheit des falschen Not-migrated-Placeholders
pruefen. Nur der More-Zweig aendert sich; alle noch unportierten Ziele
behalten ihre Sollassertions. Eine ausstehende Discover-Navigation waehrend
Restore darf ihren Fokus nach Loading -> Ready an die neue Zielueberschrift
uebergeben. Keine pauschale Fokusuebernahme bei jedem Runtime-/Guardwechsel,
kein Fokusdiebstahl aus Dialog oder Sprachauswahl; enger Regressionstest.

Weitere reine Harnesspraezisierung nach isoliertem Pfadlaengennachweis:
Der Persistent-IDB-Prozessrestarttest darf ein eindeutiges `mkdtemp`-Profil
unter `os.tmpdir()` mit Praefix `wrn-g3-014-idb-` statt des langen
Testoutputpfads verwenden. Derselbe konkrete Pfad bleibt ueber beide echten
Browserstarts erhalten; alle Storeassertions bleiben unveraendert. Die
isolierten Direktproben fuer langen/kurzen Profilpfad werden als Evidence
gebunden, nicht als Produktfehler ausgegeben. Kein Profil stagen. Ein Cleanup
darf nur den eigenen aufgeloesten Temp-Unterordner nach geschlossenem Browser
betreffen, nie einen breiten Temp-Pfad oder Glob. Die abschliessende
Lesedatenschleifen-Barriere darf nach unveraenderter Rohwertassertion von
`#saved` ueber den vorhandenen Home-Link zur sichtbaren Manifestbereitschaft
wechseln, weil Saved absichtlich keinen Manifestmarker zeigt.

Chief-Lesecheck zur Evidenceintegritaet: Der neue Visual-E2E darf bei einem
normalen Folgelauf keine bereits gesicherten S12-PNGs ueberschreiben. Seine
Screenshots deshalb in den laufgebundenen `testInfo.outputPath` samt
Reportattachments schreiben (oder gleichwertige explizite Lauftrennung),
nicht fest in einen historischen Evidenceordner. Finale S12-Belege an die
wirklichen neuen Pfade binden; keine Rootconfig-/Produktaenderung.

Abschliessend gesamte gebundene Einzelmatrix und kompletter Browserlauf,
aktuelle klar beschriftete erste UI-PNGs; unabhaengige P4/P5 bleiben danach.
Nur fachlich vollstaendigen Kandidaten als GREEN uebergeben. Fehlende
Nachweise nicht still auf QA verschieben. Bei echter Vertragsluecke Chief
fragen; nach zwei erfolglosen Korrekturen am selben Befund gesichert stoppen.

## Ausgabe

Eigene Evidence `docs/evidence/WRN-G3-014/FRONTEND-COMPLETION.md` und
`frontend-completion/`, Handoff `docs/handoffs/WRN-G3-014-frontend-completion.md`.
Historische WIP-/Diagnosebelege nicht ueberschreiben. Eigene Pfade lokal
committen, genaue Tests/Abweichungen/Dateien binden und Schreibarbeit beenden.
Keine blossen WIP-Finalantworten ohne konkreten externen Blocker.

END-CHECK: :)
