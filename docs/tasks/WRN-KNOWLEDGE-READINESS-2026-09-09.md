# Wissen/Bibliothek – belegte Vorbereitung

Stand: 9. September 2026. Status: lokale Bestandsanalyse abgeschlossen;
noch kein Implementierungspaket. Dieser lesende Vorbereitungsschritt ist
Teil des Chief-Auftrags vom 8. September und seiner aktuellen Fortsetzung.
Er reserviert keine Produktpfade und unterbricht P4-B nicht.

## Auftrag, Verantwortung und Grenze

- Paritätsbezug: INFO-02 Bibliothek und INFO-03 Bewegungslexikon.
- Owner: Chief, keine zusätzliche Delegation und keine Kinder.
- Quellen: Product Charter, Source-of-Truth, Zielarchitektur,
  Paritätsmatrix und der autoritative App-Gesamtstand `2216ff3` mit
  Runtimebasis `968c320`.
- Schreibscope dieses Vorbereitungsschritts: dieser Brief und der eigene
  Chief-Bericht. Alle Produkt-, Test-, Daten- und Legacydateien read-only.
- Kein Feedabruf, keine Buch-/PDF-/EPUB-Kopie, keine Quellenaufnahme,
  Installation, Persistenzänderung, Websiteportierung oder Veröffentlichung.

## Tatsächlich vorhandene Altumsetzung

Basisordner ist ausschließlich
`C:/Users/patri/Documents/World Rev Ne/wrn-github-app-current`.
Die folgenden Ergebnisse stammen aus lokaler Quelllektüre; die Funktionen
wurden dabei nicht als laufende Android-App getestet.

| Funktion | Konkreter Beleg |
| --- | --- |
| Bibliothek nach Titel, Autor, Thema und Quellenname durchsuchen | `news-app-2.js:4768`, Funktion `libraryResults` |
| Sprache, Quelle und Format kombinieren; nach Titel sortieren | dieselbe Funktion; keine Ableitung aus dem allgemeinen Nachrichtenfilter |
| Quellkatalog öffnen, HTML/PDF/EPUB-Verweise per Nutzeraktion öffnen | `news-app-2.js:4787`, `libraryDownloadMarkup`, und `:4798`, `renderLibrary` |
| Begrenzte Ergebnismenge und „mehr laden“ | `renderLibrary`, bestehender `state.library.limit` |
| Mehrere Spiegel versuchen und lokale Datensätze als Fallback nutzen | `news-app-2.js:8641` und `:8715`; passt zu den separat beobachteten optionalen Feed-404s |
| Eigenständiges Lexikon mit Suche, Themenabschnitten, Praxis, Perspektiven und verwandten Begriffen | `lexicon-tab.js:325` und `:1915`; aktives Asset in `index.html:444` |
| Neun UI-Sprachen, redaktionelle Definitionen zunächst Deutsch/Englisch mit sichtbarem Fallback | `lexicon-tab.js:7-171` |
| Quellen, Exporthinweise und Print-/EPUB-/JSON-Funktionen im Altmodul | `lexicon-tab.js:7-74`; Exportumfang bleibt ein eigener späterer Teil |

Lokale strukturierte Inventur: `library-feed.json` enthält 609 Einträge,
`library-sources.json` neun Quellen. Die erste Eintragsform besitzt
`id, sourceId, sourceName, title, authors, languages, topics, formats,
readUrl, downloads, updatedAt`. Die erste Quellenform besitzt
`id, name, languages, homepage, catalogUrl, opdsUrl, formats, description,
politicalScope, status, verifiedAt`. Diese Zählung und Feldbeobachtung ist
keine Rechte-, Aktualitäts- oder Admissionbestätigung und darf nicht als
aktueller Umfang des getrennten Live-Datenrepositories ausgegeben werden.

Vorhandene Altprüfungen `tests/test_library_catalog.py` und
`tests/test_lexicon_assets.py` enthalten Link-/OPDS-/Sprach- beziehungsweise
Asset-/Quellen-/Navigationsorakel. Sie wurden hier gelesen, nicht ausgeführt
und nicht als Ersatz für neue Integrationstests gewertet.

## Nächster einzelner fachlicher Schritt

