# Browsermatrix-Fortsetzung · 26.09.2026

Produktstand des getrennten Release-Checkouts: `4aef20064c2f5aa76b83f7d3eced4c1ea1b5be34`.
Seit dem receiptgebundenen AAB-Produktcommit `cdd7c946f9b00314760a90acad5fab6789a77750`
wurden nur E2E-Tests und Belege geändert; `git diff --name-only` über die
Android-Release-Quellpfade ist leer. Das bestehende unsignierte AAB bleibt
damit produktbytegleich, sein exakter Emulator-Test weiterhin ausstehend.

Die breitere Mobile-/Website-Browserprobe erreichte zunächst 120 bestandene
Fälle, dann fünf veraltete Home-Orakel. Nach deren Korrektur erreichte der
Folgelauf 123 bestandene Fälle, bevor er wegen fünf weiterer historischer
Testannahmen am konfigurierten Fehlerlimit endete. Der Paketlauf G3-020/021
erreichte 66 bestandene Fälle, dann fünf Fehler. **Keiner dieser abgebrochenen
Läufe ist eine vollständige grüne Browsermatrix.**

Die anschließend fokussiert nachgeprüften Korrekturen betreffen:

- Historische Home-Fixture mit festem 01.09.-Datum, Sport-Leseverzeichnis statt
  altem Discover-Filter, Theme-Wechsel über „Mehr“ und ausschließlich den
  vorgesehenen Quellenwiderrufsabruf. Die großen Home-Matrizen und der
  Reader-/Save-/Sport-Fall bestanden einzeln.
- Legacy-Home 2/2, Personalisierung 2/2, Discover-Sprach-/Theme-/Reflowfall
  1/1 und Reader-v2 2/2: PASS.
- Regionaltermine 3/3: PASS. Der Test-Harness wird aus dem laufenden Checkout
  statt aus einem fest codierten Hauptcheckout-Pfad geladen.
- Medienhub 15/15: PASS. Der Verfügbarkeitsstatus wird eindeutig adressiert;
  die langen visuellen Schleifen haben passende, weiterhin begrenzte Zeitlimits.

Auf `4aef200` bestand `pnpm check` mit Node 24.19.0/pnpm 11.19.0: Format,
Lint, Release- und Importgrenzen, Typprüfung, Provenienz, Mobile 952/952,
Website-Unit-Tests 70/70 und Node-Betrieb 81/81. Die vollständige
3.682-Fälle-/Sieben-Projekte-Browsermatrix wurde noch nicht durchlaufen;
weitere alte absolute Harness-Pfade, die Geräte- und Live-Website-Matrix
sowie das Host-/Play-Gate bleiben offen. Kein Push oder Deployment.

Nachtrag 26.09.: Das gemeldete Wackeln wurde auf der unveränderten Live-Seite
`solinaridao.com` bei 822 px reproduziert. Dort schaltet `website-scrolled`
bereits oberhalb von 36 px um; der `sticky`-Header schrumpft mit 180-ms-
Transition von rund 163 auf 135 px, während die Scrollposition von rund 61 auf
35 px zurückspringt. Der neue Header besitzt diese scrollabhängige Größe nicht.
Sein Regressionstest prüft nun auch 800 und 1440 px nach Ablauf der alten
Transition: 4/4 Chrome-Fälle PASS. Zusätzlich wurden die fünf
Produktionsmedien-Controller-Fälle im getrennten Checkout durch portable
Harness-Importe wieder ausführbar gemacht: 5/5 PASS. ESLint und Prettier für
beide Testdateien PASS. Dies ist eine Test-/Belegkorrektur; die alte Live-Seite
und die Produktdateien wurden nicht verändert.

Weiterer Nachtrag 26.09.: Die Medien-Erststartprobe wurde vom ignorierten
Einzel-HTML und zwei manuell gestarteten Ports auf die bereits im globalen
Browser-Setup vorhandenen Vite-Server verlegt. Die Offline-IDB-Proben starten
nun auf einer leeren Testseite derselben Mobile-Runtime; sie lassen die
Produkt-App nicht vor dem Anlegen ihrer Markerdatenbanken initialisieren.
Damit bestanden Erststart 2/2, Offline-Speicher 16/16 und das kombinierte
Controller-/Erststart-/Offline-/Resume-Paket 30/30 in Chrome. Der
Global-Setup-Grenztest 1/1 sowie gezieltes ESLint/Prettier bestanden.
Produktquellen, Live-Dienste und das vorhandene AAB bleiben unverändert;
die vollständige Browsermatrix ist weiterhin offen.
