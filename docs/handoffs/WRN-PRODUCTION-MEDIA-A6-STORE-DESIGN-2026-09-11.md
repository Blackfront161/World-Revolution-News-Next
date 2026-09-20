# Agent Handoff

- Agent: `production_translation_independent`
- Task-ID: `WRN-PRODUCTION-MEDIA-A6-STORE-DESIGN-2026-09-11`
- Ergebnis: bestanden als enger Implementierungsvertrag
- Rolle/Instanz: Root Slot1; independent Sol reviewer/designer; no children
- Basis: gate `2fba69aa`, A1/A2/A3/A4 accepted boundaries, unchanged IDB core
- Schreibumfang: matching A6 design evidence, handoff, helper and output only
- Reviewadressat: Root

## Kurzfazit

Use a new client-isolated media release/safety store with raw A1 metadata,
admitted safety, three slots, generation/clear CAS, a durable 512-identity
high-water ledger and actual post-transaction safety readback. Never persist or
manufacture A1 `Ready`; A1 reconstructs historical proof and mints a current
`Ready` only after cumulative safety, floor, expiry, origin and revocation
checks.

The proposed 256 KiB control cap is unsafe. The bound proof yields 304,855
bytes before margin. Bind 384 KiB control, three 1 MiB bundles and 3,456 KiB
total. The bundle cap is checked against complete canonical nested storage, not
the 311,296-byte raw wire sum.

## Required A1 seam

Add centralized safety snapshot/equality/monotone-merge helpers and an opaque
historical-validation/current-activation pair inside A1. This allows rollback
of retained old raw metadata above the current floor while applying every
current cumulative revocation. Store code must not copy private A1 validators
or cast a `Ready`.

## Required persistence behavior

Safety commit and newly unsafe slot removal are one IDB transaction, followed
by a fresh exact readback for A4. Clear preserves safety, high-water and all
identities. Only the exact current-high identity may re-stage after clear;
lower sequence cannot re-enter. Rollback selects only retained, current-safe,
unexpired previous content and never lowers high-water.

## Evidence and scope

The report gives exact schemas, transitions, failure races, file list and
contract/browser oracles. The byte proof is in the matching evidence directory.
No product, standard-test, index, browser, network, audio or provider path was
changed or exercised.

## WRN-AGENT-STATUS

- Task: A6-STORE-DESIGN
- Status: GREEN design; no implementation claim
- Bounds: 393,216 control / 1,048,576 each bundle / 3,538,944 total
- Finding: 256 KiB rejected; corrected in design
- Offen: bounded writer, independent IDB review, integration/provider gates
- Handoff: this path and matching evidence report/helper/output
- Rechte: all A4/A6/Slot1 rights returned to Root
- END-CHECK: :)
