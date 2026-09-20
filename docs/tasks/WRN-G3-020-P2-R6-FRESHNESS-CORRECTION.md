# WRN-G3-020 P2-R6 – bundleuebergreifende Freshnesskorrektur

Status: **GEBUNDEN; PRODUKTWRITE BIS ZU FRISCHEM SOL-PRECHECK-GREEN GESPERRT**

## Anlass und Ziel

Der finale Sol-P2-Abschluss `91824d2` reproduziert genau ein Medium:
`G3-020-P2-FINAL-M-001`. Der oeffentliche Bundlevalidator erzwingt die in
R1-02 gebundenen Zeitrelationen nicht vollständig. Dieser enge Vertrag
schliesst ausschliesslich diese Admissionluecke; P3 bleibt gesperrt.

## Erforderliche Produktsemantik

Nach Exact-schema- und Timestamppruefung muss der oeffentliche
`validateRegionalEventBundle()` fuer jedes Element fail-closed erzwingen:

1. Source: `publishedAt <= observedAt <= bundle.generatedAt`.
2. Event: `publishedAt <= observedAt <= bundle.generatedAt`.
3. Event: `bundle.generatedAt < event.validUntil`.
4. Event: `event.validUntil <= bundle.validUntil`.

Verglichen werden die bereits kanonisch validierten UTC-Epoch-Millisekunden.
Die Elementvalidatoren bleiben ohne versteckten globalen Kontext; die vier
bundleuebergreifenden Relationen werden im Bundlevalidator direkt nach den
elementweisen Exact-/Timestamppruefungen und vor Hashannahme erzwungen.
Keine Zeit wird korrigiert, geklemmt oder still ersetzt.

## Exakte Writer-Allowlist nach Precheck-GREEN

Genau ein `backend_data_reliability_engineer`, Terra/high:

1. `packages/content-contracts/src/mobile-regional-events-v1.ts`
2. `packages/content-contracts/tests/mobile-regional-events-v1.test.ts`
3. `docs/evidence/WRN-G3-020/P2-R6-FRESHNESS-CORRECTION.md`
4. `docs/handoffs/WRN-G3-020-p2-r6-freshness-correction.md`

Keine Kinder, kein Index/Commit durch den Writer, keine weiteren Pfade.
Loader, Store, Auswahl, Projektion, Fixture/Pin, Browsertests, App, Website,
Config, Dependencies und Lockfile bleiben read-only.

## Pflicht-Negativ-/Grenzmatrix

Alle mutierten Objekte werden mit den kanonischen Preimagefunktionen neu
gehasht, damit kein frueheres Hashorakel die Zeitrelation verdeckt.

- Source: `observedAt == generatedAt` positiv; `generatedAt + 1 ms` negativ.
- Event observed: `observedAt == generatedAt` positiv;
  `generatedAt + 1 ms` negativ.
- Event lower envelope: `validUntil == generatedAt` negativ;
  `generatedAt + 1 ms` positiv.
- Event upper envelope: `validUntil == bundle.validUntil` positiv;
  `bundle.validUntil + 1 ms` negativ.
- Bestehende Bundlegrenzen und unveraenderte Fixture bleiben GREEN.

## Pflichtlaeufe und Folgegates

- fokussierte Contractdatei und volle Content-Contracts-Suite;
- volle Mobileunits und beide Typechecks;
- Format/Lint, 19 Boundaries, Releaseboundary, Fixtureprovenienz;
- drei G3-020-Browserspecs gemeinsam, 16/16 ohne Zielskip;
- neun explizite Hashpositionen: Die geaenderte Contractmodulquelle besitzt
  vor dem Fix SHA-256
  `8c42bade5807cb03709b8b987dda596b1f2fd9ab77b2a6fd4d04e33dd549a6eb`
  und darf einen neuen Nachhash erhalten. Die folgenden bisherigen acht
  Grenzen muessen dagegen bytegleich bleiben:
  1. Fixture/Pin `f39fb174a5bdb5a958713a9801178e404fb476662b52afd5e5d9c5f68c08f907`;
  2. Contract-Index `6dc6288929c199932c346de185b4b871b1e5e06da5a0b9051f8162ee56e4a263`;
  3. Mobile Local Release `cb2fa06fd6c94f8b078030ab5eecd81031b178647d653d99fd56ef6ca94a9df4`;
  4. Mobile Offline Store `c1dcc87c0caddb42d6f8b5559b1eea05d915841f473edafb0bbc8d09edfa6699`;
  5. Mobile Offline Controller `d60702a56a3e7e2b49ee788a49398c2be1352a09b30d3d90b889321a4f9f0547`;
  6. Mobile Personalization `2a6944c6b2e3338e88ee657a76a51085c77264b79df6b25929f53281dc01beb7`;
  7. Mobile Reader v2 `7cc34081151f0d0a9018638cf93cbf586a88510aa12d990034fdca463f688466`;
  8. Website Local Release `4a0c8e651d9549ace0ba75cdfdef30b02ff5b96657cde96e0c3a51a1e73c6a01`.

Danach folgen frische unabhaengige Terra-QA, ein enger versiegelter Sol-
Security-Deltacheck und ein neuer Sol-P2-Abschluss. Kein GREEN ueberspringt
ein Folgegate.

## Precheck

Vor Produktwrite prueft ein frischer `independent_architecture_reviewer`
Sol/high read-only genau diesen Vertrag gegen Finding und Quellstruktur. Er
schreibt nur:

1. `docs/evidence/WRN-G3-020/P2-R6-FRESHNESS-PRECHECK-R1.md`
2. `docs/handoffs/WRN-G3-020-p2-r6-freshness-precheck-r1.md`

Nur null offene Findings erteilen dem Terra-Writer die obige Allowlist.

## WRN-AGENT-STATUS

- Task: WRN-G3-020 P2-R6 Freshnesskorrektur
- Status: gebunden; Produktwrite gesperrt
- Basis: `6fb10df`; Findings `G3-020-P2-FINAL-M-001` und
  `G3-020-P2-R6-PRE-L-001`
- Rechte: Chief; Precheck nur zwei eigene Berichte
- Naechster Schritt: frischer enger Sol-R1-Recheck
- END-CHECK: :)
