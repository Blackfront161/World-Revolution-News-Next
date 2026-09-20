# WRN-G3-014 – frische Nachpruefung nach P5-Korrekturen

Vorbereitet innerhalb PO-071. Kein automatischer Start: Chief muss zuerst
S15 und S16 gesichert uebernehmen und deren Instanzen beenden. Kandidat und
Startcheckpoint werden dann im kanonischen Delegationsregister gebunden.
Genau ein Subagent, keine Kinder, keine parallelen Runner/Schreibinstanzen.

## S17 – unabhaengige Gesamt-Re-QA

Ein frischer `qa_release_engineer`, Terra/high. Produkt, Bestandstests,
historische Evidence und Governance read-only. Eigene Schreibpfade:

- `docs/evidence/WRN-G3-014/FINAL-RE-QA.md`;
- `docs/evidence/WRN-G3-014/final-reqa/`;
- `docs/handoffs/WRN-G3-014-final-reqa.md`.

Die gesamte Pruefmatrix aus `WRN-G3-014-INDEPENDENT-QA.md` bleibt verbindlich:
exakte vorhandene Toolchain, statische Einzelgates einschliesslich sieben
tatsaechlicher Typechecks, volle Browsermatrix mit Rootdefault zwei Workern,
echte gebaute Website, OFF-01–25, alle 48 normalen und 36 initialen/
Nach-Mount-Reflowfaelle, A/B/A/C-Bildfolge und Nebenwirkungsgrenzen.
Keine neue Installation oder Reparatur der historischen Root-Previewboundary.
Counts frisch bestimmen, nicht die bisherigen 215 PASS/527 Skips einfrieren.

Zusaetzlich unabhaengig nachvollziehen und frisch pruefen:

1. P5-M-001: Fehlcheck nach Rueckwaertsuhr mit echter IDB/Defaultloader,
   persistierter Zeitgrenze und frischem Controller bei gesperrtem Inhaltsnetz.
   Schutz bleibt, null Restore-Requests. Normaler B-Teilfehler mit erlaubtem
   unverjuengtem A sowie vollstaendiger Check als getrennte Gegenproben.
   Kein falscher Anspruch auf Systemuhrmanipulationsschutz/Prozesskilltest.
2. P5-M-002: echte zwei Tabs, aktive B-Revision mit geaendertem Quellenname/
   Host/URL; altes Quellenfenster nach Resume geschlossen, erneute explizite
   Oeffnung zeigt B. Kein externer Linkklick. Unveraenderte A-Guards und nur
   gestagtes B schliessen nicht grundlos; Null-/C-/Clear- und Fokusgrenzen.

Eigene neue Harnesses nur im eigenen Ordner; vorhandene Regressionen nach
Quellenpruefung frisch ausfuehren, keine Erwartung abschwaechen. Facts,
Harnessfehler, Implementiererbelege und eigene Belege getrennt kennzeichnen.
Die S14-stdoutproben sind konkrete Reproquellen, keine bereits korrigierte QA.

Bei echtem Produktfinding stoppen, unveraenderten Kandidaten samt eigenem
Handoff sichern, Chief informieren; kein Selbstfix. Bei GREEN eindeutige
Kandidaten-/Report-/Quellhashbindungen, Commands/Exitcodes/Counts, konkrete
OFF-Teilzuordnung und Original-PNGs liefern. Bilder selbst ansehen, nicht
nur Dateiexistenz pruefen. Historische rote Evidence nicht ueberschreiben.
Eine gemeinsame Bildfolge je Client fuer die PO-Abnahme genuegt; redundante
Kopien nicht als zusaetzliche Faelle zaehlen. Danach Arbeit beenden.

## S18 – gezielter unabhaengiger Architektur-Recheck

Start ausschliesslich nach GREEN-S17 und gesichertem Ende. Ein frischer
`independent_architecture_reviewer`, Sol/high. Schreiben nur:
`docs/evidence/WRN-G3-014/ARCHITECTURE-RECHECK.md` und
`docs/handoffs/WRN-G3-014-architecture-recheck.md`.

S14 ist abgeschlossene Gesamtpruefung, kein Anlass fuer eine weitere
unbegrenzte Vollrepoanalyse. Aktuelle Deltaquellen, beide Korrektur-Handoffs
und frische S17-Belege pruefen: nachweisliche Schliessung M-001/002 ohne neue
Uhrpolicy, zweite Safetypolicy, Teilruntime, kaputte Fokus-/Guardgrenze oder
Package-/Publisherabweichung. Direkte eng fokussierte lokale Proben erlaubt,
keine Selbstkorrektur. Kandidat und Belege hashbinden, PASS oder konkrete
Findings. Keine unveraenderten Volltests als eigene Durchlaeufe ausgeben.
Erst bei null offenen Scopefindings technische Sichtabnahmebereitschaft.

## S19 – kurzer Kontinuitaetsabschluss

Ausloeser: technischer Meilenstein gemaess `docs/08-CONTEXT-CONTINUITY.md`.
Erst nach gesichertem und beendetem GREEN-S18 genau ein frischer
`context_continuity_auditor`, Luna/medium, ohne Kinder. Keine Schreibrechte.
Nur aktuelle Kopfabschnitte von AGENTS/Project State, kanonisches Register,
Chief-Handoff, PO-Abnahmehilfe und S17/S18-Handoffs auf Quell-/Status-/Scope-
und Evidenzkonsistenz pruefen. Historische Einsatzanweisungen nicht als neue
Starts interpretieren. Keine Produktanalyse, Browserprobe, Vollsuite, weitere
Dokumentexpansion oder neue Datei. Ein begrenzter read-only Durchgang;
Sechs-Dimensionen-Score und konkrete Widersprueche oder GREEN direkt an Chief,
danach Ende. Chief dokumentiert das Ergebnis und uebergibt die Sichtabnahme.

## Grenzen

Chief besitzt Governance und Slotvergabe. Fremde Dateien/Attachments nicht
lesen/stagen/veraendern. Nur eigene Pfade lokal sichern, Git-Indexfreigaben
normal anfordern, keine Lock-/ACL-/Konfigurationsumgehung. Eigene Server
beenden; Roots Vorschau 43113/43114 nicht stoppen. Tests 43173/43174/43175
sequenziell; pure Backendproben auf leerer Origin ohne Reactnebenverbindung.
Keine Kosten-/Live-/Legacy-/Cloud-/Remote-/CI-/Android-/Releasebefugnisse,
keine Dependencies, SW oder Cache Storage. OFF-26 bleibt OUT. Technisches
GREEN ersetzt keine sichtbare PO-Abnahme. Tokenmessung sonst unbekannt.

END-CHECK: :)
