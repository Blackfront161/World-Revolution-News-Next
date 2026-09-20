# WRN-G3-021 P2-R3 – Chief-Writergate

Status: **VERTRAG GREEN – GENAU EIN TERRA/HIGH-KORREKTURWRITER DARF NACH DIESEM GATECOMMIT STARTEN**

## Gatekette

- Produktbasis:
  `1826ed55bd8bd4f2d5b48fe6c3c20279485a03fb`.
- unabhaengige QA: `a32d3c1` mit `P2-R2-QA-M-001`.
- defensiver Integrity-/Privacy-Review: `aa055ee` mit vier Medium-
  Integritaetsfindings und null Privacy/deferred.
- erster R3-Korrekturvertrag: `db0cdcc`.
- erster RED-Precheck: `f6feb41` mit `P2-R3-PRE-M-001`.
- R1-Vertrag mit Bundle-Selbstbindung: `483d524`.
- R1-Recheckbeleg: `56a59bc`; `P2-R3-PRE-M-001` geschlossen,
  `P2-R3-R1-M-001` offen.
- R2-Vertragscommit:
  `7c3e051b09805e99030da060a7f9f50062b7065a`.
- finaler frischer GREEN-Recheck mit null Findings: `2cd42d7`.

Normativ gilt vollstaendig
`docs/tasks/WRN-G3-021-P2-R3-INTEGRITY-ROLLBACK-TEST-CORRECTION.md` auf
`7c3e051`, zusammen mit den strengeren unveraenderten P2-/R1-/R2-/R3-
Grundvertraegen. Fehlende oder widerspruechliche Regel, Zusatzpfad oder
notwendige Migration = Stop beim Chief.

## Alleiniger Writer und Rechte

Genau ein frischer `backend_data_reliability_engineer` Terra/high arbeitet
linear und ohne Kinder. Die volle SHA dieses folgenden Gate-/Registercommits
ist seine feste Writerbasis. Er ist nicht Integrationsowner, erweitert keine
Allowlist, benutzt keinen fremden Git-Index und committet nur bei vollstaendig
eigener GREEN-Matrix einen einzigen linearen Ergebniscommit.

Wortwoertliche Zehn-Pfad-Allowlist:

1. `packages/content-contracts/src/mobile-media-v1.ts`
2. `packages/content-contracts/tests/mobile-media-v1.test.ts`
3. `apps/mobile/src/mobile-media-release.ts`
4. `apps/mobile/src/mobile-media-release.test.ts`
5. `apps/mobile/src/mobile-media-catalog-store.ts`
6. `apps/mobile/src/mobile-media-catalog-store.test.ts`
7. `tests/e2e/g3-021-media-catalog-store-harness.ts`
8. `tests/e2e/g3-021-media-catalog-store.spec.ts`
9. `docs/evidence/WRN-G3-021/P2-R3-INTEGRITY-ROLLBACK-TEST-CORRECTION.md`
10. `docs/handoffs/WRN-G3-021-p2-r3-integrity-rollback-test-correction.md`

JSONs, Assets, `.gitattributes`, Packageexport, Dependencies, UI/Player,
Website, Shared-Vertraege, bestehende Evidence und zentrale Governance bleiben
bytegleich/read-only. Ein notwendiger elfter Pfad beendet den Writerlauf beim
Chief; er wird nicht still ergaenzt.

## Pflichtumsetzung

- R3-01: alle sechs Entryfelder byte-/strukturidentisch monoton erhalten;
  neue aktuelle ID-, Entry- und Replacementreferences exakt nach R3-02
  addieren; keine stille Entfernung oder Normalisierung.
- R3-02: sortierte dublettenfreie Exact-union aus aktuellen IDs, Entrytargets
  und Replacementtargets; fehlende oder ungenutzte References fail-closed.
- R3-03: erfolgreicher atomarer Previous-Rollback unter unveraendertem
  hoeherem Safety-Floor, frischer Raw-/Pin-/Zeit-/Admission-/Health-/Rights-
  Pruefung und bytegleichem Safetyreadback.
- R3-04: `recordVersion:1`, Exact-keys und tiefe Bundle-/Control-/Safety-
  Validierung einschliesslich Transporthash, aeusserer/raw Revision, vollem
  Rootpin und allen sechs Descriptor-/Dokumentrelationen.
- R3-05: produktiver Requesttimeout exakt 5000 ms, sofortiger externer Abort,
  explizites Transport-/Timeout-/Abort-Race und genau einmal Cleanup auch bei
  Late Resolve/Reject.
- Vollstaendige Matrix 1 bis 8 aus dem Vertrag mit benannten Fehlerkategorien,
  Nullwrites/LKG-Erhalt, positivem `higher/additive-current-ids-only` und
  ehrlicher Cap-Redundanzdisposition.

## Pflichtlaeufe und Abschluss

Writer liefert mit exakt Node 24.19 beide Typechecks, scoped Lint/Format,
vollstaendige fokussierte Contract-/Mobiletests, echte Chrome-/IDB-Matrix,
19 Boundaries, Release-/Fixturechecks, Diffcheck und alle Schutz-Hashes.
Evidence bindet Testnamen auf R3-01 bis R3-05 und Matrix 1 bis 8 sowie exakte
Kommandos, CWD, Exitcodes, Fallzahlen, Basis-/Ergebnis-SHA und Diffpfade.

Stop bei Finding, Test-/Hashfehler, unklarer Regel, Zusatzpfad, Dependency,
Migration, Fixture-/Assetwrite, Provider-/Netz-/Kostenwirkung oder nicht
reproduzierbarer Browserpruefung. Keine Teilfreigabe.

Nach dem Writer folgen zwingend und getrennt: Chief-Reproduktion, frische
Terra-QA, frischer defensiver Sol-Integrity-/Privacy-Deltarecheck und finaler
frischer Sol-Architekturabschluss. Erst vier GREEN-Ergebnisse und null offene
Produkt-, Coverage-, reportable- oder deferred Findings schliessen P2. P3,
UI/Player, echte Quellen/Medien, Provider, Website/Live, Android/Play und
Release bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R3-WRITER-GATE`
- Status: Vertrag GREEN; ein Terra/high-Writer darf nach Gatecommit starten
- Produktbasis: `1826ed55bd8bd4f2d5b48fe6c3c20279485a03fb`
- Vertragsbasis: `7c3e051b09805e99030da060a7f9f50062b7065a`
- Reviewbeleg: `2cd42d7`
- Schreibscope: exakt zehn Pfade
- P3/extern: gesperrt
- END-CHECK: :)
