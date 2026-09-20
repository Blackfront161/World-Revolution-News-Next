# Exact EFF Archive delivery range observation

Root source-only follow-up to0764fa60/5721e628. The user authorized comparing,
repairing and integrating the prior app's media content; this narrow step checks
the already identified delivery endpoint without activating it in a client.

After this separate gate commit Root may make two credential-omitting,
no-referrer, redirect-error HTTPS GET requests for bytes0-4095 to the exact URL:
https://dn721204.ca.archive.org/0/items/htfti-s6e3-isabela-fernandes-vfinal/htfti-s6e3-isabela-fernandes-vfinal.mp3
Origin headers: https://solinaridao.com and https://localhost. Deadline10seconds
each. Require206 and exact Content-Range/Length/MIME before reading; otherwise
cancel without consuming audio body. Count at most4096 bytes, cancel any excess.
Do not write or play the audio bytes; save only status/headers/count/timing in
docs/evidence/WRN-EFF-PODCAST-RANGE-EVIDENCE-2026-09-12 plus its report/helper.
No redirects, alternate URL discovery, provider/CSP/contract changes, cookies,
login, publisher contact, native or publication. This tests byte-range response
and observed CORS headers only, never actual browser decoding or playback.

Root may separately draft an offline provider-policy design against the existing
evidence in docs/evidence/WRN-MEDIA-PROVIDER-POLICY-DESIGN-2026-09-12.md. No
implementation before independently reviewed exact scope. The current A1 origin
boundary remains unchanged; its independent correction proceeds disjointly.
