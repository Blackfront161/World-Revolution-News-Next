# Package-owned contract fixtures

Copied unchanged from the existing local Mobile media/events artifacts at
`8ee6fb5` on10September2026. These are the same neutral, self-authored test
documents that the contract tests previously imported directly from the app.
They are not live media/event data and do not authorize a new provider.

`tools/check-public-fixture-parity.mjs` compares all eight JSON documents with
their shipped Mobile counterparts. The workspace boundary gate runs this check
in addition to contract tests. Changing a fixture requires an intentional,
reviewed update of its paired app artifact; no automatic copy occurs in tests.
