# Website-RC und Header-Scroll · 26.09.2026

Produkt- und Testcommit im getrennten Neubau: `4ba9561ebecbbfbed6c8dcbdba8315cbbd1cec98`.
Die alte Live-Website ist eine getrennte, unveränderte Baseline. Bei einer
Viewportbreite von 822 px aktiviert sie oberhalb von 36 px Scrollposition die
Klasse `website-scrolled`. Ihr `sticky`-Header reduziert dann die Höhe und
animiert Höhe, Breite und Padding über 180 ms. Das erklärt das gemeldete
Wackeln bereits bei einer kleinen Scrollbewegung.

Der neue Website-Header bleibt `position: static` und behält seine Höhe. Der
Regressionstest überquert die alte 36-px-Schwelle in beide Richtungen bei 390,
800 und 1440 px und prüft nach Ablauf der alten Transition Höhe und Position;
die mobile Ansicht wird ebenfalls geprüft. Ergebnis: 4/4 ausgeführte
Chrome-Fälle bestanden, zehn projektfremde Kombinationen übersprungen. Ein
repräsentativer Screenshot der deutschen 390-px-Website liegt als
`website-home-390-de-violet.png` bei. Die lokale Sichtvorschau läuft unter
`http://127.0.0.1:43233/?theme=violet&lang=de#home`; daraus folgt keine
PO-Abnahme.

Im Websiteprodukt wurde außerdem der Escape-Handler des freiwilligen
Unterstützungshinweises abgegrenzt: Escape schließt nur diesen Dialog und
schließt nicht zusätzlich einen darunter geöffneten Artikel. Der neue
Unit-Test prüft genau diesen Ablauf. Die übrigen Änderungen in diesem Commit
richten historische Browser-Orakel auf die vorhandenen Produktverträge aus;
insbesondere prüfen die Remote-Pointer-Tests jetzt URL, begrenzte Anzahl,
GET ohne Body und fehlende sensible Header auch bei erlaubten Requests.
Der unabhängige Privacy-Abschlussreview meldete PASS. `pnpm check` bestand
mit Mobile 952/952, Website 70/70 und den übrigen Workspace-Prüfungen.
Gezieltes Prettier, ESLint, `git diff --check`, Header-Scroll 4/4 sowie der
zuvor isoliert fehlgeschlagene 120-Fälle-Website-Visualtest bestanden nach der
Korrektur des veralteten Farborakels.

Die anschließend vollständig neu gestartete Chrome-Matrix für
`website-390x844` beendete alle 526 Kombinationen in einem Lauf:
361 erwartete PASS, 165 vorgesehene Skips, 0 unerwartete Fehler und 0 Flakes.
Der JSON-Laufbeleg liegt als ignoriertes Arbeitsartefakt unter
`test-results/website390-4ba9561-20260926.json`. Die übrigen sechs
Playwright-Projekte, echte Geräte- und Hostproben bleiben separate RC-Gates.

Der aus genau diesem Commit gebaute Website-Kandidat enthält 41 Dateien;
das lokale Hosting-Paket mit dem vorhandenen Inhaltsverzeichnis der Sequenz
`202609251928` enthält 44 Dateien. Beide Pakete wurden aus ihren gebundenen
Quellen vollständig rückverifiziert. Der Website-Shellgraph misst 8.383.804
Byte und bleibt damit unter der 8-MiB-Grenze. Paketmanifeste sind beigefügt;
die vollständigen Ausgabeordner bleiben unter `work/` erhalten.

Der Hosttransfer bleibt gesperrt, bis die tatsächlich letzte Live-Version des
Widerrufszeigers sowie die bisherigen Hostdateien und Pointer gesichert sind.
Die drei geprüften Live-Content-/Widerrufszeiger antworteten zuvor mit 404;
Hostinger war nicht authentisiert. Das Paket ist deshalb ein Dry-run, keine
laufende Inhaltsversorgung und keine Veröffentlichung. Das bestehende
unsignierte Android-AAB wurde durch diese Website-/Testkorrektur nicht ersetzt.
