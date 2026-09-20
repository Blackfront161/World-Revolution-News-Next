# RC3 – Nutzerfunktionen vollständig integrieren

PO-Gesamtauftrag und Prozesspräzisierung vom 12. September gelten. Keine
Architekturänderung, keine Migration vorhandener Content-/Lese-/Quellenstores.
Original G2: lokale explizite Personalisierung, „Seit deinem letzten Besuch“
und Auswahlerklärung ausschließlich unter „Für mich“, Revisionshinweise bei
gelesenen Artikeln sowie freiwillige lokale Benachrichtigungen mit Ruhezeiten.
Die vorhandene Auswahlerklärung8f8beb85 bleibt erhalten.

Writer: bestehende Terra /root/media_durable_writer, keine Kinder, kein Index.
Du bist nicht allein: Sol besitzt A7s acht Pfade und Testports43173–75.
Root besitzt RC-Matrix/Status/Quellen und die akzeptierten Vorschauen43194/95.
Keine konkurrierenden Writes; bestehende Änderungen nicht zurücksetzen.
Terra behält dieses Paket durch Findings und Testkorrekturen bis zum Abschluss.
Unabhängiger Abschluss durch getrennten Reviewer wegen lokaler Storage/Privacy.

Aktueller Besitz: Root übernimmt dasselbe Paket sequenziell nach vier
unvollständigen Terra-Checkpointturns. Terra hat alle Rechte zurück; die zwei
WIP-Dateien sind im ignorierten work/terra-checkpoint erhalten. Keine neue
Architektur-/Finding-/Freigaberunde. Root ist neben Sol/A7 der zweite Writer.

## Pfadbesitz

1. packages/browser-content/src/production-user-activity/ (neuer eigener Ordner:
   kleine reine Zustands-/Projektionslogik, IDB-Adapter, Hook/UI und CSS)
2. packages/browser-content/src/production-content-ui.tsx
3. apps/mobile/src/production-content-ui.tsx
4. apps/website/src/production-content-ui.tsx
5. packages/ui-language/src/production-content.ts
6. packages/ui-language/src/production-content.test.ts (falls benötigt)
7. apps/mobile/src/production-user-activity.test.ts
8. apps/mobile/src/production-user-activity-ui.test.tsx
9. apps/mobile/src/production-content-ui.test.tsx
10. apps/website/src/production-user-activity-ui.test.tsx
11. tests/e2e/production-user-activity-harness.tsx
12. tests/e2e/production-user-activity.spec.ts
13. docs/evidence/WRN-RC-USER-FUNCTIONS-2026-09-12/REPORT.md und manifest.json;
    temporäre Tools/Läufe/Builds/Logs nur im ignorierten Unterordner work/.

Root korrigiert im selben Paket zwei veraltete Testannahmen nach der bereits
akzeptierten Sechs-Artikel-Erweiterung: apps/website/tools/
integrate-production-article-landings.test.mjs und production-site-package.test.mjs.
Exakte sechs Landing-IDs und vollständige Dateizahlen bleiben geprüft;
Produkt-/Rechte-/Sicherheitsverträge werden dadurch nicht geändert.

Bestehende generische IDB-Technik aus content-offline-store-core verwenden;
keine Framework-/Service-/Storeduplikation und keine Abhängigkeiten hinzufügen.
Keine A1–A7-/Content-/Reading-/Personalization-/Quellenvertragsänderung,
kein Native-/Provider-/CSP-/Backendwrite. Notwendige weitere Pfade an Root
melden; Root koordiniert sie im selben Paket, keine neue Mikrogaterunde.

## Erreichbares Verhalten

- Nur „Für mich“ bietet lokale Besuchsübersicht. Explizit verständlich machen,
  dass der Stand ausschließlich auf diesem Gerät bleibt; keine Requests,
  Accounts, Telemetrie oder Interesseninferenz. Ohne ausdrückliche persönliche
  Auswahl keine behauptete personalisierte Neuigkeit. Home unverändert.
- Erster Besuch erzeugt keine erfundene Vergangenheit/Neuigkeitsflut. Bei
  folgenden Besuchen zeigen nur derzeit gültige, sichtbare, explizit passende
  Beiträge den Unterschied zum vorherigen lokalen Stand. Sprach-/Renderwechsel
  dürfen die Baseline nicht vorzeitig löschen. Semantik von Besuch und
  Aktualisierung eindeutig festlegen und testen; bevorzugt IDs des letzten
  gültigen Bestands statt bloß veröffentlichungszeitabhängiger Schätzung.
