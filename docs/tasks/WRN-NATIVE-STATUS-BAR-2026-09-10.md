# Native black-canvas status bar correction

Parent: authorized RELEASE-COMPLETION and REQUIREMENTS-AND-DEVICE-COMPLETION.
Cause independently visible in actual emulator screenshot08: dark system icons
over black WRN canvas. Installed Capacitor SystemBars.java reads config style,
DEFAULT follows system light appearance and overrides Android XML settings.
Both PO themes retain black backgrounds, so fixed DARK means light icons.

Root is sole writer, no delegation. Product scope exactly
apps/mobile/capacitor.config.ts: plugins.SystemBars.style='DARK'. No dependency,
versionCode, native bridge, provider, production key or Android XML change.
Generated native assets must come from explicit new evidence staging. Preserve
old native source assets and all previous APKs/AVD data.

Root evidence/scripts live under docs/evidence/WRN-NATIVE-STATUS-BAR-2026-09-10/.
Use existing unsigned Gradle task guard and SDK only; bind every fresh Webasset
and generated Capacitor config byte to fresh unsigned APK. Test-only signing
and isolated factory data follow the already approved device-test method with
a new unique path/key/port; no overwrite of installed app or existing keys.
Acceptance: TypeScript/config checks, unsigned build/asset equality, signature
verification of separate test-copy, actual Android system light and dark
appearance screenshots showing readable icons, saved V2 image offline restart.
Independent image integration QA does not grant native production release.
Root updates PROJECT-STATE/readiness/handoff on completion or explicit blocker.
