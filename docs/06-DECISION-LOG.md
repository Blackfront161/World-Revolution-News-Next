# Decision Log

Stand: 31. August 2026
Regel: `ACCEPTED` benoetigt den genannten Entscheidungseigner. G2-Empfehlungen
bleiben `PROPOSED`, bis der Product Owner sie dokumentiert bestaetigt.

## Neueste G3-015-Sichtentscheidung vom 30. August 2026

- **PO-079 ACCEPTED-G3-015-V3-R4-VISUAL:** Der Product Owner akzeptierte
  exakt mit `G3-015 V3-R4 VISUELL AKZEPTIERT` den lokalen Website-
  Sichtkandidaten `8df7b5c` und die gebundene GREEN-Evidence `fb54d27`.
  Damit ist die lokale visuelle Abnahme von G3-015 einschliesslich der
  Pink-Klick-/Auswahlzustaende geschlossen. Diese Abnahme startet keinen
  Folgeslice und erteilt keine Hosting-, Live-, Mobile-, Android-,
  Google-Play-, Signierungs-, Upload-, Deployment- oder Releasefreigabe.
  Bestehende Livewebsite, App, AAB und Legacyprojekt bleiben unveraendert.

## Neueste lokale Fortsetzungsentscheidung vom 30. August 2026

- **PO-080 ACCEPTED-LOCAL-READINESS-CONTINUATION:** Mit exakt
  `ok arbeite soweit als möglich durch.` beauftragt der Product Owner nach
  PO-079 die weitere sichere lokale Arbeit bis zum naechsten echten externen
  Freigabepunkt. Autorisiert sind Statusabgleich, reproduzierbarer lokaler
  Probe-Build, Tests, Hash-/Paketbindung und unabhaengige lokale Kontrolle
  gemaess `WRN-WEB-ANALYSIS-007-LOCAL-DELIVERY-READINESS.md`. Nicht autorisiert
  sind eine erfundene reale Origin oder Canonicalentscheidung, Hosting-/DNS-
  Mutation, Upload, Liveschaltung, neue Kosten sowie Mobile-, Android-,
  Google-Play-, Signierungs-, Deployment- oder Releaseaktionen.

## Neue Produktoberflaechen-Roadmap vom 30. August 2026

- **PO-081 ACCEPTED-PRODUCT-SURFACE-ROADMAP:** Der Product Owner verlangt,
  die professionell ausgearbeitete Start-, Personalisierungs-, Entdecken-,
  Reader-, Termine- und Medienstruktur in die neue App zu uebernehmen. Der
  anonyme Start erhaelt Aufmacher plus fuenf kompakte Hauptmeldungen; schwache
  Zwischenmodule werden bis zu ihrer Reife ausgeblendet. Danach und vor den
  kommenden Terminen steht `Sport & Fankultur` mit einem grossen und zwei
  kleinen bildgestuetzten Beitraegen, klaren Kategorien, Link zu allen
  Sportmeldungen, ohne horizontales Scrollen oder Aufmacherdublette und mit
  ehrlichem Aktualitaets-/Leerzustand. Kanonische Taxonomie:
  `Sport > Fussball > Ultras/Fankultur`; globale, mehrsprachige, Frauen-/
  feministische und belastbar belegte bewegungsnahe Perspektiven folgen den
  bereits gebundenen neutralen Verifikations-, Datenschutz- und
  Diskriminierungsregeln.
- **Weitere gebundene Ziele:** `Fuer mich` wird die zentrale rein lokale
  Personalisierungsseite; Entdecken wird auf seinem vorhandenen Such-/
  Filterkern kompakter; der Reader erhaelt semantisch platzierte Originalbilder,
  Absatz-/Anhangbereinigung, Inline-Abschnittsuebersetzung und korrekte
  Ruecknavigation; Termine werden `Kontinent > Land > Region` mit fuenf
  kommenden Eintraegen; Medien/Podcasts werden aktualisierbar und
  uebersichtlich. Die Startseite muss vollstaendig in der gewaehlten
  UI-Sprache erscheinen.
- **Sequenz und Grenze:** Vorbereitung als `WRN-G3-016` bis `WRN-G3-021`.
  Diese Entscheidung erlaubt jetzt die Dokument-/Vertragsvorbereitung, aber
  noch keinen Produktcode oder echten Inhalts-/Quellenimport. Jeder Slice
  benoetigt sein eigenes sichtbares `START`-Gate und sequenzielle Writer-/
  Reviewrechte. App und Website bleiben getrennte Projektionen. Bestehende
  Live-App, Website, AAB und Legacyrepo bleiben unveraendert; Hosting, Live,
  Android, Signierung, Google Play, neue Kosten und Release bleiben gesperrt.

- **PO-082 START-WRN-G3-016:** Der Product Owner erteilte exakt
  `START WRN-G3-016`. Autorisiert ist ausschliesslich der vorbereitete erste
  PO-081-Slice: zuerst unabhaengiger Architektur-/Vertrags-Precheck; bei GREEN
  Schema-, Admission- und selbst erstellter Fixturevertrag; danach die
  getrennte App-Frontendprojektion und unabhaengige Visual-/A11y-/Security-/
  Architektur-QA. Enge, nachgewiesene Korrekturen innerhalb dieses Vertrags
  duerfen mit frischer Nachpruefung abgeschlossen werden. Echte Sportinhalte,
  Quellenrecherche und politische/redaktionelle Klassifikation bleiben bis
  `START WRN-CONTENT-SPORT-001` gesperrt. Websiteprodukt, Live-/Legacy-App,
  AAB, Hosting, Android, Google Play, neue Dependencies/Kosten und Release
  bleiben ausserhalb dieses Starts.
- **G3-016-P2 Chief-Disposition:** Der additive Mobile-Homevertrag und die
  atomare Neunerfixture sind nach P2-R1 im erlaubten Scope GREEN. Neun aktive
  IDs sind erforderlich, weil der bestehende Domainvertrag Feed und Payload
  als exakte Menge bindet; P3 projiziert daraus die sichtbaren Home-Rollen.
  Drei Website-Brand/Header-REDs ohne Website-Diff bleiben ein separater
  Bestandsbefund und erlauben keine Websitekorrektur, blockieren aber nicht
  den isolierten Mobile-P2-Abschluss.
- **G3-016 Sportlink-Ziel:** `Alle Sportmeldungen` darf nicht unbemerkt den
  ungefilterten Discover-Hub oeffnen. Ohne G3-018 vorzuziehen, erhalten nur
  die drei selbst erstellten Sportfixtures neutrale lokale Testthemen. P3
  oeffnet damit den schon vorhandenen Discoverfilter `Sport`; echte Inhalte,
  redaktionelle Klassifikation und neuer Filtervertrag bleiben gesperrt.
- **G3-016 P3-Kandidat:** `4113a72` implementiert ausschliesslich die lokale
  Mobile-Home-/Sportprojektion. P3-R1 schliesst die Sichtbelegluecke der
  internen Scrollflaeche; P3-R2 den ungueltigen Ready-/Primaerrollenfall.
  Technisches P3-GREEN startet weder P4 automatisch noch PO-, Live-, Android-
  oder Releasefreigabe.
- **G3-016 P5-M-001-Kompatibilitaet:** Der erste P5-Abschluss reproduziert
  einen Fehler fuer bereits validierte Vor-G3-016-Offline-/Rollbackmanifeste,
  die den bewusst optionalen Homevertrag noch nicht besitzen. Als engste
  datenverlustfreie und rueckwaertskompatible Regel zeigt Mobile fuer exakt
  diesen Abwesenheitsfall eine getrennte Legacy-Liste der bereits validierten
  Artikel in bestehender Reihenfolge. Sie erfindet keine Aufmacher-, Haupt-
  oder Sportrollen. Ein vorhandener, aber ungueltiger Homevertrag bleibt
  fail-closed. Erst Korrektur, unabhaengige Offline-/Rollback-Re-QA, enger
  Security-Deltacheck und frischer P5-Recheck duerfen das RED schliessen.
- **G3-016 technischer Abschluss:** Der Legacy-Fix `e320de0`, die unabhaengige
  Re-QA `6721f83`, der versiegelte Security-Deltacheck
  `4c416926-2a45-43a6-9ff7-9659133aa536` und P5-R1 `b3c07e4` sind GREEN.
  P5-M-001 ist geschlossen; keine neuen Findings. Dies erteilt nur technische
  Bereitschaft zur lokalen PO-Sichtabnahme, keine automatische sichtbare
  Abnahme und keine G3-017-/Live-/Android-/Releasefreigabe.
- **PO-083 G3-016-VISUAL-ACCEPTED:** Der Product Owner erteilte am
  30. August 2026 exakt `G3-016 VISUELL AKZEPTIERT`. Damit ist der technisch
  GREENe G3-016-Slice sichtbar akzeptiert und geschlossen. Dies startet weder
  G3-017 noch echte Inhalte, Website, Hosting/Live, Android/AAB/Play oder
  Release.
- **PO-084 ERWEITERTE PARALLELISIERUNG:** Der Product Owner erlaubt fuer
  kommende Pakete ausdruecklich mehr gleichzeitige Agentenarbeit. Innerhalb
  der Runtime darf der Chief bis zu drei Subagenten zentral reservieren, wenn
  ihre Scopes, Dateien und Vertraege unabhaengig sind. Maximal zwei duerfen
  gleichzeitig disjunkten Produktcode schreiben; Slot drei bleibt fuer
  read-only Analyse, QA, Security, Dokumentation oder disjunkte Testevidenz.
  Ein Schreiber pro Datei/Vertrag, eingefrorene Reviewcommits, Taskgates und
  Integrationsrechecks bleiben zwingend.
- **PO-085 BEWUSSTES MODELLROUTING:** Der Product Owner verlangt, Sol, Terra
  und Luna je nach Risiko sinnvoll zu kombinieren. Sol ist fuer Architektur,
  Security, schwierige Incidents und kritische Gates; Terra fuer regulaere
  Implementierung, Integration und QA; Luna fuer kostenguenstige read-only
  Inventare, Dokumentation, Evidenz- und Kontinuitaetsabgleiche. Spark bleibt
  fuer winzige mechanische Tasks bevorzugt, wenn sein getrenntes Kontingent
  verfuegbar ist. Der Chief startet nicht drei teure gleichartige Agenten,
  wenn eine gemischte Besetzung dieselbe Sicherheit guenstiger erreicht.
- **PO-086 START-WRN-G3-017:** Der Product Owner erteilte am 30. August 2026
  exakt `START WRN-G3-017`. Autorisiert ist der vorbereitete rein lokale
  Personalisierungshub `Fuer mich`: explizite Auswahl von Interessen,
  Regionen und Sprachen; versionierte datensparsame Speicherung; vollstaendige
  Loeschung; atomare/idempotente Migration und bytegleicher read-only Schutz
  unbekannter Zukunftsversionen. Zuerst laufen Luna-Kontinuitaetsinventar,
  Terra-Technikmapping und Sol-Architektur-/Privacy-Precheck parallel und
  produkt-read-only. Erst nach Chief-Synthese folgen sequenziell Backend/
  Persistenz und Frontend, danach unabhaengige QA/Security/Architektur.
  Startseite G3-016 bleibt anonym; Reading-State darf nicht still zu
  Interessen umgedeutet werden. Serverprofil, Tracking, Website-Sync,
  Provider, Live, Android/AAB/Play und Release bleiben OUT.
- **G3-017 P1-CHIEF-SYNTHESE:** Luna/Terra sind GREEN; Sol ist YELLOW/pass
  conditional mit drei Medium-Vertragsluecken. Der Chief bindet B-01 bis B-14
  konservativ: ein Mobilekey, keine V0-/Reading-/Theme-/Sprachmigration,
  Dokumentexistenz erst nach expliziter Aktivierung, geschlossene IDs und
  kleine Caps, Future/Corrupt bytegleich read-only sowie bestaetigte opake
  Voll-Loeschung mit Readback. Matching bleibt lokal, deterministisch,
  ranglos und nutzt nur validierte aktive Artikel. Vor P2-Implementierung
  pruefen Sol und Luna den schriftlichen Vertrag unabhaengig.
- **G3-017 P1-RS-DISPOSITION:** Luna bewertet Traceability/Kosten GREEN. Sol
  sperrt P2 YELLOW, weil ein stale Save ohne gebundene Ausgangsvorbedingung
  einen neueren oder Future-Rawwert ueberschreiben und danach den eigenen Wert
  als Erfolg lesen koennte; ausserdem war B-12 nur geerbt. Der Chief bindet
  erwarteten Load-Rawwert, unmittelbaren bytegleichen Pre-Read, invalidierendes
  `storage`-Konfliktsignal, exakten Post-Readback, vier Konflikt-/Fehlertests
  und statischen No-Request-/No-Logging-Nachweis. Die fehlende echte
  Mehrtabtransaktion von `localStorage` bleibt transparent; keine Lock-/Sync-
  oder IndexedDB-Ausweitung. Vor P2 ist ein enger frischer Sol-Recheck Pflicht.
- **G3-017 P1-RS-R1 GREEN:** Sol bestaetigt auf `cdc95fc` M-001 und L-001 als
  vollstaendig geschlossen. Zusammen mit dem separaten Luna-GREEN ist der
  schriftliche P2-Vertrag startbereit. Genau ein Terra/high-Backendwriter darf
  nun innerhalb der sechs gebundenen Quell-/Testpfade implementieren; P3,
  Website, echte Inhalte und alle externen Gates bleiben gesperrt.
- **G3-017 P2 GREEN:** Kandidat `2a00974` implementiert den gebundenen
  Ein-Key-Vertrag, reine OR-/AND-Projektion und fail-closed Mobileadapter.
  Chief und unabhängige Terra-QA reproduzieren 36 Contract-, 36 Domain- und
  82 Mobiletests, drei Typechecks, Lint, beide Builds und 19 Boundaries.
  Luna bestätigt exakt acht erlaubte Diffpfade. Sol-Securityscan
  `28e475fb-ff2b-4185-b004-0c1e1a5c7b1d` schließt neun Oberflächen mit null
  Findings/deferred. P3 wird ausschließlich nach
  `WRN-G3-017-P3-FRONTEND-PACKET.md` disponiert; P2, Website und externe Gates
  bleiben read-only/gesperrt.
- **G3-017 P3/P4 TECHNICAL GREEN:** Der mobile `Fuer mich`-Hub wurde in
  `8efa7e4` integriert. Der erste Architekturabschluss meldete genau
  `P4-A-M-001`: passende lokale Artikel fehlten im Offline-Hub. Die enge
  Korrektur `73215b1` bindet die Projektion an vorhandenen validierten Inhalt
  statt an den Ready-Netzzustand; echter No-match bleibt unveraendert ehrlich.
  P4-Q-R2 bestaetigt 95 Mobile-, 20 Foundation- und zwei Visualtests sowie 25
  unabhaengige PNGs. Der versiegelte P4-S-R1-Scan
  `0b0645db-0200-462f-9296-08de8133eea4` deckt 31/31 Diffpfade mit null
  reportable/deferred Findings ab. P4-A-R1 ist mit null Findings GREEN. Der
  Slice ist technisch fuer die lokale PO-Sichtabnahme bereit, aber noch nicht
  sichtbar akzeptiert; Website, Live, Android/AAB/Play und Release bleiben OUT.
