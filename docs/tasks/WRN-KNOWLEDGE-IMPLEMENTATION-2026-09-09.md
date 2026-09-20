# Bibliothek und Lexikon mit echten Altinhalten

Parent: WRN-MIGRATION-CONTENT-KNOWLEDGE-SOLIDARITY-2026-09-09.
Basis33ceae8; PO-Auftrag9.September, INFO-02/03. Chief verantwortlich.
Delegation erlaubt, keine Kinder: erst enger Sol/high-Vertragscheck (Slot1),
danach ein Terra/high-Writer (Slot1), danach unabhängige Terra-QA.
Register: WRN-G3-021-DELEGATION-REGISTER.md. Keine parallelen Writer hier.

## Bestand und Verhalten

Autoritative App2216ff3, Runtime968c320, Pfad laut Source-of-Truth.
609 Bücher/9 Quellen,22 DE/EN-Begriffe/12 Lexikonquellen. Aktuelle GitHub-
Datatree48c394798184721cace3448983f87c71baa681da vom9.September enthält
keinen library-feed/library-sources; daher gebündelte Appdaten verwenden,
keine aktuelle Onlinebibliothek behaupten. Lexikon aus derselben Appbasis.

Wissen: Bibliothek mit lokaler Titel-/Autor-/Themensuche, kombinierbaren
Sprache-/Quelle-/Formatfiltern, Reset/Leerfall/Paginierung je30. Alle9
Quellkataloge zugänglich, auch5 ohne importierte Bücher. Lexikon mit Suche,
Kategorie, Definition/Praxis/Perspektiven/Quellen/verwandten Begriffen.
Redaktionstexte DE/EN; sichtbarer EN-Fallback bei übrigen7 UI-Sprachen.
Externe Katalog-/HTML-/PDF-/EPUB-Links nur durch bewusste Nutzeraktion.

## Versionierter, begrenzter Vertrag

Eigenständiger Subpath mobile-knowledge-v1 im Contentpaket; keine Artikel-,
Event- oder Mediensemantik. Version1, sourceCommit, observedAt UTC,
origin=legacy-app-snapshot, rights=metadata-and-links bzw.
user-supplied-editorial-text. Keine CC0-/neue verified-Behauptung.
Eingabehashes/Bytes/Mengen/stabileIDs im Importbeleg. Alte verifiedAt-
Angaben erhalten und als historische Angaben kennzeichnen.
Deterministischer lokaler Import der zwei JSONs und Lexikon-SOURCES/TERMS
über TypeScript-AST ausschließlich literaler Werte, kein eval/Altcodeausführen.
Keine externen Volltexte/Medien kopieren; JSONdaten sind kein HTML.

Limits: JSON3MiB UTF8; max2000 Bücher/100 Quellen/250 Begriffe; IDs nichtleer,
eindeutig,max160; Titel500/Text20000; Arrays100 je Datensatz; begrenzte
Sprachcodes. Alle sichtbaren Texte ohne HTML/Kontrollzeichen. HTTPS-Links
ohne Credentials/Whitespace/Steuerzeichen, keine IP/localhost/.local-Ziele.
Quelle-/related-Referenzen müssen existieren. Downloadkeys nur html/pdf/epub;
Formatfilter aus tatsächlich vorhandenen Links ableiten. Validator prüft
vollständig vor UI-Freigabe, Fehler ergeben keinen Teil-/Fixturefallback.
Neutrale lokale String-/URL-Prüfer im neuen Vertrag sind erlaubt; keine
Imports aus Event-/Medienmodulen, deren vorhandene Primitiven nicht ändern.

Statischer Katalogsnapshot ohne erfundene Buch-TTL oder Livezusage.
Explizite withdrawnSourceIds/withdrawnIds im versionierten Snapshot;
Projektor entfernt betroffene Buch-/Begriffsaktionen und Texte vollständig.
Auch zurückgenommene Rohdaten müssen schema-/referenzgültig sein.
Änderung nur durch neuen lokalen Kandidaten, keine Remote-Aktivierung.
Stand/Altquelle sichtbar. Bereits geladener Katalog offline nutzbar;
Offline-Kaltstart ohne Appcache kann fehlschlagen: ehrlicher Ladefehler/Retry.
Keine neue Persistenz/IDB/SW und keine dauerhafte Offlinebibliothek behaupten.

