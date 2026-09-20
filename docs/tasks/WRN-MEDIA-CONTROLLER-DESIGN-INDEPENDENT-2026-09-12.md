# Independent controller design precheck

Delegation: erlaubt. After this separate gate existing independent Sol
media_resume_independent reviews the frozen Terra controller design at
docs/evidence/WRN-PRODUCTION-MEDIA-CONTROLLER-DESIGN-2026-09-12.md against the
actual accepted A2/A4/A5/A6 APIs. Read-only, no children/browser/index/product.
Write only own docs/evidence/WRN-MEDIA-CONTROLLER-DESIGN-INDEPENDENT-2026-09-12.md
and matching docs/handoffs. Root native staging and Sol A6 correction are disjoint.

Determine whether the eight-file implementation can begin once A6 closes. Return
precise, implementable conditions or bounded findings, not a broad architecture
rewrite. In particular verify: finite completion of all orchestration (not only
A4 transport); A6 readActive lacks activeKey, so exact context identity and
generation binding need a concrete API-compatible derivation; invalidating only
active audio on a successful revocation commit must not abort its own safe source
operation; late resume compensation versus dispose/closed stores/clear; exact
A5 no-op/CAS semantics and whether retry may delete a concurrent new record;
same-buffer continue and pause-save behavior; error/observer reentrancy. Inspect
the proposed shared test location against actual package test/boundary rules.

The provider-policy draft is separate and not part of this precheck. A6 finding
closure remains a later narrow task on frozen corrected bytes. Do not review or
copy the writer's changing A6 source as a completed candidate yet. Return all
rights; no self-fix of product or authoring the implementation.