- **PO-089 G3-017 VISUAL ACCEPTED:** Der Product Owner akzeptierte am
  31. August 2026 mit exakt `G3-017 VISUELL AKZEPTIERT` den lokalen
  Produktkandidaten `73215b1`, die unabhaengige Terra-QA, den versiegelten
  Sol-Securityscan `0b0645db-0200-462f-9296-08de8133eea4` und den finalen
  Sol-Architekturabschluss sichtbar. G3-017 ist geschlossen. Diese Abnahme
  startet keinen Folgeslice und gibt weder Website/Hosting/Live noch
  Android/AAB/Play, Signierung, Upload oder Release frei.
- **PO-090 G3-018 PRESTART CONTINUE:** Mit `fortfahren` erlaubt der Product
  Owner am 31. August 2026 die sichere Dokument-/Inventarvorbereitung des
  naechsten Roadmapslices. WRN-G3-018 wird Mobile/App-only gebunden; der
  bestehende lokale Such-/Filtervertrag bleibt eingefroren. Ziel sind
  kompaktere Informationsarchitektur, zugaengliche Filteroffenlegung,
  kompaktere Karten und responsive/A11y-Evidence. Diese Nachricht ersetzt
  nicht das im Brief erforderliche exakte `START WRN-G3-018`; daher starten
  weder Agenten noch Produkt-/Test-/Build-/Browserarbeit. Website, Backend,
  Fixtures, Daten, Dependencies, Live, Android/AAB/Play und Release bleiben OUT.
- **PO-091 START-WRN-G3-018:** Der Product Owner erteilt am 31. August 2026
  exakt `START WRN-G3-018`. Autorisiert ist ausschliesslich der gebundene
  Mobile/App-only-Discover-UX-Slice mit unveraendertem lokalem Such-/
  Filtervertrag. Zuerst laeuft ein unabhaengiger Sol-Architektur-/
  Vertragsreview; Produktwrite ist erst nach dessen gesichertem GREEN erlaubt.
  Danach folgen sequenziell ein Terra-Frontend-Brand-Writer, unabhaengige
  Terra-QA, Sol-Security und finaler Sol-Architekturreview. Website, Backend,
  Contracts, Fixtures, Daten/Content, Dependencies/Kosten, Hosting/Live,
  Android/AAB/Play, Signierung, Upload und Release bleiben OUT.
- **G3-018 P1 GREEN:** Der unabhaengige Sol-Architektur-/Vertragsreview auf
  `7a25694` endet mit null Findings. P2 ist mit exakter Mobile-Allowlist,
  nativer `details`/`summary`-Filteroffenlegung, umfassend fluechtigen
  Kriterien, deterministischem Fokus, unveraenderten Offline-/Reader-/Save-
  Grenzen und verbindlicher neunsprachiger Responsive-/A11y-Matrix gebunden.
  Genau ein Terra/high-Frontend-Brand-Writer darf jetzt P2 umsetzen; Website,
  Domain/Contentvertraege, Fixtures, Dependencies und externe Gates bleiben
  read-only/OUT.
- **G3-018 P2 WRITER GREEN:** Der Mobile-Discover-Kandidat `fd3b0f9` setzt
  native Filteroffenlegung, sichtbare aktive Kriterien/Reset,
  deterministischen Fokus und kompakte Karten innerhalb der exakten Allowlist
  um. Ein unvollstaendiger erster Terra-Lauf wurde ohne parallele Schreiber
  durch einen frischen Terra-Abschlussowner fortgesetzt. Chief reproduziert
  mit Node 24.19 96 Mobile- und 5 Sprachtests sowie beide Typechecks. 26
  Writerbilder sind unter
  `bec5130d1f414c15e11e064e1c95f1cebd029e42490f03028b8533617739e7d0`
  gebunden. Die unabhaengige P3-QA korrigiert die Writer-Harnessbehauptung:
  Der korrekt parametrisierte offizielle Playwrightlauf besteht mit 9 Mobile-
  PASS, 12 erwarteten Website-Skips und null Fehlern. Funktion, Privacy, A11y
  und 27 eigene QA-Bilder sind GREEN. P3 ist nur durch `P3-QA-L-001` YELLOW:
  zwei abschliessende Leerzeichen im Writer-Manifest. Chief korrigiert nur
  diesen Dokumentpunkt und die ueberholte Harnessaussage; danach enger
  Dokumentrecheck, keine Produkt-/Testmutation.
- **G3-018 TECHNICAL GREEN:** P3-R1 schliesst `P3-QA-L-001`; Produkt und
  Bestandstests bleiben seit `fd3b0f9` unveraendert. Der versiegelte P4-S-
  Securityscan `e52275b4-ce9c-42db-a144-204f638ad833` accountiert alle 42
  Diffpfade und endet mit null reportable/deferred Findings. P4-A bestaetigt
  den Mobile-only-Vertrag, die Domain-/Offline-/Reader-/Save-/Privacygrenzen,
  neun Sprachen und die gesamte QA-Kette mit null Findings. G3-018 ist damit
  technisch bereit fuer die lokale visuelle PO-Abnahme, aber noch nicht
  sichtbar akzeptiert. Kein Folgeslice und kein externes Gate startet daraus.
- **PO-093 G3-018 VISUAL ACCEPTED:** Der Product Owner akzeptiert am
  31. August 2026 mit exakt `G3-018 VISUELL AKZEPTIERT` den lokalen Mobile-
  Produktkandidaten `fd3b0f9`. Die sichtbare Abnahme bindet die unabhaengige
  P3-/P3-R1-QA, den versiegelten P4-S-Scan
  `e52275b4-ce9c-42db-a144-204f638ad833` und den finalen P4-A-Abschluss.
  G3-018 ist damit geschlossen. Diese Entscheidung startet G3-019 nicht und
  erteilt keine Website-, Hosting-, Live-, Content-, Android-, AAB-, Google-
  Play-, Signierungs-, Upload-, Deployment- oder Releasefreigabe.
- **PO-094 PREPARE-WRN-G3-019:** Der Product Owner erteilt exakt
  `BEREITE WRN-G3-019 VOR` und fragt nach weiterer sicherer Vorbereitung.
  Autorisiert sind ausschliesslich Readerinventar, Architektur-/Privacy-/
  Rechtevertrag, Test-/Delegationsplanung sowie kollisionsfreie
  Abhaengigkeitsnotizen fuer G3-020/021. Der gemeinsame Reader-v1-Vertrag
  bleibt unveraendert; vorbereitet wird ein optionales snapshotgebundenes
  Mobile-v2-Sidecar mit v1-Fallback. Im Slice sind nur selbst erstellte lokale
  Bilder und Uebersetzungsfixtures oder ehrliche Placeholder erlaubt. Kein
  Remoteprovider, keine Quellenrecherche/-Admission, kein Produkt-/Testcode,
  keine Website-/Live-/Android-/Releasearbeit. Ein unabhaengiger
  Dokumentrecheck muss GREEN sein; Produktarbeit benoetigt danach weiterhin
  exakt `START WRN-G3-019`.
- **G3-019 PRESTART DOCUMENT GREEN:** Der unabhaengige Luna-P0-R-Recheck auf
  `c0d8d06` bestaetigt alle sechs Sol-P0-A-Bedingungen als operationalisiert:
  Mobile-Sidecar/v1-Fallback, stabile Abschnitte, Bildrechte/Takedown, lokale
  0-Kosten-Uebersetzung, Back/Offline/Save und vollstaendige Definition of
  Ready. `fd3b0f9..c0d8d06` enthaelt keine Produkt-, Test-, Fixture-,
  Dependency- oder Paketdatei. Das Dokumentpaket ist startbereit; G3-019 ist
  weiterhin nicht gestartet und alle P1-bis-P5-/externen Rechte bleiben
  gesperrt.
- **PO-095 START-WRN-G3-019:** Der Product Owner erteilt am 31. August 2026
  exakt `START WRN-G3-019` und erlaubt zugleich die getrennte Vorbereitung
  weiterer Roadmapslices. Autorisiert ist fuer G3-019 zuerst ausschliesslich
  ein frischer unabhaengiger Sol-P1-Architektur-/Vertragsreview gegen den
  Dokument-GREENen Mobile-Sidecar-/v1-Fallback-Vertrag. Produkt-, Test-,
  Fixture- und Browserarbeit bleibt bis zu seinem gesicherten GREEN gesperrt.
  G3-020 und G3-021 duerfen nur read-only beziehungsweise dokumentarisch
  vorbereitet werden; diese Erlaubnis startet sie nicht. Website, Shared
  Reader v1, echte Inhalte/Quellen/Medien, Remoteprovider, neue Kosten,
  Hosting/Live, Android/AAB/Play, Signierung, Upload, Deployment und Release
  bleiben OUT.
- **PO-095 FOLLOW-UP PREPARATION BOUND:** Die erlaubte getrennte Vorbereitung
  ist fuer G3-020 und G3-021 dokumentiert. G3-020 bindet stabile Kontinent-/
  Land-/Region-IDs, hoechstens fuenf deterministisch kommende Termine,
  IANA-Zeitzonen, rein lokale Auswahl und null Geolocation. G3-021 bindet
  getrennte Media-, Admission-, Rechte-, Consent-, Player- und
  Revocationvertraege, No-Tracking und einen providerfreien lokalen
  Basisslice. Beide bleiben ohne ihr eigenes exaktes START sowie den sichtbaren
  Abschluss des jeweiligen Vorgaengers gesperrt. Ein Spark-Routineversuch war
  wegen des getrennten Kontingents nicht verfuegbar; Luna uebernahm die
  read-only Inventur ohne externe API-Kosten oder Produktmutation.
- **G3-019 P1 YELLOW / CONTRACT REMEDIATION:** Der unabhaengige Sol-P1-
  Architekturreview findet vier Medium-Vertragsluecken vor jedem Produktwrite:
  externer Whole-document-Pin, Exact-cover der autoritativen v1-Bloecke,
  monotone Medien-Sperre ueber A/B/A/Neustart und numerisch testbare Caps.
  C-01 bis C-20 und eine exakte P2-Allowlist sind im P2-Backendpaket
  dokumentarisch gebunden. P2 bleibt bis zum gesicherten GREEN eines frischen
  unabhaengigen P1-R-Rechecks gesperrt. Daraus folgt kein Produkt-, Test-,
  Fixture-, Browser-, Provider- oder externes Recht.
- **G3-019 P1-R GREEN / P2 WRITER GATE:** Ein frischer unabhaengiger Sol-
  Recheck bestaetigt auf `12d208c` C-01 bis C-20, die exakte Allowlist, alle
  vier Boundary-Hashes und null Produkt-/Testdelta gegen `fd3b0f9`; keine
  neuen Findings. Genau ein Terra/high-Backend-/Data-Writer darf P2 nun nach
  dem gebundenen Paket bearbeiten. P3, Browser/Visual, Shared Reader v1,
  Website, echte Inhalte/Medien, Provider, Dependencies und externe Gates
  bleiben gesperrt.
- **G3-019 P2 YELLOW / R1 CORRECTION:** Der P2-Writerkandidat `d47ef47`
  besteht zwei Typechecks und 13 fokussierte Units. Unabhaengige QA findet
  drei Medium-Vertragsluecken bei Pinrevision, fail-closed Medienrechten/
  lokaler Assetbindung und vollstaendigen C-13-Caps/Grenztests sowie ein
  Format-Low. Der Sol-Securityscan
  `7269a526-96f6-4a7f-8ffd-e6dbd2c78e08` ist GREEN mit null
  reportable/deferred Findings, bestaetigt aber die drei Mediums als P3-
  Blocker. Genau ein frischer Terra/high-Writer darf die enge P2-R1-Allowlist
  bearbeiten; danach sind frische QA und Security-Deltacheck Pflicht. P3 und
  alle externen Gates bleiben gesperrt.
- **G3-019 P2-R1 YELLOW / R2 BOUNDARY EQUIVALENCE:** Der R1-Kandidat
  `a77d7b2` schliesst Revision, Medienrechte/lokale Asset-ID und Format;
  Securitydelta `d32e155a-b2fa-4517-b481-6d3b6da9163c` ist GREEN mit null
  Findings. Offen bleibt nur Boundary-Evidence. Transport-/Decoded-JSON-Cap
  sind beide 512 KiB; Pixelcap ist exakt `2048 ** 2`, wodurch isolierte
  nachgelagerte `+1`-Faelle unerreichbar sind. R2 bindet echte Loadertriple-
  Grenzen und Redundanzinvarianten ohne Produktcodeaenderung. Zuerst prueft ein
  frischer Sol-Architekturreview diese Disposition; P3 bleibt gesperrt.
- **G3-019 P2-R2 WRITER GREEN / INDEPENDENT REVIEWS:** Der frische Sol-
  Architekturprecheck ist GREEN. Der reine Testkandidat `d66ee6e` bindet den
  echten headerfreien Streamloader bei 512 KiB minus eins, gleich und plus
  eins, getrennte Dimensionsgrenzen sowie die mathematisch redundanten
  Decoded-/Pixelcaps ohne Produkt- oder Fixturedelta. Chief reproduziert 34
  Contract-, 21 Mobile- und 19 Boundarytests sowie beide Typechecks GREEN.
  Jetzt laufen ausschliesslich frische unabhaengige Terra-QA und ein Sol-
  Security-Deltacheck. P3 und alle externen Gates bleiben gesperrt.
- **G3-019 P2-R2 QA/SECURITY GREEN / COMPLETENESS AUDIT:** Die frische Terra-
  QA schliesst `P2-QA-M-003` mit null Findings. Der versiegelte Sol-Scan
  `7f12caab-ab2d-43a8-8037-45923fa1fb67` prueft 22/22 Delta- und drei
  unveraenderte Stuetzpfade mit null reportable/deferred Findings. Vor einem
  UI-Write prueft ein frischer Sol-Review nun ausschliesslich, ob der
  tatsaechliche P2-Vertrag den gesamten Produktbrief ausdruecken kann. P3,
  Produkt-/Testwrites und alle externen Gates bleiben bis zu dessen
  gesichertem Ergebnis und Chief-Abschluss gesperrt.
- **G3-019 P2-C YELLOW / R3 CONTRACT COMPLETION:** Der frische Sol-
  Vollstaendigkeitsaudit bestaetigt sechs Medium-Luecken zwischen Produktbrief
  und P2-Vertrag: Transformprovenienz, Block-ID-Eindeutigkeit,
  Vorgaengerrelation, Quellenprofil, Alttext/buildgebundener Assetresolver und
  Translation-Key/zwingender Staleschutz. Bestehende Back-/Offline-/Save-/
  Websitegrenzen bleiben unveraendert. Der Chief bindet den minimalen R3-
  Korrekturvertrag; ein frischer Sol-Recheck muss GREEN sein, bevor genau ein
  Terra/high-Writer Produkt oder Tests aendern darf. P3 bleibt gesperrt.
