# WRN-G3-015 P2 – Website-Shellkern und echte Browserbelege

Stand: 28. August 2026. Elternauftrag PO-074; Main/Slotvergeber Chief `/root`.
Vorbereitung dieses Briefs startet keinen Agenten. P2 erst nach gesichertem
GREEN-P1-R1 und beendeter Reviewarbeit; Startcommit wird im Register gebunden.
Vertrag: `WRN-G3-015-WEBSITE-OFFLINE-SHELL.md`, insbesondere verbindliche B1–B4.
P1: `../evidence/WRN-G3-015/ARCHITECTURE-PRECHECK.md` und enger Recheck.

## Auftrag, Owner und Grenzen

Genau ein `backend_data_reliability_engineer` Terra/high, keine Kinder.
Du bist nicht allein im Checkout: Chief pflegt Governance, fremde Aenderungen
nicht zuruecksetzen oder stage/committen. `.codex-remote-attachments/` ignorieren.
Keine Legacy-/Liveanalyse, neuen Dependencies/APIs, Android-, Remote-/CI-,
Cloud-/Releaseaktionen. Keine Profile/Sessionconfig aendern.

Schreibrecht ausschliesslich:

- neue `apps/website/src/offline-shell/**`: typisierter UI-neutraler Vertrag,
  gemeinsames Control-/Lockprotokoll, Worker, Windowadapter, eigene Tests;
- `apps/website/tools/build-offline-shell.mjs` und
  `apps/website/tools/build-offline-shell.test.mjs`;
- `apps/website/package.json` nur deterministische Buildkette und rein additive
  Ausfuehrung eigener Generator-/Worker-Tests bzw. lokaler Typpruefung in bereits
  vorhandenen Scripts. Das ist die vorab gebundene enge Scopepraezisierung:
  neue Tests muessen dauerhaft im vorhandenen Qualitaetslauf mitlaufen, nicht
  bloss im Handoff stehen. Dependencies, Engines und andere Scripts unveraendert;
- neue `tests/e2e/website-shell-*.spec.ts` und passend benannte isolierte
  Helper/Config/Setupdateien; `tests/e2e/global-setup.ts` nur wenn fuer echte
  gebaute Shelltests erforderlich, keine alten Assertions/Servergrenzen lockern;
- eigene `docs/evidence/WRN-G3-015/p2/**` sowie
  `docs/handoffs/WRN-G3-015-backend.md`.

Read-only: Website App/main/Styles, alle Mobilequellen, ui-language/Brand,
Contentvertraege/-Controller/-Stores/-Loader, Releasefixtures, Publisher,
SEOgenerator, Rootconfig und Lockfiles. Fehlende eng notwendige Datei vorab an
Chief melden, keine pauschale Pfadfreigabe ableiten.

## Lieferumfang und Reihenfolge

1. Zuerst rote Solltests fuer die neuen invarianten B1–B4 anlegen/ausfuehren;
   fehlende Implementierung korrekt als RED-benennen, noch kein Produktfehler.
   Realistische Testgrenzen definieren, nicht erst nach gruenem Code erfinden.
2. Deterministischer geschlossener Buildvertrag; vorhandene Vite-/Node-Werkzeuge,
   kein Workbox. Exakte Worker-/Manifestbindung, zwei identische Builds.
3. UI-neutraler Kern inklusive dauerhaft serialisierter Enable-/Remove-
   Operationen, typisierter Zustaende und eng validierter Nachrichten.
4. Vollstaendiger Worker mit Buildpruefung vor Ready, Waiting/Generationsbindung,
   exaktem network-first-HTML, reinen manifestgebundenen Assetantworten,
   gebundenem Budget/Cleanup/Rollback und fehlersicherem Entfernen.
5. Windowadapter bietet lesbaren Status/Subscriptions und explizite Aktionen;
   Construction/Status auf frischem Profil registriert/speichert nichts.
   Keine React-/DOM-UIhierarchie oder Produkttexte vorwegnehmen. Browser-
   Lifecycle, Eventcleanup, erwartete Epoch, pending/unknown/uncontrolled/
   waiting/ready/removed/Fehler unterscheiden. Ein boolesches `offline=true`
   reicht nicht. Keine UI darf eigene Sicherheits-/Storageorchestrierung bauen.
6. Echte Browser-/Cache-/SW-Ablaufmatrix nach B1–B4 und SHELL-01–09; detaillierte
   Zuordnung welche Probe echt, simulierte APIfehlerbarriere, Unit oder spaeter
   P3-UI ist. P2-GREEN braucht die Kernfluesse vollstaendig, nicht nur Unit-GREEN.
7. Produkt-/Testcheckpoint plus Evidenz/API-Handoff lokal sichern, dann Ende.

Normalbesuch bedeutet nicht aktiviertes/entferntes Profil. Bereits bewusst
bereitgestellte Shell darf bei erneutem Besuch arbeiten; Dev und Mobile bleiben
frei davon. Quelltestadapter nie als produktiven UIhook exportieren.

## Besonders kritische Nachweise

- B1: B-Netz-HTML unter kontrolliertem A, gleicher Pfad/andere Bytes, langsamer
  Body nach schnellen Headers, exakte Cacheprovenienz; keine Querypersistenz.
- B2: alle Pflichtassets plus dauerhafter Ready vor install-Erfolg; Abbruch vor
  Ready UND nach Ready/im Activate vor erstem Fetch. Keine kritische Aktion
  erst im Activate. Rollback zwischen zwei vollstaendigen G3-015-Paketen.
- B3: P/A/B-waiting blockiert C vor Payloadrequests/-writes, nach B-Aktivierung
  P erst sicher bereinigen; Budget auch waehrend Fehlversuchen. Alle Cachewrites
  awaited/serialisiert, Deadline einschliesslich Lockwait/Body.
