# Correct post-layout Mobile font-size observation

Standing PO continuation; independent Sol diagnosis under5d51d1a1 confirms
MOBILE-RESIZE-REFLOW-M-001 in4689083e. Read diagnosis report and exact trace.
Root alone implements two paths: apps/mobile/src/App.tsx and
tests/e2e/production-home.spec.ts. Own matching correction report/handoff,
fresh evidence/helper directory and status. No child delegation for this fix.
Slot1 Sol returned browser; Slot2 Terra's pure media contract remains disjoint.
No CSS/content/provider/legacy/player/store changes, no installs/signing/deploy.

Use a ref-backed ResizeObserver on the existing UI language select, calling the
existing update predicate after layout; retain initial/mutation/viewport inputs
and disconnect during cleanup. Guard unavailable ResizeObserver in unsupported
test/runtime environments. No timer, fixed-frame delay, synthetic resize or
separate font-size rule. Existing CSS document-flow fallback remains unchanged.

First add exact1100x1000/DE/Home screenshot/compact headline scroll/image decode/
screenshot ->390x844/RU/font200 sequence in production-home.spec.ts. Require
wide-layout true, main height>400, admitted image in viewport, no horizontal
overflow or pageerrors; reset to100% and1100px and require normal mode again.
The frozen old build must fail the meaningful assertion before product edit.
Then fixed new source passes this case and existing13Home matrix, focusedApp
unit and MobileType/lint/format. Preserve screenshots in unique dirs with hashes.

Build new Mobile/current unsigned native assets from committed corrected source
under the existing guarded helper. Website is unchanged: retain its prior
verified package and exact bytes unless paired builder runs are required.
New local previews43190/91 allowed; retain all older previews and artifacts.
Native builds offline only, no version/sign/install. Sol independently closes
this finding plus compact-image visual/artifact gate after frozen handoff.
Rollback: isolated two-path code revert; no storage/data migration or external
effect. Original bad images/failure traces remain clearly labelled historical.
