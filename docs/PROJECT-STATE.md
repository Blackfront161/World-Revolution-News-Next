# WRN Project State

Stand: 23. August 2026

## Aktuelle Phase

- Phase: G2 abgenommen; Wave 0/Vorimplementierungsbelege
- Task: `WRN-G2-003`; naechster vorbereiteter Task `WRN-G2-004`
- Ausgangscheckpoint: `be3a43e`
- Gate: **YELLOW – konservativer Rechteweg entschieden und G3-Foundation
  vorbereitet; autorisiertes Liveinventar noch offen**
- `GO-IMPLEMENTATION`: **nicht erteilt**
- Produktcode, Scaffolding, Dependencies, Build, Server, Livezugriff,
  Deployment, Signierung und Upload: keiner
- aktive Subagenten/Mitarbeiterinstanzen: keine

## Verbindliche Quellen

- App: `wrn-github-app-current@2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- sichtbarer App-Runtime-Release:
  `968c320adfe87d1e11e88f99f448a435d4242750`
- Website:
  `wrn-web-portal-2026-08-20-r10n-work@9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Datenbeobachtung: `acec88ef40814f70c1bb45001e397a6ca5872ed7`
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
- PO-014 schliesst Qood vollstaendig aus. Git-Grep belegt keine
  Runtimeverwendung; ein Ersatz ist fuer Paritaet nicht erforderlich.
- PO-015 verbietet den Import ungeklaerter Markenassets und verlangt neue
  Originalassets mit separatem visuellem Product-Owner-Gate.

## Neue Wave-0-Belege

- Asset-/Rechteregister:
  `docs/evidence/WRN-G2-002-ASSET-RIGHTS-REGISTER.md`
- lokales Infrastrukturinventar:
  `docs/evidence/WRN-G2-002-LOCAL-INFRASTRUCTURE-INVENTORY.md`
- Stack-/Lizenzbeleg:
  `docs/evidence/WRN-G2-002-STACK-AND-LICENSE-EVIDENCE.md`
- Font-/Marken-Neuschaffungsbrief:
  `docs/evidence/WRN-G2-003-FONT-AND-BRAND-RECREATION-BRIEF.md`
- vorbereiteter erster Code-Task:
  `docs/tasks/WRN-G3-001-FIRST-CODE-READINESS.md`
- vorbereiteter read-only Liveinventar-Task:
  `docs/tasks/WRN-G2-004-READ-ONLY-LIVE-INVENTORY.md`
- Task/Handoff:
  `docs/tasks/WRN-G2-002-PREIMPLEMENTATION-EVIDENCE.md` und
  `docs/handoffs/WRN-G2-002-preimplementation-evidence.md`

## Wesentliche Feststellungen

1. `Qood.ttf` ist lizenzrechtlich ungeeignet, wird aber in keiner verbindlichen
   App-/Website-Runtime referenziert. PO-014 schliesst ihn ohne Paritaetsverlust
   aus; kein Fontkauf und kein Qood-Ersatz ist notwendig.
2. Hashes der Markenbilder sind erfasst. PO-015 behandelt sie nur als visuelle
   Baseline; neue Originalassets erhalten eine eigene Rechte-/Hashkette.
3. Legacy besitzt lokal zwei Worker-Deployables, waehrend das akzeptierte Ziel
   mindestens fuenf getrennte fachliche Deploy-/Rollbackeinheiten vorsieht.
4. Lokale Configs belegen keine Liveversion, Tarife, Nutzung, Retention oder
   wirksame Hard Caps. Ein Liveinventar bleibt vor Servicearbeit Pflicht.
5. React/TypeScript/Vite/Capacitor bleibt die akzeptierte Stackrichtung. Exakte
   kompatible Versionen und Lockfile werden erst im freigegebenen Foundation-
   Task reproduzierbar fixiert.

## Offene Gates

1. Product Owner autorisiert `WRN-G2-004` mit `LIVE-INVENTAR STARTEN`; keine
   Secretwerte oder externen Mutationen sind erlaubt.
2. Das Liveinventar klaert Worker, Bindingsarten, Hosting, Provider, Plan,
   Usage, Retention, Lifecycle, Kosten und Rollbackgrenzen.
3. SEC-001/002 bleiben vor Translation-/Podcastportierung, SEC-003 vor Push
   offen.
4. Legacycode und Medien werden weiterhin nur pro Element mit Rechtebeleg
   importiert; WRN-G3-001 importiert nichts davon.
5. `GO-IMPLEMENTATION` bleibt nach Liveinventar ein separater ausdruecklicher
   Befehl.

## Naechste empfohlene Aktion

Product Owner startet `WRN-G2-004` mit `LIVE-INVENTAR STARTEN`. Nach dessen
read-only Bericht und Review kann er separat `GO-IMPLEMENTATION` fuer den
bereits eng begrenzten Task `WRN-G3-001` erteilen.

## Bekannte Umgebungsabweichung

Die lokal registrierte Python-3.13-Installation konnte beim Governance-Setup
das Standardmodul `typing` nicht laden. In WRN-G2-002 wurde Python nicht
verwendet. Vor Python-basierten Produkttests braucht die Toolchain eine separat
autorisierte read-only Diagnose und gegebenenfalls Reparaturfreigabe.
