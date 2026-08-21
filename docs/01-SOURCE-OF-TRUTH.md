# Source-of-Truth-Register

Stand: 21. August 2026

Dieses Register verhindert, dass aehnlich benannte Altordner, Buildkopien oder
historische Artefakte als aktuelle Quelle verwendet werden.

## 1. Neues Zielrepository

| Zweck | Wert |
|---|---|
| Lokaler Name | `Sauberes Wo Rev Ne` |
| Pfad | `C:\Users\patri\Documents\ChatGPT\Sauberes Wo Rev Ne` |
| Status | Organisationsbasis, noch kein Produktcode |
| Branch | `main` |
| Remote | noch nicht eingerichtet |

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

## 5. Content- und Datenquelle

| Zweck | Wert |
|---|---|
| Datenrepository | `https://github.com/Blackfront161/Revolution-News-Data` |
| Raw-Basis | `https://raw.githubusercontent.com/Blackfront161/Revolution-News-Data/main/` |
| Beispiele | `news.json`, `events.json`, `podcasts.json`, `generated-podcasts.json`, `library-feed.json`, `library-health.json` |

Der exakte Datenstand, Schemata, Generatoren, Eigentuemerschaft und offene
Hotfixes muessen waehrend Phase 1 separat inventarisiert werden.

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

- Hash und Git-Status jeder Baseline unmittelbar vor der eigentlichen Migration
- vollstaendige Featureliste anhand laufender App und Website
- genaue Cloudflare-Deployments, Bindings und Verantwortlichkeiten, nur lesend
- Content-Schemata und Generatorbesitz
- Live-Play-Trackstatus und Play-Console-Verarbeitung
- Lizenz- und Nutzungsrechte fuer Code, Inhalte, Fonts und Medien
