# WRN native platform bridge

- Parent: `WRN-RELEASE-COMPLETION-2026-09-10.md`; explicit PO completion order.
- Base: `915a987`; inventory: `WRN-RELEASE-COMPLETION-ANDROID-INVENTORY-2026-09-10.md`.
- Chief/integration: `/root`; Slot2 reserved for existing `android_foundation`, Terra/high.
- Delegation: allowed only to that direct writer; no children or index writes.
- Independent review: separate QA after a frozen candidate. Slot3 website writer
  remains disjoint and owns the browser; at most two product writers.

## Observable result

Android can share a canonical article URL through the system text chooser,
accept a bounded app-owned deep link, and route System Back through the existing
guarded web history. Ordinary browser startup retains its current behavior.

## Owned files

- `apps/mobile/src/native-platform.ts` and `.test.ts` (new).
- `apps/mobile/src/main.tsx` (bootstrap only).
- `apps/mobile/android/app/src/main/java/com/world/revolution/MainActivity.java`.
- New `WRNPlatformPlugin.java` and a pure-Java `WRNPlatformPolicy.java` in that package.
- `apps/mobile/android/app/src/main/AndroidManifest.xml`: exact VIEW filter only.
- New matching platform/policy JVM and instrumented tests under Android `src/test`
  and `src/androidTest`; no existing test weakening.
- `docs/evidence/WRN-NATIVE-PLATFORM-BRIDGE-2026-09-10.md` and matching handoff.

No App.tsx, shared contracts/domain, styles, brand assets, dependencies, Gradle,
reader, content or website changes. Existing signing/version/backup configuration
is preserved. Native branding and Play updates are subsequent slices.

## Required behavior and negative cases

Use installed Capacitor core only. Scheme `com.world.revolution`, host `open`,
no credentials/port/query/fragment and an explicit supported route allowlist.
Reject traversal, double/percent encoded separators, unknown routes, oversized
input and arbitrary external navigation. Revalidate in Java and TypeScript.
Cold/warm delivery must be retained until listener registration and consumed
exactly once; clean up listeners safely without a bootstrap race.

Shares accept only canonical HTTPS `solinaridao.com/articles/<safe-id>/` URLs,
with no query/fragment/port/credentials. Use ACTION_SEND text/plain and a chooser;
never streams, grant flags, arbitrary intents or files. The safe ID syntax must
be explicit and compatible with later `wrn-art-...` as well as current test IDs;
it does not itself admit an article or create an identifier.

Before web readiness, Back keeps native fallback behavior. After readiness,
existing wrnHistorySession/wrnHistoryPosition control local history; avoid
double navigation and preserve the existing dirty-draft guard. At root, finishing
requires a validated acknowledgement for the current back request; arbitrary or
stale bridge callbacks cannot close the activity. Do not add a parallel router.

Test plugin absence, valid and hostile routes/shares, retained launch delivery,
listener cleanup and Back history/root/stale acknowledgement. Pure Java policy
tests must run without mocked Android URI methods. Instrumented tests may be
prepared/compiled, but not represented as device-tested.

## Verification, costs and rollback

Run focused JS/JVM tests, Mobile typecheck and scoped lint/format. Offline native
compile/test/lint only with existing toolchain and explicit sandbox escalation;
no install, dependency resolve, signing, device action or browser ownership.
Do not run pnpm. Return exact commands/results and any build environment failure.
No user data migration or external write. A separate commit reverses the bridge;
old web content remains intact. Checkpoint on concrete milestone, no retry loop.
Handoff lists changed files, checks, unrun device cases and `END-CHECK: :)`.
