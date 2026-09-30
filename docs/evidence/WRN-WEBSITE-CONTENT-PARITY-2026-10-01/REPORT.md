# Website-Inhaltsprojektion: lokaler Kandidat

1. Oktober 2026, Asia/Singapore. **Lokale Funktionsprüfung PASS. Kein unabhängiges Abschluss-PASS, RC-PASS oder Live-PASS.**

Arbeitsbaum: `wrn-next-live-work`; Branch `codex/next-editorial-home-20260928`.
Ausgangscommit `fa8031dfe20cca77a189de12d9afceb4f2fe2f88`.
Der konkrete Kandidatencommit ist der Commit, der diesen Bericht und die gebundenen Dateien enthält. Das anschließend lokal vorbereitete `work/website-projection-release/READY.json` bindet diesen Commit, Website-/Hostingmanifest, Shell und Projektion. Keine Veröffentlichung ist erfolgt.

## Wirkung und Klassen

Die Startseite zeigt aktuelle erfasste Titel, Quelle, Datum, selbst formulierten Originalhinweis und Originallinks vor den bestehenden Lesestücken. Jede ungeprüfte Quelle trägt eine Link-only-Kennzeichnung. Ein Quellenprofil ist keine Einzelrechte- oder redaktionelle Artikelprüfung. Alle neun UI-Sprachen erklären Snapshot, Aktualisierungszustand, Ausschlüsse und Wiederverwendungsgrenzen. Die Zahl aktuell verfügbarer Links wird zusätzlich zur unveränderten Snapshotbilanz angezeigt; spätere Sperren dürfen die ursprüngliche Aufnahmebilanz nicht als verfügbare Menge erscheinen lassen.

| Klasse / Menge | Artikel | Quellen / Endpunkte |
| --- | ---: | ---: |
| Bestehende einzeln zugelassene Volltexte | 12 | 3 Profile: EFF, C4SS, Africa Is a Country |
| Neu importierte Volltexte / Medien | 0 | 0 |
| Aktuelle metadata/link-only-Aufnahme | 480 | 397 Registerendpunkte im Modus metadata-only |
| Davon ohne passenden Quellenpass | 476 | 391 Registerendpunkte ohne passenden Pass |
| Davon mit exakt passendem Quellenpass | 4 | 6 Registerendpunkte von 3 Profilen |
| Expliziter directory-only-Modus im vorliegenden Register | 0 | 0 |
| Ausgeschlossen aus aktuellem Eingang | 20 | 9 |
| Historische Metadaten zusätzlich zur aktuellen Aufnahme | 481 | 135 |
| Gesamtes Metadatenverzeichnis | 961 | 532 |
| Rohfeed / Rohregister | 500 | 406 |

Die Registereinträge sind **Endpunkte**, keine Behauptung über 406 verschiedene Herausgeber. Im Feed stehen 98 verschiedene aufgezeichnete Quellnamen. `parity-report.json` ordnet sämtliche Feedzeilen und sämtliche 406 Registerzeilen mit Recordhash, stabiler ID, Status, Restriktionen und Ausschlussgrund zu. Die vier derzeit passenden Feedlinks und die drei Volltext-Herausgeber sind unterschiedliche Mengen. Die aktuelle Projektion enthält außerdem 274 aufgenommene Zeilen mit ausstehender upstream-redaktioneller **Klassifikation**; diese Markierung wurde erhalten und niemals als Inhaltsprüfung interpretiert.

20 Feedausschlüsse: 9 unsichere HTTP-URLs, 7 Identitäts-/Textkonflikte, 3 fehlende Quellenzuordnungen, 1 zukünftiges Publikationsdatum. 9 Registerausschlüsse: HTTP. Keine unbegründete globale Verkleinerung auf die zwölf Volltexte.

## Gebundene Beobachtung

Öffentliche Dateien unter `https://blackfront161.github.io/Revolution-News-Data/` wurden lesend abgerufen und bytegleich mit dem unveränderlichen Datencommit `33509ace3d3b2f7f275ebc05fe3522a59d62964f` verglichen. Es wurde kein Datenrepository verändert.

