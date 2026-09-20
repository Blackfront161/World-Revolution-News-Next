# WRN Project Instructions

## 1. Auftrag und Prioritaet

Dieses Repository baut das neue, professionelle Grundgeruest fuer World
Revolution News und Solinaridao auf. Der Product Owner ist ein Solo-Entwickler,
der nicht selbst Code schreibt und Entscheidungen ueber klare Berichte,
automatisierte Tests und visuelle Belege abnimmt.

Prioritaeten in dieser Reihenfolge:

1. Korrektheit, Datenschutz und Schutz vor Datenverlust
2. Stabilitaet und reproduzierbare Releases
3. Wartbare, modulare Architektur und saubere Schnittstellen
4. Barrierefreiheit und visuelle Produktqualitaet
5. Kosten- und Token-Effizienz
6. Geschwindigkeit

Zeitdruck ist kein Freigabegrund. Unklarheit wird dokumentiert und nicht durch
eine erfundene Annahme verdeckt.

## 2. Aktuelles Phasengate

**Aktuelle Chief-Übernahme, 8. September 2026:** Der Product Owner benennt
den Main im Task `01a08163-50a9-7d10-aa40-0f9e9cc1f3c3` ausdrücklich zum
neuen Head Chief und beauftragt Codeprüfung, Live-/GitHub-Vergleich,
Bugkorrekturen, Fortsetzung und Produktempfehlungen mit effizienten Modellen.
Die Übernahmebasis ist `e84d839` mit erhaltenem Siebenpfad-WIP. Der gebundene
Auftrag steht in `docs/tasks/WRN-CHIEF-2026-09-08-CODE-PARITY-COMPLETION.md`.
Der P3-A-R9-R2-Kandidat `fe528fd` besteht Chief-Reproduktion und unabhängige
Terra-QA; Sol bestätigt die beiden Produktfixes, bleibt aber wegen drei
Assurance-Mediums RED. Der reine Ausführungsnachtrag
`docs/tasks/WRN-G3-021-P3-A-R9-R3-ASSURANCE-COMPLETION.md` bindet danach
genau denselben Terra-Writer auf zwei Tests und zwei Belege, ohne neue
Produktsemantik. Die getrennten Clear-/Clock-/Lintkorrekturen sind in
`a489f83` und `9b6cc34` gesichert; voller Mobilelauf 342/342 GREEN.
Kein P4-B-, Live-, Provider-, Installations- oder Release-GREEN ist erteilt.

Die folgende Kette dokumentiert die historischen Freigaben und Befunde:

