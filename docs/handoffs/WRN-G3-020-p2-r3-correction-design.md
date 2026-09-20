# Agent Handoff – WRN-G3-020 P2-R3 Correction Design

- Agent/Task: `/root/g3020_p2_r3_design`, unabhaengiger Sol/high-
  Architekturdesigner
- Elternagent: Chief `/root`
- Basis/Kandidat: `cc800a2` / `906ddc4`
- QA/Security: `08b2cba`; `b799679`, Scan
  `872b4cf5-2ef7-467b-bfdf-9fabdcb4ff8a`
- Ergebnis: **Design GREEN; P2-Produktgate weiter FAIL-CLOSED**
- Kinder: keine
- Schreibscope: nur diese zwei Dokumente; kein Produkt-, Test-, Fixture- oder
  Browserwrite

## Kurzfazit

Die Union aus `active|candidate|previous` ist als Replacementreferenzregister
unzureichend. Nach mehreren Rotationen kann ein legitim referenziertes altes
Ziel aus allen drei Slots verschwinden, waehrend das monotone Safetyledger den
Takedown behalten muss. Das bevorzugte und einzige gebundene Design erweitert
den noch unveroeffentlichten SafetyRecord-v1 um einen hashgebundenen,
monotonen, auf 1.024 Referenzen und insgesamt 64 KiB gecappten
`references`-Katalog aus exakten Namespace/ID-Paaren. Er wird ausschliesslich
aus dem validierten Sourcebundle abgeleitet und im Safetyhash gebunden.
Bundle-/Transportmetadaten werden nicht redundant pro Reference gespeichert,
weil sie nach Slotrotation keine zusaetzliche verifizierbare Sicherheit
liefern und die 64-KiB-Grenze unnoetig belasten wuerden.

Der finale Merge wird vor dem ersten `put` auf 512 Entries, 1.024 References
und 65.536 Bytes geprueft. Es gibt keine Eviction. Overflow verwirft das neue
Update und behaelt alte Takedowns bytegleich. Safety persist-before schreibt
Safety plus `control.safetyRevision`, aber keine Generation; erst die
erfolgreiche atomare Rotation erhoeht die oeffentliche Generation exakt um
eins. So bleiben Safety-first, CAS und R2-Generation gleichzeitig erfuellt.

## Findings und Disposition

- QA `M-001`: durch persistierte, hashgebundene Referenzprovenienz und
  fail-closed Snapshotvalidierung designseitig geschlossen.
- QA `M-002`: vollstaendige Contract-/Cap-/Future-/Fehler-/A1-B2-A3-/
  Rollback-/Resurrection-/Zwei-Tab-IDB-Matrix exakt gebunden.
- Security `P2-R1-S-L-001`: finaler Count-/Bytecap zwingend vor dem ersten
  Write; Restart nach Reject bytegleich.
- Neue Findings: keine.

## Schema- und Migrationsentscheidung

DB-Name, DB-Version 1 und die drei Stores bleiben unveraendert. Da G3-020 noch
nicht ausgeliefert wurde, ist das korrigierte Recordschema die finale v1.
Pre-R3-Safetyrecords ohne `references` werden `protected` und niemals
automatisch migriert, normalisiert oder geloescht. Nur isolierte Test-DBs
werden durch den Harness entfernt.

## Allowlist und Gates

Die bestehende Produkt-/Testallowlist reicht; keine Erweiterung oder
Dependency ist erforderlich. Die Evidence bindet eine engere zwoelfteilige
Writer-Allowlist aus den zehn vorhandenen Contract-/Mobile-/E2E-Pfaden plus
eigener Writer-Evidence und eigenem Handoff. Fixture/Pin, UI, Website, Shared-
Reader, Content-v1, G3-017, Governance, Config/Lock, Provider und externe
Gates bleiben OUT.

Vor P2-GREEN sind erforderlich:

1. Chief-Korrekturvertrag;
2. genau ein Terra/high-Writer;
3. Chief-Reproduktion der vollen Matrix mit Node 24.19 und echter IDB;
4. frische Terra-QA schliesst `M-001/M-002`;
5. versiegelter Sol-Deltacheck schliesst `P2-R1-S-L-001` mit null
   reportable/deferred;
6. finaler Sol-Architekturabschluss.

P3 startet nicht automatisch. Website, Provider, Live/Hosting,
Android/AAB/Play, Signierung, Upload, Deployment und Release bleiben
gesperrt.

## Beleg

Vollstaendiger Vertrag, Exact schemas, Hashpraeimage, Caps, Merge,
Persist-before, Generation, Slotrotation, Stopregeln und Recheckmatrix:
`docs/evidence/WRN-G3-020/P2-R3-CORRECTION-DESIGN.md`.

Bestehende fokussierte Matrix reproduziert mit Node `v24.19.0`: vier Dateien,
11 Tests PASS. Sie ist keine Schliessung der fehlenden Negativmatrix.

## Rechteuebergabe

Nach dem exakten Zwei-Dokumente-Commit enden dieser Schreibscope und Slot.
Alle Rechte gehen an Chief `/root` zurueck. Fremde parallele
Delegationsregisteraenderungen wurden nicht beruehrt.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R3-Correction-Design
- Status: Design GREEN; Produktkandidat weiter fail-closed
- Basis/Kandidat: `cc800a2` / `906ddc4`
- Findings: drei bekannte Findings exakt adressiert, null neue
- Allowlist: bestehend ausreichend; enger Teilumfang gebunden
- Rechte: nach Zwei-Dokumente-Commit an Chief zurueck
- Naechster Schritt: Chief bindet den Korrekturvertrag
- END-CHECK: :)
