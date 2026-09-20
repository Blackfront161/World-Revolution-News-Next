# Visual QA Report – WRN-G1-002

- Task-ID: `WRN-G1-002`
- Referenzcommit: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Runtime-Commit: `968c320adfe87d1e11e88f99f448a435d4242750`
- Datum: 21. August 2026
- Pruefer/Agent: `visual_accessibility_reviewer`; Stichprobe durch Main Agent
- Produkt: aktuelle WRN-App
- Ergebnis: **YELLOW – Baseline verwendbar, offene Medium-Befunde**

## Kurzfazit

Die aktuelle App besitzt eine klare, wiedererkennbare Solinaridao-/WRN-Marke,
ein belastbares responsives Grundverhalten und gut erkennbare mobile
Hauptnavigation. Feed, Artikel, Medien- und Hilfeeinstieg konnten ohne
Produktveraenderung aufgenommen werden. Die spaetere Migration soll diese
Nutzerwirkung erhalten, nicht die monolithische Implementierung kopieren.

Vier Punkte benoetigen getrennte Folgepruefung: Ueberlagerung der mobilen
Navigation bei 200 Prozent Schriftgroesse, einzelne zu kleine Touchziele,
fehlendes Escape-Schliessen des Artikeldialogs und ungeklaertes Resetverhalten
der Suche. Keiner dieser Befunde berechtigt in G1 bereits zu einer
Produktkorrektur.

## Verifizierter Quellstand und Umgebung

- Legacy-Quelle:
  `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
- Branch `main`, HEAD `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Arbeitsbaum vor und nach der Aufnahme sauber
- Lokaler, nicht oeffentlicher Static Server auf `127.0.0.1:4173`
- kontrollierter In-App-Browser; keine Anmeldung, Formulareinsendung oder
  Geraeteberechtigung
- keine Builds, Tests, Installationen, Service-Worker-Manipulation oder
  Produktdateiaenderungen

Die Browser-Overrides wurden mit den verlangten Abmessungen gesetzt. Die
gespeicherten PNG-Raster sind durch Browser-Scrollbar-/Contentflaechen teilweise
kleiner; deshalb dokumentiert die folgende Matrix sowohl Test- als auch
Artefaktgroesse.

## Viewport- und Flowmatrix

| Browser-Override | PNG/Beleg | Beobachtung | Ergebnis |
|---:|---:|---|---|
| 320 × 568 | kein eigener PNG-Pflichtbeleg | mobiler Feed und Bottom-Navigation; kein horizontaler Hauptseiten-Overflow | PASS als Reflow-Stichprobe |
| 390 × 844 | 375 × 812 | Feed, Artikel, Suche, Theme und 200-%-Schrift | PASS mit Medium-Befunden |
| 600 × 960 | 585 × 936 | einspaltiges Tablet-Hochformat; Feedkarte und Navigation stabil | PASS |
| 1024 × 800 | kein eigener PNG-Pflichtbeleg | breiteres App-Layout; kein horizontaler Hauptseiten-Overflow | PASS als Reflow-Stichprobe |
| 1440 × 900 | 1404 × 891 | zweispaltiges Hero, horizontale obere Navigation | PASS, nur Desktopbeobachtung |

Der Main Agent bestaetigte fuer 390 × 844 ein `window.innerWidth/innerHeight`
von 390 × 844. Das Dokument- und Visual-Viewport war wegen der sichtbaren
Scrollflaeche 375 CSS-Pixel breit.

## Screenshotindex

| Beleg | Zustand | SHA-256 |
|---|---|---|
| `docs/evidence/WRN-G1-002/app-390x844-feed.png` | dunkler mobiler Feed | `14BCE9587EA2AB4793A12870CAEB094743776821219E8C61B5E18E8475A7F113` |
| `docs/evidence/WRN-G1-002/app-600x960-feed.png` | Tablet-Hochformat | `9630435F7EF02DE3467A331F857454D3AFB95903EF94A3250DE332633D47A439` |
| `docs/evidence/WRN-G1-002/app-1440x900-feed.png` | Desktopbeobachtung | `B3B59BAE8380E71CE76F459AC763449CB595CD18C750EAD42766F952140C9A43` |
| `docs/evidence/WRN-G1-002/app-390x844-article-detail.png` | Artikeldialog und Aktionsleiste | `068A9166A23DCE409BEEF5E552CACB8E3F12E794470B69D322EE312CD4B78EE2` |
| `docs/evidence/WRN-G1-002/app-390x844-light-200pct.png` | helles Theme bei 200-%-Schrift | `6960FF4FEC1AC7D2BFE6C18F43F1E01E8A10B6BDBAFACD97123B8B24D0A02B82` |

## Merkmale fuer die spaetere Migration

### ERHALTEN

- sichtbare Solinaridao-/WRN-Marke und die dunkle cyan-/pinkfarbene
  Bildsprache;
- klarer Newsfeed mit Bild, Quelle, Datum, Tags und eindeutiger Hauptaktion;
- mobile Bottom-Navigation mit aktivem Zustand und auf breiten Screens eine
  horizontale obere Navigation;
- Artikel als semantischer Dialog mit Titel, Quelle/Original-Link,
  Lesefortschritt, Aktionsleiste und sichtbarem Zurueckweg;
- Fokus kehrt nach dem funktionierenden Zurueck-Button zum ausloesenden
  `Beitrag oeffnen` zurueck;