**Neuester verbindlicher Stand:** G3-019 wurde vom Product Owner am
31. August 2026 mit exakt `START WRN-G3-019` als PO-095 gestartet. Der
Produktkandidat `2a7d983` bildet die neun gebundenen P2-C-/P2-R3-A-
Korrekturen ab. Chief und unabhaengige Terra-QA bestaetigen 77 beziehungsweise
80 nach R4 Contract-, 119 Mobile- und 19 Boundarytests sowie beide Typechecks
GREEN. Der versiegelte Sol-Produktscan
`da04a9c5-7d47-4e6b-9a8e-5fc2cd8f7fbf` deckt alle elf R3-Diffpfade ab und
endet mit null reportable/deferred Findings. Der finale Sol-P2-Review fand
keinen Produkt-, Security-, Privacy-, Datenverlust- oder Kopplungsfehler,
aber `P2-FINAL-M-001`: einzelne versprochene Negativtestfaelle fehlten. Der
erste R4-Teststand war nicht ausreichend isoliert. Die gebundene R4-R1-
Korrektur liegt in `182f519`; Chief und frische Terra-QA bestaetigen mit exakt
Node 24.19 80 Contract-, 119 Mobile- und 19 Boundarytests sowie beide
Typechecks GREEN. Der finale Sol-P2-Abschluss `02ad040` schliesst alle neun
Vertragsluecken und `P2-FINAL-M-001`; P2 ist technisch abgeschlossen. Der
P3-Frontendvertrag ist nach zwei unabhaengigen Sol-Runden in `9e3d1e4`
GREEN. Der Terra-P3-Writer stoppte dennoch korrekt fail-closed: WIP `6147b84`
zeigt v1 statt v2, weil P2-Pin und Sidecar zwei Readerdetails-Hashsemantiken
verschieben. Sol bestaetigt in `8588f38` `P3-PIN-M-001` plus
`P3-PIN-L-001`; P3-Ableitung und G3-016-Generator sind nicht ursächlich.
Der enge Korrekturvertrag ist
`docs/tasks/WRN-G3-019-P2-R5-PIN-CORRECTION.md`. Der finale Sol-R2-Precheck
`84020fe` ist GREEN. Der R5-Produktfix `6545b34`, Terra-QA `d4e390b`, der
versiegelte Sol-Scan `337d0542-fd76-4224-ac25-3f756a5d8b9d` und der finale
Sol-Abschluss `6d15a53` sind GREEN; alle Pin-/Precheckfindings sind
geschlossen. P3-R1 liegt im Kandidaten
`d987293`; unabhaengige P4-QA `0961463` und der versiegelte P4-S-Scan
`5f6a6f14-44c1-4e8c-b73e-6fc4a74cc1fb` sind GREEN. Der finale P5-Review
`71fa38b` ist jedoch RED mit `P5-M-001` und `P5-M-002`: renderseitige
Snapshotbindung und reiner v1-Fallback bei `rejected` fehlen. Der enge Vertrag
`docs/tasks/WRN-G3-019-P3-R2-SNAPSHOT-FALLBACK.md` ist gebunden. Der frische
Sol-Precheck `480772d` ist GREEN mit null Findings. Der R2-Produktfix
`ab87da3`, die unabhaengige Terra-QA `aca54d5` und der versiegelte Sol-
Security-Deltacheck `122593b` mit Scan
`3bec79c3-9fc4-431e-9b88-c291e3043d5e` sind GREEN. Der finale Sol-P5-R1-
Abschluss `32bd06d` schliesst beide Medium-Findings mit null neuen Findings.
G3-019 ist technisch GREEN. Der Product Owner akzeptierte den unveraenderten
Produktionssichtstand am 1. September 2026 mit exakt
`G3-019 VISUELL AKZEPTIERT` als PO-097. G3-019 ist damit technisch und
visuell abgeschlossen. Alle Agenten sind beendet und alle
Schreibrechte liegen beim Chief. Website, Shared Reader v1, echte Inhalte/
Medien, Provider, Dependencies sowie Hosting/Live, Android/AAB/Play,
Signierung, Upload und Release bleiben gesperrt. G3-020 und G3-021 sind
vorbereitet. Der Product Owner startet G3-020 am 1. September 2026 mit exakt
`START WRN-G3-020` als PO-098. Jetzt darf ausschliesslich ein frischer
unabhaengiger Sol-Architektur-/Privacy-Precheck den Mobile-only Terminvertrag,
Taxonomie, IANA-Zeit-/DST-Regeln, lokale Auswahl, Offline/Revocation,
Rechte/Provenienz, Kosten- und Testgrenzen pruefen. Produkt-, Test-, Fixture-
und Browserwrites bleiben bis zu einem gesicherten P1-GREEN gesperrt. P1
`7793919` ist YELLOW mit `P1-M-001` bis `P1-M-004`. Der Chief hat C-01 bis
C-20, exakte Allowlist, Boundaryhashes und Pflicht-Negativmatrix in
`docs/tasks/WRN-G3-020-P2-BACKEND-PACKET.md` gebunden. Jetzt muss ein frischer
unabhaengiger Sol-P1-R alle vier Findings schliessen; der erste Recheck
`ab2644b` ist YELLOW mit vier weiteren Ausfuehrungspraezisierungen. Der Chief
bindet Exact-key-/Freshnessschema, konkretes IDB-/Future-Raw-Protokoll,
Rechte-/Plain-text-Orakel und verpflichtende echte IDB-/Capbelege in
`docs/tasks/WRN-G3-020-P2-R1-CONTRACT-COMPLETION.md`. Jetzt muss ein frischer
Sol-P1-R1 alle vier Recheckfindings schliessen; dieser Recheck `24454ec`
bleibt YELLOW wegen Hash-/Revisionpraeimages, gemischter Freshnessprioritaet,
Safety-/Rollbacksemantik und unhaltbarer LocalStorage-CAS-Annahme. Der Chief
bindet die vier letzten Entscheidungen einschliesslich einer getrennten
atomaren Auswahl-IDB in `docs/tasks/WRN-G3-020-P2-R2-FINAL-CONTRACT.md`.
Jetzt muss ein frischer Sol-P1-R2 null offene Findings bestaetigen; P2 bleibt
vorher gesperrt. Der finale P1-R2-Recheck `10615b1` ist GREEN mit null
Findings; alle P1-/P1-R-Vertragsblocker sind geschlossen und die sieben
Boundaryhashes stimmen. Jetzt darf genau ein
`backend_data_reliability_engineer` Terra/high P2 ausschliesslich gemaess der
dreizehnpfadigen Allowlist aus P2/P2-R1/P2-R2 implementieren. Keine Kinder,
kein paralleler Produktwriter, keine Selbsterweiterung der Pfade. P3 bleibt
bis zum gesicherten P2-GREEN gesperrt. Der P2-Writerkandidat `cc800a2` ist
innerhalb der Allowlist beendet; Chief reproduziert beide Typechecks, 5
Contract-, 4 Mobile-, 19 Boundary- und eine echte Browser-IDB-Pruefung sowie
Releaseboundary GREEN. Alle sieben Boundaryhashes und der Fixturehash stimmen.
Jetzt laufen frische unabhaengige Terra-QA und Sol-Security/Privacy parallel;
kein Produktwriter ist aktiv. Terra-QA `8609bd7` ist YELLOW mit falscher R2-
Hashpraeimage, unvollstaendigem Safety/Future-Fail-closed und fehlender
Pflicht-IDB-/Negativmatrix; acht neue ESLintfehler sind belegt. Der
versiegelte Sol-Scan `91a91209-61ee-4f54-b824-45183c355bc9` / `f4abec3` ist
RED mit drei Medium und null deferred: bytegenauer Pinbruch, optional/
ungebundenes Safety persist-before und Eventrevision-Replay. Der Chief bindet
eine enge zwoelfpfadige Korrektur in
`docs/tasks/WRN-G3-020-P2-R1-CORRECTION.md`. Vor frischem Sol-Precheck-GREEN
besteht kein Produktwrite. Der frische Sol-Precheck `788b035` ist GREEN. Der
P2-R1-Produktfix liegt in `906ddc4`, Writerbelege in `a2b978c`; Chief
reproduziert 86 Contract-, 138 Mobile-, 11 fokussierte und 19 Boundarytests,
beide Typechecks, ESLint, echte IDB, Release-/Fixturechecks und sieben Hashes
GREEN. Die frische Terra-QA `08b2cba` bleibt YELLOW mit `M-001/M-002`: Ein
hashkorrekter Safetyrecord kann eine ungueltige Replacementreferenz tragen
und die verpflichtende Negativ-/IDB-Matrix fehlt. Der versiegelte Sol-Scan
`872b4cf5-2ef7-467b-bfdf-9fabdcb4ff8a`, Commit `b799679`, ist RED mit einem
Low und null deferred: Der finale Safetymerge kann vor der Cappruefung
dauerhaft uebergross geschrieben werden. Raw-byte Pin und Eventreplay sind
geschlossen; kein Privacyfinding. Das Sol-Korrekturdesign `0108fc3` ist
GREEN und bindet einen hashgebundenen, monotonen, gecappten Referenzkatalog
sowie Generation `+1` pro erfolgreicher oeffentlicher Mutation. Der Chief-
Vertrag `docs/tasks/WRN-G3-020-P2-R3-CORRECTION.md` ist jetzt massgeblich.
Der frische Sol-Precheck `219ae55` ist mit null Findings GREEN. Der R3-
Produkt-/Testkandidat `4ec5fe6` bindet Referenzen, Vorab-Caps und Generation;
Writerbelege liegen in `b2e730d`. Chief reproduziert 87 Contract-, 138 Mobile-,
drei echte IDB- und 19 Boundarytests, beide Typechecks, ESLint und acht Hashes
GREEN. Der versiegelte Sol-Scan
`2a13c8f3-4052-404c-8074-93e4e37e3bf0`, Commit `13bb86f`, schliesst den
frueheren Merge-DoS mit null reportable/deferred und ohne Privacyfinding. Die
unabhaengige Terra-QA `afd4c05` bleibt jedoch YELLOW mit genau
`P2-R3-QA-M-001`: Die explizite R3-05-/R1-05-/R2-Grenz-, Failure-, Rotation-
und IDB-Matrix fehlt. Der test-only Vertrag
`docs/tasks/WRN-G3-020-P2-R4-TEST-COMPLETION.md` wurde gebunden. Der frische
Sol-Precheck `5b3ba82` ist YELLOW mit zwei Medium und einem Low: Activate-
lower rotiert bei Coverage, gleiche gueltige Referencekeys werden nicht
dedupliziert und der gemeinsame Git-Index braucht eine exklusive A-dann-B-
Stage-/Commitsequenz. Capgrenzen und test-only IDB-Fehlerinjektion sind
machbar. Die historische R4-R1-Produktkorrektur ist in `c86735f` geschlossen;
der Selection-Bytecapfix `cb0f6bc`, QA `f140a1c` und der versiegelte
Securityscan `976086cb-2ba9-4c92-aed1-1dbe45a683fe` sind GREEN. R4-A ist in
`981ead6` beendet. Elf echte R4-B-Browserfaelle einschliesslich A1-H9 liegen
bis `47a6fc3` GREEN vor. Die verbliebene Cap- und Block-/Failurematrix wurde
nach dem kanonischen Sol-Schlussrecheck `b4b5e6e` in zwei disjunkten
Terra-Paketen abgeschlossen: R3-A `76c2b18`, danach R3-B `85a08b8`. Chief
reproduziert gemeinsam 16/16 echte Chrome-/IndexedDB-Faelle, 88 Contract-,
140 Mobile- und 19 Boundarytests, beide Typechecks, Format/Lint, Release-/
Fixturepruefung und acht Hashgrenzen GREEN. Produkt `cb0f6bc`, Fixture,
Harness, Config und Dependencies blieben unveraendert. Die frische
Terra-Testcompletion-QA `c3711bd` schliesst `P2-R3-QA-M-001` ohne neue
Findings. Der versiegelte Sol-Security-Diffscan `d8709fa`, Scan
`e2e1cbcc-f1d8-426e-a8ec-4a25808ef6a5`, deckt 28/28 Diffpfade ab und endet
mit 0 reportable/deferred Findings. Jetzt laeuft ausschliesslich ein frischer
Sol-P2-Architekturabschluss. Dieser Abschluss endet in `91824d2` RED mit
genau `G3-020-P2-FINAL-M-001`: Der Validator erzwingt die gebundenen
Source-/Event-Freshnessrelationen zum Bundleumschlag nicht. P3 bleibt
gesperrt. Der enge Vertrag
`docs/tasks/WRN-G3-020-P2-R6-FRESHNESS-CORRECTION.md` bindet vier
Zeitrelationen, hashkorrekte Equal-/Plus-eine-Millisekunde-Grenztests und eine
Vierpfad-Allowlist. Der erste Sol-Precheck endet in `6fb10df` RED nur mit dem
Low `G3-020-P2-R6-PRE-L-001`: Die geaenderte Contractmodulquelle war nicht
eindeutig in der bisherigen Achter-Hashmenge gezaehlt. Der Vertrag bindet nun
explizit Modul-Vor-/Nachhash plus die acht unveraenderten alten Grenzen als
neun Positionen. Der frische Sol-R1-Recheck `5d6dff9` ist mit null Findings
GREEN. Der enge Terra-Freshnessfix liegt in `9e84af4`: Alle vier
bundleuebergreifenden Zeitrelationen und die hashkorrekte Grenzmatrix sind
innerhalb der Vierpfad-Allowlist umgesetzt; 92 Contract-, 140 Mobile- und 16
Browserfaelle sind auf Writer-/Chief-Ebene GREEN. Die frische unabhaengige
Terra-Re-QA `eb73666` schliesst das R5-Medium ohne neue Findings.
Der versiegelte Sol-Security-Deltacheck `91b2267`, Scan
`5075c5f0-f4db-4d90-b314-c4e05045455f`, endet mit 0 reportable/deferred.
Der finale Sol-P2-R1-Abschluss `da9aa79` bestaetigt die Technik vollstaendig
GREEN, endet aber YELLOW mit genau dem formalen Low
`G3-020-P2-R6-R2-L-001`: Der QA-Bericht nennt einen nicht existierenden
vollen Kandidaten-SHA. Genau diese Zeile ist auf
`9e84af4da9ed52b13a4873627feade133da4dbae` korrigiert. Jetzt folgt nur ein
enger read-only Sol-Metadatenrecheck `374ea21` schliesst das Low mit null
Findings; P2 ist technisch GREEN. Der Sol-P3-Frontend-/Lifecycle-Precheck
`00eaebf` ist mit null Findings GREEN und bindet Controller, lokale Auswahl,
Zeit-/Statussemantik, ehrliche Visualbelege und eine exakte 19-Pfad-Allowlist.
Der Chief hat das Writerpaket
`docs/tasks/WRN-G3-020-P3-FRONTEND-PACKET.md` gebunden. Der P3-Kandidat
`d446f7b` besteht 144 Mobile-, 92 Contract-, 5 Sprach-, 16 echte IDB- und 19
Boundarytests sowie beide Typechecks. Die unabhaengige P4-QA `fbfb4f3` ist
dennoch YELLOW mit `P4-QA-M-001` bis `M-003` und `L-001`: die Visualmatrix
rendert keine Karten/echten Sprachen/Selection/Lifecycle, Reload kann nach
Unmount fortlaufen, Selection-Storagefehler bleiben still und die aktive
Region ist unsichtbar. Der enge Sechspfadvertrag
`docs/tasks/WRN-G3-020-P3-R2-QA-CORRECTION.md` wurde im Kandidaten `daf83ea`
umgesetzt. Die frische Terra-QA und der dokumentierte Terra-
Architektur-Ersatzreview `c952374` sind dennoch RED mit genau einem
gemeinsamen Medium: alte Save-/Clear-Rejections koennen nach Reload oder
Unmount mangels Catch-seitigem Run-/Abortguard noch mutieren. Der enge
Vierpfadvertrag
`docs/tasks/WRN-G3-020-P3-R3-LATE-SELECTION-REJECTION.md` ist massgeblich;
genau ein frischer `frontend_brand_engineer` Terra/high durfte ihn ohne Kinder
und Indexzugriff umsetzen. Der R3-Produktkandidat `57dac7c` schliesst den
Catchfehler. Frische unabhaengige Terra-QA `b80c66c` ist mit 20 fokussierten,
161 Mobile-, 92 Contract-, 5 Sprach-, 16 Chrome-/IDB-, 19 Boundary- und 3
Visualtests sowie drei Typechecks und Build GREEN. Der lokale Chief-
Securityreview `96d2147` endet mit 0 reportable/0 deferred Findings; der
frische Terra-Architektur-Ersatzabschluss `0b4304a` ist GREEN. Beide weisen
ausdruecklich aus, dass das Sol-Kontingent keinen unabhaengigen Sol-Lauf
zulies. Der Product Owner akzeptiert den lokalen Produktkandidaten `57dac7c`
am 1. September 2026 mit exakt `G3-020 VISUELL AKZEPTIERT` als PO-099.
G3-020 ist damit lokal technisch und visuell abgeschlossen. Ein Sol-Review
bleibt vor einem spaeteren Release nachzuholen. Der Product Owner startet
G3-021 am 1. September 2026 mit exakt `START WRN-G3-021` als PO-100. Jetzt
laufen ausschliesslich drei disjunkte read-only P1-Vorpruefungen: Luna fuer
Kontinuitaet/Inventar, Terra fuer Technik/Testbarkeit und Sol fuer
Architektur/Privacy. Sie schreiben nur eigene Evidence/Handoffs. Produkt-,
Test-, Fixture-, Player-, Katalog- und Dependencywrites bleiben bis zur
Chief-Synthese und einem eigenen exakt gebundenen P2-Arbeitspaket gesperrt.
Reale Quellen/Feeds/Medien, Provider, Streaming/Download/Generierung,
Website, Hosting/Live, Android/AAB/Play, Signierung, Upload, Deployment und
Release bleiben OUT. P1-L/T/S sind im Commit `29941c2` YELLOW beendet. Der
Chief bindet ihre Kontinuitaets-, Technik-, Architektur- und Privacyfindings
in `docs/tasks/WRN-G3-021-P2-DATA-ADMISSION-RIGHTS.md`: C-01 bis C-20, sechs
gemeinsam releasegebundene Vertraege, numerische Caps, exakte Allowlist,
Negativmatrix und zehn Boundaryhashes. Jetzt darf nur ein frischer
unabhaengiger Sol-P1-R diesen Vertrag pruefen. Produkt-, Test-, Fixture-,
Browser- und Assetwrites bleiben bis zu dessen gesichertem GREEN gesperrt.
Der erste P1-R `f70a10d` endet RED mit vier Medium- und zwei Low-
Vertragsfindings, jedoch ohne Produktvulnerabilitaet. Der reine R1-Nachtrag
`679450e` bindet exakte Shapes/Zeiten/Revisionen, monotone Safetyoperationen,
orthogonale Playback-/Availabilityautomaten, die vollstaendige 21-Pfad-
Allowlist, bytegenaue selbst erstellte Fixtures sowie JSON-MIME-/Pfadregeln.
Jetzt darf nur ein frischer unabhaengiger Sol-P1-R1 diesen Nachtrag pruefen;
P2 bleibt bis null offenen Findings und separatem Chief-Gatecommit gesperrt.
P1-R1 `6355e3b` bleibt RED mit vier Medium-Restluecken: unvollstaendige
JSON-Typ-/Sortierregeln, lokale Expirydominanz, vermischte Repo-/Runtimepfade
und fehlerhafte Commit-/WAV-Praeimagebindung. Der finale reine R2-Nachtrag
`ff12e6f` bindet alle Feldtypen/Sortierschluessel, `local -> stale` mit
Stop-/No-resume, zehn literale Runtimepfade, den korrekten R1-SHA und einen
vollstaendig deterministischen WAV-Generator. Jetzt darf nur ein frischer
Sol-P1-R2 gegen diesen festen Commit pruefen; P2 bleibt weiter gesperrt.
P1-R2 `7efd5c5` bleibt RED nur wegen einer nicht wortwoertlich geordneten
Availability-Transitionsmenge und einer Low-Verwechslung von Vertragscommit
und folgendem Reviewbasiscommit. Der enge R3-Nachtrag `e4c7cd5` bindet beide
Transitionarrays vollstaendig literal und korrigiert die SHA-Kette. Jetzt
darf ausschliesslich ein frischer Sol-Abschlussrecheck gegen den im Register
gebundenen R3-Commit arbeiten; P2 bleibt bis GREEN und Chief-Gate gesperrt.
Der finale P1-R3-Beleg `425f5a0` ist auf Reviewbasis `bad73c7` GREEN mit null
Findings; alle frueheren Findings, elf Schutz-Hashes und drei
Fixturepraeimages sind geschlossen. Der Chief bindet deshalb
`docs/tasks/WRN-G3-021-P2-WRITER-GATE.md`. Nach dem folgenden separaten
Register-Bindungscommit darf genau ein `backend_data_reliability_engineer`
Terra/high ohne Kinder ausschliesslich die dortigen 21 Pfade fuer den lokalen,
providerfreien P2-Medienkern schreiben. P3, UI, Website, echte Quellen/
Medien, Provider, Dependencies und externe Gates bleiben gesperrt.
Der Terra-S2-WIP besteht beide Typechecks, scoped Lint/Format, 5 Units,
2 echte Chrome-IDB- und 19 Boundarytests, wurde aber korrekt vor dem Commit
gestoppt: globales `core.autocrlf=true` kann die hashgebundene LF-TXT-Fixture
bei frischem Windows-Checkout in CRLF veraendern. Der enge Vertrag
`docs/tasks/WRN-G3-021-P2-R1-EOL-CORRECTION.md` erlaubt nach frischem Sol-
Precheck-GREEN als 22. Pfad nur `.gitattributes` und genau eine rootrelative
`text eol=lf`-Regel. Bis dahin bleibt der WIP uncommittet und P2 gesperrt.
Der frische Sol-EOL-Precheck ist im Belegcommit `0303377` mit null Findings
GREEN. Jetzt darf genau ein frischer Terra/high-S2-R1 ohne Kinder den
erhaltenen WIP uebernehmen, nur die gebundene `.gitattributes`-Zeile ergaenzen,
die gesamte Matrix neu laufen lassen und ausschliesslich bei GREEN einen
22-Pfad-Ergebniscommit erstellen. P3 bleibt gesperrt.
Der providerfreie P2-Produktkandidat liegt inzwischen in `296119e`. Chief
reproduziert beide Typechecks, scoped Format/Lint, 5 fokussierte Units, 2
echte Chrome-/IDB-Happy-Paths, 19 Boundaries sowie alle Asset-, Release-, EOL-
und Boundaryhashes GREEN. Die unabhaengige Terra-QA und der versiegelte Sol-
Security-/Privacy-Review sind jedoch im Evidencecommit `eec64d1` RED. Offen
sind Current-time-/TTL-/Admission-/Rights-Freshness, ein eigener 5000-ms-
Loadertimeout, monotone Safety inklusive Blockpruefung, End-to-End-Rawbindung
und die verpflichtende Negativ-/Browser-IDB-Matrix. Der enge Vertrag
`docs/tasks/WRN-G3-021-P2-R1-PRODUCT-CORRECTION.md` bindet alle Findings und
eine zehnpfadige Allowlist. Der erste Sol-Precheck `4c841ce` ist RED mit zwei
Medium-Vertragsfindings: Die Clock muss je Load-/Save-/Activategrenze frisch
proben, und nur Assets besitzen einen gebundenen Hash. Die R1-Praezisierung
bindet deshalb Clock-Advance bis exakt Expiry sowie ID/null-Hash fuer Source,
Series und Episode und ID/Manifest-SHA fuer Assets. Vor einem frischen
unabhaengigen Sol-Recheck mit null Findings besteht kein Produkt- oder
Testwrite. P3/UI/Player, echte
Quellen/Medien, Provider und alle externen Gates bleiben gesperrt.
Der frische Sol-Recheck ist im Belegcommit `e66b241` mit null Findings GREEN;
beide Precheck-Mediums sind geschlossen und die zehnpfadige Umsetzung ist ohne
JSON-, Asset-, Package- oder Dependencywrite machbar. Der Chief bindet
`docs/tasks/WRN-G3-021-P2-R1-WRITER-GATE.md`. Nach dem folgenden separaten
Gatecommit darf genau ein frischer `backend_data_reliability_engineer`
Terra/high ohne Kinder diese zehn Pfade korrigieren. P3 und alle OUT-/externen
Bereiche bleiben gesperrt.
Der P2-R2-Korrekturkandidat liegt in `1826ed5` mit exakt zehn erlaubten Pfaden.
Chief reproduziert 13 fokussierte Tests, 7 echte Chrome-/IDB-Faelle, 19
Boundaries, beide Typechecks, scoped Lint/Format sowie alle JSON-/Asset-/EOL-/
Package- und zehn Boundaryhashes GREEN. Jetzt duerfen frische unabhaengige
Terra-QA und ein versiegelter Sol-Security-/Privacy-Deltacheck parallel nur
eigene Evidence/Handoffs schreiben. Produkt- und Testwrite, P3/UI/Player,
echte Quellen/Medien, Provider und alle externen Gates bleiben gesperrt. Nach
beiden GREENs ist ein finaler frischer Sol-Architekturabschluss Pflicht.
Die frische Terra-QA `a32d3c1` ist YELLOW mit `P2-R2-QA-M-001`: wesentliche
Exact-key-/Zeit-/Cap-/Raw-/Block-/Abort-/Future-IDB-Negativfaelle fehlen. Der
erste versiegelte Securityversuch wurde vom Zugriffssystem ohne verwertbares
Ergebnis abgebrochen und zaehlt weder RED noch GREEN. Ein enger defensiver
Sol-Integrity-/Privacy-Review `aa055ee` ist RED mit vier Mediums und null
Privacy/deferred: Higher-Safety erhaelt Entryinhalte nicht byteidentisch,
Revocationreferences sind keine Exact-cover-Union, erfolgreicher Previous-
Rollback ist nicht erreichbar und Future-/Corrupt-IDB-Records werden zu flach
validiert. Der Chief bindet alle fuenf Punkte in
`docs/tasks/WRN-G3-021-P2-R3-INTEGRITY-ROLLBACK-TEST-CORRECTION.md`. Vor einem
frischen Sol-Precheck-GREEN besteht kein Produkt-/Testwrite. P3 und alle OUT-
Bereiche bleiben gesperrt.
Der erste R3-Precheck `f6feb41` ist RED mit genau einem Medium: Die Bundle-
Exact-keys binden noch nicht wortwoertlich Transporthash, aeussere Revision,
vollen erlaubten Rootpin sowie alle sechs Descriptor-/Dokumentrelationen an
die gespeicherten Rawbytes. Die R1-Praezisierung ergaenzt diese vier
Selbstbindungen und echte IDB-Negativfaelle; gekoppelt unerreichbare Caps
werden ueber reale Maximalfaelle plus isolierte Grenz-/Redundanzinvarianten
belegt. Vor frischem Sol-Recheck-GREEN bleibt jeder Produkt-/Testwrite sowie
P3 und alle OUT-Bereiche gesperrt.
Der frische R1-Recheck `56a59bc` schliesst `P2-R3-PRE-M-001`, bleibt jedoch
RED mit genau `P2-R3-R1-M-001`: R3-01 erlaubte neue References nur fuer neue
Revocation-Zielkeys, R3-02 verlangt sie auch fuer neue aktuelle Katalog-IDs.
Die R2-Praezisierung bindet deshalb neue References exakt fuer neue aktuelle
IDs, Entrytargets und Replacementtargets und ergaenzt den positiven
`higher/additive-current-ids-only`-Testfall. Vor einem weiteren frischen
Sol-Recheck mit null Findings bleibt jeder Produkt-/Testwrite sowie P3 und
alle OUT-Bereiche gesperrt.
Der finale frische R2-Abschlussrecheck `2cd42d7` ist mit null Findings GREEN:
`P2-R3-R1-M-001` und `P2-R3-PRE-M-001` sind geschlossen, R3-01 bis R3-05
sowie Matrix 1 bis 8 sind innerhalb derselben zehn Pfade umsetzbar. Der Chief
bindet deshalb `docs/tasks/WRN-G3-021-P2-R3-WRITER-GATE.md`. Nach dem
folgenden separaten Gatecommit darf genau ein frischer
`backend_data_reliability_engineer` Terra/high ohne Kinder die zehn Pfade
korrigieren. P3 und alle OUT-/externen Bereiche bleiben gesperrt.
Der erste S2-R3-Writer hinterlaesst einen uncommitteten, unstaged WIP nur in
erlaubten Pfaden. Exakt Node 24.19 bestaetigte vor dem letzten begonnenen
Cap-Helferdelta 51 fokussierte, 9 echte Chrome-/IDB- und 19 Boundaryfaelle,
beide direkten Typechecks, Lint/Format sowie Fixture-/Releasechecks GREEN;
die vollstaendige Literal-/Capmatrix ist aber noch nicht abgeschlossen. Nach
mehreren engen Fortsetzungsturns ist die Instanz kontextuell beendet und hat
alle Rechte abgegeben. Der Chief bindet deshalb
`docs/tasks/WRN-G3-021-P2-R3-R1-WRITER-CONTINUATION.md`: Genau ein frischer
Terra/high-Ersatzwriter darf ohne Kinder den erhaltenen WIP sequenziell
fertigstellen. Kein Parallelwriter, kein neuer Pfad und kein Commit vor der
vollstaendigen Matrix. P3 und alle OUT-/externen Bereiche bleiben gesperrt.
Der sequenzielle Ersatzwriter schliesst den P2-R3-Kandidaten in
`d0830f8` innerhalb von acht erlaubten Diffpfaden. Chief reproduziert unter
exakt Node 24.19 beide Typechecks, Format/Lint, 70 fokussierte, 9 echte
Chrome-/IDB- und 19 Boundarytests sowie Fixture-/Releasechecks, Diffcheck und
Allowlist GREEN. Der pnpm-Wrapper bleibt wegen seiner nicht autorisierten
Dependency-Repairforderung unbenutzt; direkte vorhandene Binaries pruefen
dieselben Configs nichtmutierend. Jetzt duerfen frische unabhaengige Terra-QA
und ein defensiver Sol-Integrity-/Privacy-Deltarecheck parallel nur eigene
Evidence/Handoffs schreiben. Produkt-/Testwrite, P3 und alle OUT-/externen
Bereiche bleiben gesperrt. Erst beide GREENs erlauben einen finalen frischen
Sol-Architekturabschluss.
Die frische Terra-QA und der defensive Sol-Integrity-/Privacy-Deltarecheck
sind im Evidencecommit `873ba96` nicht GREEN. QA meldet
`P2-R3-QA-M-001..003`: Capgrenzen erreichen nicht die Produktpfade, die echte
4x3-Block-/Assethashmatrix fehlt und Future-/Descriptor-Deep-IDB-Faelle sind
unvollstaendig. Sol meldet zwei Produkt-Mediums plus ein Assurance-Medium,
null Privacy und null deferred: Der Rotationsreadback vergleicht nicht den
vollstaendigen Active-/Previous-/Candidate-Sollzustand, ein nichtkanonischer
leerer Controlrecord darf mutieren und die Pflichtmatrix bleibt offen. Der
Chief bindet alle Punkte in
`docs/tasks/WRN-G3-021-P2-R4-READBACK-CONTROL-MATRIX-CORRECTION.md`. Vor einem
frischen unabhaengigen Sol/high-Precheck mit null Findings besteht kein
Produkt- oder Testwrite. P3 und alle OUT-/externen Bereiche bleiben gesperrt.
Der unabhaengige R4-Precheck ist im Evidencecommit `0bf4140` RED mit
`P2-R4-PRE-M-001..005` und `P2-R4-PRE-L-001`, bei null Privacy und null
deferred. Offen waren exakt erreichbare Control-Metadaten, die monotone
Safetydeckung von Active/Previous, Manifest-Asset-Exact-cover,
Admission-Eindeutigkeit je `(kind,sourceId)`, Source-Freshness gegen
`generatedAt` und die erlaubte JSON-MIME-OWS-Form. Der Chief bindet alle sechs
Dispositionen ohne neuen Writerpfad in
`docs/tasks/WRN-G3-021-P2-R4-R1-CONTRACT-COMPLETION.md`. Vor einem frischen
unabhaengigen Sol/high-R1-Recheck mit null Findings bleibt jeder Produkt-,
Test-, Fixture-, Browser- und Assetwrite gesperrt. P3 und alle OUT-/externen
Bereiche bleiben gesperrt.
Der frische R4-R1-Abschlussrecheck ist im Evidencecommit `0299859` auf Basis
`cbf4d98` mit null High-/Medium-/Low-, Privacy-, Coverage- oder deferred
Findings GREEN. Alle sechs R4-Precheckfindings sind widerspruchsfrei und in
der unveraenderten zehnpfadigen Allowlist geschlossen. Der Chief bindet
deshalb `docs/tasks/WRN-G3-021-P2-R4-R1-WRITER-GATE.md`. Nach dessen
separatem Gatecommit darf genau ein frischer
`backend_data_reliability_engineer` Terra/high ohne Kinder die zehn Pfade
umsetzen. P3, UI/Player, echte Quellen/Medien, Provider, Dependencies und alle
OUT-/externen Gates bleiben gesperrt.
Der erste R4-Writerkandidat `9a2499b` besteht auf Chief-Ebene beide Typechecks,
74 fokussierte, 10 echte Chrome-/IDB- und 19 Boundarytests, Format/Lint sowie
Fixture-/Releasechecks. Der nach `fix-finding` verpflichtende frische read-only
Bypass-/Regression-Review ist dennoch RED mit fuenf Medium und zwei Low, null
Privacy/deferred: Rotationsreadback mappt `state()`-Fehler nicht auf
`storage-failure`; der exportierte Admission-Dokumentvalidator umgeht
Source-Freshness; Cap-, 4x3-Block-/Assethash-, Future-/Descriptor- und
Rotationsfaultmatrizen bleiben unvollstaendig; Status-200-`Content-Range` und
MIME-Fehlerkategorie sind falsch; Evidence ist nicht an den Ergebnis-SHA
gebunden. Der Chief bindet diese bereits normierten Restpunkte in
`docs/tasks/WRN-G3-021-P2-R4-R2-BYPASS-CORRECTION.md`. Nach dessen separatem
Commit darf ausschliesslich derselbe Terra/high-Writer ohne Kinder innerhalb
derselben zehn Pfade fortsetzen. Kein Parallelwriter und kein zweiter
Patch-Candidate-Reviewzyklus. P3 und alle OUT-/externen Bereiche bleiben
gesperrt.
Der R4-R2-Writer schliesst R2-01, R2-02, R2-03, R2-04-A und R2-06 im
erlaubten unstaged WIP, endet aber nach mehreren engen Fortsetzungsturns
kontextuell vor Previous-Rollback, Higher/additive und R2-05. Seine
Schreibrechte sind frei. Der Chief bindet deshalb
`docs/tasks/WRN-G3-021-P2-R4-R3-WRITER-CONTINUATION.md`: Nach dessen
separatem Commit darf genau ein frischer
`backend_data_reliability_engineer` Terra/high ohne Kinder den erhaltenen WIP
sequenziell innerhalb derselben zehn Pfade fertigstellen. Kein Parallelwriter,
kein neuer Pfad und kein Commit vor der vollstaendigen Matrix. P3 und alle
OUT-/externen Bereiche bleiben gesperrt.
Der frische R4-R3-Ersatzwriter beendet den achtpfadigen Produkt-/Test-/
Evidencekandidaten in
`fcc0aa9206ed59edf7420cd913c4e25073ce7faf`. Der Chief reproduziert unter
exakt Node 24.19 beide Typechecks, 90 fokussierte, 23 echte Chrome-/IDB- und
19 Boundarytests, scoped Format/Lint, Fixture-/Release-, Schutz-Hash-, Diff-
und Allowlistchecks GREEN. Nach dem separaten Chief-Metadatencommit duerfen
frische unabhaengige Terra-QA und ein defensiver Sol-Integrity-/Privacy-
Deltarecheck parallel nur eigene Evidence/Handoffs schreiben. Produkt-/
Testwrite, P3 und alle OUT-/externen Bereiche bleiben gesperrt. Erst beide
GREEN erlauben einen finalen frischen Sol-Architekturabschluss.
Die frische Terra-QA ist GREEN mit null Findings. Der defensive Sol-
Integrity-/Privacy-Deltarecheck ist RED mit genau zwei Assurance-Medium und
einem Product-Low, bei null Privacy/deferred: Gesamt-/Safety-`+1`-Preimages
erreichen wegen nicht neu gebundener Descriptoren ihre Cap-Senke nicht;
Release-/Dokument-Equal-Produktfälle beziehungsweise die gekoppelte
Unerreichbarkeitsdisposition sind unvollständig; der Raw-Revision-Fall endet
vor der äußere/raw Bindung; Body-Stream-Reject wird `invalid` statt
`network-error`. Der Chief bindet
`docs/tasks/WRN-G3-021-P2-R5-CAP-REVISION-STREAM-CORRECTION.md`. Vor einem
frischen unabhängigen Sol/high-Precheck mit null Findings bleibt jeder
Produkt-/Testwrite gesperrt. P3 und alle OUT-/externen Bereiche bleiben
gesperrt.
Der frische P2-R5-Precheck `393e69b` ist RED mit genau zwei Medium-
Vertragsfindings, null Privacy/Coverage/deferred: Ein vollständig akzeptierter
Release-Equal-Fall widerspricht dem unveränderlichen Buildpin, und der echte
Safety-`+1`-Pfad liefert am monotonen `nextSafety()`-Merge `protected` statt
`invalid-candidate`. Der Chief bindet
`docs/tasks/WRN-G3-021-P2-R5-R1-CONTRACT-COMPLETION.md`: Der gepinnte
2838-Byte-Release bleibt der volle Ready-Fall; 524288/524289 werden
senkentreu bis Hashguard beziehungsweise Bodycap belegt. Safety-`+1` bleibt
ausdrücklich `protected`, vollständig neu gebunden und ohne Writes. Vor einem
frischen unabhängigen Sol/high-R1-Recheck mit null Findings bleibt jeder
Produkt-/Testwrite sowie P3 und OUT/extern gesperrt.
Der frische R5-R1-Recheck auf `1cc8dc3` schließt beide Precheck-Mediums,
bleibt aber RED nur mit `P2-R5-R1-M-001`: Revocation kann den nach
Peer-Minimierung verbleibenden Gesamtcapanteil wegen des strengeren
Safetycaps 65536 nicht erfolgreich aktivieren. Der Chief bindet
`docs/tasks/WRN-G3-021-P2-R5-R2-FINAL-CONTRACT.md`: Fünf normale
Dokumentklassen behalten die Target-max-Dreierregel; Revocation erhält
65536/65537 Safetyproduktpfade, isolierte Dokumentcapgrenze und eine explizite
Safety-Dominanzinvariante. Vor einem frischen unabhängigen Sol/high-R2-
Abschlussrecheck mit null Findings bleibt jeder Produkt-/Testwrite sowie P3
und OUT/extern gesperrt.
Der finale frische R5-R2-Abschlussrecheck auf `0f15247` ist mit null High-/
Medium-/Low-, Coverage-, Privacy- oder deferred Findings GREEN. Alle R4-R3-,
R5-Precheck- und R5-R1-Findingketten sind vertraglich geschlossen; die
fünfpfadige Umsetzung ist ohne Store-, Contract-, Fixture-, Asset-, Pin- oder
Dependencyänderung möglich. Der Chief darf jetzt ein separates
P2-R5-Writergate binden. Vor dessen eigenem Commit besteht weiterhin kein
Produkt-/Testwrite; P3 und alle OUT-/externen Bereiche bleiben gesperrt.
Der Chief bindet deshalb
`docs/tasks/WRN-G3-021-P2-R5-WRITER-GATE.md`. Nach dessen separatem Commit
darf genau ein frischer `backend_data_reliability_engineer` Terra/high ohne
Kinder ausschließlich die fünf Pfade für Loader-/Cap-/Revisionsbelege und
sein Evidence/Handoff schreiben. Kein Parallelwriter, kein neuer Pin, keine
Fixture, keine Store-/Contract-/Dependencyänderung und kein Commit vor der
vollständigen Node-24.19-Matrix. P3 und alle OUT-/externen Bereiche bleiben
gesperrt.
Der fünfpfadige P2-R5-Produkt-/Testkandidat liegt in
`9de38687adad1bcf24a0dd65fc01b446a4f38bb1`. Chief reproduziert unter exakt
Node 24.19 beide Typechecks, 92 fokussierte, 26 echte Chrome-/IDB- und 19
Boundarytests, scoped Format/Lint, Fixture-/Release-, zehn Schutz-Hash-, Diff-
und Allowlistchecks GREEN. Nach separatem Chief-Metadatencommit dürfen frische
unabhängige Terra-QA und ein defensiver Sol-Integrity-/Privacy-Recheck
parallel nur eigene Evidence/Handoffs schreiben. Produkt-/Testwrite, P3 und
alle OUT-/externen Bereiche bleiben gesperrt. Erst beide GREEN erlauben den
finalen frischen Sol-Architekturabschluss.
Die frische Terra-QA ist mit 92/92 Vitest-, 26/26 echten Chrome-/IDB- und
19/19 Boundaryfällen sowie beiden Typechecks und allen statischen Gates
GREEN. Der defensive Sol-Integrity-/Privacy-Recheck bleibt RED mit genau
`P2-R5-DIP-M-001`, einem Assurance-Medium bei null Produkt-, Privacy- und
deferred Findings: Die Target-max-Fälle verwenden nicht die gebundenen
kleinsten Peers und prüfen Peer-/Zielbytes nicht literal, die Revocation-
Safetydominanz ist nicht assertiert und Release 524289 besitzt kein
Null-Digest-Orakel. Der Chief bindet diese reine Testlücke in
`docs/tasks/WRN-G3-021-P2-R6-CAP-ORACLE-TEST-CORRECTION.md` mit einer exakten
Vier-Pfad-Allowlist. Vor einem frischen unabhängigen Sol/high-Precheck mit
null Findings besteht kein Test-/Browserwrite; Produktcode, P3 und alle OUT-/
externen Bereiche bleiben gesperrt.
Der frische unabhängige Sol/high-P2-R6-Architekturprecheck ist auf Basis
`d42d680189905709a7f556fac5f905073eaa9412` mit null Blocker-, High-, Medium-,
Low-, Coverage-, Privacy- oder deferred Findings GREEN. Er bestätigt die
sechs Minimalbytes, alle fünf Peer-/Targetpaare, die Revocation-Dominanz, den
echten Browserzugang zu den Validatoren und die Vier-Pfad-Umsetzbarkeit ohne
Produkt-, Fixture-, Pin- oder Dependencyänderung. Jetzt darf der Chief ein
separates P2-R6-Writergate binden. Vor dessen eigenem Commit bleibt jeder
Test-/Browserwrite sowie P3 und alle OUT-/externen Bereiche gesperrt.
Der Chief bindet deshalb
`docs/tasks/WRN-G3-021-P2-R6-WRITER-GATE.md`. Nach dessen separatem Commit
darf genau ein frischer `backend_data_reliability_engineer` Terra/high ohne
Kinder ausschließlich zwei Tests und zwei Writerbelege verändern. Produkt,
Store, Contract, Fixtures, Assets, Pin und Dependencies bleiben read-only;
kein Git-Index durch den Writer und keine Übergabe vor vollständiger
Node-24.19-Matrix. P3 und alle OUT-/externen Bereiche bleiben gesperrt.
Der test-only P2-R6-Ergebniscommit
`baf622a94ca69f5eaaf63a1ed0bf0b80d5b45f36` umfasst exakt zwei Tests und
zwei Writerbelege. Chief reproduziert beide Typechecks, 92 Vitest-, 26 echte
Chrome-/IDB- und 19 Boundaryfälle, scoped Format/Lint, Fixture-/Release-, zehn
Schutz-Hash-, Diff- und Vier-Pfad-Scopechecks GREEN. Produktcode ist
unverändert. Nach separatem Chief-Metadatencommit dürfen frische unabhängige
Terra-QA und ein defensiver Sol-Integrity-/Privacy-Recheck parallel nur eigene
Evidence/Handoffs schreiben. Erst beide GREEN erlauben den finalen frischen
Sol-P2-Architekturabschluss; P3 und alle OUT-/externen Bereiche bleiben
gesperrt.
Die frische unabhängige Terra-QA und der defensive Sol-Integrity-/Privacy-
Recheck sind auf Basis `a215a318d95ac0cd4957013c0e8f448844640c1a` beide
GREEN. Beide reproduzieren 92 Vitest-, 26 echte Chrome-/IDB- und 19
Boundaryfälle, beide Typechecks und alle statischen Gates; der Sol-Recheck
meldet 0 reportable, 0 deferred, 0 Privacy-, Produkt- oder Assurancefindings.
`P2-R5-DIP-M-001` ist vollständig geschlossen. Nach separatem Evidencecommit
darf ausschließlich ein frischer unabhängiger Sol/high-P2-
Architekturabschluss laufen. Produkt-/Testwrite, P3 und alle OUT-/externen
Bereiche bleiben bis zu dessen gesichertem GREEN gesperrt.
Der finale frische Sol-P2-Architekturabschluss auf Basis
`e1eedab2c95768335499c48ed2498465cbc4876f` bestätigt R6 und alle früheren
Findingketten, endet aber RED mit genau `G3-021-P2-FINAL-M-001`: Ein
identischer Candidate-only-Retry derselben höchsten Revision und desselben
Release-Transporthashs liefert `conflict` statt des in R1 gebundenen
idempotenten No-op. Zustand, Privacy und Datenintegrität bleiben unverändert;
es gibt null weitere Findings oder deferred. Der Chief bindet die
slotvollständige Korrektur für Candidate, Active und Previous in
`docs/tasks/WRN-G3-021-P2-R7-CANDIDATE-IDEMPOTENCY-CORRECTION.md` mit einer
exakten Fünf-Pfad-Allowlist. Vor frischem unabhängigem Sol/high-Precheck-GREEN
besteht kein Produkt-/Testwrite; P3 und alle OUT-/externen Bereiche bleiben
gesperrt.
Der frische Sol-R7-Precheck auf Basis
`c83c9c71119b3f85449d701cebb5b2abc2d29af7` ist RED mit zwei Medium und einem
Low/Coverage bei null Privacy/deferred: R7 lässt Same-revision-Split-brain
zwischen Slots offen, bindet den Equal-No-op nicht exakt an den aktuellen
monotonen Safetyrecord und definiert Nullwrite nicht als echte IDB-
Operationszähler. Der Chief bindet die drei Dispositionen in
`docs/tasks/WRN-G3-021-P2-R7-R1-IDEMPOTENCY-INTEGRITY-COMPLETION.md`: ein
Transporthash je Revision über alle Slots, exakte `nextSafety`-Identität und
`put/add/delete/clear = 0` je Store. Vor frischem unabhängigem Sol/high-R1-
Recheck-GREEN besteht kein Produkt-/Testwrite; P3 und alle OUT-/externen
Bereiche bleiben gesperrt.
Der frische Sol-R7-R1-Recheck auf Basis
`11aaff9d6486048111656511f583be437009452c` bleibt RED mit einem Medium und
einem Low/Coverage: Candidate-Safetydeckung in `validState()` kollidiert mit
der gebundenen Safety-Persistenz bei Aktivierung und würde bestehende
Activation-Faultsenken unerreichbar machen; außerdem waren nicht alle drei
Split-brain-Slotpaare Pflicht. Der Chief bindet in
`docs/tasks/WRN-G3-021-P2-R7-R2-FINAL-IDEMPOTENCY-CONTRACT.md` ausdrücklich
das bestehende persist-on-activate-Modell, read-only `nextSafety() !== null`
vor Equal-No-op und alle drei ungeordneten Slotpaare. Vor frischem
unabhängigem Sol/high-R2-Abschlussrecheck-GREEN besteht kein Produkt-/
Testwrite; P3 und alle OUT-/externen Bereiche bleiben gesperrt.
Der finale frische Sol-R7-R2-Abschlussrecheck ist auf Basis
`bdf24d215e81aae9a752f3901dad769af922dfa7` mit null Blocker-, High-, Medium-,
Low-, Coverage-, Privacy- oder deferred Findings GREEN. Persist-on-activate,
read-only `nextSafety() !== null`, alle drei Split-brain-Slotpaare und echte
Nullwrite-Zähler sind widerspruchsfrei; die unveränderte 92/26/19-Baseline
bleibt erreichbar. Jetzt darf der Chief ein separates R7-Writergate binden.
Vor dessen eigenem Commit besteht kein Produkt-/Testwrite; P3 und alle OUT-/
externen Bereiche bleiben gesperrt.
Der Chief bindet deshalb `docs/tasks/WRN-G3-021-P2-R7-WRITER-GATE.md`. Nach
dessen separatem Commit darf genau ein frischer
`backend_data_reliability_engineer` Terra/high ohne Kinder ausschließlich
Store, Storetest, echte Browser-/IDB-Spec und zwei Writerbelege verändern.
Kein Parallelwriter, kein Git-Index durch den Writer und kein Commit vor der
vollständigen erweiterten Node-24.19-Matrix. P3 und alle OUT-/externen
Bereiche bleiben gesperrt.
Der R7-Produktkandidat liegt in
`c096d7d6ccfdb8bc08225c757bcf8cb86e101517` innerhalb von vier erlaubten
Pfaden. Chief reproduziert mit exakt Node 24.19 beide Typechecks, 92
fokussierte, 27 echte Chrome-/IDB- und 19 Boundaryfälle, Format/Lint,
Fixture-/Release-, zehn Hash-, Diff- und Scopechecks GREEN. Jetzt dürfen
frische unabhängige Terra-QA und ein defensiver Sol-Integrity-/Privacy-
Deltarecheck parallel nur eigene Evidence/Handoffs schreiben. Produkt- und
Testwrite, P3 und alle OUT-/externen Bereiche bleiben gesperrt. Erst beide
GREENs erlauben einen finalen frischen Sol-P2-Architekturabschluss.
Die frische Terra-QA und der defensive Sol-Integrity-/Privacy-Deltarecheck
sind beide GREEN. Beide reproduzieren die vollständige 92/27/19-Matrix,
beide Typechecks und alle statischen Gates; Sol meldet 0 reportable, 0
deferred, 0 Privacy- und 0 Assurance-/Coverage-Findings. Jetzt darf
ausschließlich ein frischer unabhängiger Sol/high-P2-Architekturabschluss
den festen R7-Produktkandidaten und die gesamte P2-Findingkette prüfen.
Produkt-/Testwrite, P3 und alle OUT-/externen Bereiche bleiben bis zu dessen
gesichertem GREEN gesperrt.
Der finale frische Sol/high-P2-Architekturabschluss auf Evidencebasis
`93496e0f307ac3a7701d8531d74b01f64cd9bef0` ist GREEN mit 0 Blocker, High,
Medium, Low, Assurance-/Coverage-, Privacy- oder deferred Findings. Er
reproduziert 92/27/19, beide Typechecks und alle statischen Gates und schließt
`G3-021-P2-FINAL-M-001` sowie sämtliche früheren P2-Findingketten. G3-021 P2
ist damit technisch GREEN. Alle Agenten sind beendet und alle Schreibrechte
liegen wieder beim Chief. P3 startet nicht automatisch und benötigt einen
eigenen Vertrag und ein eigenes Startgate. UI/Player, reale Quellen/Medien,
Provider, Dependencies, Website/Live, Android/AAB/Play, Signierung, Upload,
Deployment und Release bleiben gesperrt.
Die anschließende PO-Antwort `ok fahre fort bitte` erlaubt ausschließlich die
sichere P3-P0-Vorbereitung und ersetzt kein Produkt-Writergate. Read-only
Kontinuität, Visual/A11y und Architektur/Privacy sind YELLOW abgeschlossen:
Es gibt keine bestehende P3-Produktvulnerabilität, aber vor Implementierung
müssen Active-only/Freshness/Safety, Asset-zu-Decoder, Run-/Abort-/Late-event,
minimaler Resume-Store, ehrlicher Produktroute/Testharness und vollständige
Sprach-/Viewportmatrix gebunden werden. Der Chief-Vertrag
`docs/tasks/WRN-G3-021-P3-PLAYER-LIFECYCLE-UI-CONTRACT.md` trennt P3-A
headless Player/Lifecycle/Resume strikt von P4-B Mobile-UI, bindet disjunkte
Allowlists, 25 Negativgruppen und Schutz-Hashes. Vor separatem Vertragscommit
und frischem unabhängigem Sol/high-Recheck mit null Findings besteht kein
Produkt-, Test-, Fixture- oder Browserwrite. P4-B und OUT/extern bleiben
gesperrt.
Der unabhängige Sol/high-P3-P0-R1-Vertragsrecheck auf Basis `4b7cf5e` ist RED
mit genau zwei Privacy-Mediums und einer gekoppelten Coverage-Auswirkung:
`updatedAt` widerspricht dem exakten Resume-Minimalschema; außerdem fehlen
automatische bekannte Resume-Löschung bei Expiry/Revocation und sichtbare,
race-sichere Mismatch-Bereinigung samt echten IDB-/CAS-/Failure-/Late-result-
Belegen. Der enge Nachtrag
`docs/tasks/WRN-G3-021-P3-R1-RESUME-PRIVACY-CORRECTION.md` entfernt jeden
Aktivitätszeitpunkt und bindet einen generation- und recordexakten
`deleteIfExact`-Pfad sowie die ersetzten Matrixpunkte 17/22. Vor separatem
Nachtragscommit und frischem Sol/high-Recheck-GREEN bleibt P3-A vollständig
gesperrt; P4-B und OUT/extern bleiben ebenfalls gesperrt.
Der frische unabhängige Sol/high-P3-P0-R2-Abschlussrecheck auf Basis
`2d4c62963e20576b4e3455303e0d2036ba15a445` ist mit null High-, Medium-,
Low-, Privacy-, Coverage- oder deferred Findings GREEN. Er schließt beide
R1-Privacy-Findings und bestätigt das exakte achtfeldrige Resume-Schema ohne
Aktivitätszeitpunkt, generation- und recordexaktes `deleteIfExact`, ehrliche
Expiry-/Revocation-/Mismatch-Bereinigung sowie die echten IDB-/CAS-/Failure-/
Late-result-Orakel. Die P3-P0-Vertragsvorbereitung ist damit technisch GREEN.
Sie erteilt noch kein Produktrecht: P3-A benötigt ein eigenes ausdrückliches
PO-Startgate `START WRN-G3-021-P3-A` und danach einen separaten Chief-
Writergatecommit. P4-B, UI sowie alle OUT-/externen Bereiche bleiben gesperrt.
Der Product Owner startet P3-A am 7. September 2026 mit exakt
`START WRN-G3-021-P3-A` als PO-101. Der Chief bindet auf der sauberen Basis
`25cd45d6588025d8c455fc803e034f28ac58a068` den engen Vertrag
`docs/tasks/WRN-G3-021-P3-A-WRITER-GATE.md`. Nach dessen separatem Commit darf
genau ein frischer `frontend_brand_engineer` Terra/high ohne Kinder und ohne
Git-Index ausschließlich die zehn neuen P3-A-Pfade für headless Media-Hub,
Player, Lifecycle, Resume-Store, Units, echte Chrome-/IDB-Belege und eigene
Evidence/Handoff schreiben. P4-B/UI, P2, Fixtures, Assets, Dependencies,
Website und alle OUT-/externen Bereiche bleiben gesperrt.
Der erste P3-A-Writer stoppt korrekt fail-closed mit einem unstaged WIP in
exakt zehn erlaubten Pfaden. Exakt Node 24.19 bestätigt Mobile-Typecheck,
vier Unit-Smokes und einen Chromium-Import-Smoke; die Pflichtmatrix ist damit
nicht erfüllt. Ein unabhängiger read-only WIP-Review endet RED mit sieben
Mediums und null High/Low: vollständige Snapshot-/Zeit-/Safety-/Identitäts-
bindung, headerloser Loader/Timeout-/URL-Race, Playback-/Late-events,
Resume-DB-Schema, vollständiger atomarer Readback, Resume-Orchestrierung und
Matrix 1 bis 23. Der Chief bindet sie in
`docs/tasks/WRN-G3-021-P3-A-R1-WRITER-CONTINUATION.md`. Nach dessen separatem
Commit darf genau ein frischer `frontend_brand_engineer` Terra/high ohne
Kinder und Git-Index den erhaltenen WIP nur in denselben zehn Pfaden
fortsetzen. P4-B und OUT/extern bleiben gesperrt.
Der R1-Ersatzwriter schließt fünf der sieben Mediumgruppen produktseitig und
gibt alle Rechte mit weiterhin unstaged Zehn-Pfad-WIP zurück. Unter exakt
Node 24.19 sind Mobile-Typecheck, 12 fokussierte Units, vier echte Chromium-/
IDB-/Request-Fälle, Format, Diffcheck und zwölf Schutz-Hashes GREEN. Offen
bleiben exakt `P3-A-R1-WIP-M-001` zur vollständigen Hub-/Resume-
Orchestrierung und `P3-A-R1-WIP-M-002` zur Matrix 1 bis 23. Der Chief bindet
die finale sequenzielle Fortsetzung in
`docs/tasks/WRN-G3-021-P3-A-R2-FINAL-WRITER-CONTINUATION.md`. Nach deren
separatem Commit darf genau ein frischer `frontend_brand_engineer` Terra/high
ohne Kinder und Git-Index nur denselben WIP fertigstellen. P4-B und OUT/
extern bleiben gesperrt.
Der R2-Ersatzwriter ergänzt die Resume-Orchestrierung und gibt alle Rechte
mit weiterhin unstaged Zehn-Pfad-WIP zurück. Unter exakt Node 24.19 sind
sieben Typechecks, 21 Units, sechs echte Chromium-/IDB-/Request-Fälle und
zwölf Schutz-Hashes GREEN. Offen bleiben genau zwei Mediums zur vollständigen
Release-/Rights-/4×3-Safety-Lifecyclematrix und zur übrigen Matrix 1 bis 23
einschließlich Faults, Caps, Future/Corrupt, CAS/Clear und Late-sinks. Der
Chief bindet die test- und evidencezentrierte Fortsetzung in
`docs/tasks/WRN-G3-021-P3-A-R3-MATRIX-COMPLETION.md`. Nach separatem Commit
darf genau ein frischer `frontend_brand_engineer` Terra/high ohne Kinder und
Git-Index nur dieselben zehn Pfade abschließen. P4-B und OUT/extern bleiben
gesperrt.
Der R3-Writer schließt zwei weitere Produktfehler zu spätem Pause-Save und
werfender Decoderbereinigung. 35/35 Units, 9/9 echte Chromium-/IDB-Fälle,
Typechecks, Build, Lint/Format, 19 Boundaries, Fixture/Release, zwölf Hashes
und Allowlist sind GREEN. Offen bleiben zwei Assurance-Mediums zur
vollständigen 6×7-Lifecycle-/Fault-/IDB-/Privacy-Matrix. Der volle Mobilelauf
ist 221/224 wegen drei vorbestehender, in P3-A gesperrter `App.test.tsx`-
Erwartungen und darf nicht als GREEN gelten. Der Chief bindet
`docs/tasks/WRN-G3-021-P3-A-R4-FINAL-MATRIX.md`; nach separatem Commit darf
genau ein frischer Terra/high-Writer ohne Kinder und Index nur dieselben zehn
Pfade abschließen. P4-B und OUT/extern bleiben gesperrt.
Der R4-Writer ergänzt die 6×7-Lifecycle-Unitmatrix, schließt einen echten
Mid-Load-Kontextverlust und erreicht 80/80 fokussierte Tests plus
Mobile-Typecheck GREEN. Er stoppt weiterhin fail-closed, weil die echte
Chromium-/IDB-Fault-/Privacy-Restmatrix und die Abschlussläufe fehlen. Der
Chief bindet `docs/tasks/WRN-G3-021-P3-A-R5-BROWSER-COMPLETION.md`. Nach
separatem Commit darf genau ein frischer Terra/high-Writer ohne Kinder und
Index nur dieselben zehn Pfade beenden. P4-B und OUT/extern bleiben gesperrt.
Chief reproduziert R5 mit 80/80 Units, aber nur 14/15 Chromiumfällen. Der
letzte Fall ist nicht isoliert: vier Faultorakel laufen parallel, während der
Digestfall global `crypto.subtle.digest` überschreibt; außerdem fehlt der
literale 5001-ms-Punkt. Der test-only Vertrag
`docs/tasks/WRN-G3-021-P3-A-R6-BROWSER-DETERMINISM.md` bindet sequenzielle
Faults, sichere Restaurierung, 4999/5000/5001 und zwei aufeinanderfolgende
Browserläufe in drei Pfaden. Vor separatem Commit besteht kein Testwrite;
Produkt, P4-B und OUT/extern bleiben gesperrt.
Der P3-A-Kandidat `67cc592` besteht auf Chief-Ebene 80/80 Units, zweimal
15/15 Chromium-/IDB-Fälle, sieben Typechecks, Build, Lint/Format, 19
Boundaries, Fixture/Release und zwölf Hashes. Der volle Mobilelauf ist
rechnerisch konsistent 266/269 mit denselben drei vorbestehenden gesperrten
App-Testfehlern. Unabhängige Terra-QA ist dennoch YELLOW mit einer fehlenden
echten 6×7-Resume-/Cleanupmatrix. Der defensive Integrity-/Privacy-Review ist
RED mit drei Product-, einem Privacy- und einem Assurance-Medium: runfremdes
Timeout-Clearing, ungeprüfter/durationblinder Seek, falsche Storagefehler,
in-flight Save nach Invalidierung und zu schwache Orakel. Der Chief bindet
`docs/tasks/WRN-G3-021-P3-A-R7-PRODUCT-PRIVACY-ASSURANCE-CORRECTION.md` mit
einer Sieben-Pfad-Allowlist. Vor frischem Sol/high-Precheck-GREEN besteht kein
Produkt-/Testwrite; P4-B und OUT/extern bleiben gesperrt.
Der frische Sol/high-R7-Precheck ist im Evidencecommit `8c83a5e` RED mit
genau zwei Mediums und null High/Low/deferred. `P3-A-R7-PRE-PRIV-M-001`
verlangt für `saved` und Exact-`no-op` eine result-state-/generationgebundene
Save-Kompensation mit sinkloser Late-result-Semantik.
`P3-A-R7-PRE-A-M-001` verlangt literale Sollwerte je Reader-, Digest-,
CreateURL-, `src`-/`load`-, Play- und echtem live DOM-Fehler. Der Chief bindet
beide Dispositionen ohne neuen Writerpfad in
`docs/tasks/WRN-G3-021-P3-A-R7-R1-CONTRACT-COMPLETION.md`. Vor einem frischen
unabhängigen Sol/high-R1-Abschlussrecheck mit null Findings bleibt jeder
Produkt-/Testwrite gesperrt; P4-B und OUT/extern bleiben ebenfalls gesperrt.
Der frische unabhängige Sol/high-R7-R1-Abschlussrecheck ist im Evidencecommit
`9025f22` mit null High-, Medium-, Low-, Privacy-, Coverage- oder deferred
Findings GREEN. Beide R7-Precheck-Mediums und alle ursprünglichen QA-/DIP-
Findingketten sind für die Umsetzung vollständig gebunden. Der Chief bindet
deshalb `docs/tasks/WRN-G3-021-P3-A-R7-R1-WRITER-GATE.md`. Nach dessen
separatem Commit darf genau ein frischer `frontend_brand_engineer` Terra/high
ohne Kinder und Git-Index ausschließlich die sieben erlaubten Pfade
korrigieren. P4-B und OUT/extern bleiben gesperrt.
Der R7-R1-Produktkandidat liegt in `7fe4b7a` mit exakt sieben erlaubten
Pfaden. Chief reproduziert unter exakt Node 24.19 128/128 fokussierte Tests,
zweimal 16/16 echte Chromium-/IndexedDB-Fälle, sieben Typechecks, Mobile-
Build, scoped Lint/Format, 19/19 Boundaries, Fixture-/Releasegrenzen, zwölf
Schutz-Hashes, Diff und Allowlist GREEN. Der volle Mobilelauf bleibt ehrlich
314/317 mit exakt denselben drei gesperrten `App.test.tsx`-Baselinefehlern.
Jetzt dürfen frische unabhängige Terra-QA und ein defensiver Sol-Integrity-/
Privacy-Deltarecheck parallel ausschließlich eigene Evidence/Handoffs
schreiben. Produkt-/Testwrite, P4-B und OUT/extern bleiben gesperrt. Erst
beide GREENs erlauben einen finalen frischen Sol-Architekturabschluss.
Die frische Terra-QA und der defensive Sol-Integrity-/Privacy-Deltarecheck
sind im Evidencecommit `73cd6e3` nicht GREEN. Beide bestätigen exakt drei
Mediums bei null High/Low/deferred und keinem separaten Privacyfinding:
Storagefehler werden an Pause-Save und Resume-Seek falsch degradiert, alte
Save-/Cleanup-/Catchpfade können mangels originärer Epoch-/Mountguards einen
neuen Lauf überschreiben, und die 6×7-Tabelle variiert nur Namen statt echter
Senken. Timer-A/B, private Seekgrenze, Duration/CAS, URL-Revoke und live DOM-
Fault bleiben geschlossen. Der Chief bindet
`docs/tasks/WRN-G3-021-P3-A-R8-STORAGE-EPOCH-MATRIX-CORRECTION.md` innerhalb
derselben Sieben-Pfad-Allowlist. Vor frischem unabhängigen Sol/high-Precheck-
GREEN besteht kein Produkt-/Testwrite; P4-B und OUT/extern bleiben gesperrt.
Der frische unabhängige Sol/high-R8-Precheck ist im Evidencecommit `5905c2f`
mit null High-, Medium-, Low-, Product-, Privacy-, Coverage- oder deferred
Findings GREEN. Er bestätigt die senkentreue Storagefehlersemantik, originäre
Epoch-/Mountguards, immer sinklose Exact-Privacy-Kompensation, Entfernung des
Player-only-Unmount-Bypasses und die echte Unit-/Chromium-6×7-Matrix innerhalb
der unveränderten sieben Pfade. Der Chief bindet deshalb
`docs/tasks/WRN-G3-021-P3-A-R8-WRITER-GATE.md`. Nach dessen separatem Commit
darf genau ein frischer Terra/high-Frontendwriter ohne Kinder und Index
arbeiten. P4-B und OUT/extern bleiben gesperrt.
Der R8-Produktkandidat liegt in `c2265af` mit sechs erlaubten Diffpfaden.
Chief reproduziert unter exakt Node 24.19 134/134 fokussierte Tests, zweimal
17/17 echte Chromium-/IndexedDB-Fälle einschließlich realer 6×7-Matrix,
sieben Typechecks, Mobile-Build, scoped Lint/Format, 19 Boundaries, Fixture-/
Releasegrenzen, zwölf Schutz-Hashes, Diff und Allowlist GREEN. Der volle
Mobilelauf bleibt ehrlich 320/323 mit denselben drei gesperrten
`App.test.tsx`-Baselinefehlern. Jetzt dürfen frische unabhängige Terra-QA und
ein defensiver Sol-Integrity-/Privacy-Deltarecheck parallel nur eigene
Evidence/Handoffs schreiben. Produkt-/Testwrite, P4-B und OUT/extern bleiben
gesperrt. Erst beide GREENs erlauben den finalen frischen Sol-Abschluss.
Die frische Terra-QA und der defensive Sol-Integrity-/Privacy-Recheck sind im
Evidencecommit `ca43167` nicht GREEN. Beide bestätigen die R8-Korrekturen für
Hub-Storage, originäre Epoch-/Mountguards, sinklose Late-Save-Kompensation und
den entfernten Player-Unmount-Bypass. Offen bleiben genau
`P3-A-R8-DIP-M-001` (aktueller später Player-Storage-Recheck behält
Availability `local`) und das gemeinsame Assurance-Medium
`P3-A-R8-QA-M-001`/`P3-A-R8-DIP-A-M-001` (6×7-Matrix nicht vollständig
senkentreu). High, Low, Privacy und deferred sind null. Der enge Vertrag
`docs/tasks/WRN-G3-021-P3-A-R9-LATE-STORAGE-MATRIX-CORRECTION.md` bindet den
Produktübergang, fünf Recheckgrenzen und eine feste echte Unit-/Chromium-IDB-
Matrix in sechs Pfaden. Vor frischem unabhängigem Sol/high-Precheck-GREEN
bleibt jeder Produkt-/Testwrite gesperrt. P4-B und alle OUT-/externen Bereiche
bleiben gesperrt.
Der frische Sol/high-R9-Precheck ist im Evidencecommit `3241642` RED mit genau
`P3-A-R9-PRE-M-001`: Ein verspätetes bestätigtes Save-`no-op` kann einen
bereits vor Save A vorhandenen exakten Resume-Record löschen. Record- und
Generationsexaktheit liefern ohne `saved` keine Mutationsprovenienz. Der enge
Nachtrag
`docs/tasks/WRN-G3-021-P3-A-R9-R1-NOOP-PROVENANCE-COMPLETION.md` bindet
Kompensation deshalb ausschließlich an bestätigtes `saved`, verlangt reale
Unit-/Chromium-IDB-Datenverlustregressionen und nimmt nur
`apps/mobile/src/mobile-media-hub.ts` als siebten Allowlistpfad auf. Vor einem
frischen unabhängigen Sol/high-R1-Abschlussrecheck mit null Findings besteht
kein Produkt-/Testwrite. P4-B und alle OUT-/externen Bereiche bleiben
gesperrt.
Der frische unabhängige Sol/high-R9-R1-Abschlussrecheck ist im Evidencecommit
`192997d` mit null Findings in allen Klassen GREEN. Er bestätigt, dass
`P3-A-R8-DIP-M-001`, das gemeinsame R8-Assurance-Medium und
`P3-A-R9-PRE-M-001` innerhalb exakt sieben Pfaden vollständig umsetzbar sind:
`saved` liefert die Mutationsprovenienz, jedes alte `no-op` bleibt persistent
unverändert, fünf Player-Rechecks und die reale 42-Zellen-Unit-/Chromium-IDB-
Matrix sind mit vorhandenen Seams erreichbar. Store, P2, Schema, Dependencies
und Produkt-Testhooks bleiben unverändert. Der Chief bindet deshalb
`docs/tasks/WRN-G3-021-P3-A-R9-R1-WRITER-GATE.md`. Nach dessen separatem
Commit darf genau ein frischer `frontend_brand_engineer` Terra/high ohne
Kinder und Git-Index die sieben Pfade umsetzen. P4-B und OUT/extern bleiben
gesperrt.
Der erste R9-R1-Writer gibt den erhaltenen WIP innerhalb exakt sieben Pfaden
unstaged und uncommitted fail-closed zurück. Player-Storageatomik, Late-save-
Provenienz, fünf Rechecks und 146 fokussierte Tests sind GREEN; sieben
Typechecks, Build, scoped Lint/Format, 19 Boundaries sowie Fixture-/
Releasechecks bestehen, und der volle Mobilelauf ist ehrlich 334/337 mit nur
den drei gesperrten Baselinefehlern. Die echte Chromium-/IndexedDB-Matrix ist
aber nur für sechs Pause-Zellen vollständig literal; 36 Zellen bleiben offen.
Der Chief bindet deshalb
`docs/tasks/WRN-G3-021-P3-A-R9-R2-WRITER-CONTINUATION.md`. Nach dessen
separatem Commit darf genau ein frischer `frontend_brand_engineer` Terra/high
ohne Kinder und Git-Index den erhaltenen WIP ausschließlich in denselben
sieben Pfaden fertigstellen. Kein Produktkandidat, keine QA und kein P4-B-
Start folgen vor vollständiger Matrix und Chief-Reproduktion.
G3-018 ist technisch
GREEN und wurde vom Product Owner am 31. August 2026 mit exakt
`G3-018 VISUELL AKZEPTIERT` als PO-093 sichtbar akzeptiert. G3-016 ist
sichtbar akzeptiert. G3-017 wurde
mit PO-086 gestartet, ist im lokalen Produktkandidaten `73215b1` technisch
GREEN und wurde vom Product Owner am 31. August 2026 mit exakt
`G3-017 VISUELL AKZEPTIERT` als PO-089 visuell akzeptiert. P1 bis P4 sind
beendet; das einzige P4-Finding `P4-A-M-001` ist durch Terra-QA, den
versiegelten Sol-Securityscan
`0b0645db-0200-462f-9296-08de8133eea4` und den finalen Sol-Architektur-Recheck
geschlossen. G3-017 ist damit abgeschlossen. Alle Agenten sind beendet, alle
Schreibrechte liegen beim Chief. Website/Hosting/Live,
Android/AAB/Play, Signierung, Upload und Release bleiben gesperrt. Die
nachfolgenden G3-015-/G3-016-Zustaende sind Baseline und Historie; sie erteilen
keine neuen Start- oder Schreibrechte.

