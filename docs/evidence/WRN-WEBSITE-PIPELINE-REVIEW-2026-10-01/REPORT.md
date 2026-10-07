# Website-Pipeline: unabhängiger Zwischenbefund

Stand: 1. Oktober 2026, Asia/Singapore. Status: **RED für die angefangene
Admission-/Refresh-Pipeline; kein Release- oder Live-PASS**.

Arbeitsbereich: `wrn-next-live-work`, Branch
`codex/next-editorial-home-20260928`, Remote
`https://github.com/Blackfront161/World-Revolution-News-Next.git`.
Die Produktdateien waren bereits bei Beginn dieses Chats verändert. Der Chat
„WRN Website – Inhaltsparität“ arbeitet gleichzeitig daran. Dieser Prüfchat
hat bisher keine dieser Produktdateien verändert und keine App-Dateien
bearbeitet, keine App-Server gestartet und nichts veröffentlicht.

## Ursache und gebundener Datenstand

Die Website trennt zwölf einzeln aufgenommene Volltexte von einem größeren
Verzeichnis mit Nachrichtenmetadaten und Originallinks. App-Feedumfang,
Metadatenverzeichnis und zugelassene Website-Volltexte sind verschiedene
Mengen und dürfen nicht als identische Admission dargestellt werden.

Die lokal vorliegenden, vom anderen Website-Chat erzeugten Eingänge nennen
Commit `33509ace3d3b2f7f275ebc05fe3522a59d62964f` des öffentlichen
WRN-Datenrepositories, Beobachtung `2026-09-30T16:00:03.683Z`.
Dieser Prüfchat hat deren Veröffentlichung oder heutigen Livezustand noch
nicht unabhängig abgerufen. Die Befunde beziehen sich auf die exakten
lokalen Eingänge und den beobachteten Arbeitsstand:

| Menge | Anzahl |
| --- | ---: |
| Feedzeilen | 500 |
| Quellnamen im Feed | 98 |
| Registereinträge | 406 |
| Im begonnenen Kandidaten übernommene Feedlinks | 480 |
| Ausgeschlossene Feedzeilen | 20 |
| Übernommene Feedlinks ohne passenden Quellenpass | 476 |
| Registerendpunkte mit passendem Quellenpass | 6 |
| Registerendpunkte ohne passenden Quellenpass | 391 |
| Ausgeschlossene Registerendpunkte | 9 |
| Verzeichnisartikel einschließlich historischer Beobachtungen | 961 |
| Verzeichnisendpunkte einschließlich historischer Beobachtungen | 532 |

Die zwölf Volltexte stammen weiterhin ausschließlich aus der bestehenden
Website-Produktionsrevision. Keine neuen Volltexte, Bilder oder Audios
wurden in diesem Prüfchat übernommen.

## Reproduzierte und codegebundene Befunde

1. **Importmodi werden ignoriert.** In
   `tools/directory/website-content-projection.mjs` entscheiden URL,
   Formvalidierung, Identitätskonflikte, Quellenzuordnung und Widerrufe über
   Feedaufnahme. `importMode` wird nicht ausgewertet. Ein rein lokaler
   Mutationsversuch setzte bei allen 406 Eingangsquellen
   `importMode="directory-only"`, berechnete den Registerhash neu und rief
   den echten Generator auf. Ergebnis: weiterhin **480** übernommene
   Feedartikel, darunter **274** mit ausstehender redaktioneller
   Klassifikation. Die Klassifikationsmarkierung ist kein Safety-Pass.
   Für jeden zugelassenen Modus müssen Metadatenrechte, Inhaltsziel und
   Prüfgrundlage gebunden sein; fehlende Felder dürfen keine automatische
   Feedfreigabe bedeuten.

2. **Live-Refresh umgeht die Kandidatenprüfung.**
   `apps/website/src/features/directory/directory-loader.ts` verwendet den
   gemeinsamen Verzeichnisloader. Dieser prüft Schema, Hash,
   Manifestbindung und Sequenz, aber keine Website-spezifischen Admission-
   oder Importentscheidungen. Ein neueres Dokument wird auch dann
   übernommen, wenn sein Hash von der gebundenen Website-Projektion
   abweicht; nur die Abdeckungsanzeige entfällt. Eine neue Revision braucht
   eine ebenso gebundene Prüfgrundlage und dieselbe Aufnahmepolicy.

