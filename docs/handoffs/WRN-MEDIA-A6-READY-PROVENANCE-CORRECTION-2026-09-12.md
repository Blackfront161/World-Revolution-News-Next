# WRN media A6 Ready provenance handoff

Gate `029db50a`; origin correction `908f7b50` remains unchanged. The bounded
candidate is locally complete and requires combined independent A6 review.

`readActive` now freezes only its metadata wrapper and returns the exact deeply
frozen Ready minted by A1 historical activation. The pre-fix real-IDB A/B/A,
close/reopen seam failed exactly at A1 WeakSet membership. The corrected oracle
passes A1 provenance, actual A2 prompt/confirm with one fake-Audio play, zero
audio before confirm, rollback freshness, nested immutability, cloned-Ready
rejection and zero provider requests.

Changed product/test paths are exactly:

- `packages/browser-content/src/production-media-offline-store.ts` (`+1/-1`)
- `tests/e2e/production-media-offline-store.spec.ts` (`+174/-0`)

The optional harness stayed unchanged. Final checks: 15/15 full Chrome/IDB,
mobile and website types, scoped ESLint/Prettier, 2/2 alias tests, boundaries
and diff check, all GREEN. No broad contract run was repeated because contracts
did not change.

Full evidence and every Chrome row/subcase are in
`docs/evidence/WRN-MEDIA-A6-READY-PROVENANCE-CORRECTION-2026-09-12/REPORT.md`.

No independent closure is claimed. Provider, UI, native and release gates stay
open. No commit/index write occurred. Ports 43173–43175, CPU and all A6
product/test/browser rights are returned.