PO-090 `fortfahren` erlaubte am 31. August 2026 die sichere Pre-Start-Pflege
fuer WRN-G3-018. PO-091 erteilt anschliessend exakt `START WRN-G3-018`. Der
Mobile/App-only-Vertrag, das read-only Inventar und das Delegationsregister
sind auf Basis `c78a804` gebunden. Jetzt startet ausschliesslich ein frischer
unabhaengiger Sol-Architektur-/Vertragsreview. Produktcode, Tests und Browser-
Evidence bleiben bis zu dessen gesichertem GREEN gesperrt. Der Such-/Filterkern,
Website, Backendvertraege, Fixtures und alle externen Gates bleiben
unveraendert/gesperrt.

P1 ist auf Basis `7a25694` mit null Findings GREEN beendet. Sol bindet eine
exakte P2-Allowlist, native `details`/`summary`-Offenlegung, umfassend
fluechtige Kriterien, deterministischen Fokus, unveraenderte Offline-/Reader-/
Save-Semantik sowie die neunsprachige responsive/A11y-Testmatrix. Jetzt darf
genau ein frischer `frontend_brand_engineer` Terra/high P2 schreiben; keine
Kinder oder parallelen Schreiber. Domain, Contentvertraege, Fixtures, Website,
Dependencies und externe Gates bleiben read-only/gesperrt.

P2 ist im Kandidaten `fd3b0f9` GREEN gesichert. Native Filteroffenlegung,
aktive Kriterien ausserhalb der Offenlegung, deterministischer Fokus und
kompakte Karten bleiben innerhalb der exakten Mobile-Allowlist. P3 und der
enge P3-R1-Dokumentrecheck sind GREEN; `P3-QA-L-001` ist geschlossen. Der
offizielle Playwrightlauf besteht mit 9 Mobile-PASS, 12 erwarteten Website-
Skips und null Fehlern. Writer- und QA-Belege binden 26 beziehungsweise 27
PNG-Dateien. Der versiegelte P4-S-Scan
`e52275b4-ce9c-42db-a144-204f638ad833` deckt alle 42 Diffpfade ab und endet
mit null reportable/deferred Findings. P4-A ist mit null Findings GREEN und
bestaetigt keinen Produkt-/Testdelta nach `fd3b0f9`. G3-018 ist technisch und
sichtbar abgeschlossen. Alle Agenten sind beendet, alle Rechte liegen beim
Chief. G3-019 startet nicht automatisch. Website, Hosting/Live, echte
Quellen/Inhalte, Android/AAB/Play,
Signierung, Upload und Release bleiben gesperrt.

PO-092 bindet getrennt die Marken-/Roadmap- und Quellenpraezisierung. PO-096
praezisiert spaeter: Das Modul `Globale Lage` bleibt aus Start, Fuer mich,
Entdecken und G3-019 bis G3-021 ausgeschlossen, darf aber als eigene spaetere
FUTURE-Funktion vorgemerkt werden. Es benoetigt einen neuen Produktbrief,
redaktionelle Regeln, klare Abgrenzung zur verworfenen unklaren Tageslage,
Regionen-/Quellenbalance, Rechte/Provenienz und ein eigenes sichtbares START-
Gate. Die neue App bleibt eine
professionell optimierte Fortfuehrung der Code-26-Live-App und kein stilles
Fremd-Redesign. Neue globale Quellenkandidaten bleiben ausschliesslich eine
spaetere Quellenpass-Inventur unter `WRN-CONTENT-SOURCES-001`; ohne exaktes
Startgate sind Recherche, Admission, Feed, Import und Produktprojektion
gesperrt.

Der R1-Kandidat `a77d7b2` schliesst Pinrevision, fail-closed Medienrechte/
lokale Asset-ID und Formatfinding. Der Security-Deltacheck
`d32e155a-b2fa-4517-b481-6d3b6da9163c` ist GREEN mit null Findings. Die
unabhaengige R1-QA bleibt YELLOW nur fuer `P2-QA-M-003`: echte Loadertriple-
Grenzen und saubere Dimensions-/Pixelflaechenbelege fehlen. Weil Transport-
und Decoded-JSON-Cap beide 512 KiB sowie Pixelcap und `2048 ** 2` identisch
sind, sind isolierte nachgelagerte `+1`-Faelle mathematisch unerreichbar. Der
Chief bindet deshalb in
`docs/tasks/WRN-G3-019-P2-R2-BOUNDARY-EVIDENCE.md` echte Produktpfadtests plus
Redundanzinvarianten. Zuerst muss ein frischer Sol-Architekturreview diese
Disposition GREEN bestaetigen; bis dahin bleiben Testwrite, P3 und alle OUT-
Bereiche gesperrt.

Der frische Sol-P2-R2-Architekturprecheck auf `1d7f225` ist GREEN mit null
Findings. Der Test-only Writer hat die Redundanzdisposition im Kandidaten
`d66ee6e` umgesetzt: echter Loadertripel ohne `content-length` ueber
`ReadableStream`, Dimensionsmatrizen mit Gegenachse 1, explizite
Konstanteninvarianten und maximaler `2048 x 2048`-Equal-Fall. Chief reproduziert
34 Contract-, 21 Mobile- und 19 Boundarytests sowie beide Typechecks GREEN.
Produktquellen und Fixtures sind unveraendert. Frische Terra-QA und der
versiegelte Security-Deltacheck sind mit null Findings GREEN. Jetzt prueft ein
frischer Sol-Review vor P3 die vollstaendige Abbildung des Produktbriefs im
Vertrag. Er bestaetigt sechs Medium-Luecken: Transformprovenienz, eindeutige
Blockanker, Vorgaengerrelation, Quellenprofil, Alttext/Assetresolver und
Translationbindung. Der erste R3-Recheck fand drei weitere Praezisierungen;
der frische R3-R1-Recheck ist mit null Findings GREEN. Genau ein Terra/high-
R3-Writer hat den Kandidaten `2a7d983` innerhalb der sechspfadigen Allowlist
beendet; alle Rechte liegen wieder beim Chief. Frische Terra-QA und Sol-
Security laufen parallel. P3 bleibt bis zu deren GREEN und finalem Sol-
Abschluss gesperrt.

PO-094 `BEREITE WRN-G3-019 VOR` erlaubt ausschliesslich die Reader-v2-
Dokument-, Inventar-, Test- und Delegationsvorbereitung. Luna fand einen
veralteten PO-092-Statussatz; Sol meldete sechs Vertragsluecken im alten
Kurzbrief. Der neue Brief bindet deshalb ein optionales snapshotgebundenes
Mobile-Sidecar mit Reader-v1-Fallback, stabile Abschnitts-/Quellhashes,
elementweise Bildrechte, selbst erstellte lokale Medien/Translationsfixtures,
null Remoteprovider, unveraenderte Back-/Offline-/Save-Garantien und eine
sequenzielle P1-bis-P5-Pruefkette. Website, Shared Reader v1, echte Inhalte/
Quellen, Provider, Produkt-/Testcode und alle externen Gates bleiben gesperrt.
Der unabhaengige Luna-P0-R-Dokumentrecheck auf `c0d8d06` ist GREEN: alle sechs
Sol-Vertragsluecken sind im Brief operationalisiert, keine Produkt-/Test-/
Fixture-/Dependencydatei wurde veraendert und es bleibt keine offene
Vorbereitungsluecke. PO-095 erteilt am 31. August 2026 exakt
`START WRN-G3-019`. Jetzt darf ausschliesslich ein frischer unabhaengiger
Sol-P1-Architektur-/Vertragsreview die gebundene Mobile-Sidecar-, v1-Fallback-,
Rechte-, Privacy-, Offline-/Back-/Save- und Testarchitektur pruefen. Produkt,
Tests, Fixtures, Browser, Provider und externe Bereiche bleiben bis zu einem
gesicherten P1-GREEN gesperrt. G3-020 und G3-021 wurden getrennt nur
dokumentarisch/read-only vorbereitet; sie sind nicht gestartet. G3-020 bindet
eine Mobile-only Kontinent-/Land-/Regionstaxonomie, maximal fuenf kommende
Termine, IANA-Zeitzonen, lokale Auswahl und null Geolocation. G3-021 bindet
getrennte Media-/Admission-/Rechte-/Consent-/Lifecyclevertraege, Click-to-load,
No-Tracking, monotone Revocation und einen providerfreien lokalen Basisslice.
G3-020 benoetigt zuerst den sichtbaren Abschluss von G3-019 und ein eigenes
`START WRN-G3-020`; G3-021 entsprechend G3-020 und `START WRN-G3-021`.
Echte Quellen, Provider, Produkt-/Testcode und externe Gates bleiben fuer
beide Folgeslices gesperrt.

Der frische G3-019-P1-Architekturreview auf `c4d3b82` ist YELLOW beendet und
meldet vier Medium-Vertragsluecken: externer Whole-document-Pin, verlustfreie
Exact-cover-Abbildung auf v1-Bloecke, monotone Medien-Sperre ueber A/B/A und
Neustart sowie numerisch testbare Caps. Der Chief hat C-01 bis C-20 und die
exakte P2-Allowlist in `docs/tasks/WRN-G3-019-P2-BACKEND-PACKET.md`
dokumentarisch gebunden. P2 bleibt gesperrt, bis ein frischer unabhaengiger
Sol-P1-R-Recheck alle vier Findings schliesst. Kein Produkt-, Test-, Fixture-
oder Browserwrite ist vorher erlaubt.

Der frische unabhaengige Sol-P1-R-Recheck auf `12d208c` ist inzwischen GREEN:
P1-M-001 bis P1-M-004 sind ohne neue Findings geschlossen, die vier
Boundary-Hashes stimmen und vor P2 besteht null Produkt-/Testdelta gegen
`fd3b0f9`. Jetzt darf genau ein `backend_data_reliability_engineer` Terra/high
P2 ausschliesslich gemaess
`docs/tasks/WRN-G3-019-P2-BACKEND-PACKET.md` implementieren. Keine Kinder,
keine parallelen Produktwriter und keine Selbsterweiterung der Allowlist. P3,
Browser/Visual, Website, Shared Reader v1, echte Inhalte/Medien, Provider,
Dependencies und alle externen Gates bleiben gesperrt.

Der P2-Writerkandidat `d47ef47` besteht auf Writer-Ebene zwei Typechecks und
13 fokussierte Units. Die unabhaengige QA ist dennoch YELLOW mit drei Medium-
und einem Low-Finding: Pinrevision nicht verglichen, Medienrechte/lokale
Assetbindung nicht fail-closed, C-13-Caps und Dreifach-Grenzmatrix
unvollstaendig sowie zwei Bericht-Whitespacefehler. Der vollstaendige Sol-
Securityscan `7269a526-96f6-4a7f-8ffd-e6dbd2c78e08` ist GREEN mit null
reportable/deferred Findings, bestaetigt aber die drei QA-Mediums als P3-
Blocker. Jetzt darf genau ein frischer Terra/high-Backend-/Data-Writer nur die
Allowlist in `docs/tasks/WRN-G3-019-P2-R1-CORRECTION.md` bearbeiten. Danach
folgen frische QA und ein Security-Deltacheck. P3 und alle OUT-Bereiche bleiben
gesperrt.

Der aktuelle Zustand ist **G3-014 durch PO-073 visuell akzeptiert;
G3-015 durch PO-074 gestartet und mit Outcome A umgesetzt. Der eingefrorene
funktionale Ausgangskandidat ist `1dc087f3b3c9a73330f2481b3c2c444548eb00d6`;
der aktuelle lokale Website-Sichtkandidat nach den gebundenen Markenkorrekturen
ist `8df7b5c`. P1, P2 und P3 sind beendet;
P4-Q, der versiegelte P4-S-Securityscan `8b3c96fd-5fc7-4359-8559-d21a9dbe7273`
und P4-A sind GREEN. Der Product Owner hat den lokalen Website-Sichtkandidaten
`8df7b5c` mit PO-079 visuell akzeptiert; G3-015 ist lokal visuell abgenommen.**

Outcome A trennt Readiness und Operation. Update darf terminal
`indeterminate`/`native-outcome-unbound` enden; Busy endet; es gibt keinen
Auto-Retry und nach Neustart keinen rueckwirkenden Erfolg. Enable/Remove
behalten strengere bestaetigte Ergebnisse. Die unabhaengige QA bestaetigt
108 Website-, 5 Sprach-, 20/32 Node- und 19 Boundarypruefungen, beide
Typechecks, Lint, Build, 204 Bilder, A11y und Reflow. P4-S pruefte den ganzen
Diff mit 40/40 Reviewpositionen und schloss mit null reportable/deferred
Findings. P4-A bestaetigt keine Produkt-, Sicherheits-, Datenschutz-,
Datenverlust- oder Architekturfinding im G3-015-Scope.

Der Product Owner hat die erste Sichtprobe mit `G3-015 AENDERUNG:` nicht
akzeptiert: Buttons wirkten zu gross, das Websitelogo zu klein und die
theme-reaktive Markenfarbigkeit zu schwach. Die eng gebundene Korrektur aus
`docs/tasks/WRN-G3-015-VISUAL-BRAND-CORRECTION.md` ist in `9136cec`
umgesetzt. Der anschliessende unabhaengige Visual-/A11y-Recheck `d05150b`
war GREEN. Die zweite PO-Sichtprobe fordert jetzt eine weitere konkrete
V3-Korrektur fuer magenta Aktionskontrollen, kompakte cyan umrandete Sprach-/
Themeauswahl, reine Sprachcodes, nicht gefuellte aktive Navigation und eine
Cyan-Magenta-Artikelquellenleiste. Vertrag und alleiniger Schreibscope:
`docs/tasks/WRN-G3-015-VISUAL-BRAND-CORRECTION-V3.md`. Mobile, Shared Tokens,
Assets, Backend und Worker bleiben unveraendert/read-only. Danach erneut
unabhaengige visuelle/A11y-QA und lokale PO-Sichtabnahme.
Die vom PO bereitgestellte signierte AAB ist nur als unveraenderte
Designreferenz inventarisiert; Bindung und Uebernahmeregel stehen in
`docs/evidence/WRN-G3-015/AAB-DESIGN-BASELINE.md`. Kein AAB-/Altcode-, Asset-,
Signierungs-, Installations-, Upload- oder Releaseauftrag entsteht daraus.

