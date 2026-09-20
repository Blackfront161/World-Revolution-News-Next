# Task Brief — production capacity V3 core

## Identity and ownership

Parent: RELEASE-COMPLETION, accepted Home1+5/further and actual news supply.
Design: WRN-PRODUCTION-CAPACITY-DESIGN-2026-09-11 at38f9553c, returned by Sol.
Root accepts the design with the exact padding clarification below. Delegation:
erlaubt, one backend_data_reliability_engineer Terra/high writer; no children.
Root reserves Slot2 only after independent Home QA returns. Source baseline is
the separately committed gate plus81492cd5 Home. Shared checkout; preserve all
other edits. Root integrates; fresh independent Sol reviews the completed core.
One focused implementation, checkpoint after initial tests, then handoff; do
not add an architecture/review ladder. No browser or network in this phase.

## Observable objective

The versioned core validates6/8/64 authored articles within bounded bytes,
retains V1/V2 behavior exactly and resolves/saves V3 under existing safety and
offline identity rules. Actual2EFF packets stay unchanged. This stage does not
activate V3 transport, generate a real release or claim64admitted articles.

## Exact allowed paths

Existing under packages/content-contracts/ only:
- package.json; src/index.ts;
- src/production-content-release-v1.ts; src/production-content-release-v2.ts;
- src/production-content-compatible.ts; src/production-content-offline-compatible.ts;
- src/production-content-offline-v1.ts, only shared extraction of the safety
  validator into a policy-bound internal path; publicV1 behavior/control/schema
  remain unchanged. Root verified V2's safety currently calls this V1 function.
- tests/production-content-release-v1.test.ts; tests/production-content-release-v2.test.ts.

New under that same package only:
- src/production-content-capacity-policy.ts;
- src/production-content-release-v3.ts;
- src/production-content-validation-internal.ts if needed to avoid duplication;
- tests/production-content-release-v3.test.ts;
- tests/production-content-offline-compatible.test.ts;
- tests/production-capacity-support.ts, authored test helper only if needed.

Own new CAPACITY-CORE-WRITER evidence/handoff dated2026-09-11 and same-named
output directory. No other file writes, especially browser-content, tools,
UI, data/assets, pnpm/root config, dependencies or content-release-core-v1.ts.
Tests may create only fresh temporary files in owned output. No index/commit.

## Binding semantics

Use Sol's single shared policy validator; publicV1/V2 fixed to immutable pilot
policy3articles/512KiB each/4MiB total. Never expose a publicV1 option to relax
its limits. Keep content-release-core-v1.ts byte-identical. V3 descriptor and
manifest3.0.0 with V3 schemas; reader/media staysV2; pointer staysV1. Preserve
private accepted-Ready proof and all canonical hashes before projected proof.

V3:64articles; articles/admission384KiB each, discover/archive128KiB each,
reader2816KiB, sum3840KiB; exact canonical offline envelope4096KiB. Existing
3slot/12MiB store and all sequence/Clear/safety identities remain unchanged.
Images keep256KiB/8perarticle/32perrelease and add1536KiB raw aggregate.
Padding clarification: sum(base64 lengths) is not always exactly4/3 of summed
raw bytes. Also cap actual encoded image strings at2048KiB and test mixed
lengths/padding; never infer encoded size by aggregate multiplication. These
caps apply before decoding beyond each admitted image's existing bounded check.

Phase1 validator checks V3 descriptor/manifest/archivelifecycle identity,
counts/caps/hash/safety before payload. Full factory checks all resources,
aggregate bytes, media rights/digests and article provenance before Ready.
Compatibility dispatcher and offline wrapper support V1/V2/V3; old public
entrypoints continue rejecting unknown versions. No content or control schema
migration, no loss of highestAcceptedSequence after rollback/Clear.

## Acceptance

Run old complete contract suite and new focused tests with <=2workers;
package typecheck, scoped ESLint/Prettier and workspace boundaries. Record exact
test counts and unchanged pins. New distinguishing tests cover6/8/64accepted,
65rejected; each byte/image/count limit-1/limit/limit+1 where constructible;
unconstructible aggregate combinations need an explicit mathematical explanation
plus the real envelope test, not an unreachable artificial oracle. Old V1/V2
4article and resource512KiB+1 rejection unchanged. Wronghash/count/version,
safety revision/aliases/withdrawals, forged or cloned Ready cannot resolve/share.
V3offline roundtrip preserves bytes/identity/safety, rejects tampering/oversize;
new dispatcher restores real unchangedV1/V2. Actual packet and core pins fixed.

Transport/controller/browser and deterministic builder/site acceptance from the
design are the next integrated phase, not omitted completion claims. No visual
change or browser matrix here. No provider, install, signing, deployment,
raw-feed download or client activation. Rollback is a later ordinary revert of
this isolated local commit, never rewriting history. Template handoff with
changed files/tests/risks, exact next seam, rights return and END-CHECK: :).
