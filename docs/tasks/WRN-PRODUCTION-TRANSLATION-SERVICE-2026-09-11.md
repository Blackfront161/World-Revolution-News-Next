# Task Brief — paragraph translation contract and local service

## Identity and ownership

Parent: RELEASE-COMPLETION and production paragraph translation. Design Sol
WRN-PRODUCTION-TRANSLATION-DESIGN-2026-09-11 including its addendum is accepted
at38f9553c; local old-cache reproduction secured in d857c604. Delegation: erlaubt,
one backend_data_reliability_engineer Terra/high in Slot3 only after Root's
separate gate and Home QA returns. No children/browser/index/remote work.
Shared checkout; you are not alone, preserve other edits. Capacity writer owns
packages/content-contracts exclusively. This writer owns only paths below.
Root integrates; independent Sol checks the completed trust boundary. One
bounded implementation and distinguishing local tests, not another design loop.

## Objective

Implement exact paragraph HTTP contract and a target-owned service with
server-derived cache identity, validation, separate quotas, explicit adapter
provenance and bounded single-attempt execution. Tests reproduce rejection of
the supplied-key poisoning class. This is isolated local service correctness;
live old-route SEC-001 disposition and real-client activation remain open.

## Exact paths

Existing:
- packages/api-contracts/package.json;
- tsconfig.base.json; tools/browser-content-aliases.mjs;
- tools/check-boundaries.mjs; tools/check-boundaries.test.mjs;
- pnpm-workspace.yaml; pnpm-lock.yaml (only new service workspace importer).

New:
- packages/api-contracts/src/translation-v1.ts;
- packages/api-contracts/tests/translation-v1.test.ts;
- services/translation/package.json; services/translation/tsconfig.json;
- services/translation/wrangler.jsonc;
- services/translation/src/handler.ts; services/translation/src/index.ts;
- services/translation/tests/handler.test.ts;
- services/translation/vitest.config.ts if isolated alias resolution is needed
  without installing workspace dependencies.

Own new TRANSLATION-SERVICE-WRITER evidence/handoff dated2026-09-11 and same
output directory. No other existing paths. In particular no content-contracts,
shared reader/UI, App, clientpackage, content/provider/fixture/media, secrets,
registry dependency, installation, Workers deployment or live route changes.
Use existing bundled runtime and libraries; local workspace links only. Do not
run install even offline; tests/types can use existing root binaries/aliases.

## Binding requirements

Follow the accepted design's exact keys, languages, source/target/text identity,
hashes, wire byte limits and response/error shape. Text stays exact well-formed
Unicode; nonblank <=6000UTF16 and <=32768UTF8, request<=36864bytes beforeparse.
Reject caller cache keys/IDs/URLs/unknown fields. No truncation. No same-language
I/O. Adapter identity/provenance server-owned, no arbitrary public proxy fallback.
Pure handler has injected clock/cache/read-quota/provider-quota/write-quota/
upstream ports; one dispatch/12sserver deadline, abort, no retries. Thin Worker
adapter has bounded body/CORS checks and explicit configured service bindings;
safe disabled default with no invented route/binding target. Missing required
ports/config fail closed. No prompt/text/IDs/client-IP logs; safe aggregate codes.

Server derives SHA256 over exact validated canonical identity and only reads
translation:v2. Validate cached identity/text/digest/createdAt/expiry<=7days;
corrupt samekey fails, no overwrite/provider repair. Unambiguous quotas: read
budget for hits/misses; separate request+exactcharacter provider reservation
only for miss; separate write/storage reservation. Refund only definite
predispatch failure, never ambiguous dispatched timeout. Output plain text,
nonempty, validUnicode and bounded; reject HTML-like content and wrong provenance.
Original vulnerable namespace is never read/deleted/mutated by this candidate.

Root explicitly does not infer existing upstream support for sourceLanguage,
single-provider mode or provenance. If thin adapter requires a new versioned
upstream response envelope, define it exactly as part of the injected port and
mark existing live binding unproven/disabled; never fabricate compatibility.

## Tests / acceptance / handoff

Contract exact-key/language/Unicode/UTF8-UTF16 boundaries; deterministic keys for
exact text and changingtext/source/target/mode/adapter; rejectclientkey replay.
Cache hit/miss/corrupt/mismatch/expired/future/time regression; everyquota failure
and read/provider/write counters; onetime dispatch, timeout/abort and no late
write; output provenance/HTML/hash/size; bounded streaming malformed request,
CORS/method/defaultdisabled worker behavior. Tests local mocks only. FullAPI
contracts, new service tests, package/root compatibility types, boundaries and
scopedlint/format. New boundary tests prove services cannot import client/UI/
fixture/testsupport but may import API contract; preserve all old assertions.

No screenshots needed for this service-only phase. Reader controls and9language
UI copy follow after the real contract is immutable. No external activation or
wholeSEC-001 closure claim. Handoff lists exact tests/counts/pins, unresolved
upstream deployment evidence and next UI seam, rights return, END-CHECK: :).
