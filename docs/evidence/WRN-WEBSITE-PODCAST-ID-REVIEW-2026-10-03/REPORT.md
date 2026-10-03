# Podcast IDs and Website candidate review

Status: metadata candidates, NOT integrated, NOT admitted, independent review PENDING. No product commit: the Website catalogue remains byte-identical SHA256 ac2c2f944b814be0fce19129791c39d87c0940f8c82caf47bdc868cc5bcb8b15. No App/Data writes, fresh network requests, audio/artwork/transcript/body fetches or publication. Existing importer used unchanged, no second writer pipeline.

## Exact inputs and existing selection

Data5304fa0032a6761071962e4b74b66cb6f114c49f has1865 rows/1806 original URLs; accepted Appe9c8088806f60ad8b9605705f686cc91f2536f90 has1778 rows. Website input podcasts.json is byte-identical to this App input; its1722 entries are original-page identities, not1722 verified audio files. The87 additional Data IDs are absent from the App input; no previous App ID is absent from Data. Five committed Data inputs were projected through prepareWebsiteAppCatalog only into an ignored inspection preview. That preview is NOT an admission or release. Its raw language values are not authoritative; candidate-review.json applies the accepted App source/content restrictions separately.

## Cases

| Case | Count | Result |
| --- | ---: | --- |
| New Data upstream IDs absent from App |87|All IDs listed in addedIds|
| New original-page candidates |84|All remain needs editorial/source-item review|
| Metadata-consistent, per-item Data language verified, prior HEAD200 |74|Structurally consistent only; no editorial admission|
| Unknown per-episode language |5|Retain und; channel language is not substituted|
| Publisher301 redirects |4|Keep original ID; Spotify creator redirect target binding pending|
| Unavailable original404 |1|Jalsa candidate stays needs-review; no deletion|
| Final Straw URL migrations |16|Old Website ID/URL/date retained pending publisher alias evidence|
| LORA identity/date conflicts |2|Old Website ID/URL/date retained; redirect does not create a new episode|
| Other existing field changes |6|Two A-Radio Wien DE→EN proposals and four title changes; keep old values pending metadata review|

84 new pages have79 dated HEAD200 observations, four301 and one404, reused from the existing hash-bound observation file (06:51UTC,14:51Singapore); no claims of fresh reachability. The74 cases exclude five unverified-language pages. HTTP200 and feed health confer no editorial/media/rights admission.

87 upstream IDs do not imply87 new Website identities. Radio Blau f10bd5ae9b24b022ec00cf85 reuses the existing original/app-625a96a8191f726c1ef849f58c5069db896fa04f4d8bb0231a3cf4941e37e829. Working Class History teaser3f8a8d918d918f25d84bfacf reuses existing app-2cb61dff17b39223ff1f8d236023e7e966a2bd6d4af82474b6ef0400b2445029. Radio Blackout cc64b0b9d1dc0ef7543f7fb5 and73eb8c018e0da22fc51a5f06 share one new original/app-91c2099e10dbedb5cf2a459b3bcf835d63affc585b43635c901646f674598e67. This original-page projection is not an audio-segment merge.

The16 Final Straw migration candidates have identical upstream IDs and dates, but individual old-to-new publisher alias proof remains incomplete. LORA Auf Kante genäht has a dated old301→new page with changed date; Sendling Perspektiven old404/new200 lacks a proven alias. Their previous observations remain in the earlier dossiers; no new identity or date overwrite is allowed.

## Existing policy and preservation

Accepted App source policy SHA256 9d092dfcc4b4646dab570a5130ec4a3ec36406b61a5835578275efd644a291aa; content restrictions SHA256 fc2ba6698bb30bb1ba741f1b8f57801b7b806f5489edadc9fa0c6f0dee81d53d. Existing four source holds (Leftover Talk, L'Orage, Contrabanda-Specials, INFOWAR) remain;89 Data rows originate from held sources and61 IDs remain explicitly restricted. None of the102 new-page/migration candidates passes through one of these blockers. This absence is not an intake approval. No withdrawals are inferred from missing pages, temporary errors, newer metadata or the inspection preview.

Do not replace the atomic five-collection Website package with the raw Data projection: radio changes27→28, library metadata collection728→731, two video page IDs would disappear and two appear, while six catalogue events are unchanged. The separate Knowledge runtime already has731 books; catalogue counts must not be confused with that runtime. Existing compressed history is equal. Prior accepted reader/navigation/knowledge packages and release files remain unchanged.

## Verification and next gates

Offline independent-input comparisons verified87 new raw IDs,102 unique projected candidate IDs,18 held URL changes with old identities,24 existing field changes, five exact input Git hashes, held/restricted policy unions, explicit und and all prior observation bindings. No new runtime code means no extra mirrored UI tests. Candidate-review.json lists every upstream/public ID, exact previous/candidate URL/date/title, source hold/restricted status, bounded metadata record, dated original status and remaining review reason.

Next: source/item editorial and publisher redirect/alias review; approve only metadata/original links with stable IDs and dates; use the existing integration contract rather than a partial or mixed-provenance replacement. Then focused contract checks and the single independent rights/release review before any integration/publication. The Hostinger question remains unanswered; no rejected-session retry.

Reproduction helper prepare-review.mjs is an evidence copy of the ignored work helper, not a production importer; execute its work/prepare-podcast-review-20261003.mjs counterpart from the repo root. It reads only pinned Git objects and writes ignored work files.