## Exakte Allowlist

Ein Writer besitzt ausschließlich:
- packages/content-contracts/src/mobile-knowledge-v1.ts
- packages/content-contracts/src/mobile-knowledge-v1.test.ts
- packages/content-contracts/package.json (nur additiver Subpathexport)
- tools/import-legacy-knowledge.mjs
- tools/import-legacy-knowledge.test.mjs
- apps/mobile/src/features/knowledge/MobileKnowledgeRoute.tsx
- apps/mobile/src/features/knowledge/MobileKnowledgeRoute.test.tsx
- apps/mobile/src/features/knowledge/knowledge-loader.ts
- apps/mobile/src/features/knowledge/knowledge-loader.test.ts
- apps/mobile/src/features/knowledge/knowledge.css
- apps/mobile/src/features/knowledge/data/legacy-knowledge-v1.json
- packages/ui-language/src/mobile-knowledge.ts
- packages/ui-language/src/mobile-knowledge.test.ts
- packages/ui-language/src/index.ts (nur additiver Export)
- apps/mobile/src/App.tsx (nur lazy Route/Suspense/Fokusintegration)
- tests/e2e/mobile-knowledge.spec.ts
- docs/evidence/WRN-KNOWLEDGE-IMPLEMENTATION-2026-09-09.md
- docs/handoffs/WRN-KNOWLEDGE-IMPLEMENTATION-2026-09-09.md

Vor Writerstart unabhängiger Vertragscheck mit Ergebnisnachtrag hier.
Reviewer liest nur und liefert Antworttext. Chief parallel nur disjunkte
Quellenbelege/Hilfeplanung. Writer ist nicht allein, bewahrt fremde Änderungen;
keine Kinder/Index/Git/Profile/Dependencies/Website/News/Medien/Events/SW.
Keine Installation/Übermittlung/Bezahlung/Veröffentlichung.

Lazy Routechunk plus dynamischer Datenimport. Loader validiert unbekannte
Daten vor Nutzung und cached nur erfolgreiche Ergebnisse; Retry nach Fehler
erneut möglich. Komponente ignoriert alte resolve/reject nach Retry/Unmount.
Kein externes Fetch, keine neue globale Registry. Reine lokale Filter im
Fachmodul/Vertrag. Fokus über mobile-page-title/headingRef bleibt erhalten.

## Abnahme und Handoff

Units: Import609/9/22/12 und stabileIDs, tatsächliche Formate,5 leere
Quellkataloge, unsichere URLs/HTML/Übergröße/Referenzen/Duplikate/Rücknahmen;
Filterkombinationen, Reset/Mehrladen, Begriffwechsel, Sprachfassung,
Lade-/Retry-/Unmountfehler. Keine externen Requests bei Aufruf/Suche/Filter.
Browser mit realen Daten: Keyboard/Axe/Fokus, neun UI-Sprachen,
320/390/768/1280px, vorhandene Themes,44px, kein Overflow/Konsolenfehler.
Begrenzte reproduzierbare Screenshotmatrix pro Sprache/Theme. Lazy-Daten
dürfen bestehendes Startbundle nicht um den Katalog vergrößern.
Mobileunits,7 Typechecks,Build,scopedLint/Format,19 Boundaries. Tests nicht
abschwächen. Danach unabhängige QA und funktionierende Vorschau43176.
PO-Sichtprobe nicht erfolgt, kein erfundenes GREEN. Rollback über eigenen
Kandidatendiff, keine Nutzerpersistenz betroffen. Handoff nach Template mit
echten Ergebnissen und END-CHECK: :).

## Sol-Vertragscheck und bindende Präzisierung

Sol knowledge_design_review findet drei enge Design-Mediums und bestätigt
nach exakt diesen Textkorrekturen keine weitere Architekturrunde nötig:

