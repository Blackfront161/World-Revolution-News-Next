# Production stream player A2

Root sequential writer after A1 independent acceptance; no delegation/children.
Standing completion mandate plus accepted MEDIA-DELIVERY-DESIGN. No source,
provider, active release, UI route, public asset or V1 changes. Five old pins
remain exact. Sol owns only A1 independent reports; Root owns this brief and
later these four product paths plus own matching evidence/handoff:

- packages/browser-content/src/production-media-player.ts (new)
- apps/mobile/src/production-media-player.test.ts (new, standard test discovery)
- tools/browser-content-aliases.mjs (one additive public A1 export mapping)
- tsconfig.base.json (same additive mapping)

Goal: separately testable native media-element lifecycle for the admitted
publisher-stream contract, no JavaScript audio fetch/buffer/cache. It remains
unconsumed until transport/store/resume/UI and client gates complete. Rollback
is isolated removal of this new unconsumed module and additive mappings.

Test placement follows the existing shared-browser-content pattern: that source
directory has no package.json/test runner. Keeping the test in mobile/src makes
the standard Mobile suite discover it, while both clients consume the same
neutral module. This is a test-discovery correction to the design's proposed
file list, with no Mobile-only runtime behaviour.

Use genuine A1 ready provenance plus a synchronous caller context consisting
of the ready release and opaque current generation. Readiness and current time
must be fresh on every action/event. The caller must refresh after authority,
route or safety changes. Frozen per-episode consent information is minted by
this controller; confirmation consumes only its current exact prompt token,
bound to release object/generation/episode. Cancelled, forged, repeated or old
tokens cannot create an element. No origin enters src before confirmation.

On confirmation create a fresh element, set anonymous CORS/preload none before
src, and invoke play in the same synchronous user-gesture call. Online required
for a new start; same-run buffered continuation may be offline, without an
offline playback claim. Metadata plus initial play settlement must complete
within15000ms; duration finite and positive, delta at most5000ms. A hung play
promise must not leave loading forever. Same-run continue also has15000ms bound.

Expose finite idle/loading/playing/paused/ended/error state and only generic
stream-unavailable for native startup/media failure. Stop, expiry, context
change and dispose invalidate ownership before detaching events, pausing,
removing src and calling load. Stale timer/event/play results cannot revive
state. Native calls may throw; cleanup continues best effort without logs.
Loaded metadata may arrive before/after play settlement. Pause during loading
cancels without saving. Continue keeps the same element and position. Seek
clamps below admitted and observed duration. Only explicit pause emits a local
position callback; native timeupdate/pause, mount, seek and dispose do not save.
Future resume store owns durable CAS/late-save compensation; A2 does not claim it.

Tests use only reserved invalid origins and genuine locally built/hash-validated
metadata. Test no-element/no-src before consent, callback/native ordering,
forged/stale/reused consent, metadata/play order,14999/15000/15001ms deadlines,
duration4999/5000/5001ms, all native failures, pause/continue/seek, explicit-only
position callback, expiry/refresh/stop/dispose and stale promises/events. No
network or UI evidence needed for this unconsumed controller. Run focused
Vitest, both client TypeScript, scoped lint/format, alias and existing boundary
checks; independent Sol lifecycle review before integration.