Der erste unabhaengige sichtbare V4-Review des Kandidaten `d3b8398` war RED
mit zwei Medium-Abnahmeluecken: Im Pink-Theme erscheinen die funktionalen
Cyan-/Magenta-Rollen als Pink/Violett; ausserdem deckt der 200-%-Reflow nur
Dark/Light statt aller vier geforderten Themes ab. Enge Korrektur V3-R1:
`docs/tasks/WRN-G3-015-VISUAL-BRAND-CORRECTION-V3-R1.md`. V3-R1 ist im
Kandidaten `83636e10` umgesetzt; Shared Tokens und die theme-reaktive Marke
blieben unveraendert. Die frische unabhaengige V4-R1-Visual-/A11y-Re-QA ist
in `64acd4a` mit formaler Nachkorrektur `46cf0ac` GREEN versiegelt: M-001 und
M-002 geschlossen, 316 unabhaengige Bilder, alle 72 Reflowfaelle, Axe/Fokus/
Dialog/Overflow und sichtbare Pink-Rollen bestanden. Alle Agenten sind beendet,
alle Schreibrechte zurueck beim Chief. Dieser damalige Zwischenstand wartete
noch auf die lokale PO-Sichtabnahme; sie ist inzwischen mit PO-079 geschlossen.
Kein Hosting-, Live-, Android- oder Release-GREEN folgt daraus.

Der Product Owner akzeptierte V3-R1 anschliessend nicht sichtbar: Die inaktiven
Button-/Selectflaechen im Pink-Theme wirken violett. Der read-only Scan der
signierten AAB bestaetigt als Originalregel eine dunkle Kontrollflaeche
`#240b19`, waehrend der lokale Kandidat Raised-Surface `#3a1739` verwendet.
Enge V3-R2-Korrektur:
`docs/tasks/WRN-G3-015-VISUAL-BRAND-CORRECTION-V3-R2.md`. Nur Website-CSS,
Visualspec und neue R2-Evidence/Handoff sind schreibbar. Danach gezielte
unabhaengige Re-QA und erneut lokale PO-Sichtabnahme; kein Live/Release.

V3-R2 ist im Kandidaten `7bc51d4` umgesetzt und durch die unabhaengige
V4-R2-Pruefung `7af9b82` mit 257/257 Assertions, null Fehlern sowie Phone,
Tablet, Desktop, Landscape, vier Themes, Reflow, Axe, Fokus und Dialog GREEN
versiegelt. Die folgende PO-Sichtpraezisierung verlangt violette Schrift der
inaktiven Aktionsbuttons, nicht violette Flaechen. Enge V3-R3-Korrektur:
`docs/tasks/WRN-G3-015-VISUAL-BRAND-CORRECTION-V3-R3.md`. Inaktive
Pink-Aktionsbuttons erhalten lokal `#9b82ff`; aktive Magenta-Rot-Fuellungen,
Navigation, Cyan-Systemkontrollen, Panels und alle OUT-Bereiche bleiben
unveraendert. V3-R3 ist in `d6065e9` umgesetzt und mit Bericht, vier
hashgebundenen Sichtbelegen und Handoff in `9e0c1db` GREEN gesichert. Offen ist
in diesem historischen Zwischenstand nur die erneute lokale PO-Sichtabnahme;
sie ist nach V3-R4 inzwischen mit PO-079 geschlossen. Kein Live/Release.

Der Product Owner praezisiert die V3-R3-Sichtprobe erneut: Aktionsbuttons
sollen im Pink-Theme nur beim Anklicken beziehungsweise in einem semantisch
ausgewaehlten `aria-pressed`-Zustand violett ausgefuellt sein. Enge
V3-R4-Korrektur:
`docs/tasks/WRN-G3-015-VISUAL-BRAND-CORRECTION-V3-R4.md`. Nur Website-CSS,
Visualspec und neue R4-Evidence/Handoff sind schreibbar. Inaktiv bleiben
Flaeche dunkel und Schrift violett; `:active`/`aria-pressed=true` werden
violett mit dunkler Kontrastschrift. Navigation, Cyan-Systemkontrollen,
Panels, Marke und alle OUT-Bereiche bleiben unveraendert. Danach lokale
PO-Sichtabnahme; kein Live/Release. V3-R4 ist in `8df7b5c` umgesetzt und mit
sieben hashgebundenen Sichtbelegen, Bericht und Handoff in `fb54d27` GREEN
gesichert. Der Product Owner akzeptierte am 30. August 2026 exakt
`G3-015 V3-R4 VISUELL AKZEPTIERT`. PO-079 schliesst damit die lokale visuelle
G3-015-Abnahme fuer `8df7b5c`; alle Schreibrechte sind wieder frei. Es wird
kein Folgeslice gestartet und keine Hosting-, Live-, Mobile-, Android-,
Google-Play-, Signierungs-, Upload-, Deployment- oder Releasefreigabe erteilt.

PO-080 `ok arbeite soweit als möglich durch.` erlaubt anschliessend die sichere
lokale Fortsetzung bis vor den naechsten externen Freigabepunkt. Massgeblich ist
`docs/tasks/WRN-WEB-ANALYSIS-007-LOCAL-DELIVERY-READINESS.md`: vorhandene
Staging-/Retirement-Toolchain WRN-WEB-ANALYSIS-003 bis -006, zwei saubere
lokale Probe-Builds, Tests, Hashbindung und unabhaengige Kontrolle. Produkt-,
Test- und Paketquellen bleiben unveraendert. Reale Origin/Canonicalwahl,
Hostinger-/DNS-Mutation, Upload, Live, neue Kosten, Mobile, Android, Google
Play, Signierung, Deployment und Release bleiben gesperrt.

WRN-WEB-ANALYSIS-007/008 ist auf Ergebniscommit `183a609` lokal GREEN:
139 Website-/Nodepruefungen, 19 Boundaries, Typecheck, voller Website-Lint,
Normalbuild und zwei bytegleiche Probe-Pakete bestanden. Ohne `--allow-probe`
werden diese Pakete erwartungsgemaess als nicht uploadfaehig abgelehnt. Der
versiegelte Security-Diffscan `5f76675c-4ce9-417a-977d-5a5e2e5c6e9a`
schloss den Bereich bis `c813d8d` mit 19 geprueften Quell-/Harnessoberflaechen
und null reportable/deferred Findings. Der danach folgende, semantisch neutrale
Lintdiff `09ca2ff..183a609` wurde separat durch Diffpruefung und die komplette
frische Test-/Buildmatrix gebunden. Bericht und Handoff:
`docs/evidence/WRN-WEB-ANALYSIS-007/LOCAL-DELIVERY-READINESS.md` und
`docs/handoffs/WRN-WEB-ANALYSIS-007-local-delivery-readiness.md`. Dies ist
keine reale Auslieferungsfreigabe; Origin, Canonicalwahl, isolierter Root,
HTTPS, Zugriffsschutz, Provider-Smokes und Upload bleiben offen.

PO-081 bindet die naechste Produktoberflaechen-Roadmap als Vorbereitung:
`WRN-G3-016` anonyme Home-/Sport-&-Fankultur-Struktur, `WRN-G3-017` lokale
Personalisierung, `WRN-G3-018` Entdecken-Kompaktierung, `WRN-G3-019` Reader-v2,
`WRN-G3-020` regionale Termine und `WRN-G3-021` Medien/Podcasts. Die Briefs
duerfen dokumentiert und read-only geprueft werden. Produktcode, echte Inhalte/
Recherche, neue Dependencies/Kosten, Agentenstarts zur Implementierung,
Hosting, Live, Android, AAB, Google Play und Release benoetigen weiterhin
eigene sichtbare Gates. Pro Dateibereich bleibt genau ein Schreiber aktiv;
App und Website sind getrennte Projektionen. `WRN-CONTENT-SPORT-001` bleibt
ein eigener Content-/Verifikations-Teilvertrag unter G3-016.
Die sechs Briefs, das Quellinventar und die zentralen Register sind nach sieben
engen Dokumentkorrekturen im unabhaengigen Recheck GREEN. Das ist nur
Dokument-GREEN; keiner der Slices ist gestartet.

PO-082 startet am 30. August 2026 mit exakt `START WRN-G3-016` den ersten
PO-081-Produktslice. Verbindliche Reihenfolge: ein frischer unabhaengiger
Architektur-/Vertrags-Precheck; nur bei GREEN ein Backend/Data-Owner fuer
Schema, Admission und selbst erstellte Fixtures; nach dessen gesichertem Ende
ein Frontend-Brand-Owner fuer die App; danach frische unabhaengige Visual-/
A11y-/Security-/Gesamt-QA und Architekturabschluss. Normal genau ein Subagent,
keine Kinder oder parallelen Schreiber. Chief allein fuehrt
`docs/WRN-G3-016-DELEGATION-REGISTER.md`. Echte Sportinhalte/Recherche,
WRN-CONTENT-SPORT-001, Websiteprodukt, Live/Legacy, Android, AAB, Hosting,
Google Play, neue Dependencies/Kosten und Release bleiben gesperrt.
P1 ist auf Basis `3db2aba` GREEN beendet: mindestens neun eindeutige IDs,
atomare Releasebindung, additive Home-Rollenzuordnung, lokale Placeholder,
Erhalt der alten drei IDs/Reader-/Reading-State-Grenzen, unveraenderte Website
und getrennte Mobile-/Website-E2E-Erwartungen sind fuer P2/P3 bindend.
P2 ist auf Governancebasis `172f292` im erlaubten Scope GREEN beendet und vom
Chief nachgeprueft: 33 Contract- und 31 Fixturetests, acht Typechecks, Mobile-
Foundation 20 PASS/16 erwartete Skips, Releaseboundary und 19 Boundaries.
Alle neun Mobile-IDs sind atomar aktiv und rollenprojektiert; Website und
Supplementalfixture bleiben unveraendert. Drei separat reproduzierte Website-
Brand/Header-REDs liegen ohne Website-Diff ausserhalb G3-016 und werden nicht
still korrigiert; sie blockieren nicht den isolierten Mobile-P2-Vertrag.
Naechster Schritt ist genau ein frischer Frontend-Brand-Owner fuer P3 nach
read-only Orientierung und eigenem eng gebundenen Schreibpaket.
P3 ist inzwischen im Kandidaten `4113a72` beendet: rollenbasierter Aufmacher,
fuenf Hauptmeldungen, Sport-Feature plus zwei Nebenkarten, ehrlicher
Nichtaktuell-/Fail-Closed-Zustand und vorhandener Discoverfilter `Sport` in
allen neun UI-Sprachen. Chief-Recheck: 72 Mobileunits und beide relevanten
Typechecks GREEN; Fachbeleg: Mobile-Foundation 20 PASS/16 erwartete Skips,
Build/Lint/19 Boundaries/Releaseboundary und Visualtest 2 PASS. Kanonisch sind
66 P3-R2-Bilder mit Top-, scrollpositionierten Main-/Sportsegmenten und
neunsprachigem 200-%-Reflow. P3-Eigenbelege ersetzen keine unabhaengige QA.
Die unabhaengige P4-QA ist nach dem geschlossenen reinen Formatfinding QA-001
in `b689f11` GREEN: 144 normale Darstellungen, 72 Reflowfaelle, 72 Mobileunits
sowie Axe, Interaktion, Offline-/Netzgrenzen und die gebundene 120-PNG-
Sichtmatrix sind bestanden. Die verbleibenden 24 Rootformatwarnungen sind
unveraenderte Baseline-/OUT-Pfade und erteilen keine Korrekturrechte.
Der versiegelte P4-S-Diffscan `889ed2c8-8a97-4a3e-8c41-d079e11403a1`
ist ebenfalls GREEN: `0f29d47..b689f11`, 21/21 Reviewitems, acht
Sicherheitsoberflaechen, null reportable/deferred Findings und vollstaendige
Coverage. Der erste P5-Abschluss `cb1771e` ist RED mit genau einem Medium:
P5-M-001 reproduziert, dass ein weiterhin gueltiges Vor-G3-016-Offline-
Manifest ohne optionales `homePresentation` auf der neuen Home-Seite nur den
Fehlerstatus zeigt. Keine Daten gehen verloren und kein Securitybefund folgt
daraus. Chief bindet als Kompatibilitaetsregel eine getrennte ehrliche Legacy-
Home-Liste aus den bereits validierten Artikeln, ohne erfundene neue Rollen
oder Sportsektion. Der Writer-Fix ist in `e320de0` gesichert: 73 Mobileunits,
der zuvor rote A/B/A-Pfad, Neustart/Aktivierung/Rollback, Typecheck und P3-
Visualspec sind auf Writer-Ebene GREEN. Danach folgen enger unabhaengiger
Offline-/Rollback-/A11y-Recheck, gezielter Security-Deltacheck und frischer
P5-Recheck; keine Produktwrites parallel. S5-Q1 ist in `6721f83` unabhaengig
GREEN: eigene Legacy-/Invalid-/Current-Browserpruefung, 16 Bilder fuer EN/DE,
vier Themes und 200-%-Reflow, Axe/Fokus/44px/Netzgrenzen, 73 Units sowie die
echten A/B/A- und Neustart-/Aktivierung-/Rollbackpfade. Der exakte versiegelte
Security-Deltacheck `4c416926-2a45-43a6-9ff7-9659133aa536` ist ebenfalls
GREEN: 27/27 Diffpfade, acht Oberflaechen, null reportable/deferred Findings.
Der frische P5-R1-Abschluss `b3c07e4` ist GREEN, P5-M-001 geschlossen und
meldet keine neuen Findings. Der Product Owner akzeptierte G3-016 am
30. August 2026 mit exakt `G3-016 VISUELL AKZEPTIERT`. Der Slice ist damit
geschlossen. Der Product Owner startete anschliessend G3-017 mit exakt
`START WRN-G3-017`. Zuerst laufen drei disjunkte read-only Vorpruefungen:
Luna fuer Kontinuitaet/Inventar, Terra fuer technische Pfade/Testbarkeit und
Sol fuer Architektur/Privacy/Migration. Sie schreiben nur eigene Evidence/
Handoffs. Erst nach Chief-Synthese und gebundenem Arbeitsvertrag darf genau
ein Backend-/Persistenzwriter starten; Frontend folgt gegen dessen gesicherten
Vertrag. Echte Inhalte, Website, Hosting/Live, Android/AAB/Play und Release
bleiben gesperrt.
P1-L/T sind GREEN, P1-S ist YELLOW/pass conditional. Chief hat B-01 bis B-14
vollstaendig in `docs/tasks/WRN-G3-017-P2-BACKEND-PACKET.md` gebunden. Vor
jedem Produktwrite folgen genau zwei parallele read-only Rechecks: Sol fuer
Architektur/Privacy und Luna fuer Traceability/Kosten. Erst beide GREEN
erlauben genau einen Terra-P2-Backendwriter.
Luna P1-RL ist GREEN; der erste Sol-P1-RS war YELLOW. Die Save-
Ausgangsvorbedingung und der B-12-Nachweis wurden im P2-Paket eng
nachkorrigiert. Der Sol-P1-RS-R1-Recheck ist auf `cdc95fc` GREEN; M-001/L-001 sind
geschlossen. Genau ein Terra/high-Backendwriter darf jetzt P2 gemaess Paket
implementieren. P3 bleibt bis zum P2-GREEN und gesicherten Rechteende gesperrt.
P2 ist in `2a00974` implementiert und durch Chief, Luna-Kontinuität,
Terra-QA sowie Sol-Securityscan
`28e475fb-ff2b-4185-b004-0c1e1a5c7b1d` mit null Findings/deferred GREEN.
Jetzt darf genau ein `frontend_brand_engineer` Terra/high ausschließlich nach
`docs/tasks/WRN-G3-017-P3-FRONTEND-PACKET.md` P3 schreiben. P2, Website,
Fixtures, Dependencies und alle externen Gates bleiben read-only/gesperrt.
P3 und P4 sind inzwischen technisch abgeschlossen. Der rein lokale
Personalisierungshub liegt im Produktkandidaten `73215b1`. Das erste P4-A
fand genau `P4-A-M-001`: passende lokale Artikel waren im Offlinezustand
faelschlich nicht im Hub sichtbar. Die enge Korrektur zeigt lokale Treffer
und Reader offline, ohne den ehrlichen No-match-Zustand aufzuweichen.
P4-Q-R2 bestaetigt 95 Mobile-, 20 Foundation- und zwei Visualtests sowie 25
eigene Bilder; P4-S-R1 ist im versiegelten Scan
`0b0645db-0200-462f-9296-08de8133eea4` mit null reportable/deferred Findings
GREEN. P4-A-R1 schliesst M-001 mit null neuen Findings. PO-089 akzeptiert den
Produktkandidaten `73215b1` am 31. August 2026 mit exakt
`G3-017 VISUELL AKZEPTIERT`. G3-017 ist geschlossen; alle Agenten sind beendet
und alle Rechte liegen beim Chief. Daraus folgt weiterhin kein Website-, Live-,
Android/AAB/Play- oder Release-GREEN und kein automatischer Folgeslice.
PO-087 erweitert G3-017 nicht. Der spaetere Quellenumfang zu Schwarzem
Anarchismus, Panafrikanismus, Schwarzen Befreiungsbewegungen, Antikolonialismus
und Westasien ist ausschliesslich in
`docs/tasks/WRN-CONTENT-SOURCES-001-BLACK-LIBERATION-AND-WEST-ASIA.md`
vorgemerkt. Vor einem eigenen sichtbaren Start bleiben aktuelle Quellen-,
Alias-/Nachfolge-, Rechte-, Feed-, Privacy- und Sicherheitspruefung sowie
Import, Klassifikation und Produktprojektion gesperrt.
PO-088 bindet dort zusaetzlich das globale, versionierte Aufnahmemodell mit
getrennten Feed-, Verzeichnis-, Bibliotheks-, Eigenpublikations-, Konflikt-
und Alias-/Nachfolgeklassen. Rekrutierung, operative Anleitungen, Doxxing,
unbestaetigte Anschuldigungen und problematische Gewaltdarstellungen werden
nicht automatisch uebernommen. Diese Vormerkung erweitert G3-017-P3 nicht
und startet ohne exaktes `START WRN-CONTENT-SOURCES-001` keine Arbeit.

Hosting,
echte Stagingadresse, Apache-/HTTPS-/Zugriffsschutz, Upload, Live, Mobile,
Android, Google Play, Signierung, Deployment und Release bleiben eigene
gesperrte Gates. Der spaetere Scope `WRN-CONTENT-SPORT-001` ist nur
vorgemerkt und startet keine Produkt- oder Recherchearbeit.

Alle nachstehenden G3-015-Zwischenstaende in Abschnitt 2, die `bceee9b`,
`32516ba`, offene P2/P3-Gates, eine ausstehende Outcome-Entscheidung oder
„P4 nicht gestartet“ nennen, sind historische Ablaufbelege und erteilen
keine aktuellen Rechte.
Historischer Zwischenstand vor Outcome A und den Abschlussgates: Die damalige
RED-Ursache blieb offen. S10 im bestehenden Unterstuetzungstask
`01a0486b-fba4-7072-a360-1b152b44710d` hat den rein lesenden Abgleich gegen
feste Basis `32516ba` beendet. Zwei alte Statusstellen vom Chief berichtigt;
keine unabhaengige Endstand-/Produktfreigabe daraus. PO-077-Website-Review
ist abgeschlossen: 45 Website-Dateien statisch geprueft, zwei Low-Findings
quellgebunden bestaetigt (Lesedaten nach Loeschung durch alten Tab wiederherstellbar;
geerbter Hash-Routenkey kann UI abbrechen). Keine dynamische Reproduktion,
keine Produkt-/Testwrites. Alle drei Reviewinstanzen beendet, Slots frei.
Handoff: docs/handoffs/WRN-WEB-ANALYSIS-001-security-review.md.
Zu diesem historischen Zeitpunkt war keine Veroeffentlichung oder Fixarbeit
freigegeben und G3-015 pausiert. Dieser Satz beschreibt nicht das aktuelle
technische Gate oben.
Live/Legacy, Mobile/Android, neue Kosten/Dependencies, Remote/CI,
Cloud, Deployment, Signierung, Upload und Release bleiben ausser der
folgenden eng bedingten Website-Analysefreigabe gesperrt.

PO-075/076 erlauben eine separate neue Analysewebsite nach bestandener
unabhaengiger Sicherheitspruefung ohne offene sicherheitsrelevante Befunde.
Die bisherige Website und die App bleiben unveraendert; kein Playrelease,
kein Live-Cutover, keine neuen Kosten oder automatische G3-015-Abnahme.
Vertrag: `docs/tasks/WRN-WEB-ANALYSIS-001-SEPARATE-PREVIEW.md`.
Die Zustimmung zur separaten Testadresse beantwortete OUTCOME-DECISION nicht;
Outcome A wurde davon getrennt mit dem oben genannten exakten Befehl angenommen.
Vorbereitung, read-only Hostingklaerung und PO-077-Quellreview abgeschlossen;
zwei offene Low-Findings verhindern derzeit die bedingte Veroeffentlichung.
hPanel-Anmeldung und Hostingvorpruefung am 28.08.
bestaetigt: eigener PHP/HTML-Websiteplatz im bestehenden Plan als Weg sichtbar,
aber noch nicht angelegt. Subdomainformular belegt nur /public_html/-Praefix,
keinen isolierten Root ausserhalb des Bestands. Zieladresse/Document Root,
HTTPS/Zugriffsschutz und finale Auslieferungs-/Paketbelege fehlen. Noch nichts online.
Beleg: `docs/evidence/WRN-WEB-ANALYSIS-001/HOSTING-READINESS.md`.
Historische pauschale Liveverbote gelten mit dieser engen Ausnahme weiter;
sie duerfen die neue bedingte PO-Freigabe nicht verdecken.

Alle folgenden G3-015-Zwischenstaende in Abschnitt 2 sind Historie;
ihre Startsaetze und damaligen GREENs erteilen keine aktuellen Rechte.

Historischer Zwischenstand: **Phase G3 / G3-014 durch PO-073 visuell akzeptiert;
WRN-G3-015 Website-Offline-Shell durch PO-074 als Paket gestartet,
P1-Recheck `5c78ff9` und P2 GREEN gesichert/beendet;
Kern `b062ab7`, Testbuild `5ede03d`, Evidence/Handoff `7256d6a`;
S5-Teilcheckpoint b5e2ea9/f201be7 gesichert/beendet, P3 weiter YELLOW;
S5-R1 in1fe8060/23fdc67/b124b5d WIP gesichert und beendet;
S6 hat mit exakter24.19 eine Ergebnisabweichung bestaetigt, in6987f78 gesichert
und ist beendet; S7-Diagnose42e537c/e54cbbe gesichert/beendet.
P2-Gesamtfreigabe wieder offen, P3 YELLOW**.

S7 erreichte die gebundene Diagnosegrenze:21isolierte Proben/42PASS,
historischer direkter Fehlreturn nicht reproduziert, Ursache unbewiesen.
Chief hat Bericht/Handoff gelesen und Runtimeende bestaetigt. Jetzt genau
ein unveraenderter originaler33erCore-Matrixvergleich durch Chief mit exakter
Node24.19 und dauerhaften Outputs. Keine parallelen Agenten, keine Produkt-/
Testmutation, kein GREEN allein aus einer Wiederholung. Der bekannte
Runner-PATHfehler wird fuer diesen Node-direkten Lauf durch korrektes
aeusseres node/bin-PATH beruecksichtigt, nicht still korrigiert.
Originalvergleich abgeschlossen:33PASS/0FAIL,13Quellen/41Artefakthashes
unveraendert. S7-R1 ist in648f331/f1e5d1d gesichert/beendet:45PASS,
mutable native Attemptbindung beobachtet, historischer Fehlreturn weiterhin
unbewiesen. Chief las Bericht/Handoff und bestaetigte130Artefakthashes.
S8 in1296a50/d088a6f gesichert/beendet. S9 hat den engen S8-M-001-Fix
inbceee9b gesichert und ist beendet. Chief las Diff/Report/Handoff und
bestaetigte110Artefakthashes: echter Seam-RED vor Fix,9Adaptertests,
89+17Websiteunits,19Boundaries,sieben Typechecks und33Coreassertions PASS.
Rootformat bleibt wegen des unveraenderten fremden UI-Teststarters offen.
Jetzt dieselbe unabhaengige S8-Instanz fuer den engen BOUND-RESULT-RECHECK:
nur zwei Quell-/Testdeltas und frische Belege, eigener Bericht/Handoff,
keine neuen Tests, Produktmutation oder Kinder. Dies ist kein P4-Abschluss.
Danach keine native/Worker-/UI-/Unknownpolicy-Implementierung ohne PO-
Entscheidung zum nicht freigegebenen Vorschlag OUTCOME-DECISION.
Historische Ursache und P2/P3 bleiben offen. Folgendes ist Historie.

S6-Coreprobe core-16012/companion matrix-KhPKHo:32PASS/1FAIL, diesmal
Redirectfehler mit active statt error. Chief bestaetigte13unveraenderte
Vor-/Nach-/Istquellen und den Rohreporthash. Der fruehere Bodytimeoutfehler
trat diesmal nicht auf; Ursache ungeklaert, Nodeabweichung nicht alleinige
Erklaerung. S6 hat korrekt gestoppt; nur Runner/Belege/Handoff sichern, dann
Ende. Danach genau ein frischer incident_debugger Sol/high, Produkt/Tests
read-only, nur eigene Diagnosen schreiben, keine Kinder. Kein Produktfix oder
weitere Frontend-/Vollmatrix vor Chief-Disposition. Folgendes ist Historie.

S6 `/root/g3015_frontend_finish` gab Ziel/Quelle/Scope/erste Reproduktion und
dauerhaften Runner korrekt wieder. Chief gibt exakt die Test-/Evidencepfade
im Abschlussbrief frei, keine Kinder. Zuerst unveraenderte24.19-Coreprobe,
bei erneutem Produkt-/Corefinding Chief statt Selbstkorrektur. Chief sicherte
zwei noch vorhandene Originalrohdateien bytegenau; b124b5d-Kopien stimmen
nicht mit den dort behaupteten Originalhashes ueberein. Neue Disposition in
CHIEF-P3-HANDOFF-CHECK.md,16P3-Manifeste/660lokale Artefakte korrekt. Keine
finale Quell-/Gatefreigabe daraus. Folgende Orientierungsvorbehalte sind Historie.

Chief bestaetigte Runtimeende und sauberen Arbeitsbaum ausser unberuehrter
Attachmentablage. Der massgebliche neue Handoff ist frontend-r1-wip.md,
nicht der alte frontend.md mit historischem Teil-GREEN. Keine erneute
S5-Arbeit. Genau ein frischer Frontend-Agent Terra/high fuer S6 gemaess
FRONTEND-FINAL-COMPLETION, erst nach Orientierungsantwort Schreibfreigabe.
Der erhaltene Core-Rohreport matrix-cDTMCQ bestaetigt Node24.16 und genau
eine falsche body-timeout-Ergebnisassertion; Ursache ungeklaert. Unveraenderte
enge24.19-Reproduktion vor weiterer Vollmatrix, keine Backendkorrektur.
Die folgenden S5-Abschlussanweisungen sind Historie.

Chief-Disposition circa13:22: S5-R1 bestaetigte erneut einen Rootlauf ohne
den geforderten dauerhaften Runner; die fortsetzbare Toolausgabe ist verloren.
Der Nodeprozess lebt, neu gestartete Worker belegen Fortschritt; kein belegter
Haenger. S5 laesst diesen Lauf enden, sichert nur vorhandene eigene Quellen/
Belege und einen ehrlichen WIP-Handoff, danach Ende. Keine weiteren Produkt-/
Testlaeufe oder Codeedits durch S5. Ein frischer Frontend-Owner darf erst nach
gesicherter Uebergabe/Ende und bestandenem read-only Orientierungscheck den
engen Rest gemaess FRONTEND-FINAL-COMPLETION uebernehmen. Kein Context-Rot-
Urteil aus Marker/Chatlaenge, keine Loeschung, kein neues P4-GREEN.

Chief hat den Teilhandoff geprueft und fehlenden Built-/Lifecycle-/Visual-/
Gesamtumfang konkret in FRONTEND-COMPLETION gebunden. Insbesondere belegt
sofortiges Registrierungszaehlen0 keinen SourceDev-Guard, das EL-Initialbild
zeigt RU und der referenzierte rohe Modalfehler ist nicht mehr vorhanden.
Keine neuen pauschalen Produktfindings; zuerst deterministische Belege und
enge Korrektur im erlaubten UI-/Testscope. Dieselbe S5-Instanz fuehrt die erste
Vollstaendigkeitsrunde durch, keine Kinder. P4 bleibt bis ganzem P3-GREEN
gesperrt. Folgende S5-/Helferstartanweisungen sind Historie.

Der begrenzte Spark-Helfer S5-H1 ist in9e8b8d3/f60b673 gesichert und beendet.
Chief hat den Diff/Handoff gelesen und in04ae299 die zwoelf neuen Katalogkeys
an S5 zur Integration uebergeben. Copy cbb7662/Typ33e09ba bleiben gebunden.
Global wieder nur S5, keine weiteren Kinder. Der Helpertest mit Node24.16
ersetzt kein24.19-Gate; S5 prueft frisch mit der exakten Toolchain und
korrigiert nur die benannten kleinen neuen Sprachfehler. Originalhandoff-
Metadatenabweichungen sind im Register disponiert, nicht still umgeschrieben.
Die folgende Helferreservierung ist nun Historie, kein erneuter Spawnauftrag.

