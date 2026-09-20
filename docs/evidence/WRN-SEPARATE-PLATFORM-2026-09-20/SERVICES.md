# Separate-platform service migration check

Status: local composition prepared; disabled by default. This is neither a
provider activation nor a deployment approval.

## Scope and sources

The target is the new private `World-Revolution-News-Next` repository described
by ADR-001. This assessment used only local, read-only inputs:

- target source register: `docs/01-SOURCE-OF-TRUTH.md`;
- target translation contract: `packages/api-contracts/src/translation-v1.ts`
  (`1.0.0`, cache namespace `translation:v2`);
- local target service: `services/translation/src/{index,runtime,gemini-adapter}.ts`
  and `wrangler.jsonc` at target revision `73e20cc7b8c978e7e6b767c8119eadf92da82eba`;
- legacy checkout revision `3349d475aabe29be81cbccf6dfb64715d57752bd` under
  `docs/evidence/WRN-CONTENT-OPERATIONS-2026-09-20/work/legacy-repository`.

No secret, binding ID, provider call, deployment, route, or legacy resource was
copied.

## Observed service boundary

The legacy system has two Cloudflare Worker roles that must not be copied as a
single opaque service:

1. `wrn-translation-cache` reads/writes a translation KV namespace, applies a
   cache rate limit and quota coordinator, then calls `revolution-proxy` over a
   service binding.
2. `revolution-proxy` mixes paragraph translation with Gemini and Hugging Face
   provider paths, podcast generation, Azure speech, and R2 podcast storage.

The local Cloudflare observation of 20 September found the legacy proxy enabled
with legacy origins, a daily translation ceiling of 950, masked Gemini/HF
credentials, and enabled podcast settings. These are legacy operational facts,
not a target configuration, provider entitlement, or free-tier guarantee.

Legacy GitHub `update.yml` and `update-fast.yml` are content-data schedules.
They are not translation Worker triggers and do not belong in the Worker
migration.

## Local target composition

`services/translation/src/worker.ts` now composes only explicit environment
values into the already reviewed `TranslationRuntimeBindings` factory. The
committed `wrangler.jsonc` names the separate Worker `wrn-next-translation` and
keeps `TRANSLATION_V2_ENABLED=false`.

An enabled environment must provide all of these values. Any absent, malformed,
or incomplete value returns the existing disabled 503 handler before provider
dispatch:

| Required item | Role | Migration boundary |
| --- | --- | --- |
| `TRANSLATION_ALLOWED_ORIGINS` | JSON array of exact approved web/Capacitor origins | target origin review; never inherit legacy lists |
| `TRANSLATION_MODEL` | explicit Gemini model identifier | provider approval; no implicit latest/default |
| `GEMINI_API_KEY` | Gemini credential | secret-store only; never committed or logged |
| `TRANSLATION_CACHE_TTL_SECONDS` and `TRANSLATION_SUPPORTED_SOURCE_LANGUAGES` | bounded cache and language contract | review against the API contract |
| `TRANSLATION_CACHE` | cache port | adapter to a newly approved target cache resource |
| `TRANSLATION_READ_QUOTA`, `TRANSLATION_PROVIDER_QUOTA`, `TRANSLATION_WRITE_QUOTA` | reserve-before-read, miss, and write quotas | independently provisioned fail-closed quota resource |

The direct Gemini adapter remains one request with no Hugging Face fallback or
retry. The new composition deliberately omits legacy proxy, HF, Azure, podcast,
R2, and legacy service bindings.

## Still external and unapproved

Before any deployment, a platform owner must separately approve and bind a new
target Worker route, exact origins, a new cache namespace, quota implementation
and its migration/rollback proof, rate-limit policy, model/provider account,
and the secret-store entry. Existing IDs, credentials, caches, quota state, and
podcasts are not migration inputs. No claim of a free provider or zero ongoing
cost follows from this local code.

Focused local tests cover disabled, malformed/incomplete, and fully injected
runtime environments; provider dispatch in those tests is mocked.

## Native adapter follow-up

The initially missing native resource adapters are now implemented and tested:
`TRANSLATION_KV`, `TRANSLATION_QUOTAS`, and explicit `TRANSLATION_QUOTA_POLICY`
compose the above runtime ports. See [native proof](NATIVE-TRANSLATION.md) and
[observed Gemini limits](GEMINI-QUOTAS.md). Actual cloud resources, credential to
free-project mapping, deployment and sustained operation remain open. The old
service stays unchanged; no paid setting or provider fallback was activated.
