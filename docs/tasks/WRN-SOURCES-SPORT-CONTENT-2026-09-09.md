# Reale Quellen, Nachrichtenverweise und Sportauswahl

Parent WRN-MIGRATION-CONTENT-KNOWLEDGE-SOLIDARITY-2026-09-09, PO9.September.
Basis4d433f8 plus dokumentierte disjunkte Knowledge/Supportproduktion.
Chief verantwortlich. Noch kein Produktwriter. Delegation erlaubt: ein enger
unabhängiger Sol-Vertragscheck Slot3 während zwei Terra-Writer disjunkt arbeiten.
Keine Kinder. Spätere Ausführung nur mit freiem Writerrecht/gebundenem Slot.

## Beleg und Zweck

docs/evidence/WRN-LEGACY-CONTENT-SNAPSHOT-2026-09-09.md bindet alle Eingaben:
App2216ff3 sources-registry515, GitHub48c3947 sources-registry408; Union532
beobachtete Canonical-URL-Endpoints. Keine532 Organisationen behaupten und
keine automatische Fusion verschiedener Feed-/Homepageadressen gleichen Namens.
Aktueller Newsfeed500 aus48c3947, Appfeed500 mit499 zusätzlichen historischen
Links. Zwei der drei Sportverweise liegen in diesem Appbestand; dritter als
eigenständige belegte Ergänzung. Keine vorhandenen Fixtures in Echtdaten umetikettieren.

Neue mobile Discover-Unteransichten: Nachrichten aus dem gebundenen Snapshot,
Quellenverzeichnis und Sportauswahl. Lokale Suche, Sprache-/Quellenfilter,
Paginierung30, Quellherkunft/Publikationsdatum und Stand sichtbar. Original
öffnet auf Nutzeraktion extern. Historischer Appbestand ist bewusst über
eigenen Filter erreichbar; neuester GitHubstand ist Standard. Drei Sport-
Lesetipps einzeln Fußball/Fankultur/feministische Perspektive wie im Beleg.
Keine Behauptung vollständiger globaler Sportabdeckung oder Liveergebnisse.

Umfang ist ausdrücklich Metadaten/Links und kurze eigene Sporthinweise;
keine Drittvolltexte/Bilder kopieren und keine unbekannten Rechte als CC0
ausgeben. Vorhandener Fixture-Reader/Save/Media/IDB bleibt unverändert und
wird für diese Links nicht als funktionierender Echtdaten-Volltextreader
vorgegeben. Späterer eigener realer Reader-/Releasevertrag bleibt erforderlich.

## Schema, Identität und Datenschutz

Neuer isolierter Contentsubpath mobile-content-directory-v1 unter
packages/content-contracts/src/directory/. Kein Umbau des lokalen Fixture-
Manifests: dessen sourceKind erlaubt ausdrücklich nur selbst erstellte Fixtures.
Zwei Rohsnapshotherkünfte und zusätzliche redaktionelle Auswahl werden
pro Datensatz geführt: repo/commit/path/inputSHA256/observedAt/sourceDate.
Registry-Endpunkte nach canonicalUrl zuordnen; historische aktive Status-
angaben nicht als neue Prüfung zeigen. Überlappende Metadatenbeobachtungen
erhalten, keine verdeckte Prioritätsfusion. Newsidentität aus link, niemals
aus veränderlichem Titel. Neue deterministische IDs per SHA256 der versioniert
normalisierten URL; Rohlink und alle Ursprünge bleiben in Importreconciliation.
Endpointnorm: URL-Parser-Serialisierung, kein www-/Hostaliasraten, Query erhalten.
Newsnorm: Fragment und ausschließlich utm_*-Trackingparameter entfernen;
übrige Querys bleiben identitätsbestimmend. Normalisierungskollisionen
explizit als gleiche URL mit mehreren Beobachtungen zählen, nicht verlieren.