- **G3-019 P2-R3-R1 GREEN / CONTRACT WRITER:** Der erste R3-Recheck findet
  drei Medium-Praezisierungen fuer den kanonischen Snapshotkey,
  Vorgaengerexistenz und die MediaSafetyLoad-Matrix. Sie sind im Vertrag
  geschlossen; ein frischer Sol-R3-R1-Recheck endet mit null Findings. Genau
  ein Terra/high-Writer darf jetzt die sechs erlaubten Contract-, Adapter-,
  Fixture- und fokussierten Testpfade bearbeiten. P3 bleibt bis zu gesichertem
  Writerende, frischer QA/Security und Sol-Abschluss gesperrt.
- **G3-019 P2-R3 WRITER GREEN / INDEPENDENT REVIEWS:** Der Terra/high-Writer
  beendet die neun vertraglichen Korrekturen im Kandidaten `2a7d983` innerhalb
  der exakten Allowlist. Chief reproduziert 77 Contract-, 119 Mobile- und 19
  Boundarytests sowie beide Typechecks GREEN. Jetzt laufen frische Terra-QA
  und Sol-Security parallel; danach bleibt der finale Sol-Abschluss Pflicht.
  P3 und alle externen Gates sind weiter gesperrt.
- **G3-019 P2-R3 QA/SECURITY GREEN / R4 TEST GAP:** Terra-QA ist in
  `b2e71ad` mit null Findings GREEN. Der versiegelte Sol-Scan
  `da04a9c5-7d47-4e6b-9a8e-5fc2cd8f7fbf` deckt elf von elf R3-Diffpfaden ab
  und endet mit null Findings. Der finale Sol-P2-Review findet keinen
  Produkt-, Security-, Privacy-, Datenverlust- oder Kopplungsfehler, aber
  `P2-FINAL-M-001`: einzelne im Vertrag zugesagte Negativtests fehlen. Ein
  Spark-Mikrowriter ergaenzt sie test-only in `61b7c47`; Chief reproduziert
  mit exakt Node 24.19 80 Contract-, 119 Mobile- und 19 Boundarytests sowie
  beide Typechecks GREEN. Ein frischer Sol-Recheck prueft nun die Isolation
  jedes Falls. P3 bleibt bis zu dessen GREEN gesperrt.
- **G3-019 P2 FINAL GREEN / P3 WRITER GATE:** Der erste R4-Teststand war
  gekoppelt und wurde nicht als Abschluss akzeptiert. Die isolierte R4-R1-
  Matrix liegt in `182f519`; Chief und frische Terra-QA bestaetigen 80
  Contract-, 119 Mobile- und 19 Boundarytests sowie beide Typechecks mit
  exakt Node 24.19. Der finale Sol-P2-Abschluss `02ad040` schliesst alle neun
  Vertragsluecken und `P2-FINAL-M-001`. Zwei unabhaengige Sol-Rechecks haben
  den P3-Frontendvertrag nach enger Chief-Korrektur mit R2 `9e3d1e4` GREEN
  freigegeben. Genau ein Terra/high-Frontendwriter darf nun ausschliesslich
  die P3-Allowlist umsetzen. P2, Website, Shared Reader v1, echte Inhalte/
  Medien, Provider, Dependencies sowie Hosting/Live, Android/AAB/Play und
  Release bleiben read-only beziehungsweise gesperrt.
- **G3-019 P3 FAIL-CLOSED / P2-R5 PIN CORRECTION:** Der Terra-P3-Writer
  sichert WIP `6147b84`, stoppt jedoch ohne Umgehung: Der echte Browser bleibt
  auf Reader v1. Sol bestaetigt in `8588f38`, dass P2-Build-Pin und Sidecar
  den physischen Readerdetails-Dateibyteshash, den externen kanonischen
  Dokumenthash und den internen Integritaetshash falsch zuordnen. Dies ist
  `P3-PIN-M-001` plus fehlende Cross-Fixture-Regression `P3-PIN-L-001`, kein
  P3-Ableitungs- oder G3-016-Generatorfehler. Der Chief bindet eine minimale
  R5-Allowlist aus Sidecar, Build-Pin, dessen Test und eigener Evidence.
  Produktwrite bleibt bis zu frischem unabhaengigem Sol-Vertrags-GREEN
  gesperrt; danach bleiben QA, Securitydelta und Architekturabschluss Pflicht.
- **G3-019 P2-R5 GREEN / P3-R1 WRITER GATE:** Der enge Produktfix `6545b34`
  korrigiert die Pinsemantik und bindet den neuen Sidecar-Bytehash. Terra-QA
  `d4e390b` bestaetigt die reale nichtzirkulaere Cross-Fixture und alle
  fail-closed-Faelle. Der versiegelte Sol-Scan
  `337d0542-fd76-4224-ac25-3f756a5d8b9d` prueft die drei R5-Diffpfade plus
  die erstmals erreichbaren P3-UI-/Media-/Contractoberflaechen mit null
  reportable/deferred Findings. Der finale Sol-Abschluss `6d15a53` schliesst
  `P3-PIN-M-001`, `P3-PIN-L-001` und alle Precheckfindings. Ein frischer
  Terra/high-P3-R1-Writer darf den linearen WIP ohne Rebase fertigstellen;
  die Visualspec muss die neuen R5-Hashes binden und vollstaendig neu laufen.
- **G3-019 P5 RED / P3-R2 SNAPSHOT-FALLBACK:** P3-R1 `d987293`, P4-QA
  `0961463` und der versiegelte P4-S-Scan
  `5f6a6f14-44c1-4e8c-b73e-6fc4a74cc1fb` sind technisch GREEN. Der finale
  Sol-P5-Review `71fa38b` findet dennoch zwei Medium-Korrektheitsluecken:
  alter Sidecarstate ist beim synchronen Snapshotwechsel nicht renderseitig
  an B gebunden; `projection: rejected` zeigt weiterhin das v2-Quellenprofil.
  Der Chief bindet einen engen P3-R2-Vertrag. Vor frischem Sol-Precheck-GREEN
  besteht kein Produktwrite und keine lokale PO-Sichtfreigabe.
- **G3-019 P3-R2 UND P5-R1 TECHNISCH GREEN:** Der Sol-Precheck `480772d`
  ist GREEN. Der enge Produktfix `ab87da3` verhindert stale v2-Projektion bei
  synchronem Snapshotwechsel und erzwingt fuer `projection: rejected` den
  reinen v1-Fallback. Terra-QA `aca54d5` bestaetigt 61 fokussierte, 133
  Mobile-, 80 Contract- und 19 Boundarytests sowie beide Typechecks. Der
  versiegelte Sol-Security-Deltacheck `122593b`, Scan
  `3bec79c3-9fc4-431e-9b88-c291e3043d5e`, endet mit null reportable/deferred
  Findings. Der finale Sol-P5-R1-Abschluss `32bd06d` schliesst `P5-M-001` und
  `P5-M-002` ohne neue Findings. G3-019 ist technisch GREEN; R2 aendert kein
  CSS oder Layout, sodass die P4-Sichtbelege gueltig bleiben. Offen ist nur
  die lokale PO-Sichtkontrolle. Diese Entscheidung startet weder G3-020/021
  noch Website/Live, Android/AAB/Play, Signierung, Upload oder Release.
- **PO-097 G3-019 VISUELL AKZEPTIERT:** Der Product Owner akzeptiert am
  1. September 2026 mit exakt `G3-019 VISUELL AKZEPTIERT` den technisch
  GREENen Produktkandidaten `ab87da3`. G3-019 ist damit technisch und visuell
  abgeschlossen. Die anschliessende allgemeine Erlaubnis, direkt
  weiterzufahren, erlaubt sichere Abschluss-/Vorbereitungsarbeit, ersetzt
  aber nicht das fuer den naechsten Produktslice dokumentierte exakte Gate
  `START WRN-G3-020`. G3-020/021 sowie alle externen Gates bleiben bis zu
  ihren eigenen Freigaben gesperrt.
- **PO-098 START-WRN-G3-020:** Der Product Owner startet am 1. September 2026
  mit exakt `START WRN-G3-020` den Mobile-only Slice fuer regionale Termine.
  Autorisiert ist zuerst ausschliesslich ein frischer unabhaengiger Sol-
  Architektur-/Privacy-Precheck. Er prueft stabile Kontinent-/Land-/Region-
  IDs, Alias-/Nachfolgeregeln, Instant plus IANA-Zeitzone, DST-Gap/Fold,
  deterministisch hoechstens fuenf Termine, rein lokale Auswahl, null
  Geolocation, Offline/Last-known-good/Revocation, Rechte/Provenienz,
  Ressourcenlimits und eine exakte Test-/Writerfolge. Vor P1-GREEN bestehen
  keine Produkt-, Test-, Fixture- oder Browserrechte. Website, echte Quellen,
  Provider/Dependencies, Hosting/Live, Android/AAB/Play, Signierung, Upload,
  Release und G3-021 bleiben gesperrt.
- **G3-020 P1 YELLOW / P2-VERTRAGSKORREKTUR:** Der unabhaengige Sol-P1-
  Review `7793919` findet vier Medium-Vertragsblocker: Identitaets-/Zeit-/
  Totalordnungsregeln, atomarer Lifecycle plus getrennte lokale Auswahl,
  numerische Rechte-/Securitycaps und exakte Allowlist/Test-/Gatefolge. Der
  Chief bindet C-01 bis C-20, die additive Mobile-only P2-Allowlist, sieben
  Boundaryhashes und die Pflicht-Negativmatrix in
  `docs/tasks/WRN-G3-020-P2-BACKEND-PACKET.md`. Ein frischer unabhaengiger
  Sol-P1-R muss alle vier Findings mit null neuen Findings schliessen. Vorher
  besteht kein Produkt-, Test-, Fixture- oder Browserwrite.
- **G3-020 P1-R YELLOW / R1-VERTRAGSKORREKTUR:** Der frische Sol-Recheck
  `ab2644b` bestaetigt die Grundregeln, findet aber vier weitere Medium-
  Praezisierungen: Exact-key-/Taxonomie-/Freshnessschema, konkretes IDB-/Slot-/
  Future-Raw-Protokoll, maschinenpruefbare Rechte-/Medien-/Plain-text-Orakel
  sowie verpflichtende reale IDB- und einzeln disponierte Capbelege. Der Chief
  bindet sie in `docs/tasks/WRN-G3-020-P2-R1-CONTRACT-COMPLETION.md`. P2
  bleibt bis zu frischem unabhaengigem Sol-P1-R1-GREEN gesperrt.
- **G3-020 P1-R1 YELLOW / R2-FINALVERTRAG:** Der Recheck `24454ec` bestaetigt
  Rechte-/Text-/Medien-/Cap-/IDB-Belege, findet aber vier letzte Medium-
  Semantikfragen: Hashpraeimages und Bundlerevision, totale gemischte
  Freshnessprioritaet, Safetyhash/Merge plus vollstaendige Rollbackrotation
  sowie eine mit LocalStorage technisch nicht erreichbare starke CAS-Garantie.
  Der Chief bindet exakte Hash-/Pin-/Revisionregeln, Zustandsprioritaet,
  Safety-/Slottabellen und eine getrennte atomare Auswahl-IDB in
  `docs/tasks/WRN-G3-020-P2-R2-FINAL-CONTRACT.md`. P2 bleibt bis zu frischem
  unabhaengigem Sol-P1-R2-GREEN gesperrt.
- **G3-020 P1-R2 GREEN / P2-WRITERGATE:** Der finale unabhaengige Sol-Recheck
  `10615b1` schliesst `P1-R1-M-001` bis `P1-R1-M-004` und alle frueheren P1-
  Vertragsfindings mit null neuen Findings. Sieben Boundaryhashes stimmen;
  es existiert weiterhin kein Produkt-/Test-/Fixture-/Browserdelta. Genau ein
  `backend_data_reliability_engineer` Terra/high darf P2 nun innerhalb der
  unveraenderten dreizehnpfadigen Allowlist implementieren. P3, Website,
  echte Inhalte/Quellen, Provider/Dependencies und externe Gates bleiben
  gesperrt.
- **G3-020 P2-WRITERKANDIDAT / UNABHAENGIGE REVIEWS:** Der Terra/high-Writer
  beendet den additiven Mobile-only Daten-/Vertragskern in `cc800a2` innerhalb
  der dreizehnpfadigen Allowlist. Chief reproduziert mit Node 24.19 beide
  Typechecks, 5 Contract-, 4 Mobile-, 19 Boundary- und eine echte Browser-
  IDB-Pruefung sowie Releaseboundary GREEN. Sieben eingefrorene Boundaryhashes
  und der Fixturehash stimmen. Frische Terra-QA und Sol-Security/Privacy
  duerfen den eingefrorenen Kandidaten parallel pruefen; kein Produktwriter
  laeuft. P3 und alle OUT-/externen Bereiche bleiben gesperrt.
- **G3-020 P2 QA YELLOW / SECURITY RED / R1-KORREKTUR:** Terra-QA `8609bd7`
  findet falsche schema-geordnete Hashpraeimages, unvollstaendiges Safety-/
  Future-Fail-closed, fehlende Pflicht-Negativ-/IDB-Evidence und acht neue
  Lintfehler. Der versiegelte Sol-Scan
  `91a91209-61ee-4f54-b824-45183c355bc9` / `f4abec3` findet byteungenauen
  Transportpin, optional/ungebundenes Safety persist-before und fehlenden
  Replay-Schutz fuer Eventrevisionen; drei Medium, null deferred. Das QA-Low
  zum Register ist geschlossen, weil der Hunk aus Chief-Commit `cd08904`,
  nicht aus Writercommit `cc800a2` stammt. Der Chief bindet eine enge
  zwoelfpfadige P2-R1-Korrektur. Vor frischem Sol-Precheck-GREEN besteht kein
  Produktwrite; P3 bleibt gesperrt.
- **G3-020 P2-R1-PRECHECK GREEN / KORREKTURWRITERGATE:** Der frische Sol-
  Precheck `788b035` bestaetigt mit null Findings, dass der enge Vertrag alle
  QA-/Security-/Lintpunkte entscheidungsfrei bindet und die zwoelfpfadige
  Allowlist ausreicht. Genau ein frischer
  `backend_data_reliability_engineer` Terra/high darf P2-R1 nun innerhalb
  dieses Scopes korrigieren. P3 und alle OUT-/externen Gates bleiben gesperrt.
- **G3-020 P2-R1-WRITER / QA YELLOW / SECURITY RED:** Der Terra-Writer
  liefert Produkt `906ddc4` und Belege `a2b978c`; Chief reproduziert die
  komplette positive Matrix GREEN. Unabhaengige Terra-QA `08b2cba` findet
  `M-001/M-002`: fehlende Replacementreferenzvalidierung und unvollstaendige
  Pflicht-Negativ-/IDB-Belege. Der versiegelte Sol-Scan
  `872b4cf5-2ef7-467b-bfdf-9fabdcb4ff8a`, Commit `b799679`, meldet einen Low,
  null deferred und kein Privacyfinding: Der finale Safetymerge wird vor dem
  Write nicht auf 512 Entries/64 KiB begrenzt. Pin und Eventreplay sind
  geschlossen. P2/P3 bleiben fail-closed.
