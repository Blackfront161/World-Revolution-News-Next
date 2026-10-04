# Website Atlas deployment: MIME correction and live acceptance

The existing direct human publication requests and explicit Hostinger login reply authorize deploying the separately reviewed Atlas to solinaridao.com. The current authenticated hPanel selected this domain and its domain-only file-manager card. public_html had no Atlas directory; fresh public GETs returned 404 for the wrapper and versioned runtime, while the Website root returned 200. No credentials or other website files are changed.

The original accepted product is 423f196, independent FINAL PASS recorded by e0fb990. Source 6a8edf0b8e2ddd462db2e750f672c3f114801171 / r77-564c7ef0fdc9 / snapshot manifest 958700b090d3af4ac448117d124ddf5e5d90d4a95277d16bc541247e565fd06b remains byte-identical. The original package hash 2815156f2af1bf65766c354736e14f9c1e61c46eb3997e1847eb0d2c1a1969c5 is preserved in the earlier evidence.

## Concrete live finding and correction

The first runtime archive (203 runtime/manifest/policy files) was uploaded privately and extracted into the confirmed public_html destination. All 202 publicly readable files had exact accepted hashes/lengths. The PMTiles map archive was served as text/plain, failing the binary MIME oracle. The remaining 201 files passed all initial size/hash/MIME/header checks. The initial checker also reported the newly created indexless Atlas directory's 403 as premature activation because it expected only 404. That was an incorrect pre-activation expectation: Options -Indexes yields 403 while no index is present. The corrected pre-activation check admits 403 or 404 and still rejects an active 200 page. The initial FAIL receipt remains retained; no MIME oracle is weakened.

The producer now adds only AddType application/octet-stream .pmtiles to each of the two Atlas-scoped Apache policies. Exact payload comparison proves those are the only two changes; the other 212 payload files and all 202 source/runtime bytes remain identical. The replacement 214-file package is work/website-atlas-r77-live-mime-final, manifest SHA-256 81900d8d198ad481d13c28f4f37d263f75f2fd6eca3c3ec53b2ff2527a572f41. Eight focused Node host/package contracts PASS. The normal Website root policy and offline shell are untouched. This narrow MIME correction is submitted for independent delta review through the existing App chat; it is not self-approved.

## Deployment state at this freeze

The runtime transfer has occurred; wrapper activation has not occurred. Upload archives stay outside public_html in wrn-atlas-423f196-private. The correction, actual public MIME/header readback, wrapper activation and live browser acceptance remain in progress. No fresh news, App build, signing, Play action or media approval is implied. The final publication receipt will be appended after completion; this document alone is not live acceptance.
