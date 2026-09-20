# Chief-Handoff: Releasegrundlagen

- Agent: `/root`, Head Chief.
- Task: `WRN-RELEASE-FOUNDATIONS-2026-09-10`; PO verlangt Fortsetzung.
- Basis: `8ee6fb5`; Importkandidat `34c490b`, native Quelle `a4c2c69`.
- Arbeitsverzeichnis: aktuelles Repository, historisch benannter Branch
  `codex/g3-015-website-offline-shell`; kein Remote eingerichtet.
- Kinder: keine. Androidwriter, Luna und unabhängige Terra-QA fertig.
  Keine Produktwriter/Browserrechte.

## Ergebnis und Quellen

Die16 direkten Pakettestimporte sind ohne Verlust der App-Artefaktbindung
behoben. Zusätzlich prüft die Standardsuite erstmals den tatsächlichen
Workspace. Neue Androidbasis erzeugt offline eine unsignierte APK; moderne
Backup-/Transferregeln bewahren die lokalen Datenschutzgrenzen. Ein eigener
read-only Prüfer bindet36 frische Webdateien an Kopie und APK. Quellen sind
Charter, Source-of-Truth, Architektur-/Qualitätsregeln, enger Taskbrief,
installiertes Capacitor8.5.0-Template und gebundene read-only Alt-App.
Für die Backupkorrektur zusätzlich die offizielle Androiddokumentation im
Chief-Integrationsbeleg. Keine Archive/Altquellen verändert.

## Änderungen und Abnahme

- TeilA:3 Testimportdateien,16 identische Paketfixtures,2 Prüftools und
 2 Root-Prüfscripts. Chief226Contract/32TestSupport/23Tools,2Typen/Statisch PASS;
 unabhängige Terra-QA GREEN,80 fokussierte Assertions und16 Bytepaare PASS.
- TeilB: neues `apps/mobile/android/`, Capacitoranzeigename, native
 Backupregeln/Regressionstests/README. Chief131Gradletasks,3JVM, vollerLint
 0Fehler/13Templatewarnungen, Mobilebuild/Typ/Statisch PASS. Unabhängige
 Terra-QA GREEN; ihr Prüfskript-LOW durch `e5b1010` korrigiert und in direkten
 PowerShell5.1-/7-Prozessen unabhängig geschlossen. Native Quelle unverändert.
- TeilC: Luna-read-only-Inventar2.000 Alttexte;1694 vollständig markiert,
 keine expliziten Rechtebelege im Export. Bestehender Readervertrag ist
 fixturegebunden; Produktionsvertrag/Builder ist konkrete nächste Arbeit.
- Belege: `docs/evidence/WRN-IMPORT-BOUNDARIES-2026-09-10.md`,
 `WRN-IMPORT-BOUNDARIES-QA-2026-09-10.md`,
 `WRN-ANDROID-INTEGRATION-2026-09-10.md`,
 `WRN-ANDROID-WEB-ASSETS-2026-09-10.json`,
 `WRN-REAL-CONTENT-INVENTORY-2026-09-10.md`.

## Risiken und nächste Arbeit

Kein signierter oder installierbarer Release Candidate: Geräte/Upgrade,
Launcher-/Splashmarke, native Shares/Back/Deep Links, aktuelle Inhalte mit
Offlinevolltext/Updatepfad und volle Websiteparität fehlen noch.13 Android-
Templatewarnungen, Mobilehauptchunk715.74kB und frühere Restarbeit bleiben
sichtbar. Keine unabhängige OEM-/Geräte-/Releaseabnahme erfinden.
Keine Installation, Signierung, Versionscodeerhöhung, Deployment oder Push.
Vorhandene untracked `.codex-remote-attachments/` und `.codex/environments/`
blieben unverändert. Keine historische Datei/Bildausgabe entfernt.

Routing: Terra für Android und unabhängige QA, Luna für Inventar, Root für
Importfix/Integration. Keine Sol-Routinearbeit oder Weiterdelegation.
Exakte Modellkosten unbekannt; keine unbelegte Einsparungszahl.

## WRN-AGENT-STATUS

- Status: TeilA und lokale native Foundation TeilB unabhängig GREEN.
- Erledigt: Import-/Prüfkettenfix, native Buildbasis und Inhaltsinventar.
- Offen: oben benannte Releasearbeit; keine aktuelle Releasefreigabe.
- Nächster Schritt: Produktionscontentvertrag mit
 belegtem Quellen-/Rechtestatus und deterministischem Releasebuilder.
- END-CHECK: :)
