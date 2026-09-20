# Native bridge: three independent corrections

Parent full release completion. Candidate b2b223e is independently RED with
M-001..003 in `WRN-NATIVE-PLATFORM-INDEPENDENT-QA-2026-09-10.md`.
Chief `/root` owns correction after production-core writer returns; Website
correction is the other disjoint writer and owns Browser43173–75. No delegated
native product/build writer. SourceofTruth and existing guarded App history stay
binding. No new dependency, router, signing, device or publishing action.

## Exact paths and outcome

- `apps/mobile/src/native-platform.ts` and `.test.ts`.
- `apps/mobile/src/main.tsx`.
- `apps/mobile/src/App.tsx` plus `.test.tsx`: only an optional stable callback
  from the existing App-owned history-session identity to the native bootstrap.
  Report both initial binding and the existing session rotation; clear on
  unmount. The bridge must not infer current identity from window.history.state.
- `apps/mobile/android/app/src/main/java/com/world/revolution/WRNPlatformPlugin.java`.
- `WRNPlatformPolicy.java` and existing matching JVM/instrumented tests only if
  an effective rejection or thread-ordering oracle needs them.
- Own correction evidence/handoff and focused new test outputs.

M-001: Back requires both exact current App session and a valid nonnegative
position. Missing, old and unknown-session entries cause neither history.back
nor root acknowledgement. Update tests that currently encode sessionless
success; retain valid-session positive cases and dirty-draft protection.

M-002: Confine every stateful policy operation and every Activity action to
the Android main thread. Bridge worker calls capture their arguments then
schedule on main; MainActivity already supplies Back on main. Explicitly
invalidate pending acknowledgements when web readiness is removed. Preserve
current-request/single-consumption semantics and cold/warm input allowlists.

M-003: Ignore route/back callbacks after disposal, even while asynchronous
listener removal is pending. Wire bootstrap disposal to pagehide and HMR
cleanup; do not dispose merely when an external system chooser pauses the app.
Test late emits, pending registration and cleanup failure without unhandled
rejections. Do not introduce a stale callback that can rearm the native layer.

## Checks

Effective before/after JS oracles against the pinned candidate, all focused
native-platform/App session tests, relevant Mobile regression/type/static.
Only Root may run the exact pre-inspected offline `testReleaseUnitTest`,
`assembleRelease`, `lintRelease` sequence; verify resulting APK is unsigned.
No assembleDebug, AndroidTest packaging, signing or installation. Preserve
existing native brand resource WIP and all independent reviewer paths.
Same independent Sol reviewer closes these three findings on frozen correction;
device behavior remains unproven until separately authorized actual device tests.
