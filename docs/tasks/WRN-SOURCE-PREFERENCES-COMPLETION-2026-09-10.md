# Complete original source profiles and follow/hide requirements

Parent: RELEASE-COMPLETION plus original G2 requirements audit accepted by PO.
The user asks to finish previously requested additions; no new PO decision is
needed for this confirmed missing requirement. Root binds the implementation
after a small read-only seam inventory, preserving existing user preferences.

Stage1 Delegation: erlaubt, Slot1 one fresh Luna routine code inventory, no
children. Own only docs/evidence/WRN-SOURCE-PREFERENCES-INVENTORY-2026-09-10.md
and matching docs/handoffs file. No product, test, Git index, browser or network
rights. Current Core177d7d8/image9aa75a68 stays frozen. Root works independently
on the already bound native statusbar correction.

Identify actual production source/profile controls in both clients, shared
personalization contracts/storage/UI and source IDs in article/directory data.
Identify reusable original fixture profile/follow/hide code without importing
fixtures. Read original G2/PO092 audit to bind exact source requirements and
exclusions. Recommend smallest concrete file-owned integration with migration
strategy, clear semantics (follow priority vs exclusive filter, hide effects,
directory access, retained saved articles), accessible control and tests.
Do not invent source identities or silently conflate IDs across generations.
Report exact paths/type fields and any mapping blocker with examples; do not
copy thousands of rows or do a broad re-audit. This is an inventory, no release
or architecture approval by Luna. Root decides versioned contract and scope.

Handoff follows template with source hashes/status and END-CHECK: :). Exact
token cost unknown; stop at a bounded useful result and do not retry quota.

## Stage2 bound implementation contract

Inventory complete; Root chooses an additive separate source-preference V1
sidecar rather than rewriting existing interest/region/language V1 data. The
two client keys will be wrn.mobile.source-preferences.v1 and
wrn.website.source-preferences.v1. Existing preferences, reading data, IDs and
content contracts are preserved. This is an implementation decision under the
confirmed requirement, not a new PO question or source-admission approval.

Identity is explicit { catalog: 'production' | 'directory', sourceId: string }.
Production uses exactly article.source.id; directory uses exactly endpoint.id
and article.endpointIds. There is NO cross-catalog, sourceName, hostname or URL
join. The directory controls clearly concern that endpoint. Unknown IDs remain
stored and reversible rather than silently pruned when absent from a snapshot.

Document exactly { contractVersion:'1.0.0',
schema:'wrn.local-source-preferences.v1', choices:[{catalog,sourceId,action}] }.
action is follow or hide; neutral removes the exact scoped entry. At most256
unique scoped entries, document max64KiB UTF8, each production ID1..160 UTF8
bytes with no control characters or surrounding whitespace; directory ID must
match source-[a-f0-9]{64}. IDs stay opaque, case-sensitive and unmodified. The
validator rejects extra keys, duplicates and unsupported future versions but
does not require known catalog membership. No names/URLs/articles/timestamps
or behavioral activity in stored choices. Latest explicit action replaces the
same scoped choice, so follow/hide cannot conflict for one ID.

Projection: a hidden source removes an item from normal home/discover/for-me
lists; any hidden endpoint dominates any followed endpoint for multi-endpoint
directory news. Followed sources sort first stably, preserving remaining order
and never forming an exclusive filter. Source management stays reachable for
unhide; saved items and direct readers remain accessible. Existing article
safety/admission/revocation filtering runs before this projection. No new
source preference overrides other explicit language/interest/region filters.

Core Delegation: erlaubt, Slot1 one fresh Terra backend writer; no children.
Own only six NEW files:
- packages/content-contracts/src/source-preferences-v1.ts and .test.ts
- packages/domain/src/source-preferences.ts and .test.ts
- packages/browser-content/src/source-preferences-state.ts
- apps/mobile/src/source-preferences-state.test.ts
No exports/index/client integration or existing product/test edits. No browser,
network, Git index, native tasks, dependency changes. Root handles separate
native/image evidence and source UI design; Slot2 native review is read-only.

Public names: SourcePreferenceCatalog, SourcePreferenceChoice,
LocalSourcePreferencesV1; isLocalSourcePreferencesV1; sourcePreferencesMaxBytes.
Domain exports emptySourcePreferences(), getSourcePreference(state,catalog,id),
setSourcePreference(state,catalog,id,action:'follow'|'hide'|'neutral') returning
validated new state or null, and projectSourcePreferences<T>(items,state,catalog,
sourceIds:(item:T)=>readonly string[],options?:{includeHidden?:boolean}) returning
stable follow-first projection. Do not mutate inputs. A hidden saved entry with
includeHidden:true stays accessible but is not treated as followed.

Store exports createSourcePreferencesStore(key, storage?, eventSource?), with
load/save(loaded,next)/clear(loaded)/dispose. Reuse the current local-personalization
store's one-use WeakMap authorization, raw compare-before-write, readback and
fail-closed protected/unavailable behavior as a behavioral reference (do not
modify it). load kinds inactive/ready/protected/unavailable; ready has state,
expectedRaw. Save kinds saved/blocked/invalid/conflict/unavailable/write-failed/
verification-failed. Clear kinds cleared/blocked/conflict/unavailable/remove-failed/
verification-failed. Storage events for own key OR key=null invalidate captured
loads. No save on load; corrupt/future/oversized raw preserved; clear only from
explicit UI action with confirmation later. No optimistic success or destructive
rollback after uncertain writes. Separate client keys never cross-invalidate.

Tests: invalid/future/oversized/duplicate/scoped identity, neutral and follow/hide
replacement, stable rank and hidden dominance, saved inclusion, unknown retention,
same-name/unrelated namespace separation, wrong-store/consumed loads, quota/readback
errors and concurrent/key-null storage changes. Typecheck and focused tests.
Writer owns only own WRN-SOURCE-PREFERENCES-CORE-WRITER evidence/handoff as
additional two doc paths, gives compact evidence and returns rights; no integration
GREEN before Root reviews/tests and binds the subsequent visible UI scope.

Core import-boundary clarification: writer may additionally append only the
new module's public re-export in packages/content-contracts/src/index.ts and
packages/domain/src/index.ts. Use those existing package entrypoints across
packages, never private relative cross-package imports. No package.json,
dependency or other existing export changes. This overrides the earlier
no-index/export line only for these two source export files, not Git's index.

Core writer returned all rights after21focused tests and3typechecks PASS. Root
reviews/reproduces the same bounded core. Before integration, replace repeated
whole-document validation in the projection's per-item lookups with one scoped
lookup map built after the existing single validation. This keeps the exact
semantics while avoiding repeated64KiB serialization across973 directory items.
No contract or test expectation changes; existing ordering/dominance tests apply.
