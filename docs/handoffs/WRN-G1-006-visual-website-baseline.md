# Visual Website Handoff – WRN-G1-006

- Agent: `g1_website_visual_reviewer`
- Task-ID: `WRN-G1-006`
- Ergebnis: **YELLOW – Baseline vollstaendig, zwei bestaetigte Medium-Befunde**
- Website-Quellstand: `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`

## Kurzfazit

Die lokale visuelle Website-Baseline ist fuer Smartphone, Tablet und Desktop
erstellt. In 390x844, 800x1280 und 1440x900 wurde kein horizontaler Overflow
beobachtet. Header, Feed, Navigation, Reader, Light/Dark, sehr grosse Schrift
und eine statische Landingpage sind sichtbar dokumentiert.

Zwei Medium-Befunde sind bestaetigt:

1. Escape schliesst den Reader nicht, obwohl der sichtbare Fokus auf dem
   Zurueck-/Schliessenziel liegt.
2. Mehrere mobile Kernaktionen besitzen nur 40 px Hoehe und unterschreiten die
   festgelegten 44x44 CSS-px.

Die Fachrueckgabe meldete zusaetzlich eine Canonical-Divergenz. Der Main Agent
hat diese Aussage herabgestuft: Reader und Landingpage zeigten verschiedene
Artikel-IDs. Das belegt keinen Widerspruch fuer denselben Artikel. Statisch
verwendet die Runtime fuer IDs in der Landingmenge den `/articles/<id>/`-Pfad
und sonst den `?article=<id>`-Fallback. Wegen des inkonsistenten Manifests aus
G1-005 bleibt die ID-/Canonical-Gleichheit ein verpflichtender Vertragstest,
aber kein hier bestaetigter Defekt.

## Setup und Evidenzgrenze

- Website vor und nach Lauf sauber auf `main@9a59b17`.
- Python-Server wegen defekter lokaler Python-Standardbibliothek nicht nutzbar;
  gleichwertiger rein lokaler Node-Static-Server ohne Installation verwendet.
- Server beendet, Port 8080 frei, Browser-Testtab geschlossen.
- Keine Testsuite, Builds, Generatoren, Deployments oder Produktdateien.
- Kein Live-Hosting- oder Apachebeleg: ein einfacher Static-Server bildet
  `.htaccess` nicht ab.

## Screenshotmanifest

Abnahmebelege unter `docs/evidence/WRN-G1-006/`:

| Viewport / Zustand | Datei |
|---|---|
| 390x844 Dark Feed | `WRN-G1-006_9a59b17_390x844_dark-feed_2026-08-21.png` |
| 800x1280 Dark Feed | `WRN-G1-006_9a59b17_800x1280_dark-feed_2026-08-21.png` |
| 1440x900 Dark Desktopfeed | `WRN-G1-006_9a59b17_1440x900_dark-feed-desktop_2026-08-21.png` |
| 390x844 Dark Reader | `WRN-G1-006_9a59b17_390x844_dark-reader_2026-08-21.png` |
| 390x844 Light Feed | `WRN-G1-006_9a59b17_390x844_light-home-feed_2026-08-21.png` |
| 390x844 Light, sehr grosse Schrift | `WRN-G1-006_9a59b17_390x844_light-xlarge-home-reflow_2026-08-21.png` |
| 1440x900 statische Landingpage | `WRN-G1-006_9a59b17_1440x900_static-article-landing_2026-08-21.png` |

Zwei zusaetzliche forensische Laufbelege bleiben erhalten. Ihre Dateinamen
`light-feed` und `light-xlarge-reflow` beschreiben nicht den sichtbaren
Readerzustand, weil Escape den Reader zuvor nicht geschlossen hatte. Sie
gelten nicht als Abnahmebelege und wurden aus Nachvollziehbarkeitsgruenden
nicht geloescht oder umbenannt.

## Beobachtungen

- Bei 390/800/1440 entsprach `scrollWidth` der Clientbreite.
- Mobil bleibt die fuenfteilige Navigation sichtbar; Desktop verwendet eine
  horizontale Navigationsleiste und den breiten Hero-/Artikelaufbau.
- Dark und Light waren visuell lesbar. Ein formaler WCAG-Kontrasttest wurde
  nicht durchgefuehrt.
- Das 200-%-Reflow-Aequivalent ueber die groesste Schrift zeigte keine
  horizontale Ueberbreite; die Navigation blieb erreichbar.
- Der Reader besitzt einen deutlich sichtbaren Zurueckbutton und eine
  fokussierbare Bedienreihenfolge.
