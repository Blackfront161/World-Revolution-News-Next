# WRN podcast service

This package is an intentionally disabled migration seam for Azure Speech F0. Its
`wrangler.jsonc` contains no bindings, key, bucket, Durable Object, public route or
catalogue operation. `WRN_PODCAST_GENERATION_ENABLED` is `false` and resource
verification is `unverified` by default.

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

The Azure adapter reuses the legacy eighteen voices across nine languages, posts escaped SSML to
the fixed regional Microsoft endpoint, rejects redirects, bounds timeout/audio size,
and requires `audio/mpeg`. It makes no request until a future runtime injects a
verified key and `fetch`; this package never reads secrets or contacts Azure itself.

Remaining bindings before activation: reviewed provider/privacy and retention policy;
Azure key/region binding; shared global quota with a single resource identity; private
storage plus takedown/expiry worker; authenticated editorial operation capability;
and a separate immutable publication/catalogue contract.
