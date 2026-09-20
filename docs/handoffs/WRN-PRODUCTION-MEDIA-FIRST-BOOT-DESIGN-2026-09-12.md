# Production media first-boot design handoff

Gate `1229cdb9`. The bounded design is **PASS and implementation-ready** after
A7 acceptance. Use a request-free build-bundled raw initial release through a
new local source adapter, then the normal amended A7 -> A6 -> A1 path. Do not
fake A4/Response URLs, relax HTTPS transport or seed IndexedDB directly.

Add optional A7 `initialSource` plus `bootstrapInitial()`. `mount()` remains
local-only. The route calls bootstrap once after a `no-active-release` mount;
the command proceeds only for an exactly pristine A6 store. A6 clear retains
high-water/identities, so clear, prior history, expiry/revocation or a later
release can never be silently repopulated/downgraded by the bundled candidate.

The local source validates revocation safety and awaits its exact durable A6
callback before full A1 validation. A7 saves/activates and installs only a fresh
A6 `readActive` Ready. The shared generated raw module contains no audio and
both clients bind the same hash. Its seven-day validity remains enforced; an
old build falls back to the unchanged historical original links.

The shared production UI is inserted after the existing Media heading without
replacing the historical directory. It provides localized current episode,
fresh Play/Resume consent, exact recipient/privacy/data disclosure, pause/
same-run continue/seek and finite failure states. Cancel/Escape/unmount create
no Audio, restore or discard focus correctly, and route unmount synchronously
disposes A7. Final confirm calls `confirmPlay(prompt)` synchronously in the
user's click.

The exact 22 future paths, test matrix, evidence set and prerequisites are in
`docs/evidence/WRN-PRODUCTION-MEDIA-FIRST-BOOT-DESIGN-2026-09-12.md`. No extra
architecture cycle is recommended.

No production media release or provider is admitted today. Provider policy if
needed, whole-episode rights, exact CORS/range/MIME/size evidence, both CSPs,
native/browser acceptance and a future HTTPS update deployment remain separate
release-critical gates. Product, tests, browser, network, provider, native and
index were untouched; all rights are returned.