| Zeitpunkt | UTC |
| --- | --- |
| Beobachtung | 2026-09-30T16:00:03.683Z |
| Feed veröffentlicht | 2026-09-30T13:37:39.989Z |
| Register erzeugt | 2026-09-30T13:32:08.425Z |
| Neuester aufgenommener Artikel | 2026-09-30T13:37:24.191Z |

| Bindung | SHA-256 |
| --- | --- |
| Rohfeed, 2.446.330 Bytes | `54c8e2e62bc11ad5c4c255904f600eac05372809d3927a38da6cd86a7253c639` |
| Feedstatus, 876 Bytes | `eb5bb840f0638680adfce902806c38ecbe8ab79967936c33269cf6808d7c8ad5` |
| Rohregister, 236.450 Bytes | `cdbae3d1cd82c5367e9623c99d1d30a7a04c1dc19fbc7095e9ab743fb4ef4956` |
| Kanonische historische Baseline | `1f017b98721e18a863635d8c4783889f6724aa3a46d4523e65ddb85b871258a1` |
| Quellenpass | `bcef5d2fa88ae4acfb0dce294d3d8245598308c99e992de735babcc8717556aa` |
| Quellenwiderrufe | `030aa883148b5378ac0821a7ddc0f48935178fe13058508439155423f83bb617` |
| Website-Verzeichnis, 1.923.594 Bytes | `72fea07011df07b18ea274524530a53bc6485b1b17f575c050d8e4857bbf71ff` |
| Paritätsbericht | `46b47f7eb005cd307fda40beae5d6a74bdac9c936e3045ca4382a390803c6b80` |

Directory-Pointersequenz `202609301530`. Shell `6f1b417dc3f50e73fe2ea12c76c789c99a8a6c80ba97478dcccdc50c3df9b758`, 8.364.668 Bytes, unveränderte Obergrenze 8.388.608 Bytes. Größter Website-JS-Chunk 418.517 Bytes, unveränderte Obergrenze 500.000 Bytes. Ein neuer Stand benötigt neue gebundene Beobachtungen und Prüfungen; nach 24 Stunden verhindern die Build-/Paketprüfungen eine als aktuell behandelte Wiederverwendung.

`admission-classes.json` macht die Klassenbilanz und `liveDeviationResolved:false` maschinenlesbar. Der Paketvorbereiter gleicht sie mit der tatsächlich gebauten Volltextrevision und dem hashgebundenen Projektionsbericht ab und schreibt dieselbe Bilanz in `READY.json`. Die abgeleitete Verzeichnisprojektion und der Website-Kandidat sind **noch nicht veröffentlicht**; die tatsächliche Live-Abweichung ist dadurch nicht behoben.

## Geschlossene Aufnahme-/Refresh-Befunde

Der erhaltene [unabhängige Zwischenbefund](../WRN-WEBSITE-PIPELINE-REVIEW-2026-10-01/REPORT.md) beschreibt einen früheren Arbeitsstand. Seine Produktbefunde wurden wie folgt bearbeitet; dies ersetzt keinen unabhängigen Abschlussreview:

1. Die Website verlangt eine explizite gebundene Policy `website-restricted-link-only-v1` und einen zulässigen Importmodus. `directory-only` bleibt ein Quellenverzeichnis und aktiviert keine Feedartikel. `metadata-only` erlaubt hier nur erfasste Metadaten/Originallinks. Bekannte Metadatenverbote sperren Artikel. Unbekannte/fehlende Policy aktiviert keinen Intake; unbekannte Modi können keinen gültigen Kandidaten produzieren. Keine Texte, Originalteaser, Bilder, Audios oder Logos werden durch den Feedimport zugelassen.
2. Der Laufzeitloader akzeptiert für Inhalte ausschließlich den Hash der geprüften Website-Projektion. Ein neuer generischer Verzeichnis-Pointer kann weder Titel hinzufügen noch die Aufnahmeentscheidungen umgehen. Seine vertragsgeprüften Widerrufe werden trotzdem restriktiv übernommen. Neue Inhalte brauchen einen neuen gebundenen Website-Kandidaten, keinen alleinigen Pointerwechsel.
3. Ein zentraler restriktiver Zustand bedient Startseite, zusätzliche Originallinks, Nachrichten-/Quellenroute und persönliche Verzeichnisansicht. Quellen-/Artikelwiderrufe werden kumulativ gespeichert, vor dem Rendern angewandt und nach Aktualisierung verteilt. Exakte Homepagezuordnung oder beobachtete Herkunft plus aufgezeichneter Name können sperren, aber keinen Quellenpass verleihen. Dies schützt auch historische Links ohne Homepage. Beschädigter/unerreichbarer Sperrspeicher oder fehlende sichere Schreibsynchronisierung sperrt die Verzeichnislinks.
4. Lokale Sperrspeicher werden sekündlich geprüft; Netzwerkprüfungen und Cachegültigkeit sind auf 60 Sekunden begrenzt. Fokus, Online-/Offlinewechsel und relevante Storageereignisse lösen erneute Prüfungen aus. Netzwerkfehler, ungebundene Revisionen und Offlinezustand bleiben ausdrücklich unbestätigte bzw. gespeicherte Stände. Die reale Publikationszeit und ein zusätzlicher 24-Stunden-Hinweis bleiben sichtbar.
5. Die zwölf Volltexte, ihre Produktionsrevision `wrn-production-news-2026-09-26-v8`, Einzelrechte, Artikel-/Archivwiderrufe und Lesezustandsverträge wurden nicht verändert. Die finale Vorschau wurde zusätzlich auf elf Home-Lesestückkarten und sechs aktuelle Links geprüft; die zwölfte Freigabe bleibt über das bestehende vollständige Discovery zugänglich.

## Vollständig ausgeführte Prüfungen dieses Pakets

Node 24.19.0, pnpm 11.19.0, Chrome über Playwright. Website-only; kein App-Server, App-Build, Androidlauf oder Datenupload.

| Prüfung | Ergebnis |
| --- | --- |
| Website-Unitpaket | 209/209 Vitest, 30 Dateien; 71/71 bestehende Node-Tests |
| Neue Projektions-/Beobachtungstests | 12/12 Node |
| Gezielte Runtime-Policy-/Sperrtests | 6/6 Vitest; zusätzlich 6 UI-/Loaderfälle |
| Bestehende Directory-Refresh-/Publisher-Verträge | 24/24 Node |
| Vollständige betroffene Produktionsreader- und Projektions-Browserdateien | 161/161 aktive Fälle, 3 planmäßig übersprungene Größenwiederholungen; 4 Website-Projekte |
| Zusätzliche Viewports | 320, 360, 390, 412, 600, 800, 844-Landscape, 1024, 1280, 1440, 1920; 200 % Schrift; 9 UI-Sprachen |
| Typprüfung und Produktionsbuild | PASS |
| Grenzen, Fixtureprovenienz, JS-Budget, Shellbudget, Diff-Whitespace | PASS |
| ESLint neue Projektions-/Directory-/Werkzeug-/Browserpfade und App-Integration | PASS |

Die Browserdateien prüfen zusätzlich zu positiven Ansichten tatsächliche Sperren nach Quellen-/Artikelwiderruf, Offline-Neustart, fremde Livehashes, Rückrollschutz, gespeicherte Texte, abgelaufene Pakete, Fokuswiederherstellung, Original-/Lizenzdialoge, Lesezustand, Übersetzungs-/Filterpfade und Axe-Barrierefreiheit. Frühere fehlgeschlagene Zwischenläufe wurden nicht als PASS gezählt. Kontrastfarbe, zu breites Verstecken von Statusmeldungen und das Raster bei 200 Prozent wurden korrigiert; der finale vollständige betroffene Lauf ist fehlerfrei.

Vier unveränderte ESLintfehler in zwei bestehenden Dateien sind nachweislich bereits im Ausgangscommit vorhanden: zwei `set-state-in-effect` in `WebsiteFollowingDirectory.tsx`, zwei `only-export-components` in `production-content-ui.tsx`. Sie wurden durch ESLint auf den mittels `git show` gelesenen Ausgangsdateien reproduziert. Keine Regel oder Testassertion wurde abgeschwächt. Dies ist **kein workspaceweiter Lint-PASS**.

Die vom beendeten Prüfchat vorbereiteten Website-only-Matrixdateien wurden gelesen und erhalten/integrationsfähig übernommen. Ihre projektweite Matrix (über 2.100 Fälle außerhalb des hier vollständigen betroffenen Pakets) wurde hier nicht als durchgeführt oder bestanden behauptet. Das Gesamt-RC bleibt beim Chief/Kontrollchat.