Nach Abschluss des laufenden P4-B-Pakets einen engen Wissensvertrag binden:
versionierter, begrenzter Katalog mit stabilen Eintrags-/Quellen-IDs und
expliziter Herkunft, Rechten, Sprachfassung, Rücknahme und Gültigkeit;
darauf eine suchbare Bibliotheksansicht mit Quelle-/Sprache-/Formatfiltern,
leerer Suche, klaren Offline-/Fehlerzuständen und bewussten externen Links.
Der Kern soll externe Texte nicht automatisch laden oder als lokale
Volltextbibliothek darstellen. Native Download-/Exportfunktionen werden
nicht aus einem vorhandenen Link abgeleitet.

Vor dem Writerstart sind die konkreten Schema-/UI-/Testpfade, Obergrenzen,
Zeit-/Rücknahmeregeln, Linkvalidierung, Quellverantwortung und Rücknahme des
lokalen Kandidaten unabhängig zu prüfen. Der bestehende News- oder
Medienvertrag wird nicht still umgedeutet. Eine gemeinsame Wissensroute
darf Bibliothek und Lexikon klar gliedern; die beiden Inhaltsformen sind
keine austauschbaren Datensätze.

## Vorgesehene Abnahme in beobachtbarer Sprache

1. Nutzende finden einen Eintrag anhand von Titel, Autor oder Thema und
   können die Ergebnisse nach Quelle, Sprache und Format einschränken.
2. Herkunft und tatsächlich verfügbare Sprachfassung bleiben sichtbar;
   ein englischer Fallback wird nicht als deutsche Übersetzung ausgegeben.
3. Aufruf, Suche und Filtern lösen keinen externen Inhaltsabruf aus.
   Ein externer Link ist als solcher erkennbar und benötigt eine Nutzeraktion.
4. Leere, abgelaufene, zurückgenommene und nicht verfügbare Daten erzeugen
   nachvollziehbar verschiedene Zustände; ein Fallback verdeckt keine
   fehlende oder unzulässige Quelle.
5. Tastatur, Screenreader, große Schrift, neun UI-Sprachen und die bestehenden
   mobilen Themes funktionieren. Suche bleibt zunächst flüchtig lokal.

Erforderliche Prüfungen: Vertragsgrenzen und bösartige/ungültige Linkwerte,
Filterkombinationen, korrekte ID-Zuordnung, Zeit-/Rücknahmeübergänge,
Reload-/Unmount-Races, Requestfreiheit, Reflow-/Fokus-/Kontrastbelege.
Die exakte Matrix gehört in den späteren gebundenen Taskbrief. In diesem
reinen Vorbereitungsschritt wurden keine Produktchecks behauptet.

## Offene Belege und Folgeteile

- Redaktionelle Verantwortung, Rechtebeleg und Gültigkeitsregeln pro Quelle
  und Eintrag sind noch in einen prüfbaren neuen Vertrag zu überführen.
- „Bewegungslexikon“, „Bibliothek“ und „Zine/Druck“ bleiben im Restplan
  erhalten. PO-003 akzeptiert Druck/Zine als späteren Release-1-Slice,
  enthält aber keinen aktuellen Implementierungsbrief.
- Solidarität und Hilfe brauchen eigene sensible Inhalts- und
  Aktualitätsprüfungen; sie werden nicht unter Bibliotheksmetadaten versteckt.
- Keine externen Kosten oder Datenänderungen; Rücknahme dieses Schritts
  beträfe ausschließlich den Dokumentdiff.

## Enger Anschluss: vorhandene Vertragsbausteine kartieren

Disposition nach Medien-R1-Gate `103612b`: Die Altinventur oben bleibt
abgeschlossen. Chief reserviert Slot 2 für genau einen read-only Explorer
mit Luna/medium, ohne Kinder, Browser, Tests, Index oder Dateiänderungen.
Delegation: für diesen begrenzten Anschluss erlaubt. Slot 1 gehört weiter
exklusiv dem Medien-R1-Terrawriter; kein weiterer Produktwriter wird gestartet.