Produktdaten nur Titel/Name/Sprachcode/Publikationsdatum/sichere Quell- und
Originalverweise sowie übernommene nichtpersonenbezogene Themenmetadaten.
Keine Bilder/Content/Änderungshistorien mit Drittvolltext/Personenprofile.
Rechte pro Sammlung: metadata-and-links; Sporthinweistext ausdrücklich
wrn-editorial-reading-note, Quellen-/Autor-/Originaltitelattribution getrennt.
Ein link-only Artikel darf nicht als lokal vollständiger Artikel bezeichnet
werden. Fremdpolitische Zuschreibungen nicht aus Schlagwörtern neu generieren.

Rohinputs jeweils4MiB vor JSONparse; Runtimegesamt3MiB vor Ausgabe/Nutzung,
max2000 Endpunkte/2000 News/50 Sporthinweise, keine doppelten IDs, Arrays100,
Titel/Name500, Hinweis2000, Plaintext ohneHTML/Kontrollzeichen. Newsdate parse
in kanonisches UTC oder null mit sichtbarem unbekannt-Status, kein Date.now-
Ersatz für fehlende Publikationszeit. Beobachtungszeit stets echt/gebunden.
HTTPS-URLs ohne Credentials/IP/privateHosts/Whitespace/Steuerzeichen. Alte
HTTP-Endpunkte bleiben als nichtklickbare historische Adresse im Verzeichnis
mit reason=insecure-url; kein blindes Upgrade. Unzulässige Schemes bleiben
nur im Import-Abweichungsbeleg, niemals im Runtimehref. Fehlende/ungültige
Links/Metadaten werden mit Zählung/Grund abgewiesen; kein stiller Datenverlust.
Schema ungültig bedeutet Fehler/Retry, kein teilweise ungeprüfter Fallback.

Rücknahme getrennte endpointIds/articleIds; Rohschema prüfen, dann Quelle
oder Artikel einschließlich Sportbeziehung entfernen, resultierende Referenzen
geschlossen halten. Ephemere Suche/Filter, keine Telemetrie/Standort/Persistenz.
Externe Links nur Click,noopener/noreferrer/referrerPolicy=no-referrer,
kein Prefetch/HEAD/Remoteimage. Lazy Route/Daten getrennt und Erfolgs-Cache;
Reject/Retry/Unmountgeneration und Shell-Retry wie Knowledgevertrag. Offline-
Aussage nur laufende Shell, geladene Metadaten lesbar, Original benötigtNetz.

## Integration und Allowlist für den späteren Writer

Featurepfade:
- packages/content-contracts/src/directory/mobile-content-directory-v1.ts
- packages/content-contracts/src/directory/mobile-content-directory-v1.test.ts
- tools/directory/import-content-directory.mjs
- tools/directory/import-content-directory.test.mjs
- apps/mobile/src/features/directory/MobileContentDirectoryRoute.tsx
- apps/mobile/src/features/directory/MobileContentDirectoryRoute.test.tsx
- apps/mobile/src/features/directory/directory-loader.ts
- apps/mobile/src/features/directory/directory-loader.test.ts
- apps/mobile/src/features/directory/directory-copy.ts
- apps/mobile/src/features/directory/directory-copy.test.ts
- apps/mobile/src/features/directory/directory-navigation.ts
- apps/mobile/src/features/directory/directory-navigation.test.ts
- apps/mobile/src/features/directory/directory.css
- apps/mobile/src/features/directory/data/content-directory-v1.json
- tests/e2e/directory/mobile-content-directory.spec.ts
- docs/evidence/WRN-CONTENT-DIRECTORY-IMPLEMENTATION-2026-09-09.md
- docs/handoffs/WRN-CONTENT-DIRECTORY-IMPLEMENTATION-2026-09-09.md

Nur Chief nach Ende vorheriger gemeinsamer Writer:
packages/content-contracts/package.json (neuer Export), App.tsx/App.test.tsx
(mobile Unterrouten #discover/news, #discover/sources, #discover/sport;
parse/render/history/Fokus/Guard/Suspense). Keine Erweiterung gemeinsamer
NavigationTargetId/Website nötig: Hauptziel bleibt discover, lokale Unterroute
separat typisiert. Sichtbare Links aus Entdecken und Mehr, Sport aus Start
zur echten Auswahl. Keine andere Start-/Fixture-/Persistenzsemantik ändern.
Writer nicht allein; keine Kinder/Index/Git/Install/Provider/Remoteänderungen,
keine konkurrierenden App-/Packagewrites. E2Ebrowser exklusiv nach Reservierung.

