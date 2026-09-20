# WRN-G3-014 P2-C – UI-neutrale Inhaltssteuerung

Eltern: PO-071, G3-014-Task und WORK-PACKETS. Start ausschliesslich durch
Chief nach gesicherten P2-L/P2-S-Handoffs; genau ein Backend/Data-Agent,
keine Kinder. Keine neue Architektur oder Produktfunktion.

## Besitz

Neue eng benannte `apps/mobile/src/content-offline-controller.ts` und getrennte
Websiteentsprechung samt lokalen Tests; vorhandene lokale Loader nur fuer
enge benoetigte Transportkorrekturen. Externe E2E-Harnesses/Testfixtures im
Elternscope. Kein App.tsx, Styling, Sprachkatalog, Publisher, public-Release,
Package-/Rootconfig, Dependencyinstall oder Livezugriff.

Chief-Disposition S6: Zusaetzlich genau `apps/mobile/src/test/setup.ts` und
`apps/website/src/test/setup.ts`, ausschliesslich um bestehende bodylose
Fetchmocks durch reale begrenzte Streamantworten zu ersetzen. Der volle
Unitlauf reproduziert nach der beabsichtigten Produktionshaertung den alten
Mockfehler. Keine allgemeine Testsetup-, Konfigurations- oder Produktaenderung.

IDB-/Vertragsfehler zuerst Chief mit roter Regression melden; vor deren
Korrektur Eigentum schriftlich uebertragen. P2-C erfindet keine alternative
Storeimplementierung und schiebt keine Storage-/Safetyreihenfolge in React.

## Verbindliche Faehigkeiten der API

1. Restore: gespeicherten Stand zuerst revalidieren, aktuellen Controlguard
   anwenden und einen unveraenderlichen Runtime-Snapshot samt Meta liefern.
   Ohne gespeicherten Stand den bisherigen validierten Onlinepfad verwenden,
   ohne Content automatisch zu speichern. Schemaanlage ist kein Contentsave.
2. Save: ausdrueckliche Aktion; aktuelle vollstaendige Inhaltspruefung,
   erforderliche Safetyreihenfolge, transaktionales Speichern/Aktivieren.
   Wiederholte Aktion idempotent; keine erfundene Persistenzmeldung.
3. Check: genau eine explizite Operation. Bei vorhandener Offlineberechtigung
   zuerst bestaetigter Pendingmarker, dann fest gebundene Quellenrequests.
   Verifizierte Safety unabhaengig vom Content aufnehmen. Ein vollstaendiges
   neues Bundle nur stagen, nicht automatisch aktivieren.
4. Abschluss: passende verifizierte Safety plus Ledgercommit erfuellt die
   Sicherheitspruefung. Content-/Pruefzeitmetadaten nur nach vollstaendigem
   Check des jeweiligen Bundles erneuern. Fehler/Timeout/Unmount ohne diesen
   Beleg lassen Pending bestehen. A niemals durch blossen B-Check verjuengen.
5. Activate/Rollback: erneut validieren und aktuellen Guard/CAS beachten;
   genau einen atomaren Snapshot zurueckgeben. Rollback braucht einen
   zulaessigen Vorherstand. Die Bestaetigungsoberflaeche folgt erst P3.
6. Clear: explizit, nur Inhaltsbesitz; laufende alte Operationsresultate
   entwerten. Ledger/Pending erhalten; Sprach-/Theme-/Lesestatus nicht anfassen.
7. Guard/Resume: aktuelle Controlmetadaten erneut lesen, nie allein RAM oder
   eine Broadcastmeldung als Autoritaet. Dem Client Schutz/Frist/aktuelle
   Revision liefern, damit Reader/Archiv/Dialoge gemeinsam gesperrt werden.
8. Dispose/Abort: genau eine laufende Operation je Instanz, keine spaeten
   Ergebnisse, Listenerlecks, neuen Writes oder automatischen Retries.
   Bereits bestaetigte Transaktionen werden nicht rueckwirkend ungeschehen.

Die 15-s-Gesamtgrenze eines Updates beginnt bei seiner Vorbereitung, nicht
erst nach dem Pendingwrite im Fetchhelper. Das gemeinsame Abbruchsignal
begrenzt auch folgende Validierung/Transaktionen; kein erst spaeter startender
Teilschritt bekommt dadurch ein neues unbegrenztes Gesamtbudget.

