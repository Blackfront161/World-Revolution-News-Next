# Production media A1: pure versioned admission contract

Standing PO completion mandate; design accepted in4689083e at
docs/evidence/WRN-PRODUCTION-MEDIA-DELIVERY-DESIGN-2026-09-11.md.
This is the first bounded part of design scope A, not playback activation.

Delegation: erlaubt. Root reserves Slot2 for existing
production_capacity_core_writer, Terra/high. No children. Slot1 Sol owns the
disjoint read-only resize diagnosis. Root owns integration/artifacts. The writer
is not alone in this workspace; preserve other edits. No browser or index rights.
Independent contract review follows the frozen candidate by Sol, who did not
implement it. One bounded implementation pass; return unfinished WIP honestly
with a checkpoint instead of expanding scope or repeating broad test loops.

## Ownership

Exactly three product/test paths:

1. packages/content-contracts/package.json (additive subpath export only)
2. packages/content-contracts/src/production-media-v1.ts (new)
3. packages/content-contracts/tests/production-media-v1.test.ts (new)

Own matching WRN-PRODUCTION-MEDIA-CONTRACT-A1-2026-09-11 evidence/handoff only.
No index.ts/barrel, old contracts, fixtures, browser code, public data, producer,
dependency, installation, provider, audio requests, signing or deployment writes.
The five V1 source pins in the accepted design must remain exact.

## Contract and scope

Implement the accepted five-document publisher-stream contract as a pure,
separately versioned module. The design's numeric limits, exact values, URL
rules, nine locales, rights alternatives, timing/coverage and cross-document
identity rules are normative. Export clear readonly types, bounded structural
guards and an asynchronous complete-release validator. No storage or network.
Keep pointer/descriptor validation separate so future transport can reject a
bad descriptor before reading payloads. Accept raw UTF-8 text inputs where byte
and hash checks are required; do not claim canonical JSON size is the wire size.

The complete validator receives an injected finite clock, exact admitted
publisher-origin allowlist and already known monotone safety. An empty origin
allowlist cannot admit playback. Synthetic tests may use only reserved .invalid
origins. Pointer/descriptor paths must be relative to /content/media/v1/ with a
single immutable release identity and exact known document names; reject
traversal, encoded path tricks, query/fragment, duplicate/missing/extra docs.
Schema/version, revision/sequence/floor and every document hash/size bind across
the graph. JSON is strict UTF-8/no BOM; unsupported schema fails closed.

Do not trust TypeScript casts or a caller-created ready object. The successful
result is an immutable detached validated snapshot with module-owned proof;
later player code must be able to distinguish its provenance. Use existing
canonical/hash helpers if appropriate without changing their implementation.
Input mutation during asynchronous hashing must not change a validated result.

All source/series/episode/stream IDs are unique and references exact: each series
belongs to one source, each episode to that source/series, each episode exactly
one stream; no orphan or conflicting duplicate. Localized fields have exactly
en/de/es/fr/it/pt/ru/el/tr, each nonempty bounded plain text or explicit null for
unavailable. A title must have at least the source-language text. Do not invent
translations. Source health is within seven days at generation; source admission,
rights and consent cover the full release window. Complete-episode rights and
separate third-party consent are both mandatory. Metadata-only, feed enclosure,
page availability and music-only credits cannot act as whole-episode rights.

Bind streamRevision to canonical source/publisher episode identity, URL, MIME,
declared size/duration and rights-evidence hash, per design. It is explicitly not
an audio-byte hash. Validate normalized HTTPS origin/path and no credentials,
query, fragment, second rendition or other MIME. Unknown policy values and
extra keys fail; runtime playback/HTMLMediaElement/CSP remains outside A1.

Revocation uses cumulative known safety and never decreases its floor or revives
a blocked/gone/replaced source, series, episode or stream. Keep the validated
safety phase available independently of ordinary payload acceptance, so a later
transport can persist verified safety first. No in-memory validator alone may
claim durable revocation. Clarify any genuinely missing design detail in the
handoff rather than silently weakening it or expanding into a store/controller.

## Acceptance and validation

One valid synthetic episode; three distinct rights-basis variants; detached
immutable output/provenance; no origin allowlist -> no ready release. Negative
oracles for malformed/future/missing/extra/duplicate/hash/size/version graphs,
orphan identities, stale/future times, coverage and safety. Exercise relevant
caps immediately below/at/above: pointer16KiB, descriptor32KiB, doc128KiB,
aggregate256KiB,8sources/8series/32episodes/32streams,128MiB and1s..4h audio,
7day validity. Do not confuse byte caps with character counts or audio metadata
declarations with downloaded audio. Include mutation across a hash await.

Run focused new Vitest, content-contracts TypeScript, scoped ESLint/Prettier and
the existing contract suite once after focused success. Use installed direct
Node CLIs, no pnpm installation. No visual matrix: this pure module changes no
UI. Root independently checks test meaning, immutable V1 pins, boundaries and
diff, then queues narrow Sol review. Rollback is an additive-file/export revert;
no client currently consumes the new contract, no storage or external effect.

Handoff uses docs/templates/AGENT-HANDOFF.md and ends with WRN-AGENT-STATUS and
END-CHECK: :). Report exact passes, failures, unresolved details and changed paths.
