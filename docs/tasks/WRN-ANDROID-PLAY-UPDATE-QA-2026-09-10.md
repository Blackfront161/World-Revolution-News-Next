# Independent Android Play Update QA

Parent: WRN-RELEASE-COMPLETION-2026-09-10. Delegation: erlaubt, one existing
production_content_design Sol/high in Slot2; Root reserves centrally.
No children, index/product/browser/build/install/signing rights. Candidate
cc79606, base bf81272; native source frozen. B1 owns Mobile src/shared/browser.

Read the implementation brief, matching Chief evidence/artifact manifest, the
exact candidate diff, existing native bridge closure and source-of-truth.
Independently assess actual MainActivity/SDK wiring: foreground listener/check
lifecycle, availability deadline and late callbacks, Play result provenance,
once-only cooldown, malformed/unavailable preferences, update mode priority,
download completion consent and stale dialog actions, process recreation and
existing Back/Share/DeepLink/splash compatibility. Distinguish pure session unit
proof from real Android/Play adapter and device evidence. No hypothetical broad
redesign; findings need exact causal path, impact and narrow correction.

Recheck17 LF source pins, actual13-JVM results,0-lint-error/13-warning report,
APK hash317365d4... and38 public asset bindings without rebuilding. Merged
manifest/permission/component changes and exact already-cached SDK declaration
are in scope. The prior36 web assets plus2 generated Cordova shims are retained
assets, not current moving B1 source. Signing incident remains separate.

Allowed writes only own docs/evidence/WRN-ANDROID-PLAY-UPDATE-QA-2026-09-10.md,
same-name evidence folder for small authored probes/outputs, matching handoff.
Use existing offline Java or Node for a focused pure-state probe if useful;
no Gradle/Android/device calls. No secrets, dependency installation or network
write. Official Google docs may be read if a concrete API fact is unresolved.
Give evidence-based GREEN/RED with open device limitations, template handoff
and END-CHECK. Native gate alone does not release the app.