1. Offlineaussage gilt ausschließlich bei bereits laufender App-Shell.
   Ein echter Kaltstart ohne Appcache kann die App selbst nicht anzeigen;
   keine In-App-Fehleranzeige dafür versprechen. Die lazy Wissensroute erhält
   eine lokale Error Boundary samt Retry-Epoch; Retry erstellt auch die
   React.lazy-Instanz neu, nicht nur dieselbe abgelehnte Promise. App.test.tsx
   ist zusätzlich allein für Erstfehler/Retryerfolg/späteRejection/Fokus erlaubt.
2. Rücknahmen typisiert nach Buch-/Begriffs- und Bibliotheks-/Lexikonquelle.
   Reihenfolge: Rohschema vollständig prüfen; direkte und Quellenrücknahmen
   anwenden (betroffenes Buch oder ganzer Begriff samt Text/Aktionen entfernen);
   related-IDs auf sichtbare Begriffe reduzieren; resultierende Referenz-
   geschlossenheit prüfen. Tests direkte/Quellen-/verwandte Rücknahme.
3. Rechtebasis pro Sammlung/Datensatz eindeutig: Bücher/Katalogquellen nur
   Metadaten/Links, Begriffsredaktion user-supplied-editorial-text; Quellen-
   beschreibungen als übernommener WRN-Redaktionstext getrennt markieren.
   Mismatches zurückweisen.3MiB bedeutet gesamtes erzeugtes Runtime-JSON;
   Limit vor Importausgabe und vor Runtimevalidierung/Nutzung erzwingen.
   Jeder externe Link parsed/canonical HTTPS, rel=noopener noreferrer,
   referrerPolicy=no-referrer; keinerlei Prefetch/HEAD vor Nutzerklick.

Chief übernimmt diese Präzisierungen vollständig; ursprüngliche unpräzise
Aussagen werden dadurch eingegrenzt. Keine neue PO-Frage erforderlich.

## QA-Disposition unter Runtimegrenze

Da keine neue Instanz startet (agent thread limit reached), übernimmt nach
Kandidatensicherung der disjunkte Support-Terra die unabhängige Wissens-QA.
Prüfbelege ausschließlich docs/evidence/WRN-KNOWLEDGE-INDEPENDENT-QA-2026-09-09.md
und docs/handoffs/WRN-KNOWLEDGE-INDEPENDENT-QA-2026-09-09.md.
Der Wissenswriter darf nach eigener Rechteabgabe und Chiefstartnachricht den
fremden Supportkandidaten read-only prüfen; separate QA/Handoffpfade gemäß
Supportbrief. Kein eigener Write oder Selbstabnahme dadurch erlaubt.

## Kleine eigene Wissensergänzung im autorisierten UI-Scope

Zusätzlich zum unveränderten609/22-Import eine klar als WRN-Lesehilfe
bezeichnete kurze eigene Anleitung, keine fiktive Altdefinition: Quelle und
Datum prüfen; mehrere Perspektiven vergleichen; Begriffe über verwandte
Einträge vertiefen. Optional vorhandenen Begriff mutual-aid als Einstieg
verlinken, nur wenn dessen ID im validierten sichtbaren Katalog existiert.
Reine routeeigene UI-Copy in bestehendem erlaubtem Sprachmodul, keine neue
Datenquelle/Behauptung/Anfrage/Persistenz, keine Veränderung der Importzahlen.
Die Ergänzung erfüllt den PO-Wunsch nach sinnvoller Ausbauhilfe und bleibt
unter bestehender Sprach-/Link-/Rücknahmeprüfung. Keine neue Designrunde.

## Chief-Übernahme nach erster Writerübergabe

Wissenswriter gibt alle Produktrechte ab; Chief übernimmt sequenziell exakt
bestehende Allowlist. Erstkandidat ist funktional vorhanden, aber NICHT fertig:
Chief findet nur DE/EN-Oberfläche statt9Sprachen, unsichereURL-IPv6-Lücke,
Typcoercion vonIDs, zu schwacheDatumprüfung und fehlende Import-Outputgrenze/
Validierung vorAusgabe. Die Pflicht-Testmatrix ist weitgehend noch unbelegt
(4Screenshots, keine neunSprachenmatrix). Keine neue Produktsemantik; Chief
korrigiert gebundene Anforderungen und liefert echte Orakel vor Abschluss.
Support bleibt zweiter disjunkterWriter. Keine dritte Produktarbeit.

