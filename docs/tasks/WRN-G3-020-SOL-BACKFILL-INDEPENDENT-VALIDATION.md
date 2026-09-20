# G3-020 – unabhängige Korrekturprüfung

Aktiv nach separatem Chief-Gatecommit. Kandidat:
e38cb5cf47068987e74bce40d449eea09c5eb61b. Exakt fünf Diffpfade,
Chief-Writer beendet; keine Produkt-/Testwrites während der QA-Reproduktion.
Vertrag: WRN-G3-020-SOL-BACKFILL-CORRECTION.md C-01..03, Matrix und Manifest.

Die vorhandene unabhängige Terra-Instanz media_ui_preparation darf nur
folgende drei Dateien schreiben. Sie hat diesen Produkt-/Testcode nicht
implementiert. Wegen Runtime-Threadlimit keine frische Instanz behaupten:

1. docs/evidence/WRN-G3-020/P7-SOL-BACKFILL-INDEPENDENT-QA.md
2. docs/handoffs/WRN-G3-020-sol-backfill-independent-qa.md
3. docs/evidence/WRN-G3-020/P7-SOL-BACKFILL-VISUAL-MANIFEST.tsv

QA besitzt Browser exklusiv. Neuer bislang nicht existierender Tempordner
als WRN_EVIDENCE_ROOT, WRN_EVIDENCE_REVISION=e38cb5c. Voller bestehender
Visualspec unverändert 119PNGs, alle C-01..03-Orakel,32fokussierte/389Mobile,
3Typechecks,Build/Lint/Format,19Boundaries,Fixture/Release und16Event-IDB.
TSV literal gemäß Abschnitt7 des Korrekturvertrags, Node- und PowerShell-
Berechnung unabhängig gleich. Keine Hashbehauptung aus Anzahl allein.
Eigener vollständiger Kandidaten-SHA im Bericht, tatsächliche Quellen-
Dateihashes prüfen. Keine Fremdwrites, kein Index/Commit, keine Kinder.

Nach QA-GREEN prüft Sol die vier gebundenen Befunde und den Kandidatendiff
gezielt. Ausschließlich eigene zwei Pfade werden dafür in einem folgenden
Auftrag vergeben. Kein versiegelter Scan oder externe Freigabe. Erst
technisches GREEN ermöglicht eng begrenzte lokale PO-Sichtprobe.

## Chief-Belegbindung für Windows-Checkout

Vor dem QA-Commit wurde geprüft: core.autocrlf=true, TSV bisher nur
text=auto. Chief ergänzt deshalb ausschließlich die rootrelative Regel
/docs/evidence/WRN-G3-020/P7-SOL-BACKFILL-VISUAL-MANIFEST.tsv text eol=lf
in .gitattributes. Sie sichert die bereits gebundenen kanonischen TSVbytes
auch beim frischen Windowscheckout. Kein Produkt-, Fixture-, Package- oder
anderer Dateitypdelta; die vorhandene LF-TXT-Fixtureregel bleibt exakt erhalten.
Der Git-Checkoutfilter wird bei erzwungenem autocrlf=true gegen dieselben
Manifestbytes geprüft. QA-Kandidat e38cb5c bleibt produktseitig unverändert.
