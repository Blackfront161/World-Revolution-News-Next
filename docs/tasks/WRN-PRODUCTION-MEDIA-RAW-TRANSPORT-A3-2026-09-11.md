# A3 raw media metadata transport

Root-only writer, no delegation/children; independent A2 code remains frozen.
Standing completion mandate, accepted media design and returned Terra seam map.
Own exactly two new product/test files plus matching A3 evidence/handoff:
packages/browser-content/src/production-media-transport.ts and
apps/mobile/src/production-media-transport.test.ts. Existing news transport,
old V1, A1/A2, client routes, dependencies, live data and providers unchanged.

Implement the smallest media-only raw reader using existing waitForAbortable
mechanics. Compiled normalized HTTPS origin is injected at construction, never
taken from content. A session begins one12s total deadline encompassing all
its reads and caller waits; each request has3s for headers. Session exposes
read(path,maxBytes), wait(work), check(), signal and close(). wait invokes the
supplied promise factory only after checking the current session. No retry; each
allowed path at most once, at most7requests, all errors abort the whole session.
Only current.json or the six exact release filenames under/content/media/v1/
with bounded opaque revision accepted. Per-route caps16KiB/32KiB/128KiB; at most
311296received decoded bytes per session (pointer+descriptor+aggregate docs).
Future receipt loader still owns graph binding/order and safety-write gating.

Return exact detached rawText/byteLength, never JSON.parse or canonicalize.
Fetch no-store/credentials omit/no-referrer/redirect error; require200 and exact
application/json MIME. Check declared and streamed limits, Content-Length match
for identity encoding, fatal UTF8 and explicit leading BOM rejection. Cancel
late and stalled bodies and observe late promises; close/abort/header/total
timeout must settle even with noncooperative injected fetch/body/cancel. No
payload/URL logging. Store/receipt/builder/provenance and browser integration are
not part of this reader and cannot be inferred from passing it.

Tests: raw whitespace/Unicode byte identity, exact paths/trust origin and option
values;2999/3000/3001headers,11999/12000/12001overall including sequential reads
and wait; caps at/around limits, duplicate/max request and global byte budget;
redirect/status/MIME/content-length/BOM/badUTF8; caller abort and late/noncooperative
header/body cancellation; independent sessions and close. Use existing tools,
reserved invalid origins, no actual network. Run focused tests, both client
types and scoped static/boundary checks. Narrow independent review follows;
no browser/native rebuild needed for unconsumed code. Rollback is isolated files.
