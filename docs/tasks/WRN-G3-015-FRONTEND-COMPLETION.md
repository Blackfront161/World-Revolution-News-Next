# WRN-G3-015 S5-R1 – P3-Auftrag vervollstaendigen

28. August 2026, Chief-Disposition innerhalb PO-074 und FRONTEND-PACKET.
Basis Produkt b5e2ea9, Evidence/Handoff f201be7. S5 hat einen Teilcheckpoint
gesichert und ist beendet. Chief akzeptiert ihn als WIP, nicht als P3-GREEN.
Dieselbe Instanz wird fuer die erste konkrete Vollstaendigkeitsrunde fortgesetzt;
kein Context-Rot-Urteil, kein weiterer Helfer oder paralleler Schreiber.

## Verbindliche Rueckgabe an den bestehenden Owner

FRONTEND-PACKET verlangte bereits gesamten Built-UI-Ablauf, Lifecyclematrix,
48 normale und36 echte Initial-/Nach-Mount-Reflowfaelle samt Dialogen,
vollstaendige statische/Unit/Build/Rootmatrix und gebundene Rohbelege vor Ende.
Der Handoff darf diese Implementierungspflichten nicht an Chief/P4 verschieben.
Die spaetere unabhaengige Wiederholung bleibt zusaetzlich erforderlich.

Eigentum und Sperren bleiben exakt FRONTEND-PACKET plus die bereits
uebergebenen zwoelf neuen Katalogkeys. Backend/Generator/P2-Tests/Content/
Mobile/Rootconfig/Dependencies unveraendert. Nur eigene P3-Belege/Handoff
und erlaubte neue website-shell-ui-*Tests schreiben. Keine Kinder.

## Konkrete Chief-Pruefung am gesicherten Stand

1. **Source-Dev-Beleg unzureichend:** UI und Defaultplattform haben keinen
   erkennbaren DEV/PROD-Guard. Der neue Test klickt Save und pollt sofort nur
   Registrierungszahl0. Das kann vor Settlement oder nach einem fehlgeschlagenen
   Workerrequest stimmen, obwohl register/Controlwrite bereits gestartet wurden.
   Zuerst echter deterministischer RED-Beleg mit nativen Aufruf-/Request- und
   Storagezaehlern bzw. gebundener Settlementbarriere. Dann eng im UI/default-
   Factorypfad Source-Dev-Mutationen ausschliessen und ehrlich unavailable
   zeigen. Keine Backendkorrektur, kein Queryparameter als Produktionsfreigabe.
   Anschliessend SourceDev0Registerversuche/0Shellwrites und echter positiver
   Built-Enable ueber den sichtbaren Knopf. Nicht nur404 als Schutz verwenden.
2. **Visualmatrix nicht quell-/zustandsfest:** Beide Reflowvarianten setzen
   fontSize erst nach page.goto, also kein belegter Initial-Reflow. Der erste
   Sprachwechsel schreibt Storage zwischen moeglichen Same-document-Hash-
   Navigationen; kein document.lang-/Select-/Copy-Assert. Chief sah selbst in
   `visual-b5e2ea9/reflow-el-dark-initial.png` Russisch/RU, nicht Griechisch.
   Rohbild behalten und falsch bezeichneten Nachweis disponieren. Jede neue
   Aufnahme bindet tatsaechliches document.lang, Selectwert, Theme, Viewport,
   Rootfont und beobachteten fertigen UI-Zustand. Initialer Reflow wirklich vor
   Mount; Nach-Mount-Folge nach gesichertem Normalzustand. Bewaehrtes G3-013-
   Testverfahren wiederverwenden, kein willkuerlicher Sleep. Panel UND
   Entfernen-Dialog in allen48+36Faellen; Axe/Fokus/Tastatur/44px/Overflow
   pruefen, nicht nur vorhandene Ueberschrift fotografieren.
3. **Fehlende echte Built-UI-Folge:** Der Modaltest setzt Control direkt und
   registriert den Worker selbst. Das ist ein enges Modalsetup, kein Beleg
   fuer das Defaultpanel. Noch fehlen sichtbarer Enable -> saved/uncontrolled
   -> controlled -> waiting -> neue Generation -> Cancel/Remove/pending und
   gezielte echte Fehler-/Fremdfensterfolgen. Bestehende reale P2-Harnessbausteine
   read-only nutzen, nicht MiniHTML-/Sourcemocks als ganze Website ausgeben.
   Synthetic-Gegenpakete, injizierte Nativebarrieren und echte Builtfolgen
   sauber kennzeichnen. Keine direkte Storageinitialisierung als Opt-in-Beleg.