- semantische Medientabs und bewusstes Laden des Video-Players erst nach Klick;
- `Hilfe finden` mit zehn Angeboten, Filtern sowie sichtbaren Privacy- und
  Notrufgrenzen; kein Standort und keine personenbezogene Eingabe wurden
  angefordert.

### PLATTFORMSPEZIFISCH

- Das App-Layout auf 1440 Pixel nutzt ein zweispaltiges Hero und eine obere
  Navigation. Es ist ein Beobachtungsbeleg, aber keine automatische
  Zielreferenz fuer die gemeinsame Website.
- Die Artikeldialog-Aktionsleiste scrollt horizontal: bei 390 Pixel besitzt sie
  375 Pixel sichtbare Breite und 651 Pixel Inhaltsbreite. Dies ist kein
  Hauptseiten-Overflow, muss in der Ziel-UX aber sichtbar beziehungsweise gut
  entdeckbar bleiben.

### OPTIMIEREN / FACHLICH KLAEREN

- Die Header-Suche fuehrt in die Entdecken-/Filteransicht. Leeren plus Enter
  setzte den sichtbaren Suchwert in der Aufnahme nicht eindeutig zurueck; ein
  expliziter Reset wurde nicht gefunden. Erwartetes Verhalten vor Umsetzung
  festlegen.
- Der aktuelle Feed ist dynamisch und wechselte waehrend der Aufnahme auf
  Inhalte vom 21. August. Die Screenshots sind stabile Layoutbelege, aber kein
  eingefrorener Content-Datensatz. Visuelle Regressionstests benoetigen spaeter
  deterministische Fixtures.

### DEFEKTVERDACHT – MEDIUM

1. Bei 390 Pixel und `200 %` ueberlappen die Beschriftungen `Entdecken` und
   `Gespeichert` ihre Bottom-Navigationselemente. Gemessene Textbreiten von
   circa 88 beziehungsweise 101 Pixel uebersteigen die je circa 73 Pixel
   breiten Bereiche.
2. Sichtbare Quellenprofil-Buttons messen teilweise nur circa 28 Pixel Hoehe;
   `Spaeter lesen` circa 40 × 44 Pixel. Die 44 × 44-CSS-Pixel-Regel wird damit
   nicht durchgaengig erfuellt.
3. `Escape` schloss den offenen nativen Artikeldialog weder beim Fachreview
   noch bei der unabhaengigen Main-Stichprobe. Der sichtbare Zurueck-Button
   funktionierte. Das Zielsystem muss Dialog-Escape und Fokusmanagement
   explizit testen.

## Konsole und Requests

Im untersuchten Ablauf erschienen keine Konsolenmeldungen der Stufe `error`,
aber wiederholte Warnungen und Fallbackketten:

- sieben fehlgeschlagene automatische Briefing-Uebersetzungen;
- sechs Fallbacks fuer die erzeugte Podcastbibliothek;
- 404-Fallbacks fuer `video-feed`/`video-health`,
  `library-feed`/`library-sources`, `editorial-decisions` und
  `news-archive-manifest` ueber Raw GitHub beziehungsweise GitHub Pages.

Die Anzahl 55 enthaelt Wiederholungen durch mehrere Reloads und ist keine Zahl
einzigartiger Defekte. Diese Beobachtungen bestaetigen die bereits bekannten
Risiken R-05 sowie MEDIA-05/SYS-03; die Backend-Baseline muss die einzelnen
Vertraege und ihre beabsichtigte Optionalitaet klaeren.

## Nicht vollstaendig beobachtet

- Intro/Onboarding erschien in der Testsession nicht.
- Vollstaendige Tastaturreihenfolge und Screenreader-Smoke bleiben offen; ein
  sichtbarer cyanfarbener Fokusstil war vorhanden.
- Kein echter Android-WebView-, Emulator- oder Geraetetest.
- Kein absichtlich erzeugter Offline-, Slow-Network-, Leer- oder Fehlerzustand.
- Kein Player, externer Original-Link, Standort- oder Benachrichtigungspfad
  wurde aktiviert.

## Geaenderte Dateien

Nur die fuenf PNG-Belege unter `docs/evidence/WRN-G1-002/` wurden neu angelegt.
Der Fachagent veraenderte den vorbereiteten Handoff und alle Produktdateien
nicht. Dieser Bericht wurde anschliessend vom Main Agent vervollstaendigt.

## Empfohlener naechster Schritt

Continuity Audit auf Task, Bericht und PNG-Belege. Danach G1-Backend/Privacy
getrennt inventarisieren. Die drei Medium-Befunde werden als spaetere
Paritaets-/QA-Anforderungen gefuehrt, nicht im Altbestand behoben.

## WRN-AGENT-STATUS

- Task: `WRN-G1-002`
- Status: YELLOW
- Quellstand: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Erledigt: Pflichtviewports, Kernflows, fuenf Screenshots und Konsolenbelege
- Tests: kontrollierte Browseraufnahme; keine Builds oder automatisierten Produkttests
- Offen: Onboarding, Tastatur/Screenreader, Search Reset, Offline und drei Medium-Befunde
- Handoff: `docs/handoffs/WRN-G1-002-visual-app-baseline.md`
- Naechster Schritt: Continuity Audit
- END-CHECK: :)