Chief hat S4-Bericht/Handoff vollstaendig gelesen, alle 3720 Quell-/Artefakt-
Hashbindungen bestaetigt und das Ende uebernommen. Zehn Gates GREEN,
228 Vitest +17 Node, sieben Typechecks, 19 Boundaries, beide Builds;
Root 228 PASS/577 erwartete Skips/0 Fehler/0 Flaky, maximal zwei Worker,
darin 76 echte/instrumentierte Kernassertions sauber getrennt. Alle21
CLI-/Root-Builddateien byteidentisch. Historische Roh-Whitespaceausnahme ist
exakt dokumentiert, kein pauschales Evidence-Diffcheck-GREEN.
Jetzt genau ein frischer `frontend_brand_engineer` Terra/high fuer P3.
Backend/Generator/P2-Tests bleiben read-only, UI-Eigentum im FRONTEND-PACKET.
Spark-Helfer erst nach eingefrorenem max12-Key-Vertrag, eigener Sicherung und
lesbarer zentraler Chief-Reservierung; bis dahin keine Kinder. Nach beendetem
P3/Pilot frische unabhaengige Security/QA/Architektur. Kein Produkt-/Release-
GREEN aus P2. Folgende S4-Einsatzanweisungen sind Historie, keine Neustarts.

S4 hat den ersten kohaerenten Zwischencheckpoint `0ef801b` gesichert und
arbeitet weiter. Vier getrennte Kernproben und vier Built-/echte Offline-
Browserneustartproben bestehen; noch keine vollstaendige B1–B4-/Rootmatrix.
Chief hat CHECKPOINT/Handoff, Restartscript und die acht Sollassertions gelesen.
Teilbelege sind vor Formatierung entstanden und ersetzen keine finalen
quellgebundenen Nachweise. Keine neue Instanz oder P3-Freigabe aus diesem WIP.

Chief hat Bericht/Handoff und kanonischen Rohreport vollstaendig abgeglichen:
S3-H-001/002, zwei RED, null Harnesserrors. Jetzt genau ein frischer `worker`
als Backendowner, ausdruecklich `gpt-5.6-sol`/high, gemaess CORE-COMPLETION.
Risikobasiertes Routing wegen nachgewiesener kritischer Kernel-/Integrations-
luecken, keine Profilaenderung oder APIkosten. Fuenfstufiger S3-Plan innerhalb
B1–B4 verbindlich, gleicher P2-Dateiscope, keine Kinder. P3 bleibt bis zur
vollstaendigen echten Kernmatrix/API-Handoff und bestaetigtem Ende gesperrt.
Chief pflegt allein Governance. Die folgenden S3-Anweisungen sind Historie.

S2 hat einen unvollstaendigen Shellkern gesichert. Chief sah fehlende
Enablebarriere bei missing Control und globale Readybindung, die wartendes B
gegen aktive A-Seiten koppelt. Nach S2-Handoff/Ende genau ein frischer
`incident_debugger` Sol/high gemaess CORE-DIAGNOSIS, nur eigene Belege/Handoff.
Kein Produktwrite/P3 vor gesicherter Diagnose; keine pauschale Vollanalyse.
Die folgenden S2-Startanweisungen sind historisch.

Chief hat Recheck und Handoff vollstaendig gelesen und uebernommen. Jetzt
genau ein frischer `backend_data_reliability_engineer` Terra/high fuer
`docs/tasks/WRN-G3-015-BACKEND-PACKET.md`, keine Kinder. Nur dort benannte
Shell-/Build-/Testpfade; UI, Mobile, G3-014-Content/Safety und Alt-/Liveprojekte
read-only. Begrenzte Registrationjobtickets und deadlockfreie Lockreihenfolge
sind als Umsetzungspflicht gebunden. Chief pflegt nur Governance; P3 wartet
auf vollstaendiges P2-GREEN mit echten Browserbelegen und gesichertes Ende.
Die folgenden P1-Einsatzanweisungen sind Historie, keine Parallelstarts.

S1 hat vier konkrete Vertragsbedingungen, keine Produktfehler, geliefert und
seine Schreibarbeit beendet. Chief hat Ready-vor-Activate, exact-hash-Navigation,
drei Slots einschliesslich waiting sowie dauerhafte serialisierte Entfernung
im Task verbindlich gebunden. Jetzt nur S1-R1 derselben Reviewinstanz: Abgleich
dieser Bindungen und eigene neue PRECHECK-RECHECK-Evidence/Handoff. Keine
Vollanalyse oder Produktaenderung. Erst gesichertes GREEN und Ende erlaubt P2.
Die folgende Beschreibung des ersten P1-Starts ist historisch.

Der Product Owner erteilte am 28. August 2026 exakt
`G3-014 VISUELL AKZEPTIERT – START WRN-G3-015`. PO-073 schliesst G3-014
mit Produkt `44b5cb1`, QA `999b777` und Architektur `0b2bd2f`; der vorgemerkte
Buttonfeinschliff `UX-POLISH-001` bleibt spaeterer eigener Designauftrag.
PO-074 autorisiert den schriftlichen G3-015-Scope und den eng begrenzten
P3-Fachlead-/Spark-Piloten. Zuerst genau ein frischer
`independent_architecture_reviewer` Sol/high: Vertrag und Umsetzbarkeit,
nur Bericht `docs/evidence/WRN-G3-015/ARCHITECTURE-PRECHECK.md` und Handoff
`docs/handoffs/WRN-G3-015-architecture-precheck.md`, keine Selbstkorrektur.
Nach gesichertem GREEN und Instanzende folgen Backend/Data, Frontend samt
Pilot, unabh. Security/QA/Architektur und Sichtabnahme gemaess Task Brief.
Chief fuehrt das G3-015-Register; normal genau ein Subagent, maximal zwei nur
waehrend des ausdruecklich reservierten P3-Helferauftrags, keine weiteren Kinder.
Belegte enge Korrekturen und Rechecks laufen im Paket ohne neue Fixnachricht;
neue Produkt-/Architektur-/Datenverlust-/Kosten-/Befugnisgrenzen bleiben
Rueckfragen. Keine neue Dependency, Legacy-/Liveaktion, Android, Remote/CI,
Cloud, Signierung, Upload oder Release. Bestehende PO-Vorschauen unberuehrt.
Die folgenden Vorbereitungs-/Einsatzbeschreibungen sind historische Belege.

Der Product Owner fordert am 28. August 2026 „ok machen wir das naechste
grosse paket“. Der bisher noch nicht gebundene Folgescope wird deshalb in
`docs/tasks/WRN-G3-015-WEBSITE-OFFLINE-SHELL.md` vorbereitet, nicht still
implementiert. Geplant sind bewusste Website-Shellspeicherung, echter lokaler
Web-Offline-Neustart, sichere Shellupdates und Ruecknahme. Die Android-/Mobile-
Shell bleibt getrennt, Content/Safety bleibt G3-014. Ein begrenzter Frontend-
Fachlead/Spark-Kataloghelfer-Pilot ist geplant, aber nicht gestartet.
Keine Produkt-/Test-/Build-/Packageaenderung, SW-Registrierung, Cacheaktion oder
Agentenstarts vor expliziter Annahme des neuen Pakets mit `START WRN-G3-015`
und der offenen G3-014-Sichtentscheidung. Danach zuerst unabhaengiger P1-
Vertragsreview. Register: `docs/WRN-G3-015-DELEGATION-REGISTER.md`.
Der Wunsch nach kompakteren Buttons ist als `UX-POLISH-001` fuer den finalen
UI-Feinschliff vor Veroeffentlichung dokumentiert, keine jetzige Designaenderung.

Unveraenderter G3-014-Produktkandidat `44b5cb1` einschliesslich `37a75d6`,
frische Gesamt-Re-QA `999b777` und Architektur-Recheck `0b2bd2f` GREEN.
Die folgenden Einsatzbeschreibungen bleiben historische Belege.

S18 ist in `0b2bd2f` gesichert und beendet. Beide P5-Mediums sind geschlossen,
null offene Scopefindings. Chief hat den Bericht und Handoff geprueft.
Keine weitere Produktaenderung oder unbekannter Folgeslice ist autorisiert.
Abnahmehilfe: `docs/evidence/WRN-G3-014/PO-ACCEPTANCE.md`; kompakte Uebergabe:
`docs/handoffs/WRN-G3-014-chief-handoff.md`. Der kurze read-only S19-
Kontinuitaetsabschluss meldet GREEN 11/12, keine Rotation. Chief kennzeichnete
die einzige unklare historische Vorbereitungszeile in Project State eindeutig
als Historie. Alle Subagenten sind beendet; kein weiterer Einsatz ohne Auftrag.
Die folgenden Einsatzanweisungen sind Historie und starten keine Mitarbeiter.

S17 ist in `999b777` gesichert und beendet. Die unabhaengige Vollmatrix
bestaetigt 223 PASS/547 erwartete Skips/0 Fehler/0 Flaky mit Rootdefault
zwei Workern und sieben Projekten; 224 plus acht Tests, sieben Typechecks,
19 Boundaries, beide Builds und Releaseboundary GREEN. M-001/002 und die
eigene A/B/A/C-Bildfolge sind frisch geprueft, alle 36 Hashbindungen vom
Chief bestaetigt. Jetzt genau ein frischer `independent_architecture_reviewer`
Sol/high fuer S18 gemaess FINAL-RECHECKS: nur die beiden Korrekturdeltas und
ihre frischen Nachweise, keine weitere Vollrepoanalyse. Schreiben nur eigener
ARCHITECTURE-RECHECK-Bericht/Handoff. Keine Selbstkorrektur oder Kinder.
Die folgenden Einsatzanweisungen sind historische Schritte, keine Parallelstarts.

Der Product Owner erteilte am 28. August 2026 exakt `START WRN-G3-014`
und „und danach weiterfahren“. Dies klaert den vorherigen Sicherheitsstopp
explizit. Die Organisationsintegration `06c22ca` ist abgeschlossen. PO-071
bindet den schriftlichen G3-014-Scope als groesseres Arbeitspaket einschliesslich
nachgewiesener enger Fehlerkorrekturen und unabhaengiger Nachpruefungen ohne
weitere einzelne Weiter-/Fixnachrichten. Zuerst genau ein frischer
`independent_architecture_reviewer`, nur bei GREEN Backend/Data, dann Frontend,
unabhaengige QA und abschliessender Architekturreview. Keine parallelen
Schreibinstanzen, keine Weiterdelegation in diesem Slice. Chief fuehrt
`docs/WRN-G3-014-DELEGATION-REGISTER.md` allein; Kindauftraege und Grenzen in
`docs/tasks/WRN-G3-014-WORK-PACKETS.md`.

Findings werden dokumentiert und vom Chief disponiert. Korrekturen innerhalb
des genehmigten Vertrags sind erlaubt, jedoch keine stillen Architektur- oder
Produktentscheidungen, neuen Kosten/Befugnisse oder ungeklärten Datenschutz-/
Datenverlustrisiken. Bei solchen Grenzen wird der Product Owner gefragt.
Technisches GREEN ersetzt keine sichtbare Abnahme. Echte Inhalte, Legacydaten,
Dependencies, Service Worker/Cache Storage, Android, Remote/CI, Cloud,
Deployment, Signierung, Upload und Release bleiben gesperrt. „Danach
weiterfahren“ autorisiert keine unbekannten Folgeslices oder Veroeffentlichung.

S9 ist in `7b449c7` abgeschlossen und beendet. Der Chief hat API-Handoff,
OFF-01–25-Disposition und finale maschinenlesbare Nachweise abgeglichen:
66 echte Controllerproben, die unveraenderte S7-Diagnose 20/20, insgesamt
173 Browser-PASS/422 erwartete Skips/0 Fehler, 214 plus acht Unitpruefungen,
19 Boundaries, sieben Typechecks, beide Builds und Releaseboundary GREEN.
Damit ist P2 fuer die Frontendintegration freigegeben, nicht G3-014 insgesamt
abgenommen. OFF-UI-Anteile, React-Lifecycle und frische Gesamt-QA bleiben offen.
Jetzt genau ein frischer `frontend_brand_engineer` (Terra/high) gemaess P3
in WORK-PACKETS und `docs/handoffs/WRN-G3-014-controller-completion.md`.
Backendvertrag/Controller/Store bleiben fuer P3 read-only; Befunde an Chief.

S10 hat P3 in `058e156` als WIP gesichert und seine Schreibarbeit beendet.
Die Save/Clear-Smokes und Teilchecks ersetzen die fehlenden A/B/C-/Lifecycle-
UI-Nachweise nicht. Ein neuer A/B-Test sieht B nach Check nicht als Kandidat;
die Ursache (Harness, Operationsreihenfolge oder Produkt) ist unbewiesen.
Nach zwei unvollstaendigen Zwischenuebergaben wird die Instanz mit gesichertem
Handoff rotiert; kein allein aus Marker/Chatlaenge abgeleitetes Context-Rot-
Urteil. Jetzt genau ein frischer `incident_debugger` (Sol/high), read-only
gegen Produkt und vorhandene Tests, gemaess FRONTEND-DIAGNOSIS-Brief.
Er darf nur eigene Diagnose-Evidence/Handoff schreiben; kein P3-GREEN.

S11 ist in `e13eaf2` abgeschlossen und beendet. Original-A/B-RED:
vorzeitiger Testquellenwechsel plus falsche Sollrevision (HAR-001/002).
Separat reproduziert: S11-UI-001 High (doppelte Guards/fehlender Wiederanlauf
halten History/Direktreader in Loading) und S11-UI-002 Medium (Busy-Klick
verwirft bestaetigte Save-Publikation). Kein Backendfix erforderlich.
Jetzt genau ein frischer `worker` als Frontend-Owner, ausdruecklich
`gpt-5.6-sol`/high, fuer die kritische UI-Lifecycle-/Operationskorrektur und
fachlich vollstaendige P3-Integration gemaess FRONTEND-COMPLETION-Brief.
Der einmalige risikobasierte Routingentscheid folgt dem belegten High-
Incident und der unvollstaendigen Terra-Uebergabe; keine Profilaenderung oder
externen API-/Kostenrechte. Backend bleibt read-only. Danach frische QA und
Architektur; keine Produktabnahme aus Implementierungs-GREEN.

S12 ist mit Produkt-/Testcommit `b187fc3` und Evidence/Handoff `ca0450a`
vollstaendig abgeschlossen und beendet. Chief hat die 25 Quellhashes, sechs
unveraenderten Backendhashes und kanonischen Abschlussreports abgeglichen:
215 Browser-PASS/527 erwartete Skips/0 Fehler, S7 unveraendert 20/20,
224 plus acht Unitpruefungen, 19 Boundaries, sieben Typechecks, beide Builds,
Releaseboundary und 48 normale/36 Reflowfaelle. Der Implementierungslauf
verwendete einen Worker; die frische QA prueft den Root-Default mit zwei.
Unveraenderte rohe RED-error-context-Dateien haben eine exakt dokumentierte
Whitespace-Ausnahme; daraus wird kein pauschales Evidence-Diff-GREEN abgeleitet.
Jetzt genau ein frischer `qa_release_engineer` (Terra/high) gemaess
`docs/tasks/WRN-G3-014-INDEPENDENT-QA.md`, Produkt und Bestandstests read-only,
nur eigene QA-Evidence/Handoff schreibbar. Danach frischer Architekturreview.
Bei Findings disponiert Chief enge Korrektur/Re-QA innerhalb PO-071;
keine Selbstkorrektur oder sichtbare Produktabnahme aus Implementierungs-GREEN.

S13 ist in `6168d46` unabhaengig GREEN gesichert und beendet. Der frische
Rootdefault-zwei-Worker-Lauf bestaetigt 215 PASS/527 erwartete Skips/0 Fehler/
0 Flaky; die eigene A/B/A/C-Bildfolge 2/2 PASS. Statische Einzelmatrix,
konkrete OFF-Zuordnung und Quellen-/Report-/Bildhashes sind gebunden; Chief
bestaetigte alle zehn benannten Hashbindungen. Keine Produktfindings.
Jetzt genau ein frischer `independent_architecture_reviewer` (Sol/high)
gemaess `docs/tasks/WRN-G3-014-ARCHITECTURE-FINAL.md`. Produkt und Bestandstests
read-only, nur eigener Abschlussbericht/Handoff schreibbar. Keine allgemeine
Vollrepoanalyse oder Selbstkorrektur; erst danach lokale PO-Sichtabnahme.

S14 hat zwei Mediums auf dem unveraenderten Kandidaten nachgewiesen: Ein
fehlgeschlagener B-Check kann nach Uhrregression und Neustart A unberechtigt
freigeben; ein schon offenes Quellenfenster behaelt nach einem gueltigen
Fremdtabwechsel A -> B die alte Quelle/URL. Chief disponiert innerhalb PO-071
die sequenziellen engen S15-/S16-Korrekturen in
`docs/tasks/WRN-G3-014-ARCHITECTURE-CORRECTIONS.md`. S15 startet erst nach
gesichertem S14-Handoff und beendeter Instanz. Ein frischer Backend/Data-Agent
Terra/high behebt nur die unrechtmaessige Zeitankerabsenkung bei Safety-only/
Fehlcheck, ohne eine neue Policy fuer vollstaendige Quellenchecks einzufuehren.
Nach seinem gesicherten Ende ein frischer Frontend-Agent Terra/high fuer das
snapshotgebundene Verwerfen alter Quellenbestaetigungen. Danach erneut frische
Gesamt-QA und gezielter Architektur-Recheck; historische P4-GREEN-Belege
ersetzen diese nicht. Keine parallele Schreibarbeit oder neuen Befugnisse.

S15 ist in `37a75d6` abgeschlossen und beendet. Chief bestaetigte sechs
Quell-/Reporthashes und 6 PASS/0 Fehler des finalen Clockreports. Safety-only
bleibt monoton, nur intern bestaetigter vollstaendiger Check darf im bereits
generation-/pendinggebundenen Complete-Recheck reankern. Partial-B-Restart
gesperrt, Complete-A-Restart wie zuvor erlaubt, Zwischenabbruch fail-closed.
Erster Fixnebenwirkung und rekonstruierter RED-Tooltranskript sind transparent
dokumentiert; keine behauptete rohe RED-Datei. Jetzt genau ein frischer
`frontend_brand_engineer` Terra/high fuer S16 in ARCHITECTURE-CORRECTIONS:
alte Quellenbestaetigung bei aktivem Snapshotwechsel verwerfen. Backend und
S15-Belege bleiben read-only. Danach frische Gesamt-Re-QA/P5 nach
`docs/tasks/WRN-G3-014-FINAL-RECHECKS.md`; keine Produktabnahme aus S15-GREEN.

S16 ist in `44b5cb1` abgeschlossen und beendet. Chief bestaetigte alle
43 Quell-/Report-/Bildhashbindungen und die vier finalen Browserreports:
2 Source-PASS im Standardsetup, 2 Source-PASS gegen beide gebauten Previews,
22 Completion- und 12 Lifecycle-PASS, jeweils null Fehler/Flaky. Nur beide
App-Projektionen und die neue Spec wurden fachlich veraendert; S15 bleibt
intakt. Foundation-Zusatzgrep war wegen belegtem Port NOT-RUN und ist kein
PASS; die volle frische Matrix muss diesen Umfang jetzt erneut abdecken.
Jetzt genau ein frischer `qa_release_engineer` Terra/high fuer S17 in
FINAL-RECHECKS. Produkt, Bestandstests und historische Evidence read-only;
nur eigene final-reqa-Evidence/Handoff schreiben. Danach frischer gezielter
Architektur-Recheck. Nur neue lokale Folgecommits, kein Amend/Historyrewrite.

Die folgenden Abschnitte dokumentieren fruehere Gates zum jeweiligen Zeitpunkt;
fuer den aktuellen G3-014-Start gilt PO-071 oben.

Aktueller P2-Zwischenstand: `3e67cb1`, P2 insgesamt weiterhin YELLOW.
Loader-Teilfehlerbeleg, A/B/C-Fixtures, echte beidseitige IDB-Grundproben
und P2-L Safety-/Guardvertrag sind gesichert; drei Backendinstanzen beendet.
Vollstaendige IDB-Fehlersemantik und UI-neutrale Controller werden als P2-S/C
strikt sequenziell mit frischen Backendinstanzen abgeschlossen. P3 darf keine
Safety-/Storageorchestrierung uebernehmen; erst vollstaendiges P2-GREEN
erlaubt Frontendarbeit. Details und Eigentum im WORK-PACKETS-Brief/Register.

P2-S wurde nach der nicht akzeptierten Erstuebergabe `142fcac` in `6b51419`
nachgebessert und vom Chief als Speichergrundlage uebernommen. Der echte
Browser-IDB-Lauf liefert 32 PASS und zwei begruendete Skips, einschliesslich
getrennter Schreibinstanzen in zwei echten Tabs, Abort/Close/Timeout,
malformed-v1-Schutz und bundlegebundener Zeit. S5 ist beendet. Jetzt genau
ein frischer Backend/Data-Agent fuer P2-C: UI-neutrale Inhaltssteuerung und
verbliebene enge Transportbelege gemaess CONTROLLER-COMPLETION-Brief.
P2 insgesamt bleibt YELLOW; P3 startet erst nach Chief-Gesamtabgleich.

S6 ist in `9e589b7`/`5e7c0da` unvollstaendig eingefroren und beendet.
Sechs Browserteilproben verwenden echte IDB, aber injizierte Checkresultate;
sie ersetzen nicht die Default-Loader-/Controllerintegration. Sessionguard,
vollstaendige Zustandsmetadaten und Abbruch-/Fehlerbelege fehlen weiter.
Nach wiederholt unvollstaendiger Umsetzung folgt genau ein frischer read-only
`incident_debugger` gemaess CONTROLLER-DIAGNOSIS-Brief. Keine weitere
Produktschreibarbeit vor dessen gesicherter Diagnose; kein P3.

S7 ist in `600eefe` abgeschlossen und beendet. Zwanzig beidseitige rote
Sollassertions belegen fuenf Fehlergruppen, nicht zwanzig neue Fehler.
Chief gibt zuerst genau einem frischen Backend/Data-Agenten (Terra/high)
die enge Safety-Gleichheitskorrektur gemaess SAFETY-EQUALITY-CORRECTION-Brief
frei. Erst nach gesichertem Ergebnis folgt ein frischer fachlicher Backend-
Owner als `worker`, ausdruecklich `gpt-5.6-sol`/high, fuer die belegte kritische
Controller-Incidentbehebung gemaess CONTROLLER-RECOVERY-Brief. Der einmalige
Routingentscheid folgt dem akzeptierten risikobasierten Kostenrouting, aendert
keine Profile und erteilt keine externen API-/Kostenrechte. Die eng notwendige
Store-Metadaten-Leseprojektion ist nur diesem zweiten Auftrag zugeordnet.
Keine parallelen Schreiber, keine Kinder, keine UI-/Produktfreigabe aus
Teilergebnissen. P3 bleibt bis vollstaendigem P2-Abgleich gesperrt.

S8 ist mit `4d19dbc` abgeschlossen und beendet. Der kanonische Equality-Fix
schliesst S7-H-002 im engen Vertragsbereich; 24 Contracttests, reale A/B-
Defaultloaderproben und D03/D09 beider Clients sind GREEN. S7-D10 und die
Controllerbefunde bleiben offen. Jetzt startet ausschliesslich der oben
gebundene frische Sol/high-Worker fuer CONTROLLER-RECOVERY; kein P3.

P1 ist mit `c80829c` GREEN beendet. Der Chief band die notwendige persistente
Pending-Recheck-/Wiederanlaufbarriere innerhalb des vorhandenen Controlvertrags
in `c950c1f`; der Reviewer pruefte sie eng nach. PRE-H-001 ist auf Vertragsebene
geschlossen, keine offenen P1-Findings. Als naechstes genau ein
`backend_data_reliability_engineer` fuer P2, danach unveraenderte sequenzielle
Folge. Der unveraenderte Ausgang besteht 148+8 Tests, 19 Boundaries, sieben
Typechecks, beide Builds, Releaseboundary und 67 Browser-PASS/164 Skips.
Der historische Sammelbefehl `check` ist wegen seines alten Previewmodus
nicht GREEN; gebundene Einzelmatrix und Toolchain stehen in
`docs/evidence/WRN-G3-014/BASELINE-AND-TOOLCHAIN.md`.

P2 lieferte `21de12f` als ausdruecklich YELLOW gekennzeichneten Zwischenstand
und ist beendet. Additive Control-/Bundle-/Guardvertraege, getrennte IDB-Stores
und Streambegrenzung bestehen erste Unit-/Typechecks sowie eine echte mobile
Pending/Clear-Probe. Vollstaendige A/B/C-Fixtures, beide Clientfehlerfallmatrizen
und der komplette Safety-/Updatepfad sind noch offen. Die anfangs nicht
eingehaltene Test-first-Reihenfolge ist dokumentiert. Keine P3-Freigabe: zuerst
frische P2-Fortsetzung mit roten Fehlerfalltests, Runtimevervollstaendigung und
vollstaendiger Beleguebergabe innerhalb PO-071, keine neuen Produktrechte.

Der Product Owner antwortete am 28. August 2026 `weiter bitte`, nachdem als
naechster Schritt ausschliesslich die Vorbereitung von G3-014 angeboten wurde.
PO-070 erlaubt nur Task Brief, read-only Inventar, vorbereitende Risiko- und
Abnahmematrix, Handoff und konsistente Governance. Massgeblich ist
`docs/tasks/WRN-G3-014-LOCAL-CONTENT-OFFLINE-TRANSACTIONS.md`.
G3-014 plant getrennte IndexedDB-Inhaltsrevisionen mit explizitem Speichern,
atomarem Wechsel, erlaubtem Rueckwechsel, Revocationschutz und eng begrenzter
Inhaltsloeschung. Service Worker, Cache Storage und echter Offline-Shell-
Kaltstart bleiben separate Folgeschritte; G3-014 schliesst nicht den gesamten
Offline-MUST-Umfang. Noch darf keine Produkt-/Test-/Fixture-/Builddatei
geaendert und kein Implementierungsagent gestartet werden.
Das einzige Startgate lautet `START WRN-G3-014`. Danach zuerst ein frischer
read-only Architekturreview des Taskvertrags; nur bei GREEN folgen
Backend/Data, Frontend, unabhaengige QA und abschliessender Architekturreview
streng sequenziell mit gesicherten Handoffs. Jede Schreibinstanz besitzt nur
die im Task Brief benannten Dateien. Echte Inhalte, Legacy-/Nutzerdaten,
Android, Dependencies, Remote/CI, Cloud, Deployment, Signierung, Upload und
Veroeffentlichung bleiben gesperrt. Diese Vorbereitung aktiviert keinen Cache.
Der dokumentarische Vorbereitungscheckpoint ist `6e97b04`.

Der Product Owner akzeptierte am 28. August 2026 mit exakt
`G3-013 VISUELL AKZEPTIERT` den Produktkandidaten `0462b4c`, die finale
unabhaengige GREEN-Re-QA `40f37f6` und den Statuscheckpoint `9fa7795`.
PO-069 schliesst G3-013 einschliesslich M-001 fuer den lokalen Kandidaten.
Die neun UI-Sprachen, Englisch beim Erststart, getrennte lokale Persistenz
und der korrigierte Reflow sind akzeptiert. Es wird kein Produktcode
veraendert. WRN-G3-014 Offline/Cache/Update/Rollback benoetigt zuerst ein
separates Vorbereitungsgate; echte Inhalte, Android, Remote/CI, Deployment,
Signierung, Upload und Veroeffentlichung bleiben gesperrt. Die folgenden
Gate-Eintraege dokumentieren die Historie und starten keine alten Auftraege neu.

Der Product Owner akzeptierte am 27. August 2026 mit exakt
`G3-012 VISUELL AKZEPTIERT` den korrigierten Produktkandidaten `1520c05`, die
GREEN-Re-QA `f122555` und den GREEN-Architektur-Recheck `ac48f86`. WRN-G3-012
ist damit geschlossen. Dieselbe Nachricht fordert fuer einen neuen Slice eine
echte Sprach-Dropdownauswahl im Header: erster Start Englisch, danach die
letzte gueltige Auswahl lokal gespeichert und beim erneuten Oeffnen wirksam.
Dieser Folgebedarf ist keine G3-012-Nachbesserung und startet noch keinen
Produkt-/Testcode oder Implementierungsagenten. Zuerst werden Sprachumfang,
App-/Websiteparitaet, Uebersetzungsvertrag, sichere lokale Persistenz,
Accessibility und visuelle Abnahme read-only inventarisiert und danach in einem
eigenen Task Brief mit sichtbarem Startgate gebunden. Ein bloss kosmetisches
Dropdown ohne echte UI-Sprachwirkung ist nicht ausreichend.

Das read-only Inventar bestaetigt die Legacy-Paritaet fuer `en`, `de`, `es`,
`fr`, `it`, `pt`, `ru`, `el` und `tr`, Englisch beim Erststart und die
Wiederherstellung der letzten Auswahl. WRN-G3-013 bindet deshalb App und
dynamische Website gemeinsam, getrennte versionierte Clientkeys, vollstaendige
lokal gebuendelte und typisierte Shellkataloge, `documentElement.lang`, native
zugaengliche Headerselects und eine Neun-Sprachen-Visualmatrix. Artikel,
Originalsprache, Contentrevision/-hashes, statische SEO-Landingpages,
Remoteuebersetzung und Provider bleiben unveraendert. Der zuvor fuer
Offline/Cache/Update/Rollback reservierte Slice wird wegen dieser sichtbaren
Product-Owner-Priorisierung als WRN-G3-014 weitergefuehrt. Noch darf kein
Produkt-, Test-, Package- oder Buildcode geaendert und kein
Implementierungsagent gestartet werden. Das einzige Startgate lautet
`START WRN-G3-013`. Der dokumentarische Vorbereitungsscope steht in
`docs/tasks/WRN-G3-013-HEADER-UI-LANGUAGE-PREFERENCE.md`.
PO-065 erlaubt nur diese Vorbereitung; Produkt-/Test-/Package-/Buildcode und
Implementierungsagenten bleiben bis zum exakten Startgate gesperrt.
Der dokumentarische G3-013-Vorbereitungscheckpoint ist `b4d4a27`.

