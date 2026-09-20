# Production media controller integration design

Delegation: erlaubt. After this separate gate, existing Terra
media_durable_writer owns read-only design of the next production media
controller integration. Its regional QA is complete; it did not author A2-A6.
Write only docs/evidence/WRN-PRODUCTION-MEDIA-CONTROLLER-DESIGN-2026-09-12.md
and matching docs/handoffs file. No children, browser, code, tests, index,
provider requests, native work or other shared-path writes. Root prepares
disjoint provider evidence and delivery; Sol corrects the four A6 origin paths.

Read accepted A1-A5 interfaces and A6 design/candidate plus independent report.
A6 remains blocked only by A6-IND-M-001 until its separate closure; design may
proceed against the specified corrected origin rule but implementation waits.
Actual source is packages/browser-content/src/production-media-release.ts;
player, offline and resume stores share that directory. Do not infer APIs.

Produce a concise implementation-ready design for a shared headless controller
joining actual A4 source and A6 store, then A2 player and A5 explicit-pause resume.
Bind concrete public state/commands/ownership and exact future file paths. Split
into small independently testable steps if needed, while specifying the complete
end-to-end user semantics. Reuse accepted components; no duplicate transport,
storage schema, parser, player or overbroad new framework.

Required decisions: mount reads local only; explicit source recheck has one
operation epoch, cancellation and finite deadline; durable A4 safety callback
returns exact A6 postcommit readback before any payload; sequence/revocation/floor
and source-failure handling; candidate activation/readback and rollback; active
context must be removed synchronously on invalidation, clear and dispose.
Specify operation/generation/clearEpoch and reentrant observers, lost leases and
CAS conflicts. Failed operations must not revive stale Ready or erase protected
data. Handle late store open/read/source/commit and close all resources.

Resume: load minimal records locally, match exact episode/stream/release/stream
revision and duration, never persist consent or auto-play on mount. Only explicit
pause saves, never OS/browser pause. Preserve A2 same-buffer continue with no new
request or seek reset, including after completed or pending save. Starting a
stored position requires a current per-episode prompt and fresh user confirmation
with synchronous audio.play in that gesture. Specify Clear behavior across two
separate stores truthfully (no false atomicity), pending saves, conflicts and exact
deletion of ended/invalid records. No cookies, history, extra identifiers or audio
cache. MediaSession integration can be a following narrow step with explicit
pause attribution and cleanup; do not silently promise it in the first step.

Enumerate a bounded distinguishing test matrix (including actual A4/A6 and A2/A5
seams) and required thin client composition. Metadata origins/provider consent
configuration remain injected and empty/disabled in production until separately
admitted; historical directories stay reachable. EFF Archive CDN policy origin
mismatch is a separate provider design, never relax A1 origin rules here.

Return unresolved design choices as concrete alternatives with recommendation,
not TODO implementation. No whole-release or provider readiness claim.
