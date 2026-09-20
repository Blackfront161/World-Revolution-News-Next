# WRN-G3-014 – unabhaengige Gesamt-QA

P4 innerhalb PO-071; durch Chief nach gesichertem S12-Abschluss freigegeben.
Produktkandidat `b187fc3`, Evidence/Handoff `ca0450a`; S12 beendet.
Chief reserviert S13 im kanonischen Register vor Dispatch.
Genau ein frischer `qa_release_engineer` (Terra/high), keine Kinder.

## Eigentum und Quellen

Produkt, Bestandstests und Governance read-only. Eigene Schreibpfade:
`docs/evidence/WRN-G3-014/INDEPENDENT-QA.md`, darunter eigener Ordner
`independent-qa/` fuer reproduzierbare Harnesses/Reports/PNGs und
`docs/handoffs/WRN-G3-014-independent-qa.md`. Keine Fremdaenderung stagen.
Kein Legacy-/Livezugriff, Dependencies, SW/Cache Storage, Android, Remote/CI,
Cloud, Deployment, Signierung, Upload oder Release.

Verbindlich: aktuelles AGENTS-Gate, WORK-PACKETS P4, Haupttask, OFF-Plan,
finale S9-Controlleruebergabe sowie finale S12-Evidence und Handoff.
Historische Zwischenreports nicht als finale Resultate verwenden. Bestehende
Harnesses duerfen nach eigener Pruefung frisch ausgefuehrt werden; keine
blosse Wiederholung der Implementierungsbehauptung. Neue Harnesses bleiben
in eigenen Evidencepfaden. Keine Tests abschwaechen oder blind aktualisieren.

## Frisch auszufuehrende Pruefung

1. Exakte Node 24.19.0 / pnpm 11.19.0 ohne Installation; Format, Lint inklusive
   19 Boundaries, alle tatsaechlichen Typecheckskripte, alle Unit-/statischen
   Tests, beide Builds, Provenienz/Brandassets und Releaseboundary. Historischer
   Sammelbefehl `check` ist kein geeigneter Releasegate: alte Previewboundary
   verlangt dort noch die bereits entfernte Test-Support-Kopplung. Einzelgates
   ausfuehren, den historischen Widerspruch offen benennen, nicht reparieren.
2. Voller bestehender Browserlauf mit frischen Reports, null unerwarteten
   Skips/Fehlern; vorhandene projektbezogene Skips begruenden. Portbenutzung
   streng sequenziell: keine zwei Runner auf 43173/43174/43175. Reine
   Storeharnesses nutzen leere Originseiten und getrennte Profile. Echte
   Website-UI ausschliesslich gebaut auf 43174, nicht Sourceport 43175.
   S12 fuehrte den vollen TestsCOPE mit `--workers=1` aus. Die frische QA
   verwendet den unveraenderten Root-Default mit zwei Workern; ein zweiter
   unabhaengiger Runner parallel auf denselben Ports bleibt verboten.
3. Frische integrierte A -> B-Staging (A bleibt aktiv) -> B-Aktivierung ->
   erlaubter Rueckwechsel; B-Teilfehler mit erlaubtem A, C-Teilfehlersperre
   einschliesslich offener Reader/Quelle, History, Direktmount und Resume.
   Lesen/Persistenz/Operationsfehler getrennt pruefen. Guard/Operationsrennen,
   StrictMode, gleiche-ID-History und spaete Mount-/Clearergebnisse abdecken.
4. Clear Escape/Cancel/Fokus/Confirm, gefuellte echte erlaubte Sprach-/Theme-/
   Lesekeys byteweise erhalten auch nach Reload; keine Reconciliation gegen
   kuenstlich leere Runtime. Fehlende IDB/geschuetztes v2/TTL ehrlich zeigen.
   Datenbanken/Stores/Keys exakt allowlisten; kein Cache Storage/SW/Cookie/
   externer Request oder unerwarteter Konsolenfehler. Erwartete provozierte
   Transportfehler separat ausweisen.
5. Vollstaendige frische Visualmatrix des OFF-Plans: zwoelf Viewports mit
   Dark/Light/Pink/Contrast, alle neun Sprachen mit initialem und nachtraeglichem
   200-Prozent-Reflow beider Clients, neue Status-/Dialogzustaende, Fokus,
   Tastatur, 44-Pixel-Ziele, Axe und Overflow. Gleiche Groesse/Schrift fuer
   Hell-Dunkel-Vergleiche; 200-Prozent separat beschriften. Keine unveraenderte
   historische Headergeometrie ungeprueft als neue G3-014-Regression ausgeben:
   bei Verdacht gegen gesicherten Vorgaenger abgleichen und sauber einordnen.
6. OFF-01–25 pro Teilpflicht auf eigene frische UI- oder unveraenderte konkrete
   Backendbelege abbilden. OFF-26 bleibt OUT: keine Zusage eines vollstaendigen
   Flugmodus-Kaltstarts, solange die Shell noch lokal ausgeliefert wird.

## Bericht und Sichtabnahme

Ein Prueflauf mit reproduzierbaren, priorisierten Findings direkt an Chief.
Keine Selbstkorrektur. Bei eigenem Harnessfehler Ursache und Korrektur offen
protokollieren, nicht als Produktfinding zaehlen. Bei Produktfinding
Kandidat unveraendert lassen und mit gesichertem Handoff beenden; enge
Korrektur und frische Re-QA werden separat disponiert. Keine unbewiesenen
PASS-Pauschalen oder aus Dateinamen abgeleiteten RED/GREEN-Behauptungen.

Maschinenlesbare Reports binden Kandidat, Toolchain, Counts, Revision/Floor/
Generation/Requests/Writes soweit fallrelevant und Nebenwirkungen. Nur
synthetische Testdaten, keine Nutzdaten. Eine kurze beschriftete Bildfolge
fuer beide Clients erklaert A/B/Rueckwechsel und C-Schutz; normale Produkt-
vorschau hat nur A und keinen B/C-Testumschalter. Original-PNGs verlinken.
Alle eigenen Belege lokal sichern/committen und Schreibarbeit beenden.
P4-GREEN ist keine P5-Freigabe oder sichtbare Product-Owner-Abnahme.

END-CHECK: :)
