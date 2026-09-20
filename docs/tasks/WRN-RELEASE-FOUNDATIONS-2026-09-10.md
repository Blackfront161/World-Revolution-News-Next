# Releasegrundlagen: Importgrenzen, Android und Inhaltsversorgung

- PO-Auftrag: Fortsetzung der offenen Releasearbeit am10.September.
- Basis: `8ee6fb5`; Chief und alleiniger Slot-/Integrationsowner `/root`.
- Delegation: erlaubt, maximal drei direkte Helfer; keine Weiterdelegation.
- Register: `docs/WRN-G3-021-DELEGATION-REGISTER.md`, nur Chief schreibt.
- Slot1: frontend_brand_engineer Terra/high als alleiniger Androidwriter;
  Root korrigiert disjunkt nur Tests/Tools.
- Slot2: Luna/explorer read-only Inhaltsvertragsinventar; Slot3 zunächst frei,
  nach Kandidat enge unabhängige Terra-QA. Keine zusätzlichen Instanzen ohne Eintrag.
- Höchstens zwei Produktwriter; ein vollständiger Handoff pro Helfer,
  Zwischenstand bei konkretem Hindernis; kein Installations-/Retryloop.

## A: Chief korrigiert16 bekannte Testimportverstöße

Pakete importieren momentan direkt16 Mobile-JSONs. Neutrale Contracttests
erhalten paketlokale unveränderte Testkopien; ein übergeordneter Driftcheck
vergleicht jede Kopie gegen das bisher geprüfte App-Artefakt. Die bestehenden
Testaussagen bleiben vollständig, die echte Appbindung geht nicht verloren.
Importscanner unverändert streng; der Standard-Prüfbefehl führt künftig den
echten Workspacecheck UND seine eigenen Tests aus.

Erlaubt: drei betroffene Testdateien (`mobile-media-v1.test.ts`,
`mobile-regional-events-v1.test.ts`, `g3-016-home-fixtures.test.ts`), jeweils
paketeigene `tests/fixtures/`-Unterordner; neuer `tools/check-public-fixture-parity.mjs`
und Test; `package.json` nur Prüfscripts; eigene Dokumente/Handoff.
Produktreleases, Pins, Domainregeln und veröffentlichte JSONs unverändert.

Abnahme: alle16 Imports entfernt ohne Regelabschwächung; gleiche Contracttests
PASS, DriftcheckPASS und wirksame Negativfälle (fehlend/geändert); wirklicher
ImportcheckPASS, Standardprüfkette gebunden, betroffene Typechecks und Lint/Format.
Keine UI-Änderung, deshalb keine neue visuelle Matrix für diesen Teil.

## B: Terra erstellt lokale native Androidbasis

Erlaubt nur `apps/mobile/android/` (neues Projekt),
`apps/mobile/capacitor.config.ts`,
`docs/evidence/WRN-ANDROID-FOUNDATION-2026-09-10.md` und
`docs/handoffs/WRN-ANDROID-FOUNDATION-2026-09-10.md`.
Installierte Capacitor8.5.0-Templates/Werkzeuge verwenden; zuerst deren
Generierungsschritte auf Installationen/Signierung prüfen. Paketidentität
`com.world.revolution`, Anzeigename `World Revolution News`, minSDK24/target36
wie Baseline. Versionscode26 und Versionsname2.1.1 aus der Baseline erhalten,
keine Erhöhung. Kein Upload-/Upgradefähigkeitsversprechen allein daraus.

Vorhandene lokale Java21/SDK35+36/Gradlewerkzeuge verwenden. Ausschließlich
offline Compile-/Ressourcenprüfung oder nach Prüfung der Gradlekonfiguration
ein UNSIGNIERTES Releaseartefakt; kein Debugsignieren oder Keystorezugriff.
Gradlewrapper darf keinen fehlenden Distributor herunterladen. Bei fehlendem
lokalem Gradle/Artefakt konkret dokumentieren, keine Installation/Netzwerkumgehung.
Keine Änderungen an package.json/Lockfile, Reader/Player/Offline, Website,
Geräten, externen Konten oder globaler SDK-/Systemkonfiguration.

Abnahme: reproduzierbares native Quellprojekt, minimale Permissions, klare
Paket-/Versionsbindung, keine Secrets, lokal mögliche Compileprüfung ehrlich
belegen; fehlende Bestandteile konkret benennen. Kein Android-/Release-GREEN
ohne tatsächliche Build-/Geräte-/Upgradebelege. Root prüft Integration separat.

## C: Luna inventarisiert reale Inhaltsversorgung

Read-only: vorhandene Inhalte/Generatoren/Reader-/Updateverträge und der durch
Source-of-Truth benannte Datenbestand. Welche freigegebenen echten Volltexte
liegen schon vor, und welcher kleinste lokale, versionierte Zulieferpfad
kann sie ohne pauschale Rechteannahme in Reader/Home/Offline einbinden?
Keine Altverzeichnisse automatisch gleichsetzen; keine Netzwerk- oder
Produktwrites, keine Volltexte in Chat kopieren. Handoff kurz inline.

## Integrationsnachtrag nach Android-Handoff

Androidwriter beendet; Chief übernimmt sequenziell denselben TeilB-Bereich.
Voller nativer Lint findet fehlende Android12-Datenextraktionsregeln und eine
Manifestreihenfolge-Warnung. Chief ergänzt explizite Ausschlüsse für Cloudbackup
und Gerätetransfer samt JVM-Regressionsprüfung; keine bestehende Nutzerdaten-
oder Upgradeaktion. README beschreibt frischen Webbuild, lokale Capacitor-
Generierung, Offlinebuild und die weiterhin nötige native Marken-/Geräteabnahme.
Ein frischer Webbuild wird gegen die kopierten und in der APK enthaltenen
Webassets gebunden. Eigener Chiefbeleg/Hashmanifest unter docs/evidence erlaubt.
Danach übernimmt derselbe unabhängige Terra-QA-Reviewer Slot3 für TeilB,
nur eigene ANDROID-FOUNDATION-QA-Evidence/Handoff; keine Produkt-/Indexwrites,
Downloads, Signierung, Geräteaktionen oder Kinder.

## Rücknahme, Privacy und Übergabe

Gezielter lokaler Revert; keine bestehende Benutzer-/Produktdatenmigration.
Keine Installationen, Signierung, externen Writes, bezahlten APIs oder Secrets.
Testkopien sind allein neutrale bereits vorhandene öffentliche Fixtures.
Jeder Helfer verwendet Handoffvorlage/END-CHECK: :). Belege unterscheiden
technische Teilabnahme, echte native Prüfung und weiterhin offene Releasegates.