- **G3-020 P2-R3-DESIGN GREEN / VERTRAG GEBUNDEN:** Der unabhaengige Sol-
  Review `0108fc3` entscheidet gegen eine nur dreislotige Referenzpruefung und
  fuer einen im Safetyrecord hashgebundenen, monotonen Katalog aus maximal
  1.024 Namespace/ID-Referenzen. Finaler Mergecap gilt vor dem ersten Put;
  interne Safety-persist-before erhoeht Generation nicht, jede erfolgreiche
  oeffentliche Mutation insgesamt exakt um eins. Der Chief bindet Design,
  volle R1-05/R2-Matrix, zwoelfpfadige Allowlist und Gatefolge in
  `docs/tasks/WRN-G3-020-P2-R3-CORRECTION.md`. Vor frischem Sol-Precheck-GREEN
  besteht kein Produkt-/Testwrite.
- **G3-020 P2-R3-PRECHECK GREEN / WRITERGATE:** Der frische unabhaengige Sol-
  Precheck `219ae55` endet mit null Findings. Er bestaetigt Exact-Safetyrecord,
  Referenzprovenienz, erreichbare Count-/Bytegrenzen, persist-before,
  Generation, Rotation, A1/B2/A3/Rollback/Resurrection, echte IDB-Matrix,
  Allowlist und Gates. 11 Fokuspruefungen, beide Typechecks, Fixture plus
  sieben Boundaryhashes, Prettier und Diffcheck bestehen. Genau ein
  Terra/high-Backend-/Data-Writer darf separat innerhalb der zwoelf
  R3-Positionen aktiviert werden; P3 und OUT bleiben gesperrt.
- **G3-020 P2-R3-WRITER / SECURITY GREEN / QA YELLOW:** Der R3-Kandidat
  `4ec5fe6` und Writerbelege `b2e730d` binden den monotonen Referenzkatalog,
  Vorab-Caps und Generation. Chief reproduziert 87 Contract-, 138 Mobile-,
  drei echte IDB- und 19 Boundarytests GREEN. Der versiegelte Sol-Scan
  `2a13c8f3-4052-404c-8074-93e4e37e3bf0`, Commit `13bb86f`, schliesst den
  Merge-DoS mit null reportable/deferred und ohne Privacyfinding. Terra-QA
  `afd4c05` bleibt mit genau `P2-R3-QA-M-001` Medium YELLOW: Die explizite
  R3-05-/R1-05-/R2-Pflichtmatrix fehlt weitgehend. P2/P3 bleiben gesperrt.
- **G3-020 P2-R4 TEST-ONLY-VERTRAG / SPARK-TERRA-SPLIT:** Der Chief bindet
  `docs/tasks/WRN-G3-020-P2-R4-TEST-COMPLETION.md`. Produkt `4ec5fe6` bleibt
  bytegleich. Nach frischem Sol-Precheck-GREEN darf Spark nur die repetitive
  Contract-/Loadermatrix und Terra nur die komplexe echte IDB-/Rotation-/
  Failurematrix in disjunkten Pfaden schreiben. Reproduziert ein Test einen
  Produktfehler, stoppt der Writer; keine stillen Produktrechte. Danach sind
  neue QA, Security und finaler Sol-P2-Abschluss Pflicht.
- **G3-020 P2-R4-PRECHECK YELLOW / R4-R1-PRODUKTKORREKTUR:** Der frische Sol-
  Precheck `5b3ba82` bestaetigt Testsplit, Capgrenzen und deterministische
  test-only IDB-Fehlerinjektion, findet aber zwei Medium und ein Low. Activate
  mit niedrigerer Safetyrevision kann bei Coverage rotieren; gueltige gleiche
  Referencekeys werden vor der Union nicht dedupliziert; parallele Writer
  brauchen exklusive Stage+Commit-Serialisierung A, danach B. Der Chief bindet
  die zwei Produktursachen und drei echte IDB-Regressionen in
  `docs/tasks/WRN-G3-020-P2-R4-R1-PRODUCT-CORRECTION.md` und schaerft den R4-
  Commitablauf. Vor frischem Sol-Precheck-GREEN besteht kein Write.
- **G3-020 P2-R4-R1-PRECHECK GREEN / WRITERGATE:** Der frische Sol-Precheck
  `e40751d` endet mit null Findings. Operationstypisierte Lower-Semantik,
  Reference-Dedupe nach voller Zielvalidierung, Hash/Caps/Union, drei echte
  IDB-Regressionen, enge Fuenfpositionen-Allowlist und die spaetere exklusive
  A-dann-B-Commitsequenz sind vollstaendig gebunden. Genau ein Terra/high-
  Backend-/Data-Writer darf separat den Storefix umsetzen; R4-A/B bleiben bis
  zu frischer QA/Security des Produktdelta gesperrt.
- **PO-096 FUTURE-GLOBALE-LAGE:** Die fruehere Formulierung, `Globale Lage`
  vollstaendig zu streichen, wird praezisiert. Das Modul bleibt aus Start,
  Fuer mich, Entdecken und allen laufenden G3-019-bis-G3-021-Slices
  ausgeschlossen, darf aber als spaetere FUTURE-Funktion vorgemerkt werden.
  Vor Umsetzung sind ein eigener Produktbrief, klare Nutzererklaerung und
  Abgrenzung zur verworfenen unklaren Tageslage, redaktionelle Auswahlregeln,
  Regionen-/Quellenbalance, Rechte/Provenienz und ein eigenes sichtbares
  START-Gate Pflicht. PO-096 startet keine Produkt-, Test-, Recherche-,
  Hosting-, Live- oder Releasearbeit.
- **PO-092 BRAND-ROADMAP-SOURCES-PRECISION:** Der Product Owner entscheidet,
  dass `Globale Lage` vollstaendig entfaellt. Die neue App bleibt eine
  professionell optimierte Fortfuehrung der Code-26-Live-App, mit den bereits
  akzeptierten kompakteren, lesbareren, responsiven und barrierefreien
  Anpassungen; kein stilles Fremd-Redesign. Start bleibt anonym, Fuer mich
  lokal opt-in, Entdecken kompakt. Reader, Termine und Medien folgen den
  G3-019- bis G3-021-Briefs. Bibliothek, Korrekturhinweise und freiwillige
  lokale Benachrichtigungen bleiben spaetere Einzelpakete; Push benoetigt ein
  separates Securitygate. Quellenkarten trennen Selbstbeschreibung und
  redaktionelle Einordnung und zeigen Rechte, Typ, Region/Sprachen,
  Aktualitaet, Original-Link und nur offizielle oeffentliche Kontakte.
  Die namentliche globale Kandidateninventur wird nur fuer spaetere
  Quellenpaesse gebunden. Diese Entscheidung ist kein
  `START WRN-CONTENT-SOURCES-001` und erlaubt weder Recherche noch Admission,
  Feed, Import, Produktmutation, Hosting/Live oder Release.
- **PO-087 CONTENT-SOURCES-ROADMAP:** Der Product Owner verlangt die spaetere
  professionelle Aufnahme oder Ergaenzung fachlich passender, belastbar
  verifizierter Quellen aus Schwarzem Anarchismus, Panafrikanismus, Schwarzen
  Befreiungsbewegungen, Antikolonialismus und Westasien. Der uebergebene
  Code-26-Befund wird nur als read-only Migrationshinweis behandelt. Vor jeder
  Umsetzung muessen aktuelle Quelle, Selbstbeschreibung, redaktionelle
  Einordnung, Alias/Nachfolge, stabile ID, Sprache/Region, Feed, Lizenz je
  Medientyp, Original-Link, Korrekturkontakt und sichere Auslieferung getrennt
  belegt werden. Kein blindes Hotlinking/Kopieren und keine erfundene oder
  pauschale politische Etikettierung. Der vorgemerkte Vertrag ist
  `docs/tasks/WRN-CONTENT-SOURCES-001-BLACK-LIBERATION-AND-WEST-ASIA.md`;
  seine spaeteren Projektionen liegen je nach Inhalt in G3-019, G3-021,
  WRN-CONTENT-SPORT-001 oder einem eigenen Bibliotheksslice. PO-087 startet
  weder Recherche noch Import, Produktcode, Provider, Live oder Release und
  erweitert WRN-G3-017 nicht.
- **PO-088 GLOBAL-SOURCE-ADMISSION:** Der Product Owner bindet fuer den
  spaeteren Quellenvertrag ein globales, versioniertes Aufnahmemodell:
  aktive/zuverlaessige Quellen koennen in News-/Medienfeeds, seltene Quellen
  ins Verzeichnis, Bibliotheken spaeter in den Bibliotheksbereich;
  Organisations-Eigenpublikationen werden sichtbar markiert, Counter-Info-/
  Konfliktquellen strenger geprueft und eingestellte/umbenannte Projekte als
  Alias/Nachfolger statt als Dublette gefuehrt. Rekrutierung, operative
  Anleitungen, Doxxing, unbestaetigte Anschuldigungen und problematische
  Gewaltdarstellungen werden nicht automatisch uebernommen. Die Entscheidung
  ist in WRN-CONTENT-SOURCES-001 vorgemerkt, erweitert G3-017-P3 nicht und
  startet ohne exaktes `START WRN-CONTENT-SOURCES-001` keine Recherche,
  Imports, Feeds, Produktmutation, Livearbeit oder Veroeffentlichung.

## Neueste G3-015-Ergebnisentscheidung vom 29. August 2026

- **G3-015-OUTCOME-A ACCEPTED:** Der Product Owner erteilte exakt
  `G3-015 OUTCOME A FREIGEGEBEN`. Verbindlich sind getrennte Readiness und
  Operation; ein Update darf terminal `indeterminate` mit
  `native-outcome-unbound` enden; Busy endet; kein Auto-Retry; bewusster Retry
  nur bei freien Pending-/Removal-/Epochzaeunen. Ohne gesonderten
  Persistenzvertrag bleibt das Ergebnis sitzungsbezogen und ein Neustart darf
  keinen rueckwirkenden Erfolg erzeugen. Enable und Remove behalten ihre
  strengeren bestaetigten Ergebnisse. Vertrag:
  `docs/tasks/WRN-G3-015-OUTCOME-DECISION.md`.
- **Nicht mitentschieden:** keine Produkt-/Test-, Persistenz-, P2-, P3-, P4-,
  Live- oder Releasefreigabe. P1 bleibt GREEN; P2 offen; P3
  unvollstaendig/YELLOW; P4 nicht gestartet. Die historische RED-Ursache
  bleibt offen. Vor Code sind enger Implementierungsbrief und unabhaengiger
  Vertragsreview erforderlich.

## Neueste Website-Analysefreigabe vom 29. August 2026

- **PO-078 ACCEPTED-WEBSITE-SECURITY-FIXES:** „gerne weitermachen“ beantwortet
  die konkrete Frage, beide bestaetigten Low-Befunde als ein begrenztes
  Reparaturpaket mit unabhaengiger Nachpruefung zu bearbeiten. Autorisiert
  sind Tests zuerst, die eng notwendigen Website-/Shared-Domain-Korrekturen,
  lokale Belege und genau eine unabhaengige read-only Reviewrunde. Keine
  Veroeffentlichung, Hostingmutation, App-/Androidaenderung, neue Dependency,
  Kostenfreigabe oder Annahme der damals offenen G3-015-Ergebnisentscheidung. Brief:
  `docs/tasks/WRN-WEB-ANALYSIS-002-SECURITY-FIXES.md`.
  Ergebnis: beide Low-Findings technisch fixed; unabhaengiger Reviewfund zum
  No-Web-Locks-Fallback geschlossen, Abschlussmatrix GREEN. Publish bleibt an
  die separaten Hosting-/Paket-/Alt-Tab-/Cachegates gebunden.

- **PO-077 ANALYSIS-WEBSITE-SECURITY-REVIEW:** „bitte weiter machen“ beantwortet
  das Angebot, ausschliesslich den unabhaengigen Sicherheitspruefer fuer die
  neue Analysewebsite zu starten. Autorisiert sind Skill-Preflight, ein
  begrenzter Offline-Quellreview und eigene Pruefbelege. Keine Produkt-/Test-
  korrektur, Veroeffentlichung, neue Kosten oder OUTCOME-DECISION-Annahme.
  Brief: `docs/tasks/WRN-WEB-ANALYSIS-001-SECURITY-REVIEW.md`.
  Ergebnis: offizieller Standardscan abgeschlossen, zwei quellvalidierte Low-
  Findings; alle 45 Website-Dateien statisch geprueft. Keine Implementierung,
  keine Gesamt-/Deploymentfreigabe. Ergebnis-/Fixabgrenzung im Security-Handoff.
- **PO-075 CONDITIONAL-WEBSITE-ANALYSIS-PUBLISH:** Der Product Owner erlaubt,
  die neue Website zur Analyse online zu schalten, wenn sie keine offenen
  sicherheitsrelevanten Probleme aufweist. Die App ausdruecklich noch nicht.
  Eine unabhaengige Sicherheitspruefung des gebundenen Kandidaten und der
  Auslieferung bleibt Voraussetzung; keine absolute Fehlerfreiheit behaupten.
- **PO-076 SEPARATE-ANALYSIS-ADDRESS:** Das anschliessende „ja“ beantwortet
  genau die Frage nach einer separaten Testadresse bei unveraenderter bisheriger
  Website. Keine Ersetzung von solinaridao.com, keine App-/Playfreigabe, kein
  Domainkauf oder neuer kostenpflichtiger Dienst. Konkretes Hostingziel und
  dessen Isolation werden zuerst verifiziert.

Vorbereitung: `docs/tasks/WRN-WEB-ANALYSIS-001-SEPARATE-PREVIEW.md`.
Keine Veroeffentlichung ausgefuehrt. Hostinganmeldung und erste lesende
Zielwegpruefung am 28.08. bestaetigt; eigener PHP/HTML-Websiteplatz empfohlen,
aber noch nicht angelegt. Beleg HOSTING-READINESS.md unter
docs/evidence/WRN-WEB-ANALYSIS-001/. Konkrete Ziel-/Paket-/Sicherheitsbelege
fehlen. Der damalige Satz, G3-015 sei unvollstaendig, ist historisch:
Outcome A und die lokale visuelle Abnahme sind inzwischen durch PO-074/079
geschlossen. Diese Websitefreigaben entschieden zum damaligen Zeitpunkt
weder OUTCOME-DECISION noch historische Browser-REDs.
Eng notwendige Releaseaktionen erst nach gebundenem Ziel und erfuellten
Bedingungen; keine allgemeinen Remote-/CI-/Backend-/Produktmutationsrechte.

## 1. Bereits akzeptierte Governanceentscheidungen

Die fruehen Bezeichnungen `ADR-000` bis `ADR-008` waren ein vorlaeufiges
Governancelog. Damit sie nicht mit dem kanonischen G2-Paket kollidieren, werden
sie hier unter stabilen `GOV`-IDs weitergefuehrt.

