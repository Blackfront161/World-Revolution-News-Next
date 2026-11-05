# Sportvolltext mit Originalbild · lokaler V7-Kandidat · 26.09.2026

Status: in Arbeit. **Kein SPORT-01-Abschluss und keine Live-Freigabe.** Der
lokale Releasezeiger beider Clients steht auf `wrn-production-news-2026-09-26-v7`;
V6 bleibt als unveränderlicher Rückfallstand vorhanden. Kein Push, Hosttransfer,
Cloudflare-Aufruf, Signieren oder Play-Schritt erfolgte.

Der [Originalbeitrag](https://africasacountry.com/2026/06/the-indelible-african-superfan)
von Giovanni Wanneh erschien laut Verlagsseite am 30.06.2026. Seine 20
Prosaabsätze wurden in Quellenreihenfolge aufgenommen. `00:00 UTC` ist nur der
offengelegte Sortierschlüssel, keine behauptete Veröffentlichungsuhrzeit. Der
Verlag nennt für eigene Inhalte [CC BY 4.0](https://africasacountry.com/about),
sofern nichts anderes angegeben ist. Im Text bleiben Interviews und Wertungen
dem Autor zugeschrieben; WRN beansprucht keine unabhängige Tatsachenprüfung.
Der Druckausgaben-Hinweis wurde ausgelassen.

Das Originalbild im Beitrag nennt Jonathan Shembere/Pexels. Das auf dem
[Fotografen-Eintrag](https://www.pexels.com/photo/nigerian-fan-with-face-paint-celebrating-29804183/)
angebotene Foto zeigt nach Sichtvergleich denselben Fan und dieselbe Szene wie
die Verlags-PNG. Die [Pexels-Lizenz](https://www.pexels.com/license/) erlaubt
Fotos ausdrücklich in Apps und Websites; die Foto-Seite nennt den Fotografen
und „Free to use“. Die von Pexels gelieferte 600 × 900-px-Variante wird lokal
ausgeliefert: 67.344 Byte, SHA-256
`c44461a119bbf0db2ac7c357b70b5bd62126e19d012a121f9d7759e237c713ce`.
Der Reader enthält einen redaktionellen Alternativtext, Fotografenattribution
und den eigenen Lizenz- sowie Fotoseitenlink. Er benötigt zum Anzeigen keine
Pexels-Verbindung. Der visuelle Identitätsabgleich ist im
[Artikelpass](candidate/admission-review.json) als solcher ausgewiesen; eine
bytegleiche Identität der verschieden zugeschnittenen Varianten wird nicht
behauptet. Direkter CLI-Abruf der Pexels-Seite lieferte eine Anti-Bot-Seite,
daher ist für sie kein lokaler HTML-Snapshot hinterlegt.
Die AIAC-Seiten-Snapshots bleiben nur im ignorierten lokalen Rechercheordner;
der [Artikelpass](candidate/admission-review.json) bindet ihre Hashes und
Bytezahlen, ohne das fremde Website-HTML ins öffentliche Repository zu kopieren.

Der unveränderte V3-Builder nahm den 856.415-Byte-[Input](candidate/production-build-input-v3.json)
an und erzeugte Descriptor-SHA
`cd847e20f004b3b6c3326baf33a4020a52a476e40bd1592a202ac868592197db`.
Der produktive Website-Loader öffnete V7 mit zehn Artikeln, 21 Blöcken dieses
Beitrags und der Pexels-Lizenz. Der fokussierte Test prüfte Textumfang,
Bildnachweis und bytegleiche Kernressourcen in App und Website: 8/8 PASS;
V3-Builder-/Publisher-Tests 11/11 PASS. `pnpm build` für beide Clients und
`pnpm check` für den gesamten Workspace bestanden, darunter Mobile 952/952,
Website 155/155 sowie 71/71 Website-Paketfälle. Die lokale Home-Browsermatrix
ergab zunächst 23/28; ihre fünf Abweichungen betrafen alte Kartenzahlen und
kurze Startwartezeiten. Der gezielte Nachlauf bestand 6/6, der Offline-Neustart
mit dem neuen Bild zusätzlich 1/1. Die vollständige Browsermatrix wurde nach
der Testkorrektur nicht erneut ausgeführt. Zwei repräsentative Sichtproben
([App](visual/mobile-sport-violet-320.png),
[Website](visual/website-home-violet-320.png)) und ein
[SHA-256-Manifest](HASHES.sha256) binden die lokalen Inhaltsdateien und Bilder.
Die endgültige Paket-/Browser-/Android-
Matrix ist damit **nicht** ersetzt.

Beim Gesamtcheck wurde außerdem eine Abbruch-Race im Übersetzungsdienst
behoben: Ein neuer Aufruf kann nicht mehr einem bereits verlassenen
Cache-Miss beitreten. Die Dienstsuite bestand 52/52. Dies aktiviert keinen
externen Übersetzungsanbieter und erzeugt keine Providerkosten.

Offen bleiben ein unabhängiger Rechte-/Inhaltsreview, die wirklich
bildgestützte 1+2-Sportauswahl auf Home, ein neuer Android-Bundle- und
datenerhaltender Upgrade-Test für exakt diesen Kandidaten sowie die
Live-Inhalts-/Widerrufsversorgung und die finale RC-Matrix. Das geplante Zine
bleibt separat offen.
