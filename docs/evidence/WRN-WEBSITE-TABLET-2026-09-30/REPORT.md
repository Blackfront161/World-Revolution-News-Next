# Live-Tabletansicht

PO-Auftrag: Website auch auf Tablet mit dem App-Aufbau anzeigen.
Die bereits veröffentlichte Anpassung aus 3206a25 verwendet dieselben
Layoutregeln auf allen Breiten; kein zusätzlicher Produktpatch erforderlich.

Direkt auf https://solinaridao.com/?theme=dark#home geprüft:

- Hochformat 768 x 1024 und Querformat 1024 x 768: Lesespalte 672 px,
  kein horizontaler Überlauf, fünf feste untere Navigationsziele.
- Kopfaktionen 44 x 44 px, Sprachwahl 64 x 44 px, originale Marke geladen.
- Mehr-Menü im Hochformat innerhalb der Breite; Archiv, Wissen, Events,
  Solidarität, Hilfe, App laden, Spenden und Datenschutz sichtbar erreichbar.
- Querformat nach Inhaltsladen: elf Artikelkarten, gleicher Ablauf Aktuell,
  Meldungen, Aufmacher, Lesestücke, Sport, Termine, weitere Lesestücke.
  Keine sichtbaren Fehlerhinweise oder Browserfehler im gezielten Lauf.
- Zwei frische Screenshots; die Hochformat-Browseraufnahme zeigt wegen der
  verfügbaren Panelhöhe nur den oberen Ausschnitt. Die untere Navigation ist
  im vollständigen Querformatbild sichtbar und zusätzlich per DOM geprüft.

Temporäre Browsergröße anschließend zurückgesetzt. Keine neuen Dateien auf
dem Host, keine Daten-/Feed-/Storageänderung und keine erneute breite Testsuite.
Der vorhandene Unterschied beim Hintergrund und die Übersetzungsverfügbarkeit
werden durch diesen Tablet-Abgleich nicht geändert.
