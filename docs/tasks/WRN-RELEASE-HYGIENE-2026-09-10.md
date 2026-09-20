# Final release hygiene and reproducible local artifacts

Parent RELEASE-COMPLETION. Root sole writer, no delegation for formatting.
Start only after Site writer returns its same-directory tool rights and
UPDATE-SOURCE independent browser run completes. No product behavior change.

The full Prettier check reports exactly22 old source/test formatting failures.
Apply only Prettier to this observed list; preserve strings/data semantics and
do not touch immutable production/generated JSON or historical manifest pins:

- apps/mobile/src/mobile-reader-v2-media-safety.test.ts
- apps/mobile/src/mobile-reader-v2-ui.ts
- apps/website/src/offline-shell/adapter.test.ts
- apps/website/src/offline-shell/adapter.ts
- apps/website/src/offline-shell/browser-platform.ts
- apps/website/src/offline-shell/staging-worker-template.mjs
- apps/website/src/offline-shell/worker-runtime.mjs
- apps/website/tools/build-staging-package.mjs
- apps/website/tools/generate-static-article-landings.mjs
- apps/website/tools/generate-static-article-landings.test.mjs
- apps/website/tools/integrate-static-article-landings.mjs
- apps/website/tools/staging-package.mjs
- apps/website/tools/staging-package.test.mjs
- apps/website/tools/staging-vite-plugin.d.mts
- apps/website/tools/staging-vite-plugin.mjs
- apps/website/tools/staging-vite-plugin.test.mjs
- apps/website/tools/validate-staging-config.mjs
- apps/website/tools/verify-staging-package.mjs
- packages/content-contracts/tests/fixtures/wrn-production-content-v1/synthetic-build-input.json
- tests/e2e/foundation.spec.ts
- tests/e2e/website-shell-core-outcome.mjs
- tests/e2e/website-shell-ui-final-runner.mjs

The synthetic input is authored test input, not public production data; compare
parsed before/after semantics. Keep all prior protected product assertions.
Review diff, full pnpm check and both builds. Any new lint/test finding requires
an explicit narrow diagnosis, not changed expectations. Main-chunk warning stays
visible unless a separate justified optimization is validated.

Root also owns matching final local-artifact evidence/scripts. To retain all
old native assets without deletion, create a fresh asset staging tree containing
the final Mobile dist plus the existing generated bridge configuration/shims,
and a documented Gradle init script selecting this exact asset root for release.
Do not modify native source/version/signing. Offline release JVM/assemble/lint
only, no debug/sign/device task. Bind all staged/APK bytes and exact commands;
report explicitly that reproduction uses the recorded asset init script.
Any final Site/delivery output is a fresh absent target. No external action.
END-CHECK: :)

Full-check diagnosis: after all22 formatting failures close, ESLint scans the
generated historical Android asset copy and reports minified bundle expressions.
Add exactly apps/mobile/android/app/src/main/assets/** to global ESLint ignores
in eslint.config.js, matching the existing Prettier generated-copy exclusion.
Authored Mobile/shared/tests remain checked; fresh APK bytes get separate exact
asset verification. This excludes producer output, not source findings.