| ID | Status | Entscheidung |
|---|---|---|
| GOV-001 | `ACCEPTED` | Dokumentation, Quellen, Agenten- und Qualitaetsbasis vor Produktcode; kein Produktcode ohne `GO-IMPLEMENTATION`. |
| GOV-002 | `ACCEPTED` | `Sauberes Wo Rev Ne` ist das neue lokale Arbeitsrepository; Legacyquellen bleiben unveraendert. |
| GOV-003 | `ACCEPTED` | Sol fuer hohe Risiken/Gates, Terra fuer regulaere Umsetzung, Luna fuer Routine, Spark fuer eng begrenzte Arbeit. |
| GOV-004 | `ACCEPTED` | Build, Test, Signierung, Upload, Deployment und Rollout sind getrennte Operationen. |
| GOV-005 | `ACCEPTED` | Statusblock/`END-CHECK: :)`, Continuity Audit und sichere Rotation; Marker allein ist kein Gesundheitsbeweis. |
| GOV-006 | `ACCEPTED` | Mitarbeiterprofile und Belege werden nie automatisch geloescht; `FEUERN` beendet nur eine Instanz. |
| GOV-007 | `ACCEPTED` | WRN-GOV-001: PO und Chief stimmen am 28. August 2026 der begrenzten Fachleadorganisation zu. Bestehende Profile, maximal Main -> Fachlead -> Helfer, projektweite zentrale Slots inklusive wartender Instanzen, ein Schreiber je Bereich/Vertrag, unabhaengige Reviews direkt an Chief und begrenzte Kontext-/Aufwandspakete. Gezielte Integration aus `04e349d..09d8964` gegen Hauptcheckout `662b29c`; keine alte Produktstatusuebernahme. Vertrag: `docs/10-AGENT-ORCHESTRATION.md`. Pilot und Produktfreigabe bleiben getrennt. |

Die fruehen Vorschlaege zu Monorepo, Contenttrennung, UI-Stack und Map/Spiel
werden durch die folgenden kanonischen G2-ADRs praezisiert. Das ist keine
Product-Owner-Annahme ihrer Annahme.

## 2. Kanonisches G2-ADR-Paket

| ADR | Status | G2-Entscheidung | Freigabe/Gate |
|---|---|---|---|
| ADR-001 Repository/Pakete | `ACCEPTED` | privates Plattform-Monorepo; zwei Apps, gemeinsame Contract-/Brandpakete, getrenntes Contentrepo | PO-001; Umsetzung erst nach `GO-IMPLEMENTATION` |
| ADR-002 Clientstack | `ACCEPTED` | React + TypeScript + Vite; Capacitor fuer Android; getrennte Websiteausgabe | PO-001; aktuelle Version/Lizenz vor G3 belegen |
| ADR-003 Design/Marke | `ACCEPTED` | gemeinsame semantische Tokens/Assets/Primitive, getrennte Navigation und Layouts | PO-001/009; Assetimport nur mit Rechtebeleg |
| ADR-004 Datenvertrag | `ACCEPTED` | immutable Revision, getrennte ID-Mengenhashes/-beziehungen, stabile IDs, Required/Optional und vorrangige Revocations | G2-Abnahme; Contracttests vor Nutzung |
| ADR-005 Backend/Worker | `ACCEPTED` | providerneutrale `/v1`-Vertraege; Cloudflare bedingt bevorzugt; eigene Deploy-/Rollbackeinheiten je fachlichem Dienst | PO-010/011; Liveinventar und Budgetgate offen |
| ADR-006 Medien | `ACCEPTED` | Referenz vor Kopie; Rechte/Lifecycle/Takedown; Generierung standardmaessig aus | PO-007/009/011; Rechte-/Securitygates offen |
| ADR-007 Offline/Cache | `ACCEPTED` | getrennte App-/Website-Storages, Migrationen und Rollbacks | G2-Abnahme; Tests vor Freigabe |
| ADR-008 Security/Privacy | `ACCEPTED` | SEC-001/002/003 schliessen; No-Content-Logging, Retention, Loeschung/Widerruf | PO-005–008; Findings bleiben Implementierungsblocker |
| ADR-009 QA/Release | `ACCEPTED` | getrennte reproduzierbare Pipelines; GitHub bedingt vorgeschlagen; CI ohne automatische Produktion | PO-013; Remote-/CI-Einrichtung separat |
| ADR-010 Map/Spiel | `ACCEPTED`, Feature `DEFERRED` | nur IDs/Vertraege/Deep Links/Textalternative; kein Release-1-Code | spaeteres eigenes Gate |

## 3. Product-Owner-Entscheidungen vom 23. August 2026

Der Product Owner bestaetigte mit „ja mach weiter bitte“ das unmittelbar zuvor
vollstaendig beschriebene sichere G2-Empfehlungspaket. Diese Abnahme ist keine
Freigabe fuer Produktcode, Remote-Setup, Deployment, Signierung oder Upload.

| ID | Status | Dokumentierte Entscheidung |
|---|---|---|
| PO-001 | `ACCEPTED` | Zielarchitektur, Plattform-Monorepo, React/TypeScript/Vite und Capacitor werden akzeptiert. |
| PO-002 | `ACCEPTED-CONDITIONAL` | Intro/Onboarding bleibt nur als Paritaetsfunktion, wenn es im verbindlichen Runtime-Stand bestaetigt ist; kein neuer Intro-Scope. |
| PO-003 | `ACCEPTED-LATE` | Zine-/Druckwerkzeuge bleiben als eigener spaeter Release-1-Slice, blockieren aber nicht das erste Fundament-Slice. |
| PO-004 | `ACCEPTED-CONDITIONAL` | Action Radar bleibt nur mit freiwilliger lokaler Standortverarbeitung und nachgewiesenem No-Transmission-Vertrag; sonst deaktiviert. |
| PO-005 | `ACCEPTED-GATED` | Push bleibt im Release-1-Scope, ist aber standardmaessig aus und bis SEC-003 sowie bestaetigtem Widerruf gesperrt. |
| PO-006 | `ACCEPTED` | Remoteuebersetzung erfolgt nur nach expliziter Nutzeraktion; keine automatische Uebertragung als Default. |
| PO-007 | `ACCEPTED-GATED` | Podcastkatalog/Player bleibt; generierte Podcasts nur redaktionell freigegeben und erst nach SEC-002, Rechte-, Quoten- und Takedowngate. Kein anonymes Self-Service. |
| PO-008 | `ACCEPTED-AS-MAXIMUM` | Technische Obergrenzen: Logs 30 Tage, Translation 7 Tage, Feedback 90 Tage, Push-Revalidierung 180 Tage, Podcast 30 Tage; kuerzere notwendige Fristen haben Vorrang. |
| PO-009 | `ACCEPTED` | Nur Assets mit belastbarem Rechte-/Lizenzbeleg werden uebernommen; sonst neu erstellen, lizenzieren oder ausschliessen. |
| PO-010 | `ACCEPTED-CONDITIONAL` | Cloudflare darf nach read-only Liveinventar bedingt weiterverwendet werden; Provider bleiben austauschbare Adapter. |
| PO-011 | `ACCEPTED-ZERO-DEFAULT` | Neue optionale API-/Providerbudgets starten bei 0 CHF. Jeder bezahlte Aufruf braucht spaeter Einzelbudget, Messpunkt, Hard Cap und Kill-Switch. |
| PO-012 | `ACCEPTED-G2-ONLY` | G2 ist abgenommen. `GO-IMPLEMENTATION` wird ausdruecklich nicht miterteilt und bleibt separates G3-Gate. |
| PO-013 | `ACCEPTED-CONDITIONAL` | Privates GitHub-Remote und GitHub Actions werden fuer das neue Plattformrepo vorgesehen, aber erst in einem eigenen autorisierten Task mit Least Privilege und geschuetzten Environments eingerichtet. |

## 4. Rechteentscheidungen vom 23. August 2026

Der Product Owner antwortete auf die unmittelbar zuvor angebotenen sicheren
Rechteoptionen mit „ok weiterfahren bitte“. Um keine unbelegte Eigentumsangabe
zu erfinden, wird dies als Zustimmung zur konservativen Variante dokumentiert.
Mit den spaeteren ausdruecklichen Angaben `QOOD ERSETZEN` und
`MARKENASSETS: Ich besitze alle erforderlichen Rechte.` ersetzte er diesen
Vorsichtsweg durch PO-016/017. Die historischen IDs bleiben fuer
Nachvollziehbarkeit erhalten.

| ID | Status | Dokumentierte Entscheidung |
|---|---|---|
| PO-014 | `SUPERSEDED-BY-PO-016` | Fruehere Vorsichtsentscheidung: `Qood.ttf` ausschliessen und wegen fehlender Runtimeverwendung keinen Ersatz voraussetzen. Der Dateiausschluss bleibt bestehen; der Product Owner verlangt nun ausdruecklich einen offenen Ersatz. |
| PO-015 | `SUPERSEDED-BY-PO-017` | Fruehere Vorsichtsentscheidung: mangels ausdruecklicher Eigentumsbestaetigung Markenassets nicht importieren und neu erstellen. Der Product Owner hat die erforderlichen Rechte nun ausdruecklich bestaetigt. |
| PO-016 | `ACCEPTED-REPLACE` | `Qood.ttf` und seine Kopien werden nie in das neue Produkt importiert. Eine lokal ausgelieferte, offen lizenzierte Ersatzschrift wird nach visuellem Vergleich, Accessibility-Test, gepinntem Lizenzbeleg und Hash ausgewaehlt. Die aktuelle Shortlist ist noch keine Auswahl. |
| PO-017 | `ACCEPTED-OWNER-ATTESTED` | Der Product Owner bestaetigt, alle erforderlichen Rechte an den inventarisierten WRN-/Solinaridao-Markenassets zu besitzen. Nach `GO-IMPLEMENTATION` duerfen ausgewaehlte Dateien in einem eigenen Asset-Task anhand ihrer vorhandenen Hashes importiert, als kanonische Master/Ableitungen klassifiziert und visuell geprueft werden. Die Bestaetigung ist eine Eigentuemererklaerung, keine unabhaengige Rechtspruefung fuer sonstige Medien oder Drittinhalte. |

## 5. Entscheidungsdisziplin

- Die vollstaendigen Optionen, Kosten, Risiken, Migrationen und Gates stehen in
  `docs/architecture/ADR-*.md`.
- Der Abschlussstand der Product-Owner-Entscheidungen steht in
  `docs/architecture/G2-OPEN-DECISIONS.md`; technische Evidenzgates bleiben
  auch nach der Entscheidung offen.
- Fehlendes Liveinventar, Rechtebelege oder bestandene Tests sind keine
  Entscheidung und koennen nicht durch eine Freigabeformulierung ersetzt
werden.
- `ACCEPTED` fuer G2 erteilt weder automatisch `GO-IMPLEMENTATION` noch
  Deployment-, Signier- oder Uploadauthority.

## 6. Implementierungsfreigabe

| ID | Status | Dokumentierte Entscheidung |
|---|---|---|
| PO-018 | `ACCEPTED-G3-001-ONLY` | Der Product Owner erteilte am 23. August 2026 exakt `GO-IMPLEMENTATION`. Freigegeben ist ausschliesslich die lokale, neutrale Foundation `WRN-G3-001`. Legacyimport, Markenassetimport, echte Dienste, Datenbank, Remote/CI, Deployment, Signierung, Upload und Veroeffentlichung bleiben separate Gates. |

## 7. G3-Fortsetzungsentscheidungen vom 23./24. August 2026

Aktuelle Entscheidung vom 28. August 2026, exakt
`G3-014 VISUELL AKZEPTIERT – START WRN-G3-015`:

- **PO-073 ACCEPTED-G3-014:** Produkt `44b5cb1` einschliesslich `37a75d6`,
  frische QA `999b777`, Architektur `0b2bd2f` und Abschluss `2191b0f` akzeptiert.
  `UX-POLISH-001` bleibt vorgemerkter finaler Buttonfeinschliff vor Release.
- **PO-074 START-G3-015-PACKAGE:** vorbereitetes Paket `29d6766` und Task
  `WRN-G3-015-WEBSITE-OFFLINE-SHELL.md` angenommen. Zuerst unabhaengiger
  Vertragsreview; nach GREEN kompletter gebundener Umsetzungs-/Pruefablauf,
  einschliesslich enger belegter Fehlerkorrekturen. Begrenzter P3-Fachlead/
  Spark-Pilot freigegeben, aber nur nach stabilem Vertrag/zentralen Slots.
  Keine erweiterten Live-/Legacy-/API-/Dependency-/Android-/Remote-/CI-/
  Releasebefugnisse. Unbekannte Folgepakete und neue Architektur-/Risiko-
  entscheidungen bleiben separate PO-Entscheidungen.

Aktuelle Ergaenzung vom 28. August 2026: **PO-072 PREPARATION-ONLY-G3-015**.
Der Product Owner sagt nach der Erklaerung des neuen Agentensystems:
„ok machen wir das naechste grosse paket“. Da der Folgescope noch nicht
definiert/angenommen und G3-014 nicht ausdruecklich visuell akzeptiert ist,
bereitet Chief G3-015 Website-Offline-Shell gemaess ADR-007 vor. Das ist
keine nachtraeglich erfundene G3-014-Abnahme oder Erlaubnis fuer Service-
Worker-/Cache-/Produktcode. Task und begrenzter Fachlead-/Helfer-Pilot werden
zur ausdruecklichen Annahme vorgelegt. Kein Agent wurde dafuer gestartet.
Die vorherige Buttonbemerkung wird als `UX-POLISH-001` fuer kompaktere
Bedienelemente im finalen UI-Feinschliff dokumentiert; Umsetzung/finale
visuelle Abnahme bleiben offen, Touch-/Reflowregeln gelten weiter.

Aktuelle Ergaenzung vom 28. August 2026: **PO-071 ACCEPTED-G3-014-PACKAGE**.
Der Product Owner erteilte exakt `START WRN-G3-014` und „und danach
weiterfahren“, nachdem WRN-GOV-001 gezielt integriert wurde. Der vorherige
Sicherheitsstopp ist explizit geklaert. Freigegeben ist der schriftliche
G3-014-Scope bis zur technisch geprueften sichtbaren Abnahme, inklusive
interner nachgewiesener Fehlerkorrekturen und unabhaengiger Nachpruefung.
Keine separate PO-Fixnachricht fuer solche engen Korrekturen erforderlich.
Reihenfolge Vorreview -> Backend -> Frontend -> QA -> Architekturabschluss
bleibt strikt sequenziell, mit genau einem Subagenten gleichzeitig und ohne
Weiterdelegation. Bei echten Produkt-/Architektur-/Kosten-/Befugnisentscheidungen
oder ungeklärtem Datenschutz-/Datenverlustrisiko wird gefragt. Keine
Freigabe fuer echte Inhalte, Legacy-/Nutzerdaten, Dependencies, Android,
Service Worker, Cache Storage, Remote/CI, Deployment, Signierung oder Release.
Folgeslices benoetigen weiterhin ihren eigenen definierten Umfang.

Technischer Ergebnisvermerk zu PO-071 (keine neue PO-Entscheidung):
Kandidat `44b5cb1` mit frischer QA `999b777` und Architektur-Recheck `0b2bd2f`
ist am 28. August 2026 technisch GREEN. Beide P5-Mediums geschlossen;
lokale Sichtabnahme weiterhin offen. Dies akzeptiert weder das Produkt
automatisch noch erweitert es die oben genannten Befugnisse.