- Für bereits gelesene/gemerkte Texte kann der vorhandene, quellgebundene
  admittedContentSha256 eine geänderte Fassung nachweisen. Nur nachweislich
  geänderte Artikel kennzeichnen, nie pauschal jeden neuen Release. Altfälle
  ohne gespeicherten früheren Fingerprint liefern keine erfundene Änderung.
  Gelesen-Status/Position und Original bleiben erhalten. Keine fremden
  Textfassungen oder Titel im zusätzlichen Aktivitätsspeicher ablegen.
- Ein Hashwechsel allein beweist keine redaktionelle Korrektur oder deren
  Wesentlichkeit: UI muss „Fassung geändert“ sagen. Redaktionelle Korrektur-
  /Schwere-Metadaten aus RC4 bleiben als Integrationspunkt im Paket offen,
  bis deren Herkunftsvertrag vorliegt. Keine falsche Vollständigkeitsmeldung.
- Lokale Benachrichtigungen standardmäßig aus. Browserpermission nur durch
  explizite Nutzeraktion, Ablehnung respektieren, sichere generische Vorschau
  ohne politische Themen/Artikeltitel auf dem Sperrbildschirm. Ruhezeiten
  einschließlich Mitternachtswechsel, deduplizierte Hinweise, Aus/Zurücknahme
  sofort wirksam. Keine Netzwerk-/Pushregistrierung oder Hintergrundpolls.
  Nur vorhandene Plattformfähigkeiten nutzen; fehlende WebView-/Closed-App-
  Fähigkeit ehrlich anzeigen und Native-Integration an Root zurückmelden.
  Unterstützung im geöffneten Browser nicht als Android-Hintergrundzustellung
  ausgeben. OS-Permission im echten Nutzerbrowser nicht aktivieren.
- Sichtbares Zurücksetzen/Deaktivieren der neuen lokalen Übersicht mit sauberer
  Bestätigung, ohne Bookmarks/Lesepositionen/Quellenwahl zu verändern.
  Corrupt/future/blocked/quota/clock/concurrent Zustände ehrlich und endlich;
  niemals bestehende unbekannte Daten reparierend überschreiben.

## Lokaler Vertrag und Sicherheit

Eigenes versioniertes Client-IDB, feste Schlüssel, genau ein begrenzter
Zustandsdatensatz, höchstens200 Artikel-IDs/Fingerprints und64KiB insgesamt.
Keine stille Verdrängung; Kapazitätsfehler lassen vorhandene Werte erhalten.
Nur geprüfte Produktions-IDs und kanonische Fingerprints/Zeiten, endliche
Generation und vollständige Schema-/Schlüsselvalidierung. Atomarer Vergleich
mit erwarteter Generation in derselben Schreibtransaktion, anschließend
Readback. Clear/Disable dominieren späte Visits/Reads/Notifications; neue
Einträge anderer Tabs nie nachträglich löschen. Kein Zugriff auf Legacy-DBs.
Open/Transaktionen über vorhandene begrenzte IDB-Technik; verlorene/abgebrochene
späte Handles schließen. Während ausgeblendeter/unmounteter Route kein Save,
keine späte UI und keine Benachrichtigung. No-op ist keine Schreibbestätigung.
Neue Funktionen erlangen niemals Content-/Media-Ready-Autorität; Anzeigen
bleiben an die bestehende frische Content-Safety und Auswahl gebunden.

## Prüfungen und Abschluss

Zuerst fokussierte differenzierende Tests für erste/nächste Besuche, echten
neuen/entfernten/verborgenen/abgelaufenen Inhalt, gleiches Dokument in neuem
Release, einzelne geänderte Fassung, no-history, Filter-/Sprachwechsel,
Read-/Save-Nebenwirkungen, Permission denied/default/granted, Ruhezeiten,
Dedup, Disable/Clear/Unmount und Fehler-/Future-/Race-/Capacityfälle.
Echtes IDB für CAS/Clear/reopen; Fake-Notification statt OS-Prompt/-Zustellung.
Neun Sprachen, Tastatur/Dialogfokus,44px/320px/RU200/ForcedColors und beide
Produktclients. Browserstart erst nach Rückgabe43173–75 durch Sol; bis dahin
Unit/DOM-Prüfungen und Browserfälle vorbereiten, nicht warten ohne Fortschritt.
Betroffene Gesamtsuiten einmal bei stabilem RC3-Paket, keine Wiederholung
unveränderter Workspace-/Nativeprüfungen. Root liefert den gemeinsamen sichtbaren
Kandidaten; ein finaler Bericht, ein Hashmanifest und repräsentative Endbilder.

Vor Produktwrites kurz konkrete interne Schema-/Visit-/Benachrichtigungssemantik
an Root senden. Das ist Koordination im Paket, keine weitere Genehmigungshürde;
bei unveränderten genannten Grenzen direkt umsetzen. Offene Plattform- oder
echte Vertragsentscheidungen früh melden und unabhängige Arbeit fortsetzen.
