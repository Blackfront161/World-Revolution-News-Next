# G3-015 – S7-R1 native Ergebnisbindung in Originalfolge

28.08.2026, enge Chief-Disposition innerhalb PO-074. Dieselbe gesicherte
S7-Instanz incident_debugger Sol/high; keine Kinder. Vorherige Grenze ist
abgeschlossen, dies ist ein neuer begrenzter Diagnoseauftrag, kein Fix.

## Neue Frage und Basis

S7 42e537c/e54cbbe:21isolierte Proben, historische Ursache offen.
Chief-Originalvergleich core-9100-1787918375642 / matrix-vNWa7n:
33PASS/0FAIL bei exakter24.19,13Quellen/41Hashes unveraendert.
CHIEF-ORIGINAL-MATRIX-COMPARISON.md bindet Beleg und Grenzen.
Historischer exakter24.19-RED matrix-KhPKHo bleibt verbindlich.

Erfasse die bisher fehlende diskriminierende Kette mit originaler
Setup-/Helper-/Modulladereihenfolge: Listenerregistrierung, Operationsticket,
Registrierungsobjektidentitaet, alle Workerobjektidentitaeten, Nativepromise,
installing/waiting/active/redundant, settle vor/nach delay und terminal,
Controlcleanup sowie unmittelbarer Plattform-/Adapterreturn. Spaetere
Snapshotobservation strikt getrennt. Keine kuenstlichen asynchronen Wrapper
oder vorgezogenen Modulladevorgaenge, keine veraenderte Fehlerassertion.

## Enge Ausfuehrungsgrenze

1. Ein instrumentierter Originalmatrixablauf ist erlaubt, weil die neue
   synchrone interne Messung die bisher fehlende Information liefert.
   Isolierte Testkopie, unveraenderte Produkt-/Bestandstestdateien. Exakte
   Unterschiede zum Original explizit binden, kein pauschal uninstrumentiert.
2. Nur wenn Runde1 keine Ursache belegt: genau eine weitere, anders
   diskriminierende Runde, hoechstens sechs enge Redirectproben. Sie muss
   eine konkrete Hypothese trennen, nicht bloss erneut laufen lassen.
   Eine kontrollierte echte Scheduling-/Beobachtungsbarriere darf eine
   moegliche Sequenz testen, muss aber als Injektion gekennzeichnet bleiben.
   Keine erfundenen nativen Erfolgs-/Fehlerresultate oder weakened assertions.
3. Dann Schlussbericht/Handoff/Commit und Ende. Auch ohne RED kein weiterer
   Eigenlauf. Fehlende Beweiskraft oder erforderliche neue Entscheidung
   klar berichten. Kein Fix wird aus statischer Plausibilitaet abgeleitet.

Bei reproduzierter Ursache: minimaler Fixbereich, no-change-/Coalescing-
Abgrenzung und Regressionen. Eine spaete active-Observation ist allein kein
Fehlreturn. Wenn die Messung einen Harnessfehler statt Produktfehler belegt,
genau die Testannahme mit Originalgegenbeleg nennen, nicht Assertions lockern.

## Eigentum und Sicherung

Schreiben nur neue docs/evidence/WRN-G3-015/update-result-sequence/** und
docs/handoffs/WRN-G3-015-update-result-sequence.md. Automatische neue
completion/-mkdtemp-Artefakte erlaubt, alte Artefakte/Indizes unveraendert.
Chief besitzt Governance. Du bist nicht allein im Repository; keine fremden
Aenderungen revertieren oder stagen. Produkt/Tests/Generator/Rootconfig/
Kataloge/Legacy/Attachments strikt read-only. Keine Kinder, APIkosten,
Dependencies, Remote/CI/Cloud/Android/Signierung/Deployment/Release.

Bestehende Diagnoseartefakte wiederverwenden/read-only, keine Historie
ueberschreiben. Vorab dauerhafte Runpfade/Command/Node24.19/Quellhashes;
stdout/stderr/Exitcode, genaue Instrumentierungsquellen und Rohtraces sichern.
Nur isolierte Browserprofile, kein Zugriff auf Nutzerbrowserdaten. Exakter
Nodepfad aus vorherigem Brief, node/bin statt node im PATH; keine Installation.
Gesicherte Folgecommits und Handoff, dann Instanzende. P2 offen/P3 YELLOW.

END-CHECK: :)
