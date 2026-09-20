# Production paragraph translation — shared client implementation

Parent: RELEASE-COMPLETION and accepted TRANSLATION-DESIGN-2026-09-11.
Service correction 6bcb6e0b is independently GREEN, four findings closed.
Delegation: erlaubt for subsequent independent QA only. Root owns implementation
after this separate gate commit; capacity Terra owns disjoint contracts only.
No children, installation, provider request, external configuration or deployment.

Implement the existing design's client slice in exactly its shared
production-translation.ts (new), production-content-view.ts,
production-reader-blocks.tsx, production-content-ui.tsx/.css; each client's new
production-translation-adapter.ts/.test.ts and existing production-content-ui.tsx,
package.json and src/vite-env.d.ts; mobile production-reader-blocks.test.tsx and
production-content-view.test.ts; website production-content-adapters.test.tsx;
new ui-language/src/production-translation.ts/.test.ts and package export;
new tests/e2e/production-translation.spec.ts and -harness.ts. Root may add the
new copy subpath to tsconfig.base.json/tools/browser-content-aliases.mjs and
declare only the API workspace links in pnpm-lock.yaml. No new dependency.
New CLIENT evidence/handoff and uniquely named browser output are owned by Root.
No App.tsx, fixture, content release, store/controller, API/service or theme edit.

One shared optional paragraph action, nine languages, original always visible.
Visible pre-action disclosure; no automatic requests. Client-local identity binds
release/manifest/article admission hash/block index and hash/source/target/adapter/
active key/safety revision/expiry. All route/identity/offline/clear/rollback/unmount
changes abort or discard pending work; translated text is memory-only. Responses
are bounded before JSON parse, exact contract/hash/echo/adapter/provider/expiry
checked, rendered as text. Complete fetch/body/hash phase deadline 15000 ms.
No-op for same language; missing public compile-time configuration is visibly
unavailable and cannot send requests. Each client separately instantiates its
endpoint and expected adapter ID/version/provider. No live origin is invented.

Unit tests exercise each client through the same behavioral contract, all stale
identities and no outbound IDs, wrong/oversize/HTML/hash/expiry/error, uncooperative
fetch and body deadlines, abort and retry. Renderer tests keep original text and
language through states; non-paragraph blocks never get actions. Existing view
and site adapter tests remain true. Exact nine-language keys/placeholders.
Intercepted real-reader browser checks cover both clients, keyboard/Axe/320px/
200%/both black themes, success/error/offline/retry/stale behavior with no escaped
external request. Capture selected PNGs and hashes in a fresh evidence directory.
Relevant units/types/build/static/boundaries follow stable implementation; direct
installed binaries are used while pnpm workspace dependency-state is unreconciled.
Independent Sol review follows one pinned candidate; no new design review loop.

This finishes local client behavior, not the disabled service's live activation.
Target adapters, old SEC-001 route, budget/retention and deployment remain explicit
external gates already named in the accepted design.
