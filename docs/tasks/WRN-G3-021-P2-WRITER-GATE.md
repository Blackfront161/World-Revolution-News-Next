# WRN-G3-021 P2 – Chief-Writergate

Status: **P1 GREEN – GENAU EIN P2-BACKEND-/DATA-WRITER RESERVIERT**

## Gatebasis

- PO-100 startete G3-021.
- finaler P1-R3-Reviewbasiscommit:
  `bad73c74460f12a60e2614727deecb78ad715087`.
- R3-Vertragscommit:
  `e4c7cd59008af626556bda0fa88080e36ae82ae5`.
- finaler GREEN-Belegcommit:
  `425f5a094a6fa7a7d7160ff217a41df5f182115d`.
- Ergebnis: null Findings; Package plus zehn Boundaryhashes und drei
  Fixturepraeimages stimmen.

Normativ und in dieser Reihenfolge gelten:

1. `WRN-G3-021-P2-DATA-ADMISSION-RIGHTS.md`,
2. `WRN-G3-021-P2-R1-CONTRACT-COMPLETION.md`,
3. `WRN-G3-021-P2-R2-FINAL-CONTRACT.md`,
4. `WRN-G3-021-P2-R3-TRANSITION-AND-BASIS-CORRECTION.md`.

Bei Widerspruch gilt der spaetere Nachtrag, ansonsten die strengere
fail-closed-Regel. Fehlender Vertrag = Stop beim Chief, keine Erfindung.

## Alleiniger Writer

Genau ein `backend_data_reliability_engineer`, Terra/high, darf P2 linear
implementieren. Keine Kinder, keine parallelen Produkt-/Testwriter, keine
Selbsterweiterung von Scope oder Pfaden. Der folgende Register-Bindungscommit
wird als voller Writerbasis-SHA vor Start in Agentenauftrag und Handoff
genannt. Die bekannten unversionierten Codexordner sind OUT.

## Wortwoertliche 21-Pfad-Allowlist

1. `packages/content-contracts/package.json`
2. `packages/content-contracts/src/mobile-media-v1.ts`
3. `packages/content-contracts/tests/mobile-media-v1.test.ts`
4. `apps/mobile/src/mobile-media-release.ts`
5. `apps/mobile/src/mobile-media-release.test.ts`
6. `apps/mobile/src/mobile-media-catalog-store.ts`
7. `apps/mobile/src/mobile-media-catalog-store.test.ts`
8. `apps/mobile/public/wrn-mobile-media/v1/mobile-media-release.json`
9. `apps/mobile/public/wrn-mobile-media/v1/media-manifest.json`
10. `apps/mobile/public/wrn-mobile-media/v1/media-admission.json`
11. `apps/mobile/public/wrn-mobile-media/v1/media-rights.json`
12. `apps/mobile/public/wrn-mobile-media/v1/media-consent.json`
13. `apps/mobile/public/wrn-mobile-media/v1/media-lifecycle.json`
14. `apps/mobile/public/wrn-mobile-media/v1/media-revocation.json`
15. `apps/mobile/public/wrn-mobile-media/v1/episode-local.wav`
16. `apps/mobile/public/wrn-mobile-media/v1/episode-local.png`
17. `apps/mobile/public/wrn-mobile-media/v1/episode-local.txt`
18. `tests/e2e/g3-021-media-catalog-store-harness.ts`
19. `tests/e2e/g3-021-media-catalog-store.spec.ts`
20. `docs/evidence/WRN-G3-021/P2-DATA-ADMISSION-RIGHTS.md`
21. `docs/handoffs/WRN-G3-021-p2-data-admission-rights.md`

Nur Position 1 ist ein Bestandswrite; Prehash
`19fda392db9ee15a71d00dd83505f564b2bcb801917c54ffcf66818b22d923a3`,
und nur der exakt gebundene additive Subpath ist erlaubt. Alle anderen Pfade
sind neu. Zusaetzlicher oder geaenderter OUT-Pfad = sofortiger Stop.

## Pflichtumsetzung und Belege

- sieben exakte JSON-Vertraege, Loader und eigener atomarer Medienkatalog-
  IDB-Store gemaess C-01 bis C-20 und R1 bis R3;
- drei exakt reproduzierbare, selbst erstellte lokale Fixtures mit den
  gebundenen Bytes/Hashes; kein Alt-/AAB-/Internetasset;
- keinerlei Player, UI, Resume, Provider, Request zu echten Quellen oder neue
  Dependency;
- vollstaendige Exact-key-/Type-/Order-/Cross-cover-/Freshness-/Safety-/Cap-
  und Atomicity-Negativmatrix;
- echte Browser-IDB-Pfade fuer active/candidate/previous, A/B/A, Future-Raw,
  Safety persist-before, Failure/Quota/Abort/Readback;
- beide relevanten Typechecks, fokussierte Contract-/Mobileunits, Browser-IDB,
  19 Boundaries, Format/Lint, Release-/Fixturehashes und Diffcheck;
- Evidence nennt exakte Kommandos/CWD/Exit, Bytes/Hashes, Basis-/Ergebnis-SHA,
  alle geaenderten Pfade und unveraenderte Schutz-Hashes.

## Abbruch und Rechteende

Stop bei Finding, unklarem Vertrag, Test-/Hashfehler, OUT-Pfad, neuer
Dependency/Kosten, Netzwerk/Provider oder nicht reproduzierbarer Fixture.
Kein stilles Reparieren anderer Bereiche. Writer sichert einen einzelnen
linearen Ergebniscommit, uebergibt Handoff und alle Rechte an Chief. Erst
danach folgen Chief-Reproduktion, frische Terra-QA, Sol-Security/Privacy und
finaler Sol-Architekturabschluss. P3 bleibt gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2`
- Status: P1 GREEN; ein Terra/high-Writer vorreserviert
- Produktrechte: nur nach folgendem Register-Bindungscommit und Agentenstart
- P3/UI/Website/echte Quellen/Provider/externe Gates: gesperrt
- END-CHECK: :)
