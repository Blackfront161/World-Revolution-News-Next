# SPORT-01: Einzelrechte und Bildzuordnung · 26.09.2026

Status: Einzelrechte-Recherche und lokaler Originalbild-Kandidat;
**kein SPORT-01-Abschluss**. Der V7-Kandidat verändert die lokal gebündelten
Produktdaten, ist aber weder unabhängig freigegeben noch extern veröffentlicht.

Die drei Sportnotizen im Verzeichnis sind nach
`mobile-content-directory-v1.ts` ausdrücklich `metadata-and-links` und besitzen
kein Bildfeld. Ein URL-Bild in der Karte würde zudem beim Anzeigen eine neue
Verbindung zu einem Drittanbieter auslösen und offline fehlen. Der bestehende
V3-Reader nimmt Bilder dagegen nur als einzeln geprüfte, größenbegrenzte,
hashgebundene und lokal ausgelieferte Blöcke auf. Deshalb darf ein Commons-Foto
nicht stillschweigend als Originalbild eines verlinkten Artikels erscheinen.

| Einsatzmöglichkeit | Einzelbeleg | Grenze |
| --- | --- | --- |
| Algerische Fankultur, ausdrücklich als Archivillustration | [„Ultras USM Alger“](https://commons.wikimedia.org/wiki/File:Ultras_USM_Alger.jpg), Mickael Denet, 16.08.2011, CC BY-SA 3.0. Das Foto zeigt USM-Alger-Fans bei einem Freundschaftsspiel gegen US Créteil und passt thematisch zur [AIAC-Notiz über algerische Tribünen](https://africasacountry.com/2026/06/the-politics-of-the-football-terrace). Der lokale Kandidat ist 582 × 346 px, 81.612 Byte, SHA-256 `cb9f14e4dd41ddb5e77f8f9cad13a389ad908627f3022369b8f28f8d529ad1ba`. | Aufnahmequalität gering; es zeigt **nicht** den im AIAC-Artikel beschriebenen Stadionbesuch. Nur mit sichtbarem Archivbild-Hinweis verwenden. |
| Kontext zum WM-Kommentar, ausdrücklich als Illustration | [Azteca-Stadion bei der Eröffnung 2026](https://commons.wikimedia.org/wiki/File:The_field_at_Azteca_Stadium_in_Mexico_City_during_the_opening_ceremony_of_the_2026_World_Cup.jpg), Omar David Sandoval Sida, CC BY-SA 4.0. | Original 16,42 MB; vor Aufnahme wäre eine dokumentierte, überprüfte Ableitung unter dem V3-Limit von 256 KiB erforderlich. Kein Foto der im Kommentar genannten Personen oder Fälle. |
| Antifaschistische Fußball-Fankultur | [„Anti-Fascist March“](https://commons.wikimedia.org/wiki/File:Anti-Fascist_March.jpg), Felipe Tofani, CC BY-SA 2.0; laut Dateibeschreibung FC-St.-Pauli-Fans in Potsdam 2016. | Nur mit einer passenden, eigenständig geprüften Fankultur-Meldung verwenden, nicht zur Bebilderung der Algerien- oder FIFA-Kommentare. |
| Afrikanische Fußball-Fankultur, ausdrücklich als Archivillustration | [„Nigerian fans in Russia“](https://commons.wikimedia.org/wiki/File:Nigerian_fans_in_Russia.jpg), Кирилл Венедиктов, 26.06.2018, CC BY-SA 3.0 mit Wikimedia-VRT-Beleg. Die von Wikimedia erzeugte 330 × 220-px-Vorschau hat 44.614 Byte und SHA-256 `66e3363b352d24980563a930cc651de0854d17eb79621e66e94576dd3551265e`; sie liegt unter dem V3-Limit. Sie wäre thematisch eine Illustration für den [AIAC-Beitrag über afrikanische Fußballfans](https://africasacountry.com/2026/06/the-indelible-african-superfan). | Das Foto zeigt Nigeria-Fans beim WM-Spiel gegen Argentinien 2018, nicht die im Beitrag beschriebenen Personen. Der V3-Vertrag lässt eine getrennte Archivillustration nicht zu; aufgenommen wurde stattdessen das einzeln belegte Originalfoto. |
| Originalbild des AIAC-Beitrags über afrikanische Fans | [Jonathan Shemberes Pexels-Foto](https://www.pexels.com/photo/nigerian-fan-with-face-paint-celebrating-29804183/) wurde mit der im [Verlagsbeitrag](https://africasacountry.com/2026/06/the-indelible-african-superfan) gezeigten Aufnahme visuell abgeglichen. Die [Pexels-Lizenz](https://www.pexels.com/license/) erlaubt App-/Website-Nutzung. Die Pexels-Variante ist 600 × 900 px, 67.344 Byte, SHA-256 `c44461a119bbf0db2ac7c357b70b5bd62126e19d012a121f9d7759e237c713ce`. | Als erstes Sport-Originalfoto im [lokalen V7-Kandidaten](../WRN-SPORT-SUPERFAN-2026-09-26/REPORT.md) aufgenommen; unabhängiger Rechte-/Inhaltsreview und finale RC-Prüfung offen. |

Der auf dem [AIAC-Sportkommentar](https://africasacountry.com/2026/07/is-football-still-capable-of-scandal)
angezeigte Fred-Murphy-Fotobeleg enthält keine nachgewiesene Einzel-Lizenz.
Die [allgemeine CC-BY-4.0-Erklärung des Verlags](https://africasacountry.com/about)
reicht dafür nicht aus; die bestehende Aufnahme schließt dieses Foto zu Recht
aus. Dasselbe gilt für das Fethi-Sahraoui-Bild auf der Tribünen-Seite.

Die Tribünen-Seite enthält außerdem vier hervorgehobene Fremdzitate, darunter
Lied- und Buchtext. Ein technisch gültiger lokaler V7-Build mit diesem Volltext
ist **keine** redaktionelle Rechtefreigabe. Der getrennte
[Superfan-Kandidat](../WRN-SPORT-SUPERFAN-2026-09-26/REPORT.md) nutzt deshalb
die Aufnahme des originalen Artikelfotos mit Einzelbeleg statt einer
Wikimedia-Archivillustration. Der V3-Vertrag bindet jedes Bild an den
Quellartikel-Snapshot; er erlaubt eine unabhängige Illustration nicht ohne
bewusste Vertragsänderung. Keine Commons-Illustration wurde aufgenommen.

Nächster Produktschritt: Eine passende, klar als Illustration bezeichnete
Bildquelle pro tatsächlich angezeigter Sportkarte einzeln prüfen, lokal binden,
Attribution und Lizenz am Bild sichtbar ausgeben und App/Website sowie Offline-
und Reflow-Verhalten testen. Die bisherige 1+2-Anzeige ist damit noch nicht
vollständig bildgestützt.
