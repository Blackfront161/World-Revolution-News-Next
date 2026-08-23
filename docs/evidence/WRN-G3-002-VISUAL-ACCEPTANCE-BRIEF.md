# WRN-G3-002 – gefuehrte visuelle Abnahme

Stand: 23. August 2026
Status: **VORBEREITET – NEUE PRODUKTSCREENSHOTS EXISTIEREN NOCH NICHT**

## Warum dieser Bogen existiert

Die Screenshots der technischen G3-001-Foundation zeigten nur ein neutrales
Grundgeruest. Daraus konnte keine Produkt- oder Designparitaet abgenommen
werden. Bei WRN-G3-002 wird die Pruefung deshalb als beschrifteter
Alt-vs.-Neu-Vergleich aufgebaut. Der Product Owner muss weder Code lesen noch
technische Buildmeldungen interpretieren.

## Was in diesem Slice sichtbar beurteilt wird

- Ist die Richtung als World Revolution News / Solinaridao wiedererkennbar,
  obwohl echte Markenassets noch nicht importiert sind?
- Ist die Reihenfolge Titel, erster Satz, Quelle, Datum, Sprache und Tags
  sofort verstaendlich?
- Fuehlt sich der Mobilefeed wie eine App und der Websitefeed wie eine
  responsive Website an?
- Bleibt alles auf Smartphone, Tablet, Desktop, in Dark/Light und bei sehr
  grosser Schrift lesbar?
- Sind Lade-, Leer-, Fehler-, Offline- und bewusst-fehlt-Zustaende ehrlich und
  klar voneinander unterscheidbar?

## Was noch nicht beurteilt wird

- finale Logos, Bilder oder die Ersatzschrift fuer Qood;
- echte Nachrichten oder Liveaktualisierung;
- Suche, Filter, Artikelreader, Share, Archiv, SEO oder Offlinecache;
- Multimedia, Uebersetzung, Hilfe, Map oder Kartenspiel;
- Android-AAB, Google Play, Website-Deployment oder produktive Dienste.

Eine gute Abnahme dieses Slices bedeutet daher nicht, dass die ganze App
fertig oder visuell final ist.

## Unveraenderte Alt-Referenzen

### Aktuelle App

| Ansicht | Referenzbild |
|---|---|
| Smartphone, Dark Feed | `docs/evidence/WRN-G1-002/app-390x844-feed.png` |
| Tablet, Dark Feed | `docs/evidence/WRN-G1-002/app-600x960-feed.png` |
| breite Beobachtung | `docs/evidence/WRN-G1-002/app-1440x900-feed.png` |
| Smartphone, Light und sehr grosse Schrift | `docs/evidence/WRN-G1-002/app-390x844-light-200pct.png` |

### Aktuelle Website

| Ansicht | Referenzbild |
|---|---|
| Smartphone, Dark Feed | `docs/evidence/WRN-G1-006/WRN-G1-006_9a59b17_390x844_dark-feed_2026-08-21.png` |
| Tablet, Dark Feed | `docs/evidence/WRN-G1-006/WRN-G1-006_9a59b17_800x1280_dark-feed_2026-08-21.png` |
| Desktop, Dark Feed | `docs/evidence/WRN-G1-006/WRN-G1-006_9a59b17_1440x900_dark-feed-desktop_2026-08-21.png` |
| Smartphone, Light Feed | `docs/evidence/WRN-G1-006/WRN-G1-006_9a59b17_390x844_light-home-feed_2026-08-21.png` |
| Smartphone, Light und sehr grosse Schrift | `docs/evidence/WRN-G1-006/WRN-G1-006_9a59b17_390x844_light-xlarge-home-reflow_2026-08-21.png` |

Diese Dateien werden nicht veraendert oder neu als Ziel ausgegeben. Sie zeigen
die zu erhaltende Produkthierarchie und bekannte Fehler, nicht automatisch jede
Pixelentscheidung der neuen Architektur.

## Spaeter zu erzeugende Vergleichstafeln

| Tafel | Links | Rechts | Prueffrage |
|---|---|---|---|
| A – Mobile Smartphone | aktuelle App 390x844 Dark | neuer Mobilefeed 390x844 Dark | Wirkt der Feed vertraut, klar und appgerecht? |
| B – Mobile Reflow | aktuelle App 390x844 Light/200 % | neuer Mobilefeed Light/200 % | Bleibt alles lesbar, ohne die bekannte Nav-Ueberlappung? |
| C – Website Smartphone | aktuelle Website 390x844 Dark/Light | neue Website 390x844 Dark/Light | Bleibt die gemeinsame Marke erkennbar und die Website mobil gut nutzbar? |
| D – Website Tablet/Desktop | aktuelle Website 800x1280 und 1440x900 | neue Website in denselben Viewports | Verdichtet sich das Raster sinnvoll, ohne App und Website gleichzuschalten? |
| E – Zustaende | kein Alt-Paritaetsversprechen | beide neuen Clients mit Loading/Leer/Fehler/Offline/Optional-absent | Ist jeder Zustand klar, ruhig und ehrlich erklaert? |

Jede Tafel traegt gut sichtbar `AKTUELLE LIVE-BASIS – NUR REFERENZ` oder
`NEUER LOKALER KANDIDAT – NICHT LIVE`, ausserdem Kandidatencommit,
Fixture-Revision, Viewport, Theme und Zustand.

## Die fuenf Fragen an den Product Owner

Nach Vorlage der Tafeln beantwortet der Product Owner nur diese Fragen:

1. Erkenne ich die gewuenschte WRN-/Solinaridao-Produktrichtung wieder?
2. Verstehe ich auf jeder Karte Titel, ersten Satz, Quelle, Datum, Sprache und
   Tags ohne Erklaerung?
3. Wirkt der Mobilefeed wie die bestehende App, mit sinnvollen kleinen
   Verbesserungen statt wie ein fremdes Neudesign?
4. Wirkt die Website auf Smartphone, Tablet und Desktop als dieselbe Marke,
   aber passend zum jeweiligen Bildschirm?
5. Welche sichtbare Abweichung soll vor dem naechsten Slice geaendert werden?

## Einfache Rueckmeldung

Wenn alles passt:

```text
G3-002 VISUELL AKZEPTIERT
```

Wenn etwas geaendert werden soll:

```text
G3-002 AENDERUNG: <kurze Beschreibung, zum Beispiel "Karten auf dem Handy zu dicht">
```

Diese Rueckmeldung erfolgt erst, nachdem die neuen Tafeln wirklich vorliegen.
Das aktuelle Dokument selbst ist keine visuelle Freigabe.
