# WRN-G3-015 P3 – Website-Offlinepanel und begrenzter Sprachhelferpilot

Stand: 28. August 2026. P3 durch Chief innerhalb PO-074 freigegeben.
Elternauftrag PO-074 und `WRN-G3-015-WEBSITE-OFFLINE-SHELL.md` B1–B4.
P2 vollstaendig uebernommen, S4 gesichert und beendet: Kern b062ab7,
Buildparitaets-Teststand5ede03d, finaler API-/Evidencehandoff7256d6a.
Verbindliche API: `docs/handoffs/WRN-G3-015-core-completion.md`;
Kernbelege: `docs/evidence/WRN-G3-015/completion/CORE-COMPLETION.md`.
Chief bestaetigte3720 Hashbindungen und finale Gesamtmatrix. Slot S5,
geplante Instanz `/root/g3015_frontend`; Helferslot noch NICHT reserviert.

## Rolle und Eigentum

Ein `frontend_brand_engineer` Terra/high als Fachlead. Main/Slotvergeber Chief.
Delegation erlaubt; Weiterdelegation ausschliesslich an den einen unten
gebundenen Spark-Helfer nach zentraler Reservierung. Kein eigener Pool.
Global maximal zwei Subagenten einschliesslich wartender/nachgeordneter
Instanzen, nur Lead+Helfer. Keine neuen sichtbaren Tasks.

Du bist nicht allein im Checkout. Chief schreibt Governance; Katalogschreiber
hat unten einen eigenen Bereich. Fremde Aenderungen nicht reversen/stagen,
`.codex-remote-attachments/` nicht beruehren. Schreibrecht des Leads:

- `apps/website/src/App.tsx`, `main.tsx`, minimale `styles.css`-Ergaenzungen;
- neue Website-Shell-UI-/Hookkomponenten und zugehoerige Tests nur im neuen
  `apps/website/src/offline-shell-ui/` (vorab benannter UI-only-Bereich, damit
  der Backendordner read-only bleiben kann);
- `packages/ui-language/src/index.ts` und `index.test.ts` nur additive neue
  Website-Shellkeys, Englisch, Typ-/Vollstaendigkeitspruefung;
- neue `tests/e2e/website-shell-ui-*.spec.ts`, UI-only-Helper falls noetig;
- eigene `docs/evidence/WRN-G3-015/p3/**` und
  `docs/handoffs/WRN-G3-015-frontend.md`.

Backendkern `offline-shell/**`, Generator, P2-Browsertests, Contentcontroller/
Stores/Loader, Mobile, Rootconfig/Dependencies, Publisher/SEO, Brand/Theme-
Grundgeometrie bleiben read-only. Befunde an Chief, keine eigene Backend-
Korrektur. Neues Panel ist kein allgemeiner Button-/Headerdesignauftrag.
UX-POLISH-001 bleibt spaeter. Keine neue API/Live-/Android-/Releasebefugnis.

## Nutzerfluss und UI-Vertrag

- In der Website unter Mehr ein eigenes semantisches Offline-Oberflaechenpanel,
  klar von der vorhandenen Inhaltsverwaltung getrennt. Kein Mobilepanel.
- Explizite Bereitstellung; Mount/StrictMode/Sprachwechsel/Navigation starten
  keinen Install- oder Updateauftrag. Bestehende erlaubte Shell darf beobachtet
  werden, erforderliche sichere Wiederanlaufbereinigung kommt allein aus P2.
- Nur typisierten P2-Adapter verwenden. Keine Cache-/SW-/Lock-/Epochlogik in
  Komponenten, keine Beurteilung oder Speicherung von Content/Safety.
- Gespeichert aber noch unkontrollierte Seite, aktiv kontrolliert, Update
  wartet, laufende Operation, Entfernung pending/fehlgeschlagen, entfernt und
  nicht verfuegbarer/geschuetzter Speicher muessen ehrlich unterscheidbar sein.
  Keine Anzeige `offline bereit` nur weil navigator.onLine false oder ein
  register-Promise erfuellt ist. SHELL-Ready garantiert keine Inhalte/Medien.
- Waiting erklaert Schliessen aller betreffenden Seiten und neues Oeffnen;
  keine erzwungene Aktualisierung/claim/skipWaiting, keine Update-Klickgarantie.
  Falls P2 eine bewusste Updatepruefung anbietet, label sie als Pruefung,
  nicht Aktivierung. Keine neue UI-gesteuerte Paketrollbackfunktion erfinden.
- Entfernen braucht Dialogbestaetigung. Cancel/Escape wirkt nicht destruktiv.
  Text benennt nur Shellpayloads, unveraenderte Inhalte/Einstellungen und
  verbleibenden kleinen Schutzmarker. Laufende Seitenkontrolle und ungeklärte
  Entfernung getrennt anzeigen, kein vollstaendiges Origin-Clear behaupten.
- Doppelklick, Navigation/Unmount/Remount waehrend Operation, Wechsel der
  Sprache, spaete Resultate und Fremdfensterzustand muessen sicher projiziert
  werden. Keine verwaiste Subscription/Effect oder stale confirmation.
  Auch ein von React StrictMode verworfener Render darf keine unbeendete
  Adapter-/Channelinstanz hinterlassen; Aufbau und Dispose als Paar belegen.
  Entfernungsbestaetigungen an ihren beobachteten Zustand binden und bei einem
  relevanten Epoch-/Generations-/Operationswechsel verwerfen statt einen
  inzwischen anderen Zustand still zu bestaetigen.
