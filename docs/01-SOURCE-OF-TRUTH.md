# Source-of-Truth-Register

Stand: 9. September 2026; historische Baselinewerte bleiben als solche erhalten.

Aktueller Head Chief ist seit dem ausdrücklichen PO-Auftrag vom 8. September
der Main im Task `01a08163-50a9-7d10-aa40-0f9e9cc1f3c3`.
Übernahmebasis: `e84d839`, erhaltener P3-A-R9-WIP. Maßgeblich für die laufende
Arbeit ist [der Chief-Auftrag](tasks/WRN-CHIEF-2026-09-08-CODE-PARITY-COMPLETION.md).

Dieses Register verhindert, dass aehnlich benannte Altordner, Buildkopien oder
historische Artefakte als aktuelle Quelle verwendet werden.

## 1. Neues Zielrepository

| Zweck | Wert |
|---|---|
| Lokaler Name | `Sauberes Wo Rev Ne` |
| Pfad | `C:\Users\patri\Documents\ChatGPT\Sauberes Wo Rev Ne` |
| Status | G3-016 bis G3-020 lokal akzeptiert; G3-020-Korrektur technisch GREEN mit enger Sichtprobe offen. G3-021 P2/P3-A und sichtbares P4-B einschließlich R1 unabhängig technisch GREEN (aaba48e); Headerfix310ebfa ebenfalls unabhängig GREEN. Lokale PO-Sichtprobe offen. Einzelbelege in PROJECT-STATE und G3-021-Register; kein Release-GREEN |
| Branch | `codex/g3-015-website-offline-shell`; Name ist historisch und bezeichnet nicht die aktuelle Phase |
| GitHub-Neubau | https://github.com/Blackfront161/World-Revolution-News-Next (privat, am20.09.2026 ausdrücklich beauftragt und erstellt) |
| Übertragung | Separater sauberer Quellsnapshot; lokales Vollarchiv bleibt erhalten. Kein Push der alten Live-App oder ihrer Dienste. SOURCE-SNAPSHOT.json bindet den übertragenen Quellcommit. |

Der sichtbare Task `WRN G2 – Zielarchitektur & ADRs` wurde vor der
G3-011-Abnahme erneut gelesen. Sein isolierter Worktree
`C:\Users\patri\.codex\worktrees\0a7b\Sauberes Wo Rev Ne` stand dabei auf
`f430f95` und enthaelt eine historische parallele G3-001-Foundation sowie
unversionierte Produktdateien. Er ist **keine** aktuellere Produktquelle;
daraus darf nichts automatisch kopiert, gemergt oder als fehlende
Zielarchitektur interpretiert werden. Fuer den aktuellen Stand bleiben dieses
Repository, `docs/PROJECT-STATE.md` und `docs/06-DECISION-LOG.md`
autoritativ.

Am 28. August 2026 lieferte derselbe Task fuer WRN-GOV-001 den isolierten
Organisationsdiff `04e349d..09d8964`. Nur dessen gepruefte Organisationshunks
werden gegen `662b29c` integriert. Der neuere Worktreetip aktualisiert die
historische Beobachtung, macht den Foundationzweig aber nicht zur aktuellen
Produktquelle. Integrationsbeleg: `docs/handoffs/WRN-GOV-001-chief-integration.md`.

## 2. Massgebliche App-Baseline

| Merkmal | Wert |
|---|---|
| Repository | `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current` |
| Remote | `https://github.com/Blackfront161/World-Revolution-News-App.git` |
| Branch | `main` |
| Gesamt-HEAD | `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0` |
| Runtime-Releasecommit | `968c320adfe87d1e11e88f99f448a435d4242750` |
| Version | `2.1.1` |
| Versionscode | `26` |
| Paket | `com.world.revolution` |
| Android SDK | min 24, target 36 |
| Status bei Uebergabe | sauber und mit `origin/main` synchron |

`968c320` enthaelt den sichtbaren Runtime-Stand. `2216ff3` ergaenzt den
hashgebundenen Signierer und Tests, ohne die sichtbare Runtime zu aendern.
Beide Commits und der gesamte App-Arbeitsbaum bleiben fuer die Migration
strikt read-only; Produktarbeit findet nur im neuen Zielrepository statt.

Fuer WRN-G3-009 ist die aktive Runtime-Rolle verbindlicher als der Dateiname:
`news-app-2.css` bindet den aktuellen `.next-header` an
`var(--chrome-strong)` und die grosse Solinaridao-Marke; `app-background.css`
verwendet `app-background.webp` als stark abgedunkelten Body-/Recoveryhintergrund.
Das Asset ist deshalb keine autoritative Headergrafik.

Die anschliessende read-only Themepruefung bindet eine weitere aktive
Runtimeeigenschaft: `index.html` bietet `dark`, `oled`, `soft`, `pink`,
`light`, `system` und `contrast`. In `news-app-2.css` verwenden `.brand img`
und `.brand .brand__subtitle::before` die Themevariablen `--cyan` und `--red`
fuer Schimmer beziehungsweise den maskierten zweifarbigen Schriftzug. Das
Pink-Theme setzt sie auf `#ff4fa3` und `#9b82ff`. Dies ist die verbindliche
Quelle fuer `WRN-BRAND-THEME-PARITY-M-002`; der Befund wurde danach in
G3-010 implementiert, unabhaengig geprueft und durch PO-051 visuell
akzeptiert.

## 3. App-Releasebelege

