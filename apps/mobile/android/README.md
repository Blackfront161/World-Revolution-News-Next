# Local Android foundation

Native owner: `apps/mobile`. This project wraps only the Mobile client.
The checked-in source comes from the installed Capacitor 8.5.0 template.
It preserves the reference app's `com.world.revolution`, version code 26,
version name 2.1.1 and SDK 24/36 binding. This is not yet an upgrade candidate.

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

## Privacy and remaining work

The manifest declares Internet access, denies cleartext traffic and disables
automatic backup. Explicit Android 12+ rules exclude private app storage from
cloud backup and device transfer. Tests guard the exclusions. They do not prove
OEM behavior or provide user data migration. A deliberate migration/export path
and its consent/loss protection must be validated separately.

Launcher icons and splash resources are still template assets and require the
approved WRN branding plus native visual evidence. FileProvider paths, native
sharing, system Back behavior, deep links, lifecycle, audio interruptions,
WebView storage, device accessibility and upgrade preservation require their
own integration/device checks. No emulator/device test, signing, upload or
Play release is implied by a successful compilation.