- Eine statische Landingpage zeigte vollstaendigen Inhalt, Originalquelle und
  den Button `Interaktiv lesen`.
- Eine unbekannte Artikelroute lieferte im Static-Server nur `Not found`.
  Apache-Redirect/Fallback ist deshalb weiterhin ungetestet.
- Reduced Motion ist statisch vorgesehen; Media-Emulation stand im verwendeten
  Browserlauf nicht zur Verfuegung.

## Accessibility-/Touchbefunde

### Medium – Escape schliesst Reader nicht

- Zustand: Reader auf 390x844; Fokus sichtbar auf `Zurueck`.
- Beobachtung: Escape veraenderte weder Dialogsichtbarkeit noch Fokus.
- Auswirkung: Tastatur-/Dialogvertrag verletzt; sichtbarer Klick-Workaround
  vorhanden.
- G4-Regression: Artikel oeffnen, Escape senden, Reader ist verborgen und der
  Fokus kehrt zum ausloesenden Artikelziel zurueck.

### Medium – mobile Kernziele nur 40 px hoch

Unter anderem `Zum Nachrichtenarchiv`, `Quellen`, `Ausgabe erstellen` und
`Hilfe finden` wurden mit etwa 40 px Hoehe beobachtet. Headerkernaktionen und
Hauptnavigation lagen bei mindestens 44 px.

G4-Regression: alle sichtbaren interaktiven Elemente bei 320/390 px per DOM
vermessen; mindestens 44x44 CSS-px oder eine dokumentierte gleichwertige
Zielzone.

## Canonical-/SEO-Beobachtung – VERIFY, kein bestaetigter Defekt

- Gepruefte statische Landingpage `wrn-101o0me-1bymtda`: Canonical
  `/articles/wrn-101o0me-1bymtda/`.
- Beobachteter Reader verwendete die andere ID `wrn-8dvj16-w4xay5` und einen
  `?article=`-Canonical.
- Deshalb kann aus diesen zwei Laufbelegen kein Same-ID-Widerspruch folgen.
- Statische Codepruefung bestaetigt eine bewusste Mischregel: Pfadcanonical nur
  fuer IDs in der geladenen Landingmenge, sonst Readerfallback.
- Wegen R-27 und des Manifests ohne IDs/Revision bleibt ein Same-ID-Test fuer
  Reader, Landingpage, Sitemap und Canonical vor G2/G4 verpflichtend.

## Konsole und Netzwerk

Keine Console-Errors. 63 Warnungen wurden gruppiert:

- Translation Fetch: 15
- `library-feed.json` 404: 12
- `library-sources.json` 404: 12
- `video-feed.json` 404: 12
- Podcast-Fallback: 6
- Editorial Decisions nicht konfiguriert: 6

Das reproduziert die bekannten Required/Optional-/Remote-Datenrisiken. Im
lokalen Lauf sind diese Warnungen kein Beweis fuer einen Hostingerfehler.

## Paritaetsauswirkung und Folgegates

- UX-03/04/05: aktuelle visuelle Baseline bei 390/800/1440 vorhanden.
- UX-07/SYS-07 bleiben KNOWN-ISSUE wegen Touchzielen und Escape; Reflow selbst
  bestand den beobachteten Smoke.
- WEB-01/03 und R-27 bleiben offen, bis gleiche IDs und Revisionen end-to-end
  nachgewiesen sind.
- SYS-04/MEDIA-05/INFO-02 werden durch die 404-Warnungen erneut bestaetigt.
- Apache-Routing, formaler Kontrast, Reduced Motion, Screenreader und weitere
  Randviewports bleiben fuer G4/G5.

## Geaenderte Dateien und Aktionen

- neun PNGs unter `docs/evidence/WRN-G1-006/`.
- Main Agent: dieser Handoff, Matrix/Register/Projektstatus.
- Keine Produktdatei veraendert; Website-Repository blieb sauber.

## WRN-AGENT-STATUS

- Task: `WRN-G1-006`
- Status: YELLOW
- Quellstand: Website `main@9a59b17`, sauber
- Erledigt: lokale Responsive-, Reader-, Landingpage-, Fokus-, Theme-, Reflow-, Konsolen- und Netzwerkbaseline
- Tests: keine Testsuite; manueller lokaler Browserlauf
- Offen: Escape, 44-px-Ziele, Same-ID-Canonicalvertrag, Apachefallback, formaler Accessibilitytest
- Handoff: `docs/handoffs/WRN-G1-006-visual-website-baseline.md`
- Naechster Schritt: Continuity Audit, danach G1-Abschlussbewertung
- END-CHECK: :)
