# Product Charter – World Revolution News / Solinaridao

Status: Baseline fuer Phase 0

Datum: 21. August 2026

Freigabe: Vor Implementierungsbeginn durch den Product Owner zu bestaetigen

## 1. Produktvision

World Revolution News ist eine unabhaengige, mehrsprachige News-, Wissens- und
Multimediaplattform fuer soziale Bewegungen, Arbeitskaempfe, Antifaschismus,
Antirassismus, Feminismus, Queerpolitik, Oekologie,
Gefangenensolidaritaet und libertaire Perspektiven.

Mobile App und responsive Website bilden gemeinsam die Marke Solinaridao. Sie
sollen sich wie ein zusammengehoeriges Produkt anfuehlen, ohne ihre technisch
unterschiedlichen Release-, Cache- und Plattformanforderungen zu vermischen.

## 2. Product Owner und Arbeitsmodell

### Präzisierung der Inhaltsversorgung und zusätzliche Gestaltungsidee

Der PO bekräftigt: Grundlage bleibt die Inhaltsversorgung der alten Live-App.
Vorhandene Dienste, Quellen und Inhalte werden übernommen und besser organisiert;
die bereits vereinbarten Ergänzungen und zusätzlichen Quellen kommen hinzu.
Die laufende Anbindung ist noch offen; die sechs aufgenommenen Artikel sind ein
geprüfter Teilbestand, nicht der vorgesehene Endumfang. Die bestehenden Verträge
für Herkunft, Rechte, Aktualität und begrenzte Auslieferung bleiben erhalten.

Die Bildvorlage „ChatGPT Image 13. Sept. 2026, 19_55_31.png“ wurde als alternative
Gestaltungsidee eingebracht. Root-Vorschlag zur Diskussion: zusätzliche wählbare
Schwarz/Rot-Magazinansicht mit Serifentiteln, großem Aufmacher und kompakten
Bildkarten auf denselben Funktionen und Daten. Violett/Rot bleibt Standard,
Rot/Cyan bleibt wählbar; rote Ränder und rote Auswahlfüllung bleiben verbindlich.
Alle vereinbarten Bereiche bleiben erreichbar, einschließlich Für mich, Medien,
Sport, Termine, Bibliothek/Lexikon und Hilfe/Solidarität. Abgebildete Texte,
Quellennamen und Bilder sind keine Inhaltsaufnahme oder Quellenfreigabe.
PO092 bleibt unverändert. Noch kein Implementierungsauftrag für diese Ansicht.

### Bedienung und freiwillige Unterstützung

Weitere direkte PO-Entscheidung: Die Theme-Auswahl wird in beiden Clients unter
„Mehr“ organisiert. Ein kleiner Website-Link gehört in den App-Header. Die Website
begrüßt mit einem einfach schließbaren Hinweis auf kostenlose Nutzung, freiwillige
Finanzierung der Betriebskosten und Unterstützung unabhängiger Quellen. Kein
Zahlungszwang und keine Beschränkung kostenloser Inhalte. Umsetzung und Tests:
[Header-/Unterstützungspaket](evidence/WRN-HEADER-SUPPORT-2026-09-13/REPORT.md).

### Ergänzter Zielgruppenrahmen des Product Owners

Direkte Ergänzung vom 13. September 2026; ergänzt die historische Baseline.
Die bestehende RC-MUST-Matrix und sämtliche vereinbarten Erweiterungen bleiben
verbindlich. Dies ist eine Zielgruppenpräzisierung, kein neuer Funktionsauftrag.

Ausdrücklich genannt sind:

- anarchistische, dem Anarchismus nahestehende und libertär kommunistische Menschen;
- Studierende, belesene Menschen, Intellektuelle und Interessierte;
- Jugendliche, Punks und Menschen aus Subkulturen;
- linke Fußball-Ultras, linksaktivistische und weitere linke Menschen;
- feministische, queere und weltoffene Menschen;
- Cyberpunks, Solarpunks und Nerds.

