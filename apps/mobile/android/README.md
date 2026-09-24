# Local Android foundation

Native owner: `apps/mobile`. This project wraps only the Mobile client.
The checked-in source comes from the installed Capacitor 8.5.0 template.
It preserves the reference app's `com.world.revolution` and SDK 24/36 binding.
The local unsigned candidate is version code 27 / version name 2.2.0, following
the Play Console's observed highest bundle 26 / 2.1.1 on 20 September 2026.
Signing with the existing app's upload identity and an actual upgrade test remain
required; changing these local numbers does not publish or install an update.

## Prepare from an existing dependency installation

From `apps/mobile`, using the existing Node 24 runtime and locked dependencies:

```powershell
node ../../node_modules/vite/bin/vite.js build
node node_modules/@capacitor/cli/bin/capacitor sync android
```

`sync android` regenerates ignored web assets, Capacitor configuration and the
Cordova bridge project inside this native project, plus the marked generated
Gradle includes. Never hand-maintain those generated files. No npm/pnpm install,
remote update or signing command is part of this sequence. After a fresh checkout
this generation is necessary; the ignored outputs are intentionally not in Git.

## Offline verification

Use Java 21 and an already-installed SDK platform 36. The AGP pin is 8.13.2;
Gradle is 8.14.3. Before invoking the wrapper, verify its distribution and Maven
artifacts already exist locally: `--offline` does not prevent a wrapper from
downloading its own missing distribution. A missing prerequisite must be reported,
not automatically installed. Set `JAVA_HOME` and `ANDROID_HOME` for the process
to those existing installations, then from this directory:

```powershell
./gradlew.bat --offline --no-daemon :app:testReleaseUnitTest :app:lintRelease :app:assembleRelease
```

The only permitted artifact in this foundation task is
`app/build/outputs/apk/release/app-release-unsigned.apk`. No signing configuration
is supplied. Debug builds are not part of the approved verification, because
they can create or use a debug signing key. Do not use `clean` against historical
outputs. Bind the web asset hashes, source revision and APK hash before review.

## Unsigned bundle staging

From the repository root, `node tools/prepare-android-release.mjs` creates one new ignored directory
under repository `work/wrn-android-release-*`. It copies and hashes the current
`apps/mobile/dist` plus the checked native Capacitor bridge/config assets, records
the Git commit and relevant dirty-source rejection in `receipt.json`, and writes
`unsigned-bundle.init.gradle`. It does not run Gradle, sign, change a version, or
upload anything. Until a separately bound fresh-build manifest is supplied, the
receipt labels the copied `dist` provenance as `unverified`; its hash list alone
does not prove the source build that produced those bytes.

Only after separate review, run the receipt's displayed `:app:bundleRelease`
command with the staged init script and assets. The init script rejects a release
signing configuration and Debug/install/test tasks. The resulting `.aab` remains
unsigned and local; Play Console access and any signing operation are separate
external steps.

Verify the unsigned bundle against the receipt-bound stage before any signing:

```powershell
pwsh -NoProfile -File tools/verify-android-aab-assets.ps1 `
  -StageDirectory <stage>/native-assets `
  -ReceiptPath <stage>/receipt.json `
  -AabPath apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

The verifier reads the AAB as a ZIP and rejects missing, extra, duplicate or
byte-different `base/assets/**` entries. It prints the final AAB and manifest
SHA-256 values; `-OutputPath` can persist that JSON in the final evidence packet.

## Privacy and remaining work

The manifest declares Internet access, denies cleartext traffic and disables
automatic backup. Explicit Android 12+ rules exclude private app storage from
cloud backup and device transfer. Tests guard the exclusions. They do not prove
OEM behavior or provide user data migration. A deliberate migration/export path
and its consent/loss protection must be validated separately.

Launcher icons and splash resources use the checked-in black/red/violet WRN
mark, including an Android 13 monochrome icon. Existing visual evidence covers
the launcher and startup screen; the final candidate still requires a fresh
native capture. FileProvider paths, native sharing, system Back behavior, deep
links, lifecycle, audio interruptions, WebView storage, device accessibility
and upgrade preservation require their own integration/device checks. No
emulator/device test, signing, upload or Play release is implied by a successful
compilation.
