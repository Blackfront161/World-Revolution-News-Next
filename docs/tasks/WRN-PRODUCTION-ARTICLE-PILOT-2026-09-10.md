# Two pinned EFF articles: local admission candidate

Parent release-completion task explicitly authorizes existing sources and real
content. Chief owns only the local evidence input and generated preview packet
under docs/evidence/WRN-PRODUCTION-ARTICLE-PILOT-2026-09-10/; no client/default
activation until the Core and Mobile integration gates pass. No remote writes.

Use exactly the two original EFF HTML snapshots, policy snapshot and reviewed
text blocks already bound in WRN-RELEASE-COMPLETION-SOURCE-REVIEW-2026-09-10.
Do not use truncated feed bodies or incomplete feed author fields. Local
authoritative content checkout is unavailable; this is a transferable local
content-repository handoff candidate, not a new content system of record.

Stable article ID is wrn-art- plus the first32 lowercase SHA256 hex characters
of the exact canonical original URL in UTF8. Build input has fixed sequence1
and revision wrn-production-eff-2026-09-10-v1, no wall-clock substitution.
Keep both named authors per article, original English and publication times.
Admit complete article prose, retaining attributed quotations in context;
exclude images, embeds, advertising and entire linked third-party works. EFF
policy licenses original EFF material CC-BY4.0; it does not separately license
quoted third-party material. Document this scope, review and exclusions.
Normalize source h3 section headings to level2; no prose or quotation rewriting.
Transformation is explicit: HTML/hyperlink reduction and heading normalization.
Teasers are newly written descriptive summaries, not claimed original excerpts.

Check original raw snapshot bytes/hashes, normalized whole-text parity and
canonical admitted article/detail hashes. Deterministic builder must validate
before output; two fresh targets must produce identical delivered files.
No source/global content fixture or existing public assets may be overwritten.
Candidate packet is reviewed with WRN source/admission rules and independent
technical Core validation; end-user attribution/changes/original links remain
mandatory in subsequent shared reader integration.