Die Gruppen überschneiden sich; Bildung, Alter oder Szenezugehörigkeit sind keine
Zugangsvoraussetzungen. Der Rahmen dient der redaktionellen Themenauswahl und
verständlichen Ansprache, nicht der automatischen Zuordnung einzelner Nutzender.
Zugängliche Einstiege und vertiefende Originaltexte sollen nebeneinander Platz
haben. Politische Nähe einer Quelle wird weiterhin nur mit Belegen beschrieben.

Zusätzliche Gruppen, **vom Product Owner mit „ja das sind gute ergänzungen“ bestätigt**:
Gewerkschaftsaktive und Menschen in Arbeitskämpfen; Mieterinitiativen und
Nachbarschafts-/Selbsthilfekollektive; antirassistische, migrantische und
diasporische Initiativen; Klima-/Ökologiebewegte; Menschen aus Behindertenrechts-
und Barrierefreiheitsinitiativen; freie Kultur-, DIY-, Hacker-, Datenschutz-
und Commons-Communities. Diese bestätigten Ergänzungen erweitern den Zielgruppenrahmen und
begründen weder neue Produktfunktionen noch Änderungen an Frontend oder Backend.

Der Product Owner entwickelt durch Delegation an KI-Agenten. Er schreibt und
liest Produktcode nicht als primaeren Kontrollweg. Deshalb muessen Entscheidungen
und Abnahmen ueber folgende Belege moeglich sein:

- klare Funktionsbeschreibungen ohne unnoetigen Fachjargon;
- automatische Tests mit eindeutigem Pass/Fail;
- Screenshots und visuelle Vorher-/Nachher-Vergleiche;
- kurze Risiko-, Kosten- und Auswirkungsberichte;
- reproduzierbare Builds und dokumentierte Rollbacks.

## 3. Erstes Produktziel: Migration Release 1

Das erste neue Release erreicht funktionale und visuelle Paritaet mit den
freigegebenen aktuellen Oberflaechen, beseitigt strukturelle Backend- und
Datenprobleme und bereitet eine stabile Google-Play-Veroeffentlichung vor.

### Muss-Ziele

1. Die Android-App entspricht in Markenwirkung, Navigation und Kernfunktionen
   weitgehend dem aktuellen App-Frontend.
2. Bestehende, vom Product Owner gewuenschte Funktionen bleiben erhalten.
3. Kleine UI-Optimierungen sind nur nach dokumentierter Abnahme zulaessig.
4. Die Website funktioniert responsiv auf Smartphone, Tablet und Desktop und
   verwendet dieselbe Marken- und Designgrundlage.
5. App und Website beziehen Inhalte ueber versionierte, nachvollziehbare
   Datenvertraege.
6. Bekannte 404-, Fallback-, Cache-, Offline-, Uebersetzungs-, Synchronisations-
   und Backendprobleme werden analysiert und priorisiert behoben.
7. Sicherheits-, Datenschutz-, Barrierefreiheits- und Kostenregeln sind
   testbar und Bestandteil der Abnahme.
8. Android-Build, Signierprozess und Google-Play-Uebergabe sind reproduzierbar;
   Signierung und Upload erfolgen nur nach gesonderter Freigabe.

### Erwarteter Kernumfang

- mehrsprachige News mit Suche sowie Themen-, Regionen-, Quellen-, Sprach- und
  Formatfiltern;
- Artikelansicht, Quellen- und Herkunftsangaben, Speichern, Teilen und
  nutzergesteuerte Uebersetzung;
- Tageslage, Briefings, Dossiers und Nachrichtenarchiv;
- Podcasts, freie Radios, Audio, Video und kontrollierter Medienabruf;
- Termine, Bibliothek, Bewegungslexikon sowie Zine-/Druckwerkzeuge;
- Gefangenensolidaritaet und „Hilfe finden“ mit geprueften Profilen,
  Zustandsgrenzen und Offline-Paketen;