4. **Lifecycleumfang fehlt:** 13Units enthalten9Statuslabels und4weitereTests.
   Doppelklick/Deferredresultate, Enable/Update, Unmount/Remount waehrend
   Operation, Sprach-/Themewechsel, gezielte stale Bestaetigung gegen echten
   Fremdfensterwechsel und Cleanup sind noch passend zu belegen. Keine bloße
   Fallzahl als Ersatz fuer konkrete Vertragspunkte.
5. **Roh-RED-Referenz fehlt:** Der in P3-CHECKPOINT genannte
   `test-results/.../error-context.md` ist beim Chief-Check nicht vorhanden.
   Original wenn noch anderweitig vorhanden gesichert kopieren. Sonst ehrlich
   als verlorene Rohdatei bzw. nur damaliges Tooltranskript kennzeichnen;
   keine rekonstruierte Datei als Original ausgeben. Neue Laeufe bekommen
   eigene dauerhafte Pfade vor weiteren Testlaeufen. Neuer gruener Dialogtest
   beweist nicht rueckwirkend die Existenz einer verlorenen Rohdatei.
6. **Vollstaendige Uebergabe:** Alle zehn Einzelgates, gesamte Unitmatrix,
   sieben tatsaechliche Typechecks/Boundaries, beide Builds, Releaseboundary
   und ganze Rootbrowsermatrix mit Default2Workern/7Projekten frisch ausfuehren.
   Konkrete aktuelle Anzahlen, erwartete Skips, raw errors und Flaky angeben.
   Aktuelle Produkt-/Test-/Katalogquellen, Buildmanifest/-generation, Rohreports
   und alle Originalbilder mit SHA256 binden. Ein normaler Rootlauf darf
   keine historischen Evidencebilder unter gleichem Namen ueberschreiben;
   Runverzeichnis muss eindeutig sein (nicht standardmaessig visual-unbound).

## Ende

### Chief-Disposition R1-Harness, 28.08. circa13:03

S5 meldete nach zwei gleichartigen Waiting-Timeouts korrekt die Aufwandsgrenze:
`r1-built-lifecycle-22152-1787914834800` und
`r1-built-lifecycle-core-15808-1787914939622`. Chief las die aktuelle Spec,
den zweiten Rohreport und den bestehenden P2-Regressionsablauf. Die neue Spec
belegte native A-Aktivierung, aber keinen kontrollierten A-Client vor B.
Der bestehende P2-Ablauf reloadet nach Aktivierung und prueft tatsaechliche
A-Auslieferung. Timeout allein ist hier kein nachgewiesener Produktfehler.

Genau eine begruendete Testkorrektur ist erlaubt: A aktivieren, reloaden,
Controller/Panel-active/A-Shellidentitaet assertieren, dann sichtbares B-Update.
Beide bisherigen Roh-REDs behalten. Scheitert dieser korrigierte konkrete
Ablauf erneut, Zustands-/Control-/Job-/Netzbelege sichern und Chief melden;
kein weiterer semantischer Variationsversuch und keine Produktkorrektur.

Das Core-Harness-B ist synthetisches MiniHTML. Eine echte Built-A-Seite vor
synthetischem B belegt nur den engeren Hybrid-Waitingfall, nicht die Bedienung
einer neu aktivierten Websitegeneration. Der bereits beauftragte volle
UI-Generationsablauf benoetigt zwei isolierte Kopien des aktuellen Builds,
eine dokumentierte harmlose Markerabweichung und den unveraenderten Generator
fuer gueltige getrennte Hashbindungen. Keine Mutation am gemeinsamen dist,
Backend oder bestehenden Corehelper. Diese Disposition erweitert keine
Produktrechte und startet keinen neuen Mitarbeiter.

Neue echte REDs vor enger Korrektur sichern; keine unbewiesene Produktmutation.
Die benannten Nachweis-/Testverbesserungen sind bereits beauftragt. Bei zwei
gleichartigen erfolglosen Fixrunden oder notwendiger Backend-/Architekturaenderung
Chief informieren. Nach belastbarem Zwischenstand kurz berichten und sinnvoll
weiterarbeiten; kein automatischer Teilabschluss nach wenigen Zieltests.
Gesicherter vollstaendiger Kandidat, P3-COMPLETION-Bericht mit SHELL-Zuordnung,
vollstaendiger maschinenlesbarer Evidenceindex und aktualisierter Handoff,
dann Ende. Erst Chief-Gesamtabgleich erlaubt die unabhaengigen P4-Gates.

END-CHECK: :)
