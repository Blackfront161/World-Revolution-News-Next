# Independent offline provider-policy design review

Delegation: erlaubt. After this separate gate existing Sol
media_durability_completion, now done with A6 implementation, reviews Root's
WRN-MEDIA-PROVIDER-POLICY-DESIGN-2026-09-12.md. It did not author this draft.
Own only docs/evidence/WRN-MEDIA-PROVIDER-POLICY-INDEPENDENT-2026-09-12.md and
matching handoff. No code/test/browser/index/children/provider requests or
configuration change. Independent A6 reviewer remains on43173-75; Root and
Terra reserve later controller implementation. Preserve all other edits.

Assess the proposed optional compiled exact {recipientOrigin,privacyNoticeUrl}
registry against A1 default compatibility, historical proof versus current
permission, A4/A6 API propagation, finite8pair limits, detached provenance and
current-policy removal. Use existing EFF/Archive source evidence only; no legal
conclusion or permission is inferred from an available URL/HEAD/range response.

Return a concise PASS with exact bounded conditions or concrete findings and
recommended correction. Specify whether wire/IDB version can safely remain
unchanged and what must change in each public interface. A6 raw historical
validation must not incorrectly turn a later withdrawn valid policy into stored
corruption; current Ready must never derive permission from those retained rows.
Do not rewrite the entire media architecture or introduce wildcard/CDN guesses.
The provider still stays disabled; implementation requires its own later gate.
