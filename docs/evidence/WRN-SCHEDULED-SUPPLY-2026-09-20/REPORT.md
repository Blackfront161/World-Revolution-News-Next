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

The job has public-repository-only guard, read-only `contents` permission,
credential-free checkout, an eight-minute timeout, and one concurrent run. It
does not use an Actions artifact or cache. The runner bundle exists only in the
ephemeral job workspace. After a successful run, the bounded step summary
contains only its outcome, `publicationPerformed: false`, and the receipt
SHA-256; it contains no article content, URL, snapshot, or provider credential.
The public-runner/billing and merge decision remain an external Root decision;
this local workflow has incurred no Actions usage.

Validation: `node --test tools/verify-wrn-content-supply-workflow.test.mjs`.
