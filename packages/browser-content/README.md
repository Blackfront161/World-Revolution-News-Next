# Shared browser content

Source-only internal library compiled by the consuming Mobile and Website apps.
It is intentionally not a separate package-manager project: no new dependency,
installation or generated module links. Public contract/domain/copy imports use
their existing package exports through the explicit browser-content alias helper
and TypeScript paths. React runtime is resolved from the consuming app.

The library owns bounded same-origin transport, offline operation/IDB mechanics,
production safety and immutable release handling, reading state and one reader
renderer. Pure contracts/domain remain free of browser/React dependencies.

Clients provide trusted database name, reading key, controller factory, heading
ID and archive trigger ID. There is no shared client singleton or default storage
name. Mobile wrappers preserve the existing APIs and the exact Mobile keys.
Website must supply its own keys and own navigation/share adapters. Never derive
these identifiers or the fixed production pointer from content/query/storage.

Client entry points, navigation, Android, Service Worker/CacheStorage, website
publication/SEO and editorial admission remain outside this library. Tests run
through the consuming app suites and the actual-browser two-client isolation
test; source is included by app TypeScript and workspace lint/boundary scans.
