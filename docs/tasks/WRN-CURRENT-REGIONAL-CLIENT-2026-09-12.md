# Current regional events: explicit selection and both clients

Root implementation authorized by the continuing PO completion request and
independently accepted regional contract4223737e/f03fe37a. Delegation: erlaubt
for subsequent independent QA only; no children. Root alone owns this package,
disjoint from A6 Sol Slot2. Browser43192-93 belongs to Root;43173-75 stays A6,
user43190/91 and all historical artifacts remain intact.

User value / original G2 wish: following Sport on Home and in Events, choose a
continent/country/region and show up to five actual coming/ongoing events with
original source, exact available date precision and freshness. No unrelated
filler, inferred location or misleading live/coverage claims. Existing historical
Events directory and fixture regional contract remain unchanged in semantics.

Exact allowed files:
- new packages/browser-content/src/regional-events/{selection-store.ts,data.ts,
  events.json,regional-events.tsx,regional-events.css}
- new packages/ui-language/src/production-regional.ts and its own tests
- packages/ui-language/package.json, tsconfig.base.json,
  tools/browser-content-aliases{.mjs,.test.mjs}: exact public copy export only
- packages/browser-content/src/{production-home.tsx,production-content-ui.tsx,
  events-media-directory.tsx}: optional regional slot and independently rendered
  current-events slot even while historical data loads/fails
- apps/{mobile,website}/src/App.tsx and each features/events-media/*Route.tsx:
  thin client-specific composition only
- new apps/mobile/src/production-regional.test.tsx
- new tests/e2e/production-regional.spec.ts
- own evidence/handoff/helpers/config/output under WRN-CURRENT-REGIONAL-CLIENT-
  2026-09-12 and Root status/register metadata.

Data is generated from the accepted input; preserve its compact SHA, source
dates, validUntil and metadata-only rights. No fresh date merely from rebuild.
Copy in all nine UI languages; titles/source language attributes retained.
Client view uses existing validated projection, never duplicated date/filter
domain logic. Recheck clock on mount/visibility/focus and every minute, clear
timer on unmount. Expired/unavailable input has an honest status and sources,
no false refresh button or fictional current list.

Persistence is one minimal versioned explicit choice record with generation,
in distinct wrn.mobile-regional-selection.v1 / wrn.website-regional-selection.v1
databases. No GPS, URL/history, contacts, analytics, auto-default or external
write. Unchanged generic IDB mechanics; single selection store/key choice,
initial record only in versionchange, strict schema/no extra rows or fields,
bounded read, CAS generation, snapshot before await, precommit and postcommit
readback, abort tracked transactions on close/versionchange. Missing/corrupt/
future schema is protected unchanged. Clear writes empty choice and increments
generation. Explicit Save only; unavailable storage permits temporary selection
with honest notice. No migration from old fixture or shared app/website stores.

Acceptance: load/saved/reload/clear/isolation/CAS/mutation/abort/corrupt/future
actual-IDB checks; contract-pinned input and selection projection; nine-language
copy/type/static checks; both real client routes/Home with selection, stale,
offline reload and source links, keyboard,44px controls/no horizontal overflow.
Screenshots both themes at320/360/390/412/600/800, landscape, website1024/1280/
1440/1920 and RU200 reflow; targeted axe. Narrow tests first; no simultaneous
broad suites with A6. Both local builds, independent QA after candidate freeze.

Rollback is reverting this package's commit; existing historical databases,
images/previews and A1-A6 remain intact. No install, signing, version, dependency,
provider, CSP, deployment, native or public source activation. Automated refresh
and regional coverage expansion stay explicit later work, not hidden completion.
