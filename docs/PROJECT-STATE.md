# WRN Project State

Stand: 23. August 2026

## Aktuelle Phase

- Phase: G3 / aktive Wave 2 Newsfeed
- Task: `WRN-G3-002` – lokaler Manifest-Newsfeed vom Product Owner gestartet
- Ausgangscheckpoint: `bb77c06`
- Foundation-Kandidatencheckpoint: `e4d78b4`
- Foundation-QA-/Evidenzcheckpoint: `ea2564f`
- G3-002-Ausgangscheckpoint: `955f8e6`
- Arbeitsbranch: `codex/g3-002-newsfeed`
- Gate: **START WRN-G3-002 ERTEILT – NUR LOKALER NEWSFEED-SLICE**
- `GO-IMPLEMENTATION`: **am 23. August 2026 fuer WRN-G3-001 erteilt**
- Legacyimport, Markenassets, echte Dienste, Datenbank, Remote/CI, Deployment,
  Signierung und Upload: nicht freigegeben
- aktive Subagenten/Mitarbeiterinstanzen: Backend/Data wird zuerst gestartet;
  Frontend und QA folgen erst an ihren dokumentierten Gates
- Schutzgrenze: Live-App, Legacy-Repositories, Website, Daten und
  Liveinfrastruktur bleiben read-only und unveraendert

## Verbindliche Quellen

- App: `wrn-github-app-current@2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- sichtbarer App-Runtime-Release:
  `968c320adfe87d1e11e88f99f448a435d4242750`
- Website:
  `wrn-web-portal-2026-08-20-r10n-work@9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Datenbeobachtung G1: `acec88ef40814f70c1bb45001e397a6ca5872ed7`
- Daten-Livebeobachtung am 23.08.2026:
  `4928f474d02c41e196775e9b7c4f38dede06cbc1`
- beide autoritativen Legacy-Arbeitsbaeume waren bei der WRN-G2-002-Pruefung
  sauber; es wurde nichts kopiert oder geaendert

## G2-Abnahme

- PO-001–013 wurden am 23. August 2026 mit „ja mach weiter bitte“ auf das
  unmittelbar zuvor vollstaendig beschriebene Empfehlungspaket akzeptiert.
- ADR-001–009 sind als Architekturvertrag akzeptiert; ADR-010 ist als Vertrag
  akzeptiert und als Produktfunktion fuer Release 1 aufgeschoben.
- G2-Abnahme erteilt keine Implementierungs-, Remote-, Deployment-, Signier-
  oder Uploadauthority.
- Details: `docs/06-DECISION-LOG.md` und
  `docs/architecture/G2-OPEN-DECISIONS.md`.
- PO-014/015 sind durch PO-016/017 ersetzt: Qood bleibt als Datei
  ausgeschlossen, erhaelt aber auf Product-Owner-Wunsch einen offenen Ersatz.
- Der Product Owner bestaetigt alle erforderlichen Rechte an den
  inventarisierten Markenassets. Ein kontrollierter Import ist erst nach
  `GO-IMPLEMENTATION` in einem eigenen Asset-Task erlaubt.

## G3-001-Foundationbelege

- Task Brief: `docs/tasks/WRN-G3-001-FIRST-CODE-READINESS.md`
- Toolchain-, Dependency-, Audit- und Lizenzbeleg:
  `docs/evidence/WRN-G3-001-TOOLCHAIN-AND-LICENSES.md`
- zehn commitgebundene Screenshots: `docs/evidence/WRN-G3-001/`
- Visual-QA-Bericht: `docs/evidence/WRN-G3-001-VISUAL-QA-REPORT.md`
- Implementierungshandoffs:
  `docs/handoffs/WRN-G3-001-frontend-foundation.md` und
  `docs/handoffs/WRN-G3-001-contract-foundation.md`
- unabhaengiger QA-Gegenreview:
  `docs/handoffs/WRN-G3-001-independent-qa.md`
- Ergebnis: exakte Node-/pnpm-Toolchain, Frozen-Lockfile, 20 lokale
  Unit-/Contract-/Boundary-Tests, zwei Builds und 10/10 Browser-E2E bestanden;
  null Blocker/High/Medium im unabhaengigen QA-Review
- Restpunkt: R-37 ist eine moderate transitive Development-Advisory im
  Capacitor-CLI-Pfad; vor Androidgenerierung/G5 erneut pruefen
- Product-Owner-Entscheidung: technische Foundation akzeptiert; keine Design-,
  Funktions-, Marken- oder Paritaetsfreigabe. Die erste echte visuelle
  Produktabnahme erfolgt gefuehrt am Newsfeed-Slice.

## G3-002-Vorbereitung

- Task Brief: `docs/tasks/WRN-G3-002-LOCAL-MANIFEST-NEWSFEED.md`
- visueller Alt-vs.-Neu-Abnahmebogen:
  `docs/evidence/WRN-G3-002-VISUAL-ACCEPTANCE-BRIEF.md`
- Vorbereitungshandoff: `docs/handoffs/WRN-G3-002-preparation.md`
- Scope: lokale immutable Manifest-v1-Fixture, Domainvertrag und getrennte
  Mobile-/Websitefeeds mit Quelle, Datum, Sprache, Tags und sechs klaren
  Zustaenden
- ausgeschlossen: Legacykopie, echte Nachrichten, Livequelle, Suche/Filter,
  Reader/SEO, echte Medien, Dienste, Android, Remote/CI und Releaseoperationen
- Startgate: `START WRN-G3-002` am 23. August 2026 erteilt; die vertragliche
  Backend-/Fixturearbeit beginnt zuerst

## Wave-0-Belege

