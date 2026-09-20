# Native translation adapters — 20 September 2026

The separate, disabled Worker now has real Cloudflare KV and SQLite Durable
Object ports. No cloud resource, deployment, secret, billing setting or legacy
service was changed. The native test uses synthetic text and a local mock
provider; zero real Gemini/Hugging Face requests.

## Corrections and proof

- Correct native `fetch` receiver: the Workerd test exposed an Illegal invocation
  error that Node mocks had not detected.
- Reuse the runtime for identical binding/configuration values across different
  environment objects. Within that Worker isolate, eight concurrent identical
  requests share one provider attempt. Cross-isolate misses can still duplicate;
  the global quota object bounds all reservations.
- Model-specific cache identity prevents reuse across model changes.
- KV validates hashed keys, payload bounds, native TTL and cancellation guards.
- One stable SQLite quota actor reserves read/provider/write budgets atomically.
  Provider days follow Pacific time; storage days follow UTC. No key rotation,
  fallback, retry or quota reset on policy changes.
- Each reservation carries the exact policy revision. Deployment/rollback skew
  fails closed against the coordinator's configuration and keeps the same ledger.
- Forty-eight translation tests and TypeScript checks pass. Tests cover policy
  rejection, cancelled writes/reads, policy skew, summer/winter day boundaries,
  environment reuse, disable changes, native receiver and model isolation.
- Miniflare 5.20260918.0-alpha / Workerd: eight parallel requests → one mock
  provider call; repeat served from KV; second paragraph → second call; third
  paragraph → HTTP429 before provider; two hashed cache entries. PASS.

Reproduce with `node tools/check-translation-cloudflare-local.mjs <absolute
miniflare/dist/src/index.js>`. Install that exact optional runtime in an ignored
isolated directory first; the probe itself neither installs packages nor uses a
real provider. Runtime output/builds remain under ignored `work/cf-runtime`.

## Activation still open

Supply a **new** KV namespace (`TRANSLATION_KV`), a **new** SQLite Durable Object
binding (`TRANSLATION_QUOTAS`, class `TranslationQuotaCoordinator`, a
`new_sqlite_classes` migration), exact target origins, reviewed model and a
secret-store credential. No old namespace IDs or secret values were copied.

`TRANSLATION_QUOTA_POLICY` is explicit JSON with `read`, `provider`, `write`
objects, each containing positive integer `requestsPerMinute`, `requestsPerDay`,
`utf16PerMinute`, `utf16PerDay`. There are deliberately no activation defaults.
UTF-16 ceilings bound input work, **not** exact provider tokens or monetary cost.
Limits must leave room for other consumers of the same provider project and
Cloudflare account. Local quotas cannot prevent unrelated services using their
shared entitlement. Keep the Worker disabled until the credential is mapped to
the verified free project, target resources and account limits are bound, and
the actual deployment/rollback checks pass. No paid plan or HF fallback is enabled.

This is local native-runtime evidence, not live translation or release readiness.

Repository operations: the transferred six-hour content workflow has a public-repository guard. In this private repository it is skipped; neither scheduled content publication nor free private Actions capacity is claimed. Hosting and automatic admission/publication are still open.

Independent reviewer /root/native_cloudflare_review: PASS, no open findings. Independently reproduced48/48 tests, typecheck, scoped lint/format and the native Workerd probe. Scope: source and local runtime readiness only; no live/overall RC approval.
