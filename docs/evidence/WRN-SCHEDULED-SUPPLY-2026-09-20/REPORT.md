# Scheduled supply preparation

`.github/workflows/wrn-content-supply.yml` is a local GitHub Actions
preparation only. It runs every six hours after a later merge, but this packet
has not been pushed or executed.

The scheduled default resolves the current `main` commit of the existing public
`Blackfront161/Revolution-News-Data` repository, then calls the existing
bounded `tools/run-legacy-news-supply.mjs` without a reviewed batch. That
preserves the runner's `awaiting-admission` receipt: new feed candidates,
including sport, remain unadmitted until a separately reviewed V3 batch and
bindings exist.

The manual `include_reviewed_v5` path is deliberately stricter. It requires an
explicit 40-character upstream commit and reuses only the existing V5 previous
input, its canonical JSON hash, a bounded copy of the V5 delivery
`next-ledger.json` (`inputs/v5-next-ledger.json`, SHA-256
`9edf4fc1a1c3cc1af9c5fdcb23d3cdeb38332dfda47de3d8107533220d91120`), and
the one reviewed EFF batch/bindings. It therefore retains the existing no-change and
fail-closed contracts; no sport draft or metadata-only note can enter it.

The job is compatible with the target repository, has read-only `contents`
permission, credential-free checkout, an eight-minute timeout, and one concurrent
run. Every scheduled and manual run
requires `dry_run: true`; the runner records that in its bounded receipt and the
workflow rejects any other mode. The V3/V6 delivery pointer remains only in the
ephemeral local bundle: no client pointer is transferred or activated. The bounded
step summary contains only mode, outcome, `publicationPerformed: false`, pointer
transfer status, and receipt SHA-256; it contains no article content, URL, snapshot,
or provider credential. A SHA-pinned official upload action retains the review bundle
for three days and does not cache it. A source-bound directory refresh is added only
when both bundled clients are byte-identical and their reviewed `sourceCommit` equals
the resolved upstream commit; otherwise the run reports that a reviewed directory
regeneration is required. Neither path publishes content. GitHub Actions availability
and any future merge decision remain external; this packet does not assert a workflow
run that has not occurred.

Validation: `node --test tools/verify-wrn-content-supply-workflow.test.mjs`.
`hash-manifest.json` binds this operations packet's workflow, runner, focused
tests, reviewed V5 ledger, and contract manifest to the recorded source commit.

Windows reliability follow-up, 21 September 2026: nested atomic staging names
were shortened and atomic directory renames now retry only bounded transient
`EPERM`, `EBUSY`, and `ENOTEMPTY` failures. The output contract, fail-closed
validation, pointer-last order, and final directory names are unchanged. The
eight continuous-supply cases pass with the real nested V3/V6 preparation path.