| ID | Status | Dokumentierte Entscheidung |
|---|---|---|
| PO-019 | `ACCEPTED-TECHNICAL-ONLY` | Der Product Owner akzeptiert G3-001 als technisch geprueftes neutrales Grundgeruest. Nach seiner Klarstellung, dass an den Foundationbildern kaum Produktgestaltung zu pruefen war, gilt dies ausdruecklich nicht als Design-, Funktions-, Marken- oder Paritaetsfreigabe. Kuenftige sichtbare Slices erhalten einen gefuehrten Alt-vs.-Neu-Vergleich. |
| PO-020 | `ACCEPTED-READ-ONLY-RECONFIRMED` | Die aktuelle Live-App und ihr Repository duerfen nicht veraendert werden. Gleiches gilt im vorbereiteten G3-002-Scope fuer aktuelle Website, Content-/Datenquellen und Liveinfrastruktur. Neue Arbeit findet ausschliesslich im Repository `Sauberes Wo Rev Ne` statt. |
| PO-021 | `ACCEPTED-PREPARATION-ONLY` | Mit „ja dann fahren wir fort wie du gesagt hast“ autorisiert der Product Owner die zuvor beschriebene Dokumentvorbereitung fuer WRN-G3-002: lokaler Manifest-v1-Newsfeed und gefuehrter visueller Abnahmebogen. Produktcode und Mitarbeiterstart benoetigen weiterhin das separate Gate `START WRN-G3-002`. |
| PO-022 | `ACCEPTED-G3-002-ONLY` | Der Product Owner erteilte am 23. August 2026 exakt `START WRN-G3-002`. Freigegeben ist nur der vorbereitete lokale Manifest-v1-Newsfeed-Slice einschliesslich Contract/Domain, getrennten Mobile-/Websitefeeds, lokaler Testmatrix und visueller Alt-vs.-Neu-Evidenz. Legacy-/Liveaenderungen, echte Inhalte und Dienste, Assetimport, Reader, Android, Remote/CI, Deployment, Signierung und Veroeffentlichung bleiben gesperrt. |
| PO-023 | `ACCEPTED-G3-002-VISUAL` | Der Product Owner akzeptierte am 23. August 2026 die sichtbare Produktrichtung von WRN-G3-002. Noch fehlende Funktionen sowie finale Farben, Fonts, Logos, Navigation und Gesamtparitaet sind dadurch nicht als erledigt freigegeben. |
| PO-024 | `ACCEPTED-G3-003-PREPARATION-ONLY` | Mit `G3-002 VISUELL AKZEPTIERT – BEREITE WRN-G3-003 VOR` autorisierte der Product Owner ausschliesslich die Dokumentvorbereitung des Marken-/Design-Slices. Produktcode, Assetimport, Fontdownload und Mitarbeiterstart brauchen weiterhin ihre im Task Brief genannten separaten Gates. |
| PO-025 | `ACCEPTED-G3-003-ONLY` | Der Product Owner erteilte am 23. August 2026 exakt `START WRN-G3-003`. Freigegeben ist nur der vorbereitete lokale Marken-/Design-Slice mit hoechstens drei hashgebundenen Markenoriginalen, Assetmanifest, gemeinsamen Tokens, getrennten Mobile-/Website-Kompositionen, lokalen Tests und visueller Evidenz. Fontdownload, weitere Legacyassets, neue Funktionen, Live-/Remoteoperationen, Android, Deployment, Signierung und Veroeffentlichung bleiben gesperrt. |
| PO-026 | `G3-003-CHANGE-REQUEST-1` | Der Product Owner nahm Kandidat `af2fd9920191` noch nicht visuell ab. Freigegeben sind genau drei Korrekturen: der responsive Website-Header wird kompakter und an die App-Hoehe angenaehert; die App erhaelt den Linktext `Mehr zum Projekt` zur autoritativen Website `https://solinaridao.com/`; die App zeigt einen Spendenhinweis auf Basis der bestehenden freiwilligen Unterstuetzung und des bekannten PayPal-Ziels. Andere sichtbare Aenderungen folgen spaeter und sind nicht Teil dieser Runde. |
| PO-027 | `G3-003-CORRECTION-1-CONDITIONAL-ACCEPTANCE` | Der Product Owner bestaetigte am 24. August 2026 mit `G3-003 KORREKTUR 1 PASST` Header, Platzierung und Produktrichtung. Vor der finalen G3-003-Sichtabnahme ist genau eine sichtbare Textkorrektur erforderlich: Der Anbietername `PayPal` wird aus App-Link und Hinweis entfernt. Sichtbarer Linktext ist nur `Unterstuetzen`; die Warnung nennt neutral das Verlassen der App und das Oeffnen einer externen Zahlungsseite. Das bereits freigegebene Ziel und seine Privacy-/Sicherheitsattribute bleiben technisch unveraendert. Weitere Aenderungen sind nicht Teil dieser Korrektur. |
| PO-028 | `ACCEPTED-G3-003-VISUAL-AND-G3-004-PREPARATION-ONLY` | Der Product Owner akzeptierte am 24. August 2026 mit `G3-003 VISUELL AKZEPTIERT – BEREITE WRN-G3-004 VOR` den technisch und unabhaengig geprueften G3-003-Kandidaten `f54a2993e1ec` einschliesslich PO-027. Gleichzeitig ist ausschliesslich die Dokumentvorbereitung fuer einen getrennten Navigations-/Informationsarchitektur-Slice freigegeben. Produktcode, Mitarbeiterstart, Fontdownload, echte Funktionen/Daten/Dienste, Android, Remote/CI, Deployment, Signierung und Veroeffentlichung benoetigen weiterhin eigene Gates. |
| PO-029 | `ACCEPTED-G3-004-ONLY` | Der Product Owner erteilte am 24. August 2026 exakt `START WRN-G3-004`. Freigegeben ist nur der vorbereitete lokale Navigations-Slice mit stabilen Ziel-IDs, getrennten responsiven App-/Website-Projektionen, clientlokalem History-/Fokusverhalten, ehrlichen seiteneffektfreien Zwischenzustaenden, lokalen Tests und visueller Evidenz. Suche, Filter, Reader, Personalisierung, Speicherung, Medienfunktion, echte Inhalte/Dienste, Fontdownload, Android, Remote/CI, Deployment, Signierung und Veroeffentlichung bleiben gesperrt. |
| PO-030 | `ACCEPTED-G3-004-VISUAL` | Der Product Owner akzeptierte am 24. August 2026 mit `G3-004 VISUELL AKZEPTIERT – TEMP-ORDNER LOESCHEN` den finalen, unabhaengig GREEN geprueften Navigationskandidaten `3d89fbc05c53`. Zugleich wurde ausschliesslich die Entfernung des unversionierten lokalen `tools/__pycache__/` freigegeben und ausgefuehrt. Diese Abnahme startet keinen Folge-Slice und erteilt keine Freigabe fuer Suche, Reader, Medien, echte Daten/Dienste, Android, Remote/CI, Deployment, Signierung oder Veroeffentlichung. |
| PO-031 | `ACCEPTED-G3-005-PREPARATION-ONLY` | Der Product Owner erteilte am 24. August 2026 exakt `BEREITE WRN-G3-005 VOR`. Freigegeben ist ausschliesslich die Dokumentvorbereitung fuer `Entdecken` mit rein lokaler Suche, den Facetten Region, Thema, Quelle, Originalsprache und Format, separatem hashgeprueftem Discover-Index, Testmatrix und gefuehrter Sichtabnahme. Produkt-/Testcode, Fixtures und Mitarbeiterstart benoetigen das separate Gate `START WRN-G3-005`; echte Daten, Archive, Uebersetzung, Reader, Android, Remote/CI, Deployment, Signierung und Veroeffentlichung bleiben gesperrt. |
| PO-032 | `ACCEPTED-G3-005-ONLY` | Der Product Owner erteilte am 24. August 2026 exakt `START WRN-G3-005`. Freigegeben ist ausschliesslich der vorbereitete lokale `Entdecken`-Slice mit hashgeprueftem Discover-Index, deterministischer Suche, den Facetten Region, Thema, Quelle, Originalsprache und Format, getrennten responsiven App-/Website-Ansichten, lokalen Tests und visueller Evidenz. Archive, echte Daten, Uebersetzung, Reader, Persistenz, Android, Remote/CI, Deployment, Signierung und Veroeffentlichung bleiben gesperrt. |
| PO-033 | `G3-005-THEME-COMPARISON-REQUEST` | Der Product Owner fragte nach scheinbar groesseren Buttons im Dunkelmodus. Der Main Agent wies auf die nicht direkt vergleichbaren 200-Prozent-Reflow- und Querformatbelege hin und kuendigte einen identischen Hell-/Dunkel-Vergleich vor der formalen Abnahme an. Mit `ok ja das stimmt demnach und du darfst weiter machen` autorisierte der Product Owner diesen Zusatzbeleg. Checkpoint `472088e` bestaetigt bei 390 x 844 Pixeln, 100 Prozent und gleichem Zustand null Geometrieabweichungen fuer Suchfeld, Filter und Bottom-Navigation. Dies wird vorsorglich nicht als stillschweigende formale G3-005-Sichtabnahme oder Folgefeaturefreigabe behandelt. |
| PO-034 | `ACCEPTED-G3-005-VISUAL` | Der Product Owner akzeptierte am 24. August 2026 mit exakt `G3-005 VISUELL AKZEPTIERT` den technisch und unabhaengig GREEN geprueften lokalen Entdecken-Kandidaten `9a9a2216a4fa` einschliesslich der mit `472088e` belegten Theme-Klarstellung. WRN-G3-005 ist damit geschlossen. Die Abnahme startet keinen Folge-Slice und erteilt keine Freigabe fuer echte Daten, Archive, Uebersetzung, Reader, Android, Remote/CI, Deployment, Signierung oder Veroeffentlichung. |
| PO-035 | `ACCEPTED-G3-006-PREPARATION-ONLY` | Der Product Owner erteilte am 24. August 2026 exakt `BEREITE WRN-G3-006 VOR`. Freigegeben ist ausschliesslich die Dokumentvorbereitung fuer einen lokalen textbasierten Artikelreader mit separatem hashgebundenem Detailvertrag, Einstieg aus Start und Entdecken, stabilen clientlokalen IDs/Routen, sicherem Zurueck-/Escape-/Fokusvertrag, transparentem Originalquellenweg sowie lokaler Test- und Sichtabnahme. Produkt-/Testcode, Fixtures und Mitarbeiterstart benoetigen das separate Gate `START WRN-G3-006`; echte Inhalte/Medien, Archive, SEO/Landingpages, Teilen, Persistenz, Uebersetzung, Podcast, Zine, Android, Remote/CI, Deployment, Signierung und Veroeffentlichung bleiben gesperrt. |
| PO-036 | `ACCEPTED-G3-006-IMPLEMENTATION-START` | Der Product Owner erteilte am 24. August 2026 exakt `START WRN-G3-006`. Freigegeben ist nur der schriftliche lokale Reader-Scope aus `docs/tasks/WRN-G3-006-LOCAL-ARTICLE-READER.md` in der festgelegten Sequenz Contract/Domain/Fixture, Frontend und unabhaengige QA. Das fehlende `:)` in einer sichtbaren Ansicht ist nur ein Context-Auditsignal; die vorhandenen G3-005-Handoffs enden korrekt und ein Chatwechsel ist nicht erforderlich. Alle ausgeschlossenen Produkt-, Remote- und Releaseaktionen bleiben gesperrt. |
| PO-037 | `ACCEPTED-G3-006-H002-M001-AMENDMENT` | Der Product Owner erteilte am 24. August 2026 exakt `G3-006 H-002 UND M-001 BEHEBEN`. Freigegeben sind nur ein laengerer selbst erstellter lokaler Testartikel mit aktualisiertem Integritaetshash, die mobile App-Reflowkorrektur fuer 390 x 844 bei 200 Prozent und die anschliessende vollstaendige unabhaengige Re-QA. Reihenfolge: Contract/Fixture, Mobile-Frontend, QA. Websiteprodukt, echte Inhalte, Zusatzfunktionen, Android, Remote/CI und Releaseaktionen bleiben gesperrt. |
| PO-038 | `ACCEPTED-G3-006-VISUAL` | Der Product Owner akzeptierte am 24. August 2026 mit exakt `G3-006 VISUELL AKZEPTIERT` den korrigierten lokalen Readerkandidaten `6a4c64b` und die GREEN-Re-QA `6da7339`. WRN-G3-006 ist damit geschlossen. Die Abnahme startet keinen Folge-Slice und erteilt keine Freigabe fuer echte Inhalte, Archive, Share, Persistenz, Uebersetzung, Landingpages/SEO, Android, Remote/CI, Deployment, Signierung oder Veroeffentlichung. |
| PO-039 | `ACCEPTED-G3-007-PREPARATION-ONLY` | Der Product Owner erteilte am 24. August 2026 exakt `BEREITE WRN-G3-007 VOR`. Freigegeben ist ausschliesslich die Dokumentvorbereitung fuer stabile statische Website-Artikelpfade, ein deterministisches lokales Publikationsmanifest, Same-ID-Canonical/JSON-LD, Sitemap/Robots, Tests und visuelle Abnahmeplanung fuer drei selbst erstellte Testartikel. Produkt-/Testcode, Fixtures, generierte Landingpages und Mitarbeiterstart benoetigen das separate Gate `START WRN-G3-007`; echte Inhalte, 935 Legacyseiten, Archive, Redirects/Gone/Revocation, Share, Apache/Hostinger, Android, Remote/CI, Deployment, Signierung und Veroeffentlichung bleiben gesperrt. |
| PO-040 | `ACCEPTED-G3-007-IMPLEMENTATION-START` | Der Product Owner erteilte am 24. August 2026 exakt `START WRN-G3-007`. Freigegeben ist nur der schriftliche Scope in `docs/tasks/WRN-G3-007-STABLE-ARTICLE-LINKS-SEO.md` und die strikte Sequenz Contract/Publisher, Website-Komposition/Buildintegration und unabhaengige QA. Mobile-App, echte Inhalte, 935 Legacyseiten, Archive, Redirects/Gone/Revocation, Share, Apache/Hostinger, Android, Remote/CI, Deployment, Signierung und Veroeffentlichung bleiben gesperrt. |
| PO-041 | `ACCEPTED-G3-007-VISUAL` | Der Product Owner akzeptierte am 25. August 2026 mit exakt `G3-007 VISUELL AKZEPTIERT` den korrigierten statischen Websitekandidaten `5db27a5` und die GREEN-Re-QA `02a4e90`. WRN-G3-007 ist damit geschlossen. Die Abnahme startet keinen Folge-Slice und erteilt keine Freigabe fuer echte Inhalte, 935 Legacyseiten, Archive, Redirects/Gone/Revocation, Share, Apache/Hostinger, Android, Remote/CI, Deployment, Signierung, Upload oder Veroeffentlichung. |
| PO-042 | `ACCEPTED-G3-008-PREPARATION-ONLY` | Der Product Owner antwortete am 25. August 2026 mit `gerne weiterfahren`, nachdem der Main Agent den naechsten Schritt als `BEREITE WRN-G3-008 VOR` und reine Dokumentvorbereitung beschrieben hatte. Freigegeben sind ausschliesslich Task Brief, Paritaets-/Abnahmeplan, Vorbereitungshandoff und konsistente Statusdokumente fuer lokale aktive/historische/alias/gone/revoked-Testfaelle, ein Archiv unter `Mehr` und kanonische Share-Ziele. Produkt-/Testcode, Fixtures und Mitarbeiterstart benoetigen `START WRN-G3-008`; echte Inhalte, 935 Legacyseiten, produktive Redirects/410/Revocation, Apache/Hostinger, Cache-Purge/Offline, Android, Remote/CI, Deployment, Signierung, Upload und Veroeffentlichung bleiben gesperrt. |
| PO-043 | `ACCEPTED-G3-008-IMPLEMENTATION-START` | Der Product Owner erteilte am 25. August 2026 exakt `START WRN-G3-008`. Freigegeben ist ausschliesslich der schriftliche Scope in `docs/tasks/WRN-G3-008-ARCHIVE-LINK-LIFECYCLE.md` und die strikte Sequenz Contract/Domain/Fixture, getrennte App-/Website-Projektionen und unabhaengige QA. Echte Inhalte, 935 Legacyseiten, produktive Redirects/410/Revocation, Apache/Hostinger, Cache-Purge/Offline, Android-Native-Share, Remote/CI, Deployment, Signierung, Upload und Veroeffentlichung bleiben gesperrt. |
| PO-044 | `ACCEPTED-G3-008-VISUAL-WITH-SEPARATE-BRAND-FOLLOWUP` | Der Product Owner akzeptierte am 25. August 2026 mit exakt `G3-008 VISUELL AKZEPTIERT` den technisch GREEN geprueften lokalen Archiv-/Lifecycle-Kandidaten `9affac8` und die unabhaengige QA `2ec52ff`. Gleichzeitig fragte er anhand eines aktuellen App-Screenshots nach dem blauen Headerhintergrund. Die Diagnose bestaetigt `WRN-BRAND-PARITY-M-001`: kein falsches Repository und keine alten Inhaltsdaten, aber eine aus G3-003 geerbte falsche Runtime-Rolle von `app-background.webp` im neuen Header. G3-008 bleibt geschlossen; die Headerkorrektur braucht einen getrennten Task und startet nicht automatisch. |
| PO-045 | `ACCEPTED-G3-009-PREPARATION-ONLY` | Der Product Owner erteilte am 25. August 2026 exakt `BEREITE WRN-G3-009 VOR`. Freigegeben sind ausschliesslich Task Brief, Paritaets-/Abnahmebrief, Vorbereitungshandoff und konsistente Statusdokumente fuer die Korrektur von `WRN-BRAND-PARITY-M-001`: aktuelle dunkle und logo-dominante Mobile-Headerwirkung binden, `app-background.webp` aus der direkten Mobile-/Website-Headerrolle nehmen, den kompakten eigenstaendigen Websiteheader und alle akzeptierten G3-002-bis-G3-008-Funktionen bewahren. Produkt-/Testcode, Assets und Mitarbeiterstart benoetigen `START WRN-G3-009`; neue Headerfunktionen, echte Inhalte, Android, Remote/CI, Cloudflare, Hostinger, Deployment, Signierung, Upload und Veroeffentlichung bleiben gesperrt. |
| PO-046 | `ACCEPTED-G3-009-IMPLEMENTATION-START` | Der Product Owner erteilte am 25. August 2026 exakt `START WRN-G3-009`. Freigegeben ist ausschliesslich der schriftliche Scope in `docs/tasks/WRN-G3-009-BRAND-HEADER-PARITY-CORRECTION.md`: falsche direkte Headerrolle von `app-background.webp` korrigieren, mobile dunkle/logo-dominante Markenwirkung angleichen, kompakten eigenstaendigen Websiteheader und alle G3-002-bis-G3-008-Funktionen erhalten. Die Arbeit erfolgt strikt sequenziell: ein Frontend-Brand-Implementierungsagent, gesicherter Handoff, danach unabhaengige visuelle/Accessibility-QA. Neue Headerfunktionen, weitere Assets, echte Inhalte, Android, Remote/CI, Cloudflare, Hostinger, Deployment, Signierung, Upload und Veroeffentlichung bleiben gesperrt. |
| PO-047 | `ACCEPTED-G3-009-VISUAL` | Der Product Owner akzeptierte am 25. August 2026 mit exakt `G3-009 VISUELL AKZEPTIERT` den lokalen Produktkandidaten `973c129` und die unabhaengige GREEN-QA `692fe24`. Die falsche direkte Headerrolle von `app-background.webp` ist damit fuer den lokalen Kandidaten geschlossen, die mobile Marke sichtbar angenaehert und der kompakte Websiteheader bestaetigt. G3-009 ist geschlossen. Die Abnahme startet kein Folgefeature und erteilt keine Freigabe fuer neue Headerfunktionen, echte Inhalte, Android, Remote/CI, Cloudflare, Hostinger, Deployment, Signierung, Upload oder Veroeffentlichung. |
| PO-048 | `RECORDED-THEME-REACTIVE-BRAND-PREFERENCE` | Nach der G3-009-Abnahme benannte der Product Owner die Themeinteraktion von Header und Logo in der alten App, insbesondere beim Pink-Theme, als zu erhaltende Produktstaerke. Die read-only Runtimepruefung bestaetigt sieben App-Themeoptionen sowie aus `--cyan`/`--red` gespeiste Logo-Dropshadows und einen maskierten zweifarbigen Markenschriftzug; Pink setzt diese Akzente auf `#ff4fa3` und `#9b82ff`. Das Zielprojekt bietet derzeit nur Hell/Dunkel und keine themeaktive Bildmarke. `WRN-BRAND-THEME-PARITY-M-002` wird deshalb als eigener Folgebedarf erfasst. PO-047 bleibt gueltig; weder Vorbereitung, Produktcode noch Mitarbeiterstart sind dadurch freigegeben. |
| PO-049 | `ACCEPTED-G3-010-PREPARATION-ONLY` | Der Product Owner erteilte am 25. August 2026 exakt `BEREITE WRN-G3-010 VOR`. Freigegeben sind ausschliesslich Task Brief, Themeinventar, Paritaets-/Abnahmeplan, Vorbereitungshandoff und konsistente Statusdokumente fuer sechs echte Farbpaletten, `system` als dynamische Hell-/Dunkel-Praeferenz, lokale validierte Speicherung und theme-reaktive Markenakzente. Pink und System werden fuer die Website als bewusste gemeinsame Markenweiterentwicklung vorbereitet. Produkt-/Testcode, der kontrollierte Import der bereits owner-attested Originalmaske und Mitarbeiterstart benoetigen `START WRN-G3-010`; allgemeines Redesign, Fonts, Inhalte, Backend, Android, Remote/CI und Releaseaktionen bleiben gesperrt. |
| PO-050 | `ACCEPTED-G3-010-IMPLEMENTATION-START` | Der Product Owner erteilte am 26. August 2026 exakt `START WRN-G3-010`. Freigegeben ist ausschliesslich der schriftliche Scope in `docs/tasks/WRN-G3-010-THEME-REACTIVE-BRAND-PARITY.md`: sechs Paletten plus `system`, validierte lokale Theme-Praeferenz, einfache zugaengliche Auswahl, theme-reaktive Markenakzente, hoechstens die exakt gepinnte owner-attested Originalmaske sowie lokale Tests und visuelle Evidenz. Die Arbeit erfolgt strikt sequenziell mit einem Frontend-Brand-Implementierungsagenten und erst nach dessen gesichertem Handoff mit unabhaengiger visueller/Accessibility-QA. Allgemeines Redesign, Fonts, Navigation, Inhalte, Backend, Android, Remote/CI, Cloudflare, Hostinger, Deployment, Signierung, Upload und Veroeffentlichung bleiben gesperrt. |
| PO-051 | `ACCEPTED-G3-010-VISUAL` | Der Product Owner akzeptierte am 26. August 2026 mit exakt `G3-010 VISUELL AKZEPTIERT` den lokalen Produktkandidaten `3cc85e1`, die sechs Theme-Kontaktbogenwirkungen und die unabhaengige GREEN-QA `f3e2c94`. `WRN-BRAND-THEME-PARITY-M-002` ist damit fuer den lokalen Migrationskandidaten geschlossen; sechs Paletten, die dynamische Systempraeferenz, lokale Persistenz und theme-reaktive Markenakzente sind bestaetigt. Die Abnahme startet kein Folgefeature und erteilt keine Freigabe fuer Fonts, echte Inhalte, Backend, Android, Remote/CI, Cloudflare, Hostinger, Deployment, Signierung, Upload oder Veroeffentlichung. |
| PO-052 | `ACCEPTED-G3-011-PREPARATION-ONLY` | Der Product Owner antwortete am 26. August 2026 mit exakt `fahre fort`, nachdem der Main Agent den naechsten Schritt als Auswahl und zunaechst ausschliessliche Vorbereitung eines neuen Slices beschrieben hatte. Als risikoaermster naechster Wave-4-Kernschritt wird WRN-G3-011 fuer einen versionierten, kanonisch ID-basierten und rein lokalen Zustand fuer `Spaeter lesen`, Gelesen/Ungelesen und Lesefortschritt vorbereitet. Freigegeben sind nur Task Brief, Altparitaet, V1-/Migrations-/Loeschvertrag, Abnahmeplan, Vorbereitungshandoff und konsistente Statusdokumente. Produkt-/Testcode, Fixtures und Mitarbeiterstart benoetigen `START WRN-G3-011`; Offline-Volltexte/Medien, echte Legacy-/Nutzerdaten, Androidmigration, Sync, Cloud, Deployment und Release bleiben gesperrt. |
| PO-053 | `ACCEPTED-G3-011-IMPLEMENTATION-START` | Der Product Owner erteilte am 26. August 2026 exakt `START WRN-G3-011`. Freigegeben ist ausschliesslich der schriftliche Scope in `docs/tasks/WRN-G3-011-LOCAL-SAVED-READING-STATE.md`: minimaler versionierter V1-Lesestatus mit kanonischen IDs, getrennte clientlokale Storagekeys, `Spaeter lesen`, Gelesen/Ungelesen, Lesefortschritt, sichere Lifecycleprojektion, explizite Loeschung, reine selbst erstellte Legacy-Migrationsfixture sowie lokale Tests und visuelle Evidenz. Die Arbeit erfolgt strikt sequenziell mit Backend/Data, danach Frontend Brand und danach unabhaengiger Visual-/Accessibility-QA. Offline-Volltexte/Medien, echte Legacy-/Nutzerdaten, IndexedDB, Cache Storage, Service Worker, Android, Sync, Remote/CI, Cloud, Deployment, Signierung, Upload und Veroeffentlichung bleiben gesperrt. |
| PO-054 | `ACCEPTED-G3-011-CONTRACT-BRIDGE-AMENDMENT` | Der Product Owner erteilte am 26. August 2026 exakt `G3-011 VERTRAGSBRUECKE BEHEBEN`. Freigegeben ist nur ein minimaler additiver Re-Export des bereits implementierten V1-Validators sowie der fuer die Clientadapter notwendigen V1-Typen und Konstanten aus `@wrn/domain`, einschliesslich eng zugehoeriger Exporttests. Vertragssemantik, Schema, Fixtures, Dependencies, Rootkonfiguration, Mobile-WIP, Website und E2E bleiben in diesem Korrekturschritt unveraendert. Nach gesichertem GREEN-Checkpoint wird Backend/Data beendet; erst danach darf ein frischer Frontend-Agent den gesicherten WIP fortsetzen. Alle Daten-, Live-, Remote-, Deployment- und Releasegrenzen bleiben bestehen. |
| PO-055 | `ACCEPTED-G3-011-H001-CORRECTION` | Der Product Owner erteilte am 26. August 2026 exakt `G3-011 H-001 BEHEBEN`. Freigegeben ist ausschliesslich die Korrektur der Clientbindung, damit validierte aktive Feed-/Reader-IDs gemeinsam mit der G3-008-Lifecyclemenge korrekt aufgeloest werden, ohne den fail-closed Schutz fuer Gone, Revoked und Unknown zu schwaechen. Erlaubt sind nur betroffene Mobile-/Website-Projektionen, enge Client-/E2E-Regressionstests sowie H-001-Evidenz und Handoff. Vertrag, Domain, Fixtures, Storageformat, Dependencies, Rootkonfiguration, allgemeines UI/Styling, echte Daten, Alt-/Liveprojekte, Remote/CI, Deployment und Release bleiben unveraendert. Nach gesichertem Kandidaten folgt eine vollstaendige frische unabhaengige Re-QA. |
| PO-056 | `ACCEPTED-FULL-LOCAL-CONTROLLER-REVIEW` | Der Product Owner verlangte am 26. August 2026 zusaetzlich, „vom Kontrolleur einmal alles kontrollieren“ zu lassen. Nach einem korrigierten H-001-Kandidaten und einer vollstaendigen GREEN-Re-QA prueft deshalb genau ein unabhaengiger Architekturkontrolleur den gesamten lokalen Zielprojektstand G3-001 bis G3-011 read-only auf Architektur-/Vertragsgrenzen, Security/Privacy, Datenminimierung, Kosten-/Providergrenzen, Test-/Evidenzvollstaendigkeit, Scopeabweichungen und offene Release-/Migrationsrisiken. Der Kontrolleur veraendert keinen Produkt-, Test- oder Governancecode und fuehrt keine externe Aktion aus. Findings brauchen vor der G3-011-Abnahme eine sichtbare Entscheidung. |
| PO-057 | `ACCEPTED-G3-011-M002-CORRECTION` | Der Product Owner erteilte am 26. August 2026 exakt `G3-011 M-002 BEHEBEN`. Freigegeben ist nur der Escape-/Fokusvertrag der vorhandenen Lesedaten-Loeschdialoge in App und Website sowie eng zugehoerige Client-/E2E-Regressionen, M-002-Evidenz und Handoff. Escape schliesst ohne Loeschung und fuehrt Fokus an den Ausloeser zurueck; Bestaetigen und sichtbares Abbrechen behalten ihre Semantik. Styling, Texte, sonstige UI, Domain, Storage, Vertraege, Fixtures, Dependencies, Rootkonfiguration, Alt-/Liveprojekte und externe Aktionen bleiben unveraendert. Danach folgen frische unabhaengige Re-QA und nur bei GREEN der PO-056-Gesamtcheck. |
| PO-058 | `ACCEPTED-G3-011-B003-AND-GOV-L004-CORRECTION` | Der Product Owner erteilte am 26. August 2026 exakt `G3-011 B-003 UND GOV-L-004 BEHEBEN`. Freigegeben wurden ausschliesslich ein echter Nur-Lese-Schutz fuer unbekannte neuere, ungueltige, defekte oder nicht lesbare clientlokale Lesedaten, bytegleiche Rohwerterhaltung, die Sperre aller automatischen und sichtbaren Lesedatenmutationen, enge Komponenten-/Browserregressionen sowie die drei exakt benannten sekundaeren Statuskorrekturen. Produktkandidat, volle unabhaengige Re-QA und erneuter PO-056-Gesamtcheck mussten strikt sequenziell folgen. Styling, sonstige Funktionen, Domain-/Contentschemas, echte Daten, Alt-/Liveprojekte und externe Aktionen blieben gesperrt. |
| PO-059 | `ACCEPTED-G3-011-VISUAL` | Der Product Owner akzeptierte am 26. August 2026 mit exakt `G3-011 VISUELL AKZEPTIERT` den korrigierten Kandidaten `d19ce4d`, die GREEN-Re-QA `f1ebf70`, den technischen PO-056-Vollrecheck `1b344b6` und den GREEN-Registerabschluss `695b1c0`. Zuvor wurde der sichtbare Task `WRN G2 – Zielarchitektur & ADRs` gelesen und durch einen Context-Continuity-Auditor abgeglichen: Sein Worktree `f430f95` ist eine historische parallele G3-001-Spur mit unversionierten Foundationdateien, keine aktuellere Quelle und enthaelt keine fuer G3-011 fehlende Architekturentscheidung. Er wird nicht kopiert oder gemergt. WRN-G3-011 ist geschlossen; die Abnahme startet kein Folgefeature und erteilt keine Freigabe fuer echte Daten, Android, Remote/CI, Cloud, Deployment, Signierung, Upload oder Veroeffentlichung. |
| PO-060 | `ACCEPTED-G3-012-PREPARATION-ONLY` | Der Product Owner erteilte am 26. August 2026 exakt `BEREITE WRN-G3-012 VOR` und fragte zugleich, welche Voraussetzungen oder spaeteren Schritte noch fehlen. Freigegeben sind ausschliesslich Task Brief, read-only Runtime-/Publisherinventar, Security-/Privacy-Vorpruefung, Paritaets-/Abnahmeplan, Vorbereitungshandoff sowie konsistente Governance-/Statusdokumente. G3-012 bereitet die vollstaendige Entkopplung von `@wrn/test-support` aus Produktquellen, normalen Build-/Publisherpfaden und finalen Artefakten vor; Feed, Discover, Reader, Lifecycle und Websitepublikation sollen spaeter dieselbe atomar validierte lokale Revision konsumieren. Produkt-/Test-/Fixture-/Asset-/Buildcode und Mitarbeiterstart benoetigen `START WRN-G3-012`. Service Worker, Cache/IndexedDB, echte Inhalte, Cloud/Livezugriff, Android, Remote/CI, Deployment, Signierung, Upload und Release bleiben gesperrt. |
| PO-061 | `ACCEPTED-G3-012-IMPLEMENTATION-START` | Der Product Owner erteilte am 27. August 2026 exakt `START WRN-G3-012`. Freigegeben ist ausschliesslich der schriftliche Scope in `docs/tasks/WRN-G3-012-IMMUTABLE-CONTENT-REVISION-CONSUMER.md`: bestehendes Manifest v1 unveraendert wiederverwenden, ein vollstaendiges atomar validiertes lokales Contentbundle mit separatem Release-Descriptor vorbereiten, Test-Support aus Produkt-/normalen Build-/Publisherpfaden und finalen Artefakten entfernen, same-origin Allowlist/Integritaet/Compatibility/No-Side-Effects pruefen und alle akzeptierten Funktionen erhalten. Die Arbeit erfolgt strikt sequenziell mit Backend/Data, danach Frontend und danach unabhaengiger QA. Service Worker, Cache/IndexedDB, echte Inhalte, Live-/Cloudzugriff, Android, Remote/CI, Deployment, Signierung, Upload und Veroeffentlichung bleiben gesperrt. |
| PO-062 | `ACCEPTED-G3-012-M001-CORRECTION` | Der Product Owner erteilte am 27. August 2026 exakt `G3-012 M-001 BEHEBEN`. Freigegeben sind ausschliesslich eine zweistufige Descriptor-/Manifestvorpruefung in den getrennten Mobile-/Websiteadaptern und enge Requestzaehler-Regressionen: Descriptorstruktur und Compatibility vor Manifest, danach erwartete Revision und gepinnter kanonischer Manifesthash vor jedem Payloadrequest. Invalid Descriptor, Compatibility, Revision und Manifesthash muessen je Client null Payloadrequests belegen. Vertraege, Fixtures, Releaseartefakte, Publisher, UI/Styling, Dependencies, Rootkonfiguration und Alt-/Liveprojekte bleiben unveraendert. Nach read-only Voruntersuchung arbeitet genau eine Schreibinstanz; danach folgen frischer Bypassreview, vollstaendige unabhaengige Re-QA und kurzer read-only Architekturreview. G3-013 und alle Cache-, Live-, Android-, Remote-, Deployment- und Releaseaktionen bleiben gesperrt. |
| PO-063 | `ACCEPTED-G3-012-VISUAL` | Der Product Owner akzeptierte am 27. August 2026 mit exakt `G3-012 VISUELL AKZEPTIERT` den korrigierten Produktkandidaten `1520c05`, die vollstaendige GREEN-Re-QA `f122555` und den GREEN-Architektur-Recheck `ac48f86`. WRN-G3-012 ist geschlossen. Die Abnahme startet kein Folgefeature und gibt insbesondere G3-013-Cache/Service Worker/Staging, echte Inhalte, Android, Remote/CI, Deployment, Signierung, Upload oder Release nicht frei. |
| PO-064 | `RECORDED-HEADER-UI-LANGUAGE-PREFERENCE` | In derselben Nachricht forderte der Product Owner fuer einen separaten Folgeslice eine Sprach-Dropdownauswahl im Header. Beim ersten Start muss Englisch voreingestellt sein; nach einer gueltigen Auswahl muss genau diese lokal gespeichert und beim erneuten Oeffnen der App wieder wirksam sein. Ein rein kosmetisches Dropdown ohne echte UI-Sprachwirkung ist nicht ausreichend. App-/Websiteumfang, unterstuetzte Sprachen, Uebersetzungsvertrag, sichere lokale Persistenz, Accessibility und visuelle Matrix werden zuerst read-only inventarisiert und danach in einem eigenen Task Brief mit separatem Startgate gebunden. Noch ist kein Produkt-/Testcode und kein Implementierungsagent freigegeben. |
| PO-065 | `ACCEPTED-G3-013-PREPARATION-ONLY` | Die ausdrueckliche Header-Sprachwahl-Anforderung des Product Owners autorisiert nach geschlossener G3-012-Abnahme ausschliesslich die dokumentarische Vorbereitung von WRN-G3-013: read-only Legacy-/Zielinventar, Security-/Privacy- und Visual-/Accessibility-Vorpruefung, Task Brief, Paritaets-/Abnahmeplan, Vorbereitungshandoff sowie konsistente Governance. Gebunden werden App und dynamische Website, neun Legacy-Paritaetssprachen, Erststart Englisch, getrennte lokale Persistenz und echte vollstaendige Shellsprachwirkung. Der zuvor als G3-013 reservierte Offline-/Cache-Slice wird als WRN-G3-014 weitergefuehrt. Produkt-/Test-/Package-/Buildcode und Implementierungsagenten benoetigen weiterhin exakt `START WRN-G3-013`; statische Landingpages, Inhaltsuebersetzung, Provider, G3-014, Android, Remote/CI und Releaseaktionen bleiben gesperrt. |
| PO-066 | `ACCEPTED-G3-013-IMPLEMENTATION-START` | Der Product Owner erteilte am 27. August 2026 exakt `START WRN-G3-013`. Freigegeben ist ausschliesslich der schriftliche Scope in `docs/tasks/WRN-G3-013-HEADER-UI-LANGUAGE-PREFERENCE.md`: echte lokal gebuendelte Shellsprachwirkung fuer App und dynamische Website in `en`, `de`, `es`, `fr`, `it`, `pt`, `ru`, `el`, `tr`; Erststart Englisch ohne automatischen Write; getrennte sichere Clientpersistenz; native zugaengliche Headerselects und lokale Tests. Zuerst arbeitet genau ein Frontend-Brand-Agent am typisierten Schluesselvertrag, englischen Katalog, Speicheradaptern und der ersten Integration. Erst nach gesichertem Fundament duerfen bis zu drei Spark-Mikroagenten ausschliesslich disjunkte Sprachkataloge bearbeiten; danach folgen frische Integration, read-only Security-/Privacy-Review und unabhaengige Visual-/Accessibility-QA. Artikel-/Originalsprache, Content-IDs/-Hashes/-Revisionen, statische Landingpages, Provider, G3-014, echte Inhalte, Android, Remote/CI und Releaseaktionen bleiben gesperrt. |
| PO-067 | `ACCEPTED-G3-013-M001-CORRECTION` | Der Product Owner erteilte am 27. August 2026 exakt `G3-013 M-001 BEHEBEN`. Freigegeben ist ausschliesslich die responsive Darstellung der bestehenden nativen Sprachselects in Mobile und dynamischer Website: Bei 390 x 844 und 200 Prozent Reflow muss der geschlossene Zustand einen vollstaendigen gebundenen Kompaktcode (`EN`, `DE`, `ES`, `FR`, `IT`, `PT`, `RU`, `EL`, `TR`) oder den vollstaendigen Optionsnamen zeigen, waehrend native Optionsliste, lokalisierter zugaenglicher Name, Fokus, Tastatur, 44-Pixel-Ziel und alle neun Sprachen erhalten bleiben. Erlaubt sind nur betroffene Headerprojektionen, eng notwendige UI-Language-Helfer, minimale responsive Styles, Tests, Evidence und Handoff. Andere Katalogtexte, Storage, Content, Vertraege, Fixtures, Publisher, statische Landingpages, Rootkonfiguration, Alt-/Liveprojekte und externe Aktionen bleiben unveraendert. Danach folgt eine frische vollstaendige unabhaengige Re-QA; technisches GREEN ersetzt keine Product-Owner-Abnahme. |
| PO-068 | `ACCEPTED-G3-013-M001-REMEDIATION-2` | Der Product Owner erteilte am 27. August 2026 exakt `G3-013 M-001 ERNEUT BEHEBEN` und fragte nach der wachsenden Fehlerfolge. Freigegeben ist nur die deterministische Schliessung des in `01a0e07` belegten Nach-Mount-Reflowfalls. Zuerst reproduziert ein frischer Incident-Debugger den Lifecyclefehler read-only und bindet einen roten Nach-Mount-Test; erst danach darf ein frischer Frontend-Brand-Agent die unzuverlaessige Reflowerkennung beider Headerprojektionen sowie eng zugehoerige responsive Styles und Regressionen korrigieren. Initialer und nachtraeglicher Reflow, Resize/Unmount, alle neun Sprachen, Mobile-Dokumentfluss und Websiteheader muessen GREEN sein; danach folgt eine frische vollstaendige unabhaengige Re-QA. Kataloge, Storage, Content, Vertraege, Fixtures, Publisher, statische Landingpages, allgemeines Design, Rootkonfiguration, G3-014, Alt-/Liveprojekte und externe Aktionen bleiben gesperrt. |
| PO-069 | `ACCEPTED-G3-013-VISUAL` | Der Product Owner akzeptierte am 28. August 2026 mit exakt `G3-013 VISUELL AKZEPTIERT` den Produktkandidaten `0462b4c`, die finale unabhaengige GREEN-Re-QA `40f37f6` und den technischen Statuscheckpoint `9fa7795`. Damit sind die neun lokal gebuendelten UI-Sprachen in App und dynamischer Website, Englisch beim Erststart, getrennte lokale Persistenz und die M-001-Reflowkorrektur visuell akzeptiert. WRN-G3-013 ist geschlossen. Diese Abnahme startet weder Nachbesserungen noch G3-014-Vorbereitung oder -Implementierung und gibt keine echten Inhalte, Android-, Remote-/CI-, Cloud-, Deployment-, Signier-, Upload- oder Veroeffentlichungsaktion frei. |
| PO-070 | `ACCEPTED-G3-014-PREPARATION-ONLY` | Der Product Owner antwortete am 28. August 2026 `weiter bitte`, nachdem die G3-013-Abnahme geschlossen und als naechster Schritt ausschliesslich G3-014-Vorbereitung angeboten wurde. Freigegeben sind nur Task Brief, read-only Inhalts-/Storageinventar, vorbereitende Risiko-/Abnahmematrix, Handoff und konsistente Statusdokumente. G3-014 plant getrennte IDB-Inhaltsrevisionen mit explizitem Speichern, atomarem Aktivieren, sicherem Rueckwechsel, monotonem Revocationschutz und eng begrenzter Inhaltsloeschung. Service Worker, Cache Storage und echter Offline-Shell-Kaltstart bleiben separate Folgeslices, ohne den MUST-Umfang zu streichen. `START WRN-G3-014` ist vor weiterer Ausfuehrung erforderlich; danach zuerst read-only Architektur-Vorreview, erst bei GREEN sequenzielle Implementierung. Keine Produkt-/Test-/Fixture-/Buildaenderung, keine Implementierungsmitarbeiter, echten Inhalte, Legacy-/Nutzerdaten, Android-, Remote-/CI-, Deployment- oder Releaseaktionen sind jetzt freigegeben. |

