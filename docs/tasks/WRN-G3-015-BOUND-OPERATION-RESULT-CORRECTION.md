# G3-015 – gebundenen Adapterreturn erhalten

28.08.2026, enger Chiefauftrag innerhalb PO-074. Vorbereitet, noch kein
Agentstart: zuerst S8-Review/Handoff sichern und Ende bestaetigen. Chief
bindet diesen Review und den Startcommit im Delegationsregister.
Danach genau ein backend_data_reliability_engineer Terra/high, keine Kinder.

S8 ist inzwischen in1296a50/d088a6f gesichert/beendet. Chief hat den ganzen
Review gelesen und genau diesen engen Auftrag freigegeben. S8-M-001 ist
Medium. Native Modellgrenze und historische Ursache werden NICHT mitgeschlossen.
Zusaetzliche Kontrollen aus S8: pending->error ebenfalls nicht als Ergebnis
des begonnenen Jobs umdeuten; direkte error/waiting/active-Resultate treu
erhalten. Es wird kein neuer Outcome-Typ oder persistentes Journal eingefuehrt.

## Enger nachgewiesener Fehler und Ziel

adapter.operation ersetzt bei pending den direkten Plattformwert nach einem
allgemeinen refresh durch den spaeteren Snapshot. Eine read-only Observation
active A beweist aber nicht den Erfolg des konkreten Updatejobs. Der S8-
Review bindet diese Informationsverlustfolge statisch; vor Produktmutation
muss sie als deterministischer Seam-Regressionstest auf aktuellem Adapter
RED belegt werden. Keine Behauptung, dies sei bereits die historische
Chromeursache. Native Zuordnungsgrenze bleibt ausdruecklich offen.

Minimalziel: Der direkte Return des schon gestarteten Vorgangs bleibt an
das empfangene Plattformresultat gebunden und unveraenderlich. Unabhaengige
Snapshotobservation darf weiterhin spaeter den aktuellen Zustand zeigen.
Kein pauschales pending->error oder active->error. Kein neuer nativer
Outcomevertrag, keine Jobheuristik, kein UI-/Worker-/Protokollumbau.

## Eigentum

Nur apps/website/src/offline-shell/adapter.ts und adapter.test.ts;
eigene neue docs/evidence/WRN-G3-015/bound-operation-result/** sowie
docs/handoffs/WRN-G3-015-bound-operation-result.md. Neue automatische
Core-companion/mkdtemp-Ausgaben erlaubt; historische Artefakte/Indizes
unveraendert. Eigener Teststarter nur unter eigener Evidence.

Browserplattform/Worker/Protokoll/Generator/UI/Kataloge/Content/Safety,
Mobile, Bestandsharnesses, Root-/Packagekonfiguration, Dependencies und
alle anderen Dateien read-only. Du bist nicht allein: Chief besitzt
Governance. Fremde Aenderungen nicht revertieren oder stagen; Attachments
nicht lesen/veraendern. Keine Kinder, Installationen, APIkosten, Live/Legacy,
Nutzerbrowserprofile, Remote/CI/Cloud/Android/Deployment/Signierung/Release.

## Test-first und Verifikation

1. S8-Bericht und aktuelle Adapter-/Testquellen lesen. Neuer deterministischer
   Plattform-Seamtest: gestartetes Update liefert pending; anschliessende
   allgemeine Observation liefert active A. Erwarteter direkter Return bleibt
   pending, Snapshot darf active A zeigen. Alte Quelle muss diese Sollassertion
   verletzen. Dies ist ein Modell-/Vertragstest, kein echter nativer Browser-RED.
   Native Resultate/Timing nicht als gemessen ausgeben. Vorab Run/Command/
   Quellhashes; originale RED-Ausgabe unveraendert sichern.
2. Erst danach minimale Adapterkorrektur. Kein Redesign. Die gemeinsame
   enable/update/remove-Grenze pruefen: ihre gebundenen Resultate bleiben
   erhalten; kein zweiter Nativeaufruf durch double click; stale/dispose-
   Publikationsunterdrueckung und Exceptionpfad bleiben erhalten. Falls der
   statische Review einen relevanten Rueckgabevertrag offen laesst: Chief
   fragen, statt eine neue Dispose-/Fehlerpolicy zu erfinden.
3. Zieltests und vorhandene Adaptertests, Website-Unitmatrix, vorhandene
   Format-/Lint-/Typechecks mit exakter Toolchain; keine neuen Dependencies.
   Genau ein unveraenderter33erCorelauf zur Regression nach dem Fix, kein
   wiederholtes Warten auf Gruen. Neue/native Abweichung => raw sichern,
   Chief melden, keine eigene Diagnoserunde oder Browserplattformkorrektur.
4. Binde finale Quellhashes vor/nach, alle frischen Reports/Exitcodes und
   exakte Testzahlen; rohe Dateien bytegenau, runlokal -text und Gitblob-
   Vergleich. Streams waehrend Ausfuehrung in dauerhafte eigene Pfade.
   Alte Runs/Manifeste nicht ueberschreiben. Kein historisches Gesamt-GREEN
   uebernehmen; frische Gesamt-QA/Architektur bleibt spaeter erforderlich.
5. Gesicherter Folgecommit, kompakter Handoff mit RED-vor-Fix und GREEN-
   Nachweis, offenen nativen Grenzen und Ende. Kein P2-/P3-/PO-GREEN oder
   selbststaendiger Frontendstart aus dieser engen Adapterkorrektur.

Node exakt24.19.0: C:/Users/patri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe.
node/bin vor PATH, Windows-PATH/Path konsistent. pnpm11.19 ueber dieselbe
Runtime/node_modules/pnpm/bin/pnpm.mjs, verify-deps/error,
--config.enableGlobalVirtualStore=false. Keine globale Konfigurationsaenderung.
Bei zwei gleichartigen Versuchen ohne neue Erkenntnis Schleife stoppen und
Chief melden. Fehlende Rohdaten nie rekonstruieren.

END-CHECK: :)