Der Product Owner erteilte am 27. August 2026 exakt `START WRN-G3-013`.
PO-066 gibt ausschliesslich den schriftlichen Produkt-/Testscope in
`docs/tasks/WRN-G3-013-HEADER-UI-LANGUAGE-PREFERENCE.md` frei. Zuerst arbeitet
genau ein `frontend_brand_engineer` am typisierten Schluesselvertrag, dem
kanonischen englischen Katalog, getrennten sicheren Speicheradaptern und der
ersten App-/Websiteintegration. Unvollstaendige Sprachen duerfen dabei nicht
sichtbar angeboten werden. Erst nach einem gesicherten Fundamentcheckpoint
duerfen bis zu drei `spark_micro_task_worker` parallel und mit disjunktem
Dateieigentum ausschliesslich die Kataloggruppen `de/es/fr`, `it/pt/tr` und
`ru/el` bearbeiten. Danach folgen strikt sequenziell ein frischer
`frontend_brand_engineer` fuer Integration und Produktkandidat, ein frischer
read-only `security_privacy_reviewer` und ein frischer unabhaengiger
`visual_accessibility_reviewer`.

Artikel und `originalLanguage`, Content-IDs/-Hashes/-Revisionen, statische
SEO-Landingpages, Provider/Remoteuebersetzung, G3-014 Offline/Cache, echte
Inhalte, Android-Native, Remote/CI, Deployment, Signierung, Upload und
Veroeffentlichung bleiben gesperrt. Technisches GREEN ersetzt keine sichtbare
Product-Owner-Abnahme. Der G3-013-Startcheckpoint ist `3f35b38`.

Das englische Fundament ist in `d5d3417`/`a0de01f` und sein Handoff in
`e5ccb3b` GREEN gesichert. Drei disjunkte Spark-Kataloggruppen lieferten die
acht restlichen Kataloge; der frische Integrationsagent pruefte und integrierte
sie in den Produkt-/Testkandidaten `56057dd` mit Evidence/Handoff `55b0d4b`.
Format, Lint, 19 Boundarytests, acht Typechecks, 148 Tests, beide Builds und
der volle Browserlauf mit 62 PASS, 148 erwarteten Skips und null Fehlern waren
GREEN. Der frische Security-/Privacy-Review `0afcc34` meldet null Blocker,
Highs, Mediums oder Lows.

Die frische unabhaengige Visual-/Accessibility-QA `3125cd5` ist dagegen
YELLOW abgeschlossen und der Agent beendet. Offen ist genau Medium
`WRN-G3-013-M-001`: Bei 390 x 844 und 200 Prozent Reflow beschneiden beide
geschlossenen nativen Sprachselects den sichtbaren Wert; Mobile/Griechisch
zeigt `Ελλ…`, Website/Portugiesisch `Po…`. Tastatur, Screenreadername,
44-Pixel-Ziel, Axe, Overflow, Konsole, Requests und Storage-Nebenwirkungen
bleiben GREEN, der sichtbare Inhaltsverlust verletzt aber Akzeptanzkriterium 8.
Kein Agent darf dies ohne sichtbares enges Korrekturgate beheben. Erlaubbar
waere nur eine responsive Darstellung, die geschlossen einen der gebundenen
kompakten Codes (`EL`, `PT` usw.) oder den vollstaendigen Optionsnamen zeigt,
ohne Header-/Brand-/Themegeometrie zu verschlechtern, plus enge Regressionen.
Danach ist eine frische vollstaendige unabhaengige Re-QA erforderlich.

Der Product Owner erteilte am 27. August 2026 exakt
`G3-013 M-001 BEHEBEN`. PO-067 erlaubt ausschliesslich die responsive
Darstellung der bereits vorhandenen nativen Sprachselects in Mobile und
dynamischer Website sowie eng zugehoerige Komponenten-/Browsertests. Der
geschlossene Zustand muss bei 390 x 844 und 200 Prozent Reflow einen
vollstaendigen gebundenen Kompaktcode wie `EL` oder `PT` oder alternativ den
vollstaendigen Optionsnamen zeigen; die native geoeffnete Optionsliste,
lokalisierte zugaengliche Namen, Fokus, Tastatur, 44-Pixel-Ziel und alle neun
Sprachen bleiben erhalten. Erlaubt sind nur die beiden Headerprojektionen,
eng notwendige gemeinsame UI-Language-Helfer, minimale responsive Styles und
Tests/Evidence/Handoff. Andere Shelltexte, Kataloguebersetzungen, Theme-/Brand-
Geometrie ausserhalb dieser engen Reflowgrenze, Storageadapter, Content,
Vertraege, Fixtures, Publisher, statische Landingpages, Rootkonfiguration und
externe Aktionen bleiben unveraendert. Nach gesichertem Korrekturkandidaten
wird der Frontend-Agent beendet; danach wiederholt ein frischer unabhaengiger
`visual_accessibility_reviewer` die vollstaendige G3-013-Matrix. Technisches
GREEN ersetzt keine sichtbare Product-Owner-Abnahme. Der PO-067-
Korrekturstartcheckpoint ist `af0138f`.

Der PO-067-Frontend-Agent sicherte den Korrekturkandidaten `b21b02e` und
Evidence/Handoff `f181d0d` und ist beendet. Die volle Implementierungsmatrix
war GREEN: Format, Lint, 19 Boundarytests, sieben vorhandene Typechecks,
148 Vitest- plus acht statische Website-Tests, beide Builds und 65 Browser-
PASS bei 159 erwarteten Skips und null Fehlern. Die native Sprachwahl erhielt
im engen Reflow volle Breite; die Mobile-Shell wechselte nur dort in einen
vertikalen Dokumentfluss.

Die frische unabhaengige Re-QA `01a0e07` ist dennoch YELLOW abgeschlossen und
der Agent beendet. `WRN-G3-013-M-001` bleibt als einziges Medium offen: Wird
der Mobile-Client bei 390 x 844 normal gemountet und erst danach auf 200
Prozent Reflow umgestellt, aktualisiert der reaktive Wide-Language-Zustand
nicht. `data-wide-language-layout` fehlt, und `Ελληνικά (EL)` wird bei einem
117 x 88 Pixel grossen Select gegen 204,5 Pixel Textbreite erneut als `Ελλ…`
abgeschnitten. Der volle Standard-Browserlauf bildet diese Reihenfolge nicht
ab und ersetzt den frischen Nach-Mount-Beleg nicht. Kein Agent darf den
Kandidaten ohne ein neues sichtbares enges Korrekturgate veraendern. Eine
Folgekorrektur muss den nachtraeglichen Reflow deterministisch erkennen oder
den Bedarf an reaktivem JavaScript durch eine robuste rein responsive Grenze
ersetzen; danach ist erneut eine frische vollstaendige unabhaengige Re-QA
erforderlich.

Der Product Owner erteilte am 27. August 2026 exakt
`G3-013 M-001 ERNEUT BEHEBEN` und fragte, warum immer mehr Fehler auftreten.
PO-068 erlaubt ausschliesslich die deterministische Schliessung des weiterhin
offenen Nach-Mount-Reflowfalls. Zuerst prueft genau ein frischer
`incident_debugger` read-only den Lifecycle der bisherigen
MutationObserver-/Resize-/Fontgroessenlogik, reproduziert den Fehler mit einem
vor jeder Korrektur roten Nach-Mount-Test und empfiehlt die kleinste robuste
Grenze. Er darf nur Diagnosebericht und Handoff schreiben. Erst nach seinem
gesicherten Handoff darf genau ein frischer `frontend_brand_engineer` die
unzuverlaessige Reflowerkennung in beiden Headerprojektionen und eng
zugehoerige Styles/Tests korrigieren. Die Korrektur muss initialen und
nachtraeglichen Reflow, Resize/Unmount, alle neun Sprachen, Mobile-
Dokumentfluss und Websiteheader belegen. Danach folgt erneut eine frische
vollstaendige unabhaengige Re-QA.

Die steigende Findingzahl ist kein Zeichen einer sinkenden Gesamttestqualitaet:
Die Matrix entdeckt zunehmend zeit- und zustandsabhaengige Grenzfaelle. In
diesem konkreten Fall war die PO-067-Loesung aber selbst zu fragil, weil ihr
GREEN-Test nur die guenstige Initialisierungsreihenfolge abdeckte. PO-068
bindet deshalb Test-first den zuvor fehlenden realen Nach-Mount-Ablauf, bevor
erneut Produktcode geaendert werden darf. Kataloge, Storage, Content,
Vertraege, Fixtures, Publisher, statische Landingpages, allgemeines Design,
Rootkonfiguration, G3-014 und externe Aktionen bleiben unveraendert. Der
PO-068-Korrekturstartcheckpoint ist `e8e5758`.

Der frische Incident-Debugger schloss seine read-only Diagnose im Checkpoint
`a0504ce` ab und ist beendet. Der in `01a0e07` behauptete persistente
Nach-Mount-Produktfehler ist auf dem unveraenderten Kandidaten `b21b02e` nicht
reproduzierbar: Initialer Reflow, Reflow nach vollstaendigem Mount, Rueckkehr
auf 100 Prozent, Resize sowie die exakte historische Sequenz liefen in Mobile
und Website GREEN; letztere je Client 12 von 12 Mal. Die Timeline zeigt einen
kurzen asynchronen Zwischenzustand: Root-Font und Mutation sind bereits
wirksam, der React-Commit fuer `data-wide-language-layout` folgt erst danach.
Die feste 150-ms-Einzelprobe der Re-QA war deshalb kein deterministischer
Endzustandsnachweis.

Der durch PO-068 vorgeschriebene RED-vor-Korrektur-Nachweis fehlt. Daher darf
kein Frontend-Agent Produkt- oder Testcode veraendern; eine Mutation eines
aktuell GREEN reproduzierten Kandidaten waere unbelegte Nachbesserung. Als
naechstes darf genau ein frischer `visual_accessibility_reviewer` den
unveraenderten Kandidaten unabhaengig mit beobachtbarem Zustands-Polling statt
fixer Wartezeit und danach mit der vollstaendigen G3-013-Matrix pruefen. Nur
wenn diese frische Re-QA einen stabilen falschen Endzustand reproduziert, wird
erneut gestoppt. Technisches GREEN ersetzt weiterhin keine sichtbare
Product-Owner-Abnahme.

Die frische deterministische Re-QA `91a9971` hat den zuvor fehlenden
RED-vor-Korrektur-Nachweis auf dem unveraenderten Kandidaten `b21b02e`
erbracht und ist beendet. Der Nach-Mount-Ablauf blieb in Mobile 12/12 und
Website 12/12 auch nach je drei Sekunden zustandsbasiertem Polling stabil
falsch (`rootFont=32px`, `data-wide-language-layout` abwesend). Format, Lint,
19 Boundarytests, sieben Typechecks, 148 plus acht Tests, beide Builds und der
volle Browserlauf mit 65 PASS, 159 erwarteten Skips und null Fehlern blieben
GREEN. PO-068 ist damit erfuellt und autorisiert jetzt genau einen frischen
`frontend_brand_engineer` fuer den eng begrenzten Lifecyclefix in beiden
Headerprojektionen samt rotem Nach-Mount-Regressionstest. Danach wird der
Agent beendet und genau ein frischer unabhaengiger
`visual_accessibility_reviewer` wiederholt die vollstaendige G3-013-Matrix.
Kataloge, Storage, Content, Vertraege, Fixtures, Publisher, statische
Landingpages, allgemeines Design, Rootkonfiguration, G3-014 und externe
Aktionen bleiben gesperrt.

Der PO-068-Frontend-Agent sicherte den eng begrenzten Produkt-/Testkandidaten
`0462b4c` und die Implementierungsevidenz samt Handoff `a51ebe2` und ist
beendet. Beide Headerprojektionen verwenden nun `useLayoutEffect`, eine
synchrone Initialmessung, Root-Mutation sowie Window-/Visual-Viewport-Resize
mit vollstaendigem Cleanup. Die Implementierungsmatrix war GREEN mit sieben
Typechecks, 148 plus acht Tests, 19 Boundarytests, beiden Builds,
Releaseboundary und 67 Browser-PASS bei 164 erwarteten Skips und null Fehlern.

Die frische unabhaengige PO-068-Re-QA ist im Checkpoint `40f37f6` GREEN
abgeschlossen und der Reviewer beendet. M-001 ist geschlossen: 216/216 echte
Nach-Mount-200-Prozent-Uebergaenge (108 Mobile, 108 Website) erreichten per
zustandsbasiertem Polling den korrekten Wide-Endzustand. Initialer Reflow,
Rueckkehr auf 100 Prozent, Resize, Reload/Remount, neun Sprachen, Mobile-
Dokumentfluss, Websiteheader, Fokus, Tastatur, 44-Pixel-Ziele, Axe, Overflow,
Persistenz, Contentinvarianz und No-Side-Effects sind GREEN. Es bestehen null
Blocker, Highs, Mediums oder Lows. G3-013 ist technisch bereit fuer die
sichtbare Product-Owner-Entscheidung; Folgefeatures und externe Aktionen
bleiben gesperrt.

Der Product Owner erteilte am 27. August 2026 exakt
`G3-012 M-001 BEHEBEN`. PO-062 erlaubt ausschliesslich die zweistufige
Descriptor-/Manifestvorpruefung in den getrennten Mobile-/Websiteadaptern und
enge Requestzaehler-Regressionen. Descriptorstruktur und Compatibility werden
vor dem Manifestrequest geprueft; erwartete Revision und gepinnter kanonischer
Manifesthash werden vor jedem Payloadrequest geprueft. Invalid Descriptor,
Compatibility, Revision und Manifesthash muessen je Client null Payloadrequests
belegen. Vertraege, Fixtures, Releaseartefakte, Publisher, UI/Styling,
Dependencies, Rootkonfiguration und Alt-/Liveprojekte bleiben unveraendert.
Zuerst erfolgt eine frische read-only Sicherheits-/Kompatibilitaetspruefung,
danach genau eine Schreibinstanz. Anschliessend folgen sequenziell ein frischer
read-only Bypassreview, vollstaendige unabhaengige Re-QA und ein kurzer frischer
read-only Architekturreview. Bei Finding wird gestoppt. G3-013, Service Worker,
Cache/IndexedDB, echte Inhalte, Cloud/Livezugriff, Android, Remote/CI,
Deployment, Signierung, Upload und Release bleiben gesperrt.
Der PO-062-Korrekturstartcheckpoint ist `3ac2251`.

Die einzige PO-062-Schreibinstanz sicherte den Produkt-/Testkandidaten
`1520c05` und Evidenz/Handoff `18018ce` und ist beendet. Beide Adapter pruefen
Descriptor und Manifest vor jedem Payloadrequest; zehn direkte Zaehlertests
belegen fuer Invalid Descriptor, Compatibility, Revision und Manifesthash null
Payloadrequests und den legitimen Sechs-Payload-Erfolgsfall. Der danach frisch
und read-only ausgefuehrte Bypassreview meldet 0 Blocker, 0 Highs, 0 Mediums
und 0 Lows und bestaetigt keine alternative Browser-Requestkette. Als naechstes
darf genau ein frischer `qa_release_engineer` den unveraenderten Kandidaten mit
der vollstaendigen G3-012- und Regressionsmatrix pruefen. Bei Finding wird
gestoppt; nur bei GREEN folgt ein frischer kurzer read-only Architekturreview.

Die frische unabhaengige Re-QA ist im Evidenzcheckpoint `f122555` GREEN
abgeschlossen und der Agent beendet. Es bestehen null Blocker, Highs, Mediums
oder Lows. Mit exakter Node-24.19-/pnpm-11.19-Toolchain sind Format, Lint,
19 Boundarytests, sechs Typechecks, 143 Tests, beide Builds, Releaseboundary
und der volle Browserlauf mit 61 PASS, 142 erwarteten Skips und null Fehlern
GREEN. Zehn direkte Requestzaehlertests belegen in beiden Clients null
Payloadrequests fuer Invalid Descriptor, Compatibility, Revision und
Manifesthash. 48 frische PNGs und die Runtime-Matrix belegen gleiche Revision,
Hashes und IDs sowie null externe Requests, Cookies, unerwartete Storage-/
IndexedDB-/Cache-/Service-Worker-Wirkung, Axe-Verstoesse, Overflow, zu kleine
Ziele oder Konsolenfehler. Als naechstes darf genau ein frischer
`independent_architecture_reviewer` den unveraenderten Kandidaten kurz read-only
auf M-001-Schliessung, Paket-/Publishergrenzen und sichere G3-013-
Voraussetzungen pruefen. Er darf nur Bericht und Handoff schreiben, nichts
korrigieren.

Der letzte frische Architektur-Recheck ist im Checkpoint `ac48f86` PASS/GREEN
abgeschlossen und der Agent beendet. Es bestehen null Blocker, Highs, Mediums
oder Lows. M-001 ist vollstaendig geschlossen: keine Browser-Bypasskette oder
Teilaktivierung, atomare Schlussvalidierung sowie Client-, Package-, Release-
und Publishergrenzen bleiben intakt. G3-013 ist bezueglich dieser
Vertrauensreihenfolge sicher vorbereitet; Cache, Service Worker, Staging,
Rollback und produktive Provenienz sind weder implementiert noch freigegeben.
Alle G3-012-Mitarbeiter sind beendet. Die sichtbare Product-Owner-Abnahme
startet kein Folgefeature automatisch.

Der Product Owner erteilte am 26. August 2026 exakt
`BEREITE WRN-G3-012 VOR`. PO-060 erlaubt ausschliesslich Task Brief,
Runtime-/Publisherinventar, Security-/Privacy-Vorpruefung, Paritaets- und
Abnahmeplan, Vorbereitungshandoff sowie konsistente Governance- und
Statusdokumente. G3-012 fuehrt den bestehenden Manifest-v1-Vertrag in eine
releasefoermige lokale Lesegrenze ueber und plant die vollstaendige Entfernung
von `@wrn/test-support` aus Produktquellen, normalen Build-/Publisherpfaden und
finalen Artefakten. Feed, Discover, Reader, Lifecycle und Websitepublikation
muessen spaeter eine einzige atomar validierte lokale Revision verwenden.
Noch darf keine Produkt-, Test-, Fixture-, Asset- oder Builddatei geaendert und
kein Implementierungsmitarbeiter gestartet werden. Das einzige Startgate
lautet `START WRN-G3-012`. Service Worker, Cache/IndexedDB, echte Inhalte,
Cloud/Livezugriff, Android, Remote/CI, Deployment und Release bleiben eigene
spaetere Gates.
Der dokumentarische G3-012-Vorbereitungscheckpoint ist `879d0b2`.

Der Product Owner erteilte am 27. August 2026 exakt `START WRN-G3-012`.
PO-061 gibt ausschliesslich den schriftlichen Produkt-/Testscope in
`docs/tasks/WRN-G3-012-IMMUTABLE-CONTENT-REVISION-CONSUMER.md` frei. Die
Arbeit erfolgt strikt sequenziell: zuerst genau ein
`backend_data_reliability_engineer` fuer Release-Descriptor,
Consumer-/Fehlervertrag, deterministische lokale Releasebereitstellung und
Contract-/Boundarytests. Nach gesichertem GREEN-Checkpoint und Handoff wird
dieser Agent beendet. Erst danach darf ein frischer
`frontend_brand_engineer` die getrennten Mobile-/Websiteadapter und den
Website-Publisher umstellen. Nach dessen Kandidaten/Handoff folgt genau ein
frischer `qa_release_engineer` fuer die unabhaengige Gesamtmatrix. Parallele
Schreibarbeit ist verboten. Service Worker, Cache/IndexedDB, echte Inhalte,
Live-/Cloudzugriff, Android, Remote/CI, Deployment, Signierung, Upload und
Veroeffentlichung bleiben gesperrt. Technisches GREEN ersetzt keine sichtbare
Product-Owner-Abnahme.
Der G3-012-Startcheckpoint ist `341e46d`.

Der Backend/Data-Agent sicherte den Produktcheckpoint `171b3ba` und den
Evidence-/Handoffcheckpoint `63cbc10` und ist beendet. Manifest v1 blieb
semantisch unveraendert; ein additiver Release-Descriptor pinnt Manifest und
alle Teilvertraege. Feed, Discover, Reader, Lifecycle und Websitepublikation
werden atomar validiert. Allowlist, Compatibility, MIME, Redirect, Status,
Transport-Hardcap, Timeout/Abort und sichere Fehlerkategorien sind getestet.
Der Release-Boundary-Checker erfasst nun Client-, Publisher-, Tool- und
Artefaktpfade. Bestaetigt sind Format, Lint, 19 Boundarytests, alle Typechecks,
133 Unit-/Contracttests und beide Builds. `check:release-boundaries` bleibt
vor dem Frontendschritt erwartungsgemaess RED, weil die unveraenderten
Client-/Publisherimporte noch bestehen. Als naechstes darf genau ein frischer
`frontend_brand_engineer` diese Kopplung im schriftlichen Scope entfernen.

Der frische Frontend-Agent vollendete Mobile, Website und Publisher und
sicherte den Produktkandidaten `c99fa2b` sowie Evidenz/Handoff `eb8fc78`.
Beide Clients lesen getrennte lokale Releaseartefakte ueber denselben
Descriptor; Feed, Discover, Reader, Lifecycle und Websitepublikation teilen
Revision, Manifesthash und ID-Mengen. `@wrn/test-support` ist aus
Produktdependencies, Runtime-, normalen Build- und Publisherpfaden entfernt;
die echte Releaseboundary ist GREEN. Bestaetigt sind Format, Lint,
19 Boundarytests, alle Typechecks, 133 Tests, beide Builds und der volle
Browserlauf mit 61 PASS, 142 erwarteten Skips und null Fehlern. Der Agent ist
beendet. Als naechstes darf genau ein frischer `qa_release_engineer` den
unveraenderten Kandidaten mit der gesamten G3-012- und Regressionsmatrix
pruefen. Bei Finding wird gestoppt; QA darf nichts korrigieren.

Die frische unabhaengige QA ist im Checkpoint `012d6a2` GREEN abgeschlossen
und der Agent beendet. Es bestehen null offene Blocker, Highs, Mediums oder
Lows. Mit gebundener Node-24.19-/pnpm-11.19-Toolchain sind Format, Lint,
19 Boundarytests, sechs Workspace-Typechecks, 133 Tests, beide Builds, die
Releaseboundary und der volle Browserlauf mit 61 PASS, 142 erwarteten Skips
und null Fehlern GREEN. 21 frische PNGs und eine 19-Fall-Runtimematrix belegen
gleiche Revision/Hashes/IDs, fail-closed Descriptor-Manipulation sowie null
externe Requests, Cookies, unerwartete Storage-/IndexedDB-/Cache-/Service-
Worker-Wirkung, Axe-Verstoesse, Overflow, zu kleine Ziele oder Konsolenfehler.
Vor der sichtbaren Product-Owner-Entscheidung darf genau ein frischer
`independent_architecture_reviewer` den unveraenderten Kandidaten read-only
auf Package-/Publishergrenzen und G3-013-Cachevoraussetzungen pruefen. Er darf
nur seinen Bericht und Handoff schreiben und nichts korrigieren.

Der unabhaengige Architekturreview `aec0d82` schloss mit 0 Blockern, 0 Highs,
1 Medium und 0 Lows ab. `WRN-G3-012-M-001`: Beide Clientadapter lesen nach dem
Descriptor sofort Manifest und alle Payloads parallel und validieren
Descriptor/Compatibility/Manifestrevision/-hash erst danach. Die UI aktiviert
keinen falschen Inhalt, externe Requests und Storage-/Cachewirkungen bleiben
null; dennoch verletzt dies die gebundene Null-Payloadrequest-Grenze und waere
eine unsichere Grundlage fuer spaeteres G3-013-Staging. Kein Agent darf dies
ohne sichtbares Korrekturgate beheben. Erlaubbar waere nur die zweistufige
Descriptor-/Manifestvorpruefung beider Adapter plus Requestzaehler-
Regressionen. Danach sind frische unabhaengige Re-QA und erneuter kurzer
read-only Architekturreview erforderlich. G3-012 darf noch nicht visuell als
technisch abgeschlossen akzeptiert und G3-013 nicht begonnen werden.

Der Product Owner akzeptierte am 26. August 2026 mit exakt
`G3-011 VISUELL AKZEPTIERT` den korrigierten lokalen Produktkandidaten
`d19ce4d`, die GREEN-Re-QA `f1ebf70`, den technischen PO-056-Vollrecheck
`1b344b6` und den GREEN-Registerabschluss `695b1c0`. Vor der Bindung wurde der
sichtbare Task `WRN G2 – Zielarchitektur & ADRs` gelesen und durch einen
`context_continuity_auditor` mit diesem Repository verglichen. Dessen
Worktree-Stand `f430f95` und seine unversionierten Foundationdateien bilden
eine historische parallele G3-001-Spur, keine aktuellere Quelle. Sie werden
nicht kopiert oder zusammengefuehrt; es fehlt dort keine fuer G3-011
massgebliche Architekturentscheidung. Diese Abnahme startet kein Folgefeature
und gibt insbesondere keine echten Inhalte, Android-, Remote-/CI-, Cloud-,
Deployment-, Signier-, Upload- oder Veroeffentlichungsaktion frei.

Der Product Owner erteilte am 25. August 2026 exakt
`BEREITE WRN-G3-009 VOR`. Freigegeben ist ausschliesslich die Vorbereitung in
`docs/tasks/WRN-G3-009-BRAND-HEADER-PARITY-CORRECTION.md`: die aktuelle
dunkle, logo-dominante Mobile-Headerwirkung als Referenz binden, die falsche
direkte Headerrolle von `app-background.webp` korrigierbar spezifizieren, den
eigenstaendigen kompakten Websiteheader bewahren sowie lokale Tests und
visuelle Abnahme planen. Noch darf kein Produkt-/Testcode oder Asset geaendert
und kein Mitarbeiter gestartet werden.
Der dokumentarische Vorbereitungscheckpoint ist `c0ae31f`.

Der Product Owner erteilte am 25. August 2026 exakt `START WRN-G3-009`.
Freigegeben ist nur der schriftliche Scope des Task Briefs. Zuerst arbeitet
genau ein `frontend_brand_engineer` an den erlaubten Brandtoken-, Mobile-,
Website- und Testpfaden. Erst nach gesichertem Kandidatencheckpoint und Handoff
darf ein unabhaengiger `visual_accessibility_reviewer` den unveraenderten
Kandidaten pruefen. Parallele Schreibarbeit ist verboten.
Der Startcheckpoint ist `5e9f64b`.

Der Frontend-Brand-Agent sicherte den Produktkandidaten `973c129` und den
Handoff `aedaa02`. `app-background.webp` ist aus beiden Headerrollen entfernt,
die mobile Marke verwendet responsiv die belegte 94-bis-118-Pixel-Wirkung und
die Website bleibt eine getrennte kompakte Komposition. Es wurden keine neuen
Headerfunktionen oder Assets eingefuehrt.

Die unabhaengige QA `692fe24` bestaetigt 101 Unit-/Contract-/Komponententests,
17 Boundarytests, beide Builds, 51 Browser-PASS bei 117 erwarteten Skips und
17 commitgebundene Visual-/A11y-/Runtimefaelle. Axe, horizontaler Overflow,
Storage und externe Requests melden jeweils null; es bestehen null offene
Blocker, Highs, Mediums oder Lows. Die lokale Node-Version 24.16 statt 24.19
bleibt eine getrennte Toolchainabweichung und kein Produktfinding. Bis zur
sichtbaren Product-Owner-Entscheidung wird weder nachgebessert noch ein
Folgefeature begonnen.
Der technische GREEN-Statuscheckpoint ist `8339aa2`.

Der Product Owner akzeptierte am 25. August 2026 mit exakt
`G3-009 VISUELL AKZEPTIERT` den Produktkandidaten `973c129` und die
unabhaengige QA `692fe24`. Der Befund `WRN-BRAND-PARITY-M-001` ist damit fuer
den lokalen Migrationskandidaten geschlossen. Diese Abnahme startet keine
Nachbesserung und kein Folgefeature. Insbesondere bleiben neue
Headerfunktionen, echte Inhalte, Android, Remote/CI, Deployment, Signierung,
Upload und Veroeffentlichung separate sichtbare Gates.

Nach dieser Abnahme benannte der Product Owner die themeabhaengige
Markenwirkung der aktuellen App als zu erhaltende Staerke. Die read-only
Runtimepruefung bestaetigt `WRN-BRAND-THEME-PARITY-M-002`: Die aktuelle App
bietet sieben Themeoptionen; ihre Logo-Dropshadows und der maskierte
zweifarbige Markenschriftzug werden aus `--cyan` und `--red` gespeist. Im
Pink-Theme werden diese Akzente zu `#ff4fa3` und `#9b82ff`. Das neue Projekt
unterstuetzt bisher nur Hell/Dunkel und koppelt die Bildmarke noch nicht an
Theme-Akzente. Dieser Befund widerruft PO-047 nicht, ist aber als eigener
Folgeslice offen. Vor einem sichtbaren Vorbereitungsgate darf dazu weder
Produktcode geaendert noch ein Mitarbeiter gestartet werden.
Der G3-009-Abnahme- und Theme-Folgebefundcheckpoint ist `bf96d21`.

Der Product Owner erteilte am 25. August 2026 exakt
`BEREITE WRN-G3-010 VOR`. Freigegeben ist ausschliesslich die Vorbereitung in
`docs/tasks/WRN-G3-010-THEME-REACTIVE-BRAND-PARITY.md`: sechs echte
Farbpaletten plus die dynamische Praeferenz `system`, eine einfache
zugaengliche Themeauswahl, lokale validierte Persistenz, theme-reaktive
Markenakzente, hoechstens die bereits owner-attested und hashgebundene
Originalmaske sowie lokale Tests und visuelle Abnahmeplanung. Mobile und
Website behalten ihre getrennten, durch PO-047 akzeptierten Headerlayouts.

