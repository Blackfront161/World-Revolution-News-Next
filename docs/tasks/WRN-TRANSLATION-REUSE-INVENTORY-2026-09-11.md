# Translation reuse: bounded current-code inventory

Parent: RELEASE-COMPLETION and the explicit G2 decision to reuse existing
backend services while completing the agreed additions. Root owns this
read-only investigation alongside the sole Home writer. Delegation: nicht
erlaubt for this inventory; no extra slot, browser or product rights.

Goal: identify the actual legacy request/response seam and any already known
issue that prevents safely enabling paragraph translation in both production
readers. Do not rebuild the old service or mistake the disabled fixture adapter
for a working production feature.

Source: docs/01-SOURCE-OF-TRUTH.md; authoritative legacy App at2216ff3/runtime
968c320. Read only shared-translation-client.js, config.js, the translation
cache Worker and its imported quota helpers if needed. Reuse G2-002/G2-004
infrastructure evidence, marking its live observations as historical.
The current Home writer's13paths and all products are OUT.

Owned new output: this brief, docs/evidence/WRN-TRANSLATION-REUSE-2026-09-11.md,
docs/handoffs/WRN-TRANSLATION-REUSE-2026-09-11.md and a same-named evidence
directory for a local-only reproduction harness/result. No edits to legacy
files, dependencies, secrets, live config, deployment or provider requests.

Acceptance: exact compiled endpoint/request fields, response assumptions,
original/snapshot retention requirements, storage/fallback/identity behavior,
known server integrity seam and concrete next implementation boundaries.
One local in-memory Worker invocation may reproduce the known cache-key issue
using synthetic text, mocked cache and zero network or paid calls. This is not
a new exhaustive security scan or live exploit. Record code hashes and result;
do not claim today's deployed version matches a local file.

Skill: Cloudflare workers-best-practices, read11September; current official
best-practices and HTTP service-binding docs retrieved. No Cloudflare API/type
signature change is proposed by this inventory. Final handoff follows template,
names remaining service activation evidence, returns rights, END-CHECK: :).
