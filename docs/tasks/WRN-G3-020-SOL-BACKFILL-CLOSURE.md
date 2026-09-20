# G3-020 – enger Sol-Abschluss der vier Backfillbefunde

Aktiv nach separatem Chiefcommit. Kandidat
 e38cb5cf47068987e74bce40d449eea09c5eb61b.
Der unabhängige Ursachenreviewer events_sol_assurance prüft ausschließlich
C-01..03 im unveränderten Korrekturvertrag und die drei Mediums sowie das
Manifest-Low aus seinem Backfill. Er hat keinen Produkt-/Testcode geschrieben;
seinen Korrekturentwurf und die Wiederverwendung der Instanz offen nennen.

Er darf nur diese zwei neuen Belege schreiben:
- docs/evidence/WRN-G3-020/P8-SOL-BACKFILL-CLOSURE.md
- docs/handoffs/WRN-G3-020-sol-backfill-closure.md

Statischer Produkt-/Orakelteil kann parallel zur unabhängigen QA laufen.
QA und Manifest sind noch ausstehend: bis zu deren fertiger, gehashter
Rückgabe keinen finalen Gesamtstatus behaupten. Danach Kandidatenbindung,
kanonischen TSV-Hash und tatsächlichen PNG-Inventarumfang gegen die QA-
Belege prüfen. Historischen falschen Hash nicht überschreiben.
Keine eigenen Browser/Test/Produkt/Index/Commitwrites, keine Kinder.
Kein versiegelter Securityscan, keine neuen ungezielten historischen
Scanrunden. Konkrete verbleibende Findings melden, ansonsten null Findings
und vier nachvollziehbare Schließungen. PO-Sichtprobe und alle externen
Gates bleiben separat.
