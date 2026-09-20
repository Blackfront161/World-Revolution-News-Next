# Current regional events — bounded production contract

Root owns this disjoint continuation under the standing completion request.
Delegation: nicht erlaubt for this writer scope. Existing Terra owns A6 flat
media files; Root owns only new files in src/directory and tests/directory
below, plus own evidence/input/handoff. No edits to shared exports/aliases until
Terra returns those paths. Sol later independently reviews the frozen contract.

Sources: original G2 excerpt (local continent/country/region selection, five
upcoming events after Sport, source/timezone/freshness, no GPS);12September
primary organizer/venue reads and11September five-candidate report. Preserve
old fixture and historical event contracts. Never label publisher data CC0 or
replace historical pinned data. No poster or full announcement copying.

## Exact scope and observed behavior

- packages/content-contracts/src/directory/production-regional-events-v1.ts
- packages/content-contracts/tests/directory/production-regional-events-v1.test.ts
- matching CURRENT-REGIONAL-CONTRACT evidence/input/handoff only.

New separate wrn.production-regional-events.v1 document, immutable raw hash
bound by a trusted build pin, max128KiB/256 events/64 sources/64 regions. Exact
keys, stable unique IDs, region-country-continent graph, HTTPS original links,
language, source type organizer/venue/attributed announcement, checked dates,
source references and metadata-only rights. Return a detached frozen document.
Release revision positive, generatedAt/validUntil canonicalUTC with at most7days.
Integrity validation remains distinct from freshness; old bytes are not relabeled
current. No remote fetching, database, audio, source auto-admission or UI yet.

Schedule is explicitly either day precision (inclusive start/end local dates
and an IANA zone) or minute precision (canonicalUTC start/end with an IANA zone).
No invented midnight for unknown hours. Dates must be real calendar dates;
time ranges ordered and bounded366days. Public helper projects at most5 matching
upcoming/ongoing events from an explicit continent/country/region selection,
with actual zone-local date checks for day precision. No selection means no
personal projection; empty/stale/invalid states are explicit. Sorting is stable
and deterministic; day-only results sort by local date without pretending a
known instant. Withdrawn/cancelled events do not project. Never infer location.

## Acceptance and boundaries

Tests: raw hash/bytes/schema/unknown fields, Unicode unsafe/invisible text, URL
credentials/local hosts, duplicate/dangling source/region/identity, real leap
dates, exact date/instant end boundaries, cross-zone midnight, nonfinite clock,
unknown zone, day precision, stale/future release, cancel,5/6 cap, hierarchy and
unselected/invalid selection. Types/scoped static and existing directory tests.
No screenshots claimed before UI. The output is a locally validated contract,
not a completed regional product feature. Rollback by separate scoped change;
no deletion, install, external write or release action.

Integration addendum: Terra returned its four shared export/alias paths at A6
checkpoint1. Root now exclusively owns packages/content-contracts/package.json,
tsconfig.base.json, tools/browser-content-aliases.mjs and its existing test.
Add exactly production-media-offline-v1 and production-regional-events-v1 public
subpaths for both clients. No broad/private aliases or dependency changes.
Source day checks also bound release validity: no later than the end of the
seventh full UTC day following the source's calendar check date. Rebuilding a
catalog cannot silently refresh an old source check. Mixed day/minute ordering
must be transitive (date, explicit precision group, known instant, stable ID).