- B4: echtes Cache-open/put/delete mit kontrollierter Pause, Remove aus zweitem
  Fenster, Worker-/Prozessende und Wiederanlauf mit durable removing. Spaete
  Promise darf nach Erfolg nichts auffuellen. Unknown Control/foreign SW/cache
  und G3-014-IDB/localStorage bleiben geschuetzt. Loeschstatus ehrlich pending
  wenn Abschluss nicht bewiesen; retained kleiner Schutzmarker ist gewollt.
- Lock/Registration-Reihenfolge darf nicht Window->register/update->install->
  derselbe Lock verklemmen; echte Register-/Update-/Removeprobe erforderlich.
  UI-Adapter beobachtet Browserzustand, kontrolliert Aktivierung nicht selbst.
  Chief bindet den S1-R1-Hinweis: Ownership/Epoch pruefen und ein begrenztes
  Pending-Jobticket im bestehenden Controlrecord speichern, nativen Job unter
  Lock anstossen; native Promise/ready/Statechange/ACK ausserhalb abwarten.
  Ergebnis erneut unter Lock gegen Epoch/Ownership abgleichen; keine spaete
  Wiederfreigabe. Ein Promise-Race beendet den Browserjob nicht. Remove zuerst
  durable disabled/removing, bleibt bis Jobsettlement bzw. konservativer
  Reconciliation pending; neues Enable dabei gesperrt. Cachewrites selbst
  weiterhin voll awaited unter Lock. Crash nach Jobstart und automatische
  Updatejobs mit wartendem Installer real pruefen. Kein wachsendes Journal.
- SHELL-03: sauberer ganzer Browserprozess-Neustart mit gleichem isoliertem
  Profil, kompletter Transport blockiert, Root/Hash/Query; kein HTTPcache- oder
  Source-/Route-Mock als Offlinebeweis. Nachweis Header/Generation/SW/Cache.
- SHELL-04: gespeicherter Inhalt, kein Inhalt, abgelaufen/gesperrt/Uhrregression
  weiterhin ausschliesslich G3-014. Keine SW-Contentantwort/DBinterpretation.
- SHELL-09: SEO/unknown/Safety/Content/Medien/external nicht gecacht oder als
  SPA beantwortet; negative URL-/Nachrichtenproben einschliesslich query/pfad.

Test-only Fehlerbarrieren duerfen normale Browserapis instrumentieren, aber
keinen alternativen produktiven Workerpfad oder Testflag in Releasecode bilden.
Gesunder Test muss durch dieselbe generierte Buildkette gehen. Fehlversuche und
Rohberichte nicht durch spaetere GREEN-Läufe ueberschreiben; keine Erfolgssumme
aus historischer/anderer Quelle. Bestehende Assertions nicht abschwaechen.

## Toolchain und Umgebung

- Node24.19.0: `C:/Users/patri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`;
  PATH voranstellen, System-Node24.16 ist falsch.
- Pnpm11.19.0 vorhanden, kein Install. `pnpm_config_verify_deps_before_run=error`,
  `pnpm --config.enableGlobalVirtualStore=false ...`.
- Startbaseline Chief: alle zehn Einzelgates GREEN, 224+8 Tests, sieben
  Typechecks, 19 Boundaries, Builds/Releaseboundary; Browserhistorie G3-014
  223 PASS/547 erwartete Skips, nicht als neuer P2-Test ausgeben.
- Root-`check` enthaelt historische Source-Previewboundary; nicht recouplen.
  Einzelgates toolchain/format/lint/typecheck/fixture-provenance/brand-assets/
  test:unit/build:mobile/build:website/release-boundaries verwenden.
- Bestehende E2E-Globalsetup-Builds rufen Vite direkt und Publisher auf;
  neue Tests muessen auch den echten Generator laufen lassen. Website43174
  strikter Builtserver,43175 Sourceharness; kein Offlinebeweis allein daraus.
- Eigene kurze temporäre Browserprofile via mkdtemp, neue isolierte Origins.
  Keine PO-Preview43113/43114, vorhandene Profile oder Userbrowsertabs verwenden.
  Windowslange Profilpfade vermeiden. Keine Profile/Artefakte eigenmaechtig
  loeschen. Nur eigene Server beenden, Start-Process WindowStyle Hidden.
- Keine zeitgleichen Builds/Tests auf denselben Outputs/Ports; Chief startet
  waehrend P2 keine Produkt-/Browsermatrix.

## Aufwand, Zwischenstand, Handoff

Erster belastbarer Zwischenstand spaetestens nach etwa 45 Minuten aktiver
Arbeit: gebundener Vertrag/Testgeruest und eine reale Kernprobe, oder konkreter
Blocker mit Datei/Ablauf. Kein automatischer Abbruch bei sinnvoll belegtem
Fortschritt. Bei zweimal demselben erfolglosen Fix oder fehlendem Fortschritt
Handoff an Chief statt unendlich Varianten. Keine neue Architektur/Scope-
Ausdehnung aus Zeitdruck. Token/CHF wenn nicht messbar `unbekannt`/keine neue API.

Handoff nach Template: Basis/Produkt-/Evidencecommit, exakte Dateien/Hashes,
API/Status-/Fehlersemantik und P3-Beispielaufrufe, echte vs simulierte Tests mit
Reportpfaden/Exitcodes, SHELL-Zuordnung, Bedarfe/Grenzen, Schutzmarker und
Rollbacksemantik. P3 darf nach deiner Beendigung nur mit gesichertem GREEN
des gesamten P2-Umfangs starten. Kein Produktabschluss/Release aus P2-GREEN.

END-CHECK: :)
