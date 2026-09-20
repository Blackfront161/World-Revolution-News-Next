# Handoff: independent compact-image and resize closure

## Decision

**GREEN** for the bounded review of compact candidate `4689083e`, correction
`57b40252`, and frozen build `1789074476067`.

`MOBILE-RESIZE-REFLOW-M-001` is **CLOSED**. The real initial-1100 context on
old port `43188` fails the exact assertion; the same no-sleep/no-synthetic-
resize sequence on corrected port `43190` passes through RU/200%, reset, wide
reset and page cleanup. The App delta observes the actual language select and
disconnects that observer. No CSS, shared Home or contract delta is present.

## Independent proof

- exact old E2E: expected RED; exact corrected E2E: 1/1 PASS;
- frozen Mobile and Website: 1 lead, 5 main, 4 admitted images, 3 image main
  cards, 2 image-free main cards, licence focus restored, RU/200% reachable,
  no overflow and zero escaped provider requests;
- Website saved-shell cold offline restart: 4 images, 3 sport notes and 5
  archive links PASS;
- all 36 PNG source/preserved pairs match bytes and hashes; list hash
  `477ff7ae0cebe80fce96765225a2537147e0ca2b2ee80b88ffb46e8fffb62ee4`;
- 62 Mobile and 53 Website build files match; sequence 3, six articles, four
  admitted images and six Website landings match; publication time remains
  `2026-09-10T20:21:14.767Z`; shell is 8,076,147 bytes;
- APK SHA-256 `d2ba24de9cd643600254d762d7b0a8c2e55266b328029a698ff27188cd59f567`;
  68/68 APK assets match byte/hash pins, and preserved `apksigner` evidence
  confirms the APK does not verify as signed;
- five protected V1 media hashes remain exact.

No new finding. Overall release, provider/media activation, signing,
installation and PO acceptance remain open.

## WRN-AGENT-STATUS

- Task: `WRN-HOME-IMAGES-REFLOW-INDEPENDENT-2026-09-11`
- Status: GREEN
- Product/test/index writes: none
- Browser/ports `43188`, `43190`, `43191`: returned
- Slot1 and all scoped rights: returned to Root
- END-CHECK: :)