- **PO-099 G3-020 VISUELL AKZEPTIERT:** Der Product Owner akzeptiert am
  1. September 2026 mit exakt `G3-020 VISUELL AKZEPTIERT` den lokalen
  Mobile-Produktkandidaten `57dac7c`. Die frische unabhaengige Terra-QA
  `b80c66c`, der lokale Chief-Securityreview `96d2147` mit null reportable/
  deferred Findings und der transparente Terra-Architektur-Ersatzabschluss
  `0b4304a` sind GREEN. Wegen des ausgeschöpften Kontingents sind Security und
  Architektur nicht als unabhaengige Sol-Gates ausgegeben; ein Sol-Review ist
  vor einem spaeteren Release nachzuholen. G3-020 ist lokal technisch und
  visuell geschlossen. Diese Abnahme startet G3-021 nicht und erteilt keine
  Freigabe fuer echte Inhalte/Provider, Website/Hosting/Live, Android/AAB/
  Play, Signierung, Upload, Deployment oder Release. G3-021 benoetigt exakt
  `START WRN-G3-021`.
- **PO-100 START-WRN-G3-021:** Der Product Owner startet am 1. September 2026
  mit exakt `START WRN-G3-021` den Mobile-only Medien-/Podcast-Hub. Zuerst
  duerfen ausschliesslich drei disjunkte read-only P1-Pruefungen laufen:
  Luna fuer Kontinuitaet/Inventar, Terra fuer Technik/Testbarkeit und Sol
  fuer Architektur/Privacy. Erst ihre Chief-Synthese darf ein exaktes
  Daten-/Admission-/Rechte-Arbeitspaket mit Allowlist, lokalen selbst
  erstellten Testmedien, Abbruchgrenzen und P1-bis-P5-Folge binden. Das Gate
  nimmt keine reale Quelle auf und erlaubt weder Feedabruf, Streaming,
  Download, Hotlinking, Transcoding, Generierung, neue Dependencies/Provider/
  Kosten, Website, Hosting/Live, Android/AAB/Play, Signierung, Upload,
  Deployment noch Release.