Noch darf kein Produkt-/Testcode oder Asset geaendert und kein Mitarbeiter
gestartet werden. Das einzige Implementierungsgate lautet
`START WRN-G3-010`. Auch danach bleiben allgemeines Redesign, Fonts,
Navigation, Inhalte, Backend, Android, Remote/CI, Cloudflare, Hostinger,
Deployment, Signierung, Upload und Veroeffentlichung ausserhalb des
schriftlichen G3-010-Scope.
Der dokumentarische G3-010-Vorbereitungscheckpoint ist `d7880a1`.

Der Product Owner erteilte am 26. August 2026 exakt `START WRN-G3-010`.
Freigegeben ist nur der schriftliche Produkt-/Testscope in
`docs/tasks/WRN-G3-010-THEME-REACTIVE-BRAND-PARITY.md`. Die Arbeit erfolgt
strikt sequenziell: zuerst genau ein `frontend_brand_engineer` fuer den
Themevertrag, die kontrollierte Assetgrenze, getrennte Clientprojektionen und
zugehoerige lokale Tests; nach gesichertem Produktkandidatencheckpoint und
Handoff wird dieser Agent beendet. Erst danach darf ein unabhaengiger
`visual_accessibility_reviewer` den unveraenderten Kandidaten pruefen.
Parallele Schreibarbeit an Brandtokens, Clients oder Tests ist verboten.

Das Startgate erlaubt keine weitere Funktion, kein allgemeines Redesign und
keine Live-, Android-, Remote-, Deployment- oder Releaseaktion. Technisches
GREEN ersetzt nicht die spaetere sichtbare Product-Owner-Abnahme.
Der G3-010-Startcheckpoint ist `7c9cb7f`.

Der Frontend-Brand-Agent sicherte den unveraenderten Produktkandidaten
`3cc85e1`, die Implementierungsevidenz `5c6150c`/`9b680c9` und den Handoff
`6ec6010`. Beide Clients besitzen sechs echte Paletten plus `system`, eine
validierte lokale Theme-Praeferenz und theme-reaktive Markenakzente. Die
optionale Originalmaske wurde nicht importiert. Der Implementierungsagent ist
beendet.

Die unabhaengige QA `f3e2c94` bestaetigt 104 Unit-/Contract-/Komponententests,
17 Boundarytests, beide Builds, 53 Browser-PASS bei 122 erwarteten Skips und
28 commitgebundene Visual-/Accessibility-/Runtimefaelle. Axe, horizontaler
Overflow, zu kleine Ziele, unerwarteter Storage und externe Requests melden
jeweils null; Systemwechsel, Persistenz, Invalid-Fallback und Brand-Fallback
sind fuer App und Website belegt. Es bestehen null offene Blocker, Highs,
Mediums oder Lows. Node 24.16 statt 24.19 bleibt eine getrennte lokale
Toolchainabweichung und kein Produktfinding. Bis zur sichtbaren
Product-Owner-Entscheidung wird weder nachgebessert noch ein Folgefeature
begonnen.
Der technische G3-010-GREEN-Statuscheckpoint ist `6dbd7d5`.

Der Product Owner akzeptierte am 26. August 2026 mit exakt
`G3-010 VISUELL AKZEPTIERT` den Produktkandidaten `3cc85e1` und die
unabhaengige QA `f3e2c94`. `WRN-BRAND-THEME-PARITY-M-002` ist damit fuer den
lokalen Migrationskandidaten geschlossen. Diese Abnahme startet weder eine
Nachbesserung noch ein Folgefeature und erteilt keine Freigabe fuer Fonts,
echte Inhalte, Backend, Android, Remote/CI, Cloudflare, Hostinger, Deployment,
Signierung, Upload oder Veroeffentlichung.
Der G3-010-Abnahmecheckpoint ist `39f95ec`.

Der Product Owner antwortete danach am 26. August 2026 mit exakt
`fahre fort`, nachdem der Main Agent als naechsten Schritt die Auswahl und
zunaechst ausschliessliche Vorbereitung eines neuen Produktslices erklaert
hatte. PO-052 autorisiert deshalb nur die Vorbereitung in
`docs/tasks/WRN-G3-011-LOCAL-SAVED-READING-STATE.md`: ein versionierter,
kanonisch ID-basierter und rein lokaler V1-Zustand fuer `Spaeter lesen`,
Gelesen/Ungelesen und minimalen Lesefortschritt; getrennte Clientkeys;
explizite Loeschung; reine Legacy-Migrationsfixture; lokale Tests und
Sichtabnahmeplanung. Volltexte, Bilder, IndexedDB, Cache Storage, Service
Worker, echte Legacy-/Nutzerdaten, Android, Sync, Cloud und Deployment bleiben
ausgeschlossen. Noch darf kein Produkt-/Testcode oder Fixture geaendert und
kein Mitarbeiter gestartet werden. Das einzige Implementierungsgate lautet
`START WRN-G3-011`.
Der dokumentarische G3-011-Vorbereitungscheckpoint ist `fc248f1`.

Der Product Owner erteilte am 26. August 2026 exakt `START WRN-G3-011`.
Freigegeben ist nur der schriftliche Produkt-/Testscope in
`docs/tasks/WRN-G3-011-LOCAL-SAVED-READING-STATE.md`. Die Arbeit erfolgt
strikt sequenziell: zuerst genau ein `backend_data_reliability_engineer` fuer
V1-Vertrag, reine Domain, selbst erstellte Legacy-Migrationsfixture und Tests;
nach gesichertem Checkpoint/Handoff wird dieser Agent beendet. Erst danach
darf ein `frontend_brand_engineer` die getrennten clientlokalen Adapter und
Oberflaechen implementieren. Nach dessen gesichertem Kandidaten/Handoff folgt
ein unabhaengiger `visual_accessibility_reviewer`.

Das Startgate erlaubt keine Offline-Volltexte oder Bilder, keine echte
Legacy-/Nutzerdatenmigration, kein IndexedDB, Cache Storage, Service Worker,
Android, Sync, Remote/CI, Cloud, Deployment oder Release. Technisches GREEN
ersetzt nicht die spaetere sichtbare Product-Owner-Abnahme.
Der G3-011-Startcheckpoint ist `b4c72bc`.

Der Contract-/Domain-/Fixture-Agent sicherte den GREEN-Produktcheckpoint
`b0aee26` und den Handoff `4cf249f`. Bestaetigt sind Format, Lint,
17 Boundarytests, alle Workspace-Typechecks, 114 Unit-/Contract-/
Komponententests und beide Builds. Der bekannte lokale Toolchainstopp Node
24.16 statt 24.19 bleibt getrennt und ist kein G3-011-Produktfinding.

Der anschliessende Frontend-Agent stoppte korrekt an der Paketgrenze: App und
Website besitzen keine direkte Abhaengigkeit auf `@wrn/content-contracts`,
waehrend der V1-Validator und sein Typ nicht ueber `@wrn/domain` exponiert
werden. Der noch nicht kompilierbare Mobile-WIP ist in `e7f627f`, der
YELLOW-Handoff in `63218cd` gesichert. Website, E2E, Packages, Altprojekte und
Live-Systeme blieben dabei unveraendert.

Der Product Owner erteilte am 26. August 2026 exakt
`G3-011 VERTRAGSBRUECKE BEHEBEN`. PO-054 erlaubt ausschliesslich einen
minimalen additiven Re-Export des bereits bestehenden V1-Validators und der
fuer Clients erforderlichen V1-Typen/Konstanten aus `@wrn/domain` sowie eng
zugehoerige Domain-Exporttests. Keine Semantik, kein Schema, keine Fixture,
keine App-/Website-/E2E-Datei, keine Dependency und keine Rootkonfiguration
darf in diesem Korrekturschritt geaendert werden. Erst nach gesichertem GREEN-
Checkpoint und beendetem Backend/Data-Agent darf ein frischer
`frontend_brand_engineer` aus dem WIP fortsetzen. Danach folgt weiterhin die
unabhaengige QA; technisches GREEN ersetzt keine Product-Owner-Abnahme.

Die PO-054-Bruecke ist im GREEN-Produktcheckpoint `d856f64` und Handoff
`34a60d8` gesichert. Sie re-exportiert additiv nur
`isLocalReadingStateV1` und `LocalReadingStateV1` aus der bestehenden
Contractquelle; Schema, Semantik, Dependencies und Clients blieben dabei
unveraendert. Der Backend/Data-Agent ist beendet.

Der frische Frontend-Agent nutzte diese Bruecke, vollendete Mobile und Website
und sicherte den Produktkandidaten `0f51885` sowie Implementierungsevidenz und
Handoff `962ae9e`. Bestaetigt sind Format, Lint, 17 Boundarytests, alle
Workspace-Typechecks, 117 Unit-/Contract-/Komponententests, beide Builds und
der vollstaendige Browserlauf mit 55 PASS, 127 erwarteten Skips und null
Fehlern. Der Frontend-Agent ist beendet. Als naechstes darf genau ein
`visual_accessibility_reviewer` den unveraenderten Produktkandidaten pruefen
und nur G3-011-QA-Evidenz sowie seinen Handoff schreiben. Bei Finding wird
gestoppt; technisches GREEN ersetzt weiterhin keine sichtbare
Product-Owner-Abnahme.

Die unabhaengige QA ist im Evidenzcheckpoint `68fcb13` RED abgeschlossen.
High `WRN-G3-011-H-001`: Ein gueltiger gespeicherter Feedartikel wie
`wrn-test-art-cedar` wird in App und Website wegen der nur auf die
G3-008-Lifecyclefixture begrenzten Clientbindung als `unknown` behandelt.
Dadurch fehlt in `Gespeichert` der Reader-Ausloeser und der Fortschrittsfluss
ist fuer diesen aktiven Artikel unbenutzbar. Der unveraenderte Kandidat bleibt
statisch/regressiv GREEN mit 117 Unit-/Contract-/Komponententests,
17 Boundarytests, beiden Builds sowie 55 Browser-PASS, 127 erwarteten Skips
und null Browserfehlern; diese Ergebnisse schliessen den semantischen High
nicht. Die QA schrieb nur 12 Screenshots, Runtime-Matrix, Bericht und Handoff
und ist beendet. Kein Mitarbeiter darf den Produktcode korrigieren oder die
Restmatrix fortsetzen, bevor der Product Owner den eng begrenzten Fix sichtbar
freigibt. Danach ist eine vollstaendige frische Re-QA erforderlich.

Der Product Owner erteilte am 26. August 2026 exakt
`G3-011 H-001 BEHEBEN`. PO-055 erlaubt ausschliesslich die Korrektur der
Lifecycle-/Content-ID-Bindung in beiden Clients: Die bereits validierten
aktiven Feed-/Reader-IDs muessen zusammen mit der G3-008-Lifecyclemenge als
aktive lokale Inhalte aufloesbar sein. Gone, Revoked und syntaktisch sichere
Unknown-IDs bleiben weiterhin fail-closed, payloadfrei und entfernbar. Erlaubt
sind nur die betroffenen Mobile-/Website-Projektionen, eng zugehoerige Client-
und E2E-Regressionstests, H-001-Implementierungsevidenz und Handoff. Vertrag,
Domain, Fixtures, Storageformat, Dependencies, Rootkonfiguration, Styling,
allgemeines Redesign, Alt-/Liveprojekte und externe Aktionen bleiben
unveraendert. Nach gesichertem Korrekturkandidaten wird der Frontend-Agent
beendet; erst danach wiederholt ein frischer unabhaengiger
`visual_accessibility_reviewer` die gesamte G3-011-Matrix. Technisches GREEN
ersetzt keine sichtbare Product-Owner-Abnahme.

Der Product Owner verlangte anschliessend ausdruecklich, dass ein Kontrolleur
einmal alles kontrolliert. PO-056 fuegt nach dem korrigierten Kandidaten und
der vollstaendigen unabhaengigen G3-011-Re-QA ein weiteres sequenzielles,
read-only Gesamtgate hinzu: genau ein `independent_architecture_reviewer`
prueft den gesamten lokalen Zielprojektstand G3-001 bis G3-011 auf
Architektur- und Vertragsgrenzen, Security/Privacy, Datenminimierung,
Kosten-/Providergrenzen, Test- und Evidenzvollstaendigkeit, Scopeabweichungen
und offene Release-/Migrationsrisiken. Er darf keinen Produkt-, Test- oder
Governancecode veraendern und keine externe Aktion ausfuehren. Findings werden
dem Main Agent und Product Owner vor jeder G3-011-Abnahme vorgelegt. Dieses
Gesamtgate startet erst nach GREEN-Re-QA; parallele Reviews sind verboten.

Der PO-055-Frontend-Agent sicherte den korrigierten Produktkandidaten
`67ffc39` und den Evidence-/Handoffcheckpoint `853be13` und ist beendet. Die
Clientprojektionen kombinieren nun nur die bereits validierte Ready-Feed-
ID-Menge mit der bestehenden G3-008-Lifecyclemenge; Lesestatus allein kann
keinen Inhalt aktivieren, Gone/Revoked/Unknown bleiben fail-closed. Bestaetigt
sind Format, Lint, 17 Boundarytests, alle Workspace-Typechecks, 119 Unit-/
Contract-/Komponententests, beide Builds und der volle Browserlauf mit
57 PASS, 132 erwarteten Skips und null Fehlern. Diese Implementierungsevidenz
ist keine unabhaengige Freigabe. Als naechstes darf genau ein frischer
`visual_accessibility_reviewer` den unveraenderten Kandidaten mit der gesamten
G3-011-Matrix pruefen. PO-056 startet erst nach einem GREEN-Re-QA-Handoff.

Die frische unabhaengige Re-QA ist im Evidenzcheckpoint `ab41b91` YELLOW
abgeschlossen und der Agent beendet. H-001 ist fuer App und Website mit
Cedar-Titel, Readertrigger, 50-Prozent-Fortschritt und Reload geschlossen.
Offen ist Medium `WRN-G3-011-M-002`: Der Lesedaten-Loeschdialog fokussiert
beim Oeffnen korrekt `Abbrechen`, schliesst aber in beiden Clients weder in
Dunkel noch Pink mit Escape. Der sichtbare Abbrechen-Workaround bleibt
bedienbar, Akzeptanzkriterium 10 ist dennoch verletzt. Belegt sind 64 PNGs,
sechs Runtime-Matrizen, Format, Lint, 17 Boundarytests, alle Typechecks,
119 Unit-/Contract-/Komponententests, beide Builds sowie 57 Browser-PASS,
132 erwartete Skips und null Fehler. Keine Produktdatei wurde durch QA
geaendert. Ohne sichtbaren, eng begrenzten Korrekturbefehl darf kein Agent
M-002 beheben oder PO-056 starten; nach einem Fix ist erneut unabhaengig zu
pruefen.

Der Product Owner erteilte am 26. August 2026 exakt
`G3-011 M-002 BEHEBEN`. PO-057 erlaubt ausschliesslich den Escape-/Fokusvertrag
der bereits vorhandenen `ReadingClearConfirmation`-Dialoge in App und Website
sowie eng zugehoerige Client-/E2E-Regressionen, M-002-Evidenz und Handoff. Bei
Escape schliesst der Dialog ohne Loeschung und gibt den Fokus deterministisch
an den ausloesenden Button zurueck; Bestaetigen und sichtbares Abbrechen
behalten ihre bestehende Semantik. Styling, Texte, sonstige UI, Lesestatus-
Domain, Storage, Verträge, Fixtures, Dependencies, Rootkonfiguration,
Alt-/Liveprojekte und externe Aktionen bleiben unveraendert. Nach gesichertem
Kandidaten wird der Frontend-Agent beendet; danach prueft ein frischer
unabhaengiger Re-QA-Agent mindestens den gesamten Dialog-/Keyboardfluss und
die volle Regression. Nur bei GREEN startet PO-056.

Der PO-057-Frontend-Agent sicherte den korrigierten Produktkandidaten
`b619533` und den Evidence-/Handoffcheckpoint `70a69ef` und ist beendet.
Escape und sichtbares Abbrechen schliessen nun ohne Lesedatenmutation und
geben den Fokus an den Ausloeser zurueck; Bestaetigen behaelt die bestehende
Loeschsemantik. Implementierungschecks: Format, Lint, 17 Boundarytests, alle
Typechecks, 119 Unit-/Contract-/Komponententests, beide Builds sowie der volle
Browserlauf mit 59 PASS, 137 erwarteten Skips und null Fehlern. Diese Evidenz
ist keine unabhaengige Freigabe. Als naechstes darf genau ein frischer
`visual_accessibility_reviewer` den unveraenderten Kandidaten mindestens fuer
den gesamten Dialog-/Keyboardfluss und die volle G3-011-Regression pruefen.
PO-056 startet nur nach einem GREEN-Handoff.

Die frische unabhaengige M-002-Re-QA ist im Checkpoint `657a00e` GREEN
abgeschlossen und der Agent beendet. Es bestehen null offene Blocker, Highs,
Mediums oder Lows. Bestaetigt sind Format, Lint, 17 Boundarytests, alle
Typechecks, 119 Unit-/Contract-/Komponententests, beide Builds, 59 Browser-
PASS bei 137 erwarteten Skips und null Fehlern sowie 20 frische Runtime-
Observations und 12 Screenshots fuer App/Website in Dunkel/Pink. Escape,
Abbrechen, Bestaetigen, Fokusrueckgabe, H-001, Lifecycle, Storageblockade,
Axe, Overflow, Touchziele, Konsole, Requests, Cookies, Cache, Service Worker
und IndexedDB sind GREEN. Technisches GREEN ist keine Product-Owner-Abnahme.
Als naechstes darf ausschliesslich genau ein
`independent_architecture_reviewer` PO-056 read-only ueber den gesamten lokalen
Zielprojektstand G3-001 bis G3-011 ausfuehren. Er darf keine Dateien
veraendern ausser seinem Bericht und Handoff und keine Findings korrigieren.

Der unabhaengige PO-056-Gesamtcontroller schloss seinen read-only Review im
Checkpoint `0bfc9e3` mit **RED / FAIL** ab und ist beendet. Offen sind ein
Blocker und ein Low: `WRN-G3-011-B-003` belegt, dass beide Clients einen
unbekannten neueren Lesestatus nach dem Reload zwar zunaechst bytegleich
erhalten, ihn bei der naechsten normalen Saved-/Read-/Progress-Aktion jedoch
durch ein V1-Dokument ueberschreiben. Das verletzt den in ADR-007 und diesem
Task gebundenen sicheren Rollbackvertrag und ist ein Datenverlustpfad.
`WRN-GOV-L-004` bezeichnet drei veraltete sekundaere Statuszeilen in
Zielarchitektur, Paritaetsmatrix und Risikoregister; die autoritativen
Statusregister bleiben eindeutig. Alle technischen Regressionen waren
ansonsten GREEN: exakte Toolchain, 123 Tests, 17 Boundarytests, beide Builds
und 59 Browser-PASS bei 137 erwarteten Skips und null Fehlern. Keine
Produktdatei und kein externes System wurde durch den Controller veraendert.
Ohne sichtbares Korrekturgate darf kein Agent B-003 oder L-004 beheben;
G3-011 darf noch nicht visuell abgenommen werden. Nach einem korrigierten
Kandidaten sind vollstaendige unabhaengige Re-QA und ein erneuter read-only
PO-056-Gesamtcheck erforderlich.

Der Product Owner erteilte am 26. August 2026 exakt
`G3-011 B-003 UND GOV-L-004 BEHEBEN`. PO-058 erlaubt ausschliesslich den
Rollback-Datenverlustschutz beider clientlokaler Reading-State-Adapter und
Projektionen sowie die drei vom Controller exakt benannten sekundaeren
Statuskorrekturen. Unbekannte neuere, ungueltige oder nicht lesbare Rohwerte
muessen bytegleich unangetastet bleiben; der Client zeigt einen ehrlichen
Nur-Lese-Schutzmodus und sperrt jede automatische oder nutzergesteuerte
Saved-/Read-/Progress-/Clear-Mutation. Ein stiller Reset ist verboten. Der
Frontend-/Datenvertrag wird durch Komponenten- und Browserregressionen fuer
V2, defektes JSON, Reload und normale Aktionen belegt. Styling, sonstige UI,
Domain-/Contentschemas, Fixtures, Dependencies, Rootkonfiguration,
Alt-/Liveprojekte und externe Aktionen bleiben unveraendert. Zuerst arbeitet
genau ein `backend_data_reliability_engineer`; nach gesichertem Kandidaten und
Handoff wird er beendet. Danach aktualisiert der Main Agent nur die drei
freigegebenen Statuszeilen. Erst anschliessend prueft ein frischer
unabhaengiger QA-Agent die volle G3-011-Matrix; bei GREEN wiederholt ein
frischer `independent_architecture_reviewer` PO-056 read-only. Technisches
GREEN ersetzt keine sichtbare Product-Owner-Abnahme.

Der PO-058-Backend/Data-Agent sicherte den korrigierten Produktkandidaten
`d19ce4d` und den Evidence-/Handoffcheckpoint `e38696d` und ist beendet.
Fehlende oder gueltige V1-Daten bleiben schreibbar; unbekannte neuere,
ungueltige, defekte oder nicht lesbare Werte wechseln in einen ehrlichen
Nur-Lese-Schutzmodus. Der Rohwert bleibt unangetastet, automatische
Reconciliation und alle sichtbaren Saved-/Read-/Progress-/Clear-Aktionen sind
gesperrt. Implementierungschecks: Format, Lint, alle Typechecks,
17 Boundarytests, 127 Unit-/Contract-/Komponententests, beide Builds und der
volle Browserlauf mit 61 PASS, 142 erwarteten Skips und null Fehlern. Der Main
Agent aktualisierte danach ausschliesslich die drei durch `WRN-GOV-L-004`
benannten sekundaeren Statuszeilen. Als naechstes prueft genau ein frischer
`visual_accessibility_reviewer` den unveraenderten Kandidaten mit der gesamten
G3-011-Matrix einschliesslich bytegleichem V2-/Malformed-Schutz. Erst bei
GREEN darf ein frischer `independent_architecture_reviewer` PO-056 read-only
wiederholen. Keine Product-Owner-Abnahme wird vorweggenommen.

Die frische unabhaengige PO-058-Re-QA ist im Checkpoint `f1ebf70` GREEN
abgeschlossen und der Agent beendet. Es bestehen null offene Blocker, Highs,
Mediums oder Lows. Fuer Mobile und Website sind fehlendes/gueltiges V1,
unbekanntes V2, ungueltiges Schema, defektes JSON und `getItem`-Fehler
unabhaengig geprueft. V2 und defektes JSON bleiben vor/nach Reload und allen
Saved-/Read-/Progress-/Clear-Versuchen bytegleich; Schutzmodus, semantisch
deaktivierte Aktionen und ausbleibende automatische Reconciliation sind
bestaetigt. Format, Lint, Typechecks, 17 Boundarytests, 127 Tests, beide
Builds und 61 Browser-PASS bei 142 erwarteten Skips und null Fehlern sind
GREEN; 41 neue visuelle Belege decken die relevante Matrix ab. Node 24.16
statt der gebundenen 24.19 bleibt eine bekannte lokale Toolchainabweichung und
kein Produktfinding. Als naechstes darf genau ein frischer
`independent_architecture_reviewer` PO-056 erneut ueber den gesamten lokalen
Stand G3-001 bis G3-011 pruefen. Er darf nur einen neuen Recheckbericht und
Handoff schreiben, nichts korrigieren und keine externe Aktion ausfuehren.

Der erneute PO-056-Gesamtcontroller schloss im Checkpoint `1b344b6` mit
0 Blockern, 0 Highs, 0 Mediums und einem Low. Er bestaetigte B-003 mit exakter
Node-24.19-/pnpm-11.19-Toolchain, 127 Tests, 17 Boundarytests, beiden Builds
und 61 Browser-PASS/142 erwarteten Skips/null Fehlern eigenstaendig als
geschlossen. Offen blieb nur `WRN-GOV-L-004`, weil die drei sekundaeren
Register korrekt den damaligen Vor-Re-QA-Stand nannten, nach `f1ebf70` aber
erneut veraltet waren. Innerhalb des bereits sichtbaren PO-058-Auftrags
formulierte der Main Agent genau diese drei Register dauerhaft: Sie binden den
stabilen Kandidaten-/Re-QA-Beleg und verweisen fuer wechselnde Task-/
Abnahmegates ausschliesslich auf Source-of-Truth und Project State. Produkt,
Tests und Architektursemantik blieben unveraendert. Als naechstes ist nur ein
unabhaengiger read-only Registerabgleich zulaessig; er darf einen neuen
Closurebericht und Handoff schreiben, nichts korrigieren und keine externe
Aktion ausfuehren.

Der unabhaengige read-only Registerabschluss `695b1c0` bestaetigt die
dauerhafte GOV-L-004-Korrektur mit null Blockern, Highs, Mediums oder Lows.
Feature-Paritaetsmatrix, Zielarchitektur und Risikoregister binden stabil den
Produktkandidaten `d19ce4d` und die GREEN-Re-QA `f1ebf70`; wechselnde
Prozessgates werden nur noch in Source-of-Truth und Project State gepflegt.
Der Vergleich seit dem vollen Recheck enthaelt ausschliesslich Governance-,
Status- und Taskdokumente, keinen Produkt-, Test-, Package-, Fixture-, Tool-
oder Rootconfigdiff. B-003 war bereits im exakten Vollrecheck `1b344b6`
technisch geschlossen. Damit ist G3-011 technisch GREEN und kann dem Product
Owner zur sichtbaren Entscheidung vorgelegt werden. Kein Mitarbeiter ist
aktiv. Diese technische Freigabe erlaubt weiterhin weder echte Daten noch
Android, Remote/CI, Deployment, Signierung, Upload oder Veroeffentlichung.

Neue Headerfunktionen, weitere Assets, echte Inhalte, Android, Remote/CI,
Cloudflare, Hostinger, Deployment, Signierung, Upload und Veroeffentlichung
bleiben ausserhalb des schriftlichen Scope. Die aktuelle App und Website sowie
ihre Repositories bleiben strikt read-only. Die akzeptierten
G3-002-bis-G3-008-Funktionen duerfen nicht neu gestaltet oder funktional
veraendert werden. Technisches GREEN ersetzt keine sichtbare
Product-Owner-Abnahme.

Der Product Owner antwortete am 25. August 2026 mit `gerne weiterfahren`,
nachdem der Main Agent den exakten naechsten Schritt
`BEREITE WRN-G3-008 VOR` und dessen reine Dokumentgrenze erklaert hatte.
PO-042 autorisiert deshalb ausschliesslich die Vorbereitung in
`docs/tasks/WRN-G3-008-ARCHIVE-LINK-LIFECYCLE.md`: lokale selbst erstellte
Lifecycle-Testfaelle fuer aktive, historische, aliasierte, gone, revoked,
unbekannte und ungueltige IDs, ein kleines Archiv unter `Mehr`, kanonische
Share-Ziele, getrennte App-/Website-Abnahmeplanung und lokale Tests. Der
Vorbereitungscheckpoint ist `23ad86f`.

Der Product Owner erteilte am 25. August 2026 exakt `START WRN-G3-008`.
Freigegeben ist nur der schriftliche Scope des Task Briefs. Die Arbeit erfolgt
strikt sequenziell: Backend/Data fuer Contract, lokale Fixture und reine
Aufloesungsdomain; nach gesichertem Handoff Frontend Brand fuer getrennte
App-/Website-Projektionen; danach unabhaengige QA. Echte Inhalte, die 935
Legacyseiten, produktive Redirects oder HTTP-410, Apache/Hostinger,
Cache-Purge/Offline, Android-Native-Share, Remote/CI, Deployment, Signierung,
Upload und Veroeffentlichung bleiben ausserhalb des G3-008-Scope.
Der Startcheckpoint ist `3d534b1`.

Der Contract-/Domain-/Fixture-Checkpoint `5d01d77` und der getrennte
App-/Website-Produktkandidat `9affac8` sind lokal gesichert. Die unabhaengige
QA `2ec52ff` bestaetigt 74 Unit-/Contract-/Komponententests, 16 Boundarytests,
beide Builds, den vollstaendigen Browserlauf und 16 zusaetzliche Lifecycle-/
Accessibility-/Runtimefaelle. Es bestehen null offene Blocker, Highs, Mediums
oder Lows.

Der Product Owner akzeptierte am 25. August 2026 mit exakt
`G3-008 VISUELL AKZEPTIERT` den lokalen Kandidaten `9affac8` und die
unabhaengige QA `2ec52ff`. G3-008 ist damit geschlossen. Seine anschliessende
Frage zum blauen Headerhintergrund ergab den separaten Medium-Befund
`WRN-BRAND-PARITY-M-001`: Die G3-008-Daten sind selbst erstellte lokale
Fixtures und die Assets stammen aus der richtigen aktuellen App-Quelle, aber
`app-background.webp` wurde im neuen Projekt entgegen der aktuellen
`News App 2`-Runtime direkt als Headerhintergrund verwendet. Ohne neues
Vorbereitungsgate wird dieser geerbte G3-003-Markenfehler nicht veraendert und
kein Folgefeature begonnen. Der G3-008-Abschluss-/Diagnosecheckpoint ist
`08d63bf`.

Der Product Owner erteilte am 24. August 2026 exakt
`BEREITE WRN-G3-007 VOR`. Freigegeben ist ausschliesslich die Vorbereitung in
`docs/tasks/WRN-G3-007-STABLE-ARTICLE-LINKS-SEO.md`: drei selbst erstellte
lokale Testartikel, stabile statische Websitepfade, ein deterministisches
Publikationsmanifest, Canonical/JSON-LD, Sitemap/Robots, lokale Tests und
visuelle Abnahmeplanung. Der Vorbereitungscheckpoint ist `8a395c3`.

