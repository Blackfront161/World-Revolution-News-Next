# Website news/source/sport directory and bounded data assets

Parent full release completion; Delegation: erlaubt. Website Knowledge/Support
is independently GREEN on dacc7c8/dce2e19. Chief reserves Slot3 for existing
website_knowledge_support Terra writer; no children. Core correction has
separate content-contract/domain paths. This is one Website product writer.

## Result

Port the already approved Mobile news/source/sport directory to Website, using
the exact current1,952,616-byte JSON snapshot and existing validated shared
content-directory contract/projector. Derive actual byte/hash pin before copying;
973 article references,532 endpoint records,3 sport hints are prior inventory,
not newly verified live fulltexts or sports statistics. Preserve provenance,
uncertain endpoint association and external-link protections. Reuse nine-language
copy by extracting the existing complete Mobile directory-copy into
packages/ui-language/src/directory-copy.ts with ./directory subpath; Mobile
becomes typed re-export and existing copy tests remain unchanged.

Website own route/controller/CSS consumes shared rules; never import Mobile
runtime modules. Support #discover/news, #discover/sources and #discover/sport
through existing guarded Website navigation; preserve dirty-draft Back/hash
guard. Existing fixture-injected Discover tests keep their test scope. Provide
visible section controls, search/source/language filters, bounded30-at-a-time
results, original-link context and source/sport details. Keep source metadata
honest and source original-language attributes where known.

## Closed shell extension

Do not embed another2MiB JSON in JS. Use three explicitly named hashed JSON
asset families: legacy-knowledge-v1, legacy-support-v1, content-directory-v1.
Website loaders fetch only Vite-derived same-origin URLs, credentials omit,
redirect error, AbortSignal, capped stream/fatalUTF8 and MIME validation before
the existing domain validators. Knowledge and Support retain snapshot bytes,
schema and projection; only local transport changes. No arbitrary URL parser,
third-party request, dynamic JS import or new dependency.

Extend Website build-offline-shell and canonical protocol metadata to admit
exactly these optional known JSON classes in addition to the original five
assets. Each admitted JSON must occur exactly once in Vite's declared entry
assets, have expected basename, correct MIME and known bounded per-file bytes.
New current builds require all three. Existing five-entry historical manifests
remain readable under their original hash; new manifests bind all8 entries.
Reject duplicates, orphans, traversal, remote/query assets, unknown JSON,
over-limit bytes and mismatched Vite graphs. Existing8MiB generation cap,
3-generation limit, hash/MIME stream checks, cache namespace, control epoch,
rollback, staging isolation and offline semantics remain unchanged. Canonical
runtime-source hash changes automatically; do not manually forge revision pins.

## Owned paths

- New apps/website/src/features/directory/{WebsiteContentDirectoryRoute.tsx,
  directory-loader.ts,directory.css,directory-navigation.ts, matching tests,
  data/content-directory-v1.json}. Root may approve adjacent tests by name.
- New apps/website/src/local-json-asset.ts and test, reusable transport only.
- Website features/knowledge and support loaders plus loader tests; snapshots
  and UI unchanged except a genuine transport loading/retry regression.
- apps/website/src/App.tsx and App.test.tsx for exact route integration.
- packages/ui-language/src/directory-copy.ts, package.json additive export,
  apps/mobile/src/features/directory/directory-copy.ts re-export only.
- apps/website/tools/build-offline-shell.mjs and its test;
  apps/website/src/offline-shell/protocol.mjs and protocol-contract.test.mjs.
  Do not change worker-runtime, control protocol or adapter unless the bounded
  graph extension proves a concrete requirement; report it first.
- New tests/e2e/website-directory.spec.ts; existing Website feature e2e only
  if local asset transport requires realistic route mocks, no assertion weakening.
- Own evidence/handoff WRN-WEBSITE-DIRECTORY-2026-09-10 and fresh images/hash.

## Checks and handoff

All relevant Website and Mobile shared-copy tests/types, scoped ESLint/format,
boundary/fixture parity; strict Website build plus offline-shell tests including
old5/new8 graph positives and each rejection above. Browser rights43173–75
exclusive after last QA return (already returned); preserve43176. Fresh outputs.
Test all3 sections, filters/pagination and invalid/missing asset, nine languages,
320/390 desktop RU200, both dark accent themes and light; Axe and no unexpected
external requests. Verify Website shell prepare then network-off reload still
opens each of three JSON-backed features. Report JS/data/whole-shell sizes,
exact copied JSON hashes, evidence and remaining parity gaps. Then freeze and
independent Terra QA; no live/deployment/PO/Android release approval.
