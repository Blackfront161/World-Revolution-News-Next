# Deterministic production delivery package

Parent RELEASE-COMPLETION and completed DELIVERY-DESIGN; Delegation: erlaubt,
no children. Root reserves existing Slot1 production_mobile_b1 (Terra/high)
for exactly two NEW files tools/prepare-production-content-delivery.mjs and
tools/prepare-production-content-delivery.test.mjs, plus matching DELIVERY-PACKAGE
WRITER evidence/handoff. No existing sources, App/profile, package/index, browser,
Git, generated checked-in public assets or other worker files. Root prepares
unimported personalization; Slots2/3 independently validate Events/Media.
You are not alone; preserve everyone else's changes and stay within ownership.

## Output and behavior

Implement exported prepareProductionContentDelivery plus a CLI, using the exact
reusable buildProductionContentRelease, buildWebsiteProductionContentRelease,
loadWebsiteProductionContentReleaseFromDisk, publishProductionArticleLandings.
Do not copy their validators/generators. Read the completed DELIVERY-DESIGN.
Inputs: local admitted buildInputPath, explicit previousLedgerPath (null is
intentional genesis; undefined fails), explicit generatedAt UTC, absent output
under explicit trustedWorkspaceRoot. CLI requires --genesis or --ledger exactly
one and explicit input/output/generated-at. No network, wall-clock build fields,
environment endpoints or provider calls. All files/symlink/parent/path/bounds
checked before mutation; existing output including an empty directory remains
intact. Use fresh retained staging under the authorized workspace, no deletes.

Endpoint is fixed https://solinaridao.com/wrn-production-content/, site origin
https://solinaridao.com/. Generate preactivate with ONLY eight immutable revision
files (seven Core plus Website publication) and four static publication artifacts
(articles, sitemap, robots, static manifest). current.json goes ONLY under
activate/wrn-production-content/current.json. Audit artifacts/staging/Core scratch
never enter the deployable manifest. Pointer bytes must match the generated Core.
Delivery manifest has exact schema/version/endpoints, ordered activation groups,
canonical next-ledger hash and sorted {path,bytes,sha256} for all deployable files.
Validate complete path sets and every emitted hash/byte/ID binding via the reused
loader and static manifest before producing a successful final output.

## Ledger precision added by Chief

Use exact wrn.production-static-delivery-ledger.v1 shape from design with maximum
512 entries and bounded4MiB JSON. Each entry records sequence, releaseRevision,
descriptorSha256, manifestSha256, safetyRevision, publicationSha256,
staticManifestSha256, generatedAt, articleIds. All hashes/IDs/formats validated,
sequences strictly increasing, revisions/descriptor identities unique, sorted
unique article IDs, monotone generatedAt/safetyRevision, highestSequence matches
last. Genesis sequence1 only, explicit null previousLedgerSha256; later ledger
hash binds exact supplied previous ledger bytes. Reject overflow, do not evict.

Also store an exact root safetyLedger {revision,revokedIds}, validated with the
existing public isProductionContentSafetyLedgerV1, and bind its revision to the
last entry. This closes a design omission: recording just a number cannot prove
cumulative revocations. Every prior revoked ID must remain in the newly generated
Core safetyLedger, no lower revision; same revision requires identical revoked
IDs. A sequence rollback is a NEW higher sequence/revision with current safety,
never a lower current pointer. Existing client/Core contracts remain unchanged.

## Meaningful acceptance

Use the actual accepted two-article admitted build input for positive byte
comparisons (locate exact path in PILOT evidence; no invented admission). Two
identical runs produce identical deployable bytes, manifest and ledger; follow-up
release has higher sequence with preserved identities. Tests distinguish malformed
ledger/duplicate fields or IDs/hash/sequence/revision/safety/date, absent genesis,
513th entry, revoked-ID loss, unexpected path, symlink/traversal and existing
caller-target preservation. Exercise CLI success/error from non-root cwd. Keep
fresh test artifacts under workspace/test-results, no rm. Add bounded injected
copy/write failure hook only if needed to prove failure leaves existing outputs
intact and never reports a ready package; no general server-promotion function.

Preparation does not execute promotion. Include an exact machine-readable order
placing current.json last and concise generated operator instructions for later
read-only hash/header checks and separately authorized publication. Actual
server atomicity/rollback drill, CORS/CORP/MIME, live hash/Android and external
publication remain final concrete gates. Do not describe a package as a live feed.
No installs, signing, version bump, deployments, paid APIs, secrets or children.

Run Node tests/scoped lint/format; return actual evidence and gaps, do not stop
at a plan. Root integrates and independently reviews the frozen two-file result.
END-CHECK: :)
