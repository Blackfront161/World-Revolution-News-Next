# WRN Project State

Stand: 23. August 2026

## Aktuelle Phase

- Phase: G2 abgenommen; Wave 0/Liveinventar abgeschlossen
- Task: `WRN-G2-004` – abgeschlossen und unabhaengig geprueft
- Ausgangscheckpoint: `841d74c`
- Gate: **YELLOW – G2-004 bestanden; Produkt-/Servicegates und ausdrueckliches
  `GO-IMPLEMENTATION` bleiben offen**
- `GO-IMPLEMENTATION`: **nicht erteilt**
- Produktcode, Scaffolding, Dependencies, Build, Server, Deployment,
  Signierung und Upload: keiner; externer Zugriff ausschliesslich read-only
- aktive Subagenten/Mitarbeiterinstanzen: keine

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

## Neue Wave-0-Belege

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
8. React/TypeScript/Vite/Capacitor bleibt die akzeptierte Stackrichtung. Exakte
   kompatible Versionen und Lockfile werden erst im freigegebenen Foundation-
   Task reproduzierbar fixiert.

## Offene Gates

1. Separate Google-/Azure-/Hugging-Face-Konten bleiben unverifiziert; die
   entsprechenden neuen Adapter bleiben auf 0 CHF und deaktiviert.
2. Kill-Switch-, Fail-closed- und globale Hard-Cap-Wirkung der Legacydienste
   bleibt `UNVERIFIED`; in der Foundation sind alle Dienste aus.
3. R-26/R-29 sowie SEC-001/002 bleiben vor Translation-/Podcastportierung,
   SEC-003 vor Push
   offen.
4. Legacycode und Medien werden weiterhin nur pro Element mit Rechtebeleg
   importiert; WRN-G3-001 importiert nichts davon.
5. `GO-IMPLEMENTATION` bleibt nach Liveinventar ein separater ausdruecklicher
   Befehl.

## Naechste empfohlene Aktion

Der Product Owner kann den geprueften Livebericht abnehmen und separat
`GO-IMPLEMENTATION` fuer den eng begrenzten, rein lokalen und dienstfreien Task
`WRN-G3-001` erteilen. Der Befehl erlaubt keine Servicearbeit, Assetportierung,
Remoteerstellung, Bereitstellung, Signierung oder Veroeffentlichung.

## Bekannte Umgebungsabweichung

Die lokal registrierte Python-3.13-Installation konnte beim Governance-Setup
das Standardmodul `typing` nicht laden. In WRN-G2-002 wurde Python nicht
verwendet. Vor Python-basierten Produkttests braucht die Toolchain eine separat
autorisierte read-only Diagnose und gegebenenfalls Reparaturfreigabe.
