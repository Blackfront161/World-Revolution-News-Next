# WRN-G3-016 P2 – Homevertrag, Admission und Mobile-Fixture

Stand: 30. August 2026. Basis: `4ae0dfa`. Owner nach Orientierung:
`/root/g3016_backend_orientation`. Status: **SCHREIBFREIGABE NACH CHECKPOINT**.

## Ziel

Eine additive, atomar an dieselbe lokale Release-Revision gebundene
Home-Praesentationsprojektion mit exakt neun eindeutigen Artikel-IDs:

- 1 Aufmacher;
- 5 geordnete Hauptmeldungen;
- 1 grosse und 2 kleine Sport-/Fankulturkarten.

Die drei bestehenden IDs bleiben erhalten. Alle neuen Inhalte sind neutrale,
selbst erstellte lokale Fixtures ohne reale Personen, Gruppen, Ereignisse,
politische Aussagen oder Drittmedien. Websiteprodukt und Websitefixture
bleiben unveraendert.

## Alleiniger Schreibscope

- `packages/content-contracts/src/index.ts`
- `packages/content-contracts/tests/manifest-v1.test.ts`
- neu `packages/content-contracts/tests/home-presentation-v1.test.ts`
- neu `packages/test-support/src/g3-016-home-fixtures.ts`
- neu `packages/test-support/tests/g3-016-home-fixtures.test.ts`
- exakt diese Mobile-Artefakte unter
  `apps/mobile/public/wrn-local-release/v1/`:
  `articles.json`, `manifest.json`, `discover-index.json`,
  `reader-details.json`, `archive-lifecycle.json`,
  `website-publication.json`, `release-descriptor.json`
- `tests/e2e/foundation.spec.ts` nur fuer die bestehende gemeinsame
  Mobile-/Website-Revisions-/ID-Annahme
- eigene Evidence `docs/evidence/WRN-G3-016/backend/**`
- eigener Handoff `docs/handoffs/WRN-G3-016-backend.md`

Keine andere Datei ist schreibbar. Insbesondere read-only: ganzes
`apps/website/**`, beide `App.tsx`, Styles, UI-Sprachkataloge, Domain, Brand,
Reader/Reading-State/Discover-/Offline-Store-/Controller-/Loaderquellen,
Transport/Resource-Allowlist, `supplemental-items.json`, bestehende
G3-002-Provenienzfixture, Legacy/Live und Governance.

## Vertrag

`LocalManifestV1` erhaelt ein rueckwaertskompatibles optionales
`homePresentation`-Envelope. Alte Manifeste ohne das Feld bleiben gueltig.
Ist das Feld vorhanden, fliesst es in den bestehenden kanonischen
Manifesthash; der Release-Descriptor bindet damit Inhalt und Rollen atomar.
Kein neuer Fetch, keine neue Resource, Dependency oder zweite Quelle.

Das Envelope enthaelt ausschliesslich Rollen-/ID-/Zeit-/Kategorieangaben:

- `leadId`;
- geordnete `mainIds` mit exakt fuenf IDs;
- Sport: `featureId`, geordnete `secondaryIds` mit exakt zwei IDs,
  zulässige Kategorien `football|fanculture|women`, `checkedAt`, `validUntil`.

Keine URL-, Medien-, Personen-, Gruppen-, Quellen- oder Politikfelder. Der
Projektor erhaelt validierte Artikel derselben Revision und eine explizite Uhr.
Nur neun eindeutige, vorhandene IDs und gueltige Zeit-/Taxonomieregeln liefern
`ready`. Fremde/doppelte/falsch gezaehlte/abgelaufene Sportrollen liefern
fail-closed `sport-not-current` mit leerer Sportprojektion, niemals Ersatz.

## Fixture- und Kompatibilitaetsregeln

- drei bestehende IDs plus sechs neue opake `wrn-test-art-*`-IDs;
- klar als Test-/Layoutplaceholder erkennbare Texte;
- `fixture.invalid`, lokale Testquelle,
  `fixture-authored-no-third-party-media`;
- alle Mobile-Release-Dokumente und Mengen-/Component-/Manifest-/Descriptor-
  Hashes konsistent regenerieren;
- Discover, Readerdetails, Lifecycle und die technisch mitgefuehrte Mobile-
  Website-Publikationskomponente bilden dieselben neun IDs ab;
- vorhandene drei IDs, Reader-, Reading-State-, Discover- und Offlinevertraege
  bleiben semantisch erhalten;
- Website-Public-Release bleibt bytegleich.

## Testmatrix

1. Alte Manifest-v1-Fixtures ohne `homePresentation` bleiben gueltig.
2. Exakt 1+5+1+2, feste Reihenfolge und neun eindeutige IDs bestehen.
3. Fremd-ID, jede Dublette, falsche Anzahlen, falsche Kategorie und abgelaufene
   `validUntil` ergeben ausschliesslich den ehrlichen nichtaktuellen Zustand.
4. Home-/Manifestaenderung ohne Descriptorhashupdate wird nicht ready.
5. Neuner-Fixture validiert alle sieben Mobile-Dokumente und erhaelt alte IDs.
6. Die sieben Public-JSONs sind semantisch identisch zur Generatorquelle;
   `supplemental-items.json` bleibt bytegleich.
7. `foundation.spec.ts` bindet getrennt: Mobile neue G3-016-Revision/neun IDs,
   Website unveraendert bisherige Revision/drei IDs; kein Cross-Equality mehr.
8. Contract-/Test-Support-Tests, Releaseboundary, beide Typechecks und eng
   relevante bestehende Regressionen GREEN. Volle UI-/Visualmatrix folgt P3/P4.

## Stopbedingungen

Sofort Chief informieren bei Bedarf nach OUT-Pfaden, Websiteaenderung, UI-
oder Loader-/Storage-/Reader-/Sprach-/Brandmutation, neuer Dependency/Netzwerk/
Kosten, echtem Inhalt/Medium oder politischer/taxonomischer Behauptung. Keine
Selbstkorrektur ausserhalb des Scopes. Keine Kinder.

## Abschluss

Report/Handoff nennen exakte Diffs, Tests, Exitcodes, Revisionen/Hashes,
Website-Bytegleichheit und offene P3/P4/P5-Gates. Kein Produkt- oder PO-GREEN.

END-CHECK: :)
