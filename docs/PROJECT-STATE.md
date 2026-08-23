# WRN Project State

Stand: 23. August 2026

## Aktuelle Phase

- Phase: G2 abgenommen; Wave 0/Liveinventar
- Task: `WRN-G2-004` – gestartet, teilweise belegt
- Ausgangscheckpoint: `841d74c`
- Gate: **YELLOW – GitHub und offizielle Providerbaseline belegt;
  Cloudflare-/Hostinger-Kontoinventar wartet auf Product-Owner-Login**
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
- aktiver read-only Liveinventar-Task:
  `docs/tasks/WRN-G2-004-READ-ONLY-LIVE-INVENTORY.md`
- vorlaeufiger Livebericht:
  `docs/evidence/WRN-G2-004-LIVE-INFRASTRUCTURE-INVENTORY.md`
- aktueller Handoff:
  `docs/handoffs/WRN-G2-004-live-inventory-partial.md`
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
4. Legacy besitzt lokal zwei Worker-Deployables, waehrend das akzeptierte Ziel
   mindestens fuenf getrennte fachliche Deploy-/Rollbackeinheiten vorsieht.
5. Cloudflare/Hostinger verlangen eine Anmeldung. Lokale Configs und
   oeffentliche Tarife belegen keine Liveversion, Nutzung, Retention oder
   wirksame Hard Caps.
6. React/TypeScript/Vite/Capacitor bleibt die akzeptierte Stackrichtung. Exakte
   kompatible Versionen und Lockfile werden erst im freigegebenen Foundation-
   Task reproduzierbar fixiert.

## Offene Gates

1. Product Owner meldet sich selbst in den geoeffneten Cloudflare- und
   Hostinger-Tabs an und antwortet `LIVE-INVENTAR BEREIT`; keine Zugangsdaten
   werden uebergeben.
2. Das Liveinventar vervollstaendigt Worker, Bindingsarten, Hosting, Provider,
   Plan, Usage, Retention, Lifecycle, Kosten und Rollbackgrenzen.
3. SEC-001/002 bleiben vor Translation-/Podcastportierung, SEC-003 vor Push
   offen.
4. Legacycode und Medien werden weiterhin nur pro Element mit Rechtebeleg
   importiert; WRN-G3-001 importiert nichts davon.
5. `GO-IMPLEMENTATION` bleibt nach Liveinventar ein separater ausdruecklicher
   Befehl.

## Naechste empfohlene Aktion

Product Owner meldet sich in den bereits geoeffneten Cloudflare- und
Hostinger-Tabs des Codex-Browsers an und antwortet `LIVE-INVENTAR BEREIT`.
Nach dem vervollstaendigten read-only Bericht und Review kann er separat
`GO-IMPLEMENTATION` fuer den eng begrenzten Task `WRN-G3-001` erteilen.

## Bekannte Umgebungsabweichung

Die lokal registrierte Python-3.13-Installation konnte beim Governance-Setup
das Standardmodul `typing` nicht laden. In WRN-G2-002 wurde Python nicht
verwendet. Vor Python-basierten Produkttests braucht die Toolchain eine separat
autorisierte read-only Diagnose und gegebenenfalls Reparaturfreigabe.
