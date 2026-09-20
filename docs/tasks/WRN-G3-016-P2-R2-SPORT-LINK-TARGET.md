# WRN-G3-016 P2-R2 – ehrliches Ziel fuer Alle Sportmeldungen

Stand: 30. August 2026. Basis: `df18d60`.

## Anlass und Entscheidung

Der G3-016-Vertrag verlangt `Alle Sportmeldungen`. Ein Link zum ungefilterten
Entdecken-Hub waere irrefuehrend. G3-018 wird nicht vorgezogen: G3-016 nutzt
nur den bereits vorhandenen lokalen Themenfilter und gibt den drei
selbst erstellten Sport-Layoutfixtures eine neutrale Testklassifikation.

## Alleiniger Schreibscope

- `packages/test-support/src/g3-016-home-fixtures.ts`
- `packages/test-support/tests/g3-016-home-fixtures.test.ts`
- `apps/mobile/public/wrn-local-release/v1/discover-index.json`
- `apps/mobile/public/wrn-local-release/v1/release-descriptor.json`
- eigene Evidence `docs/evidence/WRN-G3-016/backend-r2/**`
- eigener Handoff `docs/handoffs/WRN-G3-016-backend-r2.md`

Keine andere Datei ist schreibbar. Website, App/UI, Contracts, Domain, Loader,
Artikeltexte, Reader/Lifecycle/Manifest/Publication, Sprachen und Governance
bleiben read-only.

## Exakter Vertrag

Die drei bereits gebundenen Sportrollen erhalten im lokalen Discover-Index:

- Feature `wrn-test-art-g3-016-d`: `Sport`, `Fussball`;
- Secondary `wrn-test-art-g3-016-e`: `Sport`, `Fankultur`;
- Secondary `wrn-test-art-g3-016-f`: `Sport`, `Frauen`.

Alle anderen Eintraege bleiben unveraendert. Dies sind ausschliesslich
neutrale, selbst erstellte Layout-/Filterfixtures ohne reale Behauptung oder
redaktionelle Klassifikation. Descriptorhash und Public-JSON werden aus
derselben Generatorquelle neu gebunden. P3 darf danach beim Aktivieren von
`Alle Sportmeldungen` den vorhandenen Discoverfilter `topic: Sport` setzen.

## Tests und Stop

Test muss exakt drei Ergebnisse fuer `Sport` sowie je genau ein Ergebnis fuer
die drei Unterthemen belegen. Contract-/Test-Support-, Releaseboundary- und
gezielte Mobile-Foundationpruefung muessen GREEN bleiben. Bei Bedarf nach
weiteren Pfaden, echter Taxonomie, neuem Filtervertrag oder Websiteaenderung:
STOP an Chief. Keine Kinder, keine Dependencies, kein Netzwerk.

END-CHECK: :)
