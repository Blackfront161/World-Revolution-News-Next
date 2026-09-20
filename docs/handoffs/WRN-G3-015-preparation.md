# Chief-Handoff – WRN-G3-015 Vorbereitung

- Auftrag: „ok machen wir das naechste grosse paket“, PO-072 Vorbereitung.
- Basis: `2191b0f`, Branch `codex/g3-014-content-offline-transactions`.
- Produkt unveraendert `44b5cb1`; G3-014 technisch GREEN, visuelle Abnahme offen.
- Ergebnis: Website-Shell/Offline-Neustart/Updatepaket nach ADR-007 vorbereitet;
  noch keine Umsetzung, Registrierung, Cacheaktion oder Agentenstarts.
- Quellen: Charter, Source-of-Truth, ADR-007, Migration-Waves, Qualitaetsregeln,
  G3-014-Handoff, Websiteentry/Build/QA-Harness und vorhandene Buildgroessen;
  technische Primaerreferenzen im neuen Task Brief.

## Umfang

Eigene Website-Shell, explizites Bereitstellen, versionierter Assetcache,
sichere wartende Updates, lokaler Paketrollback und gezieltes Entfernen.
Inhalte und ihre Safety bleiben ausschliesslich G3-014. Keine Android-/Mobile-
SW-Integration, kein SEO-Contentcache, keine Live-/Kosten-/Releasebefugnisse.
Der neue Pilot nutzt nach stabilem Frontendvertrag genau einen Spark-Helfer
fuer additive Katalogtexte, maximal zwei Subagenten mit zentralen Slots.

## Bewusst offene Freigaben

G3-014-Sichtentscheidung fehlt; „Buttons spaeter kompakter“ ist als eigener
UI-Feinschliffbedarf dokumentiert, nicht umgesetzt oder final akzeptiert.
Der neue G3-015-Scope muss ausdruecklich angenommen werden. Erst danach darf
P1 den technischen Vertrag pruefen; bei GREEN geht das Paket intern weiter.
Ein gemeinsamer PO-Befehl kann beide Entscheidungen eindeutig enthalten.

## Pruefung und Ruecknahme

Nur Dokumente geaendert. Diffcheck PASS; Produkt-/Test-/Tool-/Packagepfade
gegen `2191b0f` unveraendert. Drei neue Dokumentpfade, Statusmarker und
Gate-/ID-Verweise geprueft. Keine Produkttests als frisch bestanden behauptet.
Dokumentaenderungen ueber Git nachvollziehbar; keine Nutzdaten betroffen.
Vorhandene Useranhaenge und alte Projekte bleiben unberuehrt.

## WRN-AGENT-STATUS

- Status: PREPARED, Implementierung und Pilot gesperrt.
- Offen: G3-014-Sichtentscheidung und `START WRN-G3-015` zum neuen Scope.
- Naechster Schritt: nach Freigabe frischer P1-Architekturreview.
- END-CHECK: :)
