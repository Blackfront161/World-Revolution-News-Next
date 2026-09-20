# WRN-G3-021 P2-R1 – Chief-Writergate

Status: **GREEN – GENAU EIN TERRA/HIGH-KORREKTURWRITER DARF STARTEN**

## Gatekette

- Produktkandidat: `296119e25b5c5a078748d6a6d51cc5eef0b8899e`.
- QA-/Securityfindingcommit: `eec64d1`.
- erster Korrekturvertrag: `7120f7150acd15433514febffd4968485bc2843b`.
- erster RED-Precheck: `4c841ce`.
- R1-Praezisierungscommit:
  `afe0d0592856d3f69561cf6111703e93dbdeab2c`.
- frischer GREEN-Recheck mit null Findings: `e66b241`.

Normativ gilt vollstaendig
`docs/tasks/WRN-G3-021-P2-R1-PRODUCT-CORRECTION.md` auf dem R1-Stand
`afe0d05`, zusammen mit den strengeren unveraenderten P2-/R1-/R2-/R3-
Grundvertraegen. Fehlende oder widerspruechliche Regel = Stop beim Chief.

## Alleiniger Writer und Scope

Genau ein frischer `backend_data_reliability_engineer` Terra/high darf ohne
Kinder linear arbeiten. Er ist nicht Integrationsowner, erweitert keine
Allowlist und committet erst nach vollstaendiger eigener GREEN-Matrix.

Wortwoertliche zehnpfadige Allowlist:

1. `packages/content-contracts/src/mobile-media-v1.ts`
2. `packages/content-contracts/tests/mobile-media-v1.test.ts`
3. `apps/mobile/src/mobile-media-release.ts`
4. `apps/mobile/src/mobile-media-release.test.ts`
5. `apps/mobile/src/mobile-media-catalog-store.ts`
6. `apps/mobile/src/mobile-media-catalog-store.test.ts`
7. `tests/e2e/g3-021-media-catalog-store-harness.ts`
8. `tests/e2e/g3-021-media-catalog-store.spec.ts`
9. `docs/evidence/WRN-G3-021/P2-R1-PRODUCT-CORRECTION.md`
10. `docs/handoffs/WRN-G3-021-p2-r1-product-correction.md`

Alle JSONs, Assets, `.gitattributes`, Packageexport, Dependencies, UI, Player,
Website, Shared-Vertraege und bisherige Evidence bleiben bytegleich/read-only.

## Pflichtumsetzung

- frische injizierbare Clockprobe je Load-, Save-, Activate- und
  Rollbackgrenze; Current-time, TTL, Admission, Health und Rights fail-closed;
- eigener 5000-ms-Timeout pro Request samt kombiniertem externem Abort,
  Cleanup und sicherem Late-settlement;
- vollstaendige Raw-/Pin-/Hash-/Parsebindung unmittelbar an Persistenz;
- monotone Safety lower/equal/higher, additive Entryerhaltung, Caps,
  Referenzen, Replacement, Azyklizitaet, persist-before und Readback;
- Blockpruefung vor Rotation: Source/Series/Episode ID plus null Hash; Asset ID
  plus Manifest-SHA;
- gesamte Unit- und echte Chrome-/IDB-Negativmatrix des Vertrags, insbesondere
  Expiry nach Save, A/B/A, Neustart/Rollback, Quota/Abort/Readback und null
  Writes bei jedem Fehler.

## Abschluss

Writer liefert einen einzigen linearen Ergebniscommit samt Evidence/Handoff,
exakten Kommandos, Nodeversion, Exitcodes, Testfallzahlen, Diffpfaden und
Schutz-Hashes. Bei Finding, OUT-Pfad, neuer Dependency/Kosten, Provider/Netz,
nicht reproduzierbarem Test oder unklarer Regel: Stop ohne Teilfreigabe.

Danach folgen zwingend Chief-Reproduktion, frische Terra-QA, versiegelter
Sol-Security-/Privacy-Deltacheck und finaler Sol-Architekturabschluss. P3,
UI/Player, echte Quellen/Medien und alle externen Gates bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R1-WRITER-GATE`
- Status: GREEN; genau ein Terra/high-Writer darf nach Gatecommit starten
- Writerbasis: der folgende Register-/Gatecommit
- Schreibscope: exakt zehn Pfade
- P3/extern: gesperrt
- END-CHECK: :)
