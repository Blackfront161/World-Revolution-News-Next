# WRN â€“ aktueller Arbeitsstand

Neu 26.09. – Für den aktuellen Produktstand `a4cbbff` liegt jetzt auch ein
lokal mit der PO-JKS signiertes AAB `com.world.revolution` 2.2.0/Code27 vor.
Dateisignatur Exit0, Fingerabdruck wie die verfügbaren alten Upload-AABs,
108/108 receiptgebundene Assets erneut PASS. Play-Registrierung und Upload
sind nicht geprüft; die getrennte **WRN Test** bleibt die erste Testoption.
[Signaturbeleg](evidence/WRN-V11-SIGNED-AAB-2026-09-26/REPORT.md).

Neu 26.09. – Test vor Veröffentlichung: Die getrennte App **WRN Test** mit
`com.world.revolution.rc` liegt als AAB und APK bereit und wurde auf einem
Emulator neben der Haupt-App gestartet, ohne diese zu ersetzen. Auf einer
zusätzlich neu angelegten isolierten AVD blieb das in der alten 2.1.1-App
ausdrücklich gewählte Französisch nach Prozessneustart und direktem lokalen
Update auf 2.2.0/Code27 erhalten; `firstInstallTime` blieb unverändert.
Eine zweite frische AVD bestätigte beim aktuellen AAB zusätzlich die Übernahme
eines echten 2.1.1-Merklistenartikels mit Offline-Volltext und Pink-Theme; der
Text blieb nach Neustart im Flugmodus über mehrere Absätze lesbar. Der frühere
unklare DE-Befund gilt nicht als reproduzierter Fehler. Vollständige
Datenmigration, echter Play-signierter Upgradepfad, finale Matrix und
PO-Sichttest bleiben offen. Kein Play-Upload oder Live-Ersatz.
[Paralleltest](evidence/WRN-SIDE-BY-SIDE-TEST-2026-09-26/REPORT.md),
[Datenupgrade](evidence/WRN-V11-ANDROID-DATA-UPGRADE-2026-09-26/REPORT.md).

Neu 26.09. – Die lokale Sport-Personalisierung erkennt jetzt das im
aufgenommenen Discover-Index belegte Thema `sports` als Nutzerwahl `sport`;
kanonische Themen-/Regions-IDs bleiben in der Domain-Projektion erhalten.
Unbekannte Werte matchen nicht. Browser-Personalisierung11/11, gezielter
Nachlauf der übrigen Reader-/Home-/Medien-/Quellenfälle62/62, `pnpm check`
und beide Builds PASS; unabhängiger Review ohne Findings. Ein neues strikt
offline gebautes AAB aus `a4cbbff` enthält108/108 geprüfte Assets; eine
getrennte Kopie ist für Interne App-Freigabe test-signiert. Der bisherige
JKS-signierte AAB aus `4cfaafd` enthält diesen Fix noch nicht; der neuere
signierte Kandidat ist oben dokumentiert. Vollständige
neue RC-Matrix, exakter Android-Upgrade, Host-/Providerbindung und Play
bleiben offen. [Beleg](evidence/WRN-V10-PERSONALIZATION-2026-09-26/REPORT.md).

Neu 26.09. – Der V8-Testkandidat ist wegen fehlender Übernahme alter
Merkliste/Offline-Texte und Theme-Wahl **ersetzt**. Das neue Android-AAB aus
`4cfaafd` ist offline gebaut, 108/108 Assets und `pnpm check` PASS. Auf einem
frisch geleerten Test-AVD blieb das in 2.1.1 ausdrücklich gewählte Theme
„Pink“ beim direkten `install -r` auf 2.2.0/Code27 erhalten. Ein getrennt
testsigniertes AAB für **Interne App-Freigabe** liegt lokal bereit. Das vom PO
bereitgestellte JKS signierte zusätzlich eine getrennte AAB; Zertifikat wie
2.1.1, Signatur und 108/108 Assets PASS, Play-Akzeptanz noch unbestätigt.
Der vollständige frühere Browserlauf endete
mit 83 FAIL bei 2001 PASS/1598 SKIP; daher kein Release-GREEN und kein
Play-Upload. [V10-Android-Beleg](evidence/WRN-V10-ANDROID-UPGRADE-2026-09-26/REPORT.md).