- Themes, Schriftgroessen, Tastaturbedienung und weitere Accessibility-Funktionen;
- Offline-App-Shell, lokale Einstellungen und belastbare Fallbacks;
- Website-spezifische SEO-Landingpages, Sitemap und teilbare stabile URLs;
- Android-spezifische Geraetebruecken, Teilen, Benachrichtigungen und gepruefte
  Play-In-App-Update-Logik.

Der genaue verbindliche Umfang wird in der Feature-Paritaetsmatrix nach
Baseline-Analyse pro Zeile bestaetigt.

## 4. Nicht-Ziele des ersten Releases

- Entwicklung oder Integration des World-Revolution-Map-Spiels
- Entwicklung des historischen Kartenspiels
- vollstaendige Neugestaltung des bestehenden Frontends
- neue soziale Funktionen wie Kommentare, Popularitaetsranking oder Tracking
- serverseitige Standortverfolgung fuer „Hilfe finden“
- unkontrollierter Plattformwechsel oder Austausch bewaehrter Funktionen
- Zusammenkopieren von App- und Website-Legacydateien
- Migration ohne nachvollziehbaren Daten-, Test- und Rollbackplan

## 5. Zukunftsfaehigkeit ohne Scope-Ausweitung

Fuer World Revolution Map und spaetere Spiele werden jetzt nur Schnittstellen
vorgesehen:

- stabile IDs fuer Artikel, Ereignisse, Orte, Personen, Organisationen und Themen;
- versionierte Geo-, Zeit- und Quellenmetadaten;
- Deep Links zwischen News, Karte und spaeteren Spielmodulen;
- gemeinsame Medien- und Provenienzvertraege;
- barrierefreie Listen-/Textalternative zu jeder Kartenfunktion;
- getrennte Versionierung und ein ausdrueckliches spaeteres Integrationsgate.

## 6. Erfolgsdefinition

Migration Release 1 ist erfolgreich, wenn:

- der Product Owner die wichtigsten App- und Website-Flows visuell freigibt;
- alle als `MUST` klassifizierten Paritaetszeilen bestanden sind;
- keine kritischen oder hohen bekannten Defekte offen sind;
- Offline-, Netzwerkfehler-, Cache- und Upgrade-Szenarien bestehen;
- Datenschutz- und Security-Review keine Releaseblocker finden;
- App und Website getrennt reproduzierbar gebaut und zurueckgerollt werden koennen;
- ein Android Release Candidate auf der geforderten API-Stufe besteht;
- AAB, Commit, Versionsdaten, Tests und Hashes eindeutig zusammengehoeren;
- die Play-Console-Uebergabe erst nach ausdruecklicher Freigabe erfolgt.

## 7. Bekannte Baseline

### App

- Quelle: `wrn-github-app-current`
- Gesamt-HEAD: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Runtime-Releasecommit: `968c320adfe87d1e11e88f99f448a435d4242750`
- Version: 2.1.1
- Versionscode: 26
- Paket: `com.world.revolution`
- Android: minSdk 24, targetSdk 36
- signierter Kandidat vorhanden, aber nicht hochgeladen

### Website

- Quelle: `wrn-web-portal-2026-08-20-r10n-work`
- HEAD: `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Produktionsstand: r10n vom 20. August 2026
- Hosting-Baseline: statisches Apache-/Hostinger-Paket
- bekannte optionale Feed-404/Fallback-Warnungen muessen neu bewertet werden

## 8. Entscheidungsrechte

Nur der Product Owner entscheidet ueber:

- sichtbare Abweichungen vom aktuellen Frontend;
- Streichung oder wesentliche Veraenderung bestehender Funktionen;
- Zielarchitektur nach dem Architekturreview;
- Nutzung kostenpflichtiger externer APIs;
- produktive Deployments, Signierung und Play-Store-Upload;
- Beginn der Map-/Spielintegration.

Der Chief AI Architect darf technische Optionen bewerten und eine Empfehlung
aussprechen, aber diese Entscheidungen nicht stillschweigend vorwegnehmen.
