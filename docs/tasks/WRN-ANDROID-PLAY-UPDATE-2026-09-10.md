# Android Play Update — local implementation and unsigned preparation

Parent full release completion. Owner Root/Chief, sequential native scope;
Mobile B1 owns src/shared content and Website QA owns its frozen Website/browser.
No overlapping writes, no children. A later independent Sol review is required.
Current native a8e64c0/a3f7500/3da9c78 independently GREEN; preserve Back/Share/
DeepLink/brand/session behavior. No device installation/signing/version bump.

## Source and available runtime

Source-of-Truth oldapp2216ff3c, runtime968c320a, android-wrapper/android app
WRNAppUpdatePolicy/Controller/MainActivity read locally. Official Google
developer.android.com/guide/playcore/in-app-updates/{kotlin-java,test} reviewed.
The already installed Gradle cache contains Play app-update2.1.0 AAR/POM and
its existing basement18.1.0,tasks18.0.2,core-common2.0.3 artifacts. Link the exact
cached version for local compilation only; --offline resolution is mandatory.
No dependency/program download or installation is authorized. Any missing
artifact must be reported, not installed. Respect existing PlayCore license.

## Observable behavior

Restore Play-managed update checks on foreground resume. Ordinary updates use
flexible flow; priority4+ may use immediate only if Play reports it allowed.
No direct APK/URL download, unattended completion or automatic restart. User
decline/error imposes24h cooldown with clock-regression protection; repeated
callbacks must not keep extending the same cooldown. Already downloaded update
asks Restart/Later explicitly and reminds the user to save drafts first.

Fix inherited lifecycle gaps rather than copying them: availability deadline5s;
pause/stop/destroy invalidate async results and dismiss completion UI; only a
currently resumed Activity may launch UI or act on saved dialog callbacks.
Legitimate result callbacks after the Play Activity closes remain consumable
once. Register/unregister listeners once, serialize callbacks on main thread,
cancel watchdog on completion/pause/destroy, ignore late timed-out replies.
Restart always requires an explicit current confirmation; a failed completion
may report failure in foreground but never auto-retry. Exceptions leave WRN usable.

## Exact files

- apps/mobile/android/app/build.gradle: exact cached implementation2.1.0 only.
- Existing MainActivity.java: lifecycle delegation and existing installed
  AndroidX SplashScreen install before super, preserving platform Back callback.
- New same java package WRNAppUpdatePolicy.java, WRNAppUpdateSession.java,
  WRNAppUpdateController.java. Session/policy pure Java, no hidden thread globals.
- New test counterparts WRNAppUpdatePolicyTest.java and WRNAppUpdateSessionTest.java.
- New res/values/update_strings.xml and corresponding values-de/es/fr/it/pt/ru/
  el/tr/update_strings.xml. Native strings follow Android locale; no reading or
  rewriting WebView user preferences.
- Existing res/values/strings.xml: adding translated update resources exposed
  four MissingTranslation errors for the fixed brand/app/package/scheme names.
  Mark those four intentionally invariant names translatable=false; do not
  suppress MissingTranslation generally or add a lint baseline.
- Own evidence/handoff WRN-ANDROID-PLAY-UPDATE-2026-09-10; cache hash/build task
  manifests only, no credentials or keystore material.

## Acceptance and boundaries

Pure JVM tests prove policy and stale callback ordering across pause/resume,
timeout, duplicate results, completion/retry and destruction. Compile real Play
adapter against cached SDK and inspect actual callback wiring independently.
Before Gradle execution inspect exact --dry-run of release-only tasks. Allowed
testReleaseUnitTest/assembleRelease/lintRelease offline only; reject any sign,
validateSigning, debug-package, install or connected-device task in graph.
Fresh mobile web assets copied only once B1 returns or when proven unchanged;
never claim APK matches moving Mobile source. Final byte-bound unsigned build
and device/upgrade/in-app-update behavior remain separate final gates.

No SDK installation, paid calls, live configuration, signing, remote writes,
package/version identity changes, extra permissions or Play Console action.
An unsigned artifact can be prepared; device/Play testing needs a concrete
separate approval after all preparation, never a premature permission pause.
