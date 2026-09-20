# WRN Release Completion

- Auftrag: PO sagt am10.September nach vollständiger Release-Lückenliste
  ausdrücklich „dann mache das alles“. Basis `3e2d8dd`.
- Chief/Integration/zentraler Slotvergeber: `/root`.
- Delegation: erlaubt, maximal3 direkte Helfer; keine Weiterdelegation.
- Register: `docs/WRN-G3-021-DELEGATION-REGISTER.md`.
- Modellrouting: Sol nur kritischer Reader-/Migrationsentwurf und Release-
  Review, Terra Umsetzung/QA, Luna enge Inventare. Höchstens2 disjunkte Writer.

## Ergebnis und Reihenfolge

Alle sechs zuletzt dem PO genannten Pakete werden bearbeitet: reale News mit
Reader/Save/Updates; Quellen/Inhalte; Androidplattform/Marke; Geräte/Upgrade;
Websiteparität; finale Qualität/Releasepaket. Aufgaben bleiben bis zu ihrem
eigenen belegten Abschluss offen. Kein Endstand wird aus einem Teilbuild
abgeleitet; bekannte Lücken werden nicht als erledigt umetikettiert.

Quellen bleiben die in Source-of-Truth gebundenen App-/Websitebestände; nur
read-only Live-/GitHub-/Quellen-/Lizenzrecherche ist zusätzlich erlaubt.
Bestehende sichtbare Farben und angenommene elf Videoquellen bleiben bindend.
Map/Spiel/Konten/Kommentarcommunity gehören nicht zu diesem Releaseauftrag.

## Erste drei unabhängige Scopes

1. Slot1 Sol als read-only Vertrags-/Migrationsanalyst: aus konkretem Code
   kleinsten konsistenten Weg von Test-IDs/.invalid-Verträgen zu produktiven
   immutable Artikelrevisionen bestimmen. Reader, ReadingState, Manifest,
   Safetyledger, Offlineupdate und Websitegeneratoren vollständig berücksichtigen.
   Keine Tests abschwächen, keine IDs als Testdaten tarnen, keine neue parallele
   Readerimplementierung. Liefert begründeten engen Umsetzungsvertrag mit
   Dateiliste, Migration/Rollback und unterscheidenden Abnahmetests.
2. Slot2 vorhandener Terra `android_foundation`: read-only Inventar der
   gebundenen alten und neuen nativen Marke/Back/Share/DeepLink/PlayUpdate-
   Pfade; kleinste ohne Installation umsetzbare Brücken und vorhandene
   wiederverwendbare freigegebene Markenassets/Tests. Noch keine Produktwrites.
3. Slot3 Luna/explorer: read-only exakte Websiteparitätslücken gegenüber
   den bereits integrierten Mobilefachbereichen. Konkrete Komponenten,
   mobile Abhängigkeiten, shared extraction vs. Websiteadapter und enge Tests.
   Kein allgemeines erneut erzeugtes Projektinventar.

Alle Helfer melden bei konkretem Hindernis statt Retryloop; erste Übergabe
nach einem begrenzten Codepass. Jeder schreibt ausschließlich seinen eigenen
`docs/evidence/WRN-RELEASE-COMPLETION-<SCOPE>-2026-09-10.md` und
`docs/handoffs/WRN-RELEASE-COMPLETION-<SCOPE>-2026-09-10.md`, SCOPE ist
CONTENT-DESIGN, ANDROID-INVENTORY bzw. WEBSITE-INVENTORY. Luna darf alternativ
inline handoff liefern. Keine Kinder, Browser-/Gitindex-/Produktrechte.

Chief bearbeitet disjunkt reale Quellen-/Rechtebelege, eigene Berichte und
verbindliche Slice-Nachträge in diesem Brief. Produktpfade werden aus den
konkreten Ergebnissen sequenziell gebunden, bevor ein Writer startet.

## Abnahme für folgende Umsetzung

- Reale Artikel mit ehrlichen IDs/Quelle/Datum/Sprache, begrenzten sicheren
  Readerblöcken und nachvollziehbarem Volltextstatus; unbekannte Rechte lassen
  sichere Originalverweise bestehen. Deterministische lokale Releaseausgabe.
- Reader, Save/Position, Update/Widerruf/Rollback/Abbruch und Offline-Neustart
  mit echten zulässigen Daten geprüft; getrennte Client-Caches bleiben bestehen.
- Neue Androidbrücken bleiben eng berechtigt; keine unkontrollierten fremden
  Webnavigationen, Intent-/Dateifreigaben oder automatische Downloads.
- Mobile/Website-Sichtmatrix bei320/390px, RU200%, Desktop und drei relevanten
  Themes; alle neun UI-Sprachen. Frische Playwrightoutputverzeichnisse und
  dauerhaft gesicherte relevante Screenshots/Hashes.
- Passende Unit/Contract/Integration/Typ/Lint/Boundary/Build-Gates; unabhängige
  QA auf unveränderlichem Kandidaten, Sol nur bei kritischer Migration/Security.
- Endgültige MUST-Matrix und Releasegates mit tatsächlichen Gerätebelegen,
  Rollback, Commit-/Artefakthashes und nachvollziehbarer PO-Sichtprobe.

## Grenzen, Kosten und Rücknahme

Keine Neuinstallation, kostenpflichtige API, Secretsuche, Signierung,
Versionscodeanhebung oder externe Veröffentlichung aus diesem allgemeinen
Fortsetzungsauftrag ableiten. Erst die vollständig vorbereitete konkrete
Operation wird ggf. zur Einzelgenehmigung vorgelegt. Keine früheren
Arbeitsstände löschen/verschieben, keine fremden WIPs überschreiben.
Lokale Änderungen sind über getrennte Kandidaten rücknehmbar; Datenmigrationen
müssen alte Daten erhalten und einen geprüften Rückweg besitzen.
Keine weitere Inhaltskopie aus historischen Verzeichnissen ohne Provenienz.

Handoffs gemäß Vorlage mit Dateien/Tests/Fehlern/Restarbeit, END-CHECK: :).