Neue, disjunkte Frage: Welche bereits exportierten neutralen Typen und
Validierungsfunktionen aus `packages/domain`, `packages/content-contracts`
und `packages/api-contracts` eignen sich belegbar für den geplanten
Bibliotheksvertrag, und welche Importgrenzen verbieten Wiederverwendung?
Zusätzlich vorhandene Bibliotheks-/Lexikontypen und fachlich passende Tests
im neuen Repository lokalisieren. Kein erneuter Alt-/Live-/Chatabruf und
keine Architektur- oder Rechtefreigabe durch den Explorer.

Ergebnis an Chief: höchstens zwölf konkrete Fundstellen mit Pfad, Export,
tatsächlich vorhandener Semantik und Wiederverwendungsgrenze; fehlende
Primitiven benennen, keine neue API erfinden. Auftrag ist abgeschlossen,
wenn der Chief daraus den kleinsten unabhängigen Wissensvertrag vorbereiten
kann. Bei fehlendem Symbol ausdrücklich „nicht gefunden“. Ein kurzer
Handoff nach Agentenvorlage im Antworttext genügt, da keinerlei Schreibrecht
erteilt wird. Modellwahl dient dem begrenzten Extraktionsaufwand; Chief und
späterer unabhängiger Sol-Review treffen die Architekturentscheidung.

## Ergebnis des Vertragsbaustein-Abgleichs

Der Luna-Explorer hat den begrenzten read-only Auftrag beendet; keine Dateien,
Tests, Browser oder Netzaufrufe. Slot 2 ist wieder frei. Quellenstand nach
`bb85566`, zwölf konkrete Fundstellen im Handoff an Chief. Im neuen Repository
sind keine Bibliotheks-/Lexikontypen, Validatoren, Fachmodule oder dedizierten
Tests vorhanden; `knowledge` ist weiterhin nur Navigation/Label.

Für den kommenden Vertrag sind diese Ergebnisse bindende Ausgangspunkte:

- `LocalArticle` und die Manifest-/Archivtypen in
  `packages/content-contracts/src/index.ts` liefern belegte Muster für
  Herkunft, Rechte, Ressourcenbegrenzung und Rücknahmen. Ihre konkreten
  Validatoren verlangen aber Artikel-/Fixturesemantik und werden nicht als
  Bibliotheksvalidator ausgegeben.
- `isCanonicalUtc` und `isPlainText` sind in
  `packages/content-contracts/src/mobile-regional-events-v1.ts` tatsächlich
  exportiert. Andere vermeintlich allgemeine Helfer, insbesondere HTTPS-URL-
  und ID-Prüfungen, sind überwiegend privat oder fachlich gebunden. Eine
  neutrale Wiederverwendung muss ausdrücklich gestaltet werden; die neue
  Bibliothek soll nicht fachlich vom Eventdatensatz abhängig werden.
- `createCanonicalArticleShareUrl`, Discoverfilter und Archivprojektionen in
  `packages/domain/src/index.ts` sind artikelgebunden. Ihre korrekten Muster
  ersetzen weder allgemeine sichere Quellenlinks noch Bibliotheksfilter.
- Regional-Events-/Reader-Fixturewerte wie `self-authored-local-fixture` und
  `CC0-1.0` sind keine Rechtefreigabe für die 609 alten Bibliothekseinträge.
  Diese Werte dürfen beim neuen Vertrag nicht blind übernommen werden.
- Die Paketgrenze bleibt Contentverträge → Domain → API-Verträge. Der
  API-Shellvertrag ist kein neutraler Wissensvertrag. Es fehlen ein eigener
  begrenzter Bibliotheksdatensatz, passende IDs/Sprachvarianten und explizite
  Link-, Gültigkeits- und Rücknahmesemantik.

Chief-Folgeentscheidung: ein kleiner eigener Bibliotheksvertrag und getrennte
Bibliotheksfilter, ohne Erweiterung von `LocalArticle` und ohne neue
Server-/Providerpflicht. Gemeinsame primitive Regeln nur nach geprüftem
neutralem Export verwenden; keine nebenbei kopierte zweite Domainregel und
keine Vorabänderung der grünen Medienverträge. Die genaue Schema-/Datei- und
Testbindung bleibt der nächste unabhängige Architekturauftrag nach dem
laufenden Medienabschluss. Lexikon und Druck bleiben im Restumfang erhalten.

WRN-AGENT-STATUS: GREEN für beide lokalen Bestandsanalysen; Produktpaket offen.
END-CHECK: :)
