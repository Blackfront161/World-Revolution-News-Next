# WRN-V13: World Revolution Atlas als Android-Beta · 27.09.2026

Produktcommit `446c578b7be5fa0729132d560057c5ba58ae8cde`. Unter „Mehr“
öffnet die Android-App freiwillig eine Länderliste aus dem bereits
validierten lokalen WRN-Quellenverzeichnis und ein Quellen-Länder-Quiz.
Widerrufene, historische HTTP- und mehrdeutige Quellen werden nicht
aufgenommen; Namensduplikate im selben Land werden im Spiel entfernt.
Die lokale Vorschau zeigte **134 eindeutige Quellen in 28 Ländern**. Das
Quiz bietet vier verschiedene Länder, beantwortete Optionen werden rot
gefüllt; der Punktestand bleibt nur in der geöffneten Ansicht. Die neun
UI-Sprachen nutzen lokalisierte Texte, Titel und lokale Ländernamen. Es gibt
keinen Standortzugriff, kein Konto und keine externen Kartenkacheln.

Die alte öffentliche `World-Revolution-Map` wurde geprüft, aber wegen
externer Bibliotheken, Supabase-/Karten-/Bildabrufen und direkter
HTML-Popups nicht übernommen. [ADR-011](../../architecture/ADR-011-ATLAS-BETA.md)
bindet diese Beta und die künftige Kartenschicht getrennt. Eine
Website-Integration würde das harte 8-MiB-Offline-Shell-Limit
überschreiten und bleibt deshalb offen.

Fokussierte Prüfungen: mobile Unit-Suite **993/993 PASS** (einschließlich
Widerruf, Mehrdeutigkeit, Duplikat, Quiz und Lazy-Load), Workspace-
Typprüfung PASS, Prettier PASS, ESLint und Importgrenzen PASS, mobiler
Vite-Build PASS. Die Android-Releaseaufgabe `:app:bundleRelease` und
`lintVitalRelease` liefen mit lokalem SDK **offline PASS**. Die erste
Sandbox-Ausführung scheiterte an bestehenden Windows-SDK-ACLs; der
erfolgreiche Lauf nutzte nur prozesslokal einen Git-`safe.directory`-
Eintrag für den exakten Workspace. Weder globale Git-Einstellungen noch
Produktquellen wurden dafür geändert.

Das [Assetprüfergebnis](aab-verification.json)
band **108/108** `base/assets`-Dateien bytegenau an den frischen
[Receipt](receipt.json). Das
ignorierte lokale Bundle ist
`work/wrn-android-release-L683J3/WorldRevolutionNews-2.2.0-code27-atlas-unsigned.aab`,
9.662.460 Byte, SHA-256
`6407283937d1172364fcc66bf214444a062c25f5bed205146b48b3e1be8984de`.
`jarsigner -verify` bestätigte ausdrücklich **unsigniert**. Das frühere
signierte AAB enthält den Atlas nicht.
Die Paketdateien, der Receipt und das lokale AAB sind im
[Hashmanifest](hashmanifest.json) bezeichnet; das AAB selbst bleibt aus
dem öffentlichen Repository ausgeschlossen.
Zusätzlich wurde die aktualisierte Webansicht in die Android-Quellen
kopiert und eine lokale Debug-APK gebaut:
`apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`,
11.397.173 Byte, SHA-256
`428cbf3af64eb5b84b880afbe6c6525a3904b305be2c6598895089ed288bb3fe`.
Sie wurde noch nicht installiert.

Ein unabhängiger UI-Review fand zunächst einen englischen Titel im
deutschen Screenreader-Landmark. Der zweite Produktcommit lokalisierte
Titel und Landmark in allen neun Sprachen; derselbe Reviewer bestätigte
den Fund danach als geschlossen. Die schmale Browser-Vorschau unter
`http://127.0.0.1:43421/#more` zeigte Deutsch, Violett/Rot, Liste und
einen beantworteten Quizdurchlauf per Tastatur. Mauskoordinaten im
In-App-Browser trafen teils andere Navigationsziele; daraus folgt kein
belastbarer Touch-PASS. Native Installation, Upgrade mit erhaltenen
App-Daten, finale repräsentative Screenshots, exakte Signaturprüfung,
Play-Test, Website-Parität und vollständige finale RC-Matrix sind offen.
Der laufende Verzeichnis-Publisher muss noch mit eng begrenzten
Zugangsdaten aktiviert und im Betrieb geprüft werden. **Kein
Gesamt-Release-GREEN.**
