# Agent Handoff – WRN-G3-012 Frontend/Publisher

Stand: 27. August 2026

Produktcheckpoint: `c99fa2b`

## GREEN-Ergebnis innerhalb des Frontend-Scopes

Die getrennten Mobile- und Websiteadapter beziehen einen atomar validierten
lokalen G3-012-Release. Jede App stellt ihre kontrollierten JSON-Artefakte
unter `/wrn-local-release/v1` bereit; alle Artefakte binden dieselbe erwartete
Revision, denselben Manifesthash und dieselbe ID-Menge. Feed, Discover,
Reader, Lifecycle und Website-Publication entstehen ausschliesslich nach
vollstaendiger Descriptorpruefung als ein gemeinsamer `ready`-Wert.

Die statische Website-Landingpage-Generierung benutzt jetzt denselben
Website-Release-Descriptor statt `packages/test-support`. Die beiden
Produktpackages haben keine `@wrn/test-support`-Runtime-Dependency mehr.
`check:release-boundaries` ist fuer den echten, finalen Build-/Publisher-
und Artefaktstand GREEN.

Die bisherigen sichtbaren Kompositionen wurden nicht gestaltet oder
funktional erweitert. Als bewusst sichtbare Datenkonsolidierung folgt auch
das kleine Archiv jetzt derselben aktuellen Release-ID-Menge wie die restlichen
Produktprojektionen; Gone und Revoked bleiben payloadfrei und fail-closed.

## Ausgefuehrte Checks

- Format: PASS;
- Lint plus 19 Boundarytests: PASS;
- alle Workspace-Typechecks: PASS;
- 133 Unit-/Contract-/Komponententests: PASS;
- Mobile- und Website-Build: PASS;
- `check:release-boundaries`: PASS;
- voller Browser-E2E-Lauf: 61 PASS, 142 erwartete Skips, null Fehler;
- zusaetzliche fokussierte Release-/Preview-/Archivmatrix: 11 PASS,
  10 erwartete Skips.

Die lokale Laufzeit ist Node 24.16.0 statt des gebundenen 24.19.0. Deshalb
bleibt nur das vorgeschaltete Gesamtskript erwartungsgemaess gestoppt; dieser
bekannte Toolchainpunkt wurde nicht umgangen. Alle relevanten Einzelchecks
sind GREEN.

## Naechster einzig erlaubter Mitarbeiter

Genau ein frischer, unabhaengiger `qa_release_engineer` darf den unveraenderten
Kandidaten pruefen und ausschliesslich G3-012-QA-Evidenz und seinen Handoff
schreiben. Seine Matrix umfasst mindestens:

1. Mobile, Website und Publisher: gleiche Descriptorrevision,
   Manifesthash und ID-Mengen;
2. atomare Fehlerfaelle einschliesslich MIME, Status, Redirect, Timeout,
   Abbruch, Uebergroesse, fehlerhaftem JSON, unknown und optional-absent;
3. null externe Requests sowie null Storage-/Cache-/Service-Worker-Wirkung;
4. finale Artefakt- und Releaseboundarypruefung;
5. volle bestehende G3-002-bis-G3-011-Regression und visuelle Paritaet.

Bei jedem Finding wird gestoppt. Kein Produktcode, keine Vertrage, keine
Tests, keine Artefakte und keine externe Aktion darf durch QA geaendert
werden. Erst ein GREEN-QA-Handoff kann dem Main Agent den Kandidaten zur
Product-Owner-Abnahme vorlegen.

## WRN-AGENT-STATUS

- Task: WRN-G3-012 Immutable Content Revision Consumer – Frontend/Publisher
- Status: GREEN, Produktcheckpoint `c99fa2b`
- Kosten: 0 CHF, keine Provider-, Netzwerk- oder Liveaktion
- Offene Arbeit: ausschliesslich unabhaengige G3-012-QA
- Unerlaubte Aenderungen: 0
- END-CHECK: :)