- Semantik, Statusregion ohne Daueransage, Dialogfokus mit Rueckgabe,
  Tastatur/Escape, 44-CSS-Pixel-Ziele, Reflow ohne Inhaltsverlust; alle neun
  Sprachen und vorhandenen Themes, normale und Nach-Mount-200-Prozent-Folge.

## P3-H1 – eingefrorener kleiner Katalogauftrag

1. Zuerst API/Handoff lesen und maximal zwoelf neue UI-Copykeys mit exakten
   englischen Bedeutungen/Platzhaltern und Zustandszuordnung festlegen.
   Bekannte generische Labels nur semantisch passend wiederverwenden; nicht
   bloss zur Keyeinsparung `Inhalte` fuer `Oberflaeche` ausgeben. Keine Keys
   mit untypisiertem Trennzeichen-/Satzkatalog als Umgehung des Limits.
2. Copyvertrag und UI-API in eigenem p3-COPY-CONTRACT.md mit Quellcommit sichern.
   Unvollstaendige Katalogzwischenstaende sind WIP, keine Produktkandidaten.
   Wenn zwoelf Keys fachlich nicht reichen: Chief vor Helferstart informieren,
   keine irrefuehrenden Texte oder stilles Erhoehen des Pilotscopes.
3. Chief prueft/disponiert und reserviert P3-H1 mit genauem Commit/Pfad/Keys.
   Erst ausdrueckliche lesbare Slotbestaetigung erlaubt `spawn_agent` fuer
   `spark_micro_task_worker` (Profil Spark/medium). Bei fehlendem Nesting oder
   Modell keine Pool-/Providerumgehung; Chief direkt dispatcht oder Lead selbst.
4. Helfer besitzt nur additive eingefrorene Keys in acht Dateien
   `packages/ui-language/src/catalogs/{de,es,fr,it,pt,tr,ru,el}.ts` und eigenen
   Handoff `docs/handoffs/WRN-G3-015-language-helper.md`.
   Keine Bestandsuebersetzungen, Index/Typvertrag, UI oder Tests veraendern.
   Keine Kinder/Dependencies/externen Uebersetzungsservices.
5. Waehrend Helferarbeit schreibt Lead nur Website-UI/Tests; Kataloge und
   Copy-/Typvertrag sind read-only. Lead gibt dem Helfer kein neues Keyset.
6. Helfer prueft vorhandene Typ-/Katalogtests, genaue Additions-/Platzhalterliste,
   eigene Dateien lokal sichern, Handoff mit Ergebniscommit/Rest und Ende.
   Maximal ein Auftrag und eine Korrekturrunde. Chief bestaetigt Schreibende
   und Rechteuebergabe, erst dann Lead Gesamtintegration/neun Sprachen.
7. Pilotauswertung: Zeitpunkt/Arbeitsumfang, Parallelphase, Koordination,
   Nacharbeit/Konflikte, konkrete Testergebnisse; Tokenkosten wenn nicht
   belegbar unbekannt. Kein Sparversprechen ohne vergleichbare Messung.

## Tests, Belege und Ende

Test-first UIzustaende/Aktionen/Subscriptioncleanup mit echter P2-Semantik;
Komponentenproben allein ersetzen keine Built-SW-Interaktion. Bestehende
G3-014-Inhalte und nicht aktivierter Zustand bleiben regressionsgeprueft.
Eigene Builtbrowserfolge normal -> bereit/uncontrolled -> kontrolliert ->
waiting -> neuer Stand -> Entfernung/Cancel/pending. Originalbilder mit
Build/Generation/Viewport/Theme/Sprache und Quell-/Bildhashbindungen.

Toolchain und isolierte Origins/Profile nach BACKEND-PACKET. Keine parallelen
Tests/Builds auf denselben Outputs. Po-Vorschauen nicht fuer Cachetest verwenden.
Websitegroessen explizit: 320x568, 360x800, 390x844, 412x915, 844x390,
600x960, 800x1280, 1024x768 (Tablet quer), 1024x800, 1280x800, 1440x900,
1920x1080. Normalmatrix mindestens dark/light/pink/contrast, also 48 Faelle.
Sprach-/Reflowmatrix: neun Sprachen, initial und nach vollstaendigem Mount,
mindestens dark/light bei 390x844/200 Prozent, also 36 Faelle. Panel und
Entfernungsdialog erfassen; waiting/pending/Fehler zusaetzlich gezielt, nicht
als bloss anderes Label im Mockbild. Zustandsbasiertes Polling statt fester
Sleepzeit; die historische G3-013-Nach-Mount-Sequenz bleibt Regression.
Lange Uebersetzungen, kontrollierte und Fehlerzustaende. Keine Bestandsassertions
abschwaechen. Fresh gesamte statische/Unit/Build/Browsermatrix nach Integration,
Rootdefault zwei Worker; erwartete Skips genau begruenden.

Ein belegbarer Zwischencheckpoint nach ~45 Minuten oder konkreter Blocker;
bei zwei gleichartigen erfolglosen Korrekturen Chief statt Endlosschleife.
Kandidat/API-/Copy-/Evidence-/Handoffcommit sichern, dann Lead/Helfer beenden.
Unabhaengige Security/QA/Architektur folgt direkt unter Chief, nicht dem Lead.
Technisches GREEN ersetzt keine Product-Owner-Sichtabnahme.

END-CHECK: :)
