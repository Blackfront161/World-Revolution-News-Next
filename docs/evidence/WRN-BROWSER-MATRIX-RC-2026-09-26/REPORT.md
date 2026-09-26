# Browsermatrix des lokalen Release-Kandidaten · 26.09.2026

Produktbasis: `4ba9561` auf Basis des Android-/Content-Produktstands `cdd7c94`.
Der Checkout stand beim Beginn der Matrix auf `c4e3c6a`. Die einzige Änderung
danach betrifft das E2E-Orakel in `tests/e2e/foundation.spec.ts`; App, Website,
Content-Pakete und das bereits gebaute AAB blieben bytegleich.

Alle sieben Playwright-Projekte wurden ausgeführt. Die ersten beiden Projekte
endeten ohne unerwartete Fehler: Website 390×844 mit 361 PASS / 165 vorgesehenen
Skips und Mobile 390×844 mit 485 PASS / 41 Skips. Die übrigen fünf Projekte
liefen zunächst mit vier Workern: 1.214 PASS / 1.392 Skips / 24 Fehler. Davon
war ein Fehler reproduzierbar: Der Fixture-Navigationstest erwartete auf
`?state=ready#events` die produktive Events-Seite, obwohl der Fixture-Modus
dort ausdrücklich den lokalen Platzhalter zeigt. Das Orakel prüft jetzt den
tatsächlichen Fixture-Vertrag. Die produktive Events-Seite bleibt durch
`production-events-media.spec.ts` separat geprüft.

Die 23 weiteren Fehler betrafen vorwiegend zeitweilige `Loading`-Zustände
beim Laden und Wiederöffnen des Readers in Mobile 600×960 und 200-%-Reflow.
Ein isolierter Reader-Nachtest bestand 2/2. Der gezielte Nachlauf aller 18
unterschiedlichen fehlgeschlagenen Testtitel mit den betroffenen Projekten
und zwei Workern bestand 62/62 bei vier vorgesehenen Skips. Der Abgleich von
Projekt, Datei und Testtitel belegt, dass **alle 24 zuvor fehlgeschlagenen
Kombinationen** darin erneut bestanden. Die genaue Ursache der zeitweiligen
Ladezustände unter vier Workern ist nicht bewiesen; daraus folgt kein Anspruch
auf einen fehlerfreien Lauf mit vier Workern. Die reguläre Konfiguration nutzt
zwei Worker.

Damit sind 2.084 unterschiedliche ausgeführte Kombinationen über alle sieben
Projekte mindestens einmal grün; 1.598 projektspezifische Kombinationen sind
vorgesehen übersprungen. Die vier Roh-JSONs verbleiben als ignorierte lokale
Arbeitsartefakte unter `test-results/`; `HASHES.sha256` bindet sie und die
korrigierte Testdatei. Prettier, ESLint und `git diff --check` für die Änderung
bestanden. Es gab keine Produktänderung und keine neue externe Veröffentlichung.

Dies ist ein Browser-Matrix-Beleg, kein Gesamt-Release-PASS. Der aktuelle
Android-Kandidat braucht noch den datenerhaltenden Upgrade-Test genau dieses
AABs; Produktionssignatur und Play-Pre-Launch sind offen. Die drei öffentlichen
Content-/Widerrufszeiger lieferten zuletzt HTTP 404, der letzte Live-
Widerrufsstand ist nicht gesichert und das Hostingpaket wurde nicht aktiviert.
Echte Providerbindung, laufende Auslieferung und PO-Sichtabnahme bleiben als
separate RC-MUST-Punkte offen.
