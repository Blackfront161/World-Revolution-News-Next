# Narrow independent resize/reflow diagnosis

Delegation: erlaubt, Slot1 existing Sol/high after TIME-INDEPENDENT return.
Root observed a repeatable layout failure on frozen compact-image build4689083e,
preview43188. Own only matching diagnosis report/handoff and own helper/evidence;
read-only product, no index/children/provider/native changes. Browser43188 for
owned isolated Chrome contexts only; Root does native build preparation, not browser.

Reproduce exact Root capture-readable-preview.mjs sequence under
WRN-HOME-COMPACT-IMAGES-ROOT-2026-09-11: start1100x1000/reducedMotionreduce,
themeviolet, chooseDE, screenshot, scrollAwards headline/image, screenshot,
resize390x844, chooseRU, rootfont200%. Expected wide-language-layout true.
Actual repeatable failure: innerWidth390,font32px,attributeNULL,mainHeight32,
no pageerrors after5seconds. Saved failure.json at readable-1789073398734;
original image at readable-1789073083034/app-compact-original-image-ru200.png
shows mostly header/nav and no useful main area.

Control: start directly390, chooseRU/font200 -> true,main17492px/displayblock.
Another shorter1100->390 sequence without screenshots also passed. Existing
App.tsx:371 reads rootfont>=24 && innerWidth<=480. App.tsx:1921 MutationObserver
on rootstyle/class and resize/visualViewport events should update the mode;
styles.css:351 already has the correct document-flow fallback when true.
Do not invent a CSS patch before explaining the missing state update.

Find the smallest concrete cause and distinguishing regression. Inspect saved
source/build vs runtime identity and browser trace as needed. No new generic
architecture or full matrix. One bounded diagnostic pass, return exact proposed
paths/correction/test, or honest uncertainty with observations. No timed sleeps
as a fix and no synthetic resize event to hide the failing case.