## Reproduktion und Paketgrenzen

Das JSON in `replay-config.json` bindet alle Eingänge und die Policy. Rohfeed/-register bleiben wegen der enthaltenen unzugelassenen Körper/Medien im ignorierten `work/website-parity-upstream/`, nicht im öffentlichen Paket oder Commit. Für Reproduktion fehlende Rohdateien lesend aus dem angegebenen unveränderlichen Datencommit beziehen, Hashes vergleichen und unter den dort genannten lokalen Pfaden ablegen. Die aktuelle öffentliche Veröffentlichung muss zusätzlich bytegleich sein; Drift/Netzwerkfehler/Trunkierung dürfen nicht still ersetzt werden.

```powershell
$env:PATH = 'C:\Users\patri\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
node tools/directory/website-content-projection.mjs docs/evidence/WRN-WEBSITE-CONTENT-PARITY-2026-10-01/replay-config.json work/new-local-projection
node tools/directory/check-website-content-projection.mjs
pnpm --filter @wrn/website test:projection
pnpm --filter @wrn/website test:unit
pnpm --filter @wrn/website typecheck
pnpm --filter @wrn/website build
pnpm --filter @wrn/website test:browser:projection
```

Die Beobachtungspipeline `observe-website-projection-inputs.mjs` ruft nur die bekannten öffentlichen Eingänge ab und prüft sie gegen einen konkret angegebenen Commit. Die Projektion wird in einem neuen Stagingverzeichnis vorbereitet, gehasht/geprüft und atomar lokal umbenannt. Bestehende Ausgänge bleiben geschützt.

`prepare-website-projection-candidate.mjs` vergleicht die tatsächlich gebaute JSON-Assetdatei mit dem geprüften Snapshot, erzeugt mit den bestehenden unveränderten Website-/Hostingpackagern die beiden gebundenen Pointer und validiert beide Paketabschlüsse. `READY.json` wird erst danach geschrieben. Öffentlich sind nur die geschlossene Hosting-Dateiliste und beide Pointer; Prüfbericht, Rohdaten, Replaykonfiguration, Git, Logs und Vorbereitungsbelege werden nicht mit ausgeliefert. Die bestehende Aktivierungsreihenfolge bleibt: Assets/Revisionen zuerst, beide `current.json` zuletzt; vorherige Serverdateien und Pointer für Rollback erhalten. Das ist eine lokale Vorbereitung, kein Nachweis atomaren Server-Rollouts.

## Offene Gates für den Kontrollchat

- Unabhängiger Abschlussreview dieser konkreten Änderungen und Commit-/Hashbindung. Der Writer nimmt sich nicht selbst unabhängig ab.
- Weitere Quellen- und Einzelaufnahmen vor jeder Volltext-/Teaser-/Bild-/Audio-/Logozulassung; 391 Registerendpunkte und 476 aktuelle Links bleiben ohne passenden Pass. Ein Livebetrieb neuer Inhaltsstände benötigt regelmäßig neu gebundene und geprüfte Kandidaten.
- Vollständige Gesamt-RC-Matrix und bekannte bestehende Lintbefunde im dafür zuständigen Paket.
- Der lokale bisherige Widerrufseingang ist nur eine geprüfte Datei, kein authentifizierter Beleg des zuletzt ausgelieferten Hosts. Vor Rollout tatsächliche letzte Host-Widerrufsdatei, beide alten Pointer und Serverbestand sichern und binden.
- Tatsächliche Apache-/CSP-/CORS-/Cacheheader, Live-Widerruf, Pointerkonsistenz und Rollback am Zielserver prüfen; separate ausdrückliche Deploymentfreigabe.

Keine App-/Android-/AAB-, Paket-/Service-/CI-, Data-Repository-, DNS-, Hostinger-, Upload-, Push- oder Deployänderung. Vorhandene fremde Vorschauen/WIP wurden erhalten. `SHA256-MANIFEST.json` enthält die finale lokale Beleg- und Dateibindung. Der Quellen-/Rechte-Audit ist für diese restriktive lokale Linkprojektion positiv; ungeklärte Körper-/Medienrechte bleiben ausdrücklich **INDETERMINATE**.
