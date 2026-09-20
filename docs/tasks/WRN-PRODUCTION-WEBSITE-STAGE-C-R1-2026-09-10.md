# Stage C R1 — deterministic Website publication identity

Parent Stage C, candidate6f825bf. Root only, no delegation/writers. Sol observed
that changing only website-publication.revision passes generic validation and
can reach emitted audit metadata. The existing generic contract deliberately
allows an independent publication revision (positive test revision website-1),
so do not silently rewrite that contract or its positive oracle.

This deterministic Stage-C publisher chooses the Core release revision as its
publication revision. Enforce that profile at the Website disk admission seam:
publication.revision must equal ready.descriptor.releaseRevision. Generic Core
remains unchanged. Same strict profile already fixes origin and generatorVersion
at publication. No source text, core bytes, storage, client UI, alias or schema
change is allowed/needed. No new architecture cycle.

Root exact two source/test paths:
apps/website/tools/production-content-release.mjs and its .test.mjs; own R1
evidence/handoff and PROJECT-STATE/register. New negative test copies a real
admitted disk release to fresh retained output, mutates only top-level publication
revision, proves both loader rejection and publisher refusal before any output
directory is created. Existing generic independent-revision positive stays PASS.
Demonstrate RED on6f825bf before the correction, then all Website46+new Node
and relevant Core tests/type/static. No UI change warrants a repeated visual
matrix. Freeze separate candidate, same Sol independently closes its exact
finding and Terra checks this narrow two-file change. Preserve Stage-C34pins
except these explicitly changed two; all32images remain applicable.

No installation/signature/version/deployment or release/PO acceptance claim.
END-CHECK: :)