- Asset-/Rechteregister:
  `docs/evidence/WRN-G2-002-ASSET-RIGHTS-REGISTER.md`
- lokales Infrastrukturinventar:
  `docs/evidence/WRN-G2-002-LOCAL-INFRASTRUCTURE-INVENTORY.md`
- Stack-/Lizenzbeleg:
  `docs/evidence/WRN-G2-002-STACK-AND-LICENSE-EVIDENCE.md`
- Font-Ersatz-/Marken-Importbrief:
  `docs/evidence/WRN-G2-003-FONT-AND-BRAND-RECREATION-BRIEF.md`
- vorbereiteter erster Code-Task:
  `docs/tasks/WRN-G3-001-FIRST-CODE-READINESS.md`
- abgeschlossener read-only Liveinventar-Task:
  `docs/tasks/WRN-G2-004-READ-ONLY-LIVE-INVENTORY.md`
- gepruefter Livebericht:
  `docs/evidence/WRN-G2-004-LIVE-INFRASTRUCTURE-INVENTORY.md`
- aktueller Handoff:
  `docs/handoffs/WRN-G2-004-live-inventory-partial.md`
- unabhaengige Abschlussreviews:
  `docs/handoffs/WRN-G2-004-security-privacy-review.md` und
  `docs/handoffs/WRN-G2-004-context-audit.md`
- Task/Handoff:
  `docs/tasks/WRN-G2-002-PREIMPLEMENTATION-EVIDENCE.md` und
  `docs/handoffs/WRN-G2-002-preimplementation-evidence.md`

## Wesentliche Feststellungen

1. `Qood.ttf` ist lizenzrechtlich ungeeignet und wird in keiner verbindlichen
   Runtime referenziert. PO-016 verlangt einen lokal ausgelieferten, offen
   lizenzierten Ersatz nach Lizenz-/Hash-/Accessibility-/Visualgate.
2. Die Markenbild-Hashes sind erfasst und ihre Rechte vom Product Owner
   bestaetigt. PO-017 erlaubt spaeteren kontrollierten Import, keine pauschale
   Kopie aller Medien.
3. GitHub-Liveabgleich bestaetigt App-/Website-Quellcommits. Das Datenrepository
   ist weitergelaufen; alle drei Legacy-`main`-Branches sind ungeschuetzt und
   die Datenautomation pusht direkt auf `main`.
4. Cloudflare live besitzt drei Worker: die zwei lokal bekannten Deployables
   plus `wrn-shared-translations`. Dieser hatte im beobachteten 24-Stunden-
   Fenster 0 Aufrufe und keine Bindings/keinen Cron, ist ueber `workers.dev`
   aber adressierbar; sonstige Nutzung bleibt `UNVERIFIED`. Das Ziel verlangt
   mindestens fuenf fachliche Deploy-/Rollbackeinheiten.
5. Cloudflare Workers Free ist beim beobachteten Traffic kostenneutral. Zwei
   Legacyfunktionen sind live aktiviert: Translation und Podcastgenerierung.
6. Der gemeinsame R2-Bucket loescht `podcasts/` nach 30 Tagen, besitzt aber
   keine sichtbare Lifecycle-Loeschung fuer `feedback/`, `operations/` oder
   `usage/`. Das bestaetigt R-26/R-29 als offenes Privacygate.
7. Hostinger nutzt Business Web Hosting als PHP/HTML-Website, Hostinger-CDN
   aktiv, Auto-Cache aus und dateibasierte Backups. GitHub ist nicht als
   Deploymentquelle verbunden; der Pfad ist `public_html` und Rollback nicht
   commitgebunden.
8. React `19.2.8`, TypeScript `6.0.3`, Vite `8.2.2`, Capacitor `8.5.0`,
   Node `24.19.0` und pnpm `11.19.0` sind im Foundation-Lockfile exakt
   beziehungsweise durch Toolchaingate reproduzierbar fixiert.

## Offene Gates

1. Separate Google-/Azure-/Hugging-Face-Konten bleiben unverifiziert; die
   entsprechenden neuen Adapter bleiben auf 0 CHF und deaktiviert.
2. Kill-Switch-, Fail-closed- und globale Hard-Cap-Wirkung der Legacydienste
   bleibt `UNVERIFIED`; in der Foundation sind alle Dienste aus.
3. R-26/R-29 sowie SEC-001/002 bleiben vor Translation-/Podcastportierung,
   SEC-003 vor Push
   offen.
4. Legacycode und Medien werden weiterhin nur pro Element mit Rechtebeleg
   importiert; WRN-G3-001 importierte nichts davon und WRN-G3-002 plant keinen
   Import.
5. Jeder Folge-Slice, Assetimport, native Androidtask, Remote-/CI-Schritt und
   Release bleibt ein separater Task mit eigener Freigabe; `GO-IMPLEMENTATION`
   fuer WRN-G3-001 erweitert diesen Scope nicht.

## Naechste empfohlene Aktion

Backend/Data implementiert und prueft zuerst Fixture, Manifest und
Domainvertrag. Nach gesicherter Uebergabe integriert Frontend/Brand die beiden
getrennten Feedansichten. Danach erstellt QA echte Feed-Screenshots als klar
beschriftete Alt-vs.-Neu-Tafeln. Kein weiterer Produktslice startet
automatisch.

## Bekannte Umgebungsabweichung

Die lokal registrierte Python-3.13-Installation konnte beim Governance-Setup
das Standardmodul `typing` nicht laden. In WRN-G2-002 wurde Python nicht
verwendet. Vor Python-basierten Produkttests braucht die Toolchain eine separat
autorisierte read-only Diagnose und gegebenenfalls Reparaturfreigabe.
