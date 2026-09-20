# Native WRN brand resources

Parent: `WRN-RELEASE-COMPLETION-2026-09-10.md`, explicit PO instruction to
finish native branding among the release gaps. Chief `/root` implements this
small disjoint resource slice; no delegated writer. Core writer Slot1 owns
shared content packages. Independent Native reviewer owns only existing bridge
code checks, which this slice does not modify. Website QA owns the browser.

## Observable change and source decision

Replace the Capacitor launcher/splash appearance with an original compact
WRN star variant on the requested black canvas, with red and violet accents.
The Solinaridao header master was visually inspected as identity reference;
its raster bytes, narrow approved header surfaces and existing three-asset
manifest remain unchanged. The new native vector is a distinct self-authored
small-scale symbol, not a purported unmodified copy or a new header master.
Its five-point star and split light/red face follow the current visual identity;
the Android launcher continues to label it World Revolution News.

Chief's authority to prepare this reviewable variant comes from the current
full native-branding task. It is a candidate, not a claimed PO visual approval.
Record the source reference, new resources and exact hashes in a separate native
manifest. No licensing assertions about an altered original bitmap are needed.

## Exact paths

- `apps/mobile/android/app/src/main/res/values/styles.xml`,
  `values/ic_launcher_background.xml`, new `values/wrn_brand_colors.xml`.
- New `drawable/wrn_native_mark.xml`, `drawable/wrn_native_monochrome.xml`.
- `mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml`.
- New same two aliases under `mipmap-anydpi/` (API24/25) and
  `mipmap-anydpi-v33/` (themed monochrome support).
- New `apps/mobile/android/native-brand-assets-v1.json`.
- New `docs/evidence/WRN-NATIVE-BRAND-2026-09-10.md`, associated distinct
  preview/evidence folder and matching handoff.

No Java/bootstrap/manifest/version/dependency/Gradle/shared-brand/style changes.
Keep old template files as historical resources; do not delete them. A new
anydpi resource selects the native symbol without overwriting old PNGs.

## Checks and limits

Use native vector resources with a108-unit viewport and content inside the
66-unit safe circle, matching official Android adaptive-icon guidance. The
SplashScreen theme uses a static vector and opaque black window; no artificial
delay or animation. Red/violet values match shared tokens. Prepare shape/mask/
light-dark preview from the same geometry; clearly label it as resource preview,
not an Android device screenshot. Real launch/masking/gesture/instrumentation
on API24/31/36 remains a separate device gate.

Parse resource XML; compare native colors and manifest hashes; compile only
through Root's exact offline unsigned release/JVM/lint commands once other
native corrections are integrated. No assembleDebug, AndroidTest packaging,
signing, device install, new dependency, browser interference or publication.
Existing tests/protection hashes remain intact; independent final native
resource/build review and user-visible candidate preview are required.
