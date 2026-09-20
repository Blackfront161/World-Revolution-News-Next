# Agent handoff — production media delivery design

- Agent: `production_translation_independent` (Sol/high)
- Task: `WRN-PRODUCTION-MEDIA-DELIVERY-DESIGN-2026-09-11`
- Gate/base: `df4b1061`
- Scope: bounded read-only architecture, security/privacy and delivery review
- Status: **GREEN design; provider activation blocked**
- Children: none
- Browser/network/audio/product/test/index/install activity: none

## Result

The safe minimum is a new `wrn.production-media.*.v1` publisher-stream path,
not a mapping into the old fixture. Metadata travels through the existing
trusted solinaridao JSON transport and a separate active/candidate/previous plus
cumulative-safety store. The exact third-party MP3 URL reaches a newly created
anonymous, `preload=none` audio element only after per-episode consent. It has
no download, service-worker audio cache, full JavaScript buffer, alternative
candidate, generated content or provider discovery.

Mobile and website share only the pure contract/runtime/view. They use separate
profiles, database names, CSP/package gates and acceptance evidence. The first
mobile integration can be implemented and tested with an empty publisher-origin
set; the website follows in a separate scope. A later one-publisher activation
adds exact profile/CSP origins and immutable release documents only after source
evidence passes.

## A-Radio candidate disposition

Saved primary metadata proves publisher episode 2372, the July 2026 episode,
3,600,390 ms, one exact first-party 57,601,043-byte `audio/mpeg` stream and
advertised `/feed/mp3/`. It does not prove complete-episode rights, publisher
consent, a privacy disclosure suitable for WRN, anonymous CORS, byte-range
support, no-cookie behaviour or a stable redirect chain. The general feed has
no current podcast enclosure; the large advertised feed was safely aborted.
Individual music CC credits are not a license for the full programme.

Therefore A-Radio remains metadata/external-link only. Activation requires a
suitable published whole-episode license/streaming or embedding term, or an
explicit publisher grant; privacy review; and a separately authorized capped
header/one-byte range probe of the exact selected URL. Per-episode user consent
authorizes the disclosed request only and does not supply publisher rights.

## Bound implementation sequence

1. Shared new contract/release/store/player/resume/UI files and synthetic tests,
   preserving all five V1 hashes.
2. Mobile profile/route/CSP/E2E with an empty provider-origin set.
3. Website profile/route/package/CSP/E2E as a separate cache/deployment gate.
4. One-publisher content and exact-origin activation only after the evidence
   list in the report is complete.

The matching evidence contains exact paths, schemas, numeric caps, positive and
negative test oracles, storage isolation and release risks. The key runtime
limits are 128 MiB declared stream size, four-hour duration, 15-second metadata
deadline, exact anonymous CORS origin, no query/userinfo/fragment, no remote
offline cache, and resume records capped at 64/4 KiB/64 KiB without URL/title/
publisher/timestamp. Anonymous CORS must pass separately from both the deployed
website origin and the Android Capacitor WebView origin. The media element
cannot expose `redirect:error` or a hard AbortSignal; exact CSP origins, a
bounded admission probe and run invalidation are therefore required together.

## Protected sources

Five V1 pins were recalculated and match the Root boundary finding. No proposed
scope edits them. The authoritative legacy player contributes explicit
play/pause/seek/continue and Media Session behaviour only; its broad candidate
fallback, mutable localStorage record (including URLs/title/time) and weak URL
normalization are not carried forward.

## Rights return

Evidence/handoff writes are complete. All read-only design rights and Slot1 are
returned to Root. No follow-up writer or provider action is implied.

## WRN-AGENT-STATUS

- Status: GREEN for design completeness
- Release: not GREEN
- Open: publisher-side rights basis, privacy notice,
  website-and-Android CORS/range/no-cookie/redirect source evidence;
  independent implementation, client artifacts and provider activation
- Evidence: `docs/evidence/WRN-PRODUCTION-MEDIA-DELIVERY-DESIGN-2026-09-11.md`
- END-CHECK: :)
