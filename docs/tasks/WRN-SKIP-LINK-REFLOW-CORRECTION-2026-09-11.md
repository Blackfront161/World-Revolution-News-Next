# Skip link covers the reader at Russian 200% text — direct correction

Parent: approved bug correction/translation browser acceptance. Root owns
exactly apps/mobile/src/styles.css, apps/website/src/styles.css and existing
tests/e2e/production-translation.spec.ts after this separate gate. No delegation,
no design round. Other translation changes remain WIP; publisher paths frozen
for the disjoint Sol diagnosis. No provider, dependencies or external writes.

Observed defect: both skip links hide via fixed top:-5rem. Wrapped Russian
text at200% can exceed that height, so the unfocused link overlays original
article text. Existing translation screenshot website-dark-390-ru200-paragraph
shows the overlap; Axe and horizontal-overflow checks alone miss it.

Add a distinguishing unfocused-link geometry assertion atRU200, reproduceRED
before CSS correction, then hide by the element's complete own height rather
than a fixed distance. Keyboard focus must reveal the whole wrapped link and
retain its main-content target. Existing black themes/buttons are unchanged.
Rerun relevant8browser cases, both builds/scopedchecks and preserve fresh readable
paragraph screenshots plus original failed evidence. Independent UI QA includes
this exact correction. Completion reports must not call the original images
visuallyGREEN. The existing initial manifest remains immutable.