Der Product Owner erteilte am 24. August 2026 exakt `START WRN-G3-007`.
Freigegeben ist nur der schriftliche Scope des Task Briefs. Die Arbeit erfolgt
strikt sequenziell: Backend/Data fuer Contract, lokale Publikationsfixture und
deterministischen Publisher; nach gesichertem Handoff Frontend Brand nur fuer
Website-Komposition/Buildintegration; danach unabhaengige QA. Die Mobile-App,
echte Inhalte, die 935 Legacyseiten, Archive, Redirects/Gone/Revocation,
Share, Apache/Hostinger, Service Worker, Android, Remote/CI, Deployment,
Signierung, Upload und Veroeffentlichung bleiben gesperrt.

Die drei freigegebenen Sequenzen sind beendet. Contract/Publisher wurde in
`a37aff3`, die Website-Komposition und Buildintegration in `053e816` gesichert.
Die erste unabhaengige QA dokumentierte in `38728a7` das Low
`WRN-G3-007-L-001` (automatischer gleichoriginiger Favicon-404). Der exakt
begrenzte Spark-Fix `5db27a5` setzt einen assetfreien `data:,`-Faviconverweis.
Die unabhaengige Re-QA `02a4e90` schliesst das Low mit 87 Unit-/Contract-/
Komponententests, 16 Boundarytests, beiden Builds, vier gezielten Browser-E2E
und einem echten Chrome-Requestsmoke. Es bestehen null offene Blocker, Highs,
Mediums oder Lows. Bis zur sichtbaren Product-Owner-Entscheidung wird weder
nachgebessert noch ein Folgefeature begonnen.

Der Product Owner akzeptierte am 25. August 2026 mit exakt
`G3-007 VISUELL AKZEPTIERT` den korrigierten Produktkandidaten `5db27a5` und
die GREEN-Re-QA `02a4e90`. Der Abnahmecheckpoint ist `fe9a848`.
WRN-G3-007 ist damit geschlossen. Diese Abnahme
startet keinen Folge-Slice und erteilt insbesondere keine Freigabe fuer echte
Inhalte, 935 Legacyseiten, Archive, Redirects/Gone/Revocation, Share,
Apache/Hostinger, Android, Remote/CI, Deployment, Signierung, Upload oder
Veroeffentlichung.

M-001 ist mit Langtextfixture `31b96b4` und H-002 mit dem mobilen
Reader-Seitenfluss im Kandidaten `6a4c64b` implementiert. Der
Implementierungsagent ist beendet. Die Re-QA hat die gesamte technische und
visuelle Matrix wiederholt, die alten RED-/YELLOW-Belege als Historie erhalten
und H-002/M-001 mit neuen commitgebundenen Messungen geschlossen.

Die frische unabhaengige Re-QA schloss H-002 und M-001 mit Evidenzcheckpoint
`6da7339`. Bestaetigt sind 76 Unit-/Contract-/Komponententests, 16
Boundarytests, beide Builds, 37 Browser-PASS bei 82 erwarteten Skips, 0
Browserfehler sowie null offene Blocker/High/Medium/Low. Reflow, echter
Langtext, Axe, Touchziele, Overflow, Storage, externe Requests und Konsole sind
GREEN. Bis zur anschliessend erteilten sichtbaren Product-Owner-Entscheidung
wurde weder nachgebessert noch ein Folgefeature begonnen.

Der Product Owner akzeptierte am 24. August 2026 mit exakt
`G3-006 VISUELL AKZEPTIERT` den korrigierten lokalen Readerkandidaten
`6a4c64b` und die GREEN-Re-QA `6da7339`. WRN-G3-006 ist damit geschlossen.
Diese Abnahme startet kein Folgefeature und gibt insbesondere keine echten
Inhalte, Archive, Sharefunktion, Persistenz, Uebersetzung, Landingpages/SEO,
Android-, Remote-, Deployment-, Signier- oder Veroeffentlichungsaktion frei.

`WRN-G3-002` ist technisch GREEN und wurde am 23. August 2026 vom Product
Owner visuell akzeptiert. Diese Abnahme bestaetigt die Produktrichtung des
lokalen Newsfeed-Slices, aber weder fehlende Funktionen noch finale Farb-,
Font-, Logo-, Navigations- oder Gesamtparitaet.

Der Product Owner erteilte am 23. August 2026 exakt `START WRN-G3-003`.
Freigegeben ist nur der schriftliche Scope in
`docs/tasks/WRN-G3-003-BRAND-DESIGN-FOUNDATION.md`: hoechstens drei dort
hashgebundene Markenoriginale, Assetmanifest, gemeinsame semantische Tokens,
getrennte Mobile-/Website-Markendarstellung, lokale Tests und visuelle Belege.
Ein Fontdownload bleibt trotz Taskstart gesperrt und braucht weiterhin das
separate sichtbare Gate `FONT-DOWNLOAD WRN-G3-003 FREIGEGEBEN`.

Der Kandidat `af2fd9920191` hat Format, Lint, Typen, 42
Unit-/Contracttests, 16 Boundarytests, beide Builds und 12 Browser-E2E-Tests
bestanden. Die unabhaengige QA meldet null offene Blocker, Highs, Mediums oder
Lows. Der Product Owner forderte danach genau drei sichtbare Korrekturen an:
einen kompakteren responsiven Websiteheader sowie in der App den Linktext
`Mehr zum Projekt` zur autoritativen Website und einen Spendenhinweis. Nur
dieser Amendment-Scope darf jetzt umgesetzt werden; weitere sichtbare
Aenderungen bleiben fuer spaeter offen.

Der korrigierte Kandidat `0a822398a888` hat den vollstaendigen Hauptcheck mit
43 Unit-/Contract- und 16 Boundarytests, beide Builds sowie 18 Browser-E2E-
Tests bestanden. Die unabhaengige PO-026-QA meldet null offene Blocker, Highs,
Mediums oder Lows. Bis zur Product-Owner-Entscheidung wird weder nachgebessert
noch ein Folgefeature begonnen.

Am 24. August 2026 akzeptierte der Product Owner mit
`G3-003 KORREKTUR 1 PASST` Header, Platzierung und Richtung, verlangte aber
eine letzte eng begrenzte Textkorrektur: In der App darf der Anbietername
`PayPal` nicht mehr sichtbar stehen. Der sichtbare Linktext lautet nur
`Unterstuetzen`; der Leaving-App-Hinweis nennt neutral eine externe
Zahlungsseite. Ziel-URL und Sicherheitsattribute bleiben unveraendert. Keine
andere Produkt- oder Layoutaenderung ist freigegeben.

Der PO-027-Produktkandidat
`f54a2993e1eca52b75c1af3ddefd48ca434716b1` setzt genau diese Copy-Korrektur
um. Der vollstaendige Hauptcheck mit 43 Unit-/Contract- und 16 Boundarytests,
beide Builds sowie 18 Browser-E2E-Tests sind bestanden. Die unabhaengige
visuelle QA meldet null offene Blocker, Highs, Mediums oder Lows und bestaetigt
`Unterstuetzen`, den neutralen Hinweis sowie kein sichtbares `PayPal` in Hell,
Dunkel und bei 200-Prozent-Reflow. Das ist keine automatische Freigabe eines
Folgefeatures, Fontdownloads, Deployments oder der gesamten G3-003-Markenbasis.

Der Product Owner akzeptierte am 24. August 2026 mit
`G3-003 VISUELL AKZEPTIERT – BEREITE WRN-G3-004 VOR` die sichtbare
G3-003-Markenrichtung und autorisierte ausschliesslich die dokumentarische
Vorbereitung des naechsten Navigations-Slices. `WRN-G3-004` darf erst nach
einem separaten sichtbaren Befehl `START WRN-G3-004` Produktcode aendern oder
Mitarbeiter starten. Bis dahin sind nur Task Brief, Paritaets-/Abnahmeplan,
Handoff und konsistente Projektstatusdokumente erlaubt.

Der Product Owner erteilte am 24. August 2026 exakt `START WRN-G3-004`.
Freigegeben ist nur der schriftliche Scope in
`docs/tasks/WRN-G3-004-NAVIGATION-SHELL.md`: gemeinsame stabile Ziel-IDs,
getrennte responsive App-/Website-Navigation, clientlokales History-/Fokus-
Verhalten, ehrliche seiteneffektfreie Zwischenzustaende, lokale Tests und
visuelle Belege. Suche, Filter, Reader, Personalisierung, gespeicherte Inhalte,
Medienfunktion, Live-/Remoteoperationen, Fontdownload, Android, Deployment,
Signierung und Veroeffentlichung bleiben gesperrt.

Der finale G3-004-Produktkandidat
`3d89fbc05c5349aed4f7caff11099d40b26febb2` hat Format, Lint, Typen, 51
Unit-/Contracttests, 16 Boundarytests, beide Builds und 30 Browser-E2E-Tests
bestanden. Die unabhaengige finale QA meldet null offene Blocker, Highs,
Mediums oder Lows. Sie bestaetigt die fuenf mobilen Bottom-Ziele, getrennte
responsive Websitegruppen, History/Fokus, 44-Pixel-Ziele, 800-Pixel-Header,
200-Prozent-Reflow und vollstaendige Markenwoerter. Der finale
Evidenzcheckpoint ist `febe7cd57f2c`.

Der Product Owner akzeptierte am 24. August 2026 mit
`G3-004 VISUELL AKZEPTIERT – TEMP-ORDNER LOESCHEN` die sichtbare Navigation
und Informationsarchitektur und gab ausschliesslich die Entfernung des
unversionierten `tools/__pycache__/` frei. Der Ordner wurde zielgeprueft und
vollstaendig entfernt. Die roten und gelben Zwischen-QA-Belege bleiben als
nachvollziehbare Historie erhalten.

Der WRN-G3-004-Produktscope ist damit geschlossen. Bis zu einem neuen Task
Brief und sichtbaren Gate darf kein weiterer Produktcode geaendert und kein
Folgefeature begonnen werden. Die G3-004-Abnahme ist insbesondere keine
Freigabe fuer Suche, Reader, Medienfunktionen, echte Daten, Android,
Remote/CI, Deployment, Signierung oder Veroeffentlichung.

Der Product Owner erteilte am 24. August 2026 exakt
`BEREITE WRN-G3-005 VOR`. Freigegeben ist ausschliesslich die dokumentarische
Vorbereitung in `docs/tasks/WRN-G3-005-DISCOVER-LOCAL-SEARCH-FILTERS.md`:
lokale Suche, die Facetten Region, Thema, Quelle, Originalsprache und Format,
ein separater hashgepruefter Discover-Index sowie Test-/Sichtabnahmeplan.
Noch wurde kein Produkt-/Testcode oder Fixture geaendert und kein Mitarbeiter
gestartet. Das einzige Implementierungsgate lautet `START WRN-G3-005`.

Bis zu diesem sichtbaren Startbefehl sind nur Task Brief, Paritaets-/Abnahmeplan,
Vorbereitungshandoff und konsistente Projektstatusdokumente erlaubt. Archive,
echte Daten, Uebersetzung, Reader, Spezialmodule, Persistenz, Android,
Remote/CI, Deployment, Signierung und Veroeffentlichung bleiben auch nach
einem spaeteren Start ausserhalb des schriftlichen G3-005-Scope.

Der Product Owner erteilte am 24. August 2026 exakt `START WRN-G3-005`.
Freigegeben ist nur der schriftliche Scope in
`docs/tasks/WRN-G3-005-DISCOVER-LOCAL-SEARCH-FILTERS.md`: separater
hashgepruefter lokaler Discover-Index, reine Such-/Filterdomain, getrennte
responsive App-/Website-Ansichten, lokale Tests und visuelle Evidenz. Es gilt
die dort festgelegte Sequenz aus hoechstens einem schreibenden
Implementierungsagenten und anschliessender unabhaengiger QA.

Der G3-005-Produktkandidat
`9a9a2216a4fa734596c0742f4c2eaf70d4a75fce` hat den vollstaendigen Hauptcheck
mit 61 Unit-/Contract-/Komponententests und 16 Boundarytests, beide Builds
sowie 32 ausgefuehrte Browser-E2E-Tests bestanden. Die unabhaengige QA hat
zusaetzlich 13 commitgebundene Screenshots fuer 320 bis 1920 Pixel,
Hell/Dunkel, Querformat und 200-Prozent-Reflow geprueft und meldet null offene
Blocker, Highs, Mediums oder Lows. QA-/Evidenzcheckpoint ist `a84c445`.

Der Product Owner fragte danach, weshalb Buttons in einzelnen dunklen
Kontaktbogenansichten groesser wirkten. Die Ursache waren unterschiedliche
Testbedingungen: ein Beleg verwendete absichtlich 200-Prozent-Reflow, ein
weiterer 844 x 390 Pixel Querformat. Mit seiner Rueckmeldung `ok ja das stimmt
demnach und du darfst weiter machen` autorisierte er die angekuendigte
ergaenzende Vergleichsevidenz, aber noch keine stillschweigende formale
G3-005-Sichtabnahme. Der lokale Zusatzcheckpoint `472088e` zeigt App hell und
dunkel bei identischen 390 x 844 Pixeln, 100 Prozent und gleichem Zustand. Der
maschinelle Vergleich von Suchfeld, Filtern und Bottom-Navigation meldet null
Geometrieabweichungen; Produktcode wurde nicht geaendert.

Der Product Owner akzeptierte am 24. August 2026 mit exakt
`G3-005 VISUELL AKZEPTIERT` den Produktkandidaten und die ergaenzende
Theme-Klarstellung. Der WRN-G3-005-Scope ist damit geschlossen. Es wird weder
nachgebessert noch ein Folgefeature automatisch begonnen. Diese Sichtabnahme
ist keine Freigabe fuer
echte Daten, Archive, Uebersetzung, Reader, Android, Remote/CI, Deployment,
Signierung oder Veroeffentlichung.

Der Product Owner erteilte danach am 24. August 2026 exakt
`BEREITE WRN-G3-006 VOR`. Freigegeben ist ausschliesslich die dokumentarische
Vorbereitung in `docs/tasks/WRN-G3-006-LOCAL-ARTICLE-READER.md`: ein separater
hashgebundener lokaler Readerdetailvertrag, eine reine Readerauflosung,
getrennte mobile und responsive Websiteansichten, lokale Routen sowie
Test-/Sichtabnahmeplan. Noch darf kein Produkt-/Testcode oder Fixture geaendert
und kein Mitarbeiter gestartet werden.

Der dokumentarische Vorbereitungscheckpoint ist
`8b7e292f91393a20251954265cd3419b36c73e5c`.

Das einzige Implementierungsgate lautet `START WRN-G3-006`. Auch nach einem
spaeteren Start bleiben echte Inhalte und Bilder, Archiv/Redirect/Revocation,
Landingpages/Canonical/Sitemap, Teilen, Speichern/Lesestatus, Uebersetzung,
Zusammenfassung, Podcast, Zine, Android, Remote/CI, Deployment, Signierung und
Veroeffentlichung ausserhalb dieses schriftlichen Reader-Scope.

Der Product Owner erteilte am 24. August 2026 exakt `START WRN-G3-006`.
Freigegeben ist ausschliesslich der schriftliche Scope in
`docs/tasks/WRN-G3-006-LOCAL-ARTICLE-READER.md`. Die Arbeit erfolgt strikt
sequenziell: zuerst Contract/Domain/Fixture, nach gesichertem Handoff die
getrennten Clientansichten und erst danach unabhaengige QA. Das fehlende
`:)` in einer sichtbaren Chatansicht ist weiterhin nur ein Auditsignal und
kein automatischer Rotations- oder Ersatzgrund.

Der Contract-/Domain-/Fixture-Checkpoint `678e6cf` und der erste
App-/Website-Produktkandidat `206a7e1` sind lokal gesichert. Hauptcheck, beide
Builds und der vollstaendige Browserlauf waren beim Implementierungshandoff
GREEN. Der Implementierungsagent wurde danach beendet; nur die unabhaengige
QA durfte Tests, Accessibility, Request-/Storagegrenzen und die verbindliche
Screenshotmatrix pruefen. Ihre damalige Freigabe ersetzte nicht die visuelle
Product-Owner-Abnahme.

Die unabhaengige QA bestaetigte 75 Unit-/Contract-/Komponententests, 16
Boundarytests, beide Builds und 36 Browser-PASS bei 76 erwarteten Skips.
Offen waren High `WRN-G3-006-H-002` und Medium `WRN-G3-006-M-001`. Bei App
390 x 844 und 200-Prozent-Reflow lassen Header und fixe Bottom-Navigation nur
73 Pixel Hauptbereich; der Reader ist praktisch unlesbar. Zusaetzlich ist
keiner der drei selbst erstellten Detailtexte lang genug fuer den geforderten
Scrolltest. Der RED-QA-Checkpoint ist `baa97f8`; der fruehere YELLOW-Beleg
`67fea9e` bleibt als Historie erhalten. Ohne sichtbare Product-Owner-
Entscheidung wird weder nachgebessert noch visuell freigegeben.

Der Product Owner erteilte danach am 24. August 2026 exakt
`G3-006 H-002 UND M-001 BEHEBEN`. Freigegeben sind nur zwei Korrekturen: ein
laengerer, weiterhin selbst erstellter Testartikel mit neuem kanonischem Hash
und eine reflowfaehige mobile App-Shell bei 390 x 844 und 200 Prozent. Die
Arbeit blieb strikt sequenziell: Contract/Fixture, dann Mobile-Frontend,
danach vollstaendige unabhaengige Re-QA. Websiteprodukt, echte Inhalte und alle
sonstigen Nicht-Ziele blieben unveraendert.

Die aktuelle Live-App und ihr Repository, die aktuelle Website und ihr
Repository, das Contentrepository sowie Cloudflare, Hostinger und Google Play
bleiben in jedem Fall read-only und unveraendert. Der abgeschlossene
WRN-G3-004-, WRN-G3-005-, WRN-G3-006- und WRN-G3-007-Scope darf ohne neue
sichtbare Product-Owner-Entscheidung nicht weitergeaendert werden. Fuer
WRN-G3-007 gelten der akzeptierte Kandidat `5db27a5` und die GREEN-Re-QA
`02a4e90`. WRN-G3-008 ist nur als Dokumentpaket `23ad86f` vorbereitet.
Datenbank, echte Dienste, Remote/CI, Deployment, Signierung, Upload und
Veroeffentlichung bleiben separate Gates.

Dependencydownload, Browserbinaries und externe Programme benoetigen weiterhin
eine eigene sichtbare Einzelgenehmigung. Jede Scopeausweitung braucht einen
neuen Task Brief und gegebenenfalls ein weiteres Product-Owner-Gate.

## 3. Verbindliche Quellen

Vor jeder Altanalyse zuerst `docs/01-SOURCE-OF-TRUTH.md` lesen.

- Massgebliche aktuelle App-Quelle:
  `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
- App-Gesamtstand: Commit
  `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Massgeblicher App-Runtime-Release: Commit
  `968c320adfe87d1e11e88f99f448a435d4242750`
- Massgebliche Website-Quelle:
  `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work`
- Website-Stand: Commit
  `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`

Aehnlich benannte historische Verzeichnisse sind keine automatische Quelle.
Bei widerspruechlichen Dokumenten gilt die juengere, explizite Uebergabe vom
21. August 2026; Widersprueche muessen im Bericht genannt werden.

## 4. Produktgrenzen

- Mobile App und Website gehoeren zur gleichen Marke und teilen spaeter
  Design-System, Domainmodelle und API-Vertraege.
- Sie bleiben getrennte Anwendungen mit getrennten Cache-, Test-, Deployment-
  und Rollbackketten.
- Website-spezifische SEO-, Apache-, Landingpage- und Desktoplogik darf nicht
  blind in die App kopiert werden.
- App-spezifische Android-, Capacitor-, Offline- und Update-Logik darf nicht
  blind in die Website kopiert werden.
- Das Content-/Datenrepository bleibt getrennt und wird nur ueber versionierte
  Vertraege angebunden.
- World Revolution Map und das historische Kartenspiel sind nicht Teil des
  ersten Implementierungsziels. Jetzt sind nur stabile IDs, Deep Links,
  Geo-/Zeitdatenvertraege und barrierefreie Alternativen zu planen.

## 5. Agenten- und Delegationsregeln

- Custom Agents unter `.codex/agents/` sind Mitarbeiterprofile, keine
  dauerhaft laufenden Prozesse.
- Kein Profil startet sich selbst.
- Delegation ist nur erlaubt, wenn der Product Owner sie direkt verlangt oder
  ein freigegebener Task Brief `Delegation: erlaubt` enthaelt.
- Seit PO-084 darf der Chief innerhalb der tatsaechlichen Runtime global bis
  zu drei Sub-Agenten zusaetzlich zum ausfuehrenden Main einsetzen, inklusive
  Fachleads, aller Nachkommen und wartender offener Instanzen ueber sichtbare
  Tasks hinweg. Der dritte Slot braucht einen dokumentierten unabhaengigen
  Scope. Hoechstens zwei Produktwriter arbeiten gleichzeitig; der dritte Slot
  bleibt fuer read-only Analyse, QA, Security, Dokumentation oder disjunkte
  Testevidenz. Engere Taskgrenzen bleiben vorrangig.
- Slots werden ausschliesslich durch den benannten Main/Chief reserviert.
  Ohne bestaetigte Reservierung kein Start; kein neuer Pool je Fachlead/Task.
- Weiterdelegation braucht ein ausdrueckliches Feld im freigegebenen Task
  Brief: maximal Main -> Fachlead -> Helfer; Helfer delegieren nicht.
  Vorhandene Frontend-/Backendprofile duerfen diese Leadrolle uebernehmen.
  Engere Taskregeln und sichtbare Startgates haben immer Vorrang.
- Fachleads schreiben nicht in Helferbereiche oder gemeinsam betroffene
  Vertraege. Integration erst nach beendeter Helferarbeit und gesichertem
  Handoff. QA/Security berichten unabhaengig direkt an Main/Chief.
- Ablauf, Register und Pilotmessung: `docs/10-AGENT-ORCHESTRATION.md`.
  Diese Organisationsregel startet keinen Pilot oder Produktslice und erteilt
  keine zusaetzlichen Produkt-, Live-, Kosten- oder Releasebefugnisse.
- Parallele Schreibarbeit am gleichen Verzeichnis oder Vertrag ist verboten.
- Schreibende Agenten erhalten einen engen Dateibereich und ein eigenes
  Arbeitspaket; spaeter nach Git-Freigabe bevorzugt einen eigenen Worktree.
- Jeder Sub-Agent liefert eine kurze Evidenzuebergabe mit gelesenen Quellen,
  geaenderten Dateien, ausgefuehrten Tests, offenen Fragen und Risiken.
- Jede Agentenuebergabe verwendet `docs/templates/AGENT-HANDOFF.md`, aktualisiert
  bei laengerer Arbeit einen Checkpoint unter `docs/handoffs/` und endet mit dem
  vorgeschriebenen `WRN-AGENT-STATUS` einschliesslich `END-CHECK: :)`.
- Das fehlende `:)` ist nur ein Hinweis auf eine moeglicherweise unvollstaendige
  Uebertragung (`YELLOW`), kein automatischer Beweis fuer Context Rot.
- `context_continuity_auditor` bewertet Kontextgesundheit read-only anhand von
  Task Brief, Source-of-Truth, Handoff, Git-Diff und Belegen. Er darf Agenten
  weder starten, stoppen noch loeschen.
- Reserve-Agenten werden nur bei ihrem dokumentierten Ausloeser aktiviert.
- Der Main Agent synthetisiert Ergebnisse und bleibt fuer die Gesamtentscheidung
  verantwortlich. Sub-Agenten duerfen keine Freigabe des Product Owners ersetzen.

### Agenten-Lebenszyklus und einfache Befehle

- `PAUSIEREN: <name>`: laufenden Einsatz unterbrechen; Profil und Belege bleiben.
- `FEUERN: <name>`: laufende Instanz stoppen beziehungsweise einen abgeschlossenen
  Sub-Agent-Thread schliessen, nachdem Uebergabe und Arbeitsstand gesichert sind.
  Das wiederverwendbare Profil unter `.codex/agents/` bleibt erhalten.
- `ERSETZEN: <alter-name> -> <neues-profil>`: alten Einsatz sichern und stoppen;
  frischen Nachfolger zuerst read-only aus Handoff und Task Brief orientieren.
- `PROFIL LOESCHEN: <name>`: das exakt benannte TOML-Mitarbeiterprofil entfernen.
  Dieser ausdrueckliche Befehl ist erforderlich; automatische Profilloeschung
  ist verboten. Git bleibt der Wiederherstellungsweg.

Der Product Owner hat den Main Agent autorisiert, eine aktive Sub-Agent-Instanz
bei `RED`, unkontrollierter Schreibkonkurrenz oder akuter Scopeverletzung sofort
zu stoppen, wenn der vorhandene Git-/Dateistand zuvor soweit sicher moeglich
gesichert wird. Der Main Agent meldet den Stopp und den Wiederherstellungsstand.
Ein Nachfolger startet nie allein wegen eines fehlenden Zeichens, sondern erst
nach dokumentierter Rotation gemaess `docs/08-CONTEXT-CONTINUITY.md`.

## 6. Modellrouting

- `gpt-5.6-sol`: Architektur, schwierige Ursachenanalyse, Security, kritische
  Migrationen und unabhaengige Releasegates.
- `gpt-5.6-terra`: regulaere Implementierung, Integration und umfangreiche
  Code-/Dateianalyse.
- `gpt-5.6-luna`: klare, wiederholbare Extraktion, Berichte, Testmatrizen und
  kostenguenstige Routineaufgaben.
- `gpt-5.3-codex-spark`: eng begrenzte textbasierte Codekartierung und kleine,
  exakt spezifizierte Aenderungen. Spark trifft keine Architektur-, Security-
  oder Releaseentscheidung allein.
- Gemini Advanced ist eine externe Zweitmeinung fuer Screenshots oder einen
  abgegrenzten Architekturreview. Ergebnisse werden nie ungeprueft uebernommen.

PO-085 verlangt die bewusste Mischung der Codexkontingente: Sol wird nicht
fuer Routinearbeit verbraucht, Terra traegt Produktion und QA, Luna uebernimmt
wo moeglich kostenguenstige read-only Inventare, Dokument-/Handoffabgleiche
und Kontinuitaet. Bei drei parallelen Slots soll der Chief deshalb bevorzugt
unterschiedliche Rollen/Modelle statt drei gleichartige teure Agenten
disponieren. Spark bleibt die erste Wahl fuer winzige mechanische Tasks, wenn
sein separates Kontingent verfuegbar ist; bei Limitfehler kein Retryloop.

Immer die niedrigste Modellstufe verwenden, die das definierte Risiko sicher
beherrscht. Fehlende Evidenz ist kein Grund, ein Ergebnis schoenzureden.

## 7. Arbeitsweise

Vor jeder Aenderung:

1. Product Charter, Source-of-Truth, Architekturgrenzen und Qualitaetsregeln lesen.
2. Einen Task Brief nach `docs/templates/TASK-BRIEF.md` anlegen oder bestaetigen.
3. Scope, erlaubte Dateien, Nicht-Ziele und Abnahmekriterien benennen.
4. Bestehenden Git-Status pruefen und fremde Aenderungen erhalten.

Bei Aenderungen:

- kleinste fachlich vollstaendige Aenderung bevorzugen;
- keine verdeckten globalen Nebenwirkungen;
- keine unversionierten API- oder Datenvertragsaenderungen;
- keine Duplikation gemeinsamer Domainregeln;
- keine generierten Artefakte als manuell gepflegte Quelle behandeln;
- keine Tests abschwaechen, Erwartungen blind anpassen oder Fehler ausblenden;
- keine Kommentare oder Dokumente mit unbewiesenen Produktionsbehauptungen.

Nach Aenderungen:

1. passende Tests und statische Pruefungen ausfuehren;
2. bei sichtbaren Funktionen die festgelegte Screenshotmatrix erzeugen;
3. Abweichungen und Konsolen-/Netzwerkfehler dokumentieren;
4. Diff auf ungewollte Dateien und Secrets pruefen;
5. Ergebnis in verstaendlicher Sprache mit Belegen uebergeben.
6. Bei Meilensteinen `docs/PROJECT-STATE.md` und den Task-Handoff aktualisieren.

## 8. Verbotene Aktionen ohne ausdrueckliche Einzelgenehmigung

- Dateien oder historische Arbeitsstaende loeschen oder verschieben
- Git-Historie umschreiben, Hard Reset oder Force Push
- Remote-Repositories erstellen, verbinden oder pushen
- Dependencies oder externe Programme installieren
- Wrangler-, Hostinger-, Firebase-, Supabase- oder sonstige Deployments
- Cloudflare-Secrets, Konfigurationen oder produktive Daten veraendern
- Keystores, Passwoerter, Tokens oder Secrets suchen, anzeigen oder kopieren
- AAB/APK signieren, Versionscode aendern oder Play-Console-Upload ausfuehren
- Website veroeffentlichen oder produktiven Cache umstellen
- kostenpflichtige API-Aufrufe ohne Budget- und Zweckfreigabe
- Mitarbeiterprofile, Handoffs oder Agentenbelege automatisch loeschen

## 9. Definition of Done

Eine Aufgabe ist nur abgeschlossen, wenn:

- alle Akzeptanzkriterien nachvollziehbar erfuellt sind;
- geforderte automatisierte Tests bestehen;
- visuelle Aenderungen mit Screenshots belegt sind;
- keine unerkannten Konsolen-, Netzwerk- oder Barrierefreiheitsfehler bleiben;
- Daten-, Datenschutz-, Offline- und Rollbackauswirkungen bewertet sind;
- geaenderte Dateien und Restrisiken aufgelistet sind;
- ein unabhaengiger Review stattgefunden hat, falls das Qualitaetsgate ihn fordert;
- der Product Owner bei visuellen oder produktrelevanten Aenderungen freigegeben hat.

Die vollstaendigen Gates stehen in `docs/04-QUALITY-RULES.md`.