3. **Spätere Quellenwiderrufe erreichen die neue Startseitenliste nicht.**
   `apps/website/src/features/projection/WebsiteCoverage.tsx` rendert die
   ersten sechs nicht historischen Artikel direkt aus `data.projection`.
   Diese Liste konsumiert weder den Quellenpass-Hook noch dessen späteren
   kumulativen Widerrufszustand. In der Verzeichnisroute wirkt der Hook auf
   Quellenpasskarten, aber nicht auf alle allgemeinen Quellen- und
   Nachrichtenlinks. Ein zentraler Website-Loader muss bekannte Widerrufe
   auf sämtliche Projektionen anwenden, einschließlich gespeicherter
   Zustände, vor dem Rendern und nach einer Aktualisierung.

4. **Aktualität und Fehlerzustand bleiben unvollständig.** Der Modulcache
   `verified` gilt ohne Ablauf bis zum nächsten Seitenstart. Die Anzeige
   nennt bei Feedfehlern innerhalb von 24 Stunden weder Fehler noch
   Offline-/Fallbackgrund. Bei einer akzeptierten anderen Live-Revision
   entfällt die gebundene Abdeckung und damit auch die Feedzeit-/Stale-
   Anzeige. Ein Snapshot muss unabhängig von seinem Alter als solcher
   erscheinen; Remote-Daten brauchen eigene geprüfte Feed-/Registerzeiten
   und eine begrenzte erneute Prüfung.

## Eigenes Arbeitsergebnis und Testgrenze

Dieser Chat ergänzt ausschließlich zwei disjunkte Testdateien:

- `tests/e2e/website-only-matrix.config.ts`
- `tests/e2e/website-only-matrix.setup.ts`

Die Konfiguration übernimmt alle bestehenden Spezifikationen und die vier
Website-Projekte. Das Setup startet nur Website-Server, eine explizite
Website-Fixture und den Website-Übersetzungsharness; App-Server und
App-Builds sind ausgeschlossen. Es nutzt den separat gebauten Website-
Produktionskandidaten. Temporäre Fixtureausgaben und Ergebnisse bleiben
unter dem ignorierten `test-results/`.

Mit gebündeltem Node **24.19.0**:

- ESLint der beiden neuen Testdateien: Exit 0.
- Prettier der beiden neuen Testdateien: bestanden.
- Playwright `--list`: **2120 Tests in 57 Dateien**, vier Website-Projekte.
- `git diff --check`: Exit 0 zum Prüfzeitpunkt.
- Vollständiger Matrixstart: **nicht ausgeführt**, Setup endet mit
  `EADDRINUSE` für `127.0.0.1:43178`, den parallel arbeitenden Chat. Es
  werden daraus keine bestandenen Browserfälle abgeleitet. Wiederholungen
  müssen nach Klärung des Schreib-/Testbesitzes erfolgen.

Reproduktionskommando nach Freigabe der Testports und Abschluss des
Produktionsbuilds:

```powershell
node node_modules/@playwright/test/cli.js test --config tests/e2e/website-only-matrix.config.ts
```

Die volle Website-Matrix, Rechte-/Admission-Korrekturen, produktive
CORS-/Cache-/Widerrufsprüfung und Deployment bleiben offen. Die neuen
Testdateien und dieses Dokument gehören nicht in ein Website-Releasepaket.
Vorhandene unversionierte Vorschauartefakte und fremde Änderungen wurden
erhalten. Es wurde kein Commit, Push oder Deployment durchgeführt.

## Zuständigkeit

`AGENTS.md` schreibt vor: „Kein Writer verändert fremde WIP-Pfade“.
Eine Frage an den Nutzer zur Koordination mit „WRN Website – Inhaltsparität“
ist offen. Bis zur Antwort bleibt dieser Chat unabhängiger Prüfer und
berührt dessen Produkt-WIP nicht. Ein vollständiger Auftragsabschluss wird
mit diesem Zwischenbefund ausdrücklich nicht behauptet.
