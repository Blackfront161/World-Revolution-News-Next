# Correct lost cold-start native article links

Parent RELEASE-COMPLETION, observed during authorized native V2 image test.
Evidence: new testAPK27cbb04f starts cold through ACTION_VIEW but shows home;
same supported link delivered to running singleTask activity opens the reader.
Source confirms WRNPlatformPlugin only handles handleOnNewIntent and never reads
Activity.getIntent at plugin startup. Existing URL policy itself remains valid.

Root sole product writer. Scope exactly
apps/mobile/android/app/src/main/java/com/world/revolution/WRNPlatformPlugin.java:
override load, call super.load then the existing validated handleOnNewIntent
with the startup activity intent. Capacitor's existing retain-until-consumed
event queue keeps valid routes until the registered JS listener attaches.
No policy weakening, new route, JavaScript/manifest/dependency/version changes.
Reuse same ACTION_VIEW filter and strict URL parser for cold and warm delivery.

Evidence/scripts under docs/evidence/WRN-NATIVE-COLD-LINK-2026-09-10/; retain all
prior artifacts and test data. Use recorded fresh V2 assets, guarded unsigned
Gradle tasks and new separate test-copy sign/install in exclusive fresh data.
One fresh test key may sign both preserved baseline and corrected unsigned APK
in one process for controlled test-only replacement preserving local testdata;
never read existing secrets, uninstall user app, downgrade or change version.

Acceptance: real pre-fix cold-home vs warm-article evidence; unchanged16JVM and
native build/lint; APKasset byte proof; fixed cold online and offline article
with actual image, saved state retained, normal launcher stillhome and malformed
VIEW URL refused. Native Back and warmlink remain functional. This is no claim
of actual Play/versionCode upgrade, existing user's signing compatibility or
V1-to-V2 bundled-content migration. Separate independent review after evidence.
No delegation/product concurrency here; Luna source inventory is read-only.

Narrow read-only review supplement: the seven-line initial-intent capture alone
still showed home on real coldstart (03-fixed-cold-reader.png records that RED,
despite its intended filename). No success inferred from filenames. Root reserves
existing independent reviewer Slot2 for inline cause/design review of native
initial event vs main.tsx/native-platform.ts/App.tsx startup ordering. No writes,
browser, native commands or children. This replaces the earlier no-delegation
line only for that bounded review. No additional product paths until concrete
cause and distinguishing test are bound. Source inventory finished and returned
Slot1; all other helpers have no rights.

Root accepts the independent narrow design: keep Java startup capture, start
native JS session only from App's navigation effect after both popstate and
hashchange listeners are installed. Add optional stable onNavigationReady
callback to App.tsx; main.tsx passes nativePlatform.start and removes its eager
start after root.render. Existing start idempotency handles StrictMode. No queue,
timer workaround, delivery-ID or history-policy change. Allowed additional
paths exactly apps/mobile/src/App.tsx, main.tsx and App.test.tsx. Add actual App
tests with retained native route delivered immediately upon registration,
article/discover destinations, StrictMode dedup and unchanged warm routing.
First reproduce RED before product edits, then native session tests + fullMobile
and final fresh native assets/APK. Preserve the failed Java-only test artifact.

The new StrictMode oracle remains RED after listener readiness alone: replay of
the earlier history effect marks the just-delivered hash as accepted before
hashchange synchronizes React state. Initialize the history marker only once
per mounted App instance, using a ref; effect re-subscription still reports the
current session and cleanup still clears it. This prevents pending destinations
from being silently accepted on StrictMode replay or callback re-subscription.
The existing marked/unmarked navigation and draft-guard policy stay unchanged.
This correction stays inside the already allowed App.tsx path.