Nach Support-Produktende sind alle Supportproduktrechte zurück. Chief teilt
jetzt ausschließlich zwei Wissen-Sprachpfade erneut dem bestehenden
knowledge_implementation zu: packages/ui-language/src/mobile-knowledge.ts
und mobile-knowledge.test.ts. Vollständige9 UI-Sprachen statt DE/EN-Fallback;
zusätzlich snapshotDate/historicalReview/offlineNote als neue UI-Labels für
belegte Standanzeige. Chief besitzt alle übrigen Wissenspfade, insbesondere
Contract/Importer/Route/App/Browsertests. Keine Writes außerhalb dieser zwei
Sprachdateien durch ehemaligenWriter. Root und Sprachwriter sind die einzigen
zwei disjunkten Produktwriter, Support wartetread-onlyaufKnowledge-QA.

## Browserbefund: Wiederherstellung nach fehlendem Modul

Chief reproduziert in Chrome: eine neue React.lazy-Instanz allein beseitigt
den browserintern gespeicherten Fehler derselben Modul-URL nicht. Der enge
unabhängige Terra-Designcheck bestätigt deshalb diese notwendige Korrektur
der früheren Sol-Annahme: Fehler beim Routechunk bieten ausschließlich
explizit beschriftetes, nutzergesteuertes Neuladen der Ansicht. Flüchtige
Filter gehen dabei verloren; keine automatische Schleife oder Query-Busting.
Daten werden separat lazy per same-origin fetch(new URL(..., import.meta.url))
geladen, ohne Credentials/Redirects, mit früher Bytegrenze vor Parse und
anschließender Vertragsprüfung. Erfolg wird gecacht, Fehler bleiben retrybar.
Promiseabschluss nach Unmount wirkt nicht auf UI. Die bestehenden Allowlist-
Loader-/Copy-/App-/Testpfade reichen aus; Chief führt aus. Gleiches gilt
für Support/Directory und ersetzt dort die unwirksame Modulretry-Annahme.

## Enger Sprachmetadaten-Nachtrag nach Kandidat918d06d

Chiefs sichtbare Schlusskontrolle findet in MobileKnowledgeRoute.tsx drei
falsch als Deutsch deklarierte Katalogbeschreibungen. Der unveränderte
gebundene Asset enthält für anarchist-library-es den spanischen Satz
Textos anarquistas en español., für anarchist-library-fr den französischen
Satz Textes anarchistes en français. und für anarchist-library-it den
italienischen Satz Testi anarchici in italiano. Die übrigen sechs Beschreibungen
sind Deutsch, auch die des englischen Katalogs. Die Katalogsprache allein
ist deshalb kein verlässliches Sprachmerkmal des Beschreibungstextes.

Nach Ende der Directory-QA-Browserrechte übernimmt allein Chief exakt
MobileKnowledgeRoute.tsx und MobileKnowledgeRoute.test.tsx unter
apps/mobile/src/features/knowledge/. Eine explizite Zuordnung der neun
gebundenen Katalog-IDs zu ihrer tatsächlich beobachteten Beschreibungssprache
ersetzt das pauschale lang=de. Kein Text, Layout, Datenasset, Schema, Link,
Store, App- oder Directorycode wird verändert. Für unbekannte Katalog-IDs
keine erfundene explizite Sprachauszeichnung. Ein Test prüft alle9Beschreibungen
unter mindestens einer anderen UI-Sprache; die drei Regressionen vorab rot.

Anschließend gezielter Wissenslauf, Mobiletypecheck/scopedLint/Format und
Browser-DOM-Beleg; bestehende sichtbarePixelmatrix bleibt unverändert.
Support-Terra prüft dieses fremde Zweipfaddelta unabhängig und ergänzt seine
vorhandenen Knowledge-INDEPENDENT-QA-Belege. Keine Selbstabnahme, keine
neue Runtimeinstanz, keine neue Produktfunktion oder PO-Rückfrage nötig.