| Beleg | Wert |
|---|---|
| Signierter Kandidat | `C:\Users\patri\Documents\World Rev Ne\wrn-unsigned-output-a-968c320a-20260820-final-r3\WorldRevolutionNews-2.1.1-code26-968c320-signed.aab` |
| Signed SHA-256 | `A029951F803F7E428D21456D08C70324573CC87D1509B2DA114687980153552D` |
| Unsigned SHA-256 | `1FB816FB213ED78600FAE93170A08238E422C7D37E48DCADEF5D02C5B8FE587D` |
| Vergleichsbuild | byteidentisch laut Uebergabe |
| API-36-Gate | 9 Instrumentationstests und 5 Unit-Tests, alle bestanden |
| Upload | nicht ausgefuehrt |

Diese Artefakte werden nur als Baseline/Referenz verwendet. Ohne ausdruecklichen
Auftrag darf kein Agent signieren, hochladen oder die Dateien veraendern.

## 4. Massgebliche Website-Baseline

| Merkmal | Wert |
|---|---|
| Repository | `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work` |
| Remote | `https://github.com/Blackfront161/World-Revolution-News-Website.git` |
| Branch | `main` |
| HEAD | `9a59b17cc9b3a6a7b7541c2e64862af208d02ace` |
| Release | `r10n`, 20. August 2026 |
| Live-Domain | `https://solinaridao.com/` |
| Releasepaket | `wrn-web-portal-2026-08-20-r10n-package` |
| ZIP SHA-256 | `91fb096dffcf47200961f5e3925ff1aff41553aeb2204cb8f270a7006f21bfe3` |
| Status bei Uebergabe | sauber und mit `origin/main` synchron |

Website-spezifische Navigation, SEO, Apache-Regeln, Landingpages, Responsive-CSS
und Cacheversionen bleiben bei jeder Migration als eigene Produktanforderungen
erhalten.
Auch dieser Arbeitsbaum bleibt strikt read-only. Visuelle Referenzen duerfen
gelesen und verglichen, aber nicht dort veraendert oder zurueckgeschrieben
werden.

## 5. Content- und Datenquelle

| Zweck | Wert |
|---|---|
| Datenrepository | `https://github.com/Blackfront161/Revolution-News-Data` |
| Raw-Basis | `https://raw.githubusercontent.com/Blackfront161/Revolution-News-Data/main/` |
| Beispiele | `news.json`, `events.json`, `podcasts.json`, `generated-podcasts.json`, `library-feed.json`, `library-health.json` |
| G1-Beobachtungssnapshot | `acec88ef40814f70c1bb45001e397a6ca5872ed7`, beobachtet 21. August 2026 11:36:55 UTC |

Der exakte Datenstand, Schemata, Generatoren, Eigentuemerschaft und offene
Hotfixes muessen waehrend Phase 1 separat inventarisiert werden. `main` ist eine
bewegliche Produktionsquelle; der G1-Hash ist ein Analysebeleg und friert den
produktiven Feed nicht ein.

## 6. Bekannte nicht massgebliche Quellen

Nicht als aktuelle App-Quelle verwenden:

- `C:\Users\patri\Documents\World Rev Ne\revolution-news-app-2`
- `C:\Users\patri\Documents\World Rev Ne\revolution-news-app-2-help-candidate`
- Android-Build- und API-Testkopien
- Feed-/Daten-Hotfix-Worktrees
- temporaere Pytest- oder Dependencyordner
- beliebige AAB/APK-Dateien aus `Downloads`

Nicht als editierbare Website-Quelle verwenden:

- unveraenderliche Website-Paketordner und ZIPs
- aeltere `r10*`-Arbeitsstaende
- Hostinger-Rollbacks

Nichts davon ungeprueft loeschen. Historische Verzeichnisse koennen weiterhin
Belege oder Worktree-Verknuepfungen enthalten.

## 7. Bekannter Dokumentwiderspruch

Die Projektuebersicht vom 20. August 2026 bezeichnet noch
`revolution-news-app-2` als verbindlichen App-Arbeitsbereich. Die vollstaendige
Uebergabe vom 21. August 2026 ersetzt diese Aussage explizit durch
`wrn-github-app-current`. Fuer neue Analysen gilt die juengere Uebergabe.

## 8. Noch zu verifizieren

Read-only-Abgleich am 8. September 2026: Die GitHub-Commitabfrage bestätigt
weiterhin App `2216ff3` und Website `9a59b17` als jüngste Quellcommits. Der
Play-Eintrag nennt den 21. August 2026 als Update, zeigt aber keinen unabhängig
verifizierbaren installierten Versionscode. Das App-README bezeichnet Code 26
weiterhin als Kandidaten und Code 25 als früher bestätigte Verteilung. Dies
ist kein Beleg für den heutigen Play-Track; keine Gleichsetzung von Quellstand,
Website, GitHub-Pages-PWA und tatsächlich installierter Android-App.

Die laufende Website `https://solinaridao.com/` wurde gerendert gelesen:
`news-app-2.js?release=49-web16` entspricht dem Parameter der gebundenen lokalen
Websitequelle. Sie meldete erneut 404-Fallbacks für `video-feed.json`,
`library-feed.json` und `library-sources.json` auf Raw-GitHub und GitHub Pages.
Die Datenquelle bleibt beweglich; jüngster beobachteter Commit bei Abfrage war
`5f0e5660e1934851340ab64559dc10ecec81e2b0` vom 8. September 2026, 14:27:19 UTC.

- Hash und Git-Status jeder Baseline unmittelbar vor der eigentlichen Migration
- vollstaendige Featureliste anhand laufender App und Website
- genaue Cloudflare-Deployments, Bindings und Verantwortlichkeiten, nur lesend
- Content-Schemata und Generatorbesitz
- Live-Play-Trackstatus und Play-Console-Verarbeitung
- Lizenz- und Nutzungsrechte fuer Code, Inhalte, Fonts und Medien
