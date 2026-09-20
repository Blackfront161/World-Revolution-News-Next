# WRN agent handoff

## Assignment

- **Task:** Slot 2 read-only Android completion inventory under
  `docs/tasks/WRN-RELEASE-COMPLETION-2026-09-10.md`.
- **Brief baseline:** `3e2d8dd`.
- **Owned writes:** this handoff and
  `docs/evidence/WRN-RELEASE-COMPLETION-ANDROID-INVENTORY-2026-09-10.md` only.
- **Forbidden work observed:** no product/test/browser/build/index writes,
  installation, signing, device action, or child delegation.

## Sources read

- `docs/01-SOURCE-OF-TRUTH.md` before legacy inspection.
- `docs/tasks/WRN-RELEASE-COMPLETION-2026-09-10.md`.
- `docs/04-QUALITY-RULES.md`, `docs/10-AGENT-ORCHESTRATION.md`, and
  `docs/templates/AGENT-HANDOFF.md`.
- Authoritative legacy Android wrapper at the Source-of-Truth path, including
  `MainActivity`, `WRNDevicePlugin`, update controller/policy, Gradle, manifest,
  unit/instrumentation tests, and README.
- Current new Android foundation, mobile bootstrap/domain tests, installed
  Capacitor bridge source/types, and the local brand asset manifest.

## Findings handed to Chief

- The foundation is a safe privacy-hardened Capacitor shell but lacks native
  system Back, share, deep-link, brand-resource, and Play-update integration.
- A dependency-free `WRNPlatform` bridge can be limited to `main.tsx`, a new
  TypeScript module/tests, `MainActivity`, a new Java plugin/tests, and a
  narrow custom-scheme manifest filter. It avoids `App.tsx`, Reader, and domain
  ownership.
- The bridge must use allowlists on both sides. It shares only canonical article
  HTTPS URLs as plain text, never a stream/file/URI; it accepts only the
  `com.world.revolution://open` route grammar and never launches arbitrary
  intents or URLs.
- Legacy Play Core update code supplies a local behavior and test reference,
  but its pinned dependency and controller should be an explicitly separate
  writer slice. A successful unsigned compile cannot prove a real Play update.
- Available logo/background assets are not licensed in the local manifest for
  Android icon/splash use. Existing legacy icon/splash files are not established
  as master resources. Brand derivation needs a prior approved asset contract.

## Evidence and validation

- Full evidence and exact file recommendations:
  `docs/evidence/WRN-RELEASE-COMPLETION-ANDROID-INVENTORY-2026-09-10.md`.
- Ran `git diff --check` on these two documents (PASS) and a scoped `git status`
  inspection. No product test or build was run because the brief forbids it.

## Risks and next action

- Do not copy the legacy calendar plugin: it accepts unchecked caller fields
  into an Intent and is outside this release scope.
- Do not add HTTPS App Links without domain ownership/`assetlinks.json` proof.
- Do not use the current broad FileProvider roots for sharing. Keep the new
  bridge text-only.
- Chief may use the proposed file list to bind two narrow writer slices after
  the asset/Gradle gates: secure native platform first, Play updates second.

## WRN-AGENT-STATUS

- **Status:** GREEN — read-only inventory complete; no implementation claim.
- **Files changed:** only the two owned documentation files.
- **Open gate:** brand asset surface approval and separate Play dependency
  authorization before their respective writer scopes.

END-CHECK: :)
