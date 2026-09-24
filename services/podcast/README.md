# WRN podcast service

This package is an intentionally disabled migration seam for Azure Speech F0. Its
`wrangler.jsonc` declares a local SQLite Durable Object class but has no deployed
object, Azure secret, R2 bucket, public route, or catalogue operation.
`WRN_PODCAST_GENERATION_ENABLED` is `false` and resource verification is
`unverified` by default.

The Azure F0 tier was user-confirmed as **0.5 million neural characters/month**.
The legacy 475,000-character safety buffer is a future shared-resource policy,
not an independent second allocation. A deployment must bind one globally shared,
resource-bound atomic quota and prove its reset/account relationship before it can
set `resourceVerification` to `verified`.

The old `quota-client.js` cannot be bound directly: it independently reserves
`azure_characters` and `podcast_storage`, while this contract requires one atomic
cross-resource reservation. A reviewed adapter may reuse its Durable Object only
after adding an atomic shared-resource operation; until then the quota binding is
explicitly missing. The default Worker exposes only fail-closed `POST /v1/podcasts`
and `GET /health` responses; neither reads a request body nor contacts a provider.

`createPodcastService` accepts only canonical server-resolved article IDs. It calls
purpose-specific admission, consent, rights, and moderation ports before cache use
and again after synthesis. Full mode needs approved full text; short mode needs an
already approved server-side short text. It has no model-summary fallback, accepts
no browser text or URL, writes only private storage, and cannot publish a catalogue.

An identical miss uses its deterministic private cache key as a SQLite-unique lease
in the one resource-scoped Durable Object. Acquire returns `leader`, `busy`, `denied`,
or `ambiguous`; retrying the same operation ID resolves a lost acquire response
without creating a second reservation. One-shot dispatch and storage-commit fences
stop another isolate or a stale result from reaching Azure or R2. Expired leases are
conservative: a pre-dispatch lease can refund both counters, a post-dispatch lease
never refunds Azure characters, and storage is released only when the storage fence
proves that no object write could have started. A lease that may already have entered
R2 remains charged and bound until reconciliation. The same exact operation resolves
one lost storage-commit response before writing R2. A bounded internal sweep discovers
persisted expired attempts; ambiguous no-object storage is released only after a
second five-minute lease window and an R2 absence check, without refunding characters.

Expiry/revocation uses a persisted deletion intent before removing R2 and an
idempotent SQLite release receipt afterward. If R2 deletion succeeds but the release
response is lost, the caller receives the failure; a retry with the same exact cache
key, operation ID, and byte count completes or confirms the release even though the
R2 object is already absent.

The Azure adapter reuses the legacy eighteen voices across nine languages, posts escaped SSML to
the fixed regional Microsoft endpoint, rejects redirects, bounds timeout/audio size,
and requires `audio/mpeg`. It makes no request until a future runtime injects a
verified key and `fetch`; this package never reads secrets or contacts Azure itself.

Remaining bindings before activation: reviewed provider/privacy and retention policy;
Azure key/region binding; provisioning and runtime validation of the resource-scoped
quota/lease Durable Object; private storage plus takedown/expiry worker; private, short-lived audio-grant issuer and
reader; and a separate immutable publication/catalogue contract. The injected HTTP
boundary may authorize a permitted anonymous article audience; it never accepts
browser-provided article text or URLs. Private audio remains separately authenticated
and is bound by the grant port to the canonical article revision, mode, and voice.
