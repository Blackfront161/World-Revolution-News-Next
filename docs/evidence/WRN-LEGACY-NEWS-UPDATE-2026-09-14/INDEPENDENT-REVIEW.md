# Independent review: legacy news update CLI

**Status: GREEN for the bounded RC4 update/CLI scope.** Reviewed the current
`tools/legacy-news-ingestion.mjs` and
`tools/legacy-news-ingestion.test.mjs` after the append CLI extension. No
product, client, publication, or live deployment operation was performed.

## Verification

The focused command was executed once with the configured runtime Node:

```text
node --test tools/legacy-news-ingestion.test.mjs
18 tests passed, 0 failed
```

The current test file contains the three append tests and the CLI test, plus
the corrected date and transport coverage. No failed assertion or new blocking
finding was reproduced in the bounded review.

The exact current path hashes from the same read-only check are:

| File | SHA-256 |
|---|---|
| `tools/legacy-news-ingestion.mjs` | `5a43af962d51995be189d37eda80e4563093f577ddfbba6b589cc321f15c6b63` |
| `tools/legacy-news-ingestion.test.mjs` | `0f2109bde9ee273dd7b1c21cf23ad7bd3b499052b94ab3345e6e27545542bfed` |

## CLI delta

`--append` requires exactly the previous V3 input, its canonical SHA-256, the
reviewed batch, bindings, feed, status, pinned commit, and a new output path.
Each local input is read as UTF-8 JSON through a streaming byte cap before it
is parsed. The feed and status are rechecked through the existing snapshot
validator, including commit identity, count/byte equality and freshness. The
append function then revalidates the complete previous-input hash and all
append-only article, reader, admission, discover, lifecycle, sequence, and
revision rules.

The merged input is canonicalized, capped at the feed byte limit, and written
with `flag: 'wx'`, so an existing output cannot be overwritten. The CLI emits
only output path/count/sequence metadata and explicitly reports
`publicationPerformed: false`; it does not invoke publication. The positive
test reads the generated full input through the existing V3 publisher. The
collision, oversized-input, and existing-output cases fail without replacing
the prior output.

## Findings and limits

No concrete bug was found in the reviewed CLI delta. The fixed upstream fetch
still has no caller-controlled network target, and the local append path has no
network or rights sink. A failed process could theoretically leave a partially
written new output because `writeFile` is direct rather than temp-file-plus-
rename; the `wx` flag prevents replacement of an existing file, and this is a
pipeline durability consideration rather than a demonstrated corruption path
in the bounded tests. If crash-safe output becomes a requirement, it should be
addressed in a separately scoped CLI durability change.

The CLI is an intake/update preparation step only. Existing V3 admission,
rights, lifecycle, and publication validators remain mandatory. No client
activation or release authorization follows from this review.

## Evidence boundary

The report intentionally does not reproduce source bodies or local feed
contents. The 18-test package result, including the CLI-to-V3 roundtrip and
negative boundary cases, is the bound for this delta. The earlier Sep-13 intake
review remains a separate historical artifact; this report is the Sep-14 CLI
update review requested by Root.