## Abnahme

Reconciliation alle Inputs/Counts/Überlappungen/Rejectgründe,531/532 nicht
blind festschreiben falls URLnorm Kollisionsbeleg ergibt. IDs stabil trotz
Titel-/Statuswechsel; verschiedene bedeutungstragende Querys verschieden;
UTM/Fragmentgleichheit, Rohlinkzuordnung, historische Metadatensätze erhalten.
Content-/Bildfelder tatsächlich absent; keine kopierten ungeprüften Texte.
UnsichereURL/Schema/Größe/Datum/Rücknahmen negativ prüfen. Funktionale
Suche/Filter/Paginierung/Sportzuordnung/Quellenlinks, neunUI-Sprachen,
Keyboard/Axe/44px,320/390/768/1280/Themes mit Screenshots. Kein Fremdrequest
beim Aufruf/Suchen. Hash-/Backnavigation mit Support-Draft-Guard respektieren.
Passende Units/Browser,7Types,Build,scopedLint/Format,19Boundaries.
Danach unabhängige QA. Lokale Kandidatenrücknahme ohne Verlust von Nutzerdaten.
Keine Site-/Android-/Provider-/Releasefreigabe behaupten. Handoff END-CHECK: :).

## Reviewrouting nach tatsächlicher Runtimegrenze

Geplanter Sol-Followup UND einmaliger frischer Start wurden von der Runtime
mit agent thread limit reached abgewiesen. Kein Review durchgeführt, kein
GREEN. Keine weiteren Startversuche. Chief hält produktseitig gesperrt bis
unabhängiger Prüfung. Nach Fertigstellung des disjunkten Wissenspakets kann
bestehender Wissens-Terra im laufenden Einsatz diesen eng begrenzten
Metadatenvertrag read-only prüfen; Chief übernimmt selbst Architektur und
spätere Ausführung. Kein eigener Code wird dabei vom selben Autor unabhängig
freigegeben. Das einfache Link-/Snapshotmodul erfordert keinen neuen Provider,
keine Persistenz-/Releasemigration. Bei kritischem Befund Scope zunächst
korrigieren; kein Ersatz der getrennten echten Reader-/Releasegates.

## Ausführungsdisposition nach Prüfung und freien Writerrechten

Der bestehende Wissens-Terra hat diesen Vertrag unabhängig von Chief read-only
geprüft und ohne Restfindings GREEN bestätigt (Terra, ausdrücklich kein Sol).
Knowledge ist in1f003a2 gesichert; Supportwriter hat alle Produktrechte
abgegeben. Chief reserviert Slot1 knowledge_implementation Terra/high nun
für genau die oben aufgeführten Directory-Featurepfade und eigenen Belege.
Keine App-/Package-/ui-language-/Support-/Knowledgeänderungen, keine Kinder
oder Indexrechte. Chief übernimmt gemeinsame App-/Subpathintegration nach
Knowledge-QA-Browserende. Somit höchstens zwei Produktwriter.

Der Directorywriter ist nach Ausführung kein unabhängiger Reviewer seines
Codes. Die unabhängige Produkt-QA übernimmt danach der disjunkte Support-Terra
in eigenen DIRECTORY-INDEPENDENT-QA-Evidence/Handoffpfaden. Bestehender
Knowledge-Terra prüft Support separat, dessen Code er nicht geschrieben hat.
Keine Selbstabnahme, keine neue Runtimeinstanz nötig.

Bindend gilt die in f1c69cf unabhängig geprüfte tatsächliche Browsersemantik:
Routechunkfehler mit explizitem nutzergesteuertem Reload samt Hinweis auf
flüchtige Filter; Daten als lazy same-origin fetch mit credentials omit,
redirect error, Bytelimit vor JSONparse, Vertragsvalidierung, nur Erfolgcache.
Die zuvor beschriebene neue React.lazy-Instanz allein wäre keine Reparatur.
Rohfeeds vor Ausgabe vollständig reconciliieren: Chief fand in500Appnews
eine ungültigeURL und18HTTP, in500aktuellen7HTTP. URLunion vorHTTPSfilter998;
darauf keine behauptete999er Vollübernahme aufbauen. Alles abweisen mit
zählbaren Gründen, keine Volltext-/Bilddaten in Runtime. Die drei belegten
Sportverweise stehen im Quellenbeleg und sind sofort mit umzusetzen.

