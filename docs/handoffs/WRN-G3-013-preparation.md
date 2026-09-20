# Handoff – WRN-G3-013 Vorbereitung

Stand: 27. August 2026

Vorbereitungscheckpoint: `b4d4a27`

## Ergebnis

WRN-G3-013 ist ausschliesslich dokumentarisch vorbereitet. Die Product-Owner-
Anforderung wird als echte UI-Lokalisierung fuer Mobile und dynamische Website
gebunden: neun Legacy-Paritaetssprachen, Erststart Englisch, danach getrennte
lokale Persistenz der letzten gueltigen Auswahl.

Das read-only Inventar bestaetigt, dass die alte App dieses Verhalten bereits
besitzt. Das neue Projekt hat nur einen Originalsprachen-Contentfilter und
weitgehend deutsche UI-Hardcodes; eine UI-Sprachpraeferenz fehlt.

## Gebundene Entscheidungen

- App und responsive Website gemeinsam;
- exakt `en`, `de`, `es`, `fr`, `it`, `pt`, `ru`, `el`, `tr`;
- alle sichtbaren dynamischen Shelltexte werden wirklich lokalisiert;
- getrennte versionierte Keys und `en` als fail-closed Erststart/Fallback;
- native zugängliche Headerselects, kein Redesign und keine Flaggen;
- Content-Originalsprache, Artikel, Revisionen, Hashes und Filter unveraendert;
- statische Landingpages, Remoteuebersetzung und jeder Provider bleiben separat;
- bisher geplanter Offline-/Cache-Slice wird wegen Product-Owner-Prioritaet als
  `WRN-G3-014` weitergefuehrt.

## Kosten- und Agentenplan

Terra/Frontend verantwortet Vertrag und Integration. Erst nach stabilem Keyset
duerfen Spark-Micro-Worker getrennte Kataloggruppen bearbeiten; damit wird das
separate Spark-Kontingent fuer repetitive Copyarbeit genutzt, waehrend Terra
die Gesamtqualitaet und Integration kontrolliert. Security/Privacy und
Visual/Accessibility pruefen danach unabhaengig.

## Aktuelles Gate

Kein Produkt-, Test-, Package- oder Buildcode wurde veraendert. Kein
Implementierungsagent wurde gestartet. Das einzige Startgate lautet:

```text
START WRN-G3-013
```

G3-014 Offline/Cache, echte Inhalte, statische Landingpage-Lokalisierung,
Android, Remote/CI, Deployment, Signierung, Upload und Release bleiben
gesperrt.

## WRN-AGENT-STATUS

- Task: WRN-G3-013 Header-UI-Sprachwahl – Vorbereitung
- Status: DOKUMENTARISCH VORBEREITET
- Mitarbeiter: read-only Inventar abgeschlossen; keine Implementierung aktiv
- Kosten: 0 CHF; keine externe Aktion
- END-CHECK: :)