Das Ergebnis unterscheidet gespeicherten aktiven Stand, nur sitzungsweise
validierten Stand, Kandidaten, erforderlichen Quellencheck/Schutz und
Speicher-/Transportfehler. Es enthaelt stabile uebersetzbare Statuskategorien,
Revision/Pruefzeit und verfuegbare Aktionen, keine UI-Texte oder Rohfehlerlogs.
Geschuetzte/unbekannte Safetydaten duerfen nicht ueber einen vermeintlich
bequemen Onlinefallback umgangen werden. IDB-aus mit eindeutig zulaessigem
Onlinepfad bleibt ehrlich nur sitzungsweise. Kein `navigator.onLine`-Beweis.

Auch nach Clear oder Safetypruning ohne aktive Bundles bleibt der vorhandene
Ledger massgeblich fuer jeden erneuten Onlinepfad. Der bisherige nackte
`loadLocalContentRelease` mit implizitem Floor 0 darf diesen Schutz nicht
umgehen. Tabhinweise duerfen einen Guard anstossen, tragen aber niemals
Inhalte/Safetyautoritaet; keine neuen persistenten Benachrichtigungskeys oder
Hintergrund-Netzpolls. Bereits offene Ansichten sind in P3 gemeinsam zu sperren.

## Tests und Abnahme dieser Teilaufgabe

Zuerst rote Integrationstests gegen den Stand vor der Controller-API, dann
reale Store-/Loaderintegration fuer beide Clients. A speichern/restore ohne
Inhaltsnetz; B stagen/aktivieren/rollback; fehlgeschlagenes B mit gueltiger
Safety ohne Fristverlaengerung; C-Teilfehler mit vorrangiger Sperre;
fehlgeschlagener Safetywrite und Neustartschutz; Clear waehrend Download,
Abort/Dispose und anderer Tab. Die offenen Transportcaps/Timeoutfaelle aus
dem P2-Fortsetzungshandoff ebenfalls belegen. Routekontrollen statt live.

Die Full-OFF-Disposition muss zwischen Storebeleg, Controllerbeleg und noch
ausstehender UI-/Visual-QA unterscheiden. OFF-26 bleibt ausgeschlossen.
Kein Testfixtureimport aus Clientquellen. Website-Quellharness und strikte
gebaute Website bleiben getrennt; spaetere UI-QA benutzt das echte Build.

Chief-Lesehinweise auf Basis `142fcac`, zuerst als RED reproduzieren:
Der Offlinecheck behaelt Safety bei einem fruehen Transportfehler, verliert
sie aber moeglicherweise im aeusseren `catch`, wenn erst die vollstaendige
Releasevalidierung wegen eines falschen Supplemental-/Discover-/Publication-
Hashes wirft. C mit gueltiger Safety UND transportgueltigem, aber semantisch
defektem unabhaengigem Payload muss den Safetybeleg ebenfalls behalten.
Ausserdem alle Content-Length-Fehler, body-ohne-Stream, cancel/Timeout und
512-KiB-Abbruch wirklich belegen; der bisherige arrayBuffer-Fallback ist
kein Beleg einer begrenzten Streamingallokation. Die Loader gehoeren hier
ausdruecklich zum engen Korrekturscope, nicht erst zur spaeteren UI-QA.

Handoff nennt exakte importierbare API samt Parameter-/Cancel-/Statussemantik
und einen kurzen Aufrufablauf fuer P3. Berichte:
`docs/evidence/WRN-G3-014/CONTROLLER-COMPLETION.md` und
`docs/handoffs/WRN-G3-014-controller-completion.md`.

Chief-Zwischenpruefung S6: Das Vorhandensein der Methodennamen und gruene
bestehende App-Unitlaeufe sind noch keine Controller-Abnahme. Der erste
Entwurf muss insbesondere Erststart (`unavailable` ist nicht automatisch
`needs-source-check`), wiederholtes Speichern ohne Kandidat, getrennte aktive
und Kandidaten-Runtimes, bekannten Ledger nach Clear, erlaubten IDB-aus-
Sessionpfad und Cancel/Dispose des gesamten Restores beweisen. Die API muss
aktive/Kandidat/Vorher-Metadaten und zulaessige Aktionen liefern; P3 darf diese
nicht durch eigene Storezugriffe rekonstruieren. Ein blosses Abortsignal ohne
begrenztes Ergebnisversprechen ist kein Gesamtdeadline-Beleg. Diese Punkte
sind bestehende Pflichten, keine zusaetzlichen Funktionen.

Toolchain/Fehlergrenze wie WORK-PACKETS: vorhandenes Node 24.19/pnpm 11.19,
keine Installationen, zwei erfolglose Fixrunden je Befund -> Chief-Diagnose.
Lokaler Commit nur eigene Dateien. P2-GREEN erst nach Chief-Gesamtabgleich;
keine selbst erteilte Frontendfreigabe.

END-CHECK: :)