## Chief-Korrektur und QA-Übergabe am 9. September

Support ist in a2fb524 gesichert und durch den disjunkten Knowledge-Terra
unabhängig GREEN (22 Chrome, 36 PNG, 7 Contract, 4 Importer, 14 Mobile).
Knowledge bleibt unabhängig GREEN auf 1f003a2/ebd275f. Alle Featurewriter
haben ihre Rechte zurückgegeben. Chief ist alleiniger Directory- und
App-Integrator. Der Support-Terra bleibt unabhängiger Directory-Reviewer.
Browser43173–75 bei Chief bis Kandidatenübergabe, danach beim Reviewer.

Der Directory-Precheck fand sechs gebündelte Implementierungslücken:
Herkunft/Metadatenverlust, fehlende Quellenrücknahme-Kaskade, URLprüfung,
Größen-/Formgrenzen, Typen/Rechte und IDs/Reconciliation. Chief korrigiert
sie innerhalb derselben gebundenen Allowlist; keine neue Produktsemantik.
Direkte sourceHomepage-Angaben werden exakt gegen Registry-Homepage/URL
verbunden. Leere oder abweichende Homepages bleiben ausdrücklich unzugeordnet;
kein Namens-/Hostaliasraten. Rücknahme entfernt alle exakt zugeordneten
Artikel und Sportnotizen; unabhängige Sportnotizen haben eigene Quellbezüge.

Neuer kanonischer Import:973 News,532 Quellenadressen,3 Sporthinweise,
1952616 Bytes. 328 Artikel haben eine exakte Quellenzuordnung,645 nicht.
Alle drei Sportnotizen sind je mit zwei vorhandenen Endpunkten verbunden;
zwei verweisen zusätzlich auf den übernommenen historischen Artikel.
Rohlinkunion999, sicher normalisierte URLunion vor HTTPS992: sechs alte
HTTP-Links enthalten zusätzlich unzulässige URLbestandteile. Die vorherige
998er Zahl war nur Parser-Erreichbarkeit, nicht die neue strikte Zulässigkeit.
Abweisungen App:7 URL,12 HTTP; GitHub:7 HTTP. Keine Metadaten-Rejects.
Alle923 Registrybeobachtungen bleiben auf532 Endpunkten erhalten;391
Überlappungen,10 eindeutige HTTP-Endpunkte. Frühere19 zählte Beobachtungen.

Keine PO-Sichtabnahme behaupten: PO kann frühere lokale Artefakte nicht sehen
und hat die Umsetzung ausdrücklich fortgesetzt. Laufende Vorschau43176 plus
sichtbare Browseransicht/Inlinebeleg am Abschluss anbieten; kein Deployment.

Chief-Abschluss:450Mobile,44Contract,5Importer,7Types,19Boundarytests,
22Chrome/54PNG plus4abschließendeBrowser nach Hashidentitätsprüfung PASS.
AssetSHA2561f017b98721e18a863635d8c4783889f6724aa3a46d4523e65ddb85b871258a1.
Nach diesem Kandidatencommit keine Produktrechte bei Root oder anderemWriter.
Support-Terra erhält Browser43173–75 exklusiv und prüft den konkreten Commit
unabhängig; ausschließlich docs/evidence/WRN-CONTENT-DIRECTORY-INDEPENDENT-QA-2026-09-09.md
und docs/handoffs/WRN-CONTENT-DIRECTORY-INDEPENDENT-QA-2026-09-09.md als eigene
Schreibpfade. Sechs Precheckbefunde, geschlossene Rücknahme, Identitätsprüfung,
UI/Guard/Retry,54PNGs und bekannte globale16Baseline-Imports getrennt bewerten.
Keine Kinder/Produkt-/Index-/Installationsrechte. Befunde an Chief; nicht selbst
ändern. Nur neue echte Befunde lösen enge Rootkorrekturen aus.
