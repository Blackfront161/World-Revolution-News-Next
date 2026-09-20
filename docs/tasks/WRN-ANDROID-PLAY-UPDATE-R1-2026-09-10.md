# Android Play Update R1 — five-file correction

PO: finish all release gaps. Parent: ANDROID-PLAY-UPDATE and its independent QA.
Baseline cc79606; independent H001/M002 are open. The exact reviewed design and
seven JVM oracles in WRN-ANDROID-PLAY-UPDATE-QA-2026-09-10.md are binding.

Delegation: erlaubt, one existing Terra/high website_knowledge_support instance
reserved Slot3 by Root. No children. Root remains sole B1 writer/browser;
native scope is disjoint. Other agents have returned all rights. Canonical
register: docs/WRN-G3-021-DELEGATION-REGISTER.md. Root integrates; existing Sol
production_content_design independently closes the two findings after freeze.

After this separate gate commit, the writer owns exactly these source files
under apps/mobile/android/app/src/:
- main/java/com/world/revolution/WRNAppUpdatePolicy.java
- main/java/com/world/revolution/WRNAppUpdateSession.java
- main/java/com/world/revolution/WRNAppUpdateController.java
- test/java/com/world/revolution/WRNAppUpdatePolicyTest.java
- test/java/com/world/revolution/WRNAppUpdateSessionTest.java

Own evidence/handoff: docs/evidence/WRN-ANDROID-PLAY-UPDATE-R1-2026-09-10.md and
docs/handoffs/WRN-ANDROID-PLAY-UPDATE-R1-2026-09-10.md. No index, browser,
Gradle, install, signing, version, resources, manifest or dependency writes.
Writer may inspect cached API source and run pure Java tests only with existing
runtime/cache and fresh output. Root runs offline release compilation and binds
the unsigned APK, source pins and asset hashes after the complete handoff.

Acceptance: all seven reviewed oracles, priority-independent immediate resume,
single stable ActivityResult registry key, counted outstanding results within
one logical generation, cooldown retry after every previous result is consumed,
primitive saved-state restoration and invalid-snapshot fail-closed behavior.
No fabricated Android callback attempt ID. Existing check/dialog/destroy and
ordinary policy assertions retained. Actual device/registry/Play lifecycle stays
an explicit device gate. No visual product change, no screenshot claim.

No source-admission, data, web or B1 behavior change. Reversible local diff only;
retain existing work. Handoff uses template, exact tests/limitations and final
WRN-AGENT-STATUS / END-CHECK: :). First bounded checkpoint after implementation
or a concrete blocker; finish the complete five-file task before returning.