Neu 26.09. – Auf ausdrücklichen PO-Wunsch liegt das V8-AAB als lokal
testsignierte Datei **nur für die interne App-Freigabe** bereit: Version
2.2.0/Code 27, SHA-256
`5b72585e54e7d70a5356a4c06d2d676c2c175aff0a791268925c11fc457978ea`.
Die 557 ursprünglichen Bundle-Einträge blieben bytegleich, Signaturprüfung
PASS und temporärer privater Testschlüssel entfernt. Die V8-E2E-Korrektur
`24689e0` bestand 91/91 Inhalts-/Personalisierungsfälle, 5/5 Home-Fälle und
10/10 wiederholte IndexedDB-Schutzfälle. Frische [App-Vorschau](http://127.0.0.1:43356/?theme=violet#home)
und [Website-Vorschau](http://127.0.0.1:43357/?theme=violet#home) zeigen beide
zwölf Artikel. Die vollständige Browser-Matrix läuft; ein echtes
Play-Upgrade ist damit noch nicht nachgewiesen. [AAB-Beleg](evidence/WRN-V8-INTERNAL-SHARING-2026-09-26/REPORT.md).

Neu 26.09. – Lokaler V8-Sportkandidat: zwölf vollständige Artikel und sieben
einzeln belegte Bilder in App und Website. Drei bebilderte Sportvolltexte bilden
auf Home jetzt 1 großen + 2 kleine Einträge; der bisherige bildlose Beitrag
bleibt erreichbar. Zwei neue AIAC-Volltexte mit 28+23 Absätzen und separat
lizenzierten Commons-Fotos wurden aufgenommen. Builds, Typecheck, fokussierte
Website-Paketfälle12/12 und Home-/Offline-Browserfälle14/14 PASS. Der erste
Gesamtcheck traf einen Windows-`EPERM` beim parallelen temporären Paket-Rename;
der isolierte Paketnachlauf bestand13/13. Die bestehende `atomicRename`-Routine
behebt diese Race; der erneute vollständige `pnpm check` ist PASS
(Mobile952/952, Website155/155 + 71/71 Paketfälle, Content-Betrieb81/81).
Unabhängiger Rechte-/Inhaltsreview nach Hashkorrektur PASS; exakter V8-Android-Upgrade, Live-Hostbindung und Play
bleiben offen. Die Website-Shell bleibt mit8.384.091/8.388.608 Byte innerhalb
der festen Grenze. [V8-Beleg](evidence/WRN-SPORT-1PLUS2-2026-09-26/REPORT.md),
[App-Vorschau](http://127.0.0.1:43354/?theme=violet#home),
[Website-Vorschau](http://127.0.0.1:43355/?theme=violet&lang=de#home).

Neu 26.09. – Das exakte **unsignierte** V8-Android-Bundle aus `d03f966` ist
strikt offline gebaut. `lintVitalRelease` und die byteweise Prüfung aller
108/108 receiptgebundenen Assets sind PASS; SHA-256
`30088120b24a1053cf1a68ba5300b0d4105147622a8272890b23e981573032cd`.
Das vorhandene SDK war nur durch die Dateisandbox zunächst unsichtbar; der
Build nutzte eine prozessgebundene Git-Vertrauensausnahme. Exakte
Testsignierung/Upgrade, finale Matrix, Host-Provenienz und Play bleiben offen.
[V8-Bundlebeleg](evidence/WRN-V8-ANDROID-AAB-2026-09-26/REPORT.md).

Neu 26.09. – Die V8-Website wurde lokal mit44/44 Dateien, das kombinierte
Website-/Verzeichnispaket mit47/47 Dateien byteweise rückverifiziert.
Produktionsinhalt und Metadaten stehen in der Aktivierungsfolge vor den zwei
Zeigern. Der verwendete vorige Widerrufsstand stammt aber nur aus dem
gebündelten lokalen Snapshot, nicht aus dem letzten Hostzustand. Kein
Hosttransfer oder Live-GREEN. [V8-Hosting-Dry-run](evidence/WRN-V8-HOSTING-LOCAL-2026-09-26/REPORT.md).

Neu 26.09. – Unsigniertes V7-Android-Bundle aus Produktcommit `a2d9c5a`:
Version2.2.0/Code27/Target36, 101/101 receiptgebundene Assets und
`lintVitalRelease` PASS, SHA-256
`08137e18b3f5438c9ca7d0a1aae676acb30347f9156c4975044f1716a9a1cb80`.
Der Build lief strikt offline ohne Providerbindung. Dieses exakte AAB wurde
noch nicht test-signiert oder auf einem Gerät als datenerhaltendes Upgrade
geprüft. Produktionssignatur, Play-Pre-Launch und Host-Aktivierung bleiben
offen. [Bundlebeleg](evidence/WRN-V7-ANDROID-AAB-2026-09-26/REPORT.md).

Neu 26.09. – Lokaler V7-Sportkandidat im RC-Checkout: Zehn statt neun
vollständige Artikel sind in App und Website gebündelt. Der zweite AIAC-
Sportbeitrag hat 20 Originalabsätze und ein lokal ausgeliefertes, einzeln
belegtes Pexels-Originalfoto. Der Home-Sportabschnitt zeigt nun zwei
Volltextkarten und eine klar abgegrenzte Linknotiz; eine der Volltextkarten
hat das neue Bild. `pnpm build` und der vollständige `pnpm check` sind grün
(Mobile 952/952, Website 155/155 + 71/71 Paketfälle, Übersetzung 52/52).
Gezielte Home-Browserfälle nach Testkorrektur 6/6 und Website-Offline-Neustart
1/1. V7-Dateien und zwei Sichtproben sind in einem 19-Dateien-SHA-Manifest
gebunden. Ein unabhängiger Rechte-/Inhaltsreview, die 1+2-Bildanforderung,
die komplette Browser-/Android-/Hostingmatrix und Live-Versorgung bleiben
offen; kein Push oder Deployment. [V7-Beleg](evidence/WRN-SPORT-SUPERFAN-2026-09-26/REPORT.md).

Neu 26.09. – Alle sieben Browserprojekte des lokalen RC wurden ausgeführt.
Die erste 4-Worker-Matrix zeigte 24 Fehler bei 1.214 bestandenen Fällen;
ein reproduzierbarer Fixture-/Events-Testwiderspruch wurde korrigiert.
Ein gezielter 2-Worker-Nachlauf bestand 62/62 und deckte alle 24 zuvor
fehlgeschlagenen Kombinationen ab. Insgesamt sind 2.084 unterschiedliche
Kombinationen mindestens einmal grün; 1.598 projektspezifische Skips waren
vorgesehen. Die Ursache der zeitweiligen Ladezustände unter vier Workern ist
nicht bewiesen. `pnpm check` am Checkout `4ca5846` ist vollständig grün
(Mobile 952/952, Website 155/155 + Node 70/70). Produktbytes, Hostingpaket
und AAB blieben unverändert.
Android-Upgrade des exakten Kandidaten, Live-Hostbindung, Provider und Play
bleiben offen. [Matrixbeleg](evidence/WRN-BROWSER-MATRIX-RC-2026-09-26/REPORT.md).

Neu 26.09. – Header-Scroll und Website-RC: Die alte Live-Seite verkleinert ihren
`sticky`-Header ab 36 px Scrollweg mit einer 180-ms-Animation; sie bleibt als
Baseline unverändert. Im Neubau ist der Header statisch. Der Regressionstest
überquert die Schwelle in beide Richtungen bei vier Client-/Viewportfällen:
4/4 PASS. Website-Fix, gezielte Tests und Privacy-Review sind in `4ba9561`
eingecheckt. Die vollständige `website-390x844`-Matrix endete mit 361 PASS,
165 vorgesehenen Skips und 0 Fehlern; sechs weitere Playwright-Projekte
bleiben offen. Website- und Hostingpaket aus diesem Commit wurden mit 41/41
beziehungsweise 44/44 Dateien rückverifiziert; der Hosttransfer ist wegen
fehlendem letzten Live-Widerrufssnapshot weiter offen. Frische lokale
[Website-Vorschau](http://127.0.0.1:43233/?theme=violet&lang=de#home),
[Beleg](evidence/WRN-WEBSITE-RC-2026-09-26/REPORT.md).

Neu 26.09. - Betriebsabgleich: Der öffentliche GitHub-Stand liegt hinter dem lokalen RC; die erfolgreiche 6h-Action ist ausdrücklich ein Dry-run ohne Veröffentlichung. Drei Live-Content-/Widerrufszeiger zeigen „This Page Does Not Exist“. Hostinger leitet zur Anmeldung weiter. Die laufende Inhaltsauslieferung und der vorige Host-Widerrufsstand sind damit weiter offen.
[Beleg](evidence/WRN-RC-HOSTING-CURRENT-2026-09-26/REPORT.md).

Neu 26.09. - Neuer lokaler Hostingkandidat: Produktcommit cdd7c94 und Daten-Commit 50d8a49 bilden 958 aktuelle Nachrichtenlinks, 532 Quellen und drei Sportnotizen ab. 899 gemeinsame Links behalten ihre IDs. Website 41/41 und Hostingpaket 44/44 Dateien byteweise verifiziert; Pointer zuletzt. Nur Dry-run, kein Live-Transfer. Der vorige Host-Widerrufsstand ist weiter unbewiesen.
[Beleg](evidence/WRN-RC-HOSTING-CURRENT-2026-09-26/REPORT.md).


Neu 26.09. - Medien-Browserpaket im getrennten Release-Checkout: Erststart und Offline-IDB nutzen jetzt die vorhandenen leeren Vite-Testseiten. Controller/Erststart/Offline/Resume 30/30 PASS; Header-Scroll 4/4 PASS; Setup-Grenze 1/1, Lint und Format PASS. Nur Test- und Belegdateien wurden geaendert, Produktbytes und AAB bleiben gleich. Volle Browsermatrix, Live-Host und Play sind offen.
[Beleg](evidence/WRN-BROWSER-MATRIX-FOLLOWUP-2026-09-26/REPORT.md).

Neu 26.09. – Browsermatrix-Fortsetzung am getrennten Checkout `4aef200`:
historische Home-/Sport-Uhren, Theme-Bedienung unter „Mehr“, Regional-Harness-
Pfad und eindeutiger Medienstatus wurden in E2E-Tests an den tatsächlichen
Produktvertrag angepasst. Gezielte Home-, Legacy-, Personalisierungs-,
Discover-, Reader-, Regional- und Medienfälle bestanden; Regional 3/3,
Medien 15/15. `pnpm check` auf diesem Stand PASS (Mobile952/952, Website70/70,
Node-Betrieb81/81). Die Release-Quellpfade sind seit dem bytegeprüften
`cdd7c94`-AAB unverändert. Vollständige3.682-Fälle-Browsermatrix, Host,
exakter neuer Emulator-Upgrade und Play bleiben offen.
[Beleg](evidence/WRN-BROWSER-MATRIX-FOLLOWUP-2026-09-26/REPORT.md).

Neu 26.09. – aktuelles unsigniertes Android-Bundle aus `cdd7c94`: Der
receiptgebundene Offline-Build enthält94/94 bytegleiche Webassets einschließlich
der Header-Korrektur. AAB2.2.0/27/Target36, SHA-256
`819bcd20266255fc12e520d9d3c42f35fea3efe338854843137c81bea1d81bb8`;
`jarsigner` bestätigt unsigniert. Vollständiger `pnpm check` für denselben
Commit PASS (Mobile952/952, Node-Betrieb81/81). Exakter Emulator-/Play-Upgrade
dieses neuen AAB, Produktionssignatur, neue Website-Hostbindung und finale
RC-Matrix bleiben offen. [Beleg](evidence/WRN-HEADER-RC-AAB-2026-09-26/REPORT.md).

Neu 26.09. – lokale Header-/Großtext-Korrektur `e1444b38` (separates Repo
`cc6721c`): kurzer Scroll verändert die Kopfzeilenhöhe der neuen App/Website
nicht; bei 390 px und 200 % Schriftgröße ordnen sich Marke und Werkzeuge ohne
Überlappung, die Bibliothek ohne horizontalen Überlauf. Beide Builds,
Typprüfung, Grenzen25/25 und gezielte Browserproben bestanden; unabhängiger
Review PASS. Vier Sichtproben sind versioniert, lokale Vorschauen auf
`127.0.0.1:43330/43331` erreichbar. Das zuvor gebaute Android-AAB aus
`c8c0450` enthält diese CSS-Korrektur nicht; neuer Bundle-/Geräteabgleich,
volle RC-Matrix, Live-Hosting und Play-interner Test bleiben offen.
[Beleg](evidence/WRN-HEADER-REFLOW-2026-09-26/REPORT.md).

Neu 26.09. – exakter Android-Upgrade-Test des lokalen RC `c8c0450`: Eine
universelle, nur lokal test-signierte APK aus dem aktuellen AAB enthielt
94/94 bytegleiche Webassets. Auf neuem isoliertem API36-AVD wurde 2.1.1/26
ohne Deinstallation auf 2.2.0/27 aktualisiert. Erstinstallationszeit, Deutsch,
Violett/Rot und ein gemerkter EFF-Artikel blieben erhalten. Nach Offline-
Neustart öffnete sein Reader; 0 FATAL/ANR in letzten5.000 Logzeilen. Die
bestehende Emulatorinstanz blieb unverändert. Unabhängiger Read-only-Review
PASS für genau diesen lokalen Smoke. Play-Signaturkette, weitere
Datentypen, vollständige Browser-/Gerätematrix, Host-Aktivierung und
Play-interner Test sind offen.
[Exakter Upgradebeleg](evidence/WRN-RC-EXACT-ANDROID-UPGRADE-2026-09-26/REPORT.md).

Neu 25.09. – Header-/Home-Korrektur und neuer lokaler RC `c8c0450`: Das auf
der alten Live-Seite gemeldete Wackeln kommt von einer `sticky`-Kopfzeile mit
animierter Höhe (bei kurzem Scroll ca. 163,33→160,78 px). Die neue App-/Website-
Kopfzeile bleibt im 40-px-Scrolltest 2/2 höhenstabil. Der Sportvolltext erscheint
nur noch im Sportabschnitt; die allgemeine Startseite zählt 1+5+2 Artikel.
Fokussierte Home-Probe14/14, unabhängiger Review und vollständiger `pnpm check`
(Mobile952/952) PASS. Neuer Websitebuild41/41, frisches Hostingpaket44/44 und
unsigniertes AAB2.2.0/27 mit94/94 Assets byteweise geprüft; AAB-SHA-256
`ad7cafa2f7f55d7c5993bcad563edaf0186a6cf8487f3ddb63b359745541f49a`.
Die alte Live-Seite ist noch nicht ersetzt. Volle Browser-/Gerätematrix,
Host-Aktivierung, Produktionssignatur und Play-Test bleiben offen.
[Buildbeleg](evidence/WRN-HOME-HEADER-RC-2026-09-25/REPORT.md).

Neu 25.09. – frischer Datenlauf für den Hostingkandidaten: Der bestehende
Metadaten-Dry-run band Status, Feed und Quellenregister an Daten-Commit
`7d873a68` und beobachtete um 14:53 UTC 968 Nachrichtenlinks, 532 Quellen und
3 Sportnotizen. Der neue Snapshot mit Sequenz `202609251453` bestand Hash-,
Vertrags- und Fortschrittsprüfung. Website 41/41 und kombiniertes Paket 44/44
Dateien wurden anschließend aus dem aktuellen Produktbuild rückverifiziert.
Das ist keine automatische Volltext-/Bildaufnahme oder Live-Veröffentlichung.
[Frischer Hostingbeleg](evidence/WRN-RC-HOSTING-FRESH-301EC96-2026-09-25/REPORT.md).

Neu 25.09. – aktuelles lokales Hostingpaket: Der Website-Produktionsbuild aus
`301ec96` enthält den Videopiloten und wurde mit41/41 Dateien rückverifiziert.
Das kombinierte Paket umfasst44/44 bytegeprüfte Dateien und setzt die beiden
Inhalts-/Verzeichniszeiger zuletzt. Der wiederverwendete Verzeichnissnapshot
beobachtete Inhalte zuletzt am09.09.; ein frischer gebundener Lauf und die
tatsächliche Host-/Widerrufsprovenienz sind vor Aktivierung nötig. Es wurde
nichts veröffentlicht.
[Hostingbeleg](evidence/WRN-RC-HOSTING-301EC96-2026-09-25/REPORT.md).

Neu 25.09. – RC-Check und aktuelles Bundle: Im getrennten, weiterhin nicht
gepushten Repo-Checkout `301ec96` bestand der vollständige `pnpm check`.
Mobile951/951, Website und Node-Betrieb81/81 sind grün; die testseitige
Worker-Grenze und das exakte Archiv des historischen 12-Dateien-Belegs
verhindern falsche Zeit-/Gegenwartsvergleiche ohne gelockerte Orakel. Das
neu gebaute unsignierte 2.2.0/27-AAB bindet94/94 Assets an diesen Commit,
SHA-256 `7aeef1e86b2dacdb7b90c130040943a5d35c571d395179391ffa9e3b7cbe0a14`.
Es ist bytegleich mit dem zuvor nativ geprüften Build. Live-Hosting,
Produktionssignatur, echtes Upgrade dieses Kandidaten, Play-Pre-Launch und
finale Browser-/Gerätematrix fehlen weiterhin.
[Check-/Bundlebeleg](evidence/WRN-RC-CHECK-STABILITY-2026-09-25/REPORT.md).

Neu 25.09. – aktueller nativer Videopilot: Der öffentliche, lokal noch nicht
gepushte Repo-Commit `7397ffa` lieferte ein receiptgebundenes unsigniertes
2.2.0/27-AAB mit 94/94 Assets (SHA-256
`7aeef1e86b2dacdb7b90c130040943a5d35c571d395179391ffa9e3b7cbe0a14`).
Die webassetgleiche, nur lokal testsignierte APK wurde auf einem isolierten
API36-Emulator frisch installiert und offline gestartet. Beide neuen
Videopilotkarten sind nativ erreichbar, 0 FATAL/ANR in den letzten 5.000
Logzeilen. Das ist noch kein datenerhaltendes Upgrade des exakten Kandidaten,
keine Produktionssignatur und keine vollständige finale RC-Matrix.
[Nativer Beleg](evidence/WRN-VIDEO-02-NATIVE-2026-09-25/REPORT.md).

Neu 25.09. – VIDEO-02-Linkpilot: Zwei konkrete Originalverweise (Dara-Short,
Andrewism-Erklärvideo) erscheinen in App und Website mit Sprachfilter. Titel,
Kanal und Format sind am Original geprüft; der fehlende redaktionelle
Inhaltscheck ist in allen neun UI-Sprachen sichtbar. Keine YouTube-Anfrage vor
dem Klick, keine Einbettungs- oder Offlinezusage. 39/39 Unit-Tests, Typprüfung,
Lint, beide Builds, 3/3 Browserfälle und unabhängiger Korrekturreview PASS.
VIDEO-02 bleibt für Inhaltsaufnahme und laufende Versorgung offen. Die
Website-Offline-Shell bleibt mit 8.383.039 Byte unter 8 MiB.
[Pilotbeleg](evidence/WRN-VIDEO-02-LINK-PILOT-2026-09-25/REPORT.md).

Neu 25.09. – Hosting-/Kostenkontrolle: Das angemeldete Cloudflare-Konto nutzt
Workers Free und enthält drei bestehende Worker, aber kein Pages-Projekt.
Alte Proxy-/Cache-Bindungen für Gemini, Hugging Face und Azure sind vorhanden;
ihre aktiven Altschalter sind kein Beleg für ein kostenfreies neues Kontingent.
Der Hostinger-Dateimanager für `solinaridao.com` fordert weiterhin Login.
Das verifizierte neue Hostingpaket ist daher noch nicht auf dem Live-Host;
drei Produktionszeiger lieferten HTTP404. Die RC-MUST-Matrix zeigt nun auch
den aktuellen 94-Asset-AAB-Stand und trennt dessen frischen Emulatorstart
vom älteren datenerhaltenden Upgradebeleg. Es gab keine externe Änderung.
[Hostingbeleg](evidence/WRN-SRC04-HOSTING-CANDIDATE-2026-09-25/REPORT.md).

Neu 25.09. – SRC-04-Teilpaket: 16 internationale, nur als Metadatenlinks
aufgenommene Profile ergänzen die drei bisherigen Quellenpässe. Beide Clients
haben jetzt 19 Profile/22 Endpunkte bei unveränderten 532 Verzeichnis-IDs.
Der kumulative Widerruf ist mehrtabfest; Online-Erstrender zeigt Direktlinks
erst nach dem Widerrufsversuch. Der Website-Packager verlangt den vorher
ausgelieferten Widerrufs-Snapshot und weist rev2→rev1 ab; rev2→rev3 besteht.
Unabhängiger Korrekturreview PASS, Mobile-Loader9/9 und Route8/8,
Website4/4, Paket13/13, Asset-Parität2/2, Android-Release/Lint/Build PASS.
Die finale unsignierte APK 2.2.0/27 hat SHA-256
`02173dbbdbadb2a7f4bc7b1dbb0a8c623c685edc2f4ee50d748379088ebf249d`;
ein frisch test-signierter API36-Emulatorstart zeigt alle neuen Karten bereits
offline, danach online, ohne FATAL/ANR. Die Website hat frisch offline weiter
nur drei Profile bei unverändertem 8-MiB-Shell-Limit. SRC-04 und Gesamt-RC
bleiben offen; Live-Host/Widerrufszeiger, Produktionssignatur und Play-internes
Pre-Launch bleiben ausstehend. [Paketbeleg](evidence/WRN-SRC04-GLOBAL-SOURCES-2026-09-25/REPORT.md).

Neu25.09. – aktueller Android-Kandidat `4dc1ad8e`: Das frisch erzeugte
2.2.0/27-AAB bindet 92/92 Assets, ist 8.147.511 Byte groß und hat SHA-256
`30560592ce6e6fee4aca1f02b9eccfac1cc027a9e6ba66eeefa9d5d193a7c77e`.
Android-Release-Tests und `lintRelease` bestanden. Das reale API36-Upgrade der
testsignierten 2.1.1/26 erhielt Paketidentität, Deutsch, Violett/Rot und den
gespeicherten EFF-Artikel. Danach waren die neue Quellenroute, Filter und der
kanonische EFF-Quellenpass im installierten Kandidaten erreichbar. 0
FATAL-/ANR-Treffer. Produktions-/Uploadschlüssel wurden nicht verwendet.
Das dazugehörige Websitepaket mit 38 Dateien/9.952.035 Byte und das kombinierte
Hostingpaket mit 41 Dateien/11.881.985 Byte wurden anschließend vollständig
rekonstruiert und bytegeprüft. Offen bleiben die authentisierte
Live-Aktivierung/HTTPS-/CORS-/Header-/Rollbackprüfung, Produktionssignatur und
Play-interner Pre-Launch. SRC-04 bleibt bis zu einem separaten sicheren
Widerrufsvertrag für direkte Quellen offen.
[Aktueller Emulatorbeleg](evidence/WRN-CURRENT-RC-EMULATOR-2026-09-25/REPORT.md).
[Aktueller Hostingbeleg](evidence/WRN-CURRENT-RC-HOSTING-PACKET-2026-09-25/REPORT.md).

Neu25.09. – kanonische Quellenpässe: EFF, C4SS und Africa Is a Country stehen
in App und Website als drei belegte Profile vor der getrennten vollständigen
Liste mit 532 unveränderten Endpunkt-IDs. Sechs kombinierbare Filter,
stabile IDs/Aliasse, getrennte Selbst-/Redaktionsbeschreibung, zeitlich
gebundener Endpunktstatus, lokalisierte Rechte mit Einzelprüfungsvorbehalt,
neutrale Initialen und sichere öffentliche Kontaktwege sind erreichbar.
475/475 Vertrags-, 33/33 Sprach-, 944/944 Mobile- und 155/155+69/69
Websiteprüfungen sowie beide Produktionsbuilds bestanden; unabhängiger
Korrekturreview PASS. SRC-01 bis SRC-03 sind geschlossen. Die internationale
PO-092-Kandidatenaufnahme bleibt als SRC-04 offen; keine Kandidatenadmission
oder Gesamtfreigabe abgeleitet.
[Quellenpass-Beleg](evidence/WRN-SOURCE-PASS-OVERLAY-2026-09-25/REPORT.md).

Neu25.09. – echter API36-Upgrade-/Erststarttest für `52109b09`: Die
testsignierte 2.1.1/26 wurde ohne Deinstallation auf 2.2.0/27 aktualisiert;
Paketidentität, Deutsch, Violett/Rot und der gespeicherte Artikel blieben
erhalten. Offline-Deep-Link, vollständiger Reader und lokale Gerätestimme sind
bestanden; das Menü führt mit Android-Zurück wieder zur Startseite. Ein
getrennter frischer 2.2.0-Start aktivierte v6 und dekodierte das zugelassene
EFF-Bild auf Karte und im Reader. 0 FATAL-/ANR-Treffer. Reale Sperre: Die
Produktionszeiger für Inhalte und Verzeichnis antworten weiterhin mit HTTP 404;
der explizite Aktualisierungsversuch einer erhaltenen v1 schlägt deshalb fehl.
Vor Play intern sind Hostingaktivierung samt HTTPS/CORS/Header/Rollback,
Produktionssignatur und Play-Pre-Launch offen.
[Emulatorbeleg](evidence/WRN-PRE-PLAY-EMULATOR-2026-09-25/REPORT.md).

Neu25.09. – unabhängiger RC-MUST-Abgleich: HOME-01, SPORT-02 und DISC-01
sind nach Prüfung des tatsächlich erreichbaren Produkts geschlossen. V6 zeigt
1 Aufmacher, 5 kompakte und 3 weitere Nachrichten sowie Sport vor fünf
aktuellen Regionalterminen. Das lokale Sportverzeichnis umfasst 9 Haupt- und
31 zusätzliche Fan-/Netzwerkquellen in 7 Sprachen aus allen 6 bewohnten
Kontinenten; `directoryOnly` bleibt ohne Feed-/Volltextclaim. Entdecken erfüllt
Suche und alle 5 kombinierten Facetten. Fokussierte Reproduktion:
22/22 Domain/Discover, 27/27 Mobile Home/Sport/Directory, 3/3 Website
Directory, 44/44 Vertrag, 7/7 Termine und 4/4+1/1 Sportquellen. DATA-01,
SPORT-01 und SRC-01 bis SRC-04 blieben zu diesem Prüfzeitpunkt wegen realer
Inhalts-, Bildrechte- und Quellenpasslücken offen. SRC-01 bis SRC-03 wurden im
nachfolgenden Quellenpass-Paket geschlossen; SRC-04 bleibt offen. Kein
Gesamt-GREEN.
[Audit](evidence/WRN-RC-MATRIX-CLOSURE-AUDIT-2026-09-25/REPORT.md).

Neu25.09. – Pre-Play-RC V2 `52109b09`: Die bisherigen Startdateien wurden in
statische, vollständig gebundene Produktionschunks geteilt; größter Chunk
395.006 Byte in Mobile und 400.293 Byte auf der Website, mit hartem
500.000-Byte-Buildgate. Der 14-Dateien-Offline-Shell bleibt mit 8.334.212 Byte
unter 8 MiB und bestand 4/4 echte Chrome-Offlinetests. Das Android-Receipt
erzeugt und bindet nun selbst einen frischen Build mit bereinigter, vollständig
dokumentierter Providerumgebung; das unsignierte AAB umfasst 92/92 bytegleiche
Assets, 8.137.292 Byte und SHA-256
`811add1d76b18068e62f89cb0e79ee7995bf26fd1b42a1ce1cf813eac612a160`.
Websitepaket 38 Dateien, kombiniertes Hostingpaket 41 Dateien, beide vollständig
rückverifiziert; unabhängiger Abschlussreview PASS ohne offene Findings.
Mobile939/939, Website154/154+69/69, Android16/16+Lint,
Workspace-Typechecks und Produktionsbuilds grün. Offen bleiben Signierung,
freigegebene Installation/Upgrade, Play-interner Pre-Launch-Test sowie
authentisiertes Hosting mit HTTPS-/Rollbackprobe. [RC-V2-Nachweis](evidence/WRN-PRE-PLAY-RC-2026-09-25-V2/REPORT.md).

Neu25.09. – Pre-Play-RC b981c676: Die fünf aktuellen Regionaltermine sind
lokal, barrierefrei und ohne Standorterfassung in beiden Clients erreichbar;
der 48-Stunden-Guard ist 3/3 und die Browsermatrix 16/16 grün. Das neue
unsignierte Android-AAB (2.2.0/27, Target SDK 36) bindet 91/91 Assets, hat
SHA-256 `ea5c730bfc7a5c5de4e0b014b9ea15ee525dacab70192109ad571360492c8892`
und bestand 16/16 Android-Tests sowie `lintRelease`. Das aktualisierte
36-Dateien-Hostingpaket umfasst 11.837.153 Bytes und wurde vollständig
rekonstruiert und bytegeprüft. Offen sind Produktionssignatur, Play-interner
Upgrade-/Pre-Launch-Test, authentisierte Hostingaktivierung/HTTPS-Probe sowie
der abschließende Performance-/Geräteabgleich. [RC-Nachweis](evidence/WRN-PRE-PLAY-RC-2026-09-25/REPORT.md).

Neu25.09. – Vorab-Release-Hostingpaket: Der aktuelle 9-Artikel-Webauftritt und
das im öffentlichen GitHub-Lauf geprüfte Verzeichnis mit 958 Nachrichtenlinks,
532 Quellen und drei Sportnotizen sind nun als ein 36-Dateien-Paket mit
verifizierter Closure, Headern sowie expliziter Aktivierungs- und
Rollbackreihenfolge vorbereitet. Die beiden `current.json`-Zeiger werden zuletzt
aktiviert; vorherige Serverwurzel und Zeigerbytes müssen erhalten bleiben. 12/12
gezielte Tests, ESLint, Format und die reale Paketprüfung sind grün. Keine
Veröffentlichung erfolgte. Offen bleiben authentisierter Produktionshost-
Transfer, HTTPS-Liveprobe, Produktionssignatur sowie Play-interner Upgrade- und
Pre-Launch-Test. [Nachweis](evidence/WRN-PRE-PLAY-HOSTING-PACKET-2026-09-25/REPORT.md).

Neu25.09. – aktuelle Metadatenversorgung: Der sechsstündliche, weiterhin
nicht veröffentlichende GitHub-Lauf erzeugt nun bei jedem gültigen Alt-Backend-
Commit ein vollständig validiertes Verzeichnis-Prüfpaket. Historische App-
Beobachtungen bleiben erhalten; bisherige GitHub-Beobachtungen werden durch den
exakt gebundenen aktuellen Commit ersetzt. Die reale lokale Probe gegen
936b3bae erzeugte 958 Nachrichtenverweise, 532 Quellen und drei Sportnotizen;
16 HTTP-Nachrichten, neun HTTP-Quellen und fünf problematische Metadatensätze
wurden abgewiesen. 37/37 betroffene Tests, ESLint, Format und der echte
Netzwerk-Dry-run sind grün. Volltexte/Bilder wurden nicht übernommen und
`publicationPerformed` blieb false. Produktionshosting und der authentisierte,
rollbackfähige Transfer bleiben offen. Der korrigierte öffentliche GitHub-Lauf
[36028488433](https://github.com/Blackfront161/World-Revolution-News-Next/actions/runs/36028488433)
bestand einschließlich Commitbindung, Metadatenverzeichnis und Artefakt-Upload;
das heruntergeladene 1.928.624-Byte-Paket bestand erneut Vertrag, IDs und Hash.
[Nachweis](evidence/WRN-LIVE-DIRECTORY-SUPPLY-2026-09-25/REPORT.md).

Neu24.09. – lokaler Android-RC: Artikelvorlesen über lokale Gerätestimmen und die
freiwillige, standardmäßig deaktivierte Online-Podcast-Oberfläche sind in App und
Website integriert. Eine trackerfreie Datenschutzerklärung liegt in neun Sprachen
vor. Der Podcastdienst bleibt ohne geprüfte Cloudflare-/Azure-F0-Bindungen auf503.
Der Inhaltsverzeichnis-Refresh prüft Herkunft, Hash, Sequenz, Rollback und eine
8-Sekunden-Grenze; der geplante GitHub-Lauf veröffentlicht weiterhin nicht.
Regionaltermine laden nun die exakt gehashten JSON-Rohbytes und sind bis
28.09.2026 gültig. Workspace-Test, Lint/Paketgrenzen, Format, Typprüfung und beide
Produktionsbuilds sind grün. Das neue AAB aus d5ef6b6a bindet91/91 Assets; der
unabhängige TTS-Abschlussreview ist PASS. Reales API36-Upgrade26→27 erhielt
Installationsidentität und gespeicherten Artikel; lokale Stimme sowie
Play/Pause/Fortsetzen/Stopp sind bestanden. Artikel-TTS ist damit nicht mehr als
späterer Wunsch offen. Das getrennte GitHub-Repository ist nach vollständigem
48-Commit-Secret-Audit öffentlich und erhält den sauberen Export dieses RC;
laufender Inhaltsbetrieb, Hosting und Play-Console-Schritte bleiben extern offen.
Zine, World Revolution Map und Action Radar bleiben vorgemerkt.

Neu20.09. – vollständiger Quellen-Suchaudit: alle532 Einträge in beiden Clients geprüft; beobachtete Namen und Homepage-Domains jetzt gemeinsam durchsuchbar. Fokussierte8 Tests, Typprüfung, Builds, Chrome und unabhängiger Review PASS. Website154+65; Mobile924/925, unveränderter Dialogtest im isolierten Modul6/6 bestanden. Vorschauen43234/43235. [Nachweis](evidence/WRN-SOURCE-SEARCH-AUDIT-2026-09-20/REPORT.md).

Neu20.09. – Azure-Podcast und Quellensuche: F0 durch PO bestätigt. Direkte Aktion war bereits in beiden Quellenlisten; Domainsuche korrigiert und in beiden Vorschauen geprüft. Mobile923/Website152+65 Tests bestanden. Separater Azure-Dienst für18 Stimmen/neun Sprachen lokal vorbereitet; echter Workerd-Test ohne externe Provideranfrage bestanden. Gemeinsame Livequoten, Ressourcen-/Speicherbindung und Erstellungsoberfläche noch offen, Dienst deaktiviert. MEDIA-03 bleibt in Arbeit. Vorschauen App43232/Website43233. [Paketbericht](evidence/WRN-PODCAST-AZURE-2026-09-20/REPORT.md).

Neu20.09. – globale Sportquellen:40 Einträge,17 neu, sechs bewohnte Kontinente; Kontinentfilter in neun Sprachen. Unabhängiger Review PASS, Mobile922/Website151+65 Tests, abschließend4 Sporttests bestanden. Getrenntes GitHub main92128dc, exakter Elf-Dateien-Transfer. Vorschauen App43230/Website43231. Öffentlich-Schaltung wartet auf GitHub-Kontobestätigung; Cloudflare-Verbindung auf konkrete Berechtigungsbestätigung. Android27/2.2.0: unsigniertes AAB offline gebaut,91 Assets bytegleich,16 JVM-Tests/Lint ohne Fehler. Signierung, Upgradeprüfung und Veröffentlichung offen. [Sportbericht](evidence/WRN-GLOBAL-SPORT-2026-09-20/REPORT.md), [Veröffentlichung und TTS](evidence/WRN-GLOBAL-SPORT-2026-09-20/PUBLICATION-AND-TTS.md).


Neu20.09. – native Übersetzungsadapter: KV und SQLite-Kontingente implementiert;48 Diensttests, Typprüfung und echter lokaler Workerd-Test bestanden. Acht parallele gleiche Anfragen teilen einen Anbieteraufruf; Cache und globale Kontingentsperre geprüft. Keine echten Provideraufrufe, keine Cloudänderung. Neue Ressourcen-/Free-Projektbindung und laufende Veröffentlichung bleiben offen. [Nachweis](evidence/WRN-SEPARATE-PLATFORM-2026-09-20/NATIVE-TRANSLATION.md).

Neu20.09. – getrennte Plattform: eigenes privates Repository [World-Revolution-News-Next](https://github.com/Blackfront161/World-Revolution-News-Next) erstellt.14 zusätzliche belegte Fan-/Netzwerkeinträge zu neun bisherigen Sportquellen; keine politische Zuschreibung aus bloßer Fanexistenz. Separater Übersetzungs-Worker vorbereitet,42 Tests/Typprüfung und unabhängiger Review PASS; Cache-/Quotenressourcen und kostenlose Providerbindung noch offen. Cloudflare Workers Free im Dashboard bestätigt; keine Paid-Aktivierung. Quellsnapshot erfolgreich nach GitHub main61c129f übertragen (1856 Dateien, kanonischer Blob-/Modusvergleich identisch). [Transferbeleg](evidence/WRN-SEPARATE-PLATFORM-2026-09-20/TRANSFER.md). Abschlussbelege: [Paket](evidence/WRN-SEPARATE-PLATFORM-2026-09-20/REPORT.md). Neue Vorschauziele App43228/Website43229. Laufende Veröffentlichung, Native und Gesamt-RC weiter offen.


Neu20.09.: neun Artikel/vier unveränderte Bilder lokal aktiv (V6), einschließlich vollständigem AIAC-Sportkommentar mit30 Originalabsätzen und belegtem Atomzeitpunkt. Sportkarten mit Reader und Mehrfachkategorien; FSGT-RSS/AIAC-Atom geprüft. Sechsstündlicher GitHub-Vorbereitungslauf lokal vorhanden, nicht veröffentlicht. Live-Aktivierung/Repository-Ziel bleiben offen. Frische Vorschauen [App43226](http://127.0.0.1:43226/?theme=violet#home) / [Website43227](http://127.0.0.1:43227/?theme=violet&lang=de#home). [Sportaufnahme](evidence/WRN-SPORT-FULLTEXT-2026-09-20/REPORT.md), [Versorgung](evidence/WRN-SCHEDULED-SUPPLY-2026-09-20/REPORT.md). Ältere APK/Vorschaucaches bleiben separat; keine neue Installation oder laufende Liveversorgung aus diesem lokalen Paket ableiten.

20. September 2026 Â· Chief /root Â· Ziel: ein vollstÃ¤ndiger, unverÃ¤nderlicher RC.
Einzige Anforderungsmatrix: [RC-MUST](evidence/WRN-PO-SCOPE-STATUS-2026-09-10.md).
MenÃ¼-RÃ¼ckweg20.09. korrigiert: Header-ZurÃ¼ckpfeil fÃ¼hrt aus Mehr zur vorherigen Route; Direktlinkfallback Start.99 App-/Website-Tests und beide Browser/Builds bestanden. Neue Vorschauen [App43224](http://127.0.0.1:43224/?theme=violet#more) / [Website43225](http://127.0.0.1:43225/?theme=violet#more). [Beleg](evidence/WRN-MENU-RETURN-2026-09-20/REPORT.md).

Aktuell: acht Artikel/vier Bilder lokal integriert; kompakte Filtersuche und Header UI-05 abgeschlossen. Neue Vorschauen43222/43223. Hamburger,
Suchfokus und SprachkÃ¼rzel. UnabhÃ¤ngiger Review, beide Builds und BrowserprÃ¼fung
neun Sprachen/drei Themes/fÃ¼nf Breiten PASS. [App43218](http://127.0.0.1:43218/?theme=violet#home)
/ [Website43219](http://127.0.0.1:43219/?theme=violet&lang=de#home).
[Abschluss](evidence/WRN-COMPACT-HEADER-2026-09-14/REPORT.md).
Neu geprÃ¼ft: wiederholbare lokale Versorgung mit echten `awaiting-admission`- und
`no-change`-Proben, ohne automatische Aufnahme oder VerÃ¶ffentlichung.
[Versorgungsbericht](evidence/WRN-CONTINUOUS-SUPPLY-2026-09-20/REPORT.md).
Altbackend-Freshnessfix liegt als [PR38](https://github.com/Blackfront161/Revolution-News-Data/pull/38)
mit zwei erfolgreichen GitHub-PrÃ¼fungen vor. Konkrete Mergefreigabe ausstehend.
Neue unsignierte Acht-Artikel-APK: 85 geprÃ¼fte Assets,16 JVM-Tests bestanden,
Lint ohne Fehler; unabhÃ¤ngiger Review PASS. Signierung/Testinstallation ausstehend.
[Native-Bericht](evidence/WRN-NATIVE-EIGHT-ARTICLE-2026-09-20/REPORT.md).
Gemini-REST-Adapter vorbereitet,36 Diensttests bestanden; kostenlose Projekt-/SchlÃ¼sselbindung und Provideraktivierung bleiben offen. [Adapterbericht](evidence/WRN-GEMINI-ADAPTER-2026-09-20.md).
Installierte Emulator-APK bleibt Ã¤lter; laufende Inhalte, Ãœbersetzung, weitere
Medien und vollstÃ¤ndiger Native-/Releaseabschluss weiterhin offen.
Alle WÃ¼nsche bleiben erhalten; Architektur und SicherheitsvertrÃ¤ge unverÃ¤ndert.
Neuester direkter PO-Auftrag: alle im letzten Restabgleich genannten Ã„nderungen
sind zur Umsetzung freigegeben. Schlanke Pakete ohne Funktions-/Bedienabbau;
deutsche eigene Produkttexte geschlechtergerecht. Root fÃ¼hrt bestehende Versorgung
weiter; UI-03 Editorial-Theme und UI-04 SprachÃ¼bergabe geschlossen. Zine, World Revolution Map und
Action Radar bleiben ausdrÃ¼cklich spÃ¤ter offen und werden gelegentlich erwÃ¤hnt.
Abschlussantworten wieder mit `:)`; ein neuer Task ist nicht erforderlich.
PO-ZielgruppenprÃ¤zisierung vom13.09. im [Product Charter](00-PRODUCT-CHARTER.md)
festgehalten; die zusÃ¤tzlichen Gruppen wurden inzwischen vom PO bestÃ¤tigt. Kein geÃ¤nderter
Funktionsumfang oder Frontend-/Backendauftrag daraus abgeleitet.

| RC-Paket | Stand und nÃ¤chster Abschluss |
| --- | --- |
| 1 Mediencontroller | **Geschlossen als technische Grundlage.** A7 unabhÃ¤ngig PASS nach drei korrigierten Findings: exaktes 30s-Handle-Ende, echte A5-Konfliktbelege und keine Arbeit nach dispose.32 fokussierte MobilefÃ¤lle,1 Websitefall,5 echte IDB-BrowserfÃ¤lle; unverÃ¤nderte unabhÃ¤ngige Fehlerprobes bestanden. A1â€“A6 bleiben geprÃ¼ft. Sichtbare Medienintegration gehÃ¶rt weiter zu RC2. |
| 2 Produktive Medien | **In Arbeit.** EFF-Folge, gemeinsame Medien-UI, lokaler Erststart, Providerpolicy und CSP in beiden Builds integriert. Quelle/Provider unabhÃ¤ngig PASS; First-Boot2/2 echte IDB-BrowserfÃ¤lle und beide ProduktoberflÃ¤chen mit neun Sprachen/Consent/Clear bestanden. Echter Browser-MP3-Stream und Pausieren am13.09. in beiden Clients bestÃ¤tigt; Native und laufende Metadatenversorgung bleiben offen. [Paketbericht](evidence/WRN-RC-MEDIA-2026-09-12/REPORT.md). |
| 3 Nutzerfunktionen | **In Arbeit.** Browserpaket ab9371f1 unabhÃ¤ngig PASS und sichtbar: BesuchsÃ¼bersicht, exakte FassungsÃ¤nderungshinweise und freiwillige lokale Benachrichtigungen,31 fokussierte/6 echte IDB-BrowserfÃ¤lle. Belegte wesentliche Korrekturmetadaten und native Hintergrundzustellung bleiben offen. |
| 4 Laufende Inhalte | **In Arbeit.** Neun Artikel/vier Originalbilder, historische Verzeichnisse, fünf aktuelle Regionalverweise und drei kanonische Quellenpässe aktiv. Bestehendes Backend produktiv anbinden, SRC-04, Sportbilder/-auswahl und wiederholbare Volltextversorgung abschließen. |
| 5 App und Website | **In Arbeit.** Gemeinsame Funktionen, neun Sprachen, Themes, Offline und native Darstellung vollstÃ¤ndig zusammenfÃ¼hren; Leistungs-/Accessibility-/ParitÃ¤tslÃ¼cken schlieÃŸen. |
| 6 Finaler RC | **Offen.** Ein Kandidat, vollstÃ¤ndige MUST-Matrix, GesamtprÃ¼fungen, Offline/Upgrade/GerÃ¤t, Websitepaket, Rechte/Privacy und PO-Sichtabnahme. Externe Releaseoperationen separat genehmigen. |

Sport-Fortsetzung14.09.: gemeinsame produktive Startseite mit1+2 Sportnotizen, lokalen Kategorien, ehrlichem Frauen-Leerzustand und direktem Sportverzeichnis-Link.907 Mobile-/147 WebsitefÃ¤lle bestanden; Website-Node61/65 zuerst,21/21 betroffene FÃ¤lle nach Korrektur veralteter Sieben-Artikel-Erwartungen und isolierter Windows-Rename-PrÃ¼fung. UnabhÃ¤ngiger Review PASS, neun Sprachen/drei Themes/320px/Offlinefilter im Browser bestanden. [Sportbericht](evidence/WRN-SPORT-HOME-2026-09-14/REPORT.md). Keine Sportbilder oder Volltexte ohne belegte Aufnahme; vollstÃ¤ndiges SPORT-01 weiter in Arbeit. Finale Vorschau83b3b4db: [App43214](http://127.0.0.1:43214/?theme=violet#home) / [Website43215](http://127.0.0.1:43215/?theme=violet&lang=de#home), Prozess14992. Beide finalen Builds/Browserscopes PASS,70/62 Dateien; Websitegraph8.258.529 Bytes unter8MiB. Sechs finale Sport-Screenshots im Paketmanifest.

Vorherige Vorschau: [App43210](http://127.0.0.1:43210/?theme=editorial#home) und
[Website43211](http://127.0.0.1:43211/?theme=editorial&lang=de#home).
Aktueller Build724f2e4c enthÃ¤lt zusÃ¤tzlich zwei neutrale deutsche Medienlabels;
Sprachpaket32/32 und beide gebauten Dialoge bei320px/axe/0externenRequests
bestanden. [Kopienachweis](evidence/WRN-EDITORIAL-THEME-2026-09-13/copy-build-manifest.json).
Zugrundeliegender UI03-Build86751a86, unabhÃ¤ngig PASS (20 Pfade); neun Sprachen,320/1280px,
vier axe-PrÃ¼fungen, schwarze DefaultflÃ¤che und queryfreie Theme-Persistenz2/2.
Sechs finale Screenshots/Buildhashes im
[UI03-Manifest](evidence/WRN-EDITORIAL-THEME-2026-09-13/manifest.json).
Website147/147+Node65/65; Mobile896/897 im parallelen Lauf, unverÃ¤nderter
5s-Directory-AusreiÃŸer isoliert2/2 auch unabhÃ¤ngig PASS. Kein Orakel abgeschwÃ¤cht.
Websitegraph8.257.090 Bytes unter8MiB, sechs Artikel/vier Bilder bytegleich.
Terra hat UI03 zurÃ¼ckgegeben; Root besitzt Integration/Belege, keine fremden UI-Writes.

Vorherige UI04-Vorschau: [App43208](http://127.0.0.1:43208/#home) und
[Website43209](http://127.0.0.1:43209/?lang=de#home), Arbeitsbuild vor Editorial-Writes.
SprachÃ¼bergabe fba76c51 unabhÃ¤ngig PASS; neun Sprachen/erster Dialog/Reload
im Browser bestanden, keine externen Requests oder Seitenfehler. Beide Builds
erhalten sechs Artikel/vier Bilder, Websitegraph8.252.482 Bytes unter8MiB.
Root-RC4-Intake:14 Tests und unabhÃ¤ngiger Deltaabschluss PASS; bestehender
GitHub-Feed am gleichen Commit liefert500 Kandidaten/97 Quellnamen/11 markierte
TextidentitÃ¤tskonflikte. Keine Client-VerÃ¶ffentlichung; V3-/Quellenpass-/Bild-
Anbindung bleibt offen. [Bericht](evidence/WRN-LEGACY-NEWS-INGESTION-2026-09-13/REPORT.md).

RC4-Fortsetzung14.09.: Verlustfreie Append-Bindung und benutzbarer `--append`-
Modus fÃ¼r bestehende V3-Publisher-Eingaben umgesetzt. Alte Artikel mÃ¼ssen nicht
mehr im neuesten500erFeed stehen; Artikel/Reader/Bilder/Admission und Lifecycle
bleiben erhalten.18 Importtests,32/32 betroffene Backendtests bestanden;
unabhÃ¤ngiger begrenzter Review ohne blockierendes Finding.
[Updatebericht](evidence/WRN-LEGACY-NEWS-UPDATE-2026-09-14/REPORT.md).
Version4 lokal in beiden Clients aktiviert: sieben Artikel/vier unverÃ¤nderte
Bilder. Neuer italienischer C4SS-Beitrag mit20 OriginalabsÃ¤tzen/Ãœbersetzerangabe;
Quellen-/Kandidatenreview PASS. Beide Browser/neun UI-Sprachen/320px/axe und
Offline-Reader-Remount bestanden,0 externe Requests/Seitenfehler. VollstÃ¤ndige
Publisher-Eingabe und echte neu vorbereitete Ledger2â€“4 dauerhaft im Paket.
Aktuelle Vorschau: [App43212](http://127.0.0.1:43212/?theme=editorial#home) und
[Website43213](http://127.0.0.1:43213/?theme=editorial&lang=de#home).
Finalbuild294464bd: App70/Website62 Dateien, Websitepaket/Headers verifiziert, Offlinegraph8.257.104 Bytes unter8MiB. Alle vier Originalbilder in beiden Readern dekodiert; finale Browserbelege und Screenshots im RC4-Paketmanifest. Vorschauprozess4984. Laufender automatischer Betrieb, Native und Gesamt-RC bleiben offen.

Vorher bereitgestellt: [App43206](http://127.0.0.1:43206/#home) und
[Website43207](http://127.0.0.1:43207/#home), Paketcommit742e436c.
Themes unter Mehr, kleiner Website-Link im App-Header, schlieÃŸbarer Website-
UnterstÃ¼tzungshinweis ohne Zahlungspflicht; unabhÃ¤ngig PASS nach zwei korrigierten
Dialogfindings. Mobile896/896,Website136/138 vorFix und7/7 betroffene FÃ¤lle nachFix.
Finale Builds62/53 Dateien, Websitepaket samt Headern verifiziert, Offlinegraph
8.251.976 Bytes unter8MiB. Beide finalen Clients im Browser mit neun Sprachen,
320px,Theme-Persistenz,Dialog/Fokus und drei axe-PrÃ¼fungen bestanden;0 externe
Requests/0 Seitenfehler. FÃ¼nf finale Screenshots und alle Buildhashes in
[manifest.json](evidence/WRN-HEADER-SUPPORT-2026-09-13/manifest.json).
Das Medienpaket e3992f70 einschlieÃŸlich seiner sechs Belegbilder bleibt erhalten.
Codex-Ã–ffnungsauftrÃ¤ge sind eingereiht; keine PO-Sichtabnahme behauptet.
Sechs Artikel/vier Bilder und RC3-BesuchsÃ¼bersicht erhalten. Ã„ltere Artefakte
bleiben erhalten; alte Vorschauprozesse wurden nicht erneut bestÃ¤tigt.

Aktuelles natives Artefakt: unsignierte APK2b0d8eb0,7.272.458 Bytes aus83b3b4db,76 exakt geprÃ¼fte Assets/85 Quellpins. EnthÃ¤lt heutige sieben Artikel/vier Bilder, RC2/RC3, Header/Themes/SprachÃ¼bergabe und Sportbedienung.16 JVM-Tests frisch PASS, Lint0 Fehler/13 bekannte Warnungen; unabhÃ¤ngig PASS. Package com.world.revolution,Version2.1.1/code26 unverÃ¤ndert. [Native-Beleg](evidence/WRN-NATIVE-RC-PREPARATION-2026-09-14/REPORT.md). PO-Testfreigabe14.09. ausgefÃ¼hrt: isolierte API36-AVD, Test-APK a723f5c6 installiert; Deutsch, gespeicherter Reader nach Offline-Neustart und echte EFF-Audioverarbeitung/Pause bestanden (4.168.160 Frames/44.100Hz). Sichtbares Emulatorfenster WRN_RC14_Play:5556 geÃ¶ffnet. GerÃ¤t/Upgrade und vollstÃ¤ndiger Native-RC weiter offen. LadeÃ¼berschrift/Copy nachtrÃ¤glich korrigiert,18 Reader-/32 Sprachtests und unabhÃ¤ngiger Review PASS; neue funktionale Vorschauen43216/17 mit sieben Artikeln/Reader bestanden, noch nicht in dieser APK. [Emulatorbericht](evidence/WRN-EMULATOR-TEST-2026-09-14/REPORT.md).

Schreibbesitz: Root integriert alle zurÃ¼ckgegebenen RC2-Pfade. Sol und Terra
haben ihre Pakete vollendet und keine aktiven Schreib-/Prozessrechte.
Der unabhÃ¤ngige Abschlussreview der eingefrorenen28-Pfad-Root-Integration ist
PASS ohne offene Findings; eigene Kandidaten-/Profil-/CSP-Probe1/1 bestanden.
Gemeinsame Gesamtsuiten: Mobile896,Website135+65,Sprachpaket32 bestanden.
InhaltsvertrÃ¤ge469/470 im parallelen Lauf; ein vorhandener V3-Bytegrenzentest
Ã¼berschritt5s und besteht unverÃ¤ndert mit allen8 FÃ¤llen seiner Datei isoliert.
Kein Timeout und kein Orakel abgeschwÃ¤cht. Source-/Providerreview abgeschlossen;
Root-Browser: neun Sprachen, vier axe-PrÃ¼fungen,320px,Offline-Remount und
Clear/Reload bestanden,0 externe Requests. Websitegraph8.243.243 Bytes unter8MiB.
[Register](WRN-G3-021-DELEGATION-REGISTER.md) verbindlich; keine Kinder.
Fokussiert prÃ¼fen, Paket korrigieren bis Abschluss, dann ein unabhÃ¤ngiger Review.
Keine neuen Mikrogates fÃ¼r Beleg-/Testkorrekturen; Gesamtsuite je Paket einmal.

First-Boot implementiert: Pristine benÃ¶tigt generation=0,clearEpoch=0 und den
vollstÃ¤ndig initialen Safety-/Speicherzustand. Auch LÃ¶schen eines leeren Stores
verhindert spÃ¤tere automatische BefÃ¼llung. Source-/Providerpolicy unabhÃ¤ngig
akzeptiert; echte Browser-Decodierung/Pausieren belegt, Native bleibt offen. Medien-Updatequelle null,
Ãœbersetzungsprovider ebenfalls nicht aktiviert. PNPM-Workspace am13.09.
offline/frozen/ignore-scripts mit dem
bereits vorhandenen Store synchronisiert:10 Projekte,351 LockfileeintrÃ¤ge durch
pnpm geprÃ¼ft, Lockfile/Workspace/package unverÃ¤ndert. RegulÃ¤res Mobile-Testskript
13/13 und Toolchaincheck Node24.19.0/pnpm11.19.0 bestanden. Runtime-Binpfade mÃ¼ssen
in der aufrufenden Shell vor dem Ã¤lteren globalen Node24.16.0 stehen. Direkte
Node-Werkzeuge bleiben nutzbar; der separate pnpm-exec-Kurzaufruf hat weiterhin
ein Windows-Befehlssuchproblem. Keine Versions-/Sicherheitsregel abgeschwÃ¤cht.

[Vorheriger vollstÃ¤ndiger Status](history/WRN-PROJECT-STATE-BEFORE-RC-WORKFLOW-2026-09-12.md)
enthÃ¤lt die historischen Belege und Kandidaten.

ÃœbersetzungsprÃ¼fung14.09.: aktive Cloudflare-Version039864f6 mit vier Gemini-/zwei HF-Modellen direkt gesehen; Workers Free bestÃ¤tigt. Google-Projekt Anarchy-News kostenlose Stufe, Flash3.5 20RPD/5RPM, Flash-Lite3.1 500RPD/15RPM; HF0,10USD monatliches Inferenzkontingent. Legacy950/Tag zÃ¤hlt keine tatsÃ¤chlichen Modellversuche. Kein Provideraufruf/Upgrade/Deployment; Nullkosten-Vorgabe verbindlich. [Live-Abgleich](evidence/WRN-TRANSLATION-LIVE-REVIEW-2026-09-14.md).

Fortsetzung14.09.: identische gleichzeitige Ãœbersetzungs-Cache-Misses teilen pro Serviceinstanz einen Providerlauf, bounded32/12s, getrennter Caller-Abbruch und unverÃ¤nderte Readquoten. UnabhÃ¤ngiger Review PASS; final28/28 samt All-Abort/SÃ¤ttigung/Instanztrennung. Kein Provider aktiviert/keine Kosten. [Paket](evidence/WRN-TRANSLATION-COALESCING-2026-09-14/REPORT.md). Emulator nach vollstÃ¤ndigem Android-Boot zwei kalte Appstarts1218/849ms, keine ANR seit Boot; frÃ¼here System-UI-HÃ¤nger aktuell nicht reproduziert, Ursache/finale StabilitÃ¤t weiter offen. [NachprÃ¼fung](evidence/WRN-EMULATOR-TEST-2026-09-14/STABILITY-FOLLOWUP.md).

Android20.09.: Headerrevision f501c403 als unsignierte APK e5f0049c (7.272.870 Bytes) offline gebaut;76/76 Assets,85 Pins,16 frisch ausgefÃ¼hrte JVM-Tests, Lint0 Fehler/13 bekannte Warnungen. UnabhÃ¤ngiger Review PASS nach expliziter Git-Bindung des Buildmanifests. Nicht installiert; Ã¤ltere Emulatorinstallation erhalten. [Nachweis](evidence/WRN-NATIVE-RC-PREPARATION-2026-09-20/REPORT.md). DISC-Filter und lokale Versorgungspipeline in separater Umsetzung; kein Gesamt-RC-PASS.

RC4-VersorgungsbrÃ¼cke20.09.: bestehender Legacy-Append, V3-Publisher und Deliveryvorbereitung in einem lokalen atomaren Run-Bundle verbunden.8 neue/29 kombinierte Tests PASS, unabhÃ¤ngiger Review PASS nach zwei Korrekturen. Kein finaler Output bei Aufnahmefehlern, Altinhalte unverÃ¤ndert, keine Client-Zeiger/LiveverÃ¶ffentlichung. [Paket](evidence/WRN-LEGACY-NEWS-SUPPLY-2026-09-20/REPORT.md). Laufende Quellenaufnahme/Betrieb weiter offen. Cloudflare20.09. fordert erneute Anmeldung; PO asynchron um Anmeldung gebeten, keine Zugangsdaten angefordert.

DISC20.09.: Produktive Suche mit fÃ¼nf Metadatenfiltern, kompaktem details-Bereich/ZÃ¤hler/Reset; keine Filterwirkung auÃŸerhalb Entdecken. UnabhÃ¤ngig PASS; Mobile911, Website148+65 und Typechecks; finale beide Builds/neun Sprachen/drei Themes/Offlinefilter/axe0 bestanden. [App43220](http://127.0.0.1:43220/?theme=violet#discover) / [Website43221](http://127.0.0.1:43221/?theme=violet&lang=de#discover). [Beleg](evidence/WRN-DISCOVER-FILTERS-2026-09-20/REPORT.md). QuellenverzeichnisparitÃ¤t bleibt offen.

Aktuellstes Android-Testartefakt20.09.: Revision8dd580df inklusive kompakter Filter; unsigned SHA404021f8,7.273.626 Bytes,76/76 Assets/85 Pins/16 frische JVM-FÃ¤lle, Lint0 Fehler/13 Warnungen. Exakte kostenlose Testsignierung/separate Emulatorinstallation asynchron angefragt; bisher nicht ausgefÃ¼hrt. Headerkandidat e5f0049c bleibt erhalten. Aktueller Datenfeed0ea03d90 abgerufen:500 DatensÃ¤tze/499 Kandidaten/99 Quellnamen/8 IdentitÃ¤tskonflikte, weiterhin Enrich-Budgetabbruch; Aufnahme eines neuen EFF-Artikels wird vorbereitet, noch nicht aktiviert.

RC4-V520.09.: acht Artikel/vier Bilder lokal aktiv; EFF-Originaltext mit vier korrekt Ã¼bernommenen Autor*innen, keine unbewiesenen neuen Bilder. UnabhÃ¤ngige Quellen-/AdmissionprÃ¼fung PASS; beide Builds/Browser mit9Sprachen/320px/axe0/Offline-Reader bestanden. Frische App43222 und Website43223; Ã¤ltere App-Sitzungen prÃ¼fen weiter gegen die feste Produktionsadresse, dort V5 noch nicht verÃ¶ffentlicht. Native404021f8 enthÃ¤lt weiterhin sieben Artikel, Testfreigabe offen. [Abschluss](evidence/WRN-EIGHT-ARTICLE-ACTIVATION-2026-09-20/REPORT.md). Kein Gesamt-RC-PASS.

Fortsetzung20.09.: Neun kuratierte Sportquellen in Quellen/Sport beider Clients,
Bestandsinhalte erhalten. Mobile914/914, Website148/148 UI; Node14/14 nach
Korrektur veralteter Artikelzahlen. UnabhÃ¤ngiger Review und Browser PASS.
Budget-/Zukunftsdatumwarnungen in Ãœbernahmebelegen; getesteter Altbackend-Patch
noch unverÃ¶ffentlicht. Cloudflare lesend geprÃ¼ft, keine neue Kostenquelle.
[Abschluss](evidence/WRN-SPORT-SOURCES-2026-09-20/REPORT.md).

Fortsetzung 20.09.2026: Browser-Shareadapter, explizite Übersetzungsruntime und
prüfbarer Delivery-Verifier in b39acd6b integriert. 920 Mobiletests, 39 Website-
App-Tests, 39 Übersetzungsdiensttests sowie 7+11 Deliverytests bestanden.
Native Datei 4c215081 (Quelle b39acd6b) unabhängig PASS: 85 Assets, 16 JVM-Tests,
0 Lintfehler; weiterhin unsigniert und nicht installiert.
[Belege](evidence/WRN-SHARE-RUNTIME-2026-09-20/REPORT.md).
Website-Systemteilen schlägt in echten Browserproben fehl; manueller sicher
gebundener Linkfallback ist umgesetzt, unabhängig geprüft und im echten Browser
sichtbar. 20 fokussierte Tests, beide Builds/Typprüfungen PASS. Keine pauschale
Website-Systemshare-Freigabe; die native APK enthält diesen späteren Fallback
noch nicht.
[Regionaltermine](evidence/WRN-REGIONAL-REFRESH-2026-09-20.md) sind abgelaufen;
São-Paulo-Originalquelle nicht erreichbar, deshalb keine fiktive Verlängerung.
[Neue Sportaufnahme](evidence/WRN-SPORT-ARTICLE-ADMISSION-2026-09-20/REPORT.md)
bleibt pending: Zusammenfassung ist kein Volltext und Kalenderdatum keine
belegte Uhrzeit. Die bestehenden Sportquellen und Lesenotizen bleiben erhalten.
Offen: echtes Hosting/Veröffentlichung, konkrete PR38-Mergefreigabe,
Gratisprojekt-/Secret-/Cache-/Quotabindung, konkrete Emulatorinstallation und
finale RC-Gesamtmatrix. Zine, World Revolution Map und Action Radar
bleiben ebenfalls offen. Kein Release-GREEN aus lokalen Teilprüfungen.
