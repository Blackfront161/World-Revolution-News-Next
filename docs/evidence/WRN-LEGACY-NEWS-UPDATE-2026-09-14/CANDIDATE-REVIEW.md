# Candidate review: C4SS Italian article append

**Status: GREEN for this bounded content-candidate review.** Candidate:
`docs/evidence/WRN-LEGACY-NEWS-UPDATE-2026-09-14/work/candidate-1789338058701/`.
No product file, live endpoint, client activation, or publication was changed.
Article and snapshot bodies are intentionally not reproduced.

## Candidate identity and checks

The candidate contains seven articles: six retained records and one new stable
ID, `wrn-art-c6c6c2fd56d7a3965b4da062d0f73981`, for C4SS `/content/61302`.
The candidate has seven corresponding reader, admission, discover, and
active/archive/shareable lifecycle entries. The new article is marked Italian,
has publication timestamp `2026-09-09T09:24:16Z`, and retains C4SS attribution
with a separate translator attribution in the transformation/teaser metadata.

The local preparation contract records exact API/HTML fidelity: the WordPress
API snapshot has SHA-256
`3ccb55f4d3170aefb95a48906a0a31d2e97848bc7736b68452acd37ae54e6f1d`, the HTML
snapshot has SHA-256
`8536dac362100173b2c613bb418be08fe81d00387441abda4a0cdf6c360de54f`, and the
source/API paragraph comparison is bound to 20 equal normalized paragraphs.
The same preparation check records no article images. The API metadata records
`date_gmt` `2026-09-09T09:24:16`, `featured_media` 0, and matching modified
time; these values are preserved in the candidate metadata.

The source pass identifies the page as a translation of existing C4SS content
at `/content/61296`, names Enrico Sanna as translator, and keeps that
relationship distinct from the original author/byline. The candidate does not
replace the existing English record. Its local rights field is `CC0-1.0` based
on the publisher's stated page-wide public-domain dedication, while retaining
the explicit limitation that this is a publisher declaration, not an
independent legal guarantee.

The candidate carries the stated C4SS footer basis and no image admission. Its
transformation preserves all 20 source paragraphs, reduces HTML/hyperlinks to
plain text, and records that WRN authored only the teaser. Quoted or linked
third-party works remain attributed contextual material and are not assigned a
separate license. No quotation scope is silently converted into relicensing.

## Preservation and publisher binding

Read-only canonical-hash comparison against
`docs/evidence/WRN-NEWS-SIX-ARTICLE-INPUT-2026-09-11/candidate-1789065672080/production-build-input-v3.json`
returned:

- all six prior article records unchanged;
- all six prior reader, admission, and discover records unchanged;
- all four prior image blocks unchanged byte-for-byte at canonical object level;
- retained article set exactly six, with the seventh ID disjoint.

The append binding uses the prior complete-input SHA
`d61e33e15f4dda44e1774bbbae8324588e5b8d1e116309cc0d465425450dd8b9` and the
review binding for the new ID. `results.json` records seven articles, six
retained articles, four retained images, sequence 4, and descriptor SHA-256
`0fc717af52471b711fd8c585adef398032d8acf74ce6de14d4650357cf6c90c8`.
The existing V3 builder result is recorded as successful. Publication remains
false.

## Findings and limits

No blocking finding was found in this bounded review. The evidence supports
the stated translation relationship, 20-paragraph fidelity, separate
translator credit, publisher-declared CC0 scope, no new image import, and
append-only preservation.

This does not independently establish the publisher's legal authority over
translated text or quoted third-party works. It does not approve quotation
republication beyond the recorded contextual treatment, and it does not grant
rights to the generic site/theme image. Final V3 admission, delivery-ledger
binding, client activation, live publication, and PO acceptance remain separate
gates.

## Recommendation

Retain the candidate as a review-bound seventh article append. Keep the C4SS
translation and Enrico Sanna attribution explicit, retain the no-image scope,
and require the existing V3 publisher plus delivery ledger before activation.
